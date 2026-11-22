export default function Ring({ pct, size = 22, hole, color = 'var(--accent)' }: { pct: number; size?: number; hole?: number; color?: string }) {
  const h = hole ?? Math.round(size * 0.32);
  const p = Math.max(0, Math.min(100, pct));
  return (
    <span
      className="ring"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0 ${p}%, var(--fillc) ${p}% 100%)`,
        WebkitMask: `radial-gradient(circle, transparent ${h}px, #000 ${h + 0.5}px)`,
        mask: `radial-gradient(circle, transparent ${h}px, #000 ${h + 0.5}px)`,
      }}
    />
  );
}
