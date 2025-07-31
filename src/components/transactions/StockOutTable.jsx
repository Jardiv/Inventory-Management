import { useEffect, useState } from "react";

export default function StockInTable({ limit }) {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	console.log("Limit received stock In table:", limit);

	useEffect(() => {
		if (!limit) return; 

		async function fetchTransactions() {
			try {
				const res = await fetch(`/api/transactions/stockOutTransactions?limit=${limit}`);
				console.log("Fetching from:", `/api/transactions/stockOutTransactions?limit=${limit}`);
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
		<table className="w-full text-left">
				<thead>
					<tr>
						<th class="table-header">Invoice no</th>
						<th class="table-header">Date</th>
						<th class="table-header">Type</th>
						<th class="table-header text-center">Action</th>
					</tr>
				</thead>
				<tbody>
					{transactions.map((log) => (
					<tr key="{log.id}" className="table-row">
						<td className="table-data">{log.invoice_no}</td>
						<td className="table-data">{log.transaction_datetime}</td>
						<td className="table-data">{log.source}</td>
						<td className="table-data text-center">
							<button className="table-view-btn">View</button>
						</td>
					</tr>
					))}
				</tbody>
			</table>
	);
}

// <table class="w-full text-left">
// 				<thead>
// 					<tr>
// 						<th class="table-header">Reference no</th>
// 						<th class="table-header">Date</th>
// 						<th class="table-header">Supplier</th>
// 						<th class="table-header">Status</th>
// 						<th class="table-header text-center">Action</th>
// 					</tr>
// 				</thead>
// 				<tbody>
// 					<tr class="table-row">
// 						<td class="table-data">4353923345</td>
// 						<td class="table-data">20/12/2025</td>
// 						<td class="table-data">Ecco Food Corp</td>
// 						<td class="table-data text-green">Pending</td>
// 						<td class="table-data text-center">
// 							<a href="/stockTransaction/StockDetails/?showSupplier=false ">
// 								<Button class="table-view-btn">View</Button>
// 							</a>
// 						</td>
// 					</tr>
// 					<tr class="table-row">
// 						<td class="table-data">4353923345</td>
// 						<td class="table-data">20/12/2025</td>
// 						<td class="table-data">Ecco Food Corp</td>
// 						<td class="table-data text-green">Pending</td>
// 						<td class="table-data text-center">
// 							<Button class="table-view-btn">View</Button>
// 						</td>
// 					</tr>
// 					<tr class="table-row">
// 						<td class="table-data">4353923345</td>
// 						<td class="table-data">20/12/2025</td>
// 						<td class="table-data">Ecco Food Corp</td>
// 						<td class="table-data text-green">Pending</td>
// 						<td class="table-data text-center">
// 							<Button class="table-view-btn">View</Button>
// 						</td>
// 					</tr>
// 				</tbody>
// 			</table>