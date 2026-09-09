// ==========================================
// CRAFT — Formulario de configuración del problema
// ==========================================

'use client';

import { useCallback, useRef } from 'react';
import { useCraftStore } from '@/stores/useCraftStore';

export default function CraftSetupForm() {
  const {
    problem,
    validationError,
    setProblemName,
    setDimensions,
    setDepartmentCount,
    updateDepartment,
    setFlowValue,
    setDistanceMetric,
    setLayoutMode,
    setAisleWidth,
    setLinearUnit,
    loadExample,
    generateLayout,
    importProblem,
  } = useCraftStore();

  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(() => {
    const input = fileRef.current;
    if (!input) return;
    input.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const err = importProblem(reader.result as string);
      if (err) alert(`Error al importar: ${err}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importProblem]);

  const totalArea = problem.departments.reduce((s, d) => s + d.area, 0);
  const plantArea = problem.L * problem.W;
  const areaOk = totalArea <= plantArea;

  return (
    <div className="space-y-6">
      {/* Header con acciones rápidas */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={loadExample}
          className="px-3 py-1.5 text-xs bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors"
        >
          📋 Cargar Ejemplo
        </button>
        <button
          onClick={handleImport}
          className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          📂 Importar JSON
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>

      {validationError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          ⚠️ {validationError}
        </div>
      )}

      {/* Datos generales */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">Datos Generales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Nombre</span>
            <input
              type="text"
              value={problem.name}
              onChange={(e) => setProblemName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Filas (L)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={problem.L}
              onChange={(e) => setDimensions(+e.target.value, problem.W)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Columnas (W)</span>
            <input
              type="number"
              min={1}
              max={50}
              value={problem.W}
              onChange={(e) => setDimensions(problem.L, +e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Unidad</span>
            <input
              type="text"
              value={problem.linearUnit}
              onChange={(e) => setLinearUnit(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
              placeholder="m, ft..."
            />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Departamentos (N)</span>
            <input
              type="number"
              min={2}
              max={100}
              value={problem.N}
              onChange={(e) => setDepartmentCount(+e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Métrica</span>
            <select
              value={problem.distanceMetric}
              onChange={(e) => setDistanceMetric(e.target.value as 'rectilinear' | 'euclidean')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
            >
              <option value="rectilinear">Rectilínea (Manhattan)</option>
              <option value="euclidean">Euclidiana</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase text-zinc-500">Modo Layout</span>
            <select
              value={problem.layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as 'sequential' | 'traditional')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
            >
              <option value="traditional">Tradicional (Libre)</option>
              <option value="sequential">Secuencial (Pasillos)</option>
            </select>
          </label>
          {problem.layoutMode === 'sequential' && (
            <label className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-500">Ancho Pasillo</span>
              <input
                type="number"
                min={1}
                max={problem.W}
                value={problem.aisleWidth || 2}
                onChange={(e) => setAisleWidth(+e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
              />
            </label>
          )}
        </div>

        <div className={`text-xs px-2 py-1 rounded ${areaOk ? 'text-zinc-500' : 'text-red-400 bg-red-500/10'}`}>
          Área total: {totalArea} / {plantArea} celdas ({areaOk ? '✓ OK' : '✗ Excede la planta'})
        </div>
      </section>

      {/* Departamentos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">Departamentos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 text-[10px] uppercase">
                <th className="text-left px-2 py-1">ID</th>
                <th className="text-left px-2 py-1">Nombre</th>
                <th className="text-left px-2 py-1">Área</th>
                <th className="text-left px-2 py-1">Color</th>
                <th className="text-left px-2 py-1">Fijo</th>
              </tr>
            </thead>
            <tbody>
              {problem.departments.map((dept) => (
                <tr key={dept.id} className="border-t border-zinc-800/50">
                  <td className="px-2 py-1 text-zinc-500">{dept.id}</td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={dept.name}
                      onChange={(e) => updateDepartment(dept.id, { name: e.target.value })}
                      className="w-full bg-transparent border-b border-zinc-800 px-1 py-0.5 text-white focus:border-orange-500/50 outline-none"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      value={dept.area}
                      onChange={(e) => updateDepartment(dept.id, { area: +e.target.value })}
                      className="w-16 bg-transparent border-b border-zinc-800 px-1 py-0.5 text-white focus:border-orange-500/50 outline-none"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="color"
                      value={dept.color}
                      onChange={(e) => updateDepartment(dept.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={dept.isFixed}
                      onChange={(e) => updateDepartment(dept.id, { isFixed: e.target.checked })}
                      className="accent-orange-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Matriz de Flujos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">Matriz de Flujos</h3>
        <p className="text-[10px] text-zinc-500">
          Ingrese los valores del triángulo superior. Se espejan automáticamente.
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="px-1 py-1 text-[10px] text-zinc-600"></th>
                {problem.departments.map((d) => (
                  <th key={d.id} className="px-1 py-1 text-[10px] text-zinc-400 text-center min-w-[40px]">
                    {d.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {problem.departments.map((deptI, i) => (
                <tr key={deptI.id}>
                  <td className="px-1 py-1 text-[10px] text-zinc-400 font-medium">{deptI.id}</td>
                  {problem.departments.map((deptJ, j) => (
                    <td key={deptJ.id} className="px-0.5 py-0.5">
                      {i === j ? (
                        <div className="w-10 h-7 bg-zinc-900/50 rounded flex items-center justify-center text-zinc-700">—</div>
                      ) : j > i ? (
                        <input
                          type="number"
                          min={0}
                          value={problem.flowMatrix[i][j]}
                          onChange={(e) => setFlowValue(i, j, Math.max(0, +e.target.value))}
                          className="w-10 h-7 bg-zinc-900 border border-zinc-800 rounded text-center text-white text-[11px] focus:border-orange-500/50 outline-none"
                        />
                      ) : (
                        <div className="w-10 h-7 bg-zinc-900/30 rounded flex items-center justify-center text-zinc-600 text-[11px]">
                          {problem.flowMatrix[i][j]}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Botones de generación de layout */}
      <section className="flex items-center gap-3 flex-wrap pt-2 border-t border-zinc-800">
        <button
          onClick={() => generateLayout('compact')}
          disabled={!areaOk}
          className="px-4 py-2 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          🏗️ Layout Compacto
        </button>
        <button
          onClick={() => generateLayout('random')}
          disabled={!areaOk}
          className="px-4 py-2 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          🎲 Layout Aleatorio
        </button>
        {problem.layoutMode === 'sequential' && (
          <button
            onClick={() => generateLayout('sequential')}
            disabled={!areaOk}
            className="px-4 py-2 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            📐 Layout Secuencial
          </button>
        )}
      </section>
    </div>
  );
}
