// ==========================================
// Panel de recintos trazados
// Muestra lista de polígonos, áreas y totales
// ==========================================

import { FiTrash2, FiEdit3, FiPlus } from 'react-icons/fi';
import useStore from '../../stores/useStore';

export default function FloorPanel() {
  const activePlanta = useStore((s) => s.activePlanta);
  const floorRooms = useStore((s) => s.floorRooms);
  const removeFloorRoom = useStore((s) => s.removeFloorRoom);
  const renameFloorRoom = useStore((s) => s.renameFloorRoom);
  const getRoomArea = useStore((s) => s.getRoomArea);
  const getTotalFloorArea = useStore((s) => s.getTotalFloorArea);
  const startTracing = useStore((s) => s.startTracing);
  const isTracing = useStore((s) => s.isTracing);
  const getSuperficieDisponible = useStore((s) => s.getSuperficieDisponible);

  const plantaRooms = floorRooms.filter((r) => r.planta === activePlanta);
  const totalArea = getTotalFloorArea(activePlanta);
  const supOriginal = getSuperficieDisponible(activePlanta);

  if (plantaRooms.length === 0 && !isTracing) return null;

  return (
    <div className="absolute bottom-3 right-3 bg-zinc-900/95 backdrop-blur-md rounded-xl border border-zinc-700/60 shadow-2xl w-64 max-h-80 overflow-hidden flex flex-col z-10">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
          📐 Recintos Trazados
        </h3>
        <button
          className="p-1 text-cyan-400 hover:bg-cyan-500/15 rounded transition-all"
          onClick={startTracing}
          title="Trazar nuevo recinto"
          disabled={isTracing}
        >
          <FiPlus className="text-xs" />
        </button>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-1">
        {plantaRooms.map((room) => {
          const area = getRoomArea(room);
          return (
            <div
              key={room.id}
              className="flex items-center gap-2 mx-1.5 px-2 py-1.5 rounded-md hover:bg-zinc-800/60 group transition-all"
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: room.color }}
              />

              {/* Name + area */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-300 truncate">{room.name}</div>
                <div className="text-[10px] text-zinc-500 tabular-nums">
                  {area.toFixed(1)} m² · {room.points.length} vértices
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-700 transition-all"
                  onClick={() => {
                    const name = prompt('Nuevo nombre:', room.name);
                    if (name) renameFloorRoom(room.id, name);
                  }}
                  title="Renombrar"
                >
                  <FiEdit3 className="text-[10px]" />
                </button>
                <button
                  className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-all"
                  onClick={() => removeFloorRoom(room.id)}
                  title="Eliminar"
                >
                  <FiTrash2 className="text-[10px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      {plantaRooms.length > 0 && (
        <div className="px-3 py-2 border-t border-zinc-800 space-y-1">
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
    </div>
  );
}
