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

        // NEW: If shipmentId is provided, use it directly for more precise assignment
        if (item.shipmentId) {
          console.log(`Using specific shipment ID: ${item.shipmentId}`);
          
          // Get the specific shipment by ID
          const { data: shipmentData, error: shipmentError } = await supabase
            .from('shipments')
            .select('id, item_id, quantity, status')
            .eq('id', item.shipmentId)
            .eq('status', 'Pending')
            .single();

          if (shipmentError || !shipmentData) {
            console.error(`Specific shipment not found: ${item.shipmentId}`, shipmentError);
            errors.push(`Shipment ${item.shipmentId} not found or not pending`);
            continue;
          }

          const itemId = shipmentData.item_id;
          console.log(`Found item_id: ${itemId} for shipment ${item.shipmentId}`);

          // Verify quantities match (optional safety check)
          if (shipmentData.quantity !== item.quantity) {
            console.warn(`Quantity mismatch for shipment ${item.shipmentId}: expected ${shipmentData.quantity}, got ${item.quantity}`);
            // You can choose to either use the shipment's quantity or reject the assignment
            // For now, we'll use the shipment's actual quantity
            item.quantity = shipmentData.quantity;
          }

          // Process warehouse assignment
          const assignmentResult = await processWarehouseAssignment(
            itemId, 
            item.quantity, 
            parseInt(warehouseId), 
            item.name, 
            shipmentData.id
          );

          if (assignmentResult.success) {
            results.push(assignmentResult.result);
          } else {
            errors.push(assignmentResult.error);
          }

        } else {
          // LEGACY: Fallback to original method - find item by name
          console.log(`Using legacy method for item: ${item.name}`);
          
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

          // Get the first pending shipment (handles multiple shipments)
          const { data: shipmentsData, error: shipmentError } = await supabase
            .from('shipments')
            .select('id, status, quantity')
            .eq('item_id', itemId)
            .eq('status', 'Pending')
            .order('id', { ascending: true }) // Get oldest first
            .limit(1); // Only get one

          if (shipmentError) {
            console.error(`Error fetching shipment for item ${item.name}:`, shipmentError);
            errors.push(`Error checking shipment status for ${item.name}: ${shipmentError.message}`);
            continue;
          }

          if (!shipmentsData || shipmentsData.length === 0) {
            console.warn(`No pending shipment found for item: ${item.name}`);
            errors.push(`No pending shipment found for item ${item.name}`);
            continue;
          }

          const shipmentData = shipmentsData[0]; // Get the first shipment
          console.log(`Found shipment:`, shipmentData);

          // Process warehouse assignment
          const assignmentResult = await processWarehouseAssignment(
            itemId, 
            item.quantity, 
            parseInt(warehouseId), 
            item.name, 
            shipmentData.id
          );

          if (assignmentResult.success) {
            results.push(assignmentResult.result);
          } else {
            errors.push(assignmentResult.error);
          }
        }

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

// NEW: Helper function to process warehouse assignment
async function processWarehouseAssignment(itemId, quantity, warehouseId, itemName, shipmentId) {
  try {
    // Check if this item already exists in the warehouse_items table
    const { data: existingWarehouseItem, error: existingError } = await supabase
      .from('warehouse_items')
      .select('id, quantity')
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (existingError) {
      console.error(`Error checking existing warehouse item:`, existingError);
      return {
        success: false,
        error: `Error checking existing item ${itemName}: ${existingError.message}`
      };
    }

    if (existingWarehouseItem) {
      // Item exists in warehouse, update quantity
      console.log(`Updating existing warehouse item. Current qty: ${existingWarehouseItem.quantity}, Adding: ${quantity}`);
      
      const newQuantity = existingWarehouseItem.quantity + quantity;
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
        return {
          success: false,
          error: `Error updating item ${itemName}: ${updateError.message}`
        };
      }

      console.log(`Successfully updated warehouse item:`, updateData);
    } else {
      // Item doesn't exist in warehouse, insert new record
      console.log(`Creating new warehouse item entry`);
      
      const insertData = {
        item_id: itemId,
        warehouse_id: warehouseId,
        quantity: quantity,
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
        return {
          success: false,
          error: `Error inserting item ${itemName}: ${insertError.message}`
        };
      }

      console.log(`Successfully created warehouse item:`, insertResult);
    }

    // Update shipment status to 'Delivered'
    const { data: shipmentUpdateData, error: shipmentUpdateError } = await supabase
      .from('shipments')
      .update({ status: 'Delivered' })
      .eq('id', shipmentId)
      .select();

    if (shipmentUpdateError) {
      console.error(`Error updating shipment status:`, shipmentUpdateError);
      return {
        success: false,
        error: `Error updating shipment status for ${itemName}: ${shipmentUpdateError.message}`
      };
    } else {
      console.log(`Successfully updated shipment:`, shipmentUpdateData);
    }

    return {
      success: true,
      result: {
        itemName: itemName,
        quantity: quantity,
        itemId: itemId,
        warehouseId: warehouseId,
        shipmentId: shipmentId,
        status: 'success'
      }
    };

  } catch (error) {
    console.error(`Error in processWarehouseAssignment:`, error);
    return {
      success: false,
      error: `Unexpected error processing ${itemName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}