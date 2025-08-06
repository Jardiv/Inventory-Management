// src/pages/api/tracking/warehouse-capacity.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const warehouseId = url.searchParams.get('warehouse_id');

  if (!warehouseId) {
    return new Response(JSON.stringify({ error: "Missing warehouse_id" }), { status: 400 });
  }

  // Fetch max_capacity and total quantity from warehouse_items
  const { data: warehouseData, error: warehouseError } = await supabase
    .from('warehouse')
    .select('max_capacity')
    .eq('id', warehouseId)
    .single();

  const { data: itemSumData, error: itemError } = await supabase
    .from('warehouse_items')
    .select('quantity') 
    .eq('warehouse_id', warehouseId);

  if (warehouseError || itemError) {
    return new Response(JSON.stringify({ error: warehouseError?.message || itemError?.message }), { status: 500 });
  }

  const currentQuantity = itemSumData.reduce((acc, curr) => acc + curr.quantity, 0);

  return new Response(JSON.stringify({
    max_capacity: warehouseData?.max_capacity || 0,
    current_quantity: currentQuantity,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
