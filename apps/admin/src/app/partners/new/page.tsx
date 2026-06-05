import Link from 'next/link';

export const metadata = {
  title: 'Add Partner — ConnectAfrica Admin',
};

export default function NewPartnerPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <Link
        href="/partners"
        style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', textDecoration: 'none' }}
      >
        ← Back to Partners
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add Partner</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '2rem' }}>
        Partner creation form coming soon. Partners are currently seeded via migrations or the NestJS admin API.
      </p>
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          padding: '2rem',
          color: 'var(--gray-600)',
          fontSize: '0.875rem',
        }}
      >
        Placeholder — form not yet implemented.
      </div>
    </div>
  );
}
