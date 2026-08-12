import { Response } from 'express';
import { AuthenticatedRequest, ChallanStatus } from '../types';
import {
  createChallanService,
  getChallanByIdService,
  getChallansService,
  updateChallanService,
  confirmChallanService,
  cancelChallanService,
} from '../services/salesChallanService';

/**
 * POST /api/sales-challans
 * Create a new DRAFT sales challan
 */
export const createChallanController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const challan = await createChallanService(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      message: `Sales challan '${challan.challan_number}' created successfully as DRAFT.`,
      data: {
        challan,
      },
    });
  } catch (error: any) {
    if (error.message.includes('CUSTOMER_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('CUSTOMER_NOT_FOUND: ', ''),
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

    console.error('❌ Error creating sales challan:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating sales challan.',
    });
  }
};

/**
 * GET /api/sales-challans
 * List sales challans with search, status filter, customer_id filter, and pagination
 */
export const getChallansController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const status = req.query.status as ChallanStatus | undefined;
    const customer_id = req.query.customer_id as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getChallansService({
      page,
      limit,
      status,
      customer_id,
      search,
    });

    res.status(200).json({
      success: true,
      message: 'Sales challans fetched successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error fetching sales challans:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching sales challans list.',
    });
  }
};

/**
 * GET /api/sales-challans/:id
 * View full sales challan details (with items snapshot and customer info)
 */
export const getChallanByIdController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const challan = await getChallanByIdService(id);

    res.status(200).json({
      success: true,
      data: {
        challan,
      },
    });
  } catch (error: any) {
    if (error.message.includes('CHALLAN_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('CHALLAN_NOT_FOUND: ', ''),
      });
      return;
    }

    console.error('❌ Error fetching sales challan details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching sales challan details.',
    });
  }
};

/**
 * PUT /api/sales-challans/:id
 * Edit DRAFT sales challan
 */
export const updateChallanController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedChallan = await updateChallanService(id, req.body);

    res.status(200).json({
      success: true,
      message: `Sales challan '${updatedChallan.challan_number}' updated successfully.`,
      data: {
        challan: updatedChallan,
      },
    });
  } catch (error: any) {
    if (error.message.includes('CANNOT_EDIT_NON_DRAFT')) {
      res.status(400).json({
        success: false,
        message: error.message.replace('CANNOT_EDIT_NON_DRAFT: ', ''),
      });
      return;
    }

    if (error.message.includes('CHALLAN_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('CHALLAN_NOT_FOUND: ', ''),
      });
      return;
    }

    if (error.message.includes('CUSTOMER_NOT_FOUND') || error.message.includes('PRODUCT_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace(/(CUSTOMER|PRODUCT)_NOT_FOUND: /, ''),
      });
      return;
    }

    console.error('❌ Error updating sales challan:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating sales challan.',
    });
  }
};

/**
 * POST /api/sales-challans/:id/confirm
 * Confirm DRAFT sales challan (Deducts stock and creates OUT movements atomically)
 */
export const confirmChallanController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;
    const confirmedChallan = await confirmChallanService(id, req.user.userId);

    res.status(200).json({
      success: true,
      message: `Sales challan '${confirmedChallan.challan_number}' CONFIRMED successfully. Inventory deducted.`,
      data: {
        challan: confirmedChallan,
      },
    });
  } catch (error: any) {
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      res.status(400).json({
        success: false,
        message: error.message.replace('INSUFFICIENT_STOCK: ', ''),
      });
      return;
    }

    if (
      error.message.includes('ALREADY_CONFIRMED') ||
      error.message.includes('CANNOT_CONFIRM_CANCELLED') ||
      error.message.includes('EMPTY_CHALLAN')
    ) {
      res.status(400).json({
        success: false,
        message: error.message.replace(/(ALREADY_CONFIRMED|CANNOT_CONFIRM_CANCELLED|EMPTY_CHALLAN): /, ''),
      });
      return;
    }

    if (error.message.includes('CHALLAN_NOT_FOUND') || error.message.includes('PRODUCT_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace(/(CHALLAN|PRODUCT)_NOT_FOUND: /, ''),
      });
      return;
    }

    console.error('❌ Error confirming sales challan:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while confirming sales challan.',
    });
  }
};

/**
 * POST /api/sales-challans/:id/cancel
 * Cancel DRAFT sales challan
 */
export const cancelChallanController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const cancelledChallan = await cancelChallanService(id);

    res.status(200).json({
      success: true,
      message: `Sales challan '${cancelledChallan.challan_number}' CANCELLED successfully.`,
      data: {
        challan: cancelledChallan,
      },
    });
  } catch (error: any) {
    if (
      error.message.includes('CANNOT_CANCEL_CONFIRMED') ||
      error.message.includes('ALREADY_CANCELLED')
    ) {
      res.status(400).json({
        success: false,
        message: error.message.replace(/(CANNOT_CANCEL_CONFIRMED|ALREADY_CANCELLED): /, ''),
      });
      return;
    }

    if (error.message.includes('CHALLAN_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('CHALLAN_NOT_FOUND: ', ''),
      });
      return;
    }

    console.error('❌ Error cancelling sales challan:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling sales challan.',
    });
  }
};
