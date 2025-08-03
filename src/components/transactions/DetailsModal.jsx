import React, { useState, useEffect, useRef } from "react";

const SkeletonLoader = () => (
	<div className="space-y-8 animate-pulse">
		{/* Primary Details Skeleton */}
		<section>
			<div className="h-5 bg-border_color rounded w-1/3 mb-4"></div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-6 bg-border_color rounded-full w-24"></div>
				</div>
			</div>
		</section>

		{/* Item Details Skeleton */}
		<section>
			<div className="h-5 bg-border_color rounded w-1/3 mb-4"></div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
			</div>
		</section>

		{/* Supplier Details Skeleton */}
		<section>
			<div className="h-5 bg-border_color rounded w-1/3 mb-4"></div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-border_color rounded w-1/2"></div>
					<div className="h-4 bg-border_color rounded w-5/6"></div>
				</div>
			</div>
		</section>
	</div>
);

const DetailsModal = ({ transactionId, onClose }) => {
	const [transaction, setTransaction] = useState(null);
	const [loading, setLoading] = useState(true);
	const modalRef = useRef();

	useEffect(() => {
		if (transactionId) {
			setLoading(true);
			// Simulate fetch delay
			setTimeout(() => {
				fetch(`/api/transactions/details?id=${transactionId}`)
					.then((res) => {
						if (!res.ok) {
							throw new Error("Network response was not ok");
						}
						return res.json();
					})
					.then((data) => {
						setTransaction(data);
						setLoading(false);
					})
					.catch((err) => {
						console.error("Error fetching transaction details:", err);
						setLoading(false);
					});
			}, 500); // 500ms delay
		}
	}, [transactionId]);

	// Close modal on outside click
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	const statusColorMap = {
		Delivered: "bg-green/10 text-green",
		Completed: "bg-green/10 text-green",
		"In Transit": "bg-orange/10 text-orange",
		Pending: "bg-yellow-500/20 text-yellow-400", // Kept as is, no theme color for yellow
		Canceled: "bg-red/10 text-red",
	};

	if (!transactionId) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
			<div ref={modalRef} className="w-full max-w-3xl bg-primary shadow-lg rounded-2xl p-8 md:p-10 space-y-8">
				<div className="flex justify-between items-start">
					<h2 className="text-2xl font-bold text-textColor-primary">Transaction Details</h2>
					<button onClick={onClose} className="text-textColor-tertiary hover:text-textColor-primary transition-colors cursor-pointer">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="2.5"
							stroke="currentColor"
							className="w-7 h-7">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{loading ? (
					<SkeletonLoader />
				) : transaction ? (
					<div className="space-y-8">
						{/* Primary Details */}
						<section>
							<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">Primary Details</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
								<div>
									<p className="text-sm text-textColor-tertiary">Invoice No</p>
									<p className="font-medium text-textColor-primary mt-1">{transaction.invoice_no}</p>
								</div>
								<div>
									<p className="text-sm text-textColor-tertiary">Date</p>
									<p className="font-medium text-textColor-primary mt-1">
										{new Date(transaction.transaction_datetime).toLocaleDateString()}
									</p>
								</div>
								<div>
									<p className="text-sm text-textColor-tertiary">Time</p>
									<p className="font-medium text-textColor-primary mt-1">
										{new Date(transaction.transaction_datetime).toLocaleTimeString()}
									</p>
								</div>
								<div>
									<p className="text-sm text-textColor-tertiary">Type</p>
									<p className="font-medium text-textColor-primary mt-1">{transaction.type_name}</p>
								</div>
								{/* <div>
									<p className="text-sm text-textColor-tertiary">Direction</p>
									<p className="font-medium text-textColor-primary mt-1 capitalize">{transaction.direction}</p>
								</div> */}
								<div>
									<p className="text-sm text-textColor-tertiary">Status</p>
									<div className="mt-1">
										<span
											className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
												statusColorMap[transaction.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"
											}`}>
											{transaction.status}
										</span>
									</div>
								</div>
							</div>
						</section>

						{/* Item Details */}
						<section>
							<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">Item Details</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
								<div>
									<p className="text-sm text-textColor-tertiary">Item</p>
									<p className="font-medium text-textColor-primary mt-1">{transaction.item_name}</p>
								</div>
								<div>
									<p className="text-sm text-textColor-tertiary">Quantity</p>
									<p className="font-medium text-textColor-primary mt-1">{transaction.quantity} units</p>
								</div>
								{transaction.unit_price && (
									<div>
										<p className="text-sm text-textColor-tertiary">Unit Price</p>
										<p className="font-medium text-textColor-primary mt-1">
											{transaction.unit_price.toLocaleString("en-US", {
												style: "currency",
												currency: "PHP",
											})}
										</p>
									</div>
								)}
								{transaction.total_price && (
									<div>
										<p className="text-sm text-textColor-tertiary">Total Price</p>
										<p className="font-medium text-textColor-primary mt-1">
											{transaction.total_price.toLocaleString("en-US", {
												style: "currency",
												currency: "PHP",
											})}
										</p>
									</div>
								)}
								<div>
									<p className="text-sm text-textColor-tertiary">Expiry Date</p>
									<p className="font-medium text-textColor-primary mt-1">
										{transaction.expiry_date ? new Date(transaction.expiry_date).toLocaleDateString() : "N/A"}
									</p>
								</div>
							</div>
						</section>

						{/* Supplier Details */}
						{transaction.supplier_name != "N/A" && transaction.supplier_contact != "N/A" && transaction.supplier_location != "N/A" && (
							<section>
								<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">
									Supplier & Other Details
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
									<div>
										<p className="text-sm text-textColor-tertiary">Supplier</p>
										<p className="font-medium text-textColor-primary mt-1">{transaction.supplier_name}</p>
									</div>
									<div>
										<p className="text-sm text-textColor-tertiary">Contact No</p>
										<p className="font-medium text-textColor-primary mt-1">{transaction.supplier_contact}</p>
									</div>
									<div>
										<p className="text-sm text-textColor-tertiary">Location</p>
										<p className="font-medium text-textColor-primary mt-1">{transaction.supplier_location}</p>
									</div>
								</div>
							</section>
						)}

						{/* Location Details */}
						{transaction.source && transaction.destination && (
							<section>
								<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">Location Info</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
									<div>
										<p className="text-sm text-textColor-tertiary">Source</p>
										<p className="font-medium text-textColor-primary mt-1">{transaction.source || "N/A"}</p>
									</div>
									<div>
										<p className="text-sm text-textColor-tertiary">Destination</p>
										<p className="font-medium text-textColor-primary mt-1">{transaction.destination || "N/A"}</p>
									</div>
								</div>
							</section>
						)}
					</div>
				) : (
					// <div className="space-y-8">
					// 	{/* Primary Details */}
					// 	<section>
					// 		<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">Primary Details</h3>
					// 		<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Invoice No</p>
					// 				<p className="font-medium text-textColor-primary mt-1">{transaction.invoice_no}</p>
					// 			</div>
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Date</p>
					// 				<p className="font-medium text-textColor-primary mt-1">
					// 					{new Date(transaction.transaction_datetime).toLocaleDateString()}
					// 				</p>
					// 			</div>
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Status</p>
					// 				<div className="mt-1">
					// 					<span
					// 						className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
					// 							statusColorMap[transaction.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"
					// 						}`}>
					// 						{transaction.status}
					// 					</span>
					// 				</div>
					// 			</div>
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Type</p>
					// 				<div className="mt-1">{transaction.type_name}</div>
					// 			</div>
					// 		</div>
					// 	</section>

					// 	{/* Item Details */}
					// 	<section>
					// 		<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">Item Details</h3>
					// 		<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Item</p>
					// 				<a href="#" className="font-medium text-textColor-primary hover:underline mt-1 block">
					// 					{transaction.item_name}
					// 				</a>
					// 			</div>
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Quantity</p>
					// 				<p className="font-medium text-textColor-primary mt-1">{transaction.quantity} units</p>
					// 			</div>
					// 			{transaction.total_price && (
					// 				<div>
					// 					<p className="text-sm text-textColor-tertiary">Total Price</p>
					// 					<p className="font-medium text-textColor-primary mt-1">
					// 						{transaction.total_price.toLocaleString("en-US", {
					// 							style: "currency",
					// 							currency: "PHP",
					// 						})}
					// 					</p>
					// 				</div>
					// 			)}

					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Expiry Date</p>
					// 				<p className="font-medium text-textColor-primary mt-1">
					// 					{transaction.expiry_date ? new Date(transaction.expiry_date).toLocaleDateString() : "N/A"}
					// 				</p>
					// 			</div>
					// 		</div>
					// 	</section>

					// 	{/* Supplier Details */}
					// 	<section>
					// 		<h3 className="text-lg font-semibold text-textColor-primary border-b border-border_color pb-2 mb-4">
					// 			Supplier & Other Details
					// 		</h3>
					// 		<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Supplier</p>
					// 				<p className="font-medium text-textColor-primary mt-1">{transaction.supplier_name}</p>
					// 			</div>
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Contact No</p>
					// 				<p className="font-medium text-textColor-primary mt-1">{transaction.supplier_contact}</p>
					// 			</div>
					// 			<div>
					// 				<p className="text-sm text-textColor-tertiary">Location</p>
					// 				<p className="font-medium text-textColor-primary mt-1">{transaction.supplier_location}</p>
					// 			</div>
					// 		</div>
					// 	</section>
					// </div>
					<div className="text-center text-textColor-tertiary py-10">No details found for this transaction.</div>
				)}
			</div>
		</div>
	);
};

export default DetailsModal;
