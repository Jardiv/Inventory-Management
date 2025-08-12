import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

interface PurchaseOrderItem {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier?: string;
}

interface PurchaseOrderRequest {
  items: PurchaseOrderItem[];
  createdBy: string;
  totalQuantity: number;
  totalAmount: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: PurchaseOrderRequest = await request.json();
    const { items, createdBy, totalQuantity, totalAmount } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No items provided for purchase order'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate item structure
    for (const item of items) {
      if (!item.id || typeof item.id !== 'number') {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid item ID: ${item.id}. Item: ${JSON.stringify(item)}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (!item.quantity || item.quantity <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid quantity for item ${item.sku}: ${item.quantity}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (!item.totalPrice || item.totalPrice <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid total price for item ${item.sku}: ${item.totalPrice}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (!createdBy || createdBy.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'createdBy is required for purchase order generation'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique invoice number with timestamp and random component
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '').substring(0, 14);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const invoiceNo = `PO-${timestamp}-${randomSuffix}`;

    // Get the current timestamp for the purchase order
    const dateCreated = new Date().toISOString();

    console.log('🔨 Generating purchase order:', { invoiceNo, itemCount: items.length, totalAmount, createdBy });

    // First, create the main purchase order record
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        invoice_no: invoiceNo,
        date_created: dateCreated,
        created_by: createdBy.trim(),
        total_quantity: totalQuantity,
        total_price: totalAmount,
        status: 'Pending'
      })
      .select('*')
      .single();

    if (poError || !purchaseOrder) {
      console.error('❌ Error creating purchase order:', poError);
      throw new Error(`Failed to create purchase order: ${poError?.message || 'Unknown error'}`);
    }

    console.log('✅ Purchase order created:', purchaseOrder);

    // Prepare purchase order items data
    const purchaseOrderItems = [];
    
    console.log(`🔨 Preparing purchase order items for ${items.length} items under invoice: ${invoiceNo}`);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      console.log(`🔨 Processing item ${i + 1}/${items.length}:`, { id: item.id, sku: item.sku, quantity: item.quantity });
      
      // Find a supplier for this item
      let supplierId = 1; // Default supplier ID, you might want to adjust this
      if (item.supplier && item.supplier !== 'To be determined' && item.supplier !== 'ABC Suppliers Inc.') {
        try {
          const { data: supplierData, error: supplierError } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('name', `%${item.supplier}%`)
            .limit(1)
            .single();
          
          if (supplierError) {
            console.log('Supplier lookup error (non-critical):', supplierError.message);
          }
          
          if (supplierData) {
            supplierId = supplierData.id;
            console.log('Found supplier ID:', supplierId);
          }
        } catch (supplierError) {
          console.log('Supplier lookup failed (non-critical):', supplierError);
        }
      }

      // Create purchase order item record
      const purchaseOrderItem = {
        item_id: item.id,
        quantity: item.quantity,
        supplier_id: supplierId,
        invoice_no: invoiceNo
      };

      console.log(`Purchase order item data for ${item.sku}:`, purchaseOrderItem);
      purchaseOrderItems.push(purchaseOrderItem);
    }

    console.log(`💾 Inserting ${purchaseOrderItems.length} purchase order items as a batch with invoice: ${invoiceNo}`);

    // Insert all purchase order items at once
    const { data: poItems, error: itemsError } = await supabase
      .from('purchase_orders_items')
      .insert(purchaseOrderItems)
      .select('*');

    if (itemsError) {
      console.error('❌ Error creating purchase order items:', itemsError);
      
      // If items creation fails, we should clean up the purchase order
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', purchaseOrder.id);
      
      if (itemsError.code === '23503') {
        throw new Error(`Foreign key constraint violated. Invalid item_id or supplier_id.`);
      } else if (itemsError.code === '23505') {
        throw new Error(`Duplicate entry error. Please try again.`);
      } else {
        throw new Error(`Database error: ${itemsError.message}`);
      }
    }

    if (!poItems || poItems.length === 0) {
      // Clean up the purchase order if no items were created
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', purchaseOrder.id);
      throw new Error('No purchase order items were created');
    }

    console.log('✅ Purchase order generated successfully:', { 
      invoiceNo, 
      itemCount: poItems.length,
      totalAmount,
      dateCreated
    });

    // Format totalAmount and item prices as Philippine Peso
    const formatPeso = (amount: number) => `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // If items have unitPrice/totalPrice, format them as peso
    const formattedItems = items.map(item => ({
      ...item,
      unitPrice: formatPeso(item.unitPrice),
      totalPrice: formatPeso(item.totalPrice)
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: purchaseOrder.id,
        invoiceNo,
        dateCreated,
        createdBy: createdBy.trim(),
        totalQuantity,
        totalAmount: formatPeso(totalAmount),
        itemCount: poItems.length,
        status: purchaseOrder.status,
        message: `Purchase order created with ${poItems.length} items under invoice: ${invoiceNo}`,
        items: formattedItems,
        purchaseOrderItems: poItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          supplier_id: item.supplier_id,
          invoice_no: item.invoice_no
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error generating purchase order:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Check if it's a database constraint error
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.code) {
        console.error('❌ Database error code:', errorObj.code);
        console.error('❌ Database error details:', errorObj.details);
        
        // Handle common database errors
        if (errorObj.code === '23503') {
          errorMessage = 'Foreign key constraint error - invalid item_id or transaction_type_id';
          statusCode = 400;
        } else if (errorObj.code === '23505') {
          errorMessage = 'Duplicate entry error';
          statusCode = 400;
        } else if (errorObj.code === '42501') {
          errorMessage = 'Permission denied - check database permissions';
          statusCode = 403;
        }
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        debug: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error 
      })
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
