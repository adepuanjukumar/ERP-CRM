import { Request, Response, NextFunction } from 'express';
import { MovementType } from '../types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const VALID_MOVEMENT_TYPES: MovementType[] = ['IN', 'OUT'];

export const validateProductIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid product ID format. Must be a valid UUID.',
    });
    return;
  }
  next();
};

export const validateCreateProduct = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    name,
    sku,
    category,
    unit_price,
    current_stock,
    min_stock_alert,
    warehouse_location,
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ success: false, message: 'Product name is required.' });
    return;
  }

  if (!sku || typeof sku !== 'string' || !sku.trim()) {
    res.status(400).json({ success: false, message: 'Product SKU code is required.' });
    return;
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    res.status(400).json({ success: false, message: 'Product category is required.' });
    return;
  }

  if (unit_price === undefined || typeof unit_price !== 'number' || isNaN(unit_price)) {
    res.status(400).json({ success: false, message: 'Valid unit price is required.' });
    return;
  }

  if (unit_price < 0) {
    res.status(400).json({ success: false, message: 'Unit price cannot be negative.' });
    return;
  }

  if (current_stock !== undefined && (typeof current_stock !== 'number' || current_stock < 0)) {
    res.status(400).json({ success: false, message: 'Initial stock quantity cannot be negative.' });
    return;
  }

  if (min_stock_alert !== undefined && (typeof min_stock_alert !== 'number' || min_stock_alert < 0)) {
    res.status(400).json({ success: false, message: 'Minimum stock alert quantity cannot be negative.' });
    return;
  }

  if (!warehouse_location || typeof warehouse_location !== 'string' || !warehouse_location.trim()) {
    res.status(400).json({ success: false, message: 'Warehouse location is required.' });
    return;
  }

  next();
};

export const validateUpdateProduct = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    name,
    sku,
    category,
    unit_price,
    current_stock,
    min_stock_alert,
    warehouse_location,
  } = req.body;

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    res.status(400).json({ success: false, message: 'Product name cannot be empty.' });
    return;
  }

  if (sku !== undefined && (typeof sku !== 'string' || !sku.trim())) {
    res.status(400).json({ success: false, message: 'Product SKU cannot be empty.' });
    return;
  }

  if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
    res.status(400).json({ success: false, message: 'Category cannot be empty.' });
    return;
  }

  if (unit_price !== undefined && (typeof unit_price !== 'number' || unit_price < 0)) {
    res.status(400).json({ success: false, message: 'Unit price cannot be negative.' });
    return;
  }

  if (current_stock !== undefined && (typeof current_stock !== 'number' || current_stock < 0)) {
    res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
    return;
  }

  if (min_stock_alert !== undefined && (typeof min_stock_alert !== 'number' || min_stock_alert < 0)) {
    res.status(400).json({ success: false, message: 'Minimum stock alert quantity cannot be negative.' });
    return;
  }

  if (warehouse_location !== undefined && (typeof warehouse_location !== 'string' || !warehouse_location.trim())) {
    res.status(400).json({ success: false, message: 'Warehouse location cannot be empty.' });
    return;
  }

  next();
};

export const validateCreateStockMovement = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { product_id, quantity, movement_type, reason } = req.body;

  if (!product_id || !UUID_REGEX.test(product_id)) {
    res.status(400).json({ success: false, message: 'Valid product ID (UUID) is required.' });
    return;
  }

  if (quantity === undefined || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
    res.status(400).json({ success: false, message: 'Quantity changed must be a positive integer greater than zero.' });
    return;
  }

  if (!movement_type || !VALID_MOVEMENT_TYPES.includes(movement_type)) {
    res.status(400).json({
      success: false,
      message: `Invalid movement type. Allowed values: [${VALID_MOVEMENT_TYPES.join(', ')}]`,
    });
    return;
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    res.status(400).json({ success: false, message: 'Reason for stock movement is required.' });
    return;
  }

  next();
};
