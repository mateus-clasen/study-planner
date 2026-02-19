import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          Domine qualquer assunto com <span>Planejamento Inteligente</span>
        </h1>
        <p className={styles.subtitle}>
          Nossa IA cria cronogramas personalizados em segundos, adaptados aos seus objetivos e prazos. Estude de forma organizada e alcance resultados mais rápidos.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/register" className="btn-primary" style={{ width: 'auto', minWidth: '200px' }}>
            Começar Gratuitamente
          </Link>
          <Link href="/login" className={styles.secondaryCta}>
            Já tenho uma conta
          </Link>
        </div>
      </header>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📚</span>
          <h3 className={styles.featureTitle}>Roteiros Personalizados</h3>
          <p className={styles.featureText}>
            Não importa se é um concurso, vestibular ou um novo hobby. A IA cria o caminho exato para você.
          </p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>⚡</span>
          <h3 className={styles.featureTitle}>Agilidade com IA</h3>
          <p className={styles.featureText}>
            Economize horas de organização. Receba um plano detalhado com tópicos, intervalos e dicas de estudo.
          </p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📱</span>
          <h3 className={styles.featureTitle}>Dashboard Intuitivo</h3>
          <p className={styles.featureText}>
            Gerencie todos os seus estudos em um só lugar, com um visual limpo e focado no que importa.
          </p>
        </div>
      </section>

      <footer style={{ marginTop: '5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        © {new Date().getFullYear()} My Study Planner. Transformando dedicação em resultados.
      </footer>
    </div>
  );
}
