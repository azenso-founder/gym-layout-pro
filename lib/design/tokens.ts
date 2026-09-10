// ==========================================
// GymLayout Pro — Tokens de diseño centralizados
// ==========================================

export const tokens = {
  // ── Colores base (dark mode first) ──
  colors: {
    bg: {
      canvas: '#0f1117',
      panel: '#1a1d27',
      surface: '#232733',
      elevated: '#2d3241',
      hover: '#353a4d',
      active: '#3d4359',
    },
    machine: {
      cardio: { fill: '#3B82F6', stroke: '#2563EB', halo: 'rgba(59,130,246,0.12)', label: 'Cardio' },
      rack: { fill: '#EF4444', stroke: '#DC2626', halo: 'rgba(239,68,68,0.12)', label: 'Racks / Peso Libre' },
      bench: { fill: '#F97316', stroke: '#EA580C', halo: 'rgba(249,115,22,0.12)', label: 'Bancas' },
      plate: { fill: '#22C55E', stroke: '#16A34A', halo: 'rgba(34,197,94,0.12)', label: 'Máquinas c/Placa' },
      cable: { fill: '#A855F7', stroke: '#9333EA', halo: 'rgba(168,85,247,0.12)', label: 'Poleas / Cables' },
      accessory: { fill: '#6B7280', stroke: '#4B5563', halo: 'rgba(107,114,128,0.12)', label: 'Accesorios' },
      functional: { fill: '#EAB308', stroke: '#CA8A04', halo: 'rgba(234,179,8,0.12)', label: 'Funcional' },
      custom: { fill: '#EC4899', stroke: '#DB2777', halo: 'rgba(236,72,153,0.12)', label: 'Personalizado' },
    },
    zone: {
      legs: 'rgba(239,68,68,0.08)',
      cardio: 'rgba(59,130,246,0.08)',
      freeWeight: 'rgba(249,115,22,0.08)',
      functional: 'rgba(234,179,8,0.08)',
      circulation: 'rgba(148,163,184,0.05)',
      reception: 'rgba(168,85,247,0.08)',
      stretching: 'rgba(34,197,94,0.08)',
      locker: 'rgba(107,114,128,0.08)',
    },
    sim: {
      walking: '#60A5FA',
      exercising: '#34D399',
      waiting: '#F87171',
      resting: '#FBBF24',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      muted: '#64748B',
      inverse: '#0f1117',
    },
    border: {
      subtle: '#2d3241',
      default: '#3d4359',
      focus: '#3B82F6',
      error: '#EF4444',
      success: '#22C55E',
    },
    accent: {
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#22C55E',
    },
  },

  // ── Tipografía ──
  typography: {
    fontFamily: {
      sans: "'Inter', 'system-ui', '-apple-system', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    size: {
      xs: '0.6875rem',     // 11px
      sm: '0.75rem',       // 12px
      base: '0.8125rem',   // 13px
      md: '0.875rem',      // 14px
      lg: '1rem',          // 16px
      xl: '1.25rem',       // 20px
      '2xl': '1.5rem',     // 24px
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // ── Espaciado ──
  spacing: {
    toolbar: '52px',       // Altura de toolbar superior (aumentada de 44px)
    sidebar: '280px',
    panel: '320px',
    statusbar: '28px',
    iconSm: '20px',
    iconMd: '28px',        // Mínimo funcional para íconos de toolbar
    iconLg: '36px',
    iconXl: '48px',
    touchTarget: '44px',   // Mínimo WCAG para touch targets
    gap: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
  },

  // ── Bordes y sombras ──
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  shadow: {
    panel: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)',
    dropdown: '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
    tooltip: '0 2px 8px rgba(0,0,0,0.6)',
    modal: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  },

  // ── Animaciones ──
  transition: {
    fast: '100ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-in-out',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ── Breakpoints ──
  breakpoints: {
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
} as const;

// Tipos derivados para uso en componentes
export type TokenColors = typeof tokens.colors;
export type MachineColorKey = keyof typeof tokens.colors.machine;
