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

    if (!transactionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Transaction ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the main transaction details
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        id,
        invoice_no,
        transaction_datetime,
        quantity,
        total_price,
        status,
        source,
        product_id
      `)
      .eq('id', transactionId)
      .eq('transaction_type_id', 1) // Ensure it's a Purchase Order
      .single();

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch transaction details'
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

    // Get product details if product_id exists
    let productDetails: ProductDetail[] = [];
    if (transactionData.product_id) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          id,
          product_name,
          supplier,
          price
        `)
        .eq('id', transactionData.product_id);

      if (!productError && productData && productData.length > 0) {
        const product = productData[0];
        productDetails = [{
          id: product.id,
          name: product.product_name || 'Unknown Product',
          supplier: product.supplier || 'Unknown Supplier',
          quantity: transactionData.quantity || 0,
          unitPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(product.price || 0),
          totalPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format((product.price || 0) * (transactionData.quantity || 0))
        }];
      }
    }

    // If no specific product found, get all purchase orders from the same invoice/batch
    if (productDetails.length === 0) {
      const { data: relatedTransactions, error: relatedError } = await supabase
        .from('transactions')
        .select(`
          id,
          product_id,
          quantity,
          total_price
        `)
        .eq('invoice_no', transactionData.invoice_no)
        .eq('transaction_type_id', 1);

      if (!relatedError && relatedTransactions && relatedTransactions.length > 0) {
        // Get product details for all related transactions
        const productIds = relatedTransactions
          .filter(t => t.product_id)
          .map(t => t.product_id);

        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`
              id,
              product_name,
              supplier,
              price
            `)
            .in('id', productIds);

          if (!productsError && productsData) {
            productDetails = relatedTransactions
              .map(transaction => {
                const product = productsData.find(p => p.id === transaction.product_id);
                if (product) {
                  return {
                    id: product.id,
                    name: product.product_name || 'Unknown Product',
                    supplier: product.supplier || 'Unknown Supplier',
                    quantity: transaction.quantity || 0,
                    unitPrice: new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(product.price || 0),
                    totalPrice: new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(transaction.total_price || 0)
                  };
                }
                return null;
              })
              .filter((item): item is ProductDetail => item !== null);
          }
        }
      }
    }

    // If still no products found, create a mock entry based on transaction data
    if (productDetails.length === 0) {
      productDetails = [{
        id: transactionData.id,
        name: `Product for ${transactionData.invoice_no}`,
        supplier: 'Unknown Supplier',
        quantity: transactionData.quantity || 0,
        unitPrice: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format((transactionData.total_price || 0) / (transactionData.quantity || 1)),
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
