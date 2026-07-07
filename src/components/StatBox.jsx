import Card from "./Card";

export default function StatBox({ label, value, helper }) {
  return (
    <Card className="h-full bg-white">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slategreen">
        {label}
      </p>
      <p className="mt-3 font-serif text-4xl text-pine-900">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </Card>
  );
}
