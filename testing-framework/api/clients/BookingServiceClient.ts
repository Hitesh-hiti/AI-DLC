/**
 * BookingServiceClient
 * 
 * Thin wrapper over Supertest for API automation.
 * Handles authentication, correlation ID propagation, and response parsing.
 */

import supertest, { SuperTest, Test } from 'supertest';
import { Logger } from '../../shared/logger/Logger';

export interface ClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  correlationId?: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}

export class BookingServiceClient {
  private request: SuperTest<Test>;
  private baseHeaders: Record<string, string>;
  private logger: Logger;

  constructor(config: ClientConfig) {
    this.request = supertest(config.baseURL);
    this.baseHeaders = config.headers || {};
    this.logger = new Logger('BookingServiceClient');
  }

  /**
   * Execute POST /v1/search
   */
  async search(
    payload: Record<string, any>,
    options?: RequestOptions
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateULID();
    const headers = this.buildHeaders(correlationId, options);

    this.logger.info('POST /v1/search', { correlationId, payload });

    const response = await this.request
      .post('/v1/search')
      .set(headers)
      .send(payload);

    this.logger.debug('Search response', {
      correlationId,
      status: response.status,
      body: response.body
    });

    return {
      status: response.status,
      body: response.body,
      headers: response.headers
    };
  }

  /**
   * Execute POST /v1/bookings (create booking hold)
   */
  async createBooking(
    payload: Record<string, any>,
    options?: RequestOptions
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateULID();
    const idempotencyKey = options?.idempotencyKey || this.generateULID();
    const headers = this.buildHeaders(correlationId, options, idempotencyKey);

    this.logger.info('POST /v1/bookings', { correlationId, idempotencyKey, payload });

    const response = await this.request
      .post('/v1/bookings')
      .set(headers)
      .send(payload);

    this.logger.debug('Create booking response', {
      correlationId,
      status: response.status,
      bookingId: response.body?.booking_id
    });

    return {
      status: response.status,
      body: response.body,
      headers: response.headers
    };
  }

  /**
   * Execute POST /v1/bookings/:id/confirm (confirm booking)
   */
  async confirmBooking(
    bookingId: string,
    payload: Record<string, any>,
    options?: RequestOptions
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateULID();
    const idempotencyKey = options?.idempotencyKey || this.generateULID();
    const headers = this.buildHeaders(correlationId, options, idempotencyKey);

    this.logger.info('POST /v1/bookings/:id/confirm', {
      correlationId,
      idempotencyKey,
      bookingId,
      payload
    });

    const response = await this.request
      .post(`/v1/bookings/${bookingId}/confirm`)
      .set(headers)
      .send(payload);

    this.logger.debug('Confirm booking response', {
      correlationId,
      status: response.status,
      newStatus: response.body?.status
    });

    return {
      status: response.status,
      body: response.body,
      headers: response.headers
    };
  }

  /**
   * Execute POST /v1/bookings/:id/cancel (cancel booking)
   */
  async cancelBooking(
    bookingId: string,
    options?: RequestOptions
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateULID();
    const idempotencyKey = options?.idempotencyKey || this.generateULID();
    const headers = this.buildHeaders(correlationId, options, idempotencyKey);

    this.logger.info('POST /v1/bookings/:id/cancel', {
      correlationId,
      idempotencyKey,
      bookingId
    });

    const response = await this.request
      .post(`/v1/bookings/${bookingId}/cancel`)
      .set(headers);

    return {
      status: response.status,
      body: response.body,
      headers: response.headers
    };
  }

  /**
   * Execute GET /v1/trips/:id (get trip details)
   */
  async getTrip(
    tripId: string,
    options?: RequestOptions
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateULID();
    const headers = this.buildHeaders(correlationId, options);

    this.logger.info('GET /v1/trips/:id', { correlationId, tripId });

    const response = await this.request
      .get(`/v1/trips/${tripId}`)
      .set(headers);

    return {
      status: response.status,
      body: response.body,
      headers: response.headers
    };
  }

  /**
   * Execute POST /v1/approvals/:id/decision (submit approval decision)
   */
  async submitApprovalDecision(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    options?: RequestOptions
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateULID();
    const idempotencyKey = options?.idempotencyKey || this.generateULID();
    const headers = this.buildHeaders(correlationId, options, idempotencyKey);

    const payload = { decision };

    this.logger.info('POST /v1/approvals/:id/decision', {
      correlationId,
      approvalId,
      decision
    });

    const response = await this.request
      .post(`/v1/approvals/${approvalId}/decision`)
      .set(headers)
      .send(payload);

    return {
      status: response.status,
      body: response.body,
      headers: response.headers
    };
  }

  /**
   * Build request headers with correlation ID, auth, and idempotency key
   */
  private buildHeaders(
    correlationId: string,
    options?: RequestOptions,
    idempotencyKey?: string
  ): Record<string, string> {
    const headers = {
      ...this.baseHeaders,
      'X-Correlation-ID': correlationId,
      'Content-Type': 'application/json'
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Generate a simple ULID-like ID for testing
   * Format: 01ARZ3NDEKTSV4RRFFQ69G5FAV (28 chars, base32)
   */
  private generateULID(): string {
    // Simplified ULID: timestamp + random suffix
    const timestamp = Date.now().toString(36).padStart(10, '0');
    const random = Math.random().toString(36).substring(2, 15).toUpperCase().padEnd(18, 'A');
    return (timestamp + random).substring(0, 26);
  }
}
