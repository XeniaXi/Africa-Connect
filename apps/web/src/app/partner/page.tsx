import styles from './page.module.css';

export const metadata = {
  title: 'Partner Integration — ConnectAfrica',
  description: 'Integrate your SaaS platform with ConnectAfrica via our Partner API.',
};

export default function PartnerPage() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>Data Partners</div>
          <h1 className={styles.title}>Partner Integration</h1>
          <p className={styles.subtitle}>
            Are you a SaaS platform like SortAm, MediSeen, or Klasng? Integrate your
            business data with ConnectAfrica via our Partner API and make your listings
            discoverable by AI agents worldwide.
          </p>
        </div>
      </section>

      {/* Integration Options */}
      <section className={styles.cardsSection}>
        <div className="container">
          <h2 className={styles.sectionLabel}>Integration Options</h2>
          <p className={styles.sectionSub}>
            Three ways to get your data into the ConnectAfrica graph
          </p>
          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🔌</div>
              <h3 className={styles.cardTitle}>REST API</h3>
              <span className={styles.cardEndpoint}>POST /v1/partner/businesses</span>
              <p className={styles.cardDesc}>
                Push individual business records in real-time. Supports upserts by
                externalId so you can keep your data in sync without duplicates.
                Authenticated via API key header.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>📦</div>
              <h3 className={styles.cardTitle}>Batch Import</h3>
              <span className={styles.cardEndpoint}>POST /v1/partner/businesses/batch</span>
              <p className={styles.cardDesc}>
                Import up to 500 records per call. Ideal for initial data migration
                or nightly sync jobs. Returns a job ID for async status tracking.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>🔔</div>
              <h3 className={styles.cardTitle}>
                Webhooks
                <span className={styles.comingSoonTag}>Soon</span>
              </h3>
              <span className={styles.cardEndpoint}>Coming Soon</span>
              <p className={styles.cardDesc}>
                Receive real-time events when a business is claimed, verified, or
                receives a lead. Subscribe to specific event types per partner source.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to integrate?</h2>
          <p className={styles.ctaDesc}>
            Email us to get your partner API key and onboarding documentation.
          </p>
          <a href="mailto:partner@connectafrica.io" className={styles.ctaEmail}>
            ✉️ partner@connectafrica.io
          </a>
        </div>
      </section>
    </>
  );
}
