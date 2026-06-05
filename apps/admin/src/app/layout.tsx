import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import './globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'ConnectAfrica Admin',
  description: 'Internal admin console',
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/claims', label: 'Claims', icon: '✓' },
  { href: '/businesses', label: 'Businesses', icon: '🏢' },
  { href: '/partners', label: 'Partners', icon: '🔗' },
  { href: '/audit', label: 'Audit Log', icon: '📋' },
];

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarTitle}>ConnectAfrica Admin</div>
        <div className={styles.sidebarSubtitle}>Internal Console</div>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarFooter}>v1.0.0-beta</div>
    </aside>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the pathname from the x-pathname header set by middleware,
  // or fall back to '/' for static rendering.
  const headersList = headers();
  const pathname = (headersList as any).get('x-pathname') ?? '/';

  return (
    <html lang="en">
      <body>
        <div className={styles.layout}>
          <Sidebar pathname={pathname} />
          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  );
}
