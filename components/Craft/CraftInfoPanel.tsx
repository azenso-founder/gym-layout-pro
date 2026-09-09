// ==========================================
// CRAFT — Panel de información y resultados
// Centroides, áreas, costo total, historial de iteraciones
// ==========================================

'use client';

import { useCraftStore } from '@/stores/useCraftStore';

export default function CraftInfoPanel() {
  const { problem, layoutState, initialCost } = useCraftStore();

  if (!layoutState) {
    return (
      <div className="text-xs text-zinc-600 italic p-4">
        Genera un layout para ver la información.
      </div>
    );
  }

  const improvement = initialCost && initialCost > 0
    ? ((1 - layoutState.totalCost / initialCost) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {/* Costo total */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase text-zinc-500">Costo Total</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {layoutState.totalCost.toFixed(2)}
          </span>
        </div>
        {initialCost !== null && (
          <div className="mt-2 flex items-center gap-3 text-[10px]">
            <span className="text-zinc-500">
              Inicial: <span className="text-zinc-400">{initialCost.toFixed(2)}</span>
            </span>
            {improvement && +improvement > 0 && (
              <span className="text-green-400 font-medium">
                ▼ {improvement}% mejora
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabla de departamentos */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase text-zinc-500">
              <th className="text-left px-2 py-1">Dept</th>
              <th className="text-left px-2 py-1">Color</th>
              <th className="text-right px-2 py-1">Área Req.</th>
              <th className="text-right px-2 py-1">Área Asig.</th>
              <th className="text-right px-2 py-1">CX</th>
              <th className="text-right px-2 py-1">CY</th>
            </tr>
          </thead>
          <tbody>
            {problem.departments.map((dept, i) => (
              <tr key={dept.id} className="border-t border-zinc-800/50">
                <td className="px-2 py-1.5 text-zinc-300">{dept.name}</td>
                <td className="px-2 py-1.5">
                  <div
                    className="w-4 h-4 rounded-sm border border-zinc-700"
                    style={{ backgroundColor: dept.color }}
                  />
                </td>
                <td className="px-2 py-1.5 text-right text-zinc-400 tabular-nums">{dept.area}</td>
                <td className={`px-2 py-1.5 text-right tabular-nums ${
                  layoutState.cellCounts[i] === dept.area ? 'text-green-400' : 'text-red-400'
                }`}>
                  {layoutState.cellCounts[i]}
                </td>
                <td className="px-2 py-1.5 text-right text-zinc-400 tabular-nums">
                  {layoutState.centroids[i].x.toFixed(2)}
                </td>
                <td className="px-2 py-1.5 text-right text-zinc-400 tabular-nums">
                  {layoutState.centroids[i].y.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historial de iteraciones */}
      {layoutState.iterations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase text-zinc-500 font-semibold">
            Historial de Iteraciones ({layoutState.iterations.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {layoutState.iterations.map((iter) => {
              const dI = problem.departments.find(d => d.id === iter.deptI);
              const dJ = problem.departments.find(d => d.id === iter.deptJ);
              return (
                <div
                  key={iter.step}
                  className="flex items-center gap-2 text-[10px] px-2 py-1.5 bg-zinc-900/40 rounded-lg"
                >
                  <span className="w-5 text-zinc-600 font-mono">#{iter.step}</span>
                  <span className="text-zinc-300">
                    {dI?.name || iter.deptI} ↔ {dJ?.name || iter.deptJ}
                  </span>
                  <span className="ml-auto text-green-400 tabular-nums">
                    −{iter.savings.toFixed(2)}
                  </span>
                  <span className="text-zinc-500 tabular-nums">
                    → {iter.costAfter.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matriz de distancias */}
      <details className="group">
        <summary className="text-[10px] uppercase text-zinc-500 font-semibold cursor-pointer hover:text-zinc-400">
          Matriz de Distancias ▸
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="text-[10px]">
            <thead>
              <tr>
                <th className="px-1 text-zinc-600"></th>
                {problem.departments.map(d => (
                  <th key={d.id} className="px-1 text-zinc-500 text-center">{d.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {problem.departments.map((_, i) => (
                <tr key={i}>
                  <td className="px-1 text-zinc-500 font-medium">{i + 1}</td>
                  {problem.departments.map((_, j) => (
                    <td key={j} className="px-1 text-center text-zinc-400 tabular-nums">
                      {i === j ? '—' : layoutState.distances[i][j].toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
