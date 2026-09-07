// ==========================================
// GymLayout Pro — App principal
// FIREFIT CHILE — Diseño de layout de gimnasio
// ==========================================

import useStore from './stores/useStore';
import Toolbar from './components/UI/Toolbar';
import Sidebar from './components/UI/Sidebar';
import PropertiesPanel from './components/UI/PropertiesPanel';
import LayoutCanvas from './components/Layout/LayoutCanvas';
import SLPModule from './components/SLP/SLPModule';
import SimulationModule from './components/Simulation/SimulationModule';
import MetricsModule from './components/Simulation/MetricsModule';
import ExportModule from './components/Export/ExportModule';
import type { AppTab } from './types';

const MODULE_TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'slp', label: 'SLP', icon: '🔗' },
  { id: 'simulacion', label: 'Simulación', icon: '▶️' },
  { id: 'metricas', label: 'Métricas', icon: '📊' },
  { id: 'export', label: 'Exportar', icon: '📤' },
];

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const activePlanta = useStore((s) => s.activePlanta);
  const setActivePlanta = useStore((s) => s.setActivePlanta);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* ===== HEADER: Logo + Module Tabs + Planta Selector ===== */}
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-6">
          <span className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            🏋️ GymLayout Pro
          </span>
          <span className="text-[10px] text-zinc-600 font-medium">FIREFIT</span>
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

        {/* Spacer */}
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
