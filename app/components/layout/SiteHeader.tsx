import {useEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router';
import {MAIN_NAV, SITE, type NavItem} from '~/lib/site';
import {formatMoney} from '~/lib/money';
import {useCart} from '~/components/cart/CartProvider';
import {Icon} from '~/components/ui/Icon';

export function SiteHeader({onOpenMenu}: {onOpenMenu: () => void}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/97 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-2 grid size-10 place-items-center rounded-md hover:bg-paper lg:hidden"
          aria-label="Open menu"
        >
          <Icon name="menu" className="size-5" />
        </button>

        <Link to="/" prefetch="intent" className="flex items-center gap-2" aria-label={`${SITE.name} home`}>
          <span className="grid size-8 place-items-center rounded-md bg-cta text-ink" aria-hidden>
            <Icon name="bolt" className="size-4.5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-black tracking-tight">{SITE.name}</span>
        </Link>

        <p className="ml-3 hidden text-[13px] font-semibold text-muted xl:block">{SITE.promise}</p>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/collections/bundles" prefetch="intent" className="btn-ghost hidden sm:inline-flex">
            Save with bundles
          </Link>
          <CartButton />
        </div>
      </div>

      <DesktopNav />
      <MobileCategoryRail />
    </header>
  );
}

function CartButton() {
  const {lines, totals, open, ready} = useCart();
  const count = ready ? lines.length : 0;
  const [pop, setPop] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    const grew = count > previous.current;
    previous.current = count;
    if (!grew) return;
    setPop(true);
    const id = window.setTimeout(() => setPop(false), 350);
    return () => window.clearTimeout(id);
  }, [count]);

  return (
    <button
      type="button"
      onClick={() => open('header')}
      className="relative inline-flex items-center gap-2 rounded-(--radius-control) border-[1.5px] border-ink bg-surface px-3 py-2 text-sm font-extrabold hover:bg-paper"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <Icon name="cart" className="size-5" />
      <span className="hidden tabular-nums sm:inline">{count > 0 ? formatMoney(totals.totalCents) : 'Cart'}</span>
      <span
        className={`grid min-w-5 place-items-center rounded-full px-1 text-[11px] leading-5 tabular-nums ${count > 0 ? 'bg-cta text-ink' : 'bg-paper text-muted'} ${pop ? 'animate-pop' : ''}`}
      >
        {count}
      </span>
    </button>
  );
}

const navLinkClass = ({isActive}: {isActive: boolean}) =>
  `relative whitespace-nowrap py-3 text-sm font-bold transition-colors hover:text-ink ${isActive ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-cta' : 'text-ink/70'}`;

function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden border-t border-line lg:block">
      <ul className="container-page flex items-center gap-6">
        {MAIN_NAV.map((item) => (
          <li key={item.label}>
            {item.children ? <NavDropdown item={item} /> : (
              <NavLink to={item.to} prefetch="intent" className={navLinkClass}>
                {item.label}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavDropdown({item}: {item: NavItem}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = item.children!.some((child) => location.pathname === child.to);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 ${navLinkClass({isActive: active})}`}
      >
        {item.label}
        <Icon name="chevron" className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <ul className="card absolute top-full left-0 z-40 mt-1 w-60 animate-fade-in p-1.5 shadow-card">
          {item.children!.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                prefetch="intent"
                className={({isActive}) =>
                  `block rounded-md px-3 py-2 text-sm font-semibold hover:bg-paper ${isActive ? 'bg-paper' : ''}`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Mobile: problem navigation stays one swipe away, no menu needed. */
function MobileCategoryRail() {
  const items = MAIN_NAV.filter((item) => !item.children);
  return (
    <nav aria-label="Categories" className="border-t border-line lg:hidden">
      <ul className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {items.map((item) => (
          <li key={item.to} className="shrink-0">
            <NavLink
              to={item.to}
              prefetch="intent"
              className={({isActive}) =>
                `block rounded-full border px-3 py-1.5 text-[13px] font-bold whitespace-nowrap ${isActive ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
