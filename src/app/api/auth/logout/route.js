import { NextResponse } from 'next/server';

export async function GET(req) {
    const response = NextResponse.redirect(new URL('/', req.url));

    response.cookies.delete('token');

    return response;
}
