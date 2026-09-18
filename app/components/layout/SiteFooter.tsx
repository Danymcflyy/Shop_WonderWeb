import {Link} from 'react-router';
import {MAIN_NAV, SITE} from '~/lib/site';
import {TrustStrip} from '~/components/conversion/TrustStrip';

export function SiteFooter() {
  const problems = MAIN_NAV.filter((item) => !item.children);
  const business = MAIN_NAV.find((item) => item.children)?.children ?? [];

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page border-b border-line py-5">
        <TrustStrip />
      </div>
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-black">{SITE.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink/70">
            Practical tools for small businesses and independent professionals. {SITE.promise}
          </p>
        </div>
        <FooterColumn title="Shop by problem" links={problems.map((i) => ({label: i.label, to: i.to}))} />
        <FooterColumn title="By business type" links={business.map((i) => ({label: i.label, to: i.to}))} />
        <FooterColumn
          title="Help"
          links={[
            {label: 'Delivery & file formats', to: '/#faq'},
            {label: 'Refund policy', to: '/policies/refund-policy'},
            {label: 'Terms of service', to: '/policies/terms-of-service'},
            {label: 'Privacy policy', to: '/policies/privacy-policy'},
          ]}
        />
      </div>
      <div className="container-page flex flex-wrap justify-between gap-2 border-t border-line py-4 text-xs text-muted">
        <span>© {new Date().getFullYear()} {SITE.name}. Prices in EUR.</span>
        <span>Checkout and payment handled securely by Shopify.</span>
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
