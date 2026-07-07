import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ConfirmDialog from "@/components/ConfirmDialog";
import { NOTE_TYPES, USER_ROLES } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import { getBeneficiaryById } from "@/services/beneficiaryService";
import { createNote, deleteNote, listNotesForBeneficiary } from "@/services/notesService";
import { formatDateTime, fullName } from "@/utils/formatters";

export default function NotesPage() {
  const { beneficiaryId } = useParams();
  const { profile } = useAppContext();
  const [beneficiary, setBeneficiary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogState, setDialogState] = useState(null);
  const [formState, setFormState] = useState({
    note_type: "general",
    content: "",
    is_sensitive: false,
  });

  async function loadNotesPage() {
    const [beneficiaryData, notesData] = await Promise.all([
      getBeneficiaryById(beneficiaryId),
      listNotesForBeneficiary(beneficiaryId),
    ]);
    setBeneficiary(beneficiaryData);
    setNotes(notesData);
  }

  useEffect(() => {
    let active = true;
    loadNotesPage()
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
        <p className="text-sm text-slate-600">Chargement des notes...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Notes de suivi</h1>
        <p className="page-subtitle">
          {beneficiary?.first_name} {beneficiary?.last_name}. Les notes restent internes, et les
          notes sensibles ne sont pas exportees en clair pour un formateur simple.
        </p>
      </div>

      <Card>
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            try {
              await createNote({
                values: {
                  beneficiary_id: beneficiaryId,
                  ...formState,
                },
                organizationId: profile.organization_id,
                authorId: profile.id,
                canCreateSensitiveNote: profile.role === USER_ROLES.ADMIN,
              });
              setFormState({
                note_type: "general",
                content: "",
                is_sensitive: false,
              });
              await loadNotesPage();
            } catch (submitError) {
              setError(submitError.message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label">Type de note</label>
              <select
                className="field-input"
                value={formState.note_type}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, note_type: event.target.value }))
                }
              >
                {NOTE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            {profile.role === USER_ROLES.ADMIN ? (
              <label className="flex items-center gap-3 rounded-[20px] bg-sand-50 px-4 py-3 text-sm text-slate-700">
                <input
                  checked={formState.is_sensitive}
                  type="checkbox"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      is_sensitive: event.target.checked,
                    }))
                  }
                />
                Marquer comme sensible
              </label>
            ) : null}
          </div>
          <div>
            <label className="field-label">Contenu</label>
            <textarea
              className="field-textarea"
              required
              value={formState.content}
              onChange={(event) =>
                setFormState((current) => ({ ...current, content: event.target.value }))
              }
            />
          </div>
          {error ? (
            <div className="rounded-[20px] border border-coral-200 bg-coral-100/70 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          ) : null}
          <Button disabled={saving} type="submit">
            {saving ? "Enregistrement..." : "Ajouter la note"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pine-900">
                    {note.note_type}
                  </span>
                  {note.is_sensitive ? (
                    <span className="rounded-full bg-coral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-coral-500">
                      Sensible
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">{note.content}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {formatDateTime(note.created_at)} · {fullName(note.author)}
                </p>
              </div>
              <Button variant="danger" onClick={() => setDialogState({ noteId: note.id })}>
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(dialogState)}
        title="Supprimer cette note"
        description="Cette action retire definitivement la note de suivi."
        onCancel={() => setDialogState(null)}
        onConfirm={async () => {
          try {
            await deleteNote(dialogState.noteId);
            setDialogState(null);
            await loadNotesPage();
          } catch (dialogError) {
            setError(dialogError.message);
          }
        }}
      />
    </div>
  );
}
