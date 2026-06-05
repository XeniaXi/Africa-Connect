import Link from 'next/link';
import { getBusiness } from '@/app/lib/api';
import styles from './page.module.css';

const VERIFICATION_LABELS: Record<number, string> = {
  0: 'Unverified',
  1: 'Phone Verified',
  2: 'Email Verified',
  3: 'Document Verified',
  4: 'Address Verified',
  5: 'Trusted Partner',
  6: 'ConnectAfrica Certified',
};

const VERIFICATION_DESCS: Record<number, string> = {
  0: 'This profile has not been verified yet.',
  1: 'Business phone number has been confirmed.',
  2: 'Business email address has been confirmed.',
  3: 'Business documents have been reviewed.',
  4: 'Physical address has been confirmed.',
  5: 'Trusted data partner — high confidence.',
  6: 'Fully certified by ConnectAfrica. Highest trust level.',
};

function getScoreColor(score: number): 'Green' | 'Amber' | 'Red' {
  if (score >= 70) return 'Green';
  if (score >= 40) return 'Amber';
  return 'Red';
}

function getVerNumberClass(level: number): string {
  if (level >= 6) return styles.verificationNumberCertified;
  if (level >= 5) return styles.verificationNumberTrusted;
  if (level >= 1) return styles.verificationNumberMid;
  return styles.verificationNumberLow;
}

interface BusinessPageProps {
  params: { slug: string };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const business = await getBusiness(params.slug);

  if (!business) {
    return (
      <div className="container">
        <div className={styles.notFound}>
          <span className={styles.notFoundIcon}>🏢</span>
          <h1 className={styles.notFoundTitle}>Business Not Found</h1>
          <p className={styles.notFoundDesc}>
            We couldn&apos;t find a business with that ID. It may have been removed or the link is incorrect.
          </p>
          <Link href="/search" className={styles.backLink}>
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const verLabel = VERIFICATION_LABELS[business.verificationLevel] ?? 'Unverified';
  const verDesc = VERIFICATION_DESCS[business.verificationLevel] ?? '';
  const scoreColor = getScoreColor(business.trustScore);
  const verNumClass = getVerNumberClass(business.verificationLevel);

  // Sub-scores (derived placeholders)
  const googleVis = Math.round(Math.min(100, business.trustScore * 0.8));
  const metaVis = Math.round(Math.min(100, business.trustScore * 0.7));
  const caScore = business.verificationLevel * 16;
  const aiScore = business.trustScore;

  const subScores = [
    { name: 'Google Visibility', value: googleVis },
    { name: 'Meta Visibility', value: metaVis },
    { name: 'ConnectAfrica Score', value: caScore },
    { name: 'AI Discovery Score', value: aiScore },
  ];

  const overallClass = styles[`overallScore${scoreColor}` as keyof typeof styles];
  const pillClass = styles[`pill${scoreColor}` as keyof typeof styles];
  const pillLabel = scoreColor === 'Green' ? 'High' : scoreColor === 'Amber' ? 'Medium' : 'Low';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.topBar}>
        <div className="container">
          <nav className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/search">Search</Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>{business.displayName}</span>
          </nav>
        </div>
      </div>

      <div className={styles.content}>
        <div className="container">
          <div className={styles.layout}>
            {/* Left: Business Details */}
            <div>
              <div className={styles.mainCard}>
                <h1 className={styles.businessName}>{business.displayName}</h1>

                <div className={styles.metaRow}>
                  <span className={styles.categoryBadge}>{business.category}</span>
                  <span className={styles.location}>
                    📍 {business.city}{business.state ? `, ${business.state}` : ''}
                  </span>
                </div>

                <hr className={styles.divider} />

                {/* Verification */}
                <p className={styles.sectionLabel}>Verification Status</p>
                <div className={styles.verificationRow}>
                  <div className={`${styles.verificationNumber} ${verNumClass}`}>
                    {business.verificationLevel}
                  </div>
                  <div>
                    <div className={styles.verificationLabel}>{verLabel}</div>
                    <div className={styles.verificationDesc}>{verDesc}</div>
                  </div>
                </div>

                {/* Contact */}
                {(business.phone || business.email || business.website) && (
                  <>
                    <hr className={styles.divider} />
                    <p className={styles.sectionLabel}>Contact Information</p>
                    <div className={styles.contactList}>
                      {business.phone && (
                        <div className={styles.contactItem}>
                          <div className={styles.contactIcon}>📞</div>
                          <a href={`tel:${business.phone}`} className={styles.contactLink}>
                            {business.phone}
                          </a>
                        </div>
                      )}
                      {business.email && (
                        <div className={styles.contactItem}>
                          <div className={styles.contactIcon}>✉️</div>
                          <a href={`mailto:${business.email}`} className={styles.contactLink}>
                            {business.email}
                          </a>
                        </div>
                      )}
                      {business.website && (
                        <div className={styles.contactItem}>
                          <div className={styles.contactIcon}>🌐</div>
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.contactLink}
                          >
                            {business.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Services */}
                {business.services && business.services.length > 0 && (
                  <>
                    <hr className={styles.divider} />
                    <p className={styles.sectionLabel}>Services</p>
                    <div className={styles.servicesList}>
                      {business.services.map((s) => (
                        <span key={s} className={styles.serviceBadge}>{s}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Score Card + Claim */}
            <div className={styles.sidePanel}>
              {/* AI Visibility Score */}
              <div className={styles.scoreCard}>
                <p className={styles.scoreCardTitle}>AI Visibility Score</p>
                <div className={styles.overallScore}>
                  <div className={`${styles.overallScoreNumber} ${overallClass}`}>
                    {business.trustScore}
                  </div>
                  <div className={styles.overallScoreMeta}>
                    <span className={styles.overallScoreLabel}>Overall Score</span>
                    <span className={styles.overallScoreOutOf}>out of 100</span>
                    <span className={`${styles.overallScorePill} ${pillClass}`}>
                      {pillLabel} Visibility
                    </span>
                  </div>
                </div>

                <div className={styles.subScores}>
                  {subScores.map((sub) => {
                    const subColor = getScoreColor(sub.value);
                    const barClass = styles[`bar${subColor}` as keyof typeof styles];
                    const valClass = styles[`overallScore${subColor}` as keyof typeof styles];
                    return (
                      <div key={sub.name} className={styles.subScore}>
                        <div className={styles.subScoreRow}>
                          <span className={styles.subScoreName}>{sub.name}</span>
                          <span className={`${styles.subScoreVal} ${valClass}`}>{sub.value}</span>
                        </div>
                        <div className={styles.subScoreBarWrap}>
                          <div
                            className={`${styles.subScoreBar} ${barClass}`}
                            style={{ width: `${sub.value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.claimPrompt}>
                  <Link href={`/claim/${business.id}`}>
                    Claim this profile to improve your score →
                  </Link>
                </div>
              </div>

              {/* Claim Button — only if unclaimed */}
              {!business.claimedByUserId && (
                <Link href={`/claim/${business.id}`} className={styles.claimBtn}>
                  Claim This Business
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
