'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Application,
  AvailabilitySlot,
  BetaTaskCode,
  BetaTestResult,
  CreateProjectPayload,
  Interest,
  ModerationReport,
  NotificationItem,
  Proficiency,
  Profile,
  Project,
  ProjectGalleryItem,
  ProjectInterest,
  ProjectInvitation,
  ProjectMeetingSlot,
  ProjectMember,
  ProjectMessage,
  ProjectRequiredSkill,
  ProjectStatus,
  ProjectTask,
  ProjectType,
  SavedProject,
  SaveMyProfilePayload,
  Skill,
  StudentActivityHistory,
  StudentInterest,
  StudentSkill,
  TaskPriority,
  TaskStatus,
} from './types';
import {
  getDefaultGalleryForProject,
  INITIAL_ACTIVITY_HISTORY,
  INITIAL_APPLICATIONS,
  INITIAL_AVAILABILITY_SLOTS,
  INITIAL_BETA_RESULTS,
  INITIAL_INTERESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILES,
  INITIAL_PROJECT_INTERESTS,
  INITIAL_PROJECT_INVITATIONS,
  INITIAL_PROJECT_MEETING_SLOTS,
  INITIAL_PROJECT_MEMBERS,
  INITIAL_PROJECT_MESSAGES,
  INITIAL_PROJECT_REQUIRED_SKILLS,
  INITIAL_PROJECT_TASKS,
  INITIAL_PROJECTS,
  INITIAL_REPORTS,
  INITIAL_SAVED_PROJECTS,
  INITIAL_SKILLS,
  INITIAL_STUDENT_INTERESTS,
  INITIAL_STUDENT_SKILLS,
  OFFICIAL_FILTER_TAGS,
} from './seed-data';

const STORAGE_KEY = 'projectlink_ums_clean_admin_v1';

interface DatabaseState {
  currentUserId: string;
  profiles: Profile[];
  skills: Skill[];
  studentSkills: StudentSkill[];
  interests: Interest[];
  studentInterests: StudentInterest[];
  availabilitySlots: AvailabilitySlot[];
  projects: Project[];
  projectRequiredSkills: ProjectRequiredSkill[];
  projectInterests: ProjectInterest[];
  projectMeetingSlots: ProjectMeetingSlot[];
  applications: Application[];
  projectMembers: ProjectMember[];
  projectInvitations: ProjectInvitation[];
  notifications: NotificationItem[];
  betaTestResults: BetaTestResult[];
  projectTasks: ProjectTask[];
  projectMessages: ProjectMessage[];
  savedProjects: SavedProject[];
  reports: ModerationReport[];
  activityHistory: StudentActivityHistory[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error';
}

interface ProjectLinkContextValue extends DatabaseState {
  currentUser: Profile | null;
  isAdmin: boolean;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notifyToast: (
    title: string,
    description?: string,
    variant?: 'default' | 'success' | 'error'
  ) => void;
  switchPersona: (userId: string) => void;
  createCustomTestAccount: (displayName: string, faculty: string) => string;
  registerStudentAccount: (params: {
    displayName: string;
    email: string;
    facultyShort: string;
    facultyFull: string;
  }) => string;
  signInWithCredentials: (identifier: string) => Profile | null;
  authSessionToken: string | null;
  loginWithApi: (
    identifier: string,
    password: string
  ) => Promise<{ok: boolean; error?: string; profile?: Profile}>;
  registerWithApi: (params: {
    displayName: string;
    email: string;
    password: string;
    facultyShort: string;
    facultyFull: string;
    matricNo?: string;
    phone?: string;
  }) => Promise<{ok: boolean; error?: string; profile?: Profile}>;
  initiateSignUpWithApi: (params: {
    displayName: string;
    email: string;
    password: string;
    facultyShort: string;
    facultyFull: string;
    matricNo?: string;
    phone?: string;
  }) => Promise<{
    ok: boolean;
    error?: string;
    email?: string;
    verificationCode?: string;
    message?: string;
  }>;
  verifySignUpCodeWithApi: (
    email: string,
    code: string
  ) => Promise<{ok: boolean; error?: string; profile?: Profile}>;
  resendVerificationCodeWithApi: (email: string) => Promise<{
    ok: boolean;
    error?: string;
    verificationCode?: string;
    message?: string;
  }>;
  initiatePasswordResetWithApi: (identifier: string) => Promise<{
    ok: boolean;
    error?: string;
    email?: string;
    resetCode?: string;
    message?: string;
  }>;
  resetPasswordWithApi: (
    email: string,
    newPassword: string,
    code: string
  ) => Promise<{ok: boolean; error?: string; message?: string}>;
  logoutWithApi: () => Promise<void>;
  resetDemoDatabase: () => void;
  refreshProjectsFeed: () => void;
  seedStarterActivities: () => void;

  // 11 Canonical RPCs matching 03_FUNCTIONS_RPC.sql
  saveMyProfile: (payload: SaveMyProfilePayload) => void;
  createProject: (payload: CreateProjectPayload) => string;
  applyToProject: (p_project_id: string, p_note: string) => string;
  decideApplication: (
    p_application_id: string,
    p_decision: 'accepted' | 'declined'
  ) => void;
  withdrawApplication: (p_application_id: string) => void;
  inviteCandidate: (
    p_project_id: string,
    p_invitee_id: string,
    p_note: string
  ) => string;
  respondInvitation: (
    p_invitation_id: string,
    p_decision: 'accepted' | 'declined'
  ) => void;
  setProjectStatus: (p_project_id: string, p_status: ProjectStatus) => void;
  cancelInvitation: (p_invitation_id: string) => void;
  leaveProject: (p_project_id: string) => void;
  markNotificationRead: (p_notification_id: string) => void;
  markAllNotificationsRead: () => void;

  // Normalized Relational Actions for Home, Profile (Fahrin) & Side Menu UI
  updateProfileMetadata: (fields: Partial<Profile>) => void;
  toggleFilterTag: (tag: string) => void;
  randomizeFilterTags: () => void;
  addStudentSkillByName: (
    skillName: string,
    proficiency?: Proficiency
  ) => void;
  removeStudentSkillById: (skillId: string) => void;
  addStudentInterestByName: (interestName: string) => void;
  removeStudentInterestById: (interestId: string) => void;
  addAvailabilitySlot: (slot: {
    weekday: number;
    start_time: string;
    end_time: string;
  }) => void;
  removeAvailabilitySlot: (slotId: string) => void;
  addActivityHistory: (entry: {
    title: string;
    date_display: string;
    role: string;
    sdp_earned: number;
    summary: string;
    project_id?: string | null;
  }) => void;

  // Workspace, Bookmark, Beta Feedback & Moderation Actions
  updateProjectDetails: (
    projectId: string,
    updates: {
      title?: string;
      description?: string;
      project_type?: ProjectType;
      date_display?: string;
      deadline?: string | null;
      location?: string;
      audience?: string;
      slots_needed?: number;
      min_weekly_hours?: number;
      organizer_name?: string;
      organizer_phone?: string;
      badge_line_1?: string;
      badge_line_2?: string;
      tags?: string[];
      status?: ProjectStatus;
    }
  ) => boolean;
  deleteOwnProject: (projectId: string) => boolean;
  updateProjectBanner: (
    projectId: string,
    banner: {
      banner_url?: string | null;
      banner_preset?: string;
      banner_position_y?: number;
    }
  ) => void;
  addProjectGalleryImage: (
    projectId: string,
    item: {url: string; caption: string; badge?: string}
  ) => void;
  removeProjectGalleryImage: (projectId: string, imageId: string) => void;
  toggleSaveProject: (projectId: string) => void;
  saveProjectOnly: (projectId: string) => void;
  createTask: (params: {
    project_id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    assignee_id: string | null;
    due_at: string | null;
  }) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  sendMessage: (projectId: string, body: string) => void;
  deleteMessage: (messageId: string) => void;
  submitBetaResult: (params: {
    task_code: BetaTaskCode;
    success: boolean;
    duration_seconds: number;
    difficulty_1_to_5: number;
    comment: string;
  }) => void;
  submitReport: (params: {
    target_type: 'project' | 'profile' | 'message';
    target_id: string;
    reason: string;
  }) => void;
  resolveReport: (
    reportId: string,
    status: 'resolved' | 'dismissed',
    resolutionNote: string
  ) => void;
  adminDeleteProject: (projectId: string) => void;
  adminUpdateProjectStatus: (
    projectId: string,
    status: ProjectStatus
  ) => void;
  adminDeleteUser: (userId: string) => void;
}

const getInitialState = (): DatabaseState => ({
  currentUserId: 'usr-admin',
  profiles: INITIAL_PROFILES,
  skills: INITIAL_SKILLS,
  studentSkills: INITIAL_STUDENT_SKILLS,
  interests: INITIAL_INTERESTS,
  studentInterests: INITIAL_STUDENT_INTERESTS,
  availabilitySlots: INITIAL_AVAILABILITY_SLOTS,
  projects: INITIAL_PROJECTS,
  projectRequiredSkills: INITIAL_PROJECT_REQUIRED_SKILLS,
  projectInterests: INITIAL_PROJECT_INTERESTS,
  projectMeetingSlots: INITIAL_PROJECT_MEETING_SLOTS,
  applications: INITIAL_APPLICATIONS,
  projectMembers: INITIAL_PROJECT_MEMBERS,
  projectInvitations: INITIAL_PROJECT_INVITATIONS,
  notifications: INITIAL_NOTIFICATIONS,
  betaTestResults: INITIAL_BETA_RESULTS,
  projectTasks: INITIAL_PROJECT_TASKS,
  projectMessages: INITIAL_PROJECT_MESSAGES,
  savedProjects: INITIAL_SAVED_PROJECTS,
  reports: INITIAL_REPORTS,
  activityHistory: INITIAL_ACTIVITY_HISTORY,
});

const ProjectLinkContext = createContext<ProjectLinkContextValue | null>(null);

export function ProjectLinkProvider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<DatabaseState>(getInitialState);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authSessionToken, setAuthSessionToken] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  // Restore saved state from localStorage & verify active backend session after initial hydration
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedToken = window.localStorage.getItem(
          'projectlink_auth_token_v1'
        );
        if (savedToken) {
          setAuthSessionToken(savedToken);
        }
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DatabaseState>;
          if (parsed.profiles && parsed.projects && parsed.skills) {
            const legacyDummyIds = new Set([
              'usr-aiman',
              'usr-izzah',
              'usr-daniel',
              'usr-farah',
              'usr-keith',
            ]);

            // Ensure usr-admin (fahrinmuneer3@gmail.com) exists and enforce 2-role abstraction ('admin' vs 'user')
            const adminSeed = INITIAL_PROFILES.find(
              (p) => p.id === 'usr-admin'
            );
            const cleanedProfiles = parsed.profiles.filter(
              (p) => !legacyDummyIds.has(p.id)
            );
            const hasAdminInParsed = cleanedProfiles.some(
              (p) =>
                p.id === 'usr-admin' ||
                (p.email &&
                  p.email.toLowerCase() === 'fahrinmuneer3@gmail.com')
            );
            const baseProfiles =
              !hasAdminInParsed && adminSeed
                ? [adminSeed, ...cleanedProfiles]
                : cleanedProfiles;

            const normalizedProfiles: Profile[] = baseProfiles.map((p) => {
              const isEmailAdmin =
                p.email?.toLowerCase() === 'fahrinmuneer3@gmail.com';
              return {
                ...p,
                role: isEmailAdmin ? 'admin' : 'user',
                is_admin: isEmailAdmin,
              };
            });

            const resolvedUserId =
              parsed.currentUserId &&
              normalizedProfiles.some((p) => p.id === parsed.currentUserId)
                ? parsed.currentUserId
                : 'usr-admin';

            // Merge predetermined official catalogs & ensure cross-faculty test activities are present
            const officialSkillIds = new Set(INITIAL_SKILLS.map((s) => s.id));
            const officialInterestIds = new Set(
              INITIAL_INTERESTS.map((i) => i.id)
            );
            const officialFilterIds = new Set(
              OFFICIAL_FILTER_TAGS.map((t) => t.id)
            );

            const sanitizedProfiles = normalizedProfiles.map((prof) => {
              const cleanedFilterTags = (prof.active_filter_tags || []).filter(
                (t) =>
                  officialFilterIds.has(t) ||
                  INITIAL_SKILLS.some((s) => s.name === t) ||
                  INITIAL_INTERESTS.some((i) => i.name === t)
              );
              return {
                ...prof,
                active_filter_tags:
                  cleanedFilterTags.length > 0
                    ? cleanedFilterTags
                    : prof.id === 'usr-admin'
                      ? ['Programming', 'Planning', 'AI & Data']
                      : [],
              };
            });

            const existingProjects = Array.isArray(parsed.projects)
              ? parsed.projects
              : [];
            const seedProjectIds = new Set(INITIAL_PROJECTS.map((p) => p.id));
            const userCreatedProjects = existingProjects.filter(
              (p) => !seedProjectIds.has(p.id)
            );
            const mergedProjects = [
              ...userCreatedProjects,
              ...INITIAL_PROJECTS,
            ];

            const existingReqSkills = Array.isArray(
              parsed.projectRequiredSkills
            )
              ? parsed.projectRequiredSkills.filter(
                  (r) =>
                    !seedProjectIds.has(r.project_id) &&
                    officialSkillIds.has(r.skill_id)
                )
              : [];
            const mergedReqSkills = [
              ...existingReqSkills,
              ...INITIAL_PROJECT_REQUIRED_SKILLS,
            ];

            const existingProjInterests = Array.isArray(parsed.projectInterests)
              ? parsed.projectInterests.filter(
                  (pi) =>
                    !seedProjectIds.has(pi.project_id) &&
                    officialInterestIds.has(pi.interest_id)
                )
              : [];
            const mergedProjInterests = [
              ...existingProjInterests,
              ...INITIAL_PROJECT_INTERESTS,
            ];

            const existingMeetSlots = Array.isArray(parsed.projectMeetingSlots)
              ? parsed.projectMeetingSlots.filter(
                  (ms) => !seedProjectIds.has(ms.project_id)
                )
              : [];
            const mergedMeetSlots = [
              ...existingMeetSlots,
              ...INITIAL_PROJECT_MEETING_SLOTS,
            ];

            const validStudSkills = Array.isArray(parsed.studentSkills)
              ? parsed.studentSkills.filter((ss) =>
                  officialSkillIds.has(ss.skill_id)
                )
              : [];
            const validStudInterests = Array.isArray(parsed.studentInterests)
              ? parsed.studentInterests.filter((si) =>
                  officialInterestIds.has(si.interest_id)
                )
              : [];

            setState((prev) => ({
              ...prev,
              ...parsed,
              currentUserId: resolvedUserId,
              profiles: sanitizedProfiles,
              skills: INITIAL_SKILLS,
              interests: INITIAL_INTERESTS,
              projects: mergedProjects,
              projectRequiredSkills: mergedReqSkills,
              projectInterests: mergedProjInterests,
              projectMeetingSlots: mergedMeetSlots,
              studentSkills:
                validStudSkills.length > 0
                  ? validStudSkills
                  : INITIAL_STUDENT_SKILLS,
              studentInterests:
                validStudInterests.length > 0
                  ? validStudInterests
                  : INITIAL_STUDENT_INTERESTS,
              availabilitySlots:
                Array.isArray(parsed.availabilitySlots) &&
                parsed.availabilitySlots.length > 0
                  ? parsed.availabilitySlots
                  : INITIAL_AVAILABILITY_SLOTS,
              activityHistory:
                Array.isArray(parsed.activityHistory) &&
                parsed.activityHistory.length > 0
                  ? parsed.activityHistory
                  : INITIAL_ACTIVITY_HISTORY,
              reports: Array.isArray(parsed.reports) ? parsed.reports : [],
            }));
          }
        }
      } catch (e) {
        console.error('Failed to restore state from localStorage:', e);
      } finally {
        isHydratedRef.current = true;
      }
    });
  }, []);

  // Persist to localStorage & asynchronously sync to backend /api/rpc once hydrated
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      fetch('/api/rpc', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          rpc: 'sync_state',
          stateSnapshot: state,
        }),
      }).catch(() => {
        // Non-blocking background sync
      });
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [state]);

  const notifyToast = (
    title: string,
    description?: string,
    variant: 'default' | 'success' | 'error' = 'default'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, {id, title, description, variant}]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentUser =
    state.profiles.find((p) => p.id === state.currentUserId) || null;

  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
      currentUser?.is_admin ||
      currentUser?.email?.toLowerCase() === 'fahrinmuneer3@gmail.com'
  );

  const switchPersona = (userId: string) => {
    const found = state.profiles.find((p) => p.id === userId);
    if (!found) return;
    setState((prev) => ({...prev, currentUserId: userId}));
    notifyToast(
      `Akaun Ditukar: ${found.display_name}`,
      `${found.matric_no || 'UMS'} · ${found.programme || found.faculty}`,
      'default'
    );
  };

  const createCustomTestAccount = (displayName: string, faculty: string) => {
    const cleanName = displayName.trim() || 'Pelajar UMS';
    const newId = `usr-custom-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newProfile: Profile = {
      id: newId,
      display_name: cleanName,
      matric_no: `A24${Math.floor(10000 + Math.random() * 89999)}`,
      faculty: faculty.trim() || 'Fakulti Komputeran dan Informatik (FKI), UMS',
      faculty_short: 'FKI',
      programme: 'Software Engineering',
      year_of_study: 1,
      location: 'Kota Kinabalu',
      availability_status: 'Available',
      role_mode: 'STUDENT',
      bio: 'Pelajar baharu di UMS yang berminat dalam kolaborasi projek antara fakulti.',
      avatar_url: null,
      avatar_variant: 0,
      weekly_hours: 10,
      preferred_project_types: ['Innovation', 'Competition'],
      active_filter_tags: ['Programming', 'Planning', 'Database'],
      discoverable: true,
      consent_at: now,
      created_at: now,
      updated_at: now,
      is_fictional_test_account: true,
    };
    setState((prev) => ({
      ...prev,
      currentUserId: newId,
      profiles: [...prev.profiles, newProfile],
    }));
    notifyToast('Akaun Pelajar Baharu Dicipta', cleanName, 'success');
    return newId;
  };

  const registerStudentAccount = (params: {
    displayName: string;
    email: string;
    facultyShort: string;
    facultyFull: string;
  }): string => {
    const cleanName = params.displayName.trim() || 'Pelajar UMS';
    const cleanEmail =
      params.email.trim().toLowerCase() ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.ums.edu.my`;
    const facShort = params.facultyShort.trim() || 'FKI';
    const facFull =
      params.facultyFull.trim() ||
      'Fakulti Komputeran dan Informatik (FKI), UMS';

    const existing = state.profiles.find(
      (p) =>
        (p.email && p.email.toLowerCase() === cleanEmail) ||
        p.display_name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        currentUserId: existing.id,
        profiles: prev.profiles.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                display_name: cleanName,
                email: cleanEmail,
                faculty_short: facShort,
                faculty: facFull,
                updated_at: now,
              }
            : p
        ),
      }));
      notifyToast(
        `Selamat Kembali, ${cleanName}!`,
        `${facShort} · ${cleanEmail}`,
        'success'
      );
      return existing.id;
    }

    const newId = `usr-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const matricPrefix =
      facShort === 'FKI'
        ? 'BI2411'
        : facShort === 'FKJ'
          ? 'BK2411'
          : facShort === 'FPEP'
            ? 'BE2411'
            : 'BA2411';
    const matricNo = `${matricPrefix}${Math.floor(1000 + Math.random() * 8999)}`;

    const newProfile: Profile = {
      id: newId,
      display_name: cleanName,
      matric_no: matricNo,
      faculty: facFull,
      faculty_short: facShort,
      programme:
        facShort === 'FKI'
          ? 'Software Engineering'
          : facShort === 'FKJ'
            ? 'Civil & Smart Engineering'
            : facShort === 'FPEP'
              ? 'Business & Digital Economy'
              : `Program Sarjana Muda (${facShort})`,
      year_of_study: 2,
      location: 'Kota Kinabalu, Sabah',
      availability_status: 'Available',
      role_mode: 'STUDENT',
      bio: `Pelajar ${facFull} yang aktif mencari rakan sepasukan dan aktiviti inovasi kampus UMS.`,
      avatar_url: null,
      avatar_variant: 0,
      weekly_hours: 10,
      preferred_project_types: ['Innovation', 'Competition'],
      active_filter_tags: [],
      email: cleanEmail,
      phone: '+6012-883 4910',
      linkedin: `linkedin.com/in/${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}-ums`,
      discoverable: true,
      consent_at: now,
      created_at: now,
      updated_at: now,
      is_fictional_test_account: true,
    };

    setState((prev) => ({
      ...prev,
      currentUserId: newId,
      profiles: [newProfile, ...prev.profiles],
    }));

    notifyToast(
      `Pendaftaran Berjaya!`,
      `Selamat datang ke ProjectLink UMS, ${cleanName} (${facShort}).`,
      'success'
    );
    return newId;
  };

  const signInWithCredentials = (identifier: string): Profile | null => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;

    const matched = state.profiles.find(
      (p) =>
        (p.email && p.email.toLowerCase() === clean) ||
        p.display_name.toLowerCase() === clean ||
        p.display_name.toLowerCase().includes(clean) ||
        (p.matric_no && p.matric_no.toLowerCase() === clean) ||
        (p.email && p.email.toLowerCase().split('@')[0] === clean)
    );

    if (matched) {
      setState((prev) => ({...prev, currentUserId: matched.id}));
      notifyToast(
        `Log Masuk Berjaya: ${matched.display_name}`,
        `${matched.faculty_short || 'UMS'} · ${matched.email || matched.matric_no || 'UMS'}`,
        'success'
      );
      return matched;
    }

    // If user typed a new email or username not yet in seed profiles, create & sign them in smoothly
    const rawName = clean.includes('@') ? clean.split('@')[0] : clean;
    const formattedName =
      rawName
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || 'Pelajar UMS';
    const emailVal = clean.includes('@')
      ? clean
      : `${rawName.replace(/[^a-z0-9]/g, '')}@student.ums.edu.my`;
    const createdId = registerStudentAccount({
      displayName: formattedName,
      email: emailVal,
      facultyShort: 'FKI',
      facultyFull: 'Fakulti Komputeran dan Informatik (FKI), UMS',
    });
    return state.profiles.find((p) => p.id === createdId) || currentUser;
  };

  // =========================================================
  // BACKEND API AUTHENTICATION ACTIONS (/api/auth)
  // =========================================================
  const syncAuthenticatedProfileIntoStore = (
    profile: Profile,
    token: string,
    _isNewSignup = false
  ) => {
    setAuthSessionToken(token);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('projectlink_auth_token_v1', token);
        window.sessionStorage.setItem(
          'projectlink_auth_session_v1',
          'authenticated'
        );
      } catch {
        // Ignore storage errors
      }
    }

    setState((prev) => {
      const exists = prev.profiles.some((p) => p.id === profile.id);
      const nextProfiles = exists
        ? prev.profiles.map((p) =>
            p.id === profile.id ? {...p, ...profile} : p
          )
        : [profile, ...prev.profiles];

      return {
        ...prev,
        currentUserId: profile.id,
        profiles: nextProfiles,
      };
    });
  };

  const loginWithApi = async (
    identifier: string,
    password: string
  ): Promise<{ok: boolean; error?: string; profile?: Profile}> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'signin',
          identifier,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Gagal log masuk. Sila semak e-mel dan kata laluan anda.',
        };
      }

      const profile = data.profile as Profile;
      const token = String(data.token || '');
      syncAuthenticatedProfileIntoStore(profile, token, false);

      notifyToast(
        `Selamat Kembali, ${profile.display_name}!`,
        `${profile.faculty_short || 'UMS'} · ${profile.email || profile.matric_no}`,
        'success'
      );
      return {ok: true, profile};
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi pelayan pengesahan (/api/auth).',
      };
    }
  };

  const registerWithApi = async (params: {
    displayName: string;
    email: string;
    password: string;
    facultyShort: string;
    facultyFull: string;
    matricNo?: string;
    phone?: string;
  }): Promise<{ok: boolean; error?: string; profile?: Profile}> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'signup',
          ...params,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Pendaftaran gagal. Sila semak maklumat yang dimasukkan.',
        };
      }

      const profile = data.profile as Profile;
      const token = String(data.token || '');
      syncAuthenticatedProfileIntoStore(profile, token, true);

      notifyToast(
        'Akaun Berjaya Didaftarkan!',
        `Selamat datang ke ProjectLink UMS, ${profile.display_name} (${profile.faculty_short}).`,
        'success'
      );
      return {ok: true, profile};
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi pelayan pendaftaran (/api/auth).',
      };
    }
  };

  const initiateSignUpWithApi = async (params: {
    displayName: string;
    email: string;
    password: string;
    facultyShort: string;
    facultyFull: string;
    matricNo?: string;
    phone?: string;
  }): Promise<{
    ok: boolean;
    error?: string;
    email?: string;
    verificationCode?: string;
    message?: string;
  }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'initiate_signup',
          ...params,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Pendaftaran tidak dapat diteruskan. Sila semak maklumat anda.',
        };
      }
      notifyToast(
        'Kod Pengesahan E-mel Dihantar',
        `Sila masukkan kod 6-digit yang dihantar ke ${data.email}.`,
        'default'
      );
      return {
        ok: true,
        email: String(data.email || params.email),
        verificationCode: String(data.verificationCode || ''),
        message: data.message,
      };
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi pelayan pengesahan (/api/auth).',
      };
    }
  };

  const verifySignUpCodeWithApi = async (
    email: string,
    code: string
  ): Promise<{ok: boolean; error?: string; profile?: Profile}> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'verify_signup_code',
          email,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Kod pengesahan tidak sah. Sila cuba lagi.',
        };
      }

      const profile = data.profile as Profile;
      const token = String(data.token || '');
      syncAuthenticatedProfileIntoStore(profile, token, true);

      notifyToast(
        'E-mel Disahkan & Akaun Aktif!',
        `Selamat datang ke ProjectLink UMS, ${profile.display_name} (${profile.faculty_short}).`,
        'success'
      );
      return {ok: true, profile};
    } catch {
      return {
        ok: false,
        error: 'Gagal mengesahkan kod bersama pelayan (/api/auth).',
      };
    }
  };

  const resendVerificationCodeWithApi = async (
    email: string
  ): Promise<{
    ok: boolean;
    error?: string;
    verificationCode?: string;
    message?: string;
  }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'resend_verification_code',
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'Gagal menghantar semula kod pengesahan.',
        };
      }
      notifyToast(
        'Kod Baharu Dihantar',
        `Kod pengesahan 6-digit baharu telah dijana untuk ${email}.`,
        'success'
      );
      return {
        ok: true,
        verificationCode: String(data.verificationCode || ''),
        message: data.message,
      };
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi pelayan (/api/auth).',
      };
    }
  };

  const initiatePasswordResetWithApi = async (
    identifier: string
  ): Promise<{
    ok: boolean;
    error?: string;
    email?: string;
    resetCode?: string;
    message?: string;
  }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'initiate_password_reset',
          identifier,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Gagal menjana kod OTP untuk tetapan semula kata laluan.',
        };
      }
      notifyToast(
        'Kod OTP Reset Kata Laluan Dijana',
        data.message || `Kod 6-digit telah dihantar ke ${data.email}.`,
        'default'
      );
      return {
        ok: true,
        email: String(data.email || identifier),
        resetCode: String(data.resetCode || ''),
        message: data.message,
      };
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi pelayan (/api/auth).',
      };
    }
  };

  const resetPasswordWithApi = async (
    email: string,
    newPassword: string,
    code: string
  ): Promise<{ok: boolean; error?: string; message?: string}> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'reset_password',
          email,
          newPassword,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'Gagal menetapkan semula kata laluan.',
        };
      }
      notifyToast('Kata Laluan Dikemas Kini', data.message, 'success');
      return {ok: true, message: data.message};
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi pelayan (/api/auth).',
      };
    }
  };

  const logoutWithApi = async (): Promise<void> => {
    const token = authSessionToken;
    setAuthSessionToken(null);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('projectlink_auth_token_v1');
        window.sessionStorage.removeItem('projectlink_auth_session_v1');
      } catch {
        // Ignore storage errors
      }
    }
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'logout',
          token,
        }),
      });
    } catch {
      // Non-blocking logout
    }
  };

  const resetDemoDatabase = () => {
    const fresh = getInitialState();
    setState(fresh);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    notifyToast(
      'Pangkalan Data Dipulihkan',
      'Semua jadual hubungan UMS telah ditetapkan semula kepada asal.',
      'default'
    );
  };

  const refreshProjectsFeed = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DatabaseState>;
        if (parsed && Array.isArray(parsed.projects)) {
          setState((prev) => {
            const existingIds = new Set(prev.projects.map((p) => p.id));
            const incomingNew = parsed.projects!.filter(
              (p) => !existingIds.has(p.id)
            );
            const mergedProjects = [...incomingNew, ...prev.projects];
            return {
              ...prev,
              projects: mergedProjects,
            };
          });
        }
      }
    } catch {
      // Ignore storage parse errors
    }
    notifyToast(
      'Senarai Aktiviti Dikemaskini',
      'Siaran projek & aktiviti kampus UMS terkini telah disegerakkan.',
      'success'
    );
  };

  // RPC 1: save_my_profile
  const saveMyProfile = (payload: SaveMyProfilePayload) => {
    const uid = state.currentUserId;
    const name = payload.p_display_name.trim() || 'Fahrin';
    const fac =
      payload.p_faculty.trim() ||
      'Fakulti Komputeran dan Informatik (FKI), UMS';

    const now = new Date().toISOString();
    setState((prev) => {
      const existing = prev.profiles.find((p) => p.id === uid);
      const updatedProfile: Profile = {
        ...existing,
        id: uid,
        display_name: name,
        matric_no: payload.p_matric_no || existing?.matric_no || 'A2412345',
        faculty: fac,
        faculty_short:
          payload.p_faculty_short || existing?.faculty_short || 'FKI',
        programme: payload.p_programme?.trim() || existing?.programme || null,
        year_of_study: payload.p_year_of_study,
        location: payload.p_location || existing?.location || 'Kota Kinabalu',
        availability_status:
          payload.p_availability_status ||
          existing?.availability_status ||
          'Available',
        bio: payload.p_bio?.trim() ?? existing?.bio ?? null,
        avatar_url: existing?.avatar_url || null,
        weekly_hours: payload.p_weekly_hours,
        preferred_project_types: payload.p_preferred_project_types,
        email: payload.p_email || existing?.email,
        phone: payload.p_phone || existing?.phone,
        linkedin: payload.p_linkedin || existing?.linkedin,
        discoverable: payload.p_discoverable,
        consent_at: payload.p_discoverable
          ? existing?.consent_at || now
          : null,
        created_at: existing?.created_at || now,
        updated_at: now,
        is_admin: existing?.is_admin,
        is_fictional_test_account: true,
      };

      const nextProfiles = existing
        ? prev.profiles.map((p) => (p.id === uid ? updatedProfile : p))
        : [...prev.profiles, updatedProfile];

      const nextSkills: StudentSkill[] = [
        ...prev.studentSkills.filter((s) => s.student_id !== uid),
        ...payload.p_skills.map((item) => ({
          student_id: uid,
          skill_id: item.skill_id,
          proficiency: item.proficiency,
        })),
      ];

      const uniqueInterests = Array.from(new Set(payload.p_interests));
      const nextInterests: StudentInterest[] = [
        ...prev.studentInterests.filter((i) => i.student_id !== uid),
        ...uniqueInterests.map((interest_id) => ({
          student_id: uid,
          interest_id,
        })),
      ];

      const nextSlots: AvailabilitySlot[] = [
        ...prev.availabilitySlots.filter((sl) => sl.student_id !== uid),
        ...payload.p_slots.map((sl, idx) => ({
          id: `av-${uid}-${idx}-${Date.now()}`,
          student_id: uid,
          weekday: sl.weekday,
          start_time: sl.start_time,
          end_time: sl.end_time,
        })),
      ];

      return {
        ...prev,
        profiles: nextProfiles,
        studentSkills: nextSkills,
        studentInterests: nextInterests,
        availabilitySlots: nextSlots,
      };
    });

    notifyToast(
      'Profil Disimpan (save_my_profile)',
      'Jadual profiles, student_skills & student_interests dikemas kini.',
      'success'
    );
  };

  // Quick Profile Metadata Update (Edit Profile / Edit About Me / Availability / Role Mode)
  const updateProfileMetadata = (fields: Partial<Profile>) => {
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === uid ? {...p, ...fields, updated_at: now} : p
      ),
    }));
    notifyToast('Profil Dikemas Kini', undefined, 'success');
  };

  // Toggle Home Filter Tag in currentUser.active_filter_tags
  const toggleFilterTag = (tag: string) => {
    const uid = state.currentUserId;
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== uid) return p;
        const currentTags = p.active_filter_tags || [];
        const exists = currentTags.includes(tag);
        const nextTags = exists
          ? currentTags.filter((t) => t !== tag)
          : [...currentTags, tag];
        return {
          ...p,
          active_filter_tags: nextTags,
          updated_at: new Date().toISOString(),
        };
      }),
    }));
  };

  const randomizeFilterTags = () => {
    const uid = state.currentUserId;
    const pool = OFFICIAL_FILTER_TAGS.map((t) => t.id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const finalTags = shuffled.slice(0, 3);
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === uid
          ? {
              ...p,
              active_filter_tags: finalTags,
              updated_at: new Date().toISOString(),
            }
          : p
      ),
    }));
  };

  // Add Student Skill strictly from predetermined official INITIAL_SKILLS catalog
  const addStudentSkillByName = (
    skillNameOrId: string,
    proficiency: Proficiency = 'intermediate'
  ) => {
    const clean = skillNameOrId.trim();
    if (!clean) return;
    const uid = state.currentUserId;

    const matchedSkill = INITIAL_SKILLS.find(
      (s) =>
        s.id.toLowerCase() === clean.toLowerCase() ||
        s.name.toLowerCase() === clean.toLowerCase()
    );
    if (!matchedSkill) {
      notifyToast(
        'Pilih Kemahiran Rasmi',
        'Sila pilih kemahiran daripada senarai rasmi UMS yang disediakan.',
        'error'
      );
      return;
    }

    setState((prev) => {
      const alreadyHas = prev.studentSkills.some(
        (ss) => ss.student_id === uid && ss.skill_id === matchedSkill.id
      );
      if (alreadyHas) {
        return {
          ...prev,
          studentSkills: prev.studentSkills.map((ss) =>
            ss.student_id === uid && ss.skill_id === matchedSkill.id
              ? {...ss, proficiency}
              : ss
          ),
        };
      }

      return {
        ...prev,
        studentSkills: [
          ...prev.studentSkills,
          {
            student_id: uid,
            skill_id: matchedSkill.id,
            proficiency,
          },
        ],
      };
    });

    notifyToast(
      'Kemahiran Dikemas Kini',
      `${matchedSkill.name} (${proficiency})`,
      'success'
    );
  };

  const removeStudentSkillById = (skillId: string) => {
    const uid = state.currentUserId;
    setState((prev) => ({
      ...prev,
      studentSkills: prev.studentSkills.filter(
        (s) => !(s.student_id === uid && s.skill_id === skillId)
      ),
    }));
  };

  // Add Student Interest strictly from predetermined official INITIAL_INTERESTS catalog
  const addStudentInterestByName = (interestNameOrId: string) => {
    const clean = interestNameOrId.trim();
    if (!clean) return;
    const uid = state.currentUserId;

    const matchedInterest = INITIAL_INTERESTS.find(
      (i) =>
        i.id.toLowerCase() === clean.toLowerCase() ||
        i.name.toLowerCase() === clean.toLowerCase()
    );
    if (!matchedInterest) {
      notifyToast(
        'Pilih Minat Rasmi',
        'Sila pilih bidang minat daripada senarai rasmi UMS yang disediakan.',
        'error'
      );
      return;
    }

    setState((prev) => {
      const alreadyHas = prev.studentInterests.some(
        (si) => si.student_id === uid && si.interest_id === matchedInterest.id
      );
      if (alreadyHas) return prev;

      return {
        ...prev,
        studentInterests: [
          ...prev.studentInterests,
          {
            student_id: uid,
            interest_id: matchedInterest.id,
          },
        ],
      };
    });

    notifyToast('Minat Ditambah', matchedInterest.name, 'success');
  };

  const removeStudentInterestById = (interestId: string) => {
    const uid = state.currentUserId;
    setState((prev) => ({
      ...prev,
      studentInterests: prev.studentInterests.filter(
        (i) => !(i.student_id === uid && i.interest_id === interestId)
      ),
    }));
  };

  const addAvailabilitySlot = (slot: {
    weekday: number;
    start_time: string;
    end_time: string;
  }) => {
    if (slot.start_time >= slot.end_time) {
      notifyToast(
        'Masa Tidak Sah',
        'Masa mula mestilah lebih awal daripada masa tamat.',
        'error'
      );
      return;
    }
    const uid = state.currentUserId;
    setState((prev) => ({
      ...prev,
      availabilitySlots: [
        ...prev.availabilitySlots,
        {
          id: `av-${Date.now().toString(36)}`,
          student_id: uid,
          weekday: slot.weekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
        },
      ],
    }));
    notifyToast('Slot Masa Ditambah', undefined, 'success');
  };

  const removeAvailabilitySlot = (slotId: string) => {
    setState((prev) => ({
      ...prev,
      availabilitySlots: prev.availabilitySlots.filter((s) => s.id !== slotId),
    }));
  };

  const addActivityHistory = (entry: {
    title: string;
    date_display: string;
    role: string;
    sdp_earned: number;
    summary: string;
    project_id?: string | null;
  }) => {
    const uid = state.currentUserId;
    const newRecord: StudentActivityHistory = {
      id: `hist-${Date.now().toString(36)}`,
      student_id: uid,
      project_id: entry.project_id || null,
      title: entry.title.trim(),
      date_display: entry.date_display.trim(),
      role: entry.role.trim(),
      sdp_earned: entry.sdp_earned,
      summary: entry.summary.trim(),
      completed_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      activityHistory: [newRecord, ...prev.activityHistory],
    }));
    notifyToast(
      `+${entry.sdp_earned} SDP Direkodkan`,
      `${entry.title} ditambah ke History.`,
      'success'
    );
  };

  // RPC 2: create_project
  const createProject = (payload: CreateProjectPayload): string => {
    const uid = state.currentUserId;
    const title = payload.p_title.trim();
    const desc =
      payload.p_description.trim() ||
      'Aktiviti dan kolaborasi projek pelajar Universiti Malaysia Sabah (UMS).';
    if (!title) {
      notifyToast(
        'Ralat Pengesahan',
        'Sila masukkan nama aktiviti atau projek.',
        'error'
      );
      return '';
    }

    const projectId = `prj-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    setState((prev) => {
      const newProject: Project = {
        id: projectId,
        owner_id: uid,
        title,
        description: desc,
        project_type: payload.p_project_type,
        slots_needed: payload.p_slots_needed,
        min_weekly_hours: payload.p_min_weekly_hours,
        status: 'open',
        deadline: payload.p_deadline || null,
        date_display:
          payload.p_date_display || payload.p_deadline || '22 – 24 Nov 2026',
        location: payload.p_location || 'Dewan Canselor, UMS',
        audience: payload.p_audience || 'Terbuka kepada semua pelajar UMS',
        badge_line_1: payload.p_badge_line_1 || 'Program',
        badge_line_2: payload.p_badge_line_2 || payload.p_project_type,
        tags: payload.p_tags || ['Tech', 'Networking', payload.p_project_type],
        attribute_tags: payload.p_attribute_tags || [
          'Programming',
          'Planning',
          'Database',
        ],
        trending: true,
        organizer_phone:
          payload.p_organizer_phone?.trim() ||
          currentUser?.phone ||
          '+6012-883 4910',
        organizer_name:
          payload.p_organizer_name?.trim() ||
          `${currentUser?.display_name || 'Fahrin'} (${
            currentUser?.faculty_short || 'UMS'
          })`,
        banner_url: payload.p_banner_url ?? null,
        banner_preset: payload.p_banner_preset || 'prj-techfest',
        banner_position_y: payload.p_banner_position_y ?? 50,
        gallery_images:
          payload.p_gallery_images && payload.p_gallery_images.length > 0
            ? payload.p_gallery_images
            : getDefaultGalleryForProject(
                projectId,
                title,
                payload.p_location || 'Dewan Canselor, UMS',
                payload.p_date_display ||
                  payload.p_deadline ||
                  '22 – 24 Nov 2026'
              ),
        created_at: now,
        updated_at: now,
      };

      const newReqSkills: ProjectRequiredSkill[] =
        payload.p_required_skills.map((r) => ({
          project_id: projectId,
          skill_id: r.skill_id,
          mandatory: r.mandatory,
          importance: r.importance,
        }));

      const newProjInterests: ProjectInterest[] = Array.from(
        new Set(payload.p_interests)
      ).map((interest_id) => ({
        project_id: projectId,
        interest_id,
      }));

      const newMeetingSlots: ProjectMeetingSlot[] = payload.p_meeting_slots.map(
        (m, idx) => ({
          id: `ms-${projectId}-${idx}`,
          project_id: projectId,
          weekday: m.weekday,
          start_time: m.start_time,
          end_time: m.end_time,
        })
      );

      const ownerMembership: ProjectMember = {
        project_id: projectId,
        student_id: uid,
        member_role: 'owner',
        membership_status: 'active',
        joined_at: now,
      };

      return {
        ...prev,
        projects: [newProject, ...prev.projects],
        projectRequiredSkills: [...prev.projectRequiredSkills, ...newReqSkills],
        projectInterests: [...prev.projectInterests, ...newProjInterests],
        projectMeetingSlots: [...prev.projectMeetingSlots, ...newMeetingSlots],
        projectMembers: [...prev.projectMembers, ownerMembership],
      };
    });

    notifyToast(
      'Aktiviti Diterbitkan (create_project)',
      `"${title}" kini aktif di halaman Home.`,
      'success'
    );
    return projectId;
  };

  // Author-Only (or Admin) Update Project Info & Details
  const updateProjectDetails = (
    projectId: string,
    updates: {
      title?: string;
      description?: string;
      project_type?: ProjectType;
      date_display?: string;
      deadline?: string | null;
      location?: string;
      audience?: string;
      slots_needed?: number;
      min_weekly_hours?: number;
      organizer_name?: string;
      organizer_phone?: string;
      badge_line_1?: string;
      badge_line_2?: string;
      tags?: string[];
      status?: ProjectStatus;
    }
  ): boolean => {
    const uid = state.currentUserId;
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return false;
    if (target.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) yang memuat naik aktiviti ini dibenarkan menyunting maklumat.',
        'error'
      );
      return false;
    }
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              title: updates.title?.trim() || p.title,
              description: updates.description?.trim() || p.description,
              project_type: updates.project_type || p.project_type,
              date_display:
                updates.date_display !== undefined
                  ? updates.date_display.trim()
                  : p.date_display,
              deadline:
                updates.deadline !== undefined ? updates.deadline : p.deadline,
              location:
                updates.location !== undefined
                  ? updates.location.trim()
                  : p.location,
              audience:
                updates.audience !== undefined
                  ? updates.audience.trim()
                  : p.audience,
              slots_needed:
                updates.slots_needed !== undefined
                  ? Math.max(1, Number(updates.slots_needed) || 1)
                  : p.slots_needed,
              min_weekly_hours:
                updates.min_weekly_hours !== undefined
                  ? Math.max(1, Number(updates.min_weekly_hours) || 1)
                  : p.min_weekly_hours,
              organizer_name:
                updates.organizer_name !== undefined
                  ? updates.organizer_name.trim()
                  : p.organizer_name,
              organizer_phone:
                updates.organizer_phone !== undefined
                  ? updates.organizer_phone.trim()
                  : p.organizer_phone,
              badge_line_1:
                updates.badge_line_1 !== undefined
                  ? updates.badge_line_1.trim()
                  : p.badge_line_1,
              badge_line_2:
                updates.badge_line_2 !== undefined
                  ? updates.badge_line_2.trim()
                  : p.badge_line_2,
              tags: updates.tags !== undefined ? updates.tags : p.tags,
              status: updates.status || p.status,
              updated_at: now,
            }
          : p
      ),
    }));
    notifyToast(
      'Maklumat Aktiviti Dikemas Kini',
      `Perubahan pada "${updates.title?.trim() || target.title}" telah disimpan.`,
      'success'
    );
    return true;
  };

  // Author-Only (or Admin) Delete Own Project
  const deleteOwnProject = (projectId: string): boolean => {
    const uid = state.currentUserId;
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return false;
    if (target.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) aktiviti ini dibenarkan memadamkannya.',
        'error'
      );
      return false;
    }
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
      projectRequiredSkills: prev.projectRequiredSkills.filter(
        (r) => r.project_id !== projectId
      ),
      projectInterests: prev.projectInterests.filter(
        (i) => i.project_id !== projectId
      ),
      projectMeetingSlots: prev.projectMeetingSlots.filter(
        (m) => m.project_id !== projectId
      ),
      projectMembers: prev.projectMembers.filter(
        (m) => m.project_id !== projectId
      ),
      savedProjects: prev.savedProjects.filter(
        (s) => s.project_id !== projectId
      ),
      applications: prev.applications.filter((a) => a.project_id !== projectId),
      reports: prev.reports.filter(
        (r) => !(r.target_type === 'project' && r.target_id === projectId)
      ),
    }));
    notifyToast(
      'Aktiviti Dipadamkan',
      `"${target.title}" telah dipadamkan oleh pencipta.`,
      'default'
    );
    return true;
  };

  // Owner-Only Update Project Banner / Poster Image
  const updateProjectBanner = (
    projectId: string,
    banner: {
      banner_url?: string | null;
      banner_preset?: string;
      banner_position_y?: number;
    }
  ) => {
    const uid = state.currentUserId;
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return;
    if (target.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) aktiviti ini dibenarkan menukar gambar poster.',
        'error'
      );
      return;
    }
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              banner_url:
                banner.banner_url !== undefined
                  ? banner.banner_url
                  : p.banner_url,
              banner_preset: banner.banner_preset || p.banner_preset || p.id,
              banner_position_y:
                banner.banner_position_y !== undefined
                  ? banner.banner_position_y
                  : p.banner_position_y ?? 50,
              updated_at: now,
            }
          : p
      ),
    }));
    notifyToast(
      'Gambar Poster Dikemas Kini',
      `Poster bagi "${target.title}" telah disimpan.`,
      'success'
    );
  };

  // Author-Only (or Admin) Add Poster / Catalog Image to Activity Gallery
  const addProjectGalleryImage = (
    projectId: string,
    item: {url: string; caption: string; badge?: string}
  ) => {
    const uid = state.currentUserId;
    const cleanUrl = item.url.trim();
    if (!cleanUrl) return;
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return;
    if (target.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) aktiviti ini dibenarkan menambah gambar katalog.',
        'error'
      );
      return;
    }
    const newItem: ProjectGalleryItem = {
      id: `gal-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      url: cleanUrl,
      caption: item.caption.trim() || `Poster Katalog ${target.title}`,
      badge: item.badge?.trim() || 'Poster Katalog',
    };
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const currentGallery =
          Array.isArray(p.gallery_images) && p.gallery_images.length > 0
            ? p.gallery_images
            : getDefaultGalleryForProject(
                p.id,
                p.title,
                p.location || 'Dewan Canselor, UMS',
                p.date_display || '12 – 14 Nov 2026'
              );
        return {
          ...p,
          gallery_images: [newItem, ...currentGallery],
          updated_at: now,
        };
      }),
    }));
    notifyToast(
      'Gambar Katalog Ditambah',
      `Gambar baharu telah dimasukkan ke dalam katalog "${target.title}".`,
      'success'
    );
  };

  // Author-Only (or Admin) Remove Poster / Catalog Image from Activity Gallery
  const removeProjectGalleryImage = (projectId: string, imageId: string) => {
    const uid = state.currentUserId;
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return;
    if (target.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) aktiviti ini dibenarkan memadam gambar katalog.',
        'error'
      );
      return;
    }
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const currentGallery =
          Array.isArray(p.gallery_images) && p.gallery_images.length > 0
            ? p.gallery_images
            : getDefaultGalleryForProject(
                p.id,
                p.title,
                p.location || 'Dewan Canselor, UMS',
                p.date_display || '12 – 14 Nov 2026'
              );
        return {
          ...p,
          gallery_images: currentGallery.filter((img) => img.id !== imageId),
          updated_at: now,
        };
      }),
    }));
    notifyToast(
      'Gambar Katalog Dipadamkan',
      'Gambar telah dikeluarkan daripada katalog aktiviti.',
      'default'
    );
  };

  // RPC 3: apply_to_project
  const applyToProject = (p_project_id: string, p_note: string): string => {
    const uid = state.currentUserId;
    const proj = state.projects.find((p) => p.id === p_project_id);
    if (!proj) {
      notifyToast('Aktiviti Tidak Dijumpai', undefined, 'error');
      return '';
    }
    if (proj.status !== 'open') {
      notifyToast('Ditutup', 'Aktiviti ini tidak lagi dibuka.', 'error');
      return '';
    }

    const existingApp = state.applications.find(
      (a) => a.project_id === p_project_id && a.applicant_id === uid
    );
    if (existingApp) {
      notifyToast(
        'Permohonan Telah Dihantar',
        `Status permohonan anda: ${existingApp.status.toUpperCase()}.`,
        'default'
      );
      return existingApp.id;
    }

    const appId = `app-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      applications: [
        {
          id: appId,
          project_id: p_project_id,
          applicant_id: uid,
          note: p_note.trim() || null,
          status: 'pending',
          created_at: now,
          responded_at: null,
        },
        ...prev.applications,
      ],
      notifications: [
        {
          id: `notif-${Date.now().toString(36)}`,
          recipient_id: proj.owner_id,
          event_type: 'application_received',
          target_type: 'application',
          target_id: appId,
          title: `Permohonan Baharu: ${proj.title}`,
          body: `${currentUser?.display_name || 'Pelajar'} memohon menyertai aktiviti ini.`,
          read_at: null,
          created_at: now,
        },
        ...prev.notifications,
      ],
    }));

    notifyToast(
      'Permohonan Dihantar (apply_to_project)',
      `Permohonan menyertai "${proj.title}" telah direkodkan.`,
      'success'
    );
    return appId;
  };

  // RPC 4: decide_application (Author or Admin only)
  const decideApplication = (
    p_application_id: string,
    p_decision: 'accepted' | 'declined'
  ) => {
    const uid = state.currentUserId;
    const app = state.applications.find((a) => a.id === p_application_id);
    if (!app) return;
    const proj = state.projects.find((p) => p.id === app.project_id);
    if (!proj) return;
    if (proj.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta aktiviti boleh menerima atau menolak permohonan.',
        'error'
      );
      return;
    }

    const now = new Date().toISOString();
    setState((prev) => {
      const nextApps = prev.applications.map((a) =>
        a.id === p_application_id
          ? {...a, status: p_decision, responded_at: now}
          : a
      );

      let nextMembers = prev.projectMembers;
      if (p_decision === 'accepted') {
        const filtered = prev.projectMembers.filter(
          (m) =>
            !(m.project_id === proj.id && m.student_id === app.applicant_id)
        );
        nextMembers = [
          ...filtered,
          {
            project_id: proj.id,
            student_id: app.applicant_id,
            member_role: 'member',
            membership_status: 'active',
            joined_at: now,
          },
        ];
      }

      return {
        ...prev,
        applications: nextApps,
        projectMembers: nextMembers,
        notifications: [
          {
            id: `notif-${Date.now().toString(36)}`,
            recipient_id: app.applicant_id,
            event_type: `application_${p_decision}`,
            target_type: 'application',
            target_id: app.id,
            title: `Permohonan ${p_decision === 'accepted' ? 'Diterima' : 'Ditolak'}`,
            body: `Status permohonan anda untuk "${proj.title}" telah dikemas kini.`,
            read_at: null,
            created_at: now,
          },
          ...prev.notifications,
        ],
      };
    });

    notifyToast(
      p_decision === 'accepted'
        ? 'Permohonan Diterima'
        : 'Permohonan Ditolak',
      proj.title,
      p_decision === 'accepted' ? 'success' : 'default'
    );
  };

  // RPC 5: withdraw_application
  const withdrawApplication = (p_application_id: string) => {
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === p_application_id &&
        a.applicant_id === uid &&
        a.status === 'pending'
          ? {...a, status: 'withdrawn', responded_at: now}
          : a
      ),
    }));
    notifyToast('Permohonan Ditarik Balik');
  };

  // RPC 6: invite_candidate (Author or Admin only)
  const inviteCandidate = (
    p_project_id: string,
    p_invitee_id: string,
    p_note: string
  ): string => {
    const uid = state.currentUserId;
    const proj = state.projects.find((p) => p.id === p_project_id);
    if (!proj) return '';
    if (proj.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta aktiviti boleh menjemput ahli pasukan.',
        'error'
      );
      return '';
    }
    const candidate = state.profiles.find((p) => p.id === p_invitee_id);
    if (!candidate) return '';

    const invId = `inv-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      projectInvitations: [
        {
          id: invId,
          project_id: p_project_id,
          inviter_id: uid,
          invitee_id: p_invitee_id,
          note: p_note.trim() || null,
          status: 'pending',
          created_at: now,
          responded_at: null,
        },
        ...prev.projectInvitations,
      ],
      notifications: [
        {
          id: `notif-${Date.now().toString(36)}`,
          recipient_id: p_invitee_id,
          event_type: 'project_invitation',
          target_type: 'invitation',
          target_id: invId,
          title: `Jemputan Pasukan: ${proj.title}`,
          body: p_note.trim() || 'Anda dijemput menyertai pasukan projek ini.',
          read_at: null,
          created_at: now,
        },
        ...prev.notifications,
      ],
    }));

    notifyToast(
      'Jemputan Dihantar',
      `${candidate.display_name} dijemput ke "${proj.title}".`,
      'success'
    );
    return invId;
  };

  // RPC 7: respond_invitation
  const respondInvitation = (
    p_invitation_id: string,
    p_decision: 'accepted' | 'declined'
  ) => {
    const uid = state.currentUserId;
    const inv = state.projectInvitations.find((i) => i.id === p_invitation_id);
    if (!inv || inv.status !== 'pending') return;
    const proj = state.projects.find((p) => p.id === inv.project_id);
    if (!proj) return;

    const now = new Date().toISOString();
    setState((prev) => {
      const nextInvites = prev.projectInvitations.map((i) =>
        i.id === p_invitation_id
          ? {...i, status: p_decision, responded_at: now}
          : i
      );

      let nextMembers = prev.projectMembers;
      if (p_decision === 'accepted') {
        const filtered = prev.projectMembers.filter(
          (m) => !(m.project_id === proj.id && m.student_id === uid)
        );
        nextMembers = [
          ...filtered,
          {
            project_id: proj.id,
            student_id: uid,
            member_role: 'member',
            membership_status: 'active',
            joined_at: now,
          },
        ];
      }

      return {
        ...prev,
        projectInvitations: nextInvites,
        projectMembers: nextMembers,
      };
    });

    notifyToast(
      p_decision === 'accepted'
        ? `Menyertai "${proj.title}"!`
        : 'Jemputan Ditolak',
      p_decision === 'accepted'
        ? 'Anda kini ahli aktif dalam pasukan ini.'
        : undefined,
      p_decision === 'accepted' ? 'success' : 'default'
    );
  };

  // RPC 8: set_project_status (Author or Admin only)
  const setProjectStatus = (p_project_id: string, p_status: ProjectStatus) => {
    const uid = state.currentUserId;
    const target = state.projects.find((p) => p.id === p_project_id);
    if (!target) return;
    if (target.owner_id !== uid && !isAdmin) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta aktiviti boleh menukar status siaran.',
        'error'
      );
      return;
    }
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === p_project_id ? {...p, status: p_status, updated_at: now} : p
      ),
    }));
    notifyToast('Status Aktiviti Dikemas Kini', p_status.toUpperCase(), 'success');
  };

  // RPC 9: cancel_invitation
  const cancelInvitation = (p_invitation_id: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projectInvitations: prev.projectInvitations.map((i) =>
        i.id === p_invitation_id
          ? {...i, status: 'cancelled', responded_at: now}
          : i
      ),
    }));
    notifyToast('Jemputan Dibatalkan');
  };

  // RPC 10: leave_project
  const leaveProject = (p_project_id: string) => {
    const uid = state.currentUserId;
    setState((prev) => ({
      ...prev,
      projectMembers: prev.projectMembers.map((m) =>
        m.project_id === p_project_id &&
        m.student_id === uid &&
        m.member_role === 'member'
          ? {...m, membership_status: 'left'}
          : m
      ),
    }));
    notifyToast('Keluar daripada Pasukan');
  };

  // RPC 11: mark_notification_read
  const markNotificationRead = (p_notification_id: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === p_notification_id ? {...n, read_at: now} : n
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.recipient_id === uid && !n.read_at ? {...n, read_at: now} : n
      ),
    }));
    notifyToast('Semua Notifikasi Ditanda Dibaca');
  };

  const toggleSaveProject = (projectId: string) => {
    const uid = state.currentUserId;
    const exists = state.savedProjects.some(
      (s) => s.student_id === uid && s.project_id === projectId
    );
    setState((prev) => ({
      ...prev,
      savedProjects: exists
        ? prev.savedProjects.filter(
            (s) => !(s.student_id === uid && s.project_id === projectId)
          )
        : [
            ...prev.savedProjects,
            {
              student_id: uid,
              project_id: projectId,
              saved_at: new Date().toISOString(),
            },
          ],
    }));
    notifyToast(
      exists ? 'Dibuang daripada Saved Activities' : 'Disimpan ke Saved Activities'
    );
  };

  const saveProjectOnly = (projectId: string) => {
    const uid = state.currentUserId;
    const exists = state.savedProjects.some(
      (s) => s.student_id === uid && s.project_id === projectId
    );
    if (!exists) {
      setState((prev) => ({
        ...prev,
        savedProjects: [
          ...prev.savedProjects,
          {
            student_id: uid,
            project_id: projectId,
            saved_at: new Date().toISOString(),
          },
        ],
      }));
      notifyToast(
        'Aktiviti Disimpan (Bookmarked)',
        'Membuka maklumat aktiviti & pautan WhatsApp penganjur...',
        'success'
      );
    }
  };

  const createTask = (params: {
    project_id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    assignee_id: string | null;
    due_at: string | null;
  }) => {
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    const newTask: ProjectTask = {
      id: `tsk-${Date.now().toString(36)}`,
      project_id: params.project_id,
      creator_id: uid,
      assignee_id: params.assignee_id,
      title: params.title.trim(),
      description: params.description.trim(),
      priority: params.priority,
      status: 'todo',
      due_at: params.due_at,
      created_at: now,
      updated_at: now,
    };
    setState((prev) => ({
      ...prev,
      projectTasks: [newTask, ...prev.projectTasks],
    }));
    notifyToast('Tugasan Pasukan Ditambah', params.title, 'success');
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projectTasks: prev.projectTasks.map((t) =>
        t.id === taskId ? {...t, status, updated_at: now} : t
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      projectTasks: prev.projectTasks.filter((t) => t.id !== taskId),
    }));
  };

  const sendMessage = (projectId: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    const newMsg: ProjectMessage = {
      id: `msg-${Date.now().toString(36)}`,
      project_id: projectId,
      sender_id: uid,
      body: text,
      created_at: now,
      edited_at: null,
    };
    setState((prev) => ({
      ...prev,
      projectMessages: [...prev.projectMessages, newMsg],
    }));
  };

  const deleteMessage = (messageId: string) => {
    const uid = state.currentUserId;
    setState((prev) => ({
      ...prev,
      projectMessages: prev.projectMessages.filter(
        (m) => !(m.id === messageId && m.sender_id === uid)
      ),
    }));
  };

  const submitBetaResult = (params: {
    task_code: BetaTaskCode;
    success: boolean;
    duration_seconds: number;
    difficulty_1_to_5: number;
    comment: string;
  }) => {
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    const newEntry: BetaTestResult = {
      id: `bt-${Date.now().toString(36)}`,
      tester_id: uid,
      task_code: params.task_code,
      success: params.success,
      duration_seconds: params.duration_seconds,
      difficulty_1_to_5: params.difficulty_1_to_5,
      comment: params.comment.trim() || null,
      created_at: now,
    };
    setState((prev) => ({
      ...prev,
      betaTestResults: [newEntry, ...prev.betaTestResults],
    }));
  };

  const submitReport = (params: {
    target_type: 'project' | 'profile' | 'message';
    target_id: string;
    reason: string;
  }) => {
    const uid = state.currentUserId;
    const now = new Date().toISOString();
    const rep: ModerationReport = {
      id: `rep-${Date.now().toString(36)}`,
      reporter_id: uid,
      target_type: params.target_type,
      target_id: params.target_id,
      reason: params.reason.trim(),
      status: 'open',
      resolution_note: null,
      created_at: now,
    };
    setState((prev) => ({
      ...prev,
      reports: [rep, ...prev.reports],
    }));
  };

  const resolveReport = (
    reportId: string,
    status: 'resolved' | 'dismissed',
    resolutionNote: string
  ) => {
    if (!isAdmin) {
      notifyToast(
        'Akses Ditolak (Admin Sahaja)',
        'Hanya pentadbir sistem boleh menyelesaikan laporan moderasi.',
        'error'
      );
      return;
    }
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === reportId
          ? {...r, status, resolution_note: resolutionNote.trim() || null}
          : r
      ),
    }));
    notifyToast(
      status === 'resolved' ? 'Laporan Diselesaikan' : 'Laporan Ditolak',
      resolutionNote.trim() || 'Status laporan moderasi telah dikemas kini.',
      'success'
    );
  };

  const adminDeleteProject = (projectId: string) => {
    if (!isAdmin) {
      notifyToast(
        'Akses Ditolak (Admin Sahaja)',
        'Hanya pentadbir sistem boleh memadam aktiviti pengguna lain.',
        'error'
      );
      return;
    }
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
      projectRequiredSkills: prev.projectRequiredSkills.filter(
        (r) => r.project_id !== projectId
      ),
      projectInterests: prev.projectInterests.filter(
        (i) => i.project_id !== projectId
      ),
      projectMeetingSlots: prev.projectMeetingSlots.filter(
        (m) => m.project_id !== projectId
      ),
      projectMembers: prev.projectMembers.filter(
        (m) => m.project_id !== projectId
      ),
      savedProjects: prev.savedProjects.filter(
        (s) => s.project_id !== projectId
      ),
      applications: prev.applications.filter((a) => a.project_id !== projectId),
      reports: prev.reports.filter(
        (r) => !(r.target_type === 'project' && r.target_id === projectId)
      ),
    }));
    notifyToast(
      'Aktiviti Dipadamkan (Admin)',
      `"${target.title}" telah dikeluarkan daripada senarai aktiviti kampus.`,
      'default'
    );
  };

  const adminUpdateProjectStatus = (
    projectId: string,
    status: ProjectStatus
  ) => {
    if (!isAdmin) {
      notifyToast(
        'Akses Ditolak (Admin Sahaja)',
        'Hanya pentadbir sistem boleh menukar status melalui Admin Panel.',
        'error'
      );
      return;
    }
    const target = state.projects.find((p) => p.id === projectId);
    if (!target) return;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? {...p, status, updated_at: now} : p
      ),
    }));
    notifyToast(
      'Status Aktiviti Dikemas Kini',
      `"${target.title}" kini berstatus ${status.toUpperCase()}.`,
      'success'
    );
  };

  const adminDeleteUser = (userId: string) => {
    if (!isAdmin) {
      notifyToast(
        'Akses Ditolak (Admin Sahaja)',
        'Hanya pentadbir sistem boleh mengurus akaun pengguna.',
        'error'
      );
      return;
    }
    const target = state.profiles.find((p) => p.id === userId);
    if (!target) return;
    if (
      target.role === 'admin' ||
      target.email?.toLowerCase() === 'fahrinmuneer3@gmail.com'
    ) {
      notifyToast(
        'Tindakan Tidak Dibenarkan',
        'Akaun Admin utama tidak boleh dipadamkan.',
        'error'
      );
      return;
    }

    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== userId),
      studentSkills: prev.studentSkills.filter((s) => s.student_id !== userId),
      studentInterests: prev.studentInterests.filter(
        (i) => i.student_id !== userId
      ),
      availabilitySlots: prev.availabilitySlots.filter(
        (a) => a.student_id !== userId
      ),
    }));

    fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authSessionToken
          ? {Authorization: `Bearer ${authSessionToken}`}
          : {}),
      },
      body: JSON.stringify({
        action: 'admin_delete_user',
        targetUserId: userId,
        token: authSessionToken,
      }),
    }).catch(() => {
      // Non-blocking backend sync
    });

    notifyToast(
      'Pengguna Dipadamkan (Admin)',
      `Akaun ${target.display_name} (${target.email || target.matric_no}) telah dikeluarkan.`,
      'default'
    );
  };

  const seedStarterActivities = () => {
    const ownerId = currentUser?.id || 'usr-admin';
    const ownerName = currentUser?.display_name
      ? `${currentUser.display_name} (${currentUser.faculty_short || 'FKI'} UMS)`
      : 'Fahrin Muneer (FKI UMS)';
    const ownerPhone = currentUser?.phone || '+60 12-883 4910';
    const now = new Date().toISOString();

    const starterSkills: Skill[] = [
      {id: 'sk-ts', name: 'TypeScript / Next.js', category: 'Technical'},
      {id: 'sk-python', name: 'Python & AI / ML', category: 'Data'},
      {id: 'sk-uiux', name: 'UI/UX & Figma', category: 'Design'},
      {id: 'sk-iot', name: 'IoT & Embedded ESP32', category: 'Engineering'},
      {id: 'sk-pitch', name: 'Project Management & Pitching', category: 'Business'},
    ];

    const starterInterests: Interest[] = [
      {id: 'in-ai', name: 'Artificial Intelligence'},
      {id: 'in-smartcampus', name: 'Smart Campus & IoT'},
      {id: 'in-marine', name: 'Marine & Sustainability'},
    ];

    const starterProjects: Project[] = [
      {
        id: 'prj-techfest',
        owner_id: ownerId,
        title: 'Borneo AI & Smart Campus Hackathon 2026',
        description:
          'Pertandingan inovasi AI & kelestarian kampus peringkat UMS Kota Kinabalu. Membina prototaip aplikasi pintar bersama mentor industri.',
        project_type: 'Competition',
        status: 'open',
        slots_needed: 4,
        min_weekly_hours: 6,
        deadline: '2026-11-24',
        created_at: now,
        updated_at: now,
        date_display: '22 – 24 Nov 2026',
        location: 'Dewan Kuliah Pusat 2 (DKP 2), UMS',
        audience: 'Terbuka kepada semua pelajar FKI, FKJ & UMS',
        badge_line_1: 'Hackathon',
        badge_line_2: 'FKI UMS',
        tags: ['AI & Web', 'Teamwork', 'SDP +20'],
        attribute_tags: ['Programming', 'Design', 'Presentation'],
        organizer_phone: ownerPhone,
        organizer_name: ownerName,
        banner_preset: 'prj-techfest',
        banner_position_y: 50,
      },
      {
        id: 'prj-shuttle',
        owner_id: ownerId,
        title: 'UMS Smart Shuttle Live Tracker (IoT + Mobile)',
        description:
          'Projek inovasi penjejakan bas kampus UMS secara masa nyata menggunakan GPS ESP32 dan paparan peta interaktif untuk pelajar kolej kediaman.',
        project_type: 'Innovation',
        status: 'open',
        slots_needed: 3,
        min_weekly_hours: 5,
        deadline: '2026-12-05',
        created_at: now,
        updated_at: now,
        date_display: '1 – 5 Dis 2026',
        location: 'Makmal IoT FKI & Perhentian Bas Tun Mustapha, UMS',
        audience: 'Pelajar Kejuruteraan (FKJ) & Komputeran (FKI)',
        badge_line_1: 'Inovasi',
        badge_line_2: 'Smart UMS',
        tags: ['IoT GPS', 'Mobile UI', 'Smart Campus'],
        attribute_tags: ['Programming', 'Research', 'Planning'],
        organizer_phone: ownerPhone,
        organizer_name: ownerName,
        banner_preset: 'prj-shuttle',
        banner_position_y: 50,
      },
      {
        id: 'prj-reef',
        owner_id: ownerId,
        title: 'Sepanggar Bay Coral & Marine AI Monitoring',
        description:
          'Kolaborasi lapangan antara FSSA, IPMB dan FKI untuk memantau kesihatan terumbu karang Teluk Sepanggar menggunakan visi komputer dan sensor kualiti air.',
        project_type: 'Community',
        status: 'open',
        slots_needed: 5,
        min_weekly_hours: 4,
        deadline: '2026-12-14',
        created_at: now,
        updated_at: now,
        date_display: '12 – 14 Dis 2026',
        location: 'Jeti IPMB & Akuarium UMS, Kota Kinabalu',
        audience: 'Terbuka kepada semua fakulti UMS',
        badge_line_1: 'Komuniti',
        badge_line_2: 'Marine UMS',
        tags: ['Marine Bio', 'Data Sensor', 'Fieldwork'],
        attribute_tags: ['Research', 'Documentation', 'Marketing'],
        organizer_phone: ownerPhone,
        organizer_name: ownerName,
        banner_preset: 'prj-reef',
        banner_position_y: 50,
      },
    ];

    setState((prev) => {
      const mergedSkills = [...prev.skills];
      for (const sk of starterSkills) {
        if (!mergedSkills.some((existing) => existing.id === sk.id)) {
          mergedSkills.push(sk);
        }
      }

      const mergedInterests = [...prev.interests];
      for (const intr of starterInterests) {
        if (!mergedInterests.some((existing) => existing.id === intr.id)) {
          mergedInterests.push(intr);
        }
      }

      const existingIds = new Set(prev.projects.map((p) => p.id));
      const newProjects = [
        ...starterProjects.filter((p) => !existingIds.has(p.id)),
        ...prev.projects,
      ];

      const newReqSkills = [
        ...prev.projectRequiredSkills.filter(
          (r) => !['prj-techfest', 'prj-shuttle', 'prj-reef'].includes(r.project_id)
        ),
        {project_id: 'prj-techfest', skill_id: 'sk-ts', mandatory: true, importance: 5},
        {project_id: 'prj-techfest', skill_id: 'sk-uiux', mandatory: false, importance: 4},
        {project_id: 'prj-shuttle', skill_id: 'sk-iot', mandatory: true, importance: 5},
        {project_id: 'prj-shuttle', skill_id: 'sk-ts', mandatory: false, importance: 4},
        {project_id: 'prj-reef', skill_id: 'sk-python', mandatory: false, importance: 4},
        {project_id: 'prj-reef', skill_id: 'sk-pitch', mandatory: false, importance: 3},
      ];

      const newProjInterests = [
        ...prev.projectInterests.filter(
          (i) => !['prj-techfest', 'prj-shuttle', 'prj-reef'].includes(i.project_id)
        ),
        {project_id: 'prj-techfest', interest_id: 'in-ai'},
        {project_id: 'prj-shuttle', interest_id: 'in-smartcampus'},
        {project_id: 'prj-reef', interest_id: 'in-marine'},
      ];

      const newMeetingSlots = [
        ...prev.projectMeetingSlots.filter(
          (m) => !['prj-techfest', 'prj-shuttle', 'prj-reef'].includes(m.project_id)
        ),
        {
          id: 'ms-starter-1',
          project_id: 'prj-techfest',
          weekday: 3,
          start_time: '14:00',
          end_time: '16:00',
        },
        {
          id: 'ms-starter-2',
          project_id: 'prj-shuttle',
          weekday: 5,
          start_time: '15:00',
          end_time: '17:00',
        },
        {
          id: 'ms-starter-3',
          project_id: 'prj-reef',
          weekday: 6,
          start_time: '09:00',
          end_time: '12:00',
        },
      ];

      const newMembers = [...prev.projectMembers];
      for (const sp of starterProjects) {
        if (
          !newMembers.some(
            (m) => m.project_id === sp.id && m.student_id === ownerId
          )
        ) {
          newMembers.push({
            project_id: sp.id,
            student_id: ownerId,
            member_role: 'owner',
            membership_status: 'active',
            joined_at: now,
          });
        }
      }

      return {
        ...prev,
        skills: mergedSkills,
        interests: mergedInterests,
        projects: newProjects,
        projectRequiredSkills: newReqSkills,
        projectInterests: newProjInterests,
        projectMeetingSlots: newMeetingSlots,
        projectMembers: newMembers,
      };
    });

    notifyToast(
      '3 Aktiviti Kampus UMS Dimuatkan',
      'Katalog aktiviti, kemahiran, dan jadual perjumpaan sedia untuk diterokai.',
      'success'
    );
  };

  return (
    <ProjectLinkContext.Provider
      value={{
        ...state,
        currentUser,
        isAdmin,
        toasts,
        dismissToast,
        notifyToast,
        switchPersona,
        createCustomTestAccount,
        registerStudentAccount,
        signInWithCredentials,
        authSessionToken,
        loginWithApi,
        registerWithApi,
        initiateSignUpWithApi,
        verifySignUpCodeWithApi,
        resendVerificationCodeWithApi,
        initiatePasswordResetWithApi,
        resetPasswordWithApi,
        logoutWithApi,
        resetDemoDatabase,
        refreshProjectsFeed,
        seedStarterActivities,
        saveMyProfile,
        createProject,
        applyToProject,
        decideApplication,
        withdrawApplication,
        inviteCandidate,
        respondInvitation,
        setProjectStatus,
        cancelInvitation,
        leaveProject,
        markNotificationRead,
        markAllNotificationsRead,
        updateProfileMetadata,
        toggleFilterTag,
        randomizeFilterTags,
        addStudentSkillByName,
        removeStudentSkillById,
        addStudentInterestByName,
        removeStudentInterestById,
        addAvailabilitySlot,
        removeAvailabilitySlot,
        addActivityHistory,
        updateProjectDetails,
        deleteOwnProject,
        updateProjectBanner,
        addProjectGalleryImage,
        removeProjectGalleryImage,
        toggleSaveProject,
        saveProjectOnly,
        createTask,
        updateTaskStatus,
        deleteTask,
        sendMessage,
        deleteMessage,
        submitBetaResult,
        submitReport,
        resolveReport,
        adminDeleteProject,
        adminUpdateProjectStatus,
        adminDeleteUser,
      }}
    >
      {children}
    </ProjectLinkContext.Provider>
  );
}

export function useProjectLink() {
  const ctx = useContext(ProjectLinkContext);
  if (!ctx) {
    throw new Error('useProjectLink must be used inside ProjectLinkProvider');
  }
  return ctx;
}
