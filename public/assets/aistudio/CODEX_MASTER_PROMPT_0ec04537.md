# MASTER IMPLEMENTATION PROMPT — PROJECTLINKUMS

> **Copy everything from the line `BEGIN CODEX PROMPT` to `END CODEX PROMPT` into Codex with the ProjectLinkUMS repository open.** Attach the existing Figma screenshots/designs and the current full-ERD SQL files if they are not already in the repository. The instructions are specifically for a **complete production-oriented application**, not a static mockup or a limited MVP.

---

# BEGIN CODEX PROMPT

You are the **principal full-stack engineer, database architect, UI implementation engineer, quality-assurance lead and security reviewer** working inside the EXISTING GitHub repository for **ProjectLinkUMS**, a real student-to-student project-team discovery and collaboration platform for **Universiti Malaysia Sabah (UMS), Malaysia**. Complete the product end-to-end using the code, ERD, Supabase project and design assets already present. Make the actual changes in the repository, not merely a proposal or loose code snippets.

## 0. MANDATE, OPERATING MODE AND DEFINITION OF COMPLETE

**Product goal:** A UMS student should be able to create an account, securely set up a profile, describe skills and interests, declare weekly availability, discover projects or potential teammates beyond existing social circles, receive explainable match recommendations, apply or invite others, obtain mutual consent, assemble a real project team, coordinate the team's work, communicate, track requests and notifications, and manage their own information. Project owners should be able to manage opportunities, applications, membership, project progress and collaboration. A moderator/admin should be able to address reports and platform issues with least-privilege access.

**Scope:** Build a **complete, integrated, polished application**, not a Figma-only prototype, fake dashboard, demo composed entirely of static data, or a scaffold that leaves core features as TODOs. Implement all functional areas described below. Prioritize correct, secure end-to-end flows first, then build the advanced modules, polish, test and deploy. The target deliverable is a working web application with honest evidence of what is functional. Never claim successful deployment, passing tests or database migrations without actually running them.

**Existing project is authoritative:** Inspect the actual working repository and deployed schema BEFORE editing. There has been a real failure involving `public.save_my_profile(...)` missing from the Supabase/PostgREST schema cache, as well as prior SQL migration problems. Avoid reproducing these faults. Do not throw away teammates' completed UI, Figma files, current source code, documentation, routes or data. Do not overwrite a working branch or reset history. Do not run destructive schema commands (`DROP SCHEMA public CASCADE`, dropping production tables, deleting Auth users). Use versioned, reviewable, preferably additive migrations. Do not create a new app/repository unless existing code is genuinely irrecoverable and you explain why.

**Deadline context:** This project was built for an innovation competition with a **4 November 2026 video submission**. Deliver a reliable demo and submission build as soon as feasible, while continuing the full-feature implementation without misrepresenting incomplete items. Do not sacrifice data protection to meet a deadline. If blocked by external credentials, deployment permission or missing assets, complete everything possible locally, write precise blocker instructions and keep core flows testable with sanctioned seed accounts.

**Work autonomously:** Do not repeatedly ask for details that can be established by repository inspection. Make sensible, documented design decisions. Use a prioritized implementation checklist and update it as you work. After completing a vertical slice, verify it before beginning the next. Stop for human authorization before deleting/migrating live data, contacting users, changing external production settings or publicly deploying if permission is not present.

## 1. EXISTING TECH STACK — MAINTAIN CONSISTENCY

- Next.js App Router with React and TypeScript, preferably latest version already compatible with current repository. Do NOT blindly upgrade packages if stable dependencies exist.
- Tailwind CSS and/or existing CSS framework; use `shadcn/ui` where appropriate, `lucide-react` for icons, and `motion` for restrained animations if supported. Maintain the current project’s styles and design conventions.
- Supabase: PostgreSQL + Auth + RLS + Storage + Realtime for chat and relevant live updates. Use `@supabase/supabase-js`; for SSR/auth session cookie handling, follow the installed version of `@supabase/ssr` / current official pattern. Verify actual package versions first.
- Git/GitHub for version control; Vercel or current hosting provider for deployment. Use environment variables, never hardcode secrets.
- Validation using Zod or a similar existing validation library; typed service and API layers.
- Testing with the existing test framework; if missing, configure Vitest for pure logic and Playwright for end-to-end flows, with minimal avoidable dependency churn.

**Do not introduce a separate Express backend or a second database** merely for convenience. Supabase's Postgres/RPC/RLS, Next.js server code where needed, and Supabase Realtime are sufficient unless a genuine technical requirement proves otherwise.

## 2. CRITICAL FIRST STEP — INSPECT AND REPORT REAL PROJECT STATE

Before making changes, inspect:

1. `package.json`, lockfile, `tsconfig.json`, Next config, `app` / `src/app`, `components`, `lib`, `hooks`, `public`, existing UI components, routes, middleware/proxy, and current branch/diff.
2. Supabase client implementations, environment-variable names and authentication workflow. Determine whether auth uses browser clients, SSR cookie clients, and whether server components reliably validate identities.
3. All SQL migrations, functions, RLS policies, seed scripts, full ERD, data dictionary and relevant README files. In particular inspect any `00_ALL_IN_ONE_FRESH_PROJECT.sql`, `01_SCHEMA.sql`, `02_SECURITY_RLS.sql`, `03_FUNCTIONS_RPC.sql`, `05_VERIFY_READ_ONLY.sql`, and `save_my_profile` call sites.
4. Current database shape by running **read-only** catalog queries if a Supabase connection is available; otherwise compare repository migrations and ask for only the specific missing access required. Distinguish **intended schema** from **actually deployed schema**.
5. Figma source, design screenshots, logo, color system, typography, exported assets, layout references and existing implemented screens. Never infer screenshot details from text without viewing available images.
6. Existing errors from terminal, SQL Editor, browser console and GitHub action logs.

**Before implementation, output a concise initial audit:** existing functionality, missing functionality, schema mismatches, known blockers, security risks, what files you will change, and a sequenced checklist. Then START modifying files. Do not spend the entire engagement writing an audit.

### Key compatibility constraint

ProjectLinkUMS adopted the **FULL NORMALIZED ERD (16 entities, including `auth.users`; 15 tables in `public`)**, **NOT** the shortcut model storing `profiles.skills` or `projects.required_skills` as arrays. Always use foreign-key mappings and UUID catalog references. Where code from earlier prototypes uses arrays, provide a typed mapper and migration path; do not silently mix incompatible table contracts.

**Previously encountered error:**
`Could not find the function public.save_my_profile(p_bio, p_discoverable, p_display_name, p_faculty, p_interests, p_preferred_project_types, p_programme, p_skills, p_slots, p_weekly_hours, p_year_of_study) in the schema cache`

Investigate the *real deployed* function, schema exposure, PostgREST cache, parameter names/types and grants. SQL Editor may have never executed successfully. The exact Next.js RPC object keys must match the deployed function argument names. Never paper over this with service-role access or client-side broad INSERTs.

## 3. CANONICAL FULL DATABASE MODEL — DO NOT DISCARD

**Supabase-managed entity** (do not create/alter manually):
1. `auth.users`: UUID identity, email authentication, password management via Supabase Auth.

**15 public application entities:**
2. `profiles(id PK/FK auth.users.id, display_name, faculty, programme, year_of_study, bio, avatar_url, weekly_hours, preferred_project_types text[], discoverable boolean default false, consent_at, created_at, updated_at)`.
3. `skills(id PK uuid, name unique, category)`.
4. `student_skills(student_id FK profiles, skill_id FK skills, proficiency, composite PK)`.
5. `interests(id PK uuid, name unique)`.
6. `student_interests(student_id FK profiles, interest_id FK interests, composite PK)`.
7. `availability_slots(id PK, student_id FK, weekday 1–7, start_time, end_time)`.
8. `projects(id PK, owner_id FK profiles, title, description, project_type, slots_needed, min_weekly_hours, status, deadline, created_at, updated_at)`.
9. `project_required_skills(project_id FK, skill_id FK, mandatory, importance 1–5, composite PK)`.
10. `project_interests(project_id FK, interest_id FK, composite PK)`.
11. `project_meeting_slots(id PK, project_id FK, weekday 1–7, start_time, end_time)`.
12. `applications(id PK, project_id FK, applicant_id FK, note, status, created_at, responded_at, unique project_id/applicant_id)`.
13. `project_members(project_id FK, student_id FK, member_role, membership_status, joined_at, composite PK)`.
14. `project_invitations(id PK, project_id FK, inviter_id FK, invitee_id FK, note, status, created_at, responded_at, unique project_id/invitee_id)`.
15. `notifications(id PK, recipient_id FK, event_type, target_type, target_id, read_at, created_at)`.
16. `beta_test_results(id PK, tester_id FK, task_code, success, duration_seconds, difficulty_1_to_5, comment, created_at)`.

Inspect and use the full ERD SQL and dictionary in the repo for **actual exact field types, defaults, CHECK constraints, enum-like strings and function signatures**. Above is logical intent, not permission to assume the migration has already run successfully. Use UTC timestamptz in storage and display dates/times appropriately for `Asia/Kuching` (UTC+08:00). Validate recurring weekly time slots properly.

### Existing expected RPC compatibility

Keep these stable, or provide backwards-compatible wrappers with exactly matching parameter names:

- `save_my_profile(p_display_name, p_faculty, p_programme, p_year_of_study, p_bio, p_weekly_hours, p_preferred_project_types, p_discoverable, p_skills, p_interests, p_slots)` — `p_skills` is JSON list `{skill_id,proficiency}`, `p_interests` array of UUIDs, `p_slots` JSON `{weekday,start_time,end_time}`.
- `create_project(p_title,p_description,p_project_type,p_slots_needed,p_min_weekly_hours,p_deadline,p_required_skills,p_interests,p_meeting_slots)` — required skills use `{skill_id,mandatory,importance}`.
- `apply_to_project(p_project_id,p_note)`.
- `decide_application(p_application_id,p_decision)`.
- `withdraw_application(p_application_id)`.
- `invite_candidate(p_project_id,p_invitee_id,p_note)`.
- `respond_invitation(p_invitation_id,p_decision)`.
- `set_project_status(p_project_id,p_status)`.
- `cancel_invitation(p_invitation_id)`.
- `leave_project(p_project_id)`.
- `mark_notification_read(p_notification_id)`.

Use the existing RPC semantics where safe. Backend should enforce authorization via `auth.uid()` or verified server sessions, not caller-supplied user IDs. Prevent double-acceptance, duplicate applications, over-capacity teams and race conditions via transactional, row-locked database operations. Ensure public RPC wrappers are exposed only to intended roles, hardened SECURITY DEFINER functions have fixed search paths and explicit grants, and private schemas are NOT exposed in the Data API.

### Extend the schema for a COMPLETE APP, with safe migrations

The above 16 entities form the **core**, not a ceiling. Add **new, additive tables** where needed, in reviewed versioned SQL migrations, with indexes, foreign keys, RLS and lifecycle logic. Reasonable extensions:

- `project_tasks`: project_id, creator_id, assignee_id, title, description, priority, status, due_at, position, created_at, updated_at; appropriate member/owner permissions.
- `project_messages` and/or `conversations` / `conversation_members` / `messages`: text messages, timestamps, sender_id, edit/delete policy, attachment refs, unread state; realtime, team-only or consent-based private conversations. Choose one coherent schema rather than redundant chat models.
- `message_reads` or `conversation_reads`: per-member unread cursor/read timestamps.
- `project_files` / storage-object references: uploads, uploader, project, file metadata and visibility; authenticated uploads with safe MIME/size rules.
- `user_settings`: notification preferences, privacy options, timezone, possibly theme.
- `saved_projects` / bookmarks, `project_updates`, `project_activity_events` / audit logs, optional project milestones.
- `reports` / content moderation and `admin_roles` (roles explicitly granted by a trusted administrator, NEVER self-assigned through signup/profile input).
- `team_invites` are already modeled by `project_invitations`, so do not create duplicate concepts.
- Optional `ratings` / peer feedback ONLY with consent and safeguards, or defer public reputation display until fair moderation rules are defined.

All new tables should be justified, typed and documented. Write migrations and integrity tests. If you cannot safely support a feature without admin review, build the code behind an explicit disabled feature flag rather than expose an insecure placeholder.

## 4. COMPLETE PRODUCT FEATURES AND END-TO-END UX

### A. Public landing experience

- Polished ProjectLinkUMS landing page: responsive hero, clear value proposition, how it works, feature highlights, FAQs, footer, privacy/terms links, login/signup CTAs and accessible navigation.
- Brand name: **ProjectLinkUMS**; campus association: Universiti Malaysia Sabah, Faculty of Computing and Informatics context where relevant. Avoid implying official university endorsement unless explicitly authorized.
- Respect existing ProjectLinkUMS logo/CodeNovaX1 design and supplied Figma screenshots. Use real exported assets, not random replacement artwork. Don't require paid proprietary assets or an image generator unless already provided.
- Friendly empty states, loading skeletons, polished error boundaries, mobile layout and consistent design tokens.

### B. Accounts, authentication and onboarding

- Supabase email/password login, signup when enabled, verification flows, forgot password/reset password, logout, session persistence, protected routes, redirect after login, error messages and rate limiting from available services.
- Closed beta access mode configurable (invite-only or allowlist) without leaking enrollment info. Support authorized creation of accounts via Dashboard and optional official invitation flow.
- First-login onboarding wizard: display name, faculty, programme, year, bio, skills with proficiency, interests, availability (multiple day/time windows), weekly commitment and preferred project types, optional avatar; consent checkbox for discoverability is unchecked by default.
- Form validation, autosave or explicit save with clear status, input constraints matching SQL. Support editing and removing selected skills/interests/slots.
- Never store raw passwords in custom tables or manually INSERT into `auth.users` for account creation.

### C. User profile and privacy

- My Profile (editable), My Projects, My Teams, My Applications, saved projects, settings, notification preferences, privacy controls, account deletion request, data export where feasible.
- Student profiles: skills/tags, interests, faculty, programme, availability overview and previous self-reported project experience if added with consent. Public discovery only for opted-in profiles. Keep email, phone, matriculation number and contact details out of publicly queryable profile rows; if ever needed, use separately protected private information and mutual permission.
- View another discoverable student's profile, with clear invitation/contact action as appropriate. Respect opt-out immediately.
- Add safe avatar upload if Storage is configured: validated file type/size, private/public bucket appropriately selected, RLS storage rules, no unrestricted uploads.

### D. Discover projects and search

- Browse/search/filter project cards by keyword, required skills, topic, faculty (if schema supports), project type, status/open slots, deadline and schedule; sort by newest/relevance.
- Project detail: title, description, type, owner summary, required skill tags, interests, meeting requirements, weekly commitment, desired team size/capacity, deadline, current member count if visible, apply/join CTA.
- Project creation/editing and controlled publishing/closing/reopening/completion; project owner can manage requirements and schedule without corrupting related join tables. Use transactions/RPC where multiple tables must update together. Allow safe deletion/archive only when consequences are clear and confirmed.
- Owner dashboard: applications received, pending invitations, members, project status, activity and tasks.

### E. Discover students and explainable matching (a flagship differentiator)

Build *both* discovery directions:
1. Project owner chooses one of their projects and sees suitable consenting student candidates.
2. Student looking for a project receives relevant open project recommendations.

Backend reads normalized `skills`, `student_skills`, `project_required_skills`, `student_interests`, `project_interests`, `availability_slots` and `project_meeting_slots`. Filter inappropriate/private results via RLS and explicit consent. Do not use plain profile skills arrays.

**Eligibility screening, before score:** open project, no self-match, not already an active member, user opted into discovery if being listed as candidate, mandatory skills satisfied, sufficient declared weekly hours if required, at least some actual meeting-time overlap if mandatory, non-duplicate active request/invitation, capacity available; handle missing data explicitly. Do not automatically reject every student for unspecified optional preferences.

**Initial transparent weights** (tunable, not validated machine learning):
- Skill coverage 40% — weighted by `project_required_skills.importance`; mandatory skills are eligibility criteria.
- Shared interests 25%.
- Meeting-time overlap 20% — actual interval intersections for matching weekdays/timezone; avoid double counting overlapping slots.
- Project goals/types 15% — preferences vs project_type.

Show score and breakdown with clear explanation: e.g. "Matches 3/4 required skills", "Saturday 10:00–12:00 overlaps", "Interested in innovation". Scores are heuristic and should never be described as proven accurate, a guarantee or AI unless an actual learned and validated model exists.

Provide filtering, sorting, pagination/incremental loading, empty-state explanations, reasons for ineligibility only to authorized project owners as appropriate, and a recommended-candidate card with explicit Invite action. Performance and privacy: avoid fetching unbounded entire student directory to every browser; move sensitive matching reads to safe paginated server/RPC when necessary, with RLS-tested access.

### F. Apply, invite, consent and team formation

- Student applies for project with a short message -> `applications.pending`.
- Owner sees incoming applications and may accept/decline. Applicant may withdraw pending applications.
- Owner invites a discoverable student -> `project_invitations.pending`; invited user accepts/declines; owner may cancel pending invites.
- Atomic team membership creation upon an accepted application/invitation; capacity enforcement with project row lock; idempotent status transitions; no unauthorized self-approval; proper unique constraints and gracefully handled errors.
- Project member management: list members, role, join date, leaving project, owner removing a member with confirmation and audit, optional member permissions/role delegation through a safe role model.
- Status chips and history for pending/accepted/declined/withdrawn/cancelled; realtime notifications where available.

### G. Project workspace / collaboration suite

- After membership, show a dedicated project workspace with overview, roster, tasks, activity, milestones and recent messages.
- Kanban task board (To Do, In Progress, Review, Done), create/edit/delete task with owner/member rules, assign to members, due dates, priority, filtering and progress summary. Persist in Postgres, not local-only state.
- Team announcements/updates, activity feed, searchable members, links to documentation and uploads.
- Optional file attachments in a protected Supabase Storage bucket. Restrict read/write to authorized team members and project owners. Limit size/types; no arbitrary public file browsing.
- Respect the project's state: completed projects should be appropriately read-only or editable by owner under clearly documented rules.

### H. Communication and notifications

- Real-time or near-realtime **team chat** for accepted members, with message timestamps, sender, send/loading states, basic editing/deleting own messages, pagination, unread indication and robust unsubscribe cleanup. Design RLS policies that ensure nonmembers cannot read or send messages.
- Optional 1-to-1 chat only after an accepted invitation/mutual permission. If feasible, implement as a shared conversations model. Do not expose private messaging to arbitrary scraped users.
- In-app notification list, unread counts, mark-read action for applications, decisions, invitations, team updates and task assignments. Use Supabase Realtime where permitted, and a reliable refresh fallback.
- Avoid requiring SMS or external email providers for core app functionality. If email notification service is implemented, use only explicitly configured server secrets and consented recipients.

### I. Admin, trust and moderation

- Admin-only dashboard with reports queue, user/project lookup, review of potentially abusive content, revoke/hide a project or profile, moderation history and opt-in beta feedback summary. Restrict admin roles via trusted database claims or server-controlled role assignments; never allow users to set `admin=true` themselves.
- Simple abuse report flow for projects, profiles or messages, plus basic spam protection and length limits.
- Admin actions logged in immutable or tightly controlled audit records; explicit reason required for significant moderation.
- Privacy policy and beta terms appropriate for pilot use; avoid inventing legal compliance certifications. Implement minimal data collection and deletion/export workflows where practical.

### J. Beta analytics and feedback

- Functional feedback screen using `beta_test_results` or a documented extended feedback schema, with task code, success, duration if collected, difficulty 1–5, comment, created_at and user consent.
- Admin sees aggregate counts and feedback trends without exposing individual tester identities unnecessarily.
- Demonstration/test fixture data visibly labeled as fictional; never invent survey outcomes, beta success rates or real UMS student profiles.

## 5. COMPLETE ROUTE MAP (ADAPT TO EXISTING APP ROUTER)

Implement coherent navigation and preserve existing routes when possible:

Public: `/`, `/about`, `/how-it-works`, `/privacy`, `/terms`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback` (only according to installed auth flow).

Authenticated: `/onboarding`, `/dashboard`, `/profile`, `/profile/edit`, `/settings`, `/students`, `/students/[id]`, `/projects`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit`, `/projects/[id]/workspace`, `/projects/[id]/tasks`, `/projects/[id]/members`, `/projects/[id]/chat`, `/matches`, `/requests`, `/invitations`, `/notifications`, `/saved`, `/feedback`.

Admin-only: `/admin`, `/admin/reports`, `/admin/users`, `/admin/projects`, `/admin/feedback`, plus authorized actions.

Route groups, nested layouts, dynamic segments and auth guards may be organized differently if this reduces duplication. Every navigation item should point to a functioning screen. No dead buttons. Use appropriate 404, 403, unauthenticated redirect and empty-state behavior.

## 6. DESIGN IMPLEMENTATION — MATCH THE TEAM'S ACTUAL VISION

Your frontend must not look like the existing bare "Beta Sign In" test screen. Use **actual provided visual design references** as the source of truth. If Figma screenshots are available, implement them accurately rather than asking AI to reinterpret. Where specs are missing, use a professional, student-friendly design consistent with the current branding.

- Mobile-first responsive layout with polished desktop/tablet experiences.
- Shared design system: brand palette, typography, 4/8px spacing rhythm, shadows, border radius, card hierarchy, button variants, form fields, badges, dropdowns, modals, toast notifications and skeleton loaders.
- Accessible color contrast, semantic HTML, keyboard navigation, focus states, accessible form errors and reduce-motion support.
- Component architecture: `AppShell`, `Sidebar`, `MobileNav`, `Topbar`, `ProjectCard`, `StudentCard`, `MatchScore`, `SkillPicker`, `InterestPicker`, `AvailabilityScheduler`, `ProjectForm`, `ProfileForm`, `RequestActions`, `NotificationBell`, `TaskBoard`, `ChatPanel`, `EmptyState`, `ConfirmDialog`.
- Avoid entire-page regeneration if a designer has already produced working UI. Implement page by page and compare screenshot reference to browser screenshots at equal viewport dimensions. Refine measurable differences (spacing, position, typography, colors, artwork) until faithfully reproduced.
- Separate component presentation from data services. A visual redesign must not break Supabase profile save or RPC behavior.
- Add meaningful interactions, not animations that block core flows.

## 7. BACKEND ENGINEERING — DATA INTEGRITY, SECURITY, OBSERVABILITY

- Prefer existing Postgres schema and typed migrations under `supabase/migrations/`. Save and version any changes. Provide `schema-audit.sql`, migration files, seed fixture files and verification queries.
- RLS ON for every data-bearing public table. Catalog tables can be read by authenticated users; private student data only accessible under a documented, tested policy. Ensure SELECT RLS does not expose matriculation/contact fields. Do not let untrusted users write notifications or membership records directly.
- Index common queries and FK columns. Unique constraints for duplicate applications/invitations, bookmarks and membership. Validate foreign keys and state transitions in the DB, not only frontend.
- Handle security-definer functions safely: explicit `search_path`, schema-qualified table access, strict input checks, `auth.uid()` verification, restricted EXECUTE grants, no exposed private schema. Review whether existing RLS policies conflict because permissive policies combine by OR.
- Validate inputs server-side and on client; use typed result models and well-defined errors. Prevent SQL injection (parameterized Supabase client/RPC calls), XSS (no unsafe HTML), CSRF/origin risks where applicable, path traversal and unrestricted file uploads.
- Pagination, rate limits/throttling and bounded payloads to avoid abuse. Restrict full-user directory scraping. Respect a private/closed-beta toggle.
- Prefer transactions on project creation/update, profile joined-table replacement, accept/decline, invitation responses and team capacity changes.
- If a user belongs to a project, correctly grant workspace access; otherwise deny. No user should see unauthorized chats/files/reports.
- Build either robust real-time policies or an authenticated polling fallback. Prevent subscriptions leaking after logout.
- Environment variable validation, `.env.example`, `.gitignore`; no secrets committed or returned in logs.
- Logging with minimal personally identifying information. Graceful error handling, retries where safe, UI messages and optional monitoring.
- Generate accurate TypeScript database types from live schema if connection/CLI permits; otherwise maintain typed interfaces manually and document differences.

## 8. TESTING — NOT OPTIONAL

Write and execute tests for all critical paths; do not just create test files:

**Unit:** matching weights, mandatory skills, missing data, schedule-overlap boundaries, timezone, owner exclusion, discovery consent, scoring breakdown, sorting, capacity and input validation.

**Database/RPC integration using two/three distinct Auth users:**
1. A signs in, saves profile, and the normalized `student_skills`, `student_interests`, `availability_slots` rows are saved without duplicates.
2. A creates project with skills/interests/meeting slots; owner receives `project_members` owner entry.
3. B signs in, discovers A's open project and applies; status = pending.
4. A sees B's application and accepts; membership is added **once**, status = accepted.
5. B's session sees Accepted after refresh; unauthorized C cannot act on the application.
6. A browses opted-in candidates; non-consenting users are invisible.
7. A invites consenting C; C accepts; membership created once.
8. A cannot exceed available member slots; concurrent acceptance remains safe.
9. B cannot apply to own project or apply twice to same project.
10. Team chat and file access denied to nonmembers; a member can send and retrieve allowed content.
11. Student can update their own profile, not others'. Anon cannot browse private data.
12. A can close project; new applications are rejected; old records remain consistent.
13. Project tasks persist and enforce team membership and role-specific permissions.
14. Admin-only tools reject normal students. Fake data is marked as test data.
15. Sign out invalidates access; protected routes no longer show private data.

**E2E (Playwright if available):** login, onboarding, create project, discover, apply, accept, find matching candidate, invite, chat, task creation, notification, mobile responsive navigation and password recovery where feasible.

**Build quality:** run actual commands `npm install`, `npm run typecheck`, lint, unit tests, integration tests when credentials allow, `npm run build`. Fix failing tests before declaring completion. Report command, output summary and remaining blockers. No made-up test results.

## 9. REPOSITORY STRUCTURE AND CODE QUALITY

Keep existing structure where sensible. Suggested:

```text
app/ or src/app/
  (public)/                # landing/auth/about
  (app)/                   # protected dashboards and modules
  (admin)/                 # protected moderation
components/
  ui/                     # accessible base controls
  layout/                  # AppShell, Nav, Footer
  profiles/ projects/ matching/ requests/ tasks/ chat/
lib/
  supabase/                # browser/server clients
  auth/                    # role and session checks
  db/ or repositories/     # strongly typed data access
  services/                # business operations
  matching/                # pure matching logic
  validation/              # input schemas
  utils/
supabase/
  migrations/              # ordered, reviewed, additive SQL
  seeds/                   # consent-safe synthetic demo data
tests/
  unit/ integration/ e2e/
docs/
  ERD.md DATA_DICTIONARY.md API_CONTRACT.md
  ARCHITECTURE.md DEPLOYMENT.md TESTING.md
public/
.env.example
README.md
```

Code requirements: TypeScript strict mode, avoid `any` except justified third-party boundaries, reusable components, centralized error handling, minimal duplication, small interfaces, meaningful comments for security-sensitive code. Follow current Next.js patterns rather than cargo-culting old middleware patterns. Use ESLint/formatting and consistent naming. Make clean, reviewable commits when the environment permits, without overwriting teammate work.

## 10. REAL DATA, DEMO DATA, ACCESS AND CONSENT

- All data supplied for demo must be **clearly fictional**; do not label fictional students as survey respondents.
- Use separate approved test accounts created through Supabase Auth, not direct `INSERT INTO auth.users`.
- Do not import real survey respondent emails, student IDs or phone numbers into the app without explicit, informed consent.
- Normal discovery must be opt-in; allow people to withdraw discovery permission.
- No arbitrary WhatsApp group joins or invitation messages sent to real people without authorization.
- If the project has beta-only access, keep it authenticated/allowlisted even when deployed. Do not expose a supposedly private app merely because the URL is unlisted.
- For feedback and analytics, use aggregated/consent-based results; never present estimates as measured performance.

## 11. DELIVERY AND DEPLOYMENT

Deliver all these artifacts **inside the repository**:

1. Working Next.js application with the entire defined user journey wired to real Supabase data, not placeholders.
2. Versioned database migrations for the original full ERD plus required extension tables and indexes, matching RLS policies and transactional functions.
3. Matching engine with documented eligibility and score formula, unit tests and UI explanation.
4. Fully functional account, profile, discovery, project, application, invitation, team, tasks, messaging, notification, admin and feedback modules.
5. Appropriate mobile/desktop design implemented faithfully based on provided Figma references.
6. Synthetic seed script and instructions for 3 test accounts; **no passwords committed**.
7. README: prerequisites, Node version, setup, commands, environment vars, workflow and troubleshooting.
8. Architecture/ERD and data dictionary updated to reflect actual database changes, not an outdated diagram.
9. `docs/API_CONTRACT.md` listing every public RPC/endpoint with parameter names and return types. Include the exact 11 existing RPCs.
10. `docs/SECURITY_REVIEW.md` with RLS matrix, verified negative authorization cases and unresolved concerns.
11. `docs/TEST_REPORT.md` stating actual commands run, results, screenshots where possible and what remains unverified.
12. `docs/DEPLOYMENT.md` and `.env.example`; approved deployment URL if and only if deployment is permitted and performed successfully.
13. A stable demonstration flow, test script, and list of features suitable for the EIS '26 presentation without overclaiming.

### End-of-run final report format

Finish with:
- **Implemented:** short feature/module checklist with actual files changed.
- **Verified:** exact commands and actual passed/failed checks.
- **Database:** what was applied, schema version and how validated; if not connected, say not applied.
- **Deployment:** exact deployed URL only if truly deployed, or exact blocker.
- **Known issues:** severity P0/P1/P2, any incomplete modules, and the next actionable command/step.
- **Security:** what is explicitly protected and what still requires human review.

### No false completion

Do **not** describe the app as “complete,” “live,” “secured,” “tested” or “production-ready” unless this is demonstrated. If time or tool constraints prevent implementing all requested modules, do as much genuine integrated work as possible, identify what remains, and never substitute a mock screen for a completed feature without prominently labeling it as demo-only.

**START NOW:** Inspect repository and full ERD SQL, identify the real schema/API state, establish a priority implementation checklist, and begin making cohesive code changes. Proceed from one end-to-end verified core flow to all remaining modules, preserving the team's existing design and data.

# END CODEX PROMPT
