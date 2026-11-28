/** Shared path helpers safe for Edge middleware (no "use client"). */

export function resolveHomePath(roles: string[]): string {
  if (roles.includes("direction") || roles.includes("super_admin") || roles.includes("finance_dir")) {
    return "/portail/direction";
  }
  if (
    roles.includes("admin") ||
    roles.includes("academic_dir") ||
    roles.includes("secretariat") ||
    roles.includes("faculty_head") ||
    roles.includes("dept_head") ||
    roles.includes("hr") ||
    roles.includes("it")
  ) {
    return "/portail/admin";
  }
  if (roles.includes("teacher")) return "/portail/enseignant";
  if (roles.includes("student") || roles.includes("alumni")) return "/portail/etudiant";
  return "/connexion";
}
