import { supabase } from "../utils/supabaseClient.ts";

export async function GET() {
    const { data, error } = await supabase.from("transactions").select("*");

    if (error) {
        console.error("Supabase fetch error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
