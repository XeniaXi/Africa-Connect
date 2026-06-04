export const metadata = {
  title: 'ConnectAfrica — Make Your Business Discoverable by AI',
  description: 'The AI discovery, trust and transaction layer for African businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
