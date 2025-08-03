import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch quick summary statistics for the dashboard.
 * Includes total products, categories, low stock, out of stock, and suppliers.
 */
export async function GET() {
    try {
        // Get total products
        const { count: totalProducts, error: productsError } = await supabase
            .from("items")
            .select("*", { count: "exact", head: true });

        if (productsError) throw productsError;

        // Get total categories
        const { count: totalCategories, error: categoryError } = await supabase
            .from("category")
            .select("*", { count: "exact", head: true });

        if (categoryError) throw categoryError;

        // Get total suppliers
        const { count: totalSuppliers, error: supplierError } = await supabase
            .from("suppliers")
            .select("*", { count: "exact", head: true });

        if (supplierError) throw supplierError;

        // Get all items with warehouse_items for stock calculations
        const { data: allItems, error: stockError } = await supabase
            .from("items")
            .select(`
                id,
                name,
                min_quantity,
                warehouse_items (
                    quantity
                )
            `);

        if (stockError) throw stockError;

        // Count low stock & out of stock
        let lowStock = 0;
        let outOfStock = 0;

        for (const item of allItems || []) {
            const current = (item.warehouse_items || []).reduce(
                (sum, wi) => sum + (wi.quantity || 0),
                0
            );
            const min = item.min_quantity || 0;

            if (current === 0) outOfStock++;
            else if (current <= min) lowStock++;
        }

        // Prepare summary output
        const summaryData = [
            { label: "Total Products", value: totalProducts?.toString() || "0", color: "text-blue" },
            { label: "Categories", value: totalCategories?.toString() || "0", color: "text-purple" },
            { label: "Low Stock", value: lowStock.toString(), color: "text-orange" },
            { label: "Out of Stock", value: outOfStock.toString(), color: "text-red" },
            { label: "Suppliers", value: totalSuppliers?.toString() || "0", color: "text-green" }
        ];

        return new Response(JSON.stringify({ success: true, data: summaryData }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Quick Summary Error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
