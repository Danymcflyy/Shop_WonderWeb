const PATHS = {
  check: 'M4 12.5l5 5L20 6.5',
  download: 'M12 3v12m0 0l-5-5m5 5l5-5M4 19h16',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zm9-13l4 4',
  lock: 'M6 11h12v9H6v-9zm2 0V8a4 4 0 118 0v3',
  cart: 'M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z',
  arrow: 'M5 12h14m-6-6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  clock: 'M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  file: 'M7 3h7l5 5v13H7V3zm7 0v5h5',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M6 9l6 6 6-6',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6l1-7z',
  info: 'M12 8h.01M11 12h1v5h1m8-5a9 9 0 11-18 0 9 9 0 0118 0z',
  tag: 'M3 12V4h8l10 10-8 8L3 12zm5-4h.01',
  layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5M3 16l9 5 9-5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = 'size-4',
  strokeWidth = 2,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
