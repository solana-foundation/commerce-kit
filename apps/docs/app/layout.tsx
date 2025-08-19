import '@/app/global.css';
import { ClientRootProvider } from './client-root-provider';
export const dynamic = 'force-dynamic';
import { Inter } from 'next/font/google';

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

      </head>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <ClientRootProvider>
          {children}
        </ClientRootProvider>
      </body>
    </html>
  );
}
