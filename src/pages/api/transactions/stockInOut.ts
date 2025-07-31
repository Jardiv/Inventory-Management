import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch all transactions with flattened related data.
 * Supports an optional 'limit' query parameter.
 */
export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const limit = parseLimit(rawLimit);

	// Fetch transactions with related data
	const { data, error } = await supabase
		.from("transactions")
		.select(`
			id,
			invoice_no,
			transaction_datetime,
			status,
			transaction_types:transaction_type_id (name),
			suppliers:supplier_id (name)
		`)
		.order("transaction_datetime", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("Supabase error:", error.message);
		return jsonResponse({ error: error.message }, 500);
	}

	// Format response for frontend table
	const formatted = (data ?? []).map(tx => ({
		id: tx.id,
		invoice_no: tx.invoice_no,
		transaction_datetime: tx.transaction_datetime,
		transaction_type: tx.transaction_types?.name ?? "Unknown",
		supplier_name: tx.suppliers?.name ?? "N/A",
		status: tx.status ?? "Pending"
	}));

	return jsonResponse(formatted, 200);
}

function parseLimit(rawLimit: string | null, defaultLimit = 20): number {
	const num = Number(rawLimit);
	return rawLimit !== null && !isNaN(num) ? num : defaultLimit;
}

function jsonResponse(data: unknown, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
