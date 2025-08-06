// src/pages/api/tracking/warehouses.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { data, error } = await supabase
      .from('warehouse')
      .select('id, name, max_capacity');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 }); 
  }
};
 