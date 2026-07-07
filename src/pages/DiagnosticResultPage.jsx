import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PriorityBadge from "@/components/PriorityBadge";
import { getBeneficiaryById } from "@/services/beneficiaryService";
import { getDiagnosticById } from "@/services/diagnosticService";
import { generatePathwayPlan } from "@/services/pathwayService";
import { formatDateTime } from "@/utils/formatters";

export default function DiagnosticResultPage() {
  const { beneficiaryId, diagnosticId } = useParams();
  const [beneficiary, setBeneficiary] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([getBeneficiaryById(beneficiaryId), getDiagnosticById(diagnosticId)])
      .then(([beneficiaryData, diagnosticData]) => {
        if (!active) {
          return;
        }
        setBeneficiary(beneficiaryData);
        setDiagnostic(diagnosticData);
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
  }, [beneficiaryId, diagnosticId]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Chargement du resultat...</p>
      </Card>
    );
  }

  if (error || !diagnostic) {
    return (
      <Card>
        <h3 className="text-2xl">Diagnostic introuvable</h3>
        <p className="mt-3 text-sm text-slate-600">{error || "Resultat indisponible."}</p>
      </Card>
    );
  }

  const pathway = generatePathwayPlan(diagnostic.diagnostic_scores || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Resultat du diagnostic</h1>
        <p className="page-subtitle">
          {beneficiary?.first_name} {beneficiary?.last_name} · diagnostic saisi le{" "}
          {formatDateTime(diagnostic.created_at)}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-pine-900 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-100">
            Scores
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Francais</p>
              <p className="mt-2 text-4xl">{diagnostic.french_average}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Numerique</p>
              <p className="mt-2 text-4xl">{diagnostic.digital_average}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Global</p>
              <p className="mt-2 text-4xl">{diagnostic.overall_average}</p>
            </div>
          </div>
          {diagnostic.summary ? (
            <p className="mt-5 text-sm leading-7 text-white/75">{diagnostic.summary}</p>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
                Parcours genere
              </p>
              <h2 className="mt-2 text-3xl">Modules recommandes</h2>
            </div>
            <Button to={`/app/beneficiaries/${beneficiaryId}/modules`}>Ouvrir les modules</Button>
          </div>
          <div className="mt-6 space-y-4">
            {pathway.assignedModules.map((assignment) => (
              <div key={assignment.moduleCode} className="rounded-[24px] border border-sand-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-pine-900">{assignment.moduleTitle}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Axes : {assignment.sourceAxes.join(", ")}
                    </p>
                  </div>
                  <PriorityBadge priority={assignment.priority} />
                </div>
              </div>
            ))}
            {pathway.acquiredModules.length > 0 ? (
              <div className="rounded-[24px] bg-sand-50 p-4">
                <p className="field-label">Axes deja acquis</p>
                <div className="flex flex-wrap gap-2">
                  {pathway.acquiredModules.map((moduleItem) => (
                    <span
                      key={moduleItem.moduleCode}
                      className="rounded-full bg-white px-3 py-2 text-sm font-medium text-pine-900"
                    >
                      {moduleItem.moduleTitle}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
          Detail des 10 axes
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(diagnostic.diagnostic_scores || []).map((score) => (
            <div key={score.axis_code} className="rounded-[24px] bg-sand-50 p-4">
              <p className="font-semibold text-pine-900">{score.axis_label}</p>
              <p className="mt-2 text-3xl text-pine-900">{score.score}/5</p>
              {score.comment ? (
                <p className="mt-3 text-sm leading-7 text-slate-600">{score.comment}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
