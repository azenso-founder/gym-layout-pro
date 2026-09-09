// ==========================================
// Layout Pro — Logo SVG Component
// Reusable across landing, dashboard, auth, editor
// ==========================================

interface LayoutProLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

export default function LayoutProLogo({
  size = 'md',
  showText = true,
  showBadge = false,
  className = '',
}: LayoutProLogoProps) {
  const iconSizes = {
    sm: 22,
    md: 28,
    lg: 38,
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  };

  const s = iconSizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG Icon — Blueprint grid + engineering square */}
      <svg
        width={s}
        height={s}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="lp-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="lp-grad-light" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
        
        {/* Outer rounded square — blueprint frame */}
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="8"
          stroke="url(#lp-grad)"
          strokeWidth="2.5"
          fill="none"
        />
        
        {/* Grid lines — layout grid */}
        <line x1="14" y1="2" x2="14" y2="38" stroke="url(#lp-grad)" strokeWidth="1.2" opacity="0.4" />
        <line x1="26" y1="2" x2="26" y2="38" stroke="url(#lp-grad)" strokeWidth="1.2" opacity="0.4" />
        <line x1="2" y1="14" x2="38" y2="14" stroke="url(#lp-grad)" strokeWidth="1.2" opacity="0.4" />
        <line x1="2" y1="26" x2="38" y2="26" stroke="url(#lp-grad)" strokeWidth="1.2" opacity="0.4" />
        
        {/* Highlighted cells — active layout zones */}
        <rect x="4" y="4" width="9" height="9" rx="2" fill="url(#lp-grad)" opacity="0.8" />
        <rect x="15.5" y="4" width="9" height="9" rx="2" fill="url(#lp-grad)" opacity="0.5" />
        <rect x="4" y="15.5" width="9" height="9" rx="2" fill="url(#lp-grad)" opacity="0.35" />
        <rect x="27" y="27" width="9" height="9" rx="2" fill="url(#lp-grad)" opacity="0.65" />
        
        {/* Engineering ruler mark — L-shape */}
        <path
          d="M27.5 4.5 L35.5 4.5 L35.5 12.5"
          stroke="url(#lp-grad-light)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Small dimension dots */}
        <circle cx="20" cy="20" r="1.8" fill="url(#lp-grad)" opacity="0.6" />
      </svg>

      {showText && (
        <span className={`font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent ${textSizes[size]}`}>
          Layout Pro
        </span>
      )}

      {showBadge && (
        <span className="text-[10px] text-zinc-600 font-medium">FIREFIT</span>
      )}
    </div>
  );
}
