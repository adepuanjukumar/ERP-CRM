import { Response } from 'express';
import { AuthenticatedRequest, MovementType } from '../types';
import {
  addStockMovementService,
  getStockMovementsService,
} from '../services/stockMovementService';

/**
 * POST /api/stock-movements
 * Add a stock movement record (IN / OUT) and update product current_stock inside a transaction
 */
export const createStockMovementController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { product_id, quantity, movement_type, reason } = req.body;

    const result = await addStockMovementService({
      product_id,
      quantity,
      movement_type,
      reason,
      created_by: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: `Stock movement (${movement_type}) recorded successfully. Updated stock: ${result.updatedStock}`,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      res.status(400).json({
        success: false,
        message: error.message.replace('INSUFFICIENT_STOCK: ', ''),
      });
      return;
    }

    if (error.message.includes('PRODUCT_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('PRODUCT_NOT_FOUND: ', ''),
      });
      return;
    }

    console.error('❌ Error recording stock movement:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing stock movement.',
    });
  }
};

/**
 * GET /api/stock-movements
 * List stock movement history logs
 */
export const getStockMovementsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const product_id = req.query.product_id as string | undefined;
    const movement_type = req.query.movement_type as MovementType | undefined;

    const result = await getStockMovementsService({
      page,
      limit,
      product_id,
      movement_type,
    });

    res.status(200).json({
      success: true,
      message: 'Stock movement history retrieved successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error fetching stock movements:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching stock movement history.',
    });
  }
};
