import React, { useState, useEffect } from 'react';
import TransactionsTable from './TransactionsTable';

const availableStatuses = ["Delivered", "Completed", "Pending", "Canceled"];

export default function LogsTable(props) {
    const [statusFilters, setStatusFilters] = useState([]);
    const [warehouseId, setWarehouseId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [priceRange, setPriceRange] = useState({ minPrice: "", maxPrice: "" });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const statusesFromUrl = params.getAll("status");
            if (statusesFromUrl.length > 0) {
                setStatusFilters(statusesFromUrl);
            } else {
                setStatusFilters([]);
            }
            setWarehouseId(params.get("warehouseId") || "");
            setSupplierId(params.get("supplierId") || "");
            setPriceRange({
                minPrice: params.get("minPrice") || "",
                maxPrice: params.get("maxPrice") || ""
            });
        }
    }, [typeof window !== 'undefined' ? window.location.search : null]);

    const columns = [
        { header: "Invoice no", accessor: "invoice_no", sortable: true },
        { header: "Date", accessor: "transaction_datetime", sortable: true },
        { header: "Supplier", accessor: "supplier_name", sortable: false, render: (log) => log.supplier_name || "- - -" },
        { header: "Warehouse", accessor: "warehouse_name", sortable: false, render: (log) => log.warehouse_name || "- - -" },
        { header: "Total Items", accessor: "total_quantity", sortable: true },
        {
            header: "Total Price",
            accessor: "total_price",
            sortable: true,
            render: (log) => log.total_price.toFixed(2),
        },
        {
            header: 'Status',
            accessor: "status",
            sortable: true,
            className: "text-center",
            render: (log) => (
                <span
                    className={`inline-block w-[6rem] px-3 py-1 text-sm font-semibold rounded-lg ${{
                        Delivered: "bg-green/10 text-green",
                        Completed: "bg-green/10 text-green",
                        "In Transit": "bg-orange/10 text-orange",
                        Pending: "bg-yellow-500/20 text-yellow-400",
                        Canceled: "bg-red/10 text-red",
                    }[log.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"}`}>
                    {log.status}
                </span>
            ),
        },
    ];

    return <TransactionsTable {...props} columns={columns} statusFilters={statusFilters} searchTerm={props.searchTerm} warehouseId={warehouseId} supplierId={supplierId} priceRange={priceRange} />;
}