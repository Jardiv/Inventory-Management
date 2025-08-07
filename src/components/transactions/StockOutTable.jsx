import React, { useState } from 'react';
import TransactionsTable from './TransactionsTable';
import StatusFilter from './utils/StatusFilter';

const availableStatuses = ["Completed", "In Transit", "Pending", "Canceled"];

export default function StockOutTable(props) {
    const [statusFilters, setStatusFilters] = useState([]);

    const columns = [
        { header: 'Invoice no', accessor: 'invoice_no', sortable: true },
        { header: 'Date', accessor: 'transaction_datetime', sortable: true },
        { header: 'Total Items', accessor: 'total_quantity', sortable: true, sortKey: 'total_quantity' },
        { 
            header: 'Total Price', 
            accessor: 'total_price', 
            sortable: true, 
            render: (log) => log.total_price.toFixed(2) 
        },
        {header: 'Warehouse', accessor: 'warehouse_name', sortable: false, render: (log) => log.warehouse_name || '- - -' },
        {
            header: () => <StatusFilter availableStatuses={availableStatuses} onFilterChange={setStatusFilters} isAbleToSort={props.isAbleToSort} />,
            accessor: 'status',
            sortable: false,
            className: 'text-center',
            render: (log) => (
                <span
                    className={`inline-block w-[6rem] px-3 py-1 text-sm font-semibold rounded-full ${{
                        Delivered: "bg-green/10 text-green",
                        Completed: "bg-green/10 text-green",
                        "In Transit": "bg-orange/10 text-orange",
                        Pending: "bg-yellow-500/20 text-yellow-400",
                        Canceled: "bg-red/10 text-red",
                    }[log.status] || "bg-textColor-tertiary/10 text-textColor-tertiary"}`}
                >
                    {log.status}
                </span>
            )
        }
    ];

    return <TransactionsTable {...props} columns={columns} direction="out" statusFilters={statusFilters} />;
}