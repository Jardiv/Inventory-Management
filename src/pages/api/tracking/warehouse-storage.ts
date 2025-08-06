// src/pages/api/tracking/warehouse-storage.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const warehouseId = url.searchParams.get("warehouse_id");

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('warehouse_items')
    .select(` 
      id,
      quantity,
      date_assigned,
      status,
      warehouse_id,
      items ( 
        sku,
        name,
        category: category_id (
          name
        )
      )
    `, { count: "exact" }) // to get total count
    .range(from, to);

  if (warehouseId) {
    query = query.eq("warehouse_id", warehouseId);
  }

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ data: data || [], count: count || 0 }), {
    status: 200,
  });
};
