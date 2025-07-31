import { supabase } from "../../../utils/supabaseClient.ts";

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const rawLimit = url.searchParams.get("limit");
    const limit = parseLimit(rawLimit);

    console.log("Final limit value being used in query:", limit);

    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .neq("type", "stock-in")
        .order("transaction_datetime", { ascending: false })
        .limit(limit);

    console.log("Number of records returned:", data?.length);

    if (error) {
        console.error("Supabase fetch error:", error.message);
        return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse(data, 200);
}

function parseLimit(rawLimit: string | null, defaultLimit = 10): number {
    if (rawLimit === null) {
        console.log("rawLimit is null, using default");
        return defaultLimit;
    }
    const numericLimit = Number(rawLimit);
    console.log("Converted to number:", numericLimit, "isNaN:", isNaN(numericLimit));
    if (!isNaN(numericLimit)) {
        console.log("Using limit:", numericLimit);
        return numericLimit;
    }
    console.log("Using default limit because conversion failed");
    return defaultLimit;
}

function jsonResponse(data: unknown, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}