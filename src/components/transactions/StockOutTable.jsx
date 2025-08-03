import { useEffect, useState } from "react";
import { SkeletonRow } from "./utils/SkeletonRow";
import { BlankRow } from "./utils/BlankRow";
import Pagination from "./utils/Pagination";

export default function StockOutTable({ isAbleToSort = true, limit, showPagination = false, currentPage = 1, itemsPerPage = 10 }) {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [paginationData, setPaginationData] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	const [sortConfig, setSortConfig] = useState({ key: "transaction_datetime", direction: "desc" });
	const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

	const [clientCurrentPage, setClientCurrentPage] = useState(parseInt(currentPage, 10) || 1);

	const tableLimit = showPagination ? itemsPerPage : parseInt(limit) || 10;

	useEffect(() => {
		const handleDateChange = (event) => {
			setDateRange(event.detail);
		};
		document.addEventListener("dateRangeChanged", handleDateChange);
		return () => document.removeEventListener("dateRangeChanged", handleDateChange);
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const pageFromUrl = parseInt(params.get("page"), 10);
        if (pageFromUrl) {
            setClientCurrentPage(pageFromUrl);
        }
		const sortBy = params.get("sortBy");
		const sortOrder = params.get("sortOrder");
		const startDate = params.get("startDate");
		const endDate = params.get("endDate");

		if (sortBy && sortOrder) {
			setSortConfig({ key: sortBy, direction: sortOrder });
		}

		if (startDate || endDate) {
			setDateRange({ startDate: startDate || "", endDate: endDate || "" });
		}
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		async function fetchTransactions() {
			setLoading(true);
			try {
				const offset = showPagination ? (clientCurrentPage - 1) * itemsPerPage : 0;
				const fetchLimit = showPagination ? itemsPerPage : limit;
				let url = `/api/transactions/transactions/?direction=out&limit=${fetchLimit}&offset=${offset}&sortBy=${sortConfig.key}&sortOrder=${sortConfig.direction}`;
				if (dateRange.startDate) url += `&startDate=${dateRange.startDate}`;
				if (dateRange.endDate) url += `&endDate=${dateRange.endDate}`;

				const res = await fetch(url, { signal });
				const data = await res.json();

				if (!signal.aborted) {
					setTransactions(data.transactions || []);

					if (showPagination && data.total !== undefined) {
						const totalPages = Math.ceil(data.total / itemsPerPage);
						setPaginationData({
							currentPage: clientCurrentPage,
							totalPages: totalPages,
							totalItems: data.total,
							hasNextPage: clientCurrentPage < totalPages,
							hasPreviousPage: clientCurrentPage > 1,
						});
					}
				}
			} catch (err) {
				if (err.name !== "AbortError") {
					console.error("Error fetching transactions:", err);
				}
			} finally {
				if (!signal.aborted) {
					setLoading(false);
				}
			}
		}

		fetchTransactions();

		return () => {
			controller.abort();
		};
	}, [limit, clientCurrentPage, itemsPerPage, showPagination, sortConfig, dateRange]);

	const requestSort = (key) => {
		if (!isAbleToSort) return;
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const handlePageChange = (e, newPage) => {
        e.preventDefault();
        if (typeof newPage !== 'number' || newPage < 1 || newPage > paginationData.totalPages) {
            return;
        }
        setClientCurrentPage(newPage);
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage);
        window.history.pushState({page: newPage}, '', `${window.location.pathname}?${params.toString()}`);
    };

	const getSortIndicator = (key) => {
		if (!isAbleToSort || sortConfig.key !== key) return null;
		return sortConfig.direction === "asc" ? " ↑" : " ↓";
	};

	const startItem = showPagination ? (paginationData.currentPage - 1) * itemsPerPage + 1 : 1;
	const endItem = showPagination ? Math.min(paginationData.currentPage * itemsPerPage, paginationData.totalItems) : transactions.length;

	const statusColorMap = {
		Delivered: "bg-green/10 text-green",
		Completed: "bg-green/10 text-green",
		"In Transit": "bg-orange/10 text-orange",
		Pending: "bg-yellow-500/20 text-yellow-400",
		Canceled: "bg-red/10 text-red",
	};

	const handleRowClick = (id) => {
		window.location.href = `/stock-transaction/details?id=${id}`;
	};

	return (
		<div className="flex flex-col">
			<table className="stock-table">
				<thead>
					<tr>
						<th className={`table-header ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("invoice_no")}>
							Invoice no{getSortIndicator("invoice_no")}
						</th>
						<th className={`table-header ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("transaction_datetime")}>
							Date{getSortIndicator("transaction_datetime")}
						</th>
						<th className="table-header">Total Items</th>
						<th className="table-header">Type</th>
						<th className={`table-header text-center ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("status")}>
							Status{getSortIndicator("status")}
						</th>
					</tr>
				</thead>
				<tbody>
					{loading ? (
						Array.from({ length: tableLimit }).map((_, index) => <SkeletonRow key={index} columns={5} />)
					) : (
						<>
							{transactions.map((log) => (
								<tr key={log.id} className="table-row item" onClick={() => handleRowClick(log.id)}>
									<td className="table-data">{log.invoice_no}</td>
									<td className="table-data">{log.transaction_datetime}</td>
									<td className="table-data">{log.items_count}</td>
									<td className="table-data">{log.type_name}</td>
									<td className="table-data text-center">
										<span
											className={`inline-block w-[6rem] px-3 py-1 text-sm font-semibold rounded-full ${
												statusColorMap[log.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"
											}`}>
											{log.status}
										</span>
									</td>
								</tr>
							))}
							{Array.from({ length: Math.max(0, tableLimit - transactions.length) }).map((_, index) => (
								<BlankRow key={`blank-${index}`} columns={5} />
							))}
						</>
					)}
				</tbody>
			</table>

			{showPagination && !loading && <Pagination paginationData={paginationData} handlePageChange={handlePageChange} startItem={startItem} endItem={endItem} />}
		</div>
	);
}
