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

            // Transform inventory data
            const inventoryStock = inventoryData.map((item) => {
                // Sum up quantities from all warehouses for this item
                let current = 0;
                if (item.warehouse_items && Array.isArray(item.warehouse_items)) {
                    current = item.warehouse_items.reduce((total, warehouseItem) => {
                        return total + (warehouseItem.quantity || 0);
                    }, 0);
                }

                const minimum = item.min_quantity || 0;
                
                // Determine status and color
                let status = 'Normal';
                let statusColor = 'text-green-400';
                
                if (current === 0) {
                    status = 'Out of Stock';
                    statusColor = 'text-red-400';
                } else if (current <= minimum) {
                    status = 'Low Stock';
                    statusColor = 'text-yellow-400';
                }

                return {
                    id: item.id,
                    itemName: item.name || `Item ${item.id}`,
                    current: current,
                    minimum: minimum,
                    status: status,
                    statusColor: statusColor
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

            // For each warehouse, calculate the total used space from warehouse_items
            const warehouseCapacity = await Promise.all(
                warehouseData.map(async (warehouse) => {
                    // Get total quantity used in this warehouse
                    const { data: warehouseItems, error: itemsError } = await supabase
                        .from("warehouse_items")
                        .select("quantity")
                        .eq("warehouse_id", warehouse.id);

                    let used = 0;
                    if (!itemsError && warehouseItems) {
                        used = warehouseItems.reduce((total, item) => total + (item.quantity || 0), 0);
                    }

                    // Calculate metrics
                    const maxCapacity = warehouse.max_capacity || 0;
                    const available = Math.max(0, maxCapacity - used);
                    const utilization = maxCapacity > 0 ? Math.round((used / maxCapacity) * 100) : 0;

                    // Determine status based on utilization
                    let status = 'Available';
                    let statusColor = 'text-green-400';
                    
                    if (utilization >= 100) {
                        status = 'Full';
                        statusColor = 'text-red-400';
                    } else if (utilization >= 90) {
                        status = 'Critical';
                        statusColor = 'text-orange-400';
                    } else if (utilization >= 75) {
                        status = 'High';
                        statusColor = 'text-orange-400';
                    } else if (utilization >= 50) {
                        status = 'Medium';
                        statusColor = 'text-blue-400';
                    }

                    return {
                        id: warehouse.id,
                        warehouseName: warehouse.name || `Warehouse ${warehouse.id}`,
                        used: used,
                        available: available,
                        utilization: utilization,
                        status: status,
                        statusColor: statusColor
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

            // Filter and transform data for low stock items
            const lowStockItems = lowStockAllData
                .map((item) => {
                    // Sum up quantities from all warehouses for this item
                    let current = 0;
                    if (item.warehouse_items && Array.isArray(item.warehouse_items)) {
                        current = item.warehouse_items.reduce((total, warehouseItem) => {
                            return total + (warehouseItem.quantity || 0);
                        }, 0);
                    }

                    const minimum = item.min_quantity || 0;
                    
                    // Only include items that are low stock or out of stock
                    if (current <= minimum) {
                        // Calculate suggested order quantity
                        const toOrder = current === 0 ? Math.max(minimum, 50) : minimum;
                        
                        // Determine status and color
                        let status = 'Low Stock';
                        let statusColor = 'text-yellow-400';
                        
                        if (current === 0) {
                            status = 'Out of Stock';
                            statusColor = 'text-red-400';
                        }

                        return {
                            id: item.id,
                            itemCode: item.sku || `SKU-${item.id}`,
                            itemName: item.name || `Item ${item.id}`,
                            current: current,
                            minimum: minimum,
                            toOrder: toOrder,
                            status: status,
                            statusColor: statusColor
                        };
                    }
                    return null;
                })
                .filter(item => item !== null); // Remove null items

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
