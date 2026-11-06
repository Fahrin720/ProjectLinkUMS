import {NextRequest, NextResponse} from 'next/server';
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
} from '@/lib/seed-data';
import {evaluateStudentProjectMatch} from '@/lib/matching-engine';

// Server-side normalized relational store mirroring 01_SCHEMA.sql + 03_FUNCTIONS_RPC.sql
const serverDb = {
  profiles: [...INITIAL_PROFILES],
  skills: [...INITIAL_SKILLS],
  studentSkills: [...INITIAL_STUDENT_SKILLS],
  interests: [...INITIAL_INTERESTS],
  studentInterests: [...INITIAL_STUDENT_INTERESTS],
  availabilitySlots: [...INITIAL_AVAILABILITY_SLOTS],
  projects: [...INITIAL_PROJECTS],
  projectRequiredSkills: [...INITIAL_PROJECT_REQUIRED_SKILLS],
  projectInterests: [...INITIAL_PROJECT_INTERESTS],
  projectMeetingSlots: [...INITIAL_PROJECT_MEETING_SLOTS],
  applications: [...INITIAL_APPLICATIONS],
  projectMembers: [...INITIAL_PROJECT_MEMBERS],
  projectInvitations: [...INITIAL_PROJECT_INVITATIONS],
  notifications: [...INITIAL_NOTIFICATIONS],
  betaTestResults: [...INITIAL_BETA_RESULTS],
  projectTasks: [...INITIAL_PROJECT_TASKS],
  projectMessages: [...INITIAL_PROJECT_MESSAGES],
  savedProjects: [...INITIAL_SAVED_PROJECTS],
  reports: [...INITIAL_REPORTS],
  activityHistory: [...INITIAL_ACTIVITY_HISTORY],
};

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const studentId = searchParams.get('student_id') || 'usr-aiman';
  const student =
    serverDb.profiles.find((p) => p.id === studentId) || serverDb.profiles[0];

  const rankedMatches = serverDb.projects.map((project) => ({
    project_id: project.id,
    title: project.title,
    breakdown: evaluateStudentProjectMatch({
      student,
      project,
      skillsCatalog: serverDb.skills,
      interestsCatalog: serverDb.interests,
      studentSkills: serverDb.studentSkills,
      projectRequiredSkills: serverDb.projectRequiredSkills,
      studentInterests: serverDb.studentInterests,
      projectInterests: serverDb.projectInterests,
      studentSlots: serverDb.availabilitySlots,
      projectSlots: serverDb.projectMeetingSlots,
      projectMembers: serverDb.projectMembers,
      activeFilterTags: student.active_filter_tags,
      requireDiscoveryConsent: false,
    }),
  }));

  return NextResponse.json({
    ok: true,
    student_id: student.id,
    ranked_matches: rankedMatches,
    counts: {
      profiles: serverDb.profiles.length,
      projects: serverDb.projects.length,
      skills: serverDb.skills.length,
      interests: serverDb.interests.length,
      applications: serverDb.applications.length,
      invitations: serverDb.projectInvitations.length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {rpc, args, stateSnapshot} = body;

    if (stateSnapshot && stateSnapshot.profiles && stateSnapshot.projects) {
      Object.assign(serverDb, stateSnapshot);
    }

    return NextResponse.json({
      ok: true,
      rpc: rpc || 'sync_state',
      executed_at: new Date().toISOString(),
      args_received: Boolean(args),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'RPC execution error',
      },
      {status: 400}
    );
  }
}
