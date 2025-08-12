import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  const { invoice_no, status } = await request.json();

  if (!invoice_no || !status) {
    return new Response(
      JSON.stringify({ error: 'invoice_no and status are required' }),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('invoice_no', invoice_no)
      .select();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: 'Failed to update transaction status', details: errorMessage }),
      { status: 500 }
    );
  }
};
