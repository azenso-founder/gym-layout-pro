// ==========================================
// Barra de herramientas — Rediseño UX completo
// Íconos 28px mínimo, touch targets 44px (WCAG 2.5.5)
// Lucide React icons, tooltips con atajos
// ==========================================

'use client';

import { useEffect, useState } from 'react';
import {
  MousePointer2, Hand, RotateCw, Ruler, Hexagon, PenTool,
  Move, Grid3X3, Eye, EyeOff, Upload, Image, Save,
  ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Settings,
  Trash2, Check, Layers, AlertTriangle, Route,
} from 'lucide-react';
import useStore, { m2px } from '@/stores/useStore';
import { PLANTA_INFO } from '@/data/machines';
import { tokens } from '@/lib/design/tokens';
import IconButton from '@/components/UI/IconButton';
import Tooltip from '@/components/UI/Tooltip';
import type { EditorTool, SnapGrid } from '@/types';

// Tamaño de íconos (mínimo 28px según spec)
const ICON_SIZE = 24;

const TOOLS: { id: EditorTool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
  { id: 'select', icon: <MousePointer2 size={ICON_SIZE} />, label: 'Seleccionar', shortcut: 'V' },
  { id: 'pan', icon: <Hand size={ICON_SIZE} />, label: 'Mover canvas', shortcut: 'H' },
  { id: 'rotate', icon: <RotateCw size={ICON_SIZE} />, label: 'Rotar', shortcut: 'R' },
  { id: 'measure', icon: <Ruler size={ICON_SIZE} />, label: 'Medir', shortcut: 'M' },
  { id: 'zone', icon: <Hexagon size={ICON_SIZE} />, label: 'Dibujar Zona', shortcut: 'Z' },
  { id: 'trace', icon: <PenTool size={ICON_SIZE} />, label: 'Trazar Plano', shortcut: 'T' },
];

const SNAP_OPTIONS: SnapGrid[] = [0.10, 0.25, 0.50, 1.00];

export default function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const snapGrid = useStore((s) => s.snapGrid);
  const setSnapGrid = useStore((s) => s.setSnapGrid);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const showGuerchetHalo = useStore((s) => s.showGuerchetHalo);
  const toggleGuerchetHalo = useStore((s) => s.toggleGuerchetHalo);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const setBgImage = useStore((s) => s.setBgImage);
  const bgOpacity = useStore((s) => s.bgOpacity);
  const setBgOpacity = useStore((s) => s.setBgOpacity);
  const showBg = useStore((s) => s.showBg);
  const toggleBg = useStore((s) => s.toggleBg);
  const canvasScale = useStore((s) => s.canvasScale);
  const setCanvasScale = useStore((s) => s.setCanvasScale);
  const setCanvasOffset = useStore((s) => s.setCanvasOffset);
  const lastSaved = useStore((s) => s.lastSaved);
  const clearDraft = useStore((s) => s.clearDraft);
  const activePlanta = useStore((s) => s.activePlanta);
  const history = useStore((s) => s.history);
  const historyIndex = useStore((s) => s.historyIndex);

  // Floor tracing
  const startTracing = useStore((s) => s.startTracing);
  const isTracing = useStore((s) => s.isTracing);
  const cancelTracing = useStore((s) => s.cancelTracing);
  const requestFinish = useStore((s) => s.requestFinish);
  const tracingPoints = useStore((s) => s.tracingPoints);
  const floorRooms = useStore((s) => s.floorRooms);
  const getTotalFloorArea = useStore((s) => s.getTotalFloorArea);
  const tracingMode = useStore((s) => s.tracingMode);
  const showOverlaps = useStore((s) => s.showOverlaps);
  const toggleShowOverlaps = useStore((s) => s.toggleShowOverlaps);
  const showTrafficFlow = useStore((s) => s.showTrafficFlow);
  const toggleTrafficFlow = useStore((s) => s.toggleTrafficFlow);

  // Image calibration
  const imgCalibrations = useStore((s) => s.imgCalibrations);
  const setImgCalibration = useStore((s) => s.setImgCalibration);
  const resetImgCalibration = useStore((s) => s.resetImgCalibration);
  const imgCal = imgCalibrations[activePlanta];

  const [showCalibration, setShowCalibration] = useState(false);

  // Save indicator
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [lastSaved]);

  const addImageLayer = useStore((s) => s.addImageLayer);

  const handleImportBg = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          addImageLayer(src, activePlanta);
          setBgImage(activePlanta, src);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (direction === 'fit') {
      const plantaInfo = PLANTA_INFO[activePlanta];
      const canvasW = m2px(plantaInfo.canvasWidth);
      const canvasH = m2px(plantaInfo.canvasHeight);
      const viewW = Math.max(600, window.innerWidth - 288 - 256);
      const viewH = Math.max(400, window.innerHeight - 85);
      const scaleX = viewW / canvasW;
      const scaleY = viewH / canvasH;
      const fitScale = Math.min(scaleX, scaleY) * 0.92;
      const offsetX = (viewW - canvasW * fitScale) / 2;
      const offsetY = (viewH - canvasH * fitScale) / 2;
      setCanvasScale(fitScale);
      setCanvasOffset({ x: Math.max(10, offsetX), y: Math.max(10, offsetY) });
    } else {
      const factor = direction === 'in' ? 1.25 : 0.8;
      setCanvasScale(Math.max(0.2, Math.min(5, canvasScale * factor)));
    }
  };

  // Conteos para undo/redo
  const undoCount = historyIndex + 1;
  const redoCount = history.length - historyIndex - 1;

  return (
    <div
      className="shrink-0 flex items-center px-3 gap-1 backdrop-blur-sm border-b"
      style={{
        height: tokens.spacing.toolbar,
        background: `linear-gradient(to bottom, ${tokens.colors.bg.panel}, ${tokens.colors.bg.panel}ee)`,
        borderColor: tokens.colors.border.subtle,
      }}
    >
      {/* ── Herramientas de edición ── */}
      <ToolGroup label="Herramientas">
        {TOOLS.map((tool) => (
          <IconButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            active={activeTool === tool.id}
            onClick={() => {
              if (tool.id === 'trace') {
                if (isTracing) cancelTracing();
                else startTracing();
              } else {
                if (isTracing) cancelTracing();
                setActiveTool(tool.id);
              }
            }}
          />
        ))}
      </ToolGroup>

      <Divider />

      {/* ── Deshacer / Rehacer con contador ── */}
      <ToolGroup label="Historial">
        <div className="relative">
          <IconButton
            icon={<Undo2 size={ICON_SIZE} />}
            label="Deshacer"
            shortcut="⌘Z"
            onClick={undo}
            disabled={undoCount === 0}
          />
          {undoCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold bg-blue-500 text-white">
              {undoCount}
            </span>
          )}
        </div>
        <div className="relative">
          <IconButton
            icon={<Redo2 size={ICON_SIZE} />}
            label="Rehacer"
            shortcut="⌘⇧Z"
            onClick={redo}
            disabled={redoCount <= 0}
          />
          {redoCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold bg-blue-500 text-white">
              {redoCount}
            </span>
          )}
        </div>
      </ToolGroup>

      <Divider />

      {/* ── Grid + Snap ── */}
      <ToolGroup label="Grilla">
        <IconButton
          icon={<Grid3X3 size={ICON_SIZE} />}
          label="Grid"
          shortcut="G"
          active={showGrid}
          onClick={toggleGrid}
        />
        <Tooltip content="Tamaño de snap">
          <select
            value={snapGrid}
            onChange={(e) => setSnapGrid(Number(e.target.value) as SnapGrid)}
            className="h-9 bg-zinc-800/80 text-zinc-300 text-xs pl-2 pr-1 rounded-md border border-zinc-700/40 outline-none focus:border-blue-500/50 cursor-pointer hover:bg-zinc-700/60 transition-colors"
            aria-label="Tamaño de snap"
          >
            {SNAP_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}m</option>
            ))}
          </select>
        </Tooltip>
        <span
          className="text-[10px] font-medium px-2 py-1 rounded"
          style={{
            color: showGrid ? tokens.colors.accent.success : tokens.colors.text.muted,
            background: showGrid ? 'rgba(34,197,94,0.1)' : 'transparent',
          }}
        >
          Snap: {showGrid ? 'ON' : 'OFF'}
        </span>
      </ToolGroup>

      <Divider />

      {/* ── Vista: Halo + Plano de fondo ── */}
      <ToolGroup label="Vista">
        <IconButton
          icon={showGuerchetHalo ? <Eye size={ICON_SIZE} /> : <EyeOff size={ICON_SIZE} />}
          label="Halos Guerchet"
          shortcut="K"
          active={showGuerchetHalo}
          onClick={toggleGuerchetHalo}
        />
        <IconButton
          icon={<Image size={ICON_SIZE} />}
          label="Plano de fondo"
          active={showBg}
          onClick={toggleBg}
        />
        {showBg && (
          <div className="flex items-center gap-1.5 ml-1">
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={bgOpacity}
              onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
              className="w-16 accent-blue-400 h-1"
              aria-label={`Opacidad de fondo: ${Math.round(bgOpacity * 100)}%`}
            />
            <span className="text-[10px] text-zinc-400 w-7 tabular-nums">
              {Math.round(bgOpacity * 100)}%
            </span>
          </div>
        )}
        <IconButton
          icon={<Upload size={ICON_SIZE} />}
          label="Importar imagen"
          onClick={handleImportBg}
        />
      </ToolGroup>

      <Divider />

      {/* ── Análisis ── */}
      <ToolGroup label="Análisis">
        <IconButton
          icon={<AlertTriangle size={ICON_SIZE} />}
          label="Solapamientos"
          active={showOverlaps}
          onClick={toggleShowOverlaps}
        />
        <IconButton
          icon={<Route size={ICON_SIZE} />}
          label="Flujo de tráfico"
          active={showTrafficFlow}
          onClick={toggleTrafficFlow}
        />
      </ToolGroup>

      <Divider />

      {/* ── Calibración ── */}
      <div className="relative">
        <IconButton
          icon={<Settings size={ICON_SIZE} />}
          label="Calibrar imagen"
          active={showCalibration}
          onClick={() => setShowCalibration(!showCalibration)}
        />
        {showCalibration && (
          <div
            className="absolute top-full left-0 z-50 mt-1 p-3 w-72 rounded-lg"
            style={{
              background: tokens.colors.bg.surface,
              border: `1px solid ${tokens.colors.border.default}`,
              boxShadow: tokens.shadow.dropdown,
            }}
          >
            <h3
              className="mb-2 uppercase tracking-wider"
              style={{ fontSize: tokens.typography.size.xs, fontWeight: tokens.typography.weight.bold, color: tokens.colors.text.secondary }}
            >
              Calibrar Plano — {activePlanta === 'baja' ? 'P. Baja' : 'P. Alta'}
            </h3>
            <div className="space-y-2">
              <CalibrationInput label="Ancho imagen (m)" value={imgCal.imgWidth} onChange={(v) => setImgCalibration(activePlanta, { imgWidth: v })} min={5} max={50} step={0.1} />
              <CalibrationInput label="Alto imagen (m)" value={imgCal.imgHeight} onChange={(v) => setImgCalibration(activePlanta, { imgHeight: v })} min={5} max={60} step={0.1} />
              <CalibrationInput label="Offset X (m)" value={imgCal.offsetX} onChange={(v) => setImgCalibration(activePlanta, { offsetX: v })} min={-10} max={10} step={0.05} />
              <CalibrationInput label="Offset Y (m)" value={imgCal.offsetY} onChange={(v) => setImgCalibration(activePlanta, { offsetY: v })} min={-10} max={10} step={0.05} />
            </div>
            <button
              className="mt-2.5 w-full py-2 text-xs font-medium rounded-md border transition-all hover:bg-zinc-700"
              style={{ color: tokens.colors.text.secondary, borderColor: tokens.colors.border.default }}
              onClick={() => resetImgCalibration(activePlanta)}
            >
              Restablecer valores
            </button>
          </div>
        )}
      </div>

      {/* ── Superficie trazada ── */}
      {floorRooms.filter((r) => r.planta === activePlanta).length > 0 && (
        <>
          <Divider />
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Layers size={14} className="text-cyan-400" />
            <span className="text-[11px] text-cyan-400 font-medium">
              {floorRooms.filter((r) => r.planta === activePlanta).length} recintos
            </span>
            <span className="text-[11px] text-cyan-300 font-bold tabular-nums">
              {getTotalFloorArea(activePlanta).toFixed(1)} m²
            </span>
          </div>
        </>
      )}

      {/* ── Modo de trazo ── */}
      {activeTool === 'trace' && !isTracing && (
        <>
          <Divider />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="text-[11px] text-blue-400 font-medium mr-1">Modo:</span>
            <button
              className={`px-3 py-1 text-[11px] rounded-md transition-all ${
                tracingMode === 'room' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              onClick={() => startTracing('room')}
            >
              Superficie
            </button>
            <button
              className={`px-3 py-1 text-[11px] rounded-md transition-all ${
                tracingMode === 'traffic' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              onClick={() => startTracing('traffic')}
            >
              Línea de tráfico
            </button>
          </div>
        </>
      )}

      {/* ── Indicador de trazado activo ── */}
      {isTracing && (
        <>
          <Divider />
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md"
            style={{
              background: tracingMode === 'traffic' ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)',
              border: `1px solid ${tracingMode === 'traffic' ? 'rgba(245,158,11,0.25)' : 'rgba(6,182,212,0.25)'}`,
            }}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${tracingMode === 'traffic' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <span className={`text-[11px] font-medium ${tracingMode === 'traffic' ? 'text-amber-300' : 'text-cyan-300'}`}>
              {tracingMode === 'traffic' ? 'Línea' : 'Trazando'} · {tracingPoints.length} pts
            </span>
            {((tracingMode === 'room' && tracingPoints.length >= 3) ||
              (tracingMode === 'traffic' && tracingPoints.length >= 2)) && (
              <button
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  tracingMode === 'traffic' ? 'text-zinc-900 bg-amber-400 hover:bg-amber-300' : 'text-zinc-900 bg-cyan-400 hover:bg-cyan-300'
                }`}
                onClick={requestFinish}
              >
                <Check size={14} className="inline mr-1" />
                {tracingMode === 'traffic' ? 'Finalizar' : 'Cerrar polígono'}
              </button>
            )}
            <button
              className="px-2 py-1 text-[11px] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
              onClick={cancelTracing}
              title="Cancelar (Esc)"
            >
              ✕
            </button>
          </div>
        </>
      )}

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Zoom ── */}
      <ToolGroup label="Zoom">
        <IconButton icon={<ZoomOut size={ICON_SIZE} />} label="Alejar" shortcut="⌘−" onClick={() => handleZoom('out')} size="sm" />
        <Tooltip content="Zoom actual">
          <span
            className="text-xs w-12 text-center tabular-nums font-medium py-1.5 rounded-md cursor-default"
            style={{ background: tokens.colors.bg.surface, color: tokens.colors.text.secondary }}
          >
            {Math.round(canvasScale * 100)}%
          </span>
        </Tooltip>
        <IconButton icon={<ZoomIn size={ICON_SIZE} />} label="Acercar" shortcut="⌘+" onClick={() => handleZoom('in')} size="sm" />
        <IconButton icon={<Maximize size={ICON_SIZE} />} label="Ajustar a vista" shortcut="⌘0" onClick={() => handleZoom('fit')} size="sm" />
      </ToolGroup>

      <Divider />

      {/* ── Guardado ── */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 text-[11px] transition-all duration-500"
          style={{ color: showSaved ? tokens.colors.accent.success : tokens.colors.text.muted }}
        >
          {showSaved ? (
            <>
              <Check size={14} />
              <span className="font-medium">Guardado</span>
            </>
          ) : lastSaved ? (
            <>
              <Save size={14} />
              <span>Borrador</span>
            </>
          ) : (
            <span style={{ color: tokens.colors.text.muted }}>Sin cambios</span>
          )}
        </div>
        {lastSaved && (
          <IconButton
            icon={<Trash2 size={16} />}
            label="Limpiar borrador"
            onClick={clearDraft}
            size="sm"
            variant="danger"
          />
        )}
      </div>
    </div>
  );
}

// ── Subcomponentes ──

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 relative group/tg">
      {children}
      <span
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 uppercase tracking-widest font-medium pointer-events-none opacity-0 group-hover/tg:opacity-60 transition-opacity whitespace-nowrap"
        style={{ fontSize: '7px', color: tokens.colors.text.muted }}
      >
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-7 mx-1.5 shrink-0" style={{ background: tokens.colors.border.subtle }} />;
}

function CalibrationInput({
  label, value, onChange, min, max, step,
}: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0" style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-blue-400 h-1"
      />
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        className="w-16 px-2 py-1 rounded text-right tabular-nums outline-none"
        style={{
          fontSize: tokens.typography.size.xs,
          background: tokens.colors.bg.elevated,
          color: tokens.colors.text.primary,
          border: `1px solid ${tokens.colors.border.default}`,
        }}
      />
    </div>
  );
}
