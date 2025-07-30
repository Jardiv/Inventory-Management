import { useEffect, useState } from "react";

export default function TransactionsTable() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const res = await fetch("/api/transactions");
                const data = await res.json();
                setTransactions(data);
            } catch (err) {
                console.error("Error fetching transactions:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTransactions();
    }, []);

    if (loading) {
        return <div className="p-4 text-gray-500">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-1 w-full bg-primary p-4 mt-4">
            <div className="w-full flex justify-between">
                <h1 className="text-xl font-bold">Stock In Transactions</h1>
                <a href="/stockTransaction/Dashboard/">
                    <button className="text-btn-primary border-none w-fit hover:text-btn-primary">
                        Back
                    </button>
                </a>
            </div>

            <div className="p-2 flex flex-col gap-4">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="table-header">Reference no</th>
                            <th className="table-header">Date</th>
                            <th className="table-header">Supplier</th>
                            <th className="table-header">Status</th>
                            <th className="table-header text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((log) => (
                            <tr key={log.id} className="table-row">
                                <td className="table-data">{log.ref_no}</td>
                                <td className="table-data">
                                    {log.transaction_datetime}
                                </td>
                                <td className="table-data">
                                    {log.supplier_id}
                                </td>
                                <td className="table-data">{log.status}</td>
                                <td className="table-data text-center">
                                    <button className="table-view-btn">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-between items-center flex-shrink-0">
                    <button className="bg-btn-primary hover:bg-gray-600 text-textColor-secondary px-4 py-2 rounded font-medium transition-colors text-sm">
                        Previous
                    </button>
                    <span className="text-textColor-primary text-sm">
                        Page 1 of 1
                    </span>
                    <button className="bg-btn-primary hover:bg-gray-600 text-textColor-secondary px-4 py-2 rounded font-medium transition-colors text-sm">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
