import { Request, Response } from 'express';
import {
  addCustomerService,
  getCustomerByIdService,
  getCustomersService,
  updateCustomerService,
} from '../services/customerService';
import { CustomerType, CustomerStatus } from '../types';

/**
 * POST /api/customers
 * Add a new customer record
 */
export const createCustomerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const newCustomer = await addCustomerService(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer record created successfully.',
      data: {
        customer: newCustomer,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating customer:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating customer record.',
    });
  }
};

/**
 * GET /api/customers
 * Get paginated customers list with search and filters (customer_type, status)
 */
export const getCustomersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;
    const customer_type = req.query.customer_type as CustomerType | undefined;
    const status = req.query.status as CustomerStatus | undefined;

    const result = await getCustomersService({
      page,
      limit,
      search,
      customer_type,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Customers fetched successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error fetching customers:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving customer list.',
    });
  }
};

/**
 * GET /api/customers/:id
 * Get single customer details by ID
 */
export const getCustomerByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await getCustomerByIdService(id);

    res.status(200).json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error: any) {
    if (error.message.includes('was not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('❌ Error fetching customer by ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching customer details.',
    });
  }
};

/**
 * PUT /api/customers/:id
 * Edit customer details and update follow-up notes
 */
export const updateCustomerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedCustomer = await updateCustomerService(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error: any) {
    if (error.message.includes('was not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('❌ Error updating customer:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating customer details.',
    });
  }
};
