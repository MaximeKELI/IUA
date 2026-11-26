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
      { href: "/portail/etudiant/emploi-du-temps", label: "Emploi du temps", status: "soon" },
      { href: "/portail/etudiant/notes", label: "Notes & résultats", status: "soon" },
      { href: "/portail/etudiant/cours", label: "Cours & supports", status: "soon" },
    ],
  },
  {
    title: "Démarches",
    links: [
      { href: "/portail/etudiant/finance", label: "Paiements", status: "soon" },
      { href: "/portail/etudiant/documents", label: "Documents", status: "soon" },
      { href: "/portail/etudiant/demandes", label: "Demandes admin.", status: "soon" },
    ],
  },
  {
    title: "Campus",
    links: [
      { href: "/portail/etudiant/stages", label: "Stages", status: "soon" },
      { href: "/portail/etudiant/vie", label: "Vie étudiante", status: "soon" },
      { href: "/portail/etudiant/notifications", label: "Notifications", status: "active" },
    ],
  },
];

export const teacherNav: PortalGroup[] = [
  {
    title: "Pédagogie",
    links: [
      { href: "/portail/enseignant", label: "Tableau de bord", status: "active" },
      { href: "/portail/enseignant/cours", label: "Mes cours", status: "soon" },
      { href: "/portail/enseignant/notes", label: "Saisie des notes", status: "soon" },
      { href: "/portail/enseignant/absences", label: "Absences", status: "soon" },
    ],
  },
  {
    title: "Communication",
    links: [
      { href: "/portail/enseignant/messages", label: "Messagerie", status: "soon" },
      { href: "/portail/enseignant/emplois", label: "Emploi du temps", status: "soon" },
    ],
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
    title: "Référentiels",
    links: [
      { href: "/portail/admin/formations", label: "Formations", status: "soon" },
      { href: "/portail/admin/inscriptions", label: "Inscriptions", status: "soon" },
      { href: "/portail/admin/utilisateurs", label: "Utilisateurs", status: "soon" },
    ],
  },
];
