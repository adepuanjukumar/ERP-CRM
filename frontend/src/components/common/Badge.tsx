import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  let badgeStyle = 'badge-gray';

  switch (normalized) {
    // Challan Status
    case 'DRAFT':
      badgeStyle = 'badge-warning';
      break;
    case 'CONFIRMED':
    case 'ACTIVE':
    case 'IN':
      badgeStyle = 'badge-success';
      break;
    case 'CANCELLED':
    case 'INACTIVE':
    case 'OUT':
      badgeStyle = 'badge-danger';
      break;
    case 'LEAD':
      badgeStyle = 'badge-primary';
      break;

    // Customer Types
    case 'WHOLESALE':
      badgeStyle = 'badge-purple';
      break;
    case 'DISTRIBUTOR':
      badgeStyle = 'badge-primary';
      break;
    case 'RETAIL':
      badgeStyle = 'badge-gray';
      break;

    // Roles
    case 'ADMIN':
      badgeStyle = 'badge-purple';
      break;
    case 'SALES':
      badgeStyle = 'badge-primary';
      break;
    case 'WAREHOUSE':
      badgeStyle = 'badge-warning';
      break;
    case 'ACCOUNTS':
      badgeStyle = 'badge-success';
      break;

    default:
      badgeStyle = 'badge-gray';
  }

  return <span className={`badge ${badgeStyle} ${className}`}>{status}</span>;
};
