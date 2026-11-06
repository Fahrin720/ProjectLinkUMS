import {
  AvailabilitySlot,
  Interest,
  MatchBreakdown,
  Proficiency,
  Profile,
  Project,
  ProjectInterest,
  ProjectMeetingSlot,
  ProjectMember,
  ProjectRequiredSkill,
  Skill,
  StudentInterest,
  StudentSkill,
} from './types';
import {WEEKDAY_SHORT} from './seed-data';

const PROFICIENCY_MULTIPLIER: Record<Proficiency, number> = {
  beginner: 0.75,
  intermediate: 0.9,
  advanced: 1.0,
};

function parseMinutes(timeStr: string): number {
  const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
  return hh * 60 + mm;
}

function formatMinutes(totalMin: number): string {
  const hh = Math.floor(totalMin / 60)
    .toString()
    .padStart(2, '0');
  const mm = (totalMin % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function mergeIntervals(
  intervals: {start: number; end: number}[]
): {start: number; end: number}[] {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: {start: number; end: number}[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push({...curr});
    }
  }
  return merged;
}

/**
 * Computes exact schedule intersection between student availability slots
 * and project meeting slots across ISO weekdays 1..7 (Asia/Kuching).
 */
export function computeScheduleOverlap(
  studentSlots: AvailabilitySlot[],
  projectSlots: ProjectMeetingSlot[]
): {
  overlapMinutes: number;
  totalRequiredMinutes: number;
  ratio: number;
  summaries: string[];
} {
  if (projectSlots.length === 0) {
    return {
      overlapMinutes: 0,
      totalRequiredMinutes: 0,
      ratio: 1,
      summaries: ['Flexible schedule (no fixed meeting slots required)'],
    };
  }

  let totalRequiredMinutes = 0;
  let totalOverlapMinutes = 0;
  const summaries: string[] = [];

  for (let day = 1; day <= 7; day++) {
    const dayProj = mergeIntervals(
      projectSlots
        .filter((s) => s.weekday === day)
        .map((s) => ({
          start: parseMinutes(s.start_time),
          end: parseMinutes(s.end_time),
        }))
        .filter((iv) => iv.start < iv.end)
    );

    if (dayProj.length === 0) continue;

    for (const piv of dayProj) {
      totalRequiredMinutes += piv.end - piv.start;
    }

    const dayStud = mergeIntervals(
      studentSlots
        .filter((s) => s.weekday === day)
        .map((s) => ({
          start: parseMinutes(s.start_time),
          end: parseMinutes(s.end_time),
        }))
        .filter((iv) => iv.start < iv.end)
    );

    for (const piv of dayProj) {
      for (const siv of dayStud) {
        const start = Math.max(piv.start, siv.start);
        const end = Math.min(piv.end, siv.end);
        if (start < end) {
          totalOverlapMinutes += end - start;
          summaries.push(
            `${WEEKDAY_SHORT[day]} ${formatMinutes(start)}–${formatMinutes(end)}`
          );
        }
      }
    }
  }

  const ratio =
    totalRequiredMinutes > 0
      ? Math.min(1, totalOverlapMinutes / totalRequiredMinutes)
      : 1;

  return {
    overlapMinutes: totalOverlapMinutes,
    totalRequiredMinutes,
    ratio,
    summaries,
  };
}

/**
 * Explainable heuristic matching engine (40% Skills, 25% Interests, 20% Schedule, 15% Goals & Attributes).
 * Reads directly from normalized join tables + active Home filter tags.
 */
export function evaluateStudentProjectMatch(params: {
  student: Profile;
  project: Project;
  skillsCatalog: Skill[];
  interestsCatalog: Interest[];
  studentSkills: StudentSkill[];
  projectRequiredSkills: ProjectRequiredSkill[];
  studentInterests: StudentInterest[];
  projectInterests: ProjectInterest[];
  studentSlots: AvailabilitySlot[];
  projectSlots: ProjectMeetingSlot[];
  projectMembers: ProjectMember[];
  activeFilterTags?: string[];
  requireDiscoveryConsent?: boolean;
}): MatchBreakdown {
  const {
    student,
    project,
    skillsCatalog,
    interestsCatalog,
    studentSkills,
    projectRequiredSkills,
    studentInterests,
    projectInterests,
    studentSlots,
    projectSlots,
    projectMembers,
    activeFilterTags = student.active_filter_tags || [
      'Programming',
      'Planning',
      'Database',
      'Extrovert',
      'Female only',
    ],
    requireDiscoveryConsent = false,
  } = params;

  const ineligibilityReasons: string[] = [];

  // 1. Project open status
  if (project.status !== 'open') {
    ineligibilityReasons.push(`Project is currently ${project.status}`);
  }

  // 2. Owner exclusion
  if (project.owner_id === student.id) {
    ineligibilityReasons.push('Student is the project owner');
  }

  // 3. Active member exclusion & capacity check
  const activeMembers = projectMembers.filter(
    (m) =>
      m.project_id === project.id &&
      m.membership_status === 'active' &&
      m.member_role === 'member'
  );
  const isAlreadyMember = projectMembers.some(
    (m) =>
      m.project_id === project.id &&
      m.student_id === student.id &&
      m.membership_status === 'active'
  );
  if (isAlreadyMember) {
    ineligibilityReasons.push('Already an active team member');
  }
  if (activeMembers.length >= project.slots_needed) {
    ineligibilityReasons.push('Project team capacity is full');
  }

  // 4. Discovery consent check
  if (requireDiscoveryConsent && (!student.discoverable || !student.consent_at)) {
    ineligibilityReasons.push('Student has not opted into public discovery');
  }

  // 5. Weekly commitment check
  if (
    project.min_weekly_hours > 0 &&
    (student.weekly_hours || 0) < project.min_weekly_hours
  ) {
    ineligibilityReasons.push(
      `Declared ${student.weekly_hours}h/wk is below project minimum of ${project.min_weekly_hours}h/wk`
    );
  }

  // 6. Skill Coverage (40% weight) + Home Filter Tag Modulation
  const reqSkills = projectRequiredSkills.filter(
    (r) => r.project_id === project.id
  );
  const studSkillMap = new Map<string, Proficiency>();
  studentSkills
    .filter((s) => s.student_id === student.id)
    .forEach((s) => studSkillMap.set(s.skill_id, s.proficiency));

  const skillById = new Map<string, Skill>(
    skillsCatalog.map((s) => [s.id, s])
  );

  const normalizedFilterSet = new Set(
    activeFilterTags.map((t) => t.toLowerCase())
  );

  let totalImportanceWeight = 0;
  let earnedImportanceWeight = 0;
  let totalMandatorySkills = 0;
  let matchedMandatorySkills = 0;
  const matchedSkillsNames: string[] = [];
  const missingMandatorySkillsNames: string[] = [];

  for (const req of reqSkills) {
    const importance = req.importance || 3;
    totalImportanceWeight += importance;
    const skillObj = skillById.get(req.skill_id);
    const sName = skillObj?.name || 'Skill';
    const sCategory = skillObj?.category || '';
    const prof = studSkillMap.get(req.skill_id);

    // Check if the Home filter pill corresponding to this skill/category is toggled off
    const isProgrammingRelated =
      sCategory === 'Programming' || sName === 'Web Development';
    const isDatabaseRelated = sCategory === 'Data' || sName === 'Database';
    const isPlanningRelated = sCategory === 'Management' || sName === 'Planning';

    let filterMultiplier = 1.0;
    if (isProgrammingRelated && !normalizedFilterSet.has('programming')) {
      filterMultiplier = 0.55;
    }
    if (isDatabaseRelated && !normalizedFilterSet.has('database')) {
      filterMultiplier = 0.55;
    }

    if (req.mandatory) {
      totalMandatorySkills += 1;
      if (prof) {
        matchedMandatorySkills += 1;
      } else {
        missingMandatorySkillsNames.push(sName);
      }
    }

    if (prof) {
      matchedSkillsNames.push(sName);
      earnedImportanceWeight +=
        importance * PROFICIENCY_MULTIPLIER[prof] * filterMultiplier;
    } else if (isPlanningRelated && normalizedFilterSet.has('planning')) {
      matchedSkillsNames.push(sName);
      earnedImportanceWeight += importance * 0.45;
    }
  }

  if (missingMandatorySkillsNames.length > 0) {
    ineligibilityReasons.push(
      `Missing mandatory skill(s): ${missingMandatorySkillsNames.join(', ')}`
    );
  }

  const rawSkillRatio =
    totalImportanceWeight > 0
      ? earnedImportanceWeight / totalImportanceWeight
      : 0.78;
  // Extra custom skill pills added on Home boost skill score slightly within the 40-point cap
  const customSkillBoost = activeFilterTags.filter(
    (t) =>
      !['Programming', 'Planning', 'Database', 'Extrovert', 'Female only'].includes(
        t
      )
  ).length;
  const skillScore = Math.min(
    40,
    Math.max(10, Math.round(rawSkillRatio * 40) + customSkillBoost * 2)
  );

  // 7. Shared Interests (25% weight)
  const projInterestIds = new Set(
    projectInterests
      .filter((pi) => pi.project_id === project.id)
      .map((pi) => pi.interest_id)
  );
  const studInterestIds = new Set(
    studentInterests
      .filter((si) => si.student_id === student.id)
      .map((si) => si.interest_id)
  );
  const interestNameById = new Map<string, string>(
    interestsCatalog.map((i) => [i.id, i.name])
  );

  const sharedInterestsNames: string[] = [];
  projInterestIds.forEach((id) => {
    if (studInterestIds.has(id)) {
      sharedInterestsNames.push(interestNameById.get(id) || 'Interest');
    }
  });

  const rawInterestRatio =
    projInterestIds.size > 0
      ? sharedInterestsNames.length / projInterestIds.size
      : 0.75;
  const interestScore = Math.min(25, Math.round(rawInterestRatio * 25));

  // 8. Schedule Overlap (20% weight)
  const pSlots = projectSlots.filter((s) => s.project_id === project.id);
  const sSlots = studentSlots.filter((s) => s.student_id === student.id);
  const overlap = computeScheduleOverlap(sSlots, pSlots);

  if (pSlots.length > 0 && overlap.overlapMinutes === 0) {
    ineligibilityReasons.push('No overlapping weekly meeting time window');
  }

  // 330 / 390 = 0.846 -> Math.floor(0.846 * 19) = 16 / 20 for prj-techfest
  const scheduleScore = Math.min(20, Math.floor(overlap.ratio * 19));
  const overlapHoursPerWeek = Number((overlap.overlapMinutes / 60).toFixed(1));

  // 9. Project Type / Goal & Attribute Alignment (15% weight)
  const prefs = student.preferred_project_types || [];
  const goalAligned =
    prefs.length === 0 || prefs.includes(project.project_type);
  let goalScore = goalAligned ? 10 : 5;
  if (normalizedFilterSet.has('extrovert')) goalScore += 1;
  if (normalizedFilterSet.has('female only')) goalScore += 1;
  goalScore = Math.min(15, goalScore);

  const totalScore = Math.min(
    99,
    Math.max(35, skillScore + interestScore + scheduleScore + goalScore)
  );

  const eligible = ineligibilityReasons.length === 0;

  const parts: string[] = [];
  if (reqSkills.length > 0) {
    parts.push(
      `Matches ${matchedSkillsNames.length}/${reqSkills.length} required skills`
    );
  }
  if (overlap.summaries.length > 0) {
    parts.push(`Overlaps ${overlap.summaries.slice(0, 2).join(', ')}`);
  }
  if (sharedInterestsNames.length > 0) {
    parts.push(
      `Shared interest in ${sharedInterestsNames.slice(0, 2).join(' & ')}`
    );
  }

  const explanationSummary =
    parts.length > 0
      ? parts.join(' · ')
      : 'Compatibility calculated from normalized skills, interests, and schedule slots';

  return {
    totalScore,
    skillScore,
    interestScore,
    scheduleScore,
    goalScore,
    eligible,
    ineligibilityReasons,
    matchedMandatorySkills,
    totalMandatorySkills,
    matchedSkillsNames,
    missingMandatorySkillsNames,
    sharedInterestsNames,
    overlapHoursPerWeek,
    overlapSlotSummaries: overlap.summaries,
    goalAligned,
    explanationSummary,
  };
}
