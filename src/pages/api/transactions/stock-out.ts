import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from "astro";

export async function GET({ request }: APIContext) {
	const url = new URL(request.url);
	const { limit, offset, sortBy, sortOrder, startDate, endDate, maxPrice, minPrice, warehouseId , statuses } = getUrlParams(request);
	// Get filter parameters
	// const statuses = url.searchParams.getAll("status");
	console.log("=====================================================");
	console.log("stock-out:: GET called");
	console.log("stock-out:: url:", url.searchParams.toString());
	console.log("stock-out:: limit:", limit);
	console.log("stock-out:: offset:", offset);
	console.log("stock-out:: sortBy:", sortBy);
	console.log("stock-out:: sortOrder:", sortOrder);
	console.log("stock-out:: startDate:", startDate);
	console.log("stock-out:: endDate:", endDate);
	console.log("stock-out:: statuses:", statuses);
	console.log("stock-out:: warehouseId:", warehouseId);
	console.log("stock-out:: minPrice:", minPrice);
	console.log("stock-out:: maxPrice:", maxPrice);
	console.log("=====================================================");
	
	
	// COUNT QUERY
	let countQuery = supabase.from("stock_out").select(`
		transactions!inner(
			id
		)
	`, { count: "exact", head: true });

	// Apply filters to count query
	if (statuses && statuses.length > 0) {
		countQuery = countQuery.in("transactions.status", statuses);
	}
	if (startDate) {
		countQuery = countQuery.gte("transactions.transaction_datetime", startDate);
	}
	if (endDate) {
		countQuery = countQuery.lte("transactions.transaction_datetime", endDate);
	}
	if (minPrice && !isNaN(parseFloat(minPrice))) {
		// console.log("stock-out:: minPrice:", minPrice);
		countQuery = countQuery.gte("transactions.total_price", parseFloat(minPrice));
	}
	if (maxPrice && !isNaN(parseFloat(maxPrice))) {
		// console.log("stock-out:: maxPrice:", maxPrice);
		countQuery = countQuery.lte("transactions.total_price", parseFloat(maxPrice));
	}
	if (warehouseId && !isNaN(parseInt(warehouseId))) {
		countQuery = countQuery.eq("warehouse_id", parseInt(warehouseId));
	}

	let { count, error: countError } = await countQuery;

	if (countError) {
		console.log("Count error:", countError.message);
		return jsonResponse({ error: countError.message }, 500);
	}

	// MAIN QUERY
	let query = supabase.from("transactions").select(`
		id, 
		invoice_no, 
		transaction_datetime, 
		total_quantity,
		total_price,
		status,
		stock_out!inner (
			warehouse_id,
			warehouse:warehouse_id (
				name
			)
		)
	`);

	// Apply filters to main query
	if (statuses && statuses.length > 0) {
		query = query.in("status", statuses);
		console.log("stock-out:: statuses if query:", statuses);
	}
	if (startDate) {
		query = query.gte("transaction_datetime", startDate);
	}
	if (endDate) {
		query = query.lte("transaction_datetime", endDate);
	}
	if (minPrice && !isNaN(parseFloat(minPrice))) {
		query = query.gte("total_price", parseFloat(minPrice));
	}
	if (maxPrice && !isNaN(parseFloat(maxPrice))) {
		query = query.lte("total_price", parseFloat(maxPrice));
	}
	if (warehouseId && !isNaN(parseInt(warehouseId))) {
		query = query.eq("stock_out.warehouse_id", parseInt(warehouseId));
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

	// Format datetime for each transaction
	for (const transaction of data) {
		transaction.transaction_datetime = formatDateTime(transaction.transaction_datetime);
	}
	
	// Flatten the data structure
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