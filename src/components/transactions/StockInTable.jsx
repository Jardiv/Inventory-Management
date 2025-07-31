import { useEffect, useState } from "react";

export default function StockInTable({ limit }) {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	console.log("Limit received stock In table:", limit);
	limit = limit || 10;

	useEffect(() => { 
		if (!limit) return; 

		async function fetchTransactions() {
			try {
				const res = await fetch(`/api/transactions/stockIn?limit=${limit}`);
				console.log("Fetching from:", `/api/transactions/stockIn?limit=${limit}`);
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
    const statusColorMap = {
		Pending: "text-yellow",
		"In Transit": "text-orange",
		Delivered: "text-green",
		Canceled: "text-red",
	};


	return (
		<table className="stock-table">
			<thead className="py-20">
				<tr>
					<th className="table-header">Invoice no</th>
					<th className="table-header">Date</th>
					<th className="table-header">Item</th>
					<th className="table-header">Amount</th>
					<th className="table-header">Supplier</th>
					<th className="table-header">Status</th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((log) => (
					<tr key={log.id} className="table-row">
						<td className="table-data">{log.invoice_no}</td>
						<td className="table-data">{log.transaction_datetime}</td>
						<td className="table-data">{log.item_name}</td>
						<td className="table-data">{log.quantity}</td>
						<td className="table-data">{log.supplier_name}</td>
						<td
							className={`table-data ${statusColorMap[log.status]}`}>
							{log.status}
						</td>
					</tr>
				))}
			</tbody>
			
		</table>
	);
}
