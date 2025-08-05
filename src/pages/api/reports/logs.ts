import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get purchase order logs from purchase_orders table
    const { data: purchaseOrderData, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        invoice_no,
        date_created,
        total_quantity,
        total_price,
        status,
        created_by
      `)
      .order('date_created', { ascending: false }); // Order by most recent first

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

    // Transform the purchase order data to match the expected format for the frontend
    const purchaseOrderLogs = (purchaseOrderData || []).map(purchaseOrder => {
      // Format the date to a readable format
      const formattedDate = new Date(purchaseOrder.date_created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Format the total price as currency
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(purchaseOrder.total_price || 0);

      // Determine status display - normalize status values
      let displayStatus = purchaseOrder.status || 'Unknown';
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
          displayStatus = purchaseOrder.status || 'Unknown';
      }

      return {
        id: purchaseOrder.id,
        poNumber: purchaseOrder.invoice_no || `PO-${purchaseOrder.id}`,
        dateCreated: formattedDate,
        rawDate: purchaseOrder.date_created,
        supplier: 'N/A', // This would need to come from a separate suppliers table if available
        totalQuantity: purchaseOrder.total_quantity || 0,
        totalAmount: formattedAmount,
        rawAmount: purchaseOrder.total_price || 0,
        status: displayStatus,
        createdBy: purchaseOrder.created_by || 'System'
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
