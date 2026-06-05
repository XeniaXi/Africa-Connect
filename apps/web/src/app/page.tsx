import Link from 'next/link';
import SearchForm from '@/components/SearchForm';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>AI Discovery Layer for Africa</div>
          <h1 className={styles.heroTitle}>Is Your Business Visible to AI?</h1>
          <p className={styles.heroSubtitle}>
            Claude, Gemini, and GPT are recommending businesses right now.
            Make sure yours is one of them.
          </p>
          <SearchForm />
          <div className={styles.trustBadges}>
            <span className={styles.trustBadge}>🔐 Verified Business Graph</span>
            <span className={styles.trustBadge}>🤖 AI-Ready Profiles</span>
            <span className={styles.trustBadge}>📊 Trust Score 0-100</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsRow}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>70+</div>
              <div className={styles.statLabel}>Businesses</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>6</div>
              <div className={styles.statLabel}>Cities</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>3</div>
              <div className={styles.statLabel}>Verification Levels</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>MCP</div>
              <div className={styles.statLabel}>MCP-Enabled</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>Three steps to AI discoverability</p>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>🔍</div>
              <h3 className={styles.stepTitle}>Search</h3>
              <p className={styles.stepDesc}>
                Find any African business by intent, category, or city. Our AI-powered
                search understands natural language queries.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>✅</div>
              <h3 className={styles.stepTitle}>Claim</h3>
              <p className={styles.stepDesc}>
                Verify your ownership via phone OTP, email, or document upload.
                Build your trust score and get verified.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>🤖</div>
              <h3 className={styles.stepTitle}>Get Discovered</h3>
              <p className={styles.stepDesc}>
                AI agents like Claude and Gemini recommend verified businesses.
                Your profile is served directly to AI tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className={styles.cta}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Are you a data partner?</h2>
          <p className={styles.ctaDesc}>
            Integrate your business data with ConnectAfrica via our Partner API.
            Works with SortAm, MediSeen, Klasng, and more.
          </p>
          <Link href="/partner" className={styles.ctaBtn}>
            Integrate via our Partner API →
          </Link>
        </div>
      </section>
    </>
  );
}
