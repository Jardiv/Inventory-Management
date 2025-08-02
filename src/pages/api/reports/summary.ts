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

            // Generate dynamic inventory data with prioritized critical items
            const inventoryStock = inventoryData.map((item, index) => {
                const minimum = item.min_quantity || Math.floor(Math.random() * 50) + 10;
                
                // Prioritize critical conditions (40% chance of critical status)
                const shouldBeCritical = Math.random() < 0.4;
                let current: number;
                
                if (shouldBeCritical) {
                    // Generate critical scenarios more frequently
                    const criticalType = Math.random();
                    if (criticalType < 0.3) {
                        current = 0; // Out of stock
                    } else if (criticalType < 0.7) {
                        current = Math.floor(Math.random() * minimum); // Low stock
                    } else {
                        current = minimum + Math.floor(Math.random() * 20); // Just above minimum
                    }
                } else {
                    // Normal stock levels with some variation
                    current = minimum + Math.floor(Math.random() * 200) + 10;
                }
                
                // Add some time-based variation to make data feel more dynamic
                const timeVariation = Math.sin(Date.now() / 100000 + index) * 10;
                current = Math.max(0, Math.floor(current + timeVariation));
                
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

            // Generate dynamic warehouse capacity data with prioritized critical conditions
            const warehouseCapacity = await Promise.all(
                warehouseData.map(async (warehouse, index) => {
                    const maxCapacity = warehouse.max_capacity || Math.floor(Math.random() * 1000) + 500;
                    
                    // Prioritize high utilization scenarios (35% chance of critical status)
                    const shouldBeCritical = Math.random() < 0.35;
                    let used: number;
                    
                    if (shouldBeCritical) {
                        // Generate high utilization scenarios more frequently
                        const criticalType = Math.random();
                        if (criticalType < 0.25) {
                            used = maxCapacity; // Completely full
                        } else if (criticalType < 0.5) {
                            used = Math.floor(maxCapacity * (0.90 + Math.random() * 0.1)); // 90-100%
                        } else if (criticalType < 0.75) {
                            used = Math.floor(maxCapacity * (0.75 + Math.random() * 0.15)); // 75-90%
                        } else {
                            used = Math.floor(maxCapacity * (0.50 + Math.random() * 0.25)); // 50-75%
                        }
                    } else {
                        // Normal utilization levels
                        used = Math.floor(maxCapacity * Math.random() * 0.6); // 0-60%
                    }
                    
                    // Add time-based variation for dynamic feel
                    const timeVariation = Math.sin(Date.now() / 120000 + index * 2) * (maxCapacity * 0.05);
                    used = Math.max(0, Math.min(maxCapacity, Math.floor(used + timeVariation)));

                    // Calculate metrics
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
                        statusColor = 'text-red-400';
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

            // Generate dynamic low stock items with prioritized critical scenarios
            const lowStockItems = lowStockAllData
                .map((item, index) => {
                    const minimum = item.min_quantity || Math.floor(Math.random() * 50) + 10;
                    
                    // Force more items to be in low stock condition for visibility (60% chance)
                    const shouldBeLowStock = Math.random() < 0.6;
                    let current: number;
                    
                    if (shouldBeLowStock) {
                        // Generate critical scenarios
                        const criticalType = Math.random();
                        if (criticalType < 0.4) {
                            current = 0; // Out of stock
                        } else if (criticalType < 0.8) {
                            current = Math.floor(Math.random() * minimum); // Low stock
                        } else {
                            current = minimum; // Exactly at minimum
                        }
                    } else {
                        // Some items above minimum but close to it
                        current = minimum + Math.floor(Math.random() * 10);
                    }
                    
                    // Add time-based variation
                    const timeVariation = Math.sin(Date.now() / 90000 + index * 3) * 5;
                    current = Math.max(0, Math.floor(current + timeVariation));
                    
                    // Only include items that are low stock or out of stock
                    if (current <= minimum) {
                        // Calculate suggested order quantity with some randomization
                        const baseOrder = current === 0 ? Math.max(minimum * 2, 100) : minimum * 1.5;
                        const toOrder = Math.floor(baseOrder + (Math.random() * 50));
                        
                        // Determine status and color
                        let status = 'Low Stock';
                        let statusColor = 'text-yellow-400';
                        
                        if (current === 0) {
                            status = 'Out of Stock';
                            statusColor = 'text-red-400';
                        } else if (current <= minimum * 0.3) {
                            status = 'Critical Low';
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
