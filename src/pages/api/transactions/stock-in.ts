import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse, getUrlParams, formatDateTime } from "./utils.ts";
import type { APIContext } from "astro";

let counter = 0;
export async function GET({ request }: APIContext) {
    counter++;
    const { limit, offset, status, sortBy, sortOrder, startDate, endDate, delivered, completed, received, pending } = getUrlParams(request);

    console.log(`
        Counter: ${counter}
        limit: ${limit}
        offset: ${offset}
        status: ${status}
        sortBy: ${sortBy}
        sortOrder: ${sortOrder}

        filters:
        startDate: ${startDate}
        endDate: ${endDate}
        delivered: ${delivered}
        completed: ${completed}
        received: ${received}
        pending: ${pending}
    `);

    // COUNT QUERY
	let countQuery = supabase.from("stock_in").select("transactions!inner(id)", { count: "exact", head: true });

    if (startDate) {countQuery = countQuery.gte('transactions.transaction_datetime', startDate); console.log("startDate:", startDate);};
    if (endDate) {countQuery = countQuery.lte('transactions.transaction_datetime', endDate); console.log("endDate:", endDate);};

	let {count, error: countError} = await countQuery;

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
            stock_in!inner (
                supplier_id,
                suppliers!inner (name)
            )
        `);

    if (status) query = query.eq("status", status);
    if (startDate) {query = query.gte("transaction_datetime", startDate); console.log("startDate:", startDate);};
    if (endDate) {query = query.lte("transaction_datetime", endDate); console.log("endDate:", endDate);};
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);
    let { data, error: queryError } = await query;

    if (queryError) {
        console.log("Query error:", queryError.message);
        return jsonResponse({ error: queryError.message }, 500);
    }

    if(!data){
        return jsonResponse({ error: "No data found" }, 404);
    }

    for (const transaction of data) {
        transaction.transaction_datetime = formatDateTime(transaction.transaction_datetime);
    }

    const transactions = data.flatMap(tx => {
        return tx.stock_in.map(stock => ({
            id: tx.id,
            invoice_no: tx.invoice_no,
            transaction_datetime: tx.transaction_datetime,
            total_quantity: tx.total_quantity,
            total_price: tx.total_price,
            status: tx.status,
            supplier_name: stock.suppliers?.name || null
        }));
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
