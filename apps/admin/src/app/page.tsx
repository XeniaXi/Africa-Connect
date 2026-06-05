import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Dashboard — ConnectAfrica Admin',
};

const stats = [
  {
    label: 'Businesses',
    value: '70+',
    note: 'Connect to staging DB for live count',
  },
  {
    label: 'Pending Claims',
    value: '—',
    note: 'Connect to staging DB for live count',
  },
  {
    label: 'Partner Sources',
    value: '—',
    note: 'Connect to staging DB for live count',
  },
  {
    label: 'Audit Events',
    value: '—',
    note: 'Connect to staging DB for live count',
  },
];

const quickActions = [
  { href: '/claims', label: 'Review Claims' },
  { href: '/businesses', label: 'Browse Businesses' },
  { href: '/partners', label: 'Manage Partners' },
  { href: '/audit', label: 'Audit Log', secondary: true },
];

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>
      <p className={styles.subheading}>
        ConnectAfrica internal admin console — v1.0.0-beta
      </p>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statNote}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsRow}>
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${styles.actionBtn} ${a.secondary ? styles.actionBtnSecondary : ''}`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* System Status */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>System Status</h2>
        <div className={styles.statusCard}>
          <div className={styles.statusItem}>
            <span className={`${styles.badge} ${styles.badgeGreen}`}>
              <span className={styles.dot} />
              API Connected
            </span>
          </div>
          <div className={styles.statusItem}>
            <span style={{ color: 'var(--gray-600)', fontSize: '0.8125rem' }}>
              Version:
            </span>
            <strong>v1.0.0-beta</strong>
          </div>
          <div className={styles.statusItem}>
            <span style={{ color: 'var(--gray-600)', fontSize: '0.8125rem' }}>
              API URL:
            </span>
            <code style={{ fontSize: '0.8125rem', color: 'var(--gray-900)' }}>
              {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
