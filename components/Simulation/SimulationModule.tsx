// ==========================================
// Módulo de Simulación — Controles + Visualización
// ==========================================

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiRefreshCw,
} from 'react-icons/fi';
import { BiMap } from 'react-icons/bi';
import useStore from '@/stores/useStore';
import { SimulationEngine } from '@/engine/simulation';
import { CLIENT_STATE_COLORS, ROUTINE_CONFIG } from '@/types';
import type { RoutineType } from '@/types';

export default function SimulationModule() {
  const machines = useStore((s) => s.machines);
  const activePlanta = useStore((s) => s.activePlanta);
  const simRunning = useStore((s) => s.simRunning);
  const simSpeed = useStore((s) => s.simSpeed);
  const simTime = useStore((s) => s.simTime);
  const simClients = useStore((s) => s.simClients);
  const showHeatmap = useStore((s) => s.showHeatmap);
  const setSimRunning = useStore((s) => s.setSimRunning);
  const setSimSpeed = useStore((s) => s.setSimSpeed);
  const setSimTime = useStore((s) => s.setSimTime);
  const setSimClients = useStore((s) => s.setSimClients);
  const setSimMetrics = useStore((s) => s.setSimMetrics);
  const toggleHeatmap = useStore((s) => s.toggleHeatmap);

  const engineRef = useRef<SimulationEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Estadísticas locales
  const [stats, setStats] = useState({
    clientesActivos: 0,
    caminando: 0,
    ejercitando: 0,
    esperando: 0,
    atendidos: 0,
  });

  // Distribución de rutinas configurable
  const [routineDist, setRoutineDist] = useState<Record<RoutineType, number>>({
    piernas: 30,
    tren_superior: 30,
    full_body: 20,
    cardio: 15,
    funcional: 5,
  });

  // Parámetros de simulación
  const [arrivalMultiplier, setArrivalMultiplier] = useState(1.0);

  // Inicializar motor
  const initEngine = useCallback(() => {
    const plantaMachines = machines.filter(
      (m) => m.planta === activePlanta && m.placed
    );
    engineRef.current = new SimulationEngine(plantaMachines);
    setSimTime(6);
    setSimClients([]);
    setSimMetrics(null);
    setStats({
      clientesActivos: 0,
      caminando: 0,
      ejercitando: 0,
      esperando: 0,
      atendidos: 0,
    });
  }, [machines, activePlanta]);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  // Loop de simulación
  useEffect(() => {
    if (!simRunning || !engineRef.current) return;

    const ticksPerFrame = simSpeed;
    const interval = 1000 / 30; // 30 FPS

    const animate = () => {
      const now = Date.now();
      if (now - lastTickRef.current >= interval) {
        for (let i = 0; i < ticksPerFrame; i++) {
          engineRef.current!.tick();
        }

        const clients = engineRef.current!.getClients();
        const hour = engineRef.current!.getCurrentHour();

        setSimClients([...clients]);
        setSimTime(hour);

        // Actualizar stats
        setStats({
          clientesActivos: clients.length,
          caminando: clients.filter((c) => c.estado === 'caminando').length,
          ejercitando: clients.filter((c) => c.estado === 'ejercitando').length,
          esperando: clients.filter((c) => c.estado === 'esperando').length,
          atendidos: engineRef.current!.getMetrics().clientesAtendidos,
        });

        // Actualizar métricas periódicamente
        if (Math.random() < 0.05) {
          setSimMetrics(engineRef.current!.getMetrics());
        }

        // Detener si pasa de las 22:00
        if (hour >= 22) {
          setSimRunning(false);
          setSimMetrics(engineRef.current!.getMetrics());
          return;
        }

        lastTickRef.current = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [simRunning, simSpeed]);

  const handlePlayPause = () => {
    if (!engineRef.current) initEngine();
    setSimRunning(!simRunning);
  };

  const handleStep = () => {
    if (!engineRef.current) initEngine();
    engineRef.current!.tick();
    setSimClients([...engineRef.current!.getClients()]);
    setSimTime(engineRef.current!.getCurrentHour());
  };

  const handleReset = () => {
    setSimRunning(false);
    initEngine();
  };

  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const placedCount = machines.filter(
    (m) => m.planta === activePlanta && m.placed
  ).length;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header y controles */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-200">
              🎮 Simulación de Flujo de Clientes
            </h2>
            <p className="text-xs text-zinc-500">
              Motor DES — {placedCount} máquinas activas
            </p>
          </div>

          {/* Reloj */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-orange-400">
              {formatTime(simTime)}
            </div>
            <div className="text-[10px] text-zinc-500">Hora simulada</div>
          </div>
        </div>

        {/* Controles de simulación */}
        <div className="flex items-center gap-3">
          <button
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              simRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            onClick={handlePlayPause}
          >
            {simRunning ? <FiPause /> : <FiPlay />}
            {simRunning ? 'Pausar' : 'Iniciar'}
          </button>

          <button
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm"
            onClick={handleStep}
            disabled={simRunning}
          >
            <FiSkipForward /> Step
          </button>

          <button
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm"
            onClick={handleReset}
          >
            <FiRefreshCw /> Reset
          </button>

          {/* Velocidad */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-zinc-500">Velocidad:</span>
            {[1, 2, 5, 10, 50].map((speed) => (
              <button
                key={speed}
                className={`px-2 py-1 rounded text-xs ${
                  simSpeed === speed
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                onClick={() => setSimSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Heatmap toggle */}
          <button
            className={`ml-auto flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              showHeatmap
                ? 'bg-red-600/20 text-red-400'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            onClick={toggleHeatmap}
          >
            <BiMap /> Heatmap
          </button>
        </div>
      </div>

      {/* Estadísticas en vivo */}
      <div className="grid grid-cols-5 gap-3 p-4 border-b border-zinc-800">
        <StatCard
          label="Clientes activos"
          value={stats.clientesActivos}
          color="#3B82F6"
        />
        <StatCard
          label="Caminando"
          value={stats.caminando}
          color={CLIENT_STATE_COLORS.caminando}
        />
        <StatCard
          label="Ejercitando"
          value={stats.ejercitando}
          color={CLIENT_STATE_COLORS.ejercitando}
        />
        <StatCard
          label="Esperando"
          value={stats.esperando}
          color={CLIENT_STATE_COLORS.esperando}
        />
        <StatCard
          label="Total atendidos"
          value={stats.atendidos}
          color="#22C55E"
        />
      </div>

      {/* Configuración de parámetros */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Distribución de rutinas */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              Distribución de rutinas
            </h3>
            <div className="space-y-2">
              {(Object.entries(routineDist) as [RoutineType, number][]).map(
                ([type, pct]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-28">
                      {ROUTINE_CONFIG[type].label}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) =>
                        setRoutineDist((prev) => ({
                          ...prev,
                          [type]: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 accent-orange-500"
                    />
                    <span className="text-xs text-zinc-300 w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Curva de llegadas */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              Patrón de llegadas
            </h3>
            <ArrivalCurve currentHour={simTime} />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-zinc-400">Multiplicador:</span>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.1}
                value={arrivalMultiplier}
                onChange={(e) =>
                  setArrivalMultiplier(parseFloat(e.target.value))
                }
                className="flex-1 accent-orange-500"
              />
              <span className="text-xs text-zinc-300">
                {arrivalMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        {/* Leyenda de estados */}
        <div className="mt-6 flex gap-4">
          {(
            Object.entries(CLIENT_STATE_COLORS) as [string, string][]
          ).map(([state, color]) => (
            <div key={state} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-zinc-400 capitalize">{state}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Componentes auxiliares ----

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

/** Gráfico simple de la curva de llegadas */
function ArrivalCurve({ currentHour }: { currentHour: number }) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const rates = hours.map((h) => {
    if (h < 6) return 0;
    if (h >= 22) return 0;
    if (h >= 7 && h < 9) return 30;
    if (h >= 12 && h < 14) return 25;
    if (h >= 17 && h < 20) return 40;
    if (h >= 6 && h < 7) return 10;
    if (h >= 9 && h < 11) return 15;
    if (h >= 11 && h < 12) return 10;
    if (h >= 14 && h < 16) return 5;
    if (h >= 16 && h < 17) return 15;
    if (h >= 20 && h < 22) return 15;
    return 5;
  });
  const maxRate = Math.max(...rates);

  return (
    <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
      <div className="flex items-end gap-1 h-20">
        {hours.map((h, i) => {
          const height = (rates[i] / maxRate) * 100;
          const isCurrent = Math.floor(currentHour) === h;
          return (
            <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${height}%`,
                  backgroundColor: isCurrent ? '#F97316' : '#3B82F6',
                  opacity: isCurrent ? 1 : 0.5,
                  minHeight: '2px',
                }}
              />
              <span className="text-[8px] text-zinc-600">{h}</span>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-zinc-500 text-center mt-1">
        Clientes/hora por hora del día
      </div>
    </div>
  );
}
