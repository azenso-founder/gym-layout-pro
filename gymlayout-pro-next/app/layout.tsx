// ==========================================
// GymLayout Pro — Root Layout
// Providers: Supabase Auth, Zustand
// ==========================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/Auth/AuthProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GymLayout Pro — Diseño de Layout para Gimnasios',
  description:
    'Herramienta profesional de diseño de layout para gimnasios con método Guerchet, SLP y simulación DES. Diseñado por FIREFIT Chile.',
  keywords: ['gym layout', 'diseño gimnasio', 'Guerchet', 'SLP', 'simulación DES', 'FIREFIT'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
