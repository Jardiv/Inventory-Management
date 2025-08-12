import type { APIRoute } from "astro";
import { supabase } from "../../../utils/supabaseClient";

export const GET: APIRoute = async () => {
    const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("id, name, curr_supplier_id, unit_price");

    const { data: warehouses, error: warehousesError } = await supabase
        .from("warehouse")
        .select("*");

    const { data: warehouseStorage, error: warehouseStorageError } =
        await supabase
            .from("warehouse_items")
            .select("warehouse_id, item_id")
            .gt("quantity", 0);

    if (itemsError || warehousesError || warehouseStorageError) {
        return new Response(
            JSON.stringify({
                itemsError: itemsError?.message,
                warehousesError: warehousesError?.message,
                warehouseStorageError: warehouseStorageError?.message,
            }),
            { status: 500 }
        );
    }

    return new Response(
        JSON.stringify({ items, warehouses, warehouseStorage }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
};
