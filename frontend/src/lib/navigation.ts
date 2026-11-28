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
      { href: "/portail/etudiant/edt", labelKey: "portal.student.edt", status: "active" },
      { href: "/portail/etudiant/ects", labelKey: "portal.student.ects", status: "active" },
      { href: "/portail/etudiant/bulletin", labelKey: "portal.student.bulletin", status: "active" },
      { href: "/portail/etudiant/documents", labelKey: "portal.student.docsBilingual", status: "active" },
    ],
  },
  {
    titleKey: "portal.student.groupStudy",
    links: [
      { href: "/portail/etudiant/supports", labelKey: "portal.student.materials", status: "active" },
      { href: "/portail/etudiant/devoirs", labelKey: "portal.student.homework", status: "active" },
      { href: "/portail/etudiant/qcm", labelKey: "portal.student.quizzes", status: "active" },
      { href: "/portail/etudiant/visio", labelKey: "portal.student.visio", status: "active" },
      { href: "/portail/etudiant/examens", labelKey: "portal.student.exams", status: "active" },
      { href: "/portail/etudiant/evaluer", labelKey: "portal.student.evaluate", status: "active" },
    ],
  },
  {
    titleKey: "portal.student.groupLife",
    links: [
      { href: "/portail/etudiant/annonces", labelKey: "portal.student.announcements", status: "active" },
      { href: "/portail/etudiant/absences", labelKey: "portal.student.attendance", status: "active" },
      { href: "/portail/etudiant/clubs", labelKey: "portal.student.clubs", status: "active" },
      { href: "/portail/etudiant/bibliotheque", labelKey: "portal.student.library", status: "active" },
      { href: "/portail/etudiant/stages", labelKey: "portal.student.internships", status: "active" },
      { href: "/portail/etudiant/carriere", labelKey: "portal.student.career", status: "active" },
    ],
  },
  {
    titleKey: "portal.student.groupServices",
    links: [
      { href: "/portail/etudiant/finance", labelKey: "portal.student.finance", status: "active" },
      { href: "/portail/etudiant/bourses", labelKey: "portal.student.scholarships", status: "active" },
      { href: "/portail/etudiant/messages", labelKey: "portal.student.messages", status: "active" },
      { href: "/portail/etudiant/carte", labelKey: "portal.student.card", status: "active" },
      { href: "/portail/etudiant/hors-ligne", labelKey: "portal.student.offline", status: "active" },
      { href: "/portail/etudiant/demandes", labelKey: "portal.student.requests", status: "active" },
      { href: "/portail/etudiant/notifications", labelKey: "portal.student.notifications", status: "active" },
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
