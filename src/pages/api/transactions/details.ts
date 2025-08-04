import type { APIRoute } from "astro";
import { supabase } from "../../../utils/supabaseClient";

export const GET: APIRoute = async ({ url }) => {
    const transactionId = url.searchParams.get("id");

    if (!transactionId) {
        return new Response(
            JSON.stringify({ error: "Transaction ID is required" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        const { data, error } = await supabase
            .from("transactions")
            .select(
                `
        *,
        items ( * ),
        transaction_types ( * ),
        suppliers ( * )
      `
            )
            .eq("id", transactionId)
            .single();

        if (error) {
            // This also handles the case where no rows are found, as .single() throws an error.
            console.error("Supabase error:", error.message);
            return new Response(
                JSON.stringify({ error: "Transaction not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Transform the data to include all details and match frontend expectations
        const responseData = {
            // Transaction details
            ...data,

            // Aliases for frontend convenience
            item_name: data.items?.name ?? "N/A",
            unit_price: data.items?.unit_price,

            type_name: data.transaction_types?.name ?? "N/A",
            direction: data.transaction_types?.direction,

            supplier_name: data.suppliers?.name,
            supplier_contact: data.suppliers?.contact,
            supplier_location: data.suppliers?.location,

            expiry_date: data.expiration_date,
            remarks: data.destination || "No remarks",
        };

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error fetching transaction details:", err);
        const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                details: errorMessage,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};
