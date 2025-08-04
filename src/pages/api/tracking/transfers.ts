// src/pages/api/tracking/transfers.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const offset = (page - 1) * limit;

  // 1. Get paginated data
  const { data, error } = await supabase
    .from("transfers")
    .select(`
      id, 
      quantity,
      date,
      status,
      items:item_id (
        id,
        name,
        sku
      ),
      from_warehouse (
        id,
        name
      ),
      to_warehouse (
        id,
        name
      )
    `)
    .range(offset, offset + limit - 1);

  // 2. Get total count (for pagination)
  const { count, error: countError } = await supabase
    .from("transfers")
    .select("*", { count: "exact", head: true });

  if (error || countError) {
    return new Response(JSON.stringify({ error: error?.message || countError?.message }), {
      status: 500,
    });
  }

  // 3. Return both data and total count
  return new Response(JSON.stringify({ data, total: count }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
