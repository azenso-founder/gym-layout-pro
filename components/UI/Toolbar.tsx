// ==========================================
// Barra de herramientas — Rediseño visual
// Agrupaciones claras, iconos + labels, indicador de guardado
// ==========================================

import { useEffect, useState } from 'react';
import {
  FiMousePointer, FiMove, FiRotateCw, FiMaximize, FiGrid,
  FiEye, FiEyeOff, FiUpload, FiImage, FiSave, FiTrash2,
  FiZoomIn, FiZoomOut, FiCheck, FiEdit3, FiSettings,
} from 'react-icons/fi';
import { BiUndo, BiRedo, BiRuler } from 'react-icons/bi';
import { MdOutlineHexagon } from 'react-icons/md';
import useStore, { m2px } from '@/stores/useStore';
import { PLANTA_INFO } from '@/data/machines';
import type { EditorTool, SnapGrid } from '@/types';

const TOOLS: { id: EditorTool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
  { id: 'select', icon: <FiMousePointer />, label: 'Seleccionar', shortcut: 'V' },
  { id: 'move', icon: <FiMove />, label: 'Mover', shortcut: 'M' },
  { id: 'rotate', icon: <FiRotateCw />, label: 'Rotar', shortcut: 'R' },
  { id: 'measure', icon: <BiRuler />, label: 'Medir' },
  { id: 'zone', icon: <MdOutlineHexagon />, label: 'Zona' },
  { id: 'trace', icon: <FiEdit3 />, label: 'Trazar Plano', shortcut: 'T' },
  { id: 'pan', icon: <FiMaximize />, label: 'Pan', shortcut: 'H' },
];

const SNAP_OPTIONS: SnapGrid[] = [0.25, 0.50, 1.00];

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

  // Save indicator animation
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
          // Both: add as layer AND set as bg for legacy support
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

  return (
    <div className="h-11 bg-gradient-to-b from-zinc-900 to-zinc-900/95 border-b border-zinc-800/80 flex items-center px-2 gap-1 shrink-0 backdrop-blur-sm">

      {/* ── Herramientas de edición ── */}
      <ToolGroup label="Herramientas">
        {TOOLS.map((tool) => (
          <ToolBtn
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            active={activeTool === tool.id}
            onClick={() => {
              if (tool.id === 'trace') {
                if (isTracing) {
                  cancelTracing();
                } else {
                  startTracing();
                }
              } else {
                if (isTracing) cancelTracing();
                setActiveTool(tool.id);
              }
            }}
            color={tool.id === 'trace' ? 'blue' : undefined}
          />
        ))}
      </ToolGroup>

      <Divider />

      {/* ── Deshacer / Rehacer ── */}
      <ToolGroup label="Historial">
        <ToolBtn icon={<BiUndo />} label="Deshacer" shortcut="⌘Z" onClick={undo} />
        <ToolBtn icon={<BiRedo />} label="Rehacer" shortcut="⌘⇧Z" onClick={redo} />
      </ToolGroup>

      <Divider />

      {/* ── Grid + Snap ── */}
      <ToolGroup label="Grilla">
        <ToolBtn
          icon={<FiGrid />}
          label="Grid"
          active={showGrid}
          onClick={toggleGrid}
          color="blue"
        />
        <select
          value={snapGrid}
          onChange={(e) => setSnapGrid(Number(e.target.value) as SnapGrid)}
          className="bg-zinc-800/80 text-zinc-300 text-[10px] pl-1.5 pr-0.5 py-1.5 rounded-md border border-zinc-700/40 outline-none focus:border-orange-500/50 cursor-pointer hover:bg-zinc-700/60 transition-colors"
          title="Tamaño de snap"
        >
          {SNAP_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}m</option>
          ))}
        </select>
      </ToolGroup>

      <Divider />

      {/* ── Vista: Halo + Fondo ── */}
      <ToolGroup label="Vista">
        <ToolBtn
          icon={showGuerchetHalo ? <FiEye /> : <FiEyeOff />}
          label="Halo"
          active={showGuerchetHalo}
          onClick={toggleGuerchetHalo}
          color="emerald"
        />
        <ToolBtn
          icon={<FiImage />}
          label="Plano"
          active={showBg}
          onClick={toggleBg}
          color="purple"
        />
        {showBg && (
          <div className="flex items-center gap-1 ml-0.5">
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={bgOpacity}
              onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
              className="w-14 accent-purple-400 h-1"
              title={`Opacidad: ${Math.round(bgOpacity * 100)}%`}
            />
            <span className="text-[9px] text-zinc-500 w-6 tabular-nums">
              {Math.round(bgOpacity * 100)}%
            </span>
          </div>
        )}
        <ToolBtn
          icon={<FiUpload />}
          label="Importar"
          onClick={handleImportBg}
        />
      </ToolGroup>

      <Divider />

      {/* ── Análisis: Solapamientos + Flujo ── */}
      <ToolGroup label="Análisis">
        <ToolBtn
          icon={showOverlaps ? <FiEye /> : <FiEyeOff />}
          label="Solapamientos"
          active={showOverlaps}
          onClick={toggleShowOverlaps}
          color="emerald"
        />
        <ToolBtn
          icon={showTrafficFlow ? <FiEye /> : <FiEyeOff />}
          label="Flujo"
          active={showTrafficFlow}
          onClick={toggleTrafficFlow}
          color="blue"
        />
      </ToolGroup>

      <Divider />

      {/* ── Calibración de imagen ── */}
      <ToolGroup label="Calibrar">
        <ToolBtn
          icon={<FiSettings />}
          label="Calibrar Imagen"
          active={showCalibration}
          onClick={() => setShowCalibration(!showCalibration)}
          color="purple"
        />
        {showCalibration && (
          <div className="absolute top-11 left-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-2xl w-64">
            <h3 className="text-[11px] font-bold text-zinc-300 mb-2 uppercase tracking-wider">
              Calibrar Plano — {activePlanta === 'baja' ? 'P. Baja' : 'P. Alta'}
            </h3>
            <div className="space-y-2">
              <CalibrationInput
                label="Ancho imagen (m)"
                value={imgCal.imgWidth}
                onChange={(v) => setImgCalibration(activePlanta, { imgWidth: v })}
                min={5} max={50} step={0.1}
              />
              <CalibrationInput
                label="Alto imagen (m)"
                value={imgCal.imgHeight}
                onChange={(v) => setImgCalibration(activePlanta, { imgHeight: v })}
                min={5} max={60} step={0.1}
              />
              <CalibrationInput
                label="Offset X (m)"
                value={imgCal.offsetX}
                onChange={(v) => setImgCalibration(activePlanta, { offsetX: v })}
                min={-10} max={10} step={0.05}
              />
              <CalibrationInput
                label="Offset Y (m)"
                value={imgCal.offsetY}
                onChange={(v) => setImgCalibration(activePlanta, { offsetY: v })}
                min={-10} max={10} step={0.05}
              />
            </div>
            <button
              className="mt-2.5 w-full py-1.5 text-[10px] font-medium text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700 border border-zinc-700 transition-all"
              onClick={() => resetImgCalibration(activePlanta)}
            >
              Restablecer valores
            </button>
          </div>
        )}
      </ToolGroup>

      {/* ── Superficie trazada ── */}
      {floorRooms.filter((r) => r.planta === activePlanta).length > 0 && (
        <>
          <Divider />
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-cyan-500/10 rounded-md border border-cyan-500/20">
            <span className="text-[10px] text-cyan-400 font-medium">
              {floorRooms.filter((r) => r.planta === activePlanta).length} recintos
            </span>
            <span className="text-[10px] text-cyan-300 font-bold tabular-nums">
              {getTotalFloorArea(activePlanta).toFixed(1)} m²
            </span>
          </div>
        </>
      )}

      {/* ── Modo de trazo (before starting) ── */}
      {activeTool === 'trace' && !isTracing && (
        <>
          <Divider />
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">
            <span className="text-[10px] text-blue-400 font-medium mr-1">Modo:</span>
            <button
              className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                tracingMode === 'room'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              onClick={() => startTracing('room')}
            >
              Superficie
            </button>
            <button
              className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                tracingMode === 'traffic'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              onClick={() => startTracing('traffic')}
            >
              Línea de tráfico
            </button>
          </div>
        </>
      )}

      {/* ── Tracing active indicator ── */}
      {isTracing && (
        <>
          <Divider />
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
            tracingMode === 'traffic'
              ? 'bg-amber-500/15 border-amber-500/30'
              : 'bg-cyan-500/15 border-cyan-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              tracingMode === 'traffic' ? 'bg-amber-400' : 'bg-cyan-400'
            }`} />
            <span className={`text-[10px] font-medium ${
              tracingMode === 'traffic' ? 'text-amber-300' : 'text-cyan-300'
            }`}>
              {tracingMode === 'traffic' ? 'Línea de tráfico' : 'Trazando'} · {tracingPoints.length} pts
            </span>
            {((tracingMode === 'room' && tracingPoints.length >= 3) ||
              (tracingMode === 'traffic' && tracingPoints.length >= 2)) && (
              <button
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  tracingMode === 'traffic'
                    ? 'text-zinc-900 bg-amber-400 hover:bg-amber-300'
                    : 'text-zinc-900 bg-cyan-400 hover:bg-cyan-300'
                }`}
                onClick={requestFinish}
                title={tracingMode === 'traffic' ? 'Finalizar línea (Enter)' : 'Cerrar polígono y nombrar (Enter)'}
              >
                {tracingMode === 'traffic' ? '✓ Finalizar línea' : '✓ Cerrar polígono'}
              </button>
            )}
            <button
              className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
              onClick={cancelTracing}
              title="Cancelar trazado (Esc)"
            >
              ✕
            </button>
          </div>
        </>
      )}

      <Divider />

      {/* ── Zoom ── */}
      <ToolGroup label="Zoom">
        <ToolBtn icon={<FiZoomOut />} label="Alejar" onClick={() => handleZoom('out')} />
        <span className="text-[11px] text-zinc-400 w-10 text-center tabular-nums font-medium bg-zinc-800/50 py-1 rounded-md">
          {Math.round(canvasScale * 100)}%
        </span>
        <ToolBtn icon={<FiZoomIn />} label="Acercar" onClick={() => handleZoom('in')} />
        <button
          className="px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700/60 border border-zinc-700/40 hover:border-zinc-600/60 transition-all"
          onClick={() => handleZoom('fit')}
          title="Ajustar a ventana"
        >
          Fit
        </button>
      </ToolGroup>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Guardado automático ── */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-[10px] transition-all duration-500 ${
          showSaved ? 'text-emerald-400' : 'text-zinc-600'
        }`}>
          {showSaved ? (
            <>
              <FiCheck className="text-xs" />
              <span className="font-medium">Guardado</span>
            </>
          ) : lastSaved ? (
            <>
              <FiSave className="text-xs" />
              <span>Borrador</span>
            </>
          ) : (
            <span className="text-zinc-700">Sin cambios</span>
          )}
        </div>
        {lastSaved && (
          <button
            className="p-1 text-zinc-600 hover:text-red-400 rounded hover:bg-red-500/10 transition-all"
            onClick={clearDraft}
            title="Limpiar borrador guardado y empezar de cero"
          >
            <FiTrash2 className="text-[11px]" />
          </button>
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
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] text-zinc-700 uppercase tracking-widest font-medium pointer-events-none opacity-0 group-hover/tg:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-zinc-800/80 mx-1 shrink-0" />;
}

function CalibrationInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-purple-400 h-1"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className="w-14 bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-1 rounded border border-zinc-700 outline-none focus:border-purple-500 tabular-nums text-right"
      />
    </div>
  );
}

function ToolBtn({
  icon,
  label,
  shortcut,
  active,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick: () => void;
  color?: 'blue' | 'emerald' | 'purple';
}) {
  const colorMap = {
    blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
    purple: 'bg-purple-500/15 text-purple-400 ring-purple-500/20',
  };

  const activeCls = color && active
    ? colorMap[color]
    : active
      ? 'bg-orange-500/15 text-orange-400 ring-orange-500/20'
      : '';

  return (
    <button
      className={`p-1.5 rounded-md text-sm transition-all ${
        active
          ? `${activeCls} ring-1`
          : 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200'
      }`}
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      {icon}
    </button>
  );
}
