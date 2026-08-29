import type { ErrorCode } from './errors';

export type ApiMeta = Readonly<{ requestId: string; version: 1 }>;

export type ApiSuccess<T> = Readonly<{ data: T; meta: ApiMeta }>;

export type ApiErrorBody = Readonly<{
  error: Readonly<{
    code: ErrorCode;
    message: string;
    retryable: boolean;
    requestId: string;
  }>;
}>;

export function successEnvelope<T>(data: T, requestId: string): ApiSuccess<T> {
  return { data, meta: { requestId, version: 1 } };
}

export function errorEnvelope(
  code: ErrorCode,
  message: string,
  retryable: boolean,
  requestId: string,
): ApiErrorBody {
  return { error: { code, message, retryable, requestId } };
}
