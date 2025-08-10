import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from "astro";

export async function GET({ request }: APIContext) {
	const { limit, offset, sortBy, sortOrder, startDate, endDate, maxPrice, minPrice, warehouseId, supplierId, statuses, search } = getUrlParams(request);

	const getTransactionIdsByRelatedSearch = async (searchTerm: string) => {
		const transactionIds = new Set<number>();

		const { data: supplierTransactions } = await supabase
			.from("transactions")
			.select(`id, stock_in!inner(suppliers!inner(name))`)
			.ilike("stock_in.suppliers.name", `%${searchTerm}%`);
		supplierTransactions?.forEach(tx => transactionIds.add(tx.id));

		const { data: warehouseTransactions } = await supabase
			.from("transactions")
			.select(`id, stock_out!inner(warehouse!inner(name))`)
			.ilike("stock_out.warehouse.name", `%${searchTerm}%`);
		warehouseTransactions?.forEach(tx => transactionIds.add(tx.id));

		const { data: itemTransactionsByName } = await supabase
			.from("transaction_items")
			.select(`invoice_no, items!inner(name)`)
			.ilike("items.name", `%${searchTerm}%`);
		if (itemTransactionsByName) {
			const invoiceNumbers = itemTransactionsByName.map(item => item.invoice_no);
			if (invoiceNumbers.length > 0) {
				const { data: transactionsByInvoice } = await supabase.from("transactions").select("id").in("invoice_no", invoiceNumbers);
				transactionsByInvoice?.forEach(tx => transactionIds.add(tx.id));
			}
		}

		return Array.from(transactionIds);
	};

	const buildSearchConditions = (searchTerm: string, onTransactions: boolean = true) => {
		const prefix = onTransactions ? "" : "transactions.";
		const conditions = [
			`${prefix}invoice_no.ilike.%${searchTerm}%`,
			`${prefix}status.ilike.%${searchTerm}%`,
			...(isNaN(Number(searchTerm)) ? [] : [
				`${prefix}total_quantity.eq.${Number(searchTerm)}`,
				`${prefix}total_price.eq.${Number(searchTerm)}`
			])
		];
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (dateRegex.test(searchTerm)) {
			conditions.push(`${prefix}transaction_datetime.gte.${searchTerm}`);
			conditions.push(`${prefix}transaction_datetime.lt.${searchTerm}T23:59:59`);
		}
		return conditions.join(',');
	};

	let relatedTransactionIds: number[] = [];
	if (search) {
		relatedTransactionIds = await getTransactionIdsByRelatedSearch(search);
	}

	let countQuery;
	const onTransactions = !warehouseId && !supplierId;
	const prefix = onTransactions ? "" : "transactions.";

	if (warehouseId) {
		countQuery = supabase.from("stock_out").select("transactions!inner(id)", { count: "exact", head: true }).eq("warehouse_id", warehouseId);
	} else if (supplierId) {
		countQuery = supabase.from("stock_in").select("transactions!inner(id)", { count: "exact", head: true }).eq("supplier_id", supplierId);
	} else {
		countQuery = supabase.from("transactions").select("id", { count: "exact", head: true });
	}

	if (statuses && statuses.length > 0) countQuery = countQuery.in(`${prefix}status`, statuses);
	if (startDate) countQuery = countQuery.gte(`${prefix}transaction_datetime`, startDate);
	if (endDate) countQuery = countQuery.lte(`${prefix}transaction_datetime`, endDate);
	if (minPrice) countQuery = countQuery.gte(`${prefix}total_price`, minPrice);
	if (maxPrice) countQuery = countQuery.lte(`${prefix}total_price`, maxPrice);
	if (search) {
		if (relatedTransactionIds.length > 0) {
			countQuery = countQuery.or(`${buildSearchConditions(search, onTransactions)},${prefix}id.in.(${relatedTransactionIds.join(',')})`);
		} else {
			countQuery = countQuery.or(buildSearchConditions(search, onTransactions));
		}
	}

	const { count, error: countError } = await countQuery;

	if (countError) {
		// return jsonResponse({ error: `Count Error: ${countError.message}` }, 500);
	}

	let query;
	let mainSelect = `id, invoice_no, transaction_datetime, total_quantity, total_price, status`;
	if (warehouseId) {
		query = supabase.from("transactions").select(`${mainSelect}, stock_out!inner(warehouse_id, warehouse(name))`).eq("stock_out.warehouse_id", warehouseId);
	} else if (supplierId) {
		query = supabase.from("transactions").select(`${mainSelect}, stock_in!inner(supplier_id, suppliers(name))`).eq("stock_in.supplier_id", supplierId);
	} else {
		query = supabase.from("transactions").select(`${mainSelect}, stock_in(supplier_id, suppliers(name)), stock_out(warehouse_id, warehouse(name))`);
	}

	if (statuses && statuses.length > 0) query = query.in("status", statuses);
	if (startDate) query = query.gte("transaction_datetime", startDate);
	if (endDate) query = query.lte("transaction_datetime", endDate);
	if (minPrice) query = query.gte("total_price", minPrice);
	if (maxPrice) query = query.lte("total_price", maxPrice);
	if (search) {
		if (relatedTransactionIds.length > 0) {
			query = query.or(`${buildSearchConditions(search)},id.in.(${relatedTransactionIds.join(',')})`);
		} else {
			query = query.or(buildSearchConditions(search));
		}
	}

	const validSortBy = ["invoice_no", "transaction_datetime", "total_price", "total_quantity", "status"];
	const sortColumn = validSortBy.includes(sortBy) ? sortBy : "transaction_datetime";
	query = query.order(sortColumn, { ascending: sortOrder === "asc" }).range(offset, offset + limit - 1);

	const { data, error: queryError } = await query;

	if (queryError) {
		// return jsonResponse({ error: `Query Error: ${queryError.message}` }, 500);
	}

	if (!data) {
		return jsonResponse({ transactions: [], total: 0, limit, offset }, 200);
	}

	const transactions = data.map((tx) => ({
		id: tx.id,
		invoice_no: tx.invoice_no,
		transaction_datetime: formatDateTime(tx.transaction_datetime),
		total_quantity: tx.total_quantity,
		total_price: tx.total_price,
		status: tx.status,
		supplier_name: tx.stock_in?.[0]?.suppliers?.name || null,
		warehouse_name: tx.stock_out?.[0]?.warehouse?.name || null,
	}));

	return jsonResponse({ transactions, total: count || 0, limit, offset }, 200);
}