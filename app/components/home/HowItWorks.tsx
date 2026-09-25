import {Icon} from '~/components/ui/Icon';

export function HowItWorks() {
  return (
    <section className="container-page pb-12">
      <div className="card grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="kicker">How it works</p>
          <h2 className="h-section mt-2">From checkout to using the tool: about two minutes.</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {icon: 'tag', title: 'Pick a tool or a bundle', text: 'Each page shows exactly which files you get and which software they open in.'},
            {icon: 'lock', title: 'Pay once with Shopify', text: 'Secure Shopify checkout. One payment, nothing renews.'},
            {icon: 'download', title: 'Download and use', text: 'The download link appears right after payment and arrives by email.'},
          ].map((step, i) => (
            <li key={step.title} className="rounded-(--radius-control) bg-paper p-4">
              <span className="flex items-center gap-2 text-sm font-black">
                <span className="grid size-7 place-items-center rounded-md bg-ink text-surface tabular-nums">{i + 1}</span>
                <Icon name={step.icon as 'tag'} className="size-4" />
              </span>
              <p className="mt-3 font-extrabold">{step.title}</p>
              <p className="mt-1 text-sm text-ink/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
