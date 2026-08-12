import React, { useState, useEffect, useCallback } from 'react';
import { Boxes, ArrowUpRight, ArrowDownLeft, History, MapPin } from 'lucide-react';
import { Product, StockMovement, StockMovementFormData, MovementType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialMovementForm: StockMovementFormData = {
  product_id: '',
  quantity: '',
  movement_type: 'IN',
  reason: '',
};

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageInventory = hasRole('ADMIN', 'WAREHOUSE');

  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  // Stock Level State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Stock Movements State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalMovements, setTotalMovements] = useState<number>(0);
  const [movementPage, setMovementPage] = useState<number>(1);
  const [totalMovementPages, setTotalMovementPages] = useState<number>(1);
  const [loadingMovements, setLoadingMovements] = useState<boolean>(true);

  // Movement Filters
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterMovementType, setFilterMovementType] = useState<string>('');

  // Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<StockMovementFormData>(initialMovementForm);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' }>({
    message: null,
    type: 'success',
  });

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products?page=1&limit=100');
      if (res.data.success) {
        setProducts(res.data.data.products);
      }
    } catch (err: any) {
      console.error('Failed to fetch products for stock grid:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      const params: any = { page: movementPage, limit: 10 };
      if (filterProductId) params.product_id = filterProductId;
      if (filterMovementType) params.movement_type = filterMovementType;

      const res = await api.get('/stock-movements', { params });
      if (res.data.success) {
        setMovements(res.data.data.movements);
        setTotalMovements(res.data.data.total);
        setTotalMovementPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to fetch stock movements:', err);
    } finally {
      setLoadingMovements(false);
    }
  }, [movementPage, filterProductId, filterMovementType]);

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, [fetchProducts, fetchMovements]);

  const handleOpenMovementModal = (productId = '', type: MovementType = 'IN') => {
    setFormData({
      product_id: productId || (products[0]?.id || ''),
      quantity: '',
      movement_type: type,
      reason: '',
    });
    setIsMovementModalOpen(true);
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      setToast({ message: 'Please select a valid product.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        product_id: formData.product_id,
        quantity: Number(formData.quantity),
        movement_type: formData.movement_type,
        reason: formData.reason.trim(),
      };

      const res = await api.post('/stock-movements', payload);
      if (res.data.success) {
        setToast({ message: res.data.message || 'Stock movement recorded successfully.', type: 'success' });
        setIsMovementModalOpen(false);
        fetchProducts();
        fetchMovements();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to record stock movement.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: null, type: 'success' })} />

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Inventory & Stock Control</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor live stock levels and audit stock entry (IN) & dispatch (OUT) history.</p>
        </div>

        {canManageInventory && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-success" onClick={() => handleOpenMovementModal('', 'IN')}>
              <ArrowUpRight size={18} /> Add Stock (IN)
            </button>
            <button className="btn btn-danger" onClick={() => handleOpenMovementModal('', 'OUT')}>
              <ArrowDownLeft size={18} /> Remove Stock (OUT)
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation Buttons */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'stock' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'stock' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'stock' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Boxes size={18} /> Current Stock Grid
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'history' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <History size={18} /> Audit Movement Logs
        </button>
      </div>

      {/* TAB 1: CURRENT STOCK GRID */}
      {activeTab === 'stock' && (
        <>
          {loadingProducts ? (
            <LoadingSpinner message="Loading live stock balances..." />
          ) : products.length === 0 ? (
            <EmptyState title="No Inventory Items" description="Catalog is currently empty." />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Warehouse Location</th>
                    <th>Available Stock</th>
                    <th>Min Alert Threshold</th>
                    <th>Status</th>
                    {canManageInventory && <th style={{ textAlign: 'right' }}>Quick Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.current_stock <= p.min_stock_alert;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent)' }}>
                            {p.sku}
                          </span>
                        </td>
                        <td>{p.category}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <MapPin size={13} style={{ display: 'inline', marginRight: '0.2rem' }} /> {p.warehouse_location}
                        </td>
                        <td style={{ fontSize: '1.05rem', fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-main)' }}>
                          {p.current_stock}
                        </td>
                        <td>{p.min_stock_alert}</td>
                        <td>
                          {isLow ? <Badge status="Low Stock" /> : <Badge status="ACTIVE" />}
                        </td>
                        {canManageInventory && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-success"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleOpenMovementModal(p.id, 'IN')}
                              >
                                + IN
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleOpenMovementModal(p.id, 'OUT')}
                              >
                                - OUT
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: AUDIT MOVEMENT LOGS */}
      {activeTab === 'history' && (
        <>
          {/* Movement Filters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <select
              className="form-select"
              value={filterProductId}
              onChange={(e) => {
                setFilterProductId(e.target.value);
                setMovementPage(1);
              }}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={filterMovementType}
              onChange={(e) => {
                setFilterMovementType(e.target.value);
                setMovementPage(1);
              }}
            >
              <option value="">All Movement Types</option>
              <option value="IN">IN (Stock Addition)</option>
              <option value="OUT">OUT (Stock Dispatch)</option>
            </select>
          </div>

          {loadingMovements ? (
            <LoadingSpinner message="Loading stock movement history..." />
          ) : movements.length === 0 ? (
            <EmptyState title="No Movement Audit Logs" description="No stock transactions recorded yet." />
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Product</th>
                      <th>Movement Type</th>
                      <th>Qty Changed</th>
                      <th>Reason / Reference</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent)' }}>
                            {m.product_sku}
                          </div>
                        </td>
                        <td><Badge status={m.movement_type} /></td>
                        <td style={{ fontWeight: 700, color: m.movement_type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                          {m.movement_type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{m.reason}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.creator_name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={movementPage}
                totalPages={totalMovementPages}
                total={totalMovements}
                limit={10}
                onPageChange={(newPage) => setMovementPage(newPage)}
              />
            </>
          )}
        </>
      )}

      {/* Record Stock Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`Record Stock Movement (${formData.movement_type})`}
      >
        <form onSubmit={handleRecordMovement}>
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-select"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              required
            >
              <option value="" disabled>-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.current_stock}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <select
                className="form-select"
                value={formData.movement_type}
                onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as MovementType })}
              >
                <option value="IN">IN (Add Stock)</option>
                <option value="OUT">OUT (Deduct Stock)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? Number(e.target.value) : '' })}
                placeholder="Positive integer quantity"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference Note *</label>
            <textarea
              className="form-textarea"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Received shipment from supplier Ref #INV-9021 or Stock adjustment"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsMovementModalOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${formData.movement_type === 'IN' ? 'btn-success' : 'btn-danger'}`}
              disabled={submitting}
            >
              {submitting ? 'Processing Transaction...' : `Confirm ${formData.movement_type} Movement`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
