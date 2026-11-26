# IUA DIGITAL CAMPUS — Conception de la Base de Données

**SGBD :** PostgreSQL 16 + PostGIS  
**ORM :** Django  
**Principes :** normalisation, intégrité référentielle, soft-delete sensible, audit, multi-tenant prêt

---

## 1. Domaines de données

```
IDENTITY ──► ACADEMIC ──► ADMISSIONS ──► FINANCE
                │              │            │
                ├── LMS        │            └── WALLET
                ├── GRADES     └── STUDENT PROFILE
                ├── DOCS
                └── HR / QUALITY / CAMPUS / TWIN
```

---

## 2. Référentiels centraux (socle)

### 2.1 Identity

| Table | Rôle |
|-------|------|
| `identity_user` | Compte unique (email), MFA, statut |
| `identity_role` | Rôles système (student, teacher, …) |
| `identity_permission` | Permissions granulaires `module.action` |
| `identity_role_permission` | M2M |
| `identity_user_role` | Affectation (scope facultatif : faculty_id) |
| `identity_session_log` | Connexions / échecs |
| `identity_person` | Données personnelles partagées (PII) |

### 2.2 Academic

| Table | Rôle |
|-------|------|
| `academic_institution` | Établissement (IUA) |
| `academic_faculty` | Faculté / école |
| `academic_department` | Département |
| `academic_program` | Formation (Licence/Master…) |
| `academic_academic_year` | Année académique |
| `academic_term` | Semestre / trimestre |
| `academic_cohort` | Promotion |
| `academic_course_unit` | Unité d'enseignement (UE) |
| `academic_subject` | Matière |
| `academic_enrollment` | Inscription pédagogique |
| `academic_teaching_assignment` | Affectation enseignant |
| `academic_room` / `building` | Locaux |
| `academic_student_profile` | Profil étudiant (1–1 User) |
| `academic_staff_profile` | Profil personnel / enseignant |

### 2.3 Events & Audit

| Table | Rôle |
|-------|------|
| `events_outbox` | Messages à publier (Transactional Outbox) |
| `events_processed` | Idempotence consumers |
| `events_dead_letter` | Événements en échec |
| `core_audit_log` | Mutations sensibles |

---

## 3. Règles de conception

1. **UUID** comme PK publique exposée ; BigAutoField interne optionnel.
2. **Contraintes** : UNIQUE, FK `ON DELETE PROTECT` sur référentiels critiques.
3. **Soft delete** (`deleted_at`) sur profils, documents, inscriptions.
4. **Historisation** des notes et délibérations (table `_history` / django-simple-history).
5. **Pas de duplication** : les modules consomment `StudentProfile`, pas leur propre copie.
6. **Index** : `(institution_id, code)`, `(user_id, role)`, dates de session, outbox `status`.
7. **PII** : minimisation, chiffrement champ pour données ultra-sensibles (CNI hash), rétention documentée.
8. **PostGIS** : `geometry` sur buildings/rooms (Digital Twin).

---

## 4. Entités métier clés (relations)

```
Institution 1──* Faculty 1──* Department 1──* Program
Program 1──* Cohort *──1 AcademicYear
Program 1──* CourseUnit 1──* Subject
User 1──1 StudentProfile *──* Enrollment ──► Cohort + Program
User 1──1 StaffProfile 1──* TeachingAssignment ──► Subject
Application ──► Program ──(on approve)──► Enrollment + FinanceAccount
Payment ──► FinanceAccount (idempotent provider_ref)
Grade ──► Enrollment + Subject (locked after deliberation)
```

---

## 5. Conformité données (Côte d'Ivoire)

- Base légale : Loi n°2013-450 relative à la protection des données à caractère personnel + ARTCI.
- Consentement, finalité, durée de conservation, droit d'accès/rectification.
- Table `core_data_retention_policy` + jobs de purge/anonymisation.
- Environnements non-prod : **données synthétiques uniquement**.

---

## 6. Migrations & sauvegardes

- Migrations Django versionnées, revue obligatoire.
- Backup PostgreSQL quotidien + PITR en production.
- Tests de restauration trimestriels (Phase 5).
