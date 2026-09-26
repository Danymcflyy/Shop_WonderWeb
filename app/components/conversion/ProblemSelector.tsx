import {Link} from 'react-router';
import {Icon} from '~/components/ui/Icon';
import {track} from '~/lib/analytics';
import {formatMoney} from '~/lib/money';

export type ProblemOption = {
  collection: string;
  label: string;
  hint: string;
  toolCount: number;
  fromCents: number;
};

export function ProblemSelector({options}: {options: ProblemOption[]}) {
  return (
    <nav aria-label="Shop by problem">
      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((option, i) => (
          <li key={option.collection}>
            <Link
              to={`/collections/${option.collection}`}
              prefetch="intent"
              onClick={() => track('select_problem', {universe: [option.collection], placement: 'home_hero'})}
              className="group flex h-full items-center gap-3 rounded-(--radius-control) border border-line bg-surface px-3 py-3 transition-colors hover:border-ink"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-paper text-xs font-black tabular-nums group-hover:bg-cta">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[15px] leading-tight font-extrabold" title={option.hint || undefined}>
                {option.label}
              </span>
              <span className="shrink-0 text-right text-xs leading-tight text-muted">
                from<br />
                <strong className="text-sm text-ink tabular-nums">{formatMoney(option.fromCents)}</strong>
              </span>
              <Icon name="arrow" className="hidden size-4 shrink-0 sm:block transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
