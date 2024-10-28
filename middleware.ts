import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add basic middleware to protect admin routes
export function middleware(request: NextRequest) {
  // You should implement proper authentication here
  // This is just a basic example
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminPath) {
    // Check for authentication
    const hasAuth = request.headers.get('authorization');
    
    if (!hasAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
