import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get purchase order logs from transactions table - filter by transaction_type_id
    const { data: transactionData, error } = await supabase
      .from('transactions')
      .select(`
        id,
        invoice_no,
        transaction_datetime,
        quantity,
        total_price,
        status,
        source
      `)
      .eq('transaction_type_id', 1) // Filter for Purchase Orders only (ID 1 based on your screenshot)
      .order('transaction_datetime', { ascending: false }); // Order by most recent first

    if (error) {
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Database error: ' + error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transform the data to match the expected format for the frontend
    const purchaseOrderLogs = (transactionData || []).map(transaction => {
      // Format the date to a readable format
      const formattedDate = new Date(transaction.transaction_datetime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Format the total price as currency
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(transaction.total_price || 0);

      // Determine status display - normalize status values
      let displayStatus = transaction.status || 'Unknown';
      switch (displayStatus.toLowerCase()) {
        case 'completed':
        case 'complete':
          displayStatus = 'Completed';
          break;
        case 'pending':
          displayStatus = 'Pending';
          break;
        case 'approved':
          displayStatus = 'Approved';
          break;
        case 'cancelled':
        case 'canceled':
          displayStatus = 'Cancelled';
          break;
        default:
          displayStatus = transaction.status || 'Unknown';
      }

      return {
        id: transaction.id,
        poNumber: transaction.invoice_no || `PO-${transaction.id}`,
        dateCreated: formattedDate,
        rawDate: transaction.transaction_datetime,
        supplier: 'N/A', // This would need to come from a separate suppliers table if available
        totalQuantity: transaction.quantity || 0,
        totalAmount: formattedAmount,
        rawAmount: transaction.total_price || 0,
        status: displayStatus,
        createdBy: transaction.source || 'System'
      };
    });

    // Return all purchase order logs (client-side pagination will handle display)
    return new Response(JSON.stringify({
      success: true,
      data: purchaseOrderLogs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
