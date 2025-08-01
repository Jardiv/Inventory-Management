import { useEffect, useState } from "react";
import DetailsModal from "./DetailsModal";

// Skeleton row component
const SkeletonRow = () => (
	<tr className="table-row">
		<td className="table-data"><div className="skeleton-loading"></div></td>
		<td className="table-data"><div className="skeleton-loading"></div></td>
		<td className="table-data"><div className="skeleton-loading"></div></td>
		<td className="table-data"><div className="skeleton-loading"></div></td>
		<td className="table-data"><div className="skeleton-loading"></div></td>
		<td className="table-data"><div className="skeleton-loading"></div></td>
		<td className="table-data"><div className="skeleton-loading"></div></td>
	</tr>
);

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

export default function LogsTable({ limit, showPagination = false, currentPage = 1, itemsPerPage = 10 }) {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [paginationData, setPaginationData] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	const [selectedTransactionId, setSelectedTransactionId] = useState(null);

	const tableLimit = showPagination ? itemsPerPage : (parseInt(limit) || 10);

	useEffect(() => {
		async function fetchTransactions() {
			setLoading(true);
			try {
				const offset = showPagination ? (currentPage - 1) * itemsPerPage : 0;
				const fetchLimit = showPagination ? itemsPerPage : limit;

				const res = await fetch(`/api/transactions/transactions/?limit=${fetchLimit}&offset=${offset}`);
				const data = await res.json();

				setTransactions(data.transactions || []);

				if (showPagination && data.total !== undefined) {
					const totalPages = Math.ceil(data.total / itemsPerPage);
					setPaginationData({
						currentPage: currentPage,
						totalPages: totalPages,
						totalItems: data.total,
						hasNextPage: currentPage < totalPages,
						hasPreviousPage: currentPage > 1,
					});
				}
			} catch (err) {
				console.error("Error fetching transactions:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchTransactions();
	}, [limit, currentPage, itemsPerPage, showPagination]);

	const generatePaginationPages = (currentPage, totalPages) => {
		const pages = [];
		const pageSet = new Set();
		if (totalPages > 0) { pages.push(1); pageSet.add(1); }
		if (currentPage > 4) pages.push("...");
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		for (let i = start; i <= end; i++) {
			if (!pageSet.has(i)) { pages.push(i); pageSet.add(i); }
		}
		if (currentPage < totalPages - 3) pages.push("...");
		if (totalPages > 1 && !pageSet.has(totalPages)) { pages.push(totalPages); pageSet.add(totalPages); }
		return pages;
	};

	const paginationPages = generatePaginationPages(paginationData.currentPage, paginationData.totalPages);

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
		if(id) setSelectedTransactionId(id);
	};

	const handleCloseModal = () => {
		setSelectedTransactionId(null);
	};

	return (
		<div className="flex flex-col">
			<table className="stock-table">
				<thead>
					<tr>
						<th className="table-header">Invoice no</th>
						<th className="table-header">Date</th>
						<th className="table-header">Item Name</th>
						<th className="table-header">Quantity</th>
						<th className="table-header">Type</th>
						<th className="table-header">Supplier</th>
						<th className="table-header text-center">Status</th>
					</tr>
				</thead>
				<tbody>
					{loading ? (
						Array.from({ length: tableLimit }).map((_, index) => <SkeletonRow key={index} />)
					) : (
						<>
							{transactions.map((log) => (
								<tr key={log.id} className="table-row item" onClick={() => handleRowClick(log.id)}>
									<td className="table-data">{log.invoice_no}</td>
									<td className="table-data">{log.transaction_datetime}</td>
									<td className="table-data">{log.item_name}</td>
									<td className="table-data">{log.quantity}</td>
									<td className="table-data">{log.transaction_type_name}</td>
									<td className="table-data">{log.supplier_name}</td>
									<td className="table-data text-center">
										<span className={`inline-block text-center px-3 py-1 text-sm font-semibold rounded-full ${statusColorMap[log.status] || 'bg-textColor-tertiary/10 text-textColor-tertiary'}`}>
											{log.status}
										</span>
									</td>
								</tr>
							))}
							{Array.from({ length: Math.max(0, tableLimit - transactions.length) }).map((_, index) => <BlankRow key={`blank-${index}`} />)}
						</>
					)}
				</tbody>
			</table>

			{showPagination && !loading && (
				<div className="flex justify-between items-center pt-6 flex-shrink-0 mt-4">
					<div className="text-textColor-tertiary text-sm">
						{paginationData.totalItems > 0 ? `Showing ${startItem}-${endItem} of ${paginationData.totalItems} transactions` : "No transactions found"}
					</div>
					{paginationData.totalItems > 0 && paginationData.totalPages > 1 && (
						<div className="flex items-center gap-1">
							<a href={paginationData.hasPreviousPage ? `?page=${paginationData.currentPage - 1}` : "#"} className={`p-2 rounded-md transition-colors ${paginationData.hasPreviousPage ? "text-textColor-primary hover:bg-tbl-hover" : "text-gray-500 cursor-not-allowed"}`}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
							</a>
							{paginationPages.map((page, index) => page === "..." ? <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span> : <a key={`page-${page}`} href={`?page=${page}`} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${page === paginationData.currentPage ? "bg-btn-primary text-white hover:bg-btn-hover" : "text-textColor-primary hover:bg-tbl-hover hover:text-white"}`}>{page}</a>)}
							<a href={paginationData.hasNextPage ? `?page=${paginationData.currentPage + 1}` : "#"} className={`p-2 rounded-md transition-colors ${paginationData.hasNextPage ? "text-textColor-primary hover:bg-tbl-hover" : "text-gray-500 cursor-not-allowed"}`}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
							</a>
						</div>
					)}
				</div>
			)}

			{selectedTransactionId && <DetailsModal transactionId={selectedTransactionId} onClose={handleCloseModal} />}
		</div>
	);
}