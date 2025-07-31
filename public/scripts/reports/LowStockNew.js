// Enhanced Low Stock page functionality with persistent selections
class LowStockManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        
        // Update UI every 100ms to sync with React component
        setInterval(() => this.updateUI(), 100);
    }

    setupEventListeners() {
        // Edit button event listeners (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                const button = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
                this.handleEditClick(button);
            }
        });

        // Modal button event listeners
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelOrderBtn = document.getElementById('cancelOrderBtn');
        const confirmOrderBtn = document.getElementById('confirmOrderBtn');
        const generatePurchaseOrderBtn = document.getElementById('generatePurchaseOrderBtn');
        const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
        const closeSuccessBtn = document.getElementById('closeSuccessBtn');
        const viewTransactionBtn = document.getElementById('viewTransactionBtn');
        
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeEditModal());
        if (cancelOrderBtn) cancelOrderBtn.addEventListener('click', () => this.saveOrder());
        if (confirmOrderBtn) confirmOrderBtn.addEventListener('click', () => this.confirmOrder());
        if (generatePurchaseOrderBtn) generatePurchaseOrderBtn.addEventListener('click', () => this.generatePurchaseOrder());
        if (closeSuccessModalBtn) closeSuccessModalBtn.addEventListener('click', () => this.closeSuccessModal());
        if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => this.closeSuccessModal());
        
        if (viewTransactionBtn) {
            viewTransactionBtn.addEventListener('click', () => {
                console.log('View Transaction clicked');
                window.location.href = '/reports/PurchaseOrder';
            });
        }

        // Bottom select all button
        const selectAllButton = document.getElementById('selectAllButton');
        if (selectAllButton) {
            selectAllButton.addEventListener('click', () => this.handleSelectAllClick());
        }

        // Close modals when clicking outside
        const editModal = document.getElementById('editModal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) this.closeEditModal();
            });
        }

        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.addEventListener('click', (e) => {
                if (e.target === successModal) this.closeSuccessModal();
            });
        }
    }

    handleEditClick(button) {
        const itemCode = button.getAttribute('data-item-code') || '';
        const itemName = button.getAttribute('data-item-name') || '';
        const currentQty = button.getAttribute('data-current-qty') || '';
        const orderQty = button.getAttribute('data-order-qty') || '';
        
        this.openEditModal(itemCode, itemName, currentQty, orderQty);
    }

    handleSelectAllClick() {
        if (window.lowStockTable && typeof window.lowStockTable.handleToggleSelectAll === 'function') {
            window.lowStockTable.handleToggleSelectAll();
        }
    }

    updateUI() {
        if (window.lowStockTable && typeof window.lowStockTable.getSelectedCount === 'function') {
            const selectedCount = window.lowStockTable.getSelectedCount();
            const selectedCountElement = document.getElementById('selectedCount');
            const selectAllText = document.getElementById('selectAllText');
            const selectAllBottom = document.getElementById('selectAllBottom');
            
            // Update selected count display
            if (selectedCountElement) {
                if (selectedCount > 0) {
                    selectedCountElement.textContent = selectedCount;
                    selectedCountElement.classList.remove('hidden');
                } else {
                    selectedCountElement.classList.add('hidden');
                }
            }

            // Update select all button text based on selection count
            if (selectAllText) {
                if (selectedCount > 0) {
                    selectAllText.textContent = `Unselect All`;
                } else {
                    selectAllText.textContent = 'Select All';
                }
            }

            // Sync bottom checkbox with React component state
            if (selectAllBottom && window.lowStockTable.selectedItems) {
                if (selectedCount === 0) {
                    selectAllBottom.checked = false;
                    selectAllBottom.indeterminate = false;
                } else {
                    // If any items are selected globally, show as checked
                    selectAllBottom.checked = true;
                    selectAllBottom.indeterminate = false;
                }
            }
        }
    }

    openEditModal(itemCode, itemName, currentQty, orderQty) {
        const modalItemCode = document.getElementById('modalItemCode');
        const modalItemName = document.getElementById('modalItemName');
        const modalCurrentQty = document.getElementById('modalCurrentQty');
        const modalOrderQty = document.getElementById('modalOrderQty');
        
        if (modalItemCode instanceof HTMLInputElement) modalItemCode.value = itemCode;
        if (modalItemName instanceof HTMLInputElement) modalItemName.value = itemName;
        if (modalCurrentQty instanceof HTMLInputElement) modalCurrentQty.value = currentQty;
        if (modalOrderQty instanceof HTMLInputElement) modalOrderQty.value = orderQty;
        
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    saveOrder() {
        const modalOrderQty = document.getElementById('modalOrderQty');
        const orderQty = (modalOrderQty instanceof HTMLInputElement) ? modalOrderQty.value : '';
        console.log('Order saved with quantity:', orderQty);
        this.closeEditModal();
    }

    confirmOrder() {
        const modalOrderQty = document.getElementById('modalOrderQty');
        const orderQty = (modalOrderQty instanceof HTMLInputElement) ? modalOrderQty.value : '';
        console.log('Order confirmed with quantity:', orderQty);
        this.closeEditModal();
    }

    openSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        
        // Clear all selections using React component function
        if (window.lowStockTable && typeof window.lowStockTable.clearAllSelections === 'function') {
            window.lowStockTable.clearAllSelections();
        }
    }

    generatePurchaseOrder() {
        const selectedCount = window.lowStockTable ? window.lowStockTable.getSelectedCount() : 0;
        
        if (selectedCount === 0) {
            alert('Please select at least one item to generate a purchase order.');
            return;
        }
        
        console.log('Generating purchase order for', selectedCount, 'items');
        this.openSuccessModal();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LowStockManager();
});
