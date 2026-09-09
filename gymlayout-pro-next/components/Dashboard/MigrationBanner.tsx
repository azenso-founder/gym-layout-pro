// ==========================================
// MigrationBanner — Detecta datos en localStorage y ofrece migrarlos
// Se muestra en el Dashboard solo si hay un draft guardado
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SAVE_KEY = 'gymlayout-pro-draft';

interface DraftData {
  machines: unknown[];
  zones: unknown[];
  floorRooms: unknown[];
  imageLayers: unknown[];
  customMeasures: unknown[];
  imgCalibrations: Record<string, unknown>;
  slpRelations: Record<string, unknown>;
  savedAt: number;
}

export default function MigrationBanner() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftData;
      // Verificar que tiene datos útiles
      if (parsed.machines?.length > 0 || parsed.floorRooms?.length > 0) {
        setDraft(parsed);
      }
    } catch {
      // No hay draft o no se puede leer
    }
  }, []);

  if (!draft || dismissed || migrated) return null;

  const machineCount = draft.machines?.length || 0;
  const roomCount = draft.floorRooms?.length || 0;
  const savedDate = draft.savedAt
    ? new Date(draft.savedAt).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'fecha desconocida';

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);

    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: 'FIREFIT Valdivia (migrado)',
          gymName: 'FIREFIT Valdivia',
          machines: draft.machines || [],
          zones: draft.zones || [],
          floorRooms: draft.floorRooms || [],
          imageLayers: draft.imageLayers || [],
          customMeasures: draft.customMeasures || [],
          imgCalibrations: draft.imgCalibrations || {},
          slpRelations: draft.slpRelations || {},
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al migrar');
      }

      const data = await res.json();
      setMigrated(true);

      // Limpiar localStorage después de migración exitosa
      localStorage.removeItem(SAVE_KEY);

      // Redirigir al proyecto migrado
      setTimeout(() => {
        router.push(`/project/${data.projectId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al migrar datos');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20">
      <div className="flex items-start gap-4">
        <span className="text-3xl">📦</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-300 mb-1">
            Datos encontrados en tu navegador
          </h3>
          <p className="text-xs text-zinc-400 mb-3">
            Encontramos un borrador guardado localmente del{' '}
            <span className="text-zinc-300">{savedDate}</span> con{' '}
            <span className="text-orange-400 font-medium">{machineCount} máquinas</span>
            {roomCount > 0 && (
              <>
                {' '}y{' '}
                <span className="text-orange-400 font-medium">{roomCount} salas trazadas</span>
              </>
            )}
            . ¿Quieres importarlo como tu proyecto en la nube?
          </p>

          {error && (
            <div className="mb-3 px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          {migrated ? (
            <div className="px-3 py-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
              ✅ Datos migrados exitosamente. Redirigiendo al proyecto...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="px-4 py-2 text-xs font-semibold text-white btn-gradient rounded-lg disabled:opacity-50"
              >
                {migrating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Migrando...
                  </span>
                ) : (
                  '🚀 Importar a mi cuenta'
                )}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Ignorar
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar el borrador local? Esta acción no se puede deshacer.')) {
                    localStorage.removeItem(SAVE_KEY);
                    setDraft(null);
                  }
                }}
                className="px-3 py-2 text-xs text-red-500/60 hover:text-red-400 transition-colors"
              >
                Eliminar borrador
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
