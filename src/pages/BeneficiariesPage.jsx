import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import Pill from "@/components/Pill";
import { useAppContext } from "@/context/AppContext";
import { archiveBeneficiary, deleteBeneficiary, listBeneficiaries } from "@/services/beneficiaryService";
import { USER_ROLES } from "@/config/appConfig";
import { formatDate, fullName } from "@/utils/formatters";

export default function BeneficiariesPage() {
  const { profile } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [dialogState, setDialogState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadBeneficiaries(currentSearch = search, currentIncludeArchived = includeArchived) {
    setLoading(true);
    setError("");
    try {
      const data = await listBeneficiaries({
        includeArchived: currentIncludeArchived,
        search: currentSearch,
      });
      setBeneficiaries(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBeneficiaries("", true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Beneficiaires</h1>
          <p className="page-subtitle">
            Creation, edition, archivage, suppression et ouverture d'une vraie fiche detail.
          </p>
        </div>
        <Button to="/app/beneficiaries/new">Creer un beneficiaire</Button>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              className="field-input"
              placeholder="Rechercher un nom, un prenom ou un telephone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button
              onClick={() => {
                loadBeneficiaries(search, includeArchived);
              }}
            >
              Rechercher
            </Button>
          </div>
          <label className="flex items-center gap-3 rounded-2xl bg-sand-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              checked={includeArchived}
              type="checkbox"
              onChange={(event) => {
                const nextValue = event.target.checked;
                setIncludeArchived(nextValue);
                loadBeneficiaries(search, nextValue);
              }}
            />
            Inclure les archives
          </label>
        </div>
      </Card>

      {error ? (
        <Card>
          <p className="text-sm text-coral-500">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-600">Chargement des fiches...</p>
        </Card>
      ) : beneficiaries.length === 0 ? (
        <EmptyState
          title="Aucun beneficiaire trouve"
          description="Ajustez votre recherche ou creez une nouvelle fiche avec consentement."
          actionLabel="Creer un beneficiaire"
          actionTo="/app/beneficiaries/new"
        />
      ) : (
        <div className="space-y-4">
          {beneficiaries.map((beneficiary) => (
            <Card key={beneficiary.id} className="bg-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl">
                      {beneficiary.first_name} {beneficiary.last_name}
                    </h3>
                    <Pill className="bg-sand-100 text-pine-900">{beneficiary.status}</Pill>
                    {beneficiary.rgpd_consent ? (
                      <Pill className="bg-pine-50 text-pine-700">Consentement RGPD</Pill>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Entree : {formatDate(beneficiary.entry_date)}</p>
                    <p>Telephone : {beneficiary.phone}</p>
                    <p>Francais estime : {beneficiary.french_level_estimate || "Non renseigne"}</p>
                    <p>Formateur : {fullName(beneficiary.formateur) || "Non attribue"}</p>
                  </div>
                  {beneficiary.priority_needs?.length ? (
                    <p className="mt-3 text-sm text-slate-600">
                      Besoins prioritaires : {beneficiary.priority_needs.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button to={`/app/beneficiaries/${beneficiary.id}`} variant="secondary">
                    Ouvrir la fiche
                  </Button>
                  <Button to={`/app/beneficiaries/${beneficiary.id}/edit`} variant="ghost">
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setDialogState({
                        type: "archive",
                        beneficiary,
                      })
                    }
                  >
                    {beneficiary.status === "archive" ? "Restaurer" : "Archiver"}
                  </Button>
                  {profile?.role === USER_ROLES.ADMIN ? (
                    <Button
                      variant="danger"
                      onClick={() =>
                        setDialogState({
                          type: "delete",
                          beneficiary,
                        })
                      }
                    >
                      Supprimer
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(dialogState)}
        title={
          dialogState?.type === "delete"
            ? "Supprimer la fiche beneficiaire"
            : dialogState?.beneficiary?.status === "archive"
              ? "Restaurer la fiche"
              : "Archiver la fiche"
        }
        description={
          dialogState?.type === "delete"
            ? "La suppression supprime aussi les diagnostics, modules, presences et notes relies a cette fiche."
            : "L'archivage conserve l'historique et retire la fiche du portefeuille actif."
        }
        busy={busy}
        confirmLabel={dialogState?.type === "delete" ? "Supprimer definitivement" : "Confirmer"}
        onCancel={() => setDialogState(null)}
        onConfirm={async () => {
          if (!dialogState?.beneficiary) {
            return;
          }

          setBusy(true);
          try {
            if (dialogState.type === "delete") {
              await deleteBeneficiary(dialogState.beneficiary.id);
            } else {
              await archiveBeneficiary(
                dialogState.beneficiary.id,
                dialogState.beneficiary.status !== "archive",
              );
            }

            await loadBeneficiaries(search, includeArchived);
            setDialogState(null);
          } catch (dialogError) {
            setError(dialogError.message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
