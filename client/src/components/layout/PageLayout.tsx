import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function PageLayout({ children, hideFooter = false }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
