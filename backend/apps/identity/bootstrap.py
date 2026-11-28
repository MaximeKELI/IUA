"""Seed system roles and baseline permissions."""

from apps.identity.models import Permission, Role

SYSTEM_ROLES = [
    ("super_admin", "Super administrateur"),
    ("direction", "Direction générale"),
    ("academic_dir", "Direction académique"),
    ("finance_dir", "Direction financière"),
    ("admin", "Administration / Scolarité"),
    ("secretariat", "Secrétariat"),
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
    ("identity.user.manage", "Créer et gérer les utilisateurs", "identity"),
    ("identity.role.read", "Lire les rôles", "identity"),
    ("academic.faculty.manage", "Gérer les facultés", "academic"),
    ("academic.program.manage", "Gérer les formations", "academic"),
    ("academic.enrollment.manage", "Gérer les inscriptions", "academic"),
    ("academic.teaching.manage", "Gérer les affectations enseignants", "academic"),
    ("academic.grades.manage", "Saisir et valider les notes", "academic"),
    ("academic.grades.read", "Consulter les notes", "academic"),
    ("services.request.manage", "Traiter les demandes administratives", "services"),
    ("services.request.create", "Créer une demande administrative", "services"),
    ("events.outbox.read", "Lire l'outbox", "events"),
    ("events.outbox.write", "Réessayer / écrire l'outbox", "events"),
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
    by_code = {p.code: p for p in perm_objs}

    # Direction: almost everything, but cannot modify grades or teaching assignments.
    direction_perms = [
        p
        for p in perm_objs
        if p.code
        not in {
            "academic.grades.manage",
            "academic.teaching.manage",
        }
    ]

    for code, name in SYSTEM_ROLES:
        role, _ = Role.objects.update_or_create(
            code=code,
            defaults={"name": name, "is_system": True},
        )
        if code == "super_admin":
            role.permissions.set(perm_objs)
        elif code == "direction":
            role.permissions.set(direction_perms)
        elif code in {"admin", "it"}:
            role.permissions.set(
                [p for p in perm_objs if p.code != "academic.grades.manage"]
            )
        elif code in {"academic_dir", "secretariat", "faculty_head", "dept_head"}:
            role.permissions.set(
                [
                    p
                    for p in perm_objs
                    if p.code.startswith("academic.")
                    or p.code.startswith("services.")
                    or p.code
                    in {
                        "identity.user.read",
                        "identity.user.manage",
                        "identity.role.read",
                        "notifications.read",
                    }
                ]
            )
        elif code == "finance_dir":
            role.permissions.set(
                [
                    by_code["identity.user.read"],
                    by_code["notifications.read"],
                    by_code["portal.direction.read"],
                    by_code["services.request.manage"],
                    by_code["academic.grades.read"],
                ]
            )
        elif code == "teacher":
            role.permissions.set(
                [
                    by_code["notifications.read"],
                    by_code["academic.grades.manage"],
                    by_code["academic.grades.read"],
                    by_code["services.request.create"],
                ]
            )
        elif code in {"student", "alumni"}:
            role.permissions.set(
                [
                    by_code["notifications.read"],
                    by_code["academic.grades.read"],
                    by_code["services.request.create"],
                ]
            )
        else:
            role.permissions.set([by_code["notifications.read"]])
