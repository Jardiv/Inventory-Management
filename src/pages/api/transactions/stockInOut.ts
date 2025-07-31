import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch 'stock-in' transactions with supplier name.
 * Supports an optional 'limit' query parameter.
 */
export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const limit = parseLimit(rawLimit);

	// Fetch stock-in transactions with joined supplier name
	const { data, error } = await supabase
		.from("transactions")
		.select(`
        *,
        suppliers:supplier_id (
            name
        )
        `
		)
		.eq("type", "stock-in")
		.order("transaction_datetime", { ascending: false })
		.limit(limit);

	// Handle Supabase error
	if (error) {
		return jsonResponse({ error: error.message }, 500);
	}

	// Transform data: flatten supplier name and remove nested supplier object
	const formattedData = data.map((transaction) => ({
		...transaction,
		supplier_name: transaction.suppliers?.name ?? null,
		suppliers: undefined, // remove nested object to clean response
	}));

	return jsonResponse(formattedData, 200);
}

/**
 * Parses the 'limit' query string value into a number.
 * Returns a fallback default value if parsing fails.
 */
function parseLimit(rawLimit: string | null, defaultLimit = 10): number {
	const numericLimit = Number(rawLimit);
	return rawLimit !== null && !isNaN(numericLimit) ? numericLimit : defaultLimit;
}

/**
 * Returns a standard JSON response with status and content-type headers.
 */
function jsonResponse(data: unknown, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
