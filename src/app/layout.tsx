import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Git Control',
  description: 'Manage GitHub and GitLab secrets/variables',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Providers>
          <Sidebar />
          <div className="flex flex-col flex-1 h-screen overflow-hidden relative">
            <Header />
            <main className="flex-1 overflow-y-auto w-full relative">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] z-0 pointer-events-none" />
              <div className="relative z-10 size-full p-4 md:p-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
