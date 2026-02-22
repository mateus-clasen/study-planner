'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/study-plans', {
                credentials: 'include'
            });
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            }
        } catch (error) {
            console.error('Failed to fetch plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Deseja realmente excluir este planejamento? Essa ação não pode ser desfeita.')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/study-plans/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (res.ok) {
                setPlans(plans.filter(plan => plan.id !== id));
                showToast('Plano excluído com sucesso!');
            } else {
                alert('Erro ao excluir plano');
            }
        } catch {
            alert('Não foi possível excluir o plano. Tente novamente.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Meus Planos de Estudo</h1>
                <Link href="/dashboard/new" className="btn-primary" style={{ width: 'auto' }}>
                    <span>✨</span> Criar Novo Plano
                </Link>
            </div>

            {loading ? (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Carregando seus planos de estudo...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📚</span>
                    <h2 className={styles.emptyTitle}>Sua jornada ainda não começou</h2>
                    <p className={styles.emptyDesc}>Crie seu primeiro planejamento agora e nossa IA ajudará você a dominar qualquer assunto de forma organizada.</p>
                    <Link href="/dashboard/new" className="btn-primary" style={{ width: 'auto' }}>
                        Começar Agora
                    </Link>
                </div>
            ) : (
                <div className={styles.planList}>
                    {plans.map((plan) => {
                        const parsed = parsePlanContent(plan.content);
                        const isExpanded = expandedId === plan.id;

                        return (
                            <div key={plan.id} className={styles.planCard}>
                                <div className={styles.planHeader}>
                                    <div className={styles.planSubjectInfo}>
                                        <h3 className={styles.planSubject}>{plan.subject}</h3>
                                        <div className={styles.planMeta}>
                                            <span className={styles.metaItem}>🎯 {plan.goal}</span>
                                            <span className={styles.dot}>·</span>
                                            <span className={styles.metaItem}>⏱ {plan.deadline}</span>
                                        </div>
                                    </div>
                                    <div className={styles.planActions}>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                                            className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                                        >
                                            {isExpanded ? 'Recolher' : 'Ver Detalhes'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan.id)}
                                            className={`${styles.actionBtn} ${styles.dangerBtn}`}
                                            disabled={deletingId === plan.id}
                                        >
                                            {deletingId === plan.id ? '...' : 'Excluir'}
                                        </button>
                                    </div>
                                </div>

                                {parsed.subjects.length > 0 && (
                                    <div className={styles.subjectsPreview}>
                                        {(isExpanded ? parsed.subjects : parsed.subjects.slice(0, 2)).map((s, i) => (
                                            <SubjectCard key={i} subject={s} index={i} />
                                        ))}
                                        {!isExpanded && parsed.subjects.length > 2 && (
                                            <button
                                                className={styles.showMoreBtn}
                                                onClick={() => setExpandedId(plan.id)}
                                            >
                                                Mostrar mais {parsed.subjects.length - 2} tópicos...
                                            </button>
                                        )}
                                    </div>
                                )}

                                <small className={styles.date}>
                                    Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                                </small>
                            </div>
                        );
                    })}
                </div>
            )}

            {toast.show && (
                <div className={styles.successToast}>
                    <span className={styles.toastIcon}>✅</span>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}

function SubjectCard({ subject, index }) {
    return (
        <div className={styles.subjectCard}>
            <div className={styles.subjectTitleArea}>
                <span className={styles.subjectTopic}>{index + 1}. {subject.topic}</span>
                {subject.interval && (
                    <span className={styles.subjectInterval}>{subject.interval}</span>
                )}
            </div>
            {subject.description && (
                <p className={styles.subjectDescription}>{subject.description}</p>
            )}
            {subject.tip && (
                <div className={styles.subjectTip}>
                    <span>💡</span>
                    <em>{subject.tip}</em>
                </div>
            )}
        </div>
    );
}

function parsePlanContent(content) {
    try {
        const data = JSON.parse(content);
        if (data.subjects && Array.isArray(data.subjects)) {
            return { subjects: data.subjects, error: false };
        }
        if (data.plano && Array.isArray(data.plano)) {
            const subjects = data.plano.map(item => ({
                topic: item.tema,
                interval: `Dia ${item.dia}`,
                description: Array.isArray(item.atividades) ? item.atividades.join(', ') : '',
                tip: ''
            }));
            return { subjects, error: false };
        }
        return { subjects: [], error: true };
    } catch {
        return { subjects: [], error: true };
    }
}
