import { supabase } from "../../../utils/supabaseClient.ts";

export async function fetchProductInventory() {
  const { data, error } = await supabase
    .from("items")
    .select(`
      sku,
      name,
      unit_price,
      status,
      min_qty,
      max_qty,
      category ( name ),
      auto_reorder (
        suppliers ( name )
      )
    `);

  if (error) throw error;

  const processedData = (data || []).map((item) => {
    const skuNumber = parseInt(item.sku.replace(/[^\d]/g, ""), 10) || 0;

    const category =
      Array.isArray(item.category) && item.category.length > 0
        ? item.category[0].name
        : "Uncategorized";

    let supplierName = "No Supplier";
    if (
      Array.isArray(item.auto_reorder) &&
      item.auto_reorder.length > 0 &&
      Array.isArray(item.auto_reorder[0].suppliers) &&
      item.auto_reorder[0].suppliers.length > 0
    ) {
      supplierName = item.auto_reorder[0].suppliers[0].name || "No Supplier";
    }

    return {
      skuNumber,
      code: item.sku,
      name: item.name,
      category,
      supplier: supplierName,
      price: item.unit_price
        ? `${parseFloat(item.unit_price).toFixed(2)}`
        : "0.00",
      status: item.status || "Unknown",
      minQty: item.min_qty ?? null,
      maxQty: item.max_qty ?? null,
    };
  });

  processedData.sort((a, b) => a.skuNumber - b.skuNumber);

  return processedData.map(({ skuNumber, ...rest }) => rest);
}
