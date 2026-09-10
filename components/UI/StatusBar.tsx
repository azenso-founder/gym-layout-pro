// ==========================================
// Barra de estado inferior — Fase 12
// Coordenadas del cursor, zoom, grid, selección, estado de guardado
// ==========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import useStore, { px2m } from '@/stores/useStore';
import { tokens } from '@/lib/design/tokens';

interface Props {
  /** Estado de guardado del ProjectEditor */
  saveStatus?: 'saved' | 'saving' | 'error' | 'idle';
}

export default function StatusBar({ saveStatus = 'idle' }: Props) {
  const canvasScale = useStore((s) => s.canvasScale);
  const canvasOffset = useStore((s) => s.canvasOffset);
  const snapGrid = useStore((s) => s.snapGrid);
  const showGrid = useStore((s) => s.showGrid);
  const activePlanta = useStore((s) => s.activePlanta);
  const selectedMachineIds = useStore((s) => s.selectedMachineIds);
  const selectedMachineId = useStore((s) => s.selectedMachineId);
  const machines = useStore((s) => s.machines);
  const activeTool = useStore((s) => s.activeTool);

  // Coordenadas del cursor en metros (actualización en tiempo real)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Escuchar movimiento del ratón sobre el canvas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Convertir coordenadas de pantalla a canvas a metros
      const canvasX = (e.clientX - canvasOffset.x) / canvasScale;
      const canvasY = (e.clientY - canvasOffset.y) / canvasScale;
      setCursorPos({
        x: Math.round(px2m(canvasX) * 100) / 100,
        y: Math.round(px2m(canvasY) * 100) / 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [canvasScale, canvasOffset]);

  // Dimensiones de la selección
  const selectionDims = useCallback(() => {
    if (selectedMachineIds.length === 0) return null;
    const selected = machines.filter((m) => selectedMachineIds.includes(m.id) && m.placed);
    if (selected.length === 0) return null;

    if (selected.length === 1) {
      const m = selected[0];
      return `${m.largo}×${m.ancho}m`;
    }

    // Bounding box del grupo
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const m of selected) {
      const hw = m.largo / 2;
      const hh = m.ancho / 2;
      const mx = px2m(m.x);
      const my = px2m(m.y);
      if (mx - hw < minX) minX = mx - hw;
      if (my - hh < minY) minY = my - hh;
      if (mx + hw > maxX) maxX = mx + hw;
      if (my + hh > maxY) maxY = my + hh;
    }

    const w = Math.round((maxX - minX) * 100) / 100;
    const h = Math.round((maxY - minY) * 100) / 100;
    return `${w}×${h}m`;
  }, [selectedMachineIds, machines]);

  // Nombre de la herramienta activa
  const toolLabels: Record<string, string> = {
    select: 'Seleccionar',
    pan: 'Mover',
    measure: 'Medir',
    zone: 'Zona',
    trace: 'Trazar',
  };

  const dims = selectionDims();
  const zoomPct = Math.round(canvasScale * 100);

  return (
    <div
      className="h-7 flex items-center gap-0 text-[10px] shrink-0 select-none border-t"
      style={{
        background: tokens.colors.bg.panel,
        borderColor: tokens.colors.border.subtle,
        color: tokens.colors.text.muted,
      }}
    >
      {/* Coordenadas del cursor */}
      <StatusSegment>
        <span style={{ color: tokens.colors.text.muted }}>📍</span>
        <span className="tabular-nums" style={{ color: tokens.colors.text.secondary }}>
          X: {cursorPos ? cursorPos.x.toFixed(2) : '—'}m
        </span>
        <span className="tabular-nums" style={{ color: tokens.colors.text.secondary }}>
          Y: {cursorPos ? cursorPos.y.toFixed(2) : '—'}m
        </span>
      </StatusSegment>

      {/* Zoom */}
      <StatusSegment>
        <span>🔲</span>
        <span className="tabular-nums" style={{ color: tokens.colors.text.secondary }}>
          {zoomPct}%
        </span>
      </StatusSegment>

      {/* Grid y snap */}
      <StatusSegment>
        <span>📐</span>
        <span style={{ color: tokens.colors.text.secondary }}>
          Grid: {snapGrid}m
        </span>
        <span
          className="px-1 py-0.5 rounded text-[9px] font-semibold"
          style={{
            background: showGrid ? tokens.colors.accent.success + '20' : tokens.colors.bg.elevated,
            color: showGrid ? tokens.colors.accent.success : tokens.colors.text.muted,
          }}
        >
          {showGrid ? 'ON' : 'OFF'}
        </span>
      </StatusSegment>

      {/* Herramienta activa */}
      <StatusSegment>
        <span>🛠️</span>
        <span style={{ color: tokens.colors.accent.primary }}>
          {toolLabels[activeTool] || activeTool}
        </span>
      </StatusSegment>

      {/* Selección */}
      {selectedMachineIds.length > 0 && (
        <StatusSegment>
          <span>📏</span>
          <span style={{ color: tokens.colors.text.secondary }}>
            {selectedMachineIds.length === 1
              ? machines.find((m) => m.id === selectedMachineId)?.nombre || 'Selección'
              : `${selectedMachineIds.length} seleccionadas`}
          </span>
          {dims && (
            <span className="tabular-nums" style={{ color: tokens.colors.text.muted }}>
              {dims}
            </span>
          )}
        </StatusSegment>
      )}

      <div className="flex-1" />

      {/* Planta activa */}
      <StatusSegment>
        <span>🏗️</span>
        <span style={{ color: tokens.colors.text.secondary }}>
          {activePlanta === 'baja' ? 'Planta Baja' : 'Planta Alta'}
        </span>
      </StatusSegment>

      {/* Estado de guardado */}
      <StatusSegment last>
        {saveStatus === 'saving' && (
          <>
            <span className="animate-pulse">💾</span>
            <span style={{ color: tokens.colors.accent.warning }}>Guardando...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <span>💾</span>
            <span style={{ color: tokens.colors.accent.success }}>Guardado ✅</span>
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <span>💾</span>
            <span style={{ color: tokens.colors.accent.danger }}>Error ✗</span>
          </>
        )}
        {saveStatus === 'idle' && (
          <>
            <span>💾</span>
            <span style={{ color: tokens.colors.text.muted }}>—</span>
          </>
        )}
      </StatusSegment>
    </div>
  );
}

// Segmento individual de la barra de estado
function StatusSegment({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 h-full"
      style={{
        borderRight: last ? 'none' : `1px solid ${tokens.colors.border.subtle}`,
      }}
    >
      {children}
    </div>
  );
}
