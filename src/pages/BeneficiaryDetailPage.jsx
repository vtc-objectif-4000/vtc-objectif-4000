import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingState from "@/components/LoadingState";
import Pill from "@/components/Pill";
import PriorityBadge from "@/components/PriorityBadge";
import { useAppContext } from "@/context/AppContext";
import { listBeneficiaryAttendance } from "@/services/attendanceService";
import { archiveBeneficiary, deleteBeneficiary, getBeneficiaryById } from "@/services/beneficiaryService";
import { listDiagnosticsForBeneficiary } from "@/services/diagnosticService";
import { listBeneficiaryModules } from "@/services/moduleService";
import { listNotesForBeneficiary } from "@/services/notesService";
import { USER_ROLES } from "@/config/appConfig";
import { formatDate, formatDateTime, fullName } from "@/utils/formatters";

export default function BeneficiaryDetailPage() {
  const { beneficiaryId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogState, setDialogState] = useState(null);
  const [beneficiary, setBeneficiary] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [modules, setModules] = useState([]);
  const [notes, setNotes] = useState([]);
  const [attendances, setAttendances] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      try {
        const [beneficiaryData, diagnosticsData, modulesData, notesData, attendanceData] =
          await Promise.all([
            getBeneficiaryById(beneficiaryId),
            listDiagnosticsForBeneficiary(beneficiaryId),
            listBeneficiaryModules(beneficiaryId),
            listNotesForBeneficiary(beneficiaryId),
            listBeneficiaryAttendance(beneficiaryId),
          ]);

        if (!active) {
          return;
        }

        setBeneficiary(beneficiaryData);
        setDiagnostics(diagnosticsData);
        setModules(modulesData);
        setNotes(notesData);
        setAttendances(attendanceData);
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

    loadDetail();
    return () => {
      active = false;
    };
  }, [beneficiaryId]);

  if (loading) {
    return <LoadingState label="Chargement de la fiche beneficiaire..." />;
  }

  if (error || !beneficiary) {
    return (
      <Card>
        <h3 className="text-2xl">Impossible d'ouvrir la fiche</h3>
        <p className="mt-3 text-sm text-slate-600">{error || "Fiche introuvable."}</p>
      </Card>
    );
  }

  const latestDiagnostic = diagnostics[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">
              {beneficiary.first_name} {beneficiary.last_name}
            </h1>
            <Pill className="bg-sand-100 text-pine-900">{beneficiary.status}</Pill>
            {beneficiary.rgpd_consent ? <Pill>Consentement recueilli</Pill> : null}
          </div>
          <p className="page-subtitle">
            Fiche detail complete avec diagnostic, parcours, competences, notes et historique des
            presences.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button to={`/app/beneficiaries/${beneficiary.id}/edit`} variant="secondary">
            Modifier
          </Button>
          <Button to={`/app/beneficiaries/${beneficiary.id}/diagnostics/new`}>
            Nouveau diagnostic
          </Button>
          <Button to={`/app/beneficiaries/${beneficiary.id}/notes`} variant="ghost">
            Ajouter une note
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDialogState({ type: "archive", beneficiaryId: beneficiary.id })}
          >
            {beneficiary.status === "archive" ? "Restaurer" : "Archiver"}
          </Button>
          {profile?.role === USER_ROLES.ADMIN ? (
            <Button
              variant="danger"
              onClick={() => setDialogState({ type: "delete", beneficiaryId: beneficiary.id })}
            >
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Identite et suivi
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p>Telephone : {beneficiary.phone}</p>
            <p>Email : {beneficiary.email || "Non renseigne"}</p>
            <p>Entree : {formatDate(beneficiary.entry_date)}</p>
            <p>Sortie : {beneficiary.exit_date ? formatDate(beneficiary.exit_date) : "Non renseignee"}</p>
            <p>Francais estime : {beneficiary.french_level_estimate || "Non renseigne"}</p>
            <p>Formateur : {fullName(beneficiary.formateur) || "Non attribue"}</p>
            <p>Situation familiale : {beneficiary.family_situation || "Non renseignee"}</p>
            <p>Nombre d'enfants : {beneficiary.children_count ?? "Non renseigne"}</p>
          </div>
          {beneficiary.priority_needs?.length ? (
            <div className="mt-4">
              <p className="field-label">Besoins prioritaires</p>
              <div className="flex flex-wrap gap-2">
                {beneficiary.priority_needs.map((need) => (
                  <Pill key={need} className="bg-sand-100 text-pine-900">
                    {need}
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="bg-pine-900 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-100">
            Dernier diagnostic
          </p>
          {latestDiagnostic ? (
            <>
              <h2 className="mt-3 text-3xl text-white">
                Moyenne globale {latestDiagnostic.overall_average}/5
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Francais</p>
                  <p className="mt-2 text-3xl">{latestDiagnostic.french_average}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Numerique</p>
                  <p className="mt-2 text-3xl">{latestDiagnostic.digital_average}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Date</p>
                  <p className="mt-2 text-lg">{formatDate(latestDiagnostic.created_at)}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-white/75">Aucun diagnostic enregistre pour le moment.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
                Modules assignes
              </p>
              <h2 className="mt-2 text-3xl">Parcours et progression</h2>
            </div>
            <Button to={`/app/beneficiaries/${beneficiary.id}/modules`} variant="secondary">
              Voir les modules
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {modules.length === 0 ? (
              <p className="text-sm text-slate-600">Aucun module assigne pour le moment.</p>
            ) : (
              modules.map((moduleItem) => (
                <div key={moduleItem.id} className="rounded-[24px] border border-sand-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-pine-900">{moduleItem.module?.title}</p>
                      <p className="text-sm text-slate-600">
                        {moduleItem.completedSkills}/{moduleItem.totalSkills} competences validees
                      </p>
                    </div>
                    <PriorityBadge priority={moduleItem.priority} />
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-sand-100">
                    <div
                      className="h-full rounded-full bg-pine-500"
                      style={{ width: `${moduleItem.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Historique
          </p>
          <h2 className="mt-2 text-3xl">Diagnostics et notes</h2>
          <div className="mt-6 space-y-6">
            <div>
              <p className="field-label">Diagnostics precedents</p>
              <div className="space-y-3">
                {diagnostics.length === 0 ? (
                  <p className="text-sm text-slate-600">Pas encore d'historique de diagnostic.</p>
                ) : (
                  diagnostics.map((diagnostic) => (
                    <div
                      key={diagnostic.id}
                      className="flex flex-col gap-2 rounded-[20px] bg-sand-50 p-4 text-sm text-slate-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{formatDateTime(diagnostic.created_at)}</span>
                        <Button
                          size="sm"
                          to={`/app/beneficiaries/${beneficiary.id}/diagnostics/${diagnostic.id}`}
                          variant="ghost"
                        >
                          Voir
                        </Button>
                      </div>
                      <span>Moyenne globale : {diagnostic.overall_average}/5</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="field-label">Notes recentes</p>
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-600">Aucune note de suivi pour le moment.</p>
                ) : (
                  notes.slice(0, 4).map((note) => (
                    <div key={note.id} className="rounded-[20px] bg-sand-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-500">
                        {note.note_type}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{note.content}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDateTime(note.created_at)} · {fullName(note.author)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="field-label">Historique des presences</p>
              <div className="space-y-3">
                {attendances.length === 0 ? (
                  <p className="text-sm text-slate-600">Aucune presence enregistree.</p>
                ) : (
                  attendances.slice(0, 4).map((attendance) => (
                    <div key={attendance.id} className="rounded-[20px] bg-sand-50 p-4 text-sm">
                      <p className="font-semibold text-pine-900">{attendance.workshop?.title}</p>
                      <p className="mt-1 text-slate-600">
                        {formatDate(attendance.workshop?.workshop_date)} · {attendance.status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(dialogState)}
        title={dialogState?.type === "delete" ? "Supprimer cette fiche" : "Archiver cette fiche"}
        description={
          dialogState?.type === "delete"
            ? "La suppression efface la fiche et ses donnees dependantes. A reserver aux administrateurs."
            : "L'archivage retire la fiche du portefeuille actif sans perdre l'historique."
        }
        confirmLabel={dialogState?.type === "delete" ? "Supprimer" : "Confirmer"}
        onCancel={() => setDialogState(null)}
        onConfirm={async () => {
          try {
            if (dialogState?.type === "delete") {
              await deleteBeneficiary(beneficiary.id);
              navigate("/app/beneficiaries");
            } else {
              await archiveBeneficiary(beneficiary.id, beneficiary.status !== "archive");
              navigate(0);
            }
          } catch (dialogError) {
            setError(dialogError.message);
          } finally {
            setDialogState(null);
          }
        }}
      />
    </div>
  );
}
