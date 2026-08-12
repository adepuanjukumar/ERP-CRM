import { getClient, query } from '../config/database';
import {
  StockMovement,
  CreateStockMovementInput,
  StockMovementQueryParams,
} from '../types';

export interface CreateStockMovementResult {
  movement: StockMovement;
  updatedStock: number;
}

/**
 * Creates a stock movement record and updates product current_stock inside an atomic PostgreSQL Transaction.
 * Prevents race conditions and guarantees stock never drops below 0.
 */
export const createStockMovementTransaction = async (
  input: CreateStockMovementInput
): Promise<CreateStockMovementResult> => {
  const client = await getClient();

  try {
    // 1. BEGIN PostgreSQL Transaction
    await client.query('BEGIN');

    // 2. Lock product row with FOR UPDATE and fetch current stock
    const productLockSql = `
      SELECT id, name, sku, current_stock 
      FROM products 
      WHERE id = $1 
      FOR UPDATE;
    `;
    const productRes = await client.query(productLockSql, [input.product_id]);

    if (productRes.rows.length === 0) {
      throw new Error(`PRODUCT_NOT_FOUND: Product with ID '${input.product_id}' does not exist.`);
    }

    const product = productRes.rows[0];
    const currentStock = product.current_stock;

    // 3. Calculate new stock level & enforce non-negative stock constraint
    let newStock = currentStock;
    if (input.movement_type === 'IN') {
      newStock = currentStock + input.quantity;
    } else if (input.movement_type === 'OUT') {
      if (input.quantity > currentStock) {
        throw new Error(
          `INSUFFICIENT_STOCK: Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${currentStock}, Requested reduction: ${input.quantity}`
        );
      }
      newStock = currentStock - input.quantity;
    }

    // 4. Update product current_stock
    const updateStockSql = `
      UPDATE products 
      SET current_stock = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2;
    `;
    await client.query(updateStockSql, [newStock, input.product_id]);

    // 5. Insert audit entry into stock_movements table
    const insertMovementSql = `
      INSERT INTO stock_movements (
        product_id,
        quantity,
        movement_type,
        reason,
        created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, product_id, quantity, movement_type, reason, created_by, created_at;
    `;
    const movementRes = await client.query(insertMovementSql, [
      input.product_id,
      input.quantity,
      input.movement_type,
      input.reason.trim(),
      input.created_by,
    ]);

    // 6. COMMIT PostgreSQL Transaction
    await client.query('COMMIT');

    const movement = movementRes.rows[0] as StockMovement;
    movement.product_name = product.name;
    movement.product_sku = product.sku;

    return {
      movement,
      updatedStock: newStock,
    };
  } catch (error) {
    // Abort and rollback transaction on any failure
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Release pool client back to pool connection
    client.release();
  }
};

export interface FindStockMovementsResult {
  movements: StockMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const findStockMovements = async (
  params: StockMovementQueryParams
): Promise<FindStockMovementsResult> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.product_id) {
    conditions.push(`sm.product_id = $${paramIndex}`);
    queryParams.push(params.product_id);
    paramIndex++;
  }

  if (params.movement_type) {
    conditions.push(`sm.movement_type = $${paramIndex}`);
    queryParams.push(params.movement_type);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query 1: Count total
  const countSql = `SELECT COUNT(*) FROM stock_movements sm ${whereClause};`;
  const countResult = await query(countSql, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  // Query 2: Fetch joined movement logs with product & user names
  const dataSql = `
    SELECT 
      sm.id, sm.product_id, sm.quantity, sm.movement_type, 
      sm.reason, sm.created_by, sm.created_at,
      p.name as product_name, p.sku as product_sku,
      u.name as creator_name
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    JOIN users u ON u.id = sm.created_by
    ${whereClause}
    ORDER BY sm.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  queryParams.push(limit, offset);
  const dataResult = await query(dataSql, queryParams);

  return {
    movements: dataResult.rows as StockMovement[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
