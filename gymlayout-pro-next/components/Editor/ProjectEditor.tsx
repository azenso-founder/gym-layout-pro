// ==========================================
// ProjectEditor — Wrapper del editor existente
// Carga datos del proyecto desde la API, luego renderiza
// los componentes existentes (Layout, SLP, Simulation, etc.)
// ==========================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '@/stores/useStore';
import Toolbar from '@/components/UI/Toolbar';
import Sidebar from '@/components/UI/Sidebar';
import PropertiesPanel from '@/components/UI/PropertiesPanel';
import LayoutCanvas from '@/components/Layout/LayoutCanvas';
import SLPModule from '@/components/SLP/SLPModule';
import SimulationModule from '@/components/Simulation/SimulationModule';
import MetricsModule from '@/components/Simulation/MetricsModule';
import ExportModule from '@/components/Export/ExportModule';
import type { AppTab } from '@/types';

const MODULE_TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'slp', label: 'SLP', icon: '🔗' },
  { id: 'simulacion', label: 'Simulación', icon: '▶️' },
  { id: 'metricas', label: 'Métricas', icon: '📊' },
  { id: 'export', label: 'Exportar', icon: '📤' },
];

interface Props {
  projectId: string;
}

export default function ProjectEditor({ projectId }: Props) {
  const router = useRouter();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const activePlanta = useStore((s) => s.activePlanta);
  const setActivePlanta = useStore((s) => s.setActivePlanta);

  const [projectName, setProjectName] = useState('Cargando...');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [loadingProject, setLoadingProject] = useState(true);

  // Auto-save timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef = useRef<string>('');

  // Cargar proyecto desde la API
  const loadProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Error loading project');
      }

      const data = await res.json();
      setProjectName(data.project.name);

      // TODO: Cargar datos de pisos y configuraciones en el store
      // Por ahora el store sigue usando localStorage como fallback

      setLoadingProject(false);
    } catch (err) {
      console.error('Error loading project:', err);
      setLoadingProject(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Auto-save: guardar cada 30 segundos si hay cambios
  const saveProject = useCallback(async () => {
    const state = useStore.getState();
    const dataToSave = JSON.stringify({
      machines: state.machines,
      zones: state.zones,
      floorRooms: state.floorRooms,
      imageLayers: state.imageLayers,
      customMeasures: state.customMeasures,
      imgCalibrations: state.imgCalibrations,
      slpRelations: state.slpRelations,
    });

    // No guardar si no cambió
    if (dataToSave === lastSaveRef.current) return;

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalConfig: JSON.parse(dataToSave),
        }),
      });

      if (res.ok) {
        lastSaveRef.current = dataToSave;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  }, [projectId]);

  // Suscribirse a cambios del store para auto-save
  useEffect(() => {
    const unsub = useStore.subscribe(() => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(saveProject, 30_000); // 30s debounce
    });

    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveProject]);

  // Ctrl+S manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject]);

  if (loadingProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Cargando proyecto...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* ===== HEADER: Logo + Module Tabs + Save Status + Planta Selector ===== */}
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 shrink-0">
        {/* Back + Logo */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors mr-3"
          title="Volver al dashboard"
        >
          <span className="text-sm">←</span>
        </button>
        <div className="flex items-center gap-2 mr-6">
          <span className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            🏋️ GymLayout Pro
          </span>
          <span className="text-[10px] text-zinc-600 font-medium">FIREFIT</span>
        </div>

        {/* Project name */}
        <span className="text-xs text-zinc-400 mr-4 max-w-[200px] truncate" title={projectName}>
          {projectName}
        </span>

        {/* Save status */}
        <div className="flex items-center gap-1.5 mr-4">
          {saveStatus === 'saving' && (
            <span className="text-[10px] text-zinc-500 save-pulse">Guardando...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[10px] text-green-500">Guardado ✓</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-[10px] text-red-400">Error al guardar ✗</span>
          )}
        </div>

        {/* Module Tabs */}
        <nav className="flex items-center gap-0.5">
          {MODULE_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-600/15 text-orange-400 tab-active-glow'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-[11px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Planta selector */}
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-0.5">
          <button
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activePlanta === 'baja'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setActivePlanta('baja')}
          >
            <span className="text-[10px]">1</span>
            Planta Baja
            <span className="text-[10px] text-zinc-500">265m²</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activePlanta === 'alta'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setActivePlanta('alta')}
          >
            <span className="text-[10px]">2</span>
            Planta Alta
            <span className="text-[10px] text-zinc-500">285m²</span>
          </button>
        </div>
      </div>

      {/* ===== TOOLBAR (only in layout + simulation modes) ===== */}
      {(activeTab === 'layout' || activeTab === 'simulacion') && <Toolbar />}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar (only in layout mode) */}
        {activeTab === 'layout' && <Sidebar />}

        {/* Central area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeTab === 'layout' && <LayoutCanvas />}
          {activeTab === 'slp' && <SLPModule />}
          {activeTab === 'simulacion' && (
            <div className="flex flex-1 min-h-0">
              <div className="flex-1 min-w-0">
                <LayoutCanvas />
              </div>
              <div className="w-[420px] shrink-0 border-l border-zinc-800 overflow-y-auto bg-zinc-950">
                <SimulationModule />
              </div>
            </div>
          )}
          {activeTab === 'metricas' && <MetricsModule />}
          {activeTab === 'export' && <ExportModule />}
        </div>

        {/* Properties panel (only in layout mode) */}
        {activeTab === 'layout' && <PropertiesPanel />}
      </div>
    </div>
  );
}
