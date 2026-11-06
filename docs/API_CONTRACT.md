# ProjectLinkUMS — Canonical API & RPC Contract

This document defines the 11 PostgreSQL Security-Definer RPCs and workspace extensions implemented across `03_FUNCTIONS_RPC.sql` and `lib/store.tsx`.

## 1. Core 11 Transactional RPCs (`public.*`)

1. **`public.save_my_profile`**
   - **Parameters:**
     - `p_display_name` (`text`, 2–120 chars)
     - `p_faculty` (`text`, 2–120 chars)
     - `p_programme` (`text | null`)
     - `p_year_of_study` (`smallint`, 1–8)
     - `p_bio` (`text | null`, <= 1500 chars)
     - `p_weekly_hours` (`smallint`, 0–168)
     - `p_preferred_project_types` (`text[]`, subset of `Assignment`, `Competition`, `Innovation`, `Community`, `Other`)
     - `p_discoverable` (`boolean`)
     - `p_skills` (`jsonb`: `[{ skill_id: uuid, proficiency: 'beginner' | 'intermediate' | 'advanced' }]`)
     - `p_interests` (`uuid[]`)
     - `p_slots` (`jsonb`: `[{ weekday: 1..7, start_time: 'HH:MM', end_time: 'HH:MM' }]`)
   - **Returns:** `void`
   - **Behavior:** Upserts `public.profiles` (automatically setting `consent_at = now()` when `p_discoverable = true`, or clearing `consent_at = NULL` when `false`), and atomically replaces the caller's rows in `student_skills`, `student_interests`, and `availability_slots`.

2. **`public.create_project`**
   - **Parameters:** `p_title`, `p_description`, `p_project_type`, `p_slots_needed`, `p_min_weekly_hours`, `p_deadline`, `p_required_skills`, `p_interests`, `p_meeting_slots`
   - **Returns:** `uuid` (newly created `project.id`)
   - **Behavior:** Inserts `public.projects`, `project_required_skills`, `project_interests`, `project_meeting_slots`, and creates the owner row in `project_members(member_role = 'owner', membership_status = 'active')`.

3. **`public.apply_to_project(p_project_id uuid, p_note text)`** -> `uuid`
4. **`public.decide_application(p_application_id uuid, p_decision text)`** -> `void`
5. **`public.withdraw_application(p_application_id uuid)`** -> `void`
6. **`public.invite_candidate(p_project_id uuid, p_invitee_id uuid, p_note text)`** -> `uuid`
7. **`public.respond_invitation(p_invitation_id uuid, p_decision text)`** -> `void`
8. **`public.set_project_status(p_project_id uuid, p_status text)`** -> `void`
9. **`public.cancel_invitation(p_invitation_id uuid)`** -> `void`
10. **`public.leave_project(p_project_id uuid)`** -> `void`
11. **`public.mark_notification_read(p_notification_id uuid)`** -> `void`
