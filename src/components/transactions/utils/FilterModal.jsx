import React, { useState, useEffect, useCallback } from "react";

export default function FilterModal({ tableType }) {
	const [isOpen, setIsOpen] = useState(false);
	const [type, setType] = useState(tableType); // 'stock-out' or 'stock-in'

	// Filter states
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [minPrice, setMinPrice] = useState("");
	const [maxPrice, setMaxPrice] = useState("");
	const [selectedStatuses, setSelectedStatuses] = useState([]);
	const [sourceId, setSourceId] = useState("");

	// Data for dropdowns
	const [sources, setSources] = useState([]);
	const availableStatuses = ["Delivered", "Completed", "Pending", "Canceled"];

	const toURLFormat = (dateString) => {
		if (!dateString) return "";
		try {
			const d = new Date(dateString);
			if (isNaN(d.getTime())) {
				return "";
			}
			return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
		} catch (e) {
			console.error("Error formatting date for URL:", e);
			return "";
		}
	};

	const setFiltersFromURL = useCallback(() => {
		const params = new URLSearchParams(window.location.search);
		console.log("-----------------------------------------------------");
		console.log("FilterModal:: setFiltersFromURL called");
		console.log("FilterModal:: params:", params);
		console.log("-----------------------------------------------------");

		setFromDate(params.get("startDate") || "");
		setToDate(params.get("endDate") || "");
		setMinPrice(params.get("minPrice") || "");
		setMaxPrice(params.get("maxPrice") || "");
		setSelectedStatuses(params.getAll("status"));
		setSourceId(params.get(type === "stock-out" ? "warehouseId" : "supplierId") || "");
	}, [type]);

	useEffect(() => {
		const openModal = (e) => {
			const filterType = e.detail?.type || "stock-out";
			setType(filterType);
			setIsOpen(true);
		};
		document.addEventListener("open-filter-modal", openModal);
		return () => document.removeEventListener("open-filter-modal", openModal);
	}, []);

	useEffect(() => {
		if (isOpen) {
			console.log("FilterModal:: useEffect called with isOpen:", isOpen);
			
			document.body.style.overflow = "hidden";
			setFiltersFromURL();

			// Fix the endpoint URLs and fetch the correct data
			const endpoint = type === "stock-out" ? "/api/transactions/filter-warehouse" : "/api/transactions/filter-suppliers";
			fetch(endpoint)
				.then((res) => res.json())
				.then((data) => setSources(data.data || []))
				.catch((err) => console.error(`Failed to fetch ${type === "stock-out" ? "warehouses" : "suppliers"}`, err));
		} else {
			document.body.style.overflow = "auto";
		}
	}, [isOpen, type, setFiltersFromURL]);

	const closeModal = () => setIsOpen(false);

	const handleApplyFilters = () => {
		console.log("FilterModal:: handleApplyFilters called");

		const params = new URLSearchParams(window.location.search);
		const setParam = (key, value) => {
			if (value) params.set(key, value);
			else params.delete(key);
		};

		// Set date range filters
		setParam("startDate", toURLFormat(fromDate));
		setParam("endDate", toURLFormat(toDate));

		// Set price range filters
		setParam("minPrice", minPrice);
		setParam("maxPrice", maxPrice);

		console.log("FilterModal::handleApplyFiltersL:: params:", params.toString());

		// Set status filters (multiple values)
		params.delete("status");
		selectedStatuses.forEach((status) => params.append("status", status));

		// Set warehouse/supplier filter
		const sourceParam = type === "stock-out" ? "warehouseId" : "supplierId" ;
		
		params.delete(sourceParam);
		if (sourceId) params.set(sourceParam, sourceId);

		// Reset to first page when applying filters
		params.set("page", "1");

		// Apply the new URL
		setTimeout(() =>{
			window.location.search = params.toString();
		}, 50000);
		// window.location.search = params.toString();
		closeModal();
	};

	const handleClearFilters = () => {
		// Clear all filters by removing search params
		window.location.search = "";
		closeModal();
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-in-out"
			onClick={closeModal}>
			<div
				className="bg-primary p-6 rounded-lg shadow-lg w-full max-w-xl transform transition-all duration-300 ease-in-out"
				onClick={(e) => e.stopPropagation()}>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold text-textColor-primary">Filter Options</h2>
					<button onClick={closeModal} className="p-2 rounded-full hover:bg-tbl-hover">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
							className="w-6 h-6 text-textColor-primary">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div className="flex flex-col gap-4">
					{/* Date Range Filter */}
					<fieldset className="p-4 rounded-md">
						<legend className="text-lg font-semibold text-textColor-primary px-2">Date Range</legend>
						<div className="flex justify-center items-center gap-4 text-center ">
							<label className="flex flex-col gap-2 text-textColor-tertiary">
								<input
									type="datetime-local"
									value={fromDate}
									onChange={(e) => setFromDate(e.target.value)}
									className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary"
								/>
							</label>
							<span className="text-textColor-tertiary">To</span>
							<label className="flex flex-col gap-2 text-textColor-tertiary">
								<input
									type="datetime-local"
									value={toDate}
									onChange={(e) => setToDate(e.target.value)}
									className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary"
								/>
							</label>
						</div>
					</fieldset>

					{/* Price Range Filter */}
					<fieldset className="p-4 rounded-md">
						<legend className="text-lg font-semibold text-textColor-primary px-2">Total Price Range</legend>
						<div className="flex items-center gap-4">
							<input
								type="number"
								placeholder="Min Price"
								value={minPrice}
								onChange={(e) => setMinPrice(e.target.value)}
								min="0"
								step="0.01"
								className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary"
							/>
							<span className="text-textColor-tertiary">-</span>
							<input
								type="number"
								placeholder="Max Price"
								value={maxPrice}
								onChange={(e) => setMaxPrice(e.target.value)}
								min="0"
								step="0.01"
								className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary"
							/>
						</div>
					</fieldset>

					{/* Status Filter */}
					<fieldset className="p-4 rounded-md">
						<legend className="text-lg font-semibold text-textColor-primary px-2">Status</legend>
						<div className="grid grid-cols-2 gap-2">
							{availableStatuses.map((s) => (
								<label key={s} className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										value={s}
										checked={selectedStatuses.includes(s)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedStatuses([...selectedStatuses, s]);
											} else {
												setSelectedStatuses(selectedStatuses.filter((status) => status !== s));
											}
										}}
										className="accent-btn-primary"
									/>
									<span className="text-textColor-primary">{s}</span>
								</label>
							))}
						</div>
					</fieldset>

					{/* Warehouse/Supplier Filter */}
					<fieldset className="p-4 rounded-md">
						<legend className="text-lg font-semibold text-textColor-primary px-2">
							{type === "stock-out" ? "Warehouse" : "Supplier"}
						</legend>
						<select
							value={sourceId}
							onChange={(e) => setSourceId(e.target.value)}
							className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary">
							<option value="">All {type === "stock-out" ? "Warehouses" : "Suppliers"}</option>
							{sources.map((source) => (
								<option key={source.id} value={source.id}>
									{source.name}
								</option>
							))}
						</select>
					</fieldset>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-end gap-4 mt-6">
					<button onClick={handleClearFilters} className="px-4 py-2 rounded-md text-textColor-primary hover:bg-tbl-hover transition-colors">
						Clear Filters
					</button>
					<button
						onClick={handleApplyFilters}
						className="px-4 py-2 rounded-md bg-btn-primary text-white hover:bg-btn-hover transition-colors">
						Apply Filters
					</button>
				</div>
			</div>
		</div>
	);
}
