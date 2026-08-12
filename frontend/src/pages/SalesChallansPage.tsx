import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, CheckCircle2, XCircle, Trash2, AlertCircle } from 'lucide-react';
import {
  SalesChallan,
  Customer,
  Product,
  ChallanItemInput,
} from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const SalesChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageChallans = hasRole('ADMIN', 'SALES');

  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Dropdown options for Creation
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);

  // Form State for Creating Challan
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [challanItems, setChallanItems] = useState<ChallanItemInput[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' }>({
    message: null,
    type: 'success',
  });

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/sales-challans', { params });
      if (res.data.success) {
        setChallans(res.data.data.challans);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch sales challans.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchDropdownOptions = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?page=1&limit=100'),
        api.get('/products?page=1&limit=100'),
      ]);
      if (custRes.data.success) setCustomersList(custRes.data.data.customers);
      if (prodRes.data.success) setProductsList(prodRes.data.data.products);
    } catch (err) {
      console.error('Failed to load customers or products dropdown list:', err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const handleOpenCreateModal = async () => {
    await fetchDropdownOptions();
    setSelectedCustomerId('');
    setChallanItems([]);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (productsList.length === 0) return;
    setChallanItems([...challanItems, { product_id: productsList[0].id, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    const updated = [...challanItems];
    updated.splice(index, 1);
    setChallanItems(updated);
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const updated = [...challanItems];
    updated[index].product_id = productId;
    setChallanItems(updated);
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...challanItems];
    updated[index].quantity = Math.max(1, quantity);
    setChallanItems(updated);
  };

  // Calculate live grand totals for creation form
  const getLiveTotals = () => {
    let totalQty = 0;
    let totalAmt = 0;
    const prodMap = new Map(productsList.map((p) => [p.id, p]));

    for (const item of challanItems) {
      totalQty += item.quantity;
      const product = prodMap.get(item.product_id);
      if (product) {
        totalAmt += item.quantity * product.unit_price;
      }
    }
    return { totalQty, totalAmt };
  };

  const handleCreateChallanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setToast({ message: 'Please select a customer.', type: 'error' });
      return;
    }

    if (challanItems.length === 0) {
      setToast({ message: 'Please add at least one product item to the sales challan.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomerId,
        items: challanItems,
      };

      const res = await api.post('/sales-challans', payload);
      if (res.data.success) {
        setToast({ message: res.data.message || 'Sales challan created successfully as DRAFT.', type: 'success' });
        setIsCreateModalOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to create sales challan.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetailModal = async (id: string) => {
    try {
      const res = await api.get(`/sales-challans/${id}`);
      if (res.data.success) {
        setSelectedChallan(res.data.data.challan);
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch sales challan details.', type: 'error' });
    }
  };

  const handleOpenConfirmModal = (challan: SalesChallan) => {
    setSelectedChallan(challan);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmChallan = async () => {
    if (!selectedChallan) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/sales-challans/${selectedChallan.id}/confirm`);
      if (res.data.success) {
        setToast({ message: res.data.message || 'Sales challan CONFIRMED successfully! Inventory deducted.', type: 'success' });
        setIsConfirmModalOpen(false);
        setIsDetailModalOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to confirm sales challan.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelChallan = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this DRAFT sales challan?')) return;
    try {
      const res = await api.post(`/sales-challans/${id}/cancel`);
      if (res.data.success) {
        setToast({ message: 'Sales challan CANCELLED successfully.', type: 'success' });
        fetchChallans();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to cancel sales challan.', type: 'error' });
    }
  };

  const liveTotals = getLiveTotals();

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: null, type: 'success' })} />

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Sales Delivery Challans</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Issue DRAFT delivery challans, snapshot product prices, and trigger atomic inventory dispatches.</p>
        </div>

        {canManageChallans && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Create Sales Challan
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
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
        <div style={{ position: 'relative', gridColumn: 'span 2' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by challan number or customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Main Challans Table */}
      {loading ? (
        <LoadingSpinner message="Fetching sales challans list..." />
      ) : challans.length === 0 ? (
        <EmptyState
          title="No Sales Challans Found"
          description="There are no delivery challans matching your query."
          action={
            canManageChallans ? (
              <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                <Plus size={16} /> Create First Challan
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Total Items Qty</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date & Creator</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {ch.challan_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ch.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ch.customer_business_name}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ch.total_quantity}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      ₹{ch.total_amount ? ch.total_amount.toFixed(2) : '0.00'}
                    </td>
                    <td><Badge status={ch.status} /></td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      <div>{new Date(ch.created_at).toLocaleDateString()}</div>
                      <div>By: {ch.creator_name || 'System'}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                          onClick={() => handleOpenDetailModal(ch.id)}
                          title="View Complete Challan Details"
                        >
                          <Eye size={15} /> Details
                        </button>

                        {canManageChallans && ch.status === 'DRAFT' && (
                          <>
                            <button
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                              onClick={() => handleOpenConfirmModal(ch)}
                              title="Confirm Challan & Deduct Stock"
                            >
                              <CheckCircle2 size={15} /> Confirm
                            </button>

                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                              onClick={() => handleCancelChallan(ch.id)}
                              title="Cancel DRAFT Challan"
                            >
                              <XCircle size={15} /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={10}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* CREATE SALES CHALLAN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New DRAFT Sales Delivery Challan"
        maxWidth="720px"
      >
        <form onSubmit={handleCreateChallanSubmit}>
          <div className="form-group">
            <label className="form-label">Select Customer Account *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="" disabled>-- Select Customer --</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.business_name}) — {c.customer_type}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Picker */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Challan Line Items (Product Snapshots) *</label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={handleAddItemRow}
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {challanItems.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                Click "+ Add Line Item" above to add products to this challan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {challanItems.map((item, idx) => {
                  const selectedProd = productsList.find((p) => p.id === item.product_id);
                  const unitPrice = selectedProd ? selectedProd.unit_price : 0;
                  const lineTotal = item.quantity * unitPrice;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
                        gap: '0.75rem',
                        alignItems: 'center',
                        backgroundColor: 'var(--bg-input)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <select
                          className="form-select"
                          value={item.product_id}
                          onChange={(e) => handleItemProductChange(idx, e.target.value)}
                        >
                          {productsList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — Available: {p.current_stock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                          placeholder="Qty"
                          required
                        />
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        ₹{unitPrice.toFixed(2)} / unit
                      </div>

                      <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9rem' }}>
                        ₹{lineTotal.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="Remove Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live Totals Summary Card */}
            {challanItems.length > 0 && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Items Quantity: </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{liveTotals.totalQty} units</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Calculated Total Amount: </span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>₹{liveTotals.totalAmt.toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || challanItems.length === 0}>
              {submitting ? 'Creating DRAFT...' : 'Save DRAFT Sales Challan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHALLAN DETAIL VIEW MODAL */}
      {selectedChallan && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Sales Delivery Challan: ${selectedChallan.challan_number}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Challan Reference:</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                  {selectedChallan.challan_number}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge status={selectedChallan.status} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Date: {new Date(selectedChallan.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Customer Account Information
              </h4>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Customer Name:</strong> {selectedChallan.customer_name}</div>
                <div><strong>Business / Firm:</strong> {selectedChallan.customer_business_name}</div>
                <div><strong>Mobile:</strong> {selectedChallan.customer_mobile}</div>
                <div><strong>Email:</strong> {selectedChallan.customer_email || 'N/A'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Delivery Address:</strong> {selectedChallan.customer_address}</div>
              </div>
            </div>

            {/* Items Table Snapshot */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Snapshot Line Items (Price & Product Preservation)
              </h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product Name (Snapshot)</th>
                      <th>SKU Snapshot</th>
                      <th>Unit Price Snapshot</th>
                      <th>Qty</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name_snapshot}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.8rem' }}>
                            {item.sku_snapshot}
                          </span>
                        </td>
                        <td>₹{item.unit_price_snapshot.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{item.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong>Total Quantity:</strong> {selectedChallan.total_quantity} items
              </div>
              <div>
                <strong>Grand Total Amount:</strong>{' '}
                <span style={{ fontSize: '1.2rem', color: 'var(--success)', fontWeight: 700 }}>
                  ₹{selectedChallan.total_amount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Confirm button in detail view if DRAFT */}
            {canManageChallans && selectedChallan.status === 'DRAFT' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenConfirmModal(selectedChallan);
                  }}
                >
                  <CheckCircle2 size={16} /> Confirm Challan & Deduct Stock
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRM CHALLAN CONFIRMATION DIALOG */}
      {selectedChallan && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Sales Delivery Challan"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: '#fbbf24' }}>
              <AlertCircle size={24} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.9rem' }}>
                Confirming challan <strong>{selectedChallan.challan_number}</strong> will execute an atomic PostgreSQL transaction that deducts inventory stock for all items and creates OUT movement logs.
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              This action cannot be edited after confirmation. Are you sure you want to proceed?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleConfirmChallan} disabled={submitting}>
                {submitting ? 'Executing Transaction...' : 'Yes, Confirm & Deduct Stock'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
