# Purchase Order Prevention Feature

## Overview
This feature prevents duplicate purchase orders by automatically hiding items from the Low Stock purchase order table when they already have pending purchase orders. This prevents users from accidentally ordering the same items multiple times.

## How It Works

### Backend Implementation
1. **API Enhancement (`lowstock.ts`)**:
   - Queries `purchase_orders_items` table to find items with pending purchase orders
   - Joins with `purchase_orders` table to filter only "Pending" status orders
   - Creates a Set of item IDs that have pending orders for efficient lookup
   - Filters out these items from the low stock results before returning to frontend

### Frontend Implementation
2. **UI Enhancement (`lowstock.jsx`)**:
   - Captures debug information about filtered items from API response
   - Displays a notification banner when items are hidden due to pending orders
   - Provides a link to view pending purchase orders for transparency

### Key Features
- **Automatic Filtering**: Items with pending purchase orders are automatically excluded from selection
- **User Notification**: Clear notification explains why certain items might not appear
- **Transparency**: Users can click to view pending orders to understand what's been filtered
- **Debug Information**: API provides detailed debug info about filtering process

## Database Schema Impact

### Tables Involved
- `purchase_orders`: Main purchase order records with status tracking
- `purchase_orders_items`: Individual items within purchase orders
- `items`: Product catalog with stock levels

### Query Logic
```sql
-- Get items with pending purchase orders
SELECT item_id 
FROM purchase_orders_items poi
INNER JOIN purchase_orders po ON poi.invoice_no = po.invoice_no
WHERE po.status = 'Pending'
```

## User Experience

### Before Implementation
- Users could select the same low stock item multiple times
- Risk of duplicate orders for items already being procured
- No visibility into why certain items might need ordering

### After Implementation
- Items with pending orders are automatically hidden from selection
- Clear notification shows how many items were filtered out
- Direct link to view pending orders for full transparency
- Prevents accidental duplicate ordering

## Status-Based Filtering

### When Items Are Hidden
- Purchase order status = "Pending"
- Purchase order status = "Approved" (items are being procured)

### When Items Reappear
- Purchase order status = "Completed" (items delivered)
- Purchase order status = "Cancelled" (order was cancelled)

## Benefits

1. **Prevents Duplicate Orders**: Core functionality prevents ordering same items twice
2. **Improved User Experience**: Clear notifications and transparency
3. **Better Inventory Management**: Reduces over-ordering and waste
4. **Cost Savings**: Prevents unnecessary duplicate purchases
5. **Audit Trail**: Better tracking of what's been ordered vs. what needs ordering

## Technical Details

### Performance Considerations
- Uses Set data structure for O(1) lookup performance
- Single query to get pending purchase order items
- Efficient filtering before pagination

### Error Handling
- If pending order query fails, continues without filtering (fail-safe)
- Provides debug information for troubleshooting
- Maintains functionality even if some queries fail

### Debug Information
API returns debug object with:
- `totalItemsInDb`: Total items in database
- `itemsWithPendingOrders`: Number of items filtered out
- `lowStockItemsAfterFiltering`: Final count after filtering

## Future Enhancements

1. **Status-Specific Filtering**: Different rules for different order statuses
2. **Partial Quantity Awareness**: Show items if pending order doesn't cover full need
3. **Time-Based Filtering**: Hide items only for recent pending orders
4. **Supplier-Specific Logic**: Different rules based on supplier lead times
