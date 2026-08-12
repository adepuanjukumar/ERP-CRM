// Enterprise User Roles
export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// =============================================================================
// Customer CRM Types
// =============================================================================
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  business_name: string;
  gst_number?: string | null;
  customer_type: CustomerType;
  address: string;
  status: CustomerStatus;
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: CustomerType;
  address: string;
  status: CustomerStatus;
  follow_up_date: string;
  notes: string;
}

// =============================================================================
// Product & Inventory Types
// =============================================================================
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  warehouse_location: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit_price: number | '';
  current_stock: number | '';
  min_stock_alert: number | '';
  warehouse_location: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  created_by: string;
  created_at: string;
  product_name?: string;
  product_sku?: string;
  creator_name?: string;
}

export interface StockMovementFormData {
  product_id: string;
  quantity: number | '';
  movement_type: MovementType;
  reason: string;
}

// =============================================================================
// Sales Challan Types
// =============================================================================
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SalesChallanItem {
  id: string;
  challan_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  total_price: number;
}

export interface SalesChallan {
  id: string;
  challan_number: string;
  customer_id: string;
  total_quantity: number;
  total_amount?: number;
  status: ChallanStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_business_name?: string;
  customer_mobile?: string;
  customer_email?: string | null;
  customer_address?: string;
  creator_name?: string;
  creator_email?: string;
  items?: SalesChallanItem[];
}

export interface ChallanItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateChallanFormData {
  customer_id: string;
  items: ChallanItemInput[];
}
