// ==========================================
// Supabase — Realtime para colaboración
// Gestiona presencia, cursores y cambios en vivo
// ==========================================

import { createClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  userId: string;
  displayName: string;
  cursorX: number;
  cursorY: number;
  activeFloor: number;
  selectedMachineId: string | null;
  color: string;
}

export class ProjectRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private supabase = createClient();

  /**
   * Suscribirse a cambios de un proyecto en tiempo real.
   * - Broadcast: cursores de otros usuarios (baja latencia, sin persistir)
   * - Presence: quién está conectado
   * - Postgres Changes: cambios en project_data persistidos
   */
  subscribe(
    projectId: string,
    userId: string,
    callbacks: {
      onPresenceSync: (users: PresenceState[]) => void;
      onCursorMove: (userId: string, x: number, y: number) => void;
      onProjectUpdate: (data: unknown) => void;
      onMachineMove: (userId: string, machineId: string, x: number, y: number) => void;
    }
  ) {
    this.channel = this.supabase
      .channel(`project:${projectId}`, {
        config: { presence: { key: userId } },
      })

      // Presencia: quién está conectado
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState<PresenceState>();
        const users = Object.values(state).flat();
        callbacks.onPresenceSync(users);
      })

      // Broadcast: movimientos de cursor (no se persisten, baja latencia)
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        callbacks.onCursorMove(payload.userId, payload.x, payload.y);
      })

      // Broadcast: movimiento de máquina en tiempo real
      .on('broadcast', { event: 'machine_move' }, ({ payload }) => {
        callbacks.onMachineMove(payload.userId, payload.machineId, payload.x, payload.y);
      })

      // Postgres Changes: guardado de proyecto (persistido)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'floor_configurations',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacks.onProjectUpdate(payload.new);
        }
      )

      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Anunciar presencia
          await this.channel!.track({
            userId,
            online_at: new Date().toISOString(),
          });
        }
      });
  }

  // Enviar posición del cursor (broadcast, sin persistir)
  sendCursorPosition(userId: string, x: number, y: number) {
    this.channel?.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { userId, x, y },
    });
  }

  // Enviar movimiento de máquina en tiempo real
  sendMachineMove(userId: string, machineId: string, x: number, y: number) {
    this.channel?.send({
      type: 'broadcast',
      event: 'machine_move',
      payload: { userId, machineId, x, y },
    });
  }

  unsubscribe() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
