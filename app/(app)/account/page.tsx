// ==========================================
// Account Page — Perfil + plan + billing
// ==========================================

'use client';

import { useState } from 'react';
import { useProfile } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';

export default function AccountPage() {
  const { profile, loading, refetch } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Inicializar displayName cuando carga el perfil
  if (profile && !initialized) {
    setDisplayName(profile.displayName);
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!displayName.trim() || !profile) return;
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id);

    setSaving(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 skeleton rounded" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Mi cuenta</h1>

      {/* Profile section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-500 cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-white btn-gradient rounded-lg disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Plan section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Plan actual</h2>
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                profile?.plan === 'pro'
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {profile?.plan === 'pro' ? 'Pro ✓' : 'Free'}
            </span>
            <p className="text-xs text-zinc-500 mt-2">
              {profile?.projectsCount || 0} proyecto{profile?.projectsCount !== 1 ? 's' : ''} creados
            </p>
          </div>
          {profile?.plan === 'free' && (
            <a
              href="/upgrade"
              className="px-4 py-2 text-xs font-medium text-white btn-gradient rounded-lg"
            >
              Upgrade a Pro ✨
            </a>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-zinc-900/50 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Zona de peligro</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Eliminar tu cuenta borrará permanentemente todos tus proyectos y datos.
        </p>
        <button className="px-4 py-2 text-xs font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
          Eliminar cuenta
        </button>
      </div>
    </div>
  );
}
