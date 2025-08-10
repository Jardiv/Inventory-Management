// src/pages/api/tracking/warehouse-requests.ts
import { supabase } from "../../../utils/supabaseClient";
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { warehouse_name, description } = body;

    // Validate required fields
    if (!warehouse_name || warehouse_name.trim() === '') {
      return new Response(JSON.stringify({ 
        error: 'Warehouse name is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert into warehouse_requests table with automatic 'pending' status
    const { data, error } = await supabase
      .from('warehouse_requests')
      .insert([
        {
          warehouse_name: warehouse_name.trim(),
          description: description?.trim() || null,
          status: 'pending', // Automatically set to 'pending' for all new requests
          request_date: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error("Database error in warehouse-requests:", error);
      return new Response(JSON.stringify({ 
        error: 'Failed to create warehouse request' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: data[0],
      message: 'Warehouse request submitted successfully' 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in warehouse-requests POST:", error);
    return new Response(JSON.stringify({ 
      error: 'Invalid request data' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};