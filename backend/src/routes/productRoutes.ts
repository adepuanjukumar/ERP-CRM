import { Router } from 'express';
import {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
} from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductIdParam,
} from '../middlewares/productValidation';

const router = Router();

// All product routes require a valid JWT token
router.use(authenticateToken);

// GET /api/products - List products (Paginated, Searchable, Filterable)
router.get(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'),
  getProductsController
);

// GET /api/products/:id - View product details
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'),
  validateProductIdParam,
  getProductByIdController
);

// POST /api/products - Create product (ADMIN & WAREHOUSE only)
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateCreateProduct,
  createProductController
);

// PUT /api/products/:id - Edit product details (ADMIN & WAREHOUSE only)
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateProductIdParam,
  validateUpdateProduct,
  updateProductController
);

export default router;
