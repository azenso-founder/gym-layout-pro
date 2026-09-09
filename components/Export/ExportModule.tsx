// ==========================================
// Módulo de Exportación
// ==========================================

import { FiDownload, FiImage, FiFileText, FiDatabase, FiCode } from 'react-icons/fi';
import useStore from '@/stores/useStore';
import * as XLSX from 'xlsx';

export default function ExportModule() {
  const machines = useStore((s) => s.machines);
  const activePlanta = useStore((s) => s.activePlanta);
  const simMetrics = useStore((s) => s.simMetrics);

  const plantaMachines = machines.filter((m) => m.planta === activePlanta && m.placed);

  // Exportar Excel Guerchet actualizado
  const exportExcel = () => {
    const data = plantaMachines.map((m) => {
      const Ss = m.largo * m.ancho;
      const Sg = Ss * m.N;
      const Se = m.K * (Ss + Sg);
      const St = Ss + Sg + Se;
      return {
        'Máquina': m.nombre,
        'N (lados)': m.N,
        'Largo (m)': m.largo,
        'Ancho (m)': m.ancho,
        'Alto (m)': m.alto,
        'K': m.K,
        'Ss (m²)': Math.round(Ss * 1000) / 1000,
        'Sg (m²)': Math.round(Sg * 1000) / 1000,
        'Se (m²)': Math.round(Se * 1000) / 1000,
        'St (m²)': Math.round(St * 1000) / 1000,
        'Pos X (m)': Math.round((m.x / 50) * 100) / 100,
        'Pos Y (m)': Math.round((m.y / 50) * 100) / 100,
        'Rotación': m.rotation,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      activePlanta === 'baja' ? 'Planta Baja' : 'Planta Alta'
    );

    // Agregar hoja de resumen
    const totalSt = data.reduce((s, d) => s + (d['St (m²)'] || 0), 0);
    const supDisponible = activePlanta === 'baja' ? 265 : 285;
    const resumen = [
      { Concepto: 'Superficie total Guerchet', Valor: Math.round(totalSt * 100) / 100, Unidad: 'm²' },
      { Concepto: 'Superficie disponible', Valor: supDisponible, Unidad: 'm²' },
      { Concepto: 'Margen', Valor: Math.round((supDisponible - totalSt) * 100) / 100, Unidad: 'm²' },
      { Concepto: '% Ocupación', Valor: Math.round((totalSt / supDisponible) * 10000) / 100, Unidad: '%' },
      { Concepto: 'Máquinas colocadas', Valor: plantaMachines.length, Unidad: 'unidades' },
    ];
    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    XLSX.writeFile(
      wb,
      `GymLayout_Guerchet_${activePlanta === 'baja' ? 'PlantaBaja' : 'PlantaAlta'}.xlsx`
    );
  };

  // Exportar JSON del proyecto
  const exportJSON = () => {
    const state = useStore.getState();
    const projectData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      machines: state.machines,
      zones: state.zones,
      slpRelations: state.slpRelations,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gymlayout_proyecto.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cargar JSON del proyecto
  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const store = useStore.getState();
          if (data.machines) {
            for (const m of data.machines) {
              store.machines.push(m);
            }
          }
          alert('Proyecto cargado exitosamente');
        } catch {
          alert('Error al cargar el archivo');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Exportar CSV de métricas
  const exportMetricsCSV = () => {
    if (!simMetrics) {
      alert('Ejecuta la simulación primero');
      return;
    }
    const rows = [
      ['Máquina', 'Utilización %', 'Tiempo Cola Prom (min)', 'Throughput (cl/h)', 'Tiempo Servicio Prom (min)'],
      ...simMetrics.machineMetrics.map((m) => [
        m.nombre,
        Math.round(m.utilizacion * 100).toString(),
        m.tiempoColaPromedio.toFixed(1),
        m.throughput.toFixed(1),
        m.tiempoServicioPromedio.toFixed(1),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metricas_simulacion.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar PNG del canvas
  const exportPNG = () => {
    const stage = document.querySelector('canvas');
    if (!stage) {
      alert('No hay canvas visible');
      return;
    }
    const dataURL = stage.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `layout_${activePlanta}.png`;
    a.click();
  };

  // Generar script SimPy
  const exportSimPy = () => {
    const lines = [
      '"""',
      'GymLayout Pro — Modelo de simulación SimPy',
      `Planta: ${activePlanta === 'baja' ? 'Baja' : 'Alta'}`,
      `Generado: ${new Date().toLocaleString()}`,
      '"""',
      '',
      'import simpy',
      'import random',
      'import statistics',
      '',
      '# --- Configuración ---',
      'RANDOM_SEED = 42',
      'SIM_TIME = 960  # 16 horas (6am-10pm) en minutos',
      '',
      '# --- Máquinas ---',
      'MACHINES = {',
      ...plantaMachines.map(
        (m) =>
          `    "${m.nombre}": {"capacity": ${m.capacidad}, "service_time": (${m.tiempoServicio.min}, ${m.tiempoServicio.moda}, ${m.tiempoServicio.max})},`
      ),
      '}',
      '',
      'def triangular(min_val, mode_val, max_val):',
      '    return random.triangular(min_val, max_val, mode_val)',
      '',
      'def arrival_rate(hour):',
      '    rates = {6:10, 7:30, 8:30, 9:15, 10:15, 11:10, 12:25, 13:25,',
      '             14:5, 15:5, 16:15, 17:40, 18:40, 19:40, 20:15, 21:15}',
      '    return rates.get(int(hour), 5)',
      '',
      'class Gym:',
      '    def __init__(self, env):',
      '        self.env = env',
      '        self.machines = {}',
      '        for name, config in MACHINES.items():',
      '            self.machines[name] = simpy.Resource(env, capacity=config["capacity"])',
      '        self.stats = {"served": 0, "wait_times": [], "service_times": []}',
      '',
      '    def use_machine(self, client, machine_name):',
      '        config = MACHINES[machine_name]',
      '        service = triangular(*config["service_time"])',
      '        self.stats["service_times"].append(service)',
      '        yield self.env.timeout(service)',
      '',
      'def client(env, name, gym, routine_machines):',
      '    arrival = env.now',
      '    for machine_name in routine_machines:',
      '        if machine_name not in gym.machines:',
      '            continue',
      '        with gym.machines[machine_name].request() as req:',
      '            wait_start = env.now',
      '            yield req',
      '            wait_time = env.now - wait_start',
      '            gym.stats["wait_times"].append(wait_time)',
      '            yield env.process(gym.use_machine(name, machine_name))',
      '    gym.stats["served"] += 1',
      '',
      'def client_generator(env, gym):',
      '    i = 0',
      '    while True:',
      '        hour = 6 + env.now / 60',
      '        if hour >= 22:',
      '            break',
      '        rate = arrival_rate(hour)',
      '        yield env.timeout(random.expovariate(rate / 60))',
      '        machine_names = list(MACHINES.keys())',
      '        n = random.randint(3, 7)',
      '        routine = random.sample(machine_names, min(n, len(machine_names)))',
      '        env.process(client(env, f"Client_{i}", gym, routine))',
      '        i += 1',
      '',
      'def run():',
      '    random.seed(RANDOM_SEED)',
      '    env = simpy.Environment()',
      '    gym = Gym(env)',
      '    env.process(client_generator(env, gym))',
      '    env.run(until=SIM_TIME)',
      '',
      '    print(f"Clientes atendidos: {gym.stats[\'served\']}")',
      '    if gym.stats["wait_times"]:',
      '        print(f"Tiempo espera promedio: {statistics.mean(gym.stats[\'wait_times\']):.1f} min")',
      '    if gym.stats["service_times"]:',
      '        print(f"Tiempo servicio promedio: {statistics.mean(gym.stats[\'service_times\']):.1f} min")',
      '',
      'if __name__ == "__main__":',
      '    run()',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gym_simulation_simpy.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-200">
          📤 Exportar
        </h2>
        <p className="text-xs text-zinc-500">
          Descarga tu layout, datos y modelos de simulación
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 max-w-3xl">
        <ExportCard
          icon={<FiImage />}
          title="Imagen del layout"
          description="Exportar como PNG de alta resolución"
          onClick={exportPNG}
          color="#3B82F6"
        />
        <ExportCard
          icon={<FiFileText />}
          title="Excel Guerchet"
          description="Archivo .xlsx con superficies calculadas"
          onClick={exportExcel}
          color="#22C55E"
        />
        <ExportCard
          icon={<FiDatabase />}
          title="Proyecto JSON"
          description="Guardar todo el estado del proyecto"
          onClick={exportJSON}
          color="#F97316"
        />
        <ExportCard
          icon={<FiDownload />}
          title="Cargar proyecto"
          description="Importar un archivo JSON guardado"
          onClick={importJSON}
          color="#8B5CF6"
        />
        <ExportCard
          icon={<FiDownload />}
          title="Métricas CSV"
          description="Exportar métricas de simulación"
          onClick={exportMetricsCSV}
          color="#EF4444"
          disabled={!simMetrics}
        />
        <ExportCard
          icon={<FiCode />}
          title="Script SimPy"
          description="Modelo Python para SimPy (replicable)"
          onClick={exportSimPy}
          color="#10B981"
        />
      </div>
    </div>
  );
}

function ExportCard({
  icon,
  title,
  description,
  onClick,
  color,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={`flex items-start gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900 text-left transition-all ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className="text-2xl p-2 rounded-lg"
        style={{ backgroundColor: color + '20', color }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
