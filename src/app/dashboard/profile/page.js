'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [originalUser, setOriginalUser] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    const router = useRouter();

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/profile');
                if (res.ok) {
                    const data = await res.json();
                    setOriginalUser(data);
                    setFormData(prev => ({ ...prev, name: data.name, email: data.email }));
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
                router.push('/login');
            }
        };
        fetchUser();
    }, [router]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('As novas senhas digitadas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            const body = {
                name: formData.name,
                email: formData.email
            };

            if (formData.newPassword) {
                if (!formData.currentPassword) {
                    setError('Informe sua senha atual para autorizar a alteração.');
                    setLoading(false);
                    return;
                }
                body.password = formData.currentPassword;
                body.newPassword = formData.newPassword;
            }

            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();

            if (res.ok) {
                showToast('Perfil atualizado com sucesso!');
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                setError(data.error || 'Não foi possível atualizar seus dados.');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado ao salvar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!originalUser) return (
        <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Carregando seus dados...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Meu Perfil</h1>
            </div>

            <div className={styles.formCard}>
                <form onSubmit={handleUpdate} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome Completo</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>E-mail</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <hr className={styles.divider} />

                    <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Alterar Senha</h3>
                    <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Deixe os campos abaixo vazios se não desejar alterar sua senha.
                    </p>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Senha Atual</label>
                        <input
                            type="password"
                            placeholder="Sua senha atual"
                            className="input-field"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Nova Senha</label>
                            <input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                className="input-field"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Confirmar Nova Senha</label>
                            <input
                                type="password"
                                placeholder="Repita a nova senha"
                                className="input-field"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.errorBox}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? 'Salvando alterações...' : 'Confirmar e Salvar'}
                    </button>
                </form>
            </div>

            {toast.show && (
                <div className={styles.successToast}>
                    <span className={styles.toastIcon}>✅</span>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}
