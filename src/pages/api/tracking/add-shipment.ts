// src/pages/api/tracking/add-shipment.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    let shipmentId: number | null = null;
    let transactionId: number | null = null;
    let stockOutId: number | null = null;
    let invoiceNo: string | null = null;

    try {
        const body = await request.json();
        const { item_id, quantity, note, created_by, warehouse_id } = body;

        // Validate required fields
        if (!item_id || !quantity || !created_by || !warehouse_id) {
            return new Response(
                JSON.stringify({ error: "Item ID, quantity, created_by, and warehouse_id are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        if (parseInt(quantity) <= 0) {
            return new Response(
                JSON.stringify({ error: "Quantity must be greater than 0" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if item exists and get its price
        const { data: itemData, error: itemError } = await supabase
            .from("items")
            .select("id, unit_price")
            .eq("id", item_id)
            .single();

        if (itemError || !itemData) {
            return new Response(JSON.stringify({ error: "Item not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 1. Insert new shipment
        const { data: shipmentData, error: shipmentError } = await supabase
            .from("shipments")
            .insert([
                {
                    item_id: parseInt(item_id),
                    quantity: parseInt(quantity),
                    status: "Pending",
                    date: new Date().toISOString(),
                    note: note || null,
                },
            ])
            .select()
            .single();

        if (shipmentError || !shipmentData) {
            console.error("Database error (shipments):", shipmentError);
            throw new Error("Failed to add shipment to database");
        }
        shipmentId = shipmentData.id;

        // 2. Create stock-out transaction
        console.log('Creating stock-out transaction for new shipment...');

        const total_quantity = parseInt(quantity);
        const total_price = total_quantity * itemData.unit_price;

        // Generate unique invoice number
        const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '').substring(0, 14);
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        invoiceNo = `SO-${timestamp}-${randomSuffix}`;

        // Manually get next transaction ID
        const { count: transactionCount, error: countError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            throw new Error(`Failed to get transaction count: ${countError.message}`);
        }
        const next_transaction_id = (transactionCount ?? 0) + 1;

        // a. Create transaction record
        const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .insert({
                id: next_transaction_id,
                invoice_no: invoiceNo,
                total_quantity: total_quantity,
                total_price: total_price,
                status: 'Pending',
                created_by: created_by,
            })
            .select()
            .single();

        if (transactionError || !transactionData) {
            throw new Error(`Failed to create transaction: ${transactionError?.message || 'Unknown error'}`);
        }
        transactionId = transactionData.id;

        // b. Create stock_out record
        const { count: stockOutCount, error: stockOutCountError } = await supabase
            .from('stock_out')
            .select('*', { count: 'exact', head: true });

        if (stockOutCountError) {
            throw new Error(`Failed to get stock_out count: ${stockOutCountError.message}`);
        }
        const next_stock_out_id = (stockOutCount ?? 0) + 1;

        const { error: stockOutError } = await supabase
            .from('stock_out')
            .insert({ id: next_stock_out_id, transaction_id: transactionId, warehouse_id: parseInt(warehouse_id) });

        if (stockOutError) {
            throw new Error(`Failed to create stock_out record: ${stockOutError.message}`);
        }
        stockOutId = next_stock_out_id;

        // c. Create transaction_items record
        const { count: itemsCount, error: itemsCountError } = await supabase
            .from('transaction_items')
            .select('*', { count: 'exact', head: true });

        if (itemsCountError) {
            throw new Error(`Failed to get transaction_items count: ${itemsCountError.message}`);
        }
        const next_item_id = (itemsCount ?? 0) + 1;

        const { error: transactionItemsError } = await supabase
            .from('transaction_items')
            .insert({
                id: next_item_id,
                invoice_no: invoiceNo,
                item_id: parseInt(item_id),
                quantity: total_quantity,
            });

        if (transactionItemsError) {
            throw new Error(`Failed to create transaction items: ${transactionItemsError.message}`);
        }

        console.log('✅ Stock-out transaction created successfully.');

        return new Response(
            JSON.stringify({
                success: true,
                message: "Shipment and stock-out transaction added successfully",
                data: {
                    shipment: shipmentData,
                    transaction: transactionData
                },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Server error:", err);

        // Rollback logic
        if (invoiceNo) { // transaction_items linked by invoice_no
            await supabase.from('transaction_items').delete().eq('invoice_no', invoiceNo);
        }
        if (stockOutId) {
            await supabase.from('stock_out').delete().eq('id', stockOutId);
        }
        if (transactionId) {
            await supabase.from('transactions').delete().eq('id', transactionId);
        }
        if (shipmentId) {
            await supabase.from("shipments").delete().eq("id", shipmentId);
        }

        return new Response(
            JSON.stringify({ error: "Internal server error", details: err instanceof Error ? err.message : 'An unknown error occurred' }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};

export const GET: APIRoute = async () => {
    try {
        const { data, error } = await supabase
            .from("items")
            .select("id, name, sku, category_id, category(name)")
            .order("name", { ascending: true });

        if (error) {
            console.error("Database error:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Format the data
        const formatted = data.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            category: item.category?.name || "Unknown Category",
        }));

        return new Response(JSON.stringify(formatted), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Server error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
