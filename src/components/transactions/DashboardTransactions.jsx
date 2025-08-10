import React, { useState, useEffect } from "react";

const DashboardTransactionSkeleton = () => (
    <li className="p-2 rounded-md flex justify-between items-center">
        <div className="w-1/2">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-4 w-1/2 justify-end">
            <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded-full w-24 animate-pulse"></div>
        </div>
    </li>
);

export default function DashboardTransactions() {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				const response = await fetch("/api/transactions/logs?limit=5&sortBy=updated_at&sortOrder=desc");
				const data = await response.json();
				if (data.transactions) {
					setTransactions(data.transactions);
				}
			} catch (error) {
				console.error("Error fetching recent transactions:", error);
			} finally {
				setTimeout(() => setLoading(false), 500); // Simulate loading
			}
		};

		fetchTransactions();
	}, []);

	const handleRowClick = (id) => {
		window.location.href = `/transaction/details?id=${id}`;
	};

	return (
		<div className="flex flex-col gap-1 w-full bg-primary rounded-lg">
			<div className="w-full flex justify-between sticky bg-primary p-4 top-0">
				<h1 className="text-xl font-bold">Recent Transactions</h1>
				<a href="/transaction/logs/" className="w-fit">
					<button className="text-btn-primary hover:text-purple-300 text-sm sm:text-base cursor-pointer">See All</button>
				</a>
			</div>
			<div className="p-2">
				{loading ? (
					<ul className="flex flex-col gap-2">
                        {[...Array(5)].map((_, i) => <DashboardTransactionSkeleton key={i} />)}
                    </ul>
				) : (
					<ul className="flex flex-col gap-2">
						{transactions.map((tx) => (
							<li
								key={tx.id}
								onClick={() => handleRowClick(tx.id)}
								className="p-2 rounded-md hover:bg-tbl-hover cursor-pointer flex justify-between items-center">
								<div>
									<p className="font-semibold">{tx.invoice_no}</p>
									<p className="text-sm text-textColor-tertiary">{tx.transaction_datetime}</p>
								</div>
								<div className="flex items-center gap-4">
									<p className="font-semibold w-24 text-left">
										{tx.warehouse_name && "Stock Out"}
										{tx.supplier_name && "Stock In"}
									</p>
									<span
										className={`inline-block w-[6rem] text-center px-3 py-1 text-sm font-semibold rounded-full ${
											{
												Delivered: "bg-green/10 text-green",
												Completed: "bg-green/10 text-green",
												"In Transit": "bg-orange/10 text-orange",
												Pending: "bg-yellow-500/20 text-yellow-400",
												Canceled: "bg-red/10 text-red",
											}[tx.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"
										}`}>
										{tx.status}
									</span>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}