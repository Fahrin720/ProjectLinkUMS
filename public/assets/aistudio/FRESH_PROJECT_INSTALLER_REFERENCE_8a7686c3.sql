-- PROJECTLINKUMS | FRESH SUPABASE ONE-TIME INSTALL | FULL 16-ENTITY ERD
-- RUN ONLY ON A FRESH SUPABASE PROJECT. Old project is kept unchanged.
BEGIN;

-- ================== 01_SCHEMA.sql ==================
-- PROJECTLINKUMS 2026 | FULL NORMALIZED ERD | SCHEMA
-- 16 entities total = auth.users (Supabase-managed; NEVER recreate) + 15 public tables.
-- RUN ONLY ON A NEW SUPABASE PROJECT OR EMPTY PUBLIC APP SCHEMA.
-- DO NOT DROP auth.users OR OLD DATA; use a new Supabase project for rebuilding.
-- Fails loudly if the old app tables exist. No destructive cleanup.
DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename IN
    ('profiles','skills','student_skills','interests','student_interests','availability_slots',
     'projects','project_required_skills','project_interests','project_meeting_slots',
     'applications','project_members','project_invitations','notifications','beta_test_results')
  ) THEN
    RAISE EXCEPTION 'ProjectLinkUMS tables already exist. Run this on a NEW Supabase project; do not overwrite the previous database.';
  END IF;
END;
$guard$;

CREATE SCHEMA IF NOT EXISTS private;

-- 01. PROFILES (1-to-0/1 from auth.users, created on onboarding)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 120),
    faculty text NOT NULL CHECK (char_length(btrim(faculty)) BETWEEN 2 AND 120),
    programme text,
    year_of_study smallint CHECK (year_of_study BETWEEN 1 AND 8),
    bio text CHECK (bio IS NULL OR char_length(bio) <= 1500),
    avatar_url text,
    weekly_hours smallint CHECK (weekly_hours BETWEEN 0 AND 168),
    preferred_project_types text[] NOT NULL DEFAULT '{}'::text[],
    discoverable boolean NOT NULL DEFAULT false,
    consent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pkl_discovery_requires_consent CHECK (NOT discoverable OR consent_at IS NOT NULL)
);

-- 02. SKILL CATALOG
CREATE TABLE public.skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
    category text
);

-- 03. STUDENT_SKILLS (M:N link, UUID references)
CREATE TABLE public.student_skills (
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
    proficiency text NOT NULL DEFAULT 'beginner'
        CHECK (proficiency IN ('beginner','intermediate','advanced')),
    PRIMARY KEY (student_id, skill_id)
);

-- 04. INTEREST CATALOG
CREATE TABLE public.interests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE CHECK (char_length(btrim(name)) BETWEEN 2 AND 100)
);

-- 05. STUDENT_INTERESTS (M:N link)
CREATE TABLE public.student_interests (
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id uuid NOT NULL REFERENCES public.interests(id) ON DELETE RESTRICT,
    PRIMARY KEY (student_id, interest_id)
);

-- 06. STUDENT WEEKLY AVAILABILITY
-- Weekday = ISO 1(Mon)..7(Sun); times are local Asia/Kuching (no cross-midnight slots).
CREATE TABLE public.availability_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    start_time time NOT NULL,
    end_time time NOT NULL,
    CHECK (start_time < end_time),
    UNIQUE (student_id, weekday, start_time, end_time)
);

-- 07. PROJECTS
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 4 AND 150),
    description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 5000),
    project_type text NOT NULL CHECK (project_type IN
       ('Assignment','Competition','Innovation','Community','Other')),
    slots_needed smallint NOT NULL DEFAULT 1 CHECK (slots_needed BETWEEN 1 AND 50),
    min_weekly_hours smallint NOT NULL DEFAULT 0 CHECK (min_weekly_hours BETWEEN 0 AND 168),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','completed')),
    deadline date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 08. REQUIRED SKILLS FOR EACH PROJECT
CREATE TABLE public.project_required_skills (
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
    mandatory boolean NOT NULL DEFAULT true,
    importance smallint NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    PRIMARY KEY (project_id, skill_id)
);

-- 09. PROJECT INTEREST TAGS
CREATE TABLE public.project_interests (
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    interest_id uuid NOT NULL REFERENCES public.interests(id) ON DELETE RESTRICT,
    PRIMARY KEY (project_id, interest_id)
);

-- 10. RECURRING PROJECT MEETING SLOTS
CREATE TABLE public.project_meeting_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    start_time time NOT NULL,
    end_time time NOT NULL,
    CHECK (start_time < end_time),
    UNIQUE (project_id,weekday,start_time,end_time)
);

-- 11. APPLICATIONS: student-initiated join requests
CREATE TABLE public.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text CHECK (note IS NULL OR char_length(note) <= 500),
    status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','accepted','declined','withdrawn')),
    created_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    UNIQUE (project_id,applicant_id)
);

-- 12. PROJECT MEMBERS: accepted teammates and project owner
CREATE TABLE public.project_members (
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_role text NOT NULL CHECK (member_role IN ('owner','member')),
    membership_status text NOT NULL DEFAULT 'active'
      CHECK (membership_status IN ('active','left','removed')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id,student_id)
);

-- 13. PROJECT INVITATIONS: owner-initiated invitations to consenting students
CREATE TABLE public.project_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text CHECK (note IS NULL OR char_length(note) <= 500),
    status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','accepted','declined','cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    CHECK (inviter_id <> invitee_id),
    UNIQUE (project_id,invitee_id)
);

-- 14. NOTIFICATIONS: pointers are polymorphic, validated when created by trusted RPCs
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 3 AND 80),
    target_type text NOT NULL CHECK (target_type IN ('application','invitation','project')),
    target_id uuid NOT NULL,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. BETA TEST RESULTS: stored only on consent, no contact information required
CREATE TABLE public.beta_test_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_code text NOT NULL CHECK (task_code IN ('T01','T02','T03','T04','T05')),
    success boolean,
    duration_seconds integer CHECK (duration_seconds BETWEEN 0 AND 86400),
    difficulty_1_to_5 smallint CHECK (difficulty_1_to_5 BETWEEN 1 AND 5),
    comment text CHECK (comment IS NULL OR char_length(comment) <= 1000),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes needed for search, owner/membership checks and RLS joins
CREATE INDEX pkl_profiles_discoverable_idx ON public.profiles(discoverable) WHERE discoverable;
CREATE INDEX pkl_student_skills_skill_idx ON public.student_skills(skill_id,student_id);
CREATE INDEX pkl_student_interests_interest_idx ON public.student_interests(interest_id,student_id);
CREATE INDEX pkl_slots_student_idx ON public.availability_slots(student_id);
CREATE INDEX pkl_projects_owner_idx ON public.projects(owner_id);
CREATE INDEX pkl_projects_status_created_idx ON public.projects(status,created_at DESC);
CREATE INDEX pkl_proj_skill_skill_idx ON public.project_required_skills(skill_id);
CREATE INDEX pkl_proj_interests_interest_idx ON public.project_interests(interest_id);
CREATE INDEX pkl_proj_slots_project_idx ON public.project_meeting_slots(project_id);
CREATE INDEX pkl_applications_applicant_idx ON public.applications(applicant_id);
CREATE INDEX pkl_applications_project_status_idx ON public.applications(project_id,status);
CREATE INDEX pkl_members_student_idx ON public.project_members(student_id);
CREATE INDEX pkl_invite_invitee_idx ON public.project_invitations(invitee_id);
CREATE INDEX pkl_invite_inviter_idx ON public.project_invitations(inviter_id);
CREATE INDEX pkl_notifications_recipient_idx ON public.notifications(recipient_id,created_at DESC);
CREATE INDEX pkl_beta_tester_idx ON public.beta_test_results(tester_id);


-- ================== 02_SECURITY_RLS.sql ==================
-- PROJECTLINKUMS 2026 | RLS + PERMISSIONS
-- Run after 01_SCHEMA.sql on a NEW project.
-- All writes except beta feedback are performed through carefully authorized RPCs.
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Security-definer access predicates avoid recursive RLS policies.
-- Created from SQL Editor as postgres; do NOT expose private in API -> Exposed schemas.
CREATE FUNCTION private.is_project_owner(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $body$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id = p_project_id AND pr.owner_id = (SELECT auth.uid())
  );
$body$;

CREATE FUNCTION private.can_view_project(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $body$
 SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.projects pr WHERE pr.id=p_project_id AND (
    pr.status='open' OR pr.owner_id=(SELECT auth.uid())
    OR EXISTS(SELECT 1 FROM public.project_members m WHERE m.project_id=pr.id
              AND m.student_id=(SELECT auth.uid()) AND m.membership_status='active')
    OR EXISTS(SELECT 1 FROM public.applications a WHERE a.project_id=pr.id
              AND a.applicant_id=(SELECT auth.uid()))
    OR EXISTS(SELECT 1 FROM public.project_invitations i WHERE i.project_id=pr.id
              AND i.invitee_id=(SELECT auth.uid()))
  )
 );
$body$;

CREATE FUNCTION private.can_view_profile(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $body$
 SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.profiles p WHERE p.id=p_profile_id AND (
     p.id=(SELECT auth.uid())
     OR (p.discoverable = true AND p.consent_at IS NOT NULL)
     OR EXISTS(
       SELECT 1 FROM public.applications a
       JOIN public.projects pr ON pr.id=a.project_id
       WHERE a.applicant_id=p.id AND pr.owner_id=(SELECT auth.uid())
     )
     OR EXISTS(
       SELECT 1 FROM public.project_members m
       JOIN public.projects pr ON pr.id=m.project_id
       WHERE m.student_id=p.id AND pr.owner_id=(SELECT auth.uid())
     )
   )
 );
$body$;

CREATE FUNCTION private.can_view_team(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $body$
 SELECT (SELECT auth.uid()) IS NOT NULL AND (
  EXISTS(SELECT 1 FROM public.projects p WHERE p.id=p_project_id AND p.owner_id=(SELECT auth.uid()))
  OR EXISTS(SELECT 1 FROM public.project_members m WHERE m.project_id=p_project_id
       AND m.student_id=(SELECT auth.uid()) AND m.membership_status='active')
 );
$body$;

REVOKE ALL ON FUNCTION private.is_project_owner(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION private.can_view_project(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION private.can_view_profile(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION private.can_view_team(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.is_project_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_team(uuid) TO authenticated;

-- Enable RLS for every exposed table (15 public tables).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_required_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_test_results ENABLE ROW LEVEL SECURITY;

-- Remove default table privileges. Private writes MUST go through RPCs.
REVOKE ALL ON
 public.profiles, public.skills, public.student_skills, public.interests,
 public.student_interests, public.availability_slots, public.projects,
 public.project_required_skills, public.project_interests, public.project_meeting_slots,
 public.applications, public.project_members, public.project_invitations,
 public.notifications, public.beta_test_results
FROM PUBLIC, anon, authenticated;
GRANT SELECT ON
 public.profiles, public.skills, public.student_skills, public.interests,
 public.student_interests, public.availability_slots, public.projects,
 public.project_required_skills, public.project_interests, public.project_meeting_slots,
 public.applications, public.project_members, public.project_invitations,
 public.notifications, public.beta_test_results
TO authenticated;
GRANT INSERT ON public.beta_test_results TO authenticated;

-- Only authenticated users can read catalogs.
CREATE POLICY pkl_skills_read ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY pkl_interests_read ON public.interests FOR SELECT TO authenticated USING (true);

-- Individual profile + normalized related data: self, opted-in public, or applicant to owned project.
CREATE POLICY pkl_profiles_read ON public.profiles FOR SELECT TO authenticated
 USING (private.can_view_profile(id));
CREATE POLICY pkl_student_skills_read ON public.student_skills FOR SELECT TO authenticated
 USING (private.can_view_profile(student_id));
CREATE POLICY pkl_student_interests_read ON public.student_interests FOR SELECT TO authenticated
 USING (private.can_view_profile(student_id));
CREATE POLICY pkl_availability_read ON public.availability_slots FOR SELECT TO authenticated
 USING (private.can_view_profile(student_id));

-- Publicly open projects plus any project that concerns the signed-in user.
CREATE POLICY pkl_projects_read ON public.projects FOR SELECT TO authenticated
 USING (private.can_view_project(id));
CREATE POLICY pkl_required_skills_read ON public.project_required_skills FOR SELECT TO authenticated
 USING (private.can_view_project(project_id));
CREATE POLICY pkl_project_interests_read ON public.project_interests FOR SELECT TO authenticated
 USING (private.can_view_project(project_id));
CREATE POLICY pkl_meeting_slots_read ON public.project_meeting_slots FOR SELECT TO authenticated
 USING (private.can_view_project(project_id));

-- Application is visible to its applicant and the owner of its project.
CREATE POLICY pkl_applications_read ON public.applications FOR SELECT TO authenticated
 USING (applicant_id=(SELECT auth.uid()) OR private.is_project_owner(project_id));
-- Member lists visible only to current project members and project owner.
CREATE POLICY pkl_members_read ON public.project_members FOR SELECT TO authenticated
 USING (private.can_view_team(project_id));
-- An invitation is private to its inviter, invitee, and project owner.
CREATE POLICY pkl_invitations_read ON public.project_invitations FOR SELECT TO authenticated
 USING (inviter_id=(SELECT auth.uid()) OR invitee_id=(SELECT auth.uid())
        OR private.is_project_owner(project_id));
CREATE POLICY pkl_notifications_read ON public.notifications FOR SELECT TO authenticated
 USING (recipient_id=(SELECT auth.uid()));
CREATE POLICY pkl_beta_read ON public.beta_test_results FOR SELECT TO authenticated
 USING (tester_id=(SELECT auth.uid()));
CREATE POLICY pkl_beta_insert ON public.beta_test_results FOR INSERT TO authenticated
 WITH CHECK (tester_id=(SELECT auth.uid()));


-- ================== 03_FUNCTIONS_RPC.sql ==================
-- PROJECTLINKUMS 2026 | COMPLETE SECURE BACKEND RPCs
-- Run AFTER 01_SCHEMA.sql and 02_SECURITY_RLS.sql on a fresh Supabase project.
-- Public RPC signatures match ProjectLinkUMS existing Next.js src/lib/database.ts.
-- All mutations are atomic PostgreSQL transactions within a single RPC call.
-- Helper for strict weekly availability validation. YYYY-MM-DD not needed: weekday 1..7 + local time.
CREATE FUNCTION private.validate_slots(p_slots jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE s jsonb;
BEGIN
  IF pg_catalog.jsonb_typeof(p_slots) <> 'array' OR pg_catalog.jsonb_array_length(p_slots) > 30 THEN
    RAISE EXCEPTION 'Slots must be a JSON array with no more than 30 items';
  END IF;
  FOR s IN SELECT elem FROM pg_catalog.jsonb_array_elements(p_slots) AS e(elem) LOOP
    IF s->>'weekday' IS NULL OR s->>'start_time' IS NULL OR s->>'end_time' IS NULL THEN
      RAISE EXCEPTION 'Each slot needs weekday, start_time and end_time';
    END IF;
    IF (s->>'weekday')::smallint NOT BETWEEN 1 AND 7
       OR (s->>'start_time')::time >= (s->>'end_time')::time THEN
      RAISE EXCEPTION 'Invalid meeting/availability slot: %', s;
    END IF;
  END LOOP;
END;
$fn$;

-- 1. SAVE PROFILE: profiles + student_skills + student_interests + availability_slots.
CREATE FUNCTION private.save_my_profile_impl(
    p_display_name text, p_faculty text, p_programme text, p_year_of_study smallint,
    p_bio text, p_weekly_hours smallint, p_preferred_project_types text[],
    p_discoverable boolean, p_skills jsonb, p_interests uuid[], p_slots jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_item jsonb; v_types text[];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF char_length(btrim(coalesce(p_display_name,''))) NOT BETWEEN 2 AND 120
     OR char_length(btrim(coalesce(p_faculty,''))) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'Display name and faculty must be 2-120 characters';
  END IF;
  IF p_year_of_study IS NOT NULL AND p_year_of_study NOT BETWEEN 1 AND 8 THEN
    RAISE EXCEPTION 'year_of_study must be 1-8';
  END IF;
  IF p_weekly_hours IS NOT NULL AND p_weekly_hours NOT BETWEEN 0 AND 168 THEN
    RAISE EXCEPTION 'weekly_hours must be 0-168';
  END IF;
  IF char_length(coalesce(p_bio,'')) > 1500 THEN RAISE EXCEPTION 'Bio too long'; END IF;
  IF pg_catalog.jsonb_typeof(coalesce(p_skills,'[]'::jsonb)) <> 'array'
     OR pg_catalog.jsonb_array_length(coalesce(p_skills,'[]'::jsonb)) > 30 THEN
     RAISE EXCEPTION 'p_skills must be a JSON array with max 30 items';
  END IF;
  IF coalesce(pg_catalog.array_length(p_interests,1),0) > 30 THEN
    RAISE EXCEPTION 'Maximum 30 interests allowed';
  END IF;
  v_types := coalesce(p_preferred_project_types,ARRAY[]::text[]);
  IF coalesce(pg_catalog.array_length(v_types,1),0) > 5 OR EXISTS(
    SELECT 1 FROM pg_catalog.unnest(v_types) AS v(t)
    WHERE v.t NOT IN ('Assignment','Competition','Innovation','Community','Other')
  ) THEN RAISE EXCEPTION 'Invalid preferred project type'; END IF;
  PERFORM private.validate_slots(coalesce(p_slots,'[]'::jsonb));

  INSERT INTO public.profiles(
    id,display_name,faculty,programme,year_of_study,bio,weekly_hours,
    preferred_project_types,discoverable,consent_at
  ) VALUES (
    v_uid,btrim(p_display_name),btrim(p_faculty),nullif(btrim(coalesce(p_programme,'')),''),
    p_year_of_study,nullif(btrim(coalesce(p_bio,'')),''),p_weekly_hours,v_types,
    coalesce(p_discoverable,false),CASE WHEN p_discoverable THEN now() ELSE NULL END
  ) ON CONFLICT (id) DO UPDATE SET
    display_name=EXCLUDED.display_name,faculty=EXCLUDED.faculty,
    programme=EXCLUDED.programme,year_of_study=EXCLUDED.year_of_study,
    bio=EXCLUDED.bio,weekly_hours=EXCLUDED.weekly_hours,
    preferred_project_types=EXCLUDED.preferred_project_types,
    discoverable=EXCLUDED.discoverable,
    consent_at=CASE WHEN EXCLUDED.discoverable THEN
        coalesce(profiles.consent_at, now()) ELSE NULL END,
    updated_at=now();

  -- Replace only this user's join-table rows. Entire function rolls back on error.
  DELETE FROM public.student_skills WHERE student_id=v_uid;
  FOR v_item IN SELECT elem FROM pg_catalog.jsonb_array_elements(coalesce(p_skills,'[]'::jsonb)) AS e(elem) LOOP
    IF v_item->>'skill_id' IS NULL OR coalesce(v_item->>'proficiency','beginner')
       NOT IN ('beginner','intermediate','advanced') THEN
      RAISE EXCEPTION 'Each skill needs an existing skill_id and valid proficiency';
    END IF;
    INSERT INTO public.student_skills(student_id,skill_id,proficiency)
    VALUES(v_uid,(v_item->>'skill_id')::uuid,coalesce(v_item->>'proficiency','beginner'))
    ON CONFLICT (student_id,skill_id) DO UPDATE SET proficiency=EXCLUDED.proficiency;
  END LOOP;

  DELETE FROM public.student_interests WHERE student_id=v_uid;
  INSERT INTO public.student_interests(student_id,interest_id)
  SELECT v_uid, x.id FROM (SELECT DISTINCT unnest(coalesce(p_interests,ARRAY[]::uuid[])) AS id) x;

  DELETE FROM public.availability_slots WHERE student_id=v_uid;
  FOR v_item IN SELECT elem FROM pg_catalog.jsonb_array_elements(coalesce(p_slots,'[]'::jsonb)) AS e(elem) LOOP
    INSERT INTO public.availability_slots(student_id,weekday,start_time,end_time)
    VALUES(v_uid,(v_item->>'weekday')::smallint,
        (v_item->>'start_time')::time,(v_item->>'end_time')::time)
    ON CONFLICT (student_id,weekday,start_time,end_time) DO NOTHING;
  END LOOP;
END;
$fn$;
CREATE FUNCTION public.save_my_profile(
    p_display_name text, p_faculty text, p_programme text, p_year_of_study smallint,
    p_bio text, p_weekly_hours smallint, p_preferred_project_types text[],
    p_discoverable boolean, p_skills jsonb, p_interests uuid[], p_slots jsonb
) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $fn$
  SELECT private.save_my_profile_impl(p_display_name,p_faculty,p_programme,p_year_of_study,
    p_bio,p_weekly_hours,p_preferred_project_types,p_discoverable,p_skills,p_interests,p_slots);
$fn$;

-- 2. CREATE PROJECT: project + skills + interests + meetings + owner membership.
CREATE FUNCTION private.create_project_impl(
    p_title text,p_description text,p_project_type text,p_slots_needed smallint,
    p_min_weekly_hours smallint,p_deadline date,
    p_required_skills jsonb,p_interests uuid[],p_meeting_slots jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_project uuid; v_item jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=v_uid) THEN
    RAISE EXCEPTION 'Create your profile before a project'; END IF;
  IF char_length(btrim(coalesce(p_title,''))) NOT BETWEEN 4 AND 150
     OR char_length(btrim(coalesce(p_description,''))) NOT BETWEEN 10 AND 5000 THEN
    RAISE EXCEPTION 'Project title must be 4-150 and description 10-5000 characters';
  END IF;
  IF p_project_type NOT IN ('Assignment','Competition','Innovation','Community','Other')
     OR p_project_type IS NULL THEN RAISE EXCEPTION 'Unknown project type'; END IF;
  IF p_slots_needed IS NULL OR p_slots_needed NOT BETWEEN 1 AND 50
     OR p_min_weekly_hours IS NULL OR p_min_weekly_hours NOT BETWEEN 0 AND 168 THEN
    RAISE EXCEPTION 'Invalid team slots or minimum weekly hours';
  END IF;
  IF pg_catalog.jsonb_typeof(coalesce(p_required_skills,'[]'::jsonb)) <> 'array'
     OR pg_catalog.jsonb_array_length(coalesce(p_required_skills,'[]'::jsonb)) > 30
     OR coalesce(pg_catalog.array_length(p_interests,1),0) > 30 THEN
    RAISE EXCEPTION 'Invalid project skills/interests list';
  END IF;
  PERFORM private.validate_slots(coalesce(p_meeting_slots,'[]'::jsonb));

  INSERT INTO public.projects(owner_id,title,description,project_type,slots_needed,
     min_weekly_hours,deadline,status)
  VALUES(v_uid,btrim(p_title),btrim(p_description),p_project_type,p_slots_needed,
     p_min_weekly_hours,p_deadline,'open') RETURNING id INTO v_project;
  FOR v_item IN SELECT elem FROM pg_catalog.jsonb_array_elements(coalesce(p_required_skills,'[]'::jsonb)) AS e(elem) LOOP
    IF v_item->>'skill_id' IS NULL OR coalesce((v_item->>'importance')::smallint,3) NOT BETWEEN 1 AND 5 THEN
      RAISE EXCEPTION 'Invalid required skill'; END IF;
    INSERT INTO public.project_required_skills(project_id,skill_id,mandatory,importance)
    VALUES(v_project,(v_item->>'skill_id')::uuid,
      coalesce((v_item->>'mandatory')::boolean,true),coalesce((v_item->>'importance')::smallint,3))
    ON CONFLICT (project_id,skill_id) DO UPDATE SET
      mandatory=EXCLUDED.mandatory, importance=EXCLUDED.importance;
  END LOOP;
  INSERT INTO public.project_interests(project_id,interest_id)
  SELECT v_project, x.id FROM (SELECT DISTINCT unnest(coalesce(p_interests,ARRAY[]::uuid[])) AS id) x;
  FOR v_item IN SELECT elem FROM pg_catalog.jsonb_array_elements(coalesce(p_meeting_slots,'[]'::jsonb)) AS e(elem) LOOP
    INSERT INTO public.project_meeting_slots(project_id,weekday,start_time,end_time)
    VALUES(v_project,(v_item->>'weekday')::smallint,
       (v_item->>'start_time')::time,(v_item->>'end_time')::time)
    ON CONFLICT (project_id,weekday,start_time,end_time) DO NOTHING;
  END LOOP;
  INSERT INTO public.project_members(project_id,student_id,member_role,membership_status)
  VALUES(v_project,v_uid,'owner','active');
  RETURN v_project;
END;
$fn$;
CREATE FUNCTION public.create_project(
    p_title text,p_description text,p_project_type text,p_slots_needed smallint,
    p_min_weekly_hours smallint,p_deadline date,
    p_required_skills jsonb,p_interests uuid[],p_meeting_slots jsonb
) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $fn$
  SELECT private.create_project_impl(p_title,p_description,p_project_type,p_slots_needed,
    p_min_weekly_hours,p_deadline,p_required_skills,p_interests,p_meeting_slots);
$fn$;

-- 3. APPLY TO OPEN PROJECT. Applicant comes from JWT, not from client-provided ID.
CREATE FUNCTION private.apply_to_project_impl(p_project_id uuid,p_note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_owner uuid; v_status text; v_slots integer; v_filled integer; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=v_uid) THEN RAISE EXCEPTION 'Complete profile first'; END IF;
  IF char_length(coalesce(p_note,''))>500 THEN RAISE EXCEPTION 'Message too long'; END IF;
  SELECT owner_id,status,slots_needed INTO v_owner,v_status,v_slots
  FROM public.projects WHERE id=p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  IF v_status<>'open' THEN RAISE EXCEPTION 'Project is not open'; END IF;
  IF v_owner=v_uid THEN RAISE EXCEPTION 'Cannot join your own project through application'; END IF;
  SELECT count(*) INTO v_filled FROM public.project_members WHERE project_id=p_project_id
     AND member_role='member' AND membership_status='active';
  IF v_filled >= v_slots THEN RAISE EXCEPTION 'Project team is full'; END IF;
  IF EXISTS (SELECT 1 FROM public.project_members WHERE project_id=p_project_id
     AND student_id=v_uid AND membership_status='active') THEN RAISE EXCEPTION 'Already a member'; END IF;
  INSERT INTO public.applications(project_id,applicant_id,note,status)
  VALUES(p_project_id,v_uid,nullif(btrim(coalesce(p_note,'')),''),'pending') RETURNING id INTO v_id;
  INSERT INTO public.notifications(recipient_id,event_type,target_type,target_id)
  VALUES(v_owner,'application_received','application',v_id);
  RETURN v_id;
END;
$fn$;
CREATE FUNCTION public.apply_to_project(p_project_id uuid,p_note text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.apply_to_project_impl(p_project_id,p_note);
$fn$;

-- 4. ACCEPT/DECLINE: project lock prevents concurrent over-capacity, creates member atomically.
CREATE FUNCTION private.decide_application_impl(p_application_id uuid,p_decision text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_project uuid; v_owner uuid; v_status text;
        v_applicant uuid; v_app_status text; v_slots integer; v_filled integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF p_decision NOT IN ('accepted','declined') OR p_decision IS NULL THEN
     RAISE EXCEPTION 'Decision must be accepted or declined'; END IF;
  SELECT project_id INTO v_project FROM public.applications WHERE id=p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  SELECT owner_id,status,slots_needed INTO v_owner,v_status,v_slots
    FROM public.projects WHERE id=v_project FOR UPDATE;
  IF v_owner IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'Only project owner can decide'; END IF;
  SELECT applicant_id,status INTO v_applicant,v_app_status
    FROM public.applications WHERE id=p_application_id FOR UPDATE;
  IF v_app_status<>'pending' THEN RAISE EXCEPTION 'Application already processed'; END IF;
  IF p_decision='accepted' THEN
    IF v_status<>'open' THEN RAISE EXCEPTION 'Project no longer open'; END IF;
    SELECT count(*) INTO v_filled FROM public.project_members
      WHERE project_id=v_project AND member_role='member' AND membership_status='active';
    IF v_filled>=v_slots THEN RAISE EXCEPTION 'Team is full'; END IF;
    IF EXISTS(SELECT 1 FROM public.project_members WHERE project_id=v_project
      AND student_id=v_applicant AND membership_status='active') THEN
      RAISE EXCEPTION 'Already a member'; END IF;
    INSERT INTO public.project_members(project_id,student_id,member_role,membership_status)
    VALUES(v_project,v_applicant,'member','active')
    ON CONFLICT (project_id,student_id) DO UPDATE SET
      member_role='member',membership_status='active',joined_at=now();
    UPDATE public.project_invitations SET status='accepted',responded_at=now()
      WHERE project_id=v_project AND invitee_id=v_applicant AND status='pending';
  END IF;
  UPDATE public.applications SET status=p_decision,responded_at=now() WHERE id=p_application_id;
  INSERT INTO public.notifications(recipient_id,event_type,target_type,target_id)
  VALUES(v_applicant,'application_'||p_decision,'application',p_application_id);
END;
$fn$;
CREATE FUNCTION public.decide_application(p_application_id uuid,p_decision text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.decide_application_impl(p_application_id,p_decision);
$fn$;

-- 5. WITHDRAW own pending application.
CREATE FUNCTION private.withdraw_application_impl(p_application_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_applicant uuid; v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  SELECT applicant_id,status INTO v_applicant,v_status FROM public.applications
    WHERE id=p_application_id FOR UPDATE;
  IF NOT FOUND OR v_applicant IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Application not found or unauthorized'; END IF;
  IF v_status<>'pending' THEN RAISE EXCEPTION 'Only pending applications can be withdrawn'; END IF;
  UPDATE public.applications SET status='withdrawn',responded_at=now()
    WHERE id=p_application_id;
END;
$fn$;
CREATE FUNCTION public.withdraw_application(p_application_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.withdraw_application_impl(p_application_id);
$fn$;

-- 6. INVITE consenting student to owner project (never use user-supplied owner ID).
CREATE FUNCTION private.invite_candidate_impl(p_project_id uuid,p_invitee_id uuid,p_note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_owner uuid; v_status text;
        v_slots integer; v_filled integer; v_invitation uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF char_length(coalesce(p_note,''))>500 THEN RAISE EXCEPTION 'Message too long'; END IF;
  SELECT owner_id,status,slots_needed INTO v_owner,v_status,v_slots
    FROM public.projects WHERE id=p_project_id FOR UPDATE;
  IF NOT FOUND OR v_owner IS DISTINCT FROM v_uid OR v_status<>'open' THEN
    RAISE EXCEPTION 'Not owner of an open project'; END IF;
  SELECT count(*) INTO v_filled FROM public.project_members WHERE project_id=p_project_id
    AND member_role='member' AND membership_status='active';
  IF v_filled>=v_slots THEN RAISE EXCEPTION 'Team is full'; END IF;
  IF p_invitee_id IS NULL OR p_invitee_id=v_uid OR NOT EXISTS(
       SELECT 1 FROM public.profiles WHERE id=p_invitee_id AND discoverable AND consent_at IS NOT NULL)
    THEN RAISE EXCEPTION 'Candidate unavailable or has not consented to discovery'; END IF;
  IF EXISTS(SELECT 1 FROM public.project_members WHERE project_id=p_project_id
      AND student_id=p_invitee_id AND membership_status='active') THEN
      RAISE EXCEPTION 'Candidate already joined'; END IF;
  INSERT INTO public.project_invitations(project_id,inviter_id,invitee_id,note,status)
  VALUES(p_project_id,v_uid,p_invitee_id,nullif(btrim(coalesce(p_note,'')),''),'pending')
  RETURNING id INTO v_invitation;
  INSERT INTO public.notifications(recipient_id,event_type,target_type,target_id)
  VALUES(p_invitee_id,'project_invitation','invitation',v_invitation);
  RETURN v_invitation;
END;
$fn$;
CREATE FUNCTION public.invite_candidate(p_project_id uuid,p_invitee_id uuid,p_note text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.invite_candidate_impl(p_project_id,p_invitee_id,p_note);
$fn$;

-- 7. INVITED USER responds; owner cannot accept on invitee's behalf.
CREATE FUNCTION private.respond_invitation_impl(p_invitation_id uuid,p_decision text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_project uuid; v_owner uuid; v_project_status text;
        v_invitee uuid; v_inviter uuid; v_inv_status text; v_slots integer; v_filled integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF p_decision NOT IN ('accepted','declined') OR p_decision IS NULL THEN
    RAISE EXCEPTION 'Decision must be accepted or declined'; END IF;
  SELECT project_id INTO v_project FROM public.project_invitations WHERE id=p_invitation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  SELECT owner_id,status,slots_needed INTO v_owner,v_project_status,v_slots
    FROM public.projects WHERE id=v_project FOR UPDATE;
  SELECT invitee_id,inviter_id,status INTO v_invitee,v_inviter,v_inv_status
    FROM public.project_invitations WHERE id=p_invitation_id FOR UPDATE;
  IF v_invitee IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'Not your invitation'; END IF;
  IF v_inv_status<>'pending' THEN RAISE EXCEPTION 'Invitation already processed'; END IF;
  IF p_decision='accepted' THEN
    IF v_project_status<>'open' THEN RAISE EXCEPTION 'Project no longer open'; END IF;
    SELECT count(*) INTO v_filled FROM public.project_members WHERE project_id=v_project
      AND member_role='member' AND membership_status='active';
    IF v_filled>=v_slots THEN RAISE EXCEPTION 'Team full'; END IF;
    IF EXISTS(SELECT 1 FROM public.project_members WHERE project_id=v_project
      AND student_id=v_uid AND membership_status='active') THEN
      RAISE EXCEPTION 'Already a member'; END IF;
    INSERT INTO public.project_members(project_id,student_id,member_role,membership_status)
    VALUES(v_project,v_uid,'member','active')
    ON CONFLICT(project_id,student_id) DO UPDATE SET
      member_role='member',membership_status='active',joined_at=now();
    UPDATE public.applications SET status='accepted',responded_at=now()
      WHERE project_id=v_project AND applicant_id=v_uid AND status='pending';
  END IF;
  UPDATE public.project_invitations SET status=p_decision,responded_at=now()
   WHERE id=p_invitation_id;
  INSERT INTO public.notifications(recipient_id,event_type,target_type,target_id)
  VALUES(v_inviter,'invitation_'||p_decision,'invitation',p_invitation_id);
END;
$fn$;
CREATE FUNCTION public.respond_invitation(p_invitation_id uuid,p_decision text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.respond_invitation_impl(p_invitation_id,p_decision);
$fn$;

-- 8. UPDATE PROJECT STATUS (owner only)
CREATE FUNCTION private.set_project_status_impl(p_project_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_owner uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF p_status NOT IN ('open','closed','completed') OR p_status IS NULL THEN
    RAISE EXCEPTION 'Invalid project status'; END IF;
  SELECT owner_id INTO v_owner FROM public.projects WHERE id=p_project_id FOR UPDATE;
  IF NOT FOUND OR v_owner IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'Not project owner'; END IF;
  UPDATE public.projects SET status=p_status,updated_at=now() WHERE id=p_project_id;
END;
$fn$;
CREATE FUNCTION public.set_project_status(p_project_id uuid,p_status text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.set_project_status_impl(p_project_id,p_status);
$fn$;

-- 9. CANCEL pending invitation (owner only)
CREATE FUNCTION private.cancel_invitation_impl(p_invitation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_project uuid; v_owner uuid; v_status text; v_invitee uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  SELECT project_id INTO v_project FROM public.project_invitations WHERE id=p_invitation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  SELECT owner_id INTO v_owner FROM public.projects WHERE id=v_project FOR UPDATE;
  IF v_owner IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'Not project owner'; END IF;
  SELECT status,invitee_id INTO v_status,v_invitee FROM public.project_invitations
    WHERE id=p_invitation_id FOR UPDATE;
  IF v_status<>'pending' THEN RAISE EXCEPTION 'Invitation already processed'; END IF;
  UPDATE public.project_invitations SET status='cancelled',responded_at=now()
    WHERE id=p_invitation_id;
  INSERT INTO public.notifications(recipient_id,event_type,target_type,target_id)
  VALUES(v_invitee,'invitation_cancelled','invitation',p_invitation_id);
END;
$fn$;
CREATE FUNCTION public.cancel_invitation(p_invitation_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.cancel_invitation_impl(p_invitation_id);
$fn$;

-- 10. LEAVE PROJECT (active member only; owner cannot abandon ownership this way)
CREATE FUNCTION private.leave_project_impl(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_uid uuid:=auth.uid(); v_role text; v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  SELECT member_role,membership_status INTO v_role,v_status FROM public.project_members
   WHERE project_id=p_project_id AND student_id=v_uid FOR UPDATE;
  IF NOT FOUND OR v_role <> 'member' OR v_status <> 'active' THEN
    RAISE EXCEPTION 'Only active non-owner members can leave'; END IF;
  UPDATE public.project_members SET membership_status='left'
   WHERE project_id=p_project_id AND student_id=v_uid;
END;
$fn$;
CREATE FUNCTION public.leave_project(p_project_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.leave_project_impl(p_project_id);
$fn$;

-- 11. MARK NOTIFICATION READ (recipient only)
CREATE FUNCTION private.mark_notification_read_impl(p_notification_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
 UPDATE public.notifications SET read_at=now()
 WHERE id=p_notification_id AND recipient_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Notification not found'; END IF;
END;
$fn$;
CREATE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
  SELECT private.mark_notification_read_impl(p_notification_id);
$fn$;

-- Explicit EXECUTE grants; PostgreSQL functions otherwise default to PUBLIC EXECUTE.
-- Private functions remain in private schema (not exposed by PostgREST).
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
-- Regrant only the helper and impl functions needed by authenticated RPCs/RLS.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;

REVOKE ALL ON FUNCTION public.save_my_profile(text,text,text,smallint,text,smallint,text[],boolean,jsonb,uuid[],jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.create_project(text,text,text,smallint,smallint,date,jsonb,uuid[],jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.apply_to_project(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.decide_application(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.withdraw_application(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.invite_candidate(uuid,uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.respond_invitation(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.set_project_status(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.cancel_invitation(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.leave_project(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.save_my_profile(text,text,text,smallint,text,smallint,text[],boolean,jsonb,uuid[],jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project(text,text,text,smallint,smallint,date,jsonb,uuid[],jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_to_project(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_application(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_candidate(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_invitation(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_project_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

-- Supabase PostgREST function discovery needs schema-cache refresh after creating functions.

-- ================== 04_SEED_CATALOGS.sql ==================
-- Safe catalog seed: NO students, real names, phones or credentials are created.
INSERT INTO public.skills(name,category) VALUES
 ('UI/UX Design','Design'),('Figma','Design'),('Graphic Design','Design'),
 ('Frontend Development','Programming'),('Backend Development','Programming'),
 ('JavaScript','Programming'),('TypeScript','Programming'),('React','Programming'),
 ('Next.js','Programming'),('Python','Programming'),('Java','Programming'),
 ('C Programming','Programming'),('SQL','Database'),('Database Design','Database'),
 ('Data Analysis','Research'),('Research','Research'),('Academic Writing','Research'),
 ('Presentation','Communication'),('Public Speaking','Communication'),
 ('Project Management','Management'),('Pitching','Business'),('Marketing','Business'),
 ('Content Writing','Media'),('Video Editing','Media'),('Photography','Media')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.interests(name) VALUES
 ('Technology'),('Innovation'),('Web Development'),('Mobile Development'),
 ('Artificial Intelligence'),('Data Science'),('Hackathon'),('Entrepreneurship'),
 ('Sustainability'),('Education'),('Environment'),('Community Service'),
 ('Research'),('Design'),('Business'),('Gaming'),('Health & Wellbeing')
ON CONFLICT (name) DO NOTHING;

COMMIT;
NOTIFY pgrst, 'reload schema';
