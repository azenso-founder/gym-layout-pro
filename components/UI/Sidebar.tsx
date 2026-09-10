// ==========================================
// Sidebar izquierda — Inventario de máquinas (Rediseño UX)
// Cards más grandes, Lucide icons, búsqueda mejorada,
// resumen Guerchet siempre visible, indicadores de colocación
// ==========================================

'use client';

import { useState } from 'react';
import {
  Search, Plus, ChevronDown, ChevronRight, LayoutGrid, List,
  Check, Grid3X3, Info,
} from 'lucide-react';
import useStore from '@/stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { tokens } from '@/lib/design/tokens';
import Tooltip from './Tooltip';
import type { MachineCategory } from '@/types';
import CreateMachineModal from './CreateMachineModal';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const supUsada = getSuperficieUsada(activePlanta);
  const supDisponible = getSuperficieDisponible(activePlanta);
  const porcentaje = supDisponible > 0 ? Math.round((supUsada / supDisponible) * 100) : 0;
  const overCapacity = supUsada > supDisponible;
  const nearCapacity = porcentaje > 80 && !overCapacity;

  // Filtrar plantillas por planta y búsqueda
  const filtered = templates.filter(
    (t) =>
      t.planta === activePlanta &&
      (t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
       CATEGORY_LABELS[t.categoria].toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Contar cuántas ya fueron colocadas de cada template
  const placedCount = (templateId: string) =>
    machines.filter((m) => m.templateId === templateId && m.placed).length;

  // Total colocadas vs total disponibles
  const totalTemplates = templates.filter((t) => t.planta === activePlanta).length;
  const totalPlaced = new Set(
    machines.filter((m) => m.planta === activePlanta && m.placed).map((m) => m.templateId)
  ).size;

  // Agrupar por categoría
  const categories = Array.from(new Set(filtered.map((t) => t.categoria))) as MachineCategory[];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{
        width: tokens.spacing.sidebar,
        background: tokens.colors.bg.panel,
        borderRight: `1px solid ${tokens.colors.border.subtle}`,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.colors.text.secondary }}>
            Inventario de Máquinas
          </h2>
          <div className="flex items-center gap-1">
            {/* Vista toggle */}
            <Tooltip content="Vista lista">
              <button
                className="p-1 rounded"
                style={{
                  color: viewMode === 'list' ? tokens.colors.accent.primary : tokens.colors.text.muted,
                  background: viewMode === 'list' ? tokens.colors.accent.primary + '15' : 'transparent',
                }}
                onClick={() => setViewMode('list')}
              >
                <List size={14} />
              </button>
            </Tooltip>
            <Tooltip content="Vista grid">
              <button
                className="p-1 rounded"
                style={{
                  color: viewMode === 'grid' ? tokens.colors.accent.primary : tokens.colors.text.muted,
                  background: viewMode === 'grid' ? tokens.colors.accent.primary + '15' : 'transparent',
                }}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={14} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: tokens.colors.text.muted }} />
          <input
            type="text"
            placeholder="Buscar máquina o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-8 py-2.5 rounded-lg border outline-none transition-all placeholder:text-zinc-600"
            style={{
              background: tokens.colors.bg.surface,
              color: tokens.colors.text.primary,
              borderColor: tokens.colors.border.default,
            }}
          />
          {searchQuery && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: tokens.colors.text.muted }}
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Badge de colocación */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>
            {totalPlaced}/{totalTemplates} tipos colocados
          </span>
          <div className="flex gap-1">
            {/* Filtros rápidos por categoría */}
            {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, color]) => {
              const count = filtered.filter((t) => t.categoria === cat).length;
              if (count === 0) return null;
              return (
                <Tooltip key={cat} content={CATEGORY_LABELS[cat as MachineCategory]}>
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="px-3 py-2 border-b flex gap-2" style={{ borderColor: tokens.colors.border.subtle }}>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border"
          style={{
            background: tokens.colors.accent.primary + '10',
            color: tokens.colors.accent.primary,
            borderColor: tokens.colors.accent.primary + '25',
          }}
          onClick={autoPlaceAll}
        >
          <Grid3X3 size={14} /> Auto-colocar
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border"
          style={{
            background: tokens.colors.accent.success + '10',
            color: tokens.colors.accent.success,
            borderColor: tokens.colors.accent.success + '25',
          }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={14} /> Crear
        </button>
      </div>

      <CreateMachineModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Lista de máquinas por categoría */}
      <div className="flex-1 overflow-y-auto py-1">
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search size={28} style={{ color: tokens.colors.text.muted }} className="mb-3" />
            <p className="text-xs" style={{ color: tokens.colors.text.muted }}>No se encontraron máquinas</p>
            {searchQuery && (
              <button className="text-xs mt-2 hover:underline" style={{ color: tokens.colors.accent.primary }} onClick={() => setSearchQuery('')}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {categories.map((cat) => {
          const catMachines = filtered.filter((t) => t.categoria === cat);
          const isCollapsed = collapsedCategories.has(cat);
          const catPlacedCount = catMachines.filter((t) => placedCount(t.id) > 0).length;
          const catColor = CATEGORY_COLORS[cat];

          return (
            <div key={cat} className="mb-0.5">
              {/* Category header */}
              <button
                className="flex items-center gap-2 w-full text-left px-3 py-2 transition-colors"
                style={{ borderLeft: `3px solid ${catColor}` }}
                onClick={() => toggleCategory(cat)}
              >
                <span style={{ color: tokens.colors.text.muted }}>
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </span>
                <span className="text-xs font-medium flex-1" style={{ color: tokens.colors.text.primary }}>
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: tokens.colors.bg.surface, color: tokens.colors.text.muted }}>
                  {catPlacedCount}/{catMachines.length}
                </span>
              </button>

              {/* Machine items */}
              {!isCollapsed && (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-1.5 px-3 pb-2' : 'pb-1'}>
                  {catMachines.map((t) => {
                    const placed = placedCount(t.id);
                    const isPlaced = placed > 0;

                    if (viewMode === 'grid') {
                      // Grid card view
                      return (
                        <button
                          key={t.id}
                          className="flex flex-col items-center p-2.5 rounded-lg border text-center transition-all"
                          style={{
                            background: isPlaced ? tokens.colors.bg.active : tokens.colors.bg.surface,
                            borderColor: isPlaced ? catColor + '40' : tokens.colors.border.subtle,
                          }}
                          onClick={() => addMachine(t.id)}
                          title={`Añadir · St=${t.St}m²`}
                        >
                          {/* Mini shape */}
                          <div
                            className="w-12 h-8 rounded-sm mb-1.5 flex items-center justify-center"
                            style={{
                              backgroundColor: catColor + '20',
                              border: `1px solid ${catColor}50`,
                            }}
                          >
                            {isPlaced ? (
                              <Check size={14} style={{ color: tokens.colors.accent.success }} />
                            ) : (
                              <span className="text-[8px] tabular-nums" style={{ color: tokens.colors.text.muted }}>
                                {t.largo}×{t.ancho}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium truncate w-full" style={{ color: tokens.colors.text.primary }}>
                            {t.nombre}
                          </span>
                          <span className="text-[9px] tabular-nums" style={{ color: tokens.colors.text.muted }}>
                            {t.largo}×{t.ancho}m
                          </span>
                          {/* Placement dots */}
                          {placed > 0 && (
                            <div className="flex gap-0.5 mt-1">
                              {Array.from({ length: Math.min(placed, 5) }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                              ))}
                              {placed > 5 && <span className="text-[8px]" style={{ color: tokens.colors.text.muted }}>+{placed - 5}</span>}
                            </div>
                          )}
                        </button>
                      );
                    }

                    // List view
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-md text-xs cursor-pointer group transition-all"
                        style={{
                          background: isPlaced ? tokens.colors.bg.surface + '80' : 'transparent',
                          minHeight: '48px',
                        }}
                        onClick={() => addMachine(t.id)}
                        title={`Clic para añadir · ${t.largo}×${t.ancho}m · St=${t.St}m²`}
                      >
                        {/* Color indicator */}
                        <div
                          className="w-9 h-7 rounded-md border shrink-0 flex items-center justify-center"
                          style={{
                            backgroundColor: catColor + '15',
                            borderColor: catColor + '40',
                          }}
                        >
                          {isPlaced ? (
                            <Check size={14} style={{ color: tokens.colors.accent.success }} />
                          ) : (
                            <span className="text-[8px] tabular-nums" style={{ color: tokens.colors.text.muted }}>
                              {t.largo.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Name + dims */}
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ color: isPlaced ? tokens.colors.text.secondary : tokens.colors.text.primary }}>
                            {t.nombre}
                          </div>
                          <div className="text-[10px] tabular-nums" style={{ color: tokens.colors.text.muted }}>
                            {t.largo}×{t.ancho}m · St={t.St}m²
                          </div>
                          <div className="text-[10px] tabular-nums" style={{ color: tokens.colors.text.muted }}>
                            N={t.N} {t.N === 1 ? 'lado' : 'lados'} · K={t.K}
                          </div>
                        </div>

                        {/* Placement badge */}
                        {placed > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: catColor + '20', color: catColor }}>
                            ×{placed}
                          </span>
                        )}

                        {/* Add button */}
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all"
                          style={{ color: tokens.colors.accent.primary }}
                          onClick={(e) => { e.stopPropagation(); addMachine(t.id); }}
                        >
                          <Plus size={16} />
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

      {/* ── Resumen Guerchet (siempre visible) ── */}
      <div className="px-3 py-3 border-t" style={{ borderColor: tokens.colors.border.subtle, background: tokens.colors.bg.surface }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={12} style={{ color: tokens.colors.text.muted }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tokens.colors.text.muted }}>
            Resumen Guerchet
          </span>
        </div>

        <div className="flex justify-between items-baseline text-xs mb-1.5">
          <span style={{ color: tokens.colors.text.muted }}>Superficie</span>
          <span className="font-medium tabular-nums" style={{ color: overCapacity ? tokens.colors.accent.danger : tokens.colors.text.primary }}>
            {supUsada} / {supDisponible} m²
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: tokens.colors.bg.elevated }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, porcentaje)}%`,
              background: overCapacity
                ? tokens.colors.accent.danger
                : nearCapacity
                ? tokens.colors.accent.warning
                : tokens.colors.accent.success,
            }}
          />
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>
            {porcentaje}% ocupado
          </span>
          <span className="text-[10px] font-medium" style={{
            color: overCapacity ? tokens.colors.accent.danger : nearCapacity ? tokens.colors.accent.warning : tokens.colors.accent.success,
          }}>
            {overCapacity ? '⚠️ Excedido' : nearCapacity ? '⚠️ Casi lleno' : '✅'} Margen: {Math.round((supDisponible - supUsada) * 10) / 10} m²
          </span>
        </div>
      </div>
    </div>
  );
}
