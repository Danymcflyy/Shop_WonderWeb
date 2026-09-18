import type {FileFormat, PreviewKind, ProductSummary} from '~/lib/catalog/types';

/**
 * Product visual. Uses the real screenshot when `preview.imageUrl` exists.
 * Otherwise renders an abstract sketch of the file type, visibly tagged as a
 * placeholder, so nobody mistakes it for a real product screenshot
 * (DESIGN_SYSTEM.md: "No invented UI mockups").
 */
export function ProductPreview({
  product,
  size = 'card',
  className = '',
}: {
  product: Pick<ProductSummary, 'handle' | 'title' | 'preview' | 'formats' | 'bundleItems'>;
  size?: 'card' | 'hero' | 'thumb';
  className?: string;
}) {
  const {preview} = product;
  const aspect = size === 'thumb' ? 'aspect-square' : 'aspect-[4/3]';

  if (preview.imageUrl) {
    return (
      <div className={`${aspect} overflow-hidden rounded-(--radius-control) border border-line bg-surface ${className}`}>
        <img
          src={preview.imageUrl}
          alt={preview.alt ?? `${product.title} preview`}
          loading={size === 'hero' ? 'eager' : 'lazy'}
          className="size-full object-cover"
        />
      </div>
    );
  }

  const seed = hash(product.handle);

  return (
    <div
      className={`relative ${aspect} overflow-hidden rounded-(--radius-control) border border-line bg-[#EFEBE1] ${className}`}
      role="img"
      aria-label={`${product.title} — placeholder preview, real screenshot pending`}
    >
      <div
        className={`absolute bg-surface shadow-[0_1px_0_#DDD9CF,0_10px_24px_-14px_rgba(17,17,17,.35)] ${
          size === 'thumb' ? 'inset-[14%] rounded-[4px] p-[8%]' : 'inset-x-[11%] top-[12%] bottom-[-6%] rounded-md p-[5%]'
        }`}
      >
        <Sketch kind={preview.kind} seed={seed} count={product.bundleItems?.length} />
      </div>

      {size !== 'thumb' ? (
        <>
          <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1">
            {product.formats.slice(0, 3).map((format) => (
              <FormatChip key={format} format={format} />
            ))}
          </div>
          <span className="absolute top-2.5 right-2.5 rounded-sm border border-dashed border-muted/60 bg-paper/90 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted uppercase">
            Placeholder preview
          </span>
        </>
      ) : null}
    </div>
  );
}

const FORMAT_CHIP: Record<FileFormat, {label: string; className: string}> = {
  xlsx: {label: 'XLSX', className: 'bg-[#DDF1E6] text-[#0E6B45]'},
  sheets: {label: 'Sheets', className: 'bg-[#DDF1E6] text-[#0E6B45]'},
  docx: {label: 'DOCX', className: 'bg-[#DFE7FF] text-[#1D46D6]'},
  pdf: {label: 'PDF', className: 'bg-[#FBE1DE] text-[#B42318]'},
  notion: {label: 'Notion', className: 'bg-surface text-ink'},
  canva: {label: 'Canva', className: 'bg-[#E4E0FA] text-[#4B35B8]'},
};

export function FormatChip({format}: {format: FileFormat}) {
  const chip = FORMAT_CHIP[format];
  return (
    <span className={`rounded-[5px] border border-ink/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${chip.className}`}>
      {chip.label}
    </span>
  );
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic 0..1 sequence so SSR and client render the same sketch.
 * Integer-only on purpose: Math.sin may differ across JS engines.
 */
function rand(seed: number, i: number) {
  let x = (seed ^ Math.imul(i + 1, 2654435761)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) % 1000 / 1000;
}

function Sketch({kind, seed, count = 0}: {kind: PreviewKind; seed: number; count?: number}) {
  switch (kind) {
    case 'sheet':
      return (
        <div className="grid h-full grid-rows-[auto_1fr] gap-[6%]">
          <div className="h-[9%] min-h-1.5 w-2/5 rounded-sm bg-ink" />
          <div className="grid grid-cols-5 grid-rows-7 gap-px overflow-hidden rounded-sm border border-line bg-line">
            {Array.from({length: 35}, (_, i) => {
              const header = i < 5;
              const hot = !header && rand(seed, i) > 0.86;
              const total = i >= 30 && i % 5 === 4;
              return (
                <div
                  key={i}
                  className={header ? 'bg-ink/80' : total ? 'bg-cta' : hot ? 'bg-highlight' : 'bg-surface'}
                />
              );
            })}
          </div>
        </div>
      );
    case 'dashboard':
      return (
        <div className="grid h-full grid-rows-[auto_1fr] gap-[7%]">
          <div className="grid grid-cols-3 gap-[5%]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-sm border border-line p-[10%]">
                <div className="h-1 w-1/2 rounded-full bg-muted/40" />
                <div className={`mt-1.5 h-2 w-3/4 rounded-sm ${i === 2 ? 'bg-sale' : 'bg-ink'}`} />
              </div>
            ))}
          </div>
          <div className="flex items-end gap-[3%] border-b border-l border-line pb-px pl-px">
            {Array.from({length: 13}, (_, i) => {
              const v = 0.25 + rand(seed, i) * 0.7;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-[2px] ${i === 7 ? 'bg-sale' : 'bg-blue/80'}`}
                  style={{height: `${v * 100}%`}}
                />
              );
            })}
          </div>
        </div>
      );
    case 'doc':
      return (
        <div className="flex h-full flex-col gap-[5%]">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-1/3 rounded-sm bg-ink" />
            <div className="size-4 rounded-full bg-cta" />
          </div>
          {Array.from({length: 4}, (_, i) => (
            <div key={i} className="h-1 rounded-full bg-muted/35" style={{width: `${60 + rand(seed, i) * 38}%`}} />
          ))}
          <div className="mt-[3%] grid flex-1 grid-rows-4 gap-px overflow-hidden rounded-sm border border-line bg-line">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex items-center justify-between px-[4%] ${i === 3 ? 'bg-highlight' : 'bg-surface'}`}>
                <div className="h-1 w-2/5 rounded-full bg-muted/40" />
                <div className="h-1 w-1/6 rounded-full bg-ink/70" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'checklist':
      return (
        <div className="flex h-full flex-col justify-between">
          {Array.from({length: 7}, (_, i) => {
            const done = i < 3 + (seed % 3);
            return (
              <div key={i} className="flex items-center gap-[5%]">
                <div className={`grid aspect-square w-[9%] min-w-2 place-items-center rounded-[3px] border-[1.5px] ${done ? 'border-success bg-success' : 'border-ink/40'}`} />
                <div className={`h-1 rounded-full ${done ? 'bg-muted/30' : 'bg-ink/60'}`} style={{width: `${45 + rand(seed, i) * 45}%`}} />
              </div>
            );
          })}
        </div>
      );
    case 'scripts':
      return (
        <div className="flex h-full flex-col justify-around gap-[4%]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`rounded-md px-[5%] py-[4%] ${i % 2 ? 'ml-[22%] bg-blue/10' : 'mr-[22%] bg-paper'}`}
            >
              <div className="h-1 rounded-full bg-ink/60" style={{width: `${70 + rand(seed, i) * 25}%`}} />
              <div className="mt-1 h-1 w-1/2 rounded-full bg-ink/25" />
            </div>
          ))}
        </div>
      );
    case 'planner':
      return (
        <div className="grid h-full grid-cols-5 gap-[3%]">
          {Array.from({length: 5}, (_, col) => (
            <div key={col} className="flex flex-col gap-[6%] rounded-sm bg-paper p-[8%]">
              <div className="h-1 w-2/3 rounded-full bg-ink/70" />
              {Array.from({length: 1 + Math.floor(rand(seed, col) * 3)}, (_, j) => (
                <div
                  key={j}
                  className={`rounded-[3px] ${['bg-cta/80', 'bg-blue/70', 'bg-success/70', 'bg-highlight'][(col + j) % 4]}`}
                  style={{height: `${18 + rand(seed, col * 7 + j) * 22}%`}}
                />
              ))}
            </div>
          ))}
        </div>
      );
    case 'bundle':
      return (
        <div className="relative h-full">
          {[2, 1, 0].map((layer) => (
            <div
              key={layer}
              className="absolute inset-0 rounded-sm border border-line bg-surface"
              style={{transform: `translate(${layer * 6}%, ${-layer * 7}%)`, opacity: 1 - layer * 0.18}}
            />
          ))}
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="price text-[clamp(22px,5vw,44px)] leading-none">{count}</div>
              <div className="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">tools</div>
            </div>
          </div>
        </div>
      );
  }
}
