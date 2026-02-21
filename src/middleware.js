import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
    const isPublicPage = request.nextUrl.pathname === '/';
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    if (!token) {
        if (!isAuthPage && !isPublicPage) {
            if (isApiRoute) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } else {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error('CRITICAL: JWT_SECRET not configured');
                // Se o segredo sumir, por segurança deslogamos todos
                if (isApiRoute) {
                    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                    response.cookies.delete('token');
                    return response;
                }
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('token');
                return response;
            }

            const secret = new TextEncoder().encode(jwtSecret);
            const { payload } = await jwtVerify(token, secret);

            // Pass user ID to headers for API routes
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', payload.userId);

            if (isAuthPage) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (err) {
            // Token inválido ou expirado
            if (!isAuthPage && !isPublicPage) {
                if (isApiRoute) {
                    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                    response.cookies.delete('token');
                    return response;
                }
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('token');
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/study-plans/:path*', '/login', '/register', '/api/auth/profile'],
};
