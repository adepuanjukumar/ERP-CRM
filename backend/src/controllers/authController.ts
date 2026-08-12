import { Request, Response } from 'express';
import { loginUser, getCurrentUserProfile } from '../services/authService';
import { AuthenticatedRequest } from '../types';

/**
 * POST /api/auth/login
 * User authentication and JWT issue
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const loginData = await loginUser(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: loginData,
    });
  } catch (error: any) {
    if (error.message === 'Invalid email or password.') {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login processing.',
    });
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const userProfile = await getCurrentUserProfile(req.user.userId);
    res.status(200).json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'User profile not found.',
    });
  }
};
