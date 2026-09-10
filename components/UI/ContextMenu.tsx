// ==========================================
// Menú contextual (click derecho) — Fase 10
// Sobre máquinas: editar, duplicar, alinear, eliminar
// Sobre canvas vacío: zoom fit, config visual
// ==========================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { tokens } from '@/lib/design/tokens';

export interface MenuAction {
  label: string;
  icon?: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  // Sub-menú
  children?: MenuAction[];
}

export interface MenuSeparator {
  separator: true;
}

export type MenuItem = MenuAction | MenuSeparator;

function isSeparator(item: MenuItem): item is MenuSeparator {
  return 'separator' in item;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  // Ajustar posición si el menú se sale de la ventana
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let ax = x;
      let ay = y;
      if (rect.right > window.innerWidth - 10) ax = x - rect.width;
      if (rect.bottom > window.innerHeight - 10) ay = y - rect.height;
      if (ax < 5) ax = 5;
      if (ay < 5) ay = 5;
      setAdjustedPos({ x: ax, y: ay });
    }
  }, [x, y]);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Pequeño delay para evitar que el mismo click derecho cierre el menú
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[200px] py-1 rounded-lg border shadow-2xl backdrop-blur-md"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
        background: tokens.colors.bg.surface + 'F5',
        borderColor: tokens.colors.border.default,
        boxShadow: tokens.shadow.modal,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => {
        if (isSeparator(item)) {
          return (
            <div
              key={`sep-${i}`}
              className="my-1 mx-2 border-t"
              style={{ borderColor: tokens.colors.border.subtle }}
            />
          );
        }

        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={`${item.label}-${i}`} className="relative">
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
              style={{
                color: item.disabled
                  ? tokens.colors.text.muted
                  : item.danger
                  ? tokens.colors.accent.danger
                  : tokens.colors.text.primary,
              }}
              disabled={item.disabled}
              onClick={() => {
                if (hasChildren) return;
                item.onClick();
                onClose();
              }}
              onMouseEnter={() => hasChildren && setActiveSubmenu(item.label)}
              onMouseLeave={() => hasChildren && setActiveSubmenu(null)}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = tokens.colors.bg.active;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {item.icon && <span className="w-4 text-center text-[11px]">{item.icon}</span>}
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <span className="text-[10px] ml-3 tabular-nums" style={{ color: tokens.colors.text.muted }}>
                  {item.shortcut}
                </span>
              )}
              {hasChildren && (
                <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>▸</span>
              )}
            </button>

            {/* Sub-menú */}
            {hasChildren && activeSubmenu === item.label && (
              <div
                className="absolute left-full top-0 min-w-[180px] py-1 rounded-lg border shadow-xl backdrop-blur-md"
                style={{
                  background: tokens.colors.bg.surface + 'F5',
                  borderColor: tokens.colors.border.default,
                }}
                onMouseEnter={() => setActiveSubmenu(item.label)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                {item.children!.map((child, ci) => (
                  <button
                    key={`${child.label}-${ci}`}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                    style={{ color: tokens.colors.text.primary }}
                    onClick={() => {
                      child.onClick();
                      onClose();
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.background = tokens.colors.bg.active;
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {child.icon && <span className="w-4 text-center text-[11px]">{child.icon}</span>}
                    <span className="flex-1 text-left">{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
