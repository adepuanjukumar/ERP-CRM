import { query } from '../config/database';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
} from '../types';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  const sql = `
    INSERT INTO products (
      name,
      sku,
      category,
      unit_price,
      current_stock,
      min_stock_alert,
      warehouse_location
    ) VALUES ($1, UPPER($2), $3, $4, $5, $6, $7)
    RETURNING 
      id, name, sku, category, 
      unit_price::float as unit_price, 
      current_stock, min_stock_alert, 
      warehouse_location, created_at, updated_at;
  `;

  const values = [
    input.name.trim(),
    input.sku.trim(),
    input.category.trim(),
    input.unit_price,
    input.current_stock ?? 0,
    input.min_stock_alert ?? 10,
    input.warehouse_location.trim(),
  ];

  const result = await query(sql, values);
  return result.rows[0] as Product;
};

export const findProductById = async (id: string): Promise<Product | null> => {
  const sql = `
    SELECT 
      id, name, sku, category, 
      unit_price::float as unit_price, 
      current_stock, min_stock_alert, 
      warehouse_location, created_at, updated_at
    FROM products
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as Product;
};

export const findProductBySku = async (sku: string): Promise<Product | null> => {
  const sql = `
    SELECT 
      id, name, sku, category, 
      unit_price::float as unit_price, 
      current_stock, min_stock_alert, 
      warehouse_location, created_at, updated_at
    FROM products
    WHERE UPPER(sku) = UPPER($1)
    LIMIT 1;
  `;
  const result = await query(sql, [sku.trim()]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as Product;
};

export interface FindProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const findProducts = async (params: ProductQueryParams): Promise<FindProductsResult> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Search by Product Name or SKU
  if (params.search && params.search.trim()) {
    const searchPattern = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(`(
      LOWER(name) LIKE $${paramIndex} OR 
      LOWER(sku) LIKE $${paramIndex} OR
      LOWER(category) LIKE $${paramIndex}
    )`);
    queryParams.push(searchPattern);
    paramIndex++;
  }

  // Filter by category
  if (params.category && params.category.trim()) {
    conditions.push(`LOWER(category) = LOWER($${paramIndex})`);
    queryParams.push(params.category.trim());
    paramIndex++;
  }

  // Filter low-stock products (current_stock <= min_stock_alert)
  if (params.low_stock) {
    conditions.push(`current_stock <= min_stock_alert`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count query
  const countSql = `SELECT COUNT(*) FROM products ${whereClause};`;
  const countResult = await query(countSql, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query
  const dataSql = `
    SELECT 
      id, name, sku, category, 
      unit_price::float as unit_price, 
      current_stock, min_stock_alert, 
      warehouse_location, created_at, updated_at
    FROM products
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  queryParams.push(limit, offset);
  const dataResult = await query(dataSql, queryParams);

  return {
    products: dataResult.rows as Product[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const updateProduct = async (
  id: string,
  input: UpdateProductInput
): Promise<Product | null> => {
  const existing = await findProductById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name.trim());
  }

  if (input.sku !== undefined) {
    fields.push(`sku = UPPER($${paramIndex++})`);
    values.push(input.sku.trim());
  }

  if (input.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    values.push(input.category.trim());
  }

  if (input.unit_price !== undefined) {
    fields.push(`unit_price = $${paramIndex++}`);
    values.push(input.unit_price);
  }

  if (input.current_stock !== undefined) {
    fields.push(`current_stock = $${paramIndex++}`);
    values.push(input.current_stock);
  }

  if (input.min_stock_alert !== undefined) {
    fields.push(`min_stock_alert = $${paramIndex++}`);
    values.push(input.min_stock_alert);
  }

  if (input.warehouse_location !== undefined) {
    fields.push(`warehouse_location = $${paramIndex++}`);
    values.push(input.warehouse_location.trim());
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const sql = `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING 
      id, name, sku, category, 
      unit_price::float as unit_price, 
      current_stock, min_stock_alert, 
      warehouse_location, created_at, updated_at;
  `;

  const result = await query(sql, values);
  return result.rows[0] as Product;
};
