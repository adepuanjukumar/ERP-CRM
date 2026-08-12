import { Router } from 'express';
import {
  createCustomerController,
  getCustomersController,
  getCustomerByIdController,
  updateCustomerController,
} from '../controllers/customerController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerIdParam,
} from '../middlewares/customerValidation';

const router = Router();

// All customer endpoints require a valid JWT token
router.use(authenticateToken);

// GET /api/customers - List customers (Paginated, Searchable, Filterable)
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'),
  getCustomersController
);

// GET /api/customers/:id - View customer details
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'),
  validateCustomerIdParam,
  getCustomerByIdController
);

// POST /api/customers - Add customer
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  validateCreateCustomer,
  createCustomerController
);

// PUT /api/customers/:id - Edit customer / Update follow-up notes
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'),
  validateCustomerIdParam,
  validateUpdateCustomer,
  updateCustomerController
);

export default router;
