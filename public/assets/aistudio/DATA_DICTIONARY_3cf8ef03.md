# ProjectLinkUMS — Full Data Dictionary (16 Entities)

This dictionary is generated from the accompanying `01_SCHEMA.sql` for developer consistency.
**Supabase-managed:** `auth.users(id UUID PK, email, ...)` is not created or modified. Student profiles reference `auth.users(id)`.

## Normalized public tables

### profiles
Public display profile; no contact, matriculation number or email. Visibility requires active opt-in or a direct collaboration relationship.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` |
| `display_name` | `text` | `NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 120)` |
| `faculty` | `text` | `NOT NULL CHECK (char_length(btrim(faculty)) BETWEEN 2 AND 120)` |
| `programme` | `text` | `See constraints in SQL` |
| `year_of_study` | `smallint` | `CHECK (year_of_study BETWEEN 1 AND 8)` |
| `bio` | `text` | `CHECK (bio IS NULL OR char_length(bio) <= 1500)` |
| `avatar_url` | `text` | `See constraints in SQL` |
| `weekly_hours` | `smallint` | `CHECK (weekly_hours BETWEEN 0 AND 168)` |
| `preferred_project_types` | `text` | `[] NOT NULL DEFAULT '{}'::text[]` |
| `discoverable` | `boolean` | `NOT NULL DEFAULT false` |
| `consent_at` | `timestamptz` | `See constraints in SQL` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### skills
Controlled skill catalog seeded with common IT, design, communication and research skills.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `name` | `text` | `NOT NULL UNIQUE CHECK (char_length(btrim(name)) BETWEEN 2 AND 100)` |
| `category` | `text` | `See constraints in SQL` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### student_skills
Many-to-many student skill mapping, including self-declared proficiency.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `student_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `skill_id` | `uuid` | `NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT` |
| `proficiency` | `text` | `NOT NULL DEFAULT 'beginner'` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### interests
Controlled project/academic interest catalog.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `name` | `text` | `NOT NULL UNIQUE CHECK (char_length(btrim(name)) BETWEEN 2 AND 100)` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### student_interests
Many-to-many student interest mapping.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `student_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `interest_id` | `uuid` | `NOT NULL REFERENCES public.interests(id) ON DELETE RESTRICT` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### availability_slots
Recurring weekly availability in Asia/Kuching; weekday 1=Monday to 7=Sunday.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `student_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `weekday` | `smallint` | `NOT NULL CHECK (weekday BETWEEN 1 AND 7)` |
| `start_time` | `time` | `NOT NULL` |
| `end_time` | `time` | `NOT NULL` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### projects
Projects initiated by students; slots_needed counts additional teammates (excluding owner).

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `owner_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `title` | `text` | `NOT NULL CHECK (char_length(btrim(title)) BETWEEN 4 AND 150)` |
| `description` | `text` | `NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 5000)` |
| `project_type` | `text` | `NOT NULL CHECK (project_type IN` |
| `slots_needed` | `smallint` | `NOT NULL DEFAULT 1 CHECK (slots_needed BETWEEN 1 AND 50)` |
| `min_weekly_hours` | `smallint` | `NOT NULL DEFAULT 0 CHECK (min_weekly_hours BETWEEN 0 AND 168)` |
| `status` | `text` | `NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','completed'))` |
| `deadline` | `date` | `See constraints in SQL` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### project_required_skills
Project skill needs; mandatory requirements affect matching eligibility; importance influences weighted score.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `project_id` | `uuid` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` |
| `skill_id` | `uuid` | `NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT` |
| `mandatory` | `boolean` | `NOT NULL DEFAULT true` |
| `importance` | `smallint` | `NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5)` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### project_interests
Many-to-many interest tags used to compare projects with candidate profiles.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `project_id` | `uuid` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` |
| `interest_id` | `uuid` | `NOT NULL REFERENCES public.interests(id) ON DELETE RESTRICT` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### project_meeting_slots
Required weekly project meeting times; used for matching schedule overlap.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `project_id` | `uuid` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` |
| `weekday` | `smallint` | `NOT NULL CHECK (weekday BETWEEN 1 AND 7)` |
| `start_time` | `time` | `NOT NULL` |
| `end_time` | `time` | `NOT NULL` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### applications
Student-initiated applications; unique per student/project, lifecycle pending/accepted/declined/withdrawn.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `project_id` | `uuid` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` |
| `applicant_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `note` | `text` | `CHECK (note IS NULL OR char_length(note) <= 500)` |
| `status` | `text` | `NOT NULL DEFAULT 'pending'` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `responded_at` | `timestamptz` | `See constraints in SQL` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### project_members
Accepted team memberships and owner membership; one row per project/student.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `project_id` | `uuid` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` |
| `student_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `member_role` | `text` | `NOT NULL CHECK (member_role IN ('owner','member'))` |
| `membership_status` | `text` | `NOT NULL DEFAULT 'active'` |
| `joined_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### project_invitations
Project-owner-initiated invitations; unique per invitee/project.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `project_id` | `uuid` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE` |
| `inviter_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `invitee_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `note` | `text` | `CHECK (note IS NULL OR char_length(note) <= 500)` |
| `status` | `text` | `NOT NULL DEFAULT 'pending'` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `responded_at` | `timestamptz` | `See constraints in SQL` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### notifications
Private event pointers for a single recipient; target_id is polymorphic and trusted RPCs must validate its target.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `recipient_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `event_type` | `text` | `NOT NULL CHECK (char_length(event_type) BETWEEN 3 AND 80)` |
| `target_type` | `text` | `NOT NULL CHECK (target_type IN ('application','invitation','project'))` |
| `target_id` | `uuid` | `NOT NULL` |
| `read_at` | `timestamptz` | `See constraints in SQL` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

### beta_test_results
Participant-reported task feedback. Testers can view only their own feedback; no public exports.

| Field | Type | SQL declaration / key facts |
|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `tester_id` | `uuid` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `task_code` | `text` | `NOT NULL CHECK (task_code IN ('T01','T02','T03','T04','T05'))` |
| `success` | `boolean` | `See constraints in SQL` |
| `duration_seconds` | `integer` | `CHECK (duration_seconds BETWEEN 0 AND 86400)` |
| `difficulty_1_to_5` | `smallint` | `CHECK (difficulty_1_to_5 BETWEEN 1 AND 5)` |
| `comment` | `text` | `CHECK (comment IS NULL OR char_length(comment) <= 1000)` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

**Relationships:** see full ERD PNG/Mermaid and the complete SQL for foreign keys, composite primary keys and CHECK constraints.

## Critical lifecycle contracts

- Profile is created during onboarding, not automatically when Supabase Auth creates a user.
- Applications and invitations are distinct: both can lead to accepted project membership.
- A project owner can accept applications; an invitee must accept their own invitation.
- Matching is derived from normalized links (`student_skills` ↔ `project_required_skills`, interests and recurring time slots) instead of stored `profiles.skills[]` arrays.
- Only a project owner or the relevant participant may view private applications/invitations.
- All sensitive writes use named RPCs in `03_FUNCTIONS_RPC.sql` and transaction locks enforce member capacity.
- Never treat a high matching percentage as a scientifically validated prediction of collaboration success.

## Frontend/backend contract

RPC parameter names, example JSON payloads, exact allowed statuses, and beta security tests are documented in `README_START_HERE.md`.
