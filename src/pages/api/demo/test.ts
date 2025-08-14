import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  let processedCount = 0;
  let skippedCount = 0;
  let errorLogs = [];

  try {
    // 1. Fetch all POs that are 'In Transit', 'Completed', or 'Canceled'
    const { data: purchaseOrders, error: poFetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .in('status', ['In Transit', 'Completed', 'Canceled']);

    if (poFetchError) {
      throw new Error(`Failed to fetch purchase orders: ${poFetchError.message}`);
    }

    // Loop through each PO
    for (const poData of purchaseOrders) {
      try {
        // 2. Check if transactions already exist for this PO to prevent duplicates
        const { count, error: checkError } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .like('invoice_no', `${poData.invoice_no}-S%`);

        if (checkError) {
            console.error(`Error checking for existing transactions for ${poData.invoice_no}:`, checkError.message);
            errorLogs.push(`Failed to check transactions for ${poData.invoice_no}.`);
            continue; // Skip to next PO
        }

        if (count > 0) {
            console.log(`Transactions already exist for PO ${poData.invoice_no}. Skipping.`);
            skippedCount++;
            continue; // Skip to next PO
        }

        // 3. If no transactions exist, create them
        const { data: poItems, error: poItemsError } = await supabase
          .from('purchase_orders_items')
          .select('quantity, supplier_id, items(id, unit_price)')
          .eq('invoice_no', poData.invoice_no);

        if (poItemsError || !poItems || poItems.length === 0) {
          // If a PO is canceled, it might not have items, which is okay.
          if (poData.status === 'Canceled') {
            processedCount++;
            continue;
          }
          throw new Error(`Failed to fetch items for PO ${poData.invoice_no}.`);
        }

        const itemsBySupplier = poItems.reduce((acc, item) => {
            const supplierId = item.supplier_id;
            if (!acc[supplierId]) acc[supplierId] = [];
            acc[supplierId].push(item);
            return acc;
        }, {});

        const transactionPromises = Object.entries(itemsBySupplier).map(async ([supplier_id, items]) => {
            const typedItems = items as { quantity: number; supplier_id: number; items: { id: number; unit_price: number } }[];
            const total_quantity = typedItems.reduce((sum, item) => sum + item.quantity, 0);
            const total_price = typedItems.reduce((sum, item) => sum + (item.quantity * item.items.unit_price), 0);
            const transaction_invoice_no = `${poData.invoice_no}-S${supplier_id}`;

            const statusMapping = {
                'In Transit': 'Pending',
                'Completed': 'Delivered',
                'Canceled': 'Canceled'
            };
            const transactionStatus = statusMapping[poData.status] || 'Pending';

            const transactionPayload = {
                transaction_type: 'stock_in',
                invoice_no: transaction_invoice_no,
                total_quantity,
                total_price,
                status: transactionStatus,
                created_by: poData.created_by,
                supplier_id: parseInt(supplier_id),
                items: typedItems.map(item => ({
                    item_id: item.items.id,
                    quantity: item.quantity,
                    expiration_date: null
                })),
            };

            const insertApiUrl = `${url.origin}/api/transactions/insert-new-transaction`;
            const insertResponse = await fetch(insertApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload),
            });

            if (!insertResponse.ok) {
                const errorBody = await insertResponse.json();
                throw new Error(`Failed to create transaction for PO ${poData.invoice_no}, supplier ${supplier_id}: ${errorBody.error || insertResponse.statusText}`);
            }
            return insertResponse.json();
        });

        await Promise.all(transactionPromises);
        processedCount++;

      } catch (innerError) {
        const errorMessage = innerError instanceof Error ? innerError.message : 'An unknown error occurred';
        console.error(`Failed to process PO ${poData.invoice_no}:`, errorMessage);
        errorLogs.push(`PO ${poData.invoice_no}: ${errorMessage}`);
      }
    }

    return new Response(JSON.stringify({
        success: true,
        message: `Processing complete. Processed ${processedCount} purchase orders. Skipped ${skippedCount} already existing orders.`,
        errors: errorLogs,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in test script:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};