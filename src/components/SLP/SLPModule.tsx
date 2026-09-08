// ==========================================
// Módulo SLP — Matriz de relaciones con edición masiva
// Soporte de selección de filas/columnas tipo Excel
// ==========================================

import { useMemo, useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { SLP_CONFIG, CATEGORY_COLORS, CATEGORY_LABELS } from '../../types';
import type { SLPRelation, MachineCategory } from '../../types';
import { slpKey, calcularScoreLayout, generarRelacionesDefault } from '../../engine/slp';

const RELATIONS: SLPRelation[] = ['A', 'E', 'I', 'O', 'U', 'X'];

export default function SLPModule() {
  const machines = useStore((s) => s.machines);
  const activePlanta = useStore((s) => s.activePlanta);
  const slpRelations = useStore((s) => s.slpRelations);
  const setSLPRelation = useStore((s) => s.setSLPRelation);
  const setSLPRelationsBulk = useStore((s) => s.setSLPRelationsBulk);

  const [view, setView] = useState<'matrix' | 'diagram'>('matrix');

  // Unique placed machines (deduplicated by name for the matrix)
  const uniqueMachines = useMemo(() => {
    const placed = machines.filter(
      (m) => m.planta === activePlanta && m.placed
    );
    const seen = new Set<string>();
    return placed.filter((m) => {
      if (seen.has(m.nombre)) return false;
      seen.add(m.nombre);
      return true;
    });
  }, [machines, activePlanta]);

  // Generate default relations if empty
  useEffect(() => {
    if (uniqueMachines.length > 1 && Object.keys(slpRelations).length === 0) {
      const defaults = generarRelacionesDefault(
        uniqueMachines.map((m) => ({
          id: m.id,
          categoria: m.categoria,
          nombre: m.nombre,
        }))
      );
      setSLPRelationsBulk(defaults);
    }
  }, [uniqueMachines.length]);

  // Calculate score
  const positions = new Map(
    machines
      .filter((m) => m.placed)
      .map((m) => [m.id, { x: m.x, y: m.y }])
  );
  const score = calcularScoreLayout(slpRelations, positions);

  // Regenerate all relations
  const handleRegenerate = () => {
    const defaults = generarRelacionesDefault(
      uniqueMachines.map((m) => ({
        id: m.id,
        categoria: m.categoria,
        nombre: m.nombre,
      }))
    );
    setSLPRelationsBulk(defaults);
  };

  // Count relations by type
  const relCounts = useMemo(() => {
    const counts: Record<SLPRelation, number> = { A: 0, E: 0, I: 0, O: 0, U: 0, X: 0 };
    for (const rel of Object.values(slpRelations)) {
      counts[rel]++;
    }
    return counts;
  }, [slpRelations]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-200">
            Análisis SLP — Systematic Layout Planning
          </h2>
          <p className="text-xs text-zinc-500">
            {activePlanta === 'baja' ? 'Planta Baja' : 'Planta Alta'} ·{' '}
            {uniqueMachines.length} máquinas únicas
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-4 py-2 border border-zinc-800">
            <span className="text-xs text-zinc-500">Score:</span>
            <div
              className={`text-2xl font-bold tabular-nums ${
                score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {score}
            </div>
            <span className="text-xs text-zinc-500">/100</span>
          </div>

          {/* View toggle */}
          <div className="flex bg-zinc-800/60 rounded-lg p-0.5">
            <button
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                view === 'matrix' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setView('matrix')}
            >
              Matriz
            </button>
            <button
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                view === 'diagram' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setView('diagram')}
            >
              Diagrama
            </button>
          </div>
        </div>
      </div>

      {/* Legend + bulk tools */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex gap-2">
          {RELATIONS.map((r) => (
            <div key={r} className="flex items-center gap-1 text-[11px]">
              <div
                className="w-5 h-5 rounded text-center text-[10px] font-bold flex items-center justify-center"
                style={{
                  backgroundColor: SLP_CONFIG[r].color + '25',
                  color: SLP_CONFIG[r].color,
                }}
              >
                {r}
              </div>
              <span className="text-zinc-500 hidden lg:inline">{SLP_CONFIG[r].label}</span>
              <span className="text-zinc-600 text-[10px]">({relCounts[r]})</span>
            </div>
          ))}
        </div>

        <button
          className="text-xs text-orange-400 hover:text-orange-300 px-3 py-1 rounded-md hover:bg-orange-500/10 transition-all"
          onClick={handleRegenerate}
          title="Regenerar relaciones con las reglas inteligentes del gym"
        >
          🔄 Regenerar default
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {view === 'matrix' ? (
          <RelationMatrix
            machines={uniqueMachines}
            relations={slpRelations}
            onSetRelation={setSLPRelation}
            onSetRelationsBulk={setSLPRelationsBulk}
          />
        ) : (
          <RelationDiagram machines={uniqueMachines} relations={slpRelations} />
        )}
      </div>
    </div>
  );
}

// ==== Matriz de Relaciones con selección masiva tipo Excel ====

function RelationMatrix({
  machines,
  relations,
  onSetRelation,
  onSetRelationsBulk,
}: {
  machines: any[];
  relations: Record<string, SLPRelation>;
  onSetRelation: (key: string, rel: SLPRelation) => void;
  onSetRelationsBulk: (updates: Record<string, SLPRelation>) => void;
}) {
  // Selected cells for bulk editing: Set of "i,j" strings
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  if (machines.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <p className="text-3xl mb-3">📐</p>
          <p className="text-sm">Coloca al menos 2 máquinas en el plano para ver la matriz SLP</p>
        </div>
      </div>
    );
  }

  // Toggle a single cell in selection
  const toggleCell = (i: number, j: number) => {
    const k = `${i},${j}`;
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // Select entire row (all cells where row=i and col>i)
  const selectRow = (rowIdx: number) => {
    setSelectedCells((prev) => {
      const next = new Set(prev);
      // Toggle: if most are selected, deselect; otherwise select
      const rowCells: string[] = [];
      for (let j = rowIdx + 1; j < machines.length; j++) {
        rowCells.push(`${rowIdx},${j}`);
      }
      // Also include cells where this machine is in column
      for (let i = 0; i < rowIdx; i++) {
        rowCells.push(`${i},${rowIdx}`);
      }
      const allSelected = rowCells.every((c) => next.has(c));
      if (allSelected) {
        rowCells.forEach((c) => next.delete(c));
      } else {
        rowCells.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  // Select entire column
  const selectCol = (colIdx: number) => {
    setSelectedCells((prev) => {
      const next = new Set(prev);
      const colCells: string[] = [];
      for (let i = 0; i < colIdx; i++) {
        colCells.push(`${i},${colIdx}`);
      }
      // Also column extends down as rows
      for (let j = colIdx + 1; j < machines.length; j++) {
        colCells.push(`${colIdx},${j}`);
      }
      const allSelected = colCells.every((c) => next.has(c));
      if (allSelected) {
        colCells.forEach((c) => next.delete(c));
      } else {
        colCells.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  // Apply a relation to all selected cells
  const applyBulk = (rel: SLPRelation) => {
    const updates: Record<string, SLPRelation> = {};
    for (const cell of selectedCells) {
      const [i, j] = cell.split(',').map(Number);
      if (i >= 0 && j >= 0 && i < machines.length && j < machines.length && i !== j) {
        const key = slpKey(machines[i].id, machines[j].id);
        updates[key] = rel;
      }
    }
    if (Object.keys(updates).length > 0) {
      onSetRelationsBulk(updates);
    }
    setSelectedCells(new Set());
  };

  // Clear selection
  const clearCells = () => setSelectedCells(new Set());

  const hasSelection = selectedCells.size > 0;

  return (
    <div>
      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <span className="text-xs text-orange-400 font-medium">
            {selectedCells.size} celdas seleccionadas
          </span>
          <span className="text-xs text-zinc-500">→ Asignar:</span>
          {RELATIONS.map((r) => (
            <button
              key={r}
              className="w-7 h-7 rounded text-xs font-bold transition-all hover:scale-110"
              style={{
                backgroundColor: SLP_CONFIG[r].color + '30',
                color: SLP_CONFIG[r].color,
              }}
              onClick={() => applyBulk(r)}
              title={`Asignar ${SLP_CONFIG[r].label} a todas las seleccionadas`}
            >
              {r}
            </button>
          ))}
          <button
            className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800"
            onClick={clearCells}
          >
            ✕ Limpiar
          </button>
        </div>
      )}

      {/* Help text */}
      <div className="text-[10px] text-zinc-600 mb-2">
        💡 Clic en nombre de fila/columna para seleccionar toda la fila. Ctrl+clic en celdas para selección múltiple. Usa la barra naranja para editar en lote.
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-zinc-500 text-left sticky left-0 bg-zinc-950 z-10 min-w-[160px]">
                Máquina
              </th>
              {machines.map((m, j) => (
                <th
                  key={m.id}
                  className="p-0.5 text-[10px] text-zinc-500 font-normal cursor-pointer hover:text-orange-400 transition-colors min-w-[32px]"
                  style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                  onClick={() => selectCol(j)}
                  title={`Seleccionar columna: ${m.nombre}`}
                >
                  <span className="flex items-center gap-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[m.categoria as MachineCategory] }}
                    />
                    {m.nombre.length > 18 ? m.nombre.substring(0, 16) + '…' : m.nombre}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {machines.map((m1: any, i: number) => (
              <tr key={m1.id} className="group">
                <td
                  className="p-2 text-xs text-zinc-300 whitespace-nowrap sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800/50 cursor-pointer hover:text-orange-400 transition-colors"
                  onClick={() => selectRow(i)}
                  title={`Seleccionar fila: ${m1.nombre}`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[m1.categoria as MachineCategory] }}
                    />
                    <span className="truncate max-w-[140px]">{m1.nombre}</span>
                  </div>
                </td>
                {machines.map((m2: any, j: number) => {
                  if (j <= i) {
                    // Lower triangle: show category color indicator
                    if (j === i) {
                      return (
                        <td key={m2.id} className="p-0.5">
                          <div
                            className="w-8 h-8 rounded-sm flex items-center justify-center text-[8px]"
                            style={{
                              backgroundColor: CATEGORY_COLORS[m1.categoria as MachineCategory] + '15',
                            }}
                          >
                            <span className="text-zinc-600">—</span>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={m2.id} className="p-0.5">
                        <div className="w-8 h-8 bg-zinc-900/30 rounded-sm" />
                      </td>
                    );
                  }

                  const key = slpKey(m1.id, m2.id);
                  const rel = relations[key] || 'U';
                  const cellKey = `${i},${j}`;
                  const isSelected = selectedCells.has(cellKey);

                  return (
                    <td key={m2.id} className="p-0.5">
                      <div
                        className={`relative ${isSelected ? 'ring-2 ring-orange-400 rounded-sm' : ''}`}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            toggleCell(i, j);
                          }
                        }}
                      >
                        <select
                          value={rel}
                          onChange={(e) =>
                            onSetRelation(key, e.target.value as SLPRelation)
                          }
                          className="w-8 h-8 text-center text-xs font-bold rounded-sm cursor-pointer border-0 outline-none appearance-none"
                          style={{
                            backgroundColor: SLP_CONFIG[rel].color + '25',
                            color: SLP_CONFIG[rel].color,
                          }}
                          title={`${m1.nombre} ↔ ${m2.nombre}: ${SLP_CONFIG[rel].label}`}
                        >
                          {RELATIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==== Diagrama de Relaciones (circular con edges coloreados) ====

function RelationDiagram({
  machines,
  relations,
}: {
  machines: any[];
  relations: Record<string, SLPRelation>;
}) {
  if (machines.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <p className="text-3xl mb-3">🔗</p>
          <p className="text-sm">Coloca al menos 2 máquinas para ver el diagrama</p>
        </div>
      </div>
    );
  }

  const cx = 400;
  const cy = 320;
  const radius = Math.min(260, machines.length * 28);

  const nodePositions = machines.map((m: any, i: number) => {
    const angle = (i / machines.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: m.id,
      nombre: m.nombre,
      categoria: m.categoria as MachineCategory,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  const edges: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    rel: SLPRelation;
    names: [string, string];
  }[] = [];

  for (let i = 0; i < machines.length; i++) {
    for (let j = i + 1; j < machines.length; j++) {
      const key = slpKey(machines[i].id, machines[j].id);
      const rel = relations[key] || 'U';
      if (rel !== 'U') {
        edges.push({
          from: nodePositions[i],
          to: nodePositions[j],
          rel,
          names: [machines[i].nombre, machines[j].nombre],
        });
      }
    }
  }

  return (
    <svg viewBox="0 0 800 640" className="w-full h-full max-h-[640px]">
      {/* Edges */}
      {edges.map((e, idx) => (
        <g key={idx}>
          <line
            x1={e.from.x}
            y1={e.from.y}
            x2={e.to.x}
            y2={e.to.y}
            stroke={SLP_CONFIG[e.rel].color}
            strokeWidth={Math.max(1, SLP_CONFIG[e.rel].lines * 1.2)}
            opacity={0.5}
            strokeDasharray={e.rel === 'X' ? '6,3' : undefined}
          />
          {/* Label at midpoint for important relations */}
          {(e.rel === 'A' || e.rel === 'X') && (
            <text
              x={(e.from.x + e.to.x) / 2}
              y={(e.from.y + e.to.y) / 2 - 4}
              textAnchor="middle"
              fill={SLP_CONFIG[e.rel].color}
              fontSize={9}
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              {e.rel}
            </text>
          )}
        </g>
      ))}

      {/* Nodes */}
      {nodePositions.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r={18}
            fill={CATEGORY_COLORS[node.categoria] + '30'}
            stroke={CATEGORY_COLORS[node.categoria]}
            strokeWidth={2}
          />
          <text
            x={node.x}
            y={node.y + 30}
            textAnchor="middle"
            fill="#aaa"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {node.nombre.length > 18
              ? node.nombre.substring(0, 16) + '…'
              : node.nombre}
          </text>
        </g>
      ))}

      {/* Category legend */}
      {(() => {
        const cats = [...new Set(machines.map((m: any) => m.categoria as MachineCategory))];
        return cats.map((cat, i) => (
          <g key={cat}>
            <circle cx={20} cy={20 + i * 18} r={5} fill={CATEGORY_COLORS[cat]} />
            <text x={30} y={24 + i * 18} fill="#888" fontSize={10} fontFamily="system-ui, sans-serif">
              {CATEGORY_LABELS[cat]}
            </text>
          </g>
        ));
      })()}
    </svg>
  );
}
