import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing database config
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { hashPassword } from '../src/utils/password';
import { upsertSeedUser } from '../src/models/userModel';
import { pool } from '../src/config/database';
import { UserRole } from '../src/types';

interface SeedUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const seedUsersList: SeedUserData[] = [
  {
    name: 'System Admin',
    email: 'admin@erp.com',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  {
    name: 'Sales Representative',
    email: 'sales@erp.com',
    password: 'Sales@123',
    role: 'SALES',
  },
  {
    name: 'Warehouse Manager',
    email: 'warehouse@erp.com',
    password: 'Warehouse@123',
    role: 'WAREHOUSE',
  },
  {
    name: 'Accounts Officer',
    email: 'accounts@erp.com',
    password: 'Accounts@123',
    role: 'ACCOUNTS',
  },
];

async function runSeed() {
  console.log('----------------------------------------------------');
  console.log('🌱 Seeding Initial Test Users for Mini ERP + CRM');
  console.log('----------------------------------------------------');

  try {
    for (const seedUser of seedUsersList) {
      // Hash password using bcrypt
      const passwordHash = await hashPassword(seedUser.password);

      // Insert or update seed user in database
      const createdUser = await upsertSeedUser(
        seedUser.name,
        seedUser.email,
        passwordHash,
        seedUser.role
      );

      console.log(`✅ Seeded User [${createdUser.role}]:`);
      console.log(`   - Name:  ${createdUser.name}`);
      console.log(`   - Email: ${createdUser.email}`);
      console.log(`   - ID:    ${createdUser.id}`);
      console.log(`   - Password: (Bcrypt Hashed)`);
      console.log('----------------------------------------------------');
    }

    console.log('🎉 User Seeding Completed Successfully!');
  } catch (error: any) {
    console.error('❌ Error during user seeding:', error.message);
  } finally {
    await pool.end();
  }
}

runSeed();
