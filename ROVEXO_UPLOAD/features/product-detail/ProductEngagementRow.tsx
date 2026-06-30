type ProductEngagementRowProps = {
  views: number;
  saves: number;
};

export function ProductEngagementRow({ views, saves }: ProductEngagementRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-ds-5 gap-y-ds-2 text-sm text-text-secondary">
      <span className="inline-flex min-h-ds-7 items-center gap-ds-2">
        <span aria-hidden>👁</span>
        <span>{views.toLocaleString()} Views</span>
      </span>
      <span className="inline-flex min-h-ds-7 items-center gap-ds-2">
        <span aria-hidden>❤️</span>
        <span>{saves.toLocaleString()} Saves</span>
      </span>
    </div>
  );
}
