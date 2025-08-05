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

    // Group transactions by invoice_no to avoid duplicates
    const groupedTransactions = new Map();
    
    (transactionData || []).forEach(transaction => {
      const invoiceNo = transaction.invoice_no;
      
      if (groupedTransactions.has(invoiceNo)) {
        // Add to existing group
        const existing = groupedTransactions.get(invoiceNo);
        existing.totalQuantity += transaction.quantity || 0;
        existing.totalAmount += transaction.total_price || 0;
        existing.transactionIds.push(transaction.id);
      } else {
        // Create new group
        groupedTransactions.set(invoiceNo, {
          id: transaction.id, // Use the first transaction ID as representative
          invoice_no: transaction.invoice_no,
          transaction_datetime: transaction.transaction_datetime,
          totalQuantity: transaction.quantity || 0,
          totalAmount: transaction.total_price || 0,
          status: transaction.status,
          source: transaction.source,
          transactionIds: [transaction.id]
        });
      }
    });

    // Transform the grouped data to match the expected format for the frontend
    const purchaseOrderLogs = Array.from(groupedTransactions.values()).map(groupedTransaction => {
      // Format the date to a readable format
      const formattedDate = new Date(groupedTransaction.transaction_datetime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Format the total price as currency
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(groupedTransaction.totalAmount || 0);

      // Determine status display - normalize status values
      let displayStatus = groupedTransaction.status || 'Unknown';
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
          displayStatus = groupedTransaction.status || 'Unknown';
      }

      return {
        id: groupedTransaction.id,
        poNumber: groupedTransaction.invoice_no || `PO-${groupedTransaction.id}`,
        dateCreated: formattedDate,
        rawDate: groupedTransaction.transaction_datetime,
        supplier: 'N/A', // This would need to come from a separate suppliers table if available
        totalQuantity: groupedTransaction.totalQuantity || 0,
        totalAmount: formattedAmount,
        rawAmount: groupedTransaction.totalAmount || 0,
        status: displayStatus,
        createdBy: groupedTransaction.source || 'System'
      };
    });

    // Sort by date (most recent first) since we might have lost the original order due to grouping
    purchaseOrderLogs.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

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
