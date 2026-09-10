// ==========================================
// Modal de Configuración Visual Global (Fase 6)
// Colores de categoría, halos, flechas, etiquetas, canvas
// ==========================================

'use client';

import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { tokens } from '@/lib/design/tokens';
import useStore from '@/stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import type { MachineCategory } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function VisualSettingsModal({ open, onClose }: Props) {
  const showGuerchetHalo = useStore((s) => s.showGuerchetHalo);
  const toggleGuerchetHalo = useStore((s) => s.toggleGuerchetHalo);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const bgOpacity = useStore((s) => s.bgOpacity);
  const setBgOpacity = useStore((s) => s.setBgOpacity);

  const [activeSection, setActiveSection] = useState<string>('categories');

  if (!open) return null;

  const sections = [
    { id: 'categories', label: 'Categorías' },
    { id: 'halos', label: 'Halos Guerchet' },
    { id: 'labels', label: 'Etiquetas' },
    { id: 'canvas', label: 'Canvas' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configuración Visual"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[560px] max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: tokens.colors.bg.surface, boxShadow: tokens.shadow.modal }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
          <h2 className="text-base font-semibold" style={{ color: tokens.colors.text.primary }}>
            ⚙️ Configuración Visual
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md transition-all" style={{ color: tokens.colors.text.muted }} aria-label="Cerrar configuración">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
          {sections.map((s) => (
            <button
              key={s.id}
              className="px-3 py-2 text-xs font-medium rounded-t-md transition-all"
              style={{
                color: activeSection === s.id ? tokens.colors.accent.primary : tokens.colors.text.muted,
                background: activeSection === s.id ? tokens.colors.accent.primary + '10' : 'transparent',
                borderBottom: activeSection === s.id ? `2px solid ${tokens.colors.accent.primary}` : '2px solid transparent',
              }}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeSection === 'categories' && <CategoriesSection />}
          {activeSection === 'halos' && <HalosSection showHalo={showGuerchetHalo} toggleHalo={toggleGuerchetHalo} />}
          {activeSection === 'labels' && <LabelsSection />}
          {activeSection === 'canvas' && <CanvasSection showGrid={showGrid} toggleGrid={toggleGrid} bgOpacity={bgOpacity} setBgOpacity={setBgOpacity} />}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
          <button
            className="px-4 py-2 text-xs font-medium rounded-md transition-all"
            style={{ color: tokens.colors.text.muted }}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriesSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: tokens.colors.text.muted }}>
        Colores asignados a cada categoría de máquina. Se usan en el canvas, sidebar y halos.
      </p>
      {(Object.keys(CATEGORY_COLORS) as MachineCategory[]).map((cat) => (
        <div key={cat} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: tokens.colors.bg.elevated }}>
          <div className="w-8 h-8 rounded-md" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
          <div className="flex-1">
            <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>{CATEGORY_LABELS[cat]}</span>
            <span className="text-[10px] block tabular-nums" style={{ color: tokens.colors.text.muted }}>{CATEGORY_COLORS[cat]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HalosSection({ showHalo, toggleHalo }: { showHalo: boolean; toggleHalo: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>Mostrar halos Guerchet</span>
          <p className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Área de operación alrededor de cada máquina</p>
        </div>
        <ToggleSwitch checked={showHalo} onChange={toggleHalo} />
      </div>

      <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.elevated }}>
        <p className="text-[10px]" style={{ color: tokens.colors.text.muted }}>
          💡 Los halos individuales se configuran en el panel de propiedades al seleccionar una máquina.
          Color, opacidad y visibilidad se pueden personalizar por máquina.
        </p>
      </div>

      <div>
        <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>Referencia Guerchet</span>
        <div className="mt-2 space-y-1 text-[10px]" style={{ color: tokens.colors.text.muted }}>
          <p><strong style={{ color: tokens.colors.text.secondary }}>Ss</strong> = Largo × Ancho (superficie estática)</p>
          <p><strong style={{ color: tokens.colors.text.secondary }}>Sg</strong> = Ss × N (superficie gravitacional)</p>
          <p><strong style={{ color: tokens.colors.text.secondary }}>Se</strong> = K × (Ss + Sg) (superficie de evolución)</p>
          <p><strong style={{ color: tokens.colors.text.secondary }}>St</strong> = Ss + Sg + Se (superficie total)</p>
          <p className="mt-1"><strong style={{ color: tokens.colors.text.secondary }}>K</strong> típico: 0.05–0.15 para gimnasios</p>
          <p><strong style={{ color: tokens.colors.text.secondary }}>N</strong>: lados operativos (1 = frontal, 2 = frontal+lateral, etc.)</p>
        </div>
      </div>
    </div>
  );
}

function LabelsSection() {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.elevated }}>
        <p className="text-[10px]" style={{ color: tokens.colors.text.muted }}>
          Las etiquetas de nombre se configuran individualmente por máquina en el panel de propiedades.
          Selecciona una máquina → sección "Visualización" → "Mostrar nombre".
        </p>
      </div>

      <div>
        <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>Opciones por máquina</span>
        <ul className="mt-2 space-y-1 text-[10px]" style={{ color: tokens.colors.text.muted }}>
          <li>• <strong>Mostrar nombre</strong>: on/off por máquina</li>
          <li>• <strong>Tamaño de fuente</strong>: 8–16px</li>
          <li>• <strong>Color del texto</strong>: color picker</li>
          <li>• <strong>Flecha de dirección</strong>: indica el lado de uso</li>
          <li>• <strong>Color de relleno</strong>: override del color de categoría</li>
          <li>• <strong>Opacidad</strong>: 0–100% para relleno y halo</li>
        </ul>
      </div>
    </div>
  );
}

function CanvasSection({ showGrid, toggleGrid, bgOpacity, setBgOpacity }: {
  showGrid: boolean; toggleGrid: () => void; bgOpacity: number; setBgOpacity: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>Mostrar grid</span>
          <p className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Cuadrícula de referencia en el canvas</p>
        </div>
        <ToggleSwitch checked={showGrid} onChange={toggleGrid} />
      </div>

      <div>
        <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>Opacidad fondo</span>
        <div className="flex items-center gap-2 mt-1.5">
          <input type="range" min={0.05} max={0.8} step={0.05} value={bgOpacity}
            onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
            className="flex-1 accent-blue-400 h-1" />
          <span className="text-[10px] w-8 text-right tabular-nums" style={{ color: tokens.colors.text.secondary }}>
            {Math.round(bgOpacity * 100)}%
          </span>
        </div>
      </div>

      <div>
        <span className="text-xs font-medium" style={{ color: tokens.colors.text.primary }}>Atajos de teclado</span>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
          {[
            ['V', 'Seleccionar'], ['H', 'Pan / Mover'], ['R', 'Rotar 90° CW'], ['⇧R', 'Rotar 90° CCW'],
            ['M', 'Medir'], ['Z', 'Dibujar zona'], ['T', 'Trazar plano'], ['G', 'Toggle grid'],
            ['K', 'Toggle halos'], ['N', 'Toggle nombres'], ['Del', 'Eliminar'], ['⌘D', 'Duplicar'],
            ['⌘Z', 'Deshacer'], ['⌘⇧Z', 'Rehacer'], ['⌘A', 'Seleccionar todo'], ['⌘0', 'Zoom fit'],
            ['Esc', 'Cancelar'], ['?', 'Atajos'],
          ].map(([key, action]) => (
            <div key={key} className="flex items-center gap-2 py-1 px-2 rounded" style={{ background: tokens.colors.bg.elevated }}>
              <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: tokens.colors.bg.surface, color: tokens.colors.text.secondary }}>{key}</kbd>
              <span style={{ color: tokens.colors.text.muted }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      className="w-9 h-5 rounded-full p-0.5 transition-all"
      style={{ background: checked ? tokens.colors.accent.primary : tokens.colors.bg.elevated }}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
    >
      <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
  );
}
