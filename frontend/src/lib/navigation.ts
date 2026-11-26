/** Information architecture — public site + role portals */

export const publicNav = [
  {
    label: "Étudier",
    href: "/etudier",
    children: [
      { label: "Formations", href: "/formations" },
      { label: "Admissions", href: "/admissions" },
      { label: "Étudiants internationaux", href: "/international" },
    ],
  },
  {
    label: "Institution",
    href: "/institution",
    children: [
      { label: "Présentation", href: "/institution" },
      { label: "Facultés", href: "/facultes" },
      { label: "Campus", href: "/campus" },
    ],
  },
  { label: "Contact", href: "/contact" },
] as const;

export type PortalLink = {
  href: string;
  label: string;
  description?: string;
  status?: "active" | "soon";
};

export type PortalGroup = {
  title: string;
  links: PortalLink[];
};

export const studentNav: PortalGroup[] = [
  {
    title: "Mon parcours",
    links: [
      { href: "/portail/etudiant", label: "Tableau de bord", status: "active" },
      { href: "/portail/etudiant/cours", label: "Cours & matières", status: "active" },
      { href: "/portail/etudiant/notes", label: "Notes & résultats", status: "active" },
    ],
  },
  {
    title: "Démarches",
    links: [
      { href: "/portail/etudiant/demandes", label: "Demandes admin.", status: "active" },
      { href: "/portail/etudiant/notifications", label: "Notifications", status: "active" },
    ],
  },
];

export const teacherNav: PortalGroup[] = [
  {
    title: "Pédagogie",
    links: [
      { href: "/portail/enseignant", label: "Tableau de bord", status: "active" },
      { href: "/portail/enseignant/cours", label: "Mes cours", status: "active" },
      { href: "/portail/enseignant/notes", label: "Saisie des notes", status: "active" },
    ],
  },
  {
    title: "Communication",
    links: [{ href: "/portail/enseignant/notifications", label: "Notifications", status: "active" }],
  },
];

export const adminNav: PortalGroup[] = [
  {
    title: "Pilotage",
    links: [
      { href: "/portail/admin", label: "Vue d'ensemble", status: "active" },
      { href: "/portail/direction", label: "Direction", status: "active" },
    ],
  },
  {
    title: "Gestion",
    links: [
      { href: "/portail/admin/utilisateurs", label: "Utilisateurs & rôles", status: "active" },
      { href: "/portail/admin/formations", label: "Formations", status: "active" },
      { href: "/portail/admin/enseignements", label: "Affectations enseignants", status: "active" },
      { href: "/portail/admin/inscriptions", label: "Inscriptions", status: "active" },
      { href: "/portail/admin/demandes", label: "Demandes", status: "active" },
      { href: "/portail/admin/notes", label: "Notes (consultation)", status: "active" },
    ],
  },
];

/** Direction : gestion globale + consultation notes/cours (sans modification). */
export const directionNav: PortalGroup[] = [
  {
    title: "Pilotage",
    links: [
      { href: "/portail/direction", label: "Tableau de bord", status: "active" },
      { href: "/portail/admin", label: "Vue opérationnelle", status: "active" },
    ],
  },
  {
    title: "Gestion",
    links: [
      { href: "/portail/admin/utilisateurs", label: "Utilisateurs & rôles", status: "active" },
      { href: "/portail/admin/formations", label: "Formations", status: "active" },
      { href: "/portail/admin/inscriptions", label: "Inscriptions", status: "active" },
      { href: "/portail/admin/demandes", label: "Demandes admin.", status: "active" },
    ],
  },
  {
    title: "Consultation",
    links: [
      {
        href: "/portail/admin/enseignements",
        label: "Cours & affectations",
        description: "Lecture seule",
        status: "active",
      },
      {
        href: "/portail/admin/notes",
        label: "Notes des enseignants",
        description: "Lecture seule",
        status: "active",
      },
    ],
  },
];

