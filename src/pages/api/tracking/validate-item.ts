// src/pages/api/tracking/validate-item.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro'; 

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const itemId = searchParams.get('id');

    if (!itemId || isNaN(parseInt(itemId))) {
      return new Response(
        JSON.stringify({ error: 'Valid item ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('items')
      .select(`
        id, 
        name, 
        sku, 
        category_id,
        category(name)
      `)
      .eq('id', parseInt(itemId))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return new Response(
          JSON.stringify({ error: 'Item not found' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format the response
    const formatted = {
      id: data.id,
      name: data.name,
      sku: data.sku,
      category: data.category?.name || 'Unknown Category'
    };

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