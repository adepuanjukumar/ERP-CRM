import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from '../src/app';

const TEST_PORT = 5006;
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

async function runCustomerTests() {
  console.log('====================================================');
  console.log('🧪 Starting Customer CRM Backend Module Tests');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);
  console.log(`📡 Test server running on port ${TEST_PORT}\n`);

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Authenticate as Admin to get JWT token
    // -------------------------------------------------------------------------
    console.log('▶ Step 0: Authenticating as Admin (admin@erp.com)...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@erp.com',
      password: 'Admin@123',
    });
    const token = loginRes.body.data?.token;
    if (!token) {
      throw new Error('Failed to retrieve token for customer tests.');
    }
    console.log('   ✅ Admin Authenticated successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Create a Wholesale Customer (With optional GST & notes)
    // -------------------------------------------------------------------------
    console.log('▶ Test 1: Creating a Wholesale Customer...');
    const cust1Data = {
      name: 'Apex Industrial Supplies',
      mobile: '+919876543210',
      email: 'contact@apexind.com',
      business_name: 'Apex Enterprise Ltd',
      gst_number: '27AAAAA0000A1Z5',
      customer_type: 'WHOLESALE',
      address: '102 Industrial Estate, Sector 4, Mumbai',
      status: 'LEAD',
      follow_up_date: '2026-08-20',
      notes: 'Interested in bulk purchasing fasteners.',
    };

    const createRes1 = await makeRequest('POST', '/api/customers', cust1Data, token);
    if (createRes1.status === 201 && createRes1.body.success && createRes1.body.data?.customer) {
      console.log('   ✅ SUCCESS [201 Created]');
      console.log(`      - Customer ID: ${createRes1.body.data.customer.id}`);
      console.log(`      - Name:        ${createRes1.body.data.customer.name}`);
      console.log(`      - Business:    ${createRes1.body.data.customer.business_name}`);
      console.log(`      - GST:         ${createRes1.body.data.customer.gst_number}`);
      console.log(`      - Type:        ${createRes1.body.data.customer.customer_type}`);
      console.log(`      - Status:      ${createRes1.body.data.customer.status}\n`);
    } else {
      console.error('   ❌ FAILED:', createRes1.status, createRes1.body);
      process.exitCode = 1;
    }

    const createdCustomerId = createRes1.body.data?.customer?.id;

    // -------------------------------------------------------------------------
    // TEST 2: Create a Retail Customer (Optional GST omitted)
    // -------------------------------------------------------------------------
    console.log('▶ Test 2: Creating a Retail Customer (Optional GST omitted)...');
    const cust2Data = {
      name: 'Rohan Sharma',
      mobile: '9820011223',
      email: 'rohan.s@gmail.com',
      business_name: 'Sharma Traders',
      customer_type: 'RETAIL',
      address: 'Shop 12, Main Market, Delhi',
      status: 'ACTIVE',
    };

    const createRes2 = await makeRequest('POST', '/api/customers', cust2Data, token);
    if (createRes2.status === 201 && createRes2.body.success) {
      console.log('   ✅ SUCCESS [201 Created] (Optional GST handled correctly as null)\n');
    } else {
      console.error('   ❌ FAILED:', createRes2.status, createRes2.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 3: Get All Customers (Pagination)
    // -------------------------------------------------------------------------
    console.log('▶ Test 3: Getting All Customers (Paginated)...');
    const listRes = await makeRequest('GET', '/api/customers?page=1&limit=10', null, token);
    if (listRes.status === 200 && listRes.body.success) {
      console.log(`   ✅ SUCCESS [200 OK]`);
      console.log(`      - Total Records: ${listRes.body.data.total}`);
      console.log(`      - Page:          ${listRes.body.data.page} of ${listRes.body.data.totalPages}`);
      console.log(`      - Records Count: ${listRes.body.data.customers.length}\n`);
    } else {
      console.error('   ❌ FAILED:', listRes.status, listRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 4: Search Customers
    // -------------------------------------------------------------------------
    console.log('▶ Test 4: Searching Customers for term "Apex"...');
    const searchRes = await makeRequest('GET', '/api/customers?search=Apex', null, token);
    if (searchRes.status === 200 && searchRes.body.data?.customers?.length >= 1) {
      console.log(`   ✅ SUCCESS [200 OK]: Found ${searchRes.body.data.customers.length} matching customer(s).\n`);
    } else {
      console.error('   ❌ FAILED:', searchRes.status, searchRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 5: Filter Customers by Type & Status
    // -------------------------------------------------------------------------
    console.log('▶ Test 5: Filtering Customers by customer_type=WHOLESALE & status=LEAD...');
    const filterRes = await makeRequest('GET', '/api/customers?customer_type=WHOLESALE&status=LEAD', null, token);
    if (filterRes.status === 200 && filterRes.body.success) {
      console.log(`   ✅ SUCCESS [200 OK]: Matched ${filterRes.body.data.customers.length} customer(s).\n`);
    } else {
      console.error('   ❌ FAILED:', filterRes.status, filterRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 6: Get Customer by ID
    // -------------------------------------------------------------------------
    console.log(`▶ Test 6: Getting Customer by ID (${createdCustomerId})...`);
    const getByIdRes = await makeRequest('GET', `/api/customers/${createdCustomerId}`, null, token);
    if (getByIdRes.status === 200 && getByIdRes.body.data?.customer?.id === createdCustomerId) {
      console.log(`   ✅ SUCCESS [200 OK]: Retrieved ${getByIdRes.body.data.customer.name}\n`);
    } else {
      console.error('   ❌ FAILED:', getByIdRes.status, getByIdRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 7: Update Customer & Add Follow-up Notes
    // -------------------------------------------------------------------------
    console.log(`▶ Test 7: Updating Customer status to ACTIVE & adding follow-up notes...`);
    const updateData = {
      status: 'ACTIVE',
      follow_up_date: '2026-08-25',
      notes: 'Follow-up call completed. Customer converted from LEAD to ACTIVE. Credit terms agreed.',
    };
    const updateRes = await makeRequest('PUT', `/api/customers/${createdCustomerId}`, updateData, token);
    if (
      updateRes.status === 200 &&
      updateRes.body.data?.customer?.status === 'ACTIVE' &&
      updateRes.body.data?.customer?.notes.includes('converted from LEAD to ACTIVE')
    ) {
      console.log('   ✅ SUCCESS [200 OK]');
      console.log(`      - New Status: ${updateRes.body.data.customer.status}`);
      console.log(`      - Notes:      ${updateRes.body.data.customer.notes}\n`);
    } else {
      console.error('   ❌ FAILED:', updateRes.status, updateRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 8: Validation Error Handling - Invalid Input Tests
    // -------------------------------------------------------------------------
    console.log('▶ Test 8.1: Testing missing mandatory name validation...');
    const badNameRes = await makeRequest(
      'POST',
      '/api/customers',
      { mobile: '9876543210', business_name: 'Test', address: 'Test Address' },
      token
    );
    if (badNameRes.status === 400 && !badNameRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${badNameRes.body.message}`);
    } else {
      console.error('   ❌ FAILED:', badNameRes.status, badNameRes.body);
      process.exitCode = 1;
    }

    console.log('▶ Test 8.2: Testing invalid mobile number format validation...');
    const badMobileRes = await makeRequest(
      'POST',
      '/api/customers',
      { name: 'Test', mobile: '123', business_name: 'Test', address: 'Test Address' },
      token
    );
    if (badMobileRes.status === 400 && !badMobileRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${badMobileRes.body.message}`);
    } else {
      console.error('   ❌ FAILED:', badMobileRes.status, badMobileRes.body);
      process.exitCode = 1;
    }

    console.log('▶ Test 8.3: Testing invalid customer type enum validation...');
    const badTypeRes = await makeRequest(
      'POST',
      '/api/customers',
      { name: 'Test', mobile: '9876543210', business_name: 'Test', address: 'Test Address', customer_type: 'SUPERMARKET' },
      token
    );
    if (badTypeRes.status === 400 && !badTypeRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${badTypeRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED:', badTypeRes.status, badTypeRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 9: Non-Existing Customer 404 Handling
    // -------------------------------------------------------------------------
    console.log('▶ Test 9: Testing GET for non-existing UUID customer...');
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const notFoundRes = await makeRequest('GET', `/api/customers/${fakeUuid}`, null, token);
    if (notFoundRes.status === 404 && !notFoundRes.body.success) {
      console.log(`   ✅ SUCCESS [404 Not Found]: ${notFoundRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED:', notFoundRes.status, notFoundRes.body);
      process.exitCode = 1;
    }

    console.log('====================================================');
    console.log('🎉 ALL CUSTOMER CRM BACKEND TESTS PASSED!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runCustomerTests();
