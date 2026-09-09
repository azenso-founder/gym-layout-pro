// ==========================================
// Panel derecho — Propiedades (single + multi-select)
// ==========================================

import { FiLock, FiUnlock, FiCopy, FiTrash2, FiRotateCw, FiInfo } from 'react-icons/fi';
import useStore from '@/stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { calcularGuerchet } from '@/engine/guerchet';

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

  const isMulti = selectedIds.length > 1;
  const machine = machines.find((m) => m.id === selectedId);
  const selectedMachines = machines.filter((m) => selectedIds.includes(m.id));

  // ---- No selection: show overview ----
  if (selectedIds.length === 0 || !machine) {
    const placed = machines.filter((m) => m.planta === activePlanta && m.placed);
    const supUsada = getSuperficieUsada(activePlanta);
    const supDisponible = getSuperficieDisponible(activePlanta);

    return (
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Propiedades</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center mb-3">
            <FiInfo className="text-zinc-600 text-lg" />
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Selecciona una máquina para editar
          </p>
          <div className="w-full space-y-2 text-xs">
            <StatRow label="Máquinas colocadas" value={String(placed.length)} />
            <StatRow label="Superficie usada" value={`${supUsada} m²`} />
            <StatRow label="Disponible" value={`${supDisponible} m²`} />
          </div>
        </div>
        <div className="p-3 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-600 space-y-0.5">
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">R</kbd> Rotar · <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">D</kbd> Duplicar</p>
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Del</kbd> Eliminar · <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">L</kbd> Lock</p>
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">⌘Z</kbd> Deshacer · <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">⌘A</kbd> Todas</p>
            <p><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl+Click</kbd> Multi-selección</p>
          </div>
        </div>
      </div>
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
      <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex -space-x-1">
              {categories.slice(0, 4).map((cat, i) => (
                <div
                  key={cat}
                  className="w-3 h-3 rounded-full border border-zinc-900"
                  style={{ backgroundColor: CATEGORY_COLORS[cat], zIndex: 4 - i }}
                />
              ))}
            </div>
            <h3 className="text-sm font-semibold text-orange-400">
              {selectedIds.length} máquinas
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">
            {categories.map((c) => CATEGORY_LABELS[c]).join(', ')}
          </span>
        </div>

        {/* Bulk actions */}
        <div className="flex gap-1 p-2 border-b border-zinc-800">
          <ActionBtn icon={<FiRotateCw />} label="90°" onClick={() => bulkRotate(90)} title="Rotar todas 90°" />
          <ActionBtn icon={<FiLock />} onClick={bulkToggleLock} title="Lock/unlock todas" />
          <ActionBtn icon={<FiTrash2 />} onClick={bulkRemove} title="Eliminar todas" danger />
        </div>

        {/* Bulk K edit */}
        <Section title="Edición masiva — Guerchet">
          <p className="text-[10px] text-zinc-500 mb-2">
            Cambiar K o N actualiza todas las seleccionadas
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">
                N (lados) {allN.length > 1 && <span className="text-amber-400">mixto</span>}
              </label>
              <input
                type="number"
                placeholder={allN.length > 1 ? 'Mixto' : String(allN[0])}
                defaultValue={allN.length === 1 ? allN[0] : ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v >= 0) bulkUpdateProp({ N: v });
                }}
                step="1"
                className="w-full bg-zinc-800/60 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700/50 outline-none focus:border-orange-500/50 tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">
                K {allK.length > 1 && <span className="text-amber-400">mixto</span>}
              </label>
              <input
                type="number"
                placeholder={allK.length > 1 ? 'Mixto' : String(allK[0])}
                defaultValue={allK.length === 1 ? allK[0] : ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) bulkUpdateProp({ K: v });
                }}
                step="0.01"
                className="w-full bg-zinc-800/60 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700/50 outline-none focus:border-orange-500/50 tabular-nums"
              />
            </div>
          </div>
        </Section>

        {/* Summary */}
        <Section title="Resumen de selección">
          <div className="space-y-1.5 text-xs">
            <StatRow label="St total" value={`${totalSt.toFixed(2)} m²`} />
            <StatRow label="Categorías" value={String(categories.length)} />
            <StatRow label="Bloqueadas" value={String(selectedMachines.filter((m) => m.locked).length)} />
          </div>
        </Section>

        {/* List of selected */}
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

  // ---- Single machine panel ----
  const guerchet = calcularGuerchet(machine.largo, machine.ancho, machine.N, machine.K);
  const color = CATEGORY_COLORS[machine.categoria];

  return (
    <div className="w-64 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Machine name */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-semibold text-zinc-200 truncate">{machine.nombre}</h3>
        </div>
        <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/50 inline-block">
          {CATEGORY_LABELS[machine.categoria]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 p-2 border-b border-zinc-800">
        <ActionBtn icon={<FiRotateCw />} label="90°" onClick={() => rotateMachine(machine.id, 90)} title="Rotar 90° (R)" />
        <ActionBtn icon={<FiCopy />} onClick={() => duplicateMachine(machine.id)} title="Duplicar (D)" />
        <ActionBtn
          icon={machine.locked ? <FiLock /> : <FiUnlock />}
          onClick={() => toggleLockMachine(machine.id)}
          title={machine.locked ? 'Desbloquear (L)' : 'Bloquear (L)'}
          active={machine.locked}
        />
        <ActionBtn icon={<FiTrash2 />} onClick={() => removeMachine(machine.id)} title="Eliminar (Del)" danger />
      </div>

      {/* Dimensions */}
      <Section title="Dimensiones">
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Largo (m)" value={machine.largo}
            onChange={(v) => updateMachineProp(machine.id, { largo: v })} />
          <Field label="Ancho (m)" value={machine.ancho}
            onChange={(v) => updateMachineProp(machine.id, { ancho: v })} />
          <Field label="Alto (m)" value={machine.alto}
            onChange={(v) => updateMachineProp(machine.id, { alto: v })} />
          <Field label="Rotación°" value={machine.rotation} readOnly />
        </div>
      </Section>

      {/* Guerchet */}
      <Section title="Guerchet">
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <Field label="N (lados)" value={machine.N}
            onChange={(v) => updateMachineProp(machine.id, { N: Math.max(0, Math.round(v)) })} />
          <Field label="K" value={machine.K}
            onChange={(v) => updateMachineProp(machine.id, { K: Math.max(0.01, v) })} />
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

      {/* Service time */}
      <Section title="Tiempo servicio (min)">
        <div className="grid grid-cols-3 gap-1">
          <Field label="Mín" value={machine.tiempoServicio.min}
            onChange={(v) => updateMachineProp(machine.id, {
              tiempoServicio: { ...machine.tiempoServicio, min: v }
            })} />
          <Field label="Moda" value={machine.tiempoServicio.moda}
            onChange={(v) => updateMachineProp(machine.id, {
              tiempoServicio: { ...machine.tiempoServicio, moda: v }
            })} />
          <Field label="Máx" value={machine.tiempoServicio.max}
            onChange={(v) => updateMachineProp(machine.id, {
              tiempoServicio: { ...machine.tiempoServicio, max: v }
            })} />
        </div>
      </Section>

      {/* Position */}
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

// ---- Helpers ----

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

function ActionBtn({
  icon, label, onClick, title, active, danger,
}: {
  icon: React.ReactNode; label?: string; onClick: () => void; title: string;
  active?: boolean; danger?: boolean;
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
      <input
        type="number"
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
        readOnly={readOnly}
        step="0.01"
        className={`w-full bg-zinc-800/60 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700/50 outline-none tabular-nums ${
          readOnly ? 'opacity-50' : 'focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20'
        }`}
      />
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
