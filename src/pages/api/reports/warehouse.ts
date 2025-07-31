import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch warehouse data with capacity metrics.
 * Supports optional 'limit' and 'page' query parameters for pagination.
 */
export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const rawLimit = url.searchParams.get("limit");
    const rawPage = url.searchParams.get("page");
    
    const limit = parseLimit(rawLimit, 10);
    const page = parseInt(rawPage || '1');
    const offset = (page - 1) * limit;

    try {
        // First, get warehouse basic data with pagination
        const { data: warehouseData, error: warehouseError } = await supabase
            .from("warehouse")
            .select(`
                id,
                name,
                max_capacity
            `)
            .range(offset, offset + limit - 1)
            .order("id", { ascending: true });

        if (warehouseError) {
            console.error('Warehouse query error:', warehouseError);
            return jsonResponse({ error: `Database query failed: ${warehouseError.message}` }, 500);
        }

        // Get total warehouse count for pagination
        const { count, error: countError } = await supabase
            .from("warehouse")
            .select("*", { count: 'exact', head: true });

        if (countError) {
            console.error('Count query error:', countError);
            // Continue without count if this fails
        }

        // For each warehouse, calculate the total used space from warehouse_items
        const formattedData = await Promise.all(
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
                if (utilization >= 100) {
                    status = 'Full';
                } else if (utilization >= 90) {
                    status = 'Critical';
                } else if (utilization >= 75) {
                    status = 'High';
                } else if (utilization >= 50) {
                    status = 'Medium';
                }

                return {
                    id: warehouse.id,
                    name: warehouse.name || `Warehouse ${warehouse.id}`,
                    used: used,
                    max: maxCapacity,
                    available: available,
                    utilization: utilization,
                    status: status,
                    isVisible: true
                };
            })
        );

        const totalCount = count || warehouseData.length;
        const totalPages = Math.ceil(totalCount / limit);

        return jsonResponse({
            data: formattedData,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalCount,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        }, 200);

    } catch (error) {
        console.error('Warehouse API Error:', error);
        return jsonResponse({ 
            error: error instanceof Error ? error.message : 'Unknown database error occurred',
            details: 'Check server logs for more information'
        }, 500);
    }
}

/**
 * Parses the 'limit' query string value into a number.
 * Returns a fallback default value if parsing fails.
 */
function parseLimit(rawLimit: string | null, defaultLimit = 10): number {
    const numericLimit = Number(rawLimit);
    return rawLimit !== null && !isNaN(numericLimit) && numericLimit > 0 ? numericLimit : defaultLimit;
}

/**
 * Returns a standard JSON response with status and content-type headers.
 */
function jsonResponse(data: unknown, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
    });
}
