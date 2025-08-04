import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch quick summary statistics for dashboard.
 * Returns total items, low stock count, out of stock count, and warehouse count.
 */
export async function GET() {
    try {
        // Get total items count
        const { count: totalItems, error: itemsCountError } = await supabase
            .from("items")
            .select("*", { count: 'exact', head: true });

        if (itemsCountError) {
            console.error('Items count query error:', itemsCountError);
            return new Response(JSON.stringify({ error: `Database query failed: ${itemsCountError.message}` }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get total warehouses count
        const { count: totalWarehouses, error: warehousesCountError } = await supabase
            .from("warehouse")
            .select("*", { count: 'exact', head: true });

        if (warehousesCountError) {
            console.error('Warehouses count query error:', warehousesCountError);
            return new Response(JSON.stringify({ error: `Database query failed: ${warehousesCountError.message}` }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all items with their warehouse quantities to calculate stock status
        const { data: allItems, error: allItemsError } = await supabase
            .from("items")
            .select(`
                id,
                sku,
                name,
                min_quantity,
                warehouse_items (
                    quantity
                )
            `);

        if (allItemsError) {
            console.error('All items query error:', allItemsError);
            return new Response(JSON.stringify({ error: `Database query failed: ${allItemsError.message}` }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate stock statistics
        let lowStock = 0;
        let outOfStock = 0;
        let totalStockItems = 0;

        allItems.forEach((item) => {
            // Sum up quantities from all warehouses for this item
            let current = 0;
            if (item.warehouse_items && Array.isArray(item.warehouse_items)) {
                current = item.warehouse_items.reduce((total, warehouseItem) => {
                    return total + (warehouseItem.quantity || 0);
                }, 0);
            }

            totalStockItems += current;
            const minimum = item.min_quantity || 0;
            
            // Check stock status - separate low stock from out of stock (same logic as lowstock.ts)
            if (current === 0) {
                outOfStock++;
            } else if (current <= minimum) {
                // Only count as low stock if not out of stock (current > 0)
                lowStock++;
            }
        });

        const summaryData = [
            { label: "Total Items", value: totalItems?.toString() || "0", color: "text-blue" },
            { label: "Total Stock Items", value: totalStockItems.toLocaleString(), color: "text-purple" },
            { label: "Low Stock", value: lowStock.toString(), color: "text-orange" },
            { label: "Out of Stock", value: outOfStock.toString(), color: "text-red" },
            { label: "Warehouses", value: totalWarehouses?.toString() || "0", color: "text-green" }
        ];

        return new Response(JSON.stringify({
            data: summaryData,
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
