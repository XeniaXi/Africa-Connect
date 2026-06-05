import Link from 'next/link';
import { getBusiness } from '../../lib/api';
import styles from './page.module.css';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: `Business ${params.id} — ConnectAfrica Admin` };
}

export const dynamic = 'force-dynamic';

function trustClass(score: number | undefined): string {
  if (score === undefined || score === null) return '';
  if (score >= 70) return styles.trustHigh;
  if (score >= 40) return styles.trustMid;
  return styles.trustLow;
}

function trustLabel(score: number | undefined): string {
  if (score === undefined || score === null) return '';
  if (score >= 70) return 'Trusted (≥70)';
  if (score >= 40) return 'Visible (≥40)';
  return 'Below threshold (<40)';
}

export default async function BusinessDetailPage({ params }: Props) {
  const business = await getBusiness(params.id);

  if (!business) {
    return (
      <div className={styles.page}>
        <Link href="/businesses" className={styles.backLink}>
          ← Back to Businesses
        </Link>
        <div className={styles.notFound}>
          Business not found or API unavailable.
        </div>
      </div>
    );
  }

  const loc = business.location ?? {};
  const ts = business.trustScore;

  return (
    <div className={styles.page}>
      <Link href="/businesses" className={styles.backLink}>
        ← Back to Businesses
      </Link>

      <h1 className={styles.heading}>{business.name ?? 'Unnamed Business'}</h1>
      <p className={styles.category}>
        {business.category ?? '—'} · {loc.city ?? business.city ?? '—'}
      </p>

      <div className={styles.grid}>
        {/* Core details */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Business Details</div>
          {[
            ['ID', business.id],
            ['Name', business.name],
            ['Category', business.category],
            ['Phone', business.phone],
            ['Email', business.email],
            ['Website', business.website],
            ['Status', business.status],
          ].map(([label, val]) => (
            <div key={String(label)} className={styles.fieldRow}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{val ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Trust score */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Trust Score</div>
          <div className={`${styles.trustScore} ${trustClass(ts)}`}>
            {ts != null ? ts : '—'}
            {ts != null && <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--gray-400)' }}>/100</span>}
          </div>
          <div className={styles.trustLabel}>{trustLabel(ts)}</div>

          <div style={{ marginTop: '1.25rem' }}>
            {[
              ['Verification Level', business.verificationLevel],
              ['Data Completeness', business.dataCompleteness],
              ['Review Score', business.reviewScore],
              ['Activity Score', business.activityScore],
              ['Partner Endorsements', business.partnerEndorsements],
              ['Claim Verified', business.claimVerified != null ? String(business.claimVerified) : undefined],
            ].map(([label, val]) => (
              <div key={String(label)} className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldValue}>{val ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Location</div>
          {[
            ['Address', loc.address ?? business.address],
            ['City', loc.city ?? business.city],
            ['State', loc.state ?? business.state],
            ['Country', loc.country ?? business.country],
            ['Lat / Lng', loc.lat != null ? `${loc.lat}, ${loc.lng}` : undefined],
          ].map(([label, val]) => (
            <div key={String(label)} className={styles.fieldRow}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{val ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Metadata</div>
          {[
            ['Created', business.createdAt ? new Date(business.createdAt).toLocaleString() : undefined],
            ['Updated', business.updatedAt ? new Date(business.updatedAt).toLocaleString() : undefined],
            ['Claimed', business.claimedAt ? new Date(business.claimedAt).toLocaleString() : undefined],
            ['Partner Source', business.partnerSourceId ?? business.source],
          ].map(([label, val]) => (
            <div key={String(label)} className={styles.fieldRow}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{val ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit placeholder */}
      <button className={styles.editBtn} disabled title="Edit form coming soon">
        Edit Business (coming soon)
      </button>
    </div>
  );
}
