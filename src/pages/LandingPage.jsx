import { Link } from "react-router-dom";
import { APP_CONFIG } from "@/config/appConfig";
import { LANDING_IMPACT_EXAMPLES, PILLARS } from "@/data/demoData";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Pill from "@/components/Pill";

const BENEFITS = {
  familles: [
    "Un parcours clair axe sur les besoins reels du quotidien.",
    "Des modules concrets relies a l'ecole, la sante, le travail et le numerique.",
    "Une progression visible, partageable et documentee.",
  ],
  associations: [
    "Une vue staff par role pour suivre les familles attribuees.",
    "Des ateliers, presences, notes et exports harmonises.",
    "Une base de donnees cloisonnee par organisation et prete pour le reporting.",
  ],
  financeurs: [
    "Des statistiques d'impact explicables a partir des donnees reelles saisies.",
    "Des exports CSV propres pour les reportings Excel francais.",
    "Un positionnement serieux, RGPD et presentable a un partenaire.",
  ],
};

export default function LandingPage() {
  return (
    <div className="bg-sand-50 text-slate-800">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/70 bg-white/80 px-6 py-5 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Pill>Application metier</Pill>
              <p className="text-sm font-medium text-slate-600">
                {APP_CONFIG.demoBannerText}
              </p>
            </div>
            <Button to="/login">Connexion espace staff</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-[40px] border border-white/70 bg-white/85 p-8 shadow-float backdrop-blur sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-coral-500">
            Logix Famille
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-tight text-pine-900 sm:text-7xl">
            Piloter l'accompagnement des familles avec une application claire, serieuse et
            mesurable.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Logix Famille aide les associations a suivre les beneficiaires, realiser des
            diagnostics, generer des parcours, valider des competences, gerer les ateliers et
            produire des statistiques d'impact presentables a des partenaires et financeurs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" to="/login">
              Ouvrir l'espace staff
            </Button>
            <Button size="lg" to="/app/rgpd" variant="secondary">
              Lire l'engagement RGPD
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {LANDING_IMPACT_EXAMPLES.map((item) => (
              <Card key={item.label} className="bg-pine-900 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                  {item.label}
                </p>
                <p className="mt-3 font-serif text-4xl">{item.value}</p>
                <p className="mt-2 text-sm text-white/70">{item.caption}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-brand-glow">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-coral-500">
              Methode
            </p>
            <h2 className="mt-3 text-3xl">Du diagnostic au reporting financeur</h2>
            <ol className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
              <li>1. Creer une fiche beneficiaire avec consentement obligatoire.</li>
              <li>2. Noter les 10 axes sur mobile ou ordinateur.</li>
              <li>3. Generer un parcours personnalise module par module.</li>
              <li>4. Suivre les competences, notes, ateliers et presences.</li>
              <li>5. Exporter les donnees et les statistiques en CSV Excel FR.</li>
            </ol>
          </Card>
          <Card>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-coral-500">
              6 piliers
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {PILLARS.map((pillar) => (
                <Pill key={pillar} className="bg-sand-100 text-pine-900">
                  {pillar}
                </Pill>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {Object.entries(BENEFITS).map(([key, items]) => (
            <Card key={key} className="bg-white/85">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-coral-500">
                {key === "familles"
                  ? "Pour les familles"
                  : key === "associations"
                    ? "Pour les associations"
                    : "Pour les financeurs"}
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="rounded-[36px] bg-pine-900 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-coral-100">
                Contact
              </p>
              <h2 className="mt-3 text-4xl text-white">Une base professionnelle pour un vrai MVP</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Cette version vise une presentation propre a une association, un partenaire, un
                financeur ou un developpeur. Les chiffres affiches ici sont des exemples de
                demonstration et non des resultats reels.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to="/login">Connexion</Button>
              <a
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                href={`mailto:${APP_CONFIG.supportEmail}`}
              >
                {APP_CONFIG.supportEmail}
              </a>
            </div>
          </div>
          <div className="mt-8 text-xs uppercase tracking-[0.2em] text-white/60">
            <Link to="/rgpd">Consulter la page RGPD</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
