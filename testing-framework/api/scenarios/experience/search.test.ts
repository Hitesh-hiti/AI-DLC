/**
 * AC: AC-EXP-01-01, AC-EXP-01-06, AC-EXP-01-08
 * REQ: REQ-EXP-01
 * Story: EXP-01-Search
 * Priority: P0
 * Automation: AUTOMATION_REQUIRED
 * 
 * Test Cases:
 *   BET-001: Search returns offers with amounts in integer minor units
 *   BET-002: Search returns empty array when no offers available
 *   BET-003: Search with missing mandatory field returns HTTP 400 VALIDATION_ERROR
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BookingServiceClient } from '../../clients/BookingServiceClient';
import { SearchFixtures } from '../../__fixtures__/search.fixtures';
import { ErrorCodes, ErrorMessages } from '../../../shared/constants/ErrorCodes';
import { IATA_CODES, CURRENCIES } from '../../../shared/constants/TestData';
import { Logger } from '../../../shared/logger/Logger';

const logger = new Logger('search.test.ts');
let client: BookingServiceClient;

describe('Travel Search - Happy Path', () => {
  beforeAll(() => {
    client = new BookingServiceClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      headers: {
        'X-Tenant-ID': '_TEST_TENANT_001',
        'Authorization': `Bearer ${process.env.TEST_JWT || 'test-jwt-token'}`
      }
    });
    logger.info('Search test suite initialized');
  });

  afterAll(() => {
    logger.info('Search test suite completed');
  });

  describe('BET-001: Search returns offers with amounts in integer minor units', () => {
    it('should return offers with correct monetary format (integer minor units)', async () => {
      const correlationId = 'CORR_SEARCH_001';
      
      const searchRequest = {
        origin: IATA_CODES.YVR,
        destination: IATA_CODES.JFK,
        departure_date: '2026-10-15',
        return_date: '2026-10-22',
        passengers: [{ type: 'ADULT' }],
        cabin_class: 'ECONOMY'
      };

      logger.info('Executing search', { correlationId, searchRequest });

      const response = await client.search(searchRequest, { correlationId });

      // Assertion: HTTP 200
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Assertion: Offers array exists and is non-empty
      expect(response.body.offers).toBeDefined();
      expect(Array.isArray(response.body.offers)).toBe(true);
      expect(response.body.offers.length).toBeGreaterThan(0);

      // Assertion: Each offer has correct structure with integer amounts
      response.body.offers.forEach((offer, index) => {
        logger.debug(`Validating offer ${index}`, offer);

        // Base fare must be integer (minor units)
        expect(offer.base_fare_amount).toBeDefined();
        expect(typeof offer.base_fare_amount).toBe('number');
        expect(Number.isInteger(offer.base_fare_amount)).toBe(true);
        expect(offer.base_fare_amount).toBeGreaterThan(0);

        // Currency must be ISO 4217
        expect(offer.currency_code).toBe(CURRENCIES.USD);

        // Taxes array with IATA codes and integer amounts
        expect(Array.isArray(offer.taxes)).toBe(true);
        offer.taxes.forEach((tax) => {
          expect(tax.code).toBeDefined(); // IATA tax code (YQ, YR, US, etc.)
          expect(typeof tax.amount).toBe('number');
          expect(Number.isInteger(tax.amount)).toBe(true);
          expect(tax.amount).toBeGreaterThanOrEqual(0);
        });

        // Fees array with integer amounts
        expect(Array.isArray(offer.fees)).toBe(true);
        offer.fees.forEach((fee) => {
          expect(fee.type).toBeDefined();
          expect(typeof fee.amount).toBe('number');
          expect(Number.isInteger(fee.amount)).toBe(true);
          expect(fee.amount).toBeGreaterThanOrEqual(0);
        });

        // Total must equal sum (invariant check)
        const sumOfTaxes = offer.taxes.reduce((acc, tax) => acc + tax.amount, 0);
        const sumOfFees = offer.fees.reduce((acc, fee) => acc + fee.amount, 0);
        const expectedTotal = offer.base_fare_amount + sumOfTaxes + sumOfFees;
        
        expect(offer.total_amount).toBe(expectedTotal);
        logger.debug(`Invariant verified: ${offer.base_fare_amount} + ${sumOfTaxes} + ${sumOfFees} = ${offer.total_amount}`);
      });

      logger.info('Search test BET-001 PASSED');
    });

    it('should not contain floating-point amounts', async () => {
      const searchRequest = SearchFixtures.validSearch();
      const response = await client.search(searchRequest);

      response.body.offers.forEach((offer) => {
        // Verify no float values in response
        expect(offer.base_fare_amount % 1).toBe(0);
        offer.taxes.forEach((tax) => {
          expect(tax.amount % 1).toBe(0);
        });
        offer.fees.forEach((fee) => {
          expect(fee.amount % 1).toBe(0);
        });
        expect(offer.total_amount % 1).toBe(0);
      });

      logger.info('Float validation PASSED');
    });
  });

  describe('BET-002: Search returns empty array when no offers available', () => {
    it('should return HTTP 200 with empty offers array for no-match route', async () => {
      const correlationId = 'CORR_SEARCH_002';
      
      const searchRequest = {
        origin: IATA_CODES.YLW,
        destination: IATA_CODES.ZZZ, // Non-existent destination
        departure_date: '2026-12-25',
        passengers: [{ type: 'ADULT' }],
        cabin_class: 'ECONOMY'
      };

      logger.info('Executing search for no-match route', { correlationId });

      const response = await client.search(searchRequest, { correlationId });

      // Assertion: HTTP 200 (not 404 or error)
      expect(response.status).toBe(200);

      // Assertion: Empty offers array
      expect(response.body.offers).toBeDefined();
      expect(Array.isArray(response.body.offers)).toBe(true);
      expect(response.body.offers.length).toBe(0);

      logger.info('Search test BET-002 PASSED');
    });

    it('should return empty array for past-date search', async () => {
      const searchRequest = SearchFixtures.pastDateSearch();
      const response = await client.search(searchRequest);

      expect(response.status).toBe(200);
      expect(response.body.offers).toEqual([]);

      logger.info('Past date search returned empty offers PASSED');
    });
  });

  describe('BET-003: Search with missing mandatory field returns HTTP 400 VALIDATION_ERROR', () => {
    it('should reject search missing origin field', async () => {
      const correlationId = 'CORR_SEARCH_003_ORIGIN';
      
      const invalidSearch = {
        // missing: origin
        destination: IATA_CODES.JFK,
        departure_date: '2026-10-15',
        passengers: [{ type: 'ADULT' }],
        cabin_class: 'ECONOMY'
      };

      logger.info('Executing search with missing origin', { correlationId });

      const response = await client.search(invalidSearch, { correlationId });

      // Assertion: HTTP 400
      expect(response.status).toBe(400);

      // Assertion: RFC 7807 problem+json format
      expect(response.body.error_code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(response.body.detail).toContain('origin');
      expect(response.body.correlation_id).toBe(correlationId);

      logger.info('Validation error BET-003 (missing origin) PASSED');
    });

    it('should reject search missing destination field', async () => {
      const invalidSearch = {
        origin: IATA_CODES.YVR,
        // missing: destination
        departure_date: '2026-10-15',
        passengers: [{ type: 'ADULT' }]
      };

      const response = await client.search(invalidSearch);

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(response.body.detail).toContain('destination');

      logger.info('Validation error (missing destination) PASSED');
    });

    it('should reject search missing departure_date field', async () => {
      const invalidSearch = {
        origin: IATA_CODES.YVR,
        destination: IATA_CODES.JFK,
        // missing: departure_date
        passengers: [{ type: 'ADULT' }]
      };

      const response = await client.search(invalidSearch);

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(response.body.detail).toContain('departure_date');

      logger.info('Validation error (missing departure_date) PASSED');
    });

    it('should reject search missing passengers field', async () => {
      const invalidSearch = {
        origin: IATA_CODES.YVR,
        destination: IATA_CODES.JFK,
        departure_date: '2026-10-15',
        // missing: passengers
        cabin_class: 'ECONOMY'
      };

      const response = await client.search(invalidSearch);

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(response.body.detail).toContain('passengers');

      logger.info('Validation error (missing passengers) PASSED');
    });

    it('should return 400 with identified missing field in detail', async () => {
      const invalidSearch = SearchFixtures.invalidSearch_NoOrigin();
      const response = await client.search(invalidSearch);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        type: expect.stringContaining('validation-error'),
        title: 'Validation Error',
        status: 400,
        error_code: ErrorCodes.VALIDATION_ERROR
      });
      expect(response.body.detail).toBeTruthy();

      logger.info('Validation error with RFC 7807 format PASSED');
    });
  });
});
