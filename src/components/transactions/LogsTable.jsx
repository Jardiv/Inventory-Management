import { useEffect, useState } from "react";
import DetailsModal from "./DetailsModal";

// Skeleton row component for loading state
const SkeletonRow = () => (
	<tr className="table-row">
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
		<td className="table-data">
			<div className="skeleton-loading"></div>
		</td>
	</tr>
);

// Blank row component to fill empty space in tables
const BlankRow = () => (
	<tr className="table-row">
		<td className="table-data">&nbsp;</td>
		<td className="table-data">&nbsp;</td>
		<td className="table-data">&nbsp;</td>
		<td className="table-data">&nbsp;</td>
		<td className="table-data">&nbsp;</td>
		<td className="table-data">&nbsp;</td>
		<td className="table-data">&nbsp;</td>
	</tr>
);

/**
 * LogsTable component displays a table of transaction logs with pagination, sorting, and date filtering.
 * @param {number} limit - Maximum number of items to display if pagination is not shown.
 * @param {boolean} showPagination - Whether to display pagination controls.
 * @param {number} currentPage - The current page number for pagination.
 * @param {number} itemsPerPage - Number of items to display per page when pagination is active.
 */
export default function LogsTable({ limit, showPagination = false, currentPage = 1, itemsPerPage = 10 }) {
	console.log("LogsTable: Component rendering...", { showPagination, currentPage, itemsPerPage, limit });

	// Ensure numeric props are correctly typed, providing default values.
	const numItemsPerPage = parseInt(itemsPerPage, 10) || 10;
	const numLimit = parseInt(limit, 10) || 10;
	
	const [clientCurrentPage, setClientCurrentPage] = useState(parseInt(currentPage, 10) || 1);
	
	// State to store the fetched transactions
	const [transactions, setTransactions] = useState([]);
	console.log("LogsTable: Initial transactions state set to:", []);
	
	// State to manage loading status
	const [loading, setLoading] = useState(true);
	console.log("LogsTable: Initial loading state set to:", true);
	
	// State to store pagination-related data
	const [paginationData, setPaginationData] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	console.log("LogsTable: Initial paginationData state set to:", {
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	
	// State to store the ID of the selected transaction for modal display
	const [selectedTransactionId, setSelectedTransactionId] = useState(null);
	console.log("LogsTable: Initial selectedTransactionId state set to:", null);
	
	// State to manage sorting configuration (key and direction)
	const [sortConfig, setSortConfig] = useState({ key: "transaction_datetime", direction: "desc" });
	console.log("LogsTable: Initial sortConfig state set to:", { key: "transaction_datetime", direction: "desc" });
	
	// State to store the selected date range for filtering
	const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
	console.log("LogsTable: Initial dateRange state set to:", { startDate: "", endDate: "" });

	// Determine the effective limit for fetching data
	const tableLimit = showPagination ? numItemsPerPage : numLimit;
	console.log("LogsTable: tableLimit calculated as:", tableLimit, "from showPagination:", showPagination, "itemsPerPage:", numItemsPerPage, "limit:", numLimit);

	// Effect hook to read sort and date parameters from URL on initial load
	useEffect(() => {
		console.log("LogsTable: Mount useEffect running to read URL params.");
		const params = new URLSearchParams(window.location.search);
		console.log("LogsTable: URLSearchParams created from:", window.location.search);

		const pageFromUrl = parseInt(params.get("page"), 10);
        if (pageFromUrl) {
            setClientCurrentPage(pageFromUrl);
        }
		
		const sortBy = params.get("sortBy");
		const sortOrder = params.get("sortOrder");
		const startDate = params.get("startDate");
		const endDate = params.get("endDate");
		const search = params.get("search");
		
		console.log("LogsTable: URL params extracted - sortBy:", sortBy, "sortOrder:", sortOrder, "startDate:", startDate, "endDate:", endDate, "search:", search);

		if (sortBy && sortOrder) {
			console.log("LogsTable: Found sort params in URL, setting sort config.", { sortBy, sortOrder });
			const newSortConfig = { key: sortBy, direction: sortOrder };
			setSortConfig(newSortConfig);
			console.log("LogsTable: setSortConfig called with:", newSortConfig);
		} else {
			console.log("LogsTable: No sort params found in URL.");
		}

		if (startDate || endDate) {
			console.log("LogsTable: Found date params in URL, setting date range.", { startDate, endDate });
			const newDateRange = { startDate: startDate || "", endDate: endDate || "" };
			setDateRange(newDateRange);
			console.log("LogsTable: setDateRange called with:", newDateRange);
		} else {
			console.log("LogsTable: No date params found in URL.");
		}

		if (search) {
			console.log("LogsTable: Found search param in URL.", { search });
			// You might want to store the search query in state as well
		} else {
			console.log("LogsTable: No search param in URL.");
		}
	}, []); // Empty dependency array means this effect runs once on mount

	// Effect hook to fetch transactions whenever relevant dependencies change
	useEffect(() => {
		console.log("LogsTable: Fetch useEffect triggered with dependencies:", {
			limit: numLimit,
			currentPage: clientCurrentPage,
			itemsPerPage: numItemsPerPage,
			showPagination,
			sortConfig,
			dateRange
		});
		
		const controller = new AbortController(); // Create an AbortController to cancel fetch requests
		const { signal } = controller; // Get the signal from the controller
		console.log("LogsTable: AbortController created");

		// Async function to fetch transaction data from the API
		async function fetchTransactions() {
			console.log("LogsTable: fetchTransactions started.");
			try {
				// Add delay to test skeleton loading (remove in production)
				await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
				
				// Calculate offset for pagination
				const offset = showPagination ? (clientCurrentPage - 1) * numItemsPerPage : 0;
				console.log("LogsTable: offset calculated as:", offset, "from showPagination:", showPagination, "currentPage:", clientCurrentPage, "itemsPerPage:", numItemsPerPage);
				
				// Determine the limit for the API call
				const fetchLimit = showPagination ? numItemsPerPage : numLimit;
				console.log("LogsTable: fetchLimit set to:", fetchLimit, "from showPagination:", showPagination, "itemsPerPage:", numItemsPerPage, "limit:", numLimit);

				// Construct the API URL with pagination, sorting, and date range parameters
				const params = new URLSearchParams(window.location.search);
				const search = params.get("search");
				console.log("LogsTable: search param from URL:", search);
				
				let url = `/api/transactions/transactions/?limit=${fetchLimit}&offset=${offset}&sortBy=${sortConfig.key}&sortOrder=${sortConfig.direction}`;
				console.log("LogsTable: Base URL constructed:", url);
				
				if (dateRange.startDate) {
					url += `&startDate=${dateRange.startDate}`;
					console.log("LogsTable: Added startDate to URL:", dateRange.startDate, "New URL:", url);
				}
				if (dateRange.endDate) {
					url += `&endDate=${dateRange.endDate}`;
					console.log("LogsTable: Added endDate to URL:", dateRange.endDate, "New URL:", url);
				}
				if (search) {
					url += `&search=${search}`;
					console.log("LogsTable: Added search to URL:", search, "New URL:", url);
				}
				console.log("LogsTable: Final URL for fetch:", url);
				
				// Fetch data from the API
				const res = await fetch(url, { signal });
				console.log("LogsTable: Fetch response received - ok:", res.ok, "status:", res.status, "statusText:", res.statusText);

				const data = await res.json();
				console.log("LogsTable: Response data parsed:", data);

				// If the fetch was not aborted, update state
				if (!signal.aborted) {
					console.log("LogsTable: Request not aborted. Updating state.");
					const newTransactions = data.transactions || [];
					setTransactions(newTransactions);
					console.log("LogsTable: setTransactions called with:", newTransactions, "Length:", newTransactions.length);

					// If pagination is enabled and total items are available, update pagination data
					if (showPagination && data.total !== undefined) {
						console.log("LogsTable: Updating pagination data with total:", data.total);
						const totalPages = Math.ceil(data.total / numItemsPerPage);
						console.log("LogsTable: totalPages calculated as:", totalPages, "from data.total:", data.total, "itemsPerPage:", numItemsPerPage);
						
						const newPaginationData = {
							currentPage: clientCurrentPage,
							totalPages: totalPages,
							totalItems: data.total,
							hasNextPage: clientCurrentPage < totalPages,
							hasPreviousPage: clientCurrentPage > 1,
						};
						console.log("LogsTable: setPaginationData called with:", newPaginationData);
						setPaginationData(newPaginationData);
					} else {
						console.log("LogsTable: Not updating pagination data - showPagination:", showPagination, "data.total:", data.total);
					}
				} else {
					console.log("LogsTable: Request was aborted, skipping state updates.");
				}
			} catch (err) {
				// Handle errors, ignoring AbortError which occurs on component unmount or re-render
				if (err.name !== "AbortError") {
					console.error("LogsTable: Error fetching transactions:", err);
				} else {
					console.log("LogsTable: Fetch aborted (caught AbortError).");
				}
			} finally {
				// Set loading to false after fetch completes (or is aborted)
				if (!signal.aborted) {
					console.log("LogsTable: fetchTransactions finally block. Setting loading to false.");
					setLoading(false);
					console.log("LogsTable: setLoading called with:", false);
				} else {
					console.log("LogsTable: fetchTransactions finally block. Request was aborted, not changing loading state.");
				}
			}
		}

		const newLoadingState = true;
		setLoading(newLoadingState);
		console.log("LogsTable: setLoading called with:", newLoadingState);
		fetchTransactions(); // Call the fetch function

		// Cleanup function to abort the fetch request if the component unmounts or dependencies change
		return () => {
			console.log("LogsTable: useEffect cleanup. Aborting fetch controller.");
			controller.abort();
		};
	}, [numLimit, clientCurrentPage, numItemsPerPage, showPagination, sortConfig, dateRange]); // Dependencies for this effect

	// Function to handle sorting requests when a table header is clicked
	const requestSort = (key) => {
		console.log("LogsTable: requestSort called for key:", key);
		console.log("LogsTable: Current sortConfig:", sortConfig);
		
		let direction = "asc";
		// If the same key is clicked again, toggle the sort direction
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
			console.log("LogsTable: Toggling sort direction to 'desc'.");
		} else {
			console.log("LogsTable: Setting sort direction to 'asc'.");
		}
		
		const newSortConfig = { key, direction };
		console.log("LogsTable: setSortConfig will be called with:", newSortConfig);
		setSortConfig(newSortConfig); // Update sort configuration
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

	// Function to get the sort indicator (arrow) for table headers
	const getSortIndicator = (key) => {
		console.log("LogsTable: getSortIndicator called for key:", key, "current sortConfig:", sortConfig);
		if (sortConfig.key !== key) {
			console.log("LogsTable: No indicator for key:", key);
			return null; // No indicator if not the current sort key
		}
		const indicator = sortConfig.direction === "asc" ? " ↑" : " ↓";
		console.log("LogsTable: Returning indicator:", indicator, "for key:", key);
		return indicator; // Return up or down arrow
	};

	// Function to generate an array of page numbers for pagination display
	const generatePaginationPages = (currentPage, totalPages) => {
		console.log("LogsTable: generatePaginationPages called with currentPage:", currentPage, "totalPages:", totalPages);
		const pages = [];
		const pageSet = new Set(); // Use a Set to avoid duplicate page numbers
		
		if (totalPages > 0) {
			pages.push(1);
			pageSet.add(1);
			console.log("LogsTable: Added page 1 to pages array");
		} // Always include the first page
		
		if (currentPage > 4) {
			pages.push("...");
			console.log("LogsTable: Added ellipsis before current page range");
		} // Add ellipsis if current page is far from the beginning
		
		const start = Math.max(2, currentPage - 1); // Determine start of visible page range
		const end = Math.min(totalPages - 1, currentPage + 1); // Determine end of visible page range
		console.log("LogsTable: Page range calculated - start:", start, "end:", end);
		
		for (let i = start; i <= end; i++) {
			if (!pageSet.has(i)) {
				pages.push(i);
				pageSet.add(i);
				console.log("LogsTable: Added page", i, "to pages array");
			} // Add pages within the range
		}
		
		if (currentPage < totalPages - 3) {
			pages.push("...");
			console.log("LogsTable: Added ellipsis after current page range");
		} // Add ellipsis if current page is far from the end
		
		if (totalPages > 1 && !pageSet.has(totalPages)) {
			pages.push(totalPages);
			pageSet.add(totalPages);
			console.log("LogsTable: Added last page", totalPages, "to pages array");
		} // Always include the last page
		
		console.log("LogsTable: Final pages array:", pages);
		return pages;
	};

	// Generate pagination pages based on current data
	const paginationPages = generatePaginationPages(paginationData.currentPage, paginationData.totalPages);
	console.log("LogsTable: paginationPages generated:", paginationPages);

	// Calculate the starting and ending item numbers for display
	const startItem = showPagination ? (paginationData.currentPage - 1) * numItemsPerPage + 1 : 1;
	const endItem = showPagination ? Math.min(paginationData.currentPage * numItemsPerPage, paginationData.totalItems) : transactions.length;
	console.log("LogsTable: Item range calculated - startItem:", startItem, "endItem:", endItem);

	// Map for status-based color styling
	const statusColorMap = {
		Delivered: "bg-green/10 text-green",
		Completed: "bg-green/10 text-green",
		"In Transit": "bg-orange/10 text-orange",
		Pending: "bg-yellow-500/20 text-yellow-400",
		Canceled: "bg-red/10 text-red",
	};
	console.log("LogsTable: statusColorMap defined:", statusColorMap);

	// Handler for clicking a table row to open the details modal
	const handleRowClick = (id) => {
		console.log("LogsTable: handleRowClick called with id:", id);
		if (id) {
			setSelectedTransactionId(id);
			console.log("LogsTable: setSelectedTransactionId called with:", id);
		} else {
			console.log("LogsTable: handleRowClick called with invalid id.");
		}
	};

	// Handler to close the details modal
	const handleCloseModal = () => {
		console.log("LogsTable: handleCloseModal called.");
		setSelectedTransactionId(null);
		console.log("LogsTable: setSelectedTransactionId called with:", null);
	};

	console.log("LogsTable: About to render with current state:", {
		loading,
		transactions: transactions.length,
		paginationData,
		sortConfig,
		dateRange,
		selectedTransactionId
	});

	return (
		<div className="flex flex-col">
			<table className="stock-table">
				<thead>
					<tr>
						{/* Table headers with sorting functionality */}
						<th className="table-header cursor-pointer" onClick={() => requestSort("invoice_no")}>
							Invoice no{getSortIndicator("invoice_no")}
						</th>
						<th className="table-header cursor-pointer" onClick={() => requestSort("transaction_datetime")}>
							Date{getSortIndicator("transaction_datetime")}
						</th>
						<th className="table-header">Item Name</th>
						<th className="table-header cursor-pointer" onClick={() => requestSort("quantity")}>
							Quantity{getSortIndicator("quantity")}
						</th>
						<th className="table-header">Type</th>
						<th className="table-header">Supplier</th>
						<th className="table-header text-center cursor-pointer" onClick={() => requestSort("status")}>
							Status{getSortIndicator("status")}
						</th>
					</tr>
				</thead>
				<tbody>
					{/* Conditional rendering for loading state or actual data */}
					{loading ? (
						// Display skeleton rows while loading
						Array.from({ length: tableLimit }).map((_, index) => {
							console.log("LogsTable: Rendering skeleton row", index);
							return <SkeletonRow key={index} />;
						})
					) : (
						<>
							{/* Map through transactions and render each row */}
							{transactions.map((log, index) => {
								console.log("LogsTable: Rendering transaction row", index, "with data:", log);
								return (
									<tr key={log.id} className="table-row item" onClick={() => handleRowClick(log.id)}>
										<td className="table-data">{log.invoice_no}</td>
										<td className="table-data">{log.transaction_datetime}</td>
										<td className="table-data">{log.item_name}</td>
										<td className="table-data">{log.quantity}</td>
										<td className="table-data">{log.type_name}</td>
										<td className="table-data">{log.supplier_name || "---"}</td>
										<td className="table-data text-center">
											{/* Display status with dynamic styling */}
											<span
												className={`inline-block text-center px-3 py-1 text-sm font-semibold rounded-full ${
													statusColorMap[log.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"
												}`}>
												{log.status}
											</span>
										</td>
									</tr>
								);
							})}
							{/* Fill remaining rows with blank rows if fewer transactions than tableLimit */}
							{Array.from({ length: Math.max(0, tableLimit - transactions.length) }).map((_, index) => {
								console.log("LogsTable: Rendering blank row", index);
								return <BlankRow key={`blank-${index}`} />;
							})}
						</>
					)}
				</tbody>
			</table>

			{/* Pagination controls, shown only if showPagination is true and not loading */}
			{showPagination && !loading && (
				<div className="flex justify-between items-center pt-6 flex-shrink-0 mt-4">
					{/* Displaying current item range and total items */}
					<div className="text-textColor-tertiary text-sm">
						{paginationData.totalItems > 0
							? `Showing ${startItem}-${endItem} of ${paginationData.totalItems} transactions`
							: "No transactions found"}
					</div>
					{/* Pagination buttons */}
					{paginationData.totalItems > 0 && paginationData.totalPages > 1 && (
						<div className="flex items-center gap-1">
							{/* Previous page button */}
							<a
								href="#"
								onClick={(e) => handlePageChange(e, paginationData.currentPage - 1)}
								className={`p-2 rounded-md transition-colors ${
									paginationData.hasPreviousPage ? "text-textColor-primary hover:bg-tbl-hover" : "text-gray-500 cursor-not-allowed"
								}`}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="1.5"
									stroke="currentColor"
									className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
								</svg>
							</a>
							{/* Page number buttons */}
							{paginationPages.map((page, index) =>
								page === "..." ? (
									<span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
										...
									</span>
								) : (
									<a
										key={`page-${page}`}
										href="#"
										onClick={(e) => handlePageChange(e, page)}
										className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
											page === paginationData.currentPage
												? "bg-btn-primary text-white hover:bg-btn-hover"
												: "text-textColor-primary hover:bg-tbl-hover hover:text-white"
										}`}>
										{page}
									</a>
								)
							)}
							{/* Next page button */}
							<a
								href="#"
								onClick={(e) => handlePageChange(e, paginationData.currentPage + 1)}
								className={`p-2 rounded-md transition-colors ${
									paginationData.hasNextPage ? "text-textColor-primary hover:bg-tbl-hover" : "text-gray-500 cursor-not-allowed"
								}`}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="1.5"
									stroke="currentColor"
									className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
								</svg>
							</a>
						</div>
					)}
				</div>
			)}

			{/* Details modal, shown when a transaction is selected */}
			{selectedTransactionId && <DetailsModal transactionId={selectedTransactionId} onClose={handleCloseModal} />}
		</div>
	);
}