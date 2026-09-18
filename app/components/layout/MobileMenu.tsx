import {useEffect, useRef} from 'react';
import {NavLink, useLocation} from 'react-router';
import {MAIN_NAV, SITE} from '~/lib/site';
import {Icon} from '~/components/ui/Icon';
import {TrustStrip} from '~/components/conversion/TrustStrip';

export function MobileMenu({open, onClose}: {open: boolean; onClose: () => void}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => onClose(), [location.pathname, onClose]);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" tabIndex={-1} aria-label="Close menu" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <span className="text-lg font-black">{SITE.name}</span>
          <button ref={closeRef} type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-paper" aria-label="Close menu">
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1 px-2 py-3">
          <ul>
            {MAIN_NAV.map((item) =>
              item.children ? (
                <li key={item.label} className="mt-3 border-t border-line pt-3">
                  <p className="px-3 pb-1 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">{item.label}</p>
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
                  <MenuLink to={item.to} label={item.label} strong />
                </li>
              ),
            )}
          </ul>
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
