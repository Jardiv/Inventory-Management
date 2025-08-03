import React from 'react';

// Function to generate an array of page numbers for pagination display
const generatePaginationPages = (currentPage, totalPages) => {
    const pages = [];
    const pageSet = new Set(); // Use a Set to avoid duplicate page numbers

    if (totalPages > 0) {
        pages.push(1);
        pageSet.add(1);
    } // Always include the first page

    if (currentPage > 4) {
        pages.push("...");
    } // Add ellipsis if current page is far from the beginning

    const start = Math.max(2, currentPage - 1); // Determine start of visible page range
    const end = Math.min(totalPages - 1, currentPage + 1); // Determine end of visible page range

    for (let i = start; i <= end; i++) {
        if (!pageSet.has(i)) {
            pages.push(i);
            pageSet.add(i);
        } // Add pages within the range
    }

    if (currentPage < totalPages - 3) {
        pages.push("...");
    } // Add ellipsis if current page is far from the end

    if (totalPages > 1 && !pageSet.has(totalPages)) {
        pages.push(totalPages);
        pageSet.add(totalPages);
    } // Always include the last page

    return pages;
};


export default function Pagination({ paginationData, handlePageChange, startItem, endItem }) {
    const paginationPages = generatePaginationPages(paginationData.currentPage, paginationData.totalPages);

    return (
        <div className="flex justify-between items-center pt-6 flex-shrink-0 mt-4">
            {/* Displaying current item range and total items */}
            <div className="text-textColor-tertiary text-sm">
                {paginationData.totalItems > 0
                    ? `Showing ${startItem}-${endItem} of ${paginationData.totalItems} transactions`
                    : "No transactions found"}
            </div>
            {/* Pagination buttons */}
            {paginationData.totalItems > 0 && paginationData.totalPages > 1 && (
                <div className="flex items-center gap-1">
                    {/* Previous page button */}
                    <a
                        href="#"
                        onClick={(e) => handlePageChange(e, paginationData.currentPage - 1)}
                        className={`p-2 rounded-md transition-colors ${
                            paginationData.hasPreviousPage ? "text-textColor-primary hover:bg-tbl-hover" : "text-gray-500 cursor-not-allowed"
                        }`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </a>
                    {/* Page number buttons */}
                    {paginationPages.map((page, index) =>
                        page === "..." ? (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                                ...
                            </span>
                        ) : (
                            <a
                                key={`page-${page}`}
                                href="#"
                                onClick={(e) => handlePageChange(e, page)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    page === paginationData.currentPage
                                        ? "bg-btn-primary text-white hover:bg-btn-hover"
                                        : "text-textColor-primary hover:bg-tbl-hover hover:text-white"
                                }`}>
                                {page}
                            </a>
                        )
                    )}
                    {/* Next page button */}
                    <a
                        href="#"
                        onClick={(e) => handlePageChange(e, paginationData.currentPage + 1)}
                        className={`p-2 rounded-md transition-colors ${
                            paginationData.hasNextPage ? "text-textColor-primary hover:bg-tbl-hover" : "text-gray-500 cursor-not-allowed"
                        }`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </a>
                </div>
            )}
        </div>
    );
}