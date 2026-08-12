import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Edit, MapPin } from 'lucide-react';
import { Product, ProductFormData } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialFormState: ProductFormData = {
  name: '',
  sku: '',
  category: '',
  unit_price: '',
  current_stock: '',
  min_stock_alert: 10,
  warehouse_location: '',
};

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageProducts = hasRole('ADMIN', 'WAREHOUSE');

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormState);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' }>({
    message: null,
    type: 'success',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter.trim()) params.category = categoryFilter.trim();
      if (lowStockOnly) params.low_stock = true;

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.data.products);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch products.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit_price: product.unit_price,
      current_stock: product.current_stock,
      min_stock_alert: product.min_stock_alert,
      warehouse_location: product.warehouse_location,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        unit_price: Number(formData.unit_price),
        current_stock: Number(formData.current_stock || 0),
        min_stock_alert: Number(formData.min_stock_alert || 10),
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        setToast({ message: 'Product added to catalog successfully.', type: 'success' });
        setIsAddModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to add product.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        unit_price: Number(formData.unit_price),
        current_stock: Number(formData.current_stock),
        min_stock_alert: Number(formData.min_stock_alert),
      };

      const res = await api.put(`/products/${selectedProduct.id}`, payload);
      if (res.data.success) {
        setToast({ message: 'Product details updated successfully.', type: 'success' });
        setIsEditModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to update product.', type: 'error' });
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
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Products Catalog</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage wholesale items, SKU codes, categories, pricing, and alert thresholds.</p>
        </div>

        {canManageProducts && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            placeholder="Search by product name or SKU code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-main)' }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              style={{ accentColor: 'var(--warning)', width: '16px', height: '16px' }}
            />
            ⚠️ Show Low Stock Only
          </label>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <LoadingSpinner message="Fetching products catalog..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No Products Found"
          description="There are no catalog products matching your query."
          action={
            canManageProducts ? (
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} /> Add First Product
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
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Warehouse Bin</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLowStock = p.current_stock <= p.min_stock_alert;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: 'var(--accent)', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {p.sku}
                        </span>
                      </td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        ₹{p.unit_price.toFixed(2)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: isLowStock ? 'var(--danger)' : 'var(--text-main)' }}>
                          {p.current_stock}
                        </span>
                        {isLowStock && (
                          <span style={{ marginLeft: '0.5rem' }}>
                            <Badge status="Low Stock" />
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <MapPin size={13} style={{ display: 'inline', marginRight: '0.2rem' }} /> {p.warehouse_location}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                            onClick={() => handleOpenDetailModal(p)}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {canManageProducts && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Item"
                            >
                              <Edit size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Catalog Product"
      >
        <form onSubmit={handleCreateProduct}>
          <div className="form-group">
            <label className="form-label">Product Display Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Industrial Power Connector 100A"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. ELEC-PWR-100"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Electrical Components"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value ? Number(e.target.value) : '' })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value ? Number(e.target.value) : '' })}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Alert</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value ? Number(e.target.value) : '' })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Bin / Shelf Location *</label>
            <input
              type="text"
              className="form-input"
              value={formData.warehouse_location}
              onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
              placeholder="e.g. Rack A-12, Shelf 3"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Product: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleUpdateProduct}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">SKU Code</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value ? Number(e.target.value) : '' })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Stock</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value ? Number(e.target.value) : '' })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Alert</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value ? Number(e.target.value) : '' })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Location</label>
            <input
              type="text"
              className="form-input"
              value={formData.warehouse_location}
              onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Product Specification Details"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedProduct.name}</h3>
                <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>SKU: {selectedProduct.sku}</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                ₹{selectedProduct.unit_price.toFixed(2)}
              </span>
            </div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><strong>Category:</strong> {selectedProduct.category}</div>
              <div><strong>Warehouse Location:</strong> {selectedProduct.warehouse_location}</div>
              <div>
                <strong>Current Stock:</strong>{' '}
                <span style={{ color: selectedProduct.current_stock <= selectedProduct.min_stock_alert ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                  {selectedProduct.current_stock}
                </span>
              </div>
              <div><strong>Min Alert Level:</strong> {selectedProduct.min_stock_alert}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
