import { useEffect, useState } from "react";
import { SkeletonRow } from "./utils/SkeletonRow";
import { BlankRow } from "./utils/BlankRow";
import Pagination from "./utils/Pagination";


export default function TransactionsTable({
	columns,
	direction,
	isAbleToSort = true,
	limit,
	showPagination = false,
	currentPage = 1,
	itemsPerPage = 10,
	statusFilters = [],
	searchTerm = ''
}) {
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
	const [priceRange, setPriceRange] = useState({ minPrice: "", maxPrice: "" });
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
		const hadnlePriceChange = (event) => {
			setPriceRange(event.detail);
		};
		document.addEventListener("priceRangeChanged", hadnlePriceChange);
		return () => document.removeEventListener("priceRangeChanged", hadnlePriceChange);
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
		const minPrice = params.get("minPrice");
		const maxPrice = params.get("maxPrice");

		console.log("TransactionsTable:: useEffect called");
		console.log("TransactionsTable:: params:", params);
		console.log("TransactionsTable:: sortBy:", sortBy);
		console.log("TransactionsTable:: sortOrder:", sortOrder);
		console.log("TransactionsTable:: startDate:", startDate);
		console.log("TransactionsTable:: endDate:", endDate);
		console.log("TransactionsTable:: minPrice:", minPrice);
		console.log("TransactionsTable:: maxPrice:", maxPrice);
		

		if (sortBy && sortOrder) {
			setSortConfig({ key: sortBy, direction: sortOrder });
		}

		if (startDate || endDate) {
			setDateRange({ startDate: startDate || "", endDate: endDate || "" });
		}

		if (minPrice || maxPrice) {
			console.log("TransactionsTable:: setPriceRange called");
			console.log("TransactionsTable:: useEffect minPrice:", minPrice);
			console.log("TransactionsTable:: useEffect maxPrice:", maxPrice);
			
			setPriceRange({ minPrice: minPrice || 0, maxPrice: maxPrice || null });
		}
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		async function fetchTransactions() {
			try {
				const offset = showPagination ? (clientCurrentPage - 1) * itemsPerPage : 0;
				const fetchLimit = showPagination ? itemsPerPage : limit;
				
                let basePath = '/api/transactions/logs';
                if (direction === 'in') {
                    basePath = '/api/transactions/stock-in';
                } else if (direction === 'out') {
                    basePath = '/api/transactions/stock-out';
                }

                const params = new URLSearchParams({
                    limit: fetchLimit.toString(),
                    offset: offset.toString(),
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction,
                });

                if (dateRange.startDate) params.append('startDate', dateRange.startDate);
                if (dateRange.endDate) params.append('endDate', dateRange.endDate);
				if (priceRange.minPrice) params.append('minPrice', priceRange.minPrice);
                if (priceRange.maxPrice) params.append('maxPrice', priceRange.maxPrice);
                if (searchTerm) params.append('search', searchTerm);
				
                // Add status filters if they exist
                if (statusFilters && statusFilters.length > 0) {
                    statusFilters.forEach(status => {
                        params.append('status', status);
                    });
					console.log("TransactionsTable:: statusFilters:", statusFilters);
                }

				const res = await fetch(`${basePath}?${params.toString()}`, { signal });
				const data = await res.json();
				console.log("TransactionsTable:: Transactions data:", data);
				
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

		setLoading(true);
		fetchTransactions();

		return () => {
			controller.abort();
		};
	}, [limit, clientCurrentPage, itemsPerPage, showPagination, sortConfig, dateRange, priceRange, direction, statusFilters, searchTerm]);

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
		const isSorted = isAbleToSort && sortConfig.key === key;
		const isAsc = isSorted && sortConfig.direction === 'asc';
		const isDesc = isSorted && sortConfig.direction === 'desc';

		const upArrowClasses = ['w-3', 'h-3'];
		const downArrowClasses = ['w-3', 'h-3'];

		if (isAsc) {
			downArrowClasses.push('invisible');
		} else if (isDesc) {
			upArrowClasses.push('invisible');
		} else {
			upArrowClasses.push('opacity-50');
			downArrowClasses.push('opacity-50');
		}

		return (
			<div className="flex flex-col">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={upArrowClasses.join(' ')}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={downArrowClasses.join(' ')}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
				</svg>
			</div>
		);
	};

	// Pagination logic
	const startItem = showPagination ? (paginationData.currentPage - 1) * itemsPerPage + 1 : 1;
	const endItem = showPagination ? Math.min(paginationData.currentPage * itemsPerPage, paginationData.totalItems) : transactions.length;

	const handleRowClick = (id) => {
		window.location.href = `/transaction/details?id=${id}`;
	};
	

	// Determine if there are no transactions to display
	const noTransactions = !loading && transactions.length === 0;

	return (
		<div className="flex flex-col">
			<table className="stock-table">
				<thead>
					<tr>
						{columns.map((col) => {
							// Disable sorting if no transactions are found
							const canSort = col.sortable && isAbleToSort && !noTransactions;
							return (
								<th
									key={col.accessor}
									// Apply cursor-pointer only if sorting is enabled
									className={`table-header ${canSort ? "cursor-pointer" : ""} ${col.className || ""}`}
									// Prevent onClick if sorting is disabled
									onClick={() => canSort && requestSort(col.sortKey || col.accessor)}>
									<div className="inline-flex items-center gap-2">
										{typeof col.header === 'function' ? col.header() : col.header}
										{col.sortable && isAbleToSort && getSortIndicator(col.sortKey || col.accessor)}
									</div>
								</th>
							);
						})}
					</tr>
				</thead>
				<tbody>
					{loading ? (
						Array.from({ length: tableLimit }).map((_, index) => <SkeletonRow key={index} columns={columns.length} />)
					) : noTransactions ? ( // If no transactions are found, display a message in the table body
						<tr>
							<td colSpan={columns.length} className="text-center py-4">
								No transactions found.
							</td>
						</tr>
					) : (
						<>
							{transactions.map((log) => (
								<tr key={log.id} className="table-row item" onClick={() => handleRowClick(log.id)}>
									{columns.map((col) => (
										<td key={col.accessor} className={`table-data ${col.className || ""}`}>
											{col.render ? col.render(log) : log[col.accessor]}
										</td>
									))}
								</tr>
							))}
							{Array.from({ length: Math.max(0, tableLimit - transactions.length) }).map((_, index) => (
								<BlankRow key={`blank-${index}`} columns={columns.length} />
							))}
						</>
					)}
				</tbody>
			</table>

			{/* Hide pagination if no transactions are found */}
			{showPagination && !noTransactions && (
				<Pagination paginationData={paginationData} handlePageChange={handlePageChange} startItem={startItem} endItem={endItem} loading={loading} />
			)}
		</div>
	);
}