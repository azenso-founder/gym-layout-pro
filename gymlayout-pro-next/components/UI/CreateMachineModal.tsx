// ==========================================
// Modal para crear máquina personalizada
// Cálculos Guerchet en tiempo real
// ==========================================

import { useState, useMemo } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import useStore from '@/stores/useStore';
import type { MachineCategory } from '@/types';
import { CATEGORY_LABELS } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: MachineCategory[] = [
  'cardio', 'piernas', 'tren_superior', 'racks', 'poleas', 'accesorios', 'funcional',
];

export default function CreateMachineModal({ open, onClose }: Props) {
  const addCustomTemplate = useStore((s) => s.addCustomTemplate);
  const activePlanta = useStore((s) => s.activePlanta);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<MachineCategory>('accesorios');
  const [largo, setLargo] = useState(1.0);
  const [ancho, setAncho] = useState(0.6);
  const [alto, setAlto] = useState(1.5);
  const [N, setN] = useState(1);
  const [K, setK] = useState(0.05);
  const [planta, setPlanta] = useState<'baja' | 'alta'>(activePlanta);
  const [tMin, setTMin] = useState(5);
  const [tModa, setTModa] = useState(10);
  const [tMax, setTMax] = useState(20);

  // Guerchet live calc
  const guerchet = useMemo(() => {
    const Ss = largo * ancho;
    const Sg = Ss * N;
    const Se = K * (Ss + Sg);
    const St = Ss + Sg + Se;
    return { Ss, Sg, Se, St };
  }, [largo, ancho, N, K]);

  const canSubmit = nombre.trim().length > 0 && largo > 0 && ancho > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addCustomTemplate({
      nombre: nombre.trim(),
      categoria,
      largo,
      ancho,
      alto,
      N,
      K,
      planta,
      tiempoServicio: { min: tMin, moda: tModa, max: tMax },
    });
    onClose();
    // Reset
    setNombre('');
    setLargo(1.0);
    setAncho(0.6);
    setAlto(1.5);
    setN(1);
    setK(0.05);
    setTMin(5);
    setTModa(10);
    setTMax(20);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-[460px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <FiPlus className="text-cyan-400" />
            Crear Máquina Personalizada
          </h2>
          <button
            className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-all"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Nombre
            </label>
            <input
              className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 transition-colors"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Banca ajustable"
              autoFocus
            />
          </div>

          {/* Categoría + Planta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Categoría
              </label>
              <select
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as MachineCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Planta
              </label>
              <select
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                value={planta}
                onChange={(e) => setPlanta(e.target.value as 'baja' | 'alta')}
              >
                <option value="baja">Planta Baja</option>
                <option value="alta">Planta Alta</option>
              </select>
            </div>
          </div>

          {/* Dimensiones */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Dimensiones (metros)
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <NumberField label="Largo" value={largo} onChange={setLargo} min={0.1} max={10} step={0.05} />
              <NumberField label="Ancho" value={ancho} onChange={setAncho} min={0.1} max={10} step={0.05} />
              <NumberField label="Alto" value={alto} onChange={setAlto} min={0.1} max={5} step={0.1} />
            </div>
          </div>

          {/* N y K */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                N (lados operativos)
              </label>
              <input
                type="number"
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                value={N}
                onChange={(e) => setN(Math.max(0, Math.min(4, parseInt(e.target.value) || 0)))}
                min={0}
                max={4}
              />
              <p className="text-[10px] text-zinc-600 mt-0.5">0–4 lados de acceso</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                K (factor evolución)
              </label>
              <input
                type="number"
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                value={K}
                onChange={(e) => setK(Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                max={3}
                step={0.01}
              />
              <p className="text-[10px] text-zinc-600 mt-0.5">Típico: 0.05 – 3.0</p>
            </div>
          </div>

          {/* Tiempo de servicio */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Tiempo de servicio (minutos)
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <NumberField label="Mín" value={tMin} onChange={setTMin} min={1} max={120} step={1} />
              <NumberField label="Moda" value={tModa} onChange={setTModa} min={1} max={120} step={1} />
              <NumberField label="Máx" value={tMax} onChange={setTMax} min={1} max={180} step={1} />
            </div>
          </div>

          {/* Guerchet live preview */}
          <div className="bg-zinc-800/80 rounded-xl p-3 border border-zinc-700/50">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              📊 Cálculo Guerchet
            </div>
            <div className="grid grid-cols-4 gap-2">
              <GuerchetStat label="Ss" value={guerchet.Ss} desc="Estática" />
              <GuerchetStat label="Sg" value={guerchet.Sg} desc="Gravitac." />
              <GuerchetStat label="Se" value={guerchet.Se} desc="Evolución" />
              <GuerchetStat label="St" value={guerchet.St} desc="Total" highlight />
            </div>
            <div className="mt-2 text-[10px] text-zinc-500">
              Ss = {largo} × {ancho} = {guerchet.Ss.toFixed(3)} m² &nbsp;|&nbsp;
              Sg = Ss × {N} = {guerchet.Sg.toFixed(3)} m² &nbsp;|&nbsp;
              Se = {K} × (Ss+Sg) = {guerchet.Se.toFixed(3)} m²
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-all"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-zinc-900 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Crear Máquina
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----

function NumberField({
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
    <div>
      <span className="text-[10px] text-zinc-500">{label}</span>
      <input
        type="number"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-cyan-500 tabular-nums"
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseFloat(e.target.value) || min)))}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function GuerchetStat({
  label,
  value,
  desc,
  highlight,
}: {
  label: string;
  value: number;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div className={`text-xs font-bold tabular-nums ${highlight ? 'text-cyan-400' : 'text-zinc-200'}`}>
        {value.toFixed(3)}
      </div>
      <div className={`text-[10px] font-medium ${highlight ? 'text-cyan-500' : 'text-zinc-400'}`}>
        {label}
      </div>
      <div className="text-[9px] text-zinc-600">{desc}</div>
    </div>
  );
}
