-- ============================================================================
-- PROJECTLINK UMS — SKEMA POSTGRESQL & POLISI RLS SUPABASE
-- ============================================================================
-- Ringkasan Seni Bina Keselamatan:
--   1. Tiada Pemberian Admin Berdasarkan E-mel dalam Trigger/RPC Klien:
--      - Semua pendaftaran pengguna baharu melalui fungsi RPC public.sync_my_auth_profile()
--        sentiasa diberikan peranan 'user'.
--      - Pelantikan Admin dilakukan secara eksklusif melalui fungsi pentadbiran
--        dalaman private_security.promote_admin_by_auth_uuid(UUID) yang hanya boleh
--        dijalankan oleh service_role / postgres selepas mengesahkan UUID Auth.
--   2. Pemisahan Maklumat Peribadi & Nombor Telefon Penganjur:
--      - public.profiles         : Maklumat akademik sahaja. Lalai discoverable = FALSE
--                                  dan consent_at = NULL sehingga pengguna memberi
--                                  persetujuan opt-in secara jelas.
--      - public.profile_private  : Menyimpan auth_user_id, email (boleh NULL untuk akaun
--                                  bukan e-mel), matric_no, dan phone. Hanya boleh
--                                  dibaca oleh pemilik sendiri atau Admin.
--      - public.project_contacts : Menyimpan organizer_phone secara berasingan daripada
--                                  public.projects supaya tidak terdedah pada bacaan umum.
--   3. Kawalan Integriti SDP, Permohonan & Notifikasi:
--      - student_activity_history: Pengguna hanya boleh membaca (SELECT) rekod SDP sendiri;
--                                  penambahan/kemas kini mata SDP dihadkan kepada Admin
--                                  atau proses pelayan (service_role).
--      - applications            : Kemas kini status permohonan dikawal melalui RPC
--                                  public.withdraw_my_application() (untuk pemohon) dan
--                                  public.decide_project_application() (untuk pemilik projek).
--      - notifications           : Penulisan notifikasi dihadkan kepada proses sistem/Admin;
--                                  pengguna hanya boleh menanda baca melalui RPC
--                                  public.mark_my_notification_read().
--   4. Skema Dalaman (private_security) & GRANT/REVOKE Eksplisit:
--      - Semua fungsi SECURITY DEFINER pembantu RLS diletakkan di dalam skema
--        private_security yang tidak didedahkan kepada Data API awam.
--      - Semua jadual dan fungsi mempunyai arahan REVOKE daripada PUBLIC/anon dan
--        GRANT minimum khusus kepada peranan authenticated.
--      - Tiada trigger dipasang pada jadual sistem auth.users bagi mengelakkan
--        gangguan pada aliran pendaftaran Supabase Auth.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================================
-- 1. SKEMA KESELAMATAN DALAMAN (private_security — Tidak Didedahkan di Data API)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS private_security;

REVOKE ALL ON SCHEMA private_security FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private_security TO authenticated, service_role, postgres;

-- Fungsi pembantu masa kemas kini (updated_at) dan persetujuan privasi (consent_at)
CREATE OR REPLACE FUNCTION private_security.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private_security.handle_profile_privacy_consent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.discoverable = TRUE AND (TG_OP = 'INSERT' OR OLD.discoverable = FALSE) THEN
    NEW.consent_at = COALESCE(NEW.consent_at, NOW());
  ELSIF NEW.discoverable = FALSE THEN
    NEW.consent_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private_security.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private_security.handle_profile_privacy_consent() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 2. JADUAL IDENTITI & RBAC (profiles, profile_private, user_roles)
-- ============================================================================

-- 2.1 PROFIL AKADEMIK (public.profiles)
-- discoverable bermula sebagai FALSE dan consent_at bermula sebagai NULL (opt-in eksplisit).
-- role_mode hanyalah keutamaan paparan UI dan TIDAK digunakan untuk sebarang kebenaran akses.
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  faculty TEXT NOT NULL DEFAULT 'Fakulti Komputeran dan Informatik (FKI), UMS',
  faculty_short TEXT NOT NULL DEFAULT 'FKI',
  programme TEXT DEFAULT 'Software Engineering',
  year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 8) DEFAULT 2,
  location TEXT DEFAULT 'Kota Kinabalu',
  availability_status TEXT CHECK (availability_status IN ('Available', 'In Team', 'Busy')) DEFAULT 'Available',
  role_mode TEXT CHECK (role_mode IN ('STUDENT', 'ORGANIZER')) DEFAULT 'STUDENT',
  bio TEXT,
  avatar_url TEXT,
  avatar_variant INTEGER DEFAULT 0,
  avatar_zoom NUMERIC(4,2) DEFAULT 1.00,
  avatar_offset_x INTEGER DEFAULT 0,
  avatar_offset_y INTEGER DEFAULT 0,
  weekly_hours INTEGER CHECK (weekly_hours BETWEEN 1 AND 40) DEFAULT 10,
  preferred_project_types TEXT[] NOT NULL DEFAULT ARRAY['Competition', 'Innovation']::TEXT[],
  active_filter_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  linkedin TEXT,
  discoverable BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.profiles.role_mode IS
  'Keutamaan paparan antara muka sahaja (bukan penentu kuasa/akses). Kebenaran sebenar ditentukan oleh public.user_roles dan owner_id.';

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_privacy_consent ON public.profiles;
CREATE TRIGGER trg_profiles_privacy_consent
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private_security.handle_profile_privacy_consent();

-- 2.2 DATA PERIBADI SULIT / PII (public.profile_private)
-- email dibenarkan NULL bagi mengelakkan kegagalan jika akaun Auth tidak berasaskan e-mel.
CREATE TABLE IF NOT EXISTS public.profile_private (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE,
  matric_no TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profile_private_updated_at ON public.profile_private;
CREATE TRIGGER trg_profile_private_updated_at
BEFORE UPDATE ON public.profile_private
FOR EACH ROW EXECUTE FUNCTION private_security.handle_updated_at();

-- Trigger menghalang penukaran user_id, auth_user_id, atau email secara langsung oleh klien
CREATE OR REPLACE FUNCTION private_security.enforce_profile_private_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_trusted_context BOOLEAN := (
    current_setting('app.trusted_sync', TRUE) = 'true'
    OR (
      auth.uid() IS NULL
      AND current_user IN ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin')
    )
  );
BEGIN
  IF NOT v_is_trusted_context THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Akses ditolak: user_id tidak boleh diubah.';
    END IF;
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
      RAISE EXCEPTION 'Akses ditolak: auth_user_id tidak boleh diubah secara terus.';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Akses ditolak: Gunakan fungsi public.sync_my_auth_profile() untuk menyegerakkan e-mel Auth.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private_security.enforce_profile_private_immutability() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profile_private_immutability ON public.profile_private;
CREATE TRIGGER trg_profile_private_immutability
BEFORE UPDATE ON public.profile_private
FOR EACH ROW EXECUTE FUNCTION private_security.enforce_profile_private_immutability();

-- 2.3 JADUAL PERANAN SISTEM / RBAC (public.user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. FUNGSI KESELAMATAN DALAMAN (private_security) & PROVISIONING / SYNC RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION private_security.current_profile_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pp.user_id
  FROM public.profile_private pp
  WHERE pp.auth_user_id IS NOT NULL
    AND pp.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private_security.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profile_private pp ON pp.user_id = ur.user_id
    WHERE ur.role = 'admin'
      AND pp.auth_user_id IS NOT NULL
      AND pp.auth_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private_security.is_profile_discoverable(p_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_student_id
      AND p.discoverable = TRUE
  );
$$;

-- Kunci hak pelaksanaan fungsi dalaman kepada authenticated (untuk semakan RLS) dan service_role sahaja
REVOKE ALL ON FUNCTION private_security.current_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private_security.current_profile_id() TO authenticated, service_role, postgres;

REVOKE ALL ON FUNCTION private_security.is_system_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private_security.is_system_admin() TO authenticated, service_role, postgres;

REVOKE ALL ON FUNCTION private_security.is_profile_discoverable(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private_security.is_profile_discoverable(TEXT) TO authenticated, service_role, postgres;

-- 3.1 FUNGSI PENTADBIRAN DALAMAN UNTUK MELANTIK ADMIN BERDASARKAN UUID AUTH SAHAJA
-- TIDAK boleh dipanggil oleh anon atau authenticated; HANYA service_role / postgres di SQL Editor!
CREATE OR REPLACE FUNCTION private_security.promote_admin_by_auth_uuid(
  p_auth_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_email TEXT;
  v_existing_user_id TEXT;
BEGIN
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'UUID pengguna Auth diperlukan.';
  END IF;

  SELECT LOWER(TRIM(u.email)) INTO v_auth_email
  FROM auth.users u
  WHERE u.id = p_auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tiada rekod pengguna ditemui dalam auth.users bagi UUID %.', p_auth_user_id;
  END IF;

  PERFORM set_config('app.trusted_sync', 'true', TRUE);

  -- Semak jika UUID ini sudah dipautkan kepada mana-mana profil
  SELECT pp.user_id INTO v_existing_user_id
  FROM public.profile_private pp
  WHERE pp.auth_user_id = p_auth_user_id
  LIMIT 1;

  IF v_existing_user_id IS NULL THEN
    -- Pautkan kepada rekod 'usr-admin' jika wujud, atau cipta 'usr-admin'
    v_existing_user_id := 'usr-admin';

    INSERT INTO public.profiles (
      id, display_name, faculty, faculty_short, role_mode, discoverable
    ) VALUES (
      'usr-admin',
      'Fahrin Muneer',
      'Fakulti Komputeran dan Informatik (FKI), UMS',
      'FKI',
      'ORGANIZER',
      FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profile_private (
      user_id, auth_user_id, email, matric_no, phone
    ) VALUES (
      'usr-admin', p_auth_user_id, v_auth_email, 'A2412345', '+60 13-884 2412'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      auth_user_id = EXCLUDED.auth_user_id,
      email = COALESCE(EXCLUDED.email, public.profile_private.email),
      updated_at = NOW();
  END IF;

  INSERT INTO public.user_roles (user_id, role, assigned_at)
  VALUES (v_existing_user_id, 'admin', NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    assigned_at = NOW();

  RETURN v_existing_user_id;
END;
$$;

REVOKE ALL ON FUNCTION private_security.promote_admin_by_auth_uuid(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private_security.promote_admin_by_auth_uuid(UUID) TO service_role, postgres;

-- 3.2 FUNGSI RPC PROVISIONING & PENYEGERAKAN E-MEL PENGGUNA (public.sync_my_auth_profile)
-- - Tidak memberikan kuasa Admin berdasarkan e-mel (semua akaun baharu mendapat role = 'user').
-- - Mengikat ID profil secara deterministik kepada 'usr-' || auth.uid()::text.
-- - Menyegerakkan perubahan e-mel daripada auth.users / JWT secara selamat.
-- - Menyokong akaun dengan atau tanpa e-mel.
CREATE OR REPLACE FUNCTION public.sync_my_auth_profile(
  p_display_name TEXT DEFAULT NULL,
  p_faculty TEXT DEFAULT NULL,
  p_faculty_short TEXT DEFAULT NULL,
  p_matric_no TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_jwt_email TEXT := NULLIF(LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', ''))), '');
  v_profile_id TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi pengesahan diperlukan.';
  END IF;

  PERFORM set_config('app.trusted_sync', 'true', TRUE);

  -- Semak jika pengguna ini sudah mempunyai rekod terikat dengan auth.uid()
  SELECT pp.user_id INTO v_profile_id
  FROM public.profile_private pp
  WHERE pp.auth_user_id = v_uid
  LIMIT 1;

  IF v_profile_id IS NOT NULL THEN
    -- Segerakkan e-mel terkini daripada JWT jika pengguna menukar e-mel di Supabase Auth
    IF v_jwt_email IS NOT NULL THEN
      UPDATE public.profile_private
      SET email = v_jwt_email,
          updated_at = NOW()
      WHERE user_id = v_profile_id
        AND (email IS DISTINCT FROM v_jwt_email);
    END IF;
    RETURN v_profile_id;
  END IF;

  -- Cipta profil baharu yang diikat terus kepada UUID Auth (SENTIASA role = 'user')
  v_profile_id := 'usr-' || v_uid::text;

  INSERT INTO public.profiles (
    id,
    display_name,
    faculty,
    faculty_short,
    role_mode,
    discoverable,
    consent_at
  ) VALUES (
    v_profile_id,
    COALESCE(
      NULLIF(TRIM(p_display_name), ''),
      NULLIF(SPLIT_PART(COALESCE(v_jwt_email, ''), '@', 1), ''),
      'Pelajar UMS'
    ),
    COALESCE(NULLIF(TRIM(p_faculty), ''), 'Fakulti Komputeran dan Informatik (FKI), UMS'),
    COALESCE(NULLIF(TRIM(p_faculty_short), ''), 'FKI'),
    'STUDENT',
    FALSE,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_private (
    user_id,
    auth_user_id,
    email,
    matric_no,
    phone
  ) VALUES (
    v_profile_id,
    v_uid,
    v_jwt_email,
    NULLIF(UPPER(TRIM(COALESCE(p_matric_no, ''))), ''),
    NULLIF(TRIM(COALESCE(p_phone, '')), '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_profile_id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN v_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_my_auth_profile(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_my_auth_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 4. KATALOG KEMAHIRAN & MINAT (Bermula kosong — ditambah manual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY DEFAULT ('sk-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Technical',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interests (
  id TEXT PRIMARY KEY DEFAULT ('in-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. KEMAHIRAN, MINAT, JADUAL MASA LAPANG & SEJARAH SDP PELAJAR
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_skills (
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency TEXT NOT NULL CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.student_interests (
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, interest_id)
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id TEXT PRIMARY KEY DEFAULT ('av-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_availability_time_order CHECK (start_time < end_time)
);

-- Rekod rasmi mata ganjaran SDP — hanya boleh ditulis oleh Admin / proses dipercayai
CREATE TABLE IF NOT EXISTS public.student_activity_history (
  id TEXT PRIMARY KEY DEFAULT ('hist-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id TEXT,
  title TEXT NOT NULL,
  date_display TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Peserta',
  sdp_earned INTEGER NOT NULL DEFAULT 0 CHECK (sdp_earned >= 0),
  summary TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. JADUAL AKTIVITI / PROJEK KAMPUS UMS & JADUAL TELEFON PENGANJUR BERASINGAN
-- ============================================================================
-- Nombor telefon penganjur telah dikeluarkan daripada public.projects dan
-- disimpan di dalam jadual berasingan public.project_contacts.
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT ('prj-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('Assignment', 'Competition', 'Innovation', 'Community', 'Other')) DEFAULT 'Competition',
  slots_needed INTEGER NOT NULL DEFAULT 4 CHECK (slots_needed >= 1),
  min_weekly_hours INTEGER NOT NULL DEFAULT 6 CHECK (min_weekly_hours >= 1),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'completed')) DEFAULT 'open',
  deadline DATE,
  date_display TEXT,
  location TEXT DEFAULT 'Dewan Canselor, UMS',
  audience TEXT DEFAULT 'Terbuka kepada semua pelajar UMS',
  badge_line_1 TEXT DEFAULT 'Program',
  badge_line_2 TEXT DEFAULT 'FKI',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  attribute_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  trending BOOLEAN NOT NULL DEFAULT TRUE,
  organizer_name TEXT,
  banner_url TEXT,
  banner_preset TEXT DEFAULT 'prj-techfest',
  banner_position_y INTEGER NOT NULL DEFAULT 50 CHECK (banner_position_y BETWEEN 0 AND 100),
  gallery_images JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION private_security.handle_updated_at();

-- Jadual berasingan untuk nombor telefon / WhatsApp penganjur (Tidak terdedah kepada umum/anon)
CREATE TABLE IF NOT EXISTS public.project_contacts (
  project_id TEXT PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  organizer_phone TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_project_contacts_updated_at ON public.project_contacts;
CREATE TRIGGER trg_project_contacts_updated_at
BEFORE UPDATE ON public.project_contacts
FOR EACH ROW EXECUTE FUNCTION private_security.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.project_required_skills (
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  importance INTEGER NOT NULL DEFAULT 4 CHECK (importance BETWEEN 1 AND 5),
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.project_interests (
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, interest_id)
);

CREATE TABLE IF NOT EXISTS public.project_meeting_slots (
  id TEXT PRIMARY KEY DEFAULT ('ms-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  CONSTRAINT chk_meeting_time_order CHECK (start_time < end_time)
);

CREATE OR REPLACE FUNCTION private_security.is_project_owner_or_admin(p_project_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    private_security.is_system_admin()
    OR EXISTS (
      SELECT 1
      FROM public.projects prj
      WHERE prj.id = p_project_id
        AND prj.owner_id = private_security.current_profile_id()
    );
$$;

REVOKE ALL ON FUNCTION private_security.is_project_owner_or_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private_security.is_project_owner_or_admin(TEXT) TO authenticated, service_role, postgres;

-- ============================================================================
-- 7. SAVED ACTIVITIES, PERMOHONAN, NOTIFIKASI, LAPORAN MODERASI & RPC TRANSAKSI
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.saved_projects (
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  note TEXT DEFAULT 'Prioriti Utama',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT ('app-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (project_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  recipient_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  title TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id TEXT PRIMARY KEY DEFAULT ('rep-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'profile', 'message')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'dismissed')) DEFAULT 'open',
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.1 RPC KAWALAN PERALIHAN STATUS PERMOHONAN (Menggantikan UPDATE terus oleh klien)
-- Pemohon hanya boleh menarik balik (withdrawn) permohonan sendiri yang masih 'pending'
CREATE OR REPLACE FUNCTION public.withdraw_my_application(p_application_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me TEXT := private_security.current_profile_id();
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sila log masuk.';
  END IF;

  UPDATE public.applications
  SET status = 'withdrawn',
      responded_at = NOW()
  WHERE id = p_application_id
    AND applicant_id = v_me
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permohonan tidak ditemui atau tidak lagi berstatus pending.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_my_application(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_my_application(TEXT) TO authenticated, service_role;

-- Pemilik projek (atau Admin) hanya boleh menukar status kepada 'accepted' atau 'declined'
-- tanpa mengubah applicant_id atau note pemohon, serta menghantar notifikasi sistem secara sah
CREATE OR REPLACE FUNCTION public.decide_project_application(
  p_application_id TEXT,
  p_decision TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
BEGIN
  IF p_decision NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Keputusan mestilah sama ada accepted atau declined.';
  END IF;

  SELECT id, project_id, applicant_id, status
  INTO v_app
  FROM public.applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permohonan tidak ditemui.';
  END IF;

  IF NOT private_security.is_project_owner_or_admin(v_app.project_id) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya pemilik projek atau Admin boleh membuat keputusan permohonan.';
  END IF;

  UPDATE public.applications
  SET status = p_decision,
      responded_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.notifications (
    recipient_id,
    event_type,
    target_type,
    target_id,
    title,
    body
  ) VALUES (
    v_app.applicant_id,
    'application_' || p_decision,
    'application',
    v_app.id,
    CASE WHEN p_decision = 'accepted' THEN 'Permohonan Diterima' ELSE 'Status Permohonan Dikemas Kini' END,
    'Keputusan permohonan projek anda telah dikemas kini oleh penganjur.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.decide_project_application(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_project_application(TEXT, TEXT) TO authenticated, service_role;

-- 7.2 RPC MENANDA NOTIFIKASI SENDIRI SEBAGAI DIBACA
CREATE OR REPLACE FUNCTION public.mark_my_notification_read(p_notification_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me TEXT := private_security.current_profile_id();
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sila log masuk.';
  END IF;

  UPDATE public.notifications
  SET read_at = COALESCE(read_at, NOW())
  WHERE id = p_notification_id
    AND recipient_id = v_me;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_my_notification_read(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_my_notification_read(TEXT) TO authenticated, service_role;

-- ============================================================================
-- 8. INDEKS PRESTASI (Performance Indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profile_private_email ON public.profile_private (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profile_private_auth_uid ON public.profile_private (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_saved_projects_student_id ON public.saved_projects (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON public.applications (project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications (recipient_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON public.moderation_reports (status);

-- ============================================================================
-- 9. PENGURUSAN GRANT & REVOKE EKSPLISIT PADA SKEMA PUBLIC
-- ============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Tetapkan keistimewaan jadual minimum (Least Privilege) kepada authenticated:
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.profile_private TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

GRANT SELECT, INSERT ON public.skills TO authenticated;
GRANT SELECT, INSERT ON public.interests TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_interests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;

-- student_activity_history (SDP): Pengguna hanya boleh SELECT; hanya Admin/service_role boleh tulis
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_activity_history TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_required_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_interests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_meeting_slots TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_projects TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.applications TO authenticated;
GRANT SELECT, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderation_reports TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;

-- ============================================================================
-- 10. ROW-LEVEL SECURITY (RLS) — SEMUA POLISI DINYATAKAN DENGAN 'TO authenticated'
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_required_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 10.1 PROFILES (Penciptaan melalui RPC sync_my_auth_profile; bacaan ikut opt-in discoverable)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_discoverable_or_own" ON public.profiles;
CREATE POLICY "profiles_select_discoverable_or_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = private_security.current_profile_id()
    OR private_security.is_system_admin()
    OR (discoverable = TRUE AND consent_at IS NOT NULL)
  );

DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;
CREATE POLICY "profiles_insert_admin_only" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = private_security.current_profile_id() OR private_security.is_system_admin())
  WITH CHECK (id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin() AND id <> 'usr-admin');

-- ----------------------------------------------------------------------------
-- 10.2 PROFILE_PRIVATE (Data Sulit PII: email, matric_no, phone)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profile_private_select_own_or_admin" ON public.profile_private;
CREATE POLICY "profile_private_select_own_or_admin" ON public.profile_private
  FOR SELECT TO authenticated
  USING (
    (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
    OR private_security.is_system_admin()
  );

DROP POLICY IF EXISTS "profile_private_insert_admin_only" ON public.profile_private;
CREATE POLICY "profile_private_insert_admin_only" ON public.profile_private
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "profile_private_update_own_or_admin" ON public.profile_private;
CREATE POLICY "profile_private_update_own_or_admin" ON public.profile_private
  FOR UPDATE TO authenticated
  USING (
    (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
    OR private_security.is_system_admin()
  )
  WITH CHECK (
    private_security.is_system_admin()
    OR (
      auth_user_id IS NOT NULL
      AND auth_user_id = auth.uid()
      AND user_id = private_security.current_profile_id()
    )
  );

DROP POLICY IF EXISTS "profile_private_delete_admin" ON public.profile_private;
CREATE POLICY "profile_private_delete_admin" ON public.profile_private
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin() AND user_id <> 'usr-admin');

-- ----------------------------------------------------------------------------
-- 10.3 USER_ROLES (Kawalan Peranan RBAC)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = private_security.current_profile_id()
    OR private_security.is_system_admin()
  );

DROP POLICY IF EXISTS "user_roles_insert_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_insert_admin_only" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "user_roles_update_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_update_admin_only" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "user_roles_delete_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_delete_admin_only" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin() AND user_id <> 'usr-admin');

-- ----------------------------------------------------------------------------
-- 10.4 SKILLS & INTERESTS CATALOG (Hanya untuk pengguna log masuk 'TO authenticated')
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "skills_select_authenticated" ON public.skills;
CREATE POLICY "skills_select_authenticated" ON public.skills
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "skills_insert_authenticated" ON public.skills;
CREATE POLICY "skills_insert_authenticated" ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "skills_update_admin_only" ON public.skills;
CREATE POLICY "skills_update_admin_only" ON public.skills
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "skills_delete_admin_only" ON public.skills;
CREATE POLICY "skills_delete_admin_only" ON public.skills
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin());

DROP POLICY IF EXISTS "interests_select_authenticated" ON public.interests;
CREATE POLICY "interests_select_authenticated" ON public.interests
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "interests_insert_authenticated" ON public.interests;
CREATE POLICY "interests_insert_authenticated" ON public.interests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "interests_update_admin_only" ON public.interests;
CREATE POLICY "interests_update_admin_only" ON public.interests
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "interests_delete_admin_only" ON public.interests;
CREATE POLICY "interests_delete_admin_only" ON public.interests
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin());

-- ----------------------------------------------------------------------------
-- 10.5 STUDENT SKILLS, INTERESTS, AVAILABILITY SLOTS & SDP HISTORY
-- - student_activity_history (SDP): Hanya Admin boleh INSERT/UPDATE/DELETE!
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "student_skills_select" ON public.student_skills;
CREATE POLICY "student_skills_select" ON public.student_skills
  FOR SELECT TO authenticated
  USING (
    student_id = private_security.current_profile_id()
    OR private_security.is_system_admin()
    OR private_security.is_profile_discoverable(student_id)
  );

DROP POLICY IF EXISTS "student_skills_insert_own" ON public.student_skills;
CREATE POLICY "student_skills_insert_own" ON public.student_skills
  FOR INSERT TO authenticated
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "student_skills_update_own" ON public.student_skills;
CREATE POLICY "student_skills_update_own" ON public.student_skills
  FOR UPDATE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin())
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "student_skills_delete_own" ON public.student_skills;
CREATE POLICY "student_skills_delete_own" ON public.student_skills
  FOR DELETE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

-- STUDENT INTERESTS
DROP POLICY IF EXISTS "student_interests_select" ON public.student_interests;
CREATE POLICY "student_interests_select" ON public.student_interests
  FOR SELECT TO authenticated
  USING (
    student_id = private_security.current_profile_id()
    OR private_security.is_system_admin()
    OR private_security.is_profile_discoverable(student_id)
  );

DROP POLICY IF EXISTS "student_interests_insert_own" ON public.student_interests;
CREATE POLICY "student_interests_insert_own" ON public.student_interests
  FOR INSERT TO authenticated
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "student_interests_update_own" ON public.student_interests;
CREATE POLICY "student_interests_update_own" ON public.student_interests
  FOR UPDATE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin())
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "student_interests_delete_own" ON public.student_interests;
CREATE POLICY "student_interests_delete_own" ON public.student_interests
  FOR DELETE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

-- AVAILABILITY SLOTS (Jadual masa peribadi — HANYA pemilik atau Admin boleh baca/urus!)
DROP POLICY IF EXISTS "availability_slots_select" ON public.availability_slots;
CREATE POLICY "availability_slots_select" ON public.availability_slots
  FOR SELECT TO authenticated
  USING (
    student_id = private_security.current_profile_id()
    OR private_security.is_system_admin()
  );

DROP POLICY IF EXISTS "availability_slots_insert_own" ON public.availability_slots;
CREATE POLICY "availability_slots_insert_own" ON public.availability_slots
  FOR INSERT TO authenticated
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "availability_slots_update_own" ON public.availability_slots;
CREATE POLICY "availability_slots_update_own" ON public.availability_slots
  FOR UPDATE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin())
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "availability_slots_delete_own" ON public.availability_slots;
CREATE POLICY "availability_slots_delete_own" ON public.availability_slots
  FOR DELETE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

-- STUDENT ACTIVITY HISTORY (Mata Ganjaran Rasmi SDP)
-- Pengguna hanya boleh membaca rekod sendiri; HANYA Admin boleh menambah/mengubah/memadam SDP!
DROP POLICY IF EXISTS "student_history_select" ON public.student_activity_history;
CREATE POLICY "student_history_select" ON public.student_activity_history
  FOR SELECT TO authenticated
  USING (
    student_id = private_security.current_profile_id()
    OR private_security.is_system_admin()
  );

DROP POLICY IF EXISTS "student_history_insert_admin_only" ON public.student_activity_history;
CREATE POLICY "student_history_insert_admin_only" ON public.student_activity_history
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "student_history_update_admin_only" ON public.student_activity_history;
CREATE POLICY "student_history_update_admin_only" ON public.student_activity_history
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "student_history_delete_admin_only" ON public.student_activity_history;
CREATE POLICY "student_history_delete_admin_only" ON public.student_activity_history
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin());

-- ----------------------------------------------------------------------------
-- 10.6 PROJECTS, PROJECT_CONTACTS & SUB-JADUAL PROJEK (TO authenticated)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
CREATE POLICY "projects_select_authenticated" ON public.projects
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "projects_insert_owner_or_admin" ON public.projects;
CREATE POLICY "projects_insert_owner_or_admin" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "projects_update_author_or_admin_only" ON public.projects;
CREATE POLICY "projects_update_author_or_admin_only" ON public.projects
  FOR UPDATE TO authenticated
  USING (owner_id = private_security.current_profile_id() OR private_security.is_system_admin())
  WITH CHECK (owner_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "projects_delete_author_or_admin_only" ON public.projects;
CREATE POLICY "projects_delete_author_or_admin_only" ON public.projects
  FOR DELETE TO authenticated
  USING (owner_id = private_security.current_profile_id() OR private_security.is_system_admin());

-- PROJECT CONTACTS (Nombor Telefon Penganjur — Terlindung daripada bacaan awam tanpa log masuk)
DROP POLICY IF EXISTS "project_contacts_select_authenticated" ON public.project_contacts;
CREATE POLICY "project_contacts_select_authenticated" ON public.project_contacts
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_contacts_insert_owner_or_admin" ON public.project_contacts;
CREATE POLICY "project_contacts_insert_owner_or_admin" ON public.project_contacts
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_contacts_update_owner_or_admin" ON public.project_contacts;
CREATE POLICY "project_contacts_update_owner_or_admin" ON public.project_contacts
  FOR UPDATE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id))
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_contacts_delete_owner_or_admin" ON public.project_contacts;
CREATE POLICY "project_contacts_delete_owner_or_admin" ON public.project_contacts
  FOR DELETE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id));

-- PROJECT REQUIRED SKILLS
DROP POLICY IF EXISTS "project_req_skills_select" ON public.project_required_skills;
CREATE POLICY "project_req_skills_select" ON public.project_required_skills
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_req_skills_insert" ON public.project_required_skills;
CREATE POLICY "project_req_skills_insert" ON public.project_required_skills
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_req_skills_update" ON public.project_required_skills;
CREATE POLICY "project_req_skills_update" ON public.project_required_skills
  FOR UPDATE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id))
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_req_skills_delete" ON public.project_required_skills;
CREATE POLICY "project_req_skills_delete" ON public.project_required_skills
  FOR DELETE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id));

-- PROJECT INTERESTS
DROP POLICY IF EXISTS "project_interests_select" ON public.project_interests;
CREATE POLICY "project_interests_select" ON public.project_interests
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_interests_insert" ON public.project_interests;
CREATE POLICY "project_interests_insert" ON public.project_interests
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_interests_update" ON public.project_interests;
CREATE POLICY "project_interests_update" ON public.project_interests
  FOR UPDATE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id))
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_interests_delete" ON public.project_interests;
CREATE POLICY "project_interests_delete" ON public.project_interests
  FOR DELETE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id));

-- PROJECT MEETING SLOTS
DROP POLICY IF EXISTS "project_meeting_slots_select" ON public.project_meeting_slots;
CREATE POLICY "project_meeting_slots_select" ON public.project_meeting_slots
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_meeting_slots_insert" ON public.project_meeting_slots;
CREATE POLICY "project_meeting_slots_insert" ON public.project_meeting_slots
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_meeting_slots_update" ON public.project_meeting_slots;
CREATE POLICY "project_meeting_slots_update" ON public.project_meeting_slots
  FOR UPDATE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id))
  WITH CHECK (private_security.is_project_owner_or_admin(project_id));

DROP POLICY IF EXISTS "project_meeting_slots_delete" ON public.project_meeting_slots;
CREATE POLICY "project_meeting_slots_delete" ON public.project_meeting_slots
  FOR DELETE TO authenticated
  USING (private_security.is_project_owner_or_admin(project_id));

-- ----------------------------------------------------------------------------
-- 10.7 SAVED PROJECTS, APPLICATIONS, NOTIFICATIONS & MODERATION REPORTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "saved_projects_select_own" ON public.saved_projects;
CREATE POLICY "saved_projects_select_own" ON public.saved_projects
  FOR SELECT TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "saved_projects_insert_own" ON public.saved_projects;
CREATE POLICY "saved_projects_insert_own" ON public.saved_projects
  FOR INSERT TO authenticated
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "saved_projects_update_own" ON public.saved_projects;
CREATE POLICY "saved_projects_update_own" ON public.saved_projects
  FOR UPDATE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin())
  WITH CHECK (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "saved_projects_delete_own" ON public.saved_projects;
CREATE POLICY "saved_projects_delete_own" ON public.saved_projects
  FOR DELETE TO authenticated
  USING (student_id = private_security.current_profile_id() OR private_security.is_system_admin());

-- APPLICATIONS (Peralihan status oleh pemohon/penganjur dilakukan melalui RPC khusus)
DROP POLICY IF EXISTS "applications_select" ON public.applications;
CREATE POLICY "applications_select" ON public.applications
  FOR SELECT TO authenticated
  USING (
    applicant_id = private_security.current_profile_id()
    OR private_security.is_project_owner_or_admin(project_id)
  );

DROP POLICY IF EXISTS "applications_insert" ON public.applications;
CREATE POLICY "applications_insert" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    (applicant_id = private_security.current_profile_id() AND status = 'pending')
    OR private_security.is_system_admin()
  );

DROP POLICY IF EXISTS "applications_update_admin_only" ON public.applications;
CREATE POLICY "applications_update_admin_only" ON public.applications
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "applications_delete" ON public.applications;
CREATE POLICY "applications_delete" ON public.applications
  FOR DELETE TO authenticated
  USING (
    (applicant_id = private_security.current_profile_id() AND status = 'pending')
    OR private_security.is_system_admin()
  );

-- NOTIFICATIONS (Klien biasa TIDAK boleh INSERT notifikasi kepada pengguna lain!)
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "notifications_insert_admin_only" ON public.notifications;
CREATE POLICY "notifications_insert_admin_only" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "notifications_update_admin_only" ON public.notifications;
CREATE POLICY "notifications_update_admin_only" ON public.notifications
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (recipient_id = private_security.current_profile_id() OR private_security.is_system_admin());

-- MODERATION REPORTS
DROP POLICY IF EXISTS "reports_select_own_or_admin" ON public.moderation_reports;
CREATE POLICY "reports_select_own_or_admin" ON public.moderation_reports
  FOR SELECT TO authenticated
  USING (reporter_id = private_security.current_profile_id() OR private_security.is_system_admin());

DROP POLICY IF EXISTS "reports_insert_authenticated" ON public.moderation_reports;
CREATE POLICY "reports_insert_authenticated" ON public.moderation_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    (reporter_id = private_security.current_profile_id() AND status = 'open')
    OR private_security.is_system_admin()
  );

DROP POLICY IF EXISTS "reports_update_admin_only" ON public.moderation_reports;
CREATE POLICY "reports_update_admin_only" ON public.moderation_reports
  FOR UPDATE TO authenticated
  USING (private_security.is_system_admin())
  WITH CHECK (private_security.is_system_admin());

DROP POLICY IF EXISTS "reports_delete_admin_only" ON public.moderation_reports;
CREATE POLICY "reports_delete_admin_only" ON public.moderation_reports
  FOR DELETE TO authenticated
  USING (private_security.is_system_admin());

-- ============================================================================
-- 11. SEED REKOD ASAS PROFIL ADMIN & ARAHAN PENGIKATAN UUID AUTH
-- ============================================================================
-- Rekod asas 'usr-admin' dicipta tanpa pautan automatik berasaskan e-mel.
-- Selepas anda mendaftar/log masuk akaun Admin di Supabase Auth dan menyemak
-- UUID sebenar anda di jadual auth.users, jalankan arahan:
--   SELECT private_security.promote_admin_by_auth_uuid('<UUID_AUTH_SEBENAR_ANDA>');
-- di dalam Supabase SQL Editor (sebagai postgres) untuk mengikat UUID tersebut.
-- ============================================================================
INSERT INTO public.profiles (
  id,
  display_name,
  faculty,
  faculty_short,
  programme,
  year_of_study,
  location,
  availability_status,
  role_mode,
  bio,
  weekly_hours,
  preferred_project_types,
  active_filter_tags,
  linkedin,
  discoverable,
  consent_at
) VALUES (
  'usr-admin',
  'Fahrin Muneer',
  'Fakulti Komputeran dan Informatik (FKI), UMS',
  'FKI',
  'Software Engineering',
  2,
  'Kota Kinabalu',
  'Available',
  'ORGANIZER',
  'Pentadbir Sistem (System Admin) ProjectLink UMS. Mengurus kesemua siaran aktiviti kampus, akaun pengguna berdaftar, dan laporan moderasi.',
  15,
  ARRAY['Competition', 'Innovation', 'Community', 'Assignment'],
  ARRAY[]::TEXT[],
  'linkedin.com/in/fahrin-muneer-ums',
  FALSE,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

INSERT INTO public.profile_private (
  user_id,
  email,
  matric_no,
  phone
) VALUES (
  'usr-admin',
  'fahrinmuneer3@gmail.com',
  'A2412345',
  '+60 13-884 2412'
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  matric_no = EXCLUDED.matric_no,
  phone = EXCLUDED.phone,
  updated_at = NOW();

INSERT INTO public.user_roles (
  user_id,
  role
) VALUES (
  'usr-admin',
  'admin'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  assigned_at = NOW();
