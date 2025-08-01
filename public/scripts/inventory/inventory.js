document.addEventListener('DOMContentLoaded', function () {
  // === ADD MODAL ===
  const addModal = document.getElementById('addModal');
  const openAddBtn = document.getElementById('open-add-modal');
  const closeAddBtn = document.getElementById('close-add-modal');
  const cancelAddBtn = document.getElementById('cancelBtn');
  const confirmAddBtn = document.getElementById('confirmBtn');

  // Open add modal
  if (openAddBtn && addModal) {
    openAddBtn.addEventListener('click', () => {
      addModal.classList.remove('hidden');
    });
  }

  // Close add modal
  [closeAddBtn, cancelAddBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => {
        addModal.classList.add('hidden');
      });
    }
  });

  // Close add modal on outside click
  if (addModal) {
    addModal.addEventListener('click', (e) => {
      if (e.target === addModal) {
        addModal.classList.add('hidden');
      }
    });
  }

  // Confirm Add
  if (confirmAddBtn) {
    confirmAddBtn.addEventListener('click', () => {
      const itemName = document.getElementById('itemName')?.value;
      const category = document.getElementById('category')?.value;
      const description = document.getElementById('description')?.value;
      const minQty = document.getElementById('minQty')?.value;
      const maxQty = document.getElementById('maxQty')?.value;
      const autoReorder = document.getElementById('autoReorder')?.checked;

      console.log('Add Product:', {
        itemName,
        category,
        description,
        minQty,
        maxQty,
        autoReorder,
      });

      addModal.classList.add('hidden');
    });
  }

  // === EDIT MODAL ===
  const openEditBtn = document.querySelector('[data-modal-toggle="editModal"]');
  const editModal = document.getElementById('editModal');
  const closeEditBtn = document.getElementById('close-edit-modal');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (openEditBtn && editModal) {
    openEditBtn.addEventListener('click', () => editModal.classList.remove('hidden'));
  }

  [closeEditBtn, cancelEditBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => editModal.classList.add('hidden'));
    }
  });

  // === Tabs ===
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('[data-tab-content]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data-tab');

      tabs.forEach((t) => {
        t.classList.remove('text-white');
        t.classList.add('text-gray-400');
        t.querySelector('.tab-underline').classList.remove('scale-x-100');
        t.querySelector('.tab-underline').classList.add('scale-x-0');
      });

      tab.classList.add('text-white');
      tab.classList.remove('text-gray-400');
      tab.querySelector('.tab-underline').classList.add('scale-x-100');
      tab.querySelector('.tab-underline').classList.remove('scale-x-0');

      sections.forEach((sec) => {
        sec.classList.toggle('hidden', sec.getAttribute('data-tab-content') !== selected);
        sec.classList.toggle('block', sec.getAttribute('data-tab-content') === selected);
      });
    });
  });

  // Optional: Checkbox group logic
  const checkboxes = document.querySelectorAll('.availability-option');
  if (checkboxes.length > 0) {
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        checkboxes.forEach((other) => {
          if (other !== cb) other.checked = false;
        });
      });
    });
  }

  // Filter toggle
  const toggleBtn = document.getElementById('toggle-filters');
  const filterPanel = document.getElementById('filter-panel');
  if (toggleBtn && filterPanel) {
    toggleBtn.addEventListener('click', () => {
      filterPanel.classList.toggle('hidden');
      toggleBtn.classList.toggle('active-filter');
    });
  }
});

// filter functionality
document.addEventListener('DOMContentLoaded', function () {
  // === FILTER FUNCTIONALITY ===
  const availabilityCheckboxes = document.querySelectorAll('.availability-option');
  const categorySelect = document.querySelector('#filter-panel select');
  const priceMinInput = document.querySelector('#filter-panel input[placeholder="Min:"]');
  const priceMaxInput = document.querySelector('#filter-panel input[placeholder="Max:"]');
  const productRows = document.querySelectorAll('.product-row'); // Add this class to your table rows

  function applyFilters() {
    const selectedAvailability = Array.from(availabilityCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const selectedCategory = categorySelect?.value.toLowerCase();
    const minPrice = parseFloat(priceMinInput?.value) || 0;
    const maxPrice = parseFloat(priceMaxInput?.value) || Infinity;

    productRows.forEach(row => {
      const availability = row.dataset.availability;   // e.g., "in_stock"
      const category = row.dataset.category?.toLowerCase(); // e.g., "Grains"
      const price = parseFloat(row.dataset.price);     // e.g., 100

      const matchAvailability = selectedAvailability.length === 0 || selectedAvailability.includes(availability);
      const matchCategory = !selectedCategory || category === selectedCategory;
      const matchPrice = price >= minPrice && price <= maxPrice;

      const show = matchAvailability && matchCategory && matchPrice;

      row.classList.toggle('hidden', !show);
    });
  }

  const applyBtn = document.getElementById('apply-filters-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }
});

// Product Overview
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabSections = document.querySelectorAll(".tab-section");
  const pageTitle = document.getElementById("pageTitle");

  const tabTitles = {
    overview: "Product Overview",
    stock: "Stock Information",
    purchase: "Purchase History"
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");

      // Update title
      pageTitle.textContent = tabTitles[tab] || "Product Overview";

      // Toggle active tab styles
      tabButtons.forEach((b) => {
        b.classList.remove("text-white", "font-semibold");
        b.classList.add("text-gray-400");
        b.querySelector(".tab-underline").classList.remove("scale-x-100");
        b.querySelector(".tab-underline").classList.add("scale-x-0");
      });

      btn.classList.add("text-white", "font-semibold");
      btn.classList.remove("text-gray-400");
      btn.querySelector(".tab-underline").classList.remove("scale-x-0");
      btn.querySelector(".tab-underline").classList.add("scale-x-100");

      // Toggle tab sections
      tabSections.forEach((section) => {
        section.classList.add("hidden");
      });

      document.querySelector(`[data-tab-content="${tab}"]`).classList.remove("hidden");
    });
  });
});
