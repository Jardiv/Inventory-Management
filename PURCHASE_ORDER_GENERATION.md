# Purchase Order Generation Flow

## Overview
The new Purchase Order generation system provides a comprehensive workflow that includes summary, confirmation, and database transaction creation.

## New Flow

### 1. Generate Purchase Order Summary Modal
When users click "Generate Purchase Order", they now see a summary modal that displays:
- **Generated Date & Timestamp**: When the purchase order was created
- **Total Quantity**: Sum of all items to be ordered
- **Total Amount**: Calculated from item quantities × unit prices
- **Selected Products Table**: Shows SKU, Name, To Order quantity, Unit Price, and Total Price for each selected item

### 2. Source Input Modal
After confirming the summary, users are prompted to enter:
- **Who is generating the purchase order**: Text field for name/department (stored in transaction's `source` field)

### 3. Transaction Generation
Upon confirmation, the system:
- Creates individual transaction records for each selected item
- Uses transaction type ID = 1 (Purchase Order)
- Generates unique invoice number with timestamp format: `PO-YYYYMMDDHHMMSS`
- Sets all transactions with same invoice number and timestamp
- Saves source information for tracking

### 4. Success Confirmation
Shows success message with:
- Generated Invoice Number
- Total item count
- Total amount
- Opens existing success modal for additional actions

## API Endpoints

### `/api/reports/generate-purchase-order` (POST)
**Purpose**: Creates purchase order transactions in the database

**Request Body**:
```json
{
  "items": [
    {
      "id": 1,
      "sku": "ABC123",
      "name": "Product Name",
      "quantity": 10,
      "unitPrice": 15.00,
      "totalPrice": 150.00,
      "supplier": "ABC Suppliers Inc."
    }
  ],
  "source": "John Doe - Inventory Manager",
  "totalQuantity": 10,
  "totalAmount": 150.00
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "invoiceNo": "PO-20250803143022",
    "transactionDateTime": "2025-08-03T14:30:22.000Z",
    "totalQuantity": 10,
    "totalAmount": 150.00,
    "itemCount": 1,
    "source": "John Doe - Inventory Manager",
    "transactions": [...]
  }
}
```

## Database Schema Updates

### Enhanced lowstock.ts API
- Now includes `unit_price` field in item queries
- Returns unit price with default fallback value of $10.00

### Enhanced item-details.ts API
- Includes unit price information for purchase order calculations
- Used by Purchase Order Details modal

### New Transactions Table Fields Used:
- `invoice_no`: Unique purchase order identifier
- `item_id`: Links to items table
- `quantity`: Order quantity from user selection
- `total_price`: Calculated total for this item
- `transaction_datetime`: When purchase order was generated
- `transaction_type_id`: Set to 1 for purchase orders
- `supplier_id`: Links to suppliers (if available)
- `source`: Who generated the purchase order
- `status`: Set to 'Pending' for new purchase orders

## Component Updates

### lowstock.jsx
- **New State Variables**:
  - `showPurchaseOrderSummary`: Controls summary modal visibility
  - `showSourceInputModal`: Controls source input modal visibility
  - `purchaseOrderSummary`: Stores summary data
  - `sourceInput`: User input for who is generating order
  - `generatingOrder`: Loading state during API call

- **New Functions**:
  - `generatePurchaseOrderSummary()`: Creates and shows summary
  - `proceedToSourceInput()`: Transitions to source input
  - `confirmPurchaseOrderGeneration()`: Handles final confirmation and API call

- **Window Object Exposure**:
  - `window.lowStockTable.generatePurchaseOrderSummary`: Available for JavaScript integration

### LowStock.js
- Updated `generatePurchaseOrder()` to call React component's summary function
- Falls back to direct success modal if React component unavailable

## User Experience

1. **Select Items**: Users select items they want to order using checkboxes
2. **Generate**: Click "Generate Purchase Order" button
3. **Review Summary**: See complete summary with totals and item details
4. **Enter Source**: Specify who is generating the order
5. **Confirm**: Final confirmation creates database transactions
6. **Success**: Clear confirmation with invoice number and details

## Benefits

- **Transparency**: Users see exactly what will be ordered before confirmation
- **Tracking**: Source field enables accountability and audit trails
- **Data Integrity**: All related transactions share same invoice number and timestamp
- **User Control**: Multi-step process prevents accidental purchase order generation
- **Professional Format**: Proper invoice numbering and structured data storage

## Technical Notes

- Unit prices default to $10.00 if not available in database
- Invoice numbers use timestamp format for uniqueness
- All transactions for one purchase order share the same invoice number
- System handles both React component and fallback JavaScript scenarios
- Error handling provides clear feedback to users
- Loading states prevent duplicate submissions
