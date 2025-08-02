import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch all transactions with complete details.
 * Supports optional query parameters: limit, offset, direction, status, sortBy, sortOrder, startDate, endDate, search
 */
export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const rawOffset = url.searchParams.get("offset");
	const direction = url.searchParams.get("direction"); // 'in' or 'out'
	const status = url.searchParams.get("status");
	const sortBy = url.searchParams.get("sortBy") || "transaction_datetime";
	const sortOrder = url.searchParams.get("sortOrder") || "desc";
	const startDate = url.searchParams.get("startDate");
	const endDate = url.searchParams.get("endDate");
	const search = url.searchParams.get("search");
	
	const limit = parseLimit(rawLimit);
	const offset = parseOffset(rawOffset);

	const sortMap = {
		'invoice_no': 'invoice_no',
		'transaction_datetime': 'transaction_datetime',
		'quantity': 'quantity',
		'status': 'status',
		'type': 'transaction_type_id'
	};

	const dbSortKey = sortMap[sortBy] || 'transaction_datetime';

	// If direction is specified, use the two-step approach for accurate filtering
	if (direction) {
		// First, get transaction type IDs where direction matches
		const { data: typeData, error: typesError } = await supabase
			.from("transaction_types")
			.select("id, name")
			.eq("direction", direction);

		if (typesError) {
			return jsonResponse({ error: typesError.message }, 500);
		}

		const typeIds = typeData?.map(t => t.id) || [];

		if (typeIds.length === 0) {
			return jsonResponse({ transactions: [], total: 0 }, 200);
		}

		// Get total count for pagination
		let countQuery = supabase
			.from("transactions")
			.select("*", { count: 'exact', head: true })
			.in("transaction_type_id", typeIds);

		if (status) {
			countQuery = countQuery.eq("status", status);
		}

		if (startDate) {
			countQuery = countQuery.gte("transaction_datetime", startDate);
		}

		if (endDate) {
			countQuery = countQuery.lte("transaction_datetime", endDate);
		}

		if (search) {
			countQuery = countQuery.or(`item_id.ilike.%${search}%,quantity.ilike.%${search}%,supplier_id.ilike.%${search}%,transaction_type_id.ilike.%${search}%,status.ilike.%${search}%`);
			console.log("Search query:", countQuery);
		}

		const { count, error: countError } = await countQuery;

		if (countError) {
			console.error("Count error:", countError);
			return jsonResponse({ error: countError.message }, 500);
		}

		// Build query with transaction type IDs
		let query = supabase
			.from("transactions")
			.select(`
				id,
				invoice_no,
				quantity,
				transaction_datetime,
				status,
				items:item_id ( name ),
				transaction_types:transaction_type_id ( name, direction ),
				suppliers:supplier_id ( name )
			`)
			.in("transaction_type_id", typeIds)

		if (sortBy === 'status' || sortBy === 'type') {
			query = query.order(dbSortKey, { ascending: sortOrder === 'asc' }).order('transaction_datetime', { ascending: sortOrder === 'asc' });
		} else {
			query = query.order(dbSortKey, { ascending: sortOrder === 'asc' });
		}

		// Apply status filter if provided
		if (status) {
			query = query.eq("status", status);
		}

		if (startDate) {
			query = query.gte("transaction_datetime", startDate);
		}

		if (endDate) {
			query = query.lte("transaction_datetime", endDate);
		}

		if (search) {
			const searchNumber = Number(search);
			const searchFilters = [
				`invoice_no.ilike.%${search}%`,
				`status.ilike.%${search}%`,
				`items.name.ilike.%${search}%`,
				`suppliers.name.ilike.%${search}%`,
				`transaction_types.name.ilike.%${search}%`,
			];

			if (!isNaN(searchNumber)) {
				searchFilters.push(`quantity.eq.${searchNumber}`);
			}

			query = query.or(searchFilters.join(","));
		}

		// const searchFields = [
		// 	"invoice_no",
		// 	"source",
		// 	"destination",
		// 	"status::text",
		// 	"item_id::text",
		// 	"supplier_id::text",
		// 	"transaction_type_id::text"
		// ];
		// query = query.or(
		// 	searchFields.map(f => `${f} ilike '%${search}%'`).join(",")
		// );
		// {"error":"operator does not exist: integer ~~* unknown"}
		// query = query.or(`item_id.ilike.%${search}%,quantity.ilike.%${search}%,supplier_id.ilike.%${search}%,transaction_type_id.ilike.%${search}%,status.ilike.%${search}%`);


		// Apply pagination
		query = query.range(offset, offset + limit - 1);

		const { data, error } = await query;

		if (error) {
			console.error("Database error:", error);
			return jsonResponse({ error: error.message }, 500);
			// {"error":"operator does not exist: integer ~~* unknown"} - always return 500 when searching
		}
		

		// Transform the data
		const transformedData = (data ?? []).map((tx) => ({
			id: tx.id,
			invoice_no: tx.invoice_no,
			item_name: tx.items?.name ?? null,
			quantity: tx.quantity,
			transaction_datetime: formatDateTime(tx.transaction_datetime),
			type_name: tx.transaction_types?.name ?? null,
			transaction_direction: tx.transaction_types?.direction ?? null,
			supplier_name: tx.suppliers?.name ?? null,
			status: tx.status,
		}));

		return jsonResponse({ 
			transactions: transformedData, 
			total: count || 0,
			limit,
			offset 
		}, 200);
	}

	// If no direction filter, use the original approach with pagination
	// Get total count first
	let countQuery = supabase
		.from("transactions")
		.select("*", { count: 'exact', head: true });

	if (status) {
		countQuery = countQuery.eq("status", status);
	}

	if (startDate) {
		countQuery = countQuery.gte("transaction_datetime", startDate);
	}

	if (endDate) {
		countQuery = countQuery.lte("transaction_datetime", endDate);
	}

	if (search) {
		
		countQuery = countQuery.or(`item_id.ilike.%${search}%,quantity.ilike.%${search}%,supplier_id.ilike.%${search}%,transaction_type_id.ilike.%${search}%,status.ilike.%${search}%`);
	}

	const { count, error: countError } = await countQuery;

	if (countError) {
		console.error("Count error:", countError);
		return jsonResponse({ error: countError.message }, 500);
	}

	let query = supabase
		.from("transactions")
		.select(`
			id,
			invoice_no,
			quantity,
			transaction_datetime,
			status,
			items:item_id ( name ),
			transaction_types:transaction_type_id ( name, direction ),
			suppliers:supplier_id ( name )
		`);

	if (sortBy === 'status' || sortBy === 'type') {
		query = query.order(dbSortKey, { ascending: sortOrder === 'asc' }).order('transaction_datetime', { ascending: sortOrder === 'asc' });
	} else {
		query = query.order(dbSortKey, { ascending: sortOrder === 'asc' });
	}

	// Apply status filter if provided
	if (status) {
		query = query.eq("status", status);
	}

	if (startDate) {
		query = query.gte("transaction_datetime", startDate);
	}

	if (endDate) {
		query = query.lte("transaction_datetime", endDate);
	}

	if (search) {
		query = query.or(`item_id.ilike.%${search}%,quantity.ilike.%${search}%,supplier_id.ilike.%${search}%,transaction_type_id.ilike.%${search}%,status.ilike.%${search}%`);
	}

	// Apply pagination
	query = query.range(offset, offset + limit - 1);

	const { data, error } = await query;

	// Handle errors
	if (error) {
		console.error("Database error:", error);
		return jsonResponse({ error: error.message }, 500);
	}

	// Transform the data to match the required format
	const transformedData = (data ?? []).map((tx) => ({
		id: tx.id,
		invoice_no: tx.invoice_no,
		item_name: tx.items?.name ?? null,
		quantity: tx.quantity,
		transaction_datetime: formatDateTime(tx.transaction_datetime),
		type_name: tx.transaction_types?.name ?? null,
		transaction_direction: tx.transaction_types?.direction ?? null,
		supplier_name: tx.suppliers?.name ?? null,
		status: tx.status,
	}));

	return jsonResponse({ 
		transactions: transformedData, 
		total: count || 0,
		limit,
		offset 
	}, 200);
}

/**
 * Alternative endpoint specifically for stock-in transactions
 */
export async function getStockIn({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const rawOffset = url.searchParams.get("offset");
	const limit = parseLimit(rawLimit);
	const offset = parseOffset(rawOffset);

	// First, get transaction type IDs where direction = 'in'
	const { data: inTypes, error: typesError } = await supabase
		.from("transaction_types")
		.select("id")
		.eq("direction", "in");

	if (typesError) {
		return jsonResponse({ error: typesError.message }, 500);
	}

	const inTypeIds = inTypes?.map(t => t.id) || [];

	if (inTypeIds.length === 0) {
		return jsonResponse({ transactions: [], total: 0 }, 200);
	}

	// Get total count
	const { count, error: countError } = await supabase
		.from("transactions")
		.select("*", { count: 'exact', head: true })
		.in("transaction_type_id", inTypeIds);

	if (countError) {
		return jsonResponse({ error: countError.message }, 500);
	}

	// Query transactions with those type IDs
	const { data, error } = await supabase
		.from("transactions")
		.select(`
			id,
			invoice_no,
			quantity,
			transaction_datetime,
			status,
			item:item_id ( name ),
			transaction_type:transaction_type_id ( name, direction ),
			supplier:supplier_id ( name )
		`)
		.in("transaction_type_id", inTypeIds)
		.order("transaction_datetime", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return jsonResponse({ error: error.message }, 500);
	}

	const stockInData = (data ?? []).map((tx) => ({
		id: tx.id,
		invoice_no: tx.invoice_no,
		item_name: tx.item?.name ?? null,
		quantity: tx.quantity,
		transaction_datetime: formatDateTime(tx.transaction_datetime),
		type_name: tx.transaction_type?.name ?? null,
		transaction_direction: tx.transaction_type?.direction ?? null,
		supplier_name: tx.supplier?.name ?? null,
		status: tx.status,
	}));

	return jsonResponse({ 
		transactions: stockInData, 
		total: count || 0,
		limit,
		offset 
	}, 200);
}

/**
 * Alternative endpoint specifically for stock-out transactions
 */
export async function getStockOut({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const rawOffset = url.searchParams.get("offset");
	const limit = parseLimit(rawLimit);
	const offset = parseOffset(rawOffset);

	// First, get transaction type IDs where direction = 'out'
	const { data: outTypes, error: typesError } = await supabase
		.from("transaction_types")
		.select("id")
		.eq("direction", "out");

	if (typesError) {
		return jsonResponse({ error: typesError.message }, 500);
	}

	const outTypeIds = outTypes?.map(t => t.id) || [];

	if (outTypeIds.length === 0) {
		return jsonResponse({ transactions: [], total: 0 }, 200);
	}

	// Get total count
	const { count, error: countError } = await supabase
		.from("transactions")
		.select("*", { count: 'exact', head: true })
		.in("transaction_type_id", outTypeIds);

	if (countError) {
		return jsonResponse({ error: countError.message }, 500);
	}

	// Query transactions with those type IDs
	const { data, error } = await supabase
		.from("transactions")
		.select(`
			id,
			invoice_no,
			quantity,
			transaction_datetime,
			status,
			item:item_id ( name ),
			transaction_type:transaction_type_id ( name, direction ),
			supplier:supplier_id ( name )
		`)
		.in("transaction_type_id", outTypeIds)
		.order("transaction_datetime", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return jsonResponse({ error: error.message }, 500);
	}

	const stockOutData = (data ?? []).map((tx) => ({
		id: tx.id,
		invoice_no: tx.invoice_no,
		item_name: tx.item?.name ?? null,
		quantity: tx.quantity,
		transaction_datetime: formatDateTime(tx.transaction_datetime),
		type_name: tx.transaction_type?.name ?? null,
		transaction_direction: tx.transaction_type?.direction ?? null,
		supplier_name: tx.supplier?.name ?? null,
		status: tx.status,
	}));

	return jsonResponse({ 
		transactions: stockOutData, 
		total: count || 0,
		limit,
		offset 
	}, 200);
}

// Utility functions
function formatDateTime(dateTimeString: string): string {
	if (!dateTimeString) return '';
	
	const date = new Date(dateTimeString);
	
	// Format date as MM/DD/YYYY
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const year = date.getFullYear();
	
	// Format time as HH:MM (24-hour format)
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	
	return `${month}/${day}/${year} ${hours}:${minutes}`;
}

function parseLimit(rawLimit: string | null, defaultLimit = 10, maxLimit = 100): number {
	const numericLimit = Number(rawLimit);
	if (rawLimit !== null && !isNaN(numericLimit)) {
		return Math.min(numericLimit, maxLimit); // Cap at maxLimit
	}
	return defaultLimit;
}

function parseOffset(rawOffset: string | null): number {
	const numericOffset = Number(rawOffset);
	if (rawOffset !== null && !isNaN(numericOffset) && numericOffset >= 0) {
		return numericOffset;
	}
	return 0;
}

function jsonResponse(data: unknown, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*", // Add CORS if needed
		},
	});
}