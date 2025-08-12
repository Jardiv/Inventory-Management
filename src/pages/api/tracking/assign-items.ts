// src/pages/api/tracking/assign-items.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { warehouseId, items } = body;

    console.log('Raw request body:', body);
    console.log('Parsed warehouseId:', warehouseId, 'Type:', typeof warehouseId);
    console.log('Parsed items:', items);

    if (!warehouseId || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Warehouse ID and items array are required" }),
        { status: 400 }
      );
    }

    // Check if warehouse exists first
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('warehouse')
      .select('id, name, max_capacity')
      .eq('id', parseInt(warehouseId))
      .single();

    if (warehouseError) {
      console.error('Warehouse lookup error:', warehouseError);
      return new Response(
        JSON.stringify({ error: `Warehouse not found: ${warehouseError.message}` }),
        { status: 400 }
      );
    }

    console.log('Found warehouse:', warehouseData);

    const results = [];
    const errors = []; 

    for (const item of items) {
      try {
        console.log(`Processing item: ${item.name}`);

        // First, find the item_id from items table using the name
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('id, name')
          .eq('name', item.name)
          .single();

        if (itemError || !itemData) {
          console.error(`Item not found: ${item.name}`, itemError);
          errors.push(`Item not found: ${item.name}`);
          continue;
        }

        const itemId = itemData.id; 
        console.log(`Found item_id: ${itemId} for ${item.name}`);

        // Check shipment status before continuing
        const { data: shipmentData, error: shipmentError } = await supabase
          .from('shipments')
          .select('id, status, quantity')
          .eq('item_id', itemId)
          .eq('status', 'Pending') // Only get pending shipments
          .maybeSingle();

        if (shipmentError) {
          console.error(`Error fetching shipment for item ${item.name}:`, shipmentError);
          errors.push(`Error checking shipment status for ${item.name}: ${shipmentError.message}`);
          continue;
        }

        if (!shipmentData) {
          console.warn(`No pending shipment found for item: ${item.name}`);
          errors.push(`No pending shipment found for item ${item.name}`);
          continue;
        }

        console.log(`Found shipment:`, shipmentData);

        // Check if this item already exists in the warehouse_items table
        const { data: existingWarehouseItem, error: existingError } = await supabase
          .from('warehouse_items')
          .select('id, quantity')
          .eq('warehouse_id', parseInt(warehouseId))
          .eq('item_id', itemId)
          .maybeSingle();

        if (existingError) {
          console.error(`Error checking existing warehouse item:`, existingError);
          errors.push(`Error checking existing item ${item.name}: ${existingError.message}`);
          continue;
        }

        if (existingWarehouseItem) {
          // Item exists in warehouse, update quantity
          console.log(`Updating existing warehouse item. Current qty: ${existingWarehouseItem.quantity}, Adding: ${item.quantity}`);
          
          const newQuantity = existingWarehouseItem.quantity + item.quantity;
          const { data: updateData, error: updateError } = await supabase
            .from('warehouse_items')
            .update({ 
              quantity: newQuantity,
              date_assigned: new Date().toISOString()
            })
            .eq('id', existingWarehouseItem.id)
            .select();

          if (updateError) {
            console.error(`Error updating warehouse item:`, updateError);
            errors.push(`Error updating item ${item.name}: ${updateError.message}`);
            continue;
          }

          console.log(`Successfully updated warehouse item:`, updateData);
        } else {
          // Item doesn't exist in warehouse, insert new record
          console.log(`Creating new warehouse item entry`);
          
          const insertData = {
            item_id: itemId,
            warehouse_id: parseInt(warehouseId),
            quantity: item.quantity,
            status: 'Active',
            date_assigned: new Date().toISOString()
          };

          console.log('Inserting warehouse item with data:', insertData);

          const { data: insertResult, error: insertError } = await supabase
            .from('warehouse_items')
            .insert(insertData)
            .select();

          if (insertError) {
            console.error(`Error inserting warehouse item:`, insertError);
            errors.push(`Error inserting item ${item.name}: ${insertError.message}`);
            continue;
          }

          console.log(`Successfully created warehouse item:`, insertResult);
        }

        // Update shipment status to 'Delivered'
        const { data: shipmentUpdateData, error: shipmentUpdateError } = await supabase
          .from('shipments')
          .update({ status: 'Delivered' })
          .eq('id', shipmentData.id)
          .select();

        if (shipmentUpdateError) {
          console.error(`Error updating shipment status:`, shipmentUpdateError);
          errors.push(`Error updating shipment status for ${item.name}: ${shipmentUpdateError.message}`);
          continue;
        } else {
          console.log(`Successfully updated shipment:`, shipmentUpdateData);
        }

        results.push({
          itemName: item.name,
          quantity: item.quantity,
          itemId: itemId,
          warehouseId: parseInt(warehouseId),
          status: 'success'
        });

      } catch (error) {
        console.error(`Unexpected error processing item ${item.name}:`, error);
        errors.push(`Unexpected error processing item ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Final assignment results:', { results, errors });

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
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};