import {
  Profile,
  Skill,
  StudentSkill,
  Interest,
  StudentInterest,
  AvailabilitySlot,
  Project,
  ProjectRequiredSkill,
  ProjectInterest,
  ProjectMeetingSlot,
  Application,
  ProjectMember,
  ProjectInvitation,
  NotificationItem,
  BetaTestResult,
  ProjectTask,
  ProjectMessage,
  SavedProject,
  ModerationReport,
  StudentActivityHistory,
} from './types';

export const UMS_FACULTIES = [
  'Fakulti Komputeran dan Informatik (FKI), UMS',
  'Faculty of Engineering (FKJ)',
  'Faculty of Science and Natural Resources (FSSA)',
  'Faculty of Business, Economics and Accountancy (FPEP)',
  'Faculty of Psychology and Education (FPP)',
  'Faculty of Medicine and Health Sciences (FPSK)',
  'Faculty of Sustainable Agriculture (FPL)',
  'Borneo Marine Research Institute (IPMB)',
];

export const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const WEEKDAY_SHORT: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

// 02. SKILL CATALOG (Canonical 04_SEED_CATALOGS.sql + Fahrin Profile & Home Filter Skills)
export const INITIAL_SKILLS: Skill[] = [
  {id: 'sk-c', name: 'C', category: 'Programming'},
  {id: 'sk-java', name: 'Java', category: 'Programming'},
  {id: 'sk-10', name: 'Python', category: 'Programming'},
  {id: 'sk-web', name: 'Web Development', category: 'Programming'},
  {id: 'sk-01', name: 'UI/UX', category: 'Design'},
  {id: 'sk-14', name: 'Database', category: 'Data'},
  {id: 'sk-git', name: 'Git & GitHub', category: 'Programming'},
  {id: 'sk-20', name: 'Planning', category: 'Management'},
  {id: 'sk-prog', name: 'Programming', category: 'Programming'},
  {id: 'sk-02', name: 'Figma', category: 'Design'},
  {id: 'sk-03', name: 'Graphic Design', category: 'Design'},
  {id: 'sk-04', name: 'Frontend Development', category: 'Programming'},
  {id: 'sk-05', name: 'Backend Development', category: 'Programming'},
  {id: 'sk-06', name: 'JavaScript', category: 'Programming'},
  {id: 'sk-07', name: 'TypeScript', category: 'Programming'},
  {id: 'sk-08', name: 'React', category: 'Programming'},
  {id: 'sk-09', name: 'Next.js', category: 'Programming'},
  {id: 'sk-11', name: 'Flutter', category: 'Programming'},
  {id: 'sk-13', name: 'SQL', category: 'Data'},
  {id: 'sk-15', name: 'Data Analysis', category: 'Data'},
  {id: 'sk-16', name: 'Research', category: 'Research'},
  {id: 'sk-17', name: 'Academic Writing', category: 'Research'},
  {id: 'sk-18', name: 'Presentation', category: 'Communication'},
  {id: 'sk-19', name: 'Public Speaking', category: 'Communication'},
  {id: 'sk-21', name: 'Pitching', category: 'Business'},
  {id: 'sk-22', name: 'Marketing', category: 'Business'},
  {id: 'sk-24', name: 'Video Editing', category: 'Media'},
];

// 04. INTEREST CATALOG (Canonical 04_SEED_CATALOGS.sql + Fahrin Profile Interests)
export const INITIAL_INTERESTS: Interest[] = [
  {id: 'in-16', name: 'Gaming'},
  {id: 'in-01', name: 'Tech'},
  {id: 'in-collab', name: 'Project Collab'},
  {id: 'in-learn', name: 'Learning'},
  {id: 'in-02', name: 'Innovation'},
  {id: 'in-03', name: 'Web Development'},
  {id: 'in-04', name: 'Mobile Apps'},
  {id: 'in-05', name: 'Artificial Intelligence'},
  {id: 'in-06', name: 'Data Science'},
  {id: 'in-07', name: 'Hackathon'},
  {id: 'in-08', name: 'Entrepreneurship'},
  {id: 'in-09', name: 'Sustainability'},
  {id: 'in-11', name: 'Environment'},
  {id: 'in-12', name: 'Community Service'},
  {id: 'in-13', name: 'Research'},
  {id: 'in-14', name: 'Design'},
  {id: 'in-15', name: 'Business'},
];

// 01. PROFILES (Normalized UMS student & organizer profiles)
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-aiman',
    display_name: 'Fahrin',
    matric_no: 'A2412345',
    faculty: 'Fakulti Komputeran dan Informatik (FKI), UMS',
    faculty_short: 'FKI',
    programme: 'Software Engineering',
    year_of_study: 2,
    location: 'Kota Kinabalu',
    availability_status: 'Available',
    role_mode: 'STUDENT',
    bio: "SE student at UMS who's passionate about building practical and impactful projects, especially in web and app development. Always open to collaborate and learn new things!",
    avatar_url: null,
    avatar_variant: 0,
    weekly_hours: 14,
    preferred_project_types: ['Competition', 'Innovation', 'Assignment'],
    active_filter_tags: [
      'Programming',
      'Planning',
      'Database',
      'Extrovert',
      'Female only',
    ],
    email: 'fahrin.a2412345@student.ums.edu.my',
    phone: '+60 13-884 2412',
    linkedin: 'linkedin.com/in/fahrin-ums-fki',
    discoverable: true,
    consent_at: '2026-10-15T08:30:00Z',
    created_at: '2026-10-15T08:30:00Z',
    updated_at: '2026-11-04T10:15:00Z',
    is_fictional_test_account: true,
  },
  {
    id: 'usr-izzah',
    display_name: 'Nurul Izzah',
    matric_no: 'A2411089',
    faculty: 'Fakulti Komputeran dan Informatik (FKI), UMS',
    faculty_short: 'FKI',
    programme: 'Data Science',
    year_of_study: 2,
    location: 'Kota Kinabalu',
    availability_status: 'Available',
    role_mode: 'STUDENT',
    bio: 'Passionate about Python data pipelines, human-centered UI/UX design in Figma, and sustainability research across Sabah.',
    avatar_url: null,
    weekly_hours: 12,
    preferred_project_types: ['Innovation', 'Competition', 'Community'],
    active_filter_tags: ['Programming', 'Database', 'Female only'],
    email: 'izzah.a2411089@student.ums.edu.my',
    phone: '+60 19-821 4401',
    linkedin: 'linkedin.com/in/nurul-izzah-fki',
    discoverable: true,
    consent_at: '2026-10-16T09:00:00Z',
    created_at: '2026-10-16T09:00:00Z',
    updated_at: '2026-11-02T14:20:00Z',
    is_fictional_test_account: true,
  },
  {
    id: 'usr-daniel',
    display_name: 'Daniel Wong',
    matric_no: 'A2310452',
    faculty: 'Faculty of Engineering (FKJ)',
    faculty_short: 'FKJ',
    programme: 'Electrical & Electronics Engineering',
    year_of_study: 3,
    location: 'Kota Kinabalu',
    availability_status: 'In Team',
    role_mode: 'ORGANIZER',
    bio: 'Embedded systems & full-stack prototyper. Organizer for FKI TechFest 2026 and hardware-software integration competitions.',
    avatar_url: null,
    weekly_hours: 10,
    preferred_project_types: ['Competition', 'Innovation'],
    active_filter_tags: ['Programming', 'Planning', 'Extrovert'],
    email: 'daniel.a2310452@student.ums.edu.my',
    phone: '+60 16-833 9012',
    linkedin: 'linkedin.com/in/daniel-wong-ums',
    discoverable: true,
    consent_at: '2026-10-18T11:00:00Z',
    created_at: '2026-10-18T11:00:00Z',
    updated_at: '2026-11-02T16:00:00Z',
    is_admin: true,
    is_fictional_test_account: true,
  },
  {
    id: 'usr-farah',
    display_name: 'Farah Syuhada',
    matric_no: 'A2312091',
    faculty: 'Faculty of Business, Economics and Accountancy (FPEP)',
    faculty_short: 'FPEP',
    programme: 'Marketing',
    year_of_study: 3,
    location: 'Kota Kinabalu',
    availability_status: 'Available',
    role_mode: 'STUDENT',
    bio: 'Focusing on social enterprise pitch decks, user research, market validation, and video storytelling for student competitions.',
    avatar_url: null,
    weekly_hours: 9,
    preferred_project_types: ['Competition', 'Innovation', 'Community'],
    discoverable: true,
    consent_at: '2026-10-20T07:45:00Z',
    created_at: '2026-10-20T07:45:00Z',
    updated_at: '2026-11-01T09:10:00Z',
    is_fictional_test_account: true,
  },
  {
    id: 'usr-keith',
    display_name: 'Keith Liew',
    matric_no: 'A2210884',
    faculty: 'Faculty of Science and Natural Resources (FSSA)',
    faculty_short: 'FSSA',
    programme: 'Environmental Science',
    year_of_study: 4,
    location: 'Kota Kinabalu',
    availability_status: 'Available',
    role_mode: 'ORGANIZER',
    bio: 'Final-year researcher working on Borneo marine & terrestrial conservation datasets, statistical analysis, and academic writing.',
    avatar_url: null,
    weekly_hours: 8,
    preferred_project_types: ['Innovation', 'Community', 'Other'],
    discoverable: true,
    consent_at: '2026-10-21T13:15:00Z',
    created_at: '2026-10-21T13:15:00Z',
    updated_at: '2026-11-01T13:15:00Z',
    is_fictional_test_account: true,
  },
];

// 03. STUDENT_SKILLS (Normalized many-to-many skill records)
// Fahrin (usr-aiman) has the exact 7 skills from the Profile screenshot: C, Java, Python, Web Development, UI/UX, Database, Git & GitHub
export const INITIAL_STUDENT_SKILLS: StudentSkill[] = [
  // Fahrin (usr-aiman)
  {student_id: 'usr-aiman', skill_id: 'sk-c', proficiency: 'intermediate'},
  {student_id: 'usr-aiman', skill_id: 'sk-java', proficiency: 'intermediate'},
  {student_id: 'usr-aiman', skill_id: 'sk-10', proficiency: 'advanced'}, // Python
  {student_id: 'usr-aiman', skill_id: 'sk-web', proficiency: 'advanced'}, // Web Development
  {student_id: 'usr-aiman', skill_id: 'sk-01', proficiency: 'beginner'}, // UI/UX
  {student_id: 'usr-aiman', skill_id: 'sk-14', proficiency: 'beginner'}, // Database
  {student_id: 'usr-aiman', skill_id: 'sk-git', proficiency: 'advanced'}, // Git & GitHub
  // Nurul Izzah
  {student_id: 'usr-izzah', skill_id: 'sk-01', proficiency: 'advanced'},
  {student_id: 'usr-izzah', skill_id: 'sk-02', proficiency: 'advanced'},
  {student_id: 'usr-izzah', skill_id: 'sk-10', proficiency: 'advanced'},
  {student_id: 'usr-izzah', skill_id: 'sk-15', proficiency: 'intermediate'},
  {student_id: 'usr-izzah', skill_id: 'sk-web', proficiency: 'intermediate'},
  // Daniel Wong
  {student_id: 'usr-daniel', skill_id: 'sk-c', proficiency: 'advanced'},
  {student_id: 'usr-daniel', skill_id: 'sk-08', proficiency: 'intermediate'},
  {student_id: 'usr-daniel', skill_id: 'sk-05', proficiency: 'intermediate'},
  {student_id: 'usr-daniel', skill_id: 'sk-21', proficiency: 'advanced'},
  // Farah Syuhada
  {student_id: 'usr-farah', skill_id: 'sk-21', proficiency: 'advanced'},
  {student_id: 'usr-farah', skill_id: 'sk-22', proficiency: 'advanced'},
  {student_id: 'usr-farah', skill_id: 'sk-18', proficiency: 'advanced'},
  // Keith Liew
  {student_id: 'usr-keith', skill_id: 'sk-15', proficiency: 'advanced'},
  {student_id: 'usr-keith', skill_id: 'sk-16', proficiency: 'advanced'},
  {student_id: 'usr-keith', skill_id: 'sk-10', proficiency: 'intermediate'},
];

// 05. STUDENT_INTERESTS (Normalized many-to-many interest records)
// Fahrin (usr-aiman) has the exact 4 interests from the Profile screenshot: Gaming, Tech, Project Collab, Learning
export const INITIAL_STUDENT_INTERESTS: StudentInterest[] = [
  {student_id: 'usr-aiman', interest_id: 'in-16'}, // Gaming
  {student_id: 'usr-aiman', interest_id: 'in-01'}, // Tech
  {student_id: 'usr-aiman', interest_id: 'in-collab'}, // Project Collab
  {student_id: 'usr-aiman', interest_id: 'in-learn'}, // Learning

  {student_id: 'usr-izzah', interest_id: 'in-01'},
  {student_id: 'usr-izzah', interest_id: 'in-05'},
  {student_id: 'usr-izzah', interest_id: 'in-06'},
  {student_id: 'usr-izzah', interest_id: 'in-14'},

  {student_id: 'usr-daniel', interest_id: 'in-01'},
  {student_id: 'usr-daniel', interest_id: 'in-02'},
  {student_id: 'usr-daniel', interest_id: 'in-07'},

  {student_id: 'usr-farah', interest_id: 'in-02'},
  {student_id: 'usr-farah', interest_id: 'in-08'},
  {student_id: 'usr-farah', interest_id: 'in-12'},

  {student_id: 'usr-keith', interest_id: 'in-06'},
  {student_id: 'usr-keith', interest_id: 'in-09'},
  {student_id: 'usr-keith', interest_id: 'in-13'},
];

// 06. AVAILABILITY_SLOTS (Asia/Kuching local time)
export const INITIAL_AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  // Fahrin (usr-aiman)
  {id: 'av-1', student_id: 'usr-aiman', weekday: 3, start_time: '14:00', end_time: '17:00'},
  {id: 'av-2', student_id: 'usr-aiman', weekday: 5, start_time: '15:00', end_time: '18:00'},
  {id: 'av-3', student_id: 'usr-aiman', weekday: 6, start_time: '10:00', end_time: '12:30'},
  // Nurul Izzah
  {id: 'av-4', student_id: 'usr-izzah', weekday: 3, start_time: '14:00', end_time: '16:30'},
  {id: 'av-5', student_id: 'usr-izzah', weekday: 6, start_time: '10:00', end_time: '13:00'},
  // Daniel Wong
  {id: 'av-7', student_id: 'usr-daniel', weekday: 3, start_time: '15:00', end_time: '18:00'},
  {id: 'av-8', student_id: 'usr-daniel', weekday: 5, start_time: '15:00', end_time: '17:30'},
  // Farah Syuhada
  {id: 'av-10', student_id: 'usr-farah', weekday: 2, start_time: '16:00', end_time: '18:00'},
  {id: 'av-11', student_id: 'usr-farah', weekday: 6, start_time: '10:00', end_time: '13:00'},
  // Keith Liew
  {id: 'av-12', student_id: 'usr-keith', weekday: 3, start_time: '14:00', end_time: '16:00'},
  {id: 'av-13', student_id: 'usr-keith', weekday: 6, start_time: '09:00', end_time: '12:00'},
];

// 07. PROJECTS (Normalized projects with rich UMS metadata & WhatsApp Organizer contact)
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-techfest',
    owner_id: 'usr-daniel',
    title: 'FKI TechFest 2026',
    description:
      'Pameran projek, bengkel teknologi, dan pertandingan inovasi anjuran FKI UMS.',
    project_type: 'Competition',
    slots_needed: 4,
    min_weekly_hours: 6,
    status: 'open',
    deadline: '2026-11-14',
    date_display: '12 – 14 Nov 2026',
    location: 'Dewan Canselor, UMS',
    audience: 'Terbuka kepada semua pelajar UMS',
    badge_line_1: 'Program',
    badge_line_2: 'Fakulti',
    tags: ['Tech', 'Networking', 'Competition'],
    attribute_tags: ['Programming', 'Planning', 'Database', 'Extrovert'],
    trending: true,
    organizer_name: 'Daniel Wong (Jawatankuasa FKI TechFest)',
    organizer_phone: '+6012-883 4910',
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-04T06:00:00Z',
  },
  {
    id: 'prj-shuttle',
    owner_id: 'usr-aiman',
    title: 'Smart Shuttle UMS',
    description:
      'Pembangunan aplikasi telemetri bas kampus masa nyata antara Kolej Kediaman E dan blok kuliah FKI/FKJ UMS.',
    project_type: 'Innovation',
    slots_needed: 3,
    min_weekly_hours: 6,
    status: 'open',
    deadline: '2026-11-28',
    date_display: '18 – 28 Nov 2026',
    location: 'Kolej Kediaman E & FKI, UMS',
    audience: 'Terbuka kepada semua pelajar UMS',
    badge_line_1: 'Inovasi',
    badge_line_2: 'Kampus',
    tags: ['Tech', 'Networking', 'Competition'],
    attribute_tags: ['Programming', 'Database', 'Planning'],
    trending: true,
    organizer_name: 'Fahrin (Kelab Inovasi FKI)',
    organizer_phone: '+6013-880 2145',
    created_at: '2026-10-20T09:00:00Z',
    updated_at: '2026-11-02T11:30:00Z',
  },
  {
    id: 'prj-reef',
    owner_id: 'usr-keith',
    title: 'Borneo Reef AI 2026',
    description:
      'Analisis akustik terumbu karang Teluk Sepanggar menggunakan model pembelajaran mesin Python dan visualisasi web.',
    project_type: 'Competition',
    slots_needed: 2,
    min_weekly_hours: 5,
    status: 'open',
    deadline: '2026-12-10',
    date_display: '02 – 10 Dec 2026',
    location: 'Institut Penyelidikan Marin, UMS',
    audience: 'Terbuka kepada semua pelajar UMS',
    badge_line_1: 'Projek',
    badge_line_2: 'Rentas',
    tags: ['Tech', 'Networking', 'Competition'],
    attribute_tags: ['Programming', 'Database'],
    trending: true,
    organizer_name: 'Keith Liew (Penyelidik Muda FSSA)',
    organizer_phone: '+6019-851 7732',
    created_at: '2026-10-22T14:00:00Z',
    updated_at: '2026-11-01T16:45:00Z',
  },
  {
    id: 'prj-tamu',
    owner_id: 'usr-farah',
    title: 'Sabah Digital Tamu 2026',
    description:
      'Platform keusahawanan sosial menghubungkan petani kecil Kundasang dengan koperasi kampus UMS.',
    project_type: 'Community',
    slots_needed: 2,
    min_weekly_hours: 4,
    status: 'open',
    deadline: '2026-12-05',
    date_display: '01 – 05 Dec 2026',
    location: 'Pusat Keusahawanan FPEP, UMS',
    audience: 'Terbuka kepada semua pelajar UMS',
    badge_line_1: 'Komuniti',
    badge_line_2: 'Sabah',
    tags: ['Tech', 'Networking', 'Competition'],
    attribute_tags: ['Planning', 'Extrovert', 'Female only'],
    trending: false,
    organizer_name: 'Farah Syuhada (Komuniti Keusahawanan FPEP)',
    organizer_phone: '+6011-2640 9918',
    created_at: '2026-10-25T10:20:00Z',
    updated_at: '2026-11-02T08:15:00Z',
  },
  {
    id: 'prj-cybersec',
    owner_id: 'usr-daniel',
    title: 'Borneo CyberSec CTF 2026',
    description:
      'Pertandingan Capture The Flag (CTF) keselamatan siber dan bengkel pertahanan rangkaian peringkat universiti di Sabah.',
    project_type: 'Competition',
    slots_needed: 3,
    min_weekly_hours: 6,
    status: 'open',
    deadline: '2026-11-29',
    date_display: '27 – 29 Nov 2026',
    location: 'Makmal Keselamatan Siber FKI, UMS',
    audience: 'Terbuka kepada semua pelajar UMS',
    badge_line_1: 'Siber',
    badge_line_2: 'FKI UMS',
    tags: ['Tech', 'Networking', 'Competition'],
    attribute_tags: ['Programming', 'Database'],
    trending: true,
    organizer_name: 'Daniel Wong (Kelab Keselamatan Siber FKI)',
    organizer_phone: '+6016-832 5501',
    created_at: '2026-10-28T09:00:00Z',
    updated_at: '2026-11-03T10:00:00Z',
  },
  {
    id: 'prj-greeniot',
    owner_id: 'usr-izzah',
    title: 'Kinabalu Green Campus IoT',
    description:
      'Projek sensor pintar pemantauan kualiti udara dan tenaga solar sekitar perpustakaan dan kolej kediaman UMS.',
    project_type: 'Innovation',
    slots_needed: 4,
    min_weekly_hours: 5,
    status: 'open',
    deadline: '2026-12-12',
    date_display: '05 – 12 Dec 2026',
    location: 'Perpustakaan UMS & FKJ',
    audience: 'Terbuka kepada semua pelajar UMS',
    badge_line_1: 'Lestari',
    badge_line_2: 'Kampus',
    tags: ['Tech', 'Networking', 'Innovation'],
    attribute_tags: ['Programming', 'Planning', 'Database'],
    trending: false,
    organizer_name: 'Nurul Izzah (Jawatankuasa EcoCampus UMS)',
    organizer_phone: '+6014-679 3320',
    created_at: '2026-10-30T14:00:00Z',
    updated_at: '2026-11-03T15:00:00Z',
  },
];

// 08. PROJECT_REQUIRED_SKILLS
export const INITIAL_PROJECT_REQUIRED_SKILLS: ProjectRequiredSkill[] = [
  // prj-techfest (FKI TechFest 2026) — calibrated for real 40/25/20/15 formula
  {project_id: 'prj-techfest', skill_id: 'sk-web', mandatory: true, importance: 5}, // Web Development (Fahrin: advanced)
  {project_id: 'prj-techfest', skill_id: 'sk-14', mandatory: true, importance: 4}, // Database (Fahrin: advanced)
  {project_id: 'prj-techfest', skill_id: 'sk-01', mandatory: false, importance: 4}, // UI/UX (Fahrin: intermediate)
  {project_id: 'prj-techfest', skill_id: 'sk-20', mandatory: false, importance: 3}, // Planning
  // prj-shuttle
  {project_id: 'prj-shuttle', skill_id: 'sk-web', mandatory: true, importance: 5},
  {project_id: 'prj-shuttle', skill_id: 'sk-01', mandatory: true, importance: 4},
  {project_id: 'prj-shuttle', skill_id: 'sk-10', mandatory: false, importance: 4},
  {project_id: 'prj-shuttle', skill_id: 'sk-git', mandatory: false, importance: 3},
  // prj-reef
  {project_id: 'prj-reef', skill_id: 'sk-10', mandatory: true, importance: 5},
  {project_id: 'prj-reef', skill_id: 'sk-14', mandatory: false, importance: 4},
  {project_id: 'prj-reef', skill_id: 'sk-01', mandatory: false, importance: 3},
  // prj-tamu
  {project_id: 'prj-tamu', skill_id: 'sk-web', mandatory: false, importance: 5},
  {project_id: 'prj-tamu', skill_id: 'sk-01', mandatory: true, importance: 4},
  {project_id: 'prj-tamu', skill_id: 'sk-20', mandatory: false, importance: 4},
  // prj-cybersec
  {project_id: 'prj-cybersec', skill_id: 'sk-10', mandatory: true, importance: 5},
  {project_id: 'prj-cybersec', skill_id: 'sk-web', mandatory: false, importance: 4},
  {project_id: 'prj-cybersec', skill_id: 'sk-14', mandatory: false, importance: 4},
  // prj-greeniot
  {project_id: 'prj-greeniot', skill_id: 'sk-10', mandatory: false, importance: 4},
  {project_id: 'prj-greeniot', skill_id: 'sk-web', mandatory: true, importance: 4},
  {project_id: 'prj-greeniot', skill_id: 'sk-20', mandatory: false, importance: 4},
];

// 09. PROJECT_INTERESTS
export const INITIAL_PROJECT_INTERESTS: ProjectInterest[] = [
  // prj-techfest (3 of 4 shared with Fahrin -> 19/25 interest score)
  {project_id: 'prj-techfest', interest_id: 'in-01'}, // Tech
  {project_id: 'prj-techfest', interest_id: 'in-collab'}, // Project Collab
  {project_id: 'prj-techfest', interest_id: 'in-learn'}, // Learning
  {project_id: 'prj-techfest', interest_id: 'in-07'}, // Hackathon

  // prj-shuttle
  {project_id: 'prj-shuttle', interest_id: 'in-01'},
  {project_id: 'prj-shuttle', interest_id: 'in-collab'},
  {project_id: 'prj-shuttle', interest_id: 'in-learn'},

  // prj-reef
  {project_id: 'prj-reef', interest_id: 'in-01'},
  {project_id: 'prj-reef', interest_id: 'in-learn'},
  {project_id: 'prj-reef', interest_id: 'in-06'},

  // prj-tamu
  {project_id: 'prj-tamu', interest_id: 'in-collab'},
  {project_id: 'prj-tamu', interest_id: 'in-08'},
  {project_id: 'prj-tamu', interest_id: 'in-12'},

  // prj-cybersec
  {project_id: 'prj-cybersec', interest_id: 'in-01'},
  {project_id: 'prj-cybersec', interest_id: 'in-learn'},

  // prj-greeniot
  {project_id: 'prj-greeniot', interest_id: 'in-01'},
  {project_id: 'prj-greeniot', interest_id: 'in-collab'},
];

// 10. PROJECT_MEETING_SLOTS
export const INITIAL_PROJECT_MEETING_SLOTS: ProjectMeetingSlot[] = [
  // prj-techfest: 6h total (Wed 14:00-17:00 = 3h, Sat 10:00-13:00 = 3h). Fahrin overlaps 5.5h -> 16/20 schedule score
  {id: 'ms-0', project_id: 'prj-techfest', weekday: 3, start_time: '14:00', end_time: '17:00'},
  {id: 'ms-0b', project_id: 'prj-techfest', weekday: 6, start_time: '10:00', end_time: '13:30'},

  {id: 'ms-1', project_id: 'prj-shuttle', weekday: 3, start_time: '14:30', end_time: '16:30'},
  {id: 'ms-2', project_id: 'prj-shuttle', weekday: 6, start_time: '10:00', end_time: '12:00'},

  {id: 'ms-3', project_id: 'prj-reef', weekday: 3, start_time: '14:00', end_time: '16:00'},
  {id: 'ms-4', project_id: 'prj-reef', weekday: 6, start_time: '10:00', end_time: '12:00'},

  {id: 'ms-5', project_id: 'prj-tamu', weekday: 6, start_time: '10:30', end_time: '12:30'},
  {id: 'ms-6', project_id: 'prj-cybersec', weekday: 5, start_time: '15:00', end_time: '18:00'},
  {id: 'ms-7', project_id: 'prj-greeniot', weekday: 3, start_time: '14:00', end_time: '16:30'},
];

// 11. APPLICATIONS
export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-01',
    project_id: 'prj-shuttle',
    applicant_id: 'usr-farah',
    note: 'Hi! Saya dari FPEP ingin membantu bahagian kajian pengguna & pembentangan inovasi.',
    status: 'pending',
    created_at: '2026-11-02T11:20:00Z',
    responded_at: null,
  },
];

// 12. PROJECT_MEMBERS
export const INITIAL_PROJECT_MEMBERS: ProjectMember[] = [
  {
    project_id: 'prj-techfest',
    student_id: 'usr-daniel',
    member_role: 'owner',
    membership_status: 'active',
    joined_at: '2026-11-01T08:00:00Z',
  },
  {
    project_id: 'prj-shuttle',
    student_id: 'usr-aiman',
    member_role: 'owner',
    membership_status: 'active',
    joined_at: '2026-10-20T09:00:00Z',
  },
  {
    project_id: 'prj-shuttle',
    student_id: 'usr-izzah',
    member_role: 'member',
    membership_status: 'active',
    joined_at: '2026-10-26T14:00:00Z',
  },
  {
    project_id: 'prj-reef',
    student_id: 'usr-keith',
    member_role: 'owner',
    membership_status: 'active',
    joined_at: '2026-10-22T14:00:00Z',
  },
  {
    project_id: 'prj-tamu',
    student_id: 'usr-farah',
    member_role: 'owner',
    membership_status: 'active',
    joined_at: '2026-10-25T10:20:00Z',
  },
];

// 13. PROJECT_INVITATIONS
export const INITIAL_PROJECT_INVITATIONS: ProjectInvitation[] = [
  {
    id: 'inv-01',
    project_id: 'prj-techfest',
    inviter_id: 'usr-daniel',
    invitee_id: 'usr-aiman',
    note: 'Salam Fahrin! Profil Web Development & Database anda mendapat padanan 78% (High Match) untuk pasukan pameran utama FKI TechFest 2026. Jom sertai kami!',
    status: 'pending',
    created_at: '2026-11-03T16:40:00Z',
    responded_at: null,
  },
];

// 14. NOTIFICATIONS (4 notifications for Fahrin matching the badge "4" in the Side Menu)
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    recipient_id: 'usr-aiman',
    event_type: 'high_match_alert',
    target_type: 'project',
    target_id: 'prj-techfest',
    title: 'FKI TechFest 2026 — High Match (78%)',
    body: 'Aktiviti ini sepadan 78% dengan kemahiran Web Development, Database, dan jadual kuliah anda.',
    read_at: null,
    created_at: '2026-11-04T08:30:00Z',
  },
  {
    id: 'notif-02',
    recipient_id: 'usr-aiman',
    event_type: 'project_invitation',
    target_type: 'invitation',
    target_id: 'inv-01',
    title: 'Jemputan Pasukan FKI TechFest 2026',
    body: 'Daniel Wong menjemput anda menyertai pasukan pameran inovasi di Dewan Canselor UMS.',
    read_at: null,
    created_at: '2026-11-03T16:40:00Z',
  },
  {
    id: 'notif-03',
    recipient_id: 'usr-aiman',
    event_type: 'sdp_points_verified',
    target_type: 'project',
    target_id: 'prj-shuttle',
    title: 'Mata SDP Dikemas Kini (SDP: 500)',
    body: 'Rekod penyertaan FKI TechFest 2025 & HackUMS 2025 anda telah disahkan oleh FKI UMS.',
    read_at: null,
    created_at: '2026-11-02T11:20:00Z',
  },
  {
    id: 'notif-04',
    recipient_id: 'usr-aiman',
    event_type: 'team_workspace_update',
    target_type: 'project',
    target_id: 'prj-shuttle',
    title: 'Mesej Baharu dalam Pasukan Smart Shuttle',
    body: 'Nurul Izzah telah memuat naik reka bentuk UI/UX baharu untuk semakan.',
    read_at: null,
    created_at: '2026-11-01T15:10:00Z',
  },
];

// 15. BETA_TEST_RESULTS
export const INITIAL_BETA_RESULTS: BetaTestResult[] = [
  {
    id: 'bt-01',
    tester_id: 'usr-aiman',
    task_code: 'T01',
    success: true,
    duration_seconds: 85,
    difficulty_1_to_5: 1,
    comment: 'Profile & availability slot setup completed smoothly.',
    created_at: '2026-11-01T09:00:00Z',
  },
];

// Extension 16: PROJECT_TASKS
export const INITIAL_PROJECT_TASKS: ProjectTask[] = [
  {
    id: 'tsk-01',
    project_id: 'prj-techfest',
    creator_id: 'usr-daniel',
    assignee_id: 'usr-aiman',
    title: 'Sediakan prototaip Web & pangkalan data untuk gerai pameran FKI',
    description: 'Pastikan integrasi API dan paparan responsif siap sebelum 12 Nov 2026.',
    priority: 'high',
    status: 'in_progress',
    due_at: '2026-11-11',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-04T09:00:00Z',
  },
];

// Extension 17: PROJECT_MESSAGES (2 messages matching the badge "2" in the Side Menu)
export const INITIAL_PROJECT_MESSAGES: ProjectMessage[] = [
  {
    id: 'msg-01',
    project_id: 'prj-techfest',
    sender_id: 'usr-izzah',
    body: 'Salam Fahrin! Jom sertai kumpulan kami untuk FKI TechFest 2026 bahagian Web & Database?',
    created_at: '2026-11-04T14:15:00Z',
    edited_at: null,
  },
  {
    id: 'msg-02',
    project_id: 'prj-techfest',
    sender_id: 'usr-daniel',
    body: 'Kami perlukan seorang lagi pembangun Frontend & Database untuk pameran di Dewan Canselor.',
    created_at: '2026-11-03T18:22:00Z',
    edited_at: null,
  },
];

// Extension 18: SAVED_PROJECTS
export const INITIAL_SAVED_PROJECTS: SavedProject[] = [
  {
    student_id: 'usr-aiman',
    project_id: 'prj-reef',
    saved_at: '2026-11-01T12:00:00Z',
  },
];

// Extension 19: REPORTS
export const INITIAL_REPORTS: ModerationReport[] = [];

// Extension 20: STUDENT_ACTIVITY_HISTORY (Exact 4 past activities on Fahrin's Profile card totaling 500 SDP)
export const INITIAL_ACTIVITY_HISTORY: StudentActivityHistory[] = [
  {
    id: 'hist-1',
    student_id: 'usr-aiman',
    project_id: 'prj-techfest',
    title: 'FKI TechFest 2025',
    date_display: '15 – 17 Nov 2025',
    role: 'Exco Teknikal & Peserta Pameran',
    sdp_earned: 150,
    summary:
      'Mempamerkan prototaip aplikasi kampus pintar dan menguruskan bengkel pembangunan web moden di Dewan Canselor UMS.',
    completed_at: '2025-11-17T18:00:00Z',
  },
  {
    id: 'hist-2',
    student_id: 'usr-aiman',
    project_id: null,
    title: 'UMS Open Day',
    date_display: '28 – 29 Sep 2025',
    role: 'Sukarelawan Duta Mahasiswa FKI',
    sdp_earned: 120,
    summary:
      'Membantu sesi taklimat pelawat dan demonstrasi projek pelajar Kejuruteraan Perisian kepada pelajar sekolah menengah Sabah.',
    completed_at: '2025-09-29T17:00:00Z',
  },
  {
    id: 'hist-3',
    student_id: 'usr-aiman',
    project_id: null,
    title: 'HackUMS 2025',
    date_display: '12 – 14 Jul 2025',
    role: 'Finalis Top 5 (Full-Stack Developer)',
    sdp_earned: 150,
    summary:
      'Membangunkan sistem pemantauan jadual bas kampus bersama pasukan 4 pelajar FKI dalam tempoh 48 jam.',
    completed_at: '2025-07-14T16:00:00Z',
  },
  {
    id: 'hist-4',
    student_id: 'usr-aiman',
    project_id: null,
    title: 'Web Dev Workshop',
    date_display: '21 Jun 2025',
    role: 'Peserta & Fasilitator Kumpulan',
    sdp_earned: 80,
    summary:
      'Bengkel intensif React, Next.js, TypeScript, dan Git & GitHub anjuran Persatuan Mahasiswa FKI (PMFKI).',
    completed_at: '2025-06-21T16:30:00Z',
  },
];
