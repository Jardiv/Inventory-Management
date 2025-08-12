import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { invoice_no, status } = body;
    if (!invoice_no || !status) {
      return new Response(JSON.stringify({ success: false, error: 'Missing invoice_no or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('invoice_no', invoice_no);
    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
