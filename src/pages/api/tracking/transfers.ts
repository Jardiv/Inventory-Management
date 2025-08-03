// src/pages/api/tracking/transfers.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const offset = (page - 1) * limit;

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




  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
