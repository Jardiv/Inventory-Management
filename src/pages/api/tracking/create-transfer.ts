// src/pages/api/tracking/create-transfer.ts - Fixed Version with Record Deletion
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

      // Get ALL records for this item in source warehouse and sum quantities
      console.log(`Looking for all records of item_id=${itemId} in warehouse_id=${fromWarehouse}`);
      const { data: warehouseItems, error: checkError } = await supabase
        .from('warehouse_items')
        .select('quantity, item_id, id')
        .eq('warehouse_id', fromWarehouse)
        .eq('item_id', itemId); 

      console.log("Query result:", { warehouseItems, checkError });

      if (checkError) {
        console.error("Database error:", checkError);
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (!warehouseItems || warehouseItems.length === 0) {
        throw new Error(`Item ${itemId} not found in source warehouse ${fromWarehouse}`);
      }

      // Calculate total available quantity
      const totalAvailable = warehouseItems.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`Total available quantity: ${totalAvailable} (from ${warehouseItems.length} records)`);

      if (totalAvailable < quantity) {
        throw new Error(`Insufficient quantity for item ${itemId}. Available: ${totalAvailable}, Requested: ${quantity}`);
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

      // Decrease quantities from source warehouse (handle multiple records)
      let remainingToDecrease = quantity;
      const recordsToDelete = []; // Track records that become 0
      
      for (const warehouseItem of warehouseItems) {
        if (remainingToDecrease <= 0) break;
        
        const decreaseAmount = Math.min(warehouseItem.quantity, remainingToDecrease);
        const newQuantity = warehouseItem.quantity - decreaseAmount;
        
        console.log(`Processing record ${warehouseItem.id}: ${warehouseItem.quantity} - ${decreaseAmount} = ${newQuantity}`);
        
        if (newQuantity === 0) {
          // Mark for deletion instead of updating to 0
          recordsToDelete.push(warehouseItem.id);
          console.log(`Record ${warehouseItem.id} will be deleted (quantity became 0)`);
        } else {
          // Update with new quantity
          const { error: decreaseError } = await supabase
            .from('warehouse_items')
            .update({ quantity: newQuantity })
            .eq('id', warehouseItem.id);

          if (decreaseError) {
            console.error('Decrease error:', decreaseError);
            throw new Error(`Failed to update source warehouse quantity: ${decreaseError.message}`);
          }
          console.log(`Updated record ${warehouseItem.id} to quantity ${newQuantity}`);
        }
        
        remainingToDecrease -= decreaseAmount;
      }

      // Delete records that became 0
      if (recordsToDelete.length > 0) {
        console.log(`Deleting ${recordsToDelete.length} records with 0 quantity:`, recordsToDelete);
        
        const { error: deleteError } = await supabase
          .from('warehouse_items')
          .delete()
          .in('id', recordsToDelete);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw new Error(`Failed to delete empty warehouse records: ${deleteError.message}`);
        }
        console.log(`Successfully deleted ${recordsToDelete.length} empty records`);
      }

      // Handle destination warehouse
      console.log(`Handling destination warehouse item ${itemId} in warehouse ${toWarehouse}`);
      
      // Check if item exists in destination warehouse
      const { data: destItems, error: destCheckError } = await supabase
        .from('warehouse_items')
        .select('quantity, id')
        .eq('warehouse_id', toWarehouse)
        .eq('item_id', itemId)
        .limit(1);

      if (destCheckError) {
        console.error('Destination check error:', destCheckError);
        throw new Error(`Error checking destination warehouse: ${destCheckError.message}`);
      }

      if (destItems && destItems.length > 0) {
        // Item exists, update the first record found
        const destItem = destItems[0];
        console.log(`Updating existing destination record: ${destItem.quantity} + ${quantity} = ${destItem.quantity + quantity}`);
        
        const { error: increaseError } = await supabase
          .from('warehouse_items')
          .update({ 
            quantity: destItem.quantity + quantity,
            status: 'Active'
          })
          .eq('id', destItem.id);

        if (increaseError) {
          console.error('Increase error:', increaseError);
          throw new Error(`Failed to update destination warehouse quantity: ${increaseError.message}`);
        }
        console.log("Destination warehouse updated successfully");
      } else {
        // Item doesn't exist, create new record
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