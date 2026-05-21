import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isPublic = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (token && isPublic) {
    return NextResponse.redirect(new URL('/kanban', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico|public).*)'] };
