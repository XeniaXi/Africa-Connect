import { getPendingClaims } from '../lib/api';
import ClaimActions from './ClaimActions';
import styles from './page.module.css';

export const metadata = {
  title: 'Claims — ConnectAfrica Admin',
};

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function ClaimsPage() {
  const claims = await getPendingClaims();

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Pending Claims</h1>
      <p className={styles.subheading}>
        Business ownership claims awaiting review
      </p>

      {claims.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>No pending claims</div>
          <div className={styles.emptyText}>
            All claims have been reviewed, or the claims endpoint is not yet
            available on the connected API.
          </div>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Claimant</th>
                <th>Business</th>
                <th>Method</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim: any) => (
                <tr key={claim.id}>
                  <td>{claim.claimantName ?? claim.userId ?? '—'}</td>
                  <td>{claim.businessName ?? claim.businessId ?? '—'}</td>
                  <td>{claim.verificationMethod ?? '—'}</td>
                  <td>{formatDate(claim.createdAt ?? claim.submittedAt)}</td>
                  <td>
                    <ClaimActions claimId={claim.id} />
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
