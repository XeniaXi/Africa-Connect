import styles from './page.module.css';

export const metadata = {
  title: 'Audit Log — ConnectAfrica Admin',
};

const MOCK_EVENTS = [
  {
    id: 'aud-001',
    actorType: 'USER',
    actorId: 'usr_admin_01',
    action: 'business.claim.approve',
    resource: 'Claim',
    resourceId: 'clm_abc123',
    timestamp: '2025-06-03T14:22:05Z',
  },
  {
    id: 'aud-002',
    actorType: 'AGENT',
    actorId: 'mcp_claude',
    action: 'business.view',
    resource: 'Business',
    resourceId: 'biz_sortam_001',
    timestamp: '2025-06-03T13:10:44Z',
  },
  {
    id: 'aud-003',
    actorType: 'SYSTEM',
    actorId: 'sync_worker',
    action: 'partner.sync.complete',
    resource: 'PartnerSource',
    resourceId: 'partner_sortam',
    timestamp: '2025-06-03T10:00:01Z',
  },
  {
    id: 'aud-004',
    actorType: 'USER',
    actorId: 'usr_admin_01',
    action: 'business.verification.level_up',
    resource: 'Business',
    resourceId: 'biz_mediseen_002',
    timestamp: '2025-06-02T09:45:30Z',
  },
];

function actorClass(actorType: string): string {
  if (actorType === 'USER') return styles.actorUser;
  if (actorType === 'AGENT') return styles.actorAgent;
  return styles.actorSystem;
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function AuditPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Audit Log</h1>

      <div className={styles.notice}>
        Audit log query API coming soon. All writes are recorded in the{' '}
        <code>audit_logs</code> table. The rows below are mock examples
        demonstrating the format.
      </div>

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Actor Type</th>
              <th>Actor ID</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Resource ID</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_EVENTS.map((evt) => (
              <tr key={evt.id}>
                <td>
                  <span className={`${styles.actorBadge} ${actorClass(evt.actorType)}`}>
                    {evt.actorType}
                  </span>
                </td>
                <td className={styles.resource}>{evt.actorId}</td>
                <td>
                  <span className={styles.action}>{evt.action}</span>
                </td>
                <td className={styles.resource}>{evt.resource}</td>
                <td>
                  <span className={styles.resourceId}>{evt.resourceId}</span>
                </td>
                <td className={styles.timestamp}>{formatTimestamp(evt.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
