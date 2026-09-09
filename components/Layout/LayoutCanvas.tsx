// ==========================================
// Canvas principal del editor de layout
// Usa react-konva — soporta multi-select, floor plans, atajos
// ==========================================

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group, Text, Image as KonvaImage, RegularPolygon } from 'react-konva';
import useStore, { m2px, px2m, PIXELS_PER_METER } from '@/stores/useStore';
import { CATEGORY_COLORS, CLIENT_STATE_COLORS } from '@/types';
import type { FloorRoom, ImageLayer } from '@/types';
import { calcularHaloRadius, getOperativeSides } from '@/engine/guerchet';
import { PLANTA_INFO } from '@/data/machines';
import useImage from '@/utils/useImage';
import FloorPanel from './FloorPanel';
import PropertiesPanel from './PropertiesPanel';

export default function LayoutCanvas() {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePlanta = useStore((s) => s.activePlanta);
  const machines = useStore((s) => s.machines);
  const zones = useStore((s) => s.zones);
  const showGrid = useStore((s) => s.showGrid);
  const snapGrid = useStore((s) => s.snapGrid);
  const showGuerchetHalo = useStore((s) => s.showGuerchetHalo);
  const selectedMachineId = useStore((s) => s.selectedMachineId);
  const selectedMachineIds = useStore((s) => s.selectedMachineIds);
  const setSelectedMachine = useStore((s) => s.setSelectedMachine);
  const addToSelection = useStore((s) => s.addToSelection);
  const toggleInSelection = useStore((s) => s.toggleInSelection);
  const clearSelection = useStore((s) => s.clearSelection);
  const moveMachine = useStore((s) => s.moveMachine);
  const placeMachine = useStore((s) => s.placeMachine);
  const canvasScale = useStore((s) => s.canvasScale);
  const canvasOffset = useStore((s) => s.canvasOffset);
  const setCanvasScale = useStore((s) => s.setCanvasScale);
  const setCanvasOffset = useStore((s) => s.setCanvasOffset);
  const bgImages = useStore((s) => s.bgImages);
  const bgOpacity = useStore((s) => s.bgOpacity);
  const showBg = useStore((s) => s.showBg);
  const activeTab = useStore((s) => s.activeTab);
  const simClients = useStore((s) => s.simClients);
  const showHeatmap = useStore((s) => s.showHeatmap);

  // Floor plan tracing
  const floorRooms = useStore((s) => s.floorRooms);
  const isTracing = useStore((s) => s.isTracing);
  const tracingPoints = useStore((s) => s.tracingPoints);
  const addTracingPoint = useStore((s) => s.addTracingPoint);
  const requestFinish = useStore((s) => s.requestFinish);
  const finishTracing = useStore((s) => s.finishTracing);
  const pendingFinish = useStore((s) => s.pendingFinish);
  const activeTool = useStore((s) => s.activeTool);
  const getRoomArea = useStore((s) => s.getRoomArea);

  // Room editing (layers)
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const setSelectedRoom = useStore((s) => s.setSelectedRoom);
  const updateRoomVertex = useStore((s) => s.updateRoomVertex);
  const moveRoom = useStore((s) => s.moveRoom);
  const removeRoomVertex = useStore((s) => s.removeRoomVertex);
  const addRoomVertex = useStore((s) => s.addRoomVertex);

  // Image layers
  const imageLayers = useStore((s) => s.imageLayers);
  const selectedImageId = useStore((s) => s.selectedImageId);
  const setSelectedImage = useStore((s) => s.setSelectedImage);
  const updateImageLayer = useStore((s) => s.updateImageLayer);

  // Image calibration
  const imgCalibrations = useStore((s) => s.imgCalibrations);
  const imgCal = imgCalibrations[activePlanta];

  // Floor plan info
  const plantaInfo = PLANTA_INFO[activePlanta];
  const canvasW = m2px(plantaInfo.canvasWidth);
  const canvasH = m2px(plantaInfo.canvasHeight);

  // Current planta machines
  const plantaMachines = useMemo(
    () => machines.filter((m) => m.planta === activePlanta),
    [machines, activePlanta]
  );

  // Load floor plan background image
  const bgSrc = showBg ? bgImages[activePlanta] : null;
  const [bgImg] = useImage(bgSrc || '');

  // Background image dimensions from calibration (meters → pixels)
  const bgW = m2px(imgCal.imgWidth);
  const bgH = m2px(imgCal.imgHeight);
  const bgOffX = m2px(imgCal.offsetX);
  const bgOffY = m2px(imgCal.offsetY);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = canvasScale;
      const pointer = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - canvasOffset.x) / oldScale,
        y: (pointer.y - canvasOffset.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(0.15, Math.min(6, oldScale * (1 + direction * 0.1)));

      setCanvasScale(newScale);
      setCanvasOffset({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [canvasScale, canvasOffset, setCanvasScale, setCanvasOffset]
  );

  // Snap to grid
  const snapToGrid = (val: number) => {
    const gridPx = m2px(snapGrid);
    return Math.round(val / gridPx) * gridPx;
  };

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      // Don't intercept when typing in inputs
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const store = useStore.getState();

      // --- Tracing mode shortcuts ---
      if (store.isTracing) {
        if (e.key === 'Escape') {
          store.cancelTracing();
          return;
        }
        if (e.key === 'Enter' && store.tracingPoints.length >= 3 && !store.pendingFinish) {
          store.requestFinish();
          return;
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          store.undoTracingPoint();
          return;
        }
        return; // Don't process other shortcuts during tracing
      }

      const { selectedMachineIds: selIds } = store;
      const hasSelection = selIds.length > 0;

      // --- Selection shortcuts ---
      // Ctrl/Cmd + A: Select all placed machines
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        store.selectAll();
        return;
      }

      // Escape: Clear selection (machines and rooms)
      if (e.key === 'Escape') {
        store.clearSelection();
        return;
      }

      // Delete selected room (if a room is selected, not a machine)
      if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedRoomId && !hasSelection) {
        const room = store.floorRooms.find((r: FloorRoom) => r.id === store.selectedRoomId);
        if (room && !room.locked) {
          store.removeFloorRoom(store.selectedRoomId);
          store.setSelectedRoom(null);
        }
        return;
      }

      // --- Manipulation shortcuts (work on multi-select) ---
      if (!hasSelection) return;

      // R: Rotate selected 90°
      if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
          store.bulkRotate(90);
          return;
        }
      }

      // Delete/Backspace: Remove selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        store.bulkRemove();
        return;
      }

      // L: Toggle lock on selected
      if (e.key === 'l' || e.key === 'L') {
        store.bulkToggleLock();
        return;
      }

      // D: Duplicate primary selected
      if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey && store.selectedMachineId) {
          store.duplicateMachine(store.selectedMachineId);
          return;
        }
      }

      // Arrow keys: Nudge selected machines
      const nudge = e.shiftKey ? m2px(1) : m2px(0.25);
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        store.bulkMove(0, -nudge);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        store.bulkMove(0, nudge);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        store.bulkMove(-nudge, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        store.bulkMove(nudge, 0);
      }

      // Ctrl+Z: Undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        store.redo();
      }

      // G: Toggle grid
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        store.toggleGrid();
      }

      // H: Toggle Guerchet halo
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        store.toggleGuerchetHalo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Container size — wait for layout before mounting Konva Stage
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setStageSize({ width: w, height: h });
          if (!mounted) setMounted(true);
        }
      }
    };
    // Double-RAF to guarantee DOM layout is complete
    requestAnimationFrame(() => requestAnimationFrame(resize));
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [mounted]);

  // Handle machine click (single, ctrl, shift)
  const handleMachineClick = (machineId: string, e: any) => {
    e.cancelBubble = true;
    const evt = e.evt as MouseEvent;
    if (evt.ctrlKey || evt.metaKey) {
      toggleInSelection(machineId);
    } else if (evt.shiftKey) {
      addToSelection(machineId);
    } else {
      setSelectedMachine(machineId);
    }
  };

  return (
    <div className="flex-1 flex bg-zinc-950 overflow-hidden">
      <div
        ref={containerRef}
        tabIndex={-1}
        className={`flex-1 relative outline-none ${activeTool === 'trace' ? 'cursor-crosshair' : ''}`}
      >
      {!mounted ? null : (
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={canvasScale}
        scaleY={canvasScale}
        x={canvasOffset.x}
        y={canvasOffset.y}
        onWheel={handleWheel}
        draggable
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setCanvasOffset({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onClick={(e) => {
          if (e.target === stageRef.current) {
            if (activeTool === 'trace' && isTracing) {
              // Get click position in canvas coordinates
              const stage = stageRef.current;
              const pointer = stage.getPointerPosition();
              if (pointer) {
                const canvasX = (pointer.x - canvasOffset.x) / canvasScale;
                const canvasY = (pointer.y - canvasOffset.y) / canvasScale;

                // Check if closing the polygon
                const pts = useStore.getState().tracingPoints;
                const gridPx = m2px(useStore.getState().snapGrid);
                const sx = Math.round(canvasX / gridPx) * gridPx;
                const sy = Math.round(canvasY / gridPx) * gridPx;

                if (pts.length >= 3) {
                  const first = pts[0];
                  const dist = Math.sqrt((sx - first.x) ** 2 + (sy - first.y) ** 2);
                  if (dist < gridPx * 1.5) {
                    // Close the polygon — show naming input
                    requestFinish();
                    return;
                  }
                }

                addTracingPoint(canvasX, canvasY);
              }
            } else {
              clearSelection();
            }
          }
        }}
      >
        {/* Grid */}
        {showGrid && (
          <Layer listening={false}>
            <GridLines width={canvasW} height={canvasH} step={m2px(snapGrid)} />
            {/* Meter ruler labels along top and left edges */}
            <RulerLabels width={canvasW} height={canvasH} />
          </Layer>
        )}

        {/* Background: perimeter + floor plan image */}
        <Layer listening={false}>
          {/* Canvas perimeter */}
          <Rect
            x={0}
            y={0}
            width={canvasW}
            height={canvasH}
            stroke="#333"
            strokeWidth={1}
            fill="#111118"
          />

          {/* Floor plan background image (calibrated) */}
          {bgImg && showBg && bgImg.naturalWidth > 0 && bgImg.naturalHeight > 0 && bgW > 0 && bgH > 0 && (
            <KonvaImage
              image={bgImg}
              x={bgOffX}
              y={bgOffY}
              width={bgW}
              height={bgH}
              opacity={bgOpacity}
            />
          )}

          {/* Scale reference bar */}
          <Line
            points={[m2px(0.5), canvasH - m2px(0.5), m2px(5.5), canvasH - m2px(0.5)]}
            stroke="#555"
            strokeWidth={2}
          />
          <Line
            points={[m2px(0.5), canvasH - m2px(0.7), m2px(0.5), canvasH - m2px(0.3)]}
            stroke="#555"
            strokeWidth={1}
          />
          <Line
            points={[m2px(5.5), canvasH - m2px(0.7), m2px(5.5), canvasH - m2px(0.3)]}
            stroke="#555"
            strokeWidth={1}
          />
          <Text
            x={m2px(1.5)}
            y={canvasH - m2px(1)}
            text="5 metros"
            fill="#666"
            fontSize={11}
          />
        </Layer>

        {/* Zones */}
        <Layer listening={false}>
          {zones
            .filter((z) => z.planta === activePlanta)
            .map((zone) => (
              <Line
                key={zone.id}
                points={zone.points.flatMap((p) => [p.x, p.y])}
                closed
                fill={zone.color + '20'}
                stroke={zone.color}
                strokeWidth={1}
              />
            ))}
        </Layer>

        {/* Image Layers (background images — editable) */}
        <Layer>
          {imageLayers
            .filter((img) => img.planta === activePlanta && img.visible)
            .map((img) => (
              <ImageLayerShape
                key={img.id}
                layer={img}
                isSelected={selectedImageId === img.id}
                onSelect={() => { setSelectedImage(img.id); clearSelection(); }}
                onUpdate={(updates) => updateImageLayer(img.id, updates)}
                snapToGrid={snapToGrid}
                isTracing={isTracing}
              />
            ))}
        </Layer>

        {/* Floor Rooms (traced polygons — interactive layers) */}
        <Layer>
          {floorRooms
            .filter((r) => r.planta === activePlanta && r.visible)
            .map((room) => (
              <FloorRoomShape
                key={room.id}
                room={room}
                getRoomArea={getRoomArea}
                isSelected={selectedRoomId === room.id}
                onSelect={(id) => { setSelectedRoom(id); clearSelection(); }}
                onVertexDrag={(vertexIdx, x, y) => updateRoomVertex(room.id, vertexIdx, x, y)}
                onShapeDrag={(dx, dy) => moveRoom(room.id, dx, dy)}
                onRemoveVertex={(vertexIdx) => removeRoomVertex(room.id, vertexIdx)}
                onAddVertex={(afterIdx, x, y) => addRoomVertex(room.id, afterIdx, x, y)}
                snapToGrid={snapToGrid}
                isTracing={isTracing}
              />
            ))}
        </Layer>

        {/* Tracing preview (polygon being drawn) */}
        {isTracing && activeTool === 'trace' && tracingPoints.length > 0 && (
          <Layer listening={false}>
            <TracingPreview points={tracingPoints} />
          </Layer>
        )}

        {/* Heatmap overlay (simulation) */}
        {activeTab === 'simulacion' && showHeatmap && (
          <Layer listening={false}>
            {/* Placeholder for heatmap cells */}
          </Layer>
        )}

        {/* Machines */}
        <Layer>
          {plantaMachines.map((machine) => {
            const isSelected = selectedMachineIds.includes(machine.id);
            const isPrimary = machine.id === selectedMachineId;
            const w = m2px(machine.largo);
            const h = m2px(machine.ancho);
            const color = CATEGORY_COLORS[machine.categoria];
            const haloRadius = m2px(
              calcularHaloRadius(machine.largo, machine.ancho, machine.N, machine.K)
            );

            return (
              <Group
                key={machine.id}
                x={machine.x}
                y={machine.y}
                rotation={machine.rotation}
                draggable={!machine.locked}
                onClick={(e) => handleMachineClick(machine.id, e)}
                onDragStart={() => {
                  useStore.getState().pushHistory();
                }}
                onDragEnd={(e) => {
                  const newX = snapToGrid(e.target.x());
                  const newY = snapToGrid(e.target.y());
                  moveMachine(machine.id, newX, newY);
                  if (!machine.placed) {
                    placeMachine(machine.id, newX, newY);
                  }
                  e.target.x(newX);
                  e.target.y(newY);
                }}
                offset={{ x: w / 2, y: h / 2 }}
              >
                {/* Guerchet halo — direccional según lados operativos (N) */}
                {showGuerchetHalo && machine.N > 0 && haloRadius > 0 && (
                  <DirectionalHalo
                    w={w}
                    h={h}
                    N={machine.N}
                    hr={haloRadius}
                    color={color}
                  />
                )}

                {/* Machine body */}
                <Rect
                  x={0}
                  y={0}
                  width={w}
                  height={h}
                  fill={color + (isSelected ? 'CC' : '80')}
                  stroke={isPrimary ? '#fff' : isSelected ? '#f97316' : color}
                  strokeWidth={isSelected ? 2 : 1}
                  cornerRadius={3}
                  shadowBlur={isSelected ? 10 : 0}
                  shadowColor={isPrimary ? '#fff' : '#f97316'}
                  shadowOpacity={0.4}
                />

                {/* Machine name */}
                <Text
                  x={2}
                  y={2}
                  width={w - 4}
                  text={machine.nombre.length > 15
                    ? machine.nombre.substring(0, 13) + '…'
                    : machine.nombre}
                  fill="#fff"
                  fontSize={Math.min(10, w / 6)}
                  fontStyle="bold"
                  wrap="none"
                  ellipsis
                  listening={false}
                />

                {/* Dimensions label */}
                <Text
                  x={2}
                  y={h - 12}
                  text={`${machine.largo}×${machine.ancho}`}
                  fill="#ffffff90"
                  fontSize={8}
                  listening={false}
                />

                {/* N-sides indicators (arrows pointing outward on operative sides) */}
                {machine.N >= 1 && (
                  <NsideIndicators w={w} h={h} N={machine.N} color={color} />
                )}

                {/* N badge (bottom-right) */}
                <Group x={w - 16} y={h - 14} listening={false}>
                  <Rect
                    x={0}
                    y={0}
                    width={14}
                    height={12}
                    fill={machine.N === 0 ? '#000000CC' : '#000000AA'}
                    cornerRadius={2}
                  />
                  <Text
                    x={0}
                    y={1}
                    width={14}
                    text={`N${machine.N}`}
                    fill={machine.N === 0 ? '#ff9999CC' : '#ffffffCC'}
                    fontSize={7}
                    fontStyle="bold"
                    align="center"
                    listening={false}
                  />
                </Group>

                {/* Lock indicator */}
                {machine.locked && (
                  <Text
                    x={w - 14}
                    y={2}
                    text="🔒"
                    fontSize={10}
                    listening={false}
                  />
                )}
              </Group>
            );
          })}
        </Layer>

        {/* Simulation clients */}
        {activeTab === 'simulacion' && (
          <Layer listening={false}>
            {simClients.map((client) => (
              <Circle
                key={client.id}
                x={client.x}
                y={client.y}
                radius={4}
                fill={CLIENT_STATE_COLORS[client.estado]}
                stroke="#fff"
                strokeWidth={0.5}
                opacity={0.9}
              />
            ))}
          </Layer>
        )}
      </Stage>
      )}

      {/* Canvas info overlay */}
      <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs border border-zinc-800/50">
        <div className="text-zinc-500">
          Zoom: <span className="text-zinc-300 tabular-nums">{Math.round(canvasScale * 100)}%</span>
        </div>
        <div className="text-zinc-500">
          {plantaInfo.label}: <span className="text-zinc-300">{plantaInfo.superficie} m²</span> ·{' '}
          <span className="text-zinc-300">{plantaMachines.filter((m) => m.placed).length}</span> máquinas
        </div>
        {selectedMachineIds.length > 1 && (
          <div className="text-orange-400 mt-1">
            {selectedMachineIds.length} seleccionadas
          </div>
        )}
      </div>

      {/* Floor rooms panel */}
      <FloorPanel />

      {/* Naming overlay for finishing a traced polygon */}
      {pendingFinish && (
        <RoomNameInput
          onSubmit={(name) => finishTracing(name)}
          onCancel={() => useStore.setState({ pendingFinish: false })}
          defaultName={`Recinto ${floorRooms.length + 1}`}
        />
      )}

      {/* Shortcuts hint (bottom-left) */}
      <div className="absolute bottom-3 left-3 bg-zinc-900/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-600 border border-zinc-800/30 space-y-0.5">
        <div><kbd className="text-zinc-500">Ctrl+Click</kbd> multi-select</div>
        <div><kbd className="text-zinc-500">Arrows</kbd> mover · <kbd className="text-zinc-500">Shift+↑</kbd> 1m</div>
        <div><kbd className="text-zinc-500">R</kbd> rotar · <kbd className="text-zinc-500">D</kbd> duplicar · <kbd className="text-zinc-500">L</kbd> lock</div>
        <div><kbd className="text-zinc-500">Ctrl+A</kbd> seleccionar todas</div>
      </div>
      </div>

      {/* Properties Panel (lado derecho) */}
      <PropertiesPanel />
    </div>
  );
}

// ---- Halo direccional Guerchet (zonas de circulación por lado operativo) ----
function DirectionalHalo({
  w, h, N, hr, color,
}: {
  w: number; h: number; N: number; hr: number; color: string;
}) {
  const { top, bottom, left, right } = getOperativeSides(N);

  const fill = color + '22';     // ~13% — claramente visible
  const stroke = color + '60';   // ~38% — borde exterior nítido

  // Clearance en metros para las etiquetas
  const clearanceM = px2m(hr).toFixed(2);

  // Las franjas de lados izq/der cubren las esquinas si top/bottom están activos
  // Las franjas top/bottom van solo entre los lados (evita doble opacidad en esquinas)
  const elements: React.JSX.Element[] = [];

  // ─ Franjas verticales (cubren esquinas) ─
  if (left) {
    const y1 = top ? -hr : 0;
    const yLen = h + (top ? hr : 0) + (bottom ? hr : 0);
    elements.push(
      <Rect key="hl" x={-hr} y={y1} width={hr} height={yLen} fill={fill} listening={false} />
    );
    elements.push(
      <Line key="bl" points={[-hr, y1, -hr, y1 + yLen]} stroke={stroke} strokeWidth={1} dash={[5, 3]} listening={false} />
    );
  }
  if (right) {
    const y1 = top ? -hr : 0;
    const yLen = h + (top ? hr : 0) + (bottom ? hr : 0);
    elements.push(
      <Rect key="hr" x={w} y={y1} width={hr} height={yLen} fill={fill} listening={false} />
    );
    elements.push(
      <Line key="br" points={[w + hr, y1, w + hr, y1 + yLen]} stroke={stroke} strokeWidth={1} dash={[5, 3]} listening={false} />
    );
  }

  // ─ Franjas horizontales (entre los lados, sin solaparse) ─
  if (top) {
    elements.push(
      <Rect key="ht" x={0} y={-hr} width={w} height={hr} fill={fill} listening={false} />
    );
    elements.push(
      <Line key="bt" points={[left ? -hr : 0, -hr, w + (right ? hr : 0), -hr]} stroke={stroke} strokeWidth={1} dash={[5, 3]} listening={false} />
    );
  }
  if (bottom) {
    elements.push(
      <Rect key="hb" x={0} y={h} width={w} height={hr} fill={fill} listening={false} />
    );
    elements.push(
      <Line key="bb" points={[left ? -hr : 0, h + hr, w + (right ? hr : 0), h + hr]} stroke={stroke} strokeWidth={1} dash={[5, 3]} listening={false} />
    );
  }

  // ─ Conectores en bordes no-operativos (cierra la forma) ─
  if (left && !top) {
    elements.push(<Line key="ct-l" points={[-hr, 0, 0, 0]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (right && !top) {
    elements.push(<Line key="ct-r" points={[w, 0, w + hr, 0]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (left && !bottom) {
    elements.push(<Line key="cb-l" points={[-hr, h, 0, h]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (right && !bottom) {
    elements.push(<Line key="cb-r" points={[w, h, w + hr, h]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (!left && bottom) {
    elements.push(<Line key="cv-bl" points={[0, h, 0, h + hr]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (!left && top) {
    elements.push(<Line key="cv-tl" points={[0, -hr, 0, 0]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (!right && bottom) {
    elements.push(<Line key="cv-br" points={[w, h, w, h + hr]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }
  if (!right && top) {
    elements.push(<Line key="cv-tr" points={[w, -hr, w, 0]} stroke={stroke} strokeWidth={0.5} dash={[3, 3]} listening={false} />);
  }

  // ─ Etiqueta de distancia (en la franja más ancha) ─
  if (bottom && hr >= m2px(0.12)) {
    elements.push(
      <Text
        key="lbl"
        x={w / 2 - 12}
        y={h + hr / 2 - 4}
        text={`${clearanceM}m`}
        fill={color}
        fontSize={7}
        fontStyle="bold"
        opacity={0.55}
        listening={false}
      />
    );
  }

  return <Group listening={false}>{elements}</Group>;
}

// ---- N-side indicators (small triangles on operative sides) ----
function NsideIndicators({ w, h, N, color }: { w: number; h: number; N: number; color: string }) {
  const arrowSize = Math.min(5, Math.min(w, h) / 6);
  const arrowColor = '#ffffffCC';

  // Usar la misma lógica de lados operativos que el halo
  const { top, bottom, left, right } = getOperativeSides(N);

  const sides: Array<{ x: number; y: number; rotation: number }> = [];

  if (bottom) sides.push({ x: w / 2, y: h + arrowSize + 1, rotation: 180 });
  if (top)    sides.push({ x: w / 2, y: -arrowSize - 1, rotation: 0 });
  if (left)   sides.push({ x: -arrowSize - 1, y: h / 2, rotation: -90 });
  if (right)  sides.push({ x: w + arrowSize + 1, y: h / 2, rotation: 90 });

  return (
    <>
      {sides.map((s, i) => (
        <RegularPolygon
          key={`n-${i}`}
          x={s.x}
          y={s.y}
          sides={3}
          radius={arrowSize}
          rotation={s.rotation}
          fill={arrowColor}
          opacity={0.7}
          listening={false}
        />
      ))}
    </>
  );
}

// ---- Grid Lines (memoized) ----
function GridLines({
  width,
  height,
  step,
}: {
  width: number;
  height: number;
  step: number;
}) {
  const lines: React.JSX.Element[] = [];
  for (let x = 0; x <= width; x += step) {
    const isMeter = Math.abs(x % PIXELS_PER_METER) < 1;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={isMeter ? '#282830' : '#1a1a22'}
        strokeWidth={isMeter ? 0.5 : 0.25}
      />
    );
  }
  for (let y = 0; y <= height; y += step) {
    const isMeter = Math.abs(y % PIXELS_PER_METER) < 1;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={isMeter ? '#282830' : '#1a1a22'}
        strokeWidth={isMeter ? 0.5 : 0.25}
      />
    );
  }
  return <>{lines}</>;
}

// ---- Ruler Labels (meter markers along edges) ----
function RulerLabels({ width, height }: { width: number; height: number }) {
  const labels: React.JSX.Element[] = [];
  const meterStep = PIXELS_PER_METER;

  // Top edge labels (every 2m)
  for (let x = 0; x <= width; x += meterStep * 2) {
    const m = x / meterStep;
    labels.push(
      <Text
        key={`rx-${x}`}
        x={x - 6}
        y={-14}
        text={`${m}`}
        fill="#555"
        fontSize={9}
        fontStyle="bold"
      />
    );
  }

  // Left edge labels (every 2m)
  for (let y = 0; y <= height; y += meterStep * 2) {
    const m = y / meterStep;
    labels.push(
      <Text
        key={`ry-${y}`}
        x={-20}
        y={y - 5}
        text={`${m}`}
        fill="#555"
        fontSize={9}
        fontStyle="bold"
      />
    );
  }

  return <>{labels}</>;
}

// ---- Edge dimension label helper ----
function edgeLengthM(p1: { x: number; y: number }, p2: { x: number; y: number }): string {
  const dx = px2m(p2.x - p1.x);
  const dy = px2m(p2.y - p1.y);
  const len = Math.sqrt(dx * dx + dy * dy);
  return len >= 1 ? `${len.toFixed(2)}m` : `${(len * 100).toFixed(0)}cm`;
}

// ---- Floor Room Shape (completed polygon with area label + edge dims) ----
function FloorRoomShape({
  room,
  getRoomArea,
  isSelected,
  onSelect,
  onVertexDrag,
  onShapeDrag,
  onRemoveVertex,
  onAddVertex,
  snapToGrid,
  isTracing,
}: {
  room: FloorRoom;
  getRoomArea: (r: FloorRoom) => number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVertexDrag: (vertexIdx: number, x: number, y: number) => void;
  onShapeDrag: (dx: number, dy: number) => void;
  onRemoveVertex: (vertexIdx: number) => void;
  onAddVertex: (afterIdx: number, x: number, y: number) => void;
  snapToGrid: (val: number) => number;
  isTracing: boolean;
}) {
  if (room.points.length < 3) return null;

  const flatPoints = room.points.flatMap((p) => [p.x, p.y]);
  const area = getRoomArea(room);

  // Centroid for area label
  const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length;
  const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length;

  // Track drag start for whole-shape dragging
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <Group>
      {/* Fill — clickable to select */}
      <Line
        points={flatPoints}
        closed
        fill={room.color + (isSelected ? '30' : '18')}
        stroke={isSelected ? '#ffffff' : room.color}
        strokeWidth={isSelected ? 2.5 : 2}
        dash={isSelected ? [6, 3] : undefined}
        hitStrokeWidth={8}
        listening={!isTracing}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(room.id);
        }}
      />

      {/* Edge dimension labels */}
      {room.points.map((p, i) => {
        const next = room.points[(i + 1) % room.points.length];
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        const label = edgeLengthM(p, next);

        // Offset label away from the edge
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return null;
        const nx = -dy / len;
        const ny = dx / len;
        const off = 8;

        return (
          <Group key={`dim-${i}`} listening={false}>
            <Rect
              x={mx + nx * off - 18}
              y={my + ny * off - 6}
              width={36}
              height={12}
              fill="#000000CC"
              cornerRadius={2}
            />
            <Text
              x={mx + nx * off - 18}
              y={my + ny * off - 5}
              width={36}
              text={label}
              fill={room.color}
              fontSize={8}
              fontStyle="bold"
              align="center"
            />
          </Group>
        );
      })}

      {/* Area label */}
      <Rect
        x={cx - 30}
        y={cy - 18}
        width={60}
        height={32}
        fill="#000000DD"
        cornerRadius={4}
        listening={false}
      />
      <Text
        x={cx - 30}
        y={cy - 16}
        width={60}
        text={room.name}
        fill="#ffffff"
        fontSize={9}
        fontStyle="bold"
        align="center"
        listening={false}
      />
      <Text
        x={cx - 30}
        y={cy - 4}
        width={60}
        text={`${area.toFixed(1)} m²`}
        fill={room.color}
        fontSize={10}
        fontStyle="bold"
        align="center"
        listening={false}
      />

      {/* Edge midpoints — click to add vertex (only when selected) */}
      {isSelected && !room.locked && room.points.map((p, i) => {
        const next = room.points[(i + 1) % room.points.length];
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        return (
          <Circle
            key={`mid-${i}`}
            x={mx}
            y={my}
            radius={4}
            fill={room.color + '60'}
            stroke={room.color}
            strokeWidth={1}
            listening={!isTracing}
            onClick={(e) => {
              e.cancelBubble = true;
              onAddVertex(i, mx, my);
            }}
          />
        );
      })}

      {/* Vertex dots — draggable when selected + unlocked */}
      {room.points.map((p, i) => (
        <Circle
          key={`v-${i}`}
          x={p.x}
          y={p.y}
          radius={isSelected ? 5 : 3}
          fill={isSelected ? '#ffffff' : room.color}
          stroke={isSelected ? room.color : '#fff'}
          strokeWidth={isSelected ? 2 : 0.5}
          draggable={isSelected && !room.locked && !isTracing}
          listening={!isTracing}
          onDragMove={(e) => {
            const node = e.target;
            const sx = snapToGrid(node.x());
            const sy = snapToGrid(node.y());
            node.x(sx);
            node.y(sy);
            onVertexDrag(i, sx, sy);
          }}
          onDblClick={(e) => {
            e.cancelBubble = true;
            if (isSelected && !room.locked && room.points.length > 3) {
              onRemoveVertex(i);
            }
          }}
        />
      ))}

      {/* Drag handle at centroid (move whole shape, only when selected + unlocked) */}
      {isSelected && !room.locked && (
        <Circle
          x={cx}
          y={cy + 20}
          radius={7}
          fill={room.color + 'AA'}
          stroke="#fff"
          strokeWidth={1.5}
          draggable={!isTracing}
          listening={!isTracing}
          onDragStart={(e) => {
            dragStartRef.current = { x: e.target.x(), y: e.target.y() };
          }}
          onDragEnd={(e) => {
            if (dragStartRef.current) {
              const dx = snapToGrid(e.target.x() - dragStartRef.current.x);
              const dy = snapToGrid(e.target.y() - dragStartRef.current.y);
              onShapeDrag(dx, dy);
              // Reset the handle position — the room points moved, so the centroid shifted
              e.target.x(dragStartRef.current.x + dx);
              e.target.y(dragStartRef.current.y + dy);
              dragStartRef.current = null;
            }
          }}
        />
      )}
    </Group>
  );
}

// ---- Tracing Preview (polygon being drawn) ----
function TracingPreview({ points }: { points: { x: number; y: number }[] }) {
  if (points.length === 0) return null;

  const flatPoints = points.flatMap((p) => [p.x, p.y]);

  // Preview area if we have 3+ points
  const previewArea = points.length >= 3
    ? (() => {
        const n = points.length;
        let area = 0;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          area += points[i].x * points[j].y;
          area -= points[j].x * points[i].y;
        }
        return Math.abs(area) / 2 / (PIXELS_PER_METER * PIXELS_PER_METER);
      })()
    : 0;

  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

  return (
    <Group listening={false}>
      {/* Connecting lines */}
      <Line
        points={flatPoints}
        stroke="#22D3EE"
        strokeWidth={2}
        dash={[8, 4]}
      />

      {/* Closing line preview (dashed, to first point) */}
      {points.length >= 3 && (
        <Line
          points={[
            points[points.length - 1].x, points[points.length - 1].y,
            points[0].x, points[0].y,
          ]}
          stroke="#22D3EE"
          strokeWidth={1}
          dash={[4, 4]}
          opacity={0.4}
        />
      )}

      {/* Fill preview */}
      {points.length >= 3 && (
        <Line
          points={flatPoints}
          closed
          fill="#22D3EE10"
          stroke="transparent"
        />
      )}

      {/* Edge dimensions */}
      {points.map((p, i) => {
        if (i === points.length - 1) return null;
        const next = points[i + 1];
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        const label = edgeLengthM(p, next);
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return null;
        const nx = -dy / len;
        const ny = dx / len;
        const off = 10;

        return (
          <Group key={`td-${i}`}>
            <Rect
              x={mx + nx * off - 20}
              y={my + ny * off - 6}
              width={40}
              height={13}
              fill="#000000DD"
              cornerRadius={2}
            />
            <Text
              x={mx + nx * off - 20}
              y={my + ny * off - 5}
              width={40}
              text={label}
              fill="#22D3EE"
              fontSize={9}
              fontStyle="bold"
              align="center"
            />
          </Group>
        );
      })}

      {/* Vertex dots */}
      {points.map((p, i) => (
        <Circle
          key={`tv-${i}`}
          x={p.x}
          y={p.y}
          radius={i === 0 ? 5 : 3.5}
          fill={i === 0 ? '#22D3EE' : '#22D3EECC'}
          stroke="#fff"
          strokeWidth={i === 0 ? 1.5 : 0.5}
        />
      ))}

      {/* First point highlight (close target) */}
      {points.length >= 3 && (
        <Circle
          x={points[0].x}
          y={points[0].y}
          radius={10}
          stroke="#22D3EE"
          strokeWidth={1}
          dash={[3, 3]}
          opacity={0.5}
        />
      )}

      {/* Preview area label */}
      {previewArea > 0 && (
        <Group>
          <Rect
            x={cx - 25}
            y={cy - 8}
            width={50}
            height={16}
            fill="#000000CC"
            cornerRadius={3}
          />
          <Text
            x={cx - 25}
            y={cy - 6}
            width={50}
            text={`≈${previewArea.toFixed(1)} m²`}
            fill="#22D3EE"
            fontSize={9}
            fontStyle="bold"
            align="center"
          />
        </Group>
      )}
    </Group>
  );
}

// ---- Image Layer Shape (editable background image) ----
function ImageLayerShape({
  layer,
  isSelected,
  onSelect,
  onUpdate,
  snapToGrid,
  isTracing,
}: {
  layer: ImageLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageLayer>) => void;
  snapToGrid: (val: number) => number;
  isTracing: boolean;
}) {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ startW: number; startH: number; startX: number; startY: number } | null>(null);
  const [imgEl] = useImage(layer.src);

  if (!imgEl || !layer.src) return null;

  const HANDLE_SIZE = 8;
  const handleColor = '#00BFF3';

  return (
    <Group>
      {/* Image */}
      <KonvaImage
        image={imgEl}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        opacity={0.7}
        hitStrokeWidth={8}
        listening={!isTracing && !layer.locked}
        onClick={() => !isTracing && !layer.locked && onSelect()}
        onDragStart={(e) => {
          if (layer.locked || isTracing) return;
          dragStartRef.current = { x: e.target.x(), y: e.target.y() };
        }}
        onDragEnd={(e) => {
          if (!dragStartRef.current) return;
          const x = snapToGrid(e.target.x());
          const y = snapToGrid(e.target.y());
          onUpdate({ x, y });
          dragStartRef.current = null;
        }}
        draggable={!layer.locked && !isTracing}
      />

      {/* Selection border + handles */}
      {isSelected && !layer.locked && (
        <Group>
          {/* Border */}
          <Rect
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            stroke={handleColor}
            strokeWidth={2}
            dash={[4, 4]}
            listening={false}
          />

          {/* Corner/edge resize handles */}
          {/* Top-left */}
          <Circle
            x={layer.x}
            y={layer.y}
            radius={HANDLE_SIZE / 2}
            fill={handleColor}
            stroke="white"
            strokeWidth={1}
            draggable
            onDragStart={(e) => {
              resizeStartRef.current = {
                startW: layer.width,
                startH: layer.height,
                startX: layer.x,
                startY: layer.y,
              };
            }}
            onDragEnd={(e) => {
              if (!resizeStartRef.current) return;
              const dx = e.target.x() - resizeStartRef.current.startX;
              const dy = e.target.y() - resizeStartRef.current.startY;
              const newW = Math.max(50, resizeStartRef.current.startW - dx);
              const newH = Math.max(50, resizeStartRef.current.startH - dy);
              onUpdate({
                x: layer.x + dx,
                y: layer.y + dy,
                width: newW,
                height: newH,
              });
              resizeStartRef.current = null;
            }}
          />

          {/* Bottom-right */}
          <Circle
            x={layer.x + layer.width}
            y={layer.y + layer.height}
            radius={HANDLE_SIZE / 2}
            fill={handleColor}
            stroke="white"
            strokeWidth={1}
            draggable
            onDragStart={() => {
              resizeStartRef.current = {
                startW: layer.width,
                startH: layer.height,
                startX: layer.x,
                startY: layer.y,
              };
            }}
            onDragEnd={(e) => {
              if (!resizeStartRef.current) return;
              const newW = Math.max(50, e.target.x() - resizeStartRef.current.startX);
              const newH = Math.max(50, e.target.y() - resizeStartRef.current.startY);
              onUpdate({ width: newW, height: newH });
              resizeStartRef.current = null;
            }}
          />
        </Group>
      )}

      {/* Lock indicator */}
      {layer.locked && (
        <Text
          x={layer.x + layer.width / 2 - 12}
          y={layer.y + layer.height / 2 - 8}
          text="🔒"
          fontSize={20}
          listening={false}
        />
      )}
    </Group>
  );
}

// ---- Room Name Input (inline overlay, replaces prompt()) ----
function RoomNameInput({
  onSubmit,
  onCancel,
  defaultName,
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and select text
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-600 rounded-xl shadow-2xl p-4 w-72">
        <h3 className="text-sm font-bold text-white mb-1">Nombrar recinto</h3>
        <p className="text-[10px] text-zinc-500 mb-3">El polígono se cerrará y calculará su superficie.</p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onCancel();
            e.stopPropagation(); // Don't trigger canvas shortcuts
          }}
          className="w-full bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg border border-zinc-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 mb-3"
          placeholder="Ej: Gimnasio, Sala Recuperación..."
        />
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 border border-zinc-700 transition-all"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2 text-xs font-bold text-white rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-all"
            onClick={handleSubmit}
          >
            Guardar recinto
          </button>
        </div>
      </div>
    </div>
  );
}
