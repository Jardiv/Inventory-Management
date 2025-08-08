// src/pages/api/tracking/create-transfer.ts - Debug Version
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fromWarehouse, toWarehouse, items, createdBy } = body;

    console.log("=== TRANSFER API DEBUG ===");
    console.log("Request body:", JSON.stringify(body, null, 2));

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

    console.log(`Processing transfer: ${fromWarehouse} -> ${toWarehouse} (${items.length} items)`);

    // Process each item
    const transferResults = [];
    
    for (const item of items) {
      const { itemId, quantity } = item;
      
      console.log(`\n--- Processing item ${itemId} ---`);
      console.log("Item details:", { itemId, quantity });

      if (!itemId || !quantity || quantity <= 0) {
        throw new Error(`Invalid item data: itemId=${itemId}, quantity=${quantity}`);
      }

      // Debug: Check what's in warehouse_items for this warehouse
      console.log("Checking all items in warehouse", fromWarehouse);
      const { data: allWarehouseItems, error: debugError } = await supabase
        .from('warehouse_items')
        .select('*')
        .eq('warehouse_id', fromWarehouse);
      
      console.log("All items in source warehouse:", allWarehouseItems);
      if (debugError) console.log("Debug query error:", debugError);

      // Check if the item exists in source warehouse
      console.log(`Looking for item_id=${itemId} in warehouse_id=${fromWarehouse}`);
      const { data: warehouseItem, error: checkError } = await supabase
        .from('warehouse_items')
        .select('quantity, item_id, id')
        .eq('warehouse_id', fromWarehouse)
        .eq('item_id', itemId)
        .single();

      console.log("Query result:", { warehouseItem, checkError });

      if (checkError) {
        console.error("Database error:", checkError);
        if (checkError.code === 'PGRST116') {
          throw new Error(`Item ${itemId} not found in source warehouse ${fromWarehouse}`);
        }
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (!warehouseItem) {
        throw new Error(`Item ${itemId} not found in source warehouse ${fromWarehouse}`);
      }

      console.log(`Found warehouse item:`, warehouseItem);

      if (warehouseItem.quantity < quantity) {
        throw new Error(`Insufficient quantity for item ${itemId}. Available: ${warehouseItem.quantity}, Requested: ${quantity}`);
      }

      // Create transfer record
      console.log("Creating transfer record...");
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          item_id: itemId,
          from_warehouse: fromWarehouse,
          to_warehouse: toWarehouse,
          quantity: quantity,
          status: 'Completed'
        })
        .select()
        .single();

      if (transferError) {
        console.error('Transfer insert error:', transferError);
        throw new Error(`Failed to create transfer record: ${transferError.message}`);
      }

      console.log("Transfer created:", transfer);

      // Update source warehouse quantity (decrease)
      console.log(`Updating source warehouse: ${warehouseItem.quantity} - ${quantity} = ${warehouseItem.quantity - quantity}`);
      const { error: decreaseError } = await supabase
        .from('warehouse_items')
        .update({ 
          quantity: warehouseItem.quantity - quantity
        })
        .eq('warehouse_id', fromWarehouse)
        .eq('item_id', itemId);

      if (decreaseError) {
        console.error('Decrease error:', decreaseError);
        throw new Error(`Failed to update source warehouse quantity: ${decreaseError.message}`);
      }

      // Check if item exists in destination warehouse
      console.log(`Checking if item ${itemId} exists in destination warehouse ${toWarehouse}`);
      const { data: destItem, error: destCheckError } = await supabase
        .from('warehouse_items')
        .select('quantity, id')
        .eq('warehouse_id', toWarehouse)
        .eq('item_id', itemId)
        .single();

      console.log("Destination check result:", { destItem, destCheckError });

      if (destCheckError && destCheckError.code !== 'PGRST116') {
        throw new Error(`Error checking destination warehouse: ${destCheckError.message}`);
      }

      if (destItem) {
        // Item exists in destination, update quantity
        console.log(`Updating destination warehouse: ${destItem.quantity} + ${quantity} = ${destItem.quantity + quantity}`);
        const { error: increaseError } = await supabase
          .from('warehouse_items')
          .update({ 
            quantity: destItem.quantity + quantity
          })
          .eq('warehouse_id', toWarehouse)
          .eq('item_id', itemId);

        if (increaseError) {
          console.error('Increase error:', increaseError);
          throw new Error(`Failed to update destination warehouse quantity: ${increaseError.message}`);
        }
        console.log("Destination warehouse updated successfully");
      } else {
        // Item doesn't exist in destination, create new record
        console.log(`Creating new item in destination warehouse with quantity ${quantity}`);
        const { error: insertError } = await supabase
          .from('warehouse_items')
          .insert({
            item_id: itemId,
            warehouse_id: toWarehouse,
            quantity: quantity,
            status: 'Active'
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to create item in destination warehouse: ${insertError.message}`);
        }
        console.log("New item created in destination warehouse successfully");
      }

      transferResults.push(transfer);
      console.log(`✅ Successfully processed item ${itemId}`);
    }

    console.log("=== TRANSFER COMPLETED SUCCESSFULLY ===");
    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully transferred ${items.length} item(s)`,
      transfers: transferResults
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("=== TRANSFER FAILED ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred during transfer" 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};