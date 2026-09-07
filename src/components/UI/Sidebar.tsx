// ==========================================
// Sidebar izquierda — Inventario de máquinas
// ==========================================

import { useState } from 'react';
import { FiSearch, FiPlus, FiChevronDown, FiChevronRight, FiGrid, FiCheck } from 'react-icons/fi';
import useStore from '../../stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../types';
import type { MachineCategory } from '../../types';

export default function Sidebar() {
  const templates = useStore((s) => s.templates);
  const activePlanta = useStore((s) => s.activePlanta);
  const addMachine = useStore((s) => s.addMachine);
  const autoPlaceAll = useStore((s) => s.autoPlaceAll);
  const machines = useStore((s) => s.machines);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const getSuperficieUsada = useStore((s) => s.getSuperficieUsada);
  const getSuperficieDisponible = useStore((s) => s.getSuperficieDisponible);

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const supUsada = getSuperficieUsada(activePlanta);
  const supDisponible = getSuperficieDisponible(activePlanta);
  const porcentaje = Math.round((supUsada / supDisponible) * 100);
  const overCapacity = supUsada > supDisponible;

  // Filtrar plantillas por planta y búsqueda
  const filtered = templates.filter(
    (t) =>
      t.planta === activePlanta &&
      t.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Contar cuántas ya fueron colocadas de cada template
  const placedCount = (templateId: string) =>
    machines.filter((m) => m.templateId === templateId && m.placed).length;

  // Total colocadas vs total disponibles
  const totalTemplates = templates.filter((t) => t.planta === activePlanta).length;
  const totalPlaced = new Set(
    machines
      .filter((m) => m.planta === activePlanta && m.placed)
      .map((m) => m.templateId)
  ).size;

  // Agrupar por categoría
  const categories = Array.from(
    new Set(filtered.map((t) => t.categoria))
  ) as MachineCategory[];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="w-72 bg-zinc-900/95 border-r border-zinc-800 flex flex-col h-full shrink-0">
      {/* Header con título y búsqueda */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Inventario
          </h2>
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {totalPlaced}/{totalTemplates} colocadas
          </span>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
          <input
            type="text"
            placeholder="Buscar máquina..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800/80 text-zinc-300 text-xs px-8 py-2 rounded-lg border border-zinc-700/50 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 placeholder-zinc-600 transition-all"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Superficie Guerchet */}
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <div className="flex justify-between items-baseline text-xs mb-1.5">
          <span className="text-zinc-500">Superficie Guerchet</span>
          <span className={`font-medium tabular-nums ${overCapacity ? 'text-red-400' : 'text-zinc-300'}`}>
            {supUsada} / {supDisponible} m²
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overCapacity
                ? 'bg-red-500'
                : porcentaje > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-600">
            {porcentaje}% ocupado
          </span>
          <span className="text-[10px] text-zinc-600">
            Margen: {Math.round((supDisponible - supUsada) * 10) / 10} m²
          </span>
        </div>

        {/* Auto-colocar */}
        <button
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs font-medium transition-all border border-orange-500/20 hover:border-orange-500/30"
          onClick={autoPlaceAll}
          title="Colocar automáticamente las máquinas no colocadas"
        >
          <FiGrid className="text-xs" /> Auto-colocar todas
        </button>
      </div>

      {/* Lista de máquinas por categoría */}
      <div className="flex-1 overflow-y-auto py-1">
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-xs text-zinc-500">No se encontraron máquinas</p>
            {searchQuery && (
              <button
                className="text-xs text-orange-400 mt-1 hover:underline"
                onClick={() => setSearchQuery('')}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {categories.map((cat) => {
          const catMachines = filtered.filter((t) => t.categoria === cat);
          const isCollapsed = collapsedCategories.has(cat);
          const catPlacedCount = catMachines.filter(
            (t) => placedCount(t.id) > 0
          ).length;

          return (
            <div key={cat} className="mb-0.5">
              {/* Category header */}
              <button
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-zinc-800/60 transition-colors"
                onClick={() => toggleCategory(cat)}
              >
                <span className="text-zinc-500 text-[10px]">
                  {isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
                </span>
                <div
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <span className="text-xs font-medium text-zinc-300 flex-1">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {catPlacedCount}/{catMachines.length}
                </span>
              </button>

              {/* Machine list */}
              {!isCollapsed && (
                <div className="pb-1">
                  {catMachines.map((t) => {
                    const placed = placedCount(t.id);
                    const isPlaced = placed > 0;

                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-2 mx-1.5 px-2 py-1.5 rounded-md text-xs cursor-pointer group transition-all ${
                          isPlaced
                            ? 'bg-zinc-800/30 hover:bg-zinc-800/60'
                            : 'hover:bg-zinc-800/60'
                        }`}
                        onClick={() => addMachine(t.id)}
                        title={`Clic para añadir al plano · ${t.largo}×${t.ancho}m · St=${t.St}m²`}
                      >
                        {/* Color indicator + mini preview */}
                        <div
                          className="w-7 h-5 rounded border shrink-0 flex items-center justify-center"
                          style={{
                            backgroundColor: CATEGORY_COLORS[cat] + '15',
                            borderColor: CATEGORY_COLORS[cat] + '40',
                          }}
                        >
                          {isPlaced ? (
                            <FiCheck className="text-emerald-400" style={{ fontSize: 10 }} />
                          ) : (
                            <span className="text-[8px] text-zinc-500 tabular-nums">
                              {t.largo.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Name + dims */}
                        <div className="flex-1 min-w-0">
                          <div className={`truncate ${isPlaced ? 'text-zinc-400' : 'text-zinc-300'}`}>
                            {t.nombre}
                          </div>
                          <div className="text-[10px] text-zinc-600 tabular-nums">
                            {t.largo}×{t.ancho}m &middot; St={t.St}m²
                          </div>
                          <div className="text-[10px] text-zinc-600 tabular-nums">
                            N={t.N} {t.N === 1 ? 'lado' : 'lados'} &middot; K={t.K}
                          </div>
                        </div>

                        {/* Add button */}
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            addMachine(t.id);
                          }}
                          title="Añadir al plano"
                        >
                          <FiPlus className="text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer help */}
      <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/50">
        <p className="text-[10px] text-zinc-600 text-center">
          Clic en una máquina para añadirla al plano
        </p>
      </div>
    </div>
  );
}
