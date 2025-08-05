import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function ProductInventoryPreview({ limit = 10 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          sku,
          name,
          unit_price,
          min_quantity,
          max_quantity,
          category (
            name
          ),
          added_items (
            status,
            created_at
          )
        `)
        .order('id', { ascending: true })
        .limit(limit);

      if (error) {
        console.error("Failed to fetch products:", error.message);
      } else {
        setProducts(data);
      }
      setLoading(false);
    }

    fetchProducts();
  }, [limit]);

  if (loading) return <p className="text-sm text-gray-500">Loading products...</p>;

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm text-left border border-gray-200 rounded">
<thead className="bg-violet-100 border-b border-gray-300 text-sm text-gray-700">
  <tr>
    <th className="px-4 py-2 text-left font-semibold">SKU</th>
    <th className="px-4 py-2 text-left font-semibold">Name</th>
    <th className="px-4 py-2 text-left font-semibold">Category</th>
    <th className="px-4 py-2 text-left font-semibold">Status</th>
    <th className="px-4 py-2 text-left font-semibold">Min Qty</th>
    <th className="px-4 py-2 text-left font-semibold">Max Qty</th>
    <th className="px-4 py-2 text-left font-semibold">Unit Price</th>
    <th className="px-4 py-2 text-left font-semibold">Created At</th>
  </tr>
</thead>

        <tbody>
          {products.map(item => (
            <tr key={item.id} className="border-t">
              <td className="p-3">{item.sku}</td>
              <td className="p-3">{item.name}</td>
              <td className="p-3">{item.category?.name || '—'}</td>
              <td className="p-3">{item.added_items?.status || '—'}</td>
              <td className="p-3">{item.min_quantity}</td>
              <td className="p-3">{item.max_quantity}</td>
              <td className="p-3">₱{item.unit_price?.toFixed(2)}</td>
              <td className="p-3">
                {item.added_items?.created_at
                  ? new Date(item.added_items.created_at).toLocaleDateString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
