// Enhanced Low Stock page functionality with pagination and persistent selections
class LowStockManager {
    constructor() {
        this.currentPaginationData = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            startIndex: 1,
            endIndex: 0,
            itemsPerPage: 10
        };
        this.isUpdating = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializePagination();
        this.updateUI();
        
        // Update UI every 100ms to sync with React component
        setInterval(() => this.updateUI(), 100);
    }

    setupEventListeners() {
        // Edit button event listeners (delegated for dynamic content)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                const button = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
                this.handleEditClick(button);
            }
        });

        // Modal button event listeners
        this.setupModalEventListeners();

        // Bottom select all button
        const selectAllButton = document.getElementById('selectAllButton');
        if (selectAllButton) {
            selectAllButton.addEventListener('click', () => this.handleSelectAllClick());
        }

        // Filter button integration
        this.setupFilterButton();

        // Close modals when clicking outside
        this.setupModalCloseEvents();

        // Individual checkbox events (delegated)
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                this.updateSelectAllState();
            }
        });
    }

    setupModalEventListeners() {
        const modalButtons = {
            closeModalBtn: () => this.closeEditModal(),
            cancelOrderBtn: () => this.saveOrder(),
            confirmOrderBtn: () => this.confirmOrder(),
            generatePurchaseOrderBtn: () => this.generatePurchaseOrder(),
            closeSuccessModalBtn: () => this.closeSuccessModal(),
            closeSuccessBtn: () => this.closeSuccessModal(),
            viewTransactionBtn: () => {
                console.log('View Transaction clicked');
                window.location.href = '/reports/PurchaseOrder';
            }
        };

        Object.entries(modalButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        });
    }

    setupFilterButton() {
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('openFilterModal'));
            });
            
            window.addEventListener('filterModalStateChange', (event) => {
                const isOpen = event.detail.isOpen;
                
                if (isOpen) {
                    filterBtn.classList.remove('text-textColor-primary', 'hover:bg-btn-hover', 'hover:text-white');
                    filterBtn.classList.add('bg-btn-primary', 'text-white');
                } else {
                    filterBtn.classList.remove('bg-btn-primary', 'text-white');
                    filterBtn.classList.add('text-textColor-primary', 'hover:bg-btn-hover', 'hover:text-white');
                }
            });
        }
    }

    setupModalCloseEvents() {
        const editModal = document.getElementById('editModal');
        const successModal = document.getElementById('successModal');
        
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) this.closeEditModal();
            });
        }

        if (successModal) {
            successModal.addEventListener('click', (e) => {
                if (e.target === successModal) this.closeSuccessModal();
            });
        }
    }

    // Pagination functionality
    initializePagination() {
        const paginationControls = document.getElementById('paginationControls');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        // Listen for pagination updates from React component
        window.addEventListener('lowStockPaginationUpdate', (event) => {
            this.currentPaginationData = event.detail;
            this.updatePaginationDisplay();
        });

        // Set up navigation button event listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPaginationData.currentPage > 1) {
                    this.changePage(this.currentPaginationData.currentPage - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPaginationData.currentPage < this.currentPaginationData.totalPages) {
                    this.changePage(this.currentPaginationData.currentPage + 1);
                }
            });
        }

        // Initialize with delay to ensure React component is loaded
        setTimeout(() => {
            this.updatePaginationDisplay();
            this.startFallbackPaginationCheck();
        }, 1000);
    }

    updatePaginationDisplay() {
        if (!window.lowStockPagination || this.isUpdating) return;
        
        this.isUpdating = true;
        
        try {
            const paginationControls = document.getElementById('paginationControls');
            const paginationInfo = document.getElementById('paginationInfo');
            const pageNumbers = document.getElementById('pageNumbers');
            const prevBtn = document.getElementById('prevPageBtn');
            const nextBtn = document.getElementById('nextPageBtn');

            if (!paginationControls || !paginationInfo || !pageNumbers || !prevBtn || !nextBtn) {
                this.isUpdating = false;
                return;
            }

            const { currentPage, totalPages, totalItems, hasNextPage, hasPrevPage } = window.lowStockPagination;

            // Show/hide pagination controls
            if (totalPages > 1) {
                paginationControls.style.display = 'flex';
            } else {
                paginationControls.style.display = 'none';
                this.isUpdating = false;
                return;
            }

            // Hide pagination info
            if (paginationInfo) {
                paginationInfo.style.display = 'none';
            }

            // Update button states
            this.updateButtonState(prevBtn, !hasPrevPage);
            this.updateButtonState(nextBtn, !hasNextPage);

            // Generate page numbers with ellipsis (max 5 pages visible)
            this.generatePageNumbers(pageNumbers, currentPage, totalPages);

        } catch (error) {
            console.error('Error updating pagination:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    updateButtonState(button, isDisabled) {
        if (isDisabled) {
            button.disabled = true;
            button.className = 'p-2 rounded-md transition-colors text-gray-500 cursor-not-allowed';
        } else {
            button.disabled = false;
            button.className = 'p-2 rounded-md transition-colors text-textColor-primary hover:bg-gray-700';
        }
    }

    generatePageNumbers(container, currentPage, totalPages) {
        container.innerHTML = '';
        
        const pages = [];
        
        if (totalPages <= 5) {
            // Show all pages if 5 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (currentPage > 3) {
                pages.push('...');
            }
            
            // Calculate range around current page
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);
            
            // Adjust range for better display (max 5 pages visible)
            if (currentPage <= 3) {
                endPage = Math.min(totalPages - 1, 4);
            }
            if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - 3);
            }
            
            // Add pages around current page
            for (let i = startPage; i <= endPage; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
            
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            
            // Always show last page
            if (totalPages > 1 && !pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }
        
        // Create page elements
        pages.forEach(page => {
            if (page === '...') {
                this.createEllipsis(container);
            } else {
                this.createPageButton(container, page, currentPage === page);
            }
        });
    }

    createPageButton(container, pageNumber, isActive) {
        const button = document.createElement('button');
        button.textContent = pageNumber;
        button.className = `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-btn-primary text-white cursor-default'
                : 'text-textColor-primary hover:bg-gray-700 hover:text-white'
        }`;
        button.disabled = isActive;
        
        if (!isActive) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changePage(pageNumber);
            });
        }
        
        container.appendChild(button);
    }

    createEllipsis(container) {
        const span = document.createElement('span');
        span.textContent = '...';
        span.className = 'px-2 py-2 text-textColor-tertiary text-sm';
        container.appendChild(span);
    }

    changePage(page) {
        // Dispatch event to React component
        const changePageEvent = new CustomEvent('lowStockChangePage', {
            detail: { page: page }
        });
        window.dispatchEvent(changePageEvent);
    }

    startFallbackPaginationCheck() {
        const fallbackCheck = () => {
            if (window.lowStockPagination && !this.isUpdating) {
                this.updatePaginationDisplay();
            }
            setTimeout(fallbackCheck, 2000);
        };
        setTimeout(fallbackCheck, 1000);
    }

    // Selection management
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
        } else {
            // Fallback for non-React implementation
            const selectAllBottom = document.getElementById('selectAllBottom');
            if (selectAllBottom instanceof HTMLInputElement) {
                const isChecked = !selectAllBottom.checked;
                this.toggleAllCheckboxes(isChecked);
            }
        }
    }

    updateUI() {
        if (window.lowStockTable && typeof window.lowStockTable.getSelectedCount === 'function') {
            const selectedCount = window.lowStockTable.getSelectedCount();
            this.updateSelectionUI(selectedCount);
        } else {
            // Fallback for non-React implementation
            this.updateSelectAllState();
        }
    }

    updateSelectionUI(selectedCount) {
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

        // Update select all button text
        if (selectAllText) {
            selectAllText.textContent = selectedCount > 0 ? 'Unselect All' : 'Select All';
        }

        // Sync bottom checkbox with React component state
        if (selectAllBottom && window.lowStockTable && window.lowStockTable.selectedItems) {
            selectAllBottom.checked = selectedCount > 0;
            selectAllBottom.indeterminate = false;
        }
    }

    // Modal functions
    openEditModal(itemCode, itemName, currentQty, orderQty) {
        const fields = {
            modalItemCode: itemCode,
            modalItemName: itemName,
            modalCurrentQty: currentQty,
            modalOrderQty: orderQty
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element instanceof HTMLInputElement) {
                element.value = value;
            }
        });
        
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
        
        // Clear all selections using React component function or fallback
        if (window.lowStockTable && typeof window.lowStockTable.clearAllSelections === 'function') {
            window.lowStockTable.clearAllSelections();
        } else {
            this.clearAllSelections();
        }
    }

    generatePurchaseOrder() {
        let selectedCount = 0;
        
        // Debug: Check if React component is available
        console.log('window.lowStockTable available:', !!window.lowStockTable);
        console.log('generatePurchaseOrderSummary function available:', !!(window.lowStockTable?.generatePurchaseOrderSummary));
        
        if (window.lowStockTable && typeof window.lowStockTable.generatePurchaseOrderSummary === 'function') {
            selectedCount = window.lowStockTable.getSelectedCount();
            console.log('Selected count from React component:', selectedCount);
            
            if (selectedCount === 0) {
                alert('Please select at least one item to generate a purchase order.');
                return;
            }
            
            // Call the React component's purchase order summary function
            window.lowStockTable.generatePurchaseOrderSummary();
        } else {
            // Fallback to DOM counting and direct success modal
            selectedCount = document.querySelectorAll('.item-checkbox:checked').length;
            console.log('Selected count from DOM fallback:', selectedCount);
            
            if (selectedCount === 0) {
                alert('Please select at least one item to generate a purchase order.');
                return;
            }
            
            console.log('Generating purchase order for', selectedCount, 'items (fallback method)');
            this.openSuccessModal();
        }
    }

    // Fallback functions for non-React implementation
    toggleAllCheckboxes(checked) {
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            if (checkbox instanceof HTMLInputElement) {
                checkbox.checked = checked;
            }
        });
        this.updateSelectAllState();
    }

    updateSelectAllState() {
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        const checkedCount = document.querySelectorAll('.item-checkbox:checked').length;
        const allChecked = checkedCount === itemCheckboxes.length && itemCheckboxes.length > 0;
        const someChecked = checkedCount > 0;
        
        const selectAllHeader = document.getElementById('selectAllHeader');
        const selectAllBottom = document.getElementById('selectAllBottom');
        const selectedCountElement = document.getElementById('selectedCount');
        const selectAllText = document.getElementById('selectAllText');
        
        // Update checkboxes
        [selectAllHeader, selectAllBottom].forEach(checkbox => {
            if (checkbox instanceof HTMLInputElement) {
                checkbox.checked = allChecked;
                checkbox.indeterminate = someChecked && !allChecked;
            }
        });

        // Update UI elements
        if (selectedCountElement) {
            if (checkedCount > 0) {
                selectedCountElement.textContent = checkedCount;
                selectedCountElement.classList.remove('hidden');
            } else {
                selectedCountElement.classList.add('hidden');
            }
        }

        if (selectAllText) {
            selectAllText.textContent = checkedCount > 0 ? 'Unselect All' : 'Select All';
        }
    }

    clearAllSelections() {
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            if (checkbox instanceof HTMLInputElement) {
                checkbox.checked = false;
            }
        });
        
        const selectAllCheckboxes = ['selectAllHeader', 'selectAllBottom'];
        selectAllCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox instanceof HTMLInputElement) {
                checkbox.checked = false;
                checkbox.indeterminate = false;
            }
        });
        
        this.updateSelectAllState();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LowStockManager();
});
