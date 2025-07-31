// Modal functions
function openEditModal(itemCode, itemName, currentQty, orderQty) {
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

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function saveOrder() {
    const modalOrderQty = document.getElementById('modalOrderQty');
    const orderQty = (modalOrderQty instanceof HTMLInputElement) ? modalOrderQty.value : '';
    console.log('Order saved with quantity:', orderQty);
    // You can add more logic here to save the data
    closeEditModal();
}

function confirmOrder() {
    const modalOrderQty = document.getElementById('modalOrderQty');
    const orderQty = (modalOrderQty instanceof HTMLInputElement) ? modalOrderQty.value : '';
    console.log('Order confirmed with quantity:', orderQty);
    // You can add more logic here to confirm the order
    closeEditModal();
}

function openSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    
    // Clear all checkbox selections
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    itemCheckboxes.forEach(checkbox => {
        if (checkbox instanceof HTMLInputElement) {
            checkbox.checked = false;
        }
    });
    
    // Update select all checkboxes state
    const selectAllHeader = document.getElementById('selectAllHeader');
    const selectAllBottom = document.getElementById('selectAllBottom');
    
    if (selectAllHeader instanceof HTMLInputElement) {
        selectAllHeader.checked = false;
        selectAllHeader.indeterminate = false;
    }
    
    if (selectAllBottom instanceof HTMLInputElement) {
        selectAllBottom.checked = false;
        selectAllBottom.indeterminate = false;
    }
}

function generatePurchaseOrder() {
    const checkedItems = document.querySelectorAll('.item-checkbox:checked');
    if (checkedItems.length === 0) {
        alert('Please select at least one item to generate a purchase order.');
        return;
    }
    
    console.log('Generating purchase order for', checkedItems.length, 'items');
    // Show success modal instead of alert
    openSuccessModal();
}

// Function to update the state of all item checkboxes
function toggleAllCheckboxes(checked) {
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    itemCheckboxes.forEach(checkbox => {
        if (checkbox instanceof HTMLInputElement) {
            checkbox.checked = checked;
        }
    });
}

// Function to update select all checkboxes based on item checkboxes
function updateSelectAllState() {
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    const checkedCount = document.querySelectorAll('.item-checkbox:checked').length;
    const allChecked = checkedCount === itemCheckboxes.length;
    const someChecked = checkedCount > 0;
    
    const selectAllHeader = document.getElementById('selectAllHeader');
    const selectAllBottom = document.getElementById('selectAllBottom');
    
    if (selectAllHeader instanceof HTMLInputElement) {
        selectAllHeader.checked = allChecked;
        selectAllHeader.indeterminate = someChecked && !allChecked;
    }
    
    if (selectAllBottom instanceof HTMLInputElement) {
        selectAllBottom.checked = allChecked;
        selectAllBottom.indeterminate = someChecked && !allChecked;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Edit button event listeners
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemCode = this.getAttribute('data-item-code') || '';
            const itemName = this.getAttribute('data-item-name') || '';
            const currentQty = this.getAttribute('data-current-qty') || '';
            const orderQty = this.getAttribute('data-order-qty') || '';
            
            openEditModal(itemCode, itemName, currentQty, orderQty);
        });
    });

    // Modal button event listeners
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    const generatePurchaseOrderBtn = document.getElementById('generatePurchaseOrderBtn');
    const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const viewTransactionBtn = document.getElementById('viewTransactionBtn');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
    if (cancelOrderBtn) cancelOrderBtn.addEventListener('click', saveOrder);
    if (confirmOrderBtn) confirmOrderBtn.addEventListener('click', confirmOrder);
    if (generatePurchaseOrderBtn) generatePurchaseOrderBtn.addEventListener('click', generatePurchaseOrder);
    if (closeSuccessModalBtn) closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeSuccessModal);
    if (viewTransactionBtn) {
        viewTransactionBtn.addEventListener('click', function() {
            console.log('View Transaction clicked');
            // Navigate to PurchaseOrder page
            window.location.href = '/reports/PurchaseOrder';
        });
    }

    // Close modal when clicking outside
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditModal();
            }
        });
    }

    // Close success modal when clicking outside
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeSuccessModal();
            }
        });
    }

    // Get checkbox elements
    const selectAllHeader = document.getElementById('selectAllHeader');
    const selectAllBottom = document.getElementById('selectAllBottom');
    const selectAllButton = document.getElementById('selectAllButton');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');

    // Bottom select all button event (entire button is clickable)
    if (selectAllButton && selectAllBottom instanceof HTMLInputElement) {
        selectAllButton.addEventListener('click', function() {
            const isChecked = !selectAllBottom.checked;
            toggleAllCheckboxes(isChecked);
            
            if (selectAllHeader instanceof HTMLInputElement) {
                selectAllHeader.checked = isChecked;
                selectAllHeader.indeterminate = false;
            }
            
            selectAllBottom.checked = isChecked;
            selectAllBottom.indeterminate = false;
        });
    }

    // Individual checkbox events
    itemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectAllState);
    });

    // Initialize the state
    updateSelectAllState();
});
