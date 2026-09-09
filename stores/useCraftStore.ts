// ==========================================
// CRAFT Store — Estado global para el módulo CRAFT
// ==========================================

import { create } from 'zustand';
import type {
  CraftProblem,
  CraftLayoutState,
  CraftDepartment,
  DistanceMetric,
  LayoutMode,
} from '@/types/craft';
import { CRAFT_DEPT_COLORS, CRAFT_EXAMPLE_PROBLEM } from '@/types/craft';
import {
  validateProblem,
  generateCompactLayout,
  generateRandomLayout,
  generateSequentialLayout,
  buildLayoutState,
  craftStep,
  craftOptimize,
  manualSwap,
} from '@/engine/craft';

type CraftView = 'setup' | 'layout' | 'results';
type OptimizationMode = 'auto' | 'step';

interface CraftStore {
  // ---- Problem definition ----
  problem: CraftProblem;
  validationError: string | null;

  // ---- Layout state ----
  layoutState: CraftLayoutState | null;
  initialCost: number | null;

  // ---- UI state ----
  view: CraftView;
  showFlows: boolean;
  optimizing: boolean;
  optimizationMode: OptimizationMode;
  selectedDeptForSwap: number | null; // id del dept seleccionado para intercambio manual

  // ---- Actions: Problem setup ----
  setProblemName: (name: string) => void;
  setDimensions: (L: number, W: number) => void;
  setDepartmentCount: (n: number) => void;
  updateDepartment: (id: number, updates: Partial<CraftDepartment>) => void;
  setFlowValue: (i: number, j: number, value: number) => void;
  setDistanceMetric: (metric: DistanceMetric) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setAisleWidth: (w: number) => void;
  setLinearUnit: (unit: string) => void;
  loadExample: () => void;
  loadProblem: (problem: CraftProblem) => void;

  // ---- Actions: Layout ----
  generateLayout: (type: 'random' | 'compact' | 'sequential') => void;
  evaluate: () => void;
  optimizeStep: () => boolean;  // returns true if improved
  optimizeFull: () => void;
  manualSwapDepts: (idI: number, idJ: number) => void;
  selectDeptForSwap: (id: number | null) => void;

  // ---- Actions: UI ----
  setView: (view: CraftView) => void;
  toggleFlows: () => void;
  setOptimizationMode: (mode: OptimizationMode) => void;
  reset: () => void;

  // ---- Persistence ----
  exportProblem: () => string;
  importProblem: (json: string) => string | null; // returns error or null
}

function createDefaultProblem(): CraftProblem {
  return {
    name: 'Nuevo Problema',
    N: 4,
    L: 6,
    W: 6,
    departments: Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      name: `Dept ${i + 1}`,
      area: 9,
      color: CRAFT_DEPT_COLORS[i % CRAFT_DEPT_COLORS.length],
      isFixed: false,
    })),
    flowMatrix: Array.from({ length: 4 }, () => Array(4).fill(0)),
    distanceMetric: 'rectilinear',
    layoutMode: 'traditional',
    linearUnit: 'm',
  };
}

export const useCraftStore = create<CraftStore>((set, get) => ({
  problem: createDefaultProblem(),
  validationError: null,
  layoutState: null,
  initialCost: null,
  view: 'setup',
  showFlows: false,
  optimizing: false,
  optimizationMode: 'auto',
  selectedDeptForSwap: null,

  // ---- Problem setup ----

  setProblemName: (name) => set((s) => ({ problem: { ...s.problem, name } })),

  setDimensions: (L, W) => set((s) => ({
    problem: { ...s.problem, L, W },
    layoutState: null,
    initialCost: null,
  })),

  setDepartmentCount: (n) => set((s) => {
    const current = s.problem.departments;
    const N = Math.max(2, Math.min(100, n));
    let depts: CraftDepartment[];

    if (N > current.length) {
      depts = [
        ...current,
        ...Array.from({ length: N - current.length }, (_, i) => ({
          id: current.length + i + 1,
          name: `Dept ${current.length + i + 1}`,
          area: 4,
          color: CRAFT_DEPT_COLORS[(current.length + i) % CRAFT_DEPT_COLORS.length],
          isFixed: false,
        })),
      ];
    } else {
      depts = current.slice(0, N);
    }

    // Resize flow matrix
    const oldFlow = s.problem.flowMatrix;
    const flow = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) =>
        i < oldFlow.length && j < (oldFlow[i]?.length || 0) ? oldFlow[i][j] : 0
      )
    );

    return {
      problem: { ...s.problem, N, departments: depts, flowMatrix: flow },
      layoutState: null,
      initialCost: null,
    };
  }),

  updateDepartment: (id, updates) => set((s) => ({
    problem: {
      ...s.problem,
      departments: s.problem.departments.map(d =>
        d.id === id ? { ...d, ...updates } : d
      ),
    },
  })),

  setFlowValue: (i, j, value) => set((s) => {
    const flow = s.problem.flowMatrix.map(row => [...row]);
    flow[i][j] = value;
    flow[j][i] = value; // espejear
    return { problem: { ...s.problem, flowMatrix: flow } };
  }),

  setDistanceMetric: (metric) => set((s) => ({
    problem: { ...s.problem, distanceMetric: metric },
    layoutState: null,
    initialCost: null,
  })),

  setLayoutMode: (mode) => set((s) => ({
    problem: { ...s.problem, layoutMode: mode },
  })),

  setAisleWidth: (w) => set((s) => ({
    problem: { ...s.problem, aisleWidth: w },
  })),

  setLinearUnit: (unit) => set((s) => ({
    problem: { ...s.problem, linearUnit: unit },
  })),

  loadExample: () => set({
    problem: { ...CRAFT_EXAMPLE_PROBLEM },
    layoutState: null,
    initialCost: null,
    view: 'setup',
  }),

  loadProblem: (problem) => set({
    problem: { ...problem },
    layoutState: null,
    initialCost: null,
    view: 'setup',
  }),

  // ---- Layout ----

  generateLayout: (type) => {
    const { problem } = get();
    const error = validateProblem(problem);
    if (error) {
      set({ validationError: error });
      return;
    }

    let plant: number[][];
    switch (type) {
      case 'sequential':
        plant = generateSequentialLayout(problem);
        break;
      case 'random':
        plant = generateRandomLayout(problem);
        break;
      case 'compact':
      default:
        plant = generateCompactLayout(problem);
        break;
    }

    const state = buildLayoutState(plant, problem);
    set({
      layoutState: state,
      initialCost: state.totalCost,
      validationError: null,
      view: 'layout',
    });
  },

  evaluate: () => {
    const { layoutState, problem } = get();
    if (!layoutState) return;
    const state = buildLayoutState(layoutState.plant, problem, layoutState.iterations);
    set({ layoutState: state });
  },

  optimizeStep: () => {
    const { layoutState, problem } = get();
    if (!layoutState) return false;
    const result = craftStep(layoutState, problem);
    if (result.improved) {
      set({ layoutState: result.newState });
    }
    return result.improved;
  },

  optimizeFull: () => {
    const { layoutState, problem } = get();
    if (!layoutState) return;
    set({ optimizing: true });

    // Ejecutar en un timeout para no bloquear la UI
    setTimeout(() => {
      const final = craftOptimize(layoutState.plant, problem);
      // Preservar las iteraciones previas + las nuevas
      const allIterations = [...layoutState.iterations, ...final.iterations];
      final.iterations = allIterations;
      set({ layoutState: final, optimizing: false });
    }, 10);
  },

  manualSwapDepts: (idI, idJ) => {
    const { layoutState, problem } = get();
    if (!layoutState) return;
    const newState = manualSwap(layoutState, problem, idI, idJ);
    set({ layoutState: newState, selectedDeptForSwap: null });
  },

  selectDeptForSwap: (id) => set({ selectedDeptForSwap: id }),

  // ---- UI ----

  setView: (view) => set({ view }),
  toggleFlows: () => set((s) => ({ showFlows: !s.showFlows })),
  setOptimizationMode: (mode) => set({ optimizationMode: mode }),

  reset: () => set({
    problem: createDefaultProblem(),
    validationError: null,
    layoutState: null,
    initialCost: null,
    view: 'setup',
    showFlows: false,
    optimizing: false,
    selectedDeptForSwap: null,
  }),

  // ---- Persistence ----

  exportProblem: () => {
    const { problem } = get();
    return JSON.stringify(problem, null, 2);
  },

  importProblem: (json) => {
    try {
      const parsed = JSON.parse(json) as CraftProblem;
      const error = validateProblem(parsed);
      if (error) return error;
      set({
        problem: parsed,
        layoutState: null,
        initialCost: null,
        view: 'setup',
        validationError: null,
      });
      return null;
    } catch {
      return 'JSON inválido';
    }
  },
}));
