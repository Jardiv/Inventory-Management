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
          
          // Add a small random delay to prevent concurrent request collisions
          if (attempts === 1) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          }
          
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

          // Create more unique invoice number for each attempt and item
          let currentInvoiceNo = invoiceNo;
          if (attempts > 1) {
            const retryTimestamp = Date.now();
            const retryRandomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
            const attemptId = Math.random().toString(36).substring(2, 3).toUpperCase();
            currentInvoiceNo = `PO-${timestamp}-${retryRandomSuffix}-${attemptId}-${retryTimestamp}`;
          } else {
            // Even for first attempt, make each item's invoice slightly unique
            const itemSuffix = Math.random().toString(36).substring(2, 2).toUpperCase();
            currentInvoiceNo = `${invoiceNo}-${i}${itemSuffix}`;
          }

          // Create a unique transaction datetime for each item to prevent conflicts
          const uniqueTransactionDateTime = new Date(Date.now() + i * 10 + Math.random() * 5).toISOString();

          // Calculate the ID for this transaction (max ID + current item index + 1)
          const currentTransactionId = nextTransactionId + i;

          // Create transaction record with explicit ID to avoid auto-increment conflicts
          const transactionData = {
            id: currentTransactionId,  // Explicitly set the ID
            invoice_no: currentInvoiceNo,
            item_id: item.id,
            quantity: item.quantity,
            total_price: item.totalPrice,
            transaction_datetime: uniqueTransactionDateTime,
            transaction_type_id: transactionType.id,
            supplier_id: supplierId,
            source: source.trim(),
            status: 'Pending',
            destination: null,
            expiration_date: null
          };

          console.log(`Transaction data for item ${item.sku} with ID ${currentTransactionId}:`, transactionData);

          // Insert transaction using a more reliable approach
          const { data, error } = await supabase
            .from('transactions')
            .insert([transactionData])  // Use array format for better compatibility
            .select('*');

          if (error) {
            console.error(`❌ Error creating transaction for item ${item.sku} (attempt ${attempts}):`, error);
            
            // If it's a duplicate key error and we have attempts left, try again with a new ID
            if ((error.code === '23505' || error.message.includes('duplicate key')) && attempts < maxAttempts) {
              console.log(`🔄 Retrying transaction for item ${item.sku} due to duplicate key error`);
              
              // Update the transaction ID for the retry - find the new max ID
              try {
                const { data: newMaxIdResult, error: newMaxIdError } = await supabase
                  .from('transactions')
                  .select('id')
                  .order('id', { ascending: false })
                  .limit(1)
                  .single();

                if (!newMaxIdError && newMaxIdResult) {
                  nextTransactionId = newMaxIdResult.id + 1;
                  console.log(`🔄 Updated next transaction ID to: ${nextTransactionId}`);
                }
              } catch (updateIdError) {
                console.log('⚠️ Could not update max ID, incrementing by 10:', updateIdError);
                nextTransactionId += 10; // Fallback: add a larger increment
              }
              
              // Add a random delay between 100-1000ms to reduce collision chances
              const delay = 100 + Math.random() * 900 + (attempts * 300);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Try again
            }
            
            // For other errors or if we've exhausted attempts, throw error
            if (error.code === '23503') {
              throw new Error(`Foreign key constraint violated for item ${item.sku}. Invalid item_id (${item.id}) or transaction_type_id (${transactionType.id}).`);
            } else if (error.code === '23505') {
              throw new Error(`Unable to create unique transaction for item ${item.sku} after ${attempts} attempts. Database sequence may be out of sync. Please try again later or contact administrator.`);
            } else {
              throw new Error(`Database error for item ${item.sku}: ${error.message}`);
            }
          }

          // Check if we got data back
          if (!data || data.length === 0) {
            throw new Error(`No transaction data returned for item ${item.sku}`);
          }

          const insertedTransaction = data[0];
          console.log(`✅ Transaction created successfully for item ${item.sku} with ID: ${insertedTransaction.id}`);
          transactions.push(insertedTransaction);
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
