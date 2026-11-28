from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.academic.models import (
    AcademicYear,
    Cohort,
    CourseUnit,
    Department,
    Enrollment,
    Faculty,
    Institution,
    Program,
    StaffProfile,
    StudentProfile,
    Subject,
    TeachingAssignment,
)
from apps.events.services import emit_event, relay_pending
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role
from apps.teaching.student_models import (
    CareerOpportunity,
    Club,
    ExamEvent,
    Internship,
    LibraryItem,
    ScholarshipOffer,
    StudentPayment,
)


class Command(BaseCommand):
    help = "Charge des données de démonstration synthétiques (non production)."

    @transaction.atomic
    def handle(self, *args, **options):
        seed_roles_and_permissions()

        institution, _ = Institution.objects.get_or_create(
            code="IUA",
            defaults={
                "name": "Institut Universitaire d'Abidjan",
                "short_name": "IUA",
                "address": "II Plateaux, 7ème Tranche, Rue L40, Carrefour Cascades",
                "city": "Abidjan",
                "email": "info@iua-ci.org",
                "phone": "+225 27 224 222 65",
                "website": "https://www.iuaci.org/",
            },
        )

        faculty, _ = Faculty.objects.get_or_create(
            institution=institution,
            code="FSEG",
            defaults={"name": "Faculté des Sciences Économiques et de Gestion"},
        )
        dept, _ = Department.objects.get_or_create(
            faculty=faculty,
            code="GEST",
            defaults={"name": "Département de Gestion"},
        )
        program, _ = Program.objects.get_or_create(
            faculty=faculty,
            code="L-GEST",
            defaults={
                "name": "Licence en Gestion",
                "department": dept,
                "degree_level": Program.DegreeLevel.LICENSE,
                "description": "Formation initiale en gestion — données de démonstration.",
            },
        )

        year, _ = AcademicYear.objects.get_or_create(
            institution=institution,
            code="2025-2026",
            defaults={
                "name": "Année académique 2025-2026",
                "starts_on": date(2025, 10, 1),
                "ends_on": date(2026, 7, 31),
                "is_current": True,
            },
        )
        cohort, _ = Cohort.objects.get_or_create(
            program=program,
            academic_year=year,
            code="L1-2025",
            defaults={"name": "Licence 1 Gestion 2025"},
        )
        ue, _ = CourseUnit.objects.get_or_create(
            program=program,
            code="UE-GEST-101",
            defaults={"name": "Fondements de la gestion", "credits": 6, "semester": 1},
        )
        subject, _ = Subject.objects.get_or_create(
            course_unit=ue,
            code="INTRO-GEST",
            defaults={"name": "Introduction à la gestion", "coefficient": 2, "hours": 36},
        )

        admin_user, created = User.objects.get_or_create(
            email="admin@demo.iua.local",
            defaults={
                "first_name": "Awa",
                "last_name": "Kouassi",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_user.set_password("IuaDemoAdmin2026!")
            admin_user.save()
        assign_role(admin_user, "super_admin")
        assign_role(admin_user, "admin")
        if created or not admin_user.has_usable_password():
            admin_user.set_password("IuaDemoAdmin2026!")
            admin_user.save(update_fields=["password"])

        direction_user, created = User.objects.get_or_create(
            email="direction@demo.iua.local",
            defaults={
                "first_name": "Mariam",
                "last_name": "Bamba",
                "is_staff": True,
            },
        )
        if created:
            direction_user.set_password("IuaDemoDirection2026!")
            direction_user.save()
        else:
            direction_user.set_password("IuaDemoDirection2026!")
            direction_user.is_superuser = False
            direction_user.save(update_fields=["password", "is_superuser"])
        assign_role(direction_user, "direction")

        secretariat_user, created = User.objects.get_or_create(
            email="secretariat@demo.iua.local",
            defaults={
                "first_name": "Fatou",
                "last_name": "N'Diaye",
                "is_staff": True,
            },
        )
        if created:
            secretariat_user.set_password("IuaDemoSecret2026!")
            secretariat_user.save()
        else:
            secretariat_user.set_password("IuaDemoSecret2026!")
            secretariat_user.save(update_fields=["password"])
        assign_role(secretariat_user, "secretariat")

        student_user, created = User.objects.get_or_create(
            email="etudiant@demo.iua.local",
            defaults={"first_name": "Kofi", "last_name": "Traoré"},
        )
        if created:
            student_user.set_password("IuaDemoStudent2026!")
            student_user.save()
        assign_role(student_user, "student")

        student, _ = StudentProfile.objects.get_or_create(
            user=student_user,
            defaults={
                "student_number": "IUA-2025-0001",
                "program": program,
                "cohort": cohort,
                "level": "L1",
            },
        )
        Enrollment.objects.get_or_create(
            student=student,
            program=program,
            academic_year=year,
            defaults={"cohort": cohort, "status": "active"},
        )

        teacher_user, created = User.objects.get_or_create(
            email="enseignant@demo.iua.local",
            defaults={"first_name": "Aminata", "last_name": "Diallo"},
        )
        if created:
            teacher_user.set_password("IuaDemoTeacher2026!")
            teacher_user.save()
        assign_role(teacher_user, "teacher")

        staff, _ = StaffProfile.objects.get_or_create(
            user=teacher_user,
            defaults={
                "staff_number": "ENS-0001",
                "staff_type": StaffProfile.StaffType.PERMANENT,
                "faculty": faculty,
                "department": dept,
                "title": "Maître-assistant",
            },
        )
        TeachingAssignment.objects.get_or_create(
            teacher=staff,
            subject=subject,
            academic_year=year,
            defaults={"cohort": cohort},
        )

        # Student workspace demo content
        CourseUnit.objects.filter(pk=ue.pk).update(credits=Decimal("6.0"))
        StudentPayment.objects.get_or_create(
            student=student,
            label="Frais de scolarité — semestre 1",
            defaults={"amount_xof": 450_000, "due_date": date.today() + timedelta(days=20), "status": "due"},
        )
        StudentPayment.objects.get_or_create(
            student=student,
            label="Caution bibliothèque",
            defaults={"amount_xof": 25_000, "due_date": date.today() - timedelta(days=5), "status": "paid", "method": "Mobile Money"},
        )
        Internship.objects.get_or_create(
            student=student,
            company="Orange Côte d'Ivoire",
            defaults={
                "role": "Assistant analyste",
                "city": "Abidjan",
                "status": "searching",
                "notes": "Candidature envoyée — suivi RH",
            },
        )
        club, _ = Club.objects.get_or_create(
            name="Club Entrepreneuriat IUA",
            defaults={
                "category": "business",
                "description": "Ateliers pitch, mentoring et networking alumni.",
                "meeting_info": "Jeudi 17h — Amphi B",
            },
        )
        Club.objects.get_or_create(
            name="Club Debate & Debate EN",
            defaults={"category": "culture", "description": "Débats bilingues FR/EN.", "meeting_info": "Mardi 16h"},
        )
        LibraryItem.objects.get_or_create(
            title="Principes d'économie",
            defaults={"author": "Mankiw", "kind": "book", "subject_tags": "économie,L1", "available": True},
        )
        LibraryItem.objects.get_or_create(
            title="Introduction à Python pour data",
            defaults={
                "author": "IUA Digital",
                "kind": "ebook",
                "subject_tags": "informatique",
                "available": True,
                "url": "https://www.iuaci.org/",
            },
        )
        CareerOpportunity.objects.get_or_create(
            title="Stage analyste junior — banque",
            defaults={
                "company": "SGBCI",
                "kind": "internship",
                "location": "Abidjan",
                "description": "Analyse crédit et reporting.",
                "deadline": date.today() + timedelta(days=45),
            },
        )
        ScholarshipOffer.objects.get_or_create(
            title="Bourse excellence FSEG",
            defaults={
                "provider": "Fondation IUA",
                "amount_label": "50% frais",
                "deadline": date.today() + timedelta(days=60),
                "description": "Pour moyennes ≥ 14/20.",
            },
        )
        ExamEvent.objects.get_or_create(
            student=student,
            title=f"Examen — {subject.name}",
            defaults={
                "program_code": program.code,
                "subject_name": subject.name,
                "starts_at": timezone.now() + timedelta(days=14, hours=9),
                "room": "Amphi A",
                "notes": "Pièce d'identité obligatoire",
            },
        )
        # Ensure club joinable (membership optional — student can join via UI)
        _ = club

        emit_event(
            event_type="STUDENT_REGISTERED",
            aggregate_type="StudentProfile",
            aggregate_id=str(student.id),
            payload={"email": student_user.email, "student_number": student.student_number},
            source="seed_demo",
        )

        self.stdout.write(self.style.SUCCESS("Données de démonstration chargées."))
        self.stdout.write(
            "Comptes @demo.iua.local : admin / direction / secretariat / etudiant / enseignant"
        )
        # Relay outbox synchronously for local bootstrap without Celery
        count = relay_pending()
        self.stdout.write(f"Événements relayés: {count}")
