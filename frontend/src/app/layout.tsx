import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { Footer } from '@/components/footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'VoltchainHub | Energia P2P Descentralizada',
  description:
    'Plataforma descentralizada de negociação de energia peer-to-peer construída na blockchain Polygon. Conecte produtores e consumidores de energia renovável com contratos inteligentes transparentes, tokenização de créditos energéticos via LUZ token e oráculos de preço em tempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-volt-dark-900 text-gray-100 font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main column: shared top bar + content + footer */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
              <TopBar />
              <main className="flex-1 min-w-0 p-6 md:p-8 pt-16 md:pt-6">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
