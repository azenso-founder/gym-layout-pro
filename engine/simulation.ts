// ==========================================
// Motor de Simulación DES (Discrete Event Simulation)
// Simula flujo dinámico y visual de clientes en el gimnasio
// ==========================================

import { v4 as uuid } from 'uuid';
import { ROUTINE_CONFIG } from '@/types';
import type {
  MachineInstance,
  SimClient,
  RoutineType,
  ClientState,
  SimulationMetrics,
  MachineMetrics,
} from '@/types';

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

// ---- Tasa de llegada por hora base ----

/** Tasa de llegada (clientes/hora) según hora del día */
function arrivalRate(hour: number): number {
  if (hour < 6 || hour >= 22) return 0;
  if (hour >= 6 && hour < 7) return 12;
  if (hour >= 7 && hour < 9) return 36;
  if (hour >= 9 && hour < 11) return 18;
  if (hour >= 11 && hour < 12) return 14;
  if (hour >= 12 && hour < 14) return 28;
  if (hour >= 14 && hour < 16) return 10;
  if (hour >= 16 && hour < 17) return 20;
  if (hour >= 17 && hour < 20) return 45;
  if (hour >= 20 && hour < 22) return 18;
  return 8;
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
  time: number; // Tiempo actual en minutos desde las 0:00 (ej. 6*60 = 360)
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
  private entrance: { x: number; y: number };
  private arrivalMultiplier: number;
  private routineDist?: Record<RoutineType, number>;
  private arrivalAccumulator: number = 0;

  constructor(
    machines: MachineInstance[],
    entrance?: { x: number; y: number },
    arrivalMultiplier = 1.0,
    routineDist?: Record<RoutineType, number>
  ) {
    this.machines = machines.filter((m) => m.placed);
    this.arrivalMultiplier = arrivalMultiplier;
    this.routineDist = routineDist;

    // Calcular o asignar entrada de manera segura
    const validMachines = this.machines.filter(
      (m) => Number.isFinite(m.x) && Number.isFinite(m.y)
    );
    if (
      entrance &&
      Number.isFinite(entrance.x) &&
      Number.isFinite(entrance.y) &&
      entrance.x > 0 &&
      entrance.y > 0
    ) {
      this.entrance = entrance;
    } else if (validMachines.length > 0) {
      const minX = Math.min(...validMachines.map((m) => m.x));
      const maxY = Math.max(...validMachines.map((m) => m.y));
      this.entrance = {
        x: Math.max(60, minX - 100),
        y: Math.min(800, maxY + 80),
      };
    } else {
      this.entrance = { x: 80, y: 700 };
    }

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

    this.arrivalAccumulator = 0;

    return {
      time: 6 * 60, // 06:00 AM
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

  /** Configurar multiplicador de llegadas */
  setArrivalMultiplier(m: number): void {
    this.arrivalMultiplier = Math.max(0.1, m);
  }

  /** Configurar distribución de rutinas */
  setRoutineDist(dist: Record<RoutineType, number>): void {
    this.routineDist = dist;
  }

  /** Configurar posición de entrada/salida */
  setEntrance(entrance: { x: number; y: number }): void {
    this.entrance = entrance;
  }

  /** Obtener entrada actual */
  getEntrance(): { x: number; y: number } {
    return this.entrance;
  }

  /** Resetear simulación */
  reset(): void {
    this.state = this.initState();
  }

  /** Hora actual como número decimal (ej. 7.5 = 07:30) */
  getCurrentHour(): number {
    return this.state.time / 60;
  }

  /** Lista de clientes en el gimnasio */
  getClients(): SimClient[] {
    return this.state.clients;
  }

  /** Seleccionar rutina considerando máquinas disponibles y configuración */
  private selectRoutine(): RoutineType {
    // Si se pasa routineDist, usar esos porcentajes
    const dist = this.routineDist || {
      piernas: ROUTINE_CONFIG.piernas.probability * 100,
      tren_superior: ROUTINE_CONFIG.tren_superior.probability * 100,
      full_body: ROUTINE_CONFIG.full_body.probability * 100,
      cardio: ROUTINE_CONFIG.cardio.probability * 100,
      funcional: ROUTINE_CONFIG.funcional.probability * 100,
    };

    // Filtrar sólo rutinas que tengan al menos una máquina compatible en la planta
    const validRoutines = (Object.keys(dist) as RoutineType[]).filter((r) => {
      return this.getCompatibleMachines(r).length > 0;
    });

    if (validRoutines.length === 0) {
      // Fallback a cualquier máquina colocada
      return 'full_body';
    }

    const totalWeight = validRoutines.reduce((acc, r) => acc + (dist[r] || 1), 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (const r of validRoutines) {
      cumulative += dist[r] || 1;
      if (rand <= cumulative) return r;
    }

    return validRoutines[0];
  }

  /** Obtener máquinas compatibles con una rutina */
  private getCompatibleMachines(rutina: RoutineType): MachineInstance[] {
    if (this.machines.length === 0) return [];

    let filtered: MachineInstance[] = [];
    switch (rutina) {
      case 'piernas':
        filtered = this.machines.filter(
          (m) => m.categoria === 'piernas' || m.categoria === 'racks'
        );
        break;
      case 'tren_superior':
        filtered = this.machines.filter(
          (m) =>
            m.categoria === 'tren_superior' ||
            m.categoria === 'poleas' ||
            m.categoria === 'racks'
        );
        break;
      case 'full_body':
        filtered = this.machines.filter(
          (m) => m.categoria !== 'cardio' && m.categoria !== 'funcional'
        );
        break;
      case 'cardio':
        filtered = this.machines.filter((m) => m.categoria === 'cardio');
        break;
      case 'funcional':
        filtered = this.machines.filter(
          (m) => m.categoria === 'funcional' || m.categoria === 'accesorios'
        );
        break;
    }

    // Si la planta no tiene máquinas específicas de esa categoría, permitir fallback a cualquier máquina
    if (filtered.length === 0 && this.machines.length > 0) {
      return this.machines;
    }

    return filtered;
  }

  /** Crear un nuevo cliente en el punto de acceso */
  private spawnClient(): void {
    if (this.machines.length === 0) return;

    const rutina = this.selectRoutine();
    const config = ROUTINE_CONFIG[rutina] || ROUTINE_CONFIG.piernas;
    const numMachines = Math.min(
      this.machines.length,
      config.machines[0] +
        Math.floor(Math.random() * (config.machines[1] - config.machines[0] + 1))
    );

    const compatible = this.getCompatibleMachines(rutina);
    const available = compatible.length > 0 ? compatible : this.machines;

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selectedMachines: string[] = [];
    for (let i = 0; i < Math.min(numMachines, shuffled.length); i++) {
      selectedMachines.push(shuffled[i].id);
    }

    if (selectedMachines.length === 0) return;

    const firstTarget = this.machines.find((m) => m.id === selectedMachines[0]);

    // Dispersión inicial alrededor de la entrada
    const spawnJitterX = (Math.random() - 0.5) * 30;
    const spawnJitterY = (Math.random() - 0.5) * 30;
    const entranceX = Number.isFinite(this.entrance?.x) ? this.entrance.x : 80;
    const entranceY = Number.isFinite(this.entrance?.y) ? this.entrance.y : 700;
    const startX = entranceX + spawnJitterX;
    const startY = entranceY + spawnJitterY;

    const clientNumber = this.state.arrivedCount + 1;
    const client: SimClient = {
      id: uuid(),
      name: `Cliente #${clientNumber}`,
      rutina,
      estado: 'caminando',
      x: startX,
      y: startY,
      targetMachineId: selectedMachines[0],
      targetX: firstTarget?.x ?? startX,
      targetY: firstTarget?.y ?? startY,
      machinesVisited: [],
      machinesPending: selectedMachines.slice(1),
      waitTime: 0,
      totalTime: 0,
      arrivalTime: this.state.time,
      queuePosition: 0,
    };

    this.state.clients.push(client);
    this.state.arrivedCount++;
  }

  /** Avanzar simulación en `deltaMinutes` (admite fracciones de minuto para 60fps fluidos) */
  tick(deltaMinutes = 1.0): void {
    const hour = this.state.time / 60;
    if (hour >= 22.0) return; // Gimnasio cerrado

    // 1. Generación de llegadas proporcional al delta
    const rate = arrivalRate(hour) * this.arrivalMultiplier;
    const expectedArrivals = (rate / 60) * deltaMinutes;
    this.arrivalAccumulator += expectedArrivals;

    while (this.arrivalAccumulator >= 1.0) {
      this.spawnClient();
      this.arrivalAccumulator -= 1.0;
    }
    if (Math.random() < this.arrivalAccumulator) {
      this.spawnClient();
      this.arrivalAccumulator = 0;
    }

    // 2. Procesar cada cliente
    const toRemove: string[] = [];
    for (const client of this.state.clients) {
      this.processClient(client, deltaMinutes, toRemove);
    }

    // 3. Remover clientes que llegaron a la salida
    if (toRemove.length > 0) {
      this.state.clients = this.state.clients.filter((c) => !toRemove.includes(c.id));
      this.state.finishedCount += toRemove.length;
    }

    // 4. Avanzar tiempo
    this.state.time += deltaMinutes;
  }

  /** Calcular posición visual para clientes formados en cola fuera de una máquina */
  private calculateQueuePosition(
    machine: MachineInstance,
    queueIndex: number
  ): { x: number; y: number } {
    const mx = Number.isFinite(machine.x) ? machine.x : 100;
    const my = Number.isFinite(machine.y) ? machine.y : 100;
    const mRot = Number.isFinite(machine.rotation) ? machine.rotation : 0;
    const mLargo = Number.isFinite(machine.largo) ? machine.largo : 1.5;
    const mAncho = Number.isFinite(machine.ancho) ? machine.ancho : 1.0;

    // Proyectar fila en un ángulo libre fuera del área de trabajo
    const rot = (mRot + 120) * (Math.PI / 180);
    const baseDist = Math.max(mLargo, mAncho) * 28 + 25;
    const stepDist = 20; // Separación entre personas en fila
    const dist = baseDist + queueIndex * stepDist;

    return {
      x: mx + Math.cos(rot) * dist,
      y: my + Math.sin(rot) * dist,
    };
  }

  /** Procesar ciclo de vida y movimiento de un cliente en un tick */
  private processClient(
    client: SimClient,
    deltaMinutes: number,
    toRemove: string[]
  ): void {
    client.totalTime += deltaMinutes;

    // Velocidad de caminata: ~1.2 m/s = 72 m/min. Con 50px/m -> ~3600 px/min
    // En cada paso avanzamos pixels proporcionales a deltaMinutes
    const walkSpeedPx = Math.max(3.5, 3200 * deltaMinutes);

    switch (client.estado) {
      case 'caminando': {
        if (!client.targetMachineId) {
          // No tiene más máquinas, dirigir a salida
          client.estado = 'saliendo';
          client.targetX = Number.isFinite(this.entrance?.x) ? this.entrance.x : 80;
          client.targetY = Number.isFinite(this.entrance?.y) ? this.entrance.y : 700;
          return;
        }

        const target = this.machines.find((m) => m.id === client.targetMachineId);
        if (!target) {
          client.targetMachineId = client.machinesPending.shift() || null;
          return;
        }

        // Fijar destino en el centro de la máquina
        const tx = Number.isFinite(target.x) ? target.x : client.x;
        const ty = Number.isFinite(target.y) ? target.y : client.y;
        client.targetX = tx;
        client.targetY = ty;

        const dx = tx - client.x;
        const dy = ty - client.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!Number.isFinite(dist) || dist <= walkSpeedPx || dist < 0.001) {
          // Llegó a la máquina objetivo
          client.x = tx;
          client.y = ty;

          const ms = this.state.machineStates.get(target.id);
          if (ms) {
            if (!ms.busy) {
              // Máquina libre: empezar ejercicio
              ms.busy = true;
              ms.clientId = client.id;
              ms.totalClients++;
              client.estado = 'ejercitando';

              const ts = target.tiempoServicio || { min: 4, moda: 7, max: 10 };
              const serviceTime = triangular(ts.min, ts.moda, ts.max);
              client.serviceTotal = serviceTime;
              client.serviceRemaining = serviceTime;
            } else {
              // Máquina ocupada: verificar cola o buscar alternativa
              if (ms.queue.length < 4) {
                ms.queue.push(client.id);
                client.estado = 'esperando';
                client.queuePosition = ms.queue.length - 1;
                const qPos = this.calculateQueuePosition(target, client.queuePosition);
                client.targetX = qPos.x;
                client.targetY = qPos.y;
              } else {
                // Buscar máquina equivalente con menor congestión
                const alt = this.machines.find(
                  (m) =>
                    m.id !== target.id &&
                    m.categoria === target.categoria &&
                    m.placed &&
                    this.state.machineStates.get(m.id)?.busy === false
                );

                if (alt) {
                  client.targetMachineId = alt.id;
                  client.targetX = alt.x;
                  client.targetY = alt.y;
                } else {
                  // Entrar a la cola
                  ms.queue.push(client.id);
                  client.estado = 'esperando';
                  client.queuePosition = ms.queue.length - 1;
                  const qPos = this.calculateQueuePosition(target, client.queuePosition);
                  client.targetX = qPos.x;
                  client.targetY = qPos.y;
                }
              }
            }
          }
        } else {
          // Desplazamiento suave continuo
          client.x += (dx / dist) * walkSpeedPx;
          client.y += (dy / dist) * walkSpeedPx;
        }
        break;
      }

      case 'esperando': {
        client.waitTime += deltaMinutes;
        this.state.metrics.totalWaitTime += deltaMinutes;

        const ms = this.state.machineStates.get(client.targetMachineId!);
        const target = this.machines.find((m) => m.id === client.targetMachineId);

        if (!ms || !target) {
          client.estado = 'caminando';
          client.targetMachineId = client.machinesPending.shift() || null;
          return;
        }

        const qIdx = ms.queue.indexOf(client.id);
        client.queuePosition = qIdx >= 0 ? qIdx : 0;

        // Mantener posición visual escalonada en fila
        const qPos = this.calculateQueuePosition(target, client.queuePosition);
        client.targetX = qPos.x;
        client.targetY = qPos.y;

        // Desplazar suavemente al cliente hacia su lugar en la fila
        const qdx = qPos.x - client.x;
        const qdy = qPos.y - client.y;
        const qDist = Math.sqrt(qdx * qdx + qdy * qdy);
        if (qDist > 2) {
          const shiftSpeed = Math.min(qDist, walkSpeedPx * 0.8);
          client.x += (qdx / qDist) * shiftSpeed;
          client.y += (qdy / qDist) * shiftSpeed;
        }

        // Si la máquina se desocupó y este cliente es el primero en turno
        if (!ms.busy && qIdx === 0) {
          ms.queue.shift();
          ms.busy = true;
          ms.clientId = client.id;
          ms.totalClients++;
          client.estado = 'ejercitando';
          client.targetX = target.x;
          client.targetY = target.y;

          const ts = target.tiempoServicio || { min: 4, moda: 7, max: 10 };
          const serviceTime = triangular(ts.min, ts.moda, ts.max);
          client.serviceTotal = serviceTime;
          client.serviceRemaining = serviceTime;
        }
        break;
      }

      case 'ejercitando': {
        const remaining = (client.serviceRemaining || 1) - deltaMinutes;
        client.serviceRemaining = remaining;
        this.state.metrics.totalServiceTime += deltaMinutes;

        const target = this.machines.find((m) => m.id === client.targetMachineId);
        if (target) {
          client.x = target.x;
          client.y = target.y;
          client.targetX = target.x;
          client.targetY = target.y;
        }

        if (remaining <= 0) {
          // Finalizó ejercicio en esta máquina
          const ms = this.state.machineStates.get(client.targetMachineId!);
          if (ms) {
            ms.busy = false;
            ms.clientId = null;
            ms.totalBusyTime += client.serviceTotal || 5;

            // Si hay gente esperando en cola, asignar al primero
            if (ms.queue.length > 0) {
              const nextId = ms.queue.shift()!;
              const nextClient = this.state.clients.find((c) => c.id === nextId);
              if (nextClient && target) {
                ms.busy = true;
                ms.clientId = nextId;
                ms.totalClients++;
                nextClient.estado = 'ejercitando';
                nextClient.targetX = target.x;
                nextClient.targetY = target.y;

                const ts = target.tiempoServicio || { min: 4, moda: 7, max: 10 };
                const sTime = triangular(ts.min, ts.moda, ts.max);
                nextClient.serviceTotal = sTime;
                nextClient.serviceRemaining = sTime;
              }
            }
          }

          client.machinesVisited.push(client.targetMachineId!);
          client.targetMachineId = client.machinesPending.shift() || null;

          if (!client.targetMachineId) {
            // Terminó todo su circuito de ejercicios -> Salir del gym
            client.estado = 'saliendo';
            client.targetX = this.entrance.x;
            client.targetY = this.entrance.y;
          } else {
            client.estado = 'caminando';
            const nextTarget = this.machines.find((m) => m.id === client.targetMachineId);
            if (nextTarget) {
              client.targetX = nextTarget.x;
              client.targetY = nextTarget.y;
            }
          }
        }
        break;
      }

      case 'saliendo': {
        // Caminar de regreso a la puerta de entrada/salida
        const ex = Number.isFinite(this.entrance?.x) ? this.entrance.x : 80;
        const ey = Number.isFinite(this.entrance?.y) ? this.entrance.y : 700;
        client.targetX = ex;
        client.targetY = ey;

        const dx = ex - client.x;
        const dy = ey - client.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!Number.isFinite(dist) || dist <= Math.max(15, walkSpeedPx) || dist < 0.001) {
          // Llegó a la salida y sale del recinto
          toRemove.push(client.id);
        } else {
          client.x += (dx / dist) * walkSpeedPx;
          client.y += (dy / dist) * walkSpeedPx;
        }
        break;
      }

      case 'descansando':
        break;
    }
  }

  /** Obtener métricas calculadas */
  getMetrics(): SimulationMetrics {
    const elapsedHours = Math.max(0.1, (this.state.time - 6 * 60) / 60);
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

    const tiemposTotales = this.state.clients.map((c) => c.totalTime);
    const tiempoPromedio =
      tiemposTotales.length > 0
        ? tiemposTotales.reduce((a, b) => a + b, 0) / tiemposTotales.length
        : 0;

    return {
      clientesAtendidos: this.state.finishedCount,
      tiempoPromedioEnGym: Math.round(tiempoPromedio),
      porcentajeEsperaron:
        this.state.arrivedCount > 0
          ? Math.round(
              (this.state.metrics.clientsWhoWaited / this.state.arrivedCount) * 100
            )
          : 0,
      distanciaPromedioKm: 0.15,
      capacidadMaxima: Math.max(this.state.clients.length, this.state.arrivedCount),
      machineMetrics: machineMetrics.sort((a, b) => b.utilizacion - a.utilizacion),
    };
  }

  /** Obtener celdas de calor para visualización en LayoutCanvas */
  getHeatmapData(): { x: number; y: number; intensity: number; count: number }[] {
    const gridSize = 45;
    const grid: Map<string, number> = new Map();

    for (const client of this.state.clients) {
      const gx = Math.round(client.x / gridSize) * gridSize;
      const gy = Math.round(client.y / gridSize) * gridSize;
      const key = `${gx},${gy}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }

    // Agregar también congestión de máquinas con cola
    for (const [mId, ms] of this.state.machineStates) {
      if (ms.busy || ms.queue.length > 0) {
        const m = this.machines.find((x) => x.id === mId);
        if (m) {
          const gx = Math.round(m.x / gridSize) * gridSize;
          const gy = Math.round(m.y / gridSize) * gridSize;
          const key = `${gx},${gy}`;
          grid.set(key, (grid.get(key) || 0) + (ms.busy ? 1 : 0) + ms.queue.length);
        }
      }
    }

    const maxCount = Math.max(1, ...grid.values());
    return Array.from(grid.entries()).map(([key, count]) => {
      const [x, y] = key.split(',').map(Number);
      return {
        x,
        y,
        intensity: Math.min(1, count / maxCount),
        count,
      };
    });
  }
}
