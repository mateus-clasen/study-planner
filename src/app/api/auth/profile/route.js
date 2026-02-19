import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { name, email, password, newPassword } = await req.json();

        // 1. Busca usuário e valida existência
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const updateData = {};

        // 2. Validação de Nome
        if (name) {
            if (name.trim().length < 2) {
                return NextResponse.json({ error: 'Nome muito curto' }, { status: 400 });
            }
            updateData.name = name.trim();
        }

        // 3. Validação de E-mail
        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json({ error: 'Formato de e-mail inválido' }, { status: 400 });
            }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'Este e-mail já está sendo usado por outro usuário' }, { status: 400 });
            }
            updateData.email = email;
        }

        // 4. Troca de Senha Segura
        if (newPassword) {
            if (!password) {
                return NextResponse.json({ error: 'Informe sua senha atual para autorizar a mudança' }, { status: 400 });
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
        }

        return NextResponse.json({ message: 'Seu perfil foi atualizado com sucesso' });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao atualizar seu perfil' }, { status: 500 });
    }
}
