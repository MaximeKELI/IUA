import { adminNav, directionNav, type PortalGroup } from "@/lib/navigation";

/** Pure direction (no ops/super) — restricted view of matricules & teaching/grades edits. */
export function isDirectionViewer(roles: string[]): boolean {
  if (!roles.includes("direction")) return false;
  if (roles.includes("super_admin") || roles.includes("admin") || roles.includes("it")) {
    return false;
  }
  return true;
}

export function canSeeStudentIds(roles: string[]): boolean {
  if (roles.includes("super_admin") || roles.includes("admin") || roles.includes("it")) return true;
  if (roles.includes("secretariat") || roles.includes("academic_dir")) return true;
  if (roles.includes("teacher")) return true;
  if (roles.includes("student") || roles.includes("alumni")) return true;
  // Direction générale : pas les matricules
  return false;
}

export function canEditTeaching(roles: string[]): boolean {
  return roles.some((r) =>
    ["super_admin", "admin", "it", "secretariat", "academic_dir", "faculty_head", "dept_head"].includes(
      r,
    ),
  );
}

export function canEditGrades(roles: string[]): boolean {
  return roles.some((r) =>
    ["super_admin", "teacher", "academic_dir", "faculty_head", "dept_head"].includes(r),
  );
}

/** Traiter / accorder / refuser les demandes admin (proportionnel au grade). */
export function canManageAdminRequests(roles: string[]): boolean {
  return roles.some((r) =>
    [
      "super_admin",
      "admin",
      "it",
      "direction",
      "secretariat",
      "academic_dir",
      "finance_dir",
      "faculty_head",
      "dept_head",
    ].includes(r),
  );
}

/** Supervision rattrapages / notes côté staff ops (hors enseignant seul). */
export function canOverseeCatchUps(roles: string[]): boolean {
  return roles.some((r) =>
    ["super_admin", "admin", "direction", "secretariat", "academic_dir", "faculty_head", "dept_head"].includes(
      r,
    ),
  );
}

export function resolveOpsNav(roles: string[]): PortalGroup[] {
  if (roles.includes("direction") || roles.includes("finance_dir") || roles.includes("super_admin")) {
    return directionNav;
  }
  return adminNav;
}

export function resolveOpsTitle(roles: string[]): string {
  if (isDirectionViewer(roles) || (roles.includes("direction") && !roles.includes("admin"))) {
    return "Direction";
  }
  if (roles.includes("super_admin")) return "Direction";
  if (roles.includes("secretariat")) return "Secrétariat";
  return "Administration";
}
