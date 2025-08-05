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
  source: string;
  totalQuantity: number;
  totalAmount: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: PurchaseOrderRequest = await request.json();
    const { items, source, totalQuantity, totalAmount } = body;

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

    if (!source || source.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Source is required for purchase order generation'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique invoice number with timestamp and random component
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '').substring(0, 14);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const invoiceNo = `PO-${timestamp}-${randomSuffix}`;

    // Get the current timestamp for all transactions (single timestamp for all items)
    const transactionDateTime = new Date().toISOString();

    // Get purchase order transaction type (assuming id = 1 based on user requirement)
    const { data: transactionType, error: typeError } = await supabase
      .from('transaction_types')
      .select('id, name')
      .eq('id', 1)
      .single();

    if (typeError || !transactionType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Purchase order transaction type not found'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔨 Generating purchase order:', { invoiceNo, itemCount: items.length, totalAmount, source });

    // Get the current maximum ID from transactions table to avoid duplicates
    let nextTransactionId = 1;
    try {
      const { data: maxIdResult, error: maxIdError } = await supabase
        .from('transactions')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (!maxIdError && maxIdResult) {
        nextTransactionId = maxIdResult.id + 1;
        console.log(`🔍 Found max transaction ID: ${maxIdResult.id}, next will be: ${nextTransactionId}`);
      } else {
        console.log('🔍 No existing transactions found, starting from ID 1');
      }
    } catch (idError) {
      console.log('⚠️  Could not fetch max ID, starting from 1:', idError);
    }

    // Prepare transaction data for all items using the same invoice number and timestamp
    const transactionDataArray = [];
    
    console.log(`🔨 Preparing transactions for ${items.length} items under invoice: ${invoiceNo}`);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      console.log(`🔨 Processing item ${i + 1}/${items.length}:`, { id: item.id, sku: item.sku, quantity: item.quantity });
      
      // Find a supplier for this item
      let supplierId = null;
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

      // Create transaction record with explicit ID to avoid auto-increment conflicts
      const currentTransactionId = nextTransactionId + i;
      const transactionData = {
        id: currentTransactionId, // Explicitly set the ID
        invoice_no: invoiceNo, // Same invoice number for all items
        item_id: item.id,
        quantity: item.quantity,
        total_price: item.totalPrice,
        transaction_datetime: transactionDateTime, // Same timestamp for all items
        transaction_type_id: transactionType.id,
        supplier_id: supplierId,
        source: source.trim(),
        status: 'Pending',
        destination: null,
        expiration_date: null
      };

      console.log(`Transaction data for item ${item.sku} with ID ${currentTransactionId}:`, transactionData);
      transactionDataArray.push(transactionData);
    }

    console.log(`💾 Inserting ${transactionDataArray.length} transactions as a batch with invoice: ${invoiceNo}`);

    // Insert all transactions at once
    const { data: transactions, error: insertError } = await supabase
      .from('transactions')
      .insert(transactionDataArray)
      .select('*');

    if (insertError) {
      console.error('❌ Error creating transactions:', insertError);
      
      if (insertError.code === '23503') {
        throw new Error(`Foreign key constraint violated. Invalid item_id or transaction_type_id.`);
      } else if (insertError.code === '23505') {
        throw new Error(`Duplicate entry error. Please try again.`);
      } else {
        throw new Error(`Database error: ${insertError.message}`);
      }
    }

    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions were created');
    }

    // Update the database sequence to be in sync with our manually set IDs
    try {
      const finalMaxId = Math.max(...transactions.map(t => t.id));
      const { error: seqError } = await supabase.rpc('setval', {
        sequence_name: 'transactions_id_seq',
        new_value: finalMaxId,
        is_called: true
      });
      
      if (seqError) {
        console.log('⚠️ Could not update sequence (non-critical):', seqError);
      } else {
        console.log(`🔧 Updated sequence to ${finalMaxId}`);
      }
    } catch (seqUpdateError) {
      console.log('⚠️ Sequence update failed (non-critical):', seqUpdateError);
    }

    console.log('✅ Purchase order generated successfully:', { 
      invoiceNo, 
      transactionCount: transactions.length,
      totalAmount,
      timestamp: transactionDateTime
    });

    // Return success response with purchase order details
    return new Response(JSON.stringify({
      success: true,
      data: {
        invoiceNo,
        transactionDateTime,
        totalQuantity,
        totalAmount,
        itemCount: transactions.length,
        source,
        message: `Purchase order created with ${transactions.length} items under single invoice: ${invoiceNo}`,
        transactions: transactions.map(t => ({
          id: t.id,
          item_id: t.item_id,
          quantity: t.quantity,
          total_price: t.total_price,
          invoice_no: t.invoice_no
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
