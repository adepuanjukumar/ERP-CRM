import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import api from '../services/api';
import { SalesChallan, Product } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [totalChallans, setTotalChallans] = useState<number>(0);
  const [recentChallans, setRecentChallans] = useState<SalesChallan[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes, lowStockRes, challanRes] = await Promise.all([
          api.get('/customers?page=1&limit=1'),
          api.get('/products?page=1&limit=1'),
          api.get('/products?page=1&limit=5&low_stock=true'),
          api.get('/sales-challans?page=1&limit=5'),
        ]);

        if (custRes.data.success) setTotalCustomers(custRes.data.data.total);
        if (prodRes.data.success) setTotalProducts(prodRes.data.data.total);
        if (lowStockRes.data.success) {
          setLowStockCount(lowStockRes.data.data.total);
          setLowStockProducts(lowStockRes.data.data.products);
        }
        if (challanRes.data.success) {
          setTotalChallans(challanRes.data.data.total);
          setRecentChallans(challanRes.data.data.challans);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading ERP Dashboard metrics..." />;
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Welcome back, {user?.name}! 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            System Role:{' '}
            <strong style={{ color: 'var(--text-main)' }}>{user?.role}</strong> — Wholesale Enterprise Operations Center
          </p>
        </div>

        {/* Role-based Quick Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(user?.role === 'SALES' || user?.role === 'ADMIN') && (
            <button className="btn btn-primary" onClick={() => navigate('/challans')}>
              <Plus size={18} /> Create Sales Challan
            </button>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS') && (
            <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
              <Users size={18} /> Manage CRM
            </button>
          )}
          {(user?.role === 'WAREHOUSE' || user?.role === 'ADMIN') && (
            <button className="btn btn-secondary" onClick={() => navigate('/inventory')}>
              <Package size={18} /> Stock Movements
            </button>
          )}
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total CRM Customers</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.1rem' }}>{totalCustomers}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Products Catalog</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.1rem' }}>{totalProducts}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Low Stock Alerts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.1rem', color: lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>
              {lowStockCount}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Sales Challans</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.1rem' }}>{totalChallans}</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Recent Sales Challans */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Recent Sales Challans</h3>
            <button className="btn btn-secondary" onClick={() => navigate('/challans')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          {recentChallans.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent sales challans recorded.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChallans.map((ch) => (
                    <tr key={ch.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/challans')}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{ch.challan_number}</td>
                      <td>{ch.customer_name || 'N/A'}</td>
                      <td>{ch.total_quantity}</td>
                      <td><Badge status={ch.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Warning Alert Widget */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Low Stock Alert Monitor</h3>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/inventory')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              Inventory <ArrowRight size={14} />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={28} style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>All inventory items are healthy and above alert threshold.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Available</th>
                    <th>Min Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.sku}</td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{p.current_stock}</td>
                      <td>{p.min_stock_alert}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
