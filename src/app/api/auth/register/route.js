import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req) {
    try {
        const { name, email, password } = await req.json();

        // 1. Validação básica de presença
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }

        // 2. Validação de formato de e-mail simplificada
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Formato de e-mail inválido' }, { status: 400 });
        }

        // 3. Validação de tamanho de senha
        if (password.length < 6) {
            return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // 4. JWT Secret Obrigatório
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('CRITICAL: JWT_SECRET not configured in environment variables');
            return NextResponse.json({ error: 'Erro de configuração no servidor' }, { status: 500 });
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const token = await new SignJWT({ userId: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        const response = NextResponse.json({ message: 'Conta criada com sucesso', userId: user.id }, { status: 201 });

        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao processar seu cadastro' }, { status: 500 });
    }
}
