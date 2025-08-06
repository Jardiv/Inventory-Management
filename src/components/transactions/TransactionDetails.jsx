import React, { useState, useEffect } from "react";

const tdStyle = "bg-background px-4 py-2";
const thStyle = "px-3 py-1";

export default function TransactionDetails({ transactionId, showSupplierDetails }) {
	const [transaction, setTransaction] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (transactionId) {
			const fetchTransactionDetails = async () => {
				try {
					const response = await fetch(`/api/transactions/details?id=${transactionId}`);
					if (response.ok) {
						const data = await response.json();
						setTransaction(data);
					}
				} catch (error) {
					console.error("Error fetching transaction details:", error);
				} finally {
					setLoading(false);
				}
			};
			fetchTransactionDetails();
		}
	}, [transactionId]);

	return (
		<div className="bg-primary px-6 py-4 rounded-lg h-full overflow-auto">
			<div className="flex justify-between h-header">
				<div>
					<h1 className="font-semibold text-2xl">Transaction Details</h1>
					<p className="text-border_color">Detailed breakdown of the transaction.</p>
				</div>
				<a href="/stock-transaction/dashboard/" className="p-2 h-fit text-textColor-primary hover:bg-btn-hover hover:text-white rounded">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.5"
						stroke="currentColor"
						className="w-5 h-5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</a>
			</div>

			{loading ? (
				<div className="grid grid-cols-5 gap-4 h-120 animate-pulse">
					<div className="col-span-3 py-4">
						<div className="h-6 bg-border_color rounded w-1/3 mb-4"></div>
						<div className="bg-background border-[0.5px] border-border_color px-4 py-2 overflow-x-auto h-full flex flex-col justify-between">
							<div className="space-y-4">
								<div className="h-4 bg-border_color rounded w-full"></div>
								<div className="h-4 bg-border_color rounded w-full"></div>
								<div className="h-4 bg-border_color rounded w-full"></div>
								<div className="h-4 bg-border_color rounded w-full"></div>
							</div>
						</div>
					</div>
					<div className="gap-20 px-8 col-span-2">
						<div className="flex flex-col">
							<div className="h-6 bg-border_color rounded w-1/3 mb-4"></div>
							<div className="space-y-4">
								<div className="h-4 bg-border_color rounded w-full"></div>
								<div className="h-4 bg-border_color rounded w-full"></div>
								<div className="h-4 bg-border_color rounded w-full"></div>
							</div>
						</div>
						{showSupplierDetails && (
							<div className="flex flex-col mt-12">
								<div className="h-6 bg-border_color rounded w-1/3 mb-4"></div>
								<div className="space-y-4">
									<div className="h-4 bg-border_color rounded w-full"></div>
									<div className="h-4 bg-border_color rounded w-full"></div>
									<div className="h-4 bg-border_color rounded w-full"></div>
								</div>
							</div>
						)}
					</div>
				</div>
			) : transaction ? (
				<div className="grid grid-cols-5 gap-4 h-[80%]">
					<div className="col-span-3 py-4">
						<h2 className="text-lg font-semibold mb-2">Item Details</h2>
						<div className="bg-background border-[0.5px] border-border_color px-4 py-2 overflow-x-auto h-full flex flex-col justify-between">
							<table className="w-full text-left table-fixed">
								<thead>
									<tr className="border-b-[0.5px]">
										<th className={`${thStyle} w-[30%]`}>Item</th>
										<th className={thStyle}>Quantity</th>
										<th className={thStyle}>Expiry Date</th>
										<th className={thStyle}>Unit Price</th>
										<th className={thStyle}>Total</th>
									</tr>
								</thead>
								<tbody>
									{transaction.items.map((item, index) => (
										<tr className="table-row" key={index}>
											<td className={`${tdStyle}`}><a href="#" className="hover:underline">{item.name}</a></td>
											<td className={`${tdStyle}`}>{item.quantity}</td>
											<td className={`${tdStyle}`}>
												{item.expiry_date ? new Date(expiry_date).toLocaleDateString() : "N/A"}
											</td>
											<td className={`${tdStyle}`}>₱ {item.unit_price}</td>
											<td className={`${tdStyle}`}>₱ {(item.unit_price * item.quantity).toFixed(2)}</td>
										</tr>
									))}
								</tbody>
								<tfoot>
									<tr className="border-t-[0.5px]">
										<td className={`${tdStyle} font-semibold`}>Totals</td>
										<td className={`${tdStyle} font-semibold`}>{transaction.total_quantity}</td>
										<td className={`${tdStyle}`}></td>
										<td className={`${tdStyle}`}></td>
										<td className={`${tdStyle} font-semibold`}>₱ {transaction.total_price}</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>

					<div className="gap-12 px-8 col-span-2 flex flex-col">
						<div className="flex flex-col">
							<h2 className="text-lg font-semibold mb-2">Primary Details</h2>
							<hr className="mb-4" />
							<table className="w-full">
								<tbody>
									<tr className="">
										<td className="font-semibold">Invoice Number</td>
										<td className="">{transaction.invoice_no}</td>
									</tr>
									<tr className="">
										<td className="font-semibold">Date</td>
										<td className="">{new Date(transaction.transaction_datetime).toLocaleDateString()}</td>
									</tr>
									<tr className="">
										<td className="font-semibold">Time</td>
										<td className="">
											{new Date(transaction.transaction_datetime).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
												hour12: true,
											})}
										</td>
									</tr>
									<tr className="">
										<td className="font-semibold">Status</td>
										<td className="">{transaction.status}</td>
									</tr>
									<tr className="">
										<td className="font-semibold">Created By</td>
										<td className="">{transaction.created_by}</td>
									</tr>
                                    <tr className="">
										<td className="font-semibold">From</td>
										<td className="">{transaction.warehouse_name}</td>
                                    </tr>
								</tbody>
							</table>
						</div>

						{transaction.supplier_name && (
							<div className="flex flex-col">
								<h2 className="text-lg font-semibold mb-2">Supplier Details</h2>
								<hr className="mb-4" />
								<table className="w-full">
									<tbody>
										<tr className="">
											<td className="font-semibold">Supplier</td>
											<td className="">{transaction.supplier_name}</td>
										</tr>
										<tr className="">
											<td className="font-semibold">Contact No</td>
											<td className="">{transaction.supplier_contact}</td>
										</tr>
										<tr className="">
											<td className="font-semibold">Location</td>
											<td className="">{transaction.supplier_location}</td>
										</tr>
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			) : (
				<div className="text-center text-textColor-tertiary py-10">No details found for this transaction.</div>
			)}
		</div>
	);
}
