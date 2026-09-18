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
              className="group flex h-full items-center gap-3 rounded-(--radius-control) border border-line bg-surface p-3.5 transition-colors hover:border-ink"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-paper text-sm font-black tabular-nums group-hover:bg-cta">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block leading-tight font-extrabold">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {option.hint} · {option.toolCount} tools from {formatMoney(option.fromCents)}
                </span>
              </span>
              <Icon name="arrow" className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
