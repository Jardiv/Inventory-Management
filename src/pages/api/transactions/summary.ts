import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async () => {
  try {
  //  * Stock In (This Month): The total quantity of all individual items received from all "stock in"
  //    transactions during the current calendar month.
  //  * Stock Out (This Month): The total quantity of all individual items sent out from all "stock out"
  //    transactions during the current calendar month.
  //  * Items Received: The total number of "stock in" transactions (or receiving events) that occurred this
  //    month.
  //  * Items Sent: The total number of "stock out" transactions (or sending events) that occurred this month.

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all stock_in transaction_ids
    const { data: stockInIdsData, error: stockInIdsError } = await supabase
      .from('stock_in')
      .select('transaction_id');

    if (stockInIdsError) throw stockInIdsError;
    const stockInIds = stockInIdsData.map(item => item.transaction_id);

    // Total stock in this month
    const { data: stockInData, error: stockInError } = await supabase
      .from('transactions')
      .select('total_quantity')
      .in('id', stockInIds)
      .gte('transaction_datetime', firstDayOfMonth.toISOString())
      .lte('transaction_datetime', lastDayOfMonth.toISOString());
    // console.log("summary:: stockInData:", stockInData);
    
    if (stockInError) throw stockInError;
    const totalStockIn = stockInData.reduce((acc, item) => acc + item.total_quantity, 0);

    // Get all stock_out transaction_ids
    const { data: stockOutIdsData, error: stockOutIdsError } = await supabase
      .from('stock_out')
      .select('transaction_id');
    
    if (stockOutIdsError) throw stockOutIdsError;
    const stockOutIds = stockOutIdsData.map(item => item.transaction_id);

    // Total stock out this month
    const { data: stockOutData, error: stockOutError } = await supabase
      .from('transactions')
      .select('total_quantity')
      .in('id', stockOutIds)
      .gte('transaction_datetime', firstDayOfMonth.toISOString())
      .lte('transaction_datetime', lastDayOfMonth.toISOString());

    if (stockOutError) throw stockOutError;
    const totalStockOut = stockOutData.reduce((acc, item) => acc + item.total_quantity, 0);
    
    // Items received (number of stock in transactions in the month)
    const { count: itemsReceived, error: itemsReceivedError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .in('id', stockInIds)
        .gte('transaction_datetime', firstDayOfMonth.toISOString())
        .lte('transaction_datetime', lastDayOfMonth.toISOString());
    
    if(itemsReceivedError) throw itemsReceivedError;

    // Items sent (number of stock out transactions in the month)
    const { count: itemsSent, error: itemsSentError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .in('id', stockOutIds)
        .gte('transaction_datetime', firstDayOfMonth.toISOString())
        .lte('transaction_datetime', lastDayOfMonth.toISOString());

    if(itemsSentError) throw itemsSentError;


    // Pending transactions
    const { count: pendingCount, error: pendingError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    if (pendingError) {
        console.warn("Could not fetch pending transactions.", pendingError);
    }

    return new Response(JSON.stringify({
        success: true,
        data: {
            stockIn: totalStockIn,
            stockOut: totalStockOut,
            itemsReceived: itemsReceived || 0,
            itemsSent: itemsSent || 0,
            pendingTransactions: pendingCount || 0,
        }
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
};
