// ==========================================
// Layout Pro — Root Layout
// Providers: Supabase Auth, Zustand
// ==========================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/accessibility.css';
import '@/styles/responsive.css';
import { AuthProvider } from '@/components/Auth/AuthProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Layout Pro — Diseño de Layout Profesional para Empresas e Industria',
  description:
    'Herramienta profesional de diseño de layout industrial con método Guerchet, análisis SLP y simulación DES. Optimiza la distribución de tus instalaciones. Diseñado por FIREFIT Chile.',
  keywords: ['layout industrial', 'diseño planta', 'distribución espacios', 'Guerchet', 'SLP', 'simulación DES', 'FIREFIT', 'Layout Pro'],
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
