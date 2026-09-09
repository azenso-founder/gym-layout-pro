// ==========================================
// CRAFT — Módulo principal
// Orquesta setup, grilla, panel de info y toolbar
// ==========================================

'use client';

import { useCraftStore } from '@/stores/useCraftStore';
import CraftToolbar from './CraftToolbar';
import CraftSetupForm from './CraftSetupForm';
import CraftGrid from './CraftGrid';
import CraftInfoPanel from './CraftInfoPanel';

export default function CraftModule() {
  const { view } = useCraftStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-800 px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold text-white">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">CRAFT — Distribución de Planta</h1>
            <p className="text-[10px] text-zinc-500">
              Computerized Relative Allocation of Facilities Technique
            </p>
          </div>
        </div>
        <CraftToolbar />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === 'setup' && (
          <div className="max-w-4xl mx-auto p-6">
            <CraftSetupForm />
          </div>
        )}

        {view === 'layout' && (
          <div className="flex flex-col lg:flex-row h-full">
            {/* Grid */}
            <div className="flex-1 p-6 flex items-start justify-center overflow-auto">
              <CraftGrid />
            </div>
            {/* Info lateral */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 p-4 overflow-auto">
              <CraftInfoPanel />
            </div>
          </div>
        )}

        {view === 'results' && (
          <div className="max-w-4xl mx-auto p-6">
            <CraftResults />
          </div>
        )}
      </div>
    </div>
  );
}

/** Vista de resultados finales */
function CraftResults() {
  const { problem, layoutState, initialCost } = useCraftStore();

  if (!layoutState) {
    return (
      <div className="text-center py-12 text-zinc-600 text-sm">
        No hay resultados aún. Genera un layout y ejecuta la optimización.
      </div>
    );
  }

  const improvement = initialCost && initialCost > 0
    ? ((1 - layoutState.totalCost / initialCost) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Costo Inicial"
          value={initialCost?.toFixed(2) || '—'}
          sub={`${problem.distanceMetric === 'rectilinear' ? 'Manhattan' : 'Euclidiana'}`}
        />
        <StatCard
          label="Costo Final"
          value={layoutState.totalCost.toFixed(2)}
          highlight
        />
        <StatCard
          label="Mejora"
          value={`${improvement.toFixed(1)}%`}
          sub={`${layoutState.iterations.length} iteraciones`}
          positive={improvement > 0}
        />
      </div>

      {/* Grilla final + panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3 uppercase">Layout Optimizado</h3>
          <CraftGrid />
        </div>
        <div className="lg:w-80">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3 uppercase">Detalle</h3>
          <CraftInfoPanel />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight, positive }: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      highlight
        ? 'bg-orange-500/5 border-orange-500/20'
        : 'bg-zinc-900/60 border-zinc-800'
    }`}>
      <div className="text-[10px] uppercase text-zinc-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${
        positive ? 'text-green-400' : highlight ? 'text-orange-400' : 'text-white'
      }`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
}
