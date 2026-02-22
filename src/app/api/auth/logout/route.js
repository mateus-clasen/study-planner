import { NextResponse } from 'next/server';

export async function GET(req) {
    const envBaseUrl = process.env.APP_URL;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = envBaseUrl ? envBaseUrl : `${protocol}://${host}`;

    const response = NextResponse.redirect(new URL('/', baseUrl));
    response.cookies.delete('token');

    return response;
}
