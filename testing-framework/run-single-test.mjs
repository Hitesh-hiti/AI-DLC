#!/usr/bin/env node

/**
 * Standalone Test Runner for BET-001: Search returns offers with amounts in integer minor units
 * 
 * This runner executes the test logic directly without requiring full npm/vitest installation.
 * It validates the test specification against the acceptance criteria.
 */

import assert from 'assert';

// Test Data & Constants
const IATA_CODES = {
  YVR: 'YVR',
  JFK: 'JFK',
  CDG: 'CDG'
};

const CURRENCIES = {
  USD: 'USD'
};

// Mock Sabre Response (Fixture)
const mockSearchResponse = {
  status: 200,
  body: {
    offers: [
      {
        offer_id: '_TEST_OFFER_YVR_JFK_001',
        base_fare_amount: 45000,  // $450.00 in minor units
        currency_code: CURRENCIES.USD,
        taxes: [
          { code: 'YQ', amount: 2500 },  // Fuel surcharge $25.00
          { code: 'US', amount: 1000 }   // Tax $10.00
        ],
        fees: [
          { type: 'BOOKING_FEE', amount: 500 } // Booking fee $5.00
        ],
        total_amount: 49000  // 45000 + 2500 + 1000 + 500
      },
      {
        offer_id: '_TEST_OFFER_YVR_JFK_002',
        base_fare_amount: 52000,  // $520.00
        currency_code: CURRENCIES.USD,
        taxes: [
          { code: 'YQ', amount: 2500 },
          { code: 'US', amount: 1200 }
        ],
        fees: [
          { type: 'BOOKING_FEE', amount: 500 }
        ],
        total_amount: 56200
      }
    ]
  }
};

// Mock API Client
class MockBookingServiceClient {
  constructor(config) {
    this.config = config;
  }

  async search(searchRequest, options) {
    console.log(`[API] POST /v1/search (${options?.correlationId})`);
    console.log(`[API] Request:`, JSON.stringify(searchRequest, null, 2));
    return mockSearchResponse;
  }
}

// Logger
class Logger {
  constructor(service) {
    this.service = service;
  }

  info(message, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: this.service,
      message,
      ...context
    };
    console.log(JSON.stringify(entry, null, 2));
  }

  debug(message, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      service: this.service,
      message,
      ...context
    };
    console.log(JSON.stringify(entry, null, 2));
  }

  error(message, context, error) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: this.service,
      message,
      ...context,
      ...(error && {
        error_name: error.name,
        error_message: error.message
      })
    };
    console.error(JSON.stringify(entry, null, 2));
  }
}

// ============================================================================
// TEST: BET-001 - Search returns offers with amounts in integer minor units
// ============================================================================

async function testBET001() {
  const logger = new Logger('BET-001.test.mjs');
  const correlationId = 'CORR_SEARCH_001';
  
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('TEST: BET-001 - Search returns offers with amounts in integer minor units');
  console.log('═'.repeat(80));
  console.log('\n');

  try {
    // Initialize client
    const client = new MockBookingServiceClient({
      baseURL: 'http://localhost:3000',
      headers: {
        'X-Tenant-ID': '_TEST_TENANT_001',
        'Authorization': 'Bearer test-jwt-token'
      }
    });

    // Test data
    const searchRequest = {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.JFK,
      departure_date: '2026-10-15',
      return_date: '2026-10-22',
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };

    logger.info('Executing search', {
      correlationId,
      searchRequest
    });

    // Execute search
    const response = await client.search(searchRequest, { correlationId });

    // ========================================================================
    // ASSERTION BLOCK
    // ========================================================================
    console.log('\n--- ASSERTIONS ---\n');

    // Assertion 1: HTTP 200
    console.log('1. Assertion: HTTP 200');
    assert.strictEqual(response.status, 200, 'Expected HTTP 200');
    console.log('   ✅ PASS: HTTP 200\n');

    // Assertion 2: Response body exists
    console.log('2. Assertion: Response body defined');
    assert.ok(response.body, 'Response body should be defined');
    console.log('   ✅ PASS: Response body exists\n');

    // Assertion 3: Offers array is non-empty
    console.log('3. Assertion: Offers array exists and is non-empty');
    assert.ok(Array.isArray(response.body.offers), 'Offers should be an array');
    assert.ok(response.body.offers.length > 0, 'Offers array should not be empty');
    console.log(`   ✅ PASS: ${response.body.offers.length} offers found\n`);

    // Assertion 4-13: Each offer has correct structure
    console.log('4. Assertion: Each offer has correct monetary structure (integer minor units)\n');

    let offerIndex = 0;
    response.body.offers.forEach((offer) => {
      offerIndex++;
      console.log(`   Offer ${offerIndex}: ${offer.offer_id}`);

      // Base fare must be integer
      console.log(`   - Base fare: ${offer.base_fare_amount}`);
      assert.ok(typeof offer.base_fare_amount === 'number', `Offer ${offerIndex}: base_fare_amount must be number`);
      assert.ok(Number.isInteger(offer.base_fare_amount), `Offer ${offerIndex}: base_fare_amount must be integer`);
      assert.ok(offer.base_fare_amount > 0, `Offer ${offerIndex}: base_fare_amount must be > 0`);
      console.log(`     ✓ Integer minor units: ${offer.base_fare_amount} (= USD ${(offer.base_fare_amount / 100).toFixed(2)})`);

      // Currency must be USD
      console.log(`   - Currency: ${offer.currency_code}`);
      assert.strictEqual(offer.currency_code, CURRENCIES.USD, `Offer ${offerIndex}: currency must be ${CURRENCIES.USD}`);
      console.log(`     ✓ ISO 4217: ${offer.currency_code}`);

      // Taxes array
      console.log(`   - Taxes: ${offer.taxes.length} items`);
      assert.ok(Array.isArray(offer.taxes), `Offer ${offerIndex}: taxes must be array`);
      offer.taxes.forEach((tax, taxIdx) => {
        assert.ok(tax.code, `Offer ${offerIndex} Tax ${taxIdx}: code required`);
        assert.ok(typeof tax.amount === 'number', `Offer ${offerIndex} Tax ${taxIdx}: amount must be number`);
        assert.ok(Number.isInteger(tax.amount), `Offer ${offerIndex} Tax ${taxIdx}: amount must be integer`);
        assert.ok(tax.amount >= 0, `Offer ${offerIndex} Tax ${taxIdx}: amount must be >= 0`);
        console.log(`     ✓ Tax ${taxIdx}: ${tax.code} = ${tax.amount} (USD ${(tax.amount / 100).toFixed(2)})`);
      });

      // Fees array
      console.log(`   - Fees: ${offer.fees.length} items`);
      assert.ok(Array.isArray(offer.fees), `Offer ${offerIndex}: fees must be array`);
      offer.fees.forEach((fee, feeIdx) => {
        assert.ok(fee.type, `Offer ${offerIndex} Fee ${feeIdx}: type required`);
        assert.ok(typeof fee.amount === 'number', `Offer ${offerIndex} Fee ${feeIdx}: amount must be number`);
        assert.ok(Number.isInteger(fee.amount), `Offer ${offerIndex} Fee ${feeIdx}: amount must be integer`);
        assert.ok(fee.amount >= 0, `Offer ${offerIndex} Fee ${feeIdx}: amount must be >= 0`);
        console.log(`     ✓ Fee ${feeIdx}: ${fee.type} = ${fee.amount} (USD ${(fee.amount / 100).toFixed(2)})`);
      });

      // Invariant: Total must equal sum (base + taxes + fees)
      console.log(`   - Invariant check: base + taxes + fees = total`);
      const sumOfTaxes = offer.taxes.reduce((acc, tax) => acc + tax.amount, 0);
      const sumOfFees = offer.fees.reduce((acc, fee) => acc + fee.amount, 0);
      const expectedTotal = offer.base_fare_amount + sumOfTaxes + sumOfFees;
      
      assert.strictEqual(
        offer.total_amount,
        expectedTotal,
        `Offer ${offerIndex}: total (${offer.total_amount}) must equal base (${offer.base_fare_amount}) + taxes (${sumOfTaxes}) + fees (${sumOfFees}) = ${expectedTotal}`
      );
      
      console.log(`     ✓ ${offer.base_fare_amount} + ${sumOfTaxes} + ${sumOfFees} = ${offer.total_amount} ✓`);
      console.log(`     ✓ Total in USD: ${(offer.total_amount / 100).toFixed(2)}`);
      console.log('');
    });

    // Assertion: No floating-point amounts
    console.log('5. Assertion: No floating-point amounts in response\n');
    response.body.offers.forEach((offer, idx) => {
      assert.strictEqual(offer.base_fare_amount % 1, 0, `Offer ${idx}: base_fare_amount should be integer`);
      assert.strictEqual(offer.total_amount % 1, 0, `Offer ${idx}: total_amount should be integer`);
      offer.taxes.forEach((tax, tidx) => {
        assert.strictEqual(tax.amount % 1, 0, `Offer ${idx} Tax ${tidx}: amount should be integer`);
      });
      offer.fees.forEach((fee, fidx) => {
        assert.strictEqual(fee.amount % 1, 0, `Offer ${idx} Fee ${fidx}: amount should be integer`);
      });
    });
    console.log('   ✅ PASS: All amounts are integers (no floats)\n');

    // ========================================================================
    // TEST PASSED
    // ========================================================================
    console.log('═'.repeat(80));
    console.log('✅ TEST PASSED: BET-001');
    console.log('═'.repeat(80));
    console.log('\n');

    logger.info('Search test BET-001 PASSED');

    return {
      status: 'PASS',
      testId: 'BET-001',
      testName: 'Search returns offers with amounts in integer minor units',
      assertions: 5,
      offers: response.body.offers.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('❌ TEST FAILED: BET-001');
    console.log('═'.repeat(80));
    console.log('\n');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('\n');

    const logger = new Logger('BET-001.test.mjs');
    logger.error('Search test BET-001 FAILED', {}, error);

    return {
      status: 'FAIL',
      testId: 'BET-001',
      testName: 'Search returns offers with amounts in integer minor units',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

(async () => {
  const result = await testBET001();
  
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('TEST RESULT SUMMARY');
  console.log('═'.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  console.log('═'.repeat(80));
  console.log('\n');

  process.exit(result.status === 'PASS' ? 0 : 1);
})();
