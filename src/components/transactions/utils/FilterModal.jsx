import React, { useState, useEffect, useCallback } from "react";

export default function FilterModal({ tableType }) {
	const [isOpen, setIsOpen] = useState(false);
	const [type, setType] = useState(tableType);

	// Filter states
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [minPrice, setMinPrice] = useState("");
	const [maxPrice, setMaxPrice] = useState("");
	const [selectedStatuses, setSelectedStatuses] = useState([]);
	const [warehouseId, setWarehouseId] = useState("");
	const [supplierId, setSupplierId] = useState("");

	// Data for dropdowns
	const [warehouses, setWarehouses] = useState([]);
	const [suppliers, setSuppliers] = useState([]);
	const availableStatuses = ["Delivered", "Completed", "Pending", "Canceled"];

	const toURLFormat = (dateString) => {
		if (!dateString) return "";
		try {
			const d = new Date(dateString);
			if (isNaN(d.getTime())) return "";
			return d.toISOString().slice(0, 16);
		} catch (e) {
			console.error("Error formatting date for URL:", e);
			return "";
		}
	};

	const setFiltersFromURL = useCallback(() => {
		const params = new URLSearchParams(window.location.search);
		setFromDate(params.get("startDate") || "");
		setToDate(params.get("endDate") || "");
		setMinPrice(params.get("minPrice") || "");
		setMaxPrice(params.get("maxPrice") || "");
		setSelectedStatuses(params.getAll("status"));
		setWarehouseId(params.get("warehouseId") || "");
		setSupplierId(params.get("supplierId") || "");
	}, []);

	useEffect(() => {
		const openModal = (e) => {
			setType(e.detail?.type || "stock-out");
			setIsOpen(true);
		};
		document.addEventListener("open-filter-modal", openModal);
		return () => document.removeEventListener("open-filter-modal", openModal);
	}, []);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			setFiltersFromURL();

			if (type === "stock-out" || type === "logs") {
				fetch("/api/transactions/filter-warehouse").then(res => res.json()).then(data => setWarehouses(data.data || [])).catch(err => console.error("Failed to fetch warehouses", err));
			}
			if (type === "stock-in" || type === "logs") {
				fetch("/api/transactions/filter-suppliers").then(res => res.json()).then(data => setSuppliers(data.data || [])).catch(err => console.error("Failed to fetch suppliers", err));
			}
		} else {
			document.body.style.overflow = "auto";
		}
	}, [isOpen, type, setFiltersFromURL]);

	const closeModal = () => setIsOpen(false);

	const handleApplyFilters = () => {
		const params = new URLSearchParams(window.location.search);
		const setParam = (key, value) => value ? params.set(key, value) : params.delete(key);

		setParam("startDate", toURLFormat(fromDate));
		setParam("endDate", toURLFormat(toDate));
		setParam("minPrice", minPrice);
		setParam("maxPrice", maxPrice);

		params.delete("status");
		selectedStatuses.forEach(status => params.append("status", status));

		setParam("warehouseId", warehouseId);
		setParam("supplierId", supplierId);

		params.set("page", "1");
		window.location.search = params.toString();
		closeModal();
	};

	const handleClearFilters = () => {
		window.location.search = "";
		closeModal();
	};

	if (!isOpen) return null;

	const renderWarehouseFilter = () => (
		<div className="flex flex-col gap-2">
			<label className="text-textColor-secondary">Warehouse</label>
			<select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); if (e.target.value) setSupplierId(""); }} disabled={!!supplierId} className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary disabled:opacity-50">
				<option value="">All Warehouses</option>
				{warehouses.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
			</select>
		</div>
	);

	const renderSupplierFilter = () => (
		<div className="flex flex-col gap-2">
			<label className="text-textColor-secondary">Supplier</label>
			<select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); if (e.target.value) setWarehouseId(""); }} disabled={!!warehouseId} className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary disabled:opacity-50">
				<option value="">All Suppliers</option>
				{suppliers.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
			</select>
		</div>
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
			<div className="bg-primary p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-in-out" onClick={(e) => e.stopPropagation()}>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-bold text-textColor-primary">Filter Options</h2>
					<button onClick={closeModal} className="p-2 rounded-full hover:bg-tbl-hover text-textColor-secondary hover:text-textColor-primary">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-6">
						<div className="flex flex-col gap-2">
							<label className="text-textColor-secondary">Date Range</label>
							<div className="flex items-center gap-2">
								<input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary" />
								<span className="text-textColor-tertiary">to</span>
								<input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary" />
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-textColor-secondary">Total Price Range</label>
							<div className="flex items-center gap-2">
								<input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} min="0" step="0.01" className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary" />
								<span className="text-textColor-tertiary">-</span>
								<input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} min="0" step="0.01" className="w-full bg-background border border-border_color rounded-md p-2 text-textColor-primary focus:outline-none focus:ring-2 focus:ring-btn-primary" />
							</div>
						</div>
					</div>

					<div>
						<label className="text-textColor-secondary">Status</label>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
							{availableStatuses.map(s => (
								<label key={s} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-tbl-hover">
									<input type="checkbox" value={s} checked={selectedStatuses.includes(s)} onChange={(e) => setSelectedStatuses(e.target.checked ? [...selectedStatuses, s] : selectedStatuses.filter(status => status !== s))} className="h-4 w-4 accent-btn-primary" />
									<span className="text-textColor-primary">{s}</span>
								</label>
							))}
						</div>
					</div>

					{type === "logs" && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border_color">
							{renderWarehouseFilter()}
							{renderSupplierFilter()}
						</div>
					)}
					{type === "stock-out" && renderWarehouseFilter()}
					{type === "stock-in" && renderSupplierFilter()}
				</div>

				<div className="flex justify-end gap-4 mt-8">
					<button onClick={handleClearFilters} className="px-6 py-2 rounded-lg text-textColor-primary bg-tbl-hover hover:bg-border_color transition-colors font-semibold">
						Clear Filters
					</button>
					<button onClick={handleApplyFilters} className="px-6 py-2 rounded-lg bg-btn-primary text-white hover:bg-btn-hover transition-colors font-semibold">
						Apply Filters
					</button>
				</div>
			</div>
			
		</div>

		
	);
}



