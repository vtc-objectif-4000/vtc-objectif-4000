import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { USER_ROLES } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import {
  exportAttendancesCsv,
  exportBeneficiariesCsv,
  exportBeneficiaryModulesCsv,
  exportDiagnosticsCsv,
  exportImpactStatsCsv,
  exportNotesCsv,
  exportValidatedSkillsCsv,
} from "@/services/csvService";

const EXPORT_ACTIONS = [
  { key: "beneficiaires", label: "Exporter les beneficiaires", action: exportBeneficiariesCsv },
  { key: "diagnostics", label: "Exporter les diagnostics", action: exportDiagnosticsCsv },
  {
    key: "modules",
    label: "Exporter les modules par beneficiaire",
    action: exportBeneficiaryModulesCsv,
  },
  {
    key: "competences",
    label: "Exporter les competences validees",
    action: exportValidatedSkillsCsv,
  },
  { key: "presences", label: "Exporter les presences", action: exportAttendancesCsv },
  { key: "notes", label: "Exporter les notes autorisees", action: exportNotesCsv },
  { key: "impact", label: "Exporter les statistiques d'impact", action: exportImpactStatsCsv },
];

export default function ExportPage() {
  const { profile } = useAppContext();
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Exports CSV</h1>
        <p className="page-subtitle">
          UTF-8 BOM, separateur <code>;</code>, guillemets, echappement des retours ligne et
          compatibilite Excel francais.
        </p>
      </div>

      <Card className="bg-white">
        <p className="text-sm leading-7 text-slate-600">
          Les droits d'export restent limites par les roles et par les policies RLS. Un formateur
          n'obtient pas l'export complet des notes sensibles.
        </p>
      </Card>

      {error ? (
        <Card>
          <p className="text-sm text-coral-500">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {EXPORT_ACTIONS.map((item) => (
          <Card key={item.key}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl">{item.label}</h2>
                {item.key === "notes" && profile.role !== USER_ROLES.ADMIN ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Version filtree selon les droits du formateur.
                  </p>
                ) : null}
              </div>
              <Button
                disabled={busyKey === item.key}
                onClick={async () => {
                  setBusyKey(item.key);
                  setError("");
                  try {
                    await item.action();
                  } catch (exportError) {
                    setError(exportError.message);
                  } finally {
                    setBusyKey("");
                  }
                }}
              >
                {busyKey === item.key ? "Generation..." : "Exporter"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
