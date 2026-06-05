import Link from 'next/link';
import { getBusinesses } from '../lib/api';
import styles from './page.module.css';

export const metadata = {
  title: 'Businesses — ConnectAfrica Admin',
};

export const dynamic = 'force-dynamic';

function trustClass(score: number | undefined): string {
  if (score === undefined || score === null) return '';
  if (score >= 70) return styles.trustHigh;
  if (score >= 40) return styles.trustMid;
  return styles.trustLow;
}

function verificationBadge(level: number | undefined) {
  if (level === undefined || level === null) return <span className={`${styles.badge} ${styles.badgeGray}`}>—</span>;
  if (level >= 4) return <span className={`${styles.badge} ${styles.badgeGreen}`}>Level {level}</span>;
  if (level >= 2) return <span className={`${styles.badge} ${styles.badgeAmber}`}>Level {level}</span>;
  return <span className={`${styles.badge} ${styles.badgeGray}`}>Level {level}</span>;
}

function statusBadge(status: string | undefined) {
  if (!status) return <span className={`${styles.badge} ${styles.badgeGray}`}>—</span>;
  const isActive = status === 'ACTIVE' || status === 'active';
  return (
    <span className={`${styles.badge} ${isActive ? styles.badgeGreen : styles.badgeGray}`}>
      {status}
    </span>
  );
}

export default async function BusinessesPage() {
  const businesses = await getBusinesses(50);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Businesses</h1>
      <p className={styles.subheading}>
        {businesses.length > 0
          ? `${businesses.length} businesses loaded`
          : 'Connect to staging DB to see live data'}
      </p>

      {businesses.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No businesses found. Ensure the API is running and the database is seeded.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>City</th>
                <th>Trust Score</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b: any) => (
                <tr key={b.id}>
                  <td>{b.name ?? '—'}</td>
                  <td>{b.category ?? '—'}</td>
                  <td>{b.city ?? b.location?.city ?? '—'}</td>
                  <td>
                    <span className={`${styles.trustScore} ${trustClass(b.trustScore)}`}>
                      {b.trustScore != null ? b.trustScore : '—'}
                    </span>
                  </td>
                  <td>{verificationBadge(b.verificationLevel)}</td>
                  <td>{statusBadge(b.status)}</td>
                  <td>
                    <Link href={`/businesses/${b.id}`} className={styles.viewLink}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
