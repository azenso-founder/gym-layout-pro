// ==========================================
// Planes de suscripción — Free vs Pro
// ==========================================

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxProjects: 3,
    maxFloorsPerProject: 3,
    maxConfigsPerFloor: 3,
    features: {
      layoutEditor: true,
      guerchetCalculation: true,
      slpAnalysis: true,
      simulation: true,
      exportPNG: true,
      exportPDF: false,
      exportSIMIO: false,
      collaboration: false,
      sideBySideComparison: false,
      customMachineLibrary: 10,
      snapshotHistory: 5,
      realtimePresence: false,
    },
  },
  pro: {
    name: 'Pro',
    priceMonthly: 14990, // CLP (≈ $15 USD)
    priceYearly: 119900, // CLP (≈ $120 USD, 2 meses gratis)
    maxProjects: Infinity,
    maxFloorsPerProject: 20,
    maxConfigsPerFloor: 20,
    features: {
      layoutEditor: true,
      guerchetCalculation: true,
      slpAnalysis: true,
      simulation: true,
      exportPNG: true,
      exportPDF: true,
      exportSIMIO: true,
      collaboration: true,
      sideBySideComparison: true,
      customMachineLibrary: Infinity,
      snapshotHistory: Infinity,
      realtimePresence: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;
export type FeatureName = keyof typeof PLANS.free.features;

/** Verificar si un feature está disponible para un plan */
export function canUseFeature(
  plan: string,
  feature: FeatureName
): boolean | number {
  const planConfig = PLANS[plan as PlanName] ?? PLANS.free;
  return planConfig.features[feature];
}

/** Obtener el límite de un recurso para un plan */
export function getPlanLimit(
  plan: string,
  limit: 'maxProjects' | 'maxFloorsPerProject' | 'maxConfigsPerFloor'
): number {
  const planConfig = PLANS[plan as PlanName] ?? PLANS.free;
  return planConfig[limit];
}
