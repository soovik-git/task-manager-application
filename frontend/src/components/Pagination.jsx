import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        style={{ background: 'var(--color-surface)', color: currentPage === 1 ? '#475569' : 'white' }}
      >
        Previous
      </button>
      
      <span>Page {currentPage} of {totalPages}</span>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        style={{ background: 'var(--color-surface)', color: currentPage === totalPages ? '#475569' : 'white' }}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
