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

    // Get the current timestamp for all transactions
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

    // Create transactions for each item sequentially to avoid conflicts
    const transactions = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!success && attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`🔨 Processing item ${i + 1}/${items.length}:`, { id: item.id, sku: item.sku, quantity: item.quantity, attempt: attempts });
          
          // Find a supplier for this item
          let supplierId = null;
          if (item.supplier && item.supplier !== 'To be determined' && item.supplier !== 'ABC Suppliers Inc.') {
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
          }

          // Create unique invoice number for each attempt
          let currentInvoiceNo = invoiceNo;
          if (attempts > 1) {
            const retryTimestamp = Date.now();
            const retryRandomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
            currentInvoiceNo = `PO-${timestamp}-${retryRandomSuffix}-${retryTimestamp}`;
          }

          // Create transaction record (DO NOT specify an id - let the database auto-generate it)
          const transactionData = {
            invoice_no: currentInvoiceNo,
            item_id: item.id,
            quantity: item.quantity,
            total_price: item.totalPrice,
            transaction_datetime: transactionDateTime,
            transaction_type_id: transactionType.id,
            supplier_id: supplierId,
            source: source.trim(),
            status: 'Pending',
            destination: null,
            expiration_date: null
          };

          console.log(`Transaction data for item ${item.sku}:`, transactionData);

          // Insert transaction
          const { data, error } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select('*')
            .single();

          if (error) {
            console.error(`❌ Error creating transaction for item ${item.sku} (attempt ${attempts}):`, error);
            
            // If it's a duplicate key error and we have attempts left, try again
            if ((error.code === '23505' || error.message.includes('duplicate key')) && attempts < maxAttempts) {
              console.log(`🔄 Retrying transaction for item ${item.sku} due to duplicate key error`);
              // Add a delay before retry
              await new Promise(resolve => setTimeout(resolve, 500 + (attempts * 200)));
              continue; // Try again
            }
            
            // For other errors or if we've exhausted attempts, throw error
            if (error.code === '23503') {
              throw new Error(`Foreign key constraint violated for item ${item.sku}. Invalid item_id (${item.id}) or transaction_type_id (${transactionType.id}).`);
            } else if (error.code === '23505') {
              throw new Error(`Unable to create unique transaction for item ${item.sku} after ${attempts} attempts. Please try again later.`);
            } else {
              throw new Error(`Database error for item ${item.sku}: ${error.message}`);
            }
          }

          console.log(`✅ Transaction created successfully for item ${item.sku}:`, data.id);
          transactions.push(data);
          success = true;

        } catch (itemError) {
          console.error(`❌ Error processing item ${item.sku} (attempt ${attempts}):`, itemError);
          
          // If we've exhausted all attempts, throw the error
          if (attempts >= maxAttempts) {
            throw itemError;
          }
          
          // For non-duplicate key errors, don't retry
          if (!(itemError instanceof Error) || !itemError.message.includes('duplicate key')) {
            throw itemError;
          }
        }
      }
    }

    console.log('✅ Purchase order generated successfully:', { 
      invoiceNo, 
      transactionCount: transactions.length,
      totalAmount 
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
        transactions: transactions.map(t => ({
          id: t.id,
          item_id: t.item_id,
          quantity: t.quantity,
          total_price: t.total_price
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
