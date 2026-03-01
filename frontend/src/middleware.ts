import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-trusthire-key-changeme-in-prod'
);

// Define protected route patterns
const protectedRoutes = ['/dashboard'];
const hrRoutes = ['/dashboard/hr'];
const authRoutes = ['/login', '/register'];

export async function middleware(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const path = req.nextUrl.pathname;

    // Basic authentication routing
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthRoute = authRoutes.includes(path);

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isAuthRoute && token) {
        // Already authenticated, redirect away from login/register
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // RBAC checks for valid tokens
    if (token) {
        try {
            const { payload } = await jose.jwtVerify(token, JWT_SECRET);

            // Role Based Access Control logic -> HR Only Routes
            const isHrRoute = hrRoutes.some(route => path.startsWith(route));
            if (isHrRoute && payload.role !== 'HR_USER' && payload.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url)); // Access Denied
            }

        } catch (err) {
            // Invalid token, wipe cookie and force re-login
            const response = NextResponse.redirect(new URL('/login', req.url));
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

// Config matcher ensures middleware doesn't run on static assets
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
