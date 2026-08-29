export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'LINK_INACTIVE',
  'LINK_RESERVED',
  'LINK_USED',
  'COMPLIANCE_REVIEW',
  'JURISDICTION_BLOCKED',
  'LIMIT_EXCEEDED',
  'STEP_UP_REQUIRED',
  'IDEMPOTENCY_CONFLICT',
  'PROVIDER_UNAVAILABLE',
  'PAYMENT_PENDING',
  'PAYMENT_UNKNOWN',
  'STATE_CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const RETRYABLE: ReadonlySet<ErrorCode> = new Set([
  'LINK_RESERVED',
  'PROVIDER_UNAVAILABLE',
  'PAYMENT_PENDING',
  'PAYMENT_UNKNOWN',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  LINK_INACTIVE: 409,
  LINK_RESERVED: 409,
  LINK_USED: 409,
  COMPLIANCE_REVIEW: 403,
  JURISDICTION_BLOCKED: 403,
  LIMIT_EXCEEDED: 403,
  STEP_UP_REQUIRED: 401,
  IDEMPOTENCY_CONFLICT: 409,
  PROVIDER_UNAVAILABLE: 503,
  PAYMENT_PENDING: 409,
  PAYMENT_UNKNOWN: 409,
  STATE_CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly httpStatus: number;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      retryable?: boolean;
      httpStatus?: number;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.retryable = options?.retryable ?? RETRYABLE.has(code);
    this.httpStatus = options?.httpStatus ?? HTTP_STATUS[code];
    this.details = options?.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
