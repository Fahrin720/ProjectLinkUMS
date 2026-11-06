export type ProjectType =
  | 'Assignment'
  | 'Competition'
  | 'Innovation'
  | 'Community'
  | 'Other';

export type Proficiency = 'beginner' | 'intermediate' | 'advanced';

export type ProjectStatus = 'open' | 'closed' | 'completed';

export type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'withdrawn';

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled';

export type MemberRole = 'owner' | 'member';
export type MembershipStatus = 'active' | 'left' | 'removed';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export type BetaTaskCode = 'T01' | 'T02' | 'T03' | 'T04' | 'T05';

export type AvailabilityStatusType = 'Available' | 'Busy' | 'In Team';
export type UserRoleMode = 'STUDENT' | 'ORGANIZER';

// 01. profiles (Normalized public student/organizer profile adapted for Home + Profile + Side Menu UI)
export interface Profile {
  id: string;
  display_name: string;
  matric_no?: string;
  faculty: string;
  faculty_short?: string;
  programme: string | null;
  year_of_study: number; // 1..8
  location?: string;
  availability_status?: AvailabilityStatusType;
  role_mode?: UserRoleMode;
  bio: string | null;
  avatar_url: string | null;
  avatar_variant?: number;
  avatar_zoom?: number;
  avatar_offset_x?: number;
  avatar_offset_y?: number;
  weekly_hours: number; // 0..168
  preferred_project_types: ProjectType[];
  active_filter_tags?: string[];
  email?: string;
  phone?: string;
  linkedin?: string;
  discoverable: boolean;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  is_fictional_test_account?: boolean;
}

// 02. skills
export interface Skill {
  id: string;
  name: string;
  category: string;
}

// 03. student_skills
export interface StudentSkill {
  student_id: string;
  skill_id: string;
  proficiency: Proficiency;
}

// 04. interests
export interface Interest {
  id: string;
  name: string;
}

// 05. student_interests
export interface StudentInterest {
  student_id: string;
  interest_id: string;
}

// 06. availability_slots
export interface AvailabilitySlot {
  id: string;
  student_id: string;
  weekday: number; // 1 (Mon) .. 7 (Sun)
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

// 07. projects
export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  project_type: ProjectType;
  slots_needed: number; // 1..50 (additional teammates excluding owner)
  min_weekly_hours: number; // 0..168
  status: ProjectStatus;
  deadline: string | null; // YYYY-MM-DD
  date_display?: string;
  location?: string;
  audience?: string;
  badge_line_1?: string;
  badge_line_2?: string;
  tags?: string[];
  attribute_tags?: string[];
  trending?: boolean;
  organizer_phone?: string;
  organizer_name?: string;
  banner_url?: string | null;
  banner_preset?: string;
  banner_position_y?: number;
  created_at: string;
  updated_at: string;
}

// 08. project_required_skills
export interface ProjectRequiredSkill {
  project_id: string;
  skill_id: string;
  mandatory: boolean;
  importance: number; // 1..5
}

// 09. project_interests
export interface ProjectInterest {
  project_id: string;
  interest_id: string;
}

// 10. project_meeting_slots
export interface ProjectMeetingSlot {
  id: string;
  project_id: string;
  weekday: number; // 1..7
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

// 11. applications
export interface Application {
  id: string;
  project_id: string;
  applicant_id: string;
  note: string | null;
  status: ApplicationStatus;
  created_at: string;
  responded_at: string | null;
}

// 12. project_members
export interface ProjectMember {
  project_id: string;
  student_id: string;
  member_role: MemberRole;
  membership_status: MembershipStatus;
  joined_at: string;
}

// 13. project_invitations
export interface ProjectInvitation {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_id: string;
  note: string | null;
  status: InvitationStatus;
  created_at: string;
  responded_at: string | null;
}

// 14. notifications
export interface NotificationItem {
  id: string;
  recipient_id: string;
  event_type: string;
  target_type: 'application' | 'invitation' | 'project';
  target_id: string;
  title?: string;
  body?: string;
  read_at: string | null;
  created_at: string;
}

// 15. beta_test_results
export interface BetaTestResult {
  id: string;
  tester_id: string;
  task_code: BetaTaskCode;
  success: boolean;
  duration_seconds: number;
  difficulty_1_to_5: number;
  comment: string | null;
  created_at: string;
}

// Extension 16: project_tasks (Workspace Kanban)
export interface ProjectTask {
  id: string;
  project_id: string;
  creator_id: string;
  assignee_id: string | null;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extension 17: project_messages (Realtime Team Chat)
export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
}

// Extension 18: saved_projects (Bookmarks)
export interface SavedProject {
  student_id: string;
  project_id: string;
  saved_at: string;
}

// Extension 19: reports (Moderation & Trust)
export interface ModerationReport {
  id: string;
  reporter_id: string;
  target_type: 'project' | 'profile' | 'message';
  target_id: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolution_note: string | null;
  created_at: string;
}

// Extension 20: student_activity_history (Past programs, activities & SDP points)
export interface StudentActivityHistory {
  id: string;
  student_id: string;
  project_id: string | null;
  title: string;
  date_display: string;
  role: string;
  sdp_earned: number;
  summary: string;
  completed_at: string;
}

// Exact RPC Payloads matching 03_FUNCTIONS_RPC.sql
export interface SaveMyProfilePayload {
  p_display_name: string;
  p_faculty: string;
  p_programme: string | null;
  p_year_of_study: number;
  p_bio: string | null;
  p_weekly_hours: number;
  p_preferred_project_types: ProjectType[];
  p_discoverable: boolean;
  p_skills: {skill_id: string; proficiency: Proficiency}[];
  p_interests: string[];
  p_slots: {weekday: number; start_time: string; end_time: string}[];
  // Interface extensions
  p_matric_no?: string;
  p_faculty_short?: string;
  p_location?: string;
  p_availability_status?: AvailabilityStatusType;
  p_email?: string;
  p_phone?: string;
  p_linkedin?: string;
}

export interface CreateProjectPayload {
  p_title: string;
  p_description: string;
  p_project_type: ProjectType;
  p_slots_needed: number;
  p_min_weekly_hours: number;
  p_deadline: string | null;
  p_date_display?: string;
  p_location?: string;
  p_audience?: string;
  p_badge_line_1?: string;
  p_badge_line_2?: string;
  p_tags?: string[];
  p_attribute_tags?: string[];
  p_organizer_phone?: string;
  p_organizer_name?: string;
  p_banner_url?: string | null;
  p_banner_preset?: string;
  p_banner_position_y?: number;
  p_required_skills: {
    skill_id: string;
    mandatory: boolean;
    importance: number;
  }[];
  p_interests: string[];
  p_meeting_slots: {weekday: number; start_time: string; end_time: string}[];
}

export interface MatchBreakdown {
  totalScore: number; // 0..100
  skillScore: number; // out of 40
  interestScore: number; // out of 25
  scheduleScore: number; // out of 20
  goalScore: number; // out of 15
  eligible: boolean;
  ineligibilityReasons: string[];
  matchedMandatorySkills: number;
  totalMandatorySkills: number;
  matchedSkillsNames: string[];
  missingMandatorySkillsNames: string[];
  sharedInterestsNames: string[];
  overlapHoursPerWeek: number;
  overlapSlotSummaries: string[];
  goalAligned: boolean;
  explanationSummary: string;
}
