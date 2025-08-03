import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch transactions.
 * - If 'direction' is specified ('in' or 'out'), it groups transactions by invoice and calculates total items.
 * - Otherwise, it fetches individual transaction details.
 * Supports optional query parameters: limit, offset, direction, status, sortBy, sortOrder, startDate, endDate, search
 */
export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const rawOffset = url.searchParams.get("offset");
	const direction = url.searchParams.get("direction");
	const status = url.searchParams.get("status");
	const sortBy = url.searchParams.get("sortBy") || "transaction_datetime";
	const sortOrder = url.searchParams.get("sortOrder") || "desc";
	const startDate = url.searchParams.get("startDate");
	const endDate = url.searchParams.get("endDate");
	const search = url.searchParams.get("search");
	
	const limit = parseLimit(rawLimit);
	const offset = parseOffset(rawOffset);

	if (direction) {
		const { data: typeData, error: typesError } = await supabase
			.from("transaction_types")
			.select("id")
			.eq("direction", direction);

		if (typesError) return jsonResponse({ error: typesError.message }, 500);
		
		const typeIds = typeData?.map(t => t.id) || [];
		if (typeIds.length === 0) return jsonResponse({ transactions: [], total: 0 }, 200);

		let query = supabase
			.from("transactions")
			.select(`
				id,
				invoice_no,
				quantity,
				transaction_datetime,
				status,
				transaction_types:transaction_type_id ( name ),
				suppliers:supplier_id ( name )
			`)
			.in("transaction_type_id", typeIds);

		if (status) query = query.eq("status", status);
		if (startDate) query = query.gte("transaction_datetime", startDate);
		if (endDate) query = query.lte("transaction_datetime", endDate);

		const { data, error } = await query;

		if (error) {
			console.error("Database error:", error);
			return jsonResponse({ error: error.message }, 500);
		}

		const groupedByInvoice = (data ?? []).reduce((acc, tx) => {
			if (!acc[tx.invoice_no]) {
				acc[tx.invoice_no] = {
					id: tx.id,
					invoice_no: tx.invoice_no,
					transaction_datetime: tx.transaction_datetime,
					supplier_name: tx.suppliers?.name ?? null,
					type_name: tx.transaction_types?.name ?? null,
					status: tx.status,
					items_count: 0,
				};
			}
			acc[tx.invoice_no].items_count += tx.quantity;
			return acc;
		}, {});

		let summaryData = Object.values(groupedByInvoice);

		if (search) {
			summaryData = summaryData.filter(tx => 
				tx.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
				(tx.supplier_name && tx.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
				tx.status.toLowerCase().includes(search.toLowerCase())
			);
		}

		summaryData.sort((a, b) => {
			const aVal = a[sortBy];
			const bVal = b[sortBy];
			if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		const total = summaryData.length;
		const paginatedData = summaryData.slice(offset, offset + limit);

		const transformedData = paginatedData.map(tx => ({
			...tx,
			transaction_datetime: formatDateTime(tx.transaction_datetime),
		}));

		return jsonResponse({ 
			transactions: transformedData, 
			total: total,
			limit,
			offset 
		}, 200);

	} else {
		// Logic for when no direction is specified (e.g., LogsTable)
		let countQuery = supabase.from("transactions").select("*", { count: 'exact', head: true });
		if (status) countQuery = countQuery.eq("status", status);
		if (startDate) countQuery = countQuery.gte("transaction_datetime", startDate);
		if (endDate) countQuery = countQuery.lte("transaction_datetime", endDate);
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

		query = query.order(sortBy, { ascending: sortOrder === 'asc' });
		if (status) query = query.eq("status", status);
		if (startDate) query = query.gte("transaction_datetime", startDate);
		if (endDate) query = query.lte("transaction_datetime", endDate);
		if (search) {
			query = query.or(`item_id.ilike.%${search}%,quantity.ilike.%${search}%,supplier_id.ilike.%${search}%,transaction_type_id.ilike.%${search}%,status.ilike.%${search}%`);
		}
		query = query.range(offset, offset + limit - 1);

		const { data, error } = await query;
		if (error) {
			console.error("Database error:", error);
			return jsonResponse({ error: error.message }, 500);
		}

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