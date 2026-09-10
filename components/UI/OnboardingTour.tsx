// ==========================================
// Tour de onboarding — Fase 9
// Spotlight guiado step-by-step para nuevos usuarios
// Se persiste en localStorage que fue completado
// ==========================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { tokens } from '@/lib/design/tokens';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

const TOUR_KEY = 'gymlayout-tour-completed';

interface TourStep {
  /** Selector CSS del elemento a destacar */
  target: string;
  /** Título del paso */
  title: string;
  /** Descripción */
  description: string;
  /** Posición del tooltip relativo al elemento */
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: '📦 Inventario de máquinas',
    description: 'Aquí están todas tus máquinas. Haz clic en una para añadirla al plano. Usa la búsqueda para encontrar rápidamente.',
    position: 'right',
  },
  {
    target: '[data-tour="toolbar"]',
    title: '🛠️ Barra de herramientas',
    description: 'Selecciona herramientas: seleccionar (V), mover canvas (H), medir (M), dibujar zonas (Z), trazar recintos (T). Controla el grid y zoom.',
    position: 'bottom',
  },
  {
    target: '[data-tour="canvas"]',
    title: '📐 Canvas del plano',
    description: 'Este es tu plano. Arrastra máquinas para posicionarlas. Usa la rueda del ratón para zoom, y arrastra el fondo para mover el canvas.',
    position: 'left',
  },
  {
    target: '[data-tour="properties"]',
    title: '⚙️ Panel de propiedades',
    description: 'Selecciona una máquina para ver y editar sus propiedades: posición, rotación, colores, halos Guerchet y más.',
    position: 'left',
  },
  {
    target: '[data-tour="planta-selector"]',
    title: '🏗️ Selector de planta',
    description: 'Alterna entre Planta Baja y Planta Alta. Cada planta tiene su propio inventario y configuración.',
    position: 'bottom',
  },
  {
    target: '[data-tour="status-bar"]',
    title: '📊 Barra de estado',
    description: 'Coordenadas del cursor, zoom, herramienta activa y estado de guardado. Todo en tiempo real.',
    position: 'top',
  },
];

interface Props {
  /** Forzar el tour (desde menú Ayuda > Repetir tour) */
  forceShow?: boolean;
  onComplete?: () => void;
}

export default function OnboardingTour({ forceShow = false, onComplete }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Comprobar si el tour ya fue completado
  useEffect(() => {
    if (forceShow) {
      setIsActive(true);
      setCurrentStep(0);
      return;
    }
    try {
      const completed = localStorage.getItem(TOUR_KEY);
      if (!completed) {
        // Delay para que la UI se renderice
        const timer = setTimeout(() => setIsActive(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage no disponible
    }
  }, [forceShow]);

  // Actualizar posición del spotlight cuando cambia el paso
  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) {
        setSpotlightRect(el.getBoundingClientRect());
      } else {
        setSpotlightRect(null);
      }
    };

    updateRect();
    // Re-calcular en resize
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [isActive, currentStep]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    try {
      localStorage.setItem(TOUR_KEY, 'true');
    } catch { /* ignorar */ }
    onComplete?.();
  }, [onComplete]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Atajos de teclado
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') completeTour();
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, nextStep, prevStep, completeTour]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;
  const padding = 8; // px alrededor del elemento

  // Calcular posición del tooltip
  const tooltipStyle: React.CSSProperties = {};
  if (spotlightRect) {
    switch (step.position) {
      case 'right':
        tooltipStyle.left = spotlightRect.right + padding + 12;
        tooltipStyle.top = spotlightRect.top + spotlightRect.height / 2;
        tooltipStyle.transform = 'translateY(-50%)';
        break;
      case 'left':
        tooltipStyle.right = window.innerWidth - spotlightRect.left + padding + 12;
        tooltipStyle.top = spotlightRect.top + spotlightRect.height / 2;
        tooltipStyle.transform = 'translateY(-50%)';
        break;
      case 'bottom':
        tooltipStyle.left = spotlightRect.left + spotlightRect.width / 2;
        tooltipStyle.top = spotlightRect.bottom + padding + 12;
        tooltipStyle.transform = 'translateX(-50%)';
        break;
      case 'top':
        tooltipStyle.left = spotlightRect.left + spotlightRect.width / 2;
        tooltipStyle.bottom = window.innerHeight - spotlightRect.top + padding + 12;
        tooltipStyle.transform = 'translateX(-50%)';
        break;
    }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[500]" onClick={(e) => e.stopPropagation()}>
      {/* Overlay oscuro con agujero recortado */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - padding}
                y={spotlightRect.top - padding}
                width={spotlightRect.width + padding * 2}
                height={spotlightRect.height + padding * 2}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'all' }}
        />
      </svg>

      {/* Borde brillante del elemento destacado */}
      {spotlightRect && (
        <div
          className="absolute border-2 border-orange-500 rounded-lg pointer-events-none"
          style={{
            left: spotlightRect.left - padding,
            top: spotlightRect.top - padding,
            width: spotlightRect.width + padding * 2,
            height: spotlightRect.height + padding * 2,
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)',
          }}
        />
      )}

      {/* Tooltip del paso */}
      <div
        className="absolute w-[320px] rounded-xl border shadow-2xl"
        style={{
          ...tooltipStyle,
          background: tokens.colors.bg.surface,
          borderColor: tokens.colors.border.default,
          boxShadow: tokens.shadow.modal,
        }}
        role="dialog"
        aria-label={`Paso ${currentStep + 1} de ${TOUR_STEPS.length}: ${step.title}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tokens.colors.accent.primary }}>
            Paso {currentStep + 1} de {TOUR_STEPS.length}
          </span>
          <button
            onClick={completeTour}
            className="p-1 rounded-md transition-colors"
            style={{ color: tokens.colors.text.muted }}
            aria-label="Cerrar tour"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-4 pb-3">
          <h3 className="text-sm font-semibold mb-1" style={{ color: tokens.colors.text.primary }}>
            {step.title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: tokens.colors.text.muted }}>
            {step.description}
          </p>
        </div>

        {/* Indicador de progreso */}
        <div className="flex gap-1 px-4 pb-2">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: i <= currentStep
                  ? tokens.colors.accent.primary
                  : tokens.colors.bg.elevated,
              }}
            />
          ))}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
          <button
            onClick={completeTour}
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors"
            style={{ color: tokens.colors.text.muted }}
          >
            <SkipForward size={12} /> Saltar tour
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"
                style={{
                  color: tokens.colors.text.secondary,
                  borderColor: tokens.colors.border.default,
                }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
            )}
            <button
              onClick={nextStep}
              className="flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-md transition-colors"
              style={{
                background: tokens.colors.accent.primary,
                color: '#fff',
              }}
            >
              {isLast ? '¡Empezar!' : 'Siguiente'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Función para resetear el tour (para el menú Ayuda)
export function resetTour() {
  try {
    localStorage.removeItem(TOUR_KEY);
  } catch { /* ignorar */ }
}
