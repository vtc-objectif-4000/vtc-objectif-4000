import Button from "./Button";
import Card from "./Card";

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <Card className="border-dashed border-pine-100 bg-white/80 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slategreen">
        Aucun resultat
      </p>
      <h3 className="mt-3 font-serif text-3xl text-pine-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
        {description}
      </p>
      {actionLabel && actionTo ? (
        <div className="mt-6">
          <Button to={actionTo}>{actionLabel}</Button>
        </div>
      ) : null}
    </Card>
  );
}
