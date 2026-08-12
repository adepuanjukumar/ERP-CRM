import { Router } from 'express';
import {
  createChallanController,
  getChallansController,
  getChallanByIdController,
  updateChallanController,
  confirmChallanController,
  cancelChallanController,
} from '../controllers/salesChallanController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import {
  validateCreateChallan,
  validateUpdateChallan,
  validateChallanIdParam,
} from '../middlewares/salesChallanValidation';

const router = Router();

// All Sales Challan endpoints require a valid JWT token
router.use(authenticateToken);

// GET /api/sales-challans - List challans (Paginated, Searchable, Filterable)
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  getChallansController
);

// GET /api/sales-challans/:id - View complete challan details with items & customer info
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validateChallanIdParam,
  getChallanByIdController
);

// POST /api/sales-challans - Create a new DRAFT sales challan (SALES & ADMIN)
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateCreateChallan,
  createChallanController
);

// PUT /api/sales-challans/:id - Edit DRAFT sales challan (SALES & ADMIN)
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  validateChallanIdParam,
  validateUpdateChallan,
  updateChallanController
);

// POST /api/sales-challans/:id/confirm - Confirm DRAFT sales challan (SALES & ADMIN)
router.post(
  '/:id/confirm',
  authorizeRoles('ADMIN', 'SALES'),
  validateChallanIdParam,
  confirmChallanController
);

// POST /api/sales-challans/:id/cancel - Cancel DRAFT sales challan (SALES & ADMIN)
router.post(
  '/:id/cancel',
  authorizeRoles('ADMIN', 'SALES'),
  validateChallanIdParam,
  cancelChallanController
);

export default router;
