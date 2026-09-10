// ==========================================
// Motor de guías de alineación (snap guides)
// Detecta alineación con bordes y centros de otras máquinas
// Similar a Figma — líneas punteadas verdes al alinear
// ==========================================

import { m2px } from '@/stores/useStore';
import type { MachineInstance } from '@/types';

// Umbral de proximidad para activar la guía (en píxeles canvas)
const SNAP_THRESHOLD = 8;

export interface SnapGuide {
  // Tipo de guía
  type: 'horizontal' | 'vertical';
  // Posición de la línea guía (coordenada fija)
  pos: number;
  // Rango visible de la línea (desde, hasta)
  from: number;
  to: number;
  // Si la máquina se alinea por centro, borde superior/izquierdo, o borde inferior/derecho
  align: 'center' | 'start' | 'end';
}

export interface SnapResult {
  // Posición corregida (snapped) de la máquina
  x: number;
  y: number;
  // Guías activas a dibujar
  guides: SnapGuide[];
}

// Calcula las guías de alineación para una máquina siendo arrastrada
export function calcSnapGuides(
  draggingId: string,
  dragX: number,
  dragY: number,
  dragW: number, // ancho en px (largo * PPM)
  dragH: number, // alto en px (ancho * PPM)
  allMachines: MachineInstance[],
  threshold: number = SNAP_THRESHOLD
): SnapResult {
  const guides: SnapGuide[] = [];
  let snappedX = dragX;
  let snappedY = dragY;

  // Bordes y centro de la máquina arrastrada
  // La máquina usa offset center, así que x,y es el centro
  const dragLeft = dragX - dragW / 2;
  const dragRight = dragX + dragW / 2;
  const dragTop = dragY - dragH / 2;
  const dragBottom = dragY + dragH / 2;
  const dragCenterX = dragX;
  const dragCenterY = dragY;

  let bestDx = Infinity;
  let bestDy = Infinity;
  let bestGuideX: SnapGuide | null = null;
  let bestGuideY: SnapGuide | null = null;

  // Puntos de referencia de la máquina arrastrada (X)
  const dragXPoints = [
    { val: dragLeft, align: 'start' as const },
    { val: dragCenterX, align: 'center' as const },
    { val: dragRight, align: 'end' as const },
  ];

  // Puntos de referencia de la máquina arrastrada (Y)
  const dragYPoints = [
    { val: dragTop, align: 'start' as const },
    { val: dragCenterY, align: 'center' as const },
    { val: dragBottom, align: 'end' as const },
  ];

  for (const other of allMachines) {
    if (other.id === draggingId || !other.placed) continue;

    const ow = m2px(other.largo);
    const oh = m2px(other.ancho);
    const otherLeft = other.x - ow / 2;
    const otherRight = other.x + ow / 2;
    const otherTop = other.y - oh / 2;
    const otherBottom = other.y + oh / 2;
    const otherCenterX = other.x;
    const otherCenterY = other.y;

    // Puntos de referencia de la otra máquina (X)
    const otherXPoints = [otherLeft, otherCenterX, otherRight];
    // Puntos de referencia de la otra máquina (Y)
    const otherYPoints = [otherTop, otherCenterY, otherBottom];

    // Comparar todos los puntos X
    for (const dp of dragXPoints) {
      for (const op of otherXPoints) {
        const dist = Math.abs(dp.val - op);
        if (dist < threshold && dist < Math.abs(bestDx)) {
          bestDx = op - dp.val;
          const minY = Math.min(dragTop, otherTop) - 20;
          const maxY = Math.max(dragBottom, otherBottom) + 20;
          bestGuideX = {
            type: 'vertical',
            pos: op,
            from: minY,
            to: maxY,
            align: dp.align,
          };
        }
      }
    }

    // Comparar todos los puntos Y
    for (const dp of dragYPoints) {
      for (const op of otherYPoints) {
        const dist = Math.abs(dp.val - op);
        if (dist < threshold && dist < Math.abs(bestDy)) {
          bestDy = op - dp.val;
          const minX = Math.min(dragLeft, otherLeft) - 20;
          const maxX = Math.max(dragRight, otherRight) + 20;
          bestGuideY = {
            type: 'horizontal',
            pos: op,
            from: minX,
            to: maxX,
            align: dp.align,
          };
        }
      }
    }
  }

  // Aplicar snap si encontramos guía cercana
  if (bestGuideX && Math.abs(bestDx) < threshold) {
    snappedX = dragX + bestDx;
    guides.push(bestGuideX);
  }
  if (bestGuideY && Math.abs(bestDy) < threshold) {
    snappedY = dragY + bestDy;
    guides.push(bestGuideY);
  }

  return { x: snappedX, y: snappedY, guides };
}

// Detecta colisión AABB entre dos máquinas (sin rotación simplificada)
export function detectCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  const ax1 = ax - aw / 2, ax2 = ax + aw / 2;
  const ay1 = ay - ah / 2, ay2 = ay + ah / 2;
  const bx1 = bx - bw / 2, bx2 = bx + bw / 2;
  const by1 = by - bh / 2, by2 = by + bh / 2;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

// Detecta si una máquina colisiona con alguna otra
export function findCollisions(
  draggingId: string,
  dragX: number, dragY: number,
  dragW: number, dragH: number,
  allMachines: MachineInstance[]
): string[] {
  const collisions: string[] = [];
  for (const other of allMachines) {
    if (other.id === draggingId || !other.placed) continue;
    const ow = m2px(other.largo);
    const oh = m2px(other.ancho);
    if (detectCollision(dragX, dragY, dragW, dragH, other.x, other.y, ow, oh)) {
      collisions.push(other.id);
    }
  }
  return collisions;
}

// Detecta si la máquina está fuera del perímetro del canvas
export function isOutOfBounds(
  x: number, y: number, w: number, h: number,
  canvasW: number, canvasH: number
): boolean {
  return (
    x - w / 2 < 0 ||
    y - h / 2 < 0 ||
    x + w / 2 > canvasW ||
    y + h / 2 > canvasH
  );
}
