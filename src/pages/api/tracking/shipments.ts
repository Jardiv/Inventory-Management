// src/pages/api/tracking/shipments.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro'; 

export const GET: APIRoute = async () => {
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      id,
      quantity,
      status,
      date,
      item_id,
      items (
        name  
      )
    `)
    .order('date', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Format the data with item name
  const formatted = data.map(s => ({
    id: s.id,
    name: s.items?.name ?? 'Unknown Item',
    qty: s.quantity,
    status: s.status,
    date: s.date,
  }));

  return new Response(JSON.stringify(formatted), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
