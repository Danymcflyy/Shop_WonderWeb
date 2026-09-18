import {Icon} from '~/components/ui/Icon';

/** Native <details> accordion: keyboard and screen-reader friendly, zero JS. */
export function FAQ({items}: {items: Array<{q: string; a: string}>}) {
  return (
    <div className="card divide-y divide-line">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold [&::-webkit-details-marker]:hidden">
            {item.q}
            <Icon name="plus" className="size-4 shrink-0 transition-transform group-open:rotate-45" />
          </summary>
          <p className="-mt-1 px-5 pb-5 text-[15px] leading-relaxed text-ink/75">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
