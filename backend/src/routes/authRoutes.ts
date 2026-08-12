import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { validateLoginInput } from '../middlewares/validationMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Public Authentication Route
router.post('/login', validateLoginInput, login);

// Protected Authentication Route
router.get('/me', authenticateToken, getMe);

export default router;
