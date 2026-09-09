// ==========================================
// Protected Layout — Layout para rutas autenticadas
// Incluye navbar superior con user menu
// ==========================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import LayoutProLogo from '@/components/UI/LayoutProLogo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // No mostrar navbar en el editor de proyecto (tiene su propia UI)
  const isEditor = pathname.startsWith('/project/');

  if (isEditor) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* ===== Top Navbar ===== */}
      <nav className="h-14 bg-zinc-900/80 border-b border-zinc-800 flex items-center px-6 shrink-0 glass">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-8">
          <LayoutProLogo size="sm" showText={true} showBadge={true} />
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {[
            { href: '/dashboard', label: 'Proyectos', icon: '📁' },
            { href: '/templates', label: 'Templates', icon: '📋' },
            { href: '/craft', label: 'CRAFT', icon: '🏭' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                pathname === link.href
                  ? 'bg-orange-600/15 text-orange-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              <span className="text-[11px]">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Plan badge */}
        {profile && (
          <div className="mr-4">
            {profile.plan === 'free' ? (
              <Link
                href="/upgrade"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:bg-orange-500/10 hover:text-orange-400 transition-colors"
              >
                Free • Upgrade ✨
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-orange-500/10 text-orange-400">
                Pro ✓
              </span>
            )}
          </div>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs font-bold text-white">
              {(profile?.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-xs text-zinc-400 max-w-[120px] truncate hidden sm:block">
              {profile?.displayName || user.email}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-zinc-800">
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {profile?.displayName}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
                <Link
                  href="/account"
                  className="block px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  ⚙️ Mi cuenta
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
