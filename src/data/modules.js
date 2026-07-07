export const MODULES = [
  {
    code: "francais-quotidien",
    title: "Francais du quotidien",
    description:
      "Renforcer la communication, la lecture et l'ecriture utiles au quotidien des familles.",
    colorToken: "pine",
    skills: [
      {
        code: "french-understand-appointments",
        title: "Comprendre un rendez-vous ou une consigne simple",
      },
      {
        code: "french-fill-basic-form",
        title: "Remplir un formulaire simple",
      },
      {
        code: "french-read-school-message",
        title: "Lire un message d'ecole ou d'administration",
      },
      {
        code: "french-write-short-message",
        title: "Ecrire un message court comprehensible",
      },
      {
        code: "french-ask-for-help",
        title: "Demander de l'aide et reformuler un besoin",
      },
    ],
  },
  {
    code: "parents-ecole",
    title: "Parents et ecole",
    description:
      "Mieux comprendre les attentes de l'ecole et communiquer avec l'equipe educative.",
    colorToken: "sand",
    skills: [
      {
        code: "school-read-notebook",
        title: "Lire le carnet ou l'ENT de l'enfant",
      },
      {
        code: "school-book-appointment",
        title: "Prendre un rendez-vous avec l'ecole",
      },
      {
        code: "school-prepare-meeting",
        title: "Preparer une reunion parents-professeurs",
      },
      {
        code: "school-understand-homework",
        title: "Comprendre les devoirs et consignes",
      },
      {
        code: "school-identify-supports",
        title: "Identifier les aides et ressources scolaires",
      },
    ],
  },
  {
    code: "sante",
    title: "Sante",
    description:
      "Acquerir les reflexes pour prendre rendez-vous, comprendre les documents et suivre un parcours de soin simple.",
    colorToken: "coral",
    skills: [
      {
        code: "health-book-appointment",
        title: "Prendre un rendez-vous de sante",
      },
      {
        code: "health-identify-right-contact",
        title: "Identifier le bon interlocuteur de sante",
      },
      {
        code: "health-prepare-documents",
        title: "Preparer ses documents utiles",
      },
      {
        code: "health-understand-prescription",
        title: "Comprendre une ordonnance ou un compte-rendu simple",
      },
      {
        code: "health-follow-up",
        title: "Organiser son suivi et ses rappels",
      },
    ],
  },
  {
    code: "travail-insertion",
    title: "Travail et insertion professionnelle",
    description:
      "Structurer les demarches d'insertion professionnelle et les outils de candidature.",
    colorToken: "pine",
    skills: [
      {
        code: "work-cv",
        title: "CV valide",
        statKey: "cv_validated",
      },
      {
        code: "work-cover-letter",
        title: "Presenter son parcours a l'oral ou a l'ecrit",
      },
      {
        code: "work-job-search",
        title: "Rechercher une offre et y repondre",
      },
      {
        code: "work-interview",
        title: "Se preparer a un entretien",
      },
      {
        code: "work-rights",
        title: "Comprendre les bases des droits et contrats",
      },
    ],
  },
  {
    code: "numerique-demarches",
    title: "Numerique et demarches en ligne",
    description:
      "Gagner en autonomie avec le smartphone, l'email et les services numeriques utiles.",
    colorToken: "sand",
    skills: [
      {
        code: "digital-email",
        title: "Creer, lire et envoyer un email",
      },
      {
        code: "digital-smartphone-files",
        title: "Scanner et envoyer un document depuis le smartphone",
      },
      {
        code: "digital-passwords",
        title: "Utiliser des mots de passe fiables",
      },
      {
        code: "digital-online-form",
        title: "Completer une demarche simple en ligne",
      },
      {
        code: "digital-video-call",
        title: "Participer a un appel ou rendez-vous video",
      },
    ],
  },
  {
    code: "autonomie-administrative",
    title: "Autonomie administrative",
    description:
      "Structurer les papiers, suivre les organismes et comprendre les services publics en ligne.",
    colorToken: "coral",
    skills: [
      {
        code: "admin-sort-documents",
        title: "Classer ses documents administratifs",
        statKey: "administrative_skill",
      },
      {
        code: "admin-online-account",
        title: "Acceder a un compte de service public",
      },
      {
        code: "admin-complete-request",
        title: "Completer une demande administrative simple",
      },
      {
        code: "admin-appointments",
        title: "Prendre ou confirmer un rendez-vous administratif",
      },
      {
        code: "admin-follow-deadline",
        title: "Suivre une echeance ou une relance",
      },
    ],
  },
];

export const MODULES_BY_CODE = MODULES.reduce((accumulator, moduleItem) => {
  accumulator[moduleItem.code] = moduleItem;
  return accumulator;
}, {});

export const SKILLS_BY_CODE = MODULES.flatMap((moduleItem) =>
  moduleItem.skills.map((skill) => ({
    ...skill,
    moduleCode: moduleItem.code,
    moduleTitle: moduleItem.title,
  })),
).reduce((accumulator, skill) => {
  accumulator[skill.code] = skill;
  return accumulator;
}, {});
