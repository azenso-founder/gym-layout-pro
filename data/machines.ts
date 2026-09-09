// ==========================================
// Datos pre-cargados del Excel de Guerchet
// Firefit Valdivia — Máquinas por planta
// ==========================================

import type { MachineTemplate, MachineCategory } from '@/types';
import { v4 as uuid } from 'uuid';

/** Inferir categoría por nombre de máquina */
function inferCategoria(nombre: string): MachineCategory {
  const n = nombre.toLowerCase();
  if (/trotadora|escaladora|bicicleta|cardio|elíptic/.test(n)) return 'cardio';
  if (/hack|squat|prensa|pierna|cuádricep|gemelo|leg|adduc|hip thrust|belt squat|bulgara|pendulum/.test(n)) return 'piernas';
  if (/press banca|banca|preacher|curl|pecho|hombro|chest|shoulder|incline bench|flat bench/.test(n)) return 'tren_superior';
  if (/rack|smith|power/.test(n)) return 'racks';
  if (/polea|cable|pulldown|row|remo|lat|seated row|high row|multi.*estac/.test(n)) return 'poleas';
  if (/back extension|dips|abdomen|accesori|funcional|triceps extension/.test(n)) return 'accesorios';
  if (/dumbb|mancuerna/.test(n)) return 'racks';
  return 'accesorios';
}

/** Calcular tiempos de servicio por categoría */
function tiemposPorCategoria(nombre: string): { min: number; moda: number; max: number } {
  const n = nombre.toLowerCase();
  if (/trotadora|bicicleta|escaladora|elíptic/.test(n)) return { min: 15, moda: 25, max: 45 };
  if (/hack|prensa|smith|pendulum|super squat/.test(n)) return { min: 8, moda: 12, max: 18 };
  if (/extensión.*cuádricep|leg curl|gemelo|adduc/.test(n)) return { min: 4, moda: 6, max: 10 };
  if (/press banca|flat bench|incline bench/.test(n)) return { min: 6, moda: 10, max: 15 };
  if (/polea|pulldown|row|remo|lat|high row|seated row|multi.*estac|seated.*press|chest.*press|shoulder/.test(n)) return { min: 4, moda: 7, max: 10 };
  if (/back extension|dips|abdomen|bulgara|preacher|curl|triceps/.test(n)) return { min: 3, moda: 5, max: 8 };
  if (/hip thrust|belt squat|banca ajustable/.test(n)) return { min: 6, moda: 10, max: 15 };
  return { min: 4, moda: 7, max: 10 };
}

/** Calcular Guerchet */
function calcGuerchet(largo: number, ancho: number, N: number, K: number) {
  const Ss = largo * ancho;
  const Sg = Ss * N;
  const Se = K * (Ss + Sg);
  const St = Ss + Sg + Se;
  return { Ss, Sg, Se, St };
}

interface RawMachine {
  nombre: string;
  n: number;
  N: number;
  largo: number;
  ancho: number;
  alto: number;
  K: number;
  planta: 'baja' | 'alta';
}

// Datos del Excel corregido — Planta Baja (Superficie necesaria Firefit Valdivia-2.xlsx)
const plantaBajaRaw: RawMachine[] = [
  { nombre: 'Hack Squat', n: 2, N: 1, largo: 2.232, ancho: 1.62, alto: 1.5, K: 0.15, planta: 'baja' },
  { nombre: 'Pendulum Squat', n: 2, N: 1, largo: 2.26, ancho: 1.341, alto: 1.5, K: 0.15, planta: 'baja' },
  { nombre: 'Extensión de cuádriceps + Leg curl dual', n: 1, N: 1, largo: 1.38, ancho: 1.065, alto: 1.3, K: 0.12, planta: 'baja' },
  { nombre: 'Extensión de gemelos parado', n: 1, N: 2, largo: 1.31, ancho: 1.26, alto: 1.5, K: 0.12, planta: 'baja' },
  { nombre: 'Extensión de gemelos sentado', n: 1, N: 1, largo: 1.485, ancho: 0.705, alto: 1.2, K: 0.12, planta: 'baja' },
  { nombre: 'Back Extension', n: 1, N: 1, largo: 1.465, ancho: 0.475, alto: 1.0, K: 0.15, planta: 'baja' },
  { nombre: 'Banca Ajustable + Abdomen', n: 3, N: 1, largo: 1.62, ancho: 0.76, alto: 1.0, K: 0.10, planta: 'baja' },
  { nombre: 'Poleas', n: 4, N: 1, largo: 1.993, ancho: 1.03, alto: 2.2, K: 0.15, planta: 'baja' },
  { nombre: 'Smith Machine', n: 2, N: 2, largo: 2.11, ancho: 2.19, alto: 2.2, K: 0.15, planta: 'baja' },
  { nombre: 'Smith Power Rack', n: 2, N: 3, largo: 1.96, ancho: 1.535, alto: 2.2, K: 0.12, planta: 'baja' },
  { nombre: 'Rack', n: 2, N: 3, largo: 1.54, ancho: 1.72, alto: 2.0, K: 0.12, planta: 'baja' },
  { nombre: 'Prensa 45°', n: 2, N: 2, largo: 2.15, ancho: 1.62, alto: 1.5, K: 0.12, planta: 'baja' },
  { nombre: 'Aducción + Abducción', n: 1, N: 1, largo: 1.47, ancho: 1.4, alto: 1.5, K: 0.10, planta: 'baja' },
  { nombre: 'Super Squat Machine', n: 1, N: 2, largo: 1.96, ancho: 1.62, alto: 1.5, K: 0.10, planta: 'baja' },
  { nombre: 'Belt Squat', n: 1, N: 2, largo: 2.032, ancho: 1.412, alto: 1.5, K: 0.10, planta: 'baja' },
  { nombre: 'Bulgara', n: 1, N: 1, largo: 0.69, ancho: 0.69, alto: 1.0, K: 0.05, planta: 'baja' },
  { nombre: 'Hip Thrust Machine', n: 2, N: 1, largo: 1.955, ancho: 1.85, alto: 1.0, K: 0.10, planta: 'baja' },
  { nombre: 'Trotadora', n: 3, N: 1, largo: 2.1, ancho: 1.0, alto: 1.5, K: 0.08, planta: 'baja' },
  { nombre: 'Escaladora', n: 3, N: 1, largo: 1.35, ancho: 0.85, alto: 2.0, K: 0.08, planta: 'baja' },
  { nombre: 'Bicicleta', n: 3, N: 1, largo: 1.41, ancho: 0.56, alto: 1.2, K: 0.08, planta: 'baja' },
  { nombre: 'Leg Curl Acostado', n: 1, N: 1, largo: 1.94, ancho: 1.17, alto: 1.3, K: 0.08, planta: 'baja' },
  { nombre: 'Extensión de Cuádriceps con disco', n: 2, N: 1, largo: 1.48, ancho: 1.22, alto: 1.2, K: 0.08, planta: 'baja' },
  { nombre: 'Leg Curl Sentado', n: 1, N: 1, largo: 1.94, ancho: 1.17, alto: 1.3, K: 0.08, planta: 'baja' },
];

// Datos del Excel corregido — Planta Alta (Superficie necesaria Firefit Valdivia-2.xlsx)
const plantaAltaRaw: RawMachine[] = [
  { nombre: 'Dumbbell Rack', n: 8, N: 1, largo: 2.12, ancho: 0.595, alto: 1.2, K: 0.15, planta: 'alta' },
  { nombre: 'Press Banca Inclinado', n: 1, N: 2, largo: 1.91, ancho: 1.695, alto: 1.2, K: 0.10, planta: 'alta' },
  { nombre: 'Press Banca Plano', n: 1, N: 2, largo: 1.926, ancho: 1.65, alto: 1.0, K: 0.10, planta: 'alta' },
  { nombre: 'Banca', n: 7, N: 1, largo: 1.29, ancho: 0.68, alto: 0.5, K: 0.10, planta: 'alta' },
  { nombre: 'Preacher Curl', n: 1, N: 1, largo: 1.3, ancho: 0.84, alto: 1.0, K: 0.10, planta: 'alta' },
  { nombre: 'Smith Machine', n: 1, N: 3, largo: 2.11, ancho: 2.19, alto: 2.2, K: 0.10, planta: 'alta' },
  { nombre: 'Dips y Abdomen Vertical', n: 1, N: 1, largo: 1.195, ancho: 0.77, alto: 1.8, K: 0.05, planta: 'alta' },
  { nombre: 'Remo en T', n: 2, N: 1, largo: 1.785, ancho: 0.85, alto: 1.2, K: 0.05, planta: 'alta' },
  { nombre: 'Multi Estación (8 estaciones)', n: 1, N: 4, largo: 5.78, ancho: 3.42, alto: 2.2, K: 0.10, planta: 'alta' },
  { nombre: 'Multi Estación (4 estaciones)', n: 1, N: 3, largo: 3.75, ancho: 1.635, alto: 2.2, K: 0.10, planta: 'alta' },
  { nombre: 'Seated Row', n: 1, N: 1, largo: 1.5, ancho: 1.42, alto: 1.5, K: 0.10, planta: 'alta' },
  { nombre: 'Iso Lateral High Row', n: 1, N: 2, largo: 2.11, ancho: 1.12, alto: 1.8, K: 0.10, planta: 'alta' },
  { nombre: 'Lat Pulldown con disco', n: 1, N: 1, largo: 2.09, ancho: 0.82, alto: 2.0, K: 0.10, planta: 'alta' },
  { nombre: 'Preacher Curl Disco', n: 1, N: 1, largo: 1.2, ancho: 1.22, alto: 1.0, K: 0.10, planta: 'alta' },
  { nombre: 'Tríceps Extension con Disco', n: 1, N: 2, largo: 1.17, ancho: 1.17, alto: 1.5, K: 0.10, planta: 'alta' },
  { nombre: 'Flat Bench Press con Discos', n: 1, N: 2, largo: 1.5, ancho: 2.25, alto: 1.2, K: 0.10, planta: 'alta' },
  { nombre: 'Incline Bench Press con Discos', n: 1, N: 2, largo: 2.35, ancho: 1.5, alto: 1.2, K: 0.10, planta: 'alta' },
  { nombre: 'Seated Chest Press', n: 1, N: 1, largo: 2.0, ancho: 1.5, alto: 1.8, K: 0.10, planta: 'alta' },
  { nombre: 'Seated Shoulder Press', n: 1, N: 1, largo: 2.25, ancho: 1.65, alto: 1.5, K: 0.10, planta: 'alta' },
];

/** Generar plantillas de máquinas a partir de los datos crudos */
function generateTemplates(rawList: RawMachine[]): MachineTemplate[] {
  const templates: MachineTemplate[] = [];
  for (const raw of rawList) {
    const { Ss, Sg, Se, St } = calcGuerchet(raw.largo, raw.ancho, raw.N, raw.K);
    // Crear n instancias como plantillas individuales
    for (let i = 0; i < raw.n; i++) {
      templates.push({
        id: uuid(),
        nombre: raw.n > 1 ? `${raw.nombre} #${i + 1}` : raw.nombre,
        categoria: inferCategoria(raw.nombre),
        largo: raw.largo,
        ancho: raw.ancho,
        alto: raw.alto,
        N: raw.N,
        K: raw.K,
        Ss: Math.round(Ss * 1000) / 1000,
        Sg: Math.round(Sg * 1000) / 1000,
        Se: Math.round(Se * 1000) / 1000,
        St: Math.round(St * 1000) / 1000,
        planta: raw.planta,
        tiempoServicio: tiemposPorCategoria(raw.nombre),
      });
    }
  }
  return templates;
}

export const DEFAULT_MACHINES_BAJA = generateTemplates(plantaBajaRaw);
export const DEFAULT_MACHINES_ALTA = generateTemplates(plantaAltaRaw);
export const ALL_DEFAULT_MACHINES = [...DEFAULT_MACHINES_BAJA, ...DEFAULT_MACHINES_ALTA];

/** Datos de superficie por planta */
export const PLANTA_INFO = {
  baja: {
    superficie: 265,
    label: 'Planta Baja',
    labelShort: '1er Nivel',
    bgImage: '/plans/planta-baja.png',
    // Dimensiones reales del edificio en metros (del plano: 1920cm ancho)
    buildingWidth: 19.2,
    // Canvas muestra el edificio completo + márgenes
    canvasWidth: 22,
    canvasHeight: 32,
    // Imagen cubre este rango en el canvas (metros)
    imgWidth: 21.2,
    imgHeight: 30,
  },
  alta: {
    superficie: 285,
    label: 'Planta Alta',
    labelShort: '2do Nivel',
    bgImage: '/plans/planta-alta.png',
    buildingWidth: 19.2,
    canvasWidth: 22,
    canvasHeight: 32,
    imgWidth: 21.2,
    imgHeight: 30,
  },
} as const;
