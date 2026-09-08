// ==========================================
// Landing Page — Página pública de GymLayout Pro
// ==========================================

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden">
        {/* Fondo con gradiente */}
        <div className="absolute inset-0 auth-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.05)_0%,transparent_70%)]" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              🏋️ GymLayout Pro
            </span>
            <span className="text-[10px] text-zinc-600 font-medium">FIREFIT</span>
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
              className="px-4 py-2 text-sm font-medium text-white btn-gradient rounded-lg"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-28">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Método Guerchet + SLP + Simulación DES
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Diseña el layout perfecto
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              para tu gimnasio
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
            Herramienta profesional de diseño de layout con cálculos Guerchet automatizados,
            análisis SLP de relaciones entre zonas, y simulación de eventos discretos para
            validar tu distribución antes de implementarla.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 text-base font-semibold text-white btn-gradient rounded-xl shadow-lg shadow-orange-500/20"
            >
              Empezar gratis →
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 text-base font-medium text-zinc-400 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors"
            >
              Ver funcionalidades
            </Link>
          </div>
        </div>
      </header>

      {/* ===== FEATURES ===== */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Todo lo que necesitas para{' '}
          <span className="text-orange-400">diseñar tu gym</span>
        </h2>
        <p className="text-zinc-500 text-center mb-16 max-w-2xl mx-auto">
          Desde el cálculo de superficies hasta la simulación de flujo de clientes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '📐',
              title: 'Editor de Layout',
              desc: 'Arrastra y posiciona máquinas sobre tu plano. Snap a grilla, rotación, zoom infinito.',
            },
            {
              icon: '📊',
              title: 'Método Guerchet',
              desc: 'Cálculo automático de Ss, Sg, Se, St. Importa datos desde Excel en un click.',
            },
            {
              icon: '🔗',
              title: 'Análisis SLP',
              desc: 'Matriz de relaciones entre zonas. Evalúa tu layout con un score de 0-100.',
            },
            {
              icon: '▶️',
              title: 'Simulación DES',
              desc: 'Simula el flujo de clientes en hora pico. Identifica cuellos de botella y colas.',
            },
            {
              icon: '🏢',
              title: 'Multi-piso',
              desc: 'Gestiona múltiples pisos con sus propias configuraciones independientes.',
            },
            {
              icon: '⟷',
              title: 'Comparación',
              desc: 'Compara configuraciones side-by-side. Elige la mejor distribución con datos.',
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors group"
            >
              <span className="text-2xl block mb-3">{feat.icon}</span>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-sm text-zinc-500">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Planes simples</h2>
        <p className="text-zinc-500 text-center mb-12">
          Empieza gratis. Escala cuando lo necesites.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-1">Free</h3>
            <p className="text-3xl font-bold mb-4">
              $0<span className="text-sm text-zinc-500 font-normal">/mes</span>
            </p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-8">
              <li>✓ 3 proyectos</li>
              <li>✓ 3 pisos por proyecto</li>
              <li>✓ 3 configuraciones por piso</li>
              <li>✓ Editor completo</li>
              <li>✓ Guerchet + SLP + Simulación</li>
              <li>✓ Exportar PNG</li>
              <li className="text-zinc-600">✗ Exportar PDF / SIMIO</li>
              <li className="text-zinc-600">✗ Colaboración en tiempo real</li>
              <li className="text-zinc-600">✗ Comparación side-by-side</li>
            </ul>
            <Link
              href="/register"
              className="block w-full py-2.5 text-center text-sm font-medium border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-orange-500/5 to-transparent border border-orange-500/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-orange-500 text-[10px] font-bold text-white uppercase tracking-wider">
              Recomendado
            </div>
            <h3 className="text-lg font-semibold mb-1">Pro</h3>
            <p className="text-3xl font-bold mb-4">
              $14.990
              <span className="text-sm text-zinc-500 font-normal"> CLP/mes</span>
            </p>
            <ul className="space-y-2 text-sm text-zinc-300 mb-8">
              <li>✓ Proyectos ilimitados</li>
              <li>✓ 20 pisos por proyecto</li>
              <li>✓ 20 configuraciones por piso</li>
              <li>✓ Editor completo</li>
              <li>✓ Guerchet + SLP + Simulación</li>
              <li>✓ Exportar PNG, PDF, SIMIO</li>
              <li className="text-orange-400">✓ Colaboración en tiempo real</li>
              <li className="text-orange-400">✓ Comparación side-by-side</li>
              <li className="text-orange-400">✓ Historial de versiones ilimitado</li>
            </ul>
            <Link
              href="/register"
              className="block w-full py-2.5 text-center text-sm font-semibold text-white btn-gradient rounded-lg"
            >
              Empezar prueba Pro
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm text-zinc-600">
            © 2025 FIREFIT Chile. GymLayout Pro.
          </span>
          <span className="text-xs text-zinc-700">
            Hecho con 🔥 en Valdivia, Chile
          </span>
        </div>
      </footer>
    </div>
  );
}
