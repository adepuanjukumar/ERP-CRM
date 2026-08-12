import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLoginInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({
      success: false,
      message: 'Email address is required.',
    });
    return;
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address format.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    res.status(400).json({
      success: false,
      message: 'Password is required.',
    });
    return;
  }

  next();
};
