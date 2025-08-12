import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get('id');
  const productCode = url.searchParams.get('code');

  // Build query with supplier join
  let query = supabase
    .from('items')
    .select(`
      id,
      sku,
      name,
      category_id,
      min_quantity,
      max_quantity,
      unit_price,
      description,
      curr_supplier_id,
      suppliers(name)
    `);
  if (productId) {
    query = query.eq('id', productId);
  } else if (productCode) {
    query = query.eq('sku', productCode);
  } else {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing product id or code.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Ensure all fields are present in the response
  let supplierName = '';
  if (Array.isArray(data?.suppliers)) {
    supplierName = data.suppliers[0]?.name ?? '';
  } else if (
    data?.suppliers &&
    typeof data.suppliers === 'object' &&
    'name' in data.suppliers
  ) {
    supplierName = (data.suppliers as { name?: string }).name ?? '';
  }

  // Format unit price as Philippine Peso with thousands separator and two decimals
  const priceValue = typeof data?.unit_price === 'number' ? data.unit_price : Number(data?.unit_price ?? 0);
  const formattedPrice = `₱${priceValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const safeData = {
    id: data?.id ?? null,
    sku: data?.sku ?? '',
    name: data?.name ?? '',
    category_id: data?.category_id ?? null,
    min_quantity: data?.min_quantity ?? 0,
    max_quantity: data?.max_quantity ?? 0,
    unit_price: formattedPrice,
    description: data?.description ?? '',
    curr_supplier_id: data?.curr_supplier_id ?? null,
    supplier_name: supplierName,
  };

  return new Response(
    JSON.stringify({ success: true, data: safeData }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
