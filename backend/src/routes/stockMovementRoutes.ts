import { Router } from 'express';
import {
  createStockMovementController,
  getStockMovementsController,
} from '../controllers/stockMovementController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import { validateCreateStockMovement } from '../middlewares/productValidation';

const router = Router();

// All stock movement routes require a valid JWT token
router.use(authenticateToken);

// GET /api/stock-movements - View stock movement audit log history
router.get(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'),
  getStockMovementsController
);

// POST /api/stock-movements - Add stock movement (ADMIN & WAREHOUSE only)
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateCreateStockMovement,
  createStockMovementController
);

export default router;
