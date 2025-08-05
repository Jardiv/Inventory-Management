import type { APIRoute } from "astro";
import { supabase } from "../../../utils/supabaseClient";

export const GET: APIRoute = async ({ url }) => {
    const transactionId = url.searchParams.get("id");

    if (!transactionId) {
        return new Response(JSON.stringify({ error: "Transaction ID is required" }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        // 1. Fetch the main transaction details
        const { data: transactionData, error: transactionError } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", transactionId)
            .single();

        if (transactionError) {
            console.error("Error fetching transaction:", transactionError.message);
            return new Response(JSON.stringify({ error: "Transaction not found" }), { 
                status: 404, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const { invoice_no } = transactionData;

        // 2. Fetch associated items from transaction_items and item details
        const { data: itemsData, error: itemsError } = await supabase
            .from("transaction_items")
            .select(`
                quantity,
                expiration_date,
                items ( sku, name, unit_price )
            `)
            .eq("invoice_no", invoice_no);

        if (itemsError) {
            console.error("Error fetching transaction items:", itemsError.message);
            return new Response(JSON.stringify({ error: "Failed to fetch transaction items" }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 3. Fetch supplier details from stock_in and suppliers
        const { data: stockInData, error: stockInError } = await supabase
            .from("stock_in")
            .select(`
                suppliers ( name, phone_num, location )
            `)
            .eq("transaction_id", transactionId)
            .single();
        
        if (stockInError && stockInError.code !== 'PGRST116') { // PGRST116: no rows returned
             console.error("Error fetching stock in data:", stockInError.message);
        }

        // 4. Assemble the response
        const responseData = {
            ...transactionData,
            items: itemsData.map(item => ({
                sku: item.items.sku,
                name: item.items.name,
                unit_price: item.items.unit_price,
                quantity: item.quantity,
                expiration_date: item.expiration_date,
            })),
            supplier_name: stockInData?.suppliers?.name ?? null,
            supplier_contact: stockInData?.suppliers?.phone_num ?? null,
            supplier_location: stockInData?.suppliers?.location ?? null,
        };

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Error processing transaction details:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        return new Response(JSON.stringify({ error: "Internal Server Error", details: errorMessage }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
};