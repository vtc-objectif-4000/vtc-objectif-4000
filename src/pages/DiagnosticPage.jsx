import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { AXES, DIAGNOSTIC_LEVELS } from "@/data/axes";
import { useAppContext } from "@/context/AppContext";
import { getBeneficiaryById } from "@/services/beneficiaryService";
import { createDiagnostic } from "@/services/diagnosticService";

const INITIAL_SCORES = Object.fromEntries(
  AXES.map((axis) => [axis.id, { score: 1, comment: "" }]),
);

export default function DiagnosticPage() {
  const { beneficiaryId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const [beneficiary, setBeneficiary] = useState(null);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getBeneficiaryById(beneficiaryId)
      .then((data) => {
        if (active) {
          setBeneficiary(data);
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
  }, [beneficiaryId]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Chargement du beneficiaire...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Diagnostic 10 axes</h1>
        <p className="page-subtitle">
          Beneficiaire : {beneficiary?.first_name} {beneficiary?.last_name}. Saisie simple en 1 a 5
          avec priorisation automatique du parcours.
        </p>
      </div>

      <Card className="bg-white">
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");

            try {
              const result = await createDiagnostic({
                beneficiaryId,
                organizationId: profile.organization_id,
                createdBy: profile.id,
                summary,
                scores,
              });

              navigate(
                `/app/beneficiaries/${beneficiaryId}/diagnostics/${result.diagnostic.id}`,
              );
            } catch (submitError) {
              setError(submitError.message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-5 xl:grid-cols-2">
            {AXES.map((axis) => (
              <div key={axis.id} className="rounded-[26px] border border-sand-100 bg-sand-50/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
                      {axis.family}
                    </p>
                    <h3 className="mt-2 text-2xl">{axis.label}</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-pine-900">
                    {scores[axis.id].score}/5
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {DIAGNOSTIC_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        scores[axis.id].score === level.value
                          ? "bg-pine-900 text-white"
                          : "bg-white text-pine-900 ring-1 ring-sand-200 hover:bg-pine-50"
                      }`}
                      type="button"
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          [axis.id]: {
                            ...current[axis.id],
                            score: level.value,
                          },
                        }))
                      }
                    >
                      {level.value}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {DIAGNOSTIC_LEVELS.find((level) => level.value === scores[axis.id].score)?.helper}
                </p>
                <textarea
                  className="field-textarea mt-4 min-h-[100px]"
                  placeholder="Commentaire facultatif"
                  value={scores[axis.id].comment}
                  onChange={(event) =>
                    setScores((current) => ({
                      ...current,
                      [axis.id]: {
                        ...current[axis.id],
                        comment: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div>
            <label className="field-label">Synthese du diagnostic</label>
            <textarea
              className="field-textarea"
              placeholder="Synthese generale, objectifs du parcours, vigilance ou priorites."
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </div>

          {error ? (
            <div className="rounded-[20px] border border-coral-200 bg-coral-100/70 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={saving} type="submit">
              {saving ? "Enregistrement..." : "Valider et generer le parcours"}
            </Button>
            <Button to={`/app/beneficiaries/${beneficiaryId}`} variant="secondary">
              Retour a la fiche
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
