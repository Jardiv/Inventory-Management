import { supabase } from "../../../utils/supabaseClient.ts";

/**
 * Handles GET requests to fetch inventory items with warehouse quantities.
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
        // First, try to fetch items with warehouse quantities using left join
        const { data, error } = await supabase
            .from("items")
            .select(`
                id,
                sku,
                name,
                min_quantity,
                max_quantity,
                warehouse_items (
                    quantity
                )
            `)
            .range(offset, offset + limit - 1)
            .order("id", { ascending: true });

        // Handle Supabase error
        if (error) {
            console.error('Supabase query error:', error);
            return jsonResponse({ error: `Database query failed: ${error.message}` }, 500);
        }

        // Get total count for pagination
        const { count, error: countError } = await supabase
            .from("items")
            .select("*", { count: 'exact', head: true });

        if (countError) {
            console.error('Count query error:', countError);
            // Continue without count if this fails
        }

        // Transform data: flatten warehouse quantity and calculate status
        const formattedData = data.map((item) => {
            // Handle case where warehouse_items might be null or empty array
            let quantity = 0;
            if (item.warehouse_items && Array.isArray(item.warehouse_items) && item.warehouse_items.length > 0) {
                quantity = item.warehouse_items[0].quantity || 0;
            }
            
            let status = 'Normal';
            if (quantity === 0) {
                status = 'Out of Stock';
            } else if (quantity <= (item.min_quantity || 0)) {
                status = 'Low Stock';
            }

            return {
                id: item.id,
                code: item.sku || `ITEM-${item.id}`,
                name: item.name || 'Unknown Item',
                current: quantity,
                min: item.min_quantity || 0,
                max: item.max_quantity || 0,
                status: status,
                isVisible: true
            };
        });

        const totalCount = count || data.length;
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
        console.error('API Error:', error);
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
