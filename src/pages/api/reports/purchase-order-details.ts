import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient.ts';

interface ProductDetail {
  id: number;
  name: string;
  supplier: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const urlParams = new URLSearchParams(url.search);
    const transactionId = urlParams.get('id');

    console.log('=== Purchase Order Details API ===');
    console.log('Requested transaction ID:', transactionId);

    if (!transactionId) {
      console.log('❌ No transaction ID provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Transaction ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the main transaction details
    console.log('🔍 Querying transaction with ID:', transactionId);
    
    // First, let's see if the transaction exists at all
    const { data: anyTransaction, error: anyError } = await supabase
      .from('transactions')
      .select(`
        id,
        invoice_no,
        transaction_datetime,
        quantity,
        total_price,
        status,
        source,
        transaction_type_id
      `)
      .eq('id', transactionId);

    console.log('📊 Any transaction query result:', { anyTransaction, anyError });

    // Now try the specific query for Purchase Orders
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        id,
        invoice_no,
        transaction_datetime,
        quantity,
        total_price,
        status,
        source
      `)
      .eq('id', transactionId)
      .eq('transaction_type_id', 1) // Ensure it's a Purchase Order
      .single();

    console.log('📊 Purchase Order query result:', { transactionData, transactionError });

    if (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch transaction details: ' + transactionError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!transactionData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Purchase order not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Since there's no direct product linking in the transactions table,
    // we'll create product details based on the transaction data itself
    let productDetails: ProductDetail[] = [];

    // Get all related transactions with the same invoice number
    const { data: relatedTransactions, error: relatedError } = await supabase
      .from('transactions')
      .select(`
        id,
        quantity,
        total_price,
        invoice_no
      `)
      .eq('invoice_no', transactionData.invoice_no)
      .eq('transaction_type_id', 1);

    console.log('📊 Related transactions:', { relatedTransactions, relatedError });

    if (!relatedError && relatedTransactions && relatedTransactions.length > 0) {
      // Create product details from transaction data
      productDetails = relatedTransactions.map((transaction, index) => {
        const unitPrice = (transaction.total_price || 0) / (transaction.quantity || 1);
        return {
          id: transaction.id,
          name: `Item ${index + 1} for ${transaction.invoice_no}`,
          supplier: 'To be determined', // This would need to come from a separate source
          quantity: transaction.quantity || 0,
          unitPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(unitPrice),
          totalPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(transaction.total_price || 0)
        };
      });
    } else {
      // Create a single product entry from the main transaction
      const unitPrice = (transactionData.total_price || 0) / (transactionData.quantity || 1);
      productDetails = [{
        id: transactionData.id,
        name: `Purchase Order Item`,
        supplier: 'To be determined',
        quantity: transactionData.quantity || 0,
        unitPrice: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(unitPrice),
        totalPrice: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(transactionData.total_price || 0)
      }];
    }

    // Format response data
    const responseData = {
      id: transactionData.id,
      poNumber: transactionData.invoice_no || `PO-${transactionData.id}`,
      dateCreated: new Date(transactionData.transaction_datetime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      totalQuantity: transactionData.quantity || 0,
      totalAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(transactionData.total_price || 0),
      status: transactionData.status || 'Unknown',
      createdBy: transactionData.source || 'System',
      items: productDetails
    };

    return new Response(JSON.stringify({
      success: true,
      data: responseData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
