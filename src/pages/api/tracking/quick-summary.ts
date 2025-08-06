import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // 1. Count warehouses
    const { count: warehouseCount } = await supabase
      .from('warehouse')
      .select('*', { count: 'exact', head: true });

    // 2. Sum of quantities in warehouse_items
    const { data: warehouseItemsData, error: warehouseItemsError } = await supabase
      .from('warehouse_items')
      .select('quantity');

    if (warehouseItemsError) throw warehouseItemsError;
    const totalStocks = warehouseItemsData.reduce((sum, item) => sum + item.quantity, 0);

    // 3. Count of shipment rows
    const { count: shipmentCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true });

    // 4. Count of pending shipments
    const { count: pendingShipmentCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    return new Response(
      JSON.stringify({
        warehouses: warehouseCount ?? 0,
        totalStocks,
        shipments: shipmentCount ?? 0,
        pendingShipments: pendingShipmentCount ?? 0,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/tracking/quick-summary:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch summary data.' }),
      { status: 500 }
    );
  }
};
