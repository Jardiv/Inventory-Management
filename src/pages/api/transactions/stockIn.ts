import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch 'stock-in' transactions.
 * Supports an optional 'limit' query parameter.
 */
export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const limit = parseLimit(rawLimit);

	// Query stock-in transactions by joining transaction_types (with direction = 'in') and suppliers
	const { data, error } = await supabase
		.from("transactions")
		.select(`
			id,
			invoice_no,
			item:item_id ( name ),
			quantity,
			transaction_datetime,
			transaction_type:transaction_type_id ( name, direction ),
			supplier:supplier_id ( name ),
			status
		`)
		.order("transaction_datetime", { ascending: false })
		.limit(limit);

	// Handle errors
	if (error) {
		return jsonResponse({ error: error.message }, 500);
	}

	// Filter for direction = 'in' and flatten the response
	const stockInData = (data ?? [])
		.filter((tx) => tx.transaction_type?.direction === 'in')
		.map((tx) => ({
			id: tx.id,
			invoice_no: tx.invoice_no,
			item_name: tx.item?.name ?? null,
			// expiration_date: tx.expiration_date,
			quantity: tx.quantity,
			transaction_datetime: tx.transaction_datetime,
			transaction_type: tx.transaction_type?.name ?? null,
			supplier_name: tx.supplier?.name ?? null,
			status: tx.status,
		}));

	return jsonResponse(stockInData, 200);
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
