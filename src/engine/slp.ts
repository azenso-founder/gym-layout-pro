// ==========================================
// Motor de cálculo SLP (Systematic Layout Planning)
// Relaciones optimizadas para layout de gimnasio
// ==========================================

import { SLP_CONFIG } from '../types';
import type { SLPRelation } from '../types';

/** Generar clave única para par de máquinas */
export function slpKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('::');
}

/** Calcular score de layout (0-100) basado en relaciones SLP */
export function calcularScoreLayout(
  relations: Record<string, SLPRelation>,
  positions: Map<string, { x: number; y: number }>
): number {
  if (Object.keys(relations).length === 0) return 0;

  let totalScore = 0;
  let maxScore = 0;

  for (const [key, relation] of Object.entries(relations)) {
    if (relation === 'U') continue;
    const [id1, id2] = key.split('::');
    const p1 = positions.get(id1);
    const p2 = positions.get(id2);
    if (!p1 || !p2) continue;

    const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const weight = SLP_CONFIG[relation].weight;
    const maxDist = 1000;

    if (weight > 0) {
      const normalizedDist = Math.min(distance / maxDist, 1);
      totalScore += weight * (1 - normalizedDist);
      maxScore += weight;
    } else {
      const normalizedDist = Math.min(distance / maxDist, 1);
      totalScore += Math.abs(weight) * normalizedDist;
      maxScore += Math.abs(weight);
    }
  }

  if (maxScore === 0) return 50;
  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Generar relaciones SLP por defecto — reglas específicas para un gym.
 * Se basa en categorías y nombres de las máquinas para crear
 * relaciones coherentes que resulten en un buen score.
 */
export function generarRelacionesDefault(
  machineIds: { id: string; categoria: string; nombre: string }[]
): Record<string, SLPRelation> {
  const relations: Record<string, SLPRelation> = {};

  for (let i = 0; i < machineIds.length; i++) {
    for (let j = i + 1; j < machineIds.length; j++) {
      const m1 = machineIds[i];
      const m2 = machineIds[j];
      const key = slpKey(m1.id, m2.id);
      const n1 = m1.nombre.toLowerCase();
      const n2 = m2.nombre.toLowerCase();
      const cats = new Set([m1.categoria, m2.categoria]);
      const nombres = [n1, n2];

      // ------ Reglas específicas por nombre (alta prioridad) ------

      // Mancuernas/Dumbbells + Bancas = Absolutamente necesario
      if (
        nombres.some((n) => n.includes('dumbbell') || n.includes('mancuerna')) &&
        nombres.some((n) => n.includes('banca') || n.includes('bench') || n.includes('press banca'))
      ) {
        relations[key] = 'A';
        continue;
      }

      // Rack/Discos + Smith/Press = Especialmente importante
      if (
        nombres.some((n) => n.includes('rack') || n.includes('disco')) &&
        nombres.some((n) => n.includes('smith') || n.includes('press'))
      ) {
        relations[key] = 'E';
        continue;
      }

      // Hack Squat + Pendulum Squat (máquinas de piernas similares)
      if (
        nombres.some((n) => n.includes('hack')) &&
        nombres.some((n) => n.includes('pendulum'))
      ) {
        relations[key] = 'A';
        continue;
      }

      // Extensión cuádriceps + Leg curl (agonista/antagonista)
      if (
        nombres.some((n) => n.includes('cuádricep') || n.includes('leg curl') || n.includes('extensión de cuádriceps'))
      ) {
        if (
          nombres.some((n) => n.includes('leg curl')) &&
          nombres.some((n) => n.includes('cuádricep') || n.includes('extensión'))
        ) {
          relations[key] = 'A';
          continue;
        }
      }

      // Hip Thrust + Banca ajustable (misma zona de glúteos/core)
      if (
        nombres.some((n) => n.includes('hip thrust')) &&
        nombres.some((n) => n.includes('banca ajustable') || n.includes('bulgara'))
      ) {
        relations[key] = 'E';
        continue;
      }

      // Poleas + cualquier tren superior = Importante
      if (
        nombres.some((n) => n.includes('polea') || n.includes('cable')) &&
        nombres.some((n) => n.includes('press') || n.includes('row') || n.includes('pulldown') || n.includes('lat'))
      ) {
        relations[key] = 'I';
        continue;
      }

      // Back extension + Dips/Abdomen (accesorios de core)
      if (
        nombres.some((n) => n.includes('back extension')) &&
        nombres.some((n) => n.includes('dips') || n.includes('abdomen'))
      ) {
        relations[key] = 'E';
        continue;
      }

      // Seated Chest Press + Seated Shoulder Press (máquinas sentadas del mismo tipo)
      if (
        nombres.some((n) => n.includes('chest press')) &&
        nombres.some((n) => n.includes('shoulder press'))
      ) {
        relations[key] = 'A';
        continue;
      }

      // Multi-estaciones entre sí = Importante
      if (
        nombres.every((n) => n.includes('multi estac') || n.includes('multi-estac'))
      ) {
        relations[key] = 'I';
        continue;
      }

      // ------ Reglas por categoría (media prioridad) ------

      // Misma categoría = Importante (agrupar por zona)
      if (m1.categoria === m2.categoria) {
        relations[key] = 'I';
        continue;
      }

      // Piernas + Racks = Especialmente importante (se comparten discos, barras)
      if (cats.has('piernas') && cats.has('racks')) {
        relations[key] = 'E';
        continue;
      }

      // Poleas + Tren superior = Importante (rutinas complementarias)
      if (cats.has('poleas') && cats.has('tren_superior')) {
        relations[key] = 'I';
        continue;
      }

      // Accesorios + Racks = Ordinario (se usan juntos a veces)
      if (cats.has('accesorios') && cats.has('racks')) {
        relations[key] = 'O';
        continue;
      }

      // Accesorios + Tren superior = Ordinario
      if (cats.has('accesorios') && cats.has('tren_superior')) {
        relations[key] = 'O';
        continue;
      }

      // Funcional + Accesorios = Ordinario
      if (cats.has('funcional') && cats.has('accesorios')) {
        relations[key] = 'O';
        continue;
      }

      // ------ Separaciones (No deseable) ------

      // Cardio lejos de zona de pesos pesados (vibración, ruido)
      if (cats.has('cardio') && (cats.has('racks') || cats.has('piernas'))) {
        relations[key] = 'X';
        continue;
      }

      // Cardio lejos de poleas (diferentes zonas de energía)
      if (cats.has('cardio') && cats.has('poleas')) {
        relations[key] = 'X';
        continue;
      }

      // ------ Default ------
      relations[key] = 'U';
    }
  }

  return relations;
}
