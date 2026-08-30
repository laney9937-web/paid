import { NextResponse } from 'next/server';
import { assertAppPath } from './app-path';

/** 303 to a same-app path. Rejects absolute/protocol-relative locations. */
export function redirectToAppPath(request: Request, path: string, status = 303): NextResponse {
  return NextResponse.redirect(new URL(assertAppPath(path), request.url), status);
}
