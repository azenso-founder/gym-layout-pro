// ==========================================
// CRAFT — Grilla visual de la planta
// Grid interactivo con colores por departamento y flujos SVG
// ==========================================

'use client';

import { useMemo, useCallback } from 'react';
import { useCraftStore } from '@/stores/useCraftStore';

/** Tamaño máximo en px para el contenedor de la grilla */
const MAX_GRID_PX = 600;
const MIN_CELL_PX = 12;
const MAX_CELL_PX = 60;

export default function CraftGrid() {
  const { problem, layoutState, showFlows, selectedDeptForSwap, selectDeptForSwap, manualSwapDepts } = useCraftStore();

  const cellSize = useMemo(() => {
    if (!layoutState) return 40;
    const maxByW = Math.floor(MAX_GRID_PX / problem.W);
    const maxByL = Math.floor(MAX_GRID_PX / problem.L);
    return Math.max(MIN_CELL_PX, Math.min(MAX_CELL_PX, maxByW, maxByL));
  }, [layoutState, problem.L, problem.W]);

  const gridWidth = problem.W * cellSize;
  const gridHeight = problem.L * cellSize;

  const deptMap = useMemo(() => {
    const m = new Map<number, { name: string; color: string }>();
    problem.departments.forEach(d => m.set(d.id, { name: d.name, color: d.color }));
    return m;
  }, [problem.departments]);

  const handleCellClick = useCallback((deptId: number) => {
    if (deptId === 0) return;
    if (selectedDeptForSwap === null) {
      selectDeptForSwap(deptId);
    } else if (selectedDeptForSwap === deptId) {
      selectDeptForSwap(null);
    } else {
      manualSwapDepts(selectedDeptForSwap, deptId);
    }
  }, [selectedDeptForSwap, selectDeptForSwap, manualSwapDepts]);

  // Flujos como líneas SVG
  const flowLines = useMemo(() => {
    if (!showFlows || !layoutState) return [];
    const lines: { x1: number; y1: number; x2: number; y2: number; weight: number; color: string }[] = [];
    const maxFlow = Math.max(1, ...problem.flowMatrix.flat());

    for (let i = 0; i < problem.N; i++) {
      for (let j = i + 1; j < problem.N; j++) {
        const flow = problem.flowMatrix[i][j] + problem.flowMatrix[j][i];
        if (flow <= 0) continue;
        const c1 = layoutState.centroids[i];
        const c2 = layoutState.centroids[j];
        const ratio = flow / maxFlow;
        lines.push({
          x1: c1.x * cellSize,
          y1: c1.y * cellSize,
          x2: c2.x * cellSize,
          y2: c2.y * cellSize,
          weight: 1 + ratio * 4,
          color: ratio > 0.6 ? '#EF4444' : ratio > 0.3 ? '#F59E0B' : '#3B82F6',
        });
      }
    }
    return lines;
  }, [showFlows, layoutState, problem, cellSize]);

  if (!layoutState) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
        Genera un layout inicial para visualizar la planta
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selectedDeptForSwap && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
          🔄 Seleccionado: <strong>{deptMap.get(selectedDeptForSwap)?.name}</strong> — Haz clic en otro departamento para intercambiar.
          <button
            onClick={() => selectDeptForSwap(null)}
            className="ml-2 underline hover:text-blue-300"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="overflow-auto relative" style={{ maxWidth: '100%' }}>
        {/* Números de columna */}
        <div className="flex ml-6" style={{ width: gridWidth }}>
          {Array.from({ length: problem.W }, (_, c) => (
            <div
              key={c}
              className="text-center text-[9px] text-zinc-600"
              style={{ width: cellSize }}
            >
              {c + 1}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Números de fila */}
          <div className="flex flex-col" style={{ width: 24 }}>
            {Array.from({ length: problem.L }, (_, r) => (
              <div
                key={r}
                className="flex items-center justify-center text-[9px] text-zinc-600"
                style={{ height: cellSize }}
              >
                {r + 1}
              </div>
            ))}
          </div>

          {/* Grid de celdas */}
          <div className="relative" style={{ width: gridWidth, height: gridHeight }}>
            {/* Celdas */}
            {layoutState.plant.map((row, r) =>
              row.map((deptId, c) => {
                const dept = deptMap.get(deptId);
                const isSelected = selectedDeptForSwap === deptId;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`absolute border transition-all cursor-pointer ${
                      deptId === 0
                        ? 'border-zinc-800/50 bg-zinc-950'
                        : isSelected
                        ? 'border-white/50 ring-1 ring-white/30'
                        : 'border-zinc-900/50 hover:brightness-110'
                    }`}
                    style={{
                      left: c * cellSize,
                      top: r * cellSize,
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: dept?.color || 'transparent',
                      opacity: deptId === 0 ? 1 : 0.85,
                    }}
                    onClick={() => handleCellClick(deptId)}
                    title={dept ? `${dept.name} (ID: ${deptId})` : 'Vacío'}
                  />
                );
              })
            )}

            {/* Centroides */}
            {layoutState.centroids.map((c, i) => {
              if (layoutState.cellCounts[i] === 0) return null;
              return (
                <div
                  key={`centroid-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: c.x * cellSize - 3,
                    top: c.y * cellSize - 3,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    boxShadow: '0 0 4px rgba(0,0,0,0.8)',
                  }}
                />
              );
            })}

            {/* Flujos SVG */}
            {flowLines.length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={gridWidth}
                height={gridHeight}
              >
                {flowLines.map((line, i) => (
                  <line
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.color}
                    strokeWidth={line.weight}
                    strokeOpacity={0.7}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Leyenda de departamentos */}
      <div className="flex flex-wrap gap-2 pt-2">
        {problem.departments.map((dept) => (
          <div key={dept.id} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <div
              className="w-3 h-3 rounded-sm border border-zinc-700"
              style={{ backgroundColor: dept.color }}
            />
            {dept.name}
          </div>
        ))}
      </div>
    </div>
  );
}
