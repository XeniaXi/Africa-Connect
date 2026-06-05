import Link from 'next/link';
import SearchForm from '@/components/SearchForm';
import BusinessCard from '@/components/BusinessCard';
import { searchBusinesses } from '@/app/lib/api';
import styles from './page.module.css';

interface SearchPageProps {
  searchParams: {
    intent?: string;
    category?: string;
    city?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { intent = '', category = '', city = '' } = searchParams;

  const businesses = await searchBusinesses({
    intent: intent || undefined,
    category: category || undefined,
    city: city || undefined,
    limit: 20,
  });

  const queryLabel = intent || category || 'All businesses';
  const cityLabel = city || 'all cities';

  return (
    <>
      <section className={styles.searchHeader}>
        <div className="container">
          <div className={styles.searchHeaderInner}>
            <nav className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Search</span>
            </nav>
            <h1 className={styles.searchTitle}>
              Results for <strong>{queryLabel}</strong>
              {city && (
                <>
                  {' '}in <strong>{cityLabel}</strong>
                </>
              )}
            </h1>
            <SearchForm
              defaultIntent={intent}
              defaultCategory={category}
              defaultCity={city}
            />
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className="container">
          {businesses.length > 0 ? (
            <>
              <p className={styles.resultsCount}>
                {businesses.length} business{businesses.length !== 1 ? 'es' : ''} found
              </p>
              <div className={styles.grid}>
                {businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h2 className={styles.emptyTitle}>No businesses found</h2>
              <p className={styles.emptyDesc}>
                Try a different search — adjust your intent, category, or city.
              </p>
              <Link href="/" className={styles.emptyLink}>
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
