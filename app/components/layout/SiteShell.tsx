import {useCallback, useState, type ReactNode} from 'react';
import type {Campaign, CatalogIndex} from '~/lib/catalog/types';
import {CartProvider} from '~/components/cart/CartProvider';
import {CartDrawer} from '~/components/cart/CartDrawer';
import {AnnouncementBar} from '~/components/conversion/AnnouncementBar';
import {SiteHeader} from '~/components/layout/SiteHeader';
import {SiteFooter} from '~/components/layout/SiteFooter';
import {MobileMenu} from '~/components/layout/MobileMenu';
import {useCurrentUniverse} from '~/lib/use-universe';
import {RouteAnalytics} from '~/lib/analytics';

export function SiteShell({
  children,
  index,
  campaign,
  catalogSource,
  checkoutEnabled,
}: {
  children: ReactNode;
  index: CatalogIndex;
  campaign: Campaign | null;
  catalogSource: 'mock' | 'shopify';
  checkoutEnabled: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const universe = useCurrentUniverse();

  return (
    <CartProvider index={index} campaign={campaign} catalogSource={catalogSource} checkoutEnabled={checkoutEnabled}>
      {/* Sets the CTA accent for the whole page (see tailwind.css). */}
      <div data-universe={universe?.id ?? 'pro'} className="contents">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <AnnouncementBar campaign={campaign} />
      {catalogSource === 'mock' ? (
        <p role="status" className="border-b border-line bg-highlight px-4 py-1.5 text-center text-xs font-bold text-ink">
          Preview mode — draft catalogue, demo offers and checkout not yet activated.
        </p>
      ) : null}
      <SiteHeader onOpenMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <main id="main">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <RouteAnalytics />
      </div>
    </CartProvider>
  );
}
