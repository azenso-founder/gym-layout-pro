// ==========================================
// Panel de Propiedades (lado derecho)
// Edita X, Y, Width, Height, Rotation
// de la capa seleccionada (imagen, recinto, etc)
// ==========================================

import { FiX } from 'react-icons/fi';
import useStore, { px2m, m2px } from '@/stores/useStore';
import type { ImageLayer } from '@/types';

export default function PropertiesPanel() {
  const selectedImageId = useStore((s) => s.selectedImageId);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const imageLayers = useStore((s) => s.imageLayers);
  const updateImageLayer = useStore((s) => s.updateImageLayer);
  const setSelectedImage = useStore((s) => s.setSelectedImage);

  const selectedImage = imageLayers.find((img) => img.id === selectedImageId);

  if (!selectedImage && !selectedRoomId) return null;

  if (!selectedImage) {
    return (
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 p-4 overflow-y-auto h-full">
        <div className="text-xs text-zinc-500 text-center py-8">
          Selecciona una capa para editar propiedades
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          🔧 Propiedades
        </h3>
        <button
          className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-all"
          onClick={() => setSelectedImage(null)}
        >
          <FiX />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Layer Name */}
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Nombre
          </label>
          <div className="mt-1 text-sm text-zinc-300 font-medium">
            Fondo — {selectedImage.planta === 'baja' ? 'P. Baja' : 'P. Alta'}
          </div>
        </div>

        {/* Position X */}
        <PropertyField
          label="Posición X (metros)"
          value={px2m(selectedImage.x)}
          onChange={(val) => updateImageLayer(selectedImage.id, { x: m2px(val) })}
          step={0.05}
        />

        {/* Position Y */}
        <PropertyField
          label="Posición Y (metros)"
          value={px2m(selectedImage.y)}
          onChange={(val) => updateImageLayer(selectedImage.id, { y: m2px(val) })}
          step={0.05}
        />

        {/* Width */}
        <PropertyField
          label="Ancho (metros)"
          value={px2m(selectedImage.width)}
          onChange={(val) => updateImageLayer(selectedImage.id, { width: Math.max(50, m2px(val)) })}
          step={0.1}
        />

        {/* Height */}
        <PropertyField
          label="Alto (metros)"
          value={px2m(selectedImage.height)}
          onChange={(val) => updateImageLayer(selectedImage.id, { height: Math.max(50, m2px(val)) })}
          step={0.1}
        />

        {/* Rotation */}
        <PropertyField
          label="Rotación (grados)"
          value={selectedImage.rotation}
          onChange={(val) => updateImageLayer(selectedImage.id, { rotation: val % 360 })}
          step={1}
          min={0}
          max={360}
        />

        {/* Info */}
        <div className="bg-zinc-800/50 rounded-lg p-2 text-[10px] text-zinc-400 space-y-1 border border-zinc-700/50">
          <div>📐 Dimensiones en metros</div>
          <div>🔄 Cambios en tiempo real</div>
          <div>🔒 Bloquea la capa para no editar</div>
        </div>
      </div>
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
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
}
