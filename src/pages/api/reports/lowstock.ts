import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const getAllIds = searchParams.get('getAllIds') === 'true'; // New parameter
    const requestedLimit = parseInt(searchParams.get('limit') || '10');
    const limit = requestedLimit > 0 ? requestedLimit : 10; // Use dynamic limit or default to 10
    const offset = (page - 1) * limit;

    // First, get all items that have pending purchase orders
    // This will help us exclude them from the low stock list
    const { data: pendingPurchaseOrderItems, error: pendingPOError } = await supabase
      .from('purchase_orders_items')
      .select(`
        item_id,
        purchase_orders!inner (
          status
        )
      `)
      .eq('purchase_orders.status', 'Pending');

    if (pendingPOError) {
      console.error('Error fetching pending purchase orders:', pendingPOError);
      // Continue without filtering if there's an error - better to show all items than fail
    }

    // Create a Set of item IDs that have pending purchase orders for quick lookup
    const itemsWithPendingOrders = new Set(
      (pendingPurchaseOrderItems || []).map(po => po.item_id)
    );

    console.log('Items with pending purchase orders:', Array.from(itemsWithPendingOrders));

    // Now get ALL items with warehouse quantities (no pagination limit yet)
    const { data: allItems, error } = await supabase
      .from('items')
      .select(`
        id,
        sku,
        name,
        min_quantity,
        max_quantity,
        unit_price,
        warehouse_items (
          quantity
        )
      `);

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

    // Process ALL data to filter low stock items FIRST, excluding items with pending orders
    const allLowStockItems = allItems
      .filter(item => {
        // Exclude items that already have pending purchase orders
        if (itemsWithPendingOrders.has(item.id)) {
          console.log(`Filtering out item ${item.sku} - has pending purchase order`);
          return false;
        }
        return true;
      })
      .map(item => {
        // Handle case where warehouse_items might be null or empty array (same logic as items.ts)
        let totalQuantity = 0;
        if (item.warehouse_items && Array.isArray(item.warehouse_items) && item.warehouse_items.length > 0) {
          totalQuantity = item.warehouse_items[0].quantity || 0;
        }
        
        // Calculate suggested order quantity using intelligent formula
        // Formula: Bring stock up to max_quantity level
        // If max_quantity is not set, suggest bringing it to 2x min_quantity as a reasonable buffer
        let suggestedOrder = 0;
        const maxQty = item.max_quantity || 0;
        const minQty = item.min_quantity || 0;
        
        if (maxQty > 0) {
          // Use max_quantity as target if available
          suggestedOrder = Math.max(0, maxQty - totalQuantity);
        } else if (minQty > 0) {
          // If no max_quantity, suggest ordering to 2x minimum as a reasonable buffer
          const targetQuantity = minQty * 2;
          suggestedOrder = Math.max(0, targetQuantity - totalQuantity);
        } else {
          // Fallback: suggest a minimum order of 10 units if no min/max is set
          suggestedOrder = Math.max(0, 10 - totalQuantity);
        }
        
        // Determine status (same logic as items.ts)
        let status = 'In Stock';
        if (totalQuantity === 0) {
          status = 'Out of stock';
        } else if (totalQuantity <= (item.min_quantity || 0)) {
          status = 'Low';
        }

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          quantity: totalQuantity,
          minimum: item.min_quantity,
          toOrder: suggestedOrder,
          unitPrice: item.unit_price || 10.00, // Default unit price if not available
          status: status
        };
      })
      // Filter to only show low stock and out of stock items
      .filter(item => item.status === 'Low' || item.status === 'Out of stock');
    
    // If no low stock items found, return empty result
    if (allLowStockItems.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        },
        debug: { 
          totalItemsInDb: allItems.length, 
          lowStockFound: 0,
          itemsWithPendingOrders: itemsWithPendingOrders.size,
          filteredOutDueToPendingOrders: itemsWithPendingOrders.size
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If requested, return just all IDs for global selection
    if (getAllIds) {
      return new Response(JSON.stringify({
        success: true,
        allIds: allLowStockItems.map(item => item.id),
        totalItems: allLowStockItems.length,
        debug: {
          totalItemsInDb: allItems.length,
          itemsWithPendingOrders: itemsWithPendingOrders.size,
          lowStockItemsAfterFiltering: allLowStockItems.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // NOW apply pagination to the filtered low stock items
    const totalLowStockItems = allLowStockItems.length;
    const paginatedLowStockItems = allLowStockItems.slice(offset, offset + limit);

    // Calculate pagination info based on filtered results
    const totalPages = Math.ceil(totalLowStockItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return new Response(JSON.stringify({
      success: true,
      data: paginatedLowStockItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalLowStockItems,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      debug: {
        totalItemsInDb: allItems.length,
        itemsWithPendingOrders: itemsWithPendingOrders.size,
        lowStockItemsAfterFiltering: totalLowStockItems
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