import { useEffect, useState } from "react";

export default function StockOutTable({ limit }) {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	console.log("Limit received stock Out table:", limit);

	useEffect(() => {
		async function fetchTransactions() {
			try {
				const res = await fetch(`/api/transactions/stockOut?limit=${limit}`);
				console.log("Fetching from:", `/api/transactions/stockOut?limit=${limit}`);
				const data = await res.json();
				setTransactions(data);
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

	console.log("Transactions out:", transactions);

	return (
		<table className="stock-table">
			<thead>
				<tr>
					<th className="table-header">Invoice no</th>
					<th className="table-header">Date</th>
					<th className="table-header">Item</th>
					<th className="table-header">Amount</th>
					<th className="table-header">Type</th>
					<th className="table-header">Status</th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((log) => (
					<tr
						key={log.id}
						className="table-row hover:bg-gray-800/30 cursor-pointer"
						onClick={() => {
							window.location.href = `/transactions/details/id=${log.id}`;
						}}>
						<td className="table-data">{log.invoice_no}</td>
						<td className="table-data">{log.transaction_datetime}</td>
						<td className="table-data">{log.item_name}</td>
						<td className="table-data">{log.quantity}</td>
						<td className="table-data">{log.transaction_type}</td>
						<td className="table-data">{log.status}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
