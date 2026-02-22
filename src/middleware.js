import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
    const isPublicPage = request.nextUrl.pathname === '/';
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    if (!token) {
        if (!isAuthPage && !isPublicPage) {
            console.warn('[MIDDLEWARE] Acesso negado: URL', request.url, '- Token inexistente nos cookies da requisição.');
            if (isApiRoute) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', baseUrl));
        }
    } else {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error('[MIDDLEWARE CRITICAL] JWT_SECRET não configurado e lido no contexto (Edge Runtime). Token JWT não pode ser verificado!');
                // Se o segredo sumir, por segurança deslogamos todos
                if (isApiRoute) {
                    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                    response.cookies.delete('token');
                    return response;
                }
                const response = NextResponse.redirect(new URL('/login', baseUrl));
                response.cookies.delete('token');
                return response;
            }

            const secret = new TextEncoder().encode(jwtSecret);
            const { payload } = await jwtVerify(token, secret);

            // Pass user ID to headers for API routes
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', payload.userId);

            if (isAuthPage) {
                return NextResponse.redirect(new URL('/dashboard', baseUrl));
            }

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (err) {
            // Token inválido ou expirado
            console.error('[MIDDLEWARE ERROR] jwtVerify falhou ao tentar ler token válido:', err.message);

            if (!isAuthPage && !isPublicPage) {
                if (isApiRoute) {
                    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                    response.cookies.delete('token');
                    return response;
                }
                const response = NextResponse.redirect(new URL('/login', baseUrl));
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
