
import React from 'react';

interface PaginationProps {
    currentPage: number;
    hasNextPage: boolean;
    onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, hasNextPage, onPageChange }) => {
    return (
        <div className="flex justify-center items-center space-x-4 my-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition"
            >
                &larr; Previous
            </button>
            <span className="text-lg font-semibold text-white">
                Page {currentPage}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition"
            >
                Next &rarr;
            </button>
        </div>
    );
};