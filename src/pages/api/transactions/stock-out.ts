import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from 'astro';

export async function GET({ request }: APIContext) {
    const { limit, offset, status, sortBy, sortOrder, startDate, endDate } = getUrlParams(request);

    // Base query for counting total items
    let countQuery = supabase
        .from('stock_out')
        .select('*, transactions!inner(*)', { count: 'exact', head: true });

    // Apply filters to count query
    if (status) countQuery = countQuery.eq('transactions.status', status);
    if (startDate) countQuery = countQuery.gte('transactions.transaction_datetime', startDate);
    if (endDate) countQuery = countQuery.lte('transactions.transaction_datetime', endDate);
    
    // Execute count query
    const { count, error: countError } = await countQuery;
    if (countError) {
        console.error("Count error:", countError.message);
        return jsonResponse({ error: countError.message }, 500);
    }

    // Main query to fetch data
    let query = supabase
        .from('stock_out')
        .select(`
            transactions!inner (id, invoice_no, transaction_datetime, total_quantity, total_price, status)
        `);

    // Apply filters to main query
    if (status) query = query.eq('transactions.status', status);
    if (startDate) query = query.gte('transactions.transaction_datetime', startDate);
    if (endDate) query = query.lte('transactions.transaction_datetime', endDate);

    // Apply sorting
    const validSortBy = ['invoice_no', 'transaction_datetime', 'total_price', 'status', 'total_quantity'];
    const sortColumn = validSortBy.includes(sortBy) ? sortBy : 'transaction_datetime';
    query = query.order(sortColumn, { foreignTable: 'transactions', ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
        console.error("Database error:", error.message);
        return jsonResponse({ error: error.message }, 500);
    }

    const transformedData = data.map(item => ({
        id: item.transactions.id,
        invoice_no: item.transactions.invoice_no,
        transaction_datetime: formatDateTime(item.transactions.transaction_datetime),
        items_count: item.transactions.total_quantity,
        total_price: item.transactions.total_price,
        status: item.transactions.status,
    }));

    return jsonResponse({
        transactions: transformedData,
        total: count || 0,
        limit,
        offset
    }, 200);
}