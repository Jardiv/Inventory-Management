import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function PendingItemsPreview({ limit = 10, paginated = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("order"); // default sorting by order (id ascending)

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let allItems = [];
      let totalCount = 0;

      // 🔹 Fetch deleted items from items table (isDeleted = true)
      if (statusFilter === "All" || statusFilter === "Deleted") {
        try {
          const { data: deletedItems, error: deletedError, count: deletedCount } = await supabase
            .from("items")
            .select("id, name, sku, description, updated_at as created_at", { count: "exact" })
            .eq("isDeleted", true)
            .order("id", { ascending: true });

          if (deletedError) {
            console.error("Error fetching deleted items:", deletedError);
          } else if (deletedItems && deletedItems.length > 0) {
            const mappedDeletedItems = deletedItems.map(item => ({
              ...item,
              status: "Deleted",
              // Use updated_at as created_at for consistency, or keep original timestamp
              created_at: item.created_at || new Date().toISOString()
            }));
            allItems = [...allItems, ...mappedDeletedItems];
            
            // If filtering only deleted items, set the total count
            if (statusFilter === "Deleted") {
              totalCount = deletedCount || 0;
            }
          }
        } catch (error) {
          console.error("Error in deleted items query:", error);
        }
      }

      // 🔹 Fetch pending and canceled items from added_items table
      if (statusFilter === "All" || statusFilter === "Pending" || statusFilter === "Canceled") {
        try {
          let query = supabase
            .from("added_items")
            .select("*", { count: "exact" })
            .in("status", ["Pending", "Canceled"])
            .order("id", { ascending: true });

          // Apply specific status filter for non-deleted items
          if (statusFilter === "Pending" || statusFilter === "Canceled") {
            query = query.eq("status", statusFilter);
          }

          const { data: addedItems, error: addedError, count: addedCount } = await query;

          if (addedError) {
            console.error("Error fetching added items:", addedError);
          } else if (addedItems && addedItems.length > 0) {
            allItems = [...allItems, ...addedItems];
            
            // If filtering only pending or canceled items, set the total count
            if (statusFilter === "Pending" || statusFilter === "Canceled") {
              totalCount = addedCount || 0;
            }
          }
        } catch (error) {
          console.error("Error in added items query:", error);
        }
      }

      // 🔹 Handle "All" status count - count all items combined
      if (statusFilter === "All") {
        totalCount = allItems.length;
      }

      // 🔹 Apply sorting to combined results
      if (sortBy === "recently_added") {
        allItems.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB - dateA; // Most recent first
        });
      } else if (sortBy === "order") {
        allItems.sort((a, b) => (a.id || 0) - (b.id || 0)); // ID ascending
      }

      // 🔹 Apply pagination to sorted results
      let paginatedItems = allItems;
      if (paginated && allItems.length > 0) {
        paginatedItems = allItems.slice(from, to + 1);
      }

      setItems(paginatedItems);
      setTotal(totalCount);
      setLoading(false);
    }

    fetchItems();
  }, [page, statusFilter, sortBy, limit, paginated]);

  const totalPages = Math.ceil(total / limit);

  const renderPageButtons = () => {
    const buttons = [];
    
    // Always show page 1
    buttons.push(
      <button
        key={1}
        onClick={() => setPage(1)}
        className={`px-2 py-1 rounded transition-colors duration-200 ${
          page === 1
            ? "font-bold text-white"
            : "hover:bg-[var(--color-btn-hover)]"
        }`}
        style={{
          backgroundColor:
            page === 1 ? "var(--color-btn-hover)" : "transparent",
        }}
      >
        1
      </button>
    );

    // Show ellipsis if current page is far from start
    if (page > 3) buttons.push(<span key="start-ellipsis">...</span>);

    // Show current page if it's not 1 or last page
    if (page > 1 && page < totalPages) {
      buttons.push(
        <button
          key={page}
          onClick={() => setPage(page)}
          className={`px-2 py-1 rounded transition-colors duration-200 font-bold text-white`}
          style={{
            backgroundColor: "var(--color-btn-hover)",
          }}
        >
          {page}
        </button>
      );
    }

    // Show ellipsis if current page is far from end
    if (page < totalPages - 2) buttons.push(<span key="end-ellipsis">...</span>);

    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          className={`px-2 py-1 rounded transition-colors duration-200 ${
            page === totalPages
              ? "font-bold text-white"
              : "hover:bg-[var(--color-btn-hover)]"
          }`}
          style={{
            backgroundColor:
              page === totalPages ? "var(--color-btn-hover)" : "transparent",
          }}
        >
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div>
      {/* Header: Title + Filters + Back Button */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Pending Products</h2>

          {/* Status Filter */}
          <select
            className="p-2 rounded border bg-primary text-textColor-primary"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            aria-label="Filter by status"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Canceled">Canceled</option>
            <option value="Deleted">Deleted</option>
          </select>

          {/* Sort By Filter */}
          <select
            className="p-2 rounded border bg-primary text-textColor-primary"
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value);
            }}
            aria-label="Sort items"
          >
            <option value="order">Sort by Order (ID Asc)</option>
            <option value="recently_added">Sort by Recently Added</option>
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
              key={`${item.status}-${item.id}`}
              className="border rounded p-4 bg-primary shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">ID: {item.id}</span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    item.status === "Pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : item.status === "Deleted"
                      ? "bg-gray-200 text-gray-800"
                      : item.status === "Canceled"
                      ? "bg-red-200 text-red-800"
                      : "bg-blue-200 text-blue-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="text-lg font-bold">{item.name}</div>
              <div className="text-sm">SKU: {item.sku}</div>
              <p className="mt-2 text-sm">{item.description}</p>
              {item.status === "Deleted" && (
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            No {statusFilter.toLowerCase()} items found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div>
            Showing {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} of {total} items
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage((p) => Math.max(p - 1, 1))} 
              disabled={page === 1}
              className={`px-2 py-1 rounded ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
            >
              &lt;
            </button>
            {renderPageButtons()}
            <button 
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))} 
              disabled={page === totalPages}
              className={`px-2 py-1 rounded ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}