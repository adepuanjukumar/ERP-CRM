import { Request } from 'express';

// Role definitions based on case study requirements
export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

// User object stripped of password_hash for API responses
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express Request extended with authenticated user data
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface LoginRequestBody {
  email?: string;
  password?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
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
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerInput {
  name: string;
  mobile: string;
  email?: string | null;
  business_name: string;
  gst_number?: string | null;
  customer_type?: CustomerType;
  address: string;
  status?: CustomerStatus;
  follow_up_date?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  mobile?: string;
  email?: string | null;
  business_name?: string;
  gst_number?: string | null;
  customer_type?: CustomerType;
  address?: string;
  status?: CustomerStatus;
  follow_up_date?: string | null;
  notes?: string | null;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  customer_type?: CustomerType;
  status?: CustomerStatus;
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
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock?: number;
  min_stock_alert?: number;
  warehouse_location: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  category?: string;
  unit_price?: number;
  current_stock?: number;
  min_stock_alert?: number;
  warehouse_location?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  low_stock?: boolean;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  created_by: string;
  created_at: Date;
  product_name?: string;
  product_sku?: string;
  creator_name?: string;
}

export interface CreateStockMovementInput {
  product_id: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  created_by: string;
}

export interface StockMovementQueryParams {
  page?: number;
  limit?: number;
  product_id?: string;
  movement_type?: MovementType;
}

// =============================================================================
// Sales Challan Module Types
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
  total_price: number; // line_total
}

export interface SalesChallan {
  id: string;
  challan_number: string;
  customer_id: string;
  total_quantity: number;
  total_amount?: number;
  status: ChallanStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  // Joined detail fields
  customer_name?: string;
  customer_business_name?: string;
  customer_mobile?: string;
  customer_email?: string | null;
  customer_address?: string;
  creator_name?: string;
  creator_email?: string;
  items?: SalesChallanItem[];
}

export interface CreateChallanItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateChallanInput {
  customer_id: string;
  items: CreateChallanItemInput[];
}

export interface UpdateChallanInput {
  customer_id?: string;
  items?: CreateChallanItemInput[];
}

export interface ChallanQueryParams {
  page?: number;
  limit?: number;
  status?: ChallanStatus;
  customer_id?: string;
  search?: string; // Challan number or customer name search
}
