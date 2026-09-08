// ==========================================
// Panel de Propiedades (lado derecho)
// Edita propiedades de la capa seleccionada:
// - ImageLayer: X, Y, Width, Height, Rotation
// - FloorRoom: vértices, nombre, color, área
// + Lista de medidas personalizadas (líneas guía)
// ==========================================

import { useState } from 'react';
import { FiX, FiTrash2, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';
import useStore, { px2m, m2px } from '../../stores/useStore';
import type { FloorRoom, CustomMeasure } from '../../types';

const ROOM_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export default function PropertiesPanel() {
  const selectedImageId = useStore((s) => s.selectedImageId);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const imageLayers = useStore((s) => s.imageLayers);
  const floorRooms = useStore((s) => s.floorRooms);
  const updateImageLayer = useStore((s) => s.updateImageLayer);
  const setSelectedImage = useStore((s) => s.setSelectedImage);
  const setSelectedRoom = useStore((s) => s.setSelectedRoom);
  const updateRoomVertex = useStore((s) => s.updateRoomVertex);
  const renameFloorRoom = useStore((s) => s.renameFloorRoom);
  const setRoomColor = useStore((s) => s.setRoomColor);
  const getRoomArea = useStore((s) => s.getRoomArea);
  const activePlanta = useStore((s) => s.activePlanta);
  const customMeasures = useStore((s) => s.customMeasures);
  const addCustomMeasure = useStore((s) => s.addCustomMeasure);
  const removeCustomMeasure = useStore((s) => s.removeCustomMeasure);
  const updateCustomMeasure = useStore((s) => s.updateCustomMeasure);
  const toggleCustomMeasureVisibility = useStore((s) => s.toggleCustomMeasureVisibility);

  const selectedImage = imageLayers.find((img) => img.id === selectedImageId);
  const selectedRoom = floorRooms.find((r) => r.id === selectedRoomId);
  const plantaMeasures = customMeasures.filter((m) => m.planta === activePlanta);

  const hasSelection = !!selectedImage || !!selectedRoom;
  const hasMeasures = plantaMeasures.length > 0;

  // If nothing selected and no measures, don't render
  if (!hasSelection && !hasMeasures) return null;

  return (
    <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full">
      {/* Selected layer properties */}
      {selectedImage && (
        <ImageProperties
          image={selectedImage}
          onUpdate={(updates) => updateImageLayer(selectedImage.id, updates)}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {selectedRoom && (
        <RoomProperties
          room={selectedRoom}
          getRoomArea={getRoomArea}
          onVertexUpdate={(idx, x, y) => updateRoomVertex(selectedRoom.id, idx, m2px(x), m2px(y))}
          onRename={(name) => renameFloorRoom(selectedRoom.id, name)}
          onColorChange={(color) => setRoomColor(selectedRoom.id, color)}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* Custom measures list (always visible when measures exist) */}
      {hasMeasures && (
        <MeasuresPanel
          measures={plantaMeasures}
          planta={activePlanta}
          onRemove={removeCustomMeasure}
          onUpdate={updateCustomMeasure}
          onToggleVisibility={toggleCustomMeasureVisibility}
          onAdd={addCustomMeasure}
        />
      )}
    </div>
  );
}

// ---- Image Properties ----
function ImageProperties({
  image,
  onUpdate,
  onClose,
}: {
  image: { id: string; x: number; y: number; width: number; height: number; rotation: number; planta: string };
  onUpdate: (updates: Record<string, number>) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          🔧 Propiedades — Imagen
        </h3>
        <button
          className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-all"
          onClick={onClose}
        >
          <FiX />
        </button>
      </div>
      <div className="overflow-y-auto p-4 space-y-4 border-b border-zinc-800">
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Nombre
          </label>
          <div className="mt-1 text-sm text-zinc-300 font-medium">
            Fondo — {image.planta === 'baja' ? 'P. Baja' : 'P. Alta'}
          </div>
        </div>
        <PropertyField
          label="Posición X (metros)"
          value={px2m(image.x)}
          onChange={(val) => onUpdate({ x: m2px(val) })}
          step={0.05}
        />
        <PropertyField
          label="Posición Y (metros)"
          value={px2m(image.y)}
          onChange={(val) => onUpdate({ y: m2px(val) })}
          step={0.05}
        />
        <PropertyField
          label="Ancho (metros)"
          value={px2m(image.width)}
          onChange={(val) => onUpdate({ width: Math.max(50, m2px(val)) })}
          step={0.1}
        />
        <PropertyField
          label="Alto (metros)"
          value={px2m(image.height)}
          onChange={(val) => onUpdate({ height: Math.max(50, m2px(val)) })}
          step={0.1}
        />
        <PropertyField
          label="Rotación (grados)"
          value={image.rotation}
          onChange={(val) => onUpdate({ rotation: val % 360 })}
          step={1}
          min={0}
          max={360}
        />
      </div>
    </>
  );
}

// ---- Room Properties ----
function RoomProperties({
  room,
  getRoomArea,
  onVertexUpdate,
  onRename,
  onColorChange,
  onClose,
}: {
  room: FloorRoom;
  getRoomArea: (r: FloorRoom) => number;
  onVertexUpdate: (idx: number, x: number, y: number) => void;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onClose: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(room.name);
  const area = getRoomArea(room);

  return (
    <>
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          🔧 Propiedades — Recinto
        </h3>
        <button
          className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-all"
          onClick={onClose}
        >
          <FiX />
        </button>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 border-b border-zinc-800 max-h-[50vh]">
        {/* Name */}
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Nombre
          </label>
          {editingName ? (
            <input
              className="mt-1 w-full bg-zinc-800 border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-500/30"
              value={nameValue}
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={() => {
                if (nameValue.trim()) onRename(nameValue.trim());
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (nameValue.trim()) onRename(nameValue.trim());
                  setEditingName(false);
                }
                if (e.key === 'Escape') setEditingName(false);
                e.stopPropagation();
              }}
            />
          ) : (
            <div
              className="mt-1 text-sm text-zinc-300 font-medium cursor-pointer hover:text-cyan-400 transition-colors"
              onClick={() => { setNameValue(room.name); setEditingName(true); }}
              title="Click para editar nombre"
            >
              {room.name} ✏️
            </div>
          )}
        </div>

        {/* Color picker */}
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Color
          </label>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {ROOM_COLORS.map((c) => (
              <button
                key={c}
                className={`w-5 h-5 rounded-md ring-1 transition-all ${
                  room.color === c
                    ? 'ring-white ring-2 scale-110'
                    : 'ring-white/10 hover:ring-white/40'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange(c)}
              />
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
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Coordenadas de vértices (metros)
          </label>
          <div className="mt-1.5 space-y-1">
            {room.points.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-600 w-5 text-right shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 flex gap-1">
                  <input
                    type="number"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-zinc-200 outline-none focus:border-cyan-500 tabular-nums"
                    value={px2m(p.x).toFixed(2)}
                    step={0.05}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onVertexUpdate(i, val, px2m(p.y));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    title={`X del vértice ${i + 1}`}
                  />
                  <input
                    type="number"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-zinc-200 outline-none focus:border-cyan-500 tabular-nums"
                    value={px2m(p.y).toFixed(2)}
                    step={0.05}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onVertexUpdate(i, px2m(p.x), val);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    title={`Y del vértice ${i + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 text-[9px] text-zinc-600">
            Tip: arrastra los vértices en el canvas o edita aquí
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Measures Panel (sidebar table) ----
function MeasuresPanel({
  measures,
  planta,
  onRemove,
  onUpdate,
  onToggleVisibility,
  onAdd,
}: {
  measures: CustomMeasure[];
  planta: 'baja' | 'alta';
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CustomMeasure>) => void;
  onToggleVisibility: (id: string) => void;
  onAdd: (axis: 'x' | 'y', value: number, label: string, planta: 'baja' | 'alta') => void;
}) {
  const [addAxis, setAddAxis] = useState<'x' | 'y'>('x');
  const [addValue, setAddValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);

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
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          📐 Líneas Guía
        </h3>
        <button
          className="p-1 text-cyan-400 hover:bg-cyan-500/15 rounded transition-all"
          onClick={() => setShowAdd(!showAdd)}
          title="Agregar línea guía"
        >
          <FiPlus className="text-xs" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Quick add form */}
        {showAdd && (
          <div className="bg-zinc-800/50 rounded-lg p-2.5 border border-zinc-700/50 space-y-2">
            <div className="flex gap-1">
              <button
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${
                  addAxis === 'x' ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400'
                }`}
                onClick={() => setAddAxis('x')}
              >
                Vertical (X)
              </button>
              <button
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${
                  addAxis === 'y' ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-400'
                }`}
                onClick={() => setAddAxis('y')}
              >
                Horizontal (Y)
              </button>
            </div>
            <div className="flex gap-1">
              <input
                type="number"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none focus:border-cyan-500"
                placeholder="metros"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  e.stopPropagation();
                }}
                step={0.05}
              />
              <button
                className="px-2 py-1 text-[10px] font-bold text-zinc-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-all"
                onClick={handleAdd}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Vertical (X) lines */}
        {xMeasures.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Verticales (X)
            </label>
            <div className="mt-1 space-y-0.5">
              {xMeasures.map((m) => (
                <MeasureRow
                  key={m.id}
                  measure={m}
                  color="emerald"
                  onRemove={() => onRemove(m.id)}
                  onUpdate={(updates) => onUpdate(m.id, updates)}
                  onToggleVisibility={() => onToggleVisibility(m.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Horizontal (Y) lines */}
        {yMeasures.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Horizontales (Y)
            </label>
            <div className="mt-1 space-y-0.5">
              {yMeasures.map((m) => (
                <MeasureRow
                  key={m.id}
                  measure={m}
                  color="cyan"
                  onRemove={() => onRemove(m.id)}
                  onUpdate={(updates) => onUpdate(m.id, updates)}
                  onToggleVisibility={() => onToggleVisibility(m.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-zinc-800/30 rounded-lg p-2 text-[9px] text-zinc-500 space-y-0.5">
          <div>Ctrl+Click en canvas → colocar línea guía</div>
          <div>Edita el valor para reposicionar la línea</div>
        </div>
      </div>
    </div>
  );
}

// ---- Single measure row ----
function MeasureRow({
  measure,
  color,
  onRemove,
  onUpdate,
  onToggleVisibility,
}: {
  measure: CustomMeasure;
  color: 'emerald' | 'cyan';
  onRemove: () => void;
  onUpdate: (updates: Partial<CustomMeasure>) => void;
  onToggleVisibility: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(measure.value.toFixed(2));

  const commitEdit = () => {
    const val = parseFloat(editVal.trim());
    if (!isNaN(val) && val >= 0) {
      onUpdate({ value: val, label: `${val.toFixed(2)}m` });
    }
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-zinc-800/60 transition-all ${
      !measure.visible ? 'opacity-40' : ''
    }`}>
      <button
        className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded transition-all shrink-0"
        onClick={onToggleVisibility}
        title={measure.visible ? 'Ocultar' : 'Mostrar'}
      >
        {measure.visible ? <FiEye className="text-[10px]" /> : <FiEyeOff className="text-[10px]" />}
      </button>

      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'
      }`} />

      {editing ? (
        <input
          type="number"
          className="flex-1 bg-zinc-800 border border-cyan-500/50 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 outline-none tabular-nums"
          value={editVal}
          autoFocus
          step={0.05}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
            e.stopPropagation();
          }}
        />
      ) : (
        <span
          className="flex-1 text-[11px] text-zinc-300 tabular-nums cursor-pointer hover:text-cyan-400 transition-colors"
          onClick={() => { setEditVal(measure.value.toFixed(2)); setEditing(true); }}
          title="Click para editar"
        >
          {measure.label}
        </span>
      )}

      <button
        className="p-0.5 text-zinc-600 hover:text-red-400 rounded transition-all shrink-0"
        onClick={onRemove}
        title="Eliminar"
      >
        <FiTrash2 className="text-[9px]" />
      </button>
    </div>
  );
}

// ---- Helper Component ----
function PropertyField({
  label,
  value,
  onChange,
  step = 0.1,
  min = -1000,
  max = 1000,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 tabular-nums"
        value={value.toFixed(2)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => e.stopPropagation()}
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
}
