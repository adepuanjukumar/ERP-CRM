import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  if (total === 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1.25rem',
        padding: '0.75rem 0.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}
    >
      <div>
        Showing <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{startRecord}</span> to{' '}
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{endRecord}</span> of{' '}
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{total}</span> entries
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ padding: '0.375rem 0.75rem' }}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <span style={{ padding: '0 0.5rem', fontWeight: 500 }}>
          Page {page} of {totalPages || 1}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ padding: '0.375rem 0.75rem' }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
