type CircularCountdownProps = {
  /** Total duration in seconds (e.g. 60) */
  totalSeconds: number;
  /** Seconds left (0..totalSeconds) */
  secondsLeft: number;
  /** If false, timer is shown as full (not progressing) */
  running?: boolean;
  /** Size in px */
  size?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Circular countdown timer:
 * - Uses conic-gradient to "empty" the inner fill
 * - Color shifts from green -> red as time runs out
 */
export function CircularCountdown({
  totalSeconds,
  secondsLeft,
  running = true,
  size = 28,
}: CircularCountdownProps) {
  const safeTotal = Math.max(1, totalSeconds);
  const safeLeft = clamp(secondsLeft, 0, safeTotal);

  const progress = running ? safeLeft / safeTotal : 1; // 1 -> full, 0 -> empty
  const percent = progress * 100;

  // Hue: green(120) -> red(0)
  const hue = lerp(0, 120, progress);
  const color = `hsl(${hue} 90% 55%)`;

  return (
    <div
      aria-label={`Таймер: ${safeLeft} секунд`}
      title={`${safeLeft}с`}
      className="relative rounded-full border border-white/15 bg-black/25 backdrop-blur-sm shadow-sm"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Fill that "disappears" */}
      <div
        className="absolute inset-0 rounded-full transition-[background] duration-300 ease-out"
        style={{
          background: `conic-gradient(${color} 0 ${percent}%, rgba(255,255,255,0.08) ${percent}% 100%)`,
        }}
      />

      {/* Inner cutout to make it look cleaner (still feels like "inner fill") */}
      <div
        className="absolute rounded-full bg-slate-900/65 border border-white/10"
        style={{
          inset: `${Math.max(2, Math.floor(size * 0.18))}px`,
        }}
      />
    </div>
  );
}


