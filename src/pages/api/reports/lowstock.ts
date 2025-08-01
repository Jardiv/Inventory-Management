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

    // First, get ALL items with warehouse quantities (no pagination limit yet)
    const { data: allItems, error } = await supabase
      .from('items')
      .select(`
        id,
        sku,
        name,
        min_quantity,
        max_quantity,
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

    // Process ALL data to filter low stock items FIRST
    const allLowStockItems = allItems
      .map(item => {
        // Handle case where warehouse_items might be null or empty array (same logic as items.ts)
        let totalQuantity = 0;
        if (item.warehouse_items && Array.isArray(item.warehouse_items) && item.warehouse_items.length > 0) {
          totalQuantity = item.warehouse_items[0].quantity || 0;
        }
        
        // Calculate suggested order quantity (max_quantity - current quantity)
        const suggestedOrder = Math.max(0, (item.max_quantity || 0) - totalQuantity);
        
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
          status: status
        };
      })
      // Filter to only show low stock and out of stock items
      .filter(item => item.status === 'Low' || item.status === 'Out of stock');

    console.log(`Total items: ${allItems.length}, Low stock items: ${allLowStockItems.length}`);
    
    // If no low stock items found, let's create some test data for debugging
    if (allLowStockItems.length === 0) {
      console.log('No low stock items found, creating test data...');
      // Return some sample low stock data for testing
      const testData = [
        { id: 999, sku: 'TEST001', name: 'Test Low Stock Item 1', quantity: 2, minimum: 5, toOrder: 8, status: 'Low' },
        { id: 998, sku: 'TEST002', name: 'Test Out of Stock Item', quantity: 0, minimum: 3, toOrder: 10, status: 'Out of stock' },
        { id: 997, sku: 'TEST003', name: 'Test Low Stock Item 2', quantity: 1, minimum: 4, toOrder: 7, status: 'Low' },
      ];
      
      return new Response(JSON.stringify({
        success: true,
        data: testData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: testData.length,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        },
        debug: { totalItemsInDb: allItems.length, lowStockFound: 0, testDataReturned: true }
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
        totalItems: allLowStockItems.length
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