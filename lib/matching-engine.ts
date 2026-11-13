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
  beginner: 0.78,
  intermediate: 0.9,
  advanced: 1.0,
};

// Maps Home / Search Official Filter Tags to Skill Categories, Interest Categories, and Project Keywords
const FILTER_TAG_DOMAIN_RULES: Record<
  string,
  {
    skillCategories?: string[];
    interestCategories?: string[];
    keywords?: string[];
  }
> = {
  programming: {
    skillCategories: ['Tech & AI (FKI)'],
    keywords: [
      'programming',
      'web',
      'mobile',
      'react',
      'next.js',
      'python',
      'coding',
      'cybersecurity',
      'hackathon',
    ],
  },
  planning: {
    skillCategories: ['Leadership & Operations'],
    keywords: [
      'planning',
      'project management',
      'logistics',
      'event',
      'protocol',
      'secretary',
    ],
  },
  database: {
    skillCategories: ['Tech & AI (FKI)'],
    keywords: ['database', 'sql', 'data', 'cloud', 'telemetry'],
  },
  'ui/ux design': {
    skillCategories: ['Tech & AI (FKI)', 'Creative, Media & Arts (FSSK)'],
    keywords: ['ui/ux', 'figma', 'design', 'graphic', 'mobile'],
  },
  'ai & data': {
    skillCategories: ['Tech & AI (FKI)', 'Academic & Research'],
    interestCategories: ['Teknologi & Inovasi'],
    keywords: ['ai', 'machine learning', 'data', 'analytics', 'spss', 'python'],
  },
  'engineering & iot': {
    skillCategories: ['Engineering & IoT (FKJ)'],
    interestCategories: ['Teknologi & Inovasi'],
    keywords: [
      'iot',
      'engineering',
      'robotics',
      'cad',
      'electronics',
      'solar',
      'shuttle',
      'esp32',
      'fkj',
    ],
  },
  'sains & marin': {
    skillCategories: ['Science, Marine & Agro (FSSA/FPL)'],
    interestCategories: ['Sains, Marin & Kelestarian'],
    keywords: [
      'marine',
      'coral',
      'reef',
      'gis',
      'agro',
      'agritech',
      'eco',
      'laboratory',
      'fssa',
      'fpl',
    ],
  },
  'perniagaan & tajaan': {
    skillCategories: ['Business & Finance (FPEP/FKAL)'],
    interestCategories: ['Keusahawanan & Kewangan'],
    keywords: [
      'startup',
      'pitch',
      'finance',
      'business',
      'marketing',
      'sponsorship',
      'tamu',
      'fpep',
      'fkal',
    ],
  },
  'kesihatan & komuniti': {
    skillCategories: [
      'Health, Food & Psychology (FPSK/FSMP/FPP)',
      'Leadership & Operations',
    ],
    interestCategories: ['Kesihatan, Pendidikan & CSR'],
    keywords: [
      'health',
      'kesihatan',
      'nutrition',
      'gizi',
      'food',
      'psychology',
      'minda',
      'csr',
      'komuniti',
      'community',
      'fpsk',
      'fsmp',
      'fpp',
    ],
  },
  'media & kreatif': {
    skillCategories: ['Creative, Media & Arts (FSSK)'],
    interestCategories: ['Seni, Budaya & Sukan'],
    keywords: [
      'media',
      'creative',
      'photography',
      'video',
      'dokumentari',
      'culture',
      'warisan',
      'graphic',
      'fssk',
    ],
  },
  penyelidikan: {
    skillCategories: [
      'Academic & Research',
      'Science, Marine & Agro (FSSA/FPL)',
    ],
    keywords: [
      'research',
      'penyelidikan',
      'academic',
      'lab',
      'survey',
      'gis',
      'analysis',
    ],
  },
  'beginner friendly': {
    keywords: ['beginner friendly', 'terbuka kepada semua', 'sukarelawan'],
  },
  'rentas fakulti': {
    keywords: ['rentas fakulti', 'semua fakulti', 'terbuka kepada'],
  },
  'kerja lapangan': {
    keywords: ['kerja lapangan', 'fieldwork', 'lapangan', 'ekspedisi', 'kem'],
  },
  'fleksibel / hibrid': {
    keywords: ['fleksibel / hibrid', 'hibrid', 'fleksibel'],
  },
  extrovert: {
    keywords: ['extrovert', 'pitch', 'networking', 'speaking', 'komuniti'],
  },
  'female only': {
    keywords: ['female only'],
  },
};

export function projectMatchesOfficialFilter(params: {
  filterLabel: string;
  project: Project;
  reqSkills: ProjectRequiredSkill[];
  projInterests: ProjectInterest[];
  skillsCatalog: Skill[];
  interestsCatalog: Interest[];
}): boolean {
  const {
    filterLabel,
    project,
    reqSkills,
    projInterests,
    skillsCatalog,
    interestsCatalog,
  } = params;
  const norm = filterLabel.trim().toLowerCase();
  if (!norm) return true;

  const attrTags = (project.attribute_tags || []).map((t) => t.toLowerCase());
  const cardTags = (project.tags || []).map((t) => t.toLowerCase());
  if (
    attrTags.some((t) => t === norm || t.includes(norm)) ||
    cardTags.some((t) => t === norm || t.includes(norm))
  ) {
    return true;
  }

  const skillById = new Map(skillsCatalog.map((s) => [s.id, s]));
  const projSkillObjs = reqSkills
    .filter((r) => r.project_id === project.id)
    .map((r) => skillById.get(r.skill_id))
    .filter((s): s is Skill => Boolean(s));

  if (
    projSkillObjs.some(
      (s) =>
        s.id.toLowerCase() === norm ||
        s.name.toLowerCase().includes(norm) ||
        s.category.toLowerCase().includes(norm)
    )
  ) {
    return true;
  }

  const intrById = new Map(interestsCatalog.map((i) => [i.id, i]));
  const projIntrObjs = projInterests
    .filter((pi) => pi.project_id === project.id)
    .map(
      (pi) =>
        intrById.get(pi.interest_id) ||
        interestsCatalog.find(
          (i) => i.name.toLowerCase() === pi.interest_id.toLowerCase()
        )
    )
    .filter((i): i is Interest => Boolean(i));

  if (
    projIntrObjs.some(
      (i) =>
        i.id.toLowerCase() === norm ||
        i.name.toLowerCase().includes(norm) ||
        (i.category || '').toLowerCase().includes(norm)
    )
  ) {
    return true;
  }

  const rule = FILTER_TAG_DOMAIN_RULES[norm];
  if (rule) {
    if (
      rule.skillCategories &&
      projSkillObjs.some((s) => rule.skillCategories!.includes(s.category))
    ) {
      return true;
    }
    if (
      rule.interestCategories &&
      projIntrObjs.some(
        (i) => i.category && rule.interestCategories!.includes(i.category)
      )
    ) {
      return true;
    }
    if (rule.keywords) {
      const textBlob = `${project.title} ${project.description} ${project.badge_line_1 || ''} ${project.badge_line_2 || ''} ${project.audience || ''} ${attrTags.join(' ')} ${cardTags.join(' ')}`.toLowerCase();
      if (rule.keywords.some((kw) => textBlob.includes(kw))) {
        return true;
      }
    }
  }

  const fallbackText = `${project.title} ${project.description} ${attrTags.join(' ')} ${cardTags.join(' ')}`.toLowerCase();
  return fallbackText.includes(norm);
}

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
      summaries: ['Jadual fleksibel (tiada slot tetap diwajibkan)'],
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
 * Explainable heuristic matching engine (40% Skills, 25% Interests, 20% Schedule, 15% Goals & Filters).
 * Works across all predetermined UMS skill categories, interests (minat), and official filter tags.
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
    activeFilterTags = student.active_filter_tags || [],
    requireDiscoveryConsent = false,
  } = params;

  const ineligibilityReasons: string[] = [];

  if (project.status !== 'open') {
    ineligibilityReasons.push(`Project is currently ${project.status}`);
  }

  if (project.owner_id === student.id) {
    ineligibilityReasons.push('Student is the project owner');
  }

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

  if (
    requireDiscoveryConsent &&
    (!student.discoverable || !student.consent_at)
  ) {
    ineligibilityReasons.push('Student has not opted into public discovery');
  }

  if (
    project.min_weekly_hours > 0 &&
    (student.weekly_hours || 0) < project.min_weekly_hours
  ) {
    ineligibilityReasons.push(
      `Declared ${student.weekly_hours}h/wk is below project minimum of ${project.min_weekly_hours}h/wk`
    );
  }

  // 6. Skill Coverage (40% weight) + Active Official Filter Tag Synergy
  const reqSkills = projectRequiredSkills.filter(
    (r) => r.project_id === project.id
  );
  const skillById = new Map<string, Skill>(
    skillsCatalog.map((s) => [s.id, s])
  );
  const skillByNameLower = new Map<string, Skill>(
    skillsCatalog.map((s) => [s.name.toLowerCase(), s])
  );

  const studSkillMap = new Map<string, Proficiency>();
  studentSkills
    .filter((s) => s.student_id === student.id)
    .forEach((s) => {
      studSkillMap.set(s.skill_id, s.proficiency);
      const skObj = skillById.get(s.skill_id);
      if (skObj) {
        studSkillMap.set(skObj.name.toLowerCase(), s.proficiency);
      }
    });

  let totalImportanceWeight = 0;
  let earnedImportanceWeight = 0;
  let totalMandatorySkills = 0;
  let matchedMandatorySkills = 0;
  const matchedSkillsNames: string[] = [];
  const missingMandatorySkillsNames: string[] = [];

  for (const req of reqSkills) {
    const importance = req.importance || 3;
    totalImportanceWeight += importance;
    const skillObj =
      skillById.get(req.skill_id) ||
      skillByNameLower.get(req.skill_id.toLowerCase());
    const sName = skillObj?.name || req.skill_id;
    const prof =
      studSkillMap.get(req.skill_id) ||
      (skillObj ? studSkillMap.get(skillObj.id) : undefined) ||
      studSkillMap.get(sName.toLowerCase());

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
      earnedImportanceWeight += importance * PROFICIENCY_MULTIPLIER[prof];
    }
  }

  if (missingMandatorySkillsNames.length > 0) {
    ineligibilityReasons.push(
      `Missing mandatory skill(s): ${missingMandatorySkillsNames.join(', ')}`
    );
  }

  // Evaluate how many activeFilterTags match this project
  const matchedFilterCount = activeFilterTags.filter((tag) =>
    projectMatchesOfficialFilter({
      filterLabel: tag,
      project,
      reqSkills,
      projInterests: projectInterests,
      skillsCatalog,
      interestsCatalog,
    })
  ).length;

  const filterRatio =
    activeFilterTags.length > 0
      ? matchedFilterCount / activeFilterTags.length
      : 0.7;

  let baseSkillScore: number;
  if (totalImportanceWeight > 0) {
    const rawSkillRatio = earnedImportanceWeight / totalImportanceWeight;
    // Blend student's profile skill match (75%) with active Home filter synergy (25%)
    const blendedRatio =
      activeFilterTags.length > 0
        ? rawSkillRatio * 0.72 + filterRatio * 0.28
        : rawSkillRatio;
    baseSkillScore = Math.round(8 + blendedRatio * 32);
  } else {
    // Optional skills left empty (open-field activity): score reflects filter alignment + welcoming baseline
    baseSkillScore =
      activeFilterTags.length > 0
        ? Math.round(22 + filterRatio * 16)
        : 32;
  }

  const skillScore = Math.min(40, Math.max(8, baseSkillScore));

  // 7. Shared Interests / Minat (25% weight)
  const interestById = new Map<string, Interest>(
    interestsCatalog.map((i) => [i.id, i])
  );
  const interestByNameLower = new Map<string, Interest>(
    interestsCatalog.map((i) => [i.name.toLowerCase(), i])
  );

  const normalizeInterestKey = (rawKey: string): string => {
    const byId = interestById.get(rawKey);
    if (byId) return byId.id;
    const byName = interestByNameLower.get(rawKey.toLowerCase());
    if (byName) return byName.id;
    return rawKey.toLowerCase();
  };

  const projInterestKeys = Array.from(
    new Set(
      projectInterests
        .filter((pi) => pi.project_id === project.id)
        .map((pi) => normalizeInterestKey(pi.interest_id))
    )
  );

  const studInterestKeySet = new Set(
    studentInterests
      .filter((si) => si.student_id === student.id)
      .map((si) => normalizeInterestKey(si.interest_id))
  );

  const sharedInterestsNames: string[] = [];
  for (const pKey of projInterestKeys) {
    if (studInterestKeySet.has(pKey)) {
      const iObj = interestById.get(pKey);
      sharedInterestsNames.push(iObj ? iObj.name : pKey);
    }
  }

  let interestScore: number;
  if (projInterestKeys.length > 0) {
    const rawInterestRatio = sharedInterestsNames.length / projInterestKeys.length;
    interestScore = Math.min(25, Math.max(5, Math.round(5 + rawInterestRatio * 20)));
  } else {
    interestScore = 18;
  }

  // 8. Schedule Overlap (20% weight)
  const pSlots = projectSlots.filter((s) => s.project_id === project.id);
  const sSlots = studentSlots.filter((s) => s.student_id === student.id);
  const overlap = computeScheduleOverlap(sSlots, pSlots);

  if (pSlots.length > 0 && overlap.overlapMinutes === 0) {
    ineligibilityReasons.push('No overlapping weekly meeting time window');
  }

  const scheduleScore =
    pSlots.length > 0
      ? Math.min(20, Math.max(4, Math.round(4 + overlap.ratio * 16)))
      : 18;
  const overlapHoursPerWeek = Number((overlap.overlapMinutes / 60).toFixed(1));

  // 9. Project Type / Goal & Official Filter Alignment (15% weight)
  const prefs = student.preferred_project_types || [];
  const goalAligned =
    prefs.length === 0 || prefs.includes(project.project_type);
  const typePoints = goalAligned ? 8 : 4;
  const filterPoints =
    activeFilterTags.length > 0
      ? Math.round(filterRatio * 7)
      : 5;
  const goalScore = Math.min(15, typePoints + filterPoints);

  const totalScore = Math.min(
    99,
    Math.max(32, skillScore + interestScore + scheduleScore + goalScore)
  );

  const eligible = ineligibilityReasons.length === 0;

  const parts: string[] = [];
  if (reqSkills.length > 0) {
    parts.push(
      `Sepadan ${matchedSkillsNames.length}/${reqSkills.length} kemahiran`
    );
  } else {
    parts.push('Terbuka untuk semua tahap kemahiran');
  }
  if (sharedInterestsNames.length > 0) {
    parts.push(
      `Minat sama: ${sharedInterestsNames.slice(0, 2).join(' & ')}`
    );
  }
  if (overlap.summaries.length > 0) {
    parts.push(`Jadual: ${overlap.summaries.slice(0, 2).join(', ')}`);
  }

  const explanationSummary = parts.join(' · ');

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
