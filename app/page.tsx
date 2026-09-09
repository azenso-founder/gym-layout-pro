// ==========================================
// Landing Page — Página pública de Layout Pro
// ==========================================

import Link from 'next/link';

const FEATURES = [
  {
    icon: '📐',
    title: 'Editor de Layout',
    desc: 'Arrastra y posiciona equipos sobre tu plano. Snap a grilla, rotación, zoom infinito y multi-selección.',
  },
  {
    icon: '📊',
    title: 'Método Guerchet',
    desc: 'Cálculo automático de superficies Ss, Sg, Se, St. Importa datos desde Excel en un click.',
  },
  {
    icon: '🔗',
    title: 'Análisis SLP',
    desc: 'Matriz de relaciones entre zonas. Evalúa tu distribución con un score de 0-100.',
  },
  {
    icon: '▶️',
    title: 'Simulación DES',
    desc: 'Simula el flujo de personas y procesos en hora pico. Identifica cuellos de botella y colas.',
  },
  {
    icon: '🏢',
    title: 'Multi-piso',
    desc: 'Gestiona múltiples pisos con configuraciones independientes por nivel.',
  },
  {
    icon: '⟷',
    title: 'Comparación',
    desc: 'Compara configuraciones side-by-side. Elige la mejor distribución con datos reales.',
  },
];

const FREE_FEATURES = [
  { text: '3 proyectos', included: true },
  { text: '3 pisos por proyecto', included: true },
  { text: '3 configuraciones por piso', included: true },
  { text: 'Editor completo', included: true },
  { text: 'Guerchet + SLP + Simulación', included: true },
  { text: 'Exportar PNG', included: true },
  { text: 'Exportar PDF / SIMIO', included: false },
  { text: 'Colaboración en tiempo real', included: false },
  { text: 'Comparación side-by-side', included: false },
];

const PRO_FEATURES = [
  { text: 'Proyectos ilimitados', highlight: false },
  { text: '20 pisos por proyecto', highlight: false },
  { text: '20 configuraciones por piso', highlight: false },
  { text: 'Editor completo', highlight: false },
  { text: 'Guerchet + SLP + Simulación', highlight: false },
  { text: 'Exportar PNG, PDF, SIMIO', highlight: false },
  { text: 'Colaboración en tiempo real', highlight: true },
  { text: 'Comparación side-by-side', highlight: true },
  { text: 'Historial de versiones ilimitado', highlight: true },
];

const STATS = [
  { value: '500+', label: 'Layouts diseñados' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<1s', label: 'Cálculos Guerchet' },
  { value: '24/7', label: 'Soporte' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-1 absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-orange-500/[0.04] blur-3xl" />
          <div className="orb-2 absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-red-500/[0.03] blur-3xl" />
          <div className="orb-3 absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-orange-400/[0.03] blur-3xl" />
        </div>

        {/* Dot grid overlay */}
        <div className="absolute inset-0 hero-dots opacity-40" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            {/* Inline logo SVG for server component */}
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <defs>
                <linearGradient id="nav-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="nav-grad-l" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="36" height="36" rx="8" stroke="url(#nav-grad)" strokeWidth="2.5" fill="none"/>
              <line x1="14" y1="2" x2="14" y2="38" stroke="url(#nav-grad)" strokeWidth="1.2" opacity="0.4"/>
              <line x1="26" y1="2" x2="26" y2="38" stroke="url(#nav-grad)" strokeWidth="1.2" opacity="0.4"/>
              <line x1="2" y1="14" x2="38" y2="14" stroke="url(#nav-grad)" strokeWidth="1.2" opacity="0.4"/>
              <line x1="2" y1="26" x2="38" y2="26" stroke="url(#nav-grad)" strokeWidth="1.2" opacity="0.4"/>
              <rect x="4" y="4" width="9" height="9" rx="2" fill="url(#nav-grad)" opacity="0.8"/>
              <rect x="15.5" y="4" width="9" height="9" rx="2" fill="url(#nav-grad)" opacity="0.5"/>
              <rect x="4" y="15.5" width="9" height="9" rx="2" fill="url(#nav-grad)" opacity="0.35"/>
              <rect x="27" y="27" width="9" height="9" rx="2" fill="url(#nav-grad)" opacity="0.65"/>
              <path d="M27.5 4.5 L35.5 4.5 L35.5 12.5" stroke="url(#nav-grad-l)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="20" cy="20" r="1.8" fill="url(#nav-grad)" opacity="0.6"/>
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Layout Pro
            </span>
            <span className="text-[10px] text-zinc-600 font-medium tracking-wider">FIREFIT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-medium text-white btn-gradient rounded-xl"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-shimmer border border-orange-500/20 text-orange-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Método Guerchet + SLP + Simulación DES
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Diseña el layout perfecto
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              para tus operaciones
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Herramienta profesional de diseño de layout industrial con cálculos Guerchet
            automatizados, análisis SLP y simulación de eventos discretos.
            Valida tu distribución antes de implementarla.
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="px-8 py-3.5 text-base font-semibold text-white btn-gradient rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
            >
              Empezar gratis →
            </Link>
            <Link
              href="#features"
              className="px-8 py-3.5 text-base font-medium text-zinc-300 border border-zinc-700 rounded-xl hover:bg-zinc-900 hover:border-zinc-600 transition-all"
            >
              Ver funcionalidades
            </Link>
          </div>
        </div>

        {/* Editor mockup */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
          <div className="relative">
            <div className="mock-glow" />
            <div className="editor-mock rounded-2xl overflow-hidden relative z-10">
              {/* Mock toolbar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-0.5 rounded bg-zinc-800/60 text-[10px] text-zinc-500">
                    Layout Pro — Editor
                  </div>
                </div>
              </div>
              {/* Mock content */}
              <div className="flex h-64 md:h-80">
                {/* Mock sidebar */}
                <div className="w-48 border-r border-zinc-800/60 p-3 hidden md:block">
                  <div className="text-[10px] text-zinc-600 mb-2 font-medium">EQUIPOS</div>
                  {['Estación A', 'Estación B', 'Conveyor', 'Mesa trabajo'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-zinc-500 hover:bg-zinc-800/40 mb-0.5">
                      <div className={`w-3 h-3 rounded-sm ${i === 0 ? 'bg-orange-500/40' : i === 1 ? 'bg-blue-500/30' : i === 2 ? 'bg-emerald-500/30' : 'bg-purple-500/30'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Mock canvas */}
                <div className="flex-1 relative bg-zinc-950/50 overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(63, 63, 70, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 63, 70, 0.15) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }} />
                  {/* Mock equipment blocks */}
                  <div className="absolute top-8 left-8 w-24 h-16 rounded-lg border-2 border-orange-500/40 bg-orange-500/10 flex items-center justify-center">
                    <span className="text-[9px] text-orange-400/80 font-medium">Zona A</span>
                  </div>
                  <div className="absolute top-8 right-12 w-20 h-20 rounded-lg border-2 border-blue-500/30 bg-blue-500/8 flex items-center justify-center">
                    <span className="text-[9px] text-blue-400/70 font-medium">Zona B</span>
                  </div>
                  <div className="absolute bottom-12 left-16 w-32 h-12 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/8 flex items-center justify-center">
                    <span className="text-[9px] text-emerald-400/70 font-medium">Conveyor</span>
                  </div>
                  <div className="absolute bottom-8 right-8 w-16 h-24 rounded-lg border-2 border-purple-500/30 bg-purple-500/8 flex items-center justify-center">
                    <span className="text-[9px] text-purple-400/70 font-medium rotate-90">Mesa</span>
                  </div>
                </div>
                {/* Mock properties panel */}
                <div className="w-44 border-l border-zinc-800/60 p-3 hidden lg:block">
                  <div className="text-[10px] text-zinc-600 mb-2 font-medium">PROPIEDADES</div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[9px] text-zinc-600">Superficie Ss</div>
                      <div className="text-[11px] text-orange-400 font-mono">24.5 m²</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-600">Superficie Sg</div>
                      <div className="text-[11px] text-zinc-300 font-mono">49.0 m²</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-600">Score SLP</div>
                      <div className="text-[11px] text-emerald-400 font-mono">87/100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent stat-glow">
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ===== FEATURES ===== */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas para{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              optimizar tus espacios
            </span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Desde el cálculo de superficies hasta la simulación de flujo de procesos.
            Diseñado para ingenieros, arquitectos y profesionales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className={`feature-card p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 group animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="feature-icon mb-4">
                <span>{feat.icon}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== INDUSTRIES ===== */}
      <section className="border-t border-zinc-800/50 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Para todo tipo de{' '}
            <span className="text-orange-400">industria</span>
          </h2>
          <p className="text-zinc-500 text-center mb-12 max-w-2xl mx-auto">
            Layout Pro se adapta a cualquier tipo de instalación
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🏭', label: 'Plantas industriales' },
              { icon: '📦', label: 'Centros logísticos' },
              { icon: '🏋️', label: 'Gimnasios & fitness' },
              { icon: '🏥', label: 'Centros de salud' },
              { icon: '🏢', label: 'Oficinas' },
              { icon: '🍽️', label: 'Restaurantes & cocinas' },
              { icon: '🏪', label: 'Retail' },
              { icon: '🔬', label: 'Laboratorios' },
            ].map((ind) => (
              <div
                key={ind.label}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors group"
              >
                <span className="text-2xl">{ind.icon}</span>
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {ind.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes simples</h2>
          <p className="text-zinc-500">
            Empieza gratis. Escala cuando lo necesites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="p-8 rounded-2xl glass-card">
            <h3 className="text-lg font-semibold mb-1">Free</h3>
            <p className="text-3xl font-bold mb-6">
              $0<span className="text-sm text-zinc-500 font-normal">/mes</span>
            </p>
            <ul className="space-y-2.5 text-sm mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className={`flex items-center gap-2.5 ${f.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {f.included ? (
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-zinc-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {f.text}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium border border-zinc-700 rounded-xl hover:bg-zinc-800 hover:border-zinc-600 transition-all"
            >
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="pricing-card-pro p-8 rounded-2xl bg-gradient-to-b from-orange-500/[0.07] to-transparent border border-orange-500/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-500 text-[10px] font-bold text-white uppercase tracking-wider badge-glow">
              Recomendado
            </div>
            <h3 className="text-lg font-semibold mb-1">Pro</h3>
            <p className="text-3xl font-bold mb-6">
              $14.990
              <span className="text-sm text-zinc-500 font-normal"> CLP/mes</span>
            </p>
            <ul className="space-y-2.5 text-sm mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f.text} className={`flex items-center gap-2.5 ${f.highlight ? 'text-orange-400' : 'text-zinc-200'}`}>
                  <svg className={`w-4 h-4 shrink-0 ${f.highlight ? 'text-orange-400' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-semibold text-white btn-gradient rounded-xl"
            >
              Empezar prueba Pro
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <defs>
                    <linearGradient id="ft-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="36" height="36" rx="8" stroke="url(#ft-grad)" strokeWidth="2.5" fill="none"/>
                  <rect x="4" y="4" width="9" height="9" rx="2" fill="url(#ft-grad)" opacity="0.8"/>
                  <rect x="15.5" y="4" width="9" height="9" rx="2" fill="url(#ft-grad)" opacity="0.5"/>
                  <rect x="27" y="27" width="9" height="9" rx="2" fill="url(#ft-grad)" opacity="0.65"/>
                </svg>
                <span className="font-bold text-sm bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Layout Pro
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Herramienta profesional de diseño de layout para empresas e industria.
              </p>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Producto</h4>
              <div className="space-y-2">
                <Link href="#features" className="footer-link block">Funcionalidades</Link>
                <Link href="/register" className="footer-link block">Planes</Link>
                <Link href="/templates" className="footer-link block">Templates</Link>
              </div>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Recursos</h4>
              <div className="space-y-2">
                <span className="footer-link block">Documentación</span>
                <span className="footer-link block">Guía Guerchet</span>
                <span className="footer-link block">Método SLP</span>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Legal</h4>
              <div className="space-y-2">
                <span className="footer-link block">Privacidad</span>
                <span className="footer-link block">Términos</span>
                <span className="footer-link block">Contacto</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              © 2025 FIREFIT Chile. Layout Pro.
            </span>
            <span className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors cursor-default">
              Hecho con 🔥 en Valdivia, Chile
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
