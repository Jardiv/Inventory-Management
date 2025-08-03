import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch dashboard summary data.
 * Returns inventory stock, warehouse capacity, and low stock items for dashboard display.
 */
export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const section = url.searchParams.get("section"); // inventory, warehouse, lowstock, or all

    try {
        let result: any = {};

        // Fetch inventory stock data
        if (!section || section === "inventory" || section === "all") {
            const { data: inventoryData, error: inventoryError } = await supabase
                .from("items")
                .select(`
                    id,
                    sku,
                    name,
                    min_quantity,
                    warehouse_items (
                        quantity
                    )
                `)
                .order("name", { ascending: true });

            if (inventoryError) {
                console.error('Inventory query error:', inventoryError);
                return new Response(JSON.stringify({ error: `Database query failed: ${inventoryError.message}` }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Process inventory data using actual quantities
            const inventoryStock = inventoryData.map(item => {
                const minimum = item.min_quantity || 0;
                
                // Calculate actual current quantity from warehouse_items
                const current = item.warehouse_items?.reduce((sum, wi) => sum + (wi.quantity || 0), 0) || 0;
                
                // Determine status based on actual quantities
                let status = 'Normal';
                
                if (current === 0) {
                    status = 'Out of Stock';
                } else if (current <= minimum) {
                    status = 'Low Stock';
                }

                return {
                    id: item.id,
                    itemName: item.name || `Item ${item.id}`,
                    current: current,
                    minimum: minimum,
                    status: status
                };
            });

            result.inventory = inventoryStock;
        }

        // Fetch warehouse capacity data
        if (!section || section === "warehouse" || section === "all") {
            const { data: warehouseData, error: warehouseError } = await supabase
                .from("warehouse")
                .select(`
                    id,
                    name,
                    max_capacity
                `)
                .order("name", { ascending: true });

            if (warehouseError) {
                console.error('Warehouse query error:', warehouseError);
                return new Response(JSON.stringify({ error: `Database query failed: ${warehouseError.message}` }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get actual warehouse utilization data
            const warehouseCapacity = await Promise.all(
                warehouseData.map(async (warehouse) => {
                    const maxCapacity = warehouse.max_capacity || 0;
                    
                    // Get actual used capacity by summing all warehouse_items quantities for this warehouse
                    const { data: warehouseItems, error: itemsError } = await supabase
                        .from("warehouse_items")
                        .select("quantity")
                        .eq("warehouse_id", warehouse.id);

                    if (itemsError) {
                        console.error('Warehouse items query error:', itemsError);
                        // Continue with zero if error
                    }

                    const used = warehouseItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                    const available = Math.max(0, maxCapacity - used);
                    const utilization = maxCapacity > 0 ? Math.round((used / maxCapacity) * 100) : 0;

                    // Determine status based on actual utilization
                    let status = 'Available';
                    
                    if (utilization >= 100) {
                        status = 'Full';
                    } else if (utilization >= 90) {
                        status = 'Critical';
                    }

                    return {
                        id: warehouse.id,
                        warehouseName: warehouse.name || `Warehouse ${warehouse.id}`,
                        used: used,
                        available: available,
                        utilization: utilization,
                        status: status
                    };
                })
            );

            result.warehouse = warehouseCapacity;
        }

        // Fetch low stock items data
        if (!section || section === "lowstock" || section === "all") {
            const { data: lowStockAllData, error: lowStockError } = await supabase
                .from("items")
                .select(`
                    id,
                    sku,
                    name,
                    min_quantity,
                    warehouse_items (
                        quantity
                    )
                `)
                .order("name", { ascending: true });

            if (lowStockError) {
                console.error('Low stock query error:', lowStockError);
                return new Response(JSON.stringify({ error: `Database query failed: ${lowStockError.message}` }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Process low stock items using actual quantities
            const lowStockItems = lowStockAllData
                .map(item => {
                    const minimum = item.min_quantity || 0;
                    
                    // Calculate actual current quantity from warehouse_items
                    const current = item.warehouse_items?.reduce((sum, wi) => sum + (wi.quantity || 0), 0) || 0;
                    
                    // Only include items that are actually low stock or out of stock
                    if (current <= minimum) {
                        // Calculate suggested order quantity
                        const toOrder = current === 0 ? Math.max(minimum * 2, 100) : minimum - current + minimum;
                        
                        // Determine status
                        let status = 'Low Stock';
                        
                        if (current === 0) {
                            status = 'Out of Stock';
                        }

                        return {
                            id: item.id,
                            itemCode: item.sku || `ITEM-${item.id}`,
                            itemName: item.name || `Item ${item.id}`,
                            current: current,
                            minimum: minimum,
                            toOrder: toOrder,
                            status: status
                        };
                    }
                    return null;
                })
                .filter(item => item !== null) // Remove null items
                .sort((a, b) => {
                    // Sort to prioritize critical items first
                    if (a.current === 0 && b.current !== 0) return -1;
                    if (a.current !== 0 && b.current === 0) return 1;
                    if (a.current <= a.minimum * 0.3 && b.current > b.minimum * 0.3) return -1;
                    if (a.current > a.minimum * 0.3 && b.current <= b.minimum * 0.3) return 1;
                    return 0;
                });

            result.lowstock = lowStockItems;
        }

        return new Response(JSON.stringify({
            data: result,
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
