import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coy | Discover Campus Crushes',
  description: 'Swipe, match, and connect on Coy. Never reveal who liked you unless it is mutual.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070709] text-zinc-100 flex justify-center antialiased">
        {children}
      </body>
    </html>
  );
}
