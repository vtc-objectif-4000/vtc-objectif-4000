import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import StatBox from "@/components/StatBox";
import { listBeneficiaries } from "@/services/beneficiaryService";
import { fetchImpactStats } from "@/services/statsService";
import { listWorkshops } from "@/services/workshopService";
import { formatDate, fullName } from "@/utils/formatters";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [statsData, beneficiariesData, workshopsData] = await Promise.all([
          fetchImpactStats(),
          listBeneficiaries({ includeArchived: false }),
          listWorkshops(),
        ]);

        if (!active) {
          return;
        }

        setStats(statsData);
        setBeneficiaries(beneficiariesData.slice(0, 5));
        setWorkshops(workshopsData.slice(0, 4));
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Chargement du tableau de bord..." />;
  }

  if (error) {
    return (
      <Card>
        <h3 className="text-2xl">Impossible de charger le tableau de bord</h3>
        <p className="mt-3 text-sm text-slate-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">
          Les indicateurs sont calcules depuis les donnees saisies en base et non depuis des
          chiffres fixes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Beneficiaires actifs" value={stats?.activeBeneficiaries || 0} />
        <StatBox label="Diagnostics" value={stats?.diagnosticsCount || 0} />
        <StatBox
          label="Taux de presence"
          value={`${stats?.attendanceRate || 0}%`}
          helper="Presences et retards / presences renseignees"
        />
        <StatBox
          label="Competences validees"
          value={stats?.validatedSkillsTotal || 0}
          helper="Validation par beneficiaire"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
                Beneficiaires recents
              </p>
              <h2 className="mt-2 text-3xl">Portefeuille actif</h2>
            </div>
            <Button to="/app/beneficiaries">Voir tous les beneficiaires</Button>
          </div>
          {beneficiaries.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Aucune fiche active"
                description="Commencez par creer une fiche beneficiaire avec consentement RGPD."
                actionLabel="Creer une fiche"
                actionTo="/app/beneficiaries/new"
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {beneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-sand-100 bg-sand-50/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-pine-900">
                      {beneficiary.first_name} {beneficiary.last_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      Entree le {formatDate(beneficiary.entry_date)} · Formateur{" "}
                      {fullName(beneficiary.formateur) || "Non attribue"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button to={`/app/beneficiaries/${beneficiary.id}`} variant="secondary">
                      Ouvrir la fiche
                    </Button>
                    <Button to={`/app/beneficiaries/${beneficiary.id}/diagnostics/new`}>
                      Nouveau diagnostic
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
                Ateliers
              </p>
              <h2 className="mt-2 text-3xl">Suivi des sessions</h2>
            </div>
            <Button to="/app/workshops" variant="secondary">
              Gerer les ateliers
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {workshops.length === 0 ? (
              <p className="text-sm text-slate-600">Aucun atelier programme pour le moment.</p>
            ) : (
              workshops.map((workshop) => (
                <div key={workshop.id} className="rounded-[24px] border border-sand-100 p-4">
                  <p className="font-semibold text-pine-900">{workshop.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(workshop.workshop_date)} · {workshop.workshop_time || "Horaire a definir"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {(workshop.workshop_participants || []).length} participant(s)
                  </p>
                  <div className="mt-3">
                    <Button to={`/app/workshops/${workshop.id}/attendance`} variant="ghost">
                      Faire l'appel
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
