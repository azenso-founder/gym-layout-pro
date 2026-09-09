// ==========================================
// GymLayout Pro — Tipos globales
// ==========================================

/** Categoría de máquina con color asociado */
export type MachineCategory =
  | 'cardio'
  | 'piernas'
  | 'tren_superior'
  | 'racks'
  | 'poleas'
  | 'accesorios'
  | 'funcional';

export const CATEGORY_COLORS: Record<MachineCategory, string> = {
  cardio: '#3B82F6',       // azul
  piernas: '#EF4444',      // rojo
  tren_superior: '#F97316', // naranja
  racks: '#8B5CF6',        // violeta
  poleas: '#10B981',       // verde
  accesorios: '#6B7280',   // gris
  funcional: '#F59E0B',    // amarillo
};

export const CATEGORY_LABELS: Record<MachineCategory, string> = {
  cardio: 'Cardio',
  piernas: 'Piernas',
  tren_superior: 'Tren Superior',
  racks: 'Racks / Smith',
  poleas: 'Poleas',
  accesorios: 'Accesorios',
  funcional: 'Funcional',
};

/** Definición de máquina (plantilla) */
export interface MachineTemplate {
  id: string;
  nombre: string;
  categoria: MachineCategory;
  largo: number;   // metros
  ancho: number;    // metros
  alto: number;     // metros
  N: number;        // lados operativos
  K: number;        // factor de evolución
  Ss: number;       // superficie estática
  Sg: number;       // superficie gravitacional
  Se: number;       // superficie de evolución
  St: number;       // superficie total (para 1 unidad)
  planta: 'baja' | 'alta';
  tiempoServicio: { min: number; moda: number; max: number }; // minutos
}

/** Instancia de máquina colocada en el plano */
export interface MachineInstance {
  id: string;
  templateId: string;
  nombre: string;
  categoria: MachineCategory;
  largo: number;
  ancho: number;
  alto: number;
  N: number;
  K: number;
  x: number;        // posición en canvas (pixels)
  y: number;
  rotation: number;  // grados
  planta: 'baja' | 'alta';
  locked: boolean;
  placed: boolean;   // si ya fue colocada en el plano
  tiempoServicio: { min: number; moda: number; max: number };
  capacidad: number; // personas simultáneas
}

/** Zona del gimnasio */
export interface Zone {
  id: string;
  nombre: string;
  color: string;
  points: { x: number; y: number }[];
  planta: 'baja' | 'alta';
}

/** Relación SLP entre dos elementos */
export type SLPRelation = 'A' | 'E' | 'I' | 'O' | 'U' | 'X';

export const SLP_CONFIG: Record<SLPRelation, { label: string; color: string; lines: number; weight: number }> = {
  A: { label: 'Absolutamente necesario', color: '#EF4444', lines: 4, weight: 4 },
  E: { label: 'Especialmente importante', color: '#F97316', lines: 3, weight: 3 },
  I: { label: 'Importante', color: '#22C55E', lines: 2, weight: 2 },
  O: { label: 'Ordinario', color: '#3B82F6', lines: 1, weight: 1 },
  U: { label: 'Sin importancia', color: '#6B7280', lines: 0, weight: 0 },
  X: { label: 'No deseable', color: '#7C3AED', lines: 1, weight: -2 },
};

/** Tipo de rutina de cliente */
export type RoutineType = 'piernas' | 'tren_superior' | 'full_body' | 'cardio' | 'funcional';

export const ROUTINE_CONFIG: Record<RoutineType, {
  label: string;
  probability: number;
  machines: number[];
  durationRange: [number, number];
}> = {
  piernas:       { label: 'Piernas',       probability: 0.30, machines: [5, 7],  durationRange: [45, 70] },
  tren_superior: { label: 'Tren Superior', probability: 0.30, machines: [5, 7],  durationRange: [45, 70] },
  full_body:     { label: 'Full Body',     probability: 0.20, machines: [8, 10], durationRange: [60, 90] },
  cardio:        { label: 'Cardio',        probability: 0.15, machines: [1, 2],  durationRange: [30, 45] },
  funcional:     { label: 'Funcional',     probability: 0.05, machines: [2, 4],  durationRange: [30, 40] },
};

/** Estado de un cliente en la simulación */
export type ClientState = 'caminando' | 'ejercitando' | 'esperando' | 'descansando';

export const CLIENT_STATE_COLORS: Record<ClientState, string> = {
  caminando: '#3B82F6',
  ejercitando: '#22C55E',
  esperando: '#EF4444',
  descansando: '#FBBF24',
};

/** Cliente en la simulación */
export interface SimClient {
  id: string;
  rutina: RoutineType;
  estado: ClientState;
  x: number;
  y: number;
  targetMachineId: string | null;
  machinesVisited: string[];
  machinesPending: string[];
  waitTime: number;
  totalTime: number;
  arrivalTime: number;
}

/** Métricas por máquina */
export interface MachineMetrics {
  machineId: string;
  nombre: string;
  utilizacion: number;     // 0-1
  tiempoColaPromedio: number;
  throughput: number;       // clientes/hora
  tiempoServicioPromedio: number;
}

/** Métricas globales de simulación */
export interface SimulationMetrics {
  clientesAtendidos: number;
  tiempoPromedioEnGym: number;
  porcentajeEsperaron: number;
  distanciaPromedioKm: number;
  capacidadMaxima: number;
  machineMetrics: MachineMetrics[];
}

/** Pestaña activa de la app */
export type AppTab = 'layout' | 'slp' | 'simulacion' | 'metricas' | 'export';

/** Recinto trazado sobre la grilla (polígono cerrado, editable como capa) */
export interface FloorRoom {
  id: string;
  name: string;
  points: { x: number; y: number }[];  // canvas pixels (grid-snapped)
  planta: 'baja' | 'alta';
  color: string;
  visible: boolean;
  locked: boolean;
}

/** Calibración de imagen de fondo por planta */
export interface ImgCalibration {
  /** Ancho de la imagen en metros sobre el canvas */
  imgWidth: number;
  /** Alto de la imagen en metros sobre el canvas */
  imgHeight: number;
  /** Offset X en metros */
  offsetX: number;
  /** Offset Y en metros */
  offsetY: number;
}

/** Herramienta activa del editor */
export type EditorTool = 'select' | 'move' | 'rotate' | 'measure' | 'zone' | 'pan' | 'trace';

/** Paso del grid de snap */
export type SnapGrid = 0.25 | 0.50 | 1.00;

/** Capa de imagen de fondo (editable) */
export interface ImageLayer {
  id: string;
  planta: 'baja' | 'alta';
  src: string;           // data URL
  x: number;             // posición en canvas (pixels)
  y: number;
  width: number;         // ancho en pixels
  height: number;        // alto en pixels
  visible: boolean;
  locked: boolean;
  rotation: number;      // grados
}

/** Medida de referencia personalizada (línea guía) */
export interface CustomMeasure {
  id: string;
  planta: 'baja' | 'alta';
  axis: 'x' | 'y';       // horizontal o vertical
  value: number;         // en metros
  label: string;         // ej: "2.10m", "19.20m"
  visible: boolean;
}
