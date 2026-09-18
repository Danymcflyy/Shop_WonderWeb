import type {ReactNode} from 'react';

export function SectionHeading({
  kicker,
  title,
  intro,
  action,
  id,
}: {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="kicker">{kicker}</p>
        <h2 id={id} className="h-section mt-2">
          {title}
        </h2>
        {intro ? <p className="mt-2 text-[15px] text-ink/70">{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}
