import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Edit, Phone, Mail, Building } from 'lucide-react';
import { Customer, CustomerFormData, CustomerType, CustomerStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialFormState: CustomerFormData = {
  name: '',
  mobile: '',
  email: '',
  business_name: '',
  gst_number: '',
  customer_type: 'RETAIL',
  address: '',
  status: 'LEAD',
  follow_up_date: '',
  notes: '',
};

export const CustomersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEditCRM = hasRole('ADMIN', 'SALES', 'ACCOUNTS');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [customerType, setCustomerType] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormState);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' }>({
    message: null,
    type: 'success',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (customerType) params.customer_type = customerType;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/customers', { params });
      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch customers.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, customerType, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      business_name: customer.business_name,
      gst_number: customer.gst_number || '',
      customer_type: customer.customer_type,
      address: customer.address,
      status: customer.status,
      follow_up_date: customer.follow_up_date ? customer.follow_up_date.substring(0, 10) : '',
      notes: customer.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  // Submit Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/customers', formData);
      if (res.data.success) {
        setToast({ message: 'Customer record created successfully.', type: 'success' });
        setIsAddModalOpen(false);
        fetchCustomers();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to create customer.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Customer
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSubmitting(true);
    try {
      const res = await api.put(`/customers/${selectedCustomer.id}`, formData);
      if (res.data.success) {
        setToast({ message: 'Customer profile updated successfully.', type: 'success' });
        setIsEditModalOpen(false);
        fetchCustomers();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to update customer.', type: 'error' });
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
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Customer CRM Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage wholesale client accounts, leads, and follow-up schedules.</p>
        </div>

        {canEditCRM && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add New Customer
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
            placeholder="Search by customer name, business, mobile, or email..."
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
          value={customerType}
          onChange={(e) => {
            setCustomerType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Customer Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Account Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Fetching customer records..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="There are no customer records matching your search or filters."
          action={
            canEditCRM ? (
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} /> Add First Customer
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
                  <th>Customer / Business</th>
                  <th>Contact Info</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Building size={13} /> {c.business_name} {c.gst_number && `• GST: ${c.gst_number}`}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} style={{ color: 'var(--primary)' }} /> {c.mobile}
                      </div>
                      {c.email && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={13} /> {c.email}
                        </div>
                      )}
                    </td>
                    <td><Badge status={c.customer_type} /></td>
                    <td><Badge status={c.status} /></td>
                    <td style={{ fontSize: '0.85rem', color: c.follow_up_date ? 'var(--text-main)' : 'var(--text-dim)' }}>
                      {c.follow_up_date ? c.follow_up_date.substring(0, 10) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                          onClick={() => handleOpenDetailModal(c)}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        {canEditCRM && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit Record"
                          >
                            <Edit size={15} />
                          </button>
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer Record"
      >
        <form onSubmit={handleCreateCustomer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business / Firm Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="e.g. Kumar Trading Co."
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                className="form-input"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="e.g. 9876543210"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@business.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Type</label>
              <select
                className="form-select"
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as CustomerType })}
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              >
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GST Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="27AAAAA0000A1Z5"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address *</label>
            <textarea
              className="form-textarea"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full billing and shipping address..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">CRM Notes (Optional)</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Record initial client requirements or discussion notes..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Customer: ${selectedCustomer?.name}`}
      >
        <form onSubmit={handleUpdateCustomer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              >
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">CRM Follow-up Notes</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '100px' }}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Update discussion history, follow-up calls, or credit terms..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail View Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Customer Profile Details"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedCustomer.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedCustomer.business_name}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge status={selectedCustomer.customer_type} />
                <Badge status={selectedCustomer.status} />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><strong>Mobile:</strong> {selectedCustomer.mobile}</div>
              <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
              <div><strong>GST #:</strong> {selectedCustomer.gst_number || 'N/A'}</div>
              <div><strong>Follow-up Date:</strong> {selectedCustomer.follow_up_date ? selectedCustomer.follow_up_date.substring(0, 10) : 'None set'}</div>
            </div>

            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Address:</strong>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{selectedCustomer.address}</div>
            </div>

            {selectedCustomer.notes && (
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CRM Notes:</strong>
                <div style={{ marginTop: '0.25rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                  {selectedCustomer.notes}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
