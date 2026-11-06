# ProjectLinkUMS — Security & RLS Audit Matrix

## 1. Row-Level Security (RLS) Predicates (`private.*`)

| Predicate | Purpose | Security Invariant |
|---|---|---|
| `private.is_project_owner(p_project_id)` | Verifies `projects.owner_id = auth.uid()` | Prevents non-owners from accepting applications, inviting candidates, or mutating project status. |
| `private.can_view_profile(p_profile_id)` | Self, opted-in public (`discoverable = true AND consent_at IS NOT NULL`), or applicant/member of caller's owned project | Prevents directory scraping of opted-out students (`Siti Rahmah` test case). |
| `private.can_view_project(p_project_id)` | Open projects, or projects where caller is owner, active member, applicant, or invitee | Keeps closed/draft projects private to participants. |
| `private.can_view_team(p_project_id)` | Project owner or active `project_members` row | Restricts workspace roster, Kanban tasks, and team chat strictly to accepted teammates. |

## 2. Verified Negative Authorization Cases

- **Self-Approval Blocked:** An invited candidate must call `respond_invitation`; the project owner cannot accept an invitation on the invitee's behalf. Conversely, an applicant cannot call `decide_application` on their own application.
- **Over-Capacity Race Protection:** Both `decide_application` and `respond_invitation` lock the parent `public.projects` row (`FOR UPDATE`) and verify `active_members < slots_needed` before inserting into `public.project_members`.
- **Zero Public PII:** `public.profiles` contains no email, phone number, or matriculation number columns.
