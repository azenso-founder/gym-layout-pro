// ==========================================
// Panel de capas (recintos trazados)
// Estilo Photoshop: visibilidad, bloqueo,
// color, selección, renombrar, eliminar
// ==========================================

import { useState, useRef, useEffect } from 'react';
import {
  FiTrash2,
  FiEdit3,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import useStore from '../../stores/useStore';

const ROOM_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export default function FloorPanel() {
  const activePlanta = useStore((s) => s.activePlanta);
  const floorRooms = useStore((s) => s.floorRooms);
  const imageLayers = useStore((s) => s.imageLayers);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectedImageId = useStore((s) => s.selectedImageId);
  const setSelectedRoom = useStore((s) => s.setSelectedRoom);
  const setSelectedImage = useStore((s) => s.setSelectedImage);
  const removeFloorRoom = useStore((s) => s.removeFloorRoom);
  const removeImageLayer = useStore((s) => s.removeImageLayer);
  const renameFloorRoom = useStore((s) => s.renameFloorRoom);
  const toggleRoomVisibility = useStore((s) => s.toggleRoomVisibility);
  const toggleRoomLock = useStore((s) => s.toggleRoomLock);
  const toggleImageVisibility = useStore((s) => s.toggleImageVisibility);
  const toggleImageLock = useStore((s) => s.toggleImageLock);
  const setRoomColor = useStore((s) => s.setRoomColor);
  const getRoomArea = useStore((s) => s.getRoomArea);
  const getTotalFloorArea = useStore((s) => s.getTotalFloorArea);
  const startTracing = useStore((s) => s.startTracing);
  const isTracing = useStore((s) => s.isTracing);
  const getSuperficieDisponible = useStore((s) => s.getSuperficieDisponible);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const plantaRooms = floorRooms.filter((r) => r.planta === activePlanta);
  const plantaImages = imageLayers.filter((img) => img.planta === activePlanta);
  const totalArea = getTotalFloorArea(activePlanta);
  const supOriginal = getSuperficieDisponible(activePlanta);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (room: { id: string; name: string }) => {
    setEditingId(room.id);
    setEditName(room.name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      renameFloorRoom(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const cycleColor = (roomId: string, currentColor: string) => {
    const idx = ROOM_COLORS.indexOf(currentColor);
    const next = ROOM_COLORS[(idx + 1) % ROOM_COLORS.length];
    setRoomColor(roomId, next);
  };

  if (plantaRooms.length === 0 && plantaImages.length === 0 && !isTracing) return null;

  return (
    <div className="absolute bottom-3 right-3 bg-zinc-900/95 backdrop-blur-md rounded-xl border border-zinc-700/60 shadow-2xl w-72 max-h-96 overflow-hidden flex flex-col z-10">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:text-zinc-100 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <FiChevronUp className="text-[10px]" /> : <FiChevronDown className="text-[10px]" />}
          📐 Capas — Recintos
        </button>
        <button
          className="p-1 text-cyan-400 hover:bg-cyan-500/15 rounded transition-all disabled:opacity-30"
          onClick={startTracing}
          title="Trazar nuevo recinto"
          disabled={isTracing}
        >
          <FiPlus className="text-xs" />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Image layers + Room list */}
          <div className="flex-1 overflow-y-auto py-0.5">
            {/* Background Images */}
            {plantaImages.map((img) => {
              const isSelected = selectedImageId === img.id;
              return (
                <div
                  key={img.id}
                  className={`flex items-center gap-1.5 mx-1 px-1.5 py-1.5 rounded-md cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30'
                      : 'hover:bg-zinc-800/60 border border-transparent'
                    }
                    ${!img.visible ? 'opacity-40' : ''}
                  `}
                  onClick={() => setSelectedImage(isSelected ? null : img.id)}
                >
                  <button
                    className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded transition-all shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleImageVisibility(img.id); }}
                    title={img.visible ? 'Ocultar' : 'Mostrar'}
                  >
                    {img.visible
                      ? <FiEye className="text-[11px]" />
                      : <FiEyeOff className="text-[11px]" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate leading-tight">Fondo</div>
                    <div className="text-[10px] text-zinc-500 tabular-nums leading-tight">
                      {(img.width / 50).toFixed(1)}m × {(img.height / 50).toFixed(1)}m
                    </div>
                  </div>
                  <button
                    className={`p-0.5 rounded transition-all shrink-0 ${
                      img.locked ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                    onClick={(e) => { e.stopPropagation(); toggleImageLock(img.id); }}
                    title={img.locked ? 'Desbloquear' : 'Bloquear'}
                  >
                    {img.locked
                      ? <FiLock className="text-[11px]" />
                      : <FiUnlock className="text-[11px]" />
                    }
                  </button>
                  <button
                    className="p-0.5 text-zinc-600 hover:text-red-400 rounded transition-all shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImageLayer(img.id);
                      if (selectedImageId === img.id) setSelectedImage(null);
                    }}
                    title="Eliminar"
                  >
                    <FiTrash2 className="text-[10px]" />
                  </button>
                </div>
              );
            })}

            {plantaRooms.map((room) => {
              const area = getRoomArea(room);
              const isSelected = selectedRoomId === room.id;
              const isEditing = editingId === room.id;

              return (
                <div
                  key={room.id}
                  className={`flex items-center gap-1.5 mx-1 px-1.5 py-1.5 rounded-md cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30'
                      : 'hover:bg-zinc-800/60 border border-transparent'
                    }
                    ${!room.visible ? 'opacity-40' : ''}
                  `}
                  onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                >
                  {/* Visibility toggle */}
                  <button
                    className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded transition-all shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleRoomVisibility(room.id); }}
                    title={room.visible ? 'Ocultar' : 'Mostrar'}
                  >
                    {room.visible
                      ? <FiEye className="text-[11px]" />
                      : <FiEyeOff className="text-[11px]" />
                    }
                  </button>

                  {/* Color swatch (click to cycle) */}
                  <button
                    className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/10 hover:ring-white/40 transition-all"
                    style={{ backgroundColor: room.color }}
                    onClick={(e) => { e.stopPropagation(); cycleColor(room.id, room.color); }}
                    title="Cambiar color"
                  />

                  {/* Name + area */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className="w-full bg-zinc-800 text-xs text-zinc-100 px-1 py-0.5 rounded border border-cyan-500/50 outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div className="text-xs text-zinc-300 truncate leading-tight">{room.name}</div>
                        <div className="text-[10px] text-zinc-500 tabular-nums leading-tight">
                          {area.toFixed(1)} m² · {room.points.length} vértices
                        </div>
                      </>
                    )}
                  </div>

                  {/* Lock toggle */}
                  <button
                    className={`p-0.5 rounded transition-all shrink-0 ${
                      room.locked ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                    onClick={(e) => { e.stopPropagation(); toggleRoomLock(room.id); }}
                    title={room.locked ? 'Desbloquear' : 'Bloquear'}
                  >
                    {room.locked
                      ? <FiLock className="text-[11px]" />
                      : <FiUnlock className="text-[11px]" />
                    }
                  </button>

                  {/* Rename */}
                  <button
                    className="p-0.5 text-zinc-600 hover:text-zinc-200 rounded transition-all shrink-0 opacity-0 group-hover:opacity-100"
                    style={{ opacity: isSelected ? 1 : undefined }}
                    onClick={(e) => { e.stopPropagation(); startRename(room); }}
                    title="Renombrar"
                  >
                    <FiEdit3 className="text-[10px]" />
                  </button>

                  {/* Delete */}
                  <button
                    className="p-0.5 text-zinc-600 hover:text-red-400 rounded transition-all shrink-0"
                    style={{ opacity: isSelected ? 1 : undefined }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFloorRoom(room.id);
                      if (selectedRoomId === room.id) setSelectedRoom(null);
                    }}
                    title="Eliminar"
                  >
                    <FiTrash2 className="text-[10px]" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          {plantaRooms.length > 0 && (
            <div className="px-3 py-2 border-t border-zinc-800 space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-zinc-500">Superficie trazada</span>
                <span className="text-xs font-bold text-cyan-400 tabular-nums">
                  {totalArea.toFixed(1)} m²
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-zinc-500">Superficie original</span>
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  {supOriginal} m²
                </span>
              </div>
              {Math.abs(totalArea - supOriginal) > 0.1 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-zinc-500">Diferencia</span>
                  <span className={`text-[11px] font-medium tabular-nums ${
                    totalArea > supOriginal ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {totalArea > supOriginal ? '+' : ''}{(totalArea - supOriginal).toFixed(1)} m²
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
