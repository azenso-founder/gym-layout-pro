// ==========================================
// Button — Variantes: primary, secondary, ghost, danger
// Tamaños: sm, md, lg — siempre min-height 44px para touch target
// ==========================================

'use client';

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { tokens } from '@/lib/design/tokens';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: tokens.colors.accent.primary,
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: tokens.colors.bg.surface,
    color: tokens.colors.text.primary,
    border: `1px solid ${tokens.colors.border.default}`,
  },
  ghost: {
    background: 'transparent',
    color: tokens.colors.text.secondary,
    border: 'none',
  },
  danger: {
    background: tokens.colors.accent.danger,
    color: '#fff',
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { height: 36, padding: '0 12px', fontSize: tokens.typography.size.sm },
  md: { height: 44, padding: '0 16px', fontSize: tokens.typography.size.base },
  lg: { height: 48, padding: '0 20px', fontSize: tokens.typography.size.md },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, children, disabled, style, className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`gl-button ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: tokens.radius.md,
          fontWeight: tokens.typography.weight.medium,
          fontFamily: tokens.typography.fontFamily.sans,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: `all ${tokens.transition.fast}`,
          minHeight: 44,
          whiteSpace: 'nowrap',
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        {...rest}
      >
        {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
