import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from 'astro';

export async function GET({ request }: APIContext) {
    const { limit, offset, status, sortBy, sortOrder, startDate, endDate } = getUrlParams(request);

    // Logic for when no direction is specified (e.g., LogsTable)
    let countQuery = supabase.from("transactions").select("*", { count: 'exact', head: true });
    if (status) countQuery = countQuery.eq("status", status);
    if (startDate) countQuery = countQuery.gte("transaction_datetime", startDate);
    if (endDate) countQuery = countQuery.lte("transaction_datetime", endDate);

    const { count, error: countError } = await countQuery;
    if (countError) {
        console.error("Count error:", countError.message);
        return jsonResponse({ error: countError.message }, 500);
    }

    let query = supabase
        .from("transactions")
        .select(`
            id,
            invoice_no,
            total_quantity,
            total_price,
            transaction_datetime,
            status,
            stock_in ( suppliers ( name ) )
        `);

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    if (status) query = query.eq("status", status);
    if (startDate) query = query.gte("transaction_datetime", startDate);
    if (endDate) query = query.lte("transaction_datetime", endDate);
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
        console.error("Database error:", error.message);
        return jsonResponse({ error: error.message }, 500);
    }

    const transformedData = (data ?? []).map((tx) => ({
        id: tx.id,
        invoice_no: tx.invoice_no,
        transaction_datetime: formatDateTime(tx.transaction_datetime),
        supplier_name: tx.stock_in[0]?.suppliers?.name ?? '- - -',
        items_count: tx.total_quantity,
        total_price: tx.total_price,
        status: tx.status,
    }));

    return jsonResponse({ 
        transactions: transformedData, 
        total: count || 0,
        limit,
        offset 
    }, 200);
}