import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { ClientRootProvider } from './client-root-provider';
export const dynamic = 'force-dynamic';
import { Inter } from 'next/font/google';
import { FloatingCommerceButton } from './components/floating-commerce-button';

const inter = Inter({
  subsets: ['latin'],
});

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
      {/* <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        /> */}
        <style>{`
          [data-theme-toggle], 
          button[aria-label*="theme"], 
          button[aria-label*="Theme"],
          .fumadocs-theme-toggle {
            display: none !important;
          }
          
          .fd-nav-container,
          nav[data-nav],
          header nav {
            max-width: 80rem !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        `}</style>
      </head>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <ClientRootProvider>
          {children}
        </ClientRootProvider>
      </body>
    </html>
  );
}
