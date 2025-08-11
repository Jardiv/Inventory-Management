// src/pages/api/tracking/assign-items.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { warehouseId, items } = body;

    if (!warehouseId || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Warehouse ID and items array are required" }),
        { status: 400 }
      );
    }

    console.log('Assignment request:', { warehouseId, items });

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        console.log(`Processing item: ${item.name}`);

        // First, find the item_id from items table using the name
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('id')
          .eq('name', item.name)
          .single();

        if (itemError || !itemData) {
          console.error(`Item not found: ${item.name}`, itemError);
          errors.push(`Item not found: ${item.name}`);
          continue;
        }

        const itemId = itemData.id; 
        console.log(`Found item_id: ${itemId} for ${item.name}`);

        // 🚫 Check shipment status before continuing
        const { data: shipmentRecord, error: shipmentError } = await supabase
          .from('shipments')
          .select('status')
          .eq('item_id', itemId)
          .maybeSingle();

        if (shipmentError) {
          console.error(`Error fetching shipment for item ${item.name}:`, shipmentError);
          errors.push(`Error checking shipment status for ${item.name}`);
          continue;
        }

        if (!shipmentRecord || shipmentRecord.status === 'Delivered') {
          console.warn(`Skipping delivered item: ${item.name}`);
          errors.push(`Item ${item.name} is already delivered and cannot be reassigned.`);
          continue;
        }

        // Check if this item already exists in the warehouse_items table
        const { data: existingWarehouseItem, error: existingError } = await supabase
          .from('warehouse_items')
          .select('id, quantity')
          .eq('warehouse_id', warehouseId)
          .eq('item_id', itemId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid error when not found

        if (existingError) {
          console.error(`Error checking existing warehouse item:`, existingError);
          errors.push(`Error checking existing item ${item.name}: ${existingError.message}`);
          continue;
        }

        if (existingWarehouseItem) {
          // Item exists in warehouse, update quantity
          console.log(`Updating existing warehouse item. Current qty: ${existingWarehouseItem.quantity}, Adding: ${item.quantity}`);
          
          const newQuantity = existingWarehouseItem.quantity + item.quantity;
          const { error: updateError } = await supabase
            .from('warehouse_items')
            .update({ 
              quantity: newQuantity,
              date_assigned: new Date().toISOString()
            })
            .eq('id', existingWarehouseItem.id);

          if (updateError) {
            console.error(`Error updating warehouse item:`, updateError);
            errors.push(`Error updating item ${item.name}: ${updateError.message}`);
            continue;
          }

          console.log(`Successfully updated warehouse item to quantity: ${newQuantity}`);
        } else {
          // Item doesn't exist in warehouse, insert new record
          console.log(`Creating new warehouse item entry`);
          
          const { error: insertError } = await supabase
            .from('warehouse_items')
            .insert({
              item_id: itemId,
              warehouse_id: parseInt(warehouseId), // Ensure it's an integer
              quantity: item.quantity,
              status: 'Active',
              date_assigned: new Date().toISOString()
            });

          if (insertError) {
            console.error(`Error inserting warehouse item:`, insertError);
            errors.push(`Error inserting item ${item.name}: ${insertError.message}`);
            continue;
          }

          console.log(`Successfully created new warehouse item entry`);
        }

        // Update shipment status to 'Delivered'
        const { error: shipmentUpdateError } = await supabase
          .from('shipments')
          .update({ status: 'Delivered' })
          .eq('item_id', itemId)
          .eq('status', 'Pending');

        if (shipmentUpdateError) {
          console.error(`Error updating shipment status:`, shipmentUpdateError);
          // Don't add to errors since warehouse update succeeded
          console.warn(`Warning: Could not update shipment status for item ${item.name}: ${shipmentUpdateError.message}`);
        } else {
          console.log(`Successfully updated shipment status to Delivered`);
        }

        results.push({
          itemName: item.name,
          quantity: item.quantity,
          itemId: itemId,
          warehouseId: warehouseId,
          status: 'success'
        });

      } catch (error) {
        console.error(`Unexpected error processing item ${item.name}:`, error);
        errors.push(`Unexpected error processing item ${item.name}: ${error.message}`);
      }
    }

    console.log('Assignment results:', { results, errors });

    if (errors.length > 0 && results.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "All items failed to assign", 
          details: errors 
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully assigned ${results.length} items to warehouse`,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      { status: 500 }
    );
  }
};