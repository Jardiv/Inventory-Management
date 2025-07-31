import { useEffect, useState } from "react";

export default function StockInTable({ limit }) {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	console.log("Limit received stock In table:", limit);

	useEffect(() => {
		if (!limit) return; // optional guard

		async function fetchTransactions() {
			try {
				const res = await fetch(`/api/transactions/stockInOut?limit=${limit}`);
				console.log("Fetching from:", `/api/transactions/stockInTransactions?limit=${limit}`);
				const data = await res.json();
				setTransactions(data);
				console.log("Received data:", data);
				
			} catch (err) {
				console.error("Error fetching transactions:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchTransactions();
	}, [limit]);

	if (loading) {
		return <div className="p-4 text-gray-500">Loading...</div>;
	}
	const statusColorMap = {
		Pending: "text-yellow",
		"In Transit": "text-orange",
		Delivered: "text-green",
		Canceled: "text-red",
	};

	return (
		<table class="w-full text-left">
			<thead>
				<tr>
					<th class="table-header">Reference no</th>
					<th class="table-header">Date</th>
					<th class="table-header">Type</th>
					<th class="table-header">Supplier</th>
					<th class="table-header">Status</th>
					<th class="table-header text-center">Action</th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((log) => (
					<tr class="table-row">
						<td class="table-data">{log.ref_no}</td>
						<td class="table-data">{log.transaction_datetime}</td>
						<td class="table-data">{log.type}</td>
						<td class="table-data">{log.supplier_name}</td>
						<td class={`table-data ${statusColorMap[log.status]}`}>{log.status}</td>
						<td class="table-data text-center">
							<button class="table-view-btn">View</button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
