import { useEffect, useState } from "react";
import DetailsModal from "./DetailsModal";
import { SkeletonRow } from "./utils/SkeletonRow";
import { BlankRow } from "./utils/BlankRow";
import Pagination from "./utils/Pagination";

/**
 * StockInTable component displays a table of stock-in transactions with pagination, sorting, and date filtering.
 * @param {number} limit - Maximum number of items to display if pagination is not shown.
 * @param {boolean} showPagination - Whether to display pagination controls.
 * @param {number} currentPage - The current page number for pagination.
 * @param {number} itemsPerPage - Number of items to display per page when pagination is active.
 * @param {boolean} isAbleToSort - Whether sorting is enabled.
 */
export default function StockInTable({ isAbleToSort = true, limit, showPagination = false, currentPage = 1, itemsPerPage = 10 }) {
	// State to store the fetched transactions
	const [transactions, setTransactions] = useState([]);
	// State to manage loading status
	const [loading, setLoading] = useState(true);
	// State to store pagination-related data
	const [paginationData, setPaginationData] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	// State to store the ID of the selected transaction for modal display
	const [selectedTransactionId, setSelectedTransactionId] = useState(null);
	// State to manage sorting configuration (key and direction)
	const [sortConfig, setSortConfig] = useState({ key: "transaction_datetime", direction: "desc" });
	// State to store the selected date range for filtering
	const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

	const [clientCurrentPage, setClientCurrentPage] = useState(parseInt(currentPage, 10) || 1);

	// Determine the effective limit for fetching data
	const tableLimit = showPagination ? itemsPerPage : parseInt(limit) || 10;

	// Effect hook to listen for date range changes from other components (e.g., a date picker)
	useEffect(() => {
		const handleDateChange = (event) => {
			setDateRange(event.detail); // Update dateRange state with the new values
		};
		// Add event listener for 'dateRangeChanged' custom event
		document.addEventListener("dateRangeChanged", handleDateChange);
		// Cleanup function to remove the event listener when the component unmounts
		return () => document.removeEventListener("dateRangeChanged", handleDateChange);
	}, []); // Empty dependency array means this effect runs once on mount

	// Effect hook to read sort and date parameters from URL on initial load
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
			setSortConfig({ key: sortBy, direction: sortOrder }); // Set sort config from URL params
		}

		if (startDate || endDate) {
			setDateRange({ startDate: startDate || "", endDate: endDate || "" });
		}
	}, []); // Empty dependency array means this effect runs once on mount

	// Effect hook to fetch transactions whenever relevant dependencies change
	useEffect(() => {
		const controller = new AbortController(); // Create an AbortController to cancel fetch requests
		const { signal } = controller; // Get the signal from the controller

		// Async function to fetch transaction data from the API
		async function fetchTransactions() {
			setLoading(true); // Set loading to true before fetching
			try {
				// Calculate offset for pagination
				const offset = showPagination ? (clientCurrentPage - 1) * itemsPerPage : 0;
				// Determine the limit for the API call
				const fetchLimit = showPagination ? itemsPerPage : limit;
				// Construct the API URL with pagination, sorting, and date range parameters, specifically for 'in' direction
				let url = `/api/transactions/transactions/?direction=in&limit=${fetchLimit}&offset=${offset}&sortBy=${sortConfig.key}&sortOrder=${sortConfig.direction}`;
				if (dateRange.startDate) url += `&startDate=${dateRange.startDate}`;
				if (dateRange.endDate) url += `&endDate=${dateRange.endDate}`;

				// Fetch data from the API
				const res = await fetch(url, { signal });
				const data = await res.json();

				// If the fetch was not aborted, update state
				if (!signal.aborted) {
					setTransactions(data.transactions || []);

					// If pagination is enabled and total items are available, update pagination data
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
				// Handle errors, ignoring AbortError which occurs on component unmount or re-render
				if (err.name !== "AbortError") {
					console.error("Error fetching transactions:", err);
				}
			} finally {
				// Set loading to false after fetch completes (or is aborted)
				if (!signal.aborted) {
					setLoading(false);
				}
			}
		}

		fetchTransactions(); // Call the fetch function

		// Cleanup function to abort the fetch request if the component unmounts or dependencies change
		return () => {
			controller.abort();
		};
	}, [limit, clientCurrentPage, itemsPerPage, showPagination, sortConfig, dateRange]); // Dependencies for this effect

	// Function to handle sorting requests when a table header is clicked
	const requestSort = (key) => {
		if (!isAbleToSort) return;
		let direction = "asc";
		// If the same key is clicked again, toggle the sort direction
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction }); // Update sort configuration
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
		if (!isAbleToSort || sortConfig.key !== key) return null; // No indicator if not the current sort key
		return sortConfig.direction === "asc" ? " ↑" : " ↓"; // Return up or down arrow
	};

	// Calculate the starting and ending item numbers for display
	const startItem = showPagination ? (paginationData.currentPage - 1) * itemsPerPage + 1 : 1;
	const endItem = showPagination ? Math.min(paginationData.currentPage * itemsPerPage, paginationData.totalItems) : transactions.length;

	// Map for status-based color styling
	const statusColorMap = {
		Delivered: "bg-green/10 text-green",
		Completed: "bg-green/10 text-green",
		"In Transit": "bg-orange/10 text-orange",
		Pending: "bg-yellow-500/20 text-yellow-400",
		Canceled: "bg-red/10 text-red",
	};

	// Handler for clicking a table row to open the details modal
	const handleRowClick = (id) => {
		if (id) setSelectedTransactionId(id);
	};

	// Handler to close the details modal
	const handleCloseModal = () => {
		setSelectedTransactionId(null);
	};

	return (
		<div className="flex flex-col">
			<table className="stock-table">
				<thead className="py-20">
					<tr>
						{/* Table headers with sorting functionality */}
						<th className={`table-header ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("invoice_no")}>
							Invoice no{getSortIndicator("invoice_no")}
						</th>
						<th className={`table-header ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("transaction_datetime")}>
							Date{getSortIndicator("transaction_datetime")}
						</th>
						<th className="table-header">Item</th>
						<th className={`table-header ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("quantity")}>
							Amount{getSortIndicator("quantity")}
						</th>
						<th className="table-header">Supplier</th>
						<th className={`table-header ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("type")}>
							Type{getSortIndicator("type")}
						</th>
						<th className={`table-header text-center ${isAbleToSort ? "cursor-pointer" : ""}`} onClick={() => requestSort("status")}>
							Status{getSortIndicator("status")}
						</th>
					</tr>
				</thead>
				<tbody>
					{/* Conditional rendering for loading state or actual data */}
					{loading ? (
						// Display skeleton rows while loading
						Array.from({ length: tableLimit }).map((_, index) => <SkeletonRow key={index} />)
					) : (
						<>
							{/* Map through transactions and render each row */}
							{transactions.map((log) => (
								<tr key={log.id} className="table-row item" onClick={() => handleRowClick(log.id)}>
									<td className="table-data">{log.invoice_no}</td>
									<td className="table-data">{log.transaction_datetime}</td>
									<td className="table-data">{log.item_name}</td>
									<td className="table-data">{log.quantity}</td>
									<td className="table-data">{log.supplier_name}</td>
									<td className="table-data">{log.type_name}</td>
									<td className="table-data text-center">
										{/* Display status with dynamic styling */}
										<span
											className={`inline-block w-[6rem] px-3 py-1 text-sm font-semibold rounded-full ${
												statusColorMap[log.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"
											}`}>
											{log.status}
										</span>
									</td>
								</tr>
							))}
							{/* Fill remaining rows with blank rows if fewer transactions than tableLimit */}
							{Array.from({ length: Math.max(0, tableLimit - transactions.length) }).map((_, index) => (
								<BlankRow key={`blank-${index}`} />
							))}
						</>
					)}
				</tbody>
			</table>

			{showPagination && !loading && <Pagination paginationData={paginationData} handlePageChange={handlePageChange} startItem={startItem} endItem={endItem} />}

			{/* Details modal, shown when a transaction is selected */}
			{selectedTransactionId && <DetailsModal transactionId={selectedTransactionId} onClose={handleCloseModal} />}
		</div>
	);
}