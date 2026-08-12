import { query } from '../config/database';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryParams,
} from '../types';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  const sql = `
    INSERT INTO customers (
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING 
      id, name, mobile, email, business_name, gst_number,
      customer_type, address, status, follow_up_date, notes,
      created_at, updated_at;
  `;

  const values = [
    input.name.trim(),
    input.mobile.trim(),
    input.email ? input.email.trim().toLowerCase() : null,
    input.business_name.trim(),
    input.gst_number ? input.gst_number.trim().toUpperCase() : null,
    input.customer_type || 'RETAIL',
    input.address.trim(),
    input.status || 'LEAD',
    input.follow_up_date || null,
    input.notes ? input.notes.trim() : null,
  ];

  const result = await query(sql, values);
  return result.rows[0] as Customer;
};

export const findCustomerById = async (id: string): Promise<Customer | null> => {
  const sql = `
    SELECT 
      id, name, mobile, email, business_name, gst_number,
      customer_type, address, status, follow_up_date, notes,
      created_at, updated_at
    FROM customers
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as Customer;
};

export interface FindCustomersResult {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const findCustomers = async (params: CustomerQueryParams): Promise<FindCustomersResult> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Search filter across name, business_name, mobile, email
  if (params.search && params.search.trim()) {
    const searchPattern = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(`(
      LOWER(name) LIKE $${paramIndex} OR 
      LOWER(business_name) LIKE $${paramIndex} OR 
      LOWER(mobile) LIKE $${paramIndex} OR 
      LOWER(COALESCE(email, '')) LIKE $${paramIndex} OR
      LOWER(COALESCE(gst_number, '')) LIKE $${paramIndex}
    )`);
    queryParams.push(searchPattern);
    paramIndex++;
  }

  // Filter by customer_type
  if (params.customer_type) {
    conditions.push(`customer_type = $${paramIndex}`);
    queryParams.push(params.customer_type);
    paramIndex++;
  }

  // Filter by status
  if (params.status) {
    conditions.push(`status = $${paramIndex}`);
    queryParams.push(params.status);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query 1: Total Count
  const countSql = `SELECT COUNT(*) FROM customers ${whereClause};`;
  const countResult = await query(countSql, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  // Query 2: Paginated Customers Data
  const dataSql = `
    SELECT 
      id, name, mobile, email, business_name, gst_number,
      customer_type, address, status, follow_up_date, notes,
      created_at, updated_at
    FROM customers
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;
  
  queryParams.push(limit, offset);
  const dataResult = await query(dataSql, queryParams);

  return {
    customers: dataResult.rows as Customer[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const updateCustomer = async (
  id: string,
  input: UpdateCustomerInput
): Promise<Customer | null> => {
  // First verify customer exists
  const existing = await findCustomerById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name.trim());
  }

  if (input.mobile !== undefined) {
    fields.push(`mobile = $${paramIndex++}`);
    values.push(input.mobile.trim());
  }

  if (input.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(input.email ? input.email.trim().toLowerCase() : null);
  }

  if (input.business_name !== undefined) {
    fields.push(`business_name = $${paramIndex++}`);
    values.push(input.business_name.trim());
  }

  if (input.gst_number !== undefined) {
    fields.push(`gst_number = $${paramIndex++}`);
    values.push(input.gst_number ? input.gst_number.trim().toUpperCase() : null);
  }

  if (input.customer_type !== undefined) {
    fields.push(`customer_type = $${paramIndex++}`);
    values.push(input.customer_type);
  }

  if (input.address !== undefined) {
    fields.push(`address = $${paramIndex++}`);
    values.push(input.address.trim());
  }

  if (input.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }

  if (input.follow_up_date !== undefined) {
    fields.push(`follow_up_date = $${paramIndex++}`);
    values.push(input.follow_up_date || null);
  }

  if (input.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(input.notes ? input.notes.trim() : null);
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const sql = `
    UPDATE customers
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING 
      id, name, mobile, email, business_name, gst_number,
      customer_type, address, status, follow_up_date, notes,
      created_at, updated_at;
  `;

  const result = await query(sql, values);
  return result.rows[0] as Customer;
};
