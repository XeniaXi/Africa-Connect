export const metadata = {
  title: 'ConnectAfrica Admin',
  description: 'Internal admin console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
