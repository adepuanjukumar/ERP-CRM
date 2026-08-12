import { query } from '../config/database';
import { User, UserRole } from '../types';

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const sql = `
    SELECT id, name, email, password_hash, role, created_at, updated_at 
    FROM users 
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
  `;
  const result = await query(sql, [email]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as User;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const sql = `
    SELECT id, name, email, password_hash, role, created_at, updated_at 
    FROM users 
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as User;
};

export const createUser = async (
  name: string,
  email: string,
  passwordHash: string,
  role: UserRole
): Promise<User> => {
  const sql = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, LOWER($2), $3, $4)
    RETURNING id, name, email, password_hash, role, created_at, updated_at;
  `;
  const result = await query(sql, [name, email, passwordHash, role]);
  return result.rows[0] as User;
};

export const upsertSeedUser = async (
  name: string,
  email: string,
  passwordHash: string,
  role: UserRole
): Promise<User> => {
  const sql = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, LOWER($2), $3, $4)
    ON CONFLICT (email) 
    DO UPDATE SET 
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, name, email, password_hash, role, created_at, updated_at;
  `;
  const result = await query(sql, [name, email, passwordHash, role]);
  return result.rows[0] as User;
};
