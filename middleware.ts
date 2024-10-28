import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminPath) {
    // Check for admin token in cookies
    const adminToken = request.cookies.get('admin_token');
    
    if (!adminToken || adminToken.value !== process.env.ADMIN_TOKEN) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
