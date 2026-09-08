// ==========================================
// Panel derecho — Propiedades unificado
// Muestra: Máquinas, Imágenes, Recintos, Medidas
// ==========================================

import { useState } from 'react';
import { FiLock, FiUnlock, FiCopy, FiTrash2, FiRotateCw, FiInfo, FiX, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';
import useStore, { px2m, m2px } from '../../stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../types';
import { calcularGuerchet } from '../../engine/guerchet';
import type { FloorRoom, CustomMeasure } from '../../types';

const ROOM_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedMachineId);
  const selectedIds = useStore((s) => s.selectedMachineIds);
  const machines = useStore((s) => s.machines);
  const rotateMachine = useStore((s) => s.rotateMachine);
  const removeMachine = useStore((s) => s.removeMachine);
  const duplicateMachine = useStore((s) => s.duplicateMachine);
  const toggleLockMachine = useStore((s) => s.toggleLockMachine);
  const updateMachineProp = useStore((s) => s.updateMachineProp);
  const bulkRotate = useStore((s) => s.bulkRotate);
  const bulkRemove = useStore((s) => s.bulkRemove);
  const bulkToggleLock = useStore((s) => s.bulkToggleLock);
  const bulkUpdateProp = useStore((s) => s.bulkUpdateProp);
  const activePlanta = useStore((s) => s.activePlanta);
  const getSuperficieUsada = useStore((s) => s.getSuperficieUsada);
  const getSuperficieDisponible = useStore((s) => s.getSuperficieDisponible);

  // Image layer
  const selectedImageId = useStore((s) => s.selectedImageId);
  const imageLayers = useStore((s) => s.imageLayers);
  const updateImageLayer = useStore((s) => s.updateImageLayer);
  const setSelectedImage = useStore((s) => s.setSelectedImage);

  // Room
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const floorRooms = useStore((s) => s.floorRooms);
  const updateRoomVertex = useStore((s) => s.updateRoomVertex);
  const renameFloorRoom = useStore((s) => s.renameFloorRoom);
  const setRoomColor = useStore((s) => s.setRoomColor);
  const getRoomArea = useStore((s) => s.getRoomArea);
  const setSelectedRoom = useStore((s) => s.setSelectedRoom);

  // Custom measures
  const customMeasures = useStore((s) => s.customMeasures);
  const addCustomMeasure = useStore((s) => s.addCustomMeasure);
  const removeCustomMeasure = useStore((s) => s.removeCustomMeasure);
  const updateCustomMeasure = useStore((s) => s.updateCustomMeasure);
  const toggleCustomMeasureVisibility = useStore((s) => s.toggleCustomMeasureVisibility);

  const isMulti = selectedIds.length > 1;
  const machine = machines.find((m) => m.id === selectedId);
  const selectedMachines = machines.filter((m) => selectedIds.includes(m.id));
  const selectedImage = imageLayers.find((img) => img.id === selectedImageId);
  const selectedRoom = floorRooms.find((r) => r.id === selectedRoomId);
  const plantaMeasures = customMeasures.filter((m) => m.planta === activePlanta);

  // ---- Image Layer selected ----
  if (selectedImage) {
    return (
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            🔧 Imagen — Propiedades
          </h3>
          <button className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-all" onClick={() => setSelectedImage(null)}>
            <FiX className="text-xs" />
          </button>
        </div>
        <div className="p-3 space-y-3 border-b border-zinc-800">
          <div className="text-sm text-zinc-300 font-medium">
            Fondo — {selectedImage.planta === 'baja' ? 'P. Baja' : 'P. Alta'}
          </div>
          <PropField label="Posición X (m)" value={px2m(selectedImage.x)}
            onChange={(v) => updateImageLayer(selectedImage.id, { x: m2px(v) })} step={0.05} />
          <PropField label="Posición Y (m)" value={px2m(selectedImage.y)}
            onChange={(v) => updateImageLayer(selectedImage.id, { y: m2px(v) })} step={0.05} />
          <PropField label="Ancho (m)" value={px2m(selectedImage.width)}
            onChange={(v) => updateImageLayer(selectedImage.id, { width: Math.max(50, m2px(v)) })} step={0.1} />
          <PropField label="Alto (m)" value={px2m(selectedImage.height)}
            onChange={(v) => updateImageLayer(selectedImage.id, { height: Math.max(50, m2px(v)) })} step={0.1} />
          <PropField label="Rotación (°)" value={selectedImage.rotation}
            onChange={(v) => updateImageLayer(selectedImage.id, { rotation: v % 360 })} step={1} min={0} max={360} />
        </div>
        {/* Measures section */}
        {plantaMeasures.length > 0 && (
          <MeasuresSection measures={plantaMeasures} planta={activePlanta}
            onRemove={removeCustomMeasure} onUpdate={updateCustomMeasure}
            onToggleVisibility={toggleCustomMeasureVisibility} onAdd={addCustomMeasure} />
        )}
      </div>
    );
  }

  // ---- Room selected ----
  if (selectedRoom) {
    return (
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            🔧 Recinto — Propiedades
          </h3>
          <button className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-all" onClick={() => setSelectedRoom(null)}>
            <FiX className="text-xs" />
          </button>
        </div>
        <RoomPropertiesContent
          room={selectedRoom}
          getRoomArea={getRoomArea}
          onVertexUpdate={(idx, x, y) => updateRoomVertex(selectedRoom.id, idx, m2px(x), m2px(y))}
          onRename={(name) => renameFloorRoom(selectedRoom.id, name)}
          onColorChange={(color) => setRoomColor(selectedRoom.id, color)}
        />
        {/* Measures section */}
        {plantaMeasures.length > 0 && (
          <MeasuresSection measures={plantaMeasures} planta={activePlanta}
            onRemove={removeCustomMeasure} onUpdate={updateCustomMeasure}
            onToggleVisibility={toggleCustomMeasureVisibility} onAdd={addCustomMeasure} />
        )}
      </div>
    );
  }

  // ---- Multi-select machines ----
  if (isMulti && machine) {
    const categories = [...new Set(selectedMachines.map((m) => m.categoria))];
    const allK = [...new Set(selectedMachines.map((m) => m.K))];
    const allN = [...new Set(selectedMachines.map((m) => m.N))];
    const totalSt = selectedMachines.reduce((sum, m) => {
      const Ss = m.largo * m.ancho;
      const Sg = Ss * m.N;
      const Se = m.K * (Ss + Sg);
      return sum + Ss + Sg + Se;
    }, 0);

    return (
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex -space-x-1">
              {categories.slice(0, 4).map((cat, i) => (
                <div key={cat} className="w-3 h-3 rounded-full border border-zinc-900"
                  style={{ backgroundColor: CATEGORY_COLORS[cat], zIndex: 4 - i }} />
              ))}
            </div>
            <h3 className="text-sm font-semibold text-orange-400">{selectedIds.length} máquinas</h3>
          </div>
          <span className="text-[10px] text-zinc-500">{categories.map((c) => CATEGORY_LABELS[c]).join(', ')}</span>
        </div>
        <div className="flex gap-1 p-2 border-b border-zinc-800">
          <ActionBtn icon={<FiRotateCw />} label="90°" onClick={() => bulkRotate(90)} title="Rotar todas 90°" />
          <ActionBtn icon={<FiLock />} onClick={bulkToggleLock} title="Lock/unlock todas" />
          <ActionBtn icon={<FiTrash2 />} onClick={bulkRemove} title="Eliminar todas" danger />
        </div>
        <Section title="Edición masiva — Guerchet">
          <p className="text-[10px] text-zinc-500 mb-2">Cambiar K o N actualiza todas las seleccionadas</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">
                N (lados) {allN.length > 1 && <span className="text-amber-400">mixto</span>}
              </label>
              <input type="number" placeholder={allN.length > 1 ? 'Mixto' : String(allN[0])}
                defaultValue={allN.length === 1 ? allN[0] : ''}
                onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) bulkUpdateProp({ N: v }); }}
                step="1" className="w-full bg-zinc-800/60 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700/50 outline-none focus:border-orange-500/50 tabular-nums" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">
                K {allK.length > 1 && <span className="text-amber-400">mixto</span>}
              </label>
              <input type="number" placeholder={allK.length > 1 ? 'Mixto' : String(allK[0])}
                defaultValue={allK.length === 1 ? allK[0] : ''}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) bulkUpdateProp({ K: v }); }}
                step="0.01" className="w-full bg-zinc-800/60 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700/50 outline-none focus:border-orange-500/50 tabular-nums" />
            </div>
          </div>
        </Section>
        <Section title="Resumen de selección">
          <div className="space-y-1.5 text-xs">
            <StatRow label="St total" value={`${totalSt.toFixed(2)} m²`} />
            <StatRow label="Categorías" value={String(categories.length)} />
            <StatRow label="Bloqueadas" value={String(selectedMachines.filter((m) => m.locked).length)} />
          </div>
        </Section>
        <Section title="Seleccionadas">
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {selectedMachines.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded hover:bg-zinc-800/40">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[m.categoria] }} />
                <span className="text-zinc-400 truncate flex-1">{m.nombre}</span>
                {m.locked && <span className="text-[9px]">🔒</span>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  // ---- Single machine selected ----
  if (machine && selectedIds.length === 1) {
    const guerchet = calcularGuerchet(machine.largo, machine.ancho, machine.N, machine.K);
    const color = CATEGORY_COLORS[machine.categoria];

    return (
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
            <h3 className="text-sm font-semibold text-zinc-200 truncate">{machine.nombre}</h3>
          </div>
          <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/50 inline-block">
            {CATEGORY_LABELS[machine.categoria]}
          </span>
        </div>
        <div className="flex gap-1 p-2 border-b border-zinc-800">
          <ActionBtn icon={<FiRotateCw />} label="90°" onClick={() => rotateMachine(machine.id, 90)} title="Rotar 90° (R)" />
          <ActionBtn icon={<FiCopy />} onClick={() => duplicateMachine(machine.id)} title="Duplicar (D)" />
          <ActionBtn icon={machine.locked ? <FiLock /> : <FiUnlock />}
            onClick={() => toggleLockMachine(machine.id)}
            title={machine.locked ? 'Desbloquear (L)' : 'Bloquear (L)'} active={machine.locked} />
          <ActionBtn icon={<FiTrash2 />} onClick={() => removeMachine(machine.id)} title="Eliminar (Del)" danger />
        </div>
        <Section title="Dimensiones">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Largo (m)" value={machine.largo} onChange={(v) => updateMachineProp(machine.id, { largo: v })} />
            <Field label="Ancho (m)" value={machine.ancho} onChange={(v) => updateMachineProp(machine.id, { ancho: v })} />
            <Field label="Alto (m)" value={machine.alto} onChange={(v) => updateMachineProp(machine.id, { alto: v })} />
            <Field label="Rotación°" value={machine.rotation} readOnly />
          </div>
        </Section>
        <Section title="Guerchet">
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <Field label="N (lados)" value={machine.N} onChange={(v) => updateMachineProp(machine.id, { N: Math.max(0, Math.round(v)) })} />
            <Field label="K" value={machine.K} onChange={(v) => updateMachineProp(machine.id, { K: Math.max(0.01, v) })} />
          </div>
          <div className="space-y-1 bg-zinc-800/30 rounded-lg p-2">
            <GRow label="Ss (estática)" value={guerchet.Ss} color="#60A5FA" />
            <GRow label="Sg (gravitacional)" value={guerchet.Sg} color="#34D399" />
            <GRow label="Se (evolución)" value={guerchet.Se} color="#FBBF24" />
            <div className="border-t border-zinc-700/50 pt-1 mt-1">
              <GRow label="St (total)" value={guerchet.St} color="#F87171" bold />
            </div>
          </div>
        </Section>
        <Section title="Tiempo servicio (min)">
          <div className="grid grid-cols-3 gap-1">
            <Field label="Mín" value={machine.tiempoServicio.min}
              onChange={(v) => updateMachineProp(machine.id, { tiempoServicio: { ...machine.tiempoServicio, min: v } })} />
            <Field label="Moda" value={machine.tiempoServicio.moda}
              onChange={(v) => updateMachineProp(machine.id, { tiempoServicio: { ...machine.tiempoServicio, moda: v } })} />
            <Field label="Máx" value={machine.tiempoServicio.max}
              onChange={(v) => updateMachineProp(machine.id, { tiempoServicio: { ...machine.tiempoServicio, max: v } })} />
          </div>
        </Section>
        <Section title="Posición">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between py-1 px-2 rounded bg-zinc-800/30">
              <span className="text-zinc-500">X</span>
              <span className="text-zinc-300 tabular-nums">{(machine.x / 50).toFixed(2)}m</span>
            </div>
            <div className="flex justify-between py-1 px-2 rounded bg-zinc-800/30">
              <span className="text-zinc-500">Y</span>
              <span className="text-zinc-300 tabular-nums">{(machine.y / 50).toFixed(2)}m</span>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  // ---- No selection: overview + measures ----
  const placed = machines.filter((m) => m.planta === activePlanta && m.placed);
  const supUsada = getSuperficieUsada(activePlanta);
  const supDisponible = getSuperficieDisponible(activePlanta);

  return (
    <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col shrink-0">
      <div className="p-3 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Propiedades</h3>
      </div>
      <div className="flex flex-col items-center justify-center px-4 text-center py-4">
        <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center mb-3">
          <FiInfo className="text-zinc-600 text-lg" />
        </div>
        <p className="text-xs text-zinc-500 mb-4">Selecciona una máquina para editar</p>
        <div className="w-full space-y-2 text-xs">
          <StatRow label="Máquinas colocadas" value={String(placed.length)} />
          <StatRow label="Superficie usada" value={`${supUsada} m²`} />
          <StatRow label="Disponible" value={`${supDisponible} m²`} />
        </div>
      </div>

      {/* Measures section (always visible when measures exist) */}
      {plantaMeasures.length > 0 && (
        <MeasuresSection measures={plantaMeasures} planta={activePlanta}
          onRemove={removeCustomMeasure} onUpdate={updateCustomMeasure}
          onToggleVisibility={toggleCustomMeasureVisibility} onAdd={addCustomMeasure} />
      )}

      <div className="mt-auto p-3 border-t border-zinc-800">
        <div className="text-[10px] text-zinc-600 space-y-0.5">
          <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">R</kbd> Rotar · <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">D</kbd> Duplicar</p>
          <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Del</kbd> Eliminar · <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">L</kbd> Lock</p>
          <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl+Click</kbd> Línea guía</p>
        </div>
      </div>
    </div>
  );
}

// ======== Measures Section ========
function MeasuresSection({
  measures, planta, onRemove, onUpdate, onToggleVisibility, onAdd,
}: {
  measures: CustomMeasure[];
  planta: 'baja' | 'alta';
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CustomMeasure>) => void;
  onToggleVisibility: (id: string) => void;
  onAdd: (axis: 'x' | 'y', value: number, label: string, planta: 'baja' | 'alta') => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [addAxis, setAddAxis] = useState<'x' | 'y'>('x');
  const [addValue, setAddValue] = useState('');

  const xMeasures = measures.filter((m) => m.axis === 'x');
  const yMeasures = measures.filter((m) => m.axis === 'y');

  const handleAdd = () => {
    const val = parseFloat(addValue.trim());
    if (!isNaN(val) && val >= 0) {
      onAdd(addAxis, val, `${val.toFixed(2)}m`, planta);
      setAddValue('');
    }
  };

  return (
    <div className="border-t border-zinc-800">
      <div className="px-3 py-2 flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">📐 Líneas Guía</h4>
        <button className="p-0.5 text-cyan-400 hover:bg-cyan-500/15 rounded transition-all"
          onClick={() => setShowAdd(!showAdd)} title="Agregar línea guía">
          <FiPlus className="text-[10px]" />
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {showAdd && (
          <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/50 space-y-1.5">
            <div className="flex gap-1">
              <button className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${
                addAxis === 'x' ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}
                onClick={() => setAddAxis('x')}>X (Vert)</button>
              <button className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${
                addAxis === 'y' ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}
                onClick={() => setAddAxis('y')}>Y (Horiz)</button>
            </div>
            <div className="flex gap-1">
              <input type="number" className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none focus:border-cyan-500"
                placeholder="metros" value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); e.stopPropagation(); }}
                step={0.05} />
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-all"
                onClick={handleAdd}>+</button>
            </div>
          </div>
        )}

        {xMeasures.length > 0 && (
          <div>
            <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verticales (X)
            </label>
            <div className="mt-0.5 space-y-0">
              {xMeasures.map((m) => (
                <MeasureRow key={m.id} measure={m} color="emerald"
                  onRemove={() => onRemove(m.id)}
                  onUpdate={(u) => onUpdate(m.id, u)}
                  onToggle={() => onToggleVisibility(m.id)} />
              ))}
            </div>
          </div>
        )}

        {yMeasures.length > 0 && (
          <div>
            <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Horizontales (Y)
            </label>
            <div className="mt-0.5 space-y-0">
              {yMeasures.map((m) => (
                <MeasureRow key={m.id} measure={m} color="cyan"
                  onRemove={() => onRemove(m.id)}
                  onUpdate={(u) => onUpdate(m.id, u)}
                  onToggle={() => onToggleVisibility(m.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="text-[9px] text-zinc-600">
          Ctrl+Click en canvas → nueva guía
        </div>
      </div>
    </div>
  );
}

function MeasureRow({ measure, color, onRemove, onUpdate, onToggle }: {
  measure: CustomMeasure; color: 'emerald' | 'cyan';
  onRemove: () => void; onUpdate: (u: Partial<CustomMeasure>) => void; onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(measure.value.toFixed(2));

  const commit = () => {
    const val = parseFloat(editVal.trim());
    if (!isNaN(val) && val >= 0) onUpdate({ value: val, label: `${val.toFixed(2)}m` });
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-1 px-1 py-0.5 rounded hover:bg-zinc-800/60 transition-all ${!measure.visible ? 'opacity-40' : ''}`}>
      <button className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded transition-all shrink-0" onClick={onToggle}>
        {measure.visible ? <FiEye className="text-[9px]" /> : <FiEyeOff className="text-[9px]" />}
      </button>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
      {editing ? (
        <input type="number" className="flex-1 bg-zinc-800 border border-cyan-500/50 rounded px-1 py-0.5 text-[11px] text-zinc-200 outline-none tabular-nums"
          value={editVal} autoFocus step={0.05}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); e.stopPropagation(); }} />
      ) : (
        <span className="flex-1 text-[11px] text-zinc-300 tabular-nums cursor-pointer hover:text-cyan-400 transition-colors"
          onClick={() => { setEditVal(measure.value.toFixed(2)); setEditing(true); }}>
          {measure.label}
        </span>
      )}
      <button className="p-0.5 text-zinc-600 hover:text-red-400 rounded transition-all shrink-0" onClick={onRemove}>
        <FiTrash2 className="text-[9px]" />
      </button>
    </div>
  );
}

// ======== Room Properties Content ========
function RoomPropertiesContent({ room, getRoomArea, onVertexUpdate, onRename, onColorChange }: {
  room: FloorRoom; getRoomArea: (r: FloorRoom) => number;
  onVertexUpdate: (idx: number, x: number, y: number) => void;
  onRename: (name: string) => void; onColorChange: (color: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(room.name);
  const area = getRoomArea(room);

  return (
    <div className="overflow-y-auto p-3 space-y-3 border-b border-zinc-800 max-h-[50vh]">
      {/* Name */}
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nombre</label>
        {editingName ? (
          <input className="mt-1 w-full bg-zinc-800 border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-500/30"
            value={nameValue} autoFocus
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => { if (nameValue.trim()) onRename(nameValue.trim()); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { if (nameValue.trim()) onRename(nameValue.trim()); setEditingName(false); }
              if (e.key === 'Escape') setEditingName(false);
              e.stopPropagation();
            }} />
        ) : (
          <div className="mt-1 text-sm text-zinc-300 font-medium cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={() => { setNameValue(room.name); setEditingName(true); }}>
            {room.name} ✏️
          </div>
        )}
      </div>
      {/* Color */}
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Color</label>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {ROOM_COLORS.map((c) => (
            <button key={c}
              className={`w-5 h-5 rounded-md ring-1 transition-all ${room.color === c ? 'ring-white ring-2 scale-110' : 'ring-white/10 hover:ring-white/40'}`}
              style={{ backgroundColor: c }} onClick={() => onColorChange(c)} />
          ))}
        </div>
      </div>
      {/* Area */}
      <div className="bg-zinc-800/50 rounded-lg p-2.5 border border-zinc-700/50">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-zinc-500 uppercase">Superficie</span>
          <span className="text-sm font-bold text-cyan-400 tabular-nums">{area.toFixed(2)} m²</span>
        </div>
        <div className="flex justify-between items-baseline mt-1">
          <span className="text-[10px] text-zinc-500 uppercase">Vértices</span>
          <span className="text-xs text-zinc-300 tabular-nums">{room.points.length}</span>
        </div>
      </div>
      {/* Vertices table */}
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Coordenadas (metros)</label>
        <div className="mt-1.5 space-y-1">
          {room.points.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-600 w-4 text-right shrink-0 tabular-nums">{i + 1}</span>
              <input type="number" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 outline-none focus:border-cyan-500 tabular-nums"
                value={px2m(p.x).toFixed(2)} step={0.05}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onVertexUpdate(i, v, px2m(p.y)); }}
                onKeyDown={(e) => e.stopPropagation()} />
              <input type="number" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 outline-none focus:border-cyan-500 tabular-nums"
                value={px2m(p.y).toFixed(2)} step={0.05}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onVertexUpdate(i, px2m(p.x), v); }}
                onKeyDown={(e) => e.stopPropagation()} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======== Helpers ========

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 border-b border-zinc-800">
      <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-medium">{title}</h4>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 px-2 rounded bg-zinc-800/40">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, title, active, danger }: {
  icon: React.ReactNode; label?: string; onClick: () => void; title: string; active?: boolean; danger?: boolean;
}) {
  let cls = 'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-all ';
  if (danger) cls += 'bg-zinc-800/60 text-red-400 hover:bg-red-500/15';
  else if (active) cls += 'bg-amber-500/15 text-amber-400';
  else cls += 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60';
  return (
    <button className={cls} onClick={onClick} title={title}>
      <span className="text-xs">{icon}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

function Field({ label, value, onChange, readOnly }: {
  label: string; value: number; onChange?: (v: number) => void; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-zinc-500 block mb-0.5">{label}</label>
      <input type="number" value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => e.stopPropagation()}
        readOnly={readOnly} step="0.01"
        className={`w-full bg-zinc-800/60 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700/50 outline-none tabular-nums ${
          readOnly ? 'opacity-50' : 'focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20'}`} />
    </div>
  );
}

function PropField({ label, value, onChange, step = 0.1, min = -1000, max = 1000 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
      <input type="number" className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 tabular-nums"
        value={value.toFixed(2)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => e.stopPropagation()}
        step={step} min={min} max={max} />
    </div>
  );
}

function GRow({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-xs ${bold ? 'font-semibold' : ''}`}>
      <span className="text-zinc-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-zinc-200 tabular-nums">{value.toFixed(3)} m²</span>
    </div>
  );
}
