import {
  Application,
  AvailabilitySlot,
  BetaTestResult,
  Interest,
  ModerationReport,
  NotificationItem,
  Profile,
  Project,
  ProjectGalleryItem,
  ProjectInterest,
  ProjectInvitation,
  ProjectMeetingSlot,
  ProjectMember,
  ProjectMessage,
  ProjectRequiredSkill,
  ProjectTask,
  SavedProject,
  Skill,
  StudentActivityHistory,
  StudentInterest,
  StudentSkill,
} from './types';

export const UMS_FACULTIES = [
  'Fakulti Komputeran dan Informatik (FKI), UMS',
  'Faculty of Engineering (FKJ)',
  'Faculty of Business, Economics and Accountancy (FPEP)',
  'Faculty of Science and Natural Resources (FSSA)',
  'Faculty of Psychology and Education (FPP)',
  'Faculty of Medicine and Health Sciences (FPSK)',
  'Faculty of Social Sciences and Humanities (FSSK)',
  'Faculty of Food Science and Nutrition (FSMP)',
  'Faculty of Sustainable Agriculture (FPL)',
  'Labuan Faculty of International Finance (FKAL)',
];

export const UMS_FACULTY_CODES = [
  'All',
  'FKI',
  'FKJ',
  'FPEP',
  'FSSA',
  'FPSK',
  'FSSK',
  'FPP',
  'FSMP',
  'FPL',
  'FKAL',
] as const;

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

// No pre-seeded example gallery images — activities only show images uploaded by their author
export function getDefaultGalleryForProject(
  _projectId: string,
  _title?: string,
  _location?: string,
  _dateDisplay?: string
): ProjectGalleryItem[] {
  return [];
}

// ============================================================
// OFFICIAL PREDETERMINED TAXONOMY CATEGORIES & TAGS
// ============================================================
export const SKILL_CATEGORIES = [
  'Tech & AI (FKI)',
  'Engineering & IoT (FKJ)',
  'Science, Marine & Agro (FSSA/FPL)',
  'Business & Finance (FPEP/FKAL)',
  'Health, Food & Psychology (FPSK/FSMP/FPP)',
  'Creative, Media & Arts (FSSK)',
  'Leadership & Operations',
  'Academic & Research',
] as const;

export const INTEREST_CATEGORIES = [
  'Teknologi & Inovasi',
  'Sains, Marin & Kelestarian',
  'Keusahawanan & Kewangan',
  'Kesihatan, Pendidikan & CSR',
  'Seni, Budaya & Sukan',
] as const;

export interface OfficialFilterTagItem {
  id: string;
  label: string;
  group: 'Kemahiran & Bidang' | 'Gaya Kerja & Pasukan';
}

export const OFFICIAL_FILTER_TAGS: OfficialFilterTagItem[] = [
  {id: 'Programming', label: 'Programming', group: 'Kemahiran & Bidang'},
  {id: 'Planning', label: 'Planning', group: 'Kemahiran & Bidang'},
  {id: 'Database', label: 'Database', group: 'Kemahiran & Bidang'},
  {id: 'UI/UX Design', label: 'UI/UX Design', group: 'Kemahiran & Bidang'},
  {id: 'AI & Data', label: 'AI & Data', group: 'Kemahiran & Bidang'},
  {
    id: 'Engineering & IoT',
    label: 'Engineering & IoT',
    group: 'Kemahiran & Bidang',
  },
  {id: 'Sains & Marin', label: 'Sains & Marin', group: 'Kemahiran & Bidang'},
  {
    id: 'Perniagaan & Tajaan',
    label: 'Perniagaan & Tajaan',
    group: 'Kemahiran & Bidang',
  },
  {
    id: 'Kesihatan & Komuniti',
    label: 'Kesihatan & Komuniti',
    group: 'Kemahiran & Bidang',
  },
  {
    id: 'Media & Kreatif',
    label: 'Media & Kreatif',
    group: 'Kemahiran & Bidang',
  },
  {id: 'Penyelidikan', label: 'Penyelidikan', group: 'Kemahiran & Bidang'},
  {
    id: 'Beginner Friendly',
    label: 'Beginner Friendly',
    group: 'Gaya Kerja & Pasukan',
  },
  {id: 'Rentas Fakulti', label: 'Rentas Fakulti', group: 'Gaya Kerja & Pasukan'},
  {id: 'Kerja Lapangan', label: 'Kerja Lapangan', group: 'Gaya Kerja & Pasukan'},
  {
    id: 'Fleksibel / Hibrid',
    label: 'Fleksibel / Hibrid',
    group: 'Gaya Kerja & Pasukan',
  },
  {id: 'Extrovert', label: 'Extrovert', group: 'Gaya Kerja & Pasukan'},
  {id: 'Female only', label: 'Female only', group: 'Gaya Kerja & Pasukan'},
];

export const OFFICIAL_CARD_HIGHLIGHT_TAGS: string[] = [
  'AI & Tech',
  'Smart Campus',
  'IoT & Robotics',
  'UI/UX & Web',
  'Cybersecurity',
  'Data & Cloud',
  'Marine & Eco',
  'AgriTech',
  'Startup & Pitch',
  'Finance & Biz',
  'Health & Care',
  'Food & Nutrition',
  'Psychology & Edu',
  'Media & Creative',
  'Culture & Arts',
  'Community CSR',
  'Research & Lab',
  'Networking',
  'Teamwork',
  'Fieldwork',
  'SDP Tinggi',
  'Competition',
  'Innovation',
  'Community',
  'Assignment',
];

// ============================================================
// 1. OFFICIAL PREDETERMINED SKILLS CATALOG (Covers All UMS Fields)
// ============================================================
export const INITIAL_SKILLS: Skill[] = [
  // Tech & AI (FKI)
  {
    id: 'sk-web-mobile',
    name: 'Web & Mobile Dev (React / Next.js)',
    category: 'Tech & AI (FKI)',
  },
  {
    id: 'sk-python-ai',
    name: 'Python & Machine Learning',
    category: 'Tech & AI (FKI)',
  },
  {
    id: 'sk-uiux-figma',
    name: 'UI/UX & Figma Prototyping',
    category: 'Tech & AI (FKI)',
  },
  {
    id: 'sk-database-sql',
    name: 'Database & SQL Architecture',
    category: 'Tech & AI (FKI)',
  },
  {
    id: 'sk-cybersecurity',
    name: 'Cybersecurity & Network Audit',
    category: 'Tech & AI (FKI)',
  },
  {
    id: 'sk-data-analytics',
    name: 'Data Analytics & Dashboard',
    category: 'Tech & AI (FKI)',
  },

  // Engineering & IoT (FKJ)
  {
    id: 'sk-iot-embedded',
    name: 'IoT & Embedded Systems (ESP32 / Arduino)',
    category: 'Engineering & IoT (FKJ)',
  },
  {
    id: 'sk-cad-3d',
    name: 'CAD & 3D Prototyping',
    category: 'Engineering & IoT (FKJ)',
  },
  {
    id: 'sk-robotics',
    name: 'Robotics & Mechatronics',
    category: 'Engineering & IoT (FKJ)',
  },
  {
    id: 'sk-electronics',
    name: 'Electronics & Sensor Hardware',
    category: 'Engineering & IoT (FKJ)',
  },
  {
    id: 'sk-renewable-civil',
    name: 'Renewable Energy & Green Engineering',
    category: 'Engineering & IoT (FKJ)',
  },

  // Science, Marine & Agro (FSSA/FPL)
  {
    id: 'sk-marine-survey',
    name: 'Marine & Reef Field Survey',
    category: 'Science, Marine & Agro (FSSA/FPL)',
  },
  {
    id: 'sk-lab-analysis',
    name: 'Laboratory Sampling & Bio-Assay',
    category: 'Science, Marine & Agro (FSSA/FPL)',
  },
  {
    id: 'sk-gis-mapping',
    name: 'GIS & Environmental Mapping',
    category: 'Science, Marine & Agro (FSSA/FPL)',
  },
  {
    id: 'sk-sustainable-agro',
    name: 'Sustainable Crop & AgriTech',
    category: 'Science, Marine & Agro (FSSA/FPL)',
  },

  // Business & Finance (FPEP/FKAL)
  {
    id: 'sk-biz-pitching',
    name: 'Business Model & Startup Pitching',
    category: 'Business & Finance (FPEP/FKAL)',
  },
  {
    id: 'sk-finance-acct',
    name: 'Financial Budgeting & Accounting',
    category: 'Business & Finance (FPEP/FKAL)',
  },
  {
    id: 'sk-digital-mkt',
    name: 'Digital Marketing & Social Growth',
    category: 'Business & Finance (FPEP/FKAL)',
  },
  {
    id: 'sk-sponsorship',
    name: 'Corporate Sponsorship & PR',
    category: 'Business & Finance (FPEP/FKAL)',
  },

  // Health, Food & Psychology (FPSK/FSMP/FPP)
  {
    id: 'sk-health-firstaid',
    name: 'First Aid & Community Health Screening',
    category: 'Health, Food & Psychology (FPSK/FSMP/FPP)',
  },
  {
    id: 'sk-food-nutrition',
    name: 'Food Safety & Nutrition Analysis',
    category: 'Health, Food & Psychology (FPSK/FSMP/FPP)',
  },
  {
    id: 'sk-peer-counseling',
    name: 'Peer Support & Psychosocial Facilitation',
    category: 'Health, Food & Psychology (FPSK/FSMP/FPP)',
  },
  {
    id: 'sk-stem-teaching',
    name: 'Educational Mentoring & Workshop Module',
    category: 'Health, Food & Psychology (FPSK/FSMP/FPP)',
  },

  // Creative, Media & Arts (FSSK)
  {
    id: 'sk-graphic-poster',
    name: 'Graphic Design & Visual Branding',
    category: 'Creative, Media & Arts (FSSK)',
  },
  {
    id: 'sk-photo-video',
    name: 'Photography & Documentary Videography',
    category: 'Creative, Media & Arts (FSSK)',
  },
  {
    id: 'sk-video-editing',
    name: 'Video Editing & Motion Graphics',
    category: 'Creative, Media & Arts (FSSK)',
  },
  {
    id: 'sk-copywriting-mc',
    name: 'Copywriting, Journalism & Emcee',
    category: 'Creative, Media & Arts (FSSK)',
  },

  // Leadership & Operations
  {
    id: 'sk-event-planning',
    name: 'Project Management & Event Planning',
    category: 'Leadership & Operations',
  },
  {
    id: 'sk-logistics-ops',
    name: 'Campus Logistics, Venue & Protocol',
    category: 'Leadership & Operations',
  },
  {
    id: 'sk-secretary-doc',
    name: 'Secretarial, Paperwork & JHEP Proposal',
    category: 'Leadership & Operations',
  },
  {
    id: 'sk-community-csr',
    name: 'Community Engagement & Volunteer Ops',
    category: 'Leadership & Operations',
  },

  // Academic & Research
  {
    id: 'sk-academic-writing',
    name: 'Academic Writing & Literature Review',
    category: 'Academic & Research',
  },
  {
    id: 'sk-stats-spss',
    name: 'Statistical Analysis (SPSS / R)',
    category: 'Academic & Research',
  },
  {
    id: 'sk-debate-speaking',
    name: 'Public Speaking, Presentation & Debate',
    category: 'Academic & Research',
  },
];

// ============================================================
// 2. OFFICIAL PREDETERMINED INTERESTS (MINAT) CATALOG
// ============================================================
export const INITIAL_INTERESTS: Interest[] = [
  // Teknologi & Inovasi
  {
    id: 'in-ai-ml',
    name: 'Artificial Intelligence (AI)',
    category: 'Teknologi & Inovasi',
  },
  {
    id: 'in-hackathon',
    name: 'Hackathon & Software Building',
    category: 'Teknologi & Inovasi',
  },
  {
    id: 'in-smart-iot',
    name: 'Smart Campus, Robotics & IoT',
    category: 'Teknologi & Inovasi',
  },
  {
    id: 'in-cyber-cloud',
    name: 'Cybersecurity & Cloud Systems',
    category: 'Teknologi & Inovasi',
  },
  {
    id: 'in-gamedev-esports',
    name: 'Game Development & Esports',
    category: 'Teknologi & Inovasi',
  },

  // Sains, Marin & Kelestarian
  {
    id: 'in-marine-reef',
    name: 'Marine & Coral Conservation',
    category: 'Sains, Marin & Kelestarian',
  },
  {
    id: 'in-climate-sdg',
    name: 'Climate Action & Campus SDG',
    category: 'Sains, Marin & Kelestarian',
  },
  {
    id: 'in-biotech-lab',
    name: 'Biotechnology & Natural Sciences',
    category: 'Sains, Marin & Kelestarian',
  },
  {
    id: 'in-agritech-food',
    name: 'Sustainable Farming & Food Security',
    category: 'Sains, Marin & Kelestarian',
  },
  {
    id: 'in-renewable-energy',
    name: 'Solar & Clean Energy',
    category: 'Sains, Marin & Kelestarian',
  },

  // Keusahawanan & Kewangan
  {
    id: 'in-startup-biz',
    name: 'Startup & Social Entrepreneurship',
    category: 'Keusahawanan & Kewangan',
  },
  {
    id: 'in-fintech-finance',
    name: 'International Finance & FinTech',
    category: 'Keusahawanan & Kewangan',
  },
  {
    id: 'in-digital-commerce',
    name: 'E-Commerce & Digital Branding',
    category: 'Keusahawanan & Kewangan',
  },
  {
    id: 'in-career-industry',
    name: 'Industry Networking & Leadership',
    category: 'Keusahawanan & Kewangan',
  },

  // Kesihatan, Pendidikan & CSR
  {
    id: 'in-rural-csr',
    name: 'Sabah Rural Community Outreach (CSR)',
    category: 'Kesihatan, Pendidikan & CSR',
  },
  {
    id: 'in-mental-health',
    name: 'Mental Health & Student Wellbeing',
    category: 'Kesihatan, Pendidikan & CSR',
  },
  {
    id: 'in-public-health',
    name: 'Public Health & Clinical Volunteering',
    category: 'Kesihatan, Pendidikan & CSR',
  },
  {
    id: 'in-nutrition-halal',
    name: 'Healthy Diet & Food Innovation',
    category: 'Kesihatan, Pendidikan & CSR',
  },
  {
    id: 'in-stem-mentoring',
    name: 'School STEM & Literacy Mentoring',
    category: 'Kesihatan, Pendidikan & CSR',
  },

  // Seni, Budaya & Sukan
  {
    id: 'in-borneo-heritage',
    name: 'Borneo Culture, Tamu & Heritage',
    category: 'Seni, Budaya & Sukan',
  },
  {
    id: 'in-film-photography',
    name: 'Creative Media, Film & Photography',
    category: 'Seni, Budaya & Sukan',
  },
  {
    id: 'in-debate-mun',
    name: 'Debate, Diplomacy & Public Speaking',
    category: 'Seni, Budaya & Sukan',
  },
  {
    id: 'in-sports-outdoor',
    name: 'Outdoor Expedition & Campus Sports',
    category: 'Seni, Budaya & Sukan',
  },
];

// ============================================================
// 3. PROFILES (System Admin: Fahrin Muneer — fahrinmuneer3@gmail.com)
// ============================================================
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-admin',
    display_name: 'Fahrin Muneer',
    matric_no: 'A2412345',
    faculty: 'Fakulti Komputeran dan Informatik (FKI), UMS',
    faculty_short: 'FKI',
    programme: 'Software Engineering',
    year_of_study: 2,
    location: 'Kota Kinabalu',
    availability_status: 'Available',
    role: 'admin',
    role_mode: 'ORGANIZER',
    bio: 'Pentadbir Sistem (System Admin) ProjectLink UMS. Pelajar Kejuruteraan Perisian FKI yang aktif dalam pembangunan aplikasi kampus pintar dan kolaborasi rentas fakulti.',
    avatar_url: null,
    avatar_variant: 0,
    weekly_hours: 15,
    preferred_project_types: [
      'Competition',
      'Innovation',
      'Community',
      'Assignment',
    ],
    active_filter_tags: ['Programming', 'Planning', 'AI & Data'],
    email: 'fahrinmuneer3@gmail.com',
    phone: '+60 13-884 2412',
    linkedin: 'linkedin.com/in/fahrin-muneer-ums',
    discoverable: true,
    consent_at: '2026-10-01T08:00:00Z',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
    is_admin: true,
    is_fictional_test_account: false,
  },
];

// ============================================================
// 4. DEFAULT STUDENT SKILLS, INTERESTS & AVAILABILITY FOR TESTING
// ============================================================
export const INITIAL_STUDENT_SKILLS: StudentSkill[] = [
  {
    student_id: 'usr-admin',
    skill_id: 'sk-web-mobile',
    proficiency: 'advanced',
  },
  {
    student_id: 'usr-admin',
    skill_id: 'sk-python-ai',
    proficiency: 'intermediate',
  },
  {
    student_id: 'usr-admin',
    skill_id: 'sk-uiux-figma',
    proficiency: 'intermediate',
  },
  {
    student_id: 'usr-admin',
    skill_id: 'sk-database-sql',
    proficiency: 'intermediate',
  },
  {
    student_id: 'usr-admin',
    skill_id: 'sk-event-planning',
    proficiency: 'intermediate',
  },
];

export const INITIAL_STUDENT_INTERESTS: StudentInterest[] = [
  {student_id: 'usr-admin', interest_id: 'in-ai-ml'},
  {student_id: 'usr-admin', interest_id: 'in-hackathon'},
  {student_id: 'usr-admin', interest_id: 'in-smart-iot'},
  {student_id: 'usr-admin', interest_id: 'in-startup-biz'},
  {student_id: 'usr-admin', interest_id: 'in-climate-sdg'},
];

export const INITIAL_AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  {
    id: 'av-seed-1',
    student_id: 'usr-admin',
    weekday: 3,
    start_time: '14:00',
    end_time: '17:30',
  },
  {
    id: 'av-seed-2',
    student_id: 'usr-admin',
    weekday: 5,
    start_time: '15:00',
    end_time: '18:00',
  },
  {
    id: 'av-seed-3',
    student_id: 'usr-admin',
    weekday: 6,
    start_time: '09:00',
    end_time: '13:00',
  },
];

// ============================================================
// 5. CROSS-FACULTY UMS EXAMPLE ACTIVITIES FOR FILTERING & MATCHING TESTS
// ============================================================
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-techfest',
    owner_id: 'ums-club-fki',
    title: 'Borneo AI & Smart Campus Hackathon 2026',
    description:
      'Pertandingan 48 jam membangunkan penyelesaian AI dan aplikasi web pintar untuk kelestarian kampus UMS. Terbuka kepada pembangun perisian, pereka UI/UX, dan pembentang idea perniagaan.',
    project_type: 'Competition',
    slots_needed: 4,
    min_weekly_hours: 6,
    status: 'open',
    deadline: '2026-11-24',
    date_display: '22 – 24 Nov 2026',
    location: 'Dewan Kuliah Pusat 2 (DKP 2) & Makmal AI FKI, UMS',
    audience: 'Terbuka kepada pelajar FKI, FKJ, FPEP & semua fakulti UMS',
    badge_line_1: 'Hackathon',
    badge_line_2: 'FKI · FKJ',
    tags: ['AI & Tech', 'Smart Campus', 'Competition'],
    attribute_tags: [
      'Programming',
      'AI & Data',
      'UI/UX Design',
      'Planning',
      'Rentas Fakulti',
    ],
    trending: true,
    organizer_name: 'Kelab Kejuruteraan Perisian (FKI UMS)',
    organizer_phone: '+60 12-883 4910',
    banner_url: null,
    banner_preset: 'prj-techfest',
    banner_position_y: 50,
    gallery_images: [],
    created_at: '2026-11-06T09:00:00Z',
    updated_at: '2026-11-06T09:00:00Z',
  },
  {
    id: 'prj-shuttle',
    owner_id: 'ums-club-fkj',
    title: 'UMS Autonomous Shuttle & Solar IoT Telemetry',
    description:
      'Projek inovasi kejuruteraan dan perisian untuk menjejak ketibaan bas kolej kediaman UMS secara masa nyata menggunakan modul GPS ESP32 berkuasa solar dan papan pemuka mudah alih.',
    project_type: 'Innovation',
    slots_needed: 4,
    min_weekly_hours: 5,
    status: 'open',
    deadline: '2026-12-05',
    date_display: '1 – 5 Dis 2026',
    location: 'Makmal Mekatronik FKJ & Perhentian Kolej Tun Mustapha, UMS',
    audience: 'Pelajar FKJ, FKI & peminat IoT / Tenaga Lestari',
    badge_line_1: 'Inovasi',
    badge_line_2: 'FKJ · FKI',
    tags: ['IoT & Robotics', 'Smart Campus', 'Innovation'],
    attribute_tags: [
      'Engineering & IoT',
      'Programming',
      'Database',
      'Fleksibel / Hibrid',
    ],
    trending: true,
    organizer_name: 'Sekretariat Inovasi Kejuruteraan (FKJ UMS)',
    organizer_phone: '+60 19-821 3304',
    banner_url: null,
    banner_preset: 'prj-shuttle',
    banner_position_y: 50,
    gallery_images: [],
    created_at: '2026-11-05T11:30:00Z',
    updated_at: '2026-11-05T11:30:00Z',
  },
  {
    id: 'prj-reef',
    owner_id: 'ums-club-fssa',
    title: 'Ekspedisi Pemuliharaan Terumbu Karang & Agro-Marin Sepanggar',
    description:
      'Program lapangan bersepadu di Teluk Sepanggar untuk pemetaan GIS kesihatan terumbu karang, pensampelan kualiti air makmal, dan bengkel kelestarian ekosistem pantai Sabah.',
    project_type: 'Community',
    slots_needed: 6,
    min_weekly_hours: 4,
    status: 'open',
    deadline: '2026-12-12',
    date_display: '12 – 14 Dis 2026',
    location: 'Jeti Akuarium & Pusat Marin UMS (IPMB / FSSA), Kota Kinabalu',
    audience: 'Terbuka kepada pelajar FSSA, FPL, IPMB & sukarelawan UMS',
    badge_line_1: 'Lapangan',
    badge_line_2: 'FSSA · FPL',
    tags: ['Marine & Eco', 'Fieldwork', 'SDP Tinggi'],
    attribute_tags: [
      'Sains & Marin',
      'Kerja Lapangan',
      'Penyelidikan',
      'Beginner Friendly',
      'Rentas Fakulti',
    ],
    trending: true,
    organizer_name: 'Persatuan Sains Marin & Alam Sekitar (FSSA UMS)',
    organizer_phone: '+60 14-672 9180',
    banner_url: null,
    banner_preset: 'prj-reef',
    banner_position_y: 50,
    gallery_images: [],
    created_at: '2026-11-04T14:15:00Z',
    updated_at: '2026-11-04T14:15:00Z',
  },
  {
    id: 'prj-tamu',
    owner_id: 'ums-club-fpep',
    title: 'Kinabalu Social Enterprise & Digital Tamu Pitch 2026',
    description:
      'Cabaran keusahawanan sosial dan kewangan digital membantu usahawan mikro Tamu Sabah memasarkan produk tempatan melalui penjenamaan kreatif, unjuran kewangan, dan e-dagang.',
    project_type: 'Competition',
    slots_needed: 5,
    min_weekly_hours: 5,
    status: 'open',
    deadline: '2026-11-30',
    date_display: '28 – 30 Nov 2026',
    location: 'Auditorium FPEP UMS Kota Kinabalu & Hibrid Kampus Labuan (FKAL)',
    audience: 'Pelajar FPEP, FKAL, FSSK, FKI & seluruh UMS',
    badge_line_1: 'Pitching',
    badge_line_2: 'FPEP · FKAL',
    tags: ['Startup & Pitch', 'Finance & Biz', 'Networking'],
    attribute_tags: [
      'Perniagaan & Tajaan',
      'Planning',
      'Media & Kreatif',
      'Extrovert',
      'Fleksibel / Hibrid',
    ],
    trending: true,
    organizer_name: 'Kelab Keusahawanan & Kewangan (FPEP / FKAL UMS)',
    organizer_phone: '+60 16-830 5521',
    banner_url: null,
    banner_preset: 'prj-tamu',
    banner_position_y: 50,
    gallery_images: [],
    created_at: '2026-11-03T16:45:00Z',
    updated_at: '2026-11-03T16:45:00Z',
  },
  {
    id: 'prj-greeniot',
    owner_id: 'ums-club-fpsk',
    title: 'Kem Kesihatan Komuniti, Gizi Seimbang & Minda Sejahtera',
    description:
      'Misi khidmat masyarakat merangkumi saringan kesihatan asas, pameran pemakanan sihat produk tempatan, serta slot sokongan psikososial dan literasi pendidikan pelajar sekolah.',
    project_type: 'Community',
    slots_needed: 8,
    min_weekly_hours: 4,
    status: 'open',
    deadline: '2026-12-18',
    date_display: '19 – 20 Dis 2026',
    location: 'Pusat Rawatan Warga FPSK UMS & Dewan Komuniti Menggatal',
    audience: 'Pelajar FPSK, FSMP, FPP & sukarelawan semua fakulti UMS',
    badge_line_1: 'Komuniti CSR',
    badge_line_2: 'FPSK · FSMP · FPP',
    tags: ['Health & Care', 'Food & Nutrition', 'Community CSR'],
    attribute_tags: [
      'Kesihatan & Komuniti',
      'Planning',
      'Kerja Lapangan',
      'Beginner Friendly',
      'Rentas Fakulti',
    ],
    trending: false,
    organizer_name: 'Sekretariat Sukarelawan Kesihatan & Psikologi UMS',
    organizer_phone: '+60 11-2684 7740',
    banner_url: null,
    banner_preset: 'prj-greeniot',
    banner_position_y: 50,
    gallery_images: [],
    created_at: '2026-11-02T10:20:00Z',
    updated_at: '2026-11-02T10:20:00Z',
  },
  {
    id: 'prj-cybersec',
    owner_id: 'ums-club-fssk',
    title: 'Dokumentari Warisan Budaya Borneo & Bengkel Keselamatan Siber',
    description:
      'Tugasan projek rentas disiplin menghasilkan dokumentari pendek kearifan budaya etnik Sabah berserta modul kesedaran keselamatan privasi digital untuk belia kampus.',
    project_type: 'Assignment',
    slots_needed: 4,
    min_weekly_hours: 4,
    status: 'open',
    deadline: '2026-12-08',
    date_display: '3 – 8 Dis 2026',
    location: 'Studio Media Kreatif FSSK & Galeri Azman Hashim, UMS',
    audience: 'Pelajar Komunikasi/Sastera (FSSK), FKI & FPP',
    badge_line_1: 'Media & Siber',
    badge_line_2: 'FSSK · FKI',
    tags: ['Media & Creative', 'Culture & Arts', 'Cybersecurity'],
    attribute_tags: [
      'Media & Kreatif',
      'Penyelidikan',
      'Fleksibel / Hibrid',
      'Rentas Fakulti',
    ],
    trending: false,
    organizer_name: 'Kolektif Media & Warisan Borneo (FSSK UMS)',
    organizer_phone: '+60 17-899 1128',
    banner_url: null,
    banner_preset: 'prj-cybersec',
    banner_position_y: 50,
    gallery_images: [],
    created_at: '2026-11-01T08:30:00Z',
    updated_at: '2026-11-01T08:30:00Z',
  },
];

export const INITIAL_PROJECT_REQUIRED_SKILLS: ProjectRequiredSkill[] = [
  // prj-techfest
  {
    project_id: 'prj-techfest',
    skill_id: 'sk-web-mobile',
    mandatory: false,
    importance: 5,
  },
  {
    project_id: 'prj-techfest',
    skill_id: 'sk-python-ai',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-techfest',
    skill_id: 'sk-uiux-figma',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-techfest',
    skill_id: 'sk-biz-pitching',
    mandatory: false,
    importance: 3,
  },

  // prj-shuttle
  {
    project_id: 'prj-shuttle',
    skill_id: 'sk-iot-embedded',
    mandatory: false,
    importance: 5,
  },
  {
    project_id: 'prj-shuttle',
    skill_id: 'sk-web-mobile',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-shuttle',
    skill_id: 'sk-database-sql',
    mandatory: false,
    importance: 3,
  },
  {
    project_id: 'prj-shuttle',
    skill_id: 'sk-electronics',
    mandatory: false,
    importance: 4,
  },

  // prj-reef
  {
    project_id: 'prj-reef',
    skill_id: 'sk-marine-survey',
    mandatory: false,
    importance: 5,
  },
  {
    project_id: 'prj-reef',
    skill_id: 'sk-gis-mapping',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-reef',
    skill_id: 'sk-lab-analysis',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-reef',
    skill_id: 'sk-community-csr',
    mandatory: false,
    importance: 3,
  },

  // prj-tamu
  {
    project_id: 'prj-tamu',
    skill_id: 'sk-biz-pitching',
    mandatory: false,
    importance: 5,
  },
  {
    project_id: 'prj-tamu',
    skill_id: 'sk-finance-acct',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-tamu',
    skill_id: 'sk-digital-mkt',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-tamu',
    skill_id: 'sk-graphic-poster',
    mandatory: false,
    importance: 3,
  },

  // prj-greeniot (Kem Kesihatan, Gizi & Psikologi)
  {
    project_id: 'prj-greeniot',
    skill_id: 'sk-health-firstaid',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-greeniot',
    skill_id: 'sk-food-nutrition',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-greeniot',
    skill_id: 'sk-peer-counseling',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-greeniot',
    skill_id: 'sk-event-planning',
    mandatory: false,
    importance: 3,
  },

  // prj-cybersec (Dokumentari Borneo & Siber)
  {
    project_id: 'prj-cybersec',
    skill_id: 'sk-photo-video',
    mandatory: false,
    importance: 5,
  },
  {
    project_id: 'prj-cybersec',
    skill_id: 'sk-video-editing',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-cybersec',
    skill_id: 'sk-copywriting-mc',
    mandatory: false,
    importance: 4,
  },
  {
    project_id: 'prj-cybersec',
    skill_id: 'sk-cybersecurity',
    mandatory: false,
    importance: 3,
  },
];

export const INITIAL_PROJECT_INTERESTS: ProjectInterest[] = [
  // prj-techfest
  {project_id: 'prj-techfest', interest_id: 'in-ai-ml'},
  {project_id: 'prj-techfest', interest_id: 'in-hackathon'},
  {project_id: 'prj-techfest', interest_id: 'in-smart-iot'},

  // prj-shuttle
  {project_id: 'prj-shuttle', interest_id: 'in-smart-iot'},
  {project_id: 'prj-shuttle', interest_id: 'in-renewable-energy'},
  {project_id: 'prj-shuttle', interest_id: 'in-climate-sdg'},

  // prj-reef
  {project_id: 'prj-reef', interest_id: 'in-marine-reef'},
  {project_id: 'prj-reef', interest_id: 'in-climate-sdg'},
  {project_id: 'prj-reef', interest_id: 'in-biotech-lab'},

  // prj-tamu
  {project_id: 'prj-tamu', interest_id: 'in-startup-biz'},
  {project_id: 'prj-tamu', interest_id: 'in-fintech-finance'},
  {project_id: 'prj-tamu', interest_id: 'in-digital-commerce'},
  {project_id: 'prj-tamu', interest_id: 'in-borneo-heritage'},

  // prj-greeniot
  {project_id: 'prj-greeniot', interest_id: 'in-public-health'},
  {project_id: 'prj-greeniot', interest_id: 'in-nutrition-halal'},
  {project_id: 'prj-greeniot', interest_id: 'in-mental-health'},
  {project_id: 'prj-greeniot', interest_id: 'in-rural-csr'},

  // prj-cybersec
  {project_id: 'prj-cybersec', interest_id: 'in-borneo-heritage'},
  {project_id: 'prj-cybersec', interest_id: 'in-film-photography'},
  {project_id: 'prj-cybersec', interest_id: 'in-cyber-cloud'},
];

export const INITIAL_PROJECT_MEETING_SLOTS: ProjectMeetingSlot[] = [
  {
    id: 'ms-techfest-1',
    project_id: 'prj-techfest',
    weekday: 3,
    start_time: '14:30',
    end_time: '17:00',
  },
  {
    id: 'ms-techfest-2',
    project_id: 'prj-techfest',
    weekday: 5,
    start_time: '15:30',
    end_time: '17:30',
  },
  {
    id: 'ms-shuttle-1',
    project_id: 'prj-shuttle',
    weekday: 3,
    start_time: '15:00',
    end_time: '17:00',
  },
  {
    id: 'ms-reef-1',
    project_id: 'prj-reef',
    weekday: 6,
    start_time: '08:30',
    end_time: '12:30',
  },
  {
    id: 'ms-tamu-1',
    project_id: 'prj-tamu',
    weekday: 4,
    start_time: '16:00',
    end_time: '18:00',
  },
  {
    id: 'ms-tamu-2',
    project_id: 'prj-tamu',
    weekday: 6,
    start_time: '10:00',
    end_time: '12:00',
  },
  {
    id: 'ms-greeniot-1',
    project_id: 'prj-greeniot',
    weekday: 6,
    start_time: '09:00',
    end_time: '13:00',
  },
  {
    id: 'ms-cybersec-1',
    project_id: 'prj-cybersec',
    weekday: 5,
    start_time: '15:00',
    end_time: '17:00',
  },
];

// ============================================================
// 6. APPLICATIONS, MEMBERS, INVITATIONS, NOTIFICATIONS & WORKSPACE
// ============================================================
export const INITIAL_APPLICATIONS: Application[] = [];
export const INITIAL_PROJECT_MEMBERS: ProjectMember[] = [];
export const INITIAL_PROJECT_INVITATIONS: ProjectInvitation[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_BETA_RESULTS: BetaTestResult[] = [];
export const INITIAL_PROJECT_TASKS: ProjectTask[] = [];
export const INITIAL_PROJECT_MESSAGES: ProjectMessage[] = [];
export const INITIAL_SAVED_PROJECTS: SavedProject[] = [];
export const INITIAL_REPORTS: ModerationReport[] = [];
export const INITIAL_ACTIVITY_HISTORY: StudentActivityHistory[] = [
  {
    id: 'hist-seed-1',
    student_id: 'usr-admin',
    project_id: null,
    title: ' Minggu Suai Mesra & Bengkel Inovasi Perisian FKI UMS',
    date_display: 'Okt 2026',
    role: 'AJK Teknikal & Fasilitator',
    sdp_earned: 45,
    summary:
      'Menyelaras bengkel pembangunan web asas dan sistem pendaftaran QR untuk 180 pelajar baharu FKI UMS.',
    completed_at: '2026-10-18T10:00:00Z',
  },
  {
    id: 'hist-seed-2',
    student_id: 'usr-admin',
    project_id: null,
    title: 'Program Lestari Pantai ODEC & Sukarelawan Kampus Hijau',
    date_display: 'Sep 2026',
    role: 'Peserta Sukarelawan',
    sdp_earned: 30,
    summary:
      'Menyertai aktiviti pembersihan pantai ODEC UMS dan audit pengasingan sisa kitar semula bersama pelajar rentas fakulti.',
    completed_at: '2026-09-22T09:00:00Z',
  },
];
