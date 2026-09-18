import {useCallback, useState, type ReactNode} from 'react';
import type {Campaign, CatalogIndex} from '~/lib/catalog/types';
import {CartProvider} from '~/components/cart/CartProvider';
import {CartDrawer} from '~/components/cart/CartDrawer';
import {AnnouncementBar} from '~/components/conversion/AnnouncementBar';
import {SiteHeader} from '~/components/layout/SiteHeader';
import {SiteFooter} from '~/components/layout/SiteFooter';
import {MobileMenu} from '~/components/layout/MobileMenu';

export function SiteShell({
  children,
  index,
  campaign,
  catalogSource,
}: {
  children: ReactNode;
  index: CatalogIndex;
  campaign: Campaign | null;
  catalogSource: 'mock' | 'shopify';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <CartProvider index={index} campaign={campaign} catalogSource={catalogSource}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <AnnouncementBar campaign={campaign} />
      <SiteHeader onOpenMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <main id="main">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </CartProvider>
  );
}
