import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'mini_erp_crm';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';

async function setupDatabase() {
  console.log('----------------------------------------------------');
  console.log('🔄 PostgreSQL Database Initializer & Migration');
  console.log('----------------------------------------------------');

  // Step 1: Connect to default postgres DB to check/create target database
  const adminClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log(`✅ Connected to default 'postgres' database on ${dbHost}:${dbPort}`);

    // Check if target database exists
    const checkDbRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1;`,
      [dbName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`⚙️ Database "${dbName}" does not exist. Creating database...`);
      // Escape database name safely
      await adminClient.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✨ Database "${dbName}" created successfully!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }

    await adminClient.end();
  } catch (error: any) {
    console.error('❌ Failed connecting/creating database:', error.message);
    process.exit(1);
  }

  // Step 2: Connect to target database and execute schema.sql DDL
  const targetClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await targetClient.connect();
    console.log(`✅ Connected to database "${dbName}".`);

    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    console.log(`📄 Reading SQL schema file from: ${schemaPath}`);
    const sqlScript = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Executing DDL Schema script...');
    await targetClient.query(sqlScript);
    console.log('✅ Schema script executed successfully!');

    // Step 3: Verify created tables
    const tablesRes = await targetClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log('----------------------------------------------------');
    console.log('📊 Verified Tables in Database:');
    tableNames.forEach((name) => console.log(`   - 📋 ${name}`));
    console.log('----------------------------------------------------');

    await targetClient.end();
    console.log('🎉 Database Setup & Verification Completed Successfully!');
  } catch (error: any) {
    console.error('❌ Failed running schema script:', error.message);
    process.exit(1);
  }
}

setupDatabase();
