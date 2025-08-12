/**
 * @file This endpoint handles the creation of new transactions.
 * @summary It receives transaction data via a POST request and inserts records into the 'transactions', 'stock_in'/'stock_out', and 'transaction_items' tables.
 *
 * @description
 * ## How it works:
 * 1.  **Request Parsing:** It parses the JSON body of the incoming POST request.
 * 2.  **Validation:** It performs basic validation to ensure all required fields are present.
 * 3.  **Transaction Creation:** It first inserts a new record into the `transactions` table.
 * 4.  **Stock Record:** Based on the `transaction_type` ('stock_in' or 'stock_out'), it creates a corresponding record in either the `stock_in` or `stock_out` table, linking it to the new transaction.
 * 5.  **Item Logging:** It then iterates through the `items` array from the request and inserts each item into the `transaction_items` table, linking them to the transaction via the `invoice_no`.
 * 6.  **Error Handling:** If any of the database operations fail, it attempts to "roll back" the previous inserts manually to prevent orphaned data.
 *
 * ## How to use:
 * Send a POST request to `/api/transactions/insert-new-transaction` with a JSON body like the following:
 *
 * @example
 * {
 *   "transaction_type": "stock_in", // or "stock_out"
 *   "invoice_no": "INV-2025-0001",
 *   "total_quantity": 150,
 *   "total_price": 7500.50,
 *   "status": "Completed",
 *   "created_by": "user@example.com",
 *   "supplier_id": 1, // Required if transaction_type is 'stock_in'
 *   "warehouse_id": null, // Required if transaction_type is 'stock_out'
 *   "items": [
 *     {
 *       "item_id": 101,
 *       "quantity": 100,
 *       "expiration_date": "2026-12-31" // Optional
 *     },
 *     {
 *       "item_id": 102,
 *       "quantity": 50,
 *       "expiration_date": null
 *     }
 *   ]
 * }
 *
 * ## Important Note on Atomicity:
 * The sequence of database operations (inserting into transactions, then stock, then items) is NOT atomic.
 * The Supabase JS client library does not support database transactions directly. For guaranteed data consistency,
 * it is highly recommended to refactor this logic into a single PostgreSQL function (using `CREATE FUNCTION`)
 * and call it via Supabase's `rpc()` method. This ensures that all inserts succeed or fail together.
 * The current implementation includes manual cleanup attempts on failure, but this is not foolproof.
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      transaction_type,
      invoice_no,
      total_quantity,
      total_price,
      status,
      created_by,
      supplier_id,
      warehouse_id,
      items,
    } = await request.json();

    // Validate required fields
    if (!transaction_type || !invoice_no || !total_quantity || !total_price || !status || !created_by || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (transaction_type === 'stock_in' && !supplier_id) {
        return new Response(JSON.stringify({ error: 'supplier_id is required for stock_in transactions' }), { status: 400 });
    }

    if (transaction_type === 'stock_out' && !warehouse_id) {
        return new Response(JSON.stringify({ error: 'warehouse_id is required for stock_out transactions' }), { status: 400 });
    }

	if (transaction_type !== 'stock_in' && transaction_type !== 'stock_out') {
		return new Response(JSON.stringify({ error: 'Invalid transaction_type' }), { status: 400 });
	}
	
    // NOTE: The following operations should ideally be in a single database transaction
    // to ensure data integrity. Since Supabase JS client doesn't directly support
    // transactions, consider moving this logic to a PostgreSQL function (RPC)
    // for atomicity. The current implementation attempts manual cleanup on failure.

    const { count: transactionCount, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error getting transaction count:', countError);
        return new Response(JSON.stringify({ error: 'Failed to get transaction count', details: countError.message }), { status: 500 });
    }

    const transaction_id = (transactionCount ?? 0) + 1;

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        id: transaction_id,
        invoice_no,
        total_quantity,
        total_price,
        status,
        created_by,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      return new Response(JSON.stringify({ error: 'Failed to create transaction', details: transactionError.message }), { status: 500 });
    }

    if (transaction_type === 'stock_in') {
        const { count: stockInCount, error: stockInCountError } = await supabase
            .from('stock_in')
            .select('*', { count: 'exact', head: true });

        if (stockInCountError) {
            console.error('Error getting stock_in count:', stockInCountError);
            await supabase.from('transactions').delete().eq('id', transaction_id); // Attempt to roll back
            return new Response(JSON.stringify({ error: 'Failed to get stock_in count', details: stockInCountError.message }), { status: 500 });
        }
      
        const stock_in_id = (stockInCount ?? 0) + 1;

        const { error: stockInError } = await supabase
            .from('stock_in')
            .insert({ id: stock_in_id, transaction_id, supplier_id });

        if (stockInError) {
            console.error('Error inserting into stock_in:', stockInError);
            await supabase.from('transactions').delete().eq('id', transaction_id); // Attempt to roll back
            return new Response(JSON.stringify({ error: 'Failed to record stock-in details', details: stockInError.message }), { status: 500 });
        }
    } else if (transaction_type === 'stock_out') {
        const { count: stockOutCount, error: stockOutCountError } = await supabase
            .from('stock_out')
            .select('*', { count: 'exact', head: true });

        if (stockOutCountError) {
            console.error('Error getting stock_out count:', stockOutCountError);
            await supabase.from('transactions').delete().eq('id', transaction_id); // Attempt to roll back
            return new Response(JSON.stringify({ error: 'Failed to get stock_out count', details: stockOutCountError.message }), { status: 500 });
        }

        const stock_out_id = (stockOutCount ?? 0) + 1;

        const { error: stockOutError } = await supabase
            .from('stock_out')
            .insert({ id: stock_out_id, transaction_id, warehouse_id });

        if (stockOutError) {
            console.error('Error inserting into stock_out:', stockOutError);
            await supabase.from('transactions').delete().eq('id', transaction_id); // Attempt to roll back
            return new Response(JSON.stringify({ error: 'Failed to record stock-out details', details: stockOutError.message }), { status: 500 });
        }
    } else {
        await supabase.from('transactions').delete().eq('id', transaction_id); // Attempt to roll back
        return new Response(JSON.stringify({ error: 'Invalid transaction_type' }), { status: 400 });
    }

    const { count: itemsCount, error: itemsCountError } = await supabase
        .from('transaction_items')
        .select('*', { count: 'exact', head: true });

    if (itemsCountError) {
        console.error('Error getting transaction_items count:', itemsCountError);
        if (transaction_type === 'stock_in') {
            await supabase.from('stock_in').delete().eq('transaction_id', transaction_id);
        } else if (transaction_type === 'stock_out') {
            await supabase.from('stock_out').delete().eq('transaction_id', transaction_id);
        }
        await supabase.from('transactions').delete().eq('id', transaction_id);
        return new Response(JSON.stringify({ error: 'Failed to get transaction_items count', details: itemsCountError.message }), { status: 500 });
    }

    let currentItemCount = itemsCount ?? 0;
    const transactionItemsToInsert = items.map((item: any) => {
        currentItemCount++;
        return {
            id: currentItemCount,
            invoice_no: invoice_no,
            item_id: item.item_id,
            quantity: item.quantity,
            expiration_date: item.expiration_date,
        };
    });

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItemsToInsert);

    if (itemsError) {
      console.error('Error inserting transaction items:', itemsError);
      // Attempt to roll back all previous inserts for this transaction
      await supabase.from('transaction_items').delete().eq('invoice_no', invoice_no);
      if (transaction_type === 'stock_in') {
          await supabase.from('stock_in').delete().eq('transaction_id', transaction_id);
      } else if (transaction_type === 'stock_out') {
          await supabase.from('stock_out').delete().eq('transaction_id', transaction_id);
      }
      await supabase.from('transactions').delete().eq('id', transaction_id);
      return new Response(JSON.stringify({ error: 'Failed to add items to transaction', details: itemsError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Transaction created successfully', data: transactionData }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Server-side error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: errorMessage }), { status: 500 });
  }
};
