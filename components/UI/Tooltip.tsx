// ==========================================
// Tooltip — Accesible, posición automática
// ==========================================

'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { tokens } from '@/lib/design/tokens';

interface TooltipProps {
  content: ReactNode;
  /** Atajo de teclado para mostrar junto al tooltip */
  shortcut?: string;
  /** Posición preferida (auto-ajusta si se sale del viewport) */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay en ms antes de mostrar */
  delay?: number;
  children: ReactNode;
}

export default function Tooltip({
  content,
  shortcut,
  side = 'top',
  delay = 400,
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            ...positionStyles[side],
            position: 'absolute',
            zIndex: 9999,
            padding: '5px 10px',
            borderRadius: tokens.radius.md,
            background: tokens.colors.bg.elevated,
            boxShadow: tokens.shadow.tooltip,
            fontSize: tokens.typography.size.xs,
            color: tokens.colors.text.primary,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontFamily: tokens.typography.fontFamily.sans,
          }}
        >
          <span>{content}</span>
          {shortcut && (
            <span
              style={{
                marginLeft: 8,
                padding: '1px 5px',
                borderRadius: tokens.radius.sm,
                background: 'rgba(255,255,255,0.1)',
                fontSize: tokens.typography.size.xs,
                fontFamily: tokens.typography.fontFamily.mono,
                color: tokens.colors.text.muted,
              }}
            >
              {shortcut}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
