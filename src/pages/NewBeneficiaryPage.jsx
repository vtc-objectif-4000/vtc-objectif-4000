import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { BENEFICIARY_STATUSES, EXIT_OUTCOMES, USER_ROLES } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import { createBeneficiary, getBeneficiaryById, updateBeneficiary } from "@/services/beneficiaryService";
import { listFormateurs } from "@/services/userService";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  birth_year: "",
  phone: "",
  email: "",
  family_situation: "",
  children_count: 0,
  french_level_estimate: "",
  priority_needs: "",
  status: "actif",
  entry_date: new Date().toISOString().slice(0, 10),
  exit_date: "",
  exit_outcome: "",
  rgpd_consent: false,
  formateur_id: "",
};

export default function NewBeneficiaryPage({
  beneficiaryId = null,
  isEditMode = false,
}) {
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formateurs, setFormateurs] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (profile?.role === USER_ROLES.ADMIN) {
          const trainers = await listFormateurs();
          if (active) {
            setFormateurs(trainers);
          }
        }

        if (isEditMode && beneficiaryId) {
          const beneficiary = await getBeneficiaryById(beneficiaryId);
          if (!active) {
            return;
          }

          setFormState({
            first_name: beneficiary.first_name || "",
            last_name: beneficiary.last_name || "",
            birth_year: beneficiary.birth_year || "",
            phone: beneficiary.phone || "",
            email: beneficiary.email || "",
            family_situation: beneficiary.family_situation || "",
            children_count: beneficiary.children_count || 0,
            french_level_estimate: beneficiary.french_level_estimate || "",
            priority_needs: (beneficiary.priority_needs || []).join(", "),
            status: beneficiary.status || "actif",
            entry_date: beneficiary.entry_date || "",
            exit_date: beneficiary.exit_date || "",
            exit_outcome: beneficiary.exit_outcome || "",
            rgpd_consent: beneficiary.rgpd_consent,
            formateur_id: beneficiary.formateur_id || "",
          });
        }
      } catch (bootstrapError) {
        if (active) {
          setError(bootstrapError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [beneficiaryId, isEditMode, profile?.role]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Chargement de la fiche...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          {isEditMode ? "Modifier le beneficiaire" : "Nouveau beneficiaire"}
        </h1>
        <p className="page-subtitle">
          Consentement RGPD obligatoire, donnees limitees au strict necessaire et aucune donnee
          medicale sensible.
        </p>
      </div>

      <Card>
        <form
          className="space-y-8"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");

            try {
              const payload = {
                ...formState,
                formateur_id:
                  profile?.role === USER_ROLES.ADMIN
                    ? formState.formateur_id || null
                    : profile?.id,
              };

              const beneficiary = isEditMode
                ? await updateBeneficiary({
                    beneficiaryId,
                    values: payload,
                  })
                : await createBeneficiary({
                    values: payload,
                    organizationId: profile.organization_id,
                    actorId: profile.id,
                  });

              navigate(`/app/beneficiaries/${beneficiary.id}`);
            } catch (submitError) {
              setError(submitError.message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="field-label">Prenom</label>
              <input
                className="field-input"
                required
                value={formState.first_name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, first_name: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Nom</label>
              <input
                className="field-input"
                required
                value={formState.last_name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, last_name: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Annee de naissance</label>
              <input
                className="field-input"
                max={new Date().getFullYear()}
                min="1900"
                type="number"
                value={formState.birth_year}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, birth_year: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Telephone</label>
              <input
                className="field-input"
                required
                value={formState.phone}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Email facultatif</label>
              <input
                className="field-input"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Situation familiale</label>
              <input
                className="field-input"
                value={formState.family_situation}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    family_situation: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="field-label">Nombre d'enfants</label>
              <input
                className="field-input"
                min="0"
                type="number"
                value={formState.children_count}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, children_count: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Niveau de francais estime</label>
              <select
                className="field-input"
                value={formState.french_level_estimate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    french_level_estimate: event.target.value,
                  }))
                }
              >
                <option value="">Choisir</option>
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Statut</label>
              <select
                className="field-input"
                value={formState.status}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, status: event.target.value }))
                }
              >
                {BENEFICIARY_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Date d'entree</label>
              <input
                className="field-input"
                type="date"
                value={formState.entry_date}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, entry_date: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Date de sortie</label>
              <input
                className="field-input"
                type="date"
                value={formState.exit_date}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, exit_date: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Sortie vers</label>
              <select
                className="field-input"
                value={formState.exit_outcome}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, exit_outcome: event.target.value }))
                }
              >
                {EXIT_OUTCOMES.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {profile?.role === USER_ROLES.ADMIN ? (
              <div>
                <label className="field-label">Formateur attribue</label>
                <select
                  className="field-input"
                  value={formState.formateur_id}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, formateur_id: event.target.value }))
                  }
                >
                  <option value="">Selectionner un formateur</option>
                  {formateurs.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.first_name} {trainer.last_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div>
            <label className="field-label">Besoins prioritaires</label>
            <textarea
              className="field-textarea"
              placeholder="Exemple : ecole, emploi, numerique, demarches CAF"
              value={formState.priority_needs}
              onChange={(event) =>
                setFormState((current) => ({ ...current, priority_needs: event.target.value }))
              }
            />
          </div>

          <div className="rounded-[24px] bg-sand-50 p-5">
            <label className="flex items-start gap-4 text-sm leading-7 text-slate-700">
              <input
                checked={formState.rgpd_consent}
                className="mt-2"
                required
                type="checkbox"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    rgpd_consent: event.target.checked,
                  }))
                }
              />
              <span>
                Je confirme que le consentement RGPD a ete recueilli pour cette fiche, que les
                donnees sont minimales et qu'aucune donnee medicale sensible n'est saisie.
              </span>
            </label>
          </div>

          {error ? (
            <div className="rounded-[20px] border border-coral-200 bg-coral-100/70 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={saving} type="submit">
              {saving
                ? "Enregistrement..."
                : isEditMode
                  ? "Mettre a jour la fiche"
                  : "Creer la fiche"}
            </Button>
            <Button to="/app/beneficiaries" variant="secondary">
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
