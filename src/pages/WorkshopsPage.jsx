import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAppContext } from "@/context/AppContext";
import { listBeneficiaryOptions } from "@/services/beneficiaryService";
import { listModuleCatalog } from "@/services/moduleService";
import { createWorkshop, deleteWorkshop, listWorkshops } from "@/services/workshopService";
import { formatDate, fullName } from "@/utils/formatters";

const EMPTY_FORM = {
  title: "",
  module_id: "",
  module_code: "",
  workshop_date: new Date().toISOString().slice(0, 10),
  workshop_time: "09:30",
  location: "",
  capacity: "",
  notes: "",
  beneficiaryIds: [],
};

export default function WorkshopsPage() {
  const { profile } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [modules, setModules] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [dialogState, setDialogState] = useState(null);

  async function loadWorkshopsPage() {
    const [workshopsData, beneficiariesData, modulesData] = await Promise.all([
      listWorkshops(),
      listBeneficiaryOptions(),
      listModuleCatalog(),
    ]);

    setWorkshops(workshopsData);
    setBeneficiaries(beneficiariesData);
    setModules(modulesData);
  }

  useEffect(() => {
    let active = true;

    loadWorkshopsPage()
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Ateliers et presences</h1>
        <p className="page-subtitle">
          Creation d'ateliers, selection des participants et acces a une vraie interface d'appel.
        </p>
      </div>

      <Card>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
          Nouvel atelier
        </p>
        <form
          className="mt-6 space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");

            try {
              await createWorkshop({
                values: formState,
                organizationId: profile.organization_id,
                facilitatorId: profile.id,
              });
              setFormState(EMPTY_FORM);
              await loadWorkshopsPage();
            } catch (submitError) {
              setError(submitError.message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="field-label">Titre</label>
              <input
                className="field-input"
                required
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Date</label>
              <input
                className="field-input"
                required
                type="date"
                value={formState.workshop_date}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, workshop_date: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Heure</label>
              <input
                className="field-input"
                required
                type="time"
                value={formState.workshop_time}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, workshop_time: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Module</label>
              <select
                className="field-input"
                value={formState.module_id}
                onChange={(event) => {
                  const nextModule = modules.find((item) => item.id === event.target.value);
                  setFormState((current) => ({
                    ...current,
                    module_id: nextModule?.id || "",
                    module_code: nextModule?.code || "",
                  }));
                }}
              >
                <option value="">Aucun module</option>
                {modules.map((moduleItem) => (
                  <option key={moduleItem.id} value={moduleItem.id}>
                    {moduleItem.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Lieu</label>
              <input
                className="field-input"
                value={formState.location}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, location: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">Capacite</label>
              <input
                className="field-input"
                min="1"
                type="number"
                value={formState.capacity}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, capacity: event.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="field-label">Participants</label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {beneficiaries.map((beneficiary) => {
                const checked = formState.beneficiaryIds.includes(beneficiary.id);
                return (
                  <label
                    key={beneficiary.id}
                    className="flex items-center gap-3 rounded-[20px] border border-sand-100 bg-sand-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      checked={checked}
                      type="checkbox"
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          beneficiaryIds: event.target.checked
                            ? [...current.beneficiaryIds, beneficiary.id]
                            : current.beneficiaryIds.filter((item) => item !== beneficiary.id),
                        }))
                      }
                    />
                    {beneficiary.last_name} {beneficiary.first_name}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="field-label">Notes d'atelier</label>
            <textarea
              className="field-textarea"
              value={formState.notes}
              onChange={(event) =>
                setFormState((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>

          {error ? (
            <div className="rounded-[20px] border border-coral-200 bg-coral-100/70 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          ) : null}

          <Button disabled={saving} type="submit">
            {saving ? "Creation..." : "Creer l'atelier"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <p className="text-sm text-slate-600">Chargement des ateliers...</p>
          </Card>
        ) : (
          workshops.map((workshop) => (
            <Card key={workshop.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-3xl">{workshop.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(workshop.workshop_date)} · {workshop.workshop_time || "Horaire non renseigne"} ·{" "}
                    {workshop.location || "Lieu a confirmer"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Module : {workshop.module?.title || "Aucun"} · Formateur :{" "}
                    {fullName(workshop.facilitator) || "Non renseigne"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {(workshop.workshop_participants || []).length} participant(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button to={`/app/workshops/${workshop.id}/attendance`} variant="secondary">
                    Faire l'appel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setDialogState({ workshopId: workshop.id })}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialogState)}
        title="Supprimer cet atelier"
        description="Les inscriptions et presences associees seront supprimees."
        onCancel={() => setDialogState(null)}
        onConfirm={async () => {
          try {
            await deleteWorkshop(dialogState.workshopId);
            setDialogState(null);
            await loadWorkshopsPage();
          } catch (dialogError) {
            setError(dialogError.message);
          }
        }}
      />
    </div>
  );
}
