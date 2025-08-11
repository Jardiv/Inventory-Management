import type { APIRoute } from "astro";
import { supabase } from "../../../utils/supabaseClient";

interface PurchaseOrder {
    invoice_no: string;
    created_by: string;
    total_quantity: number;
    total_price: number;
    status:
        | "N/A"
        | "Pending"
        | "Delivered"
        | "Completed"
        | "Cancelled"
        | "In transit";
}

interface Transaction {
    invoice_no: string;
    total_quantity: number;
    total_price: number;
    status: "N/A" | "Pending" | "Delivered" | "Completed" | "Cancelled";
    created_by: string;
}

interface Shipment {
    item_id: number;
    quantity: number;
    date: Date;
    status: "Pending" | "Delivered" | "Cancelled";
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { type, data } = body;

        switch (type) {
            case "purchase_order":
                const { data: poData, error: poError } = await supabase
                    .from("purchase_orders")
                    .insert(data as PurchaseOrder)
                    .select();

                if (poError) throw poError;
                return new Response(
                    JSON.stringify({ success: true, data: poData }),
                    {
                        status: 201,
                    }
                );

            case "transaction":
                const { data: transData, error: transError } = await supabase
                    .from("transactions")
                    .insert(data as Transaction)
                    .select();

                if (transError) throw transError;
                return new Response(
                    JSON.stringify({ success: true, data: transData }),
                    {
                        status: 201,
                    }
                );

            case "shipment":
                const { data: shipData, error: shipError } = await supabase
                    .from("shipments")
                    .insert(data as Shipment)
                    .select();

                if (shipError) throw shipError;
                return new Response(
                    JSON.stringify({ success: true, data: shipData }),
                    {
                        status: 201,
                    }
                );

            default:
                return new Response(
                    JSON.stringify({ error: "Invalid type specified" }),
                    { status: 400 }
                );
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
};

export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { type, id, data } = body;

        switch (type) {
            case "purchase_order":
                const { data: poData, error: poError } = await supabase
                    .from("purchase_orders")
                    .update(data)
                    .eq("id", id)
                    .select();

                if (poError) throw poError;
                return new Response(
                    JSON.stringify({ success: true, data: poData })
                );

            case "transaction":
                const { data: transData, error: transError } = await supabase
                    .from("transactions")
                    .update(data)
                    .eq("id", id)
                    .select();

                if (transError) throw transError;
                return new Response(
                    JSON.stringify({ success: true, data: transData })
                );

            case "shipment":
                const { data: shipData, error: shipError } = await supabase
                    .from("shipments")
                    .update(data)
                    .eq("id", id)
                    .select();

                if (shipError) throw shipError;
                return new Response(
                    JSON.stringify({ success: true, data: shipData })
                );

            default:
                return new Response(
                    JSON.stringify({ error: "Invalid type specified" }),
                    { status: 400 }
                );
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
};
