// src/pages/api/tracking/add-shipment.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro'; 

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { item_id, quantity, note } = body;

    // Validate required fields
    if (!item_id || !quantity) {
      return new Response(
        JSON.stringify({ error: 'Item ID and quantity are required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate quantity is positive
    if (parseInt(quantity) <= 0) {
      return new Response(
        JSON.stringify({ error: 'Quantity must be greater than 0' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if item exists
    const { data: itemExists, error: itemError } = await supabase
      .from('items')
      .select('id')
      .eq('id', item_id)
      .single();

    if (itemError || !itemExists) {
      return new Response(
        JSON.stringify({ error: 'Item not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert new shipment with default status 'Pending' and current timestamp
    const { data, error } = await supabase
      .from('shipments')
      .insert([{
        item_id: parseInt(item_id),
        quantity: parseInt(quantity),
        status: 'Pending',
        date: new Date().toISOString(),
        note: note || null
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to add shipment to database' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Shipment added successfully',
        data: data[0] 
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Server error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// src/pages/api/tracking/items.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro'; 

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, sku, category_id, category(name)')
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format the data
    const formatted = data.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category?.name || 'Unknown Category'
    }));

    return new Response(
      JSON.stringify(formatted), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Server error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};