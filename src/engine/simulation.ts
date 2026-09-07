// ==========================================
// Motor de Simulación DES (Discrete Event Simulation)
// Simula flujo de clientes en el gimnasio
// ==========================================

import { v4 as uuid } from 'uuid';
import { ROUTINE_CONFIG } from '../types';
import type {
  MachineInstance,
  SimClient,
  RoutineType,
  ClientState,
  SimulationMetrics,
  MachineMetrics,
} from '../types';

// ---- Utilidades estadísticas ----

/** Distribución triangular */
function triangular(min: number, moda: number, max: number): number {
  const u = Math.random();
  const fc = (moda - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (moda - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - moda));
}

/** Distribución exponencial (para llegadas Poisson) */
function exponential(rate: number): number {
  return -Math.log(1 - Math.random()) / rate;
}

/** Seleccionar rutina según probabilidades */
function selectRoutine(): RoutineType {
  const r = Math.random();
  let cumulative = 0;
  for (const [type, config] of Object.entries(ROUTINE_CONFIG)) {
    cumulative += config.probability;
    if (r <= cumulative) return type as RoutineType;
  }
  return 'piernas';
}

// ---- Tasa de llegada por hora ----

/** Tasa de llegada (clientes/hora) según hora del día */
function arrivalRate(hour: number): number {
  // Picos: 7-9am, 12-2pm, 5-8pm
  if (hour < 6) return 0;
  if (hour >= 22) return 0;
  if (hour >= 6 && hour < 7) return 10;
  if (hour >= 7 && hour < 9) return 30;
  if (hour >= 9 && hour < 11) return 15;
  if (hour >= 11 && hour < 12) return 10;
  if (hour >= 12 && hour < 14) return 25;
  if (hour >= 14 && hour < 16) return 5;
  if (hour >= 16 && hour < 17) return 15;
  if (hour >= 17 && hour < 20) return 40;
  if (hour >= 20 && hour < 22) return 15;
  return 5;
}

// ---- Estado de la simulación ----

interface MachineState {
  machineId: string;
  busy: boolean;
  clientId: string | null;
  queue: string[];
  totalClients: number;
  totalBusyTime: number;
  totalWaitTime: number;
}

interface SimState {
  time: number;           // Tiempo actual en minutos desde las 0:00
  clients: SimClient[];
  machineStates: Map<string, MachineState>;
  arrivedCount: number;
  finishedCount: number;
  metrics: {
    totalWaitTime: number;
    totalServiceTime: number;
    clientsWhoWaited: number;
    totalDistance: number;
  };
}

export class SimulationEngine {
  private state: SimState;
  private machines: MachineInstance[];
  private seed: number;

  constructor(machines: MachineInstance[], seed = 42) {
    this.machines = machines.filter((m) => m.placed);
    this.seed = seed;
    this.state = this.initState();
  }

  private initState(): SimState {
    const machineStates = new Map<string, MachineState>();
    for (const m of this.machines) {
      machineStates.set(m.id, {
        machineId: m.id,
        busy: false,
        clientId: null,
        queue: [],
        totalClients: 0,
        totalBusyTime: 0,
        totalWaitTime: 0,
      });
    }
    return {
      time: 6 * 60, // Empieza a las 6:00
      clients: [],
      machineStates,
      arrivedCount: 0,
      finishedCount: 0,
      metrics: {
        totalWaitTime: 0,
        totalServiceTime: 0,
        clientsWhoWaited: 0,
        totalDistance: 0,
      },
    };
  }

  /** Resetear simulación */
  reset(): void {
    this.state = this.initState();
  }

  /** Obtener hora actual como fracción (para display) */
  getCurrentHour(): number {
    return this.state.time / 60;
  }

  /** Obtener clientes actuales */
  getClients(): SimClient[] {
    return this.state.clients;
  }

  /** Avanzar un tick de simulación (1 minuto simulado) */
  tick(): void {
    const hour = this.state.time / 60;
    if (hour >= 22) return; // Gym cerrado

    // 1. Generar llegadas
    const rate = arrivalRate(hour);
    const expectedArrivals = rate / 60; // por minuto
    if (Math.random() < expectedArrivals) {
      this.spawnClient();
    }

    // 2. Procesar cada cliente
    const toRemove: string[] = [];
    for (const client of this.state.clients) {
      this.processClient(client, toRemove);
    }

    // 3. Remover clientes que terminaron
    this.state.clients = this.state.clients.filter(
      (c) => !toRemove.includes(c.id)
    );
    this.state.finishedCount += toRemove.length;

    // 4. Avanzar tiempo
    this.state.time += 1;
  }

  /** Crear un nuevo cliente */
  private spawnClient(): void {
    const rutina = selectRoutine();
    const config = ROUTINE_CONFIG[rutina];
    const numMachines =
      config.machines[0] +
      Math.floor(Math.random() * (config.machines[1] - config.machines[0] + 1));

    // Seleccionar máquinas compatibles con la rutina
    const compatibleMachines = this.getCompatibleMachines(rutina);
    const selectedMachines: string[] = [];
    const shuffled = [...compatibleMachines].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numMachines, shuffled.length); i++) {
      selectedMachines.push(shuffled[i].id);
    }

    if (selectedMachines.length === 0) return;

    // Posición inicial: entrada del gym (esquina inferior izquierda)
    const client: SimClient = {
      id: uuid(),
      rutina,
      estado: 'caminando',
      x: 50 + Math.random() * 30,
      y: 50 + Math.random() * 30,
      targetMachineId: selectedMachines[0],
      machinesVisited: [],
      machinesPending: selectedMachines.slice(1),
      waitTime: 0,
      totalTime: 0,
      arrivalTime: this.state.time,
    };

    this.state.clients.push(client);
    this.state.arrivedCount++;
  }

  /** Obtener máquinas compatibles con una rutina */
  private getCompatibleMachines(rutina: RoutineType): MachineInstance[] {
    switch (rutina) {
      case 'piernas':
        return this.machines.filter(
          (m) => m.categoria === 'piernas' || m.categoria === 'racks'
        );
      case 'tren_superior':
        return this.machines.filter(
          (m) =>
            m.categoria === 'tren_superior' ||
            m.categoria === 'poleas' ||
            m.categoria === 'racks'
        );
      case 'full_body':
        return this.machines.filter(
          (m) =>
            m.categoria !== 'cardio' && m.categoria !== 'funcional'
        );
      case 'cardio':
        return this.machines.filter((m) => m.categoria === 'cardio');
      case 'funcional':
        return this.machines.filter(
          (m) => m.categoria === 'funcional' || m.categoria === 'accesorios'
        );
    }
  }

  /** Procesar un cliente en un tick */
  private processClient(client: SimClient, toRemove: string[]): void {
    client.totalTime++;

    switch (client.estado) {
      case 'caminando': {
        // Mover hacia la máquina objetivo
        if (!client.targetMachineId) {
          // Ya terminó su rutina, sale del gym
          toRemove.push(client.id);
          return;
        }
        const target = this.machines.find(
          (m) => m.id === client.targetMachineId
        );
        if (!target) {
          client.targetMachineId = client.machinesPending.shift() || null;
          return;
        }

        // Movimiento simple hacia la máquina
        const dx = target.x - client.x;
        const dy = target.y - client.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 60; // pixels por tick (~1.2m/s * 50px/m / 60s)

        if (dist < speed) {
          // Llegó a la máquina
          client.x = target.x;
          client.y = target.y;
          const ms = this.state.machineStates.get(target.id);
          if (ms) {
            if (!ms.busy) {
              // Máquina libre: empezar a ejercitar
              ms.busy = true;
              ms.clientId = client.id;
              ms.totalClients++;
              client.estado = 'ejercitando';
              // Generar tiempo de servicio
              const ts = target.tiempoServicio;
              const serviceTime = triangular(ts.min, ts.moda, ts.max);
              (client as any)._serviceRemaining = Math.round(serviceTime);
            } else {
              // Máquina ocupada: esperar o buscar alternativa
              if (ms.queue.length < 3) {
                ms.queue.push(client.id);
                client.estado = 'esperando';
              } else {
                // Buscar alternativa del mismo tipo
                const alt = this.machines.find(
                  (m) =>
                    m.id !== target.id &&
                    m.categoria === target.categoria &&
                    m.placed &&
                    this.state.machineStates.get(m.id)?.busy === false
                );
                if (alt) {
                  client.targetMachineId = alt.id;
                } else {
                  ms.queue.push(client.id);
                  client.estado = 'esperando';
                }
              }
            }
          }
        } else {
          // Moverse
          client.x += (dx / dist) * speed;
          client.y += (dy / dist) * speed;
        }
        break;
      }

      case 'ejercitando': {
        const remaining = ((client as any)._serviceRemaining || 0) - 1;
        if (remaining <= 0) {
          // Terminó con esta máquina
          const ms = this.state.machineStates.get(
            client.targetMachineId!
          );
          if (ms) {
            ms.busy = false;
            ms.clientId = null;
            ms.totalBusyTime += (client as any)._serviceRemaining || 0;
            // Liberar al siguiente en cola
            if (ms.queue.length > 0) {
              const nextId = ms.queue.shift()!;
              const nextClient = this.state.clients.find(
                (c) => c.id === nextId
              );
              if (nextClient) {
                ms.busy = true;
                ms.clientId = nextId;
                ms.totalClients++;
                nextClient.estado = 'ejercitando';
                const target = this.machines.find(
                  (m) => m.id === client.targetMachineId
                );
                if (target) {
                  const ts = target.tiempoServicio;
                  (nextClient as any)._serviceRemaining = Math.round(
                    triangular(ts.min, ts.moda, ts.max)
                  );
                }
              }
            }
          }

          client.machinesVisited.push(client.targetMachineId!);
          client.targetMachineId =
            client.machinesPending.shift() || null;

          if (!client.targetMachineId) {
            toRemove.push(client.id);
          } else {
            client.estado = 'caminando';
          }
        } else {
          (client as any)._serviceRemaining = remaining;
        }
        break;
      }

      case 'esperando': {
        client.waitTime++;
        this.state.metrics.clientsWhoWaited++;
        // Verificar si la máquina se liberó
        const ms = this.state.machineStates.get(
          client.targetMachineId!
        );
        if (ms && !ms.busy && ms.queue[0] === client.id) {
          ms.queue.shift();
          ms.busy = true;
          ms.clientId = client.id;
          ms.totalClients++;
          client.estado = 'ejercitando';
          const target = this.machines.find(
            (m) => m.id === client.targetMachineId
          );
          if (target) {
            const ts = target.tiempoServicio;
            (client as any)._serviceRemaining = Math.round(
              triangular(ts.min, ts.moda, ts.max)
            );
          }
        }
        break;
      }

      case 'descansando':
        // Pausa entre máquinas (futuro)
        break;
    }
  }

  /** Obtener métricas de la simulación */
  getMetrics(): SimulationMetrics {
    const elapsedHours = Math.max(1, (this.state.time - 6 * 60) / 60);
    const machineMetrics: MachineMetrics[] = [];

    for (const [id, ms] of this.state.machineStates) {
      const machine = this.machines.find((m) => m.id === id);
      machineMetrics.push({
        machineId: id,
        nombre: machine?.nombre || 'Desconocida',
        utilizacion: Math.min(1, ms.totalBusyTime / (elapsedHours * 60)),
        tiempoColaPromedio:
          ms.totalClients > 0 ? ms.totalWaitTime / ms.totalClients : 0,
        throughput: ms.totalClients / elapsedHours,
        tiempoServicioPromedio:
          ms.totalClients > 0 ? ms.totalBusyTime / ms.totalClients : 0,
      });
    }

    const clientesFinalizados = this.state.finishedCount;
    const tiemposTotales = this.state.clients.map((c) => c.totalTime);
    const tiempoPromedio =
      tiemposTotales.length > 0
        ? tiemposTotales.reduce((a, b) => a + b, 0) / tiemposTotales.length
        : 0;

    return {
      clientesAtendidos: clientesFinalizados,
      tiempoPromedioEnGym: Math.round(tiempoPromedio),
      porcentajeEsperaron:
        this.state.arrivedCount > 0
          ? Math.round(
              (this.state.metrics.clientsWhoWaited /
                this.state.arrivedCount) *
                100
            )
          : 0,
      distanciaPromedioKm: 0, // Simplificado
      capacidadMaxima: Math.max(
        this.state.clients.length,
        this.state.arrivedCount > 0 ? this.state.clients.length : 0
      ),
      machineMetrics: machineMetrics.sort(
        (a, b) => b.utilizacion - a.utilizacion
      ),
    };
  }

  /** Obtener datos para heatmap (densidad por zona) */
  getHeatmapData(): { x: number; y: number; intensity: number }[] {
    const gridSize = 50;
    const grid: Map<string, number> = new Map();

    for (const client of this.state.clients) {
      const gx = Math.floor(client.x / gridSize) * gridSize;
      const gy = Math.floor(client.y / gridSize) * gridSize;
      const key = `${gx},${gy}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }

    const maxCount = Math.max(1, ...grid.values());
    return Array.from(grid.entries()).map(([key, count]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, intensity: count / maxCount };
    });
  }
}
