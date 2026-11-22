'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from './icons';

export default function ThemeToggle({ className = 'ib' }: { className?: string }) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('th-dark'));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('th-dark', next);
    document.documentElement.classList.toggle('th-light', !next);
    document.cookie = `tema=${next ? 'oscuro' : 'claro'}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button type="button" className={className} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={toggle}>
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
