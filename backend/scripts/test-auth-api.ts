import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from '../src/app';

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function makeRequest(
  method: string,
  pathStr: string,
  body: any = null,
  token: string | null = null
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: rawData });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 Starting Authentication & Role-Based Access Tests');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);
  console.log(`📡 Test server running on port ${TEST_PORT}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Login with all 4 seeded roles
    // -------------------------------------------------------------------------
    const testCredentials = [
      { role: 'ADMIN', email: 'admin@erp.com', password: 'Admin@123' },
      { role: 'SALES', email: 'sales@erp.com', password: 'Sales@123' },
      { role: 'WAREHOUSE', email: 'warehouse@erp.com', password: 'Warehouse@123' },
      { role: 'ACCOUNTS', email: 'accounts@erp.com', password: 'Accounts@123' },
    ];

    const tokens: Record<string, string> = {};

    for (const cred of testCredentials) {
      console.log(`▶ Test 1.${cred.role}: Logging in as ${cred.role} (${cred.email})...`);
      const res = await makeRequest('POST', '/api/auth/login', {
        email: cred.email,
        password: cred.password,
      });

      if (res.status === 200 && res.body.success && res.body.data?.token) {
        tokens[cred.role] = res.body.data.token;
        console.log(`   ✅ SUCCESS [200 OK]`);
        console.log(`      - User ID: ${res.body.data.user.id}`);
        console.log(`      - Name:    ${res.body.data.user.name}`);
        console.log(`      - Email:   ${res.body.data.user.email}`);
        console.log(`      - Role:    ${res.body.data.user.role}`);
        console.log(`      - Token:   ${res.body.data.token.substring(0, 30)}...`);
      } else {
        console.error(`   ❌ FAILED [${res.status}]:`, res.body);
        process.exitCode = 1;
      }
      console.log('');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Rejection of Invalid Passwords
    // -------------------------------------------------------------------------
    console.log(`▶ Test 2: Testing incorrect password rejection...`);
    const badLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@erp.com',
      password: 'WrongPassword999!',
    });

    if (badLoginRes.status === 401 && !badLoginRes.body.success) {
      console.log(`   ✅ SUCCESS [401 Unauthorized]: ${badLoginRes.body.message}\n`);
    } else {
      console.error(`   ❌ FAILED: Expected 401 status, got [${badLoginRes.status}]`, badLoginRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 3: Protected Route Rejection Without Token
    // -------------------------------------------------------------------------
    console.log(`▶ Test 3: Testing protected route access without JWT token...`);
    const noTokenRes = await makeRequest('GET', '/api/test/protected');

    if (noTokenRes.status === 401 && !noTokenRes.body.success) {
      console.log(`   ✅ SUCCESS [401 Unauthorized]: ${noTokenRes.body.message}\n`);
    } else {
      console.error(`   ❌ FAILED: Expected 401 status, got [${noTokenRes.status}]`, noTokenRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 4: Protected Route Access With Valid JWT Token
    // -------------------------------------------------------------------------
    console.log(`▶ Test 4: Testing protected route access with valid JWT token...`);
    const validTokenRes = await makeRequest('GET', '/api/test/protected', null, tokens['ADMIN']);

    if (validTokenRes.status === 200 && validTokenRes.body.success) {
      console.log(`   ✅ SUCCESS [200 OK]: Hello ${validTokenRes.body.user.email} (${validTokenRes.body.user.role})\n`);
    } else {
      console.error(`   ❌ FAILED: Expected 200 status, got [${validTokenRes.status}]`, validTokenRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 5: Role Authorization Rejection (403 Forbidden)
    // -------------------------------------------------------------------------
    console.log(`▶ Test 5: Testing role restriction (SALES user accessing ADMIN endpoint)...`);
    const forbiddenRes = await makeRequest('GET', '/api/test/admin-only', null, tokens['SALES']);

    if (forbiddenRes.status === 403 && !forbiddenRes.body.success) {
      console.log(`   ✅ SUCCESS [403 Forbidden]: ${forbiddenRes.body.message}\n`);
    } else {
      console.error(`   ❌ FAILED: Expected 403 status, got [${forbiddenRes.status}]`, forbiddenRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 6: Role Authorization Success (ADMIN accessing ADMIN endpoint)
    // -------------------------------------------------------------------------
    console.log(`▶ Test 6: Testing role authorization success (ADMIN user accessing ADMIN endpoint)...`);
    const adminRes = await makeRequest('GET', '/api/test/admin-only', null, tokens['ADMIN']);

    if (adminRes.status === 200 && adminRes.body.success) {
      console.log(`   ✅ SUCCESS [200 OK]: ${adminRes.body.message}\n`);
    } else {
      console.error(`   ❌ FAILED: Expected 200 status, got [${adminRes.status}]`, adminRes.body);
      process.exitCode = 1;
    }

    console.log('====================================================');
    console.log('🎉 ALL AUTHENTICATION & ROLE ACCESS TESTS PASSED!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runAuthTests();
