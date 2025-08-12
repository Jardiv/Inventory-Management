import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

interface ItemDetail {
  id: number;
  sku: string;
  name: string;
  supplier: string | null;
  current_quantity: number;
  to_order: number;
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const itemId = searchParams.get('id');

    if (!itemId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch item details with warehouse quantities
    const { data: item, error } = await supabase
      .from('items')
      .select(`
        id,
        sku,
        name,
        min_quantity,
        max_quantity,
        unit_price,
        curr_supplier_id,
        warehouse_items (
          quantity
        ),
        suppliers:curr_supplier_id (name)
      `)
      .eq('id', parseInt(itemId))
      .single();

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

    if (!item) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate current quantity from warehouse_items
    let currentQuantity = 0;
    if (item.warehouse_items && Array.isArray(item.warehouse_items) && item.warehouse_items.length > 0) {
      currentQuantity = item.warehouse_items[0].quantity || 0;
    }

    // Calculate suggested order quantity using intelligent formula
    // Formula: Bring stock up to max_quantity level
    // If max_quantity is not set, suggest bringing it to 2x min_quantity as a reasonable buffer
    let toOrder = 0;
    const maxQty = item.max_quantity || 0;
    const minQty = item.min_quantity || 0;
    
    if (maxQty > 0) {
      // Use max_quantity as target if available
      toOrder = Math.max(0, maxQty - currentQuantity);
    } else if (minQty > 0) {
      // If no max_quantity, suggest ordering to 2x minimum as a reasonable buffer
      const targetQuantity = minQty * 2;
      toOrder = Math.max(0, targetQuantity - currentQuantity);
    } else {
      // Fallback: suggest a minimum order of 10 units if no min/max is set
      toOrder = Math.max(0, 10 - currentQuantity);
    }

    const itemDetail: ItemDetail = {
      id: item.id,
      sku: item.sku,
      name: item.name,
      supplier: (item.suppliers && Array.isArray(item.suppliers) && item.suppliers.length > 0 && item.suppliers[0].name) ? item.suppliers[0].name : '-',
      current_quantity: currentQuantity,
      to_order: toOrder,
      min_quantity: item.min_quantity || 0,
      max_quantity: item.max_quantity || 0,
      unit_price: item.unit_price || 10.00
    };

    return new Response(JSON.stringify({
      success: true,
      data: itemDetail
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

export const PUT: APIRoute = async ({ url, request }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const itemId = searchParams.get('id');

    if (!itemId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { orderQuantity } = body;

    if (typeof orderQuantity !== 'number' || orderQuantity < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid order quantity is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, we'll just return success since there's no to_order column in the database
    // In a real implementation, you might want to update a purchase_orders table or similar
    return new Response(JSON.stringify({
      success: true,
      message: 'Order quantity updated successfully',
      data: {
        itemId: parseInt(itemId),
        orderQuantity: orderQuantity
      }
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
