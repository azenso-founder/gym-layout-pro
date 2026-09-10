// ==========================================
// IconButton — Botón de solo ícono con touch target WCAG
// Mínimo 28×28px ícono, 44×44px touch target
// ==========================================

'use client';

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import Tooltip from './Tooltip';
import { tokens } from '@/lib/design/tokens';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ícono a renderizar (componente Lucide o ReactNode) */
  icon: ReactNode;
  /** Label accesible (obligatorio para screen readers) */
  label: string;
  /** Texto del tooltip (default: label) */
  tooltip?: string;
  /** Atajo de teclado para mostrar en tooltip */
  shortcut?: string;
  /** Si el botón está activo (herramienta seleccionada) */
  active?: boolean;
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Variante visual */
  variant?: 'default' | 'danger' | 'ghost';
}

const sizeMap = {
  sm: { button: 36, icon: 20 },
  md: { button: 44, icon: 28 },
  lg: { button: 48, icon: 32 },
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      tooltip,
      shortcut,
      active = false,
      size = 'md',
      variant = 'default',
      className = '',
      disabled,
      style,
      ...rest
    },
    ref
  ) => {
    const s = sizeMap[size];

    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: s.button,
      height: s.button,
      minWidth: s.button,
      minHeight: s.button,
      borderRadius: tokens.radius.md,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: `all ${tokens.transition.fast}`,
      position: 'relative',
      background: active
        ? `${tokens.colors.accent.primary}20`
        : 'transparent',
      color: active
        ? tokens.colors.accent.primary
        : disabled
        ? tokens.colors.text.muted
        : tokens.colors.text.secondary,
      opacity: disabled ? 0.5 : 1,
      ...style,
    };

    // Borde inferior para herramienta activa
    const activeIndicator = active ? (
      <span
        style={{
          position: 'absolute',
          bottom: 2,
          left: '25%',
          right: '25%',
          height: 2,
          borderRadius: tokens.radius.full,
          background: tokens.colors.accent.primary,
        }}
      />
    ) : null;

    const button = (
      <button
        ref={ref}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        className={`icon-button ${className}`}
        style={baseStyles}
        {...rest}
      >
        <span style={{ width: s.icon, height: s.icon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
        {activeIndicator}
      </button>
    );

    return (
      <Tooltip content={tooltip || label} shortcut={shortcut}>
        {button}
      </Tooltip>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
