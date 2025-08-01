import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async ({ url }) => {
  const transactionId = url.searchParams.get('id');

  if (!transactionId) {
    return new Response(JSON.stringify({ error: 'Transaction ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        invoice_no,
        transaction_datetime,
        status,
        quantity,
        expiration_date,
        destination,
        source,
        items ( name ),
        suppliers ( name, contact, location )
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      // This also handles the case where no rows are found, as .single() throws an error.
      console.error('Supabase error:', error.message);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform the data to match the frontend's expected structure
    const responseData = {
      invoice_no: data.invoice_no,
      transaction_datetime: data.transaction_datetime,
      status: data.status,
      supplier_name: data.suppliers?.name ?? 'N/A',
      supplier_contact: data.suppliers?.contact ?? 'N/A',
      supplier_location: data.suppliers?.location ?? 'N/A',
      item_name: data.items?.name ?? 'N/A',
      quantity: data.quantity,
      expiry_date: data.expiration_date,
      remarks: data.destination || 'No remarks'
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error fetching transaction details:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
