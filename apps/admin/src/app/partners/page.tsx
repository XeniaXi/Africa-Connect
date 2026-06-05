import Link from 'next/link';
import { getPartners } from '../lib/api';
import styles from './page.module.css';

export const metadata = {
  title: 'Partners — ConnectAfrica Admin',
};

export const dynamic = 'force-dynamic';

// Placeholder data for demo when API is not available
const DEMO_PARTNERS = [
  {
    id: 'demo-1',
    name: 'SortAm',
    slug: 'sortam',
    trustWeight: 0.9,
    status: 'ACTIVE',
    lastSync: '2025-06-03T10:00:00Z',
    syncLogs: [
      { id: 's1', status: 'SUCCESS', businessCount: 142, createdAt: '2025-06-03T10:00:00Z' },
      { id: 's2', status: 'SUCCESS', businessCount: 138, createdAt: '2025-06-02T10:00:00Z' },
    ],
  },
  {
    id: 'demo-2',
    name: 'MediSeen',
    slug: 'mediseen',
    trustWeight: 0.85,
    status: 'ACTIVE',
    lastSync: '2025-06-01T08:30:00Z',
    syncLogs: [
      { id: 's3', status: 'SUCCESS', businessCount: 58, createdAt: '2025-06-01T08:30:00Z' },
    ],
  },
  {
    id: 'demo-3',
    name: 'CSV Upload',
    slug: 'csv-upload',
    trustWeight: 0.6,
    status: 'INACTIVE',
    lastSync: '2025-05-20T12:00:00Z',
    syncLogs: [],
  },
];

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default async function PartnersPage() {
  const livePartners = await getPartners();
  const isDemo = livePartners.length === 0;
  const partners = isDemo ? DEMO_PARTNERS : livePartners;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>Partner Sources</h1>
          <p className={styles.subheading}>
            Data contributors feeding the ConnectAfrica index
          </p>
        </div>
        <Link href="/partners/new" className={styles.addBtn}>
          + Add Partner
        </Link>
      </div>

      {isDemo && (
        <div className={styles.notice}>
          Showing demo data. Connect to staging DB / ensure the{' '}
          <code>/admin/partners</code> endpoint is available for live data.
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Trust Weight</th>
              <th>Status</th>
              <th>Last Sync</th>
              <th>Recent Sync Logs</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p: any) => {
              const isActive = p.status === 'ACTIVE' || p.status === 'active';
              const logs: any[] = Array.isArray(p.syncLogs) ? p.syncLogs.slice(0, 5) : [];
              return (
                <tr key={p.id}>
                  <td>{p.name ?? '—'}</td>
                  <td>
                    <code style={{ fontSize: '0.8125rem' }}>{p.slug ?? '—'}</code>
                  </td>
                  <td>{p.trustWeight != null ? p.trustWeight : '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${isActive ? styles.badgeGreen : styles.badgeGray}`}>
                      {p.status ?? '—'}
                    </span>
                  </td>
                  <td>{formatDate(p.lastSync ?? p.lastSyncAt)}</td>
                  <td>
                    {logs.length === 0 ? (
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.8125rem' }}>No logs</span>
                    ) : (
                      logs.map((log: any) => (
                        <div key={log.id} className={styles.syncLogs}>
                          {formatDate(log.createdAt)} —{' '}
                          <strong>{log.status}</strong>
                          {log.businessCount != null && ` (${log.businessCount} businesses)`}
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
