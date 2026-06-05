import './globals.css';
import Link from 'next/link';
import styles from './layout.module.css';

export const metadata = {
  title: 'ConnectAfrica — Make Your Business Discoverable by AI',
  description: 'The AI discovery, trust and transaction layer for African businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className={styles.header}>
          <div className={`container ${styles.headerInner}`}>
            <Link href="/" className={styles.logo}>
              ConnectAfrica
            </Link>
            <nav className={styles.nav}>
              <Link href="/search" className={styles.navLink}>Search</Link>
              <Link href="/partner" className={styles.navLink}>For Partners</Link>
              <Link href="/admin" className={styles.navLinkAdmin}>Admin</Link>
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          {children}
        </main>

        <footer className={styles.footer}>
          <div className="container">
            © 2026 ConnectAfrica. Making African businesses discoverable by AI.
          </div>
        </footer>
      </body>
    </html>
  );
}
