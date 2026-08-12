import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, UserRole } from '../types';

export const generateToken = (userId: string, email: string, role: UserRole): string => {
  const payload: JwtPayload = {
    userId,
    email,
    role,
  };

  const secret: Secret = config.jwt.secret;
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as any,
  };

  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  const secret: Secret = config.jwt.secret;
  return jwt.verify(token, secret) as JwtPayload;
};
