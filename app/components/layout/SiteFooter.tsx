import {Link} from 'react-router';
import {SITE, UNIVERSES} from '~/lib/site';
import {TrustStrip} from '~/components/conversion/TrustStrip';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page border-b border-line py-5">
        <TrustStrip />
      </div>
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-black">{SITE.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink/70">{SITE.promise}</p>
          <ul className="mt-4 space-y-1.5">
            {UNIVERSES.map((universe) => (
              <li key={universe.id} data-universe={universe.id}>
                <Link
                  to={universe.path}
                  prefetch="intent"
                  className="inline-flex items-center gap-2 text-sm font-extrabold hover:underline"
                >
                  <span aria-hidden className="size-2.5 bg-cta" />
                  WonderWeb {universe.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {UNIVERSES.map((universe) => (
          <FooterColumn
            key={universe.id}
            title={`${universe.label} — par besoin`}
            links={universe.nav
              .filter((item) => !item.children)
              .map((item) => ({label: item.label, to: item.to}))}
          />
        ))}
        <FooterColumn
          title="Aide"
          links={[
            {label: 'Livraison et formats', to: '/#faq'},
            {label: 'Politique de remboursement', to: '/policies/refund-policy'},
            {label: 'Conditions de vente', to: '/policies/terms-of-service'},
            {label: 'Politique de confidentialité', to: '/policies/privacy-policy'},
          ]}
        />
      </div>
      <div className="container-page flex flex-wrap justify-between gap-2 border-t border-line py-4 text-xs text-muted">
        <span>© {new Date().getFullYear()} {SITE.name}. Prix en euros.</span>
        <span>Commande et paiement sécurisés par Shopify.</span>
      </div>
    </footer>
  );
}

function FooterColumn({title, links}: {title: string; links: Array<{label: string; to: string}>}) {
  return (
    <div>
      <p className="text-xs font-extrabold tracking-[0.08em] uppercase">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link to={link.to} prefetch="intent" className="text-ink/75 hover:text-ink hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
