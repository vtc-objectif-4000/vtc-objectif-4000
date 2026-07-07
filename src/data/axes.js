export const DIAGNOSTIC_LEVELS = [
  {
    value: 1,
    label: "Debutant",
    helper: "Besoin d'un accompagnement intensif.",
  },
  {
    value: 2,
    label: "Fragile",
    helper: "Des acquis existent mais restent instables.",
  },
  {
    value: 3,
    label: "Moyen",
    helper: "L'autonomie est partielle, un renfort est utile.",
  },
  {
    value: 4,
    label: "Autonome",
    helper: "Bonne autonomie dans les situations courantes.",
  },
  {
    value: 5,
    label: "Tres autonome",
    helper: "Autonomie solide, pas de priorite immediate.",
  },
];

export const AXES = [
  {
    id: "french_oral",
    label: "Francais oral",
    shortLabel: "Oral",
    moduleCode: "francais-quotidien",
    family: "french",
  },
  {
    id: "reading",
    label: "Lecture",
    shortLabel: "Lecture",
    moduleCode: "francais-quotidien",
    family: "french",
  },
  {
    id: "writing",
    label: "Ecriture",
    shortLabel: "Ecriture",
    moduleCode: "francais-quotidien",
    family: "french",
  },
  {
    id: "digital_autonomy",
    label: "Autonomie numerique",
    shortLabel: "Numerique",
    moduleCode: "numerique-demarches",
    family: "digital",
  },
  {
    id: "children_school",
    label: "Ecole des enfants",
    shortLabel: "Ecole",
    moduleCode: "parents-ecole",
    family: "school",
  },
  {
    id: "health",
    label: "Sante",
    shortLabel: "Sante",
    moduleCode: "sante",
    family: "health",
  },
  {
    id: "work",
    label: "Travail",
    shortLabel: "Travail",
    moduleCode: "travail-insertion",
    family: "work",
  },
  {
    id: "administration",
    label: "Administration",
    shortLabel: "Administration",
    moduleCode: "autonomie-administrative",
    family: "administrative",
  },
  {
    id: "smartphone_email",
    label: "Smartphone / email",
    shortLabel: "Smartphone",
    moduleCode: "numerique-demarches",
    family: "digital",
  },
  {
    id: "public_services",
    label: "Services publics en ligne",
    shortLabel: "Services publics",
    moduleCode: "autonomie-administrative",
    family: "administrative",
  },
];

export const AXES_BY_ID = AXES.reduce((accumulator, axis) => {
  accumulator[axis.id] = axis;
  return accumulator;
}, {});
