import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  // Get Page Title from route path
  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/customers')) return 'Customer CRM';
    if (pathname.includes('/products')) return 'Products Catalog';
    if (pathname.includes('/inventory')) return 'Inventory & Stock Control';
    if (pathname.includes('/challans')) return 'Sales Delivery Challans';
    return 'Executive ERP Dashboard';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 35,
          }}
        />
      )}

      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle(location.pathname)}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
