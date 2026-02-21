'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

const DEADLINE_OPTIONS = [
    { label: '1 semana', days: 7 },
    { label: '2 semanas', days: 14 },
    { label: '3 semanas', days: 21 },
    { label: '1 mês', days: 30 },
    { label: '2 meses', days: 60 },
    { label: '3 meses', days: 90 },
    { label: '6 meses', days: 180 },
    { label: 'Personalizado...', days: 'custom' },
];

export default function NewPlanPage() {
    const [subject, setSubject] = useState('');
    const [goal, setGoal] = useState('');
    const [selectedOption, setSelectedOption] = useState(30);
    const [customDays, setCustomDays] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const isCustom = selectedOption === 'custom';
    const deadlineDays = isCustom ? Number(customDays) : Number(selectedOption);

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        setError('');

        if (isCustom && (!customDays || Number(customDays) <= 0)) {
            setError('Por favor, informe um número de dias válido.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/study-plans/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, goal, deadlineDays })
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();

            if (res.ok) {
                router.push('/dashboard');
            } else {
                setError(data.error || 'Não foi possível gerar seu plano agora. Verifique sua conexão ou tente novamente mais tarde.');
            }
        } catch (err) {
            setError('O serviço de IA está demorando mais que o esperado. Verifique o painel do N8N ou tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Novo Planejamento</h1>
            </div>

            <div className={styles.formCard}>
                <form onSubmit={handleCreatePlan} className={styles.form}>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>O que você deseja aprender?</label>
                        <input
                            type="text"
                            placeholder="Ex: Desenvolvimento Web com React, Inglês para Viagens..."
                            className="input-field"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Qual seu objetivo com esse estudo?</label>
                        <input
                            type="text"
                            placeholder="Ex: Conseguir um emprego, Passar em uma prova..."
                            className="input-field"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Qual o prazo que você tem?</label>
                        <select
                            className="input-field"
                            value={selectedOption}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedOption(val === 'custom' ? 'custom' : Number(val));
                                if (val !== 'custom') setCustomDays('');
                            }}
                            disabled={loading}
                            required
                        >
                            {DEADLINE_OPTIONS.map((opt) => (
                                <option key={opt.days} value={opt.days}>
                                    {opt.label}{opt.days !== 'custom' ? ` (${opt.days} dias)` : ''}
                                </option>
                            ))}
                        </select>

                        {isCustom && (
                            <div className={styles.customDaysWrapper}>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    placeholder="Nº de dias"
                                    className="input-field"
                                    style={{ maxWidth: '140px', marginBottom: 0 }}
                                    value={customDays}
                                    onChange={(e) => setCustomDays(e.target.value)}
                                    disabled={loading}
                                    required
                                    autoFocus
                                />
                                {customDays && <span className={styles.customDaysHint}>📅 {Number(customDays)} dias de estudo</span>}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className={styles.errorBox}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', padding: '1rem' }}
                    >
                        {loading ? (
                            <span className={styles.loadingText}>
                                <span className={styles.spinner} style={{ width: '18px', height: '18px' }}></span>
                                Nossa IA está traçando seu roteiro...
                            </span>
                        ) : (
                            '🚀 Gerar Planejamento Inteligente'
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}
