# IUA DIGITAL CAMPUS — Spécification des 30 Modules

Chaque module : responsabilité, acteurs, données partagées, événements émis/consommés, priorité de livraison.

Légende priorité : **P0** socle · **P1** cœur métier · **P2** pédagogique · **P3** campus/vie · **P4** avancé

---

## MODULE 01 — Portail Étudiant · P0/P1
**Resp. :** agrégation UX des services étudiants.  
**Acteurs :** Étudiant.  
**Données :** StudentProfile, Enrollment, Grades, Finance, LMS, Notifications.  
**Événements in :** PAYMENT_CONFIRMED, GRADE_*, DOCUMENT_*, INTERNSHIP_*.  
**API :** `GET /api/v1/portal/student/dashboard`

## MODULE 02 — Portail Enseignant · P0/P1
**Resp. :** espace professionnel enseignant.  
**Acteurs :** Enseignant.  
**Données :** TeachingAssignment, LMS, Grades, Attendance.  
**API :** `GET /api/v1/portal/teacher/dashboard`

## MODULE 03 — Admissions & Inscriptions · P1
**Resp. :** candidature → admission → inscription.  
**Événements out :** APPLICATION_SUBMITTED/APPROVED/REJECTED, STUDENT_REGISTERED.  
**Règles :** pas d'inscription sans validation ; pièces obligatoires configurables.

## MODULE 04 — Finance & Paiements · P1
**Resp. :** frais, échéanciers, Mobile Money, cartes.  
**Événements :** PAYMENT_INITIATED/CONFIRMED/FAILED.  
**Règles critiques :** confirmation serveur webhook signé ; idempotence `provider_ref` ; jamais confiance au retour navigateur seul.

## MODULE 05 — LMS · P2
**Resp. :** cours numériques, devoirs, QCM, progression.  
**Événements :** COURSE_PUBLISHED, ASSIGNMENT_SUBMITTED.

## MODULE 06 — Classes virtuelles · P2
**Resp. :** sessions Jitsi sécurisées, calendrier, enregistrements autorisés.

## MODULE 07 — Notes & Résultats · P1
**Resp. :** notes, ECTS, délibérations, rattrapages.  
**Événements :** GRADE_SUBMITTED, RESULT_VALIDATED.  
**Règles :** verrouillage post-délibération + audit de toute modification.

## MODULE 08 — Admin dématérialisée · P1
**Resp. :** demandes documents, workflow, e-sign, QR authenticité.  
**Événements :** DOCUMENT_GENERATED.

## MODULE 09 — Stages & Insertion · P2
**Resp. :** offres, conventions, suivi, évaluations entreprises.

## MODULE 10 — Alumni · P2
**Resp. :** réseau diplômés, mentorat, events.  
**Trigger :** DIPLOMA_ISSUED → invitation Alumni.

## MODULE 11 — Bibliothèque · P2
**Resp. :** catalogue, droits d'accès, emprunts.

## MODULE 12 — Assistant IA · P3
**Resp. :** RAG documents officiels, assistants par rôle.  
**Garde-fous :** pas de décision admissions/finance/notes sans humain ; citations sources.

## MODULE 13 — Événements · P2
**Resp. :** calendrier, inscriptions, QR, certificats.

## MODULE 14 — Recherche & Innovation · P3
**Resp. :** labs, projets, publications, appels.

## MODULE 15 — Messagerie · P1
**Resp. :** DM, groupes, annonces institutionnelles, push.

## MODULE 16 — BI & Pilotage · P1
**Resp. :** indicateurs réels direction ; exports PDF/Excel.  
**Règle :** zéro KPI fictif en production.

## MODULE 17 — Smart Campus · P3
**Resp. :** infra, énergie, alertes ; extensible IoT.

## MODULE 18 — Parkings · P3
**Resp. :** places, réservations, véhicules.

## MODULE 19 — Contrôle d'accès · P3
**Resp. :** badges numériques, visiteurs, journaux.

## MODULE 20 — Maintenance prédictive · P3
**Resp. :** inventaire, tickets, planning, coûts.

## MODULE 21 — Urgences · P3
**Resp. :** signalements, alertes prioritaires, évacuation.  
**Événements :** EMERGENCY_REPORTED.

## MODULE 22 — Student Wallet · P2
**Resp. :** identité numérique + historique paiements campus.  
**Règle :** pas d'établissement de monnaie électronique ; PSP agréés uniquement.

## MODULE 23 — Réclamations & Médiation · P2
**Resp. :** dépôt, workflows, confidentialité, délais.

## MODULE 24 — Student Life · P3
**Resp. :** clubs, annonces, entraide.

## MODULE 25 — Bourses & Aides · P2
**Resp. :** critères, dossiers, suivi.

## MODULE 26 — Mobilité internationale · P3
**Resp. :** partenariats, échanges, équivalences.

## MODULE 27 — Digital Twin · P4
**Resp. :** cartographie 2D/3D PostGIS, salles, simulation.

## MODULE 28 — RH · P2
**Resp. :** dossiers personnel, congés, vacataires/permanents.

## MODULE 29 — Assurance Qualité · P2
**Resp. :** évaluations formations/enseignements, audits.

## MODULE 30 — Cybersécurité & Gouvernance · P0
**Resp. :** auth, RBAC, logs, incidents, rétention, surveillance.  
**Transversal obligatoire dès le socle.**

---

## Matrice de livraison (résumé)

| Vague | Modules |
|-------|---------|
| Socle | 30, Identity, Academic refs, Events, Notifications, Portails shell (01/02) |
| Vague A | 03, 04, 07, 08, 15, 16 |
| Vague B | 05, 06, 09, 11, 22, 23, 25, 28, 29 |
| Vague C | 10, 12, 13, 14, 24, 26 |
| Vague D | 17–21, 27 |
