import { query, getClient } from '../config/database';
import {
  SalesChallan,
  SalesChallanItem,
  CreateChallanInput,
  UpdateChallanInput,
  ChallanQueryParams,
} from '../types';

/**
 * Generates an automatic unique Challan Number in format: CH-YYYYMMDD-XXXX
 */
export const generateUniqueChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CH-${dateStr}-`;

  const sql = `
    SELECT challan_number 
    FROM sales_challans 
    WHERE challan_number LIKE $1 
    ORDER BY created_at DESC 
    LIMIT 1;
  `;
  const res = await query(sql, [`${prefix}%`]);

  let sequence = 1;
  if (res.rows.length > 0) {
    const lastNumber = res.rows[0].challan_number;
    const parts = lastNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  const seqStr = sequence.toString().padStart(4, '0');
  return `${prefix}${seqStr}`;
};

export const createSalesChallan = async (
  input: CreateChallanInput,
  createdByUserId: string
): Promise<SalesChallan> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Verify customer exists
    const customerRes = await client.query(
      `SELECT id, name, business_name, mobile, email, address FROM customers WHERE id = $1;`,
      [input.customer_id]
    );
    if (customerRes.rows.length === 0) {
      throw new Error(`CUSTOMER_NOT_FOUND: Customer with ID '${input.customer_id}' does not exist.`);
    }
    const customer = customerRes.rows[0];

    // 2. Fetch product details and snapshots for all requested item IDs
    const productIds = input.items.map((i) => i.product_id);
    const productsRes = await client.query(
      `SELECT id, name, sku, unit_price::float as unit_price, current_stock FROM products WHERE id = ANY($1::uuid[]);`,
      [productIds]
    );

    const productMap = new Map<string, any>();
    productsRes.rows.forEach((p) => productMap.set(p.id, p));

    // Verify all products exist
    for (const itemInput of input.items) {
      if (!productMap.has(itemInput.product_id)) {
        throw new Error(`PRODUCT_NOT_FOUND: Product with ID '${itemInput.product_id}' does not exist.`);
      }
    }

    // 3. Calculate snapshots, line totals, and grand total quantity & amount
    let totalQuantity = 0;
    let totalAmount = 0;

    const itemsToInsert: Array<{
      product_id: string;
      product_name_snapshot: string;
      sku_snapshot: string;
      unit_price_snapshot: number;
      quantity: number;
      total_price: number;
    }> = [];

    for (const itemInput of input.items) {
      const product = productMap.get(itemInput.product_id)!;
      const unitPrice = parseFloat(product.unit_price);
      const lineTotal = itemInput.quantity * unitPrice;

      totalQuantity += itemInput.quantity;
      totalAmount += lineTotal;

      itemsToInsert.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku,
        unit_price_snapshot: unitPrice,
        quantity: itemInput.quantity,
        total_price: lineTotal,
      });
    }

    // 4. Generate unique challan number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `CH-${dateStr}-`;
    const lastNumRes = await client.query(
      `SELECT challan_number FROM sales_challans WHERE challan_number LIKE $1 ORDER BY created_at DESC LIMIT 1;`,
      [`${prefix}%`]
    );
    let seq = 1;
    if (lastNumRes.rows.length > 0) {
      const parts = lastNumRes.rows[0].challan_number.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
    }
    const challanNumber = `${prefix}${seq.toString().padStart(4, '0')}`;

    // 5. Insert sales_challans header with status = 'DRAFT'
    const insertChallanSql = `
      INSERT INTO sales_challans (
        challan_number,
        customer_id,
        total_quantity,
        status,
        created_by
      ) VALUES ($1, $2, $3, 'DRAFT', $4)
      RETURNING id, challan_number, customer_id, total_quantity, status, created_by, created_at, updated_at;
    `;
    const challanRes = await client.query(insertChallanSql, [
      challanNumber,
      input.customer_id,
      totalQuantity,
      createdByUserId,
    ]);
    const challanHeader = challanRes.rows[0];

    // 6. Insert sales_challan_items line entries with product snapshots
    const createdItems: SalesChallanItem[] = [];
    for (const itemData of itemsToInsert) {
      const insertItemSql = `
        INSERT INTO sales_challan_items (
          challan_id,
          product_id,
          product_name_snapshot,
          sku_snapshot,
          unit_price_snapshot,
          quantity,
          total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, challan_id, product_id, product_name_snapshot, sku_snapshot, 
                  unit_price_snapshot::float as unit_price_snapshot, quantity, 
                  total_price::float as total_price;
      `;
      const itemRes = await client.query(insertItemSql, [
        challanHeader.id,
        itemData.product_id,
        itemData.product_name_snapshot,
        itemData.sku_snapshot,
        itemData.unit_price_snapshot,
        itemData.quantity,
        itemData.total_price,
      ]);
      createdItems.push(itemRes.rows[0] as SalesChallanItem);
    }

    await client.query('COMMIT');

    const result: SalesChallan = {
      ...challanHeader,
      total_amount: totalAmount,
      customer_name: customer.name,
      customer_business_name: customer.business_name,
      customer_mobile: customer.mobile,
      customer_email: customer.email,
      customer_address: customer.address,
      items: createdItems,
    };

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const findSalesChallanById = async (id: string): Promise<SalesChallan | null> => {
  const challanSql = `
    SELECT 
      sc.id, sc.challan_number, sc.customer_id, sc.total_quantity, 
      sc.status, sc.created_by, sc.created_at, sc.updated_at,
      c.name as customer_name, c.business_name as customer_business_name,
      c.mobile as customer_mobile, c.email as customer_email, c.address as customer_address,
      u.name as creator_name, u.email as creator_email
    FROM sales_challans sc
    JOIN customers c ON c.id = sc.customer_id
    JOIN users u ON u.id = sc.created_by
    WHERE sc.id = $1
    LIMIT 1;
  `;
  const challanRes = await query(challanSql, [id]);
  if (challanRes.rows.length === 0) return null;

  const challan = challanRes.rows[0] as SalesChallan;

  const itemsSql = `
    SELECT 
      id, challan_id, product_id, product_name_snapshot, sku_snapshot,
      unit_price_snapshot::float as unit_price_snapshot, quantity,
      total_price::float as total_price
    FROM sales_challan_items
    WHERE challan_id = $1
    ORDER BY id ASC;
  `;
  const itemsRes = await query(itemsSql, [id]);
  challan.items = itemsRes.rows as SalesChallanItem[];

  // Calculate total amount from items
  challan.total_amount = challan.items.reduce((sum, item) => sum + item.total_price, 0);

  return challan;
};

export interface FindChallansResult {
  challans: SalesChallan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const findSalesChallans = async (params: ChallanQueryParams): Promise<FindChallansResult> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.status) {
    conditions.push(`sc.status = $${paramIndex}`);
    queryParams.push(params.status);
    paramIndex++;
  }

  if (params.customer_id) {
    conditions.push(`sc.customer_id = $${paramIndex}`);
    queryParams.push(params.customer_id);
    paramIndex++;
  }

  if (params.search && params.search.trim()) {
    const searchPattern = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(`(
      LOWER(sc.challan_number) LIKE $${paramIndex} OR 
      LOWER(c.name) LIKE $${paramIndex} OR
      LOWER(c.business_name) LIKE $${paramIndex}
    )`);
    queryParams.push(searchPattern);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) 
    FROM sales_challans sc
    JOIN customers c ON c.id = sc.customer_id
    ${whereClause};
  `;
  const countResult = await query(countSql, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataSql = `
    SELECT 
      sc.id, sc.challan_number, sc.customer_id, sc.total_quantity, 
      sc.status, sc.created_by, sc.created_at, sc.updated_at,
      c.name as customer_name, c.business_name as customer_business_name,
      c.mobile as customer_mobile, c.email as customer_email,
      u.name as creator_name,
      (
        SELECT COALESCE(SUM(total_price), 0)::float 
        FROM sales_challan_items 
        WHERE challan_id = sc.id
      ) as total_amount
    FROM sales_challans sc
    JOIN customers c ON c.id = sc.customer_id
    JOIN users u ON u.id = sc.created_by
    ${whereClause}
    ORDER BY sc.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  queryParams.push(limit, offset);
  const dataResult = await query(dataSql, queryParams);

  return {
    challans: dataResult.rows as SalesChallan[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const updateSalesChallan = async (
  id: string,
  input: UpdateChallanInput
): Promise<SalesChallan> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Lock challan header for update
    const challanRes = await client.query(
      `SELECT id, challan_number, status, customer_id FROM sales_challans WHERE id = $1 FOR UPDATE;`,
      [id]
    );

    if (challanRes.rows.length === 0) {
      throw new Error(`CHALLAN_NOT_FOUND: Sales challan with ID '${id}' was not found.`);
    }

    const challan = challanRes.rows[0];

    // 2. Reject editing if status is not DRAFT
    if (challan.status !== 'DRAFT') {
      throw new Error(
        `CANNOT_EDIT_NON_DRAFT: Cannot edit a ${challan.status} sales challan. Edits are only permitted while status is DRAFT.`
      );
    }

    let targetCustomerId = challan.customer_id;
    if (input.customer_id) {
      const custRes = await client.query(`SELECT id FROM customers WHERE id = $1;`, [input.customer_id]);
      if (custRes.rows.length === 0) {
        throw new Error(`CUSTOMER_NOT_FOUND: Customer with ID '${input.customer_id}' does not exist.`);
      }
      targetCustomerId = input.customer_id;
    }

    // 3. If items provided, delete old items and re-insert snapshots
    if (input.items && input.items.length > 0) {
      const productIds = input.items.map((i) => i.product_id);
      const productsRes = await client.query(
        `SELECT id, name, sku, unit_price::float as unit_price FROM products WHERE id = ANY($1::uuid[]);`,
        [productIds]
      );
      const productMap = new Map<string, any>();
      productsRes.rows.forEach((p) => productMap.set(p.id, p));

      for (const itemInput of input.items) {
        if (!productMap.has(itemInput.product_id)) {
          throw new Error(`PRODUCT_NOT_FOUND: Product with ID '${itemInput.product_id}' does not exist.`);
        }
      }

      await client.query(`DELETE FROM sales_challan_items WHERE challan_id = $1;`, [id]);

      let newTotalQuantity = 0;
      for (const itemInput of input.items) {
        const product = productMap.get(itemInput.product_id)!;
        const unitPrice = parseFloat(product.unit_price);
        const lineTotal = itemInput.quantity * unitPrice;
        newTotalQuantity += itemInput.quantity;

        await client.query(
          `INSERT INTO sales_challan_items (
            challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [id, product.id, product.name, product.sku, unitPrice, itemInput.quantity, lineTotal]
        );
      }

      await client.query(
        `UPDATE sales_challans SET customer_id = $1, total_quantity = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3;`,
        [targetCustomerId, newTotalQuantity, id]
      );
    } else {
      await client.query(
        `UPDATE sales_challans SET customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
        [targetCustomerId, id]
      );
    }

    await client.query('COMMIT');

    const updated = await findSalesChallanById(id);
    return updated!;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Confirms a DRAFT sales challan inside an Atomic PostgreSQL Transaction.
 * Stock deduction + OUT stock movements + status update all succeed or roll back together.
 */
export const confirmSalesChallanTransaction = async (
  id: string,
  confirmedByUserId: string
): Promise<SalesChallan> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Lock sales_challans header row
    const challanRes = await client.query(
      `SELECT id, challan_number, status, customer_id, created_by FROM sales_challans WHERE id = $1 FOR UPDATE;`,
      [id]
    );

    if (challanRes.rows.length === 0) {
      throw new Error(`CHALLAN_NOT_FOUND: Sales challan with ID '${id}' was not found.`);
    }

    const challan = challanRes.rows[0];

    // 2. Validate current status
    if (challan.status === 'CONFIRMED') {
      throw new Error(`ALREADY_CONFIRMED: Sales challan '${challan.challan_number}' is already CONFIRMED.`);
    }
    if (challan.status === 'CANCELLED') {
      throw new Error(`CANNOT_CONFIRM_CANCELLED: Cannot confirm sales challan '${challan.challan_number}' because it is CANCELLED.`);
    }

    // 3. Fetch all line items for this challan
    const itemsRes = await client.query(
      `SELECT id, product_id, product_name_snapshot, sku_snapshot, quantity FROM sales_challan_items WHERE challan_id = $1;`,
      [id]
    );
    const items = itemsRes.rows;
    if (items.length === 0) {
      throw new Error(`EMPTY_CHALLAN: Sales challan '${challan.challan_number}' has no items.`);
    }

    // 4. Lock product rows FOR UPDATE and verify stock sufficiency for ALL items
    const productIds = items.map((i: any) => i.product_id);
    const productsRes = await client.query(
      `SELECT id, name, sku, current_stock FROM products WHERE id = ANY($1::uuid[]) FOR UPDATE;`,
      [productIds]
    );

    const productMap = new Map<string, any>();
    productsRes.rows.forEach((p: any) => productMap.set(p.id, p));

    // Check stock for every line item
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND: Referenced product '${item.product_name_snapshot}' (ID: ${item.product_id}) no longer exists.`);
      }

      if (product.current_stock < item.quantity) {
        throw new Error(
          `INSUFFICIENT_STOCK: Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${product.current_stock}, Requested in Challan: ${item.quantity}`
        );
      }
    }

    // 5. If all items have sufficient stock: deduct stock and insert OUT movement for each item
    for (const item of items) {
      const product = productMap.get(item.product_id);
      const newStock = product.current_stock - item.quantity;

      // Update product current_stock
      await client.query(
        `UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
        [newStock, item.product_id]
      );

      // Insert OUT stock movement audit record
      const movementReason = `Sales Challan Dispatch: ${challan.challan_number}`;
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, $2, 'OUT', $3, $4);`,
        [item.product_id, item.quantity, movementReason, confirmedByUserId]
      );
    }

    // 6. Update sales_challans status to 'CONFIRMED'
    await client.query(
      `UPDATE sales_challans SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
      [id]
    );

    await client.query('COMMIT');

    const confirmedChallan = await findSalesChallanById(id);
    return confirmedChallan!;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const cancelSalesChallan = async (id: string): Promise<SalesChallan> => {
  const challan = await findSalesChallanById(id);
  if (!challan) {
    throw new Error(`CHALLAN_NOT_FOUND: Sales challan with ID '${id}' was not found.`);
  }

  if (challan.status === 'CONFIRMED') {
    throw new Error(
      `CANNOT_CANCEL_CONFIRMED: Cannot cancel a CONFIRMED challan without a reversal flow. The items have already been dispatched and stock deducted.`
    );
  }

  if (challan.status === 'CANCELLED') {
    throw new Error(`ALREADY_CANCELLED: Sales challan '${challan.challan_number}' is already CANCELLED.`);
  }

  // Update status from DRAFT to CANCELLED
  const sql = `
    UPDATE sales_challans 
    SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1;
  `;
  await query(sql, [id]);

  const cancelledChallan = await findSalesChallanById(id);
  return cancelledChallan!;
};
