
// Styling and theming are handled by Tailwind CSS and src/styles/global.css
// All classes below use Tailwind and inherit theme variables from global.css
import React, { useState, useEffect } from 'react';

const PurchaseOrderStatusDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/demo/purchase-order-list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setInvoiceList(data.data);
        }
      });
  }, []);

  const handleConfirm = async () => {
    if (!selectedInvoice) {
      setMessage('Please select an invoice number.');
      return;
    }
    setLoading(true);
    setMessage('');
    let errorMsg = '';
    let statusCode = 0;
    try {
      const res = await fetch('/api/demo/update-purchase-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_no: selectedInvoice, status: selectedStatus })
      });
      statusCode = res.status;
      const result = await res.json();
      setLoading(false);
      if (result.success) {
        window.alert('✅ Status updated successfully!');
        setShowModal(false);
      } else {
        errorMsg = result.error || 'Failed to update status.';
        window.alert(`❌ Update failed: ${errorMsg} (Error code: ${statusCode})`);
      }
    } catch (err) {
      setLoading(false);
      window.alert(`❌ Update failed: ${err?.message || err} (Network or server error)`);
    }
  };

  return (
    <div className="bg-primary  flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Demo: Update Purchase Order Status</h1>
      <button className="px-6 py-3 bg-purple text-textColor-primary rounded shadow" onClick={() => setShowModal(true)}>
        Show Modal
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-primary rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Purchase Order Status</h2>
            <label className="block mb-2 font-medium">Select Invoice No:</label>
            <select className="bg-primary w-full mb-4 p-2 border rounded" value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)}>
              <option value="">-- Select Invoice --</option>
              {invoiceList.map((inv) => (
                <option key={inv.invoice_no} value={inv.invoice_no}>{inv.invoice_no}</option>
              ))}
            </select>
            <label className="block mb-2 font-medium">Select Status:</label>
            <select className="bg-primary w-full mb-4 p-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="flex gap-4 mt-6">
              <button className="px-4 py-2 bg-background hover:bg-textColor-tertiary rounded" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="px-4 py-2 bg-btn-primary hover:bg-btn-hover text-textColor-primary rounded" onClick={handleConfirm} disabled={loading}>Confirm</button>
            </div>
            {/* Alert is used for confirmation and error messages */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderStatusDemo;
