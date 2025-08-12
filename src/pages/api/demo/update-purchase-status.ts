import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  const { invoice_no, status } = await request.json();
  const url = new URL(request.url);

  if (!invoice_no || !status) {
    return new Response(JSON.stringify({ error: 'Missing invoice_no or status' }), { status: 400 });
  }

  try {
    // First, update the purchase order status
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('invoice_no', invoice_no);

    if (updateError) {
      throw updateError;
    }

    // If status is 'In Transit', group items by supplier and create a transaction for each.
    if (status === 'In Transit') {
      // 1. Fetch PO data
      const { data: poData, error: poError } = await supabase.from('purchase_orders').select('*').eq('invoice_no', invoice_no).single();
      if (poError || !poData) throw new Error('Failed to fetch purchase order details.');

      // 2. Fetch items and their prices from the related 'items' table
      const { data: poItems, error: poItemsError } = await supabase
        .from('purchase_orders_items')
        .select('quantity, supplier_id, items(id, unit_price)')
        .eq('invoice_no', invoice_no);

      if (poItemsError || !poItems || poItems.length === 0) {
        throw new Error('Failed to fetch items for the purchase order.');
      }

      // 3. Group items by supplier
      const itemsBySupplier = poItems.reduce((acc, item) => {
        const supplierId = item.supplier_id;
        if (!acc[supplierId]) {
          acc[supplierId] = [];
        }
        acc[supplierId].push(item);
        return acc;
      }, {});

      // 4. Create a transaction for each supplier
      const transactionPromises = Object.entries(itemsBySupplier).map(async ([supplier_id, items]) => {
        const typedItems = items as { quantity: number; supplier_id: number; items: { id: number; unit_price: number } }[];
        
        // 5a. Calculate totals for this supplier's items
        const total_quantity = typedItems.reduce((sum, item) => sum + item.quantity, 0);
        const total_price = typedItems.reduce((sum, item) => sum + (item.quantity * item.items.unit_price), 0);

        // 5b. Generate a new, unique invoice number for the transaction
        const transaction_invoice_no = `${poData.invoice_no}-S${supplier_id}`;

        // 5c. Construct payload
        const transactionPayload = {
          transaction_type: 'stock_in',
          invoice_no: transaction_invoice_no,
          total_quantity,
          total_price,
          status: 'In Transit', // New transaction status
          created_by: poData.created_by,
          supplier_id: parseInt(supplier_id),
          items: typedItems.map(item => ({
            item_id: item.items.id,
            quantity: item.quantity,
            expiration_date: null
          })),
        };

        // 5d. Call the insert transaction API
        const insertApiUrl = `${url.origin}/api/transactions/insert-new-transaction`;
        const insertResponse = await fetch(insertApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionPayload),
        });

        if (!insertResponse.ok) {
          const errorBody = await insertResponse.json();
          throw new Error(`Failed to create transaction for supplier ${supplier_id}: ${errorBody.error || insertResponse.statusText}`);
        }
        return insertResponse.json();
      });

      // 6. Wait for all transaction creation promises to resolve
      await Promise.all(transactionPromises);
    }

    // If status is 'Completed', update the transaction status to 'Delivered'
    if (status === 'Completed') {
      const updateApiUrl = `${url.origin}/api/transactions/update-status`;
      // This part might need adjustment if a PO can have multiple transactions
      // For now, it updates any transaction with the original invoice_no prefix
      const { data: transactionsToUpdate, error: findError } = await supabase
        .from('transactions')
        .select('invoice_no')
        .like('invoice_no', `${invoice_no}-S%`);

      if (findError) throw new Error('Could not find transactions to update.');

      const updatePromises = transactionsToUpdate.map(t => fetch(updateApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_no: t.invoice_no, status: 'Delivered' }),
      }));
      
      const responses = await Promise.all(updatePromises);
      responses.forEach(async (res, i) => {
        if(!res.ok) {
            const errorBody = await res.json();
            console.error(`Failed to update transaction ${transactionsToUpdate[i].invoice_no}: ${errorBody.error || res.statusText}`);
        }
      });
    }

    return new Response(JSON.stringify({ success: true, message: `Purchase order status updated to ${status}.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in update-purchase-status:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};