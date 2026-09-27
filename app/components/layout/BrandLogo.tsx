export function BrandLogo({className = ''}: {className?: string}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/brand/wonderweb-logo.svg"
        alt=""
        width="36"
        height="36"
        className="size-9 shrink-0 object-contain"
      />
      <span className="text-lg font-black tracking-tight">WonderWeb</span>
    </span>
  );
}
