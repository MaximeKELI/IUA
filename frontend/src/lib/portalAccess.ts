/** Which portal prefixes a role set may open. */

const STUDENT = ["student", "alumni"];
const TEACHER = ["teacher"];
const ADMIN = [
  "admin",
  "super_admin",
  "secretariat",
  "academic_dir",
  "faculty_head",
  "dept_head",
  "hr",
  "it",
];
const DIRECTION = ["direction", "super_admin", "finance_dir", "admin", "academic_dir"];

export function canAccessPortalPath(pathname: string, roles: string[]): boolean {
  const path = pathname.replace(/^\/(fr|en|pt|es|ar)/, "") || pathname;
  if (!path.startsWith("/portail")) return true;

  if (path.startsWith("/portail/etudiant")) {
    return roles.some((r) => STUDENT.includes(r)) || roles.some((r) => ADMIN.includes(r));
  }
  if (path.startsWith("/portail/enseignant")) {
    return roles.some((r) => TEACHER.includes(r)) || roles.some((r) => ADMIN.includes(r));
  }
  if (path.startsWith("/portail/admin")) {
    return roles.some((r) => ADMIN.includes(r) || DIRECTION.includes(r));
  }
  if (path.startsWith("/portail/direction")) {
    return roles.some((r) => DIRECTION.includes(r));
  }
  // /portail root — any authenticated role
  return roles.length > 0;
}
