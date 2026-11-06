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
  ProjectInterest,
  ProjectInvitation,
  ProjectMeetingSlot,
  ProjectMember,
  ProjectMessage,
  ProjectRequiredSkill,
  ProjectStatus,
  ProjectTask,
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
} from './seed-data';

const STORAGE_KEY = 'projectlink_ums_normalized_db_v4';

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
  resetDemoDatabase: () => void;
  refreshProjectsFeed: () => void;

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
  updateProjectBanner: (
    projectId: string,
    banner: {
      banner_url?: string | null;
      banner_preset?: string;
      banner_position_y?: number;
    }
  ) => void;
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
}

const getInitialState = (): DatabaseState => ({
  currentUserId: 'usr-aiman',
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
  const isHydratedRef = useRef(false);

  // Restore saved state from localStorage after initial hydration completes
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DatabaseState>;
          if (parsed.profiles && parsed.projects && parsed.skills) {
            const migratedProjects = parsed.projects.map((p) =>
              p.id === 'prj-shuttle' && p.owner_id === 'usr-izzah'
                ? {
                    ...p,
                    owner_id: 'usr-aiman',
                    organizer_name: 'Fahrin (Kelab Inovasi FKI)',
                  }
                : p
            );
            setState((prev) => ({
              ...prev,
              ...parsed,
              projects: migratedProjects,
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
      active_filter_tags: ['Programming', 'Planning', 'Database'],
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
      studentSkills: [
        ...prev.studentSkills,
        {student_id: newId, skill_id: 'sk-web', proficiency: 'intermediate'},
        {student_id: newId, skill_id: 'sk-14', proficiency: 'intermediate'},
        {student_id: newId, skill_id: 'sk-01', proficiency: 'beginner'},
      ],
      studentInterests: [
        ...prev.studentInterests,
        {student_id: newId, interest_id: 'in-01'},
        {student_id: newId, interest_id: 'in-collab'},
      ],
      availabilitySlots: [
        ...prev.availabilitySlots,
        {
          id: `av-${newId}-1`,
          student_id: newId,
          weekday: 3,
          start_time: '14:00',
          end_time: '17:00',
        },
        {
          id: `av-${newId}-2`,
          student_id: newId,
          weekday: 5,
          start_time: '15:00',
          end_time: '17:00',
        },
      ],
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
        const currentTags = p.active_filter_tags || [
          'Programming',
          'Planning',
          'Database',
          'Extrovert',
          'Female only',
        ];
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
    const pool = [
      'Programming',
      'Planning',
      'Database',
      'Extrovert',
      'Female only',
    ];
    const picked = pool.filter(() => Math.random() > 0.25);
    const finalTags =
      picked.length >= 2 ? picked : ['Programming', 'Database', 'Planning'];
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

  // Add Student Skill into normalized skills + student_skills tables
  const addStudentSkillByName = (
    skillName: string,
    proficiency: Proficiency = 'intermediate'
  ) => {
    const clean = skillName.trim();
    if (!clean) return;
    const uid = state.currentUserId;

    setState((prev) => {
      let skillObj = prev.skills.find(
        (s) => s.name.toLowerCase() === clean.toLowerCase()
      );
      let nextSkillsCatalog = prev.skills;
      if (!skillObj) {
        skillObj = {
          id: `sk-custom-${Date.now().toString(36)}`,
          name: clean,
          category: 'Programming',
        };
        nextSkillsCatalog = [...prev.skills, skillObj];
      }

      const alreadyHas = prev.studentSkills.some(
        (ss) => ss.student_id === uid && ss.skill_id === skillObj!.id
      );
      if (alreadyHas) return prev;

      return {
        ...prev,
        skills: nextSkillsCatalog,
        studentSkills: [
          ...prev.studentSkills,
          {
            student_id: uid,
            skill_id: skillObj.id,
            proficiency,
          },
        ],
      };
    });

    notifyToast('Kemahiran Ditambah', `${clean} (${proficiency})`, 'success');
  };

  const removeStudentSkillById = (skillId: string) => {
    const uid = state.currentUserId;
    setState((prev) => {
      const userSkills = prev.studentSkills.filter((s) => s.student_id === uid);
      if (userSkills.length <= 1) return prev;
      return {
        ...prev,
        studentSkills: prev.studentSkills.filter(
          (s) => !(s.student_id === uid && s.skill_id === skillId)
        ),
      };
    });
  };

  // Add Student Interest into normalized interests + student_interests tables
  const addStudentInterestByName = (interestName: string) => {
    const clean = interestName.trim();
    if (!clean) return;
    const uid = state.currentUserId;

    setState((prev) => {
      let intrObj = prev.interests.find(
        (i) => i.name.toLowerCase() === clean.toLowerCase()
      );
      let nextInterestsCatalog = prev.interests;
      if (!intrObj) {
        intrObj = {
          id: `in-custom-${Date.now().toString(36)}`,
          name: clean,
        };
        nextInterestsCatalog = [...prev.interests, intrObj];
      }

      const alreadyHas = prev.studentInterests.some(
        (si) => si.student_id === uid && si.interest_id === intrObj!.id
      );
      if (alreadyHas) return prev;

      return {
        ...prev,
        interests: nextInterestsCatalog,
        studentInterests: [
          ...prev.studentInterests,
          {
            student_id: uid,
            interest_id: intrObj.id,
          },
        ],
      };
    });

    notifyToast('Minat Ditambah', clean, 'success');
  };

  const removeStudentInterestById = (interestId: string) => {
    const uid = state.currentUserId;
    setState((prev) => {
      const userInterests = prev.studentInterests.filter(
        (i) => i.student_id === uid
      );
      if (userInterests.length <= 1) return prev;
      return {
        ...prev,
        studentInterests: prev.studentInterests.filter(
          (i) => !(i.student_id === uid && i.interest_id === interestId)
        ),
      };
    });
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
    if (target.owner_id !== uid) {
      notifyToast(
        'Hanya Pemilik Boleh Tukar Gambar',
        'Hanya pemilik atau penganjur asal aktiviti ini dibenarkan menukar gambar poster.',
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

  // RPC 4: decide_application
  const decideApplication = (
    p_application_id: string,
    p_decision: 'accepted' | 'declined'
  ) => {
    const app = state.applications.find((a) => a.id === p_application_id);
    if (!app) return;
    const proj = state.projects.find((p) => p.id === app.project_id);
    if (!proj) return;

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

  // RPC 6: invite_candidate
  const inviteCandidate = (
    p_project_id: string,
    p_invitee_id: string,
    p_note: string
  ): string => {
    const uid = state.currentUserId;
    const proj = state.projects.find((p) => p.id === p_project_id);
    if (!proj) return '';
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

  // RPC 8: set_project_status
  const setProjectStatus = (p_project_id: string, p_status: ProjectStatus) => {
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
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === reportId
          ? {...r, status, resolution_note: resolutionNote.trim() || null}
          : r
      ),
    }));
  };

  return (
    <ProjectLinkContext.Provider
      value={{
        ...state,
        currentUser,
        toasts,
        dismissToast,
        notifyToast,
        switchPersona,
        createCustomTestAccount,
        registerStudentAccount,
        signInWithCredentials,
        resetDemoDatabase,
        refreshProjectsFeed,
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
        updateProjectBanner,
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
