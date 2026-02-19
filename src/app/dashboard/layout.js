'use client';

import styles from './dashboard.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="24" rx="6" fill="url(#brand-grad)" />
                            <path d="M17 7H7V17H17V7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 14H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="brand-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#4f46e5" />
                                    <stop offset="1" stopColor="#7c3aed" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className={styles.brandText}>My Study Planner</span>
                </div>

                <nav className={styles.nav}>
                    <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.activeNavLink : ''}`}>
                        <span className={styles.navIcon}>📋</span>
                        <span className={styles.navLabel}>Meus Planos</span>
                    </Link>
                    <Link href="/dashboard/new" className={`${styles.navLink} ${isActive('/dashboard/new') ? styles.activeNavLink : ''}`}>
                        <span className={styles.navIcon}>✨</span>
                        <span className={styles.navLabel}>Novo Planejamento</span>
                    </Link>
                    <Link href="/dashboard/profile" className={`${styles.navLink} ${isActive('/dashboard/profile') ? styles.activeNavLink : ''}`}>
                        <span className={styles.navIcon}>👤</span>
                        <span className={styles.navLabel}>Perfil</span>
                    </Link>

                    <Link href="/api/auth/logout" className={`${styles.navLink} ${styles.logoutLink}`}>
                        <span className={styles.navIcon}>🚪</span>
                        <span className={styles.navLabel}>Sair</span>
                    </Link>
                </nav>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
