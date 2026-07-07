export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || "Logix Famille",
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "contact@logixfamille.fr",
  demoBannerText:
    import.meta.env.VITE_DEMO_BANNER_TEXT ||
    "Données de démonstration - ne pas présenter comme résultats réels.",
  rgpdPolicyVersion: import.meta.env.VITE_RGPD_POLICY_VERSION || "2026-07",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

export const USER_ROLES = {
  ADMIN: "administrateur",
  TRAINER: "formateur",
  COORDINATOR: "coordinateur",
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Administrateur",
  [USER_ROLES.TRAINER]: "Formateur",
  [USER_ROLES.COORDINATOR]: "Coordinateur",
};

export const BENEFICIARY_STATUSES = [
  { value: "actif", label: "Actif" },
  { value: "pause", label: "Pause" },
  { value: "sorti", label: "Sorti" },
  { value: "archive", label: "Archive" },
];

export const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "progression", label: "Progression" },
  { value: "difficulte", label: "Difficulte" },
  { value: "orientation", label: "Orientation" },
  { value: "administratif", label: "Administratif" },
];

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "retard", label: "Retard" },
  { value: "excuse", label: "Excuse" },
];

export const MODULE_PRIORITIES = {
  prioritaire: {
    label: "Prioritaire",
    badgeClass: "bg-coral-100 text-coral-500 ring-1 ring-coral-300/60",
  },
  recommande: {
    label: "Recommande",
    badgeClass: "bg-sand-100 text-slategreen ring-1 ring-sand-200",
  },
  acquis: {
    label: "Acquis",
    badgeClass: "bg-pine-50 text-pine-700 ring-1 ring-pine-100",
  },
};

export const WORKSHOP_CATEGORIES = [
  "FLE",
  "Sante",
  "Travail",
  "Parents et ecole",
  "Numerique",
  "Administratif",
];

export const EXIT_OUTCOMES = [
  { value: "", label: "Aucun" },
  { value: "emploi", label: "Sortie vers emploi" },
  { value: "formation", label: "Sortie vers formation" },
  { value: "autre", label: "Autre situation" },
];
