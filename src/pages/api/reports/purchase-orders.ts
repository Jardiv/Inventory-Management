import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

interface PurchaseOrderListItem {
  id: number;
  invoice_no: string;
  date_created: string;
  created_by: string;
  total_quantity: number;
  total_price: number;
  status: string;
  item_count?: number;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const urlParams = new URLSearchParams(url.search);
    const page = parseInt(urlParams.get('page') || '1');
    const limit = parseInt(urlParams.get('limit') || '10');
    const search = urlParams.get('search') || '';
    const status = urlParams.get('status') || '';
    const createdBy = urlParams.get('createdBy') || '';
    const dateFrom = urlParams.get('dateFrom') || '';
    const dateTo = urlParams.get('dateTo') || '';
    const sortBy = urlParams.get('sortBy') || 'date_created';
    const sortOrder = urlParams.get('sortOrder') || 'desc';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase
      .from('purchase_orders')
      .select(`
        id,
        invoice_no,
        date_created,
        created_by,
        total_quantity,
        total_price,
        status
      `);

    let countQuery = supabase
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true });

    // Apply filters
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(`invoice_no.ilike.${searchPattern},created_by.ilike.${searchPattern},status.ilike.${searchPattern}`);
      countQuery = countQuery.or(`invoice_no.ilike.${searchPattern},created_by.ilike.${searchPattern},status.ilike.${searchPattern}`);
    }

    if (status) {
      query = query.eq('status', status);
      countQuery = countQuery.eq('status', status);
    }

    if (createdBy) {
      query = query.ilike('created_by', `%${createdBy}%`);
      countQuery = countQuery.ilike('created_by', `%${createdBy}%`);
    }

    if (dateFrom) {
      query = query.gte('date_created', dateFrom);
      countQuery = countQuery.gte('date_created', dateFrom);
    }

    if (dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('date_created', endDate.toISOString());
      countQuery = countQuery.lt('date_created', endDate.toISOString());
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute queries
    const [{ data: purchaseOrders, error: dataError }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    if (dataError) {
      console.error('❌ Error fetching purchase orders:', dataError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch purchase orders: ' + dataError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (countError) {
      console.error('❌ Error counting purchase orders:', countError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to count purchase orders: ' + countError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get item counts for each purchase order
    const purchaseOrdersWithItemCount: PurchaseOrderListItem[] = [];
    
    if (purchaseOrders && purchaseOrders.length > 0) {
      // Get item counts in a single query
      const invoiceNumbers = purchaseOrders.map(po => po.invoice_no);
      const { data: itemCounts, error: itemCountError } = await supabase
        .from('purchase_orders_items')
        .select('invoice_no')
        .in('invoice_no', invoiceNumbers);

      if (itemCountError) {
        console.error('❌ Error fetching item counts:', itemCountError);
        // Continue without item counts rather than failing
      }

      // Count items per invoice
      const itemCountMap: Record<string, number> = {};
      if (itemCounts) {
        itemCounts.forEach(item => {
          itemCountMap[item.invoice_no] = (itemCountMap[item.invoice_no] || 0) + 1;
        });
      }

      // Combine data
      purchaseOrdersWithItemCount.push(...purchaseOrders.map(po => ({
        ...po,
        item_count: itemCountMap[po.invoice_no] || 0
      })));
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return new Response(JSON.stringify({
      success: true,
      data: {
        purchaseOrders: purchaseOrdersWithItemCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count || 0,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          search,
          status,
          createdBy,
          dateFrom,
          dateTo,
          sortBy,
          sortOrder
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in purchase orders API:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
