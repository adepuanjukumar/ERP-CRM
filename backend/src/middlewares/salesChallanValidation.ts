import { Request, Response, NextFunction } from 'express';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const validateChallanIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid sales challan ID format. Must be a valid UUID.',
    });
    return;
  }
  next();
};

export const validateCreateChallan = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { customer_id, items } = req.body;

  if (!customer_id || typeof customer_id !== 'string' || !UUID_REGEX.test(customer_id.trim())) {
    res.status(400).json({
      success: false,
      message: 'Valid customer ID (UUID) is required.',
    });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Sales challan must contain at least one product item.',
    });
    return;
  }

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (!item.product_id || typeof item.product_id !== 'string' || !UUID_REGEX.test(item.product_id.trim())) {
      res.status(400).json({
        success: false,
        message: `Invalid product_id at line item #${idx + 1}. Must be a valid UUID.`,
      });
      return;
    }

    if (
      item.quantity === undefined ||
      typeof item.quantity !== 'number' ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity)
    ) {
      res.status(400).json({
        success: false,
        message: `Quantity for item #${idx + 1} must be a positive integer greater than zero.`,
      });
      return;
    }
  }

  next();
};

export const validateUpdateChallan = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { customer_id, items } = req.body;

  if (customer_id !== undefined) {
    if (typeof customer_id !== 'string' || !UUID_REGEX.test(customer_id.trim())) {
      res.status(400).json({
        success: false,
        message: 'Valid customer ID (UUID) is required.',
      });
      return;
    }
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Sales challan must contain at least one product item.',
      });
      return;
    }

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item.product_id || typeof item.product_id !== 'string' || !UUID_REGEX.test(item.product_id.trim())) {
        res.status(400).json({
          success: false,
          message: `Invalid product_id at line item #${idx + 1}. Must be a valid UUID.`,
        });
        return;
      }

      if (
        item.quantity === undefined ||
        typeof item.quantity !== 'number' ||
        item.quantity <= 0 ||
        !Number.isInteger(item.quantity)
      ) {
        res.status(400).json({
          success: false,
          message: `Quantity for item #${idx + 1} must be a positive integer greater than zero.`,
        });
        return;
      }
    }
  }

  next();
};
