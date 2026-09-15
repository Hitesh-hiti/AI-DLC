import { API_CONFIG, RETRY_CONFIG, SECURITY_CONFIG,} from '../../utils/constants';

import type { ApiError, ApiResponse } from '../types/common';

export class ApiHttpError extends Error {
  readonly status: number;
  readonly apiError?: ApiError;

  constructor(
    status: number,
    message: string,
    apiError?: ApiError,
  ) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.apiError = apiError;
  }
}

export interface HttpClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  getToken?: () => string | null;
  fetchImpl?: typeof fetch;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getToken: () => string | null;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = (
      options.baseUrl ?? API_CONFIG.BASE_URL
    ).replace(/\/$/, '');

    this.timeoutMs =
      options.timeoutMs ?? API_CONFIG.TIMEOUT_MS;

    this.getToken =
      options.getToken ??
      (() => {
        if (typeof window === 'undefined') {
          return null;
        }

        return window.localStorage.getItem(
          SECURITY_CONFIG.AUTH_TOKEN_STORAGE_KEY,
        );
      });

    /**
     * IMPORTANT:
     * Native browser fetch must retain the Window context.
     *
     * Using:
     *   fetch
     *
     * can cause:
     *   TypeError: Failed to execute 'fetch' on 'Window':
     *   Illegal invocation
     *
     * Binding it to window prevents that problem.
     */
    this.fetchImpl =
      options.fetchImpl ??
      fetch.bind(window);
  }

  get<T>(
    path: string,
    query?: Record<string, unknown>,
    signal?: AbortSignal,
  ) {
    return this.request<T>(
      'GET',
      path,
      undefined,
      query,
      signal,
    );
  }

  post<T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ) {
    return this.request<T>(
      'POST',
      path,
      body,
      undefined,
      signal,
    );
  }

  put<T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ) {
    return this.request<T>(
      'PUT',
      path,
      body,
      undefined,
      signal,
    );
  }

  delete<T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ) {
    return this.request<T>(
      'DELETE',
      path,
      body,
      undefined,
      signal,
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = new URL(
      `${this.baseUrl}/${path.replace(/^\//, '')}`,
      window.location?.origin ?? 'http://localhost',
    );

    if (query) {
      Object.entries(query).forEach(
        ([key, value]) => {
          if (
            value === undefined ||
            value === null ||
            value === ''
          ) {
            return;
          }

          if (Array.isArray(value)) {
            value.forEach((item) => {
              url.searchParams.append(
                key,
                String(item),
              );
            });
          } else {
            url.searchParams.set(
              key,
              String(value),
            );
          }
        },
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] =
        'application/json';
    }

    const token = this.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const attempts =
      method === 'GET'
        ? API_CONFIG.RETRY_ATTEMPTS
        : 0;

    let lastError: unknown;

    for (
      let attempt = 0;
      attempt <= attempts;
      attempt += 1
    ) {
      const controller =
        new AbortController();

      const timeout = window.setTimeout(
        () => controller.abort(),
        this.timeoutMs,
      );

      const onAbort = () =>
        controller.abort();

      signal?.addEventListener(
        'abort',
        onAbort,
        { once: true },
      );

      try {
        const response =
          await this.fetchImpl(
            url.toString(),
            {
              method,
              headers,
              body:
                body === undefined
                  ? undefined
                  : JSON.stringify(body),
              signal: controller.signal,
            },
          );

        const text =
          await response.text();

        const payload = text
          ? this.parseJson(text)
          : undefined;

        if (!response.ok) {
          const apiError =
            this.extractApiError(
              payload,
              response.status,
            );

          throw new ApiHttpError(
            response.status,
            apiError.message,
            apiError,
          );
        }

        return this.unwrap<T>(
          payload,
        );
      } catch (error) {
        lastError = error;

        const retryable =
          this.isRetryable(error);

        if (
          !retryable ||
          attempt === attempts
        ) {
          throw error;
        }

        await this.sleep(
          this.backoff(attempt),
        );
      } finally {
        window.clearTimeout(timeout);

        signal?.removeEventListener(
          'abort',
          onAbort,
        );
      }
    }

    throw lastError;
  }

  private unwrap<T>(
    payload: unknown,
  ): T {
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload
    ) {
      const response =
        payload as ApiResponse<T>;

      if (!response.success) {
        throw new ApiHttpError(
          400,
          response.error?.message ??
            'API request failed',
          response.error,
        );
      }

      return response.data as T;
    }

    return payload as T;
  }

  private extractApiError(
    payload: unknown,
    status: number,
  ): ApiError {
    if (
      payload &&
      typeof payload === 'object'
    ) {
      const candidate = (
        'error' in payload
          ? payload.error
          : payload
      ) as Partial<ApiError>;

      if (
        candidate &&
        typeof candidate === 'object'
      ) {
        return {
          code: String(
            candidate.code ??
              `HTTP_${status}`,
          ),
          message: String(
            candidate.message ??
              `Request failed with status ${status}`,
          ),
          details: candidate.details,
          timestamp: String(
            candidate.timestamp ??
              new Date().toISOString(),
          ),
        };
      }
    }

    return {
      code: `HTTP_${status}`,
      message: `Request failed with status ${status}`,
      timestamp:
        new Date().toISOString(),
    };
  }

  private parseJson(
    text: string,
  ): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return {
        message: text,
      };
    }
  }

  private isRetryable(
    error: unknown,
  ): boolean {
    return (
      error instanceof TypeError ||
      (
        error instanceof ApiHttpError &&
        RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(
          error.status,
        )
      )
    );
  }

  private backoff(attempt: number): number {
  return Math.min(
    RETRY_CONFIG.RETRY_DELAY_MS *
      (RETRY_CONFIG.EXPONENTIAL_BACKOFF_BASE ** attempt),
    RETRY_CONFIG.MAX_RETRY_DELAY_MS
  );
}

  private sleep(
    ms: number,
  ) {
    return new Promise<void>(
      (resolve) =>
        setTimeout(resolve, ms),
    );
  }
}

export const httpClient =
  new HttpClient();