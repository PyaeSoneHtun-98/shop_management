import React from 'react';
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

function Pagination({
  currentPage,
  totalRows,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage
}) {
  // Calculate total pages
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of page numbers to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onChangePage(page);
    }
  };
  
  // Options for rows per page dropdown
  const rowsPerPageOptions = [10, 25, 50, 100];
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center py-3 px-4 bg-gray-800 border-t border-gray-700">
      {/* Rows per page selector */}
      <div className="flex items-center mb-3 md:mb-0 text-gray-300 text-sm">
        <span className="mr-2">Rows per page:</span>
        <select
          className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={rowsPerPage}
          onChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
        >
          {rowsPerPageOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      
      {/* Pagination buttons - moved to middle */}
      <div className="flex items-center space-x-1 mb-3 md:mb-0 order-last md:order-none">
        {/* First page button */}
        <button
          className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="First Page"
        >
          <FaAngleDoubleLeft size={14} />
        </button>
        
        {/* Previous page button */}
        <button
          className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          <FaAngleLeft size={14} />
        </button>
        
        {/* Page number buttons */}
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${page === '...' ? 'text-gray-400 cursor-default' : page === currentPage ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
            onClick={() => page !== '...' && handlePageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
        
        {/* Next page button */}
        <button
          className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          <FaAngleRight size={14} />
        </button>
        
        {/* Last page button */}
        <button
          className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last Page"
        >
          <FaAngleDoubleRight size={14} />
        </button>
      </div>
      
      {/* Page information - moved to right */}
      <div className="text-gray-300 text-sm mb-3 md:mb-0">
        {totalRows === 0 ? (
          'No records to display'
        ) : (
          `Showing ${Math.min((currentPage - 1) * rowsPerPage + 1, totalRows)} to ${Math.min(currentPage * rowsPerPage, totalRows)} of ${totalRows} records`
        )}
      </div>
    </div>
  );
}

export default Pagination;