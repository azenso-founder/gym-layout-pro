// ==========================================
// Región aria-live para anuncios a screen readers — Fase 8
// Uso: importar announce() y llamar con el mensaje
// ==========================================

'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';

// Contexto global para anuncios accesibles
const AriaLiveContext = createContext<{
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}>({
  announce: () => {},
});

export function useAnnounce() {
  return useContext(AriaLiveContext);
}

export function AriaLiveProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('');
      // Micro-delay para forzar re-lectura del screen reader
      requestAnimationFrame(() => setAssertiveMessage(message));
    } else {
      setPoliteMessage('');
      requestAnimationFrame(() => setPoliteMessage(message));
    }
  }, []);

  // Limpiar después de un tiempo
  useEffect(() => {
    if (politeMessage) {
      const t = setTimeout(() => setPoliteMessage(''), 5000);
      return () => clearTimeout(t);
    }
  }, [politeMessage]);

  useEffect(() => {
    if (assertiveMessage) {
      const t = setTimeout(() => setAssertiveMessage(''), 5000);
      return () => clearTimeout(t);
    }
  }, [assertiveMessage]);

  return (
    <AriaLiveContext.Provider value={{ announce }}>
      {children}
      {/* Regiones aria-live ocultas visualmente */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AriaLiveContext.Provider>
  );
}
