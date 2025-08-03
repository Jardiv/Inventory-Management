// Modal functionality
const filterBtn = document.getElementById('filterBtn');
const filterModal = document.getElementById('filterModal');
const closeFilterBtn = document.getElementById('closeFilterBtn');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

if (filterBtn && filterModal && closeFilterBtn && applyFiltersBtn && clearFiltersBtn) {
    filterBtn.addEventListener('click', () => {
        filterModal.classList.remove('hidden');
        filterModal.classList.add('flex');
    });

    closeFilterBtn.addEventListener('click', () => {
        filterModal.classList.add('hidden');
        filterModal.classList.remove('flex');
    });

    // Close modal when clicking outside
    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            filterModal.classList.add('hidden');
            filterModal.classList.remove('flex');
        }
    });

    applyFiltersBtn.addEventListener('click', () => {
        // Get filter values
        const dateStart = document.getElementById('dateStart')?.value || '';
        const dateEnd = document.getElementById('dateEnd')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const supplier = document.getElementById('supplierFilter')?.value || '';
        const amountMin = document.getElementById('amountMin')?.value || '';
        const amountMax = document.getElementById('amountMax')?.value || '';

        // Send custom event to React component with filter data
        const filterEvent = new CustomEvent('applyFilters', {
            detail: {
                dateRange: { start: dateStart, end: dateEnd },
                status: status,
                supplier: supplier,
                amountRange: { min: amountMin, max: amountMax }
            }
        });
        window.dispatchEvent(filterEvent);

        // Close modal
        filterModal.classList.add('hidden');
        filterModal.classList.remove('flex');
    });

    clearFiltersBtn.addEventListener('click', () => {
        // Clear all form inputs
        const dateStart = document.getElementById('dateStart');
        const dateEnd = document.getElementById('dateEnd');
        const statusFilter = document.getElementById('statusFilter');
        const supplierFilter = document.getElementById('supplierFilter');
        const amountMin = document.getElementById('amountMin');
        const amountMax = document.getElementById('amountMax');

        if (dateStart) dateStart.value = '';
        if (dateEnd) dateEnd.value = '';
        if (statusFilter) statusFilter.selectedIndex = 0;
        if (supplierFilter) supplierFilter.selectedIndex = 0;
        if (amountMin) amountMin.value = '';
        if (amountMax) amountMax.value = '';

        // Send clear filters event to React component
        const clearEvent = new CustomEvent('clearFilters');
        window.dispatchEvent(clearEvent);
    });
}

// Pagination functionality
let currentPaginationData = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    startIndex: 1,
    endIndex: 0,
    itemsPerPage: 10
};

// Listen for pagination updates from React component
window.addEventListener('paginationUpdate', (event) => {
    currentPaginationData = event.detail;
    updatePaginationDisplay();
});

function updatePaginationDisplay() {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');

    if (!paginationContainer || !paginationInfo || !pageNumbers || !prevPageBtn || !nextPageBtn || !lastPageBtn) return;

    // Show pagination if there are items
    if (currentPaginationData.totalItems > 0) {
        paginationContainer.classList.remove('hidden');
        paginationContainer.classList.add('flex');
    } else {
        paginationContainer.classList.add('hidden');
        paginationContainer.classList.remove('flex');
        return;
    }

    // Update info text
    paginationInfo.textContent = `Showing ${currentPaginationData.startIndex}-${currentPaginationData.endIndex} of ${currentPaginationData.totalItems} purchase orders`;

    // Update previous button state
    if (currentPaginationData.currentPage === 1) {
        prevPageBtn.classList.add('text-gray-500', 'cursor-not-allowed');
        prevPageBtn.classList.remove('text-textColor-primary', 'hover:bg-gray-700');
        prevPageBtn.disabled = true;
    } else {
        prevPageBtn.classList.remove('text-gray-500', 'cursor-not-allowed');
        prevPageBtn.classList.add('text-textColor-primary', 'hover:bg-gray-700');
        prevPageBtn.disabled = false;
    }

    // Update next button state
    if (currentPaginationData.currentPage === currentPaginationData.totalPages) {
        nextPageBtn.classList.add('text-gray-500', 'cursor-not-allowed');
        nextPageBtn.classList.remove('text-textColor-primary', 'hover:bg-gray-700');
        nextPageBtn.disabled = true;
    } else {
        nextPageBtn.classList.remove('text-gray-500', 'cursor-not-allowed');
        nextPageBtn.classList.add('text-textColor-primary', 'hover:bg-gray-700');
        nextPageBtn.disabled = false;
    }

    // Update last page button state
    if (currentPaginationData.currentPage === currentPaginationData.totalPages) {
        lastPageBtn.classList.add('text-gray-500', 'cursor-not-allowed');
        lastPageBtn.classList.remove('text-textColor-primary', 'hover:bg-gray-700');
        lastPageBtn.disabled = true;
    } else {
        lastPageBtn.classList.remove('text-gray-500', 'cursor-not-allowed');
        lastPageBtn.classList.add('text-textColor-primary', 'hover:bg-gray-700');
        lastPageBtn.disabled = false;
    }

    // Generate page numbers with ellipsis and first/last page access
    pageNumbers.innerHTML = '';
    const totalPages = currentPaginationData.totalPages;
    const currentPage = currentPaginationData.currentPage;
    
    if (totalPages <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
            createPageButton(i, currentPage === i);
        }
    } else {
        // Always show first page
        createPageButton(1, currentPage === 1);
        
        if (currentPage > 4) {
            // Show ellipsis after first page if current page is far from start
            createEllipsis();
        }
        
        // Calculate the range around current page
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // Adjust range to always show 3 pages in the middle (when possible)
        if (currentPage <= 4) {
            endPage = Math.min(totalPages - 1, 5);
        }
        if (currentPage >= totalPages - 3) {
            startPage = Math.max(2, totalPages - 4);
        }
        
        // Show pages around current page
        for (let i = startPage; i <= endPage; i++) {
            createPageButton(i, currentPage === i);
        }
        
        if (currentPage < totalPages - 3) {
            // Show ellipsis before last page if current page is far from end
            createEllipsis();
        }
        
        // Always show last page
        if (totalPages > 1) {
            createPageButton(totalPages, currentPage === totalPages);
        }
    }
}

function createPageButton(pageNumber, isActive) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = pageNumber;
    pageBtn.className = `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
            ? 'bg-btn-primary text-white'
            : 'text-textColor-primary hover:bg-gray-700 hover:text-white'
    }`;
    pageBtn.addEventListener('click', () => changePage(pageNumber));
    document.getElementById('pageNumbers').appendChild(pageBtn);
}

function createEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'px-2 py-2 text-textColor-tertiary text-sm';
    document.getElementById('pageNumbers').appendChild(ellipsis);
}

function changePage(page) {
    const changePageEvent = new CustomEvent('changePage', {
        detail: { page: page }
    });
    window.dispatchEvent(changePageEvent);
}

// Add event listeners for navigation buttons
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const lastPageBtn = document.getElementById('lastPageBtn');

if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPaginationData.currentPage > 1) {
            changePage(currentPaginationData.currentPage - 1);
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        if (currentPaginationData.currentPage < currentPaginationData.totalPages) {
            changePage(currentPaginationData.currentPage + 1);
        }
    });
}

if (lastPageBtn) {
    lastPageBtn.addEventListener('click', () => {
        if (currentPaginationData.currentPage < currentPaginationData.totalPages) {
            changePage(currentPaginationData.totalPages);
        }
    });
}
