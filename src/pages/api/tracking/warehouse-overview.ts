// src/pages/api/tracking/warehouse-overview.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const warehouseId = url.searchParams.get('warehouse_id') || '1';

  // Fetch warehouse metadata
  const { data: warehouse, error: warehouseError } = await supabase
    .from('warehouse')
    .select('id, name, location, max_capacity')
    .eq('id', warehouseId)
    .single();

  if (warehouseError) {
    return new Response(JSON.stringify({ error: warehouseError.message }), { status: 500 });
  }

  // Fetch item assignments for the warehouse
  const { data: items, error: itemsError } = await supabase
    .from('warehouse_items')
    .select(`
      id,
      item_id,
      quantity,
      date_assigned,
      status,
      warehouse_id,
      items (
        id,
        name,
        category:category_id (
          name
        )
      )
    `)
    .eq('warehouse_id', warehouseId);

  if (itemsError) {
    return new Response(JSON.stringify({ error: itemsError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ warehouse, items }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
