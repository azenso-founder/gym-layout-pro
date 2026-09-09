// ==========================================
// CRAFT Algorithm — Types
// Computerized Relative Allocation of Facilities Technique
// ==========================================

/** Métrica de distancia para el cálculo CRAFT */
export type DistanceMetric = 'rectilinear' | 'euclidean';

/** Modo de generación de layout inicial */
export type LayoutMode = 'sequential' | 'traditional';

/** Departamento en el problema CRAFT */
export interface CraftDepartment {
  id: number;
  name: string;
  area: number;        // área requerida en celdas
  color: string;       // color hex para visualización
  isFixed: boolean;    // si el departamento no puede moverse
}

/** Punto fijo externo a la planta */
export interface FixedPoint {
  x: number;           // coordenada X (fracción 0-1 de W)
  y: number;           // coordenada Y (fracción 0-1 de L)
  costs: number[];     // costo hacia cada departamento
}

/** Definición completa de un problema CRAFT */
export interface CraftProblem {
  name: string;
  N: number;                          // número de departamentos
  L: number;                          // largo de la planta (filas)
  W: number;                          // ancho de la planta (columnas)
  departments: CraftDepartment[];
  flowMatrix: number[][];             // N×N
  distanceMetric: DistanceMetric;
  layoutMode: LayoutMode;
  aisleWidth?: number;                // solo para modo secuencial
  linearUnit: string;                 // "m", "ft", etc.
  fixedPoints?: FixedPoint[];
}

/** Registro de una iteración del algoritmo */
export interface CraftIteration {
  step: number;
  deptI: number;       // id del departamento I intercambiado
  deptJ: number;       // id del departamento J intercambiado
  savings: number;     // ahorro obtenido
  costAfter: number;   // costo total después del intercambio
}

/** Estado completo del layout CRAFT */
export interface CraftLayoutState {
  plant: number[][];                    // L×W, valor = id de departamento (0 = vacío)
  centroids: { x: number; y: number }[];  // índice = id-1 del departamento
  cellCounts: number[];                 // celdas asignadas por departamento (índice = id-1)
  adjacency: boolean[][];               // N×N
  distances: number[][];                // N×N
  totalCost: number;
  iterations: CraftIteration[];
}

/** Paleta de colores distinguibles para departamentos */
export const CRAFT_DEPT_COLORS = [
  '#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231',
  '#911EB4', '#42D4F4', '#F032E6', '#BFEF45', '#FABED4',
  '#469990', '#DCBEFF', '#9A6324', '#FFFAC8', '#800000',
  '#AAFFC3', '#808000', '#FFD8B1', '#000075', '#A9A9A9',
  '#E6BEFF', '#AA6E28', '#FFFAD2', '#228B22', '#DC143C',
] as const;

/** Ejemplo de problema de prueba (6 departamentos) */
export const CRAFT_EXAMPLE_PROBLEM: CraftProblem = {
  name: 'Ejemplo 6 Departamentos',
  N: 6,
  L: 6,
  W: 6,
  departments: [
    { id: 1, name: 'Almacén',    area: 6,  color: CRAFT_DEPT_COLORS[0], isFixed: false },
    { id: 2, name: 'Producción', area: 12, color: CRAFT_DEPT_COLORS[1], isFixed: false },
    { id: 3, name: 'Ensamble',   area: 6,  color: CRAFT_DEPT_COLORS[2], isFixed: false },
    { id: 4, name: 'Despacho',   area: 4,  color: CRAFT_DEPT_COLORS[3], isFixed: false },
    { id: 5, name: 'Oficinas',   area: 4,  color: CRAFT_DEPT_COLORS[4], isFixed: false },
    { id: 6, name: 'Calidad',    area: 4,  color: CRAFT_DEPT_COLORS[5], isFixed: false },
  ],
  flowMatrix: [
    [0, 10,  0,  5, 0, 0],
    [10, 0, 15,  3, 2, 8],
    [0, 15,  0, 10, 0, 4],
    [5,  3, 10,  0, 1, 0],
    [0,  2,  0,  1, 0, 6],
    [0,  8,  4,  0, 6, 0],
  ],
  distanceMetric: 'rectilinear',
  layoutMode: 'traditional',
  linearUnit: 'm',
};
