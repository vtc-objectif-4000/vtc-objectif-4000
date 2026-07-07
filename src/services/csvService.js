import { listBeneficiaries } from "./beneficiaryService";
import { listDiagnosticsForExport } from "./diagnosticService";
import { listBeneficiaryModulesForExport } from "./moduleService";
import { listValidatedSkillsForExport } from "./skillService";
import { listAttendancesForExport } from "./attendanceService";
import { listNotesForExport } from "./notesService";
import { fetchImpactStats } from "./statsService";

const UTF8_BOM = "\uFEFF";

function escapeCsvValue(value) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function serializeCsv(headers, rows) {
  const lines = [
    headers.map((header) => escapeCsvValue(header)).join(";"),
    ...rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(";")),
  ];

  return `${UTF8_BOM}${lines.join("\r\n")}`;
}

export function downloadCsvFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fullName(person) {
  if (!person) {
    return "";
  }

  return [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
}

export async function exportBeneficiariesCsv() {
  const beneficiaries = await listBeneficiaries({ includeArchived: true });
  const content = serializeCsv(
    [
      "ID",
      "Prenom",
      "Nom",
      "Statut",
      "Telephone",
      "Email",
      "Date d'entree",
      "Date de sortie",
      "Niveau de francais",
      "Besoins prioritaires",
      "Formateur",
      "Consentement RGPD",
    ],
    beneficiaries.map((item) => [
      item.id,
      item.first_name,
      item.last_name,
      item.status,
      item.phone,
      item.email || "",
      item.entry_date || "",
      item.exit_date || "",
      item.french_level_estimate || "",
      (item.priority_needs || []).join(", "),
      fullName(item.formateur),
      item.rgpd_consent ? "Oui" : "Non",
    ]),
  );

  downloadCsvFile("logix-famille-beneficiaires.csv", content);
}

export async function exportDiagnosticsCsv() {
  const diagnostics = await listDiagnosticsForExport();
  const headers = [
    "Diagnostic ID",
    "Beneficiaire",
    "Date",
    "Moyenne francais",
    "Moyenne numerique",
    "Moyenne globale",
    ...diagnostics
      .flatMap((item) => item.diagnostic_scores || [])
      .map((score) => score.axis_label)
      .filter((value, index, array) => array.indexOf(value) === index),
  ];

  const axisLabels = headers.slice(6);
  const rows = diagnostics.map((diagnostic) => {
    const scoreByLabel = Object.fromEntries(
      (diagnostic.diagnostic_scores || []).map((score) => [score.axis_label, score.score]),
    );

    return [
      diagnostic.id,
      fullName(diagnostic.beneficiary),
      diagnostic.created_at,
      diagnostic.french_average,
      diagnostic.digital_average,
      diagnostic.overall_average,
      ...axisLabels.map((label) => scoreByLabel[label] ?? ""),
    ];
  });

  downloadCsvFile("logix-famille-diagnostics.csv", serializeCsv(headers, rows));
}

export async function exportBeneficiaryModulesCsv() {
  const items = await listBeneficiaryModulesForExport();
  const content = serializeCsv(
    ["Beneficiaire", "Module", "Code module", "Priorite", "Statut", "Assigne le", "Termine le"],
    items.map((item) => [
      fullName(item.beneficiary),
      item.module?.title || "",
      item.module_code,
      item.priority,
      item.status,
      item.created_at,
      item.completed_at || "",
    ]),
  );

  downloadCsvFile("logix-famille-modules-beneficiaires.csv", content);
}

export async function exportValidatedSkillsCsv() {
  const items = await listValidatedSkillsForExport();
  const content = serializeCsv(
    ["Beneficiaire", "Module", "Competence", "Code competence", "Validation"],
    items.map((item) => [
      fullName(item.beneficiary),
      item.skill?.module?.title || "",
      item.skill?.title || "",
      item.skill?.code || "",
      item.validated_at || "",
    ]),
  );

  downloadCsvFile("logix-famille-competences.csv", content);
}

export async function exportAttendancesCsv() {
  const items = await listAttendancesForExport();
  const content = serializeCsv(
    ["Atelier", "Date", "Heure", "Beneficiaire", "Statut", "Note"],
    items.map((item) => [
      item.workshop?.title || "",
      item.workshop?.workshop_date || "",
      item.workshop?.workshop_time || "",
      fullName(item.beneficiary),
      item.status,
      item.note || "",
    ]),
  );

  downloadCsvFile("logix-famille-presences.csv", content);
}

export async function exportNotesCsv() {
  const items = await listNotesForExport();
  const content = serializeCsv(
    ["Date", "Beneficiaire", "Auteur", "Type", "Note", "Sensible"],
    items.map((item) => [
      item.created_at,
      fullName(item.beneficiary),
      fullName(item.author),
      item.note_type,
      item.content,
      item.is_sensitive ? "Oui" : "Non",
    ]),
  );

  downloadCsvFile("logix-famille-notes.csv", content);
}

export async function exportImpactStatsCsv() {
  const stats = await fetchImpactStats();
  const rows = [
    ["Nombre total de beneficiaires", stats.totalBeneficiaries],
    ["Beneficiaires actifs", stats.activeBeneficiaries],
    ["Beneficiaires archives", stats.archivedBeneficiaries],
    ["Diagnostics realises", stats.diagnosticsCount],
    ["Progression moyenne francais", stats.averageFrenchProgress],
    ["Progression moyenne numerique", stats.averageDigitalProgress],
    ["Competences validees", stats.validatedSkillsTotal],
    ["Beneficiaires avec CV valide", stats.beneficiariesWithCvValidated],
    [
      "Beneficiaires avec competence administrative validee",
      stats.beneficiariesWithAdministrativeSkill,
    ],
    ["Parents avec competence ecole", stats.parentsWithSchoolSkill],
    ["Beneficiaires avec competence travail", stats.beneficiariesWithWorkSkill],
    ["Taux de presence", `${stats.attendanceRate}%`],
    ["Sorties vers emploi ou formation", stats.exitsToEmploymentOrTraining],
  ];

  downloadCsvFile(
    "logix-famille-statistiques-impact.csv",
    serializeCsv(["Indicateur", "Valeur"], rows),
  );
}
