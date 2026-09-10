// ==========================================
// Panel derecho — Propiedades del elemento seleccionado
// Con opciones de visualización por máquina (color, halo, flecha, label)
// ==========================================

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Lock, Unlock, Copy, Trash2, RotateCw, RotateCcw, Info,
  Eye, EyeOff, ChevronDown, ChevronRight, ArrowRight, Type,
} from 'lucide-react';
import useStore, { px2m } from '@/stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { calcularGuerchet } from '@/engine/guerchet';
import { tokens } from '@/lib/design/tokens';
import Tooltip from './Tooltip';
import type { MachineVisualOptions, EntrySide } from '@/types';

const ICON = 16;

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

  // Room selection
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const floorRooms = useStore((s) => s.floorRooms);
  const renameFloorRoom = useStore((s) => s.renameFloorRoom);
  const setRoomColor = useStore((s) => s.setRoomColor);
  const removeFloorRoom = useStore((s) => s.removeFloorRoom);
  const getRoomArea = useStore((s) => s.getRoomArea);
  const toggleRoomVisibility = useStore((s) => s.toggleRoomVisibility);
  const toggleRoomLock = useStore((s) => s.toggleRoomLock);

  const isMulti = selectedIds.length > 1;
  const machine = machines.find((m) => m.id === selectedId);
  const selectedMachines = machines.filter((m) => selectedIds.includes(m.id));
  const selectedRoom = floorRooms.find((r) => r.id === selectedRoomId);

  // ---- Room selected ----
  if (selectedRoom) {
    return (
      <PanelShell>
        <div className="p-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedRoom.color }} />
            <input
              type="text"
              value={selectedRoom.name}
              onChange={(e) => renameFloorRoom(selectedRoom.id, e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
              style={{ color: tokens.colors.text.primary }}
            />
          </div>
          <span className="text-xs" style={{ color: tokens.colors.text.muted }}>Zona / Recinto</span>
        </div>

        <Section title="Color">
          <div className="flex gap-1.5 flex-wrap">
            {['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'].map((c) => (
              <button
                key={c}
                className="w-7 h-7 rounded-md border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: selectedRoom.color === c ? '#fff' : 'transparent',
                }}
                onClick={() => setRoomColor(selectedRoom.id, c)}
              />
            ))}
            <input
              type="color"
              value={selectedRoom.color}
              onChange={(e) => setRoomColor(selectedRoom.id, e.target.value)}
              className="w-7 h-7 rounded-md cursor-pointer border-0 p-0"
            />
          </div>
        </Section>

        <Section title="Información">
          <div className="space-y-1.5 text-xs">
            <StatRow label="Superficie" value={`${getRoomArea(selectedRoom).toFixed(2)} m²`} />
            <StatRow label="Vértices" value={String(selectedRoom.points.length)} />
            <StatRow label="Visible" value={selectedRoom.visible ? 'Sí' : 'No'} />
          </div>
        </Section>

        <Section title="Acciones">
          <div className="flex gap-1.5">
            <ActionBtn icon={selectedRoom.visible ? <Eye size={ICON} /> : <EyeOff size={ICON} />} onClick={() => toggleRoomVisibility(selectedRoom.id)} title="Visibilidad" />
            <ActionBtn icon={selectedRoom.locked ? <Lock size={ICON} /> : <Unlock size={ICON} />} onClick={() => toggleRoomLock(selectedRoom.id)} title="Lock" active={selectedRoom.locked} />
            <ActionBtn icon={<Trash2 size={ICON} />} onClick={() => removeFloorRoom(selectedRoom.id)} title="Eliminar" danger />
          </div>
        </Section>
      </PanelShell>
    );
  }

  // ---- No selection: show overview ----
  if (selectedIds.length === 0 || !machine) {
    const placed = machines.filter((m) => m.planta === activePlanta && m.placed);
    const supUsada = getSuperficieUsada(activePlanta);
    const supDisponible = getSuperficieDisponible(activePlanta);

    return (
      <PanelShell>
        <div className="p-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.colors.text.secondary }}>Propiedades</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: tokens.colors.bg.surface }}>
            <Info size={24} style={{ color: tokens.colors.text.muted }} />
          </div>
          <p className="text-xs mb-4" style={{ color: tokens.colors.text.muted }}>
            Selecciona una máquina o zona para editar
          </p>
          <div className="w-full space-y-2 text-xs">
            <StatRow label="Máquinas colocadas" value={String(placed.length)} />
            <StatRow label="Superficie usada" value={`${supUsada} m²`} />
            <StatRow label="Disponible" value={`${supDisponible} m²`} />
          </div>
        </div>
        <div className="p-3 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
          <div className="text-[10px] space-y-1" style={{ color: tokens.colors.text.muted }}>
            <p><Kbd>R</Kbd> Rotar · <Kbd>Ctrl+D</Kbd> Duplicar</p>
            <p><Kbd>Del</Kbd> Eliminar · <Kbd>Ctrl+L</Kbd> Lock</p>
            <p><Kbd>⌘Z</Kbd> Deshacer · <Kbd>⌘A</Kbd> Todas</p>
            <p><Kbd>Ctrl+Click</Kbd> Multi-selección</p>
          </div>
        </div>
      </PanelShell>
    );
  }

  // ---- Multi-select panel ----
  if (isMulti) {
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
      <PanelShell>
        <div className="p-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex -space-x-1">
              {categories.slice(0, 4).map((cat, i) => (
                <div key={cat} className="w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: CATEGORY_COLORS[cat], borderColor: tokens.colors.bg.panel, zIndex: 4 - i }} />
              ))}
            </div>
            <h3 className="text-sm font-semibold" style={{ color: tokens.colors.accent.primary }}>
              {selectedIds.length} máquinas
            </h3>
          </div>
          <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>
            {categories.map((c) => CATEGORY_LABELS[c]).join(', ')}
          </span>
        </div>

        <div className="flex gap-1.5 p-2 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
          <ActionBtn icon={<RotateCw size={ICON} />} label="90°" onClick={() => bulkRotate(90)} title="Rotar 90°" />
          <ActionBtn icon={<Lock size={ICON} />} onClick={bulkToggleLock} title="Lock/unlock" />
          <ActionBtn icon={<Trash2 size={ICON} />} onClick={bulkRemove} title="Eliminar" danger />
        </div>

        <Section title="Edición masiva — Guerchet">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: tokens.colors.text.muted }}>
                N {allN.length > 1 && <span style={{ color: tokens.colors.accent.warning }}>mixto</span>}
              </label>
              <input type="number" placeholder={allN.length > 1 ? 'Mixto' : String(allN[0])} defaultValue={allN.length === 1 ? allN[0] : ''} step="1"
                onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) bulkUpdateProp({ N: v }); }}
                className="w-full text-xs px-2 py-1.5 rounded-md border outline-none tabular-nums" style={inputStyle} />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: tokens.colors.text.muted }}>
                K {allK.length > 1 && <span style={{ color: tokens.colors.accent.warning }}>mixto</span>}
              </label>
              <input type="number" placeholder={allK.length > 1 ? 'Mixto' : String(allK[0])} defaultValue={allK.length === 1 ? allK[0] : ''} step="0.01"
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) bulkUpdateProp({ K: v }); }}
                className="w-full text-xs px-2 py-1.5 rounded-md border outline-none tabular-nums" style={inputStyle} />
            </div>
          </div>
        </Section>

        <Section title="Resumen">
          <div className="space-y-1.5 text-xs">
            <StatRow label="St total" value={`${totalSt.toFixed(2)} m²`} />
            <StatRow label="Categorías" value={String(categories.length)} />
            <StatRow label="Bloqueadas" value={String(selectedMachines.filter((m) => m.locked).length)} />
          </div>
        </Section>
      </PanelShell>
    );
  }

  // ---- Single machine panel ----
  const guerchet = calcularGuerchet(machine.largo, machine.ancho, machine.N, machine.K);
  const color = CATEGORY_COLORS[machine.categoria];
  const visual = machine.visual || {};

  const updateVisual = (updates: Partial<MachineVisualOptions>) => {
    updateMachineProp(machine.id, {
      visual: { ...visual, ...updates },
    });
  };

  return (
    <PanelShell>
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-semibold truncate" style={{ color: tokens.colors.text.primary }}>{machine.nombre}</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded inline-block" style={{ background: tokens.colors.bg.surface, color: tokens.colors.text.muted }}>
          {CATEGORY_LABELS[machine.categoria]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 p-2 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
        <ActionBtn icon={<RotateCw size={ICON} />} label="90°" onClick={() => rotateMachine(machine.id, 90)} title="Rotar 90° CW (R)" />
        <ActionBtn icon={<RotateCcw size={ICON} />} label="-90°" onClick={() => rotateMachine(machine.id, -90)} title="Rotar 90° CCW (⇧R)" />
        <ActionBtn icon={<Copy size={ICON} />} onClick={() => duplicateMachine(machine.id)} title="Duplicar (⌘D)" />
        <ActionBtn
          icon={machine.locked ? <Lock size={ICON} /> : <Unlock size={ICON} />}
          onClick={() => toggleLockMachine(machine.id)}
          title={machine.locked ? 'Desbloquear' : 'Bloquear'}
          active={machine.locked}
        />
        <ActionBtn icon={<Trash2 size={ICON} />} onClick={() => removeMachine(machine.id)} title="Eliminar" danger />
      </div>

      {/* Position */}
      <Section title="Posición">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between py-1.5 px-2 rounded text-xs" style={{ background: tokens.colors.bg.surface }}>
            <span style={{ color: tokens.colors.text.muted }}>X</span>
            <span className="tabular-nums" style={{ color: tokens.colors.text.primary }}>{px2m(machine.x).toFixed(2)}m</span>
          </div>
          <div className="flex justify-between py-1.5 px-2 rounded text-xs" style={{ background: tokens.colors.bg.surface }}>
            <span style={{ color: tokens.colors.text.muted }}>Y</span>
            <span className="tabular-nums" style={{ color: tokens.colors.text.primary }}>{px2m(machine.y).toFixed(2)}m</span>
          </div>
        </div>
        <div className="flex justify-between py-1.5 px-2 rounded text-xs mt-1.5" style={{ background: tokens.colors.bg.surface }}>
          <span style={{ color: tokens.colors.text.muted }}>Rotación</span>
          <span className="tabular-nums" style={{ color: tokens.colors.text.primary }}>{machine.rotation}°</span>
        </div>
      </Section>

      {/* Dimensions */}
      <Section title="Dimensiones">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Largo (m)" value={machine.largo} onChange={(v) => updateMachineProp(machine.id, { largo: v })} />
          <Field label="Ancho (m)" value={machine.ancho} onChange={(v) => updateMachineProp(machine.id, { ancho: v })} />
          <Field label="Alto (m)" value={machine.alto} onChange={(v) => updateMachineProp(machine.id, { alto: v })} />
        </div>
      </Section>

      {/* Guerchet */}
      <Section title="Guerchet">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Field label="N (lados op.)" value={machine.N} onChange={(v) => updateMachineProp(machine.id, { N: Math.max(0, Math.round(v)) })} />
          <Field label="K (circulación)" value={machine.K} onChange={(v) => updateMachineProp(machine.id, { K: Math.max(0.01, v) })} />
        </div>
        <div className="space-y-1 rounded-lg p-2.5" style={{ background: tokens.colors.bg.surface }}>
          <GRow label="Ss (estática)" value={guerchet.Ss} color="#60A5FA" />
          <GRow label={`Sg (gravitacional, N=${machine.N})`} value={guerchet.Sg} color="#34D399" />
          <GRow label={`Se (evolución, K=${machine.K})`} value={guerchet.Se} color="#FBBF24" />
          <div className="border-t pt-1 mt-1" style={{ borderColor: tokens.colors.border.subtle }}>
            <GRow label="St (total)" value={guerchet.St} color="#F87171" bold />
          </div>
        </div>
      </Section>

      {/* ── VISUALIZACIÓN (NUEVO) ── */}
      <CollapsibleSection title="Visualización" defaultOpen={false}>
        {/* Color de relleno */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] block mb-1" style={{ color: tokens.colors.text.muted }}>Color relleno</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={visual.fillColor || color}
                onChange={(e) => updateVisual({ fillColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-[10px] tabular-nums" style={{ color: tokens.colors.text.secondary }}>
                {visual.fillColor || color}
              </span>
              {visual.fillColor && (
                <button className="text-[10px] hover:underline" style={{ color: tokens.colors.accent.primary }} onClick={() => updateVisual({ fillColor: undefined })}>
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Opacidad relleno */}
          <div>
            <label className="text-[10px] block mb-1" style={{ color: tokens.colors.text.muted }}>Opacidad relleno</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={1} step={0.05} value={visual.fillOpacity ?? 0.8}
                onChange={(e) => updateVisual({ fillOpacity: parseFloat(e.target.value) })}
                className="flex-1 accent-blue-400 h-1" />
              <span className="text-[10px] w-8 text-right tabular-nums" style={{ color: tokens.colors.text.secondary }}>
                {Math.round((visual.fillOpacity ?? 0.8) * 100)}%
              </span>
            </div>
          </div>

          {/* Color de borde */}
          <div>
            <label className="text-[10px] block mb-1" style={{ color: tokens.colors.text.muted }}>Color borde</label>
            <div className="flex items-center gap-2">
              <input type="color" value={visual.strokeColor || color}
                onChange={(e) => updateVisual({ strokeColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
              <span className="text-[10px] tabular-nums" style={{ color: tokens.colors.text.secondary }}>
                {visual.strokeColor || color}
              </span>
            </div>
          </div>

          {/* Halo Guerchet */}
          <div className="pt-1 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Halo Guerchet</label>
              <ToggleSwitch checked={visual.showHalo !== false} onChange={(v) => updateVisual({ showHalo: v })} />
            </div>
            {visual.showHalo !== false && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <input type="color" value={visual.haloColor || color + '30'}
                    onChange={(e) => updateVisual({ haloColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                  <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Color</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={1} step={0.05} value={visual.haloOpacity ?? 0.12}
                    onChange={(e) => updateVisual({ haloOpacity: parseFloat(e.target.value) })}
                    className="flex-1 accent-blue-400 h-1" />
                  <span className="text-[10px] w-8 text-right tabular-nums" style={{ color: tokens.colors.text.secondary }}>
                    {Math.round((visual.haloOpacity ?? 0.12) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Flecha de dirección */}
          <div className="pt-1 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Flecha dirección</label>
              <ToggleSwitch checked={visual.showArrow ?? false} onChange={(v) => updateVisual({ showArrow: v })} />
            </div>
            {visual.showArrow && (
              <div className="space-y-2 mt-2">
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: tokens.colors.text.muted }}>Lado de entrada</label>
                  <div className="flex gap-1">
                    {(['bottom', 'top', 'left', 'right'] as EntrySide[]).map((side) => (
                      <button key={side}
                        className="flex-1 py-1.5 text-[10px] rounded-md border transition-all"
                        style={{
                          background: (visual.entrySide || 'bottom') === side ? tokens.colors.accent.primary + '20' : tokens.colors.bg.surface,
                          borderColor: (visual.entrySide || 'bottom') === side ? tokens.colors.accent.primary : tokens.colors.border.default,
                          color: (visual.entrySide || 'bottom') === side ? tokens.colors.accent.primary : tokens.colors.text.muted,
                        }}
                        onClick={() => updateVisual({ entrySide: side })}
                      >
                        {side === 'bottom' ? '↓' : side === 'top' ? '↑' : side === 'left' ? '←' : '→'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={visual.arrowColor || '#ffffff'}
                    onChange={(e) => updateVisual({ arrowColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                  <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Color flecha</span>
                </div>
              </div>
            )}
          </div>

          {/* Etiqueta de texto */}
          <div className="pt-1 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Mostrar nombre</label>
              <ToggleSwitch checked={visual.showLabel !== false} onChange={(v) => updateVisual({ showLabel: v })} />
            </div>
            {visual.showLabel !== false && (
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={visual.labelSize ?? 12}
                  onChange={(e) => updateVisual({ labelSize: parseInt(e.target.value) })}
                  className="text-[10px] rounded px-1.5 py-1 border outline-none"
                  style={{ ...inputStyle }}
                >
                  {[8, 10, 12, 14, 16].map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
                <input type="color" value={visual.labelColor || '#ffffff'}
                  onChange={(e) => updateVisual({ labelColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Simulation */}
      <Section title="Simulación">
        <div className="space-y-2">
          <Field label="Capacidad (personas)" value={machine.capacidad}
            onChange={(v) => updateMachineProp(machine.id, { capacidad: Math.max(1, Math.round(v)) })} />
          <div className="grid grid-cols-3 gap-1.5">
            <Field label="Mín" value={machine.tiempoServicio.min}
              onChange={(v) => updateMachineProp(machine.id, { tiempoServicio: { ...machine.tiempoServicio, min: v } })} />
            <Field label="Moda" value={machine.tiempoServicio.moda}
              onChange={(v) => updateMachineProp(machine.id, { tiempoServicio: { ...machine.tiempoServicio, moda: v } })} />
            <Field label="Máx" value={machine.tiempoServicio.max}
              onChange={(v) => updateMachineProp(machine.id, { tiempoServicio: { ...machine.tiempoServicio, max: v } })} />
          </div>
          <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Tiempo de servicio (minutos)</span>
        </div>
      </Section>
    </PanelShell>
  );
}

// ---- Subcomponentes ----

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-72 flex flex-col h-full shrink-0 overflow-y-auto" style={{ background: tokens.colors.bg.panel, borderLeft: `1px solid ${tokens.colors.border.subtle}` }}>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 border-b" style={{ borderColor: tokens.colors.border.subtle }}>
      <h4 className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: tokens.colors.text.muted }}>{title}</h4>
      {children}
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: tokens.colors.border.subtle }}>
      <button className="flex items-center gap-1.5 w-full p-3 text-left" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <h4 className="text-[10px] uppercase tracking-wider font-medium" style={{ color: tokens.colors.text.muted }}>{title}</h4>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 px-2 rounded" style={{ background: tokens.colors.bg.surface }}>
      <span style={{ color: tokens.colors.text.muted }}>{label}</span>
      <span className="font-medium tabular-nums" style={{ color: tokens.colors.text.primary }}>{value}</span>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, title, active, danger }: {
  icon: React.ReactNode; label?: string; onClick: () => void; title: string; active?: boolean; danger?: boolean;
}) {
  return (
    <Tooltip content={title}>
      <button
        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs transition-all min-h-[36px]"
        style={{
          background: danger ? 'rgba(239,68,68,0.1)' : active ? 'rgba(245,158,11,0.15)' : tokens.colors.bg.surface,
          color: danger ? tokens.colors.accent.danger : active ? tokens.colors.accent.warning : tokens.colors.text.secondary,
        }}
        onClick={onClick}
      >
        {icon}
        {label && <span>{label}</span>}
      </button>
    </Tooltip>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="w-9 h-5 rounded-full p-0.5 transition-all"
      style={{ background: checked ? tokens.colors.accent.primary : tokens.colors.bg.elevated }}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <div
        className="w-4 h-4 rounded-full transition-transform"
        style={{
          background: '#fff',
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: tokens.colors.bg.surface, color: tokens.colors.text.secondary }}>
      {children}
    </kbd>
  );
}

const inputStyle: React.CSSProperties = {
  background: tokens.colors.bg.elevated,
  color: tokens.colors.text.primary,
  borderColor: tokens.colors.border.default,
};

function Field({ label, value, onChange, readOnly }: {
  label: string; value: number; onChange?: (v: number) => void; readOnly?: boolean;
}) {
  const [localVal, setLocalVal] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!focused && value !== prevValue.current) setLocalVal(String(value));
    prevValue.current = value;
  }, [value, focused]);

  const commit = () => {
    const parsed = parseFloat(localVal);
    if (!isNaN(parsed)) onChange?.(parsed);
    else setLocalVal(String(value));
  };

  return (
    <div>
      <label className="text-[10px] block mb-0.5" style={{ color: tokens.colors.text.muted }}>{label}</label>
      <input
        type="number"
        value={focused ? localVal : String(value)}
        onChange={(e) => setLocalVal(e.target.value)}
        onFocus={() => { setFocused(true); setLocalVal(String(value)); }}
        onBlur={() => { setFocused(false); commit(); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); } }}
        readOnly={readOnly}
        step="0.01"
        className="w-full text-xs px-2 py-1.5 rounded-md border outline-none tabular-nums"
        style={{
          ...inputStyle,
          opacity: readOnly ? 0.5 : 1,
        }}
      />
    </div>
  );
}

function GRow({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-xs ${bold ? 'font-semibold' : ''}`}>
      <span className="flex items-center gap-1.5" style={{ color: tokens.colors.text.secondary }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="tabular-nums" style={{ color: tokens.colors.text.primary }}>{value.toFixed(3)} m²</span>
    </div>
  );
}
