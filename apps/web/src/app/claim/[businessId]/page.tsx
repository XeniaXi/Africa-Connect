import { getBusiness } from '@/app/lib/api';
import ClaimForm from './ClaimForm';
import styles from './page.module.css';

interface ClaimPageProps {
  params: { businessId: string };
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const business = await getBusiness(params.businessId);
  const businessName = business?.displayName ?? 'this business';

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        <div className={styles.claimHeader}>
          <p className={styles.eyebrow}>Claim Portal</p>
          <h1 className={styles.title}>You are claiming:</h1>
          <p className={styles.subtitle}>
            <strong>{businessName}</strong>
          </p>
        </div>

        <ClaimForm businessId={params.businessId} businessName={businessName} />
      </div>
    </div>
  );
}
