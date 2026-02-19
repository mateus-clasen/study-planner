import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(req) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const { subject, goal, deadlineDays } = await req.json();

        if (!subject || !goal || !deadlineDays) {
            return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
        }

        const deadline = Number(deadlineDays);
        if (isNaN(deadline) || deadline <= 0) {
            return NextResponse.json({ error: 'Prazo inválido.' }, { status: 400 });
        }

        const n8nUrl = process.env.N8N_WEBHOOK_URL;
        if (!n8nUrl) {
            return NextResponse.json(
                { error: 'Serviço de IA indisponível. Contate o suporte.' },
                { status: 503 }
            );
        }

        let content;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120_000);

            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, goal, deadline, userId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const rawText = await response.text();
            console.log('[N8N] Status:', response.status);
            console.log('[N8N] Body:', rawText.slice(0, 500));

            if (!response.ok) {
                throw new Error(`N8N retornou status ${response.status}: ${rawText.slice(0, 100)}`);
            }

            if (!rawText || rawText.trim() === '') {
                throw new Error('N8N retornou resposta vazia. Verifique se o workflow está ATIVO no painel do N8N (toggle "Active").');
            }

            let data;
            try {
                data = JSON.parse(rawText);
            } catch {
                throw new Error(`Resposta inválida do N8N: ${rawText.slice(0, 100)}`);
            }

            // Normaliza os diferentes formatos que o N8N pode retornar:
            // 1. AI Agent com Structured Output Parser: { output: { subjects: [...] } }
            // 2. AI Agent direto:                       { subjects: [...] }
            // 3. Array direto:                           [{ subjects: [...] }]  (N8N array wrapper)
            // 4. Wrapped em output string:               { output: "{ \"subjects\": [...] }" }
            let normalized = null;

            // Caso: array wrapper do N8N (retorna [{ output: { subjects: [] } }])
            const item = Array.isArray(data) ? data[0] : data;

            if (item?.output?.subjects) {
                normalized = { subjects: item.output.subjects };
            } else if (item?.subjects) {
                normalized = { subjects: item.subjects };
            } else if (item?.output && typeof item.output === 'string') {
                // output pode ser string JSON
                try {
                    const parsed = JSON.parse(item.output);
                    normalized = parsed.subjects ? { subjects: parsed.subjects } : parsed;
                } catch {
                    normalized = { subjects: [] };
                }
            } else if (Array.isArray(item)) {
                // já é array de subjects
                normalized = { subjects: item };
            }

            if (!normalized || !normalized.subjects || normalized.subjects.length === 0) {
                console.error('[N8N] Não foi possível normalizar a resposta:', JSON.stringify(data).slice(0, 300));
                throw new Error('A IA retornou uma resposta em formato inesperado.');
            }

            console.log('[N8N] Normalizado:', JSON.stringify(normalized).slice(0, 300));
            content = JSON.stringify(normalized);

        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'A IA demorou demais para responder (> 2 min). Tente novamente.' },
                    { status: 504 }
                );
            }
            console.error('[N8N] Erro:', fetchError.message);
            return NextResponse.json(
                {
                    error: fetchError.message.startsWith('N8N') || fetchError.message.startsWith('A IA')
                        ? fetchError.message
                        : 'Erro ao contactar o serviço de IA. Tente novamente.'
                },
                { status: 502 }
            );
        }

        const plan = await prisma.studyPlan.create({
            data: {
                userId,
                subject,
                goal,
                deadline: formatDeadlineLabel(deadline),
                content
            }
        });

        return NextResponse.json(plan, { status: 201 });

    } catch (error) {
        console.error('[Generate] Erro interno:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}

function formatDeadlineLabel(days) {
    if (days <= 7) return `${days} dias`;
    if (days <= 14) return '2 semanas';
    if (days <= 21) return '3 semanas';
    if (days <= 31) return '1 mês';
    if (days <= 62) return '2 meses';
    if (days <= 93) return '3 meses';
    if (days <= 186) return '6 meses';
    return `${days} dias`;
}
