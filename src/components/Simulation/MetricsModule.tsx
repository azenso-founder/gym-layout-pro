// ==========================================
// Módulo de Métricas — Dashboard con KPIs
// ==========================================

import useStore from '../../stores/useStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../types';

export default function MetricsModule() {
  const simMetrics = useStore((s) => s.simMetrics);
  const machines = useStore((s) => s.machines);
  const activePlanta = useStore((s) => s.activePlanta);
  const getSuperficieUsada = useStore((s) => s.getSuperficieUsada);
  const getSuperficieDisponible = useStore((s) => s.getSuperficieDisponible);

  const supUsada = getSuperficieUsada(activePlanta);
  const supDisponible = getSuperficieDisponible(activePlanta);
  const placedMachines = machines.filter(
    (m) => m.planta === activePlanta && m.placed
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-200">
          📊 Dashboard de Métricas
        </h2>
        <p className="text-xs text-zinc-500">
          {activePlanta === 'baja' ? 'Planta Baja' : 'Planta Alta'}
        </p>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-4 gap-4 p-4">
        <KPICard
          title="Superficie Guerchet"
          value={`${supUsada} m²`}
          subtitle={`de ${supDisponible} m² disponibles`}
          percentage={Math.round((supUsada / supDisponible) * 100)}
          color={supUsada > supDisponible ? '#EF4444' : '#22C55E'}
        />
        <KPICard
          title="Máquinas colocadas"
          value={String(placedMachines.length)}
          subtitle={`de ${machines.filter((m) => m.planta === activePlanta).length} totales`}
          color="#3B82F6"
        />
        <KPICard
          title="Clientes atendidos"
          value={simMetrics ? String(simMetrics.clientesAtendidos) : '—'}
          subtitle="en la simulación"
          color="#F97316"
        />
        <KPICard
          title="Capacidad máxima"
          value={simMetrics ? String(simMetrics.capacidadMaxima) : '—'}
          subtitle="simultáneos"
          color="#8B5CF6"
        />
      </div>

      {/* Métricas de simulación */}
      {simMetrics ? (
        <>
          <div className="grid grid-cols-3 gap-4 px-4 pb-4">
            <KPICard
              title="Tiempo promedio"
              value={`${simMetrics.tiempoPromedioEnGym} min`}
              subtitle="por cliente en el gym"
              color="#10B981"
            />
            <KPICard
              title="% que esperaron"
              value={`${simMetrics.porcentajeEsperaron}%`}
              subtitle="más de 2 minutos"
              color={simMetrics.porcentajeEsperaron > 30 ? '#EF4444' : '#22C55E'}
            />
            <KPICard
              title="Throughput"
              value={
                simMetrics.machineMetrics.length > 0
                  ? `${(
                      simMetrics.machineMetrics.reduce(
                        (s, m) => s + m.throughput,
                        0
                      ) / simMetrics.machineMetrics.length
                    ).toFixed(1)}`
                  : '—'
              }
              subtitle="clientes/hora promedio"
              color="#3B82F6"
            />
          </div>

          {/* Gráfico de utilización por máquina */}
          <div className="px-4 pb-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              Utilización por máquina
            </h3>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 space-y-2 max-h-80 overflow-y-auto">
              {simMetrics.machineMetrics
                .filter((m) => m.utilizacion > 0)
                .map((mm) => {
                  const machine = placedMachines.find(
                    (m) => m.id === mm.machineId
                  );
                  const cat = machine?.categoria || 'accesorios';
                  const color =
                    CATEGORY_COLORS[
                      cat as keyof typeof CATEGORY_COLORS
                    ];
                  return (
                    <div key={mm.machineId} className="flex items-center gap-2">
                      <div className="w-40 text-xs text-zinc-400 truncate">
                        {mm.nombre}
                      </div>
                      <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round(mm.utilizacion * 100)}%`,
                            backgroundColor: color,
                            opacity:
                              mm.utilizacion > 0.8 ? 1 : 0.7,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium w-10 text-right"
                        style={{
                          color:
                            mm.utilizacion > 0.8
                              ? '#EF4444'
                              : '#22C55E',
                        }}
                      >
                        {Math.round(mm.utilizacion * 100)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-zinc-600">
          <div className="text-center">
            <p className="text-3xl mb-3">🎮</p>
            <p className="text-sm">Ejecuta la simulación para ver métricas</p>
            <p className="text-xs text-zinc-700 mt-1">
              Ve al tab "Simulación" y presiona "Iniciar"
            </p>
          </div>
        </div>
      )}

      {/* Resumen de superficie por categoría */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">
          Superficie Guerchet por categoría
        </h3>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const catMachines = placedMachines.filter(
              (m) => m.categoria === cat
            );
            if (catMachines.length === 0) return null;
            const catSt = catMachines.reduce((sum, m) => {
              const Ss = m.largo * m.ancho;
              const Sg = Ss * m.N;
              const Se = m.K * (Ss + Sg);
              return sum + Ss + Sg + Se;
            }, 0);

            return (
              <div key={cat} className="flex items-center gap-2 py-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[
                        cat as keyof typeof CATEGORY_COLORS
                      ],
                  }}
                />
                <span className="text-xs text-zinc-400 w-28">{label}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (catSt / supDisponible) * 100
                      )}%`,
                      backgroundColor:
                        CATEGORY_COLORS[
                          cat as keyof typeof CATEGORY_COLORS
                        ],
                    }}
                  />
                </div>
                <span className="text-xs text-zinc-300 w-16 text-right">
                  {catSt.toFixed(1)} m²
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  percentage,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  percentage?: number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-zinc-600 mt-1">{subtitle}</div>
      {percentage !== undefined && (
        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, percentage)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      )}
    </div>
  );
}
