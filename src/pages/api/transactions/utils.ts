import type { APIContext } from 'astro';

// Utility functions
export function formatDateTime(dateTimeString: string): string {
	if (!dateTimeString) return '';
	
	const date = new Date(dateTimeString);
	
	// Format date as MM/DD/YYYY
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const year = date.getFullYear();
	
	// Format time as HH:MM (24-hour format)
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	
	return `${month}/${day}/${year} ${hours}:${minutes}`;
}

export function parseLimit(rawLimit: string | null, defaultLimit = 10, maxLimit = 100): number {
	const numericLimit = Number(rawLimit);
	if (rawLimit !== null && !isNaN(numericLimit)) {
		return Math.min(numericLimit, maxLimit); // Cap at maxLimit
	}
	return defaultLimit;
}

export function parseOffset(rawOffset: string | null): number {
	const numericOffset = Number(rawOffset);
	if (rawOffset !== null && !isNaN(numericOffset) && numericOffset >= 0) {
		return numericOffset;
	}
	return 0;
}

export function jsonResponse(data: unknown, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*", // Add CORS if needed
		},
	});
}

export function getUrlParams(request: Request) {
    const url = new URL(request.url);
	return {
        limit: parseLimit(url.searchParams.get("limit")),
        offset: parseOffset(url.searchParams.get("offset")),
        status: url.searchParams.get("status"),
        sortBy: url.searchParams.get("sortBy") || "transaction_datetime",
        sortOrder: url.searchParams.get("sortOrder") || "desc",
        startDate: url.searchParams.get("startDate"),
        endDate: url.searchParams.get("endDate"),
		search: url.searchParams.get("search"),
    };
}