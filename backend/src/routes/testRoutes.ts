import { Router, Response } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Test Endpoint 1: Any Authenticated User
router.get('/protected', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to protected endpoint.',
    user: req.user,
  });
});

// Test Endpoint 2: ADMIN Only
router.get('/admin-only', authenticateToken, authorizeRoles('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to Admin-only endpoint.',
    user: req.user,
  });
});

// Test Endpoint 3: SALES Only
router.get('/sales-only', authenticateToken, authorizeRoles('SALES'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to Sales-only endpoint.',
    user: req.user,
  });
});

// Test Endpoint 4: WAREHOUSE Only
router.get('/warehouse-only', authenticateToken, authorizeRoles('WAREHOUSE'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to Warehouse-only endpoint.',
    user: req.user,
  });
});

// Test Endpoint 5: ACCOUNTS Only
router.get('/accounts-only', authenticateToken, authorizeRoles('ACCOUNTS'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to Accounts-only endpoint.',
    user: req.user,
  });
});

export default router;
