import { supabase } from "../../../utils/supabaseClient.ts";
import { jsonResponse } from "./utils.ts";
import type { APIContext } from "astro";

export async function GET({ request }: APIContext) {
	try {
		const { data, error } = await supabase
			.from("suppliers")
			.select("id, name")
			.order("name");

		if (error) {
			console.log("Error fetching suppliers:", error.message);
			return jsonResponse({ error: error.message }, 500);
		}

		return jsonResponse(
			{
				data: data || [],
			},
			200
		);
	} catch (err) {
		console.error("Unexpected error:", err);
		return jsonResponse({ error: "Internal server error" }, 500);
	}
}