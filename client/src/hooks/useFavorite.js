import { useCallback, useEffect, useState } from 'react';

const KEY = 'f1-fav-driver';

// Favorite driver number, persisted in localStorage.
export function useFavorite() {
  const [fav, setFav] = useState(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (fav == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(fav));
    } catch { /* ignore */ }
  }, [fav]);

  const toggle = useCallback((driverNumber) => {
    setFav((cur) => (cur === driverNumber ? null : driverNumber));
  }, []);

  return { fav, toggle };
}
