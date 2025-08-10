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

export function toURLFormat (dateString: string): string {
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0'); 
	return `${year}-${month}-${day}`;
}

export function getUrlParams(request: Request) {
    const url = new URL(request.url);
	const data = {
        limit: parseLimit(url.searchParams.get("limit")),
        offset: parseOffset(url.searchParams.get("offset")),
        sortBy: url.searchParams.get("sortBy") || "transaction_datetime",
        sortOrder: url.searchParams.get("sortOrder") || "desc",
        startDate: url.searchParams.get("startDate"),
        endDate: url.searchParams.get("endDate"),
		search: url.searchParams.get("search"),
        minPrice: url.searchParams.get("minPrice"),
        maxPrice: url.searchParams.get("maxPrice"),
        warehouseId: url.searchParams.get("warehouseId"),
        supplierId: url.searchParams.get("supplierId"),
		statuses: url.searchParams.getAll("status")
    };
	console.log("=====================================================");
	console.log("getUrlParams:: called", request.url);
	console.log("getUrlParams:: data:", data);
	console.log("getUrlParams:: limit:", data.limit);
	console.log("getUrlParams:: offset:", data.offset);
	console.log("getUrlParams:: sortBy:", data.sortBy);
	console.log("getUrlParams:: sortOrder:", data.sortOrder);
	console.log("getUrlParams:: startDate:", data.startDate);
	console.log("getUrlParams:: endDate:", data.endDate);
	console.log("getUrlParams:: search:", data.search);
	console.log("getUrlParams:: minPrice:", data.minPrice);
	console.log("getUrlParams:: maxPrice:", data.maxPrice);
	console.log("getUrlParams:: warehouseId:", data.warehouseId);
	console.log("getUrlParams:: supplierId:", data.supplierId);
	console.log("getUrlParams:: statuses:", data.statuses);
	console.log("=====================================================");
	
	return data;
}