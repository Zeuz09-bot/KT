/**
 * Keraunous Tech Store — API Envelope & Error Handling
 *
 * Implements strict response contracts and error codes from Blueprint §8.1.
 */

export const ERROR_HTTP_STATUS = {
  VALIDATION_FAILED: 422,
  CAPTCHA_FAILED: 403,
  RATE_LIMITED: 429,
  BLOCKED: 403,
  ORDERS_DISABLED: 503,
  OUT_OF_STOCK: 409,
  PRICE_CHANGED: 409,
  ITEM_UNAVAILABLE: 409,
  NOT_FOUND: 404,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  INVALID_TRANSITION: 409,
  INSUFFICIENT_STOCK: 409,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_HTTP_STATUS;

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  const errorObj: ApiError['error'] = { code, message };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return { ok: false, error: errorObj };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = ERROR_HTTP_STATUS[code];
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponse(): ApiError {
    return err(this.code, this.message, this.details);
  }
}
