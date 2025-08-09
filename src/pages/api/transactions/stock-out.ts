import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from "astro";

export async function GET({ request }: APIContext) {
	const url = new URL(request.url);
	const { limit, offset, sortBy, sortOrder, startDate, endDate } = getUrlParams(request);
	const statuses = url.searchParams.getAll("status");

	// COUNT QUERY
	let countQuery = supabase.from("stock_out").select("transactions!inner(id)", { count: "exact", head: true });

	if (statuses && statuses.length > 0) {
		countQuery = countQuery.in("transactions.status", statuses);
	}
	if (startDate) {
		countQuery = countQuery.gte("transactions.transaction_datetime", startDate);
	}
	if (endDate) {
		countQuery = countQuery.lte("transactions.transaction_datetime", endDate);
	}

	let { count, error: countError } = await countQuery;

	if (countError) {
		console.log("Count error:", countError.message);
		return jsonResponse({ error: countError.message }, 500);
	}

	let query = supabase.from("transactions").select(`
    id, 
    invoice_no, 
    transaction_datetime, 
    total_quantity,
    total_price,
    status,
    stock_out!inner (
      warehouse:warehouse_id (
        name
      )
    )
  `);

	if (statuses && statuses.length > 0) {
		query = query.in("status", statuses);
	}
	if (startDate) {
		query = query.gte("transaction_datetime", startDate);
	}
	if (endDate) {
		query = query.lte("transaction_datetime", endDate);
	}
	query = query.order(sortBy, { ascending: sortOrder === "asc" });
	query = query.range(offset, offset + limit - 1);
	let { data, error: queryError } = await query;

	if (queryError) {
		console.log("Query error:", queryError.message);
		return jsonResponse({ error: queryError.message }, 500);
	}

	if (!data) {
		return jsonResponse({ error: "No data found" }, 404);
	}

	for (const transaction of data) {
		transaction.transaction_datetime = formatDateTime(transaction.transaction_datetime);
	}
    const flattened = data.map(t => ({
        id: t.id,
        invoice_no: t.invoice_no,
        transaction_datetime: t.transaction_datetime,
        total_quantity: t.total_quantity,
        total_price: t.total_price,
        status: t.status,
        warehouse_name: t.stock_out?.[0]?.warehouse?.name
    }));

	return jsonResponse(
		{
			transactions: flattened || [],
			total: count || 0,
			limit: limit,
			offset: offset,
		},
		200
	);
}
