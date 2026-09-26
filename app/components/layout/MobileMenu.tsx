import {useEffect} from 'react';
import {NavLink, useLocation} from 'react-router';
import {SITE, UNIVERSES} from '~/lib/site';
import {useCurrentUniverse} from '~/lib/use-universe';
import {Icon} from '~/components/ui/Icon';
import {TrustStrip} from '~/components/conversion/TrustStrip';
import {useModalA11y} from '~/lib/use-modal-a11y';

export function MobileMenu({open, onClose}: {open: boolean; onClose: () => void}) {
  const current = useCurrentUniverse();
  const location = useLocation();
  const {dialogRef, initialFocusRef} = useModalA11y<HTMLDivElement>(open, onClose);

  useEffect(() => onClose(), [location.pathname, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" tabIndex={-1} aria-label="Close menu" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <div ref={dialogRef} tabIndex={-1} className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <span className="text-lg font-black">{SITE.name}</span>
          <button ref={initialFocusRef} type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-paper" aria-label="Close menu">
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1 px-2 py-3">
          {UNIVERSES.map((universe) => (
            <section key={universe.id} data-universe={universe.id} className="mb-4 border-b border-line pb-3 last:border-0">
              <MenuLink to={universe.path} label={`WonderWeb ${universe.label}`} strong />
              <p className="px-3 pb-1 text-xs font-semibold text-muted">{universe.pitch}</p>
              <ul className={current && current.id !== universe.id ? 'hidden' : undefined}>
                {universe.nav.map((item) =>
                  item.children ? (
                    <li key={item.label}>
                      <p className="px-3 pt-2 pb-1 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">{item.label}</p>
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <MenuLink to={child.to} label={child.label} />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.to}>
                      <MenuLink to={item.to} label={item.label} />
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <TrustStrip compact />
        </div>
      </div>
    </div>
  );
}

function MenuLink({to, label, strong}: {to: string; label: string; strong?: boolean}) {
  return (
    <NavLink
      to={to}
      prefetch="intent"
      className={({isActive}) =>
        `flex items-center justify-between rounded-md px-3 py-2.5 ${strong ? 'font-extrabold' : 'font-semibold'} ${isActive ? 'bg-paper' : 'hover:bg-paper'}`
      }
    >
      {label}
      <Icon name="arrow" className="size-4 text-muted" />
    </NavLink>
  );
}
