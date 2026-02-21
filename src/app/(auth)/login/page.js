'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const contentType = res.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                await res.text();
                throw new Error(
                    res.ok ? 'Resposta inesperada do servidor' : `Erro ${res.status}: Servidor temporariamente indisponível.`
                );
            }

            if (!res.ok) {
                throw new Error(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
            }

            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.brandArea}>
                    <span className={styles.brandName}>My Study Planner</span>
                    <p className={styles.brandTagline}>Sua jornada de aprendizado começa aqui</p>
                </div>

                <h1 className={styles.title}>Bem-vindo!</h1>
                <p className={styles.subtitle}>Acesse sua conta para gerenciar seus planos</p>

                {error && <div className={styles.error}><span>⚠️</span> {error}</div>}

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        className="input-field"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Sua senha"
                        className="input-field"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                    />
                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar na Conta'}
                    </button>
                </form>

                <div className={styles.link}>
                    Ainda não tem conta? <Link href="/register">Cadastre-se gratuitamente</Link>
                </div>
            </div>
        </div>
    );
}
