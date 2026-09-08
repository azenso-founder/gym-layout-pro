// ==========================================
// GymLayout Pro — Store global (Zustand)
// Con auto-guardado a localStorage
// ==========================================

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  MachineInstance,
  MachineTemplate,
  MachineCategory,
  Zone,
  SLPRelation,
  AppTab,
  EditorTool,
  SnapGrid,
  SimClient,
  SimulationMetrics,
  FloorRoom,
  ImgCalibration,
  ImageLayer,
  CustomMeasure,
} from '@/types';
import { ALL_DEFAULT_MACHINES, PLANTA_INFO } from '@/data/machines';

// ---- Escala: pixels por metro ----
export const PIXELS_PER_METER = 50;

/** Convertir metros a pixels */
export const m2px = (m: number) => m * PIXELS_PER_METER;
/** Convertir pixels a metros */
export const px2m = (px: number) => px / PIXELS_PER_METER;

// ---- Auto-save (localStorage) ----
const SAVE_KEY = 'gymlayout-pro-draft';
const SAVE_DEBOUNCE = 1500; // ms

interface SavedState {
  machines: MachineInstance[];
  zones: Zone[];
  floorRooms: FloorRoom[];
  imageLayers: ImageLayer[];
  customMeasures: CustomMeasure[];
  imgCalibrations: Record<'baja' | 'alta', ImgCalibration>;
  slpRelations: Record<string, SLPRelation>;
  activePlanta: 'baja' | 'alta';
  bgImages?: { baja: string | null; alta: string | null };
  bgOpacity: number;
  showBg: boolean;
  showGrid: boolean;
  snapGrid: SnapGrid;
  showGuerchetHalo: boolean;
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  savedAt: number;
}

function loadSavedState(): Partial<SavedState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    // Only restore if saved within last 30 days
    if (Date.now() - parsed.savedAt > 30 * 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(state: AppState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const toSave: SavedState = {
        machines: state.machines,
        zones: state.zones,
        floorRooms: state.floorRooms,
        imageLayers: state.imageLayers,
        customMeasures: state.customMeasures,
        imgCalibrations: state.imgCalibrations,
        slpRelations: state.slpRelations,
        activePlanta: state.activePlanta,
        bgOpacity: state.bgOpacity,
        showBg: state.showBg,
        showGrid: state.showGrid,
        snapGrid: state.snapGrid,
        showGuerchetHalo: state.showGuerchetHalo,
        canvasScale: state.canvasScale,
        canvasOffset: state.canvasOffset,
        savedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
      // Update lastSaved timestamp in state
      useStore.setState({ lastSaved: Date.now() });
    } catch { /* localStorage full or unavailable */ }
  }, SAVE_DEBOUNCE);
}

const saved = loadSavedState();

// Default image calibrations (initial best-guess, user adjustable)
const DEFAULT_IMG_CALIBRATIONS: Record<'baja' | 'alta', ImgCalibration> = {
  baja: { imgWidth: 21.2, imgHeight: 30, offsetX: 0, offsetY: 0 },
  alta: { imgWidth: 21.2, imgHeight: 30, offsetX: 0, offsetY: 0 },
};

/** Shoelace formula — area of a polygon in canvas pixels² → m² */
function shoelaceAreaM2(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  const areaPx2 = Math.abs(area) / 2;
  // Convert from canvas px² to m²
  return areaPx2 / (PIXELS_PER_METER * PIXELS_PER_METER);
}

// Room colors palette
const ROOM_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

// ---- Estado de undo/redo ----
interface HistoryEntry {
  machines: MachineInstance[];
  zones: Zone[];
}

interface AppState {
  // === General ===
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activePlanta: 'baja' | 'alta';
  setActivePlanta: (p: 'baja' | 'alta') => void;

  // === Editor ===
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;
  snapGrid: SnapGrid;
  setSnapGrid: (s: SnapGrid) => void;
  showGuerchetHalo: boolean;
  toggleGuerchetHalo: () => void;
  showGrid: boolean;
  toggleGrid: () => void;

  // === Selection (multi-select) ===
  selectedMachineId: string | null;       // primary (para PropertiesPanel)
  selectedMachineIds: string[];           // todos los seleccionados
  setSelectedMachine: (id: string | null) => void;
  addToSelection: (id: string) => void;   // Ctrl+click
  toggleInSelection: (id: string) => void;
  selectAll: () => void;                   // Ctrl+A
  clearSelection: () => void;

  // === Bulk operations on selection ===
  bulkRotate: (angle: number) => void;
  bulkRemove: () => void;
  bulkToggleLock: () => void;
  bulkMove: (dx: number, dy: number) => void;
  bulkUpdateProp: (props: Partial<MachineInstance>) => void;

  // === Canvas ===
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  setCanvasScale: (s: number) => void;
  setCanvasOffset: (o: { x: number; y: number }) => void;

  // === Plantillas de máquinas (inventario) ===
  templates: MachineTemplate[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // === Máquinas colocadas ===
  machines: MachineInstance[];
  addMachine: (templateId: string) => void;
  placeMachine: (id: string, x: number, y: number) => void;
  moveMachine: (id: string, x: number, y: number) => void;
  rotateMachine: (id: string, angle: number) => void;
  removeMachine: (id: string) => void;
  duplicateMachine: (id: string) => void;
  toggleLockMachine: (id: string) => void;
  updateMachineProp: (id: string, props: Partial<MachineInstance>) => void;
  autoPlaceAll: () => void;

  // === Zonas ===
  zones: Zone[];
  addZone: (zone: Omit<Zone, 'id'>) => void;
  removeZone: (id: string) => void;

  // === Floor Plan Tracing ===
  floorRooms: FloorRoom[];
  tracingPoints: { x: number; y: number }[];
  isTracing: boolean;
  pendingFinish: boolean;
  selectedRoomId: string | null;

  // === Image Layers ===
  imageLayers: ImageLayer[];
  selectedImageId: string | null;
  // Tracing actions
  startTracing: () => void;
  addTracingPoint: (x: number, y: number) => void;
  undoTracingPoint: () => void;
  requestFinish: () => void;
  finishTracing: (name: string, color?: string) => void;
  cancelTracing: () => void;
  // Room CRUD
  addFloorRoom: (name: string, color: string) => void;
  removeFloorRoom: (id: string) => void;
  renameFloorRoom: (id: string, name: string) => void;
  // Room editing (layers)
  setSelectedRoom: (id: string | null) => void;
  updateRoomVertex: (id: string, vertexIdx: number, x: number, y: number) => void;
  moveRoom: (id: string, dx: number, dy: number) => void;
  addRoomVertex: (id: string, afterIdx: number, x: number, y: number) => void;
  removeRoomVertex: (id: string, vertexIdx: number) => void;
  toggleRoomVisibility: (id: string) => void;
  toggleRoomLock: (id: string) => void;
  setRoomColor: (id: string, color: string) => void;
  // Area helpers
  getRoomArea: (room: FloorRoom) => number;
  getTotalFloorArea: (planta: 'baja' | 'alta') => number;

  // Image layer actions
  addImageLayer: (src: string, planta: 'baja' | 'alta') => void;
  removeImageLayer: (id: string) => void;
  setSelectedImage: (id: string | null) => void;
  updateImageLayer: (id: string, updates: Partial<ImageLayer>) => void;
  toggleImageVisibility: (id: string) => void;
  toggleImageLock: (id: string) => void;

  // Custom measures (líneas guía personalizadas)
  customMeasures: CustomMeasure[];
  addCustomMeasure: (axis: 'x' | 'y', value: number, label: string, planta: 'baja' | 'alta') => void;
  removeCustomMeasure: (id: string) => void;
  updateCustomMeasure: (id: string, updates: Partial<CustomMeasure>) => void;
  toggleCustomMeasureVisibility: (id: string) => void;

  // === Custom Machine Templates ===
  addCustomTemplate: (data: {
    nombre: string; categoria: MachineCategory; largo: number; ancho: number;
    alto: number; N: number; K: number; planta: 'baja' | 'alta';
    tiempoServicio: { min: number; moda: number; max: number };
  }) => void;

  // === Image Calibration ===
  imgCalibrations: Record<'baja' | 'alta', ImgCalibration>;
  setImgCalibration: (planta: 'baja' | 'alta', cal: Partial<ImgCalibration>) => void;
  resetImgCalibration: (planta: 'baja' | 'alta') => void;

  // === SLP ===
  slpRelations: Record<string, SLPRelation>;
  setSLPRelation: (key: string, rel: SLPRelation) => void;
  setSLPRelationsBulk: (updates: Record<string, SLPRelation>) => void;

  // === Simulación ===
  simRunning: boolean;
  simSpeed: number;
  simTime: number;
  simClients: SimClient[];
  simMetrics: SimulationMetrics | null;
  showHeatmap: boolean;
  setSimRunning: (r: boolean) => void;
  setSimSpeed: (s: number) => void;
  setSimTime: (t: number) => void;
  setSimClients: (c: SimClient[]) => void;
  setSimMetrics: (m: SimulationMetrics | null) => void;
  toggleHeatmap: () => void;

  // === Background image (per-planta) ===
  bgImages: { baja: string | null; alta: string | null };
  bgOpacity: number;
  showBg: boolean;
  setBgImage: (planta: 'baja' | 'alta', img: string | null) => void;
  setBgOpacity: (o: number) => void;
  toggleBg: () => void;

  // === Undo/Redo ===
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // === Superficie calculada ===
  getSuperficieUsada: (planta: 'baja' | 'alta') => number;
  getSuperficieDisponible: (planta: 'baja' | 'alta') => number;

  // === Auto-save ===
  lastSaved: number | null;
  clearDraft: () => void;
}

const useStore = create<AppState>((set, get) => ({
  // === General ===
  activeTab: 'layout',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activePlanta: saved?.activePlanta ?? 'baja',
  setActivePlanta: (p) => set({ activePlanta: p }),

  // === Editor ===
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  snapGrid: saved?.snapGrid ?? 0.25,
  setSnapGrid: (s) => set({ snapGrid: s }),
  showGuerchetHalo: saved?.showGuerchetHalo ?? true,
  toggleGuerchetHalo: () => set((s) => ({ showGuerchetHalo: !s.showGuerchetHalo })),
  showGrid: saved?.showGrid ?? true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  // === Selection ===
  selectedMachineId: null,
  selectedMachineIds: [],
  setSelectedMachine: (id) =>
    set({ selectedMachineId: id, selectedMachineIds: id ? [id] : [] }),
  addToSelection: (id) => {
    const { selectedMachineIds } = get();
    if (selectedMachineIds.includes(id)) return;
    set({
      selectedMachineId: id,
      selectedMachineIds: [...selectedMachineIds, id],
    });
  },
  toggleInSelection: (id) => {
    const { selectedMachineIds } = get();
    if (selectedMachineIds.includes(id)) {
      const next = selectedMachineIds.filter((i) => i !== id);
      set({
        selectedMachineIds: next,
        selectedMachineId: next.length > 0 ? next[next.length - 1] : null,
      });
    } else {
      set({
        selectedMachineId: id,
        selectedMachineIds: [...selectedMachineIds, id],
      });
    }
  },
  selectAll: () => {
    const { machines, activePlanta } = get();
    const ids = machines
      .filter((m) => m.planta === activePlanta && m.placed)
      .map((m) => m.id);
    set({
      selectedMachineIds: ids,
      selectedMachineId: ids.length > 0 ? ids[0] : null,
    });
  },
  clearSelection: () =>
    set({ selectedMachineId: null, selectedMachineIds: [], selectedRoomId: null }),

  // === Bulk operations ===
  bulkRotate: (angle) => {
    const { selectedMachineIds } = get();
    if (selectedMachineIds.length === 0) return;
    get().pushHistory();
    set((s) => ({
      machines: s.machines.map((m) =>
        selectedMachineIds.includes(m.id) && !m.locked
          ? { ...m, rotation: (m.rotation + angle) % 360 }
          : m
      ),
    }));
  },
  bulkRemove: () => {
    const { selectedMachineIds } = get();
    if (selectedMachineIds.length === 0) return;
    get().pushHistory();
    set((s) => ({
      machines: s.machines.filter((m) => !selectedMachineIds.includes(m.id)),
      selectedMachineId: null,
      selectedMachineIds: [],
    }));
  },
  bulkToggleLock: () => {
    const { selectedMachineIds, machines } = get();
    if (selectedMachineIds.length === 0) return;
    // If any is unlocked, lock all. Otherwise unlock all.
    const anyUnlocked = machines.some(
      (m) => selectedMachineIds.includes(m.id) && !m.locked
    );
    set((s) => ({
      machines: s.machines.map((m) =>
        selectedMachineIds.includes(m.id) ? { ...m, locked: anyUnlocked } : m
      ),
    }));
  },
  bulkMove: (dx, dy) => {
    const { selectedMachineIds } = get();
    if (selectedMachineIds.length === 0) return;
    set((s) => ({
      machines: s.machines.map((m) =>
        selectedMachineIds.includes(m.id) && !m.locked
          ? { ...m, x: m.x + dx, y: m.y + dy }
          : m
      ),
    }));
  },
  bulkUpdateProp: (props) => {
    const { selectedMachineIds } = get();
    if (selectedMachineIds.length === 0) return;
    get().pushHistory();
    set((s) => ({
      machines: s.machines.map((m) =>
        selectedMachineIds.includes(m.id) ? { ...m, ...props } : m
      ),
    }));
  },

  // === Canvas ===
  canvasScale: saved?.canvasScale ?? 1,
  canvasOffset: saved?.canvasOffset ?? { x: 40, y: 40 },
  setCanvasScale: (s) => set({ canvasScale: s }),
  setCanvasOffset: (o) => set({ canvasOffset: o }),

  // === Plantillas ===
  templates: ALL_DEFAULT_MACHINES,
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // === Máquinas colocadas (restored from draft if available) ===
  machines: saved?.machines ?? [],
  addMachine: (templateId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    // Find a free position: stagger from existing machines to avoid overlap
    const { machines, activePlanta, canvasOffset, canvasScale } = get();
    const existing = machines.filter((m) => m.planta === activePlanta);
    const mw = m2px(template.largo);
    const mh = m2px(template.ancho);

    // Try to place in visible area center, offset if occupied
    const viewCenterX = (-canvasOffset.x + 500) / canvasScale;
    const viewCenterY = (-canvasOffset.y + 300) / canvasScale;
    let x = Math.max(mw / 2 + m2px(1), viewCenterX);
    let y = Math.max(mh / 2 + m2px(1), viewCenterY);

    // Nudge away from overlapping machines
    const isOverlapping = (px: number, py: number) =>
      existing.some((m) => {
        const ow = m2px(m.largo);
        const oh = m2px(m.ancho);
        return Math.abs(px - m.x) < (mw + ow) / 2 + m2px(0.3)
            && Math.abs(py - m.y) < (mh + oh) / 2 + m2px(0.3);
      });

    let attempts = 0;
    while (isOverlapping(x, y) && attempts < 30) {
      x += m2px(0.5);
      if (x > m2px(20)) {
        x = mw / 2 + m2px(1);
        y += m2px(0.5);
      }
      attempts++;
    }

    const instance: MachineInstance = {
      id: uuid(),
      templateId,
      nombre: template.nombre,
      categoria: template.categoria,
      largo: template.largo,
      ancho: template.ancho,
      alto: template.alto,
      N: template.N,
      K: template.K,
      x,
      y,
      rotation: 0,
      planta: activePlanta,
      locked: false,
      placed: false,
      tiempoServicio: template.tiempoServicio,
      capacidad: 1,
    };
    get().pushHistory();
    set((s) => ({
      machines: [...s.machines, instance],
      selectedMachineId: instance.id,
      selectedMachineIds: [instance.id],
    }));
  },
  placeMachine: (id, x, y) => {
    get().pushHistory();
    set((s) => ({
      machines: s.machines.map((m) =>
        m.id === id ? { ...m, x, y, placed: true } : m
      ),
    }));
  },
  moveMachine: (id, x, y) => {
    set((s) => ({
      machines: s.machines.map((m) =>
        m.id === id && !m.locked ? { ...m, x, y } : m
      ),
    }));
  },
  rotateMachine: (id, angle) => {
    get().pushHistory();
    set((s) => ({
      machines: s.machines.map((m) =>
        m.id === id && !m.locked ? { ...m, rotation: (m.rotation + angle) % 360 } : m
      ),
    }));
  },
  removeMachine: (id) => {
    get().pushHistory();
    set((s) => ({
      machines: s.machines.filter((m) => m.id !== id),
      selectedMachineId: s.selectedMachineId === id ? null : s.selectedMachineId,
      selectedMachineIds: s.selectedMachineIds.filter((i) => i !== id),
    }));
  },
  duplicateMachine: (id) => {
    const orig = get().machines.find((m) => m.id === id);
    if (!orig) return;
    get().pushHistory();
    const dup: MachineInstance = {
      ...orig,
      id: uuid(),
      x: orig.x + m2px(0.5),
      y: orig.y + m2px(0.5),
      locked: false,
    };
    set((s) => ({ machines: [...s.machines, dup] }));
  },
  toggleLockMachine: (id) => {
    set((s) => ({
      machines: s.machines.map((m) =>
        m.id === id ? { ...m, locked: !m.locked } : m
      ),
    }));
  },
  updateMachineProp: (id, props) => {
    set((s) => ({
      machines: s.machines.map((m) =>
        m.id === id ? { ...m, ...props } : m
      ),
    }));
  },
  autoPlaceAll: () => {
    const { templates, activePlanta, machines } = get();
    const plantaTemplates = templates.filter((t) => t.planta === activePlanta);
    const existingIds = new Set(machines.filter((m) => m.planta === activePlanta).map((m) => m.templateId));
    const toPlace = plantaTemplates.filter((t) => !existingIds.has(t.id));
    if (toPlace.length === 0) return;

    get().pushHistory();

    // Size-aware row packing: place machines left-to-right, wrapping rows
    const plantaInfo = PLANTA_INFO[activePlanta];
    const maxWidth = m2px(plantaInfo.canvasWidth - 2); // leave 1m margin each side
    const gap = m2px(0.5); // 0.5m gap between machines
    const startX = m2px(1);
    const startY = m2px(1.5);

    let cursorX = startX;
    let cursorY = startY;
    let rowMaxH = 0;

    // Sort by category then by size (largest first for better packing)
    const sorted = [...toPlace].sort((a, b) => {
      if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
      return (b.largo * b.ancho) - (a.largo * a.ancho);
    });

    const newMachines: MachineInstance[] = sorted.map((template) => {
      const mw = m2px(template.largo);
      const mh = m2px(template.ancho);

      // Wrap to next row if needed
      if (cursorX + mw > maxWidth && cursorX > startX) {
        cursorX = startX;
        cursorY += rowMaxH + gap;
        rowMaxH = 0;
      }

      const x = cursorX + mw / 2; // center offset
      const y = cursorY + mh / 2;

      cursorX += mw + gap;
      rowMaxH = Math.max(rowMaxH, mh);

      return {
        id: uuid(),
        templateId: template.id,
        nombre: template.nombre,
        categoria: template.categoria,
        largo: template.largo,
        ancho: template.ancho,
        alto: template.alto,
        N: template.N,
        K: template.K,
        x,
        y,
        rotation: 0,
        planta: activePlanta,
        locked: false,
        placed: true,
        tiempoServicio: template.tiempoServicio,
        capacidad: 1,
      };
    });
    set((s) => ({ machines: [...s.machines, ...newMachines] }));
  },

  // === Zonas ===
  zones: saved?.zones ?? [],
  addZone: (zone) => set((s) => ({ zones: [...s.zones, { ...zone, id: uuid() }] })),
  removeZone: (id) => set((s) => ({ zones: s.zones.filter((z) => z.id !== id) })),

  // === Floor Plan Tracing ===
  // Migrate legacy rooms that lack visible/locked fields
  floorRooms: (saved?.floorRooms ?? []).map((r) => ({
    ...r,
    visible: r.visible ?? true,
    locked: r.locked ?? false,
  })),
  tracingPoints: [],
  isTracing: false,
  pendingFinish: false,

  // === Image Layers ===
  imageLayers: saved?.imageLayers ?? [],
  selectedImageId: null,

  // === Custom Measures ===
  customMeasures: saved?.customMeasures ?? [],

  startTracing: () => set({ isTracing: true, tracingPoints: [], pendingFinish: false, activeTool: 'trace' as EditorTool }),

  addTracingPoint: (x, y) => {
    const { tracingPoints, snapGrid: sg } = get();
    // Snap to grid
    const gridPx = m2px(sg);
    const sx = Math.round(x / gridPx) * gridPx;
    const sy = Math.round(y / gridPx) * gridPx;

    // Check if closing the polygon (clicking near first point)
    if (tracingPoints.length >= 3) {
      const first = tracingPoints[0];
      const dist = Math.sqrt((sx - first.x) ** 2 + (sy - first.y) ** 2);
      if (dist < gridPx * 1.5) {
        // Close polygon — don't add point, signal ready to finish
        return; // Will be handled by finishTracing
      }
    }

    set({ tracingPoints: [...tracingPoints, { x: sx, y: sy }] });
  },

  undoTracingPoint: () => {
    const { tracingPoints } = get();
    if (tracingPoints.length > 0) {
      set({ tracingPoints: tracingPoints.slice(0, -1) });
    }
  },

  requestFinish: () => {
    const { tracingPoints } = get();
    if (tracingPoints.length >= 3) {
      set({ pendingFinish: true });
    }
  },

  finishTracing: (name, color) => {
    const { tracingPoints, activePlanta, floorRooms } = get();
    if (tracingPoints.length < 3) return;
    const roomColor = color || ROOM_COLORS[floorRooms.length % ROOM_COLORS.length];
    const room: FloorRoom = {
      id: uuid(),
      name,
      points: [...tracingPoints],
      planta: activePlanta,
      color: roomColor,
      visible: true,
      locked: false,
    };
    set({
      floorRooms: [...floorRooms, room],
      tracingPoints: [],
      isTracing: false,
      pendingFinish: false,
      activeTool: 'select',
    });
  },

  cancelTracing: () => set({ tracingPoints: [], isTracing: false, pendingFinish: false, activeTool: 'select' }),

  addFloorRoom: (name, color) => {
    // Manually add a room (for typed-coordinates flow)
    const { activePlanta, floorRooms } = get();
    const room: FloorRoom = {
      id: uuid(),
      name,
      points: [],
      planta: activePlanta,
      color: color || ROOM_COLORS[floorRooms.length % ROOM_COLORS.length],
      visible: true,
      locked: false,
    };
    set({ floorRooms: [...floorRooms, room] });
  },

  removeFloorRoom: (id) =>
    set((s) => ({ floorRooms: s.floorRooms.filter((r) => r.id !== id) })),

  renameFloorRoom: (id, name) =>
    set((s) => ({
      floorRooms: s.floorRooms.map((r) => (r.id === id ? { ...r, name } : r)),
    })),

  getRoomArea: (room) => shoelaceAreaM2(room.points),

  getTotalFloorArea: (planta) => {
    const rooms = get().floorRooms.filter((r) => r.planta === planta);
    return rooms.reduce((sum, r) => sum + shoelaceAreaM2(r.points), 0);
  },

  // === Room Editing (Layer-like) ===
  selectedRoomId: null,

  setSelectedRoom: (id) =>
    set({ selectedRoomId: id, selectedMachineId: null, selectedMachineIds: [] }),

  updateRoomVertex: (id, vertexIdx, x, y) => {
    const { snapGrid: sg } = get();
    const gridPx = m2px(sg);
    const sx = Math.round(x / gridPx) * gridPx;
    const sy = Math.round(y / gridPx) * gridPx;
    set((s) => ({
      floorRooms: s.floorRooms.map((r) => {
        if (r.id !== id) return r;
        const pts = [...r.points];
        pts[vertexIdx] = { x: sx, y: sy };
        return { ...r, points: pts };
      }),
    }));
  },

  moveRoom: (id, dx, dy) =>
    set((s) => ({
      floorRooms: s.floorRooms.map((r) => {
        if (r.id !== id || r.locked) return r;
        return { ...r, points: r.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
      }),
    })),

  addRoomVertex: (id, afterIdx, x, y) => {
    const { snapGrid: sg } = get();
    const gridPx = m2px(sg);
    const sx = Math.round(x / gridPx) * gridPx;
    const sy = Math.round(y / gridPx) * gridPx;
    set((s) => ({
      floorRooms: s.floorRooms.map((r) => {
        if (r.id !== id) return r;
        const pts = [...r.points];
        pts.splice(afterIdx + 1, 0, { x: sx, y: sy });
        return { ...r, points: pts };
      }),
    }));
  },

  removeRoomVertex: (id, vertexIdx) =>
    set((s) => ({
      floorRooms: s.floorRooms.map((r) => {
        if (r.id !== id || r.points.length <= 3) return r; // keep min 3 vertices
        const pts = r.points.filter((_, i) => i !== vertexIdx);
        return { ...r, points: pts };
      }),
    })),

  toggleRoomVisibility: (id) =>
    set((s) => ({
      floorRooms: s.floorRooms.map((r) =>
        r.id === id ? { ...r, visible: !r.visible } : r
      ),
    })),

  toggleRoomLock: (id) =>
    set((s) => ({
      floorRooms: s.floorRooms.map((r) =>
        r.id === id ? { ...r, locked: !r.locked } : r
      ),
    })),

  setRoomColor: (id, color) =>
    set((s) => ({
      floorRooms: s.floorRooms.map((r) =>
        r.id === id ? { ...r, color } : r
      ),
    })),

  // === Image Layers ===
  addImageLayer: (src, planta) => {
    const layer: ImageLayer = {
      id: uuid(),
      planta,
      src,
      x: 0,
      y: 0,
      width: m2px(20), // default 20m wide
      height: m2px(30), // default 30m tall
      visible: true,
      locked: false,
      rotation: 0,
    };
    set((s) => ({ imageLayers: [...s.imageLayers, layer] }));
  },

  removeImageLayer: (id) =>
    set((s) => ({
      imageLayers: s.imageLayers.filter((l) => l.id !== id),
      selectedImageId: s.selectedImageId === id ? null : s.selectedImageId,
    })),

  setSelectedImage: (id) =>
    set({ selectedImageId: id, selectedMachineId: null, selectedMachineIds: [], selectedRoomId: null }),

  updateImageLayer: (id, updates) =>
    set((s) => ({
      imageLayers: s.imageLayers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  toggleImageVisibility: (id) =>
    set((s) => ({
      imageLayers: s.imageLayers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),

  toggleImageLock: (id) =>
    set((s) => ({
      imageLayers: s.imageLayers.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      ),
    })),

  // === Custom Measures ===
  addCustomMeasure: (axis, value, label, planta) => {
    const measure: CustomMeasure = {
      id: uuid(),
      axis,
      value,
      label,
      planta,
      visible: true,
    };
    set((s) => ({ customMeasures: [...s.customMeasures, measure] }));
  },

  removeCustomMeasure: (id) =>
    set((s) => ({
      customMeasures: s.customMeasures.filter((m) => m.id !== id),
    })),

  updateCustomMeasure: (id, updates) =>
    set((s) => ({
      customMeasures: s.customMeasures.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  toggleCustomMeasureVisibility: (id) =>
    set((s) => ({
      customMeasures: s.customMeasures.map((m) =>
        m.id === id ? { ...m, visible: !m.visible } : m
      ),
    })),

  // === Custom Machine Templates ===
  addCustomTemplate: (data) => {
    const Ss = data.largo * data.ancho;
    const Sg = Ss * data.N;
    const Se = data.K * (Ss + Sg);
    const St = Ss + Sg + Se;
    const template: MachineTemplate = {
      id: uuid(),
      nombre: data.nombre,
      categoria: data.categoria,
      largo: data.largo,
      ancho: data.ancho,
      alto: data.alto,
      N: data.N,
      K: data.K,
      Ss: Math.round(Ss * 1000) / 1000,
      Sg: Math.round(Sg * 1000) / 1000,
      Se: Math.round(Se * 1000) / 1000,
      St: Math.round(St * 1000) / 1000,
      planta: data.planta,
      tiempoServicio: data.tiempoServicio,
    };
    set((s) => ({ templates: [...s.templates, template] }));
  },

  // === Image Calibration ===
  imgCalibrations: saved?.imgCalibrations ?? { ...DEFAULT_IMG_CALIBRATIONS },

  setImgCalibration: (planta, cal) =>
    set((s) => ({
      imgCalibrations: {
        ...s.imgCalibrations,
        [planta]: { ...s.imgCalibrations[planta], ...cal },
      },
    })),

  resetImgCalibration: (planta) =>
    set((s) => ({
      imgCalibrations: {
        ...s.imgCalibrations,
        [planta]: { ...DEFAULT_IMG_CALIBRATIONS[planta] },
      },
    })),

  // === SLP ===
  slpRelations: saved?.slpRelations ?? {},
  setSLPRelation: (key, rel) =>
    set((s) => ({ slpRelations: { ...s.slpRelations, [key]: rel } })),
  setSLPRelationsBulk: (updates) =>
    set((s) => ({ slpRelations: { ...s.slpRelations, ...updates } })),

  // === Simulación ===
  simRunning: false,
  simSpeed: 1,
  simTime: 6,
  simClients: [],
  simMetrics: null,
  showHeatmap: false,
  setSimRunning: (r) => set({ simRunning: r }),
  setSimSpeed: (s) => set({ simSpeed: s }),
  setSimTime: (t) => set({ simTime: t }),
  setSimClients: (c) => set({ simClients: c }),
  setSimMetrics: (m) => set({ simMetrics: m }),
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),

  // === Background (per-planta, user-imported) ===
  bgImages: saved?.bgImages ?? {
    baja: null,
    alta: null,
  },
  bgOpacity: saved?.bgOpacity ?? 0.3,
  showBg: saved?.showBg ?? false,
  setBgImage: (planta, img) =>
    set((s) => ({ bgImages: { ...s.bgImages, [planta]: img } })),
  setBgOpacity: (o) => set({ bgOpacity: o }),
  toggleBg: () => set((s) => ({ showBg: !s.showBg })),

  // === Undo/Redo ===
  history: [],
  historyIndex: -1,
  pushHistory: () => {
    const { machines, zones, history, historyIndex } = get();
    const entry: HistoryEntry = {
      machines: JSON.parse(JSON.stringify(machines)),
      zones: JSON.parse(JSON.stringify(zones)),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    set({
      machines: JSON.parse(JSON.stringify(entry.machines)),
      zones: JSON.parse(JSON.stringify(entry.zones)),
      historyIndex: historyIndex - 1,
    });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    set({
      machines: JSON.parse(JSON.stringify(entry.machines)),
      zones: JSON.parse(JSON.stringify(entry.zones)),
      historyIndex: historyIndex + 1,
    });
  },

  // === Superficie ===
  getSuperficieUsada: (planta) => {
    const machines = get().machines.filter((m) => m.planta === planta && m.placed);
    let total = 0;
    for (const m of machines) {
      const Ss = m.largo * m.ancho;
      const Sg = Ss * m.N;
      const Se = m.K * (Ss + Sg);
      total += Ss + Sg + Se;
    }
    return Math.round(total * 100) / 100;
  },
  getSuperficieDisponible: (planta) => PLANTA_INFO[planta].superficie,

  // === Auto-save ===
  lastSaved: saved ? saved.savedAt ?? null : null,
  clearDraft: () => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    set({
      machines: [],
      zones: [],
      floorRooms: [],
      imageLayers: [],
      customMeasures: [],
      slpRelations: {},
      imgCalibrations: { ...DEFAULT_IMG_CALIBRATIONS },
      lastSaved: null,
    });
  },
}));

// Subscribe to state changes → auto-save
useStore.subscribe((state) => {
  debouncedSave(state);
});

export default useStore;
