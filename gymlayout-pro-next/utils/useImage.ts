// ==========================================
// Hook para cargar imágenes en Konva
// ==========================================

import { useState, useEffect } from 'react';

export default function useImage(url: string): [HTMLImageElement | null, boolean] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!url) {
      setImage(null);
      setLoaded(false);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      setLoaded(true);
    };
    img.onerror = () => {
      setImage(null);
      setLoaded(false);
    };
    img.src = url;
  }, [url]);

  return [image, loaded];
}
