

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
const transferModal = document.getElementById('transferModal');
const openTransferBtn = document.getElementById('open-transfer-modal');
const closeTransferBtn = document.getElementById('close-transfer-modal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');

// Open modal
if (openTransferBtn) {
    openTransferBtn.addEventListener('click', () => {
        transferModal.classList.remove('hidden');
    });
}

// Close modal on cancel or X
if (closeTransferBtn && cancelBtn) {
    [closeTransferBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            transferModal.classList.add('hidden');
        });
    });
}

// Close on outside click
if (transferModal) {
    transferModal.addEventListener('click', (e) => {
        if (e.target === transferModal) {
            transferModal.classList.add('hidden');
        }
    });
}

// Confirm action
if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
        const itemName = document.getElementById('itemName')?.value;
        const category = document.getElementById('category')?.value;
        const description = document.getElementById('description')?.value;
        const minQty = document.getElementById('minQty')?.value;
        const maxQty = document.getElementById('maxQty')?.value;
        const autoReorder = document.getElementById('autoReorder')?.checked;

        console.log('New Product:', {
            itemName,
            category,
            description,
            minQty,
            maxQty,
            autoReorder
        });

        // Close modal after confirm
        transferModal.classList.add('hidden');

        // You can add code here to actually insert the data into your table or backend
    });
}

const btn = document.getElementById('toggle-filters');
const icon = document.getElementById('filterIcon');

if (btn) {
    btn.addEventListener('click', () => {
        btn.classList.toggle('bg-violet-600');
        btn.classList.toggle('text-white');
    });
}

const toggleBtn = document.getElementById('toggle-filters');
const filterPanel = document.getElementById('filter-panel');

if (toggleBtn && filterPanel) {
    toggleBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('hidden');
        toggleBtn.classList.toggle('active-filter');
    });
}

// Allow only one checkbox in availability section
const checkboxes = document.querySelectorAll('.availability-option');
if (checkboxes.length > 0) {
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            checkboxes.forEach(other => {
                if (other !== cb) other.checked = false;
            });
        });
    });
}

}); // End of DOMContentLoaded

