import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from "astro";

export async function GET({ request }: APIContext) {
	const url = new URL(request.url);
	const { limit, offset, sortBy, sortOrder, startDate, endDate, search } = getUrlParams(request);
	const statuses = url.searchParams.getAll("status");

	// console.log(`
	//     limit: ${limit}
	//     offset: ${offset}
	//     sortBy: ${sortBy}
	//     sortOrder: ${sortOrder}

	//     :: FILTERS ::
	//     startDate: ${startDate}
	//     endDate: ${endDate}
	//     statuses: ${statuses}
	// `);

	//  TODO: SEARCH FILTERS
	if (search) {
		const searchFields = ["transactions.invoice_no", "transactions.status", "items.name", "items.sku", "suppliers.name"];

		// Supabase uses `*` as wildcard in filter expressions
		const searchFilter = searchFields.map((field) => `${field}.ilike.*${search}*`).join(",");

		let transactions_search = supabase
			.from("transactions")
			.select(
				`invoice_no, 
				transaction_datetime, 
				total_quantity, 
				total_price, 
				status, 
				suppliers (name),
				warehouses (name),
				items (name, sku),
				created_by`
			)
			.or(searchFilter)
			.order(sortBy, { ascending: sortOrder === "asc" });

		let { data, error: queryError } = await transactions_search;

		if (queryError) {
			console.log("Query error:", queryError.message);
			return jsonResponse({ error: queryError.message }, 500);
		}

		if (data && data.length > 0) {
			return jsonResponse({ data, count: data.length }, 200);
		} else {
			return jsonResponse({ error: "No data found" }, 404);
		}
	}

	// COUNT QUERY - Count all transactions
	let countQuery = supabase.from("transactions").select("id", { count: "exact", head: true });

	if (statuses && statuses.length > 0) {
		countQuery = countQuery.in("status", statuses);
	}
	if (startDate) {
		countQuery = countQuery.gte("transaction_datetime", startDate);
		// console.log("startDate:", startDate);
	}
	if (endDate) {
		countQuery = countQuery.lte("transaction_datetime", endDate);
		// console.log("endDate:", endDate);
	}

	let { count, error: countError } = await countQuery;

	if (countError) {
		console.log("Count error:", countError.message);
		return jsonResponse({ error: countError.message }, 500);
	}

	// MAIN QUERY - Get all transactions with optional stock_in/stock_out data
	let query = supabase.from("transactions").select(` 
            id,  
            invoice_no,  
            transaction_datetime,  
            total_quantity,  
            total_price,  
            status, 
            stock_in ( 
                supplier_id, 
                suppliers (name) 
            ),
            stock_out (
                id
            )
        `);

	if (statuses && statuses.length > 0) {
		query = query.in("status", statuses);
	}

	if (startDate) {
		query = query.gte("transaction_datetime", startDate);
		// console.log("startDate:", startDate);
	}

	if (endDate) {
		query = query.lte("transaction_datetime", endDate);
		// console.log("endDate:", endDate);
	}

	// Apply sorting
	const validSortBy = ["invoice_no", "transaction_datetime", "total_price", "total_quantity"];
	const sortColumn = validSortBy.includes(sortBy) ? sortBy : "transaction_datetime";
	query = query.order(sortColumn, { ascending: sortOrder === "asc" });
	query = query.range(offset, offset + limit - 1);

	let { data, error: queryError } = await query;

	if (queryError) {
		console.log("Query error:", queryError.message);
		return jsonResponse({ error: queryError.message }, 500);
	}

	if (!data) {
		return jsonResponse({ error: "No data found" }, 404);
	}

	// Debug: Log the structure of the first item to see the data structure
	// if (data.length > 0) {
	// 	console.log("First transaction structure:", JSON.stringify(data[0], null, 2));
	// }

	const transactions = data.map((tx) => {
		// Determine transaction type and supplier info
		let transactionType = "";
		let supplierName = null;

		// Check if it's a stock_in transaction
		if (tx.stock_in && tx.stock_in.length > 0) {
			transactionType = "Stock In";
			const stockIn = tx.stock_in[0]; // Get first stock_in record
			supplierName = stockIn?.suppliers?.name || null;
		}

		// Check if it's a stock_out transaction
		else if (tx.stock_out && tx.stock_out.length > 0) {
			transactionType = "Stock Out";
			supplierName = null; // Stock out doesn't have suppliers
		} else {
			transactionType = "Unknown";
		}

		return {
			id: tx.id,
			invoice_no: tx.invoice_no,
			transaction_datetime: formatDateTime(tx.transaction_datetime),
			total_quantity: tx.total_quantity,
			total_price: tx.total_price,
			status: tx.status,
			supplier_name: supplierName,
		};
	});

	// console.log(`
	//     ::Response::
	//     transactions: ${JSON.stringify(transactions)}
	//     total: ${count}
	//     limit: ${limit}
	//     offset: ${offset}
	// `);

	return jsonResponse(
		{
			transactions: transactions || [],
			total: count || 0,
			limit: limit,
			offset: offset,
		},
		200
	);
}
