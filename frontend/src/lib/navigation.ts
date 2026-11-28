/** Information architecture — public site + role portals (labels via i18n keys) */

export type NavChild = { labelKey: string; href: string };
export type NavItem = { labelKey: string; href: string; children?: NavChild[] };

export const publicNav: NavItem[] = [
  {
    labelKey: "study",
    href: "/etudier",
    children: [
      { labelKey: "programs", href: "/formations" },
      { labelKey: "admissions", href: "/admissions" },
      { labelKey: "international", href: "/international" },
    ],
  },
  {
    labelKey: "institution",
    href: "/institution",
    children: [
      { labelKey: "about", href: "/institution" },
      { labelKey: "faculties", href: "/facultes" },
      { labelKey: "campus", href: "/campus" },
    ],
  },
  { labelKey: "contact", href: "/contact" },
];

export type PortalLink = {
  href: string;
  labelKey: string;
  descriptionKey?: string;
  status?: "active" | "soon";
};

export type PortalGroup = {
  titleKey: string;
  links: PortalLink[];
};

export const studentNav: PortalGroup[] = [
  {
    titleKey: "portal.student.groupPath",
    links: [
      { href: "/portail/etudiant", labelKey: "portal.student.dashboard", status: "active" },
      { href: "/portail/etudiant/cours", labelKey: "portal.student.courses", status: "active" },
      { href: "/portail/etudiant/notes", labelKey: "portal.student.grades", status: "active" },
      {
        href: "/portail/etudiant/documents",
        labelKey: "portal.student.docsBilingual",
        status: "active",
      },
    ],
  },
  {
    titleKey: "portal.student.groupAdmin",
    links: [
      { href: "/portail/etudiant/demandes", labelKey: "portal.student.requests", status: "active" },
      {
        href: "/portail/etudiant/notifications",
        labelKey: "portal.student.notifications",
        status: "active",
      },
    ],
  },
];

export const teacherNav: PortalGroup[] = [
  {
    titleKey: "portal.teacher.groupTeach",
    links: [
      { href: "/portail/enseignant", labelKey: "portal.teacher.dashboard", status: "active" },
      { href: "/portail/enseignant/cours", labelKey: "portal.teacher.courses", status: "active" },
      { href: "/portail/enseignant/etudiants", labelKey: "portal.teacher.students", status: "active" },
      { href: "/portail/enseignant/notes", labelKey: "portal.teacher.grades", status: "active" },
      { href: "/portail/enseignant/baremes", labelKey: "portal.teacher.scheme", status: "active" },
    ],
  },
  {
    titleKey: "portal.teacher.groupTools",
    links: [
      { href: "/portail/enseignant/presence", labelKey: "portal.teacher.presence", status: "active" },
      { href: "/portail/enseignant/edt", labelKey: "portal.teacher.schedule", status: "active" },
      { href: "/portail/enseignant/supports", labelKey: "portal.teacher.materials", status: "active" },
      { href: "/portail/enseignant/devoirs", labelKey: "portal.teacher.homework", status: "active" },
      { href: "/portail/enseignant/qcm", labelKey: "portal.teacher.quizzes", status: "active" },
      { href: "/portail/enseignant/visio", labelKey: "portal.teacher.visio", status: "active" },
    ],
  },
  {
    titleKey: "portal.teacher.groupClass",
    links: [
      { href: "/portail/enseignant/annonces", labelKey: "portal.teacher.messages", status: "active" },
      { href: "/portail/enseignant/fiche-etudiant", labelKey: "portal.teacher.studentFile", status: "active" },
      { href: "/portail/enseignant/rattrapages", labelKey: "portal.teacher.catchup", status: "active" },
      { href: "/portail/enseignant/evaluations", labelKey: "portal.teacher.evaluations", status: "active" },
    ],
  },
  {
    titleKey: "portal.teacher.groupAdmin",
    links: [
      { href: "/portail/enseignant/alertes", labelKey: "portal.teacher.alerts", status: "active" },
      { href: "/portail/enseignant/stats", labelKey: "portal.teacher.stats", status: "active" },
      { href: "/portail/enseignant/pv", labelKey: "portal.teacher.pv", status: "active" },
      { href: "/portail/enseignant/hors-ligne", labelKey: "portal.teacher.offline", status: "active" },
      { href: "/portail/enseignant/demandes", labelKey: "portal.teacher.requests", status: "active" },
      { href: "/portail/enseignant/notifications", labelKey: "portal.teacher.notifications", status: "active" },
    ],
  },
];

export const adminNav: PortalGroup[] = [
  {
    titleKey: "portal.admin.groupPilot",
    links: [
      { href: "/portail/admin", labelKey: "portal.admin.overview", status: "active" },
      { href: "/portail/direction", labelKey: "portal.admin.direction", status: "active" },
    ],
  },
  {
    titleKey: "portal.admin.groupManage",
    links: [
      { href: "/portail/admin/utilisateurs", labelKey: "portal.admin.users", status: "active" },
      { href: "/portail/admin/formations", labelKey: "portal.admin.programs", status: "active" },
      { href: "/portail/admin/enseignements", labelKey: "portal.admin.teach", status: "active" },
      { href: "/portail/admin/inscriptions", labelKey: "portal.admin.enroll", status: "active" },
      { href: "/portail/admin/demandes", labelKey: "portal.admin.requests", status: "active" },
      { href: "/portail/admin/notes", labelKey: "portal.admin.grades", status: "active" },
    ],
  },
];

export const directionNav: PortalGroup[] = [
  {
    titleKey: "portal.admin.groupPilot",
    links: [
      { href: "/portail/direction", labelKey: "portal.direction.dashboard", status: "active" },
      { href: "/portail/admin", labelKey: "portal.direction.ops", status: "active" },
    ],
  },
  {
    titleKey: "portal.admin.groupManage",
    links: [
      { href: "/portail/admin/utilisateurs", labelKey: "portal.admin.users", status: "active" },
      { href: "/portail/admin/formations", labelKey: "portal.admin.programs", status: "active" },
      { href: "/portail/admin/inscriptions", labelKey: "portal.admin.enroll", status: "active" },
      { href: "/portail/admin/demandes", labelKey: "portal.admin.requests", status: "active" },
    ],
  },
  {
    titleKey: "portal.admin.groupManage",
    links: [
      { href: "/portail/admin/enseignements", labelKey: "portal.admin.teach", status: "active" },
      { href: "/portail/admin/notes", labelKey: "portal.admin.grades", status: "active" },
    ],
  },
];
