// src/pages/api/tracking/create-transfer.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fromWarehouse, toWarehouse, items, createdBy } = body;

    // Validate required fields
    if (!fromWarehouse || !toWarehouse || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: fromWarehouse, toWarehouse, and items array" 
      }), { status: 400 });
    }

    if (fromWarehouse === toWarehouse) {
      return new Response(JSON.stringify({ 
        error: "Source and destination warehouses cannot be the same" 
      }), { status: 400 });
    }

    // Start a transaction by creating multiple transfer records
    const transferPromises = items.map(async (item) => {
      const { itemId, quantity } = item;

      if (!itemId || !quantity || quantity <= 0) {
        throw new Error(`Invalid item data: itemId=${itemId}, quantity=${quantity}`);
      }

      // First, check if the item exists and has enough quantity in the source warehouse
      const { data: warehouseItem, error: checkError } = await supabase
        .from('warehouse_items')
        .select('quantity, item_id')
        .eq('warehouse_id', fromWarehouse)
        .eq('item_id', itemId)
        .single();

      if (checkError || !warehouseItem) {
        throw new Error(`Item ${itemId} not found in source warehouse`);
      }

      if (warehouseItem.quantity < quantity) {
        throw new Error(`Insufficient quantity for item ${itemId}. Available: ${warehouseItem.quantity}, Requested: ${quantity}`);
      }

      // Create transfer record with better error handling
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          item_id: itemId,
          from_warehouse: fromWarehouse,
          to_warehouse: toWarehouse,
          quantity: quantity,
          status: 'Pending'
          // Remove transfer_date to let database use DEFAULT CURRENT_TIMESTAMP
          // Remove created_by since it's not in your schema
        })
        .select()
        .single();

      if (transferError) {
        console.error('Transfer insert error:', transferError);
        throw new Error(`Failed to create transfer record: ${transferError.message}`);
      }

      if (!transfer) {
        throw new Error('Transfer was created but could not retrieve the record');
      }

      // Update source warehouse quantity (decrease)
      const { error: decreaseError } = await supabase
        .from('warehouse_items')
        .update({ 
          quantity: warehouseItem.quantity - quantity
          // Remove last_updated since it's not in your schema
        })
        .eq('warehouse_id', fromWarehouse)
        .eq('item_id', itemId);

      if (decreaseError) {
        throw new Error(`Failed to update source warehouse quantity: ${decreaseError.message}`);
      }

      // Check if item exists in destination warehouse
      const { data: destItem, error: destCheckError } = await supabase
        .from('warehouse_items')
        .select('quantity')
        .eq('warehouse_id', toWarehouse)
        .eq('item_id', itemId)
        .single();

      if (destCheckError && destCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Error checking destination warehouse: ${destCheckError.message}`);
      }

      if (destItem) {
        // Item exists in destination, update quantity
        const { error: increaseError } = await supabase
          .from('warehouse_items')
          .update({ 
            quantity: destItem.quantity + quantity
            // Remove last_updated since it's not in your schema
          })
          .eq('warehouse_id', toWarehouse)
          .eq('item_id', itemId);

        if (increaseError) {
          throw new Error(`Failed to update destination warehouse quantity: ${increaseError.message}`);
        }
      } else {
        // Item doesn't exist in destination, create new record
        const { error: insertError } = await supabase
          .from('warehouse_items')
          .insert({
            item_id: itemId,
            warehouse_id: toWarehouse,
            quantity: quantity,
            status: 'Active'
            // date_assigned will use DEFAULT CURRENT_TIMESTAMP
            // Remove last_updated since it's not in your schema
          });

        if (insertError) {
          throw new Error(`Failed to create item in destination warehouse: ${insertError.message}`);
        }
      }

      // Update transfer status to completed
      const { error: statusError } = await supabase
        .from('transfers')
        .update({ 
          status: 'Completed'
          // Remove completed_date since it's not in your schema
        })
        .eq('id', transfer.id);

      if (statusError) {
        console.warn(`Failed to update transfer status: ${statusError.message}`);
      }

      return transfer;
    });

    // Execute all transfer operations
    const results = await Promise.all(transferPromises);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully transferred ${items.length} item(s) from warehouse ${fromWarehouse} to warehouse ${toWarehouse}`,
      transfers: results
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Transfer error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred during transfer" 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};