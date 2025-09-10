
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './app/auth/actions';

const protectedRoutes = ['/'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  if (isPublicRoute && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }
  
  if (isProtectedRoute && !session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
