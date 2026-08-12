import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from '../src/app';

const TEST_PORT = 5007;
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

async function runProductTests() {
  console.log('====================================================');
  console.log('🧪 Starting Product & Inventory Backend Module Tests');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);
  console.log(`📡 Test server running on port ${TEST_PORT}\n`);

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Authenticate as Admin, Warehouse, & Sales users
    // -------------------------------------------------------------------------
    console.log('▶ Step 0: Authenticating test users...');
    const adminLogin = await makeRequest('POST', '/api/auth/login', { email: 'admin@erp.com', password: 'Admin@123' });
    const warehouseLogin = await makeRequest('POST', '/api/auth/login', { email: 'warehouse@erp.com', password: 'Warehouse@123' });
    const salesLogin = await makeRequest('POST', '/api/auth/login', { email: 'sales@erp.com', password: 'Sales@123' });

    const adminToken = adminLogin.body.data?.token;
    const warehouseToken = warehouseLogin.body.data?.token;
    const salesToken = salesLogin.body.data?.token;

    if (!adminToken || !warehouseToken || !salesToken) {
      throw new Error('Failed to retrieve authentication tokens.');
    }
    console.log('   ✅ Tokens retrieved for ADMIN, WAREHOUSE, and SALES.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Create Product
    // -------------------------------------------------------------------------
    const uniqueSku = `ELEC-POWER-${Date.now().toString().slice(-6)}`;
    console.log(`▶ Test 1: Creating Product (SKU: ${uniqueSku})...`);
    const productData1 = {
      name: 'Industrial Power Connector 100A',
      sku: uniqueSku,
      category: 'Electrical Components',
      unit_price: 450.50,
      current_stock: 50,
      min_stock_alert: 15,
      warehouse_location: 'Rack A-12',
    };

    const createRes1 = await makeRequest('POST', '/api/products', productData1, adminToken);
    if (createRes1.status === 201 && createRes1.body.success && createRes1.body.data?.product) {
      console.log('   ✅ SUCCESS [201 Created]');
      console.log(`      - Product ID:      ${createRes1.body.data.product.id}`);
      console.log(`      - Name:            ${createRes1.body.data.product.name}`);
      console.log(`      - SKU:             ${createRes1.body.data.product.sku}`);
      console.log(`      - Unit Price:      ₹${createRes1.body.data.product.unit_price}`);
      console.log(`      - Current Stock:   ${createRes1.body.data.product.current_stock}`);
      console.log(`      - Min Stock Alert: ${createRes1.body.data.product.min_stock_alert}\n`);
    } else {
      console.error('   ❌ FAILED:', createRes1.status, createRes1.body);
      process.exitCode = 1;
    }

    const productId1 = createRes1.body.data?.product?.id;

    // -------------------------------------------------------------------------
    // TEST 2: Get Products List (Paginated)
    // -------------------------------------------------------------------------
    console.log('▶ Test 2: Getting Products List (Paginated)...');
    const listRes = await makeRequest('GET', '/api/products?page=1&limit=10', null, adminToken);
    if (listRes.status === 200 && listRes.body.success) {
      console.log(`   ✅ SUCCESS [200 OK]`);
      console.log(`      - Total Products: ${listRes.body.data.total}`);
      console.log(`      - Returned Count: ${listRes.body.data.products.length}\n`);
    } else {
      console.error('   ❌ FAILED:', listRes.status, listRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 3: Search Product by Name or SKU
    // -------------------------------------------------------------------------
    console.log('▶ Test 3: Searching Products for term "ELEC-POWER"...');
    const searchRes = await makeRequest('GET', '/api/products?search=ELEC-POWER', null, adminToken);
    if (searchRes.status === 200 && searchRes.body.data?.products?.length >= 1) {
      console.log(`   ✅ SUCCESS [200 OK]: Found ${searchRes.body.data.products.length} product(s) matching search.\n`);
    } else {
      console.error('   ❌ FAILED:', searchRes.status, searchRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 4: Get Product by ID
    // -------------------------------------------------------------------------
    console.log(`▶ Test 4: Getting Product details by ID (${productId1})...`);
    const getByIdRes = await makeRequest('GET', `/api/products/${productId1}`, null, adminToken);
    if (getByIdRes.status === 200 && getByIdRes.body.data?.product?.id === productId1) {
      console.log(`   ✅ SUCCESS [200 OK]: Retrieved ${getByIdRes.body.data.product.name}\n`);
    } else {
      console.error('   ❌ FAILED:', getByIdRes.status, getByIdRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 5: Update Product
    // -------------------------------------------------------------------------
    console.log(`▶ Test 5: Updating Product unit price and warehouse location...`);
    const updateData = {
      unit_price: 475.00,
      warehouse_location: 'Rack B-05',
    };
    const updateRes = await makeRequest('PUT', `/api/products/${productId1}`, updateData, warehouseToken);
    if (
      updateRes.status === 200 &&
      updateRes.body.data?.product?.unit_price === 475 &&
      updateRes.body.data?.product?.warehouse_location === 'Rack B-05'
    ) {
      console.log('   ✅ SUCCESS [200 OK]');
      console.log(`      - New Price:    ₹${updateRes.body.data.product.unit_price}`);
      console.log(`      - New Location: ${updateRes.body.data.product.warehouse_location}\n`);
    } else {
      console.error('   ❌ FAILED:', updateRes.status, updateRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 6 & 7: Add IN Stock Movement & Verify Stock Increased
    // Initial stock: 50. Add IN 25 units. Expected stock: 75.
    // -------------------------------------------------------------------------
    console.log('▶ Test 6 & 7: Adding IN Stock Movement (+25 units)...');
    const inMovementData = {
      product_id: productId1,
      quantity: 25,
      movement_type: 'IN',
      reason: 'Received shipment from supplier Ref #INV-9021',
    };
    const inRes = await makeRequest('POST', '/api/stock-movements', inMovementData, warehouseToken);
    if (inRes.status === 201 && inRes.body.data?.updatedStock === 75) {
      console.log('   ✅ SUCCESS [201 Created]');
      console.log(`      - Previous Stock: 50`);
      console.log(`      - Added Quantity: +25`);
      console.log(`      - Updated Stock:  ${inRes.body.data.updatedStock}\n`);
    } else {
      console.error('   ❌ FAILED:', inRes.status, inRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 8 & 9: Add OUT Stock Movement & Verify Stock Decreased
    // Current stock: 75. Add OUT 15 units. Expected stock: 60.
    // -------------------------------------------------------------------------
    console.log('▶ Test 8 & 9: Adding OUT Stock Movement (-15 units)...');
    const outMovementData = {
      product_id: productId1,
      quantity: 15,
      movement_type: 'OUT',
      reason: 'Dispatched for Customer Order #CH-2026-001',
    };
    const outRes = await makeRequest('POST', '/api/stock-movements', outMovementData, warehouseToken);
    if (outRes.status === 201 && outRes.body.data?.updatedStock === 60) {
      console.log('   ✅ SUCCESS [201 Created]');
      console.log(`      - Previous Stock: 75`);
      console.log(`      - Dispatched:     -15`);
      console.log(`      - Updated Stock:  ${outRes.body.data.updatedStock}\n`);
    } else {
      console.error('   ❌ FAILED:', outRes.status, outRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 10 & 11: Attempt OUT Movement > Available Stock (Verify Rejection & Non-negative Stock)
    // Current stock: 60. Try OUT 100 units. Must fail with HTTP 400 Bad Request.
    // -------------------------------------------------------------------------
    console.log('▶ Test 10 & 11: Attempting OUT movement (100 units) exceeding available stock (60 units)...');
    const excessMovementData = {
      product_id: productId1,
      quantity: 100,
      movement_type: 'OUT',
      reason: 'Excess dispatch attempt',
    };
    const excessRes = await makeRequest('POST', '/api/stock-movements', excessMovementData, warehouseToken);
    if (excessRes.status === 400 && !excessRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${excessRes.body.message}`);

      // Verify stock remained unchanged at 60
      const verifyStockRes = await makeRequest('GET', `/api/products/${productId1}`, null, adminToken);
      if (verifyStockRes.body.data?.product?.current_stock === 60) {
        console.log(`      - Verified stock remained unchanged at: ${verifyStockRes.body.data.product.current_stock}\n`);
      } else {
        console.error('   ❌ FAILED: Stock was altered after rejected movement!', verifyStockRes.body);
        process.exitCode = 1;
      }
    } else {
      console.error('   ❌ FAILED: Excess OUT movement was not rejected!', excessRes.status, excessRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 12: Verify Stock Movement History Records
    // -------------------------------------------------------------------------
    console.log('▶ Test 12: Verifying Stock Movement History Records...');
    const historyRes = await makeRequest('GET', `/api/stock-movements?product_id=${productId1}`, null, adminToken);
    if (historyRes.status === 200 && historyRes.body.data?.movements?.length >= 2) {
      console.log(`   ✅ SUCCESS [200 OK]: Retrieved ${historyRes.body.data.movements.length} audit movement record(s).`);
      historyRes.body.data.movements.forEach((m: any, idx: number) => {
        console.log(`      ${idx + 1}. [${m.movement_type}] Qty: ${m.quantity} | Reason: "${m.reason}" | By: ${m.creator_name}`);
      });
      console.log('');
    } else {
      console.error('   ❌ FAILED:', historyRes.status, historyRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 13: Role Authorization Restriction (SALES user cannot modify stock or create products)
    // -------------------------------------------------------------------------
    console.log('▶ Test 13: Testing Role Restriction (SALES role attempting to create product & stock movement)...');
    const salesProductRes = await makeRequest('POST', '/api/products', productData1, salesToken);
    if (salesProductRes.status === 403) {
      console.log(`   ✅ SUCCESS [403 Forbidden]: Product creation blocked for SALES role.`);
    } else {
      console.error('   ❌ FAILED: Product creation allowed for SALES role!', salesProductRes.status);
      process.exitCode = 1;
    }

    const salesMovementRes = await makeRequest('POST', '/api/stock-movements', inMovementData, salesToken);
    if (salesMovementRes.status === 403) {
      console.log(`   ✅ SUCCESS [403 Forbidden]: Stock movement creation blocked for SALES role.\n`);
    } else {
      console.error('   ❌ FAILED: Stock movement allowed for SALES role!', salesMovementRes.status);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 14: Test Invalid Product Data
    // -------------------------------------------------------------------------
    console.log('▶ Test 14.1: Testing Negative Unit Price validation...');
    const badPriceRes = await makeRequest(
      'POST',
      '/api/products',
      { name: 'Invalid Product', sku: 'INV-001', category: 'Test', unit_price: -10, warehouse_location: 'A1' },
      adminToken
    );
    if (badPriceRes.status === 400 && !badPriceRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${badPriceRes.body.message}`);
    } else {
      console.error('   ❌ FAILED:', badPriceRes.status, badPriceRes.body);
      process.exitCode = 1;
    }

    console.log('▶ Test 14.2: Testing Negative Initial Stock validation...');
    const badStockRes = await makeRequest(
      'POST',
      '/api/products',
      { name: 'Invalid Product', sku: 'INV-002', category: 'Test', unit_price: 100, current_stock: -5, warehouse_location: 'A1' },
      adminToken
    );
    if (badStockRes.status === 400 && !badStockRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${badStockRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED:', badStockRes.status, badStockRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 15: Test Duplicate SKU Rejection
    // -------------------------------------------------------------------------
    console.log(`▶ Test 15: Testing Duplicate SKU Rejection (Attempting to create SKU: ${uniqueSku})...`);
    const duplicateSkuRes = await makeRequest('POST', '/api/products', productData1, adminToken);
    if (duplicateSkuRes.status === 409 && !duplicateSkuRes.body.success) {
      console.log(`   ✅ SUCCESS [409 Conflict]: ${duplicateSkuRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED: Duplicate SKU was not rejected properly!', duplicateSkuRes.status, duplicateSkuRes.body);
      process.exitCode = 1;
    }

    console.log('====================================================');
    console.log('🎉 ALL PRODUCT & INVENTORY BACKEND TESTS PASSED!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runProductTests();
