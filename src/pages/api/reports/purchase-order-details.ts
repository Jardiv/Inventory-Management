import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

interface ProductDetail {
  id: number;
  name: string;
  supplier: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const urlParams = new URLSearchParams(url.search);
    const purchaseOrderId = urlParams.get('id');

    if (!purchaseOrderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Purchase Order ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the main purchase order details
    const { data: purchaseOrderData, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        invoice_no,
        date_created,
        created_by,
        total_quantity,
        total_price,
        status
      `)
      .eq('id', purchaseOrderId)
      .single();

    if (poError) {
      console.error('❌ Purchase order error:', poError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch purchase order details: ' + poError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!purchaseOrderData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Purchase order not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all purchase order items for this purchase order
    const { data: purchaseOrderItems, error: itemsError } = await supabase
      .from('purchase_orders_items')
      .select(`
        id,
        item_id,
        quantity,
        supplier_id,
        invoice_no,
        items (
          name,
          sku
        ),
        suppliers (
          name
        )
      `)
      .eq('invoice_no', purchaseOrderData.invoice_no);

    if (itemsError) {
      console.error('❌ Purchase order items error:', itemsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch purchase order items: ' + itemsError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create product details from purchase order items
    const productDetails: ProductDetail[] = (purchaseOrderItems || []).map((item: any) => {
      // Since individual item prices aren't stored, calculate from the total purchase order
      // Distribute the total purchase order amount proportionally based on quantity
      const totalQuantityInOrder = purchaseOrderData.total_quantity || 1;
      const proportionalAmount = (purchaseOrderData.total_price / totalQuantityInOrder) * item.quantity;
      const unitPrice = proportionalAmount / item.quantity;
      const totalPrice = proportionalAmount;
      
      // Get the actual product name from the joined items table
      const productName = item.items 
        ? `${item.items.name} (${item.items.sku})`
        : `Product ID ${item.item_id}`;
      
      // Get supplier name
      const supplierName = item.suppliers?.name || 'To be determined';
      
      return {
        id: item.id,
        name: productName,
        supplier: supplierName,
        quantity: item.quantity,
        unitPrice: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(unitPrice),
        totalPrice: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(totalPrice)
      };
    });

    // Format response data
    const responseData = {
      id: purchaseOrderData.id,
      poNumber: purchaseOrderData.invoice_no,
      dateCreated: new Date(purchaseOrderData.date_created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      totalQuantity: purchaseOrderData.total_quantity,
      totalAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(purchaseOrderData.total_price),
      status: purchaseOrderData.status,
      createdBy: purchaseOrderData.created_by,
      items: productDetails
    };

    return new Response(JSON.stringify({
      success: true,
      data: responseData
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
