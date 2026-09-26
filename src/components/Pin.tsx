interface Props {
  rank: number;
  score: number;
  selected: boolean;
  closed?: boolean;
}

/** Numbered map pin. Colour shows the score band; the number matches the list. */
export function Pin({ rank, score, selected, closed }: Props) {
  const tone = closed
    ? 'bg-white text-muted border-line'
    : score >= 75
      ? 'bg-espresso text-white border-white'
      : score >= 55
        ? 'bg-crema text-white border-white'
        : 'bg-white text-roast border-roast/40';
  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 font-display font-bold shadow-md transition-transform tabular-nums ${tone} ${
        selected ? 'h-10 w-10 scale-110 text-base ring-4 ring-crema/40' : 'h-8 w-8 text-sm'
      }`}
    >
      {rank}
    </div>
  );
}

export function UserDot() {
  return (
    <div className="relative h-4 w-4">
      <span className="absolute inset-0 animate-ping rounded-full bg-sky-500/40 motion-reduce:animate-none" />
      <span className="absolute inset-0 rounded-full border-2 border-white bg-sky-600 shadow" />
    </div>
  );
}
