import Card from "@/components/Card";
import { getRgpdContent } from "@/services/rgpdService";

export default function RgpdPage() {
  const rgpd = getRgpdContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">RGPD et securite</h1>
        <p className="page-subtitle">
          La conception privilegie la minimisation des donnees, le consentement obligatoire, les
          acces limites par role et la preparation a la tracabilite.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Principes
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
            {rgpd.principles.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Vigilances
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
            {rgpd.warnings.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
        <Card className="bg-pine-900 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-100">
            Application
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-white/80">
            <li>• Consentement bloque toute creation de fiche sans accord explicite.</li>
            <li>• Les notes sensibles sont filtrees par role lors des exports.</li>
            <li>• Les policies RLS limitent l'acces aux beneficiaires attribues.</li>
            <li>• Les actions critiques peuvent etre journalisees dans audit_logs.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
