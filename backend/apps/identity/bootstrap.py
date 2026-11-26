"""Seed system roles and baseline permissions."""

from apps.identity.models import Permission, Role

SYSTEM_ROLES = [
    ("super_admin", "Super administrateur"),
    ("direction", "Direction générale"),
    ("academic_dir", "Direction académique"),
    ("finance_dir", "Direction financière"),
    ("admin", "Administration"),
    ("faculty_head", "Responsable de faculté"),
    ("dept_head", "Responsable de département"),
    ("teacher", "Enseignant"),
    ("student", "Étudiant"),
    ("researcher", "Chercheur"),
    ("librarian", "Bibliothécaire"),
    ("hr", "Responsable RH"),
    ("it", "Responsable informatique"),
    ("lab_head", "Responsable de laboratoire"),
    ("partner", "Entreprise partenaire"),
    ("alumni", "Ancien étudiant"),
    ("visitor", "Visiteur"),
]

BASE_PERMISSIONS = [
    ("identity.user.read", "Lire les utilisateurs", "identity"),
    ("identity.role.read", "Lire les rôles", "identity"),
    ("academic.faculty.manage", "Gérer les facultés", "academic"),
    ("academic.program.manage", "Gérer les formations", "academic"),
    ("academic.enrollment.manage", "Gérer les inscriptions", "academic"),
    ("events.outbox.read", "Lire l'outbox", "events"),
    ("notifications.read", "Lire les notifications", "notifications"),
    ("portal.direction.read", "Tableau de bord direction", "portal"),
]


def seed_roles_and_permissions() -> None:
    perm_objs = []
    for code, name, module in BASE_PERMISSIONS:
        obj, _ = Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )
        perm_objs.append(obj)

    for code, name in SYSTEM_ROLES:
        role, _ = Role.objects.update_or_create(
            code=code,
            defaults={"name": name, "is_system": True},
        )
        if code in {"super_admin", "direction", "admin", "it"}:
            role.permissions.set(perm_objs)
        elif code == "academic_dir":
            role.permissions.set(
                [p for p in perm_objs if p.code.startswith("academic.") or p.code.startswith("portal.")]
            )
        elif code in {"teacher", "student", "alumni"}:
            role.permissions.set([p for p in perm_objs if p.code == "notifications.read"])
