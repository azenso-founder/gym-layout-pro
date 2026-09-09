// ==========================================
// Motor CRAFT (Computerized Relative Allocation of Facilities Technique)
// Heurística de intercambio por pares para distribución de planta
// ==========================================

import type {
  CraftProblem,
  CraftLayoutState,
  CraftIteration,
  DistanceMetric,
} from '@/types/craft';

// ---- Validación ----

/** Validar que el problema CRAFT sea consistente */
export function validateProblem(problem: CraftProblem): string | null {
  const totalArea = problem.departments.reduce((s, d) => s + d.area, 0);
  const plantArea = problem.L * problem.W;
  if (totalArea > plantArea) {
    return `La suma de áreas (${totalArea}) excede el espacio disponible (${plantArea} = ${problem.L}×${problem.W})`;
  }
  if (problem.N !== problem.departments.length) {
    return `N (${problem.N}) no coincide con la cantidad de departamentos (${problem.departments.length})`;
  }
  if (problem.flowMatrix.length !== problem.N) {
    return `La matriz de flujos debe ser ${problem.N}×${problem.N}`;
  }
  for (let i = 0; i < problem.N; i++) {
    if (problem.flowMatrix[i].length !== problem.N) {
      return `La fila ${i + 1} de la matriz de flujos tiene ${problem.flowMatrix[i].length} columnas (se esperan ${problem.N})`;
    }
  }
  return null;
}

// ---- Layout Inicial ----

/** Generar un layout secuencial (serpentina por columnas) */
export function generateSequentialLayout(problem: CraftProblem): number[][] {
  const { L, W, departments } = problem;
  const WC = problem.aisleWidth || Math.max(1, Math.floor(W / Math.ceil(Math.sqrt(departments.length))));
  const plant: number[][] = Array.from({ length: L }, () => Array(W).fill(0));
  const maxcol = Math.floor(W / WC);

  // Ordenar departamentos por id (o secuencia dada)
  const deptOrder = [...departments].sort((a, b) => a.id - b.id);
  let deptIdx = 0;
  let remaining = deptOrder[deptIdx]?.area || 0;

  for (let col = 0; col < maxcol && deptIdx < deptOrder.length; col++) {
    const startX = col * WC;
    const endX = Math.min(startX + WC, W);
    const goDown = col % 2 === 0;

    for (let rawRow = 0; rawRow < L && deptIdx < deptOrder.length; rawRow++) {
      const row = goDown ? rawRow : L - 1 - rawRow;
      for (let x = startX; x < endX && deptIdx < deptOrder.length; x++) {
        plant[row][x] = deptOrder[deptIdx].id;
        remaining--;
        if (remaining <= 0) {
          deptIdx++;
          remaining = deptOrder[deptIdx]?.area || 0;
        }
      }
    }
  }

  return plant;
}

/** Generar un layout aleatorio distribuyendo celdas */
export function generateRandomLayout(problem: CraftProblem): number[][] {
  const { L, W, departments } = problem;
  const plant: number[][] = Array.from({ length: L }, () => Array(W).fill(0));

  // Crear pool de celdas y mezclar
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      cells.push({ r, c });
    }
  }
  shuffle(cells);

  let idx = 0;
  for (const dept of departments) {
    for (let a = 0; a < dept.area && idx < cells.length; a++) {
      plant[cells[idx].r][cells[idx].c] = dept.id;
      idx++;
    }
  }

  return plant;
}

/** Generar layout compacto por filas — asigna bloques rectangulares contiguos */
export function generateCompactLayout(problem: CraftProblem): number[][] {
  const { L, W, departments } = problem;
  const plant: number[][] = Array.from({ length: L }, () => Array(W).fill(0));

  // Llenar fila por fila
  let r = 0;
  let c = 0;
  for (const dept of [...departments].sort((a, b) => a.id - b.id)) {
    let placed = 0;
    while (placed < dept.area && r < L) {
      plant[r][c] = dept.id;
      placed++;
      c++;
      if (c >= W) {
        c = 0;
        r++;
      }
    }
  }

  return plant;
}

// ---- Cálculos del Layout ----

/** Calcular centroides de cada departamento */
export function computeCentroids(
  plant: number[][],
  N: number
): { centroids: { x: number; y: number }[]; cellCounts: number[] } {
  const sumX = new Float64Array(N);
  const sumY = new Float64Array(N);
  const counts = new Float64Array(N);

  const L = plant.length;
  const W = plant[0]?.length || 0;

  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      const d = plant[r][c];
      if (d > 0 && d <= N) {
        const idx = d - 1;
        sumX[idx] += c + 0.5; // centro de la celda
        sumY[idx] += r + 0.5;
        counts[idx]++;
      }
    }
  }

  const centroids = Array.from({ length: N }, (_, i) => ({
    x: counts[i] > 0 ? sumX[i] / counts[i] : 0,
    y: counts[i] > 0 ? sumY[i] / counts[i] : 0,
  }));

  return { centroids, cellCounts: Array.from(counts) };
}

/** Calcular matriz de adyacencia entre departamentos */
export function computeAdjacency(plant: number[][], N: number): boolean[][] {
  const L = plant.length;
  const W = plant[0]?.length || 0;
  const adj: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      const d = plant[r][c];
      if (d <= 0) continue;
      // Vecino derecho
      if (c + 1 < W && plant[r][c + 1] > 0 && plant[r][c + 1] !== d) {
        adj[d - 1][plant[r][c + 1] - 1] = true;
        adj[plant[r][c + 1] - 1][d - 1] = true;
      }
      // Vecino abajo
      if (r + 1 < L && plant[r + 1][c] > 0 && plant[r + 1][c] !== d) {
        adj[d - 1][plant[r + 1][c] - 1] = true;
        adj[plant[r + 1][c] - 1][d - 1] = true;
      }
    }
  }

  return adj;
}

/** Calcular distancia entre dos centroides */
function distance(
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  metric: DistanceMetric
): number {
  if (metric === 'euclidean') {
    return Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);
  }
  // rectilinear (Manhattan)
  return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
}

/** Calcular matriz de distancias entre centroides */
export function computeDistances(
  centroids: { x: number; y: number }[],
  metric: DistanceMetric
): number[][] {
  const N = centroids.length;
  const dist: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const d = distance(centroids[i], centroids[j], metric);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }
  return dist;
}

/** Calcular costo total = Σ f(i,j) × d(i,j) */
export function computeTotalCost(
  flowMatrix: number[][],
  distances: number[][],
  N: number
): number {
  let cost = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      cost += (flowMatrix[i][j] + flowMatrix[j][i]) * distances[i][j];
    }
  }
  return cost;
}

/** Construir estado completo del layout a partir de la planta */
export function buildLayoutState(
  plant: number[][],
  problem: CraftProblem,
  prevIterations?: CraftIteration[]
): CraftLayoutState {
  const { centroids, cellCounts } = computeCentroids(plant, problem.N);
  const adjacency = computeAdjacency(plant, problem.N);
  const distances = computeDistances(centroids, problem.distanceMetric);
  const totalCost = computeTotalCost(problem.flowMatrix, distances, problem.N);

  return {
    plant: plant.map(row => [...row]),
    centroids,
    cellCounts,
    adjacency,
    distances,
    totalCost,
    iterations: prevIterations || [],
  };
}

// ---- Heurística de Intercambio por Pares ----

/** Calcular ahorro estimado de intercambiar departamentos si y sj (sin ejecutar) */
function switchSavings(
  si: number,       // índice 0-based del departamento i
  sj: number,       // índice 0-based del departamento j
  N: number,
  flowMatrix: number[][],
  distances: number[][],
  fixedDistances?: number[][],
  fixedFlowCosts?: number[][],
  nFixed?: number
): number {
  let savings = 0;

  for (let k = 0; k < N; k++) {
    if (k !== si && k !== sj) {
      const FI = flowMatrix[k][si] + flowMatrix[si][k];
      const FJ = flowMatrix[k][sj] + flowMatrix[sj][k];
      savings += (FI - FJ) * (distances[si][k] - distances[sj][k]);
    }
  }

  // Puntos fijos
  if (fixedDistances && fixedFlowCosts && nFixed) {
    for (let k = 0; k < nFixed; k++) {
      const FI = fixedFlowCosts[si][k];
      const FJ = fixedFlowCosts[sj][k];
      savings += (FI - FJ) * (fixedDistances[si][k] - fixedDistances[sj][k]);
    }
  }

  return savings;
}

/** Ejecutar intercambio de celdas entre departamentos de igual tamaño */
function swapEqualSize(plant: number[][], idI: number, idJ: number): void {
  const L = plant.length;
  const W = plant[0].length;
  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      if (plant[r][c] === idI) plant[r][c] = idJ;
      else if (plant[r][c] === idJ) plant[r][c] = idI;
    }
  }
}

/** Ejecutar intercambio de celdas entre departamentos de distinto tamaño (adyacentes) */
function swapDifferentSize(
  plant: number[][],
  idBig: number,
  idSmall: number,
  centroidSmall: { x: number; y: number }
): void {
  const L = plant.length;
  const W = plant[0].length;
  const TEMP = -999;

  // Contar celdas del chico
  let countSmall = 0;
  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      if (plant[r][c] === idSmall) countSmall++;
    }
  }

  // 1. Celdas del chico → grande
  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      if (plant[r][c] === idSmall) plant[r][c] = idBig;
    }
  }

  // 2. Celdas originales del grande → temporal
  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      if (plant[r][c] === idBig) plant[r][c] = TEMP;
    }
  }

  // 3. Restaurar las celdas que eran del chico (ahora TEMP) → grande
  // Y las primeras countSmall celdas TEMP más cercanas al centroide del chico → chico
  const tempCells: { r: number; c: number; dist: number }[] = [];
  for (let r = 0; r < L; r++) {
    for (let c = 0; c < W; c++) {
      if (plant[r][c] === TEMP) {
        const dist = Math.abs(c + 0.5 - centroidSmall.x) + Math.abs(r + 0.5 - centroidSmall.y);
        tempCells.push({ r, c, dist });
      }
    }
  }

  // Ordenar por cercanía al centroide del chico
  tempCells.sort((a, b) => a.dist - b.dist);

  // Asignar las primeras countSmall al chico, el resto al grande
  for (let i = 0; i < tempCells.length; i++) {
    const { r, c } = tempCells[i];
    plant[r][c] = i < countSmall ? idSmall : idBig;
  }
}

/** Resultado de una iteración de optimización */
export interface CraftStepResult {
  improved: boolean;
  deptI: number;
  deptJ: number;
  savings: number;
  newState: CraftLayoutState;
}

/** Ejecutar un paso de optimización (buscar el mejor intercambio y ejecutarlo) */
export function craftStep(
  currentState: CraftLayoutState,
  problem: CraftProblem
): CraftStepResult {
  const { N, flowMatrix, departments } = problem;
  const { plant, cellCounts, adjacency, distances } = currentState;

  let bestSavings = 0;
  let bestI = -1;
  let bestJ = -1;

  for (let i = 0; i < N - 1; i++) {
    if (departments[i].isFixed || cellCounts[i] === 0) continue;
    for (let j = i + 1; j < N; j++) {
      if (departments[j].isFixed || cellCounts[j] === 0) continue;

      // Solo evaluar si tienen igual área O son adyacentes
      if (cellCounts[i] !== cellCounts[j] && !adjacency[i][j]) continue;

      const savings = switchSavings(i, j, N, flowMatrix, distances);

      if (savings > bestSavings) {
        bestSavings = savings;
        bestI = i;
        bestJ = j;
      }
    }
  }

  if (bestSavings <= 0) {
    return {
      improved: false,
      deptI: -1,
      deptJ: -1,
      savings: 0,
      newState: currentState,
    };
  }

  // Ejecutar el intercambio
  const newPlant = plant.map(row => [...row]);
  const idI = departments[bestI].id;
  const idJ = departments[bestJ].id;

  if (cellCounts[bestI] === cellCounts[bestJ]) {
    swapEqualSize(newPlant, idI, idJ);
  } else {
    const [big, small] = cellCounts[bestI] > cellCounts[bestJ]
      ? [bestI, bestJ]
      : [bestJ, bestI];
    swapDifferentSize(
      newPlant,
      departments[big].id,
      departments[small].id,
      currentState.centroids[small]
    );
  }

  const stepNum = currentState.iterations.length + 1;
  const newState = buildLayoutState(newPlant, problem, [
    ...currentState.iterations,
    {
      step: stepNum,
      deptI: idI,
      deptJ: idJ,
      savings: bestSavings,
      costAfter: 0, // se rellena abajo
    },
  ]);

  // Actualizar el costAfter de la última iteración
  newState.iterations[newState.iterations.length - 1].costAfter = newState.totalCost;

  return {
    improved: true,
    deptI: idI,
    deptJ: idJ,
    savings: bestSavings,
    newState,
  };
}

/** Ejecutar la optimización CRAFT completa (todas las iteraciones) */
export function craftOptimize(
  initialPlant: number[][],
  problem: CraftProblem,
  maxIterations = 500
): CraftLayoutState {
  let state = buildLayoutState(initialPlant, problem);
  let iter = 0;

  while (iter < maxIterations) {
    const result = craftStep(state, problem);
    if (!result.improved) break;
    state = result.newState;
    iter++;
  }

  return state;
}

/** Ejecutar intercambio manual entre dos departamentos */
export function manualSwap(
  currentState: CraftLayoutState,
  problem: CraftProblem,
  deptIdI: number,
  deptIdJ: number
): CraftLayoutState {
  const { plant } = currentState;
  const newPlant = plant.map(row => [...row]);
  const idxI = deptIdI - 1;
  const idxJ = deptIdJ - 1;

  if (currentState.cellCounts[idxI] === currentState.cellCounts[idxJ]) {
    swapEqualSize(newPlant, deptIdI, deptIdJ);
  } else {
    const [big, small] = currentState.cellCounts[idxI] > currentState.cellCounts[idxJ]
      ? [idxI, idxJ]
      : [idxJ, idxI];
    swapDifferentSize(
      newPlant,
      problem.departments[big].id,
      problem.departments[small].id,
      currentState.centroids[small]
    );
  }

  return buildLayoutState(newPlant, problem, currentState.iterations);
}

// ---- Utilidades ----

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
