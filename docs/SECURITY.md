# IUA DIGITAL CAMPUS — Sécurité & Gouvernance

---

## 1. Principes

- Security by design / least privilege
- Vérification **côté serveur** de chaque opération protégée
- Secrets hors code (variables d'environnement / vault)
- Pas de données personnelles réelles hors production
- Traçabilité des opérations sensibles

---

## 2. Authentification

| Contrôle | Mesure |
|----------|--------|
| Mots de passe | Argon2 / PBKDF2 Django, politique longueur + complexité |
| Sessions | JWT HttpOnly cookies (`iua_access` / `iua_refresh`) + CSRF double-submit (`iua_csrf` + `X-IUA-CSRF`) |
| Access TTL | 15 minutes ; refresh blacklisté au logout / rotation |
| MFA | TOTP (pyotp) pour rôles sensibles (finance, direction, admin) |
| Brute force | Rate limit login + lockout progressif |
| Reset password | Tokens one-time, TTL court |
| Tokens body | Désactivés en prod (`IUA_EXPOSE_TOKENS_IN_BODY=false`) |

---

## 3. Autorisation (RBAC + scopes)

Rôles système : `super_admin`, `direction`, `academic_dir`, `finance_dir`, `admin`, `faculty_head`, `dept_head`, `teacher`, `student`, `researcher`, `librarian`, `hr`, `it`, `lab_head`, `partner`, `alumni`, `visitor`.

Permissions format : `module.resource.action` (ex. `grades.grade.update`).

Scopes optionnels : `faculty_id`, `program_id`, `cohort_id`.

---

## 4. Protections applicatives

- ORM Django → anti SQLi
- Templates/React échappement → XSS
- CSRF double-submit sur mutations cookie-auth (middleware + front)
- Headers sécurisés (CSP, HSTS, COOP/CORP, X-Frame-Options) via Nginx + ExtremeSecurityMiddleware
- Media authentifié (`/api/v1/media/`) — `/media/` public refusé en nginx
- Upload : types MIME allowlist, scan taille, stockage hors webroot
- HTTPS obligatoire en prod
- CORS credentials + origines connues uniquement
- Conteneurs Docker non-root (`USER iua`)
- DSAR : `GET /api/v1/privacy/export/` + demande d'effacement auditée

---

## 5. Paiements

- Confirmation **uniquement** via webhook signé du PSP
- Idempotence sur `provider_transaction_id`
- Journal immutable des tentatives
- Séparation des rôles finance / opérationnel

---

## 6. Données personnelles (CI)

- Inventaire des traitements
- Minimisation & rétention (`core_data_retention_policy`)
- Droit d'accès / rectification / effacement (procédure)
- Chiffrement transit (TLS) + at-rest DB/disques prod
- Journalisation accès aux dossiers sensibles

---

## 7. Audit & détection

- `core_audit_log` : who/what/when/before/after
- Logs connexions et échecs
- Alertes activités suspectes (Phase 30 avancée)
- Dead-letter events monitorés

---

## 8. Infrastructure

- Images Docker non-root
- Secrets : `.env` local, secrets manager prod
- Backups chiffrés + tests restore
- Séparation réseaux (db non exposée)
- CI : scans dépendances (pip-audit, npm audit)

---

## 9. Tests de sécurité obligatoires

- Permissions négatives (étudiant A ≠ notes étudiant B)
- Idempotence webhooks paiement
- Verrouillage délibérations
- Accès URL forcé → 403
- Pas de secrets dans le dépôt (gitleaks)
