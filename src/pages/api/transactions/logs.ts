import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from "astro";

export async function GET({ request }: APIContext) {
	const url = new URL(request.url);
	const { limit, offset, sortBy, sortOrder, startDate, endDate, search } = getUrlParams(request);
	const statuses = url.searchParams.getAll("status");

	// Helper function to get transaction IDs that match supplier/warehouse/item search
	const getTransactionIdsByRelatedSearch = async (searchTerm: string) => {
		const transactionIds = new Set<number>();

		// Search in suppliers
		const { data: supplierTransactions } = await supabase
			.from("transactions")
			.select(`
				id,
				stock_in!inner (
					suppliers!inner (name)
				)
			`)
			.ilike("stock_in.suppliers.name", `%${searchTerm}%`);

		supplierTransactions?.forEach(tx => transactionIds.add(tx.id));

		// Search in warehouses
		const { data: warehouseTransactions } = await supabase
			.from("transactions")
			.select(`
				id,
				stock_out!inner (
					warehouse!inner (name)
				)
			`)
			.ilike("stock_out.warehouse.name", `%${searchTerm}%`);

		warehouseTransactions?.forEach(tx => transactionIds.add(tx.id));

		// Search in items by name
		const { data: itemTransactionsByName } = await supabase
			.from("transaction_items")
			.select(`
				invoice_no,
				items!inner (name)
			`)
			.ilike("items.name", `%${searchTerm}%`);

		if (itemTransactionsByName) {
			// Get transaction IDs from invoice numbers
			const invoiceNumbers = itemTransactionsByName.map(item => item.invoice_no);
			if (invoiceNumbers.length > 0) {
				const { data: transactionsByInvoice } = await supabase
					.from("transactions")
					.select("id")
					.in("invoice_no", invoiceNumbers);
				
				transactionsByInvoice?.forEach(tx => transactionIds.add(tx.id));
			}
		}

		// Search in items by SKU
		const { data: itemTransactionsBySku } = await supabase
			.from("transaction_items")
			.select(`
				invoice_no,
				items!inner (sku)
			`)
			.ilike("items.sku", `%${searchTerm}%`);

		if (itemTransactionsBySku) {
			// Get transaction IDs from invoice numbers
			const invoiceNumbers = itemTransactionsBySku.map(item => item.invoice_no);
			if (invoiceNumbers.length > 0) {
				const { data: transactionsByInvoice } = await supabase
					.from("transactions")
					.select("id")
					.in("invoice_no", invoiceNumbers);
				
				transactionsByInvoice?.forEach(tx => transactionIds.add(tx.id));
			}
		}

		// Search for exact SKU match (in case user inputs exact SKU)
		const { data: exactSkuTransactions } = await supabase
			.from("transaction_items")
			.select(`
				invoice_no,
				items!inner (sku)
			`)
			.eq("items.sku", searchTerm);

		if (exactSkuTransactions) {
			const invoiceNumbers = exactSkuTransactions.map(item => item.invoice_no);
			if (invoiceNumbers.length > 0) {
				const { data: transactionsByInvoice } = await supabase
					.from("transactions")
					.select("id")
					.in("invoice_no", invoiceNumbers);
				
				transactionsByInvoice?.forEach(tx => transactionIds.add(tx.id));
			}
		}

		return Array.from(transactionIds);
	};

	// Helper function to build search conditions
	const buildSearchConditions = (searchTerm: string) => {
		const conditions = [
			`invoice_no.ilike.%${searchTerm}%`,
			`status.ilike.%${searchTerm}%`,
			// For numeric fields, convert search term to number if possible
			...(isNaN(Number(searchTerm)) ? [] : [
				`total_quantity.eq.${Number(searchTerm)}`,
				`total_price.eq.${Number(searchTerm)}`
			])
		];

		// Check if search term could be a date
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (dateRegex.test(searchTerm)) {
			conditions.push(`transaction_datetime.gte.${searchTerm}`);
			conditions.push(`transaction_datetime.lt.${searchTerm}T23:59:59`);
		}

		return conditions.join(',');
	};

	// Get transaction IDs from related searches if search term is provided
	let relatedTransactionIds: number[] = [];
	if (search) {
		console.log("Searching for:", search);
		relatedTransactionIds = await getTransactionIdsByRelatedSearch(search);
		console.log("Found transaction IDs from related search:", relatedTransactionIds);
	}

	// COUNT QUERY - Count all transactions with search
	let countQuery = supabase.from("transactions").select("id", { count: "exact", head: true });

	// Apply filters to count query
	if (statuses && statuses.length > 0) {
		countQuery = countQuery.in("status", statuses);
	}
	if (startDate) {
		countQuery = countQuery.gte("transaction_datetime", startDate);
	}
	if (endDate) {
		countQuery = countQuery.lte("transaction_datetime", endDate);
	}
	if (search) {
		// Combine direct field search with related table searches
		if (relatedTransactionIds.length > 0) {
			countQuery = countQuery.or(`${buildSearchConditions(search)},id.in.(${relatedTransactionIds.join(',')})`);
		} else {
			countQuery = countQuery.or(buildSearchConditions(search));
		}
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
			warehouse_id,
			warehouse (name)
		)
	`);

	// Apply search filter
	if (search) {
		console.log("Search term:", search);
		// Combine direct field search with related table searches
		if (relatedTransactionIds.length > 0) {
			query = query.or(`${buildSearchConditions(search)},id.in.(${relatedTransactionIds.join(',')})`);
		} else {
			query = query.or(buildSearchConditions(search));
		}
	}

	// Apply other filters
	if (statuses && statuses.length > 0) {
		query = query.in("status", statuses);
	}

	if (startDate) {
		query = query.gte("transaction_datetime", startDate);
	}

	if (endDate) {
		query = query.lte("transaction_datetime", endDate);
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

	// Transform the data
	let transactions = data.map((tx) => {
		// Determine transaction type and supplier info
		let transactionType = "";
		let supplierName = null;
		let warehouseName = null;

		// Check if it's a stock_in transaction
		if (tx.stock_in && tx.stock_in.length > 0) {
			transactionType = "Stock In";
			const stockIn = tx.stock_in[0]; // Get first stock_in record
			supplierName = stockIn?.suppliers?.name || null;
		}
		// Check if it's a stock_out transaction
		else if (tx.stock_out && tx.stock_out.length > 0) {
			transactionType = "Stock Out";
			const stockOut = tx.stock_out[0]; // Get first stock_out record
			warehouseName = stockOut?.warehouse?.name || null;
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
			warehouse_name: warehouseName,
		};
	});

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