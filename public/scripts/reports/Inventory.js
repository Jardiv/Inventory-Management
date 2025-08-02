// Inventory Reports JavaScript
// This file contains all the client-side functionality for the Inventory Reports page

// Pagination state
let currentPaginationData = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    startIndex: 1,
    endIndex: 0,
    itemsPerPage: 10
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFilterButton();
    initializePaginationButtons();
    setupPaginationListener();
});

// Filter button functionality
function initializeFilterButton() {
    const filterBtn = document.getElementById('filterBtn');
    
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            window.dispatchEvent(new CustomEvent('openFilterModal'));
        });
        
        window.addEventListener('filterModalStateChange', function(event) {
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

// Setup pagination event listener
function setupPaginationListener() {
    window.addEventListener('inventoryPaginationUpdate', (event) => {
        currentPaginationData = event.detail;
        updatePaginationDisplay();
    });
}

// Main pagination display function
function updatePaginationDisplay() {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    
    if (!paginationContainer || !paginationInfo) return;

    // Show/Hide pagination based on data
    if (currentPaginationData.totalItems > 0) {
        paginationContainer.classList.remove('hidden');
        paginationContainer.classList.add('flex');
        
        // Update info text
        paginationInfo.textContent = `Showing ${currentPaginationData.startIndex}-${currentPaginationData.endIndex} of ${currentPaginationData.totalItems} inventory items`;
        
        // Update button states
        updateButtonStates();
        
        // Generate page numbers
        generatePageNumbers();
    } else {
        paginationContainer.classList.add('hidden');
        paginationContainer.classList.remove('flex');
    }
}

// Update button states (enabled/disabled)
function updateButtonStates() {
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    
    const isFirstPage = currentPaginationData.currentPage === 1;
    const isLastPage = currentPaginationData.currentPage === currentPaginationData.totalPages;
    
    // First and Previous buttons
    [firstPageBtn, prevPageBtn].forEach(btn => {
        if (btn) {
            if (isFirstPage) {
                btn.classList.add('text-gray-500', 'cursor-not-allowed');
                btn.classList.remove('text-textColor-primary', 'hover:bg-gray-700');
                btn.disabled = true;
            } else {
                btn.classList.remove('text-gray-500', 'cursor-not-allowed');
                btn.classList.add('text-textColor-primary', 'hover:bg-gray-700');
                btn.disabled = false;
            }
        }
    });
    
    // Next and Last buttons
    [nextPageBtn, lastPageBtn].forEach(btn => {
        if (btn) {
            if (isLastPage) {
                btn.classList.add('text-gray-500', 'cursor-not-allowed');
                btn.classList.remove('text-textColor-primary', 'hover:bg-gray-700');
                btn.disabled = true;
            } else {
                btn.classList.remove('text-gray-500', 'cursor-not-allowed');
                btn.classList.add('text-textColor-primary', 'hover:bg-gray-700');
                btn.disabled = false;
            }
        }
    });
}

// Generate page number buttons with ellipsis
function generatePageNumbers() {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    
    const totalPages = currentPaginationData.totalPages;
    const currentPage = currentPaginationData.currentPage;
    
    if (totalPages <= 1) return;
    
    if (totalPages <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
            createPageButton(i, currentPage === i);
        }
    } else {
        // Complex pagination with ellipsis
        createAdvancedPagination(currentPage, totalPages);
    }
}

// Create advanced pagination with ellipsis
function createAdvancedPagination(currentPage, totalPages) {
    // Always show first page
    createPageButton(1, currentPage === 1);
    
    let startPage, endPage;
    let showStartEllipsis = false;
    let showEndEllipsis = false;
    
    if (currentPage <= 4) {
        // Near the beginning
        startPage = 2;
        endPage = Math.min(5, totalPages - 1);
        showEndEllipsis = endPage < totalPages - 1;
    } else if (currentPage >= totalPages - 3) {
        // Near the end
        startPage = Math.max(totalPages - 4, 2);
        endPage = totalPages - 1;
        showStartEllipsis = startPage > 2;
    } else {
        // In the middle
        startPage = currentPage - 1;
        endPage = currentPage + 1;
        showStartEllipsis = true;
        showEndEllipsis = true;
    }
    
    // Show start ellipsis
    if (showStartEllipsis) {
        createEllipsis();
    }
    
    // Show middle pages
    for (let i = startPage; i <= endPage; i++) {
        if (i >= 2 && i <= totalPages - 1) {
            createPageButton(i, currentPage === i);
        }
    }
    
    // Show end ellipsis
    if (showEndEllipsis) {
        createEllipsis();
    }
    
    // Always show last page
    if (totalPages > 1) {
        createPageButton(totalPages, currentPage === totalPages);
    }
}

// Create a page button
function createPageButton(pageNumber, isActive) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = pageNumber.toString();
    pageBtn.className = `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
            ? 'bg-btn-primary text-white'
            : 'text-textColor-primary hover:bg-gray-700 hover:text-white'
    }`;
    
    if (!isActive) {
        pageBtn.addEventListener('click', () => changePage(pageNumber));
    }
    
    document.getElementById('pageNumbers').appendChild(pageBtn);
}

// Create ellipsis indicator
function createEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'px-2 py-2 text-textColor-tertiary text-sm select-none';
    document.getElementById('pageNumbers').appendChild(ellipsis);
}

// Change to specific page
function changePage(page) {
    if (page >= 1 && page <= currentPaginationData.totalPages && page !== currentPaginationData.currentPage) {
        const changePageEvent = new CustomEvent('inventoryChangePage', {
            detail: { page: page }
        });
        window.dispatchEvent(changePageEvent);
    }
}

// Initialize pagination button event listeners
function initializePaginationButtons() {
    // First page button
    const firstPageBtn = document.getElementById('firstPageBtn');
    if (firstPageBtn) {
        firstPageBtn.addEventListener('click', () => changePage(1));
    }
    
    // Previous page button
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            changePage(currentPaginationData.currentPage - 1);
        });
    }
    
    // Next page button
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            changePage(currentPaginationData.currentPage + 1);
        });
    }
    
    // Last page button
    const lastPageBtn = document.getElementById('lastPageBtn');
    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', () => {
            changePage(currentPaginationData.totalPages);
        });
    }
}
