import Link from 'next/link';
import type { Business } from '@/app/lib/api';
import styles from './BusinessCard.module.css';

const VERIFICATION_LABELS: Record<number, string> = {
  0: 'Unverified',
  1: 'Phone Verified',
  2: 'Email Verified',
  3: 'Document Verified',
  4: 'Address Verified',
  5: 'Trusted Partner',
  6: 'CA Certified',
};

function getScoreColor(score: number): 'Green' | 'Amber' | 'Red' {
  if (score >= 70) return 'Green';
  if (score >= 40) return 'Amber';
  return 'Red';
}

function getVerificationBadgeClass(level: number): string {
  if (level >= 6) return styles.verificationBadgeCertified;
  if (level >= 5) return styles.verificationBadgeTrusted;
  if (level >= 1) return styles.verificationBadgeVerified;
  return styles.verificationBadgeUnverified;
}

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const color = getScoreColor(business.trustScore);
  const barClass = styles[`scoreBar${color}` as keyof typeof styles];
  const valClass = styles[`scoreValue${color}` as keyof typeof styles];
  const verLabel = VERIFICATION_LABELS[business.verificationLevel] ?? 'Unverified';
  const verBadgeClass = getVerificationBadgeClass(business.verificationLevel);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{business.displayName}</h3>
        <span className={styles.categoryBadge}>{business.category}</span>
      </div>

      <div className={styles.location}>
        <span className={styles.locationIcon}>📍</span>
        {business.city}{business.state ? `, ${business.state}` : ''}
      </div>

      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>Trust Score</span>
        <div className={styles.scoreBarWrap}>
          <div
            className={`${styles.scoreBar} ${barClass}`}
            style={{ width: `${business.trustScore}%` }}
          />
        </div>
        <span className={`${styles.scoreValue} ${valClass}`}>{business.trustScore}</span>
      </div>

      <div className={styles.footer}>
        <span className={`${styles.verificationBadge} ${verBadgeClass}`}>
          ✓ {verLabel}
        </span>
        <Link href={`/business/${business.id}`} className={styles.viewLink}>
          View Profile →
        </Link>
      </div>
    </div>
  );
}
