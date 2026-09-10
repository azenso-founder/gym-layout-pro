// ==========================================
// Skip Link — Fase 8: Accesibilidad
// Enlace oculto "Saltar al canvas" visible al hacer Tab
// ==========================================

'use client';

interface Props {
  targetId: string;
  label?: string;
}

export default function SkipLink({ targetId, label = 'Saltar al canvas' }: Props) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:bg-orange-600 focus:text-white focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
    >
      {label}
    </a>
  );
}
