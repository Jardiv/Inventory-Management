import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async () => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('invoice_no');
  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};
