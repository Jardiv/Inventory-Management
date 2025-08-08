// src/components/inventory/InventoryPage.jsx
import React, { useState } from 'react';
import ProductInventoryPreview from './productInvenDATA.jsx';
import ProductOverviewModal from './ProductOverviewModal.jsx';
import Addmodal from './Addmodal.astro';
import Filter from './Filter.astro';

export default function InventoryPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <Addmodal />
      {showModal && <ProductOverviewModal product={selectedProduct} onClose={handleCloseModal} />}
      
      <section id="overviewSection">
        <div className="bg-primary p-6 rounded-lg">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Product Inventory</h2>
              <a href="/inventory/PendingItemsPreview" class="text-sm px-3 py-1 rounded bg-btn-hover text-white hover:bg-violet-600 transition">
                Pending Products
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button id="open-add-modal" className="flex items-center gap-2 rounded px-4 py-2 bg-primary text-textColor-primary hover:bg-violet-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                </svg>
              </button>
              <Filter />
              <button className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              <button onClick={() => window.history.back()} className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded">
                <svg xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" className="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <ProductInventoryPreview
            client:load
            onRowClick={handleRowClick}
            limit={10}
            paginated={true}
          />
        </div>
      </section>
    </>
  );
}