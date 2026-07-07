import { useEffect, useState } from "react";
import Card from "@/components/Card";
import LoadingState from "@/components/LoadingState";
import StatBox from "@/components/StatBox";
import { fetchImpactStats } from "@/services/statsService";

export default function ImpactStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchImpactStats()
      .then((data) => {
        if (active) {
          setStats(data);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Calcul des statistiques d'impact..." />;
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-coral-500">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Statistiques d'impact</h1>
        <p className="page-subtitle">
          Les indicateurs sont calcules depuis Supabase, avec progression, presences et
          competences validees par beneficiaire.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Total beneficiaires" value={stats.totalBeneficiaries} />
        <StatBox label="Beneficiaires actifs" value={stats.activeBeneficiaries} />
        <StatBox label="Diagnostics realises" value={stats.diagnosticsCount} />
        <StatBox label="Taux de presence" value={`${stats.attendanceRate}%`} />
        <StatBox label="Progression moyenne francais" value={stats.averageFrenchProgress} />
        <StatBox label="Progression moyenne numerique" value={stats.averageDigitalProgress} />
        <StatBox label="CV valides" value={stats.beneficiariesWithCvValidated} />
        <StatBox
          label="Sorties emploi / formation"
          value={stats.exitsToEmploymentOrTraining}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Competences cibles
          </p>
          <div className="mt-5 space-y-4 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-[20px] bg-sand-50 px-4 py-3">
              <span>Competences validees au total</span>
              <strong>{stats.validatedSkillsTotal}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[20px] bg-sand-50 px-4 py-3">
              <span>Competence administrative validee</span>
              <strong>{stats.beneficiariesWithAdministrativeSkill}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[20px] bg-sand-50 px-4 py-3">
              <span>Parents avec une competence ecole</span>
              <strong>{stats.parentsWithSchoolSkill}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[20px] bg-sand-50 px-4 py-3">
              <span>Beneficiaires avec une competence travail</span>
              <strong>{stats.beneficiariesWithWorkSkill}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Moyenne par axe
          </p>
          <div className="mt-5 space-y-4">
            {stats.axisAverages.map((axis) => (
              <div key={axis.axisId}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">{axis.label}</span>
                  <span className="font-semibold text-pine-900">{axis.average}/5</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-sand-100">
                  <div
                    className="h-full rounded-full bg-pine-500"
                    style={{ width: `${(axis.average / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
