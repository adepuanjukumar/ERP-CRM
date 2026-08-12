import { Request, Response } from 'express';
import {
  addProductService,
  getProductByIdService,
  getProductsService,
  updateProductService,
} from '../services/productService';

/**
 * POST /api/products
 * Add a new product
 */
export const createProductController = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await addProductService(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: {
        product,
      },
    });
  } catch (error: any) {
    if (error.statusCode === 409 || error.message.includes('DUPLICATE_SKU')) {
      res.status(409).json({
        success: false,
        message: error.message.replace('DUPLICATE_SKU: ', ''),
      });
      return;
    }

    console.error('❌ Error creating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating product.',
    });
  }
};

/**
 * GET /api/products
 * Fetch products list with search (name or SKU), category filter, low_stock filter, and pagination
 */
export const getProductsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const low_stock = req.query.low_stock === 'true' || req.query.low_stock === '1';

    const result = await getProductsService({
      page,
      limit,
      search,
      category,
      low_stock,
    });

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error listing products:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product list.',
    });
  }
};

/**
 * GET /api/products/:id
 * View single product details
 */
export const getProductByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await getProductByIdService(id);

    res.status(200).json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error: any) {
    if (error.statusCode === 404 || error.message.includes('PRODUCT_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('PRODUCT_NOT_FOUND: ', ''),
      });
      return;
    }

    console.error('❌ Error fetching product details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product details.',
    });
  }
};

/**
 * PUT /api/products/:id
 * Edit product details
 */
export const updateProductController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedProduct = await updateProductService(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: {
        product: updatedProduct,
      },
    });
  } catch (error: any) {
    if (error.statusCode === 409 || error.message.includes('DUPLICATE_SKU')) {
      res.status(409).json({
        success: false,
        message: error.message.replace('DUPLICATE_SKU: ', ''),
      });
      return;
    }

    if (error.statusCode === 404 || error.message.includes('PRODUCT_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        message: error.message.replace('PRODUCT_NOT_FOUND: ', ''),
      });
      return;
    }

    console.error('❌ Error updating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating product.',
    });
  }
};
