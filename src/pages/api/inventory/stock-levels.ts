import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async ({ url }) => {
  const itemId = url.searchParams.get('item_id');

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('item_id, quantity, transaction_types ( direction )');

    if (error) {
      console.error('Supabase error:', error.message);
      return new Response(JSON.stringify({ error: 'Error fetching transactions' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stockLevels = transactions.reduce((acc, transaction) => {
      const { item_id, quantity, transaction_types } = transaction;
      if (!acc[item_id]) {
        acc[item_id] = { stock_in: 0, stock_out: 0, total_stock: 0 };
      }

      if (transaction_types.direction === 'in') {
        acc[item_id].stock_in += quantity;
      } else {
        acc[item_id].stock_out += quantity;
      }

      acc[item_id].total_stock = acc[item_id].stock_in - acc[item_id].stock_out;
      return acc;
    }, {});

    if (itemId) {
      const stockLevel = stockLevels[itemId] || { stock_in: 0, stock_out: 0, total_stock: 0 };
      return new Response(JSON.stringify(stockLevel), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(stockLevels), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error calculating stock levels:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};