'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas digitadas não coincidem');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Não foi possível realizar o cadastro agora.');
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

                <h1 className={styles.title}>Crie sua conta</h1>
                <p className={styles.subtitle}>Junte-se a milhares de estudantes resilientes</p>

                {error && <div className={styles.error}><span>⚠️</span> {error}</div>}

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    <input
                        type="text"
                        placeholder="Nome Completo"
                        className="input-field"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={loading}
                    />
                    <input
                        type="email"
                        placeholder="Seu melhor e-mail"
                        className="input-field"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Crie uma senha forte"
                        className="input-field"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Confirme sua senha"
                        className="input-field"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={loading}
                    />
                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Criando sua conta...' : 'Cadastrar agora'}
                    </button>
                </form>

                <div className={styles.link}>
                    Já tem uma conta? <Link href="/login">Entre aqui</Link>
                </div>
            </div>
        </div>
    );
}
