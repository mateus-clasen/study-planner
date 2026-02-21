import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Mensagem genérica para evitar enumeração de usuários
            return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('CRITICAL: JWT_SECRET not configured');
            return NextResponse.json({ error: 'Erro de configuração no servidor' }, { status: 500 });
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const token = await new SignJWT({ userId: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        const response = NextResponse.json({ message: 'Login realizado com sucesso' });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.REQUIRE_HTTPS === 'true',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao realizar o login' }, { status: 500 });
    }
}
