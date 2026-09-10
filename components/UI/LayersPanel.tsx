// ==========================================
// Panel de Capas — Estilo Photoshop
// Muestra capas con sus elementos agrupados
// ==========================================

import { useState } from 'react';
import {
  FiEye, FiEyeOff, FiLock, FiUnlock, FiTrash2,
  FiChevronDown, FiChevronRight, FiPlus, FiLayers,
  FiImage,
} from 'react-icons/fi';
import { BiSquare } from 'react-icons/bi';
import { MdOutlineRoute } from 'react-icons/md';
import useStore from '@/stores/useStore';
import type { CanvasLayer } from '@/types';

export default function LayersPanel() {
  // Store selectors
  const canvasLayers = useStore((s) => s.canvasLayers);
  const activeLayerId = useStore((s) => s.activeLayerId);
  const setActiveLayer = useStore((s) => s.setActiveLayer);
  const addCanvasLayer = useStore((s) => s.addCanvasLayer);
  const removeCanvasLayer = useStore((s) => s.removeCanvasLayer);
  const toggleCanvasLayerVisibility = useStore((s) => s.toggleCanvasLayerVisibility);
  const toggleCanvasLayerLock = useStore((s) => s.toggleCanvasLayerLock);
  const assignMachinesToLayer = useStore((s) => s.assignMachinesToLayer);
  const assignRoomToLayer = useStore((s) => s.assignRoomToLayer);
  const assignTrafficLineToLayer = useStore((s) => s.assignTrafficLineToLayer);
  const machines = useStore((s) => s.machines);
  const floorRooms = useStore((s) => s.floorRooms);
  const trafficLines = useStore((s) => s.trafficLines);
  const imageLayers = useStore((s) => s.imageLayers);
  const activePlanta = useStore((s) => s.activePlanta);
  const removeMachine = useStore((s) => s.removeMachine);
  const removeFloorRoom = useStore((s) => s.removeFloorRoom);
  const removeTrafficLine = useStore((s) => s.removeTrafficLine);
  const removeImageLayer = useStore((s) => s.removeImageLayer);
  const toggleRoomVisibility = useStore((s) => s.toggleRoomVisibility);
  const toggleTrafficLineVisibility = useStore((s) => s.toggleTrafficLineVisibility);
  const toggleImageVisibility = useStore((s) => s.toggleImageVisibility);

  // Expanded layers
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({ default: true });
  const [showNewLayerInput, setShowNewLayerInput] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddLayer = () => {
    if (newLayerName.trim()) {
      addCanvasLayer(newLayerName.trim());
      setNewLayerName('');
      setShowNewLayerInput(false);
    }
  };

  // Filter elements for current planta
  const plantaMachines = machines.filter((m) => m.planta === activePlanta && m.placed);
  const plantaRooms = floorRooms.filter((r) => r.planta === activePlanta);
  const plantaTrafficLines = trafficLines.filter((tl) => tl.planta === activePlanta);
  const plantaImages = imageLayers.filter((img) => img.planta === activePlanta);

  return (
    <div className="w-56 bg-zinc-900/95 border-l border-zinc-800 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FiLayers className="text-zinc-500 text-xs" />
          <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Capas</h3>
        </div>
        <button
          className="p-1 text-zinc-500 hover:text-orange-400 hover:bg-zinc-800 rounded transition-all"
          onClick={() => setShowNewLayerInput(true)}
          title="Nueva capa"
        >
          <FiPlus className="text-xs" />
        </button>
      </div>

      {/* New layer input */}
      {showNewLayerInput && (
        <div className="p-2 border-b border-zinc-800 flex gap-1">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLayer();
              if (e.key === 'Escape') setShowNewLayerInput(false);
              e.stopPropagation();
            }}
            placeholder="Nombre de capa..."
            className="flex-1 bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1 rounded border border-zinc-700 outline-none focus:border-orange-500"
            autoFocus
          />
          <button
            className="px-2 py-1 text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-500 rounded transition-all"
            onClick={handleAddLayer}
          >
            +
          </button>
        </div>
      )}

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {[...canvasLayers].sort((a, b) => a.order - b.order).map((layer) => {
          const isActive = layer.id === activeLayerId;
          const isExpanded = expandedLayers[layer.id] ?? false;

          // Elements belonging to this layer
          const layerMachines = plantaMachines.filter((m) => (m.layer || 'default') === layer.id);
          const layerRooms = plantaRooms.filter((r) => (r.layer || 'default') === layer.id);
          const layerTraffic = plantaTrafficLines.filter((tl) => tl.layer === layer.id);
          const layerImages = plantaImages;
          const showImages = layer.id === 'default';
          const totalElements = layerMachines.length + layerRooms.length + layerTraffic.length + (showImages ? layerImages.length : 0);

          return (
            <div key={layer.id} className={`border-b border-zinc-800/50 ${isActive ? 'bg-orange-500/5' : ''}`}>
              {/* Layer header */}
              <div
                className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-zinc-800/40 transition-all ${
                  isActive ? 'border-l-2 border-orange-500' : 'border-l-2 border-transparent'
                }`}
                onClick={() => setActiveLayer(layer.id)}
              >
                {/* Expand toggle */}
                <button
                  className="text-zinc-500 hover:text-zinc-300 p-0.5"
                  onClick={(e) => { e.stopPropagation(); toggleExpand(layer.id); }}
                >
                  {isExpanded ? <FiChevronDown className="text-[10px]" /> : <FiChevronRight className="text-[10px]" />}
                </button>

                {/* Color indicator */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />

                {/* Layer name */}
                <span className={`text-[11px] flex-1 truncate ${isActive ? 'text-orange-400 font-semibold' : 'text-zinc-300'}`}>
                  {layer.name}
                </span>

                {/* Element count */}
                <span className="text-[9px] text-zinc-600 tabular-nums">{totalElements}</span>

                {/* Visibility */}
                <button
                  className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-all"
                  onClick={(e) => { e.stopPropagation(); toggleCanvasLayerVisibility(layer.id); }}
                  title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                >
                  {layer.visible ? <FiEye className="text-[10px]" /> : <FiEyeOff className="text-[10px] text-zinc-600" />}
                </button>

                {/* Lock */}
                <button
                  className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-all"
                  onClick={(e) => { e.stopPropagation(); toggleCanvasLayerLock(layer.id); }}
                  title={layer.locked ? 'Desbloquear' : 'Bloquear'}
                >
                  {layer.locked ? <FiLock className="text-[10px] text-amber-500" /> : <FiUnlock className="text-[10px]" />}
                </button>

                {/* Delete (not default) */}
                {layer.id !== 'default' && (
                  <button
                    className="p-0.5 text-zinc-600 hover:text-red-400 transition-all"
                    onClick={(e) => { e.stopPropagation(); removeCanvasLayer(layer.id); }}
                    title="Eliminar capa"
                  >
                    <FiTrash2 className="text-[10px]" />
                  </button>
                )}
              </div>

              {/* Active layer indicator */}
              {isActive && (
                <div className="px-2 pb-1">
                  <span className="text-[8px] text-orange-500/70 uppercase tracking-wider font-medium">Capa activa</span>
                </div>
              )}

              {/* Expanded elements */}
              {isExpanded && (
                <div className="pb-1">
                  {/* Rooms (Superficies) */}
                  {layerRooms.length > 0 && (
                    <div className="px-1">
                      <div className="text-[8px] text-zinc-600 uppercase tracking-wider px-2 py-0.5 font-medium">
                        Superficies ({layerRooms.length})
                      </div>
                      {layerRooms.map((room) => (
                        <ElementRow
                          key={room.id}
                          icon={<BiSquare className="text-[10px]" style={{ color: room.color }} />}
                          label={room.name}
                          visible={room.visible}
                          locked={room.locked}
                          onToggleVisibility={() => toggleRoomVisibility(room.id)}
                          onDelete={() => removeFloorRoom(room.id)}
                          layers={canvasLayers}
                          currentLayerId={room.layer || 'default'}
                          onMoveToLayer={(layerId) => assignRoomToLayer(room.id, layerId)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Machines */}
                  {layerMachines.length > 0 && (
                    <div className="px-1">
                      <div className="text-[8px] text-zinc-600 uppercase tracking-wider px-2 py-0.5 font-medium">
                        Máquinas ({layerMachines.length})
                      </div>
                      {layerMachines.map((machine) => (
                        <ElementRow
                          key={machine.id}
                          icon={<div className="w-2 h-2 rounded-sm" style={{ backgroundColor: machine.categoria ? undefined : '#888' }} />}
                          label={machine.nombre}
                          visible={true}
                          locked={machine.locked}
                          onToggleVisibility={() => {}}
                          onDelete={() => removeMachine(machine.id)}
                          layers={canvasLayers}
                          currentLayerId={machine.layer || 'default'}
                          onMoveToLayer={(layerId) => assignMachinesToLayer([machine.id], layerId)}
                          hideVisibility
                        />
                      ))}
                    </div>
                  )}

                  {/* Traffic Lines */}
                  {layerTraffic.length > 0 && (
                    <div className="px-1">
                      <div className="text-[8px] text-zinc-600 uppercase tracking-wider px-2 py-0.5 font-medium">
                        Líneas de tráfico ({layerTraffic.length})
                      </div>
                      {layerTraffic.map((tl) => (
                        <ElementRow
                          key={tl.id}
                          icon={<MdOutlineRoute className="text-[10px]" style={{ color: tl.color }} />}
                          label={tl.label || 'Sin nombre'}
                          visible={tl.visible}
                          locked={tl.locked}
                          onToggleVisibility={() => toggleTrafficLineVisibility(tl.id)}
                          onDelete={() => removeTrafficLine(tl.id)}
                          layers={canvasLayers}
                          currentLayerId={tl.layer}
                          onMoveToLayer={(layerId) => assignTrafficLineToLayer(tl.id, layerId)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Images (only in default layer) */}
                  {showImages && layerImages.length > 0 && (
                    <div className="px-1">
                      <div className="text-[8px] text-zinc-600 uppercase tracking-wider px-2 py-0.5 font-medium">
                        Imágenes ({layerImages.length})
                      </div>
                      {layerImages.map((img) => (
                        <ElementRow
                          key={img.id}
                          icon={<FiImage className="text-[10px] text-purple-400" />}
                          label={`Imagen ${img.id.slice(0, 6)}`}
                          visible={img.visible}
                          locked={img.locked}
                          onToggleVisibility={() => toggleImageVisibility(img.id)}
                          onDelete={() => removeImageLayer(img.id)}
                          layers={canvasLayers}
                          currentLayerId="default"
                          onMoveToLayer={() => {}}
                          hideLayerSelect
                        />
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {totalElements === 0 && (
                    <div className="px-3 py-2 text-[10px] text-zinc-600 italic">
                      Capa vacía
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-zinc-800">
        <div className="text-[9px] text-zinc-600 space-y-0.5">
          <p>Click en capa = activar</p>
          <p>Nuevos elementos van a la capa activa</p>
        </div>
      </div>
    </div>
  );
}

// ---- Element row inside a layer ----
function ElementRow({
  icon,
  label,
  visible,
  locked,
  onToggleVisibility,
  onDelete,
  layers,
  currentLayerId,
  onMoveToLayer,
  hideVisibility,
  hideLayerSelect,
}: {
  icon: React.ReactNode;
  label: string;
  visible: boolean;
  locked: boolean;
  onToggleVisibility: () => void;
  onDelete: () => void;
  layers: CanvasLayer[];
  currentLayerId: string;
  onMoveToLayer: (layerId: string) => void;
  hideVisibility?: boolean;
  hideLayerSelect?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 hover:bg-zinc-800/30 rounded group/el transition-all">
      {/* Icon */}
      <span className="shrink-0">{icon}</span>

      {/* Label */}
      <span className="text-[10px] text-zinc-400 truncate flex-1">{label}</span>

      {/* Move to layer dropdown (hidden by default, visible on hover) */}
      {!hideLayerSelect && layers.length > 1 && (
        <select
          value={currentLayerId}
          onChange={(e) => onMoveToLayer(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="hidden group-hover/el:block w-14 bg-zinc-800 text-zinc-400 text-[8px] px-0.5 py-0.5 rounded border border-zinc-700/50 outline-none cursor-pointer"
          title="Mover a capa"
        >
          {layers.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      )}

      {/* Visibility toggle */}
      {!hideVisibility && (
        <button
          className="hidden group-hover/el:block p-0.5 text-zinc-600 hover:text-zinc-300 transition-all"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
        >
          {visible ? <FiEye className="text-[9px]" /> : <FiEyeOff className="text-[9px]" />}
        </button>
      )}

      {/* Delete */}
      <button
        className="hidden group-hover/el:block p-0.5 text-zinc-600 hover:text-red-400 transition-all"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <FiTrash2 className="text-[9px]" />
      </button>

      {/* Lock indicator */}
      {locked && <FiLock className="text-[9px] text-amber-500/60 shrink-0" />}
    </div>
  );
}
