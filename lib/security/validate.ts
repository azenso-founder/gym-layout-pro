// ==========================================
// Validación de inputs con Zod v4
// Toda input del usuario DEBE pasar por aquí antes de tocar la DB
// ==========================================

import { z } from 'zod';

// Sanitizar strings para prevenir XSS
const safeString = z.string().transform((s) => s.replace(/<[^>]*>/g, '').trim());

// === Proyectos ===

export const createProjectSchema = z.object({
  name: safeString.pipe(z.string().min(1, 'El nombre es obligatorio').max(200)),
  description: safeString.pipe(z.string().max(2000)).optional().default(''),
  gymName: safeString.pipe(z.string().max(200)).optional().default(''),
  initialFloors: z
    .array(
      z.object({
        name: safeString.pipe(z.string().min(1).max(100)),
        areaM2: z.number().positive().max(100000).optional(),
      })
    )
    .min(1)
    .max(10)
    .default([{ name: 'Planta Baja' }, { name: 'Planta Alta' }]),
});

export const updateProjectSchema = z.object({
  name: safeString.pipe(z.string().min(1).max(200)).optional(),
  description: safeString.pipe(z.string().max(2000)).optional(),
  gymName: safeString.pipe(z.string().max(200)).optional(),
  globalConfig: z.record(z.string(), z.unknown()).optional(),
});

// === Pisos ===

export const addFloorSchema = z.object({
  projectId: z.string().uuid(),
  name: safeString.pipe(z.string().min(1).max(100)),
  areaM2: z.number().positive().max(100000).optional(),
  sortOrder: z.number().int().min(0).max(50).optional(),
});

export const updateFloorSchema = z.object({
  name: safeString.pipe(z.string().min(1).max(100)).optional(),
  areaM2: z.number().positive().max(100000).optional(),
  sortOrder: z.number().int().min(0).max(50).optional(),
  scaleConfig: z.record(z.string(), z.unknown()).optional(),
  perimeter: z.record(z.string(), z.unknown()).optional(),
  zones: z.array(z.record(z.string(), z.unknown())).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// === Configuraciones ===

export const createConfigSchema = z.object({
  floorId: z.string().uuid(),
  name: safeString.pipe(z.string().min(1).max(100)).default('Nueva configuración'),
  duplicateFrom: z.string().uuid().optional(),
  colorTag: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#4CAF50'),
});

export const saveConfigSchema = z.object({
  configId: z.string().uuid(),
  layoutData: z.array(
    z.object({
      machineId: z.string(),
      x: z.number(),
      y: z.number(),
      rotation: z.number().min(0).max(360).default(0),
      locked: z.boolean().default(false),
      n: z.number().int().positive(),
      N: z.number().int().positive(),
      K: z.number().positive().max(1),
    })
  ),
  guerchetSummary: z.record(z.string(), z.unknown()).optional(),
  slpScore: z.number().min(0).max(100).optional(),
  simulationResults: z.record(z.string(), z.unknown()).optional(),
  notes: safeString.pipe(z.string().max(5000)).optional(),
});

export const switchConfigSchema = z.object({
  configId: z.string().uuid(),
});

// === Colaboradores ===

export const inviteCollaboratorSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email('Email inválido'),
  role: z.enum(['viewer', 'editor']).default('viewer'),
});

// === Máquinas ===

export const machineSchema = z.object({
  name: safeString.pipe(z.string().min(1).max(100)),
  category: z.enum([
    'cardio',
    'rack',
    'banca',
    'máquina_pierna',
    'máquina_upper',
    'polea',
    'funcional',
    'accesorio',
    'smith',
    'multiestación',
    'otro',
  ]),
  widthM: z.number().positive().max(50),
  lengthM: z.number().positive().max(50),
  heightM: z.number().positive().max(10).optional(),
  defaultN: z.number().int().min(1).max(20).default(1),
  defaultSides: z.number().int().min(1).max(8).default(1),
  defaultK: z.number().positive().max(1).default(0.1),
  serviceTimeMin: z.number().positive().default(3),
  serviceTimeMode: z.number().positive().default(5),
  serviceTimeMax: z.number().positive().default(8),
  capacity: z.number().int().positive().default(1),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#4CAF50'),
});

// === Auth ===

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  displayName: safeString.pipe(z.string().min(1, 'El nombre es obligatorio').max(100)),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
