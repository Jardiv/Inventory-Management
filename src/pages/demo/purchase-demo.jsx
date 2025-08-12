---

import React, { useState, useEffect } from 'react';

const PurchaseDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/reports/logs?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setInvoiceList(data.data.map(po => po.invoice_no));
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
    const res = await fetch('/api/demo/update-purchase-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_no: selectedInvoice, status: selectedStatus })
    });
    const result = await res.json();
    setLoading(false);
    if (result.success) {
      setMessage('Status updated successfully!');
      setShowModal(false);
    } else {
      setMessage(result.error || 'Failed to update status.');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <button className="px-6 py-3 bg-blue-600 text-white rounded shadow" onClick={() => setShowModal(true)}>
        Demo: Update Purchase Order Status
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Purchase Order Status</h2>
            <label className="block mb-2 font-medium">Select Invoice No:</label>
            <select className="w-full mb-4 p-2 border rounded" value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)}>
              <option value="">-- Select Invoice --</option>
              {invoiceList.map((inv) => (
                <option key={inv} value={inv}>{inv}</option>
              ))}
            </select>
            <label className="block mb-2 font-medium">Select Status:</label>
            <select className="w-full mb-4 p-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="flex gap-4 mt-6">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirm} disabled={loading}>Confirm</button>
            </div>
            {message && <div className="mt-4 text-red-600">{message}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDemo;
