import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function PendingItemsPreview({ limit = 10, paginated = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("added_items")
        .select("*", { count: "exact" })
        .order("status", { ascending: true })
        .order("id", { ascending: true });

      if (statusFilter === "All") {
        query = query.in("status", ["Pending", "Cancelled"]);
      } else {
        query = query.eq("status", statusFilter);
      }

      if (paginated) query.range(from, to);

      const { data, error, count } = await query;
      if (error) {
        console.error("Error fetching items:", error.message);
      } else {
        setItems(data || []);
        setTotal(count || 0);
      }
      setLoading(false);
    }
    fetchItems();
  }, [page, statusFilter]);

  function totalPages() {
    return Math.ceil(total / limit);
  }

  return (
    <div>
      {/* Header: Title + Filter + Back Button */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Pending Products</h2>
          <select
            className="p-2 rounded border text-black"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => window.history.back()}
          className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="border rounded p-4 bg-primary shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">ID: {item.id}</span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    item.status === "Pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="text-lg font-bold">{item.name}</div>
              <div className="text-sm">SKU: {item.sku}</div>
              <p className="mt-2 text-sm">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6">No {statusFilter.toLowerCase()} items found.</div>
        )}
      </div>

      {/* Pagination */}
      {paginated && totalPages() > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages()}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages()))}
            disabled={page === totalPages()}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
