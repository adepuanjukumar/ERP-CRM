import { findUserByEmail, findUserById } from '../models/userModel';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { UserResponse } from '../types';

export interface LoginResult {
  user: UserResponse;
  token: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
  // 1. Fetch user by email
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  // 2. Compare password hash
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  // 3. Generate JWT token
  const token = generateToken(user.id, user.email, user.role);

  // 4. Format user response (without password_hash)
  const userResponse: UserResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return {
    user: userResponse,
    token,
  };
};

export const getCurrentUserProfile = async (userId: string): Promise<UserResponse> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User account not found.');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};
