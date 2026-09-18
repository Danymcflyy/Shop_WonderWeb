import {useEffect, useState} from 'react';

/**
 * Countdown to a real campaign end date. Renders nothing on the server (no
 * hydration mismatch), nothing without a valid date, and nothing once the
 * date has passed. It can never reset.
 */
export function RealCountdown({endsAt, label = 'Ends in'}: {endsAt: string; label?: string}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    if (!Number.isFinite(end)) return;
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (remaining === null || remaining <= 0) return null;

  const s = Math.floor(remaining / 1000);
  const d = Math.floor(s / 86400);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      {label}
      <time className="font-mono font-bold tabular-nums" dateTime={endsAt}>
        {d > 0 ? `${d}d ` : ''}
        {pad(Math.floor((s % 86400) / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
      </time>
    </span>
  );
}
