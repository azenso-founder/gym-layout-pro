// ==========================================
// Módulo de Simulación — Controles + Visualización Fluida
// ==========================================

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw,
  Eye, Users, Navigation, X, CheckCircle, MapPin,
  Rewind, FastForward,
} from 'lucide-react';
import useStore from '@/stores/useStore';
import { SimulationEngine } from '@/engine/simulation';
import { CLIENT_STATE_COLORS, ROUTINE_CONFIG } from '@/types';
import type { RoutineType } from '@/types';

export default function SimulationModule() {
  const machines = useStore((s) => s.machines);
  const activePlanta = useStore((s) => s.activePlanta);
  const floorRooms = useStore((s) => s.floorRooms);
  const simRunning = useStore((s) => s.simRunning);
  const simSpeed = useStore((s) => s.simSpeed);
  const simTime = useStore((s) => s.simTime);
  const simClients = useStore((s) => s.simClients);
  const showHeatmap = useStore((s) => s.showHeatmap);
  const simShowTrajectories = useStore((s) => s.simShowTrajectories);
  const simShowLabels = useStore((s) => s.simShowLabels);
  const simShowQueues = useStore((s) => s.simShowQueues);
  const simSelectedClientId = useStore((s) => s.simSelectedClientId);

  const setSimRunning = useStore((s) => s.setSimRunning);
  const setSimSpeed = useStore((s) => s.setSimSpeed);
  const setSimTime = useStore((s) => s.setSimTime);
  const setSimClients = useStore((s) => s.setSimClients);
  const setSimMetrics = useStore((s) => s.setSimMetrics);
  const toggleHeatmap = useStore((s) => s.toggleHeatmap);
  const toggleSimTrajectories = useStore((s) => s.toggleSimTrajectories);
  const toggleSimLabels = useStore((s) => s.toggleSimLabels);
  const toggleSimQueues = useStore((s) => s.toggleSimQueues);
  const setSimSelectedClientId = useStore((s) => s.setSimSelectedClientId);

  const engineRef = useRef<SimulationEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Estadísticas locales
  const [stats, setStats] = useState({
    clientesActivos: 0,
    caminando: 0,
    ejercitando: 0,
    esperando: 0,
    saliendo: 0,
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

  // Determinar punto de acceso o entrada
  const getPlantaEntrance = useCallback(() => {
    const rooms = floorRooms.filter((r) => r.planta === activePlanta);
    const entranceRoom = rooms.find((r) =>
      /acceso|recep|entrad|puert/i.test(r.name)
    );
    if (entranceRoom && entranceRoom.points.length >= 3) {
      const avgX =
        entranceRoom.points.reduce((a, b) => a + b.x, 0) /
        entranceRoom.points.length;
      const avgY =
        entranceRoom.points.reduce((a, b) => a + b.y, 0) /
        entranceRoom.points.length;
      return { x: avgX, y: avgY };
    }
    const placed = machines.filter(
      (m) => m.planta === activePlanta && m.placed
    );
    if (placed.length > 0) {
      const minX = Math.min(...placed.map((m) => m.x));
      const maxY = Math.max(...placed.map((m) => m.y));
      return { x: Math.max(60, minX - 80), y: Math.min(850, maxY + 60) };
    }
    return { x: 80, y: 700 };
  }, [floorRooms, activePlanta, machines]);

  // Inicializar motor
  const initEngine = useCallback(() => {
    const plantaMachines = machines.filter(
      (m) => m.planta === activePlanta && m.placed
    );
    const entrance = getPlantaEntrance();

    engineRef.current = new SimulationEngine(
      plantaMachines,
      entrance,
      arrivalMultiplier,
      routineDist
    );

    setSimTime(6);
    setSimClients([]);
    setSimMetrics(null);
    setStats({
      clientesActivos: 0,
      caminando: 0,
      ejercitando: 0,
      esperando: 0,
      saliendo: 0,
      atendidos: 0,
    });
  }, [machines, activePlanta, getPlantaEntrance, arrivalMultiplier, routineDist]);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setArrivalMultiplier(arrivalMultiplier);
      engineRef.current.setRoutineDist(routineDist);
    }
  }, [arrivalMultiplier, routineDist]);

  // Loop continuo y fluido de simulación a 60 FPS
  useEffect(() => {
    if (!simRunning || !engineRef.current) return;

    lastTickRef.current = performance.now();

    const animate = (currentTime: number) => {
      const dtMs = Math.min(64, currentTime - lastTickRef.current);
      lastTickRef.current = currentTime;

      // 1 real second = simSpeed simulation minutes
      // Cada frame de ~16.6ms avanza una fracción suave de minuto
      const deltaMinutes = (simSpeed * dtMs) / 1000;

      if (deltaMinutes > 0 && engineRef.current) {
        engineRef.current.tick(deltaMinutes);

        const clients = engineRef.current.getClients();
        const hour = engineRef.current.getCurrentHour();

        setSimClients([...clients]);
        setSimTime(hour);

        // Actualizar estadísticas en vivo
        setStats({
          clientesActivos: clients.length,
          caminando: clients.filter((c) => c.estado === 'caminando').length,
          ejercitando: clients.filter((c) => c.estado === 'ejercitando').length,
          esperando: clients.filter((c) => c.estado === 'esperando').length,
          saliendo: clients.filter((c) => c.estado === 'saliendo').length,
          atendidos: engineRef.current.getMetrics().clientesAtendidos,
        });

        // Actualizar métricas periódicamente
        if (Math.random() < 0.05) {
          setSimMetrics(engineRef.current.getMetrics());
        }

        // Detener a las 22:00
        if (hour >= 22) {
          setSimRunning(false);
          setSimMetrics(engineRef.current.getMetrics());
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [simRunning, simSpeed, setSimClients, setSimTime, setSimMetrics, setSimRunning]);

  const handlePlayPause = () => {
    if (!engineRef.current) initEngine();
    setSimRunning(!simRunning);
  };

  const handleStep = (minutes: number = 1.0) => {
    if (!engineRef.current) initEngine();
    if (minutes > 0) {
      engineRef.current!.tick(minutes);
      setSimClients([...engineRef.current!.getClients()]);
      setSimTime(engineRef.current!.getCurrentHour());
      const clients = engineRef.current!.getClients();
      setStats({
        clientesActivos: clients.length,
        caminando: clients.filter((c) => c.estado === 'caminando').length,
        ejercitando: clients.filter((c) => c.estado === 'ejercitando').length,
        esperando: clients.filter((c) => c.estado === 'esperando').length,
        saliendo: clients.filter((c) => c.estado === 'saliendo').length,
        atendidos: engineRef.current!.getMetrics().clientesAtendidos,
      });
    }
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

  const selectedClient = simClients.find((c) => c.id === simSelectedClientId);
  const selectedClientTargetMachine = selectedClient?.targetMachineId
    ? machines.find((m) => m.id === selectedClient.targetMachineId)
    : null;

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none">
      {/* Header y controles */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>🎮</span> Simulación de Flujo
            </h2>
            <p className="text-xs text-zinc-400">
              DES Interactivo — {placedCount} máquinas activas ({activePlanta === 'baja' ? 'Planta Baja' : 'Planta Alta'})
            </p>
          </div>

          {/* Reloj Digital */}
          <div className="text-right bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            <div className="text-2xl font-mono font-bold text-orange-400">
              {formatTime(simTime)}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Hora simulada</div>
          </div>
        </div>

        {/* Controles de transporte (Fase 11) */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40"
            onClick={handleReset}
            title="Reiniciar a las 06:00"
            aria-label="Reiniciar simulación"
          >
            <RotateCcw size={16} />
          </button>

          <button
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40"
            onClick={() => handleStep(5)}
            disabled={simRunning}
            title="Retroceder (avanzar 5 min)"
            aria-label="Avanzar 5 minutos"
          >
            <Rewind size={16} />
          </button>

          <button
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
              simRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            onClick={handlePlayPause}
            aria-label={simRunning ? 'Pausar simulación' : 'Iniciar simulación'}
          >
            {simRunning ? <Pause size={16} /> : <Play size={16} />}
            {simRunning ? 'Pausar' : 'Iniciar'}
          </button>

          <button
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40"
            onClick={() => handleStep(1)}
            disabled={simRunning}
            title="Avanzar 1 minuto"
            aria-label="Avanzar 1 minuto"
          >
            <FastForward size={16} />
          </button>

          <button
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40"
            onClick={() => handleStep(15)}
            disabled={simRunning}
            title="Avanzar 15 minutos"
            aria-label="Avanzar 15 minutos"
          >
            <SkipForward size={16} />
          </button>

          {/* Stats en vivo compactos */}
          <div className="ml-auto flex items-center gap-3 text-[10px]">
            <span className="text-zinc-400">
              🏃 <span className="font-mono font-bold text-sky-400">{stats.clientesActivos}</span>
            </span>
            <span className="text-zinc-400">
              ⏳ <span className="font-mono font-bold text-amber-400">{stats.esperando}</span>
            </span>
          </div>
        </div>

        {/* Timeline scrubber (Fase 11) */}
        <div className="mb-3">
          <TimelineScrubber
            currentHour={simTime}
            onChange={(h) => {
              if (engineRef.current && !simRunning) {
                // Solo se puede ir hacia adelante (la simulación no soporta ir atrás)
                const delta = h - engineRef.current.getCurrentHour();
                if (delta > 0) {
                  engineRef.current.tick(delta * 60); // convertir horas a minutos
                  setSimClients([...engineRef.current.getClients()]);
                  setSimTime(engineRef.current.getCurrentHour());
                }
              }
            }}
            disabled={simRunning}
          />
        </div>

        {/* Selector de Velocidad */}
        <div className="flex items-center gap-2 p-2 bg-zinc-900/90 rounded-lg border border-zinc-800/80 mb-3">
          <span className="text-xs font-semibold text-zinc-400">Velocidad:</span>
          {[0.5, 1, 2, 5, 10, 25, 50].map((speed) => (
            <button
              key={speed}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                simSpeed === speed
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
              onClick={() => setSimSpeed(speed)}
              aria-label={`Velocidad ${speed}x`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Toggles de Visualización en el Canvas */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              simShowTrajectories
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            onClick={toggleSimTrajectories}
            title="Muestra líneas discontinuas hacia la máquina destino de cada cliente"
          >
            <Navigation size={14} /> Trayectorias
          </button>

          <button
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              simShowQueues
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            onClick={toggleSimQueues}
            title="Muestra las filas de personas esperando ordenadas fuera de las máquinas"
          >
            <Users size={14} /> Filas en cola
          </button>

          <button
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              simShowLabels
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            onClick={toggleSimLabels}
            title="Muestra etiquetas de número de cliente y estado en el canvas"
          >
            <Eye size={14} /> Etiquetas
          </button>

          <button
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              showHeatmap
                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            onClick={toggleHeatmap}
            title="Capa de calor con zonas de mayor congestión y circulación"
          >
            <MapPin size={14} /> Mapa de calor
          </button>
        </div>

        {/* Leyenda del heatmap (Fase 11) — visible cuando heatmap está activo */}
        {showHeatmap && (
          <div className="mt-2 p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Densidad de tráfico</span>
              <span className="text-[9px] text-zinc-500">personas/zona</span>
            </div>
            <div className="flex items-center gap-0.5 h-3 rounded-sm overflow-hidden">
              <div className="flex-1 h-full" style={{ background: '#38BDF8' }} />
              <div className="flex-1 h-full" style={{ background: '#22C55E' }} />
              <div className="flex-1 h-full" style={{ background: '#EAB308' }} />
              <div className="flex-1 h-full" style={{ background: '#F97316' }} />
              <div className="flex-1 h-full" style={{ background: '#EF4444' }} />
            </div>
            <div className="flex justify-between mt-0.5 text-[8px] text-zinc-500">
              <span>Bajo</span>
              <span>Medio</span>
              <span>Alto</span>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas en vivo */}
      <div className="grid grid-cols-5 gap-2 p-3 border-b border-zinc-800 bg-zinc-900/40">
        <StatCard
          label="En el gym"
          value={stats.clientesActivos}
          color="#38BDF8"
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
          label="En espera"
          value={stats.esperando}
          color={CLIENT_STATE_COLORS.esperando}
        />
        <StatCard
          label="Finalizados"
          value={stats.atendidos}
          color="#A855F7"
        />
      </div>

      {/* Panel Inspector de Cliente Seleccionado (si se hizo clic en el canvas) */}
      {selectedClient && (
        <div className="p-3 m-3 bg-zinc-900 border border-sky-500/40 rounded-xl shadow-lg relative animate-fadeIn">
          <button
            onClick={() => setSimSelectedClientId(null)}
            className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-100 p-1 rounded-full hover:bg-zinc-800"
            title="Cerrar inspector"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block"
              style={{ backgroundColor: CLIENT_STATE_COLORS[selectedClient.estado] }}
            />
            <span className="font-bold text-sm text-zinc-100">
              {selectedClient.name || 'Cliente'}
            </span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {ROUTINE_CONFIG[selectedClient.rutina]?.label || selectedClient.rutina}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 mb-2">
            <div>
              <span className="text-zinc-500 text-[10px] block">Estado actual:</span>
              <span className="capitalize font-medium text-zinc-200">
                {selectedClient.estado}
                {selectedClient.estado === 'esperando' && selectedClient.queuePosition !== undefined && (
                  ` (#${selectedClient.queuePosition + 1} en fila)`
                )}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] block">Objetivo:</span>
              <span className="font-medium text-sky-400 truncate block">
                {selectedClient.estado === 'saliendo'
                  ? '🚪 Salida del gimnasio'
                  : selectedClientTargetMachine?.nombre || 'Buscando máquina'}
              </span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/70">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="text-zinc-500">Circuito de máquinas:</span>
              <span className="text-zinc-300 font-mono">
                {selectedClient.machinesVisited.length} / {selectedClient.machinesVisited.length + (selectedClient.targetMachineId ? 1 : 0) + selectedClient.machinesPending.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedClient.machinesVisited.map((mid, i) => {
                const m = machines.find((x) => x.id === mid);
                return (
                  <span
                    key={mid + i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1"
                  >
                    <CheckCircle size={10} /> {m?.nombre || 'Máquina'}
                  </span>
                );
              })}
              {selectedClient.targetMachineId && selectedClient.estado !== 'saliendo' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-700/50 font-medium animate-pulse">
                  ▶ {selectedClientTargetMachine?.nombre || 'Actual'}
                </span>
              )}
              {selectedClient.machinesPending.map((mid, i) => {
                const m = machines.find((x) => x.id === mid);
                return (
                  <span
                    key={mid + i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400 border border-zinc-700/30"
                  >
                    {m?.nombre || 'Pendiente'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Configuración de parámetros */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Distribución de rutinas */}
        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            Distribución de Rutinas
          </h3>
          <div className="space-y-2">
            {(Object.entries(routineDist) as [RoutineType, number][]).map(
              ([type, pct]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300 w-24 truncate font-medium">
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
                    className="flex-1 accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-zinc-400 font-mono w-8 text-right">
                    {pct}%
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Curva y Multiplicador de Llegadas */}
        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Afluencia de Clientes
            </h3>
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/40">
              {arrivalMultiplier.toFixed(1)}x
            </span>
          </div>
          <ArrivalCurve currentHour={simTime} />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-400">Demanda:</span>
            <input
              type="range"
              min={0.2}
              max={3.0}
              step={0.1}
              value={arrivalMultiplier}
              onChange={(e) =>
                setArrivalMultiplier(parseFloat(e.target.value))
              }
              className="flex-1 accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-zinc-400 font-mono">
              {arrivalMultiplier >= 2 ? 'Pico Alto' : arrivalMultiplier >= 1 ? 'Normal' : 'Bajo'}
            </span>
          </div>
        </div>

        {/* Leyenda de Estados */}
        <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/60">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Referencia de Puntos
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              Object.entries(CLIENT_STATE_COLORS) as [string, string][]
            ).map(([state, color]) => (
              <div key={state} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-zinc-300 capitalize text-[11px]">
                  {state}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 italic">
            * Haz clic en cualquier cliente en el plano para inspeccionar su recorrido y máquinas.
          </p>
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
    <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800/90 text-center">
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] text-zinc-400 mt-0.5 truncate uppercase tracking-tight">{label}</div>
    </div>
  );
}

/** Gráfico de barras de la curva horaria de llegadas */
function ArrivalCurve({ currentHour }: { currentHour: number }) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const rates = hours.map((h) => {
    if (h < 6 || h >= 22) return 0;
    if (h >= 7 && h < 9) return 36;
    if (h >= 12 && h < 14) return 28;
    if (h >= 17 && h < 20) return 45;
    if (h >= 6 && h < 7) return 12;
    if (h >= 9 && h < 11) return 18;
    if (h >= 11 && h < 12) return 14;
    if (h >= 14 && h < 16) return 10;
    if (h >= 16 && h < 17) return 20;
    if (h >= 20 && h < 22) return 18;
    return 8;
  });
  const maxRate = Math.max(...rates);

  return (
    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
      <div className="flex items-end gap-0.5 h-16">
        {hours.map((h, i) => {
          const height = (rates[i] / maxRate) * 100;
          const isCurrent = Math.floor(currentHour) === h;
          return (
            <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${Math.max(4, height)}%`,
                  backgroundColor: isCurrent ? '#F97316' : '#3B82F6',
                  opacity: isCurrent ? 1 : 0.45,
                }}
              />
              <span className="text-[7px] text-zinc-500 font-mono">{h}</span>
            </div>
          );
        })}
      </div>
      <div className="text-[9px] text-zinc-500 text-center mt-1">
        Curva de demanda por hora
      </div>
    </div>
  );
}

/** Timeline scrubber (Fase 11) — barra arrastrable 6am-10pm */
function TimelineScrubber({
  currentHour,
  onChange,
  disabled,
}: {
  currentHour: number;
  onChange: (hour: number) => void;
  disabled: boolean;
}) {
  const START = 6;
  const END = 22;
  const pct = ((currentHour - START) / (END - START)) * 100;

  // Horas pico marcadas
  const peakHours = [7, 8, 12, 13, 17, 18, 19];

  const formatH = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/80">
      {/* Hora actual */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-500 font-medium">Timeline</span>
        <span className="text-xs font-mono font-bold text-orange-400">{formatH(currentHour)}</span>
      </div>

      {/* Barra con marcadores */}
      <div className="relative h-6">
        {/* Track */}
        <div className="absolute top-2.5 left-0 right-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          {/* Progreso */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-orange-500 to-red-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>

        {/* Marcadores de horas pico */}
        {peakHours.map((h) => {
          const hp = ((h - START) / (END - START)) * 100;
          return (
            <div
              key={h}
              className="absolute top-0 w-1 h-2 rounded-sm"
              style={{
                left: `${hp}%`,
                backgroundColor: currentHour >= h ? '#F97316' : '#52525B',
                transform: 'translateX(-50%)',
              }}
              title={`Hora pico: ${h}:00`}
            />
          );
        })}

        {/* Input range invisible para controlar */}
        <input
          type="range"
          min={START}
          max={END}
          step={0.05}
          value={Math.min(END, Math.max(START, currentHour))}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Timeline de simulación"
        />

        {/* Thumb indicador */}
        <div
          className="absolute top-1 w-3 h-3 rounded-full border-2 border-white bg-orange-500 shadow-md transition-all pointer-events-none"
          style={{
            left: `${Math.min(100, Math.max(0, pct))}%`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Etiquetas de hora */}
      <div className="flex justify-between mt-1 text-[8px] text-zinc-600 font-mono">
        <span>06:00</span>
        <span>10:00</span>
        <span>14:00</span>
        <span>18:00</span>
        <span>22:00</span>
      </div>
    </div>
  );
}
