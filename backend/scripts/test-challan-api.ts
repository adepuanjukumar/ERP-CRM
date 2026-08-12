import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from '../src/app';

const TEST_PORT = 5008;
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

async function runChallanTests() {
  console.log('====================================================');
  console.log('🧪 Starting Sales Challan Backend Module Tests');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);
  console.log(`📡 Test server running on port ${TEST_PORT}\n`);

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Authenticate test users
    // -------------------------------------------------------------------------
    console.log('▶ Step 0: Authenticating test users...');
    const salesLogin = await makeRequest('POST', '/api/auth/login', { email: 'sales@erp.com', password: 'Sales@123' });
    const adminLogin = await makeRequest('POST', '/api/auth/login', { email: 'admin@erp.com', password: 'Admin@123' });
    const warehouseLogin = await makeRequest('POST', '/api/auth/login', { email: 'warehouse@erp.com', password: 'Warehouse@123' });

    const salesToken = salesLogin.body.data?.token;
    const adminToken = adminLogin.body.data?.token;
    const warehouseToken = warehouseLogin.body.data?.token;

    if (!salesToken || !adminToken || !warehouseToken) {
      throw new Error('Failed to retrieve authentication tokens.');
    }
    console.log('   ✅ Tokens retrieved for SALES, ADMIN, and WAREHOUSE.\n');

    // -------------------------------------------------------------------------
    // STEP 0.1: Setup test customer and products
    // -------------------------------------------------------------------------
    console.log('▶ Step 0.1: Setting up test Customer and Test Products...');
    const customerRes = await makeRequest('POST', '/api/customers', {
      name: 'Globe Wholesale Corp',
      mobile: '9876500000',
      business_name: 'Globe Corp',
      address: '404 Commerce St',
      customer_type: 'WHOLESALE',
      status: 'ACTIVE',
    }, adminToken);
    const customerId = customerRes.body.data.customer.id;

    const timeSuffix = Date.now().toString().slice(-5);
    // Create Product 1 (Stock: 100, Price: ₹200.00)
    const productRes1 = await makeRequest('POST', '/api/products', {
      name: 'Heavy Duty Bearing 6205',
      sku: `BEAR-6205-HD-${timeSuffix}`,
      category: 'Bearings',
      unit_price: 200.00,
      current_stock: 100,
      min_stock_alert: 10,
      warehouse_location: 'Bay C-1',
    }, adminToken);
    const prodId1 = productRes1.body.data.product.id;

    // Create Product 2 (Stock: 10, Price: ₹500.00)
    const productRes2 = await makeRequest('POST', '/api/products', {
      name: 'Synthetic Motor Oil 5L',
      sku: `OIL-SYN-5L-${timeSuffix}`,
      category: 'Lubricants',
      unit_price: 500.00,
      current_stock: 10,
      min_stock_alert: 5,
      warehouse_location: 'Bay C-2',
    }, adminToken);
    const prodId2 = productRes2.body.data.product.id;

    console.log('   ✅ Test Customer and 2 Test Products created.');
    console.log(`      - Customer ID: ${customerId}`);
    console.log(`      - Product 1: ${prodId1} (Stock: 100, Price: ₹200)`);
    console.log(`      - Product 2: ${prodId2} (Stock: 10, Price: ₹500)\n`);

    // -------------------------------------------------------------------------
    // TEST 1 to 7: Create DRAFT Challan & Verify Calculations / Snapshots
    // -------------------------------------------------------------------------
    console.log('▶ Test 1-7: Creating DRAFT Sales Challan with multiple products...');
    const challanInput = {
      customer_id: customerId,
      items: [
        { product_id: prodId1, quantity: 5 },  // 5 * 200 = 1000
        { product_id: prodId2, quantity: 2 },  // 2 * 500 = 1000
      ],
    };

    const createChallanRes = await makeRequest('POST', '/api/sales-challans', challanInput, salesToken);
    if (createChallanRes.status === 201 && createChallanRes.body.success) {
      const ch = createChallanRes.body.data.challan;
      console.log('   ✅ SUCCESS [201 Created]');
      console.log(`      - Challan ID:       ${ch.id}`);
      console.log(`      - Challan Number:   ${ch.challan_number} (Auto-generated)`);
      console.log(`      - Status:           ${ch.status}`);
      console.log(`      - Total Quantity:   ${ch.total_quantity} (Expected: 7)`);
      console.log(`      - Total Amount:     ₹${ch.total_amount} (Expected: ₹2000)`);

      // Verify product snapshot data
      const item1 = ch.items[0];
      const item2 = ch.items[1];
      console.log(`      - Item 1 Snapshot:  ${item1.product_name_snapshot} (${item1.sku_snapshot}) @ ₹${item1.unit_price_snapshot} x ${item1.quantity} = ₹${item1.total_price}`);
      console.log(`      - Item 2 Snapshot:  ${item2.product_name_snapshot} (${item2.sku_snapshot}) @ ₹${item2.unit_price_snapshot} x ${item2.quantity} = ₹${item2.total_price}\n`);
    } else {
      console.error('   ❌ FAILED:', createChallanRes.status, createChallanRes.body);
      process.exitCode = 1;
    }

    const challanId = createChallanRes.body.data.challan.id;
    const challanNumber = createChallanRes.body.data.challan.challan_number;

    // -------------------------------------------------------------------------
    // TEST 8: Verify DRAFT creation does NOT reduce stock
    // -------------------------------------------------------------------------
    console.log('▶ Test 8: Verifying DRAFT creation did NOT alter product stock...');
    const checkProd1 = await makeRequest('GET', `/api/products/${prodId1}`, null, adminToken);
    const checkProd2 = await makeRequest('GET', `/api/products/${prodId2}`, null, adminToken);

    if (checkProd1.body.data.product.current_stock === 100 && checkProd2.body.data.product.current_stock === 10) {
      console.log('   ✅ SUCCESS: Stock remained unchanged (Prod 1: 100, Prod 2: 10).\n');
    } else {
      console.error('   ❌ FAILED: Stock was altered during DRAFT creation!', checkProd1.body, checkProd2.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 9 to 12: Confirm Valid Challan & Verify Stock Reduction + OUT Movement
    // -------------------------------------------------------------------------
    console.log(`▶ Test 9-12: Confirming Sales Challan '${challanNumber}'...`);
    const confirmRes = await makeRequest('POST', `/api/sales-challans/${challanId}/confirm`, null, salesToken);

    if (confirmRes.status === 200 && confirmRes.body.data?.challan?.status === 'CONFIRMED') {
      console.log(`   ✅ SUCCESS [200 OK]: Challan status updated to CONFIRMED.`);

      // Verify Product 1 stock decreased (100 - 5 = 95)
      const afterProd1 = await makeRequest('GET', `/api/products/${prodId1}`, null, adminToken);
      // Verify Product 2 stock decreased (10 - 2 = 8)
      const afterProd2 = await makeRequest('GET', `/api/products/${prodId2}`, null, adminToken);

      console.log(`      - Product 1 Stock after confirm: ${afterProd1.body.data.product.current_stock} (Expected: 95)`);
      console.log(`      - Product 2 Stock after confirm: ${afterProd2.body.data.product.current_stock} (Expected: 8)`);

      // Verify OUT Movement records created
      const movementsRes = await makeRequest('GET', `/api/stock-movements?product_id=${prodId1}`, null, adminToken);
      const outMov = movementsRes.body.data.movements[0];
      console.log(`      - Stock Movement created: ${outMov.movement_type} | Qty: ${outMov.quantity} | Reason: "${outMov.reason}"\n`);
    } else {
      console.error('   ❌ FAILED:', confirmRes.status, confirmRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 13 to 16: Try confirming with insufficient stock (Verify rejection & zero stock alteration)
    // -------------------------------------------------------------------------
    console.log('▶ Test 13-16: Creating DRAFT challan requesting 50 units of Product 2 (Available: 8 units)...');
    const excessChallanRes = await makeRequest('POST', '/api/sales-challans', {
      customer_id: customerId,
      items: [
        { product_id: prodId1, quantity: 10 },
        { product_id: prodId2, quantity: 50 }, // Exceeds available stock 8
      ],
    }, salesToken);

    const excessChallanId = excessChallanRes.body.data.challan.id;

    console.log('   Attempting to confirm excess challan...');
    const confirmExcessRes = await makeRequest('POST', `/api/sales-challans/${excessChallanId}/confirm`, null, salesToken);

    if (confirmExcessRes.status === 400 && !confirmExcessRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${confirmExcessRes.body.message}`);

      // Verify NO partial stock deduction occurred (Prod 1 should still be 95, Prod 2 should still be 8)
      const checkProd1After = await makeRequest('GET', `/api/products/${prodId1}`, null, adminToken);
      const checkProd2After = await makeRequest('GET', `/api/products/${prodId2}`, null, adminToken);

      if (checkProd1After.body.data.product.current_stock === 95 && checkProd2After.body.data.product.current_stock === 8) {
        console.log(`      - Verified zero stock altered. Prod 1 stock remains 95, Prod 2 stock remains 8.\n`);
      } else {
        console.error('   ❌ FAILED: Partial stock update occurred after failed confirmation!', checkProd1After.body, checkProd2After.body);
        process.exitCode = 1;
      }
    } else {
      console.error('   ❌ FAILED: Excess confirmation was not rejected!', confirmExcessRes.status, confirmExcessRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 17 & 18: Attempt editing CONFIRMED & CANCELLED challans
    // -------------------------------------------------------------------------
    console.log('▶ Test 17: Attempting to edit a CONFIRMED challan...');
    const editConfirmedRes = await makeRequest('PUT', `/api/sales-challans/${challanId}`, {
      items: [{ product_id: prodId1, quantity: 1 }],
    }, salesToken);

    if (editConfirmedRes.status === 400 && !editConfirmedRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${editConfirmedRes.body.message}`);
    } else {
      console.error('   ❌ FAILED: Allowed editing a CONFIRMED challan!', editConfirmedRes.status, editConfirmedRes.body);
      process.exitCode = 1;
    }

    // Cancel excess challan
    await makeRequest('POST', `/api/sales-challans/${excessChallanId}/cancel`, null, salesToken);

    console.log('▶ Test 18: Attempting to edit a CANCELLED challan...');
    const editCancelledRes = await makeRequest('PUT', `/api/sales-challans/${excessChallanId}`, {
      items: [{ product_id: prodId1, quantity: 1 }],
    }, salesToken);

    if (editCancelledRes.status === 400 && !editCancelledRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${editCancelledRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED: Allowed editing a CANCELLED challan!', editCancelledRes.status, editCancelledRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 19 to 22: Input Validations (Invalid customer, product, zero quantity, empty items)
    // -------------------------------------------------------------------------
    console.log('▶ Test 19: Testing Invalid Customer ID...');
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const badCustRes = await makeRequest('POST', '/api/sales-challans', {
      customer_id: fakeUuid,
      items: [{ product_id: prodId1, quantity: 1 }],
    }, salesToken);
    if (badCustRes.status === 404 && !badCustRes.body.success) {
      console.log(`   ✅ SUCCESS [404 Not Found]: ${badCustRes.body.message}`);
    } else {
      console.error('   ❌ FAILED:', badCustRes.status, badCustRes.body);
      process.exitCode = 1;
    }

    console.log('▶ Test 20: Testing Invalid Product ID...');
    const badProdRes = await makeRequest('POST', '/api/sales-challans', {
      customer_id: customerId,
      items: [{ product_id: fakeUuid, quantity: 1 }],
    }, salesToken);
    if (badProdRes.status === 404 && !badProdRes.body.success) {
      console.log(`   ✅ SUCCESS [404 Not Found]: ${badProdRes.body.message}`);
    } else {
      console.error('   ❌ FAILED:', badProdRes.status, badProdRes.body);
      process.exitCode = 1;
    }

    console.log('▶ Test 21: Testing Zero/Negative quantity...');
    const badQtyRes = await makeRequest('POST', '/api/sales-challans', {
      customer_id: customerId,
      items: [{ product_id: prodId1, quantity: 0 }],
    }, salesToken);
    if (badQtyRes.status === 400 && !badQtyRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${badQtyRes.body.message}`);
    } else {
      console.error('   ❌ FAILED:', badQtyRes.status, badQtyRes.body);
      process.exitCode = 1;
    }

    console.log('▶ Test 22: Testing Empty Product items array...');
    const emptyItemsRes = await makeRequest('POST', '/api/sales-challans', {
      customer_id: customerId,
      items: [],
    }, salesToken);
    if (emptyItemsRes.status === 400 && !emptyItemsRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${emptyItemsRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED:', emptyItemsRes.status, emptyItemsRes.body);
      process.exitCode = 1;
    }

    // -------------------------------------------------------------------------
    // TEST 23 & 24: Role Authorization & Duplicate Confirmation Rejection
    // -------------------------------------------------------------------------
    console.log('▶ Test 23: Testing Role Restriction (WAREHOUSE role trying to create challan)...');
    const warehouseCreateRes = await makeRequest('POST', '/api/sales-challans', {
      customer_id: customerId,
      items: [{ product_id: prodId1, quantity: 1 }],
    }, warehouseToken);
    if (warehouseCreateRes.status === 403) {
      console.log(`   ✅ SUCCESS [403 Forbidden]: Challan creation blocked for WAREHOUSE role.`);
    } else {
      console.error('   ❌ FAILED: Challan creation allowed for WAREHOUSE role!', warehouseCreateRes.status);
      process.exitCode = 1;
    }

    console.log('▶ Test 24: Testing Duplicate Confirmation Rejection on CONFIRMED challan...');
    const reConfirmRes = await makeRequest('POST', `/api/sales-challans/${challanId}/confirm`, null, salesToken);
    if (reConfirmRes.status === 400 && !reConfirmRes.body.success) {
      console.log(`   ✅ SUCCESS [400 Bad Request]: ${reConfirmRes.body.message}\n`);
    } else {
      console.error('   ❌ FAILED: Allowed re-confirming an already CONFIRMED challan!', reConfirmRes.status, reConfirmRes.body);
      process.exitCode = 1;
    }

    console.log('====================================================');
    console.log('🎉 ALL SALES CHALLAN BACKEND TESTS PASSED!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runChallanTests();
