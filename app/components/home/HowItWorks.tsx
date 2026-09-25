import {Icon} from '~/components/ui/Icon';

export function HowItWorks() {
  return (
    <section className="container-page pb-12">
      <div className="card grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="kicker">Comment ça marche</p>
          <h2 className="h-section mt-2">Choisissez un outil adapté à votre besoin.</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {icon: 'tag', title: 'Choisissez un outil ou un pack', text: 'Chaque fiche précise les fichiers inclus et leurs formats.'},
            {icon: 'lock', title: 'Réglez avec Shopify', text: 'Un paiement unique, sans abonnement.'},
            {icon: 'download', title: 'Utilisez vos fichiers', text: 'Ouvrez le guide de démarrage inclus dans chaque archive.'},
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
