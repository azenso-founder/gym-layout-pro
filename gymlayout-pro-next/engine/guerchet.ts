// ==========================================
// Motor de cálculo Guerchet
// ==========================================

/**
 * Calcular superficies Guerchet para una máquina
 * Ss = Largo × Ancho (superficie estática)
 * Sg = Ss × N (superficie gravitacional)
 * Se = K × (Ss + Sg) (superficie de evolución)
 * St = Ss + Sg + Se (superficie total unitaria)
 */
export function calcularGuerchet(
  largo: number,
  ancho: number,
  N: number,
  K: number
): { Ss: number; Sg: number; Se: number; St: number } {
  const Ss = largo * ancho;
  const Sg = Ss * N;
  const Se = K * (Ss + Sg);
  const St = Ss + Sg + Se;
  return {
    Ss: Math.round(Ss * 1000) / 1000,
    Sg: Math.round(Sg * 1000) / 1000,
    Se: Math.round(Se * 1000) / 1000,
    St: Math.round(St * 1000) / 1000,
  };
}

/**
 * Radio del halo Guerchet alrededor de la máquina
 * Se calcula como una aproximación del espacio extra necesario
 * N=0 → sin halo (máquina contra pared, sin lados operativos)
 */
export function calcularHaloRadius(
  largo: number,
  ancho: number,
  N: number,
  K: number
): number {
  if (N === 0) return 0; // No operative sides → no halo
  const Ss = largo * ancho;
  const Sg = Ss * N;
  const Se = K * (Ss + Sg);
  // Área extra = Sg (espacio del operador) + Se (circulación)
  // Se distribuye uniformemente alrededor del perímetro como ancho visual
  const perimetro = 2 * (largo + ancho);
  const areaExtra = Sg + Se;
  const haloWidth = areaExtra / perimetro;
  // Mínimo 0.20m para visibilidad, máximo 1.5m para no saturar
  return Math.max(0.20, Math.min(1.5, haloWidth));
}

/**
 * Determina qué lados son operativos según N
 * N=0: ninguno (pared)
 * N=1: frente (abajo)
 * N=2: frente + atrás (abajo + arriba)
 * N=3: frente + izquierda + derecha (abajo + lados)
 * N=4: todos los lados
 */
export function getOperativeSides(N: number): {
  top: boolean; bottom: boolean; left: boolean; right: boolean;
} {
  return {
    bottom: N >= 1,
    top: N === 2 || N >= 4,
    left: N >= 3,
    right: N >= 3,
  };
}
