import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch 'stock-out' transactions.
 * Supports an optional 'limit' query parameter.
 */
export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const limit = parseLimit(rawLimit);
    console.log("Limit received stock Out API:", limit);
    
	// Fetch transactions where transaction_type's direction is 'out'
	const { data, error } = await supabase
	.from("transactions")
	.select(
		`
		id,
		invoice_no,
		item:item_id ( name ),
		quantity,
		transaction_datetime,
		transaction_type:transaction_type_id ( name, direction ),
		supplier:supplier_id ( name ),
		status,
		destination,
		source
		`
	)
	.in("transaction_type_id", [2, 3]) // Assuming 2 = Sales, 3 = Return-Out
	.limit(limit)
	.order("transaction_datetime", { ascending: false });


	if (error) {
		return jsonResponse({ error: error.message }, 500);
	}

	// Filter for direction = 'out' and flatten the response
	const stockOutData = (data ?? [])
		.filter((tx) => tx.transaction_type?.direction === "out")
		.map((tx) => ({
			id: tx.id,
			invoice_no: tx.invoice_no,
			item_name: tx.item?.name ?? null,
			quantity: tx.quantity,
			transaction_datetime: tx.transaction_datetime,
			transaction_type: tx.transaction_type?.name ?? null,
			supplier_name: tx.supplier?.name ?? null,
			status: tx.status,
		}));

	return jsonResponse(stockOutData, 200);
}

function parseLimit(rawLimit: string | null, defaultLimit = 10): number {
	const numericLimit = Number(rawLimit);
	return rawLimit !== null && !isNaN(numericLimit) ? numericLimit : defaultLimit;
}

function jsonResponse(data: unknown, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
