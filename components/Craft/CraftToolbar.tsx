// ==========================================
// CRAFT — Barra de herramientas
// Botones de acción para layout, optimización y exportación
// ==========================================

'use client';

import { useCallback, useRef } from 'react';
import { useCraftStore } from '@/stores/useCraftStore';

export default function CraftToolbar() {
  const {
    layoutState,
    optimizing,
    showFlows,
    optimizationMode,
    view,
    setView,
    toggleFlows,
    setOptimizationMode,
    optimizeStep,
    optimizeFull,
    evaluate,
    exportProblem,
    reset,
  } = useCraftStore();

  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleOptimize = useCallback(() => {
    if (optimizationMode === 'auto') {
      optimizeFull();
    } else {
      const improved = optimizeStep();
      if (!improved) {
        alert('No se encontraron mejoras adicionales. El layout es un óptimo local.');
      }
    }
  }, [optimizationMode, optimizeFull, optimizeStep]);

  const handleExport = useCallback(() => {
    const json = exportProblem();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'craft-problem.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportProblem]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Navegación de vistas */}
      <div className="flex bg-zinc-900 rounded-lg p-0.5 mr-2">
        {(['setup', 'layout', 'results'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              view === v
                ? 'bg-orange-600 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {v === 'setup' ? '⚙️ Configurar' : v === 'layout' ? '🏗️ Layout' : '📊 Resultados'}
          </button>
        ))}
      </div>

      {layoutState && (
        <>
          {/* Evaluar */}
          <button
            onClick={evaluate}
            className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            📏 Evaluar
          </button>

          {/* Modo de optimización */}
          <select
            value={optimizationMode}
            onChange={(e) => setOptimizationMode(e.target.value as 'auto' | 'step')}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-400 outline-none"
          >
            <option value="auto">Automático</option>
            <option value="step">Paso a paso</option>
          </select>

          {/* Optimizar */}
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-40 transition-colors"
          >
            {optimizing ? '⏳ Optimizando...' : '🚀 Optimizar (CRAFT)'}
          </button>

          {/* Toggle flujos */}
          <button
            onClick={toggleFlows}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showFlows
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {showFlows ? '🔗 Ocultar Flujos' : '🔗 Mostrar Flujos'}
          </button>
        </>
      )}

      <div className="flex-1" />

      {/* Exportar */}
      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        💾 Exportar
      </button>

      {/* Reset */}
      <button
        onClick={reset}
        className="px-3 py-1.5 text-xs bg-zinc-800 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
      >
        🗑️ Reset
      </button>
    </div>
  );
}
