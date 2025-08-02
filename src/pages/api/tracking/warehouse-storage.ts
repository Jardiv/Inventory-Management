// src/pages/api/tracking/warehouse-storage.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('warehouse_items')
    .select(`
      id,
      quantity,
      date_assigned,
      status,
      items (
        sku,
        name,
        category: category_id (
          name
        )
      )
    `, { count: "exact" }) // include total count
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ data, count }), {
    status: 200,
  });
};
