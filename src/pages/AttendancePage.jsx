import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { ATTENDANCE_STATUSES } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import { updateAttendanceStatus } from "@/services/attendanceService";
import { getWorkshopById } from "@/services/workshopService";
import { formatDate, fullName } from "@/utils/formatters";

export default function AttendancePage() {
  const { workshopId } = useParams();
  const { profile } = useAppContext();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draftNotes, setDraftNotes] = useState({});
  const [busyId, setBusyId] = useState("");

  async function loadWorkshop() {
    const data = await getWorkshopById(workshopId);
    setWorkshop(data);
    setDraftNotes(
      Object.fromEntries(
        (data.workshop_participants || []).flatMap((participant) =>
          (participant.attendances || []).map((attendance) => [attendance.id, attendance.note || ""]),
        ),
      ),
    );
  }

  useEffect(() => {
    let active = true;

    loadWorkshop()
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
  }, [workshopId]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Chargement de l'atelier...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Presences</h1>
        <p className="page-subtitle">
          {workshop?.title} · {formatDate(workshop?.workshop_date)} · boutons de presence sans
          prompt ni nouvelle fenetre.
        </p>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-coral-500">{error}</p>
        </Card>
      ) : null}

      <div className="space-y-4">
        {(workshop?.workshop_participants || []).map((participant) => {
          const attendance = participant.attendances?.[0];
          if (!attendance) {
            return null;
          }

          return (
            <Card key={participant.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl">{fullName(participant.beneficiary)}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Statut actuel : <strong>{attendance.status}</strong>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_STATUSES.map((status) => (
                      <Button
                        key={status.value}
                        disabled={busyId === attendance.id}
                        size="sm"
                        variant={attendance.status === status.value ? "primary" : "secondary"}
                        onClick={async () => {
                          setBusyId(attendance.id);
                          try {
                            await updateAttendanceStatus({
                              attendanceId: attendance.id,
                              status: status.value,
                              note: draftNotes[attendance.id] || "",
                              actorId: profile.id,
                            });
                            await loadWorkshop();
                          } catch (statusError) {
                            setError(statusError.message);
                          } finally {
                            setBusyId("");
                          }
                        }}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="field-label">Commentaire de presence</label>
                  <textarea
                    className="field-textarea min-h-[100px]"
                    value={draftNotes[attendance.id] || ""}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [attendance.id]: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
