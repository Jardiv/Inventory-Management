import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function StatusFilter({ availableStatuses, onFilterChange, isAbleToSort = true }) {
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [isPopupOpen, setPopupOpen] = useState(false);
    const popupRef = useRef(null);

    if(!isAbleToSort){
        return "Status"
    }

    const handleStatusChange = (status) => {
        setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
    };

    const applyFilters = useCallback(() => {
        onFilterChange(selectedStatuses);
        setPopupOpen(false);
    }, [selectedStatuses, onFilterChange]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                applyFilters();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [popupRef, applyFilters]);

    const getButtonText = () => {
        if (selectedStatuses.length === 0) return 'Status';
        if (selectedStatuses.length === 1) return selectedStatuses[0];
        return `${selectedStatuses.length} statuses`;
    };

    return (
        <div className="relative inline-block text-left" ref={popupRef}>
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={() => setPopupOpen(!isPopupOpen)}
                >
                    {getButtonText()}
                    <svg
                        className="-mr-1 ml-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
            {isPopupOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background text-textColor-primary ring-black ring-opacity-5 z-10">
                    <div className="p-2" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="px-2 py-1">
                            <label className="font-semibold">Filter by Status</label>
                        </div>
                        {availableStatuses.map((status) => (
                            <label key={status} className="flex items-center px-2 py-1 text-sm cursor-pointer rounded-md">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={() => handleStatusChange(status)}
                                />
                                <span className="ml-2">{status}</span>
                            </label>
                        ))}
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={applyFilters}
                                className="px-3 py-1 bg-btn-primary text-white rounded-md text-sm hover:bg-btn-hover"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
