'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useProjectLink} from '@/lib/store';
import {evaluateStudentProjectMatch} from '@/lib/matching-engine';
import { WEEKDAY_SHORT } from '@/lib/seed-data';
import {
  Proficiency,
  Project,
  ProjectType,
  StudentActivityHistory,
} from '@/lib/types';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Bookmark,
  Building2,
  Calendar,
  CalendarPlus,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  History,
  Home,
  Laptop,
  Layers,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Upload,
  User,
  Users,
  X,
  Image as ImageIcon,
} from 'lucide-react';

// Image-based App Icon component (uses /app-icon.png by default or custom uploaded app icon)
function ProjectLinkPLogo({
  className = 'w-8 h-8',
  src = '/app-icon.png',
}: {
  className?: string;
  src?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || '/app-icon.png'}
      alt="ProjectLink UMS Icon"
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.src.endsWith('/app-icon.png')) {
          target.src = '/app-icon.png';
        }
      }}
      draggable={false}
      className={`${className} object-contain select-none`}
    />
  );
}

// Client-side HTML5 Canvas image resizer & JPEG compressor for smooth localStorage persistence
async function compressImageFileToDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca fail gambar'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new window.Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          let w = img.width || maxWidth;
          let h = img.height || maxHeight;
          const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const UMS_BANNER_PRESETS = [
  {
    id: 'prj-techfest',
    label: 'TechFest UMS',
    subtitle: 'Dewan Canselor',
  },
  {
    id: 'prj-shuttle',
    label: 'Smart Shuttle',
    subtitle: 'Telemetri Bas',
  },
  {
    id: 'prj-reef',
    label: 'Marine Reef AI',
    subtitle: 'Teluk Sepanggar',
  },
  {
    id: 'prj-cybersec',
    label: 'CyberSec CTF',
    subtitle: 'Makmal Siber FKI',
  },
  {
    id: 'prj-greeniot',
    label: 'Green IoT',
    subtitle: 'EcoCampus Solar',
  },
  {
    id: 'prj-tamu',
    label: 'Digital Tamu',
    subtitle: 'Gunung Kinabalu',
  },
] as const;

// Illustrated portrait avatar of Fahrin with UMS sunset backdrop + Uploaded Photo with Zoom & Pan
function FahrinPortraitAvatar({
  variant = 0,
  avatarUrl,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
}: {
  variant?: number;
  avatarUrl?: string | null;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (avatarUrl && failedUrl !== avatarUrl) {
    const safeZoom = Math.min(3, Math.max(1, Number(zoom) || 1));
    const safeX = Math.min(50, Math.max(-50, Number(offsetX) || 0));
    const safeY = Math.min(50, Math.max(-50, Number(offsetY) || 0));
    return (
      <div className="w-full h-full overflow-hidden relative bg-[#2A0B5E]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt="Foto Profil Pelajar UMS"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(avatarUrl)}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{
            transform: `translate(${safeX}%, ${safeY}%) scale(${safeZoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    );
  }

  const hoodies = ['#1E1B2E', '#3B0764', '#0F172A'];
  const hoodieColor = hoodies[variant % hoodies.length];
  return (
    <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="45%" stopColor="#F472B6" />
          <stop offset="80%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
        <linearGradient id="skinTone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDBA8C" />
          <stop offset="60%" stopColor="#E08E5A" />
          <stop offset="100%" stopColor="#B46538" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#sunsetSky)" />
      <path
        d="M-10 42 C25 32, 65 48, 130 34 L130 70 L-10 70 Z"
        fill="#FDBA74"
        fillOpacity="0.35"
      />
      <rect
        x="68"
        y="64"
        width="46"
        height="28"
        fill="#4C1D95"
        fillOpacity="0.55"
      />
      <polygon
        points="64,64 91,52 118,64"
        fill="#3B0764"
        fillOpacity="0.65"
      />
      <circle cx="18" cy="75" r="18" fill="#1E1B4B" fillOpacity="0.6" />
      <circle cx="34" cy="78" r="14" fill="#1E1B4B" fillOpacity="0.5" />
      <path
        d="M16 122 C18 94, 38 86, 60 86 C82 86, 102 94, 104 122 Z"
        fill={hoodieColor}
      />
      <path
        d="M36 92 C42 104, 78 104, 84 92 L78 85 L42 85 Z"
        fill="#2E2942"
      />
      <rect x="51" y="70" width="18" height="22" rx="8" fill="#C97849" />
      <path
        d="M51 74 Q60 82 69 74 L69 70 L51 70 Z"
        fill="#8C4A27"
        fillOpacity="0.55"
      />
      <ellipse cx="38" cy="56" rx="4.5" ry="7" fill="#D98657" />
      <ellipse cx="82" cy="56" rx="4.5" ry="7" fill="#C47244" />
      <path
        d="M39 44 C39 29, 81 29, 81 44 C81 64, 73 77, 60 77 C47 77, 39 64, 39 44 Z"
        fill="url(#skinTone)"
      />
      <path
        d="M45 45 Q51 42.5 56 44.5"
        stroke="#1C1917"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M64 44.5 Q69 42.5 75 45"
        stroke="#1C1917"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <ellipse cx="50.5" cy="50" rx="3.2" ry="2.2" fill="#1C1917" />
      <circle cx="51.3" cy="49.3" r="0.8" fill="#FFFFFF" />
      <ellipse cx="69.5" cy="50" rx="3.2" ry="2.2" fill="#1C1917" />
      <circle cx="70.3" cy="49.3" r="0.8" fill="#FFFFFF" />
      <path
        d="M60 48 L58.5 58.5 Q60.5 60 62.5 58.5"
        stroke="#9A522B"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M53.5 64.5 Q60 67.5 66.5 64.5"
        stroke="#7C3A1D"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M56 72 Q60 74 64 72"
        stroke="#432818"
        strokeWidth="1.5"
        strokeOpacity="0.45"
        strokeLinecap="round"
      />
      <path
        d="M36 52 C32 40, 35 24, 48 20 C56 16, 72 17, 79 24 C86 30, 87 42, 83 52 C82 43, 79 35, 72 32 C65 36, 54 37, 46 33 C40 37, 38 44, 36 52 Z"
        fill="#17141D"
      />
      <path
        d="M44 22 C52 28, 63 31, 74 26 C67 34, 52 36, 42 31 Z"
        fill="#292334"
      />
    </svg>
  );
}

// Distinct Banner Artwork for each UMS Activity Card + Custom Uploaded/URL Poster Support
function ActivityCardBanner({
  cardId,
  bannerUrl,
  bannerPreset,
  bannerPositionY = 50,
}: {
  cardId: string;
  bannerUrl?: string | null;
  bannerPreset?: string;
  bannerPositionY?: number;
}) {
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null);

  if (bannerUrl && failedBannerUrl !== bannerUrl) {
    const safePosY = Math.min(100, Math.max(0, Number(bannerPositionY) ?? 50));
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={bannerUrl}
        alt="Poster Aktiviti UMS"
        referrerPolicy="no-referrer"
        onError={() => setFailedBannerUrl(bannerUrl)}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        style={{
          objectPosition: `50% ${safePosY}%`,
        }}
      />
    );
  }

  const effectivePreset = bannerPreset || cardId;

  if (effectivePreset === 'prj-techfest') {
    return (
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage:
            'url("/assets/aistudio/file_0000000099708211a698e06bd291137a_0ad82db4.png")',
          backgroundSize: '115% auto',
          backgroundPosition: '50% 17.5%',
        }}
      />
    );
  }

  if (effectivePreset === 'prj-shuttle') {
    return (
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 160"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="shuttleBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="50%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <rect width="400" height="160" fill="url(#shuttleBg)" />
        <circle cx="320" cy="40" r="55" fill="#38BDF8" fillOpacity="0.22" />
        <circle cx="90" cy="30" r="40" fill="#818CF8" fillOpacity="0.2" />
        {/* GPS Route Grid & Telemetry Pulse */}
        <path
          d="M0,115 Q110,65 210,95 T400,60"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="3"
          strokeDasharray="6 5"
        />
        <circle cx="210" cy="95" r="6" fill="#22D3EE" />
        <circle
          cx="210"
          cy="95"
          r="14"
          fill="none"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
        {/* UMS Campus Shuttle Silhouette */}
        <rect
          x="115"
          y="58"
          width="155"
          height="54"
          rx="12"
          fill="#F8FAFC"
          fillOpacity="0.95"
        />
        <rect x="126" y="67" width="34" height="20" rx="4" fill="#0284C7" />
        <rect x="166" y="67" width="34" height="20" rx="4" fill="#0284C7" />
        <rect x="206" y="67" width="34" height="20" rx="4" fill="#0284C7" />
        <rect x="246" y="67" width="16" height="28" rx="4" fill="#38BDF8" />
        <rect x="125" y="93" width="115" height="6" rx="3" fill="#6366F1" />
        <circle cx="148" cy="112" r="10" fill="#1E293B" />
        <circle cx="148" cy="112" r="4.5" fill="#94A3B8" />
        <circle cx="236" cy="112" r="10" fill="#1E293B" />
        <circle cx="236" cy="112" r="4.5" fill="#94A3B8" />
      </svg>
    );
  }

  if (effectivePreset === 'prj-reef') {
    return (
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 160"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="reefBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#042F2E" />
            <stop offset="50%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
        </defs>
        <rect width="400" height="160" fill="url(#reefBg)" />
        <circle cx="300" cy="45" r="48" fill="#2DD4BF" fillOpacity="0.22" />
        {/* Acoustic Sonar Waves */}
        <path
          d="M40,85 Q90,45 140,85 T240,85 T340,85"
          fill="none"
          stroke="#5EEAD4"
          strokeWidth="2.5"
          strokeOpacity="0.75"
        />
        <path
          d="M40,102 Q90,62 140,102 T240,102 T340,102"
          fill="none"
          stroke="#A7F3D0"
          strokeWidth="1.8"
          strokeOpacity="0.5"
        />
        {/* Coral Silhouettes */}
        <path
          d="M65,145 C65,110 85,105 85,85 C85,105 105,110 105,145 Z"
          fill="#F43F5E"
          fillOpacity="0.7"
        />
        <path
          d="M270,145 C270,100 295,95 295,72 C295,95 320,100 320,145 Z"
          fill="#FB923C"
          fillOpacity="0.75"
        />
        <circle cx="195" cy="74" r="22" fill="#CCFBF1" fillOpacity="0.2" />
        <circle cx="195" cy="74" r="9" fill="#2DD4BF" />
      </svg>
    );
  }

  if (effectivePreset === 'prj-cybersec') {
    return (
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 160"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="cyberBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#090D16" />
            <stop offset="55%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <rect width="400" height="160" fill="url(#cyberBg)" />
        <circle cx="330" cy="36" r="52" fill="#10B981" fillOpacity="0.18" />
        <circle cx="85" cy="125" r="45" fill="#8B5CF6" fillOpacity="0.25" />
        <path
          d="M20,120 L95,70 L165,98 L250,45 L335,78 L390,32"
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeDasharray="5 4"
        />
        <polygon
          points="200,32 238,48 238,88 200,114 162,88 162,48"
          fill="#10B981"
          fillOpacity="0.22"
          stroke="#34D399"
          strokeWidth="2.5"
        />
        <circle cx="200" cy="72" r="10" fill="#A7F3D0" />
      </svg>
    );
  }

  if (effectivePreset === 'prj-greeniot') {
    return (
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 160"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="greenIotBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064E3B" />
            <stop offset="52%" stopColor="#047857" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
        <rect width="400" height="160" fill="url(#greenIotBg)" />
        <circle cx="310" cy="40" r="36" fill="#FDE047" fillOpacity="0.38" />
        <polygon
          points="90,125 145,62 200,125"
          fill="#A7F3D0"
          fillOpacity="0.3"
        />
        <rect
          x="145"
          y="58"
          width="110"
          height="52"
          rx="10"
          fill="#ECFDF5"
          fillOpacity="0.92"
        />
        <line
          x1="145"
          y1="84"
          x2="255"
          y2="84"
          stroke="#059669"
          strokeWidth="2"
        />
        <line
          x1="200"
          y1="58"
          x2="200"
          y2="110"
          stroke="#059669"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="tamuBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B0764" />
          <stop offset="52%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="400" height="160" fill="url(#tamuBg)" />
      <circle cx="315" cy="48" r="34" fill="#FDE047" fillOpacity="0.45" />
      {/* Mount Kinabalu Highland Silhouette */}
      <polygon
        points="20,135 105,48 155,72 215,38 305,135"
        fill="#2E1065"
        fillOpacity="0.65"
      />
      {/* Campus Tamu Canopies */}
      <polygon
        points="95,122 135,96 175,122"
        fill="#FEF08A"
        fillOpacity="0.9"
      />
      <polygon
        points="185,122 225,96 265,122"
        fill="#FDBA74"
        fillOpacity="0.9"
      />
      <polygon
        points="275,122 315,96 355,122"
        fill="#E9D5FF"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function MainMobileAppInterface() {
  const {
    currentUser,
    profiles,
    skills,
    studentSkills,
    interests,
    studentInterests,
    availabilitySlots,
    projects,
    projectRequiredSkills,
    projectInterests,
    projectMeetingSlots,
    projectMembers,
    applications,
    projectInvitations,
    projectTasks,
    projectMessages,
    savedProjects,
    activityHistory,
    notifications,
    toasts,
    dismissToast,
    switchPersona,
    resetDemoDatabase,
    refreshProjectsFeed,
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
    createProject,
    updateProjectBanner,
    applyToProject,
    decideApplication,
    withdrawApplication,
    inviteCandidate,
    respondInvitation,
    toggleSaveProject,
    saveProjectOnly,
    notifyToast,
    createTask,
    updateTaskStatus,
    sendMessage,
    markNotificationRead,
    markAllNotificationsRead,
    registerStudentAccount,
    signInWithCredentials,
  } = useProjectLink();

  // =========================================================
  // 3-STAGE AUTHENTICATION FLOW STATE (Splash -> Welcome -> Sign In / Sign Up -> Authenticated)
  // =========================================================
  const [authStage, setAuthStage] = useState<
    'splash' | 'welcome' | 'signin' | 'signup' | 'authenticated'
  >(() => {
    if (typeof window !== 'undefined') {
      const savedSession = window.sessionStorage.getItem(
        'projectlink_auth_session_v1'
      );
      if (savedSession === 'authenticated') {
        return 'authenticated';
      }
    }
    return 'splash';
  });

  // Form states for Stage 3: Sign In & Sign Up (Email + Extra Student Details)
  const [loginEmail, setLoginEmail] = useState('fahrin@student.ums.edu.my');
  const [loginPassword, setLoginPassword] = useState('ums2026');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regFacultyShort, setRegFacultyShort] = useState('FKI');

  const UMS_FACULTY_OPTIONS: Array<{short: string; full: string}> = [
    {
      short: 'FKI',
      full: 'Fakulti Komputeran dan Informatik (FKI), UMS',
    },
    {
      short: 'FKJ',
      full: 'Fakulti Kejuruteraan (FKJ), UMS',
    },
    {
      short: 'FPEP',
      full: 'Fakulti Perniagaan, Ekonomi dan Perakaunan (FPEP), UMS',
    },
    {
      short: 'FSSA',
      full: 'Fakulti Sains dan Sumber Alam (FSSA), UMS',
    },
    {
      short: 'FPSK',
      full: 'Fakulti Perubatan dan Sains Kesihatan (FPSK), UMS',
    },
    {
      short: 'FPP',
      full: 'Fakulti Psikologi dan Pendidikan (FPP), UMS',
    },
    {
      short: 'FPL',
      full: 'Fakulti Pertanian Lestari (FPL), UMS',
    },
    {
      short: 'FKAL',
      full: 'Fakulti Kewangan Antarabangsa Labuan (FKAL), UMS',
    },
  ];

  // Automatic 1.8s transition from Stage 1 (Splash) to Stage 2 (Welcome)
  useEffect(() => {
    if (authStage !== 'splash') return;
    const timer = window.setTimeout(() => {
      setAuthStage('welcome');
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [authStage]);

  const completeAuthentication = () => {
    setAuthStage('authenticated');
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(
          'projectlink_auth_session_v1',
          'authenticated'
        );
      } catch {
        // Ignore storage errors
      }
    }
  };

  const triggerSignOut = () => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('projectlink_auth_session_v1');
      } catch {
        // Ignore storage errors
      }
    }
    setIsSidebarOpen(false);
    setActiveSidePage(null);
    setIsSearchPageOpen(false);
    setIsActivityPageOpen(false);
    setIsPostActivityPageOpen(false);
    setActiveModal(null);
    setAuthStage('splash');
    notifyToast(
      'Log Keluar Berjaya',
      'Anda telah kembali ke skrin permulaan ProjectLink UMS.',
      'default'
    );
  };

  const handleEmailSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      notifyToast(
        'E-mel Diperlukan',
        'Sila masukkan alamat e-mel pelajar UMS atau username anda.',
        'error'
      );
      return;
    }
    if (!loginPassword.trim()) {
      notifyToast(
        'Kata Laluan Diperlukan',
        'Sila masukkan kata laluan akaun anda.',
        'error'
      );
      return;
    }
    signInWithCredentials(loginEmail);
    completeAuthentication();
  };

  const handleEmailSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      notifyToast(
        'Nama Penuh Diperlukan',
        'Sila masukkan nama penuh pelajar anda.',
        'error'
      );
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      notifyToast(
        'E-mel Tidak Sah',
        'Sila masukkan alamat e-mel UMS yang sah (contoh: nama@student.ums.edu.my).',
        'error'
      );
      return;
    }
    if (regPassword.trim().length < 4) {
      notifyToast(
        'Kata Laluan Terlalu Pendek',
        'Sila tetapkan kata laluan sekurang-kurangnya 4 aksara.',
        'error'
      );
      return;
    }
    const selectedFac =
      UMS_FACULTY_OPTIONS.find((f) => f.short === regFacultyShort) ||
      UMS_FACULTY_OPTIONS[0];
    registerStudentAccount({
      displayName: regFullName,
      email: regEmail,
      facultyShort: selectedFac.short,
      facultyFull: selectedFac.full,
    });
    completeAuthentication();
  };

  // Strictly 2 main pages: 'home' | 'profile', plus dedicated full-screen Search, Activity Detail, Post Activity & Side Menu pages
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
  const [isActivityPageOpen, setIsActivityPageOpen] = useState(false);
  const [isPostActivityPageOpen, setIsPostActivityPageOpen] = useState(false);
  const [activeSidePage, setActiveSidePage] = useState<
    | null
    | 'my-activities'
    | 'saved-activities'
    | 'calendar'
    | 'notifications'
    | 'settings'
  >(null);

  // Enhanced Search, Filter, Category & Bookmarks State
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [searchSkillFilters, setSearchSkillFilters] = useState<string[]>([]);
  const [searchFacultyFilter, setSearchFacultyFilter] = useState<string>('All');
  const [searchSortBy, setSearchSortBy] = useState<
    'match' | 'newest' | 'hours' | 'slots'
  >('match');
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');
  const [savedCategoryFilter, setSavedCategoryFilter] = useState<string>('All');
  const [bookmarkNotes, setBookmarkNotes] = useState<Record<string, string>>({
    'prj-01': 'Prioriti Utama',
    'prj-02': 'Ajak Kawan FKI',
  });

  // Form state for adding a new SDP participation record on the My Activities page
  const [newHistTitle, setNewHistTitle] = useState('');
  const [newHistDate, setNewHistDate] = useState('Nov 2026');
  const [newHistRole, setNewHistRole] = useState('Peserta / Ahli Pasukan');
  const [newHistSdp, setNewHistSdp] = useState(30);
  const [newHistSummary, setNewHistSummary] = useState('');

  // Pull-to-Refresh State for the Search Page Scrollable Activity List
  const searchScrollRef = useRef<HTMLDivElement | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPullingSearch, setIsPullingSearch] = useState(false);
  const [isRefreshingSearch, setIsRefreshingSearch] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');

  const triggerSearchRefresh = () => {
    if (isRefreshingSearch) return;
    setIsRefreshingSearch(true);
    setPullDistance(56);
    setTimeout(() => {
      refreshProjectsFeed();
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastRefreshedTime(formatted);
      setIsRefreshingSearch(false);
      setPullDistance(0);
    }, 650);
  };

  const handleSearchTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshingSearch) return;
    const scrollTop = searchScrollRef.current?.scrollTop ?? 0;
    if (scrollTop <= 2) {
      pullStartYRef.current = e.touches[0].clientY;
      setIsPullingSearch(true);
    } else {
      pullStartYRef.current = null;
      setIsPullingSearch(false);
    }
  };

  const handleSearchTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPullingSearch || pullStartYRef.current === null || isRefreshingSearch)
      return;
    const scrollTop = searchScrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 2) {
      pullStartYRef.current = null;
      setIsPullingSearch(false);
      setPullDistance(0);
      return;
    }
    const deltaY = e.touches[0].clientY - pullStartYRef.current;
    if (deltaY > 0) {
      // Damped rubber-band pull curve up to 96px
      const damped = Math.min(96, Math.round(deltaY * 0.48));
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleSearchTouchEnd = () => {
    if (!isPullingSearch) return;
    setIsPullingSearch(false);
    pullStartYRef.current = null;
    if (pullDistance >= 52) {
      triggerSearchRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Side Menu Drawer state (opened by clicking the app icon at top-left)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('Discover');

  // Custom App Icon Image state (defaults to /app-icon.png, persisted in localStorage so user can upload their own app icon)
  const [appIconUrl, setAppIconUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.localStorage.getItem('projectlink_custom_app_icon_v1') ||
        '/app-icon.png'
      );
    }
    return '/app-icon.png';
  });
  const appIconFileInputRef = useRef<HTMLInputElement | null>(null);

  const updateCustomAppIcon = (nextUrl: string) => {
    const clean = nextUrl.trim() || '/app-icon.png';
    setAppIconUrl(clean);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('projectlink_custom_app_icon_v1', clean);
      } catch {
        // Ignore storage quota warning
      }
    }
  };

  // Active card index & Tinder-style Swipe Physics State on Home page
  // cardIndex increases monotonically (0, 1, 2, 3, 4...) so each card in the 3-card stack keeps its own DOM key
  const [cardIndex, setCardIndex] = useState(0);
  const [inspectedCardId, setInspectedCardId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number; y: number}>({
    x: 0,
    y: 0,
  });
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [flyOffDir, setFlyOffDir] = useState<'left' | 'right' | null>(null);
  const dragStartPosRef = useRef<{x: number; y: number} | null>(null);

  // Contextual Modal State
  const [activeModal, setActiveModal] = useState<
    | null
    | 'notifications'
    | 'match-details'
    | 'add-home-skill'
    | 'create-project'
    | 'edit-profile'
    | 'profile-photo'
    | 'edit-activity-banner'
    | 'app-icon-settings'
    | 'edit-about'
    | 'add-profile-skill'
    | 'add-profile-interest'
    | 'history-detail'
    | 'sdp-info'
    | 'contact-info'
    | 'my-activities'
    | 'saved-activities'
    | 'calendar'
    | 'my-teams'
    | 'messages'
    | 'settings'
    | 'organizer-panel'
  >(null);

  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<StudentActivityHistory | null>(null);
  const [selectedContactType, setSelectedContactType] = useState<
    'email' | 'phone' | 'linkedin'
  >('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyNote, setApplyNote] = useState('');

  // Dedicated Full-Screen Post Activity Form State (Mirrors 100% of Activity Detail Page info + Poster Image)
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ProjectType>('Competition');
  const [newBadgeLine1, setNewBadgeLine1] = useState('Program');
  const [newBadgeLine2, setNewBadgeLine2] = useState('FKI');
  const [newDateText, setNewDateText] = useState('22 – 24 Nov 2026');
  const [newDeadline, setNewDeadline] = useState('2026-11-24');
  const [newLocationText, setNewLocationText] = useState(
    'Dewan Kuliah Pusat 2, UMS'
  );
  const [newAudience, setNewAudience] = useState(
    'Terbuka kepada semua pelajar FKI & UMS'
  );
  const [newSlotsNeeded, setNewSlotsNeeded] = useState<number>(4);
  const [newMinWeeklyHours, setNewMinWeeklyHours] = useState<number>(6);
  const [newOrganizerName, setNewOrganizerName] = useState('Fahrin (FKI UMS)');
  const [newOrganizerPhone, setNewOrganizerPhone] = useState('+6012-883 4910');
  const [newDesc, setNewDesc] = useState('');
  const [newTag1, setNewTag1] = useState('Tech');
  const [newTag2, setNewTag2] = useState('Networking');
  const [newTag3, setNewTag3] = useState('Competition');
  const [newBannerMode, setNewBannerMode] = useState<
    'preset' | 'upload' | 'url'
  >('preset');
  const [newBannerUrl, setNewBannerUrl] = useState<string>('');
  const [newBannerPreset, setNewBannerPreset] =
    useState<string>('prj-techfest');
  const [newBannerPosY, setNewBannerPosY] = useState<number>(50);
  const [newAttributeTags, setNewAttributeTags] = useState<string[]>([
    'Programming',
    'Planning',
    'Database',
  ]);
  const [newRequiredSkills, setNewRequiredSkills] = useState<
    Array<{skill_id: string; mandatory: boolean; importance: number}>
  >([
    {skill_id: 'sk-web', mandatory: true, importance: 5},
    {skill_id: 'sk-14', mandatory: false, importance: 4},
  ]);
  const [postSelectSkillId, setPostSelectSkillId] = useState<string>('sk-01');
  const [postSkillMandatory, setPostSkillMandatory] = useState<boolean>(true);
  const [postSkillImportance, setPostSkillImportance] = useState<number>(4);
  const [newProjectInterests, setNewProjectInterests] = useState<string[]>([
    'in-01',
    'in-collab',
  ]);
  const [newMeetingSlots, setNewMeetingSlots] = useState<
    Array<{weekday: number; start_time: string; end_time: string}>
  >([{weekday: 3, start_time: '14:00', end_time: '17:00'}]);
  const [postSlotDay, setPostSlotDay] = useState<number>(5);
  const [postSlotStart, setPostSlotStart] = useState<string>('15:00');
  const [postSlotEnd, setPostSlotEnd] = useState<string>('17:00');

  const openPostActivityPage = () => {
    if (currentUser) {
      setNewOrganizerName(
        `${currentUser.display_name} (${currentUser.faculty_short || 'FKI'} UMS)`
      );
      if (currentUser.phone) {
        setNewOrganizerPhone(currentUser.phone);
      }
    }
    setActiveModal(null);
    setIsSidebarOpen(false);
    setIsActivityPageOpen(false);
    setIsSearchPageOpen(false);
    setIsPostActivityPageOpen(true);
  };

  // Profile Photo Studio State (Upload from Device, URL, Zoom 1x-3x, Pan X/Y, or UMS Sunset Illustration)
  const [draftAvatarMode, setDraftAvatarMode] = useState<
    'photo' | 'illustration'
  >('photo');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState<string>('');
  const [draftAvatarZoom, setDraftAvatarZoom] = useState<number>(1);
  const [draftAvatarOffsetX, setDraftAvatarOffsetX] = useState<number>(0);
  const [draftAvatarOffsetY, setDraftAvatarOffsetY] = useState<number>(0);
  const [draftAvatarVariant, setDraftAvatarVariant] = useState<number>(0);

  const openProfilePhotoModal = () => {
    if (!currentUser) return;
    setDraftAvatarMode(currentUser.avatar_url ? 'photo' : 'photo');
    setDraftAvatarUrl(currentUser.avatar_url || '');
    setDraftAvatarZoom(currentUser.avatar_zoom || 1);
    setDraftAvatarOffsetX(currentUser.avatar_offset_x || 0);
    setDraftAvatarOffsetY(currentUser.avatar_offset_y || 0);
    setDraftAvatarVariant(currentUser.avatar_variant || 0);
    setActiveModal('profile-photo');
  };

  // Owner-Only Edit Activity Banner Modal State
  const [editingBannerProjectId, setEditingBannerProjectId] =
    useState<string>('');
  const [editBannerMode, setEditBannerMode] = useState<
    'preset' | 'upload' | 'url'
  >('preset');
  const [editBannerUrl, setEditBannerUrl] = useState<string>('');
  const [editBannerPreset, setEditBannerPreset] =
    useState<string>('prj-techfest');
  const [editBannerPosY, setEditBannerPosY] = useState<number>(50);

  const openEditActivityBannerModal = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    if (!currentUser || target.owner_id !== currentUser.id) {
      notifyToast(
        'Hanya Pemilik Boleh Tukar Gambar',
        'Hanya pemilik atau penganjur asal aktiviti ini dibenarkan menukar gambar poster.',
        'error'
      );
      return;
    }
    setEditingBannerProjectId(projectId);
    const hasCustomUrl = Boolean(target.banner_url);
    setEditBannerMode(
      hasCustomUrl
        ? target.banner_url?.startsWith('data:')
          ? 'upload'
          : 'url'
        : 'preset'
    );
    setEditBannerUrl(target.banner_url || '');
    setEditBannerPreset(target.banner_preset || target.id);
    setEditBannerPosY(target.banner_position_y ?? 50);
    setActiveModal('edit-activity-banner');
  };

  // Add Skill / Interest / Availability / Task / Message Form States
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSkillProf, setNewSkillProf] = useState<Proficiency>('intermediate');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newSlotDay, setNewSlotDay] = useState<number>(4);
  const [newSlotStart, setNewSlotStart] = useState('14:00');
  const [newSlotEnd, setNewSlotEnd] = useState('16:00');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Edit Profile Local Draft State (initialized when opening modal)
  const [draftName, setDraftName] = useState('');
  const [draftMatric, setDraftMatric] = useState('');
  const [draftYear, setDraftYear] = useState(2);
  const [draftProgramme, setDraftProgramme] = useState('');
  const [draftFacultyShort, setDraftFacultyShort] = useState('');
  const [draftFacultyFull, setDraftFacultyFull] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftBio, setDraftBio] = useState('');

  const openEditProfileModal = () => {
    if (!currentUser) return;
    setDraftName(currentUser.display_name);
    setDraftMatric(currentUser.matric_no || 'A2412345');
    setDraftYear(currentUser.year_of_study || 2);
    setDraftProgramme(currentUser.programme || 'Software Engineering');
    setDraftFacultyShort(currentUser.faculty_short || 'FKI');
    setDraftFacultyFull(
      currentUser.faculty || 'Fakulti Komputeran dan Informatik (FKI), UMS'
    );
    setDraftLocation(currentUser.location || 'Kota Kinabalu');
    setActiveModal('edit-profile');
  };

  const openEditAboutModal = () => {
    if (!currentUser) return;
    setDraftBio(currentUser.bio || '');
    setActiveModal('edit-about');
  };

  // Normalized Relational Queries for Current Student (Fahrin)
  const selectedTags = useMemo(
    () =>
      currentUser?.active_filter_tags || [
        'Programming',
        'Planning',
        'Database',
        'Extrovert',
        'Female only',
      ],
    [currentUser]
  );

  const customAddedTags = useMemo(
    () =>
      selectedTags.filter(
        (t) =>
          ![
            'Programming',
            'Planning',
            'Database',
            'Extrovert',
            'Female only',
          ].includes(t)
      ),
    [selectedTags]
  );

  // Join student_skills <-> skills for currentUser
  const myNormalizedSkills = useMemo(() => {
    if (!currentUser) return [];
    const skillMap = new Map(skills.map((s) => [s.id, s]));
    return studentSkills
      .filter((ss) => ss.student_id === currentUser.id)
      .map((ss) => ({
        skill_id: ss.skill_id,
        proficiency: ss.proficiency,
        name: skillMap.get(ss.skill_id)?.name || ss.skill_id,
      }));
  }, [currentUser, studentSkills, skills]);

  // Join student_interests <-> interests for currentUser
  const myNormalizedInterests = useMemo(() => {
    if (!currentUser) return [];
    const interestMap = new Map(interests.map((i) => [i.id, i]));
    return studentInterests
      .filter((si) => si.student_id === currentUser.id)
      .map((si) => ({
        interest_id: si.interest_id,
        name: interestMap.get(si.interest_id)?.name || si.interest_id,
      }));
  }, [currentUser, studentInterests, interests]);

  // Join student_activity_history for currentUser & compute SDP total
  const myHistoryRecords = useMemo(() => {
    if (!currentUser) return [];
    return activityHistory.filter((h) => h.student_id === currentUser.id);
  }, [currentUser, activityHistory]);

  const totalSdpPoints = useMemo(() => {
    const sum = myHistoryRecords.reduce((acc, item) => acc + item.sdp_earned, 0);
    return sum > 0 ? sum : 500;
  }, [myHistoryRecords]);

  // Normalized Projects Catalog for the Home Deck
  const cardsCatalog = useMemo(() => {
    return projects.map((p) => {
      const ownerProfile = profiles.find((pr) => pr.id === p.owner_id);
      return {
        id: p.id,
        ownerId: p.owner_id,
        isOwner: Boolean(currentUser && p.owner_id === currentUser.id),
        projectObj: p,
        title: p.title,
        dateText: p.date_display || p.deadline || '12 – 14 Nov 2026',
        locationText: p.location || 'Dewan Canselor, UMS',
        audienceText: p.audience || 'Terbuka kepada semua pelajar UMS',
        facultyLabel1: p.badge_line_1 || 'Program',
        facultyLabel2: p.badge_line_2 || 'Fakulti',
        description: p.description,
        tags: p.tags || ['Tech', 'Networking', 'Competition'],
        trending: p.trending ?? true,
        bannerUrl: p.banner_url || null,
        bannerPreset: p.banner_preset || p.id,
        bannerPositionY: p.banner_position_y ?? 50,
        organizerName:
          p.organizer_name ||
          (ownerProfile
            ? `${ownerProfile.display_name} (${ownerProfile.faculty_short || 'UMS'})`
            : 'Jawatankuasa Penganjur UMS'),
        organizerPhone:
          p.organizer_phone || ownerProfile?.phone || '+6012-883 4910',
      };
    });
  }, [projects, profiles, currentUser]);

  const currentCard =
    cardsCatalog[cardIndex % cardsCatalog.length] || cardsCatalog[0];
  const modalCard = useMemo(
    () =>
      cardsCatalog.find((c) => c.id === inspectedCardId) ||
      currentCard ||
      cardsCatalog[0],
    [cardsCatalog, inspectedCardId, currentCard]
  );
  const activeProjectObj: Project = currentCard?.projectObj || projects[0];

  // Real 40/25/20/15 Match Evaluation from Normalized Tables + Active Filter Tags
  const matchData = useMemo(() => {
    if (!currentUser || !activeProjectObj) {
      return {
        score: 78,
        skillScore: 31,
        interestScore: 19,
        scheduleScore: 16,
        goalScore: 12,
        explanationSummary: '',
        matchedSkillsNames: [] as string[],
        sharedInterestsNames: [] as string[],
        overlapSlotSummaries: [] as string[],
      };
    }

    const evaluated = evaluateStudentProjectMatch({
      student: currentUser,
      project: activeProjectObj,
      skillsCatalog: skills,
      interestsCatalog: interests,
      studentSkills,
      projectRequiredSkills,
      studentInterests,
      projectInterests,
      studentSlots: availabilitySlots,
      projectSlots: projectMeetingSlots,
      projectMembers,
      activeFilterTags: selectedTags,
      requireDiscoveryConsent: false,
    });

    return {
      score: evaluated.totalScore,
      skillScore: evaluated.skillScore,
      interestScore: evaluated.interestScore,
      scheduleScore: evaluated.scheduleScore,
      goalScore: evaluated.goalScore,
      explanationSummary: evaluated.explanationSummary,
      matchedSkillsNames: evaluated.matchedSkillsNames,
      sharedInterestsNames: evaluated.sharedInterestsNames,
      overlapSlotSummaries: evaluated.overlapSlotSummaries,
    };
  }, [
    currentUser,
    activeProjectObj,
    skills,
    interests,
    studentSkills,
    projectRequiredSkills,
    studentInterests,
    projectInterests,
    availabilitySlots,
    projectMeetingSlots,
    projectMembers,
    selectedTags,
  ]);

  // All projects ranked by match score for the Matches modal & Search page
  const rankedProjectsList = useMemo(() => {
    if (!currentUser) return [];
    return projects
      .map((proj, idx) => ({
        project: proj,
        cardIdx: idx,
        evalResult: evaluateStudentProjectMatch({
          student: currentUser,
          project: proj,
          skillsCatalog: skills,
          interestsCatalog: interests,
          studentSkills,
          projectRequiredSkills,
          studentInterests,
          projectInterests,
          studentSlots: availabilitySlots,
          projectSlots: projectMeetingSlots,
          projectMembers,
          activeFilterTags: selectedTags,
          requireDiscoveryConsent: false,
        }),
      }))
      .sort((a, b) => b.evalResult.totalScore - a.evalResult.totalScore);
  }, [
    currentUser,
    projects,
    skills,
    interests,
    studentSkills,
    projectRequiredSkills,
    studentInterests,
    projectInterests,
    availabilitySlots,
    projectMeetingSlots,
    projectMembers,
    selectedTags,
  ]);

  // Match Breakdown & Deep Relational Details for the currently inspected modalCard (used on Dedicated Activity Detail Page)
  const modalMatchData = useMemo(() => {
    const foundRanked = rankedProjectsList.find(
      (r) => r.project.id === modalCard?.id
    );
    if (foundRanked) {
      return {
        score: foundRanked.evalResult.totalScore,
        skillScore: foundRanked.evalResult.skillScore,
        interestScore: foundRanked.evalResult.interestScore,
        scheduleScore: foundRanked.evalResult.scheduleScore,
        goalScore: foundRanked.evalResult.goalScore,
        explanationSummary: foundRanked.evalResult.explanationSummary,
        matchedSkillsNames: foundRanked.evalResult.matchedSkillsNames,
        sharedInterestsNames: foundRanked.evalResult.sharedInterestsNames,
        overlapSlotSummaries: foundRanked.evalResult.overlapSlotSummaries,
      };
    }
    return matchData;
  }, [rankedProjectsList, modalCard, matchData]);

  // Normalized Required Skills for modalCard (joined with skills catalog & student's own skills)
  const modalRequiredSkills = useMemo(() => {
    if (!modalCard) return [];
    const skillMap = new Map(skills.map((s) => [s.id, s]));
    const studentSkillSet = new Set(myNormalizedSkills.map((ms) => ms.skill_id));
    return projectRequiredSkills
      .filter((prs) => prs.project_id === modalCard.id)
      .map((prs) => ({
        skill_id: prs.skill_id,
        name: skillMap.get(prs.skill_id)?.name || prs.skill_id,
        category: skillMap.get(prs.skill_id)?.category || 'Technical',
        mandatory: prs.mandatory,
        importance: prs.importance,
        studentHasSkill: studentSkillSet.has(prs.skill_id),
      }));
  }, [modalCard, projectRequiredSkills, skills, myNormalizedSkills]);

  // Normalized Interests for modalCard (joined with interests catalog & student's own interests)
  const modalProjectInterests = useMemo(() => {
    if (!modalCard) return [];
    const interestMap = new Map(interests.map((i) => [i.id, i]));
    const studentInterestSet = new Set(
      myNormalizedInterests.map((mi) => mi.interest_id)
    );
    return projectInterests
      .filter((pi) => pi.project_id === modalCard.id)
      .map((pi) => ({
        interest_id: pi.interest_id,
        name: interestMap.get(pi.interest_id)?.name || pi.interest_id,
        isShared: studentInterestSet.has(pi.interest_id),
      }));
  }, [modalCard, projectInterests, interests, myNormalizedInterests]);

  // Normalized Weekly Meeting Slots for modalCard
  const modalMeetingSlots = useMemo(() => {
    if (!modalCard) return [];
    const mySlots = availabilitySlots.filter(
      (as) => as.student_id === currentUser?.id
    );
    return projectMeetingSlots
      .filter((ms) => ms.project_id === modalCard.id)
      .map((ms) => {
        const dayName = WEEKDAY_SHORT[ms.weekday] || `Day ${ms.weekday}`;
        const hasOverlap = mySlots.some(
          (st) =>
            st.weekday === ms.weekday &&
            st.start_time < ms.end_time &&
            ms.start_time < st.end_time
        );
        return {
          ...ms,
          dayName,
          hasOverlap,
        };
      });
  }, [modalCard, projectMeetingSlots, availabilitySlots, currentUser]);

  const isModalCardSaved = useMemo(() => {
    if (!currentUser || !modalCard) return false;
    return savedProjects.some(
      (s) => s.student_id === currentUser.id && s.project_id === modalCard.id
    );
  }, [savedProjects, currentUser, modalCard]);

  // Enriched Search Catalog with live Match Score, Breakdown, Skills & Saved status
  const enrichedSearchCatalog = useMemo(() => {
    const skillMap = new Map(skills.map((s) => [s.id, s.name]));
    return cardsCatalog.map((card, idx) => {
      const rankedItem = rankedProjectsList.find(
        (r) => r.project.id === card.id
      );
      const score = rankedItem ? rankedItem.evalResult.totalScore : 78;
      const isCardSaved = Boolean(
        currentUser &&
          savedProjects.some(
            (s) => s.student_id === currentUser.id && s.project_id === card.id
          )
      );
      const reqSkillNames = projectRequiredSkills
        .filter((prs) => prs.project_id === card.id)
        .map((prs) => skillMap.get(prs.skill_id) || prs.skill_id);
      const meetSlotsCount = projectMeetingSlots.filter(
        (ms) => ms.project_id === card.id
      ).length;
      return {
        ...card,
        orderIndex: idx,
        matchScore: score,
        isCardSaved,
        reqSkillNames,
        meetSlotsCount,
      };
    });
  }, [
    cardsCatalog,
    rankedProjectsList,
    currentUser,
    savedProjects,
    skills,
    projectRequiredSkills,
    projectMeetingSlots,
  ]);

  // Live Category Counts for Category Filter Pills
  const searchCategoryCounts = useMemo(() => {
    return {
      All: enrichedSearchCatalog.length,
      'High Match': enrichedSearchCatalog.filter((i) => i.matchScore >= 70)
        .length,
      Saved: enrichedSearchCatalog.filter((i) => i.isCardSaved).length,
      Competition: enrichedSearchCatalog.filter(
        (i) => i.projectObj.project_type === 'Competition'
      ).length,
      Innovation: enrichedSearchCatalog.filter(
        (i) => i.projectObj.project_type === 'Innovation'
      ).length,
      Community: enrichedSearchCatalog.filter(
        (i) => i.projectObj.project_type === 'Community'
      ).length,
      Assignment: enrichedSearchCatalog.filter(
        (i) => i.projectObj.project_type === 'Assignment'
      ).length,
    } as Record<string, number>;
  }, [enrichedSearchCatalog]);

  const toggleSearchSkillChip = (chip: string) => {
    setSearchSkillFilters((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  // Filtered & Sorted Search Results based on query, category, faculty/location, multi-skill chips, and sort order
  const filteredSearchCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = enrichedSearchCatalog.filter((item) => {
      if (q) {
        const matchesText =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.locationText.toLowerCase().includes(q) ||
          item.organizerName.toLowerCase().includes(q) ||
          item.facultyLabel1.toLowerCase().includes(q) ||
          item.facultyLabel2.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.reqSkillNames.some((sn) => sn.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      if (searchCategory === 'High Match') {
        if (item.matchScore < 70) return false;
      } else if (searchCategory === 'Saved') {
        if (!item.isCardSaved) return false;
      } else if (searchCategory !== 'All') {
        if (item.projectObj.project_type !== searchCategory) return false;
      }

      if (searchFacultyFilter !== 'All') {
        const facLower = searchFacultyFilter.toLowerCase();
        const matchesFaculty =
          item.facultyLabel1.toLowerCase().includes(facLower) ||
          item.facultyLabel2.toLowerCase().includes(facLower) ||
          item.locationText.toLowerCase().includes(facLower) ||
          item.audienceText.toLowerCase().includes(facLower) ||
          item.title.toLowerCase().includes(facLower);
        if (!matchesFaculty) return false;
      }

      if (searchSkillFilters.length > 0) {
        const matchesAllSelectedChips = searchSkillFilters.every((chip) => {
          const sf = chip.toLowerCase();
          return (
            item.tags.some((t) => t.toLowerCase().includes(sf)) ||
            item.reqSkillNames.some((sn) => sn.toLowerCase().includes(sf)) ||
            (item.projectObj.attribute_tags || []).some((at) =>
              at.toLowerCase().includes(sf)
            ) ||
            item.description.toLowerCase().includes(sf) ||
            item.title.toLowerCase().includes(sf)
          );
        });
        if (!matchesAllSelectedChips) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (searchSortBy === 'match') {
        return b.matchScore - a.matchScore;
      }
      if (searchSortBy === 'newest') {
        return (
          new Date(b.projectObj.created_at).getTime() -
          new Date(a.projectObj.created_at).getTime()
        );
      }
      if (searchSortBy === 'hours') {
        return (
          (a.projectObj.min_weekly_hours || 6) -
          (b.projectObj.min_weekly_hours || 6)
        );
      }
      if (searchSortBy === 'slots') {
        return (
          (b.projectObj.slots_needed || 4) - (a.projectObj.slots_needed || 4)
        );
      }
      return 0;
    });
  }, [
    enrichedSearchCatalog,
    searchQuery,
    searchCategory,
    searchFacultyFilter,
    searchSkillFilters,
    searchSortBy,
  ]);

  // Filtered Bookmarks / Saved Activities Catalog for the Saved Activities page
  const filteredSavedCatalog = useMemo(() => {
    const q = savedSearchQuery.trim().toLowerCase();
    return enrichedSearchCatalog
      .filter((item) => item.isCardSaved)
      .filter((item) => {
        if (savedCategoryFilter === 'High Match') {
          if (item.matchScore < 70) return false;
        } else if (savedCategoryFilter !== 'All') {
          if (item.projectObj.project_type !== savedCategoryFilter)
            return false;
        }
        if (q) {
          const note = (bookmarkNotes[item.id] || '').toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.locationText.toLowerCase().includes(q) ||
            item.organizerName.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q)) ||
            note.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [
    enrichedSearchCatalog,
    savedSearchQuery,
    savedCategoryFilter,
    bookmarkNotes,
  ]);

  // Live 40/25/20/15 Match Score Evaluation for the Draft Activity on the Post Activity Page
  const liveDraftMatchEval = useMemo(() => {
    if (!currentUser) {
      return {
        totalScore: 78,
        skillScore: 32,
        interestScore: 20,
        scheduleScore: 15,
        goalScore: 11,
      };
    }
    const draftProject: Project = {
      id: 'draft-preview',
      owner_id: currentUser.id,
      title: newTitle.trim() || 'Aktiviti Baharu Kampus UMS',
      description:
        newDesc.trim() ||
        'Aktiviti dan kolaborasi projek pelajar Universiti Malaysia Sabah (UMS).',
      project_type: newType,
      slots_needed: newSlotsNeeded,
      min_weekly_hours: newMinWeeklyHours,
      status: 'open',
      deadline: newDeadline,
      date_display: newDateText,
      location: newLocationText,
      audience: newAudience,
      badge_line_1: newBadgeLine1,
      badge_line_2: newBadgeLine2,
      tags: [
        newTag1.trim() || 'Tech',
        newTag2.trim() || 'Networking',
        newTag3.trim() || newType,
      ],
      attribute_tags: newAttributeTags,
      organizer_name: newOrganizerName,
      organizer_phone: newOrganizerPhone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return evaluateStudentProjectMatch({
      student: currentUser,
      project: draftProject,
      skillsCatalog: skills,
      interestsCatalog: interests,
      studentSkills,
      projectRequiredSkills: newRequiredSkills.map((r) => ({
        project_id: 'draft-preview',
        skill_id: r.skill_id,
        mandatory: r.mandatory,
        importance: r.importance,
      })),
      studentInterests,
      projectInterests: newProjectInterests.map((interest_id) => ({
        project_id: 'draft-preview',
        interest_id,
      })),
      studentSlots: availabilitySlots,
      projectSlots: newMeetingSlots.map((m, idx) => ({
        id: `draft-ms-${idx}`,
        project_id: 'draft-preview',
        weekday: m.weekday,
        start_time: m.start_time,
        end_time: m.end_time,
      })),
      projectMembers,
      activeFilterTags: selectedTags,
      requireDiscoveryConsent: false,
    });
  }, [
    currentUser,
    studentSkills,
    studentInterests,
    availabilitySlots,
    projectMembers,
    newTitle,
    newDesc,
    newType,
    newSlotsNeeded,
    newMinWeeklyHours,
    newDeadline,
    newDateText,
    newLocationText,
    newAudience,
    newBadgeLine1,
    newBadgeLine2,
    newTag1,
    newTag2,
    newTag3,
    newAttributeTags,
    newOrganizerName,
    newOrganizerPhone,
    newRequiredSkills,
    newProjectInterests,
    newMeetingSlots,
    skills,
    interests,
    selectedTags,
  ]);

  const isSaved = useMemo(() => {
    if (!currentUser || !currentCard) return false;
    return savedProjects.some(
      (s) => s.student_id === currentUser.id && s.project_id === currentCard.id
    );
  }, [savedProjects, currentUser, currentCard]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 4;
    return notifications.filter(
      (n) => n.recipient_id === currentUser.id && !n.read_at
    ).length;
  }, [notifications, currentUser]);

  const handleRandomize = () => {
    triggerSwipeRight();
    randomizeFilterTags();
  };

  // Swipe Right -> Front card flies off right & disappears, card behind moves to front in loop
  const triggerSwipeRight = () => {
    if (flyOffDir) return;
    setIsDraggingCard(false);
    setFlyOffDir('right');
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
      setFlyOffDir(null);
      setDragOffset({x: 0, y: 0});
    }, 230);
  };

  // Swipe Left -> Front card flies off left & disappears, card behind moves to front in loop,
  // AND automatically bookmarks & navigates to the Dedicated Activity Detail Page for the swiped card!
  const triggerSwipeLeft = () => {
    if (flyOffDir || !currentCard) return;
    const swipedCardId = currentCard.id;
    setInspectedCardId(swipedCardId);
    setIsDraggingCard(false);
    setFlyOffDir('left');
    saveProjectOnly(swipedCardId);
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
      setFlyOffDir(null);
      setDragOffset({x: 0, y: 0});
      setActiveModal(null);
      setIsActivityPageOpen(true);
    }, 230);
  };

  // Opens the Dedicated Full-Screen Activity Detail Page from any section in the app
  const openCardInfoModal = (cardId?: string) => {
    setInspectedCardId(cardId || currentCard?.id || null);
    setActiveModal(null);
    setIsActivityPageOpen(true);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (flyOffDir) return;
    dragStartPosRef.current = {x: clientX, y: clientY};
    setIsDraggingCard(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingCard || !dragStartPosRef.current || flyOffDir) return;
    const dx = clientX - dragStartPosRef.current.x;
    const dy = clientY - dragStartPosRef.current.y;
    // Allow natural vertical page scrolling if the user gestures primarily up/down
    if (Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dragOffset.x) < 12) {
      return;
    }
    setDragOffset({x: dx, y: dy * 0.35});
  };

  const handleDragEnd = () => {
    if (!isDraggingCard) return;
    setIsDraggingCard(false);
    dragStartPosRef.current = null;
    if (dragOffset.x < -60) {
      triggerSwipeLeft();
    } else if (dragOffset.x > 60) {
      triggerSwipeRight();
    } else {
      setDragOffset({x: 0, y: 0});
    }
  };

  // Computed Tinder-style transforms for the 3-card stack (offset 0 = front, 1 = middle, 2 = back)
  const dragProgress = flyOffDir
    ? 1
    : Math.min(1, Math.abs(dragOffset.x) / 110);

  const topCardTransform =
    flyOffDir === 'left'
      ? 'translate3d(-440px, 24px, 0) rotate(-18deg)'
      : flyOffDir === 'right'
      ? 'translate3d(440px, 24px, 0) rotate(18deg)'
      : `translate3d(${dragOffset.x}px, ${
          dragOffset.y * 0.22
        }px, 0) rotate(${(dragOffset.x * 0.055).toFixed(2)}deg)`;

  // Direct WhatsApp URL for modalCard organizer
  const whatsappUrl = useMemo(() => {
    const rawDigits = (modalCard?.organizerPhone || '+60128834910').replace(
      /[^0-9]/g,
      ''
    );
    const normalizedPhone = rawDigits.startsWith('0')
      ? `6${rawDigits}`
      : rawDigits;
    const msg = `Salam / Hi ${
      modalCard?.organizerName || 'Penganjur'
    }, saya ${currentUser?.display_name || 'Fahrin'} (${
      currentUser?.matric_no || 'A2412345'
    }) dari ${
      currentUser?.faculty_short || 'FKI'
    }, UMS. Saya melihat aktiviti "${
      modalCard?.title || 'FKI TechFest 2026'
    }" di aplikasi ProjectLink UMS dan ingin menyertai / mengetahui maklumat lanjut!`;
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`;
  }, [modalCard, currentUser]);

  // Animated Percentage Count-Up & Spring Pop Key for Matches Potential Card
  const [animatedScore, setAnimatedScore] = useState<number>(matchData.score);
  const matchAnimKey = `${cardIndex}-${matchData.score}`;

  useEffect(() => {
    const targetScore = matchData.score;
    const startScore = Math.max(12, Math.round(targetScore * 0.35));
    const durationMs = 480;
    const startTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic curve for snappy count-up
      const eased = 1 - Math.pow(1 - t, 3);
      const nextVal = Math.round(
        startScore + (targetScore - startScore) * eased
      );
      setAnimatedScore(nextVal);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [cardIndex, matchData.score]);

  // SVG Ring Constants for Matches Potential (reacts to both live drag coil & count-up)
  const ringRadius = 35;
  const ringCircumference = Number((2 * Math.PI * ringRadius).toFixed(2));
  const effectiveRingScore = isDraggingCard
    ? Math.max(15, Math.round(animatedScore * (1 - dragProgress * 0.22)))
    : animatedScore;
  const ringOffset = Number(
    (
      ringCircumference -
      (ringCircumference * effectiveRingScore) / 100
    ).toFixed(2)
  );

  // Live Drag-Reactive Transforms for Matches Potential Card & Chart Ring
  const matchCardLiveStyle: React.CSSProperties = isDraggingCard
    ? {
        transform: `translate3d(${(dragOffset.x * 0.045).toFixed(1)}px, ${(
          dragProgress * 2.5
        ).toFixed(1)}px, 0) rotate(${(dragOffset.x * 0.012).toFixed(
          2
        )}deg) scale(${(1 - dragProgress * 0.025).toFixed(3)})`,
        boxShadow:
          dragOffset.x < -15
            ? `0 14px 34px rgba(168, 85, 247, ${(
                0.35 +
                dragProgress * 0.35
              ).toFixed(2)})`
            : dragOffset.x > 15
            ? `0 14px 34px rgba(56, 189, 248, ${(
                0.3 +
                dragProgress * 0.3
              ).toFixed(2)})`
            : '0 10px 28px rgba(18,3,48,0.35)',
        transition: 'none',
      }
    : {
        transition:
          'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms ease',
      };

  const matchRingLiveStyle: React.CSSProperties = isDraggingCard
    ? {
        transform: `scale(${(1 - dragProgress * 0.1).toFixed(3)}) rotate(${(
          dragOffset.x * 0.09
        ).toFixed(1)}deg)`,
        transition: 'none',
      }
    : {
        transition: 'transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      };

  const sidebarRole = currentUser?.role_mode || 'STUDENT';
  const availabilityStatus = currentUser?.availability_status || 'Available';

  return (
    <div className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#13042B] flex items-center justify-center select-none">
      {/* =========================================================
          TABLET & LAPTOP BLOCKER (Unusable on >= 640px screens)
         ========================================================= */}
      <div
        role="alert"
        aria-live="assertive"
        className="hidden sm:flex fixed inset-0 z-[9999] bg-gradient-to-b from-[#1A053B] via-[#2A085E] to-[#110229] text-white flex-col items-center justify-center p-8 text-center cursor-not-allowed select-none"
      >
        <div className="max-w-md w-full rounded-[32px] bg-white/10 border border-white/20 backdrop-blur-xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65)] flex flex-col items-center space-y-5 pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F1FF] flex items-center justify-center shadow-lg">
            <ProjectLinkPLogo src={appIconUrl} className="w-11 h-11" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span>Tablet &amp; Laptop Mode Disabled</span>
          </div>

          <h1 className="text-2xl font-extrabold font-display tracking-tight text-white">
            Unusable on Tablet &amp; Laptop
          </h1>

          <p className="text-sm text-purple-100/85 leading-relaxed">
            <strong>ProjectLink UMS</strong> direka khas untuk paparan{' '}
            <strong>Telefon Pintar (Mobile Only)</strong> sahaja dan tidak boleh
            digunakan pada skrin Tablet atau Laptop.
          </p>

          <div className="w-full rounded-2xl bg-black/30 border border-white/15 p-4 text-xs text-purple-200/90 space-y-1.5">
            <div className="font-bold text-white">
              Sila tukar ke mod Mobile (&lt; 640px):
            </div>
            <p className="text-[11.5px] text-purple-200/75">
              Buka aplikasi ini menggunakan telefon pintar atau tukar paparan
              pralihat (Preview) kepada saiz <strong>Mobile</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Single Non-Scrolling App Screen Container (Mobile Only < 640px) */}
      <div className="sm:hidden relative w-full h-dvh overflow-hidden flex flex-col justify-between bg-gradient-to-b from-[#F5F1FF] via-[#671AE6] via-[48%] to-[#220352]">
        {/* Non-Intrusive Floating RPC Toast Feedback */}
        {toasts.length > 0 && (
          <div className="absolute top-14 inset-x-5 z-[70] pointer-events-none flex flex-col gap-1.5">
            {toasts.slice(-1).map((t) => (
              <div
                key={t.id}
                onClick={() => dismissToast(t.id)}
                className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-[#1A063E]/95 border border-purple-400/50 text-white shadow-xl backdrop-blur-md flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-extrabold text-purple-200 truncate">
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="text-[10.5px] text-white/80 truncate">
                      {t.description}
                    </div>
                  )}
                </div>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* =========================================================
            0. THREE-STAGE LOGIN & REGISTRATION FLOW
            Stage 1: Splash Screen (auto-transitions after 1.8s or on tap)
            Stage 2: Welcome Screen (top white logo area + bottom purple curved card with Sign In / Sign Up pills)
            Stage 3: Sign In / Sign Up Screen (purple header + curved white form sheet, Email & UMS Student Details)
           ========================================================= */}
        {authStage !== 'authenticated' && (
          <div className="absolute inset-0 z-50 overflow-hidden flex flex-col select-none">
            {/* -----------------------------------------------------
                STAGE 1: SPLASH SCREEN (Matches Left Phone in Reference)
               ----------------------------------------------------- */}
            {authStage === 'splash' && (
              <div
                onClick={() => setAuthStage('welcome')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setAuthStage('welcome');
                  }
                }}
                aria-label="Splash Screen - Ketik untuk teruskan ke Welcome"
                className="relative w-full h-full bg-[#FAF8FF] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
              >
                {/* Top-Right Bold Curved Circle Shape (ProjectLink Royal Purple) */}
                <div className="pointer-events-none absolute -top-14 -right-14 w-48 h-48 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#6315EA] to-[#4311B5] shadow-[0_12px_40px_rgba(99,21,234,0.28)]" />

                {/* Bottom-Left Bold Curved Circle Shape (ProjectLink Royal Purple) */}
                <div className="pointer-events-none absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[#3B098E] via-[#6315EA] to-[#8B5CF6] shadow-[0_-12px_45px_rgba(99,21,234,0.28)]" />

                {/* Center Brand Emblem & Typography */}
                <div className="relative z-10 flex flex-col items-center text-center px-6 -mt-6">
                  <div className="w-24 h-24 rounded-[28px] bg-white shadow-[0_14px_34px_rgba(99,21,234,0.16)] border border-purple-100 flex items-center justify-center p-3.5 mb-5">
                    <ProjectLinkPLogo
                      src={appIconUrl}
                      className="w-full h-full rounded-xl"
                    />
                  </div>

                  <div className="text-[36px] font-extrabold font-display tracking-tight leading-none text-[#141132]">
                    <span>Project</span>
                    <span className="text-[#6315EA]">Link</span>
                  </div>

                  <div className="mt-2.5 text-[11px] font-bold tracking-[0.38em] text-[#3B3561] uppercase">
                    U M S &nbsp; C A M P U S
                  </div>
                </div>

                {/* Subtle Stage Progress & Tap Prompt at Bottom-Right */}
                <div className="absolute bottom-7 right-6 z-10 flex items-center gap-2 text-[10.5px] font-bold text-[#6315EA]/80">
                  <span>Ketik untuk mula</span>
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </div>
            )}

            {/* -----------------------------------------------------
                STAGE 2: WELCOME SCREEN (Matches Middle Phone in Reference)
               ----------------------------------------------------- */}
            {authStage === 'welcome' && (
              <div className="relative w-full h-full bg-[#FAF8FF] flex flex-col justify-between overflow-hidden">
                {/* Top White/Lavender Brand Section */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-4 text-center">
                  <div className="w-22 h-22 rounded-[26px] bg-white shadow-[0_12px_30px_rgba(99,21,234,0.14)] border border-purple-100 flex items-center justify-center p-3 mb-4">
                    <ProjectLinkPLogo
                      src={appIconUrl}
                      className="w-full h-full rounded-xl"
                    />
                  </div>

                  <div className="text-[34px] font-extrabold font-display tracking-tight leading-none text-[#141132]">
                    <span>Project</span>
                    <span className="text-[#6315EA]">Link</span>
                  </div>

                  <div className="mt-2 text-[10.5px] font-bold tracking-[0.36em] text-[#3B3561] uppercase">
                    U M S &nbsp; C A M P U S
                  </div>
                </div>

                {/* Bottom Rounded Purple Welcome Card */}
                <div className="relative rounded-t-[40px] bg-gradient-to-br from-[#6E23F7] via-[#5B18E5] to-[#3B0A99] px-7 pt-9 pb-10 text-white shadow-[0_-16px_44px_rgba(59,10,153,0.34)]">
                  <h1 className="text-[30px] font-extrabold font-display tracking-tight text-white leading-tight">
                    Welcome
                  </h1>

                  <p className="mt-3 text-[13px] text-purple-100/90 font-medium leading-relaxed">
                    Platform rasmi padanan kemahiran, pencarian ahli pasukan projek, dan hebahan aktiviti pelajar Universiti Malaysia Sabah (UMS).
                  </p>

                  {/* Two Side-by-Side Pill Buttons: Sign In (Dark) & Sign Up (White) */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAuthStage('signin')}
                      className="py-3.5 px-5 rounded-full bg-[#120E2E] hover:bg-[#1D1746] text-white font-extrabold text-[13.5px] shadow-[0_10px_24px_rgba(10,5,30,0.38)] active:scale-95 transition-all cursor-pointer"
                    >
                      Sign In
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthStage('signup')}
                      className="py-3.5 px-5 rounded-full bg-white hover:bg-[#F5F1FF] text-[#141132] font-extrabold text-[13.5px] shadow-[0_10px_24px_rgba(18,14,46,0.18)] active:scale-95 transition-all cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -----------------------------------------------------
                STAGE 3: SIGN IN & SIGN UP SCREEN (Matches Right Phone in Reference)
               ----------------------------------------------------- */}
            {(authStage === 'signin' || authStage === 'signup') && (
              <div className="relative w-full h-full bg-gradient-to-br from-[#6E23F7] via-[#5B18E5] to-[#4311B5] flex flex-col overflow-hidden">
                {/* Top Purple Header Bar + Title + Subtitle */}
                <div className="px-6 pt-5 pb-9 text-white shrink-0">
                  <div className="flex items-center justify-between mb-5">
                    <button
                      type="button"
                      onClick={() => setAuthStage('welcome')}
                      aria-label="Back to Welcome"
                      className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAuthStage(
                          authStage === 'signin' ? 'signup' : 'signin'
                        )
                      }
                      className="text-[13px] font-extrabold text-white hover:text-purple-200 transition-colors cursor-pointer"
                    >
                      {authStage === 'signin' ? 'Register' : 'Sign In'}
                    </button>
                  </div>

                  <h1 className="text-[30px] font-extrabold font-display tracking-tight text-white leading-tight">
                    {authStage === 'signin' ? 'Sign In' : 'Sign Up'}
                  </h1>

                  <p className="mt-2 text-[12.5px] text-purple-100/90 font-medium leading-relaxed max-w-[320px]">
                    {authStage === 'signin'
                      ? 'Log masuk menggunakan e-mel pelajar UMS anda untuk mengakses aktiviti dan padanan projek.'
                      : 'Daftar akaun pelajar baharu dengan e-mel UMS, nama penuh, dan fakulti pengajian anda.'}
                  </p>
                </div>

                {/* Bottom Curved White Sheet */}
                <div className="flex-1 bg-[#FAF9FE] rounded-t-[38px] -mt-3 px-6 pt-7 pb-6 flex flex-col justify-between overflow-y-auto no-scrollbar shadow-[0_-14px_38px_rgba(18,6,52,0.28)]">
                  {authStage === 'signin' ? (
                    <>
                      {/* SIGN IN FORM */}
                      <form
                        onSubmit={handleEmailSignInSubmit}
                        className="space-y-3.5"
                      >
                        <div>
                          <input
                            type="text"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="E-mel UMS / Username (cth: fahrin@student.ums.edu.my)"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3.5 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white pl-5 pr-12 py-3.5 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowLoginPassword((prev) => !prev)
                            }
                            aria-label="Toggle password visibility"
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#6315EA] cursor-pointer"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex justify-end pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setLoginPassword('ums2026');
                              notifyToast(
                                ' Bantuan Kata Laluan UMS',
                                'Kata laluan lalai akaun pelajar telah diisi semula (ums2026).',
                                'default'
                              );
                            }}
                            className="text-[11.5px] font-bold text-[#141132] hover:text-[#6315EA] transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          className="mt-2 w-full py-4 rounded-full bg-[#120E2E] hover:bg-[#1E1848] text-white font-extrabold text-[14px] shadow-[0_10px_26px_rgba(18,14,46,0.28)] active:scale-[0.99] transition-all cursor-pointer"
                        >
                          Sign In
                        </button>
                      </form>

                      {/* Bottom Email Account Quick Actions (Replaces Google/Facebook with UMS Email Accounts & Register Card) */}
                      <div className="pt-5 mt-5 border-t border-slate-200/70 space-y-2.5">
                        <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                          Akses Pantas E-mel Pelajar UMS
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            switchPersona('usr-aiman');
                            completeAuthentication();
                          }}
                          className="w-full rounded-full bg-white hover:bg-[#F5F1FF] border border-slate-200/80 shadow-[0_6px_20px_rgba(20,17,50,0.06)] px-4 py-3 flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#EFE9FF] text-[#6315EA] flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className="text-[12.5px] font-extrabold text-[#141132] truncate">
                                Teruskan sebagai Fahrin (FKI)
                              </div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                fahrin@student.ums.edu.my
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#141132] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuthStage('signup')}
                          className="w-full rounded-full bg-white hover:bg-[#F5F1FF] border border-slate-200/80 shadow-[0_6px_20px_rgba(20,17,50,0.06)] px-4 py-3 flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#EFE9FF] text-[#6315EA] flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className="text-[12.5px] font-extrabold text-[#141132] truncate">
                                Daftar Akaun E-mel Baharu
                              </div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                Nama Penuh, E-mel UMS &amp; Fakulti
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#141132] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* SIGN UP / REGISTER BY EMAIL + EXTRA DETAILS FORM */}
                      <form
                        onSubmit={handleEmailSignUpSubmit}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Nama Penuh Pelajar
                          </label>
                          <input
                            type="text"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="Contoh: Fahrin Muneer"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            E-mel Pelajar UMS
                          </label>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="nama@student.ums.edu.my"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Kata Laluan
                          </label>
                          <div className="relative">
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Minimum 4 aksara"
                              className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white pl-5 pr-12 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowRegPassword((prev) => !prev)
                              }
                              aria-label="Toggle register password visibility"
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#6315EA] cursor-pointer"
                            >
                              {showRegPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Fakulti UMS (FKI / FKJ / dll)
                          </label>
                          <select
                            value={regFacultyShort}
                            onChange={(e) => setRegFacultyShort(e.target.value)}
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[12.5px] font-bold text-[#141132] focus:outline-none transition-all cursor-pointer"
                          >
                            {UMS_FACULTY_OPTIONS.map((fac) => (
                              <option key={fac.short} value={fac.short}>
                                {fac.short} — {fac.full}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-1.5">
                          <button
                            type="submit"
                            className="w-full py-3.5 rounded-full bg-[#120E2E] hover:bg-[#1E1848] text-white font-extrabold text-[14px] shadow-[0_10px_26px_rgba(18,14,46,0.28)] active:scale-[0.99] transition-all cursor-pointer"
                          >
                            Sign Up &amp; Masuk
                          </button>
                        </div>
                      </form>

                      {/* Bottom Switch to Sign In Card */}
                      <div className="pt-3 mt-3 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => setAuthStage('signin')}
                          className="w-full rounded-full bg-white hover:bg-[#F5F1FF] border border-slate-200/80 shadow-[0_6px_20px_rgba(20,17,50,0.06)] px-4 py-2.5 flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFE9FF] text-[#6315EA] flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="text-left">
                              <div className="text-[12px] font-extrabold text-[#141132]">
                                Sudah mempunyai akaun? Sign In
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Log masuk menggunakan e-mel UMS sedia ada
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#141132] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decorative Purple Background Waves & Diagonal Glow Streak */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-[64%] pointer-events-none z-0"
          viewBox="0 0 400 540"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="deepPurpleBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5614C7" />
              <stop offset="52%" stopColor="#3B098E" />
              <stop offset="100%" stopColor="#1B0242" />
            </linearGradient>
            <linearGradient id="neonStreak" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.1" />
              <stop offset="55%" stopColor="#F0ABFC" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width="400" height="540" fill="url(#deepPurpleBg)" />
          <path
            d="M-30,220 C110,270 250,150 430,210 L430,540 L-30,540 Z"
            fill="#430B9B"
            fillOpacity="0.55"
          />
          <path
            d="M155,545 Q285,435 415,385"
            fill="none"
            stroke="url(#neonStreak)"
            strokeWidth="3"
          />
        </svg>

        {/* =========================================================
            1. TOP BRAND HEADER (Shared by Home & Profile — Hidden on Search, Activity Detail, Post Activity & Side Pages)
            Clicking the top-left App Icon opens the Side Menu Drawer!
           ========================================================= */}
        {!isSearchPageOpen &&
          !isActivityPageOpen &&
          !isPostActivityPageOpen &&
          !activeSidePage && (
            <header className="relative z-20 px-4 pt-3.5 pb-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open ProjectLink Side Menu"
                className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none min-w-0"
              >
                <ProjectLinkPLogo
                  src={appIconUrl}
                  className="w-8 h-8 rounded-lg shrink-0 transition-transform group-hover:scale-105 group-active:scale-95"
                />
                <div className="text-[17.5px] font-extrabold tracking-[-0.02em] font-display leading-none whitespace-nowrap">
                  <span className="text-[#141132]">ProjectLink </span>
                  <span className="text-[#6315EA]">UMS</span>
                </div>
              </button>

              <div className="flex items-center gap-2.5 text-[#141132] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarItem('Saved Activities');
                    setActiveSidePage('saved-activities');
                  }}
                  aria-label="Open Saved Bookmarks"
                  className="relative p-1.5 rounded-xl hover:bg-white/50 active:scale-95 transition-all cursor-pointer"
                >
                  <Bookmark className="w-[19px] h-[19px] stroke-[2.1]" />
                  {searchCategoryCounts.Saved > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#6315EA] text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums shadow-xs">
                      {searchCategoryCounts.Saved}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarItem('Notifications');
                    setActiveSidePage('notifications');
                  }}
                  aria-label="Notifications"
                  className="relative p-1.5 rounded-xl hover:bg-white/50 active:scale-95 transition-all cursor-pointer"
                >
                  <Bell className="w-[19.5px] h-[19.5px] stroke-[2.1]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF3B30] border border-[#F5F1FF]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchPageOpen(true)}
                  aria-label="Open Full-Screen Search Page"
                  className="p-1.5 rounded-xl hover:bg-white/50 active:scale-95 transition-all cursor-pointer"
                >
                  <Search className="w-[19.5px] h-[19.5px] stroke-[2.1]" />
                </button>
              </div>
            </header>
          )}

        {/* =========================================================
            2. MAIN CONTENT AREA (Activity Detail Page OR Search Page OR Home / Profile)
           ========================================================= */}
        {isActivityPageOpen && modalCard ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN ACTIVITY DETAIL PAGE
             (No Main Header & No Bottom Navigation — Top-left Back button,
              deep activity/skills/schedule/match info, and floating bottom-right WhatsApp card)
             --------------------------------------------------------- */
          <div className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Full-Screen Activity Content (padded at bottom for the floating bottom-right WhatsApp card) */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-36 overscroll-y-contain">
              {/* HERO BANNER WITH FLOATING TOP-LEFT BACK BUTTON & TOP-RIGHT BOOKMARK */}
              <div className="relative h-[214px] w-full overflow-hidden bg-[#240850] shrink-0">
                <ActivityCardBanner
                  cardId={modalCard.id}
                  bannerUrl={modalCard.bannerUrl}
                  bannerPreset={modalCard.bannerPreset}
                  bannerPositionY={modalCard.bannerPositionY}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140430] via-[#140430]/35 to-black/25" />

                {/* Top Floating Bar: Only Back Button on Top-Left & Owner Edit Poster / Bookmark on Top-Right */}
                <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActivityPageOpen(false)}
                    aria-label="Kembali ke halaman sebelumnya"
                    className="h-11 px-3.5 rounded-full bg-white/95 hover:bg-white text-[#141132] shadow-[0_8px_22px_rgba(14,3,38,0.35)] border border-purple-200/80 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5] text-[#5B18E5]" />
                    <span className="text-xs font-extrabold tracking-tight">
                      Back
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    {modalCard.isOwner && (
                      <button
                        type="button"
                        onClick={() => openEditActivityBannerModal(modalCard.id)}
                        aria-label="Tukar Gambar Poster Aktiviti"
                        className="h-11 px-3.5 rounded-full bg-[#1A063E]/90 hover:bg-[#2B0B63] text-white border border-purple-300/60 shadow-[0_8px_22px_rgba(14,3,38,0.4)] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-amber-300 stroke-[2.2]" />
                        <span className="text-xs font-extrabold">
                          Tukar Gambar
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleSaveProject(modalCard.id)}
                      aria-label="Simpan aktiviti ini"
                      className={`h-11 px-3.5 rounded-full shadow-[0_8px_22px_rgba(14,3,38,0.35)] border flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                        isModalCardSaved
                          ? 'bg-[#6215E5] border-purple-300 text-white'
                          : 'bg-white/95 border-purple-200/80 text-[#141132]'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 stroke-[2.2] ${
                          isModalCardSaved ? 'fill-current' : ''
                        }`}
                      />
                      <span className="text-xs font-extrabold">
                        {isModalCardSaved ? 'Saved' : 'Save'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Bottom Overlay Metadata on Hero Banner */}
                <div className="absolute bottom-3.5 inset-x-4 z-10 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-purple-200 mb-1">
                      <span>{modalCard.facultyLabel1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{modalCard.facultyLabel2}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300">+50 SDP</span>
                    </div>
                    <h1 className="text-[22px] font-extrabold font-display text-white leading-tight drop-shadow-md">
                      {modalCard.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* MAIN DEEP INFO CARDS CONTAINER */}
              <div className="px-4 pt-3.5 space-y-3.5">
                {/* CARD 1: FULL ACTIVITY INFO, LOGISTICS & DESCRIPTION */}
                <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.22)] space-y-3 text-[#14122E]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#5B18E5]">
                        Maklumat Penuh Aktiviti UMS
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">
                        Status: Terbuka · {modalCard.projectObj.slots_needed || 4}{' '}
                        Kekosongan Ahli ({modalCard.projectObj.min_weekly_hours || 6}{' '}
                        jam/minggu)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold font-display text-[#5B18E5] tabular-nums">
                        {modalMatchData.score}%
                      </span>
                      <div className="text-[9.5px] font-bold text-slate-500">
                        Skor Padanan
                      </div>
                    </div>
                  </div>

                  {/* Owner-Only Poster Control Row inside Card 1 */}
                  <div className="p-2.5 rounded-2xl bg-[#F5F0FF] border border-purple-200/80 flex items-center justify-between gap-2 text-xs">
                    {modalCard.isOwner ? (
                      <>
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#4E14B8]">
                            Anda ialah Pemilik Aktiviti Ini
                          </div>
                          <div className="text-[10.5px] text-slate-600">
                            Anda boleh muat naik poster baharu, guna URL, atau tukar preset UMS.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditActivityBannerModal(modalCard.id)}
                          className="px-3 py-2 rounded-xl bg-[#5B18E5] hover:bg-[#4C11C4] text-white text-[11px] font-extrabold shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Tukar Gambar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-700">
                            Poster Dikawal oleh Pemilik Aktiviti
                          </div>
                          <div className="text-[10.5px] text-slate-500 truncate">
                            Pemilik: {modalCard.organizerName}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            switchPersona(modalCard.ownerId);
                            notifyToast(
                              'Akaun Ditukar kepada Pemilik',
                              `Anda kini log masuk sebagai pemilik aktiviti ini dan boleh menukar gambar poster.`,
                              'default'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 text-[#5B18E5] text-[10.5px] font-extrabold shrink-0 cursor-pointer hover:bg-purple-50"
                        >
                          Uji Sebagai Pemilik
                        </button>
                      </>
                    )}
                  </div>

                  {/* Key Logistics Rows */}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F7F4FF]">
                      <Calendar className="w-4 h-4 text-[#5B18E5] shrink-0 mt-0.5 stroke-[2.2]" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">
                          Tarikh &amp; Tempoh Program
                        </div>
                        <div className="font-extrabold text-[#14122E]">
                          {modalCard.dateText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F7F4FF]">
                      <MapPin className="w-4 h-4 text-[#5B18E5] shrink-0 mt-0.5 stroke-[2.2]" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">
                          Lokasi Kampus UMS
                        </div>
                        <div className="font-extrabold text-[#14122E]">
                          {modalCard.locationText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F7F4FF]">
                      <Users className="w-4 h-4 text-[#5B18E5] shrink-0 mt-0.5 stroke-[2.2]" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">
                          Sasaran Penyertaan Pelajar
                        </div>
                        <div className="font-extrabold text-[#14122E]">
                          {modalCard.audienceText}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="pt-1">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Penerangan Terperinci &amp; Objektif
                    </h2>
                    <p className="text-[12.5px] text-slate-700 leading-relaxed font-medium">
                      {modalCard.description}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                      <span>Kategori: {modalCard.projectObj.project_type}</span>
                      <span aria-hidden="true">·</span>
                      <span> Tag: {modalCard.tags.join(' / ')}</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: 40/25/20/15 MATCH SCORE BREAKDOWN (PECAHAN SKOR PADANAN) */}
                <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.22)] space-y-3 text-[#14122E]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                        Pecahan Skor Padanan (40/25/20/15)
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                         Analisis kesesuaian profil pelajar anda ({currentUser?.display_name || 'Fahrin'}) dengan aktiviti ini
                      </p>
                    </div>
                    <span className="text-base font-extrabold text-[#5B18E5] tabular-nums">
                      {modalMatchData.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-[#F4EFFF] space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Kemahiran (40%)</span>
                        <span className="font-extrabold text-[#4E14B8] tabular-nums">
                          {modalMatchData.skillScore} / 40
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-purple-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#5B18E5]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((modalMatchData.skillScore / 40) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4EFFF] space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Minat Bersama (25%)</span>
                        <span className="font-extrabold text-[#4E14B8] tabular-nums">
                          {modalMatchData.interestScore} / 25
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-purple-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7C3AED]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (modalMatchData.interestScore / 25) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4EFFF] space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Jadual Masa (20%)</span>
                        <span className="font-extrabold text-[#4E14B8] tabular-nums">
                          {modalMatchData.scheduleScore} / 20
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-purple-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8B5CF6]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (modalMatchData.scheduleScore / 20) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4EFFF] space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Matlamat &amp; Tag (15%)</span>
                        <span className="font-extrabold text-[#4E14B8] tabular-nums">
                          {modalMatchData.goalScore} / 15
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-purple-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#A855F7]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((modalMatchData.goalScore / 15) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: REQUIRED SKILLS & SHARED INTERESTS (SYARAT KEMAHIRAN & MINAT) */}
                <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.22)] space-y-3 text-[#14122E]">
                  <div>
                    <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                      Syarat Kemahiran &amp; Minat Projek
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Kemahiran yang diperlukan oleh penganjur dan padanan dengan profil anda
                    </p>
                  </div>

                  {modalRequiredSkills.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Tiada syarat kemahiran khusus ditetapkan — terbuka kepada semua pelajar.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {modalRequiredSkills.map((req) => (
                        <div
                          key={req.skill_id}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                            req.studentHasSkill
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-[#F8F6FF] border-purple-100'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#14122E] flex items-center gap-1.5">
                              <span>{req.name}</span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                · {req.mandatory ? 'Wajib' : 'Pilihan'} (Kepentingan{' '}
                                {req.importance}/5)
                              </span>
                            </div>
                            <div className="text-[10.5px] text-slate-500 mt-0.5">
                              Kategori: {req.category}
                            </div>
                          </div>

                          <span
                            className={`text-[10.5px] font-extrabold shrink-0 ${
                              req.studentHasSkill
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {req.studentHasSkill ? '✓ Ada di Profil' : 'Belum ditambah'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {modalProjectInterests.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 mb-1">
                        Bidang Minat Aktiviti:
                      </div>
                      <div className="text-xs font-semibold text-[#4E14B8]">
                        {modalProjectInterests
                          .map((intr) =>
                            intr.isShared ? `✓ ${intr.name} (Sepadan)` : intr.name
                          )
                          .join(' · ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 4: WEEKLY SCHEDULE & MEETING SLOTS (JADUAL PERJUMPAAN) */}
                <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.22)] space-y-2.5 text-[#14122E]">
                  <div>
                    <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                      Jadual Perjumpaan &amp; Komitmen Masa
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Slot mingguan projek berbanding waktu lapang anda di UMS
                    </p>
                  </div>

                  {modalMeetingSlots.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Waktu fleksibel mengikut persetujuan ahli kumpulan dan penganjur.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {modalMeetingSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-2.5 rounded-2xl bg-[#F7F4FF] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#5B18E5] shrink-0" />
                            <div>
                              <span className="font-extrabold text-[#14122E]">
                                {slot.dayName}
                              </span>
                              <span className="text-slate-600 font-semibold ml-1.5 tabular-nums">
                                {slot.start_time} – {slot.end_time}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[10.5px] font-extrabold ${
                              slot.hasOverlap
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {slot.hasOverlap
                              ? '✓ Masa Lapang Sepadan'
                              : 'Semak Jadual Kuliah'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CARD 5: EXPLORE OTHER UMS ACTIVITIES QUICK SWITCHER */}
                <div className="rounded-[24px] bg-white/92 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.2)] space-y-2 text-[#14122E]">
                  <div className="text-xs font-extrabold text-slate-800">
                    Aktiviti UMS Lain Mengikut Skor Padanan:
                  </div>
                  <div className="space-y-1.5">
                    {rankedProjectsList.map(({project, evalResult}) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => setInspectedCardId(project.id)}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          project.id === modalCard.id
                            ? 'bg-[#F4EFFF] border-[#6215E5]'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-[#14122E] truncate">
                            {project.title}
                          </div>
                          <div className="text-[10.5px] text-slate-500 truncate">
                            {project.location || 'Kampus UMS'} · WA:{' '}
                            {project.organizer_phone || '+6012-883 4910'}
                          </div>
                        </div>
                        <span className="font-extrabold text-[#5B18E5] tabular-nums shrink-0">
                          {evalResult.totalScore}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING BOTTOM-RIGHT ORGANIZER & WHATSAPP DIRECT CARD */}
            <div className="absolute bottom-3.5 right-3.5 left-10 z-30 rounded-[24px] bg-gradient-to-br from-[#ECFDF5] via-white to-[#D1FAE5] border-2 border-emerald-400 p-3 shadow-[0_16px_40px_rgba(6,44,30,0.45)] flex items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-800 truncate">
                  Penganjur Aktiviti (WhatsApp)
                </div>
                <div className="text-xs font-extrabold text-slate-900 truncate">
                  {modalCard.organizerName}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 tabular-nums">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{modalCard.organizerPhone}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard
                          .writeText(modalCard.organizerPhone)
                          .catch(() => {});
                      }
                      notifyToast(
                        'No. WhatsApp Disalin',
                        modalCard.organizerPhone,
                        'success'
                      );
                    }}
                    className="text-[10px] font-extrabold text-emerald-900 underline cursor-pointer"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  notifyToast(
                    'Membuka WhatsApp Direct',
                    `Menghubungi ${modalCard.organizerName} (${modalCard.organizerPhone})...`,
                    'success'
                  )
                }
                className="h-11 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ) : isPostActivityPageOpen ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN POST ACTIVITY PAGE
             (No Main Header & No Bottom Navigation — Top-left Back button only,
              Live Activity Card Preview, and all 5 deep sections matching Activity Detail Page)
             --------------------------------------------------------- */
          <div className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top Bar: Only Top-Left Back Button + Title + Reset Draft */}
            <div className="px-4 pt-4 pb-2.5 flex items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPostActivityPageOpen(false)}
                  aria-label="Kembali ke halaman sebelumnya"
                  className="h-10 px-3.5 rounded-full bg-white shadow-[0_6px_18px_rgba(32,12,82,0.14)] border border-purple-200/80 flex items-center gap-1.5 text-[#141132] hover:bg-[#F3EEFF] active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5] text-[#5B18E5]" />
                  <span className="text-xs font-extrabold">Back</span>
                </button>
                <div className="min-w-0">
                  <h1 className="text-[17px] font-extrabold font-display text-[#141132] tracking-tight truncate">
                    Post New UMS Activity
                  </h1>
                  <p className="text-[10px] font-semibold text-[#5B18E5] truncate">
                    Lengkapkan semua maklumat halaman info aktiviti UMS
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewTitle('');
                  setNewDesc('');
                  setNewDateText('22 – 24 Nov 2026');
                  setNewLocationText('Dewan Kuliah Pusat 2, UMS');
                  setNewAudience('Terbuka kepada semua pelajar FKI & UMS');
                  setNewSlotsNeeded(4);
                  setNewMinWeeklyHours(6);
                  setNewBannerMode('preset');
                  setNewBannerUrl('');
                  setNewBannerPreset('prj-techfest');
                  setNewBannerPosY(50);
                  notifyToast('Borang Dikosongkan', undefined, 'default');
                }}
                className="h-9 px-3 rounded-full bg-white/85 border border-purple-200 text-[#4E14B8] text-[10.5px] font-extrabold shrink-0 cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Scrollable Full-Screen Form with Live Preview & 5 Complete Sections */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTitle.trim() || !newOrganizerPhone.trim()) {
                  notifyToast(
                    'Maklumat Belum Lengkap',
                    'Sila isi Tajuk Aktiviti dan No. WhatsApp Penganjur.',
                    'error'
                  );
                  return;
                }
                const createdId = createProject({
                  p_title: newTitle.trim(),
                  p_description:
                    newDesc.trim() ||
                    'Aktiviti dan kolaborasi projek pelajar Universiti Malaysia Sabah (UMS).',
                  p_project_type: newType,
                  p_slots_needed: Number(newSlotsNeeded) || 4,
                  p_min_weekly_hours: Number(newMinWeeklyHours) || 6,
                  p_deadline: newDeadline || '2026-11-24',
                  p_date_display: newDateText.trim() || '22 – 24 Nov 2026',
                  p_location:
                    newLocationText.trim() || 'Dewan Kuliah Pusat 2, UMS',
                  p_audience:
                    newAudience.trim() ||
                    'Terbuka kepada semua pelajar FKI & UMS',
                  p_badge_line_1: newBadgeLine1.trim() || 'Program',
                  p_badge_line_2: newBadgeLine2.trim() || newType,
                  p_tags: [
                    newTag1.trim() || 'Tech',
                    newTag2.trim() || 'Networking',
                    newTag3.trim() || newType,
                  ],
                  p_attribute_tags:
                    newAttributeTags.length > 0
                      ? newAttributeTags
                      : ['Programming', 'Planning'],
                  p_organizer_phone: newOrganizerPhone.trim(),
                  p_organizer_name:
                    newOrganizerName.trim() ||
                    `${currentUser?.display_name || 'Fahrin'} (${
                      currentUser?.faculty_short || 'FKI'
                    })`,
                  p_banner_url:
                    newBannerMode !== 'preset' && newBannerUrl.trim()
                      ? newBannerUrl.trim()
                      : null,
                  p_banner_preset: newBannerPreset,
                  p_banner_position_y: newBannerPosY,
                  p_required_skills: newRequiredSkills,
                  p_interests: newProjectInterests,
                  p_meeting_slots: newMeetingSlots,
                });
                if (createdId) {
                  setNewTitle('');
                  setNewDesc('');
                  setNewBannerUrl('');
                  setCardIndex(0);
                  setIsPostActivityPageOpen(false);
                  openCardInfoModal(createdId);
                }
              }}
              className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-3.5 overscroll-y-contain"
            >
              {/* LIVE PREVIEW CARD (Shows exactly how the activity card, poster banner & 40/25/20/15 score look) */}
              <div className="rounded-[24px] bg-white/95 border-2 border-purple-300/90 p-3.5 shadow-[0_12px_28px_rgba(18,4,48,0.25)] space-y-2.5 text-[#14122E]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B18E5]">
                    Pralihat Langsung Kad &amp; Poster Aktiviti
                  </span>
                  <span className="text-xs font-extrabold text-[#5B18E5] tabular-nums">
                    Skor Semasa: {liveDraftMatchEval.totalScore}%
                  </span>
                </div>

                <div className="rounded-[18px] bg-[#F6F2FF] border border-purple-200/80 overflow-hidden">
                  {/* Live Poster Banner Preview */}
                  <div className="relative h-[112px] w-full overflow-hidden bg-[#240850]">
                    <ActivityCardBanner
                      cardId={newBannerPreset}
                      bannerUrl={
                        newBannerMode !== 'preset' && newBannerUrl.trim()
                          ? newBannerUrl.trim()
                          : null
                      }
                      bannerPreset={newBannerPreset}
                      bannerPositionY={newBannerPosY}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[#141132] text-[9.5px] font-extrabold inline-flex items-center gap-1 shadow-xs">
                      <Flame className="w-3 h-3 text-[#6215E5] fill-[#6215E5]" />
                      <span>Trending</span>
                    </div>
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-white drop-shadow">
                      <span>
                        {newBannerMode !== 'preset' && newBannerUrl.trim()
                          ? 'Poster Suai Aktif'
                          : `Preset: ${
                              UMS_BANNER_PRESETS.find(
                                (p) => p.id === newBannerPreset
                              )?.label || 'TechFest UMS'
                            }`}
                      </span>
                      <span>+50 SDP</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold font-display text-[#14122E] truncate">
                          {newTitle.trim() || 'Tajuk Aktiviti Anda...'}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[10.5px] font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="w-3 h-3 text-[#5B18E5] shrink-0" />
                            <span>{newDateText || 'Tarikh program'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3 h-3 text-[#5B18E5] shrink-0" />
                            <span>{newLocationText || 'Lokasi kampus UMS'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Users className="w-3 h-3 text-[#5B18E5] shrink-0" />
                            <span>{newAudience || 'Sasaran pelajar'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 px-2.5 py-1.5 rounded-2xl bg-[#EAE2FF] border border-[#D8C7FF] text-center text-[#5A17E0]">
                        <div className="text-[9.5px] font-extrabold leading-tight">
                          {newBadgeLine1 || 'Program'}
                        </div>
                        <div className="text-[10px] font-extrabold leading-tight">
                          {newBadgeLine2 || newType}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                      {newDesc.trim() ||
                        'Penerangan terperinci & objektif aktiviti akan dipaparkan di sini...'}
                    </p>

                    {/* Live 40/25/20/15 Mini Breakdown */}
                    <div className="pt-1.5 border-t border-purple-200/60 grid grid-cols-4 gap-1 text-center text-[9.5px] font-bold text-[#4E14B8]">
                      <div className="rounded-lg bg-white py-1 px-1">
                        Kemahiran: {liveDraftMatchEval.skillScore}/40
                      </div>
                      <div className="rounded-lg bg-white py-1 px-1">
                        Minat: {liveDraftMatchEval.interestScore}/25
                      </div>
                      <div className="rounded-lg bg-white py-1 px-1">
                        Jadual: {liveDraftMatchEval.scheduleScore}/20
                      </div>
                      <div className="rounded-lg bg-white py-1 px-1">
                        Tag: {liveDraftMatchEval.goalScore}/15
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 01: MAKLUMAT ASAS, GAMBAR POSTER, KATEGORI & LENCANA FAKULTI */}
              <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.2)] space-y-3 text-[#14122E] text-xs">
                <div>
                  <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                    01. Gambar Poster, Maklumat Asas &amp; Lencana
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tetapkan gambar poster kad aktiviti (muat naik sendiri, URL, atau preset UMS) berserta tajuk dan lencana
                  </p>
                </div>

                {/* POSTER / BANNER IMAGE PICKER (Upload / URL / UMS Presets) */}
                <div className="p-3 rounded-2xl bg-[#F7F4FF] border border-purple-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#3B0A88] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#5B18E5]" />
                      <span>Gambar Poster Aktiviti</span>
                    </span>
                    <div className="inline-flex rounded-xl bg-white p-0.5 border border-purple-200 text-[10px] font-extrabold">
                      <button
                        type="button"
                        onClick={() => setNewBannerMode('upload')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          newBannerMode === 'upload'
                            ? 'bg-[#5B18E5] text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        Muat Naik
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewBannerMode('url')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          newBannerMode === 'url'
                            ? 'bg-[#5B18E5] text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewBannerMode('preset')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          newBannerMode === 'preset'
                            ? 'bg-[#5B18E5] text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        Preset UMS
                      </button>
                    </div>
                  </div>

                  {newBannerMode === 'upload' && (
                    <div className="space-y-2">
                      <label className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-purple-300 bg-white hover:bg-purple-50/60 text-[#5B18E5] font-extrabold text-center flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>
                          {newBannerUrl.startsWith('data:')
                            ? 'Tukar Fail Gambar dari Peranti'
                            : 'Pilih Gambar Poster dari Peranti (JPG/PNG)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const dataUrl = await compressImageFileToDataUrl(
                                file,
                                900,
                                500,
                                0.84
                              );
                              setNewBannerUrl(dataUrl);
                              notifyToast(
                                'Gambar Poster Dimuat Naik',
                                'Pralihat kad di atas telah dikemas kini.',
                                'success'
                              );
                            } catch {
                              notifyToast(
                                'Gagal Memuat Naik Gambar',
                                'Sila cuba fail gambar yang lain.',
                                'error'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {newBannerMode === 'url' && (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={
                          newBannerUrl.startsWith('data:') ? '' : newBannerUrl
                        }
                        onChange={(e) => setNewBannerUrl(e.target.value)}
                        placeholder="Tampal pautan URL gambar (https://...)"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold focus:outline-none focus:border-[#5B18E5]"
                      />
                    </div>
                  )}

                  {newBannerMode !== 'preset' && newBannerUrl.trim() && (
                    <div className="space-y-1.5 pt-1 border-t border-purple-200/60">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-slate-600">
                          Fokus Menegak Poster ({newBannerPosY}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewBannerUrl('');
                            setNewBannerMode('preset');
                          }}
                          className="text-rose-600 font-extrabold hover:underline cursor-pointer"
                        >
                          Buang Gambar Suai
                        </button>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={newBannerPosY}
                        onChange={(e) =>
                          setNewBannerPosY(Number(e.target.value))
                        }
                        className="w-full accent-[#5B18E5]"
                      />
                    </div>
                  )}

                  {newBannerMode === 'preset' && (
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      {UMS_BANNER_PRESETS.map((preset) => {
                        const selected = newBannerPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setNewBannerPreset(preset.id)}
                            className={`rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                              selected
                                ? 'border-[#5B18E5] ring-2 ring-purple-300'
                                : 'border-white opacity-85 hover:opacity-100'
                            }`}
                          >
                            <div className="relative h-12 w-full overflow-hidden bg-[#1E0842]">
                              <ActivityCardBanner cardId={preset.id} />
                            </div>
                            <div className="p-1.5 bg-white">
                              <div className="text-[10px] font-extrabold text-[#14122E] truncate">
                                {preset.label}
                              </div>
                              <div className="text-[8.5px] text-slate-500 truncate">
                                {preset.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-extrabold mb-1">
                    Tajuk Aktiviti / Projek UMS *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="cth. Borneo AI & Smart Campus Hackathon 2026"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold focus:outline-none focus:border-[#5B18E5]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-extrabold mb-1">
                      Kategori Projek
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => {
                        const val = e.target.value as ProjectType;
                        setNewType(val);
                        setNewTag3(val);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-2 font-bold bg-white"
                    >
                      <option value="Competition">Competition</option>
                      <option value="Innovation">Innovation</option>
                      <option value="Community">Community</option>
                      <option value="Assignment">Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-extrabold mb-1">
                      Lencana Baris 1
                    </label>
                    <input
                      type="text"
                      value={newBadgeLine1}
                      onChange={(e) => setNewBadgeLine1(e.target.value)}
                      placeholder="Program"
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold mb-1">
                      Lencana Baris 2
                    </label>
                    <input
                      type="text"
                      value={newBadgeLine2}
                      onChange={(e) => setNewBadgeLine2(e.target.value)}
                      placeholder="FKI / Kampus"
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-2 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold mb-1">
                    Penerangan Terperinci &amp; Objektif Aktiviti *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Terangkan objektif program, peranan ahli kumpulan yang dicari, dan manfaat penyertaan..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium focus:outline-none focus:border-[#5B18E5]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold mb-1">
                    3 Tag Utama Kad (Dipaparkan pada kad Home &amp; Halaman Info)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newTag1}
                      onChange={(e) => setNewTag1(e.target.value)}
                      placeholder="Tag 1 (Tech)"
                      className="rounded-xl border border-slate-300 px-2.5 py-1.5 font-semibold"
                    />
                    <input
                      type="text"
                      value={newTag2}
                      onChange={(e) => setNewTag2(e.target.value)}
                      placeholder="Tag 2 (Networking)"
                      className="rounded-xl border border-slate-300 px-2.5 py-1.5 font-semibold"
                    />
                    <input
                      type="text"
                      value={newTag3}
                      onChange={(e) => setNewTag3(e.target.value)}
                      placeholder="Tag 3 (Competition)"
                      className="rounded-xl border border-slate-300 px-2.5 py-1.5 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 02: LOGISTIK KAMPUS, TARIKH, SASARAN & KUOTA */}
              <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.2)] space-y-3 text-[#14122E] text-xs">
                <div>
                  <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                    02. Logistik Kampus, Sasaran &amp; Kuota Ahli
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tarikh program, lokasi di UMS, sasaran pelajar, serta bilangan kekosongan ahli
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-extrabold mb-1">
                      Tarikh &amp; Tempoh Program
                    </label>
                    <input
                      type="text"
                      value={newDateText}
                      onChange={(e) => setNewDateText(e.target.value)}
                      placeholder="cth. 22 – 24 Nov 2026"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold mb-1">
                      Tarikh Tutup Permohonan
                    </label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-2 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold mb-1">
                    Lokasi Kampus UMS
                  </label>
                  <input
                    type="text"
                    value={newLocationText}
                    onChange={(e) => setNewLocationText(e.target.value)}
                    placeholder="cth. Dewan Kuliah Pusat 2 / Makmal AI FKI, UMS"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold mb-1">
                    Sasaran Penyertaan Pelajar (Audience)
                  </label>
                  <input
                    type="text"
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    placeholder="cth. Terbuka kepada semua pelajar FKI & UMS"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-extrabold mb-1">
                      Kekosongan Ahli (Slots Needed)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newSlotsNeeded}
                      onChange={(e) =>
                        setNewSlotsNeeded(Math.max(1, Number(e.target.value) || 4))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold mb-1">
                      Komitmen Masa (Jam / Minggu)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={newMinWeeklyHours}
                      onChange={(e) =>
                        setNewMinWeeklyHours(
                          Math.max(1, Number(e.target.value) || 6)
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 03: SYARAT KEMAHIRAN PROJEK (40% SKOR PADANAN) */}
              <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.2)] space-y-3 text-[#14122E] text-xs">
                <div>
                  <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                    03. Syarat Kemahiran Projek (Pecahan Skor 40%)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tetapkan kemahiran yang diperlukan berserta status Wajib/Pilihan dan tahap kepentingan (1–5)
                  </p>
                </div>

                {/* Current Required Skills List */}
                <div className="space-y-2">
                  {newRequiredSkills.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-center">
                      Tiada syarat kemahiran khusus ditetapkan (terbuka kepada semua).
                    </div>
                  ) : (
                    newRequiredSkills.map((req) => {
                      const skObj = skills.find((s) => s.id === req.skill_id);
                      return (
                        <div
                          key={req.skill_id}
                          className="p-2.5 rounded-2xl bg-[#F7F4FF] border border-purple-200/80 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#14122E] truncate">
                              {skObj?.name || req.skill_id}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Kategori: {skObj?.category || 'Technical'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setNewRequiredSkills((prev) =>
                                  prev.map((item) =>
                                    item.skill_id === req.skill_id
                                      ? {...item, mandatory: !item.mandatory}
                                      : item
                                  )
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                                req.mandatory
                                  ? 'bg-[#5B18E5] text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              {req.mandatory ? 'Wajib' : 'Pilihan'}
                            </button>

                            <select
                              value={req.importance}
                              onChange={(e) => {
                                const imp = Number(e.target.value) as
                                  | 1
                                  | 2
                                  | 3
                                  | 4
                                  | 5;
                                setNewRequiredSkills((prev) =>
                                  prev.map((item) =>
                                    item.skill_id === req.skill_id
                                      ? {...item, importance: imp}
                                      : item
                                  )
                                );
                              }}
                              aria-label="Tahap kepentingan kemahiran"
                              className="rounded-lg border border-slate-300 px-1.5 py-1 text-[10px] font-bold bg-white"
                            >
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}/5
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                setNewRequiredSkills((prev) =>
                                  prev.filter(
                                    (item) => item.skill_id !== req.skill_id
                                  )
                                )
                              }
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Skill from Catalog */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="font-extrabold text-slate-700">
                    + Tambah Syarat Kemahiran:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={postSelectSkillId}
                      onChange={(e) => setPostSelectSkillId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 px-2.5 py-2 font-semibold bg-white"
                    >
                      {skills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setPostSkillMandatory((v) => !v)}
                      className={`px-2.5 py-2 rounded-xl font-extrabold text-[10.5px] cursor-pointer ${
                        postSkillMandatory
                          ? 'bg-[#5B18E5] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {postSkillMandatory ? 'Wajib' : 'Pilihan'}
                    </button>
                    <select
                      value={postSkillImportance}
                      onChange={(e) =>
                        setPostSkillImportance(Number(e.target.value))
                      }
                      className="rounded-xl border border-slate-300 px-2 py-2 font-bold bg-white"
                    >
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}/5
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        newRequiredSkills.some(
                          (r) => r.skill_id === postSelectSkillId
                        )
                      ) {
                        notifyToast(
                          'Kemahiran Sudah Ada',
                          'Kemahiran ini telah disenaraikan.',
                          'default'
                        );
                        return;
                      }
                      setNewRequiredSkills((prev) => [
                        ...prev,
                        {
                          skill_id: postSelectSkillId,
                          mandatory: postSkillMandatory,
                          importance: postSkillImportance,
                        },
                      ]);
                    }}
                    className="w-full py-2 rounded-xl bg-[#F2ECFF] hover:bg-[#E5DAFF] text-[#5B18E5] font-extrabold cursor-pointer"
                  >
                    + Masukkan ke Senarai Syarat Kemahiran
                  </button>
                </div>
              </div>

              {/* SECTION 04: BIDANG MINAT (25% SKOR) & TAG ATRIBUT PENAPIS HOME (15% SKOR) */}
              <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.2)] space-y-3 text-[#14122E] text-xs">
                <div>
                  <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                    04. Bidang Minat (25%) &amp; Tag Penapis (15%)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Pilih bidang minat aktiviti serta tag atribut untuk padanan di halaman Home
                  </p>
                </div>

                <div>
                  <div className="font-extrabold text-slate-700 mb-1.5">
                    Bidang Minat Aktiviti (Skor Minat Bersama 25%):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((intr) => {
                      const active = newProjectInterests.includes(intr.id);
                      return (
                        <button
                          key={intr.id}
                          type="button"
                          onClick={() =>
                            setNewProjectInterests((prev) =>
                              prev.includes(intr.id)
                                ? prev.filter((id) => id !== intr.id)
                                : [...prev, intr.id]
                            )
                          }
                          className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#5B18E5] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {active ? `✓ ${intr.name}` : `+ ${intr.name}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="font-extrabold text-slate-700 mb-1.5">
                    Tag Penapis Kemahiran Home (Skor Matlamat &amp; Tag 15%):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Programming',
                      'Planning',
                      'Database',
                      'Extrovert',
                      'Female only',
                      'UI/UX Design',
                      'Python',
                      'Data Analysis',
                    ].map((attr) => {
                      const active = newAttributeTags.includes(attr);
                      return (
                        <button
                          key={attr}
                          type="button"
                          onClick={() =>
                            setNewAttributeTags((prev) =>
                              prev.includes(attr)
                                ? prev.filter((a) => a !== attr)
                                : [...prev, attr]
                            )
                          }
                          className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#141132] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {active ? `✓ ${attr}` : `+ ${attr}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 05: JADUAL PERJUMPAAN MINGGUAN (20% SKOR) & WHATSAPP PENGANJUR */}
              <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_12px_28px_rgba(16,4,42,0.2)] space-y-3 text-[#14122E] text-xs">
                <div>
                  <h2 className="text-[14px] font-extrabold font-display text-[#14122E]">
                    05. Jadual Perjumpaan (20%) &amp; WhatsApp Penganjur
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Slot waktu perjumpaan mingguan serta maklumat kad WhatsApp Direct di halaman info
                  </p>
                </div>

                {/* Meeting Slots List */}
                <div className="space-y-1.5">
                  {newMeetingSlots.map((slot, idx) => (
                    <div
                      key={`${slot.weekday}-${slot.start_time}-${idx}`}
                      className="p-2.5 rounded-2xl bg-[#F7F4FF] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 font-extrabold text-[#14122E]">
                        <Calendar className="w-3.5 h-3.5 text-[#5B18E5]" />
                        <span>{WEEKDAY_SHORT[slot.weekday]}</span>
                        <span className="text-slate-600 tabular-nums">
                          · {slot.start_time} – {slot.end_time}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setNewMeetingSlots((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-rose-600 font-bold text-[10.5px] hover:underline cursor-pointer"
                      >
                        Padam
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Meeting Slot Controls */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={postSlotDay}
                    onChange={(e) => setPostSlotDay(Number(e.target.value))}
                    className="rounded-xl border border-slate-300 px-2 py-2 font-bold bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <option key={d} value={d}>
                        {WEEKDAY_SHORT[d]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={postSlotStart}
                    onChange={(e) => setPostSlotStart(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-2 py-1.5"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={postSlotEnd}
                    onChange={(e) => setPostSlotEnd(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-2 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (postSlotStart >= postSlotEnd) {
                        notifyToast(
                          'Masa Tidak Sah',
                          'Masa mula mestilah lebih awal daripada masa tamat.',
                          'error'
                        );
                        return;
                      }
                      setNewMeetingSlots((prev) => [
                        ...prev,
                        {
                          weekday: postSlotDay,
                          start_time: postSlotStart,
                          end_time: postSlotEnd,
                        },
                      ]);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#F2ECFF] text-[#5B18E5] font-extrabold cursor-pointer shrink-0"
                  >
                    + Slot
                  </button>
                </div>

                {/* Organizer Name & WhatsApp Number */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
                  <div>
                    <label className="block font-extrabold mb-1">
                      Nama Penganjur / Kelab / Ketua Projek *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOrganizerName}
                      onChange={(e) => setNewOrganizerName(e.target.value)}
                      placeholder="cth. Kelab Robotik & AI FKI UMS"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold mb-1 text-emerald-700">
                      No. Telefon WhatsApp Penganjur (Untuk Kad WhatsApp Direct) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newOrganizerPhone}
                      onChange={(e) => setNewOrganizerPhone(e.target.value)}
                      placeholder="cth. +6012-883 4910"
                      className="w-full rounded-xl border-2 border-emerald-400 bg-emerald-50/40 px-3 py-2 font-extrabold text-emerald-950"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-[22px] bg-gradient-to-r from-[#5B18E5] via-[#7C3AED] to-[#4F46E5] text-white font-extrabold text-sm shadow-[0_12px_28px_rgba(91,24,229,0.45)] active:scale-[0.99] transition-all cursor-pointer"
              >
                Terbitkan Aktiviti UMS &amp; Lihat Halaman Info →
              </button>
            </form>
          </div>
        ) : isSearchPageOpen ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN SEARCH, MULTI-FILTER, CATEGORY & BOOKMARKS PAGE
             (No Main Header & No Bottom Navigation — Back button at top-left + Smart Search bar at top)
             --------------------------------------------------------- */
          <div className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top Bar: Back Button at Top-Left + Search Input Bar + Quick Post Button */}
            <div className="px-4 pt-4 pb-2.5 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchPageOpen(false)}
                aria-label="Return to Main Page"
                className="w-10 h-10 rounded-full bg-white shadow-[0_6px_18px_rgba(32,12,82,0.12)] border border-purple-200/80 flex items-center justify-center text-[#141132] hover:bg-[#F3EEFF] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
              </button>

              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-[#6315EA] absolute left-3.5 pointer-events-none stroke-[2.3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tajuk, kemahiran, fakulti, lokasi..."
                  className="w-full h-10 pl-9 pr-8 rounded-full bg-white shadow-[0_6px_18px_rgba(32,12,82,0.1)] border border-purple-200/90 text-[12px] font-semibold text-[#141132] placeholder:text-slate-400 focus:outline-none focus:border-[#6315EA]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={openPostActivityPage}
                aria-label="Post New Activity"
                className="h-10 px-3 rounded-full bg-[#5B18E5] text-white text-[11px] font-extrabold shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.6]" />
                <span>Post</span>
              </button>
            </div>

            {/* Scrollable Body with Pull-to-Refresh: 1. Trending Carousel -> 2. Multi-Layer Filter Hub -> 3. Sorted Activities List */}
            <div
              ref={searchScrollRef}
              onTouchStart={handleSearchTouchStart}
              onTouchMove={handleSearchTouchMove}
              onTouchEnd={handleSearchTouchEnd}
              onTouchCancel={handleSearchTouchEnd}
              className="flex-1 overflow-y-auto no-scrollbar px-4 pb-5 space-y-3.5 overscroll-y-contain"
            >
              {/* PULL-TO-REFRESH INDICATOR */}
              <div
                style={{
                  height:
                    pullDistance > 0 || isRefreshingSearch
                      ? `${Math.max(pullDistance, isRefreshingSearch ? 54 : 0)}px`
                      : '0px',
                  opacity:
                    pullDistance > 0 || isRefreshingSearch
                      ? Math.min(
                          1,
                          Math.max(
                            pullDistance / 44,
                            isRefreshingSearch ? 1 : 0
                          )
                        )
                      : 0,
                  transition: isPullingSearch
                    ? 'none'
                    : 'height 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
                }}
                className="overflow-hidden flex items-center justify-center pointer-events-none"
              >
                <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-purple-200 shadow-[0_6px_18px_rgba(32,10,80,0.16)] flex items-center gap-2 text-[11px] font-extrabold text-[#4E14B8]">
                  <RotateCcw
                    style={{
                      transform: isRefreshingSearch
                        ? undefined
                        : `rotate(${pullDistance * 4}deg)`,
                    }}
                    className={`w-3.5 h-3.5 text-[#5B18E5] ${
                      isRefreshingSearch ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isRefreshingSearch
                      ? 'Syncing latest UMS project postings...'
                      : pullDistance >= 52
                      ? 'Release to refresh latest postings!'
                      : 'Pull down to refresh UMS postings...'}
                  </span>
                </div>
              </div>

              {/* SECTION 1: TRENDING & HIGH-MATCH HORIZONTAL CAROUSEL */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]" />
                    <span className="text-[12.5px] font-extrabold text-[#141132] tracking-tight font-display">
                      Trending &amp; High Match UMS
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchCategory('Saved')}
                    className="text-[10.5px] font-extrabold text-[#5B18E5] hover:underline cursor-pointer"
                  >
                    Bookmarks ({searchCategoryCounts.Saved}) →
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
                  {enrichedSearchCatalog.map((item) => (
                    <div
                      key={`carousel-${item.id}`}
                      onClick={() => openCardInfoModal(item.id)}
                      className="snap-start shrink-0 w-[236px] rounded-[22px] bg-white/95 border border-white shadow-[0_10px_24px_rgba(24,6,64,0.16)] overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    >
                      <div className="relative h-[86px] w-full overflow-hidden">
                        <ActivityCardBanner
                          cardId={item.id}
                          bannerUrl={item.bannerUrl}
                          bannerPreset={item.bannerPreset}
                          bannerPositionY={item.bannerPositionY}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#12072B]/85 via-[#12072B]/25 to-transparent" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#6215E5]/90 backdrop-blur-xs text-white text-[9.5px] font-extrabold flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{item.matchScore}% Match</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProject(item.id);
                          }}
                          aria-label="Save activity"
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/35 backdrop-blur-xs text-white flex items-center justify-center cursor-pointer"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              item.isCardSaved
                                ? 'fill-[#FACC15] text-[#FACC15]'
                                : 'text-white'
                            }`}
                          />
                        </button>
                        <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                          <span className="text-[11.5px] font-extrabold truncate drop-shadow">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 truncate">
                          <Calendar className="w-3 h-3 text-[#5B18E5] shrink-0" />
                          <span className="truncate">{item.dateText}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 truncate">
                          <MapPin className="w-3 h-3 text-[#5B18E5] shrink-0" />
                          <span className="truncate">{item.locationText}</span>
                        </div>
                        <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                          <span className="text-[9.5px] font-bold text-emerald-700 truncate">
                            WA: {item.organizerPhone}
                          </span>
                          <span className="text-[9.5px] font-extrabold text-[#5B18E5]">
                            Info &amp; WA →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: MULTI-LAYER CATEGORY, FACULTY, SKILL FILTER & SORT HUB */}
              <div className="rounded-[22px] bg-white/95 backdrop-blur-md p-3 border border-white shadow-[0_8px_20px_rgba(20,5,58,0.16)] space-y-2.5">
                {/* Row 1: Category Tabs with Live Counts */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    {id: 'All', label: 'All'},
                    {id: 'High Match', label: 'High Match'},
                    {id: 'Saved', label: 'Bookmarks'},
                    {id: 'Competition', label: 'Competition'},
                    {id: 'Innovation', label: 'Innovation'},
                    {id: 'Community', label: 'Community'},
                    {id: 'Assignment', label: 'Assignment'},
                  ].map((cat) => {
                    const active = searchCategory === cat.id;
                    const count = searchCategoryCounts[cat.id] ?? 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSearchCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                          active
                            ? 'bg-[#5B18E5] text-white shadow-xs'
                            : 'bg-[#F2ECFF] text-[#4A1D96] hover:bg-[#E5DAFF]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[9.5px] tabular-nums ${
                            active ? 'text-purple-200' : 'text-[#6D28D9]/80'
                          }`}
                        >
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Row 2: Faculty / Campus Filter + Sort By Selector */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-purple-100">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
                      Fakulti:
                    </span>
                    {['All', 'FKI', 'FKJ', 'FSSA', 'Kampus'].map((fac) => {
                      const active = searchFacultyFilter === fac;
                      return (
                        <button
                          key={fac}
                          type="button"
                          onClick={() => setSearchFacultyFilter(fac)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-[#141132] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {fac === 'All' ? 'Semua' : fac}
                        </button>
                      );
                    })}
                  </div>

                  <select
                    value={searchSortBy}
                    onChange={(e) =>
                      setSearchSortBy(
                        e.target.value as 'match' | 'newest' | 'hours' | 'slots'
                      )
                    }
                    aria-label="Susun senarai aktiviti"
                    className="rounded-lg border border-purple-200 bg-[#F8F5FF] px-2 py-1 text-[10px] font-extrabold text-[#4E14B8] shrink-0 focus:outline-none"
                  >
                    <option value="match">Susun: Skor Padanan</option>
                    <option value="newest">Susun: Terbaharu</option>
                    <option value="hours">Susun: Jam Rendah</option>
                    <option value="slots">Susun: Kuota Ahli</option>
                  </select>
                </div>

                {/* Row 3: Multi-Select Skill & Tag Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 border-t border-purple-100">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 pr-0.5">
                    Kemahiran:
                  </span>
                  {[
                    'Tech',
                    'Programming',
                    'AI & IoT',
                    'UI/UX',
                    'CyberSec',
                    'Marine',
                    'Entrepreneurship',
                    'Sustainability',
                  ].map((skillChip) => {
                    const active = searchSkillFilters.includes(skillChip);
                    return (
                      <button
                        key={skillChip}
                        type="button"
                        onClick={() => toggleSearchSkillChip(skillChip)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#5B18E5] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {active ? `✓ ${skillChip}` : `#${skillChip}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: SCROLLABLE LIST OF FILTERED & SORTED ACTIVITIES */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1 gap-2">
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-extrabold text-white drop-shadow-xs truncate">
                      Menunjukkan {filteredSearchCatalog.length} daripada{' '}
                      {enrichedSearchCatalog.length} Aktiviti UMS
                    </div>
                    <div className="text-[9.5px] font-medium text-purple-200/90">
                      Tarik ke bawah untuk kemas kini · Dikemas kini{' '}
                      {lastRefreshedTime}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(searchQuery ||
                      searchCategory !== 'All' ||
                      searchFacultyFilter !== 'All' ||
                      searchSkillFilters.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchCategory('All');
                          setSearchFacultyFilter('All');
                          setSearchSkillFilters([]);
                        }}
                        className="text-[10.5px] font-extrabold text-[#FDE047] underline cursor-pointer"
                      >
                        Reset Penapis
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={triggerSearchRefresh}
                      disabled={isRefreshingSearch}
                      aria-label="Refresh latest project postings"
                      className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 border border-white/35 text-white text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw
                        className={`w-3 h-3 ${
                          isRefreshingSearch ? 'animate-spin' : ''
                        }`}
                      />
                      <span>{isRefreshingSearch ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {filteredSearchCatalog.length === 0 ? (
                  <div className="rounded-[24px] bg-white/95 p-6 text-center space-y-2 shadow-lg">
                    <div className="text-sm font-extrabold text-[#141132]">
                      Tiada aktiviti ditemui
                    </div>
                    <p className="text-xs text-slate-500">
                      Cuba kata kunci atau penapis kategori/kemahiran lain untuk
                      melihat aktiviti kampus UMS.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchCategory('All');
                        setSearchFacultyFilter('All');
                        setSearchSkillFilters([]);
                      }}
                      className="px-4 py-1.5 rounded-full bg-[#5B18E5] text-white text-xs font-extrabold cursor-pointer"
                    >
                      Reset Semua Penapis
                    </button>
                  </div>
                ) : (
                  filteredSearchCatalog.map((item) => (
                    <div
                      key={`list-${item.id}`}
                      onClick={() => openCardInfoModal(item.id)}
                      className="rounded-[22px] bg-white/96 border border-white/90 p-3 shadow-[0_10px_24px_rgba(14,3,38,0.22)] flex gap-3 items-stretch cursor-pointer hover:bg-white active:scale-[0.99] transition-all"
                    >
                      {/* Left Visual Thumbnail */}
                      <div className="relative w-[88px] rounded-[16px] overflow-hidden shrink-0 flex flex-col justify-between p-1.5">
                        <ActivityCardBanner
                          cardId={item.id}
                          bannerUrl={item.bannerUrl}
                          bannerPreset={item.bannerPreset}
                          bannerPositionY={item.bannerPositionY}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <span className="relative z-10 self-start px-1.5 py-0.5 rounded-md bg-white/90 text-[#141132] text-[8.5px] font-extrabold uppercase">
                          {item.facultyLabel2}
                        </span>
                        <span className="relative z-10 self-start px-1.5 py-0.5 rounded-full bg-[#5B18E5] text-white text-[9.5px] font-extrabold shadow-xs tabular-nums">
                          {item.matchScore}% Match
                        </span>
                      </div>

                      {/* Right Full Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-[13.5px] font-extrabold text-[#141132] leading-tight truncate font-display">
                              {item.title}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveProject(item.id);
                              }}
                              aria-label="Bookmark activity"
                              className="p-0.5 text-[#5B18E5] shrink-0 cursor-pointer"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${
                                  item.isCardSaved
                                    ? 'fill-[#5B18E5] text-[#5B18E5]'
                                    : 'text-slate-400'
                                }`}
                              />
                            </button>
                          </div>

                          <p className="text-[10.5px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-600 font-semibold">
                            <span className="flex items-center gap-1 truncate">
                              <Calendar className="w-3 h-3 text-[#5B18E5] shrink-0" />
                              <span className="truncate">{item.dateText}</span>
                            </span>
                            <span className="text-[9.5px] font-bold text-[#4E14B8] shrink-0 tabular-nums">
                              {item.projectObj.slots_needed || 4} ahli ·{' '}
                              {item.projectObj.min_weekly_hours || 6}j/mgg
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <div className="text-[9.5px] font-semibold text-slate-500 truncate">
                              {item.projectObj.project_type} ·{' '}
                              {item.tags.slice(0, 2).join(' / ')}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-emerald-700 border border-emerald-200 text-[9.5px] font-extrabold shrink-0">
                              <MessageCircle className="w-2.5 h-2.5 fill-current" />
                              <span>Info &amp; WA</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeSidePage ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN SIDE NAVIGATION PAGES
             (No Main Header & No Bottom Navigation — Top-left Back button)
             Pages: 'my-activities' | 'saved-activities' | 'calendar' | 'notifications' | 'settings'
             --------------------------------------------------------- */
          <div className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Shared Top Bar with Top-Left Back Button */}
            <div className="px-4 pt-4 pb-2.5 flex items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidePage(null);
                    setActiveSidebarItem('Discover');
                  }}
                  aria-label="Return to Main Page"
                  className="w-10 h-10 rounded-full bg-white shadow-[0_6px_18px_rgba(32,12,82,0.12)] border border-purple-200/80 flex items-center justify-center text-[#141132] hover:bg-[#F3EEFF] active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.4] text-[#5B18E5]" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-[18px] font-extrabold font-display text-[#141132] tracking-tight truncate">
                    {activeSidePage === 'my-activities' && 'My Activities & SDP'}
                    {activeSidePage === 'saved-activities' &&
                      'Bookmarks & Saved'}
                    {activeSidePage === 'calendar' && 'Calendar & Schedule'}
                    {activeSidePage === 'notifications' && 'Notifications'}
                    {activeSidePage === 'settings' && 'Settings & Organizer'}
                  </h1>
                  <p className="text-[10.5px] font-semibold text-[#5B18E5] truncate">
                    {activeSidePage === 'my-activities' &&
                      'Aktiviti dianjurkan & rekod penyertaan kampus UMS'}
                    {activeSidePage === 'saved-activities' &&
                      'Koleksi tanda buku aktiviti UMS, penapis & nota pantas'}
                    {activeSidePage === 'calendar' &&
                      'Waktu lapang mingguan & tarikh program UMS'}
                    {activeSidePage === 'notifications' &&
                      'Makluman terkini aktiviti dan kemaskini profil'}
                    {activeSidePage === 'settings' &&
                      'Tetapan akaun pelajar, mod penganjur & pangkalan data'}
                  </p>
                </div>
              </div>

              {activeSidePage === 'my-activities' && (
                <button
                  type="button"
                  onClick={openPostActivityPage}
                  className="h-9 px-3 rounded-full bg-[#5B18E5] text-white text-xs font-extrabold shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Post</span>
                </button>
              )}

              {activeSidePage === 'saved-activities' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidePage(null);
                    setIsSearchPageOpen(true);
                  }}
                  className="h-9 px-3 rounded-full bg-[#5B18E5] text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Cari Lagi</span>
                </button>
              )}

              {activeSidePage === 'notifications' && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="h-9 px-3 rounded-full bg-[#5B18E5] text-white text-[11px] font-extrabold shadow-sm shrink-0 cursor-pointer"
                >
                  Tanda Dibaca
                </button>
              )}
            </div>

            {/* Scrollable Body Content for each Side Navigation Page */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-3.5 overscroll-y-contain">
              {/* =====================================================
                  SIDE PAGE 1: MY ACTIVITIES (Organized Projects + SDP History)
                 ===================================================== */}
              {activeSidePage === 'my-activities' && (
                <>
                  {/* Total SDP Summary Banner */}
                  <div className="rounded-[24px] bg-white/95 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] flex items-center justify-between">
                    <div>
                      <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#5B18E5]">
                        Mata Pembangunan Pelajar UMS
                      </div>
                      <div className="text-xl font-extrabold font-display text-[#14122E] mt-0.5 tabular-nums">
                        {totalSdpPoints} Mata SDP
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {myHistoryRecords.length} rekod aktiviti kampus disahkan
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openPostActivityPage}
                      className="px-3.5 py-2 rounded-2xl bg-[#F2ECFF] hover:bg-[#E5DAFF] text-[#5B18E5] text-xs font-extrabold cursor-pointer"
                    >
                      + Post Aktiviti
                    </button>
                  </div>

                  {/* Section A: Activities Organized / Posted on ProjectLink UMS */}
                  <div className="rounded-[24px] bg-white/95 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-2.5 text-[#14122E]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[14px] font-extrabold font-display">
                          Aktiviti &amp; Projek Kampus Semasa
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Tekan mana-mana aktiviti untuk lihat info penuh atau WhatsApp penganjur
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {cardsCatalog.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => openCardInfoModal(c.id)}
                          className="p-2.5 rounded-2xl bg-[#F8F6FF] hover:bg-[#EFE9FF] border border-purple-100 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#240850]">
                            <ActivityCardBanner
                              cardId={c.id}
                              bannerUrl={c.bannerUrl}
                              bannerPreset={c.bannerPreset}
                              bannerPositionY={c.bannerPositionY}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <div className="text-xs font-extrabold text-[#14122E] truncate">
                                {c.title}
                              </div>
                              {c.isOwner && (
                                <span className="text-[9px] font-extrabold text-[#5B18E5] shrink-0">
                                  · Milik Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                              {c.dateText} · {c.locationText}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-700 mt-0.5 truncate">
                              Penganjur: {c.organizerName}
                            </div>
                          </div>
                          {c.isOwner ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditActivityBannerModal(c.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#5B18E5] text-white text-[10px] font-extrabold shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Tukar Gambar</span>
                            </button>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#5B18E5] shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B: Student Participation History & Add New SDP Record */}
                  <div className="rounded-[24px] bg-white/95 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-3 text-[#14122E]">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display">
                        Rekod Penyertaan &amp; Sejarah Aktiviti ({myHistoryRecords.length})
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Senarai program UMS yang telah anda sertai berserta mata SDP
                      </p>
                    </div>

                    <div className="space-y-2">
                      {myHistoryRecords.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-2xl bg-[#F4EFFF] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#14122E] truncate">
                              {act.title}
                            </div>
                            <div className="text-[10.5px] text-slate-600">
                              {act.role} · {act.date_display}
                            </div>
                            {act.summary && (
                              <p className="text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">
                                {act.summary}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-[#5B18E5] shrink-0 tabular-nums">
                            +{act.sdp_earned} SDP
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive Form to Log New Participation Record */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newHistTitle.trim()) return;
                        addActivityHistory({
                          title: newHistTitle.trim(),
                          date_display: newHistDate.trim() || 'Nov 2026',
                          role: newHistRole.trim() || 'Peserta',
                          sdp_earned: Number(newHistSdp) || 30,
                          summary:
                            newHistSummary.trim() ||
                            'Menyertai aktiviti pembangunan pelajar Universiti Malaysia Sabah (UMS).',
                        });
                        setNewHistTitle('');
                        setNewHistSummary('');
                      }}
                      className="pt-3 border-t border-slate-200 space-y-2.5 text-xs"
                    >
                      <div className="font-extrabold text-[#14122E]">
                        + Tambah Rekod Penyertaan Baharu
                      </div>
                      <input
                        type="text"
                        required
                        value={newHistTitle}
                        onChange={(e) => setNewHistTitle(e.target.value)}
                        placeholder="Nama program / aktiviti (cth. Bengkel AI FKI)"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newHistDate}
                          onChange={(e) => setNewHistDate(e.target.value)}
                          placeholder="Tarikh (cth. Nov 2026)"
                          className="rounded-xl border border-slate-300 px-2.5 py-2"
                        />
                        <input
                          type="text"
                          value={newHistRole}
                          onChange={(e) => setNewHistRole(e.target.value)}
                          placeholder="Peranan (cth. AJK)"
                          className="rounded-xl border border-slate-300 px-2.5 py-2"
                        />
                        <input
                          type="number"
                          min={5}
                          max={200}
                          value={newHistSdp}
                          onChange={(e) =>
                            setNewHistSdp(Number(e.target.value) || 30)
                          }
                          placeholder="SDP"
                          className="rounded-xl border border-slate-300 px-2.5 py-2 font-bold"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold cursor-pointer"
                      >
                        Simpan ke Rekod Profil &amp; SDP
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* =====================================================
                  SIDE PAGE 2: SAVED ACTIVITIES / BOOKMARKS COLLECTION HUB
                 ===================================================== */}
              {activeSidePage === 'saved-activities' && (
                <>
                  {/* Bookmarks Search & Category Filter Bar */}
                  <div className="rounded-[22px] bg-white/95 border border-white p-3 shadow-[0_8px_20px_rgba(20,5,58,0.16)] space-y-2.5 text-[#14122E]">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-[#5B18E5] absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={savedSearchQuery}
                        onChange={(e) => setSavedSearchQuery(e.target.value)}
                        placeholder="Cari dalam koleksi Bookmarks anda..."
                        className="w-full h-9 pl-8 pr-7 rounded-xl bg-[#F6F2FF] border border-purple-200 text-xs font-semibold text-[#141132] placeholder:text-slate-400 focus:outline-none focus:border-[#5B18E5]"
                      />
                      {savedSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSavedSearchQuery('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {[
                        'All',
                        'High Match',
                        'Competition',
                        'Innovation',
                        'Community',
                        'Assignment',
                      ].map((cat) => {
                        const active = savedCategoryFilter === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSavedCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-[#5B18E5] text-white'
                                : 'bg-[#F2ECFF] text-[#4A1D96]'
                            }`}
                          >
                            {cat === 'All' ? 'Semua Simpanan' : cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Summary Metrics for Bookmarks */}
                    <div className="pt-1.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="rounded-xl bg-[#F8F5FF] py-1.5 px-2">
                        <div className="font-extrabold text-[#5B18E5] text-xs tabular-nums">
                          {searchCategoryCounts.Saved}
                        </div>
                        <div className="text-slate-500 font-semibold">
                          Disimpan
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F8F5FF] py-1.5 px-2">
                        <div className="font-extrabold text-[#5B18E5] text-xs tabular-nums">
                          {filteredSavedCatalog.length > 0
                            ? `${Math.round(
                                filteredSavedCatalog.reduce(
                                  (acc, cur) => acc + cur.matchScore,
                                  0
                                ) / filteredSavedCatalog.length
                              )}%`
                            : '0%'}
                        </div>
                        <div className="text-slate-500 font-semibold">
                          Purata Skor
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F8F5FF] py-1.5 px-2">
                        <div className="font-extrabold text-[#5B18E5] text-xs tabular-nums">
                          {filteredSavedCatalog.reduce(
                            (acc, cur) =>
                              acc + (cur.projectObj.min_weekly_hours || 6),
                            0
                          )}
                          j/mgg
                        </div>
                        <div className="text-slate-500 font-semibold">
                          Jumlah Masa
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredSavedCatalog.length === 0 ? (
                    <div className="rounded-[24px] bg-white/95 p-6 text-center space-y-2.5 shadow-lg">
                      <Bookmark className="w-8 h-8 text-[#5B18E5] mx-auto stroke-[2.2]" />
                      <div className="text-sm font-extrabold text-[#141132]">
                        Tiada Aktiviti dalam Koleksi Ini
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Swipe ke kiri pada kad di halaman Home atau tekan ikon
                        Bookmark pada halaman Search untuk menyimpan aktiviti.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSavedSearchQuery('');
                          setSavedCategoryFilter('All');
                          setActiveSidePage(null);
                          setActiveTab('home');
                        }}
                        className="px-4 py-2 rounded-full bg-[#5B18E5] text-white text-xs font-extrabold cursor-pointer"
                      >
                        Teroka Aktiviti di Home
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSavedCatalog.map((item) => {
                        const rawDigits = (
                          item.organizerPhone || '+60128834910'
                        ).replace(/[^0-9]/g, '');
                        const normalizedPhone = rawDigits.startsWith('0')
                          ? `6${rawDigits}`
                          : rawDigits;
                        const itemWaUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
                          `Salam / Hi ${item.organizerName}, saya ${
                            currentUser?.display_name || 'Fahrin'
                          } dari UMS ingin bertanya mengenai aktiviti "${
                            item.title
                          }".`
                        )}`;
                        const currentNote =
                          bookmarkNotes[item.id] || 'Prioriti Utama';

                        return (
                          <div
                            key={item.id}
                            onClick={() => openCardInfoModal(item.id)}
                            className="rounded-[24px] bg-white/96 border border-white p-3.5 shadow-[0_12px_28px_rgba(14,3,38,0.22)] space-y-2.5 cursor-pointer hover:bg-white transition-all"
                          >
                            <div className="flex gap-3 items-start">
                              <div className="relative w-[84px] h-[74px] rounded-2xl overflow-hidden shrink-0">
                                <ActivityCardBanner
                                  cardId={item.id}
                                  bannerUrl={item.bannerUrl}
                                  bannerPreset={item.bannerPreset}
                                  bannerPositionY={item.bannerPositionY}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                                <span className="absolute bottom-1.5 left-1.5 text-[9.5px] font-extrabold text-white drop-shadow tabular-nums">
                                  {item.matchScore}% Match
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <h3 className="text-sm font-extrabold font-display text-[#14122E] truncate">
                                    {item.title}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSaveProject(item.id);
                                    }}
                                    className="text-[10.5px] font-bold text-rose-600 hover:underline shrink-0 cursor-pointer"
                                  >
                                    Buang
                                  </button>
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium mt-0.5 truncate">
                                  {item.dateText} · {item.locationText}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
                                  Kategori: {item.projectObj.project_type} ·{' '}
                                  {item.projectObj.slots_needed || 4} ahli (
                                  {item.projectObj.min_weekly_hours || 6}j/mgg)
                                </div>
                              </div>
                            </div>

                            {/* Quick Bookmark Label / Personal Note Selector */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-[10px]"
                            >
                              <span className="font-bold text-slate-500 shrink-0">
                                Label Simpanan:
                              </span>
                              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                {[
                                  'Prioriti Utama',
                                  'Ajak Kawan FKI',
                                  'Tanya Penganjur',
                                ].map((lbl) => (
                                  <button
                                    key={lbl}
                                    type="button"
                                    onClick={() =>
                                      setBookmarkNotes((prev) => ({
                                        ...prev,
                                        [item.id]: lbl,
                                      }))
                                    }
                                    className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap cursor-pointer ${
                                      currentNote === lbl
                                        ? 'bg-[#141132] text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {lbl}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCardInfoModal(item.id);
                                }}
                                className="flex-1 py-2 rounded-xl bg-[#F2ECFF] hover:bg-[#E5DAFF] text-[#5B18E5] text-xs font-extrabold cursor-pointer"
                              >
                                Buka Info Penuh
                              </button>
                              <a
                                href={itemWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                <span>WhatsApp Direct</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* =====================================================
                  SIDE PAGE 3: CALENDAR & AVAILABILITY SLOTS
                 ===================================================== */}
              {activeSidePage === 'calendar' && (
                <>
                  {/* Card A: Student Weekly Free Time Slots (availability_slots) */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-3 text-[#14122E]">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display">
                        Slot Masa Lapang Mingguan Anda
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Digunakan untuk mengira padanan jadual (20%) dengan waktu perjumpaan aktiviti UMS
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      {availabilitySlots
                        .filter((s) => s.student_id === currentUser?.id)
                        .map((sl) => (
                          <div
                            key={sl.id}
                            className="p-2.5 rounded-2xl bg-[#F4EFFF] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 font-extrabold text-[#4C1D95]">
                              <Calendar className="w-3.5 h-3.5 text-[#5B18E5]" />
                              <span>{WEEKDAY_SHORT[sl.weekday]}</span>
                              <span className="text-slate-600 tabular-nums">
                                · {sl.start_time} – {sl.end_time}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAvailabilitySlot(sl.id)}
                              className="text-rose-600 font-bold text-[11px] hover:underline cursor-pointer"
                            >
                              Padam
                            </button>
                          </div>
                        ))}
                    </div>

                    {/* Add New Weekly Slot */}
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      <div className="font-extrabold text-slate-700">
                        + Tambah Masa Lapang Baharu:
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={newSlotDay}
                          onChange={(e) =>
                            setNewSlotDay(Number(e.target.value))
                          }
                          className="rounded-xl border border-slate-300 px-2.5 py-2 font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <option key={d} value={d}>
                              {WEEKDAY_SHORT[d]}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 px-2.5 py-1.5"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 px-2.5 py-1.5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          addAvailabilitySlot({
                            weekday: newSlotDay,
                            start_time: newSlotStart,
                            end_time: newSlotEnd,
                          })
                        }
                        className="w-full py-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold cursor-pointer"
                      >
                        Simpan Slot Masa Lapang
                      </button>
                    </div>
                  </div>

                  {/* Card B: Upcoming UMS Campus Activities Schedule */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-2.5 text-[#14122E]">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display">
                        Takwim &amp; Jadual Aktiviti Kampus UMS
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Tekan mana-mana program untuk melihat jadual penuh &amp; hubungi penganjur
                      </p>
                    </div>

                    <div className="space-y-2">
                      {cardsCatalog.map((c) => {
                        const pSlots = projectMeetingSlots.filter(
                          (ms) => ms.project_id === c.id
                        );
                        return (
                          <div
                            key={c.id}
                            onClick={() => openCardInfoModal(c.id)}
                            className="p-3 rounded-2xl bg-[#F8F6FF] hover:bg-[#EFE9FF] border border-purple-100 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="text-[11px] font-extrabold text-[#5B18E5]">
                                {c.dateText}
                              </div>
                              <div className="text-xs font-extrabold text-[#14122E] truncate">
                                {c.title}
                              </div>
                              <div className="text-[10.5px] text-slate-500 truncate">
                                {c.locationText}
                                {pSlots[0] &&
                                  ` · Perjumpaan: ${
                                    WEEKDAY_SHORT[pSlots[0].weekday]
                                  } (${pSlots[0].start_time}–${
                                    pSlots[0].end_time
                                  })`}
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-[#5B18E5] shrink-0">
                              Info →
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* =====================================================
                  SIDE PAGE 4: NOTIFICATIONS
                 ===================================================== */}
              {activeSidePage === 'notifications' && (
                <div className="space-y-2.5">
                  {notifications.filter(
                    (n) => n.recipient_id === currentUser?.id
                  ).length === 0 ? (
                    <div className="rounded-[24px] bg-white/95 p-6 text-center text-xs text-slate-500">
                      Tiada notifikasi baharu buat masa ini.
                    </div>
                  ) : (
                    notifications
                      .filter((n) => n.recipient_id === currentUser?.id)
                      .map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (
                              n.target_type === 'project' &&
                              cardsCatalog.some((c) => c.id === n.target_id)
                            ) {
                              openCardInfoModal(n.target_id);
                            }
                          }}
                          className={`rounded-[22px] p-4 border shadow-md transition-all cursor-pointer ${
                            !n.read_at
                              ? 'bg-white border-[#5B18E5]'
                              : 'bg-white/90 border-white/80 opacity-85'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-extrabold text-xs text-[#14122E]">
                              {n.title ||
                                n.event_type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            {!n.read_at && (
                              <span className="text-[10px] font-extrabold text-[#5B18E5] shrink-0">
                                ● Baharu
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {n.body ||
                              `Kemaskini baharu untuk ${n.target_type}.`}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* =====================================================
                  SIDE PAGE 5: SETTINGS & ORGANIZER HUB
                 ===================================================== */}
              {activeSidePage === 'settings' && (
                <>
                  {/* Card 1: Account Persona & Role Mode */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-3.5 text-[#14122E] text-xs">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display">
                        Akaun Pelajar &amp; Mod Peranan UMS
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Urus profil pelajar atau tukar kepada mod Penganjur (Organizer)
                      </p>
                    </div>

                    {/* STUDENT / ORGANIZER Mode Switch */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700">
                        Mod Penggunaan Aplikasi:
                      </label>
                      <div className="rounded-xl border border-slate-200 p-1 grid grid-cols-2 bg-slate-50">
                        <button
                          type="button"
                          onClick={() =>
                            updateProfileMetadata({role_mode: 'STUDENT'})
                          }
                          className={`py-2 rounded-lg text-[11px] font-extrabold uppercase cursor-pointer ${
                            sidebarRole === 'STUDENT'
                              ? 'bg-[#5B18E5] text-white shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          STUDENT MODE
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateProfileMetadata({role_mode: 'ORGANIZER'})
                          }
                          className={`py-2 rounded-lg text-[11px] font-extrabold uppercase cursor-pointer ${
                            sidebarRole === 'ORGANIZER'
                              ? 'bg-[#5B18E5] text-white shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          ORGANIZER MODE
                        </button>
                      </div>
                    </div>

                    {/* Switch Active Student / Organizer Persona */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700">
                        Tukar Akaun Pelajar UMS (Ujian):
                      </label>
                      <select
                        value={currentUser?.id || ''}
                        onChange={(e) => switchPersona(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold bg-white"
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.display_name} ({p.matric_no || p.id}) —{' '}
                            {p.faculty_short || 'UMS'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Availability Status Selector */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700">
                        Status Ketersediaan Profil:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Available', 'In Team', 'Busy'] as const).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                updateProfileMetadata({availability_status: st})
                              }
                              className={`py-2 rounded-xl font-bold border cursor-pointer ${
                                availabilityStatus === st
                                  ? 'bg-[#F2ECFF] border-[#5B18E5] text-[#5B18E5]'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {st}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openEditProfileModal}
                      className="w-full py-2.5 rounded-xl bg-[#F2ECFF] hover:bg-[#E5DAFF] text-[#5B18E5] font-extrabold cursor-pointer"
                    >
                      Sunting Maklumat Profil ({currentUser?.display_name})
                    </button>
                  </div>

                  {/* Card 2: Organizer Quick Post & Database Actions */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-2.5 text-[#14122E] text-xs">
                    <div className="font-extrabold text-[14px] font-display">
                      Tindakan Penganjur &amp; Pangkalan Data
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Siarkan aktiviti baharu berserta nombor WhatsApp anda atau tetapkan semula data demo.
                    </p>
                    <button
                      type="button"
                      onClick={openPostActivityPage}
                      className="w-full py-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold cursor-pointer"
                    >
                      + Post Aktiviti / Projek Baharu (Halaman Penuh)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetDemoDatabase();
                        setActiveSidePage(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Pangkalan Data Demo UMS</span>
                    </button>
                    <button
                      type="button"
                      onClick={triggerSignOut}
                      className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Keluar (Kembali ke Skrin Login)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : activeTab === 'home' ? (
          /* ---------------------------------------------------------
             PAGE 1: HOME SCREEN (Scrollable with comfortable spacing)
             --------------------------------------------------------- */
          <div className="relative z-10 flex-1 min-h-0 px-4 pt-1 pb-5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-y-contain">
            {/* A. MULTI-CARD LOOPING STACK (Front card disappears on swipe & card behind moves to front) */}
            <div className="relative pt-3 select-none shrink-0">
              {[2, 1, 0].map((stackOffset) => {
                const stepNumber = cardIndex + stackOffset;
                const cardItem =
                  cardsCatalog[stepNumber % cardsCatalog.length] ||
                  cardsCatalog[0];
                const isFront = stackOffset === 0;
                const cardIsSaved = Boolean(
                  currentUser &&
                    savedProjects.some(
                      (s) =>
                        s.student_id === currentUser.id &&
                        s.project_id === cardItem.id
                    )
                );

                // Smooth promotion transforms for cards behind the front card
                const scaleVal = isFront
                  ? 1
                  : stackOffset === 1
                  ? Number((0.935 + 0.065 * dragProgress).toFixed(3))
                  : Number((0.875 + 0.06 * dragProgress).toFixed(3));

                const translateYVal = isFront
                  ? 0
                  : stackOffset === 1
                  ? Number(((1 - dragProgress) * -9).toFixed(1))
                  : Number((-9 - (1 - dragProgress) * 8).toFixed(1));

                const opacityVal = isFront
                  ? flyOffDir
                    ? 0
                    : 1
                  : stackOffset === 1
                  ? Number((0.72 + 0.28 * dragProgress).toFixed(2))
                  : Number((0.38 + 0.34 * dragProgress).toFixed(2));

                const cardTransform = isFront
                  ? topCardTransform
                  : `translate3d(0, ${translateYVal}px, 0) scale(${scaleVal})`;

                return (
                  <div
                    key={`deck-step-${stepNumber}`}
                    aria-hidden={!isFront}
                    onTouchStart={
                      isFront
                        ? (e) =>
                            handleDragStart(
                              e.touches[0].clientX,
                              e.touches[0].clientY
                            )
                        : undefined
                    }
                    onTouchMove={
                      isFront
                        ? (e) =>
                            handleDragMove(
                              e.touches[0].clientX,
                              e.touches[0].clientY
                            )
                        : undefined
                    }
                    onTouchEnd={isFront ? handleDragEnd : undefined}
                    onMouseDown={
                      isFront
                        ? (e) => handleDragStart(e.clientX, e.clientY)
                        : undefined
                    }
                    onMouseMove={
                      isFront
                        ? (e) => handleDragMove(e.clientX, e.clientY)
                        : undefined
                    }
                    onMouseUp={isFront ? handleDragEnd : undefined}
                    onMouseLeave={
                      isFront
                        ? () => {
                            if (isDraggingCard) handleDragEnd();
                          }
                        : undefined
                    }
                    style={{
                      transform: cardTransform,
                      opacity: opacityVal,
                    }}
                    className={`${
                      isFront
                        ? 'relative z-20 cursor-grab active:cursor-grabbing touch-pan-y'
                        : stackOffset === 1
                        ? 'absolute inset-x-0 top-3 z-10 pointer-events-none'
                        : 'absolute inset-x-0 top-3 z-0 pointer-events-none'
                    } rounded-[26px] p-[2px] bg-gradient-to-b from-white/95 via-purple-200/85 to-purple-400/50 shadow-[0_12px_30px_rgba(24,4,64,0.32)] ${
                      isFront && isDraggingCard
                        ? 'transition-none'
                        : 'transition-all duration-230 ease-out'
                    }`}
                  >
                    {/* Dynamic Swipe Stamps on Front Card while dragging */}
                    {isFront && (dragOffset.x < -25 || flyOffDir === 'left') && (
                      <div className="absolute top-12 right-4 z-30 pointer-events-none px-3 py-1 rounded-xl bg-[#5B18E5]/95 border-2 border-white text-white font-extrabold text-xs tracking-wider uppercase shadow-xl transform rotate-12">
                        ← SAVE &amp; INFO
                      </div>
                    )}
                    {isFront && (dragOffset.x > 25 || flyOffDir === 'right') && (
                      <div className="absolute top-12 left-4 z-30 pointer-events-none px-3 py-1 rounded-xl bg-amber-500/95 border-2 border-white text-white font-extrabold text-xs tracking-wider uppercase shadow-xl transform -rotate-12">
                        SKIP →
                      </div>
                    )}

                    <div className="rounded-[24px] bg-[#F7F5FF] overflow-hidden">
                      {/* Banner Image with Trending, Bookmark, Owner Edit Poster, 3 Dots & Purple Diagonal Stripes Wave */}
                      <div className="relative h-[152px] w-full overflow-hidden bg-[#2D0C5E]">
                        <ActivityCardBanner
                          cardId={cardItem.id}
                          bannerUrl={cardItem.bannerUrl}
                          bannerPreset={cardItem.bannerPreset}
                          bannerPositionY={cardItem.bannerPositionY}
                        />

                        {/* Trending Pill (Top-Left) */}
                        <div className="absolute top-3 left-3.5 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE4DC]/95 backdrop-blur-xs text-[#DF3415] text-[12px] font-bold shadow-sm">
                          <Flame className="w-3.5 h-3.5 fill-[#F04423] text-[#F04423]" />
                          <span>Trending</span>
                        </div>

                        {/* Owner-Only Quick Change Banner Button on Front Card */}
                        {cardItem.isOwner && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditActivityBannerModal(cardItem.id);
                            }}
                            aria-label="Tukar Gambar Poster Aktiviti"
                            className="absolute top-3 right-13 z-10 h-8 px-2.5 rounded-[11px] bg-[#1A063E]/90 hover:bg-[#2B0B63] text-white border border-purple-300/60 text-[10px] font-extrabold flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300" />
                            <span>Tukar Gambar</span>
                          </button>
                        )}

                        {/* Bookmark Button (Top-Right) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProject(cardItem.id);
                          }}
                          aria-label="Save activity"
                          className={`absolute top-3 right-3.5 z-10 w-8 h-8 rounded-[11px] flex items-center justify-center shadow-sm transition-colors cursor-pointer ${
                            cardIsSaved
                              ? 'bg-[#6215E5] text-white'
                              : 'bg-white/95 text-[#14122E]'
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 stroke-[2.1] ${
                              cardIsSaved ? 'fill-current' : ''
                            }`}
                          />
                        </button>

                        {/* Pagination Dots on the Banner (Bottom Center) */}
                        <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-1.5">
                          {cardsCatalog.slice(0, 4).map((c, dotIdx) => {
                            const isActiveDot =
                              stepNumber % cardsCatalog.length === dotIdx;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerSwipeRight();
                                }}
                                aria-label={`Activity card ${dotIdx + 1}`}
                                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                                  isActiveDot
                                    ? 'bg-white scale-125 shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                                    : 'bg-white/60 hover:bg-white'
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Curved Purple Wave + 4 Diagonal Stripes on Right + White Wave Bottom */}
                        <svg
                          className="absolute -bottom-[1px] inset-x-0 w-full h-9 pointer-events-none"
                          viewBox="0 0 400 44"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M210,44 C265,12 335,2 400,6 L400,44 Z"
                            fill="#4B0FB8"
                          />
                          <g fill="#9F67FF" opacity="0.65">
                            <polygon points="300,26 308,26 318,12 310,12" />
                            <polygon points="320,26 328,26 338,12 330,12" />
                            <polygon points="340,26 348,26 358,12 350,12" />
                            <polygon points="360,26 368,26 378,12 370,12" />
                          </g>
                          <path
                            d="M0,24 C115,-2 260,34 400,40 L400,44 L0,44 Z"
                            fill="#F7F5FF"
                          />
                        </svg>
                      </div>

                      {/* Card Text & Metadata Body */}
                      <div className="px-4 pt-1 pb-2.5 text-[#14122E]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h1 className="text-[21px] font-extrabold font-display tracking-tight text-[#11102E] leading-tight truncate">
                              {cardItem.title}
                            </h1>

                            <div className="mt-1 space-y-0.5 text-[11.5px] font-medium text-[#211E3A]">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#1E1B38] shrink-0 stroke-[2.1]" />
                                <span>{cardItem.dateText}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#1E1B38] shrink-0 stroke-[2.1]" />
                                <span>{cardItem.locationText}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-[#1E1B38] shrink-0 stroke-[2.1]" />
                                <span>{cardItem.audienceText}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Box: [</> Program Fakulti] */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCardInfoModal(cardItem.id);
                            }}
                            className="mt-3.5 shrink-0 w-[82px] py-2 px-2 rounded-[18px] bg-[#EAE2FF] border border-[#D8C7FF] flex flex-col items-center justify-center text-[#5A17E0] hover:bg-[#E0D4FF] transition-colors cursor-pointer"
                          >
                            <div className="border-[1.8px] border-[#5A17E0] rounded-[4px] px-1.5 py-0.5 text-[9px] font-mono font-bold leading-none mb-1">
                              &lt;/&gt;
                            </div>
                            <span className="text-[11px] font-bold leading-tight">
                              {cardItem.facultyLabel1}
                            </span>
                            <span className="text-[11px] font-bold leading-tight">
                              {cardItem.facultyLabel2}
                            </span>
                          </button>
                        </div>

                        {/* Subtle Divider */}
                        <div className="my-2 border-t border-slate-200/90" />

                        {/* Purple Vertical Bar + Description */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-8 rounded-full bg-[#5E17EB] shrink-0" />
                          <p className="text-[11.5px] text-[#1A1833] font-medium leading-snug line-clamp-2">
                            {cardItem.description}
                          </p>
                        </div>

                        {/* 3 Lavender Tag Pills */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="flex-1 py-1 px-2.5 rounded-full bg-[#E9E0FF] text-[#5315D0] text-[11px] font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap">
                            <span className="font-mono font-extrabold text-[10px]">
                              &lt;/&gt;
                            </span>
                            <span>{cardItem.tags[0] || 'Tech'}</span>
                          </span>
                          <span className="flex-1 py-1 px-2.5 rounded-full bg-[#E9E0FF] text-[#5315D0] text-[11px] font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>{cardItem.tags[1] || 'Networking'}</span>
                          </span>
                          <span className="flex-1 py-1 px-2.5 rounded-full bg-[#E9E0FF] text-[#5315D0] text-[11px] font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap">
                            <Trophy className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>{cardItem.tags[2] || 'Competition'}</span>
                          </span>
                        </div>

                        {/* Interactive Swipe Guide Row (Swipe Left = Save & Info | Swipe Right = Skip) */}
                        <div className="mt-2 pt-1.5 border-t border-purple-200/60 flex items-center justify-between text-[10px] font-semibold italic text-[#3F1994]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSwipeLeft();
                            }}
                            className="inline-flex items-center gap-1 hover:text-[#6215E5] cursor-pointer"
                          >
                            <span className="not-italic font-bold">←</span>
                            <span>Swipe left to look more</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSwipeRight();
                            }}
                            className="inline-flex items-center gap-1 hover:text-[#6215E5] cursor-pointer"
                          >
                            <span>Swipe right to skip</span>
                            <span className="not-italic font-bold">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* B. WHITE MATCHES POTENTIAL CARD (Live drag reaction + Spring Pop Chart + Count-Up + Badge Shimmer) */}
            <div
              style={matchCardLiveStyle}
              className="relative mt-1.5 shrink-0 rounded-[22px] bg-[#F8F6FF] shadow-[0_10px_28px_rgba(18,3,48,0.35)] border border-white"
            >
              <div
                key={`match-card-${matchAnimKey}`}
                className="animate-match-card-bounce px-3.5 py-3 flex items-center gap-3"
              >
                {/* Left 78% Ring inside White Card */}
                <button
                  type="button"
                  onClick={() => openCardInfoModal(currentCard.id)}
                  style={matchRingLiveStyle}
                  className="relative w-[84px] h-[84px] shrink-0 flex items-center justify-center cursor-pointer group"
                >
                  {/* Expanding Halo Pulse Ring on Card Change */}
                  <span
                    key={`halo-${matchAnimKey}`}
                    className="animate-match-ring-halo pointer-events-none absolute inset-1 rounded-full border-2 border-purple-400/60 bg-purple-400/10"
                  />

                  {/* Spring Pop Container for Circular Chart + Sparkles */}
                  <div
                    key={`ring-pop-${matchAnimKey}`}
                    className="animate-match-ring-pop relative w-full h-full flex items-center justify-center"
                  >
                    <span
                      style={
                        isDraggingCard
                          ? {
                              transform: `rotate(${(
                                dragOffset.x * 0.45
                              ).toFixed(0)}deg) scale(${(
                                1 +
                                dragProgress * 0.35
                              ).toFixed(2)})`,
                            }
                          : undefined
                      }
                      className="absolute -top-0.5 left-0 text-[#7E3AF2] text-[13px] leading-none transition-transform duration-300"
                    >
                      ✦
                    </span>
                    <span
                      style={
                        isDraggingCard
                          ? {
                              transform: `rotate(${(
                                -dragOffset.x * 0.45
                              ).toFixed(0)}deg) scale(${(
                                1 +
                                dragProgress * 0.3
                              ).toFixed(2)})`,
                            }
                          : undefined
                      }
                      className="absolute top-2.5 -left-1 text-[#A855F7] text-[8px] leading-none transition-transform duration-300"
                    >
                      ✦
                    </span>

                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 84 84"
                    >
                      <defs>
                        <linearGradient
                          id="whiteCardRingGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#EC4899" />
                          <stop offset="50%" stopColor="#A855F7" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="42"
                        cy="42"
                        r={ringRadius}
                        stroke="#E9E2FF"
                        strokeWidth="7.5"
                        fill="#FFFFFF"
                      />
                      <circle
                        cx="42"
                        cy="42"
                        r={ringRadius}
                        stroke="url(#whiteCardRingGrad)"
                        strokeWidth="7.5"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-[stroke-dashoffset] duration-75 ease-out"
                      />
                    </svg>

                    <span
                      key={`num-pop-${matchAnimKey}`}
                      className="animate-match-number-pop absolute text-[21px] font-extrabold font-display text-[#12102E] tracking-tight tabular-nums"
                    >
                      {effectiveRingScore}%
                    </span>
                  </div>
                </button>

                {/* Vertical Divider */}
                <div className="w-px h-16 bg-slate-200 shrink-0" />

                {/* Right Match Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h2 className="text-[15px] font-extrabold font-display text-[#27115F] tracking-tight truncate">
                      Matches Potential
                    </h2>
                    <button
                      type="button"
                      onClick={() => openCardInfoModal(currentCard.id)}
                      className="text-[11px] font-bold text-[#3B188C] hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      <span>see more...</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Gold Star Badge + Purple-Pink "High Match!" Pill + Shimmer Sweep + Yellow Burst */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="relative inline-flex items-center pl-7 pr-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#C084FC] shadow-xs">
                      {/* Diagonal Shimmer Overlay clipped inside capsule */}
                      <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
                        <span
                          key={`shimmer-${matchAnimKey}`}
                          className="animate-match-badge-shimmer absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                        />
                      </span>

                      <div
                        key={`star-${matchAnimKey}`}
                        className="animate-match-star-spin absolute -left-0.5 -top-0.5 w-6 h-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-200 shadow-xs flex items-center justify-center text-white text-[11px] font-bold z-10"
                      >
                        ★
                      </div>
                      <span className="relative z-10 text-[12.5px] font-extrabold text-white tracking-tight">
                        {matchData.score >= 70 ? 'High Match!' : 'Good Match!'}
                      </span>
                    </div>

                    {/* Yellow Burst Lines */}
                    <div
                      key={`burst-${matchAnimKey}`}
                      style={
                        isDraggingCard
                          ? {
                              transform: `translateX(${(
                                dragProgress * 3
                              ).toFixed(1)}px) scale(${(
                                1 +
                                dragProgress * 0.25
                              ).toFixed(2)})`,
                            }
                          : undefined
                      }
                      className="animate-match-burst-pulse flex flex-col gap-1 transition-transform duration-200"
                    >
                      <span className="inline-block w-2.5 h-1 bg-amber-400 rounded-full transform -rotate-25" />
                      <span className="inline-block w-2 h-1 bg-amber-400 rounded-full transform rotate-15" />
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] font-medium text-[#1D1B36] leading-snug">
                    Great fit! This activity matches{' '}
                    <span className="font-bold tabular-nums text-[#4C1D95]">
                      {effectiveRingScore}%
                    </span>{' '}
                    of your interests and profile.
                  </p>
                </div>
              </div>
            </div>

            {/* C. SKILLS CONTROL BAR & WRAPPING FILTER PILLS (Flows downward as more filters are added) */}
            <div className="space-y-2.5 shrink-0 pb-3">
              <div className="border-y border-white/25 px-1 py-1.5 flex items-center justify-between text-white">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveModal('add-home-skill')}
                    className="relative pb-1 text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 stroke-[2.2]" />
                    <span>Skills</span>
                    <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="absolute -bottom-[7px] inset-x-0 h-[2.5px] bg-white rounded-full" />
                  </button>

                  <div className="h-4 w-px bg-white/35 mx-3" />

                  <button
                    type="button"
                    onClick={() => setActiveModal('add-home-skill')}
                    aria-label="Add skill filter"
                    className="p-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.4]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-[13px] font-semibold inline-flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Randomize</span>
                </button>
              </div>

              {/* Unified Multi-Row Wrapping Filter Pills — extra filters automatically stack below */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  {label: 'Programming', icon: Laptop},
                  {label: 'Planning', icon: CalendarPlus},
                  {label: 'Database', icon: Database},
                ].map(({label, icon: Icon}) => {
                  const isOn = selectedTags.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleFilterTag(label)}
                      className={`h-[32px] px-3 rounded-full border text-[11.5px] font-medium inline-flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
                        isOn
                          ? 'bg-white/15 border-white/75 text-white shadow-[0_0_10px_rgba(255,255,255,0.18)]'
                          : 'bg-white/5 border-white/30 text-white/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => toggleFilterTag('Extrovert')}
                  className={`h-[32px] px-3.5 rounded-full border text-[11.5px] font-medium inline-flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
                    selectedTags.includes('Extrovert')
                      ? 'bg-white/15 border-white/75 text-white shadow-[0_0_10px_rgba(255,255,255,0.18)]'
                      : 'bg-white/5 border-white/30 text-white/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Extrovert</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFilterTag('Female only')}
                  className={`h-[32px] px-3.5 rounded-full border text-[11.5px] font-medium inline-flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
                    selectedTags.includes('Female only')
                      ? 'bg-white/15 border-white/75 text-white shadow-[0_0_10px_rgba(255,255,255,0.18)]'
                      : 'bg-white/5 border-white/30 text-white/60'
                  }`}
                >
                  <span className="text-sm leading-none">♀</span>
                  <span>Female only</span>
                </button>

                {customAddedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleFilterTag(tag)}
                    className="h-[32px] px-3 rounded-full bg-white/20 border border-white/75 text-white text-[11.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.14)]"
                  >
                    <span>{tag}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ---------------------------------------------------------
             PAGE 2: PROFILE SCREEN (100% Match to Image 2 — Driven by Normalized Store)
             --------------------------------------------------------- */
          <div className="relative z-10 flex-1 min-h-0 px-4 pt-1 pb-5 flex flex-col gap-3 overflow-y-auto no-scrollbar overscroll-y-contain">
            {/* 1. PROFILE HERO CARD */}
            <div className="relative shrink-0 rounded-[24px] p-[1.5px] bg-gradient-to-b from-white/95 to-purple-300/60 shadow-[0_10px_28px_rgba(20,3,52,0.3)]">
              <div className="rounded-[23px] bg-[#F8F6FF] overflow-hidden">
                {/* Sunset Campus Banner */}
                <div className="relative h-[68px] w-full overflow-hidden bg-[#320C6B]">
                  <div
                    className="absolute inset-0 bg-no-repeat"
                    style={{
                      backgroundImage:
                        'url("/assets/aistudio/file_0000000099708211a698e06bd291137a_0ad82db4.png")',
                      backgroundSize: '122% auto',
                      backgroundPosition: '58% 12%',
                    }}
                  />
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 72"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,56 C160,44 290,54 400,70 L400,72 L0,72 Z"
                      fill="#F8F6FF"
                    />
                  </svg>

                  {/* SDP: 500 & Edit Profile Pills on Bottom-Right of Banner */}
                  <div className="absolute bottom-2 right-2.5 z-20 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveModal('sdp-info')}
                      className="h-6 px-2.5 rounded-full bg-white/95 border border-purple-200 text-[#4C1D95] text-[10.5px] font-extrabold shadow-xs inline-flex items-center gap-1 hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <Award className="w-3 h-3 text-[#6215E5]" />
                      <span>SDP: {totalSdpPoints}</span>
                    </button>

                    <button
                      type="button"
                      onClick={openEditProfileModal}
                      className="h-6 px-2.5 rounded-full bg-white/95 border border-purple-200 text-[#4C1D95] text-[10.5px] font-extrabold shadow-xs inline-flex items-center gap-1 hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-2.5 h-2.5 text-[#6215E5]" />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={triggerSignOut}
                      title="Log Keluar"
                      className="h-6 px-2 rounded-full bg-white/95 border border-rose-200 text-rose-600 text-[10.5px] font-extrabold shadow-xs inline-flex items-center gap-1 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Profile Content Row with Overlapping Circular Avatar on Left */}
                <div className="px-3.5 pb-2.5 pt-0.5 flex items-start gap-3 relative">
                  <div className="-mt-10 relative w-[86px] h-[86px] shrink-0">
                    <div
                      onClick={openProfilePhotoModal}
                      title="Tekan untuk muat naik atau laras foto profil"
                      className="w-full h-full rounded-full border-[3px] border-white shadow-md overflow-hidden bg-purple-900 cursor-pointer"
                    >
                      <FahrinPortraitAvatar
                        variant={currentUser?.avatar_variant || 0}
                        avatarUrl={currentUser?.avatar_url}
                        zoom={currentUser?.avatar_zoom || 1}
                        offsetX={currentUser?.avatar_offset_x || 0}
                        offsetY={currentUser?.avatar_offset_y || 0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openProfilePhotoModal}
                      aria-label="Muat Naik atau Tukar Foto Profil"
                      className="absolute -bottom-0.5 right-0 w-7 h-7 rounded-full bg-[#DDD0FF] border-2 border-white text-[#5B18E5] shadow-xs flex items-center justify-center hover:bg-[#D0BFFF] transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>

                  {/* Fahrin Details from Normalized Profile */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-[19px] font-extrabold font-display text-[#12102E] leading-none">
                        {currentUser?.display_name || 'Fahrin'}
                      </h1>
                      <button
                        type="button"
                        onClick={() =>
                          updateProfileMetadata({
                            availability_status:
                              availabilityStatus === 'Available'
                                ? 'In Team'
                                : availabilityStatus === 'In Team'
                                ? 'Busy'
                                : 'Available',
                          })
                        }
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                          availabilityStatus === 'Available'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : availabilityStatus === 'In Team'
                            ? 'bg-[#E0E7FF] text-[#3730A3]'
                            : 'bg-[#FEE2E2] text-[#B91C1C]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            availabilityStatus === 'Available'
                              ? 'bg-[#16A34A]'
                              : availabilityStatus === 'In Team'
                              ? 'bg-[#4F46E5]'
                              : 'bg-[#DC2626]'
                          }`}
                        />
                        <span>{availabilityStatus}</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="mt-1 text-[11px] flex items-center gap-1.5 text-[#1E1B4B]">
                      <span className="font-extrabold">
                        {currentUser?.matric_no || 'A2412345'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-medium text-slate-700 truncate">
                        {currentUser?.programme || 'Software Engineering'}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-[#2A264E] truncate">
                      <Layers className="w-3 h-3 text-[#4C1D95] shrink-0" />
                      <span className="truncate">
                        {currentUser?.faculty ||
                          'Fakulti Komputeran dan Informatik (FKI), UMS'}
                      </span>
                    </div>

                    {/* 3 Lavender Contact Pills: Email, Phone, LinkedIn */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedContactType('email');
                          setActiveModal('contact-info');
                        }}
                        aria-label="Email Fahrin"
                        className="h-6 px-3.5 rounded-full bg-[#E5DCFF] hover:bg-[#D8C9FF] text-[#5B18E5] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedContactType('phone');
                          setActiveModal('contact-info');
                        }}
                        aria-label="Call Fahrin"
                        className="h-6 px-3.5 rounded-full bg-[#E5DCFF] hover:bg-[#D8C9FF] text-[#5B18E5] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedContactType('linkedin');
                          setActiveModal('contact-info');
                        }}
                        aria-label="Fahrin LinkedIn"
                        className="h-6 px-3.5 rounded-full bg-[#E5DCFF] hover:bg-[#D8C9FF] text-[#5B18E5] text-[11px] font-extrabold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        in
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ABOUT ME CARD */}
            <div className="relative rounded-[20px] bg-[#F3EEFF]/95 px-3.5 py-2 shadow-md border border-white/85">
              <button
                type="button"
                onClick={openEditAboutModal}
                aria-label="Edit About Me"
                className="absolute top-2 right-2.5 w-6 h-6 rounded-lg bg-white text-[#5B18E5] shadow-xs flex items-center justify-center hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3 stroke-[2.2]" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-[#5B18E5]" />
                <h2 className="text-[13.5px] font-extrabold font-display text-[#12102E]">
                  About Me
                </h2>
              </div>

              <p className="mt-1 pl-3 text-[10.8px] text-[#1D1B38] font-medium leading-snug pr-6 line-clamp-3">
                {currentUser?.bio ||
                  "SE student at UMS who's passionate about building practical and impactful projects, especially in web and app development. Always open to collaborate and learn new things!"}
              </p>
            </div>

            {/* 3. 4-COLUMN ACADEMIC & LOCATION STRIP CARD */}
            <div className="rounded-[20px] bg-[#F8F6FF] py-2 px-1.5 shadow-md border border-white/90 grid grid-cols-4 divide-x divide-slate-200/90 text-center items-center">
              <div className="px-1 flex flex-col items-center">
                <Layers className="w-4 h-4 text-[#5B18E5] mb-0.5 stroke-[2.2]" />
                <span className="text-[9.5px] text-slate-500 font-medium">
                  Year of Study
                </span>
                <span className="text-[11.5px] font-extrabold text-[#12102E] mt-0.5">
                  Year {currentUser?.year_of_study || 2}
                </span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <Code2 className="w-4 h-4 text-[#5B18E5] mb-0.5 stroke-[2.2]" />
                <span className="text-[9.5px] text-slate-500 font-medium">
                  Programme
                </span>
                <span className="text-[10.5px] font-extrabold text-[#12102E] leading-tight mt-0.5">
                  Software
                  <br />
                  Engineering
                </span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <Building2 className="w-4 h-4 text-[#5B18E5] mb-0.5 stroke-[2.2]" />
                <span className="text-[9.5px] text-slate-500 font-medium">
                  Faculty
                </span>
                <span className="text-[11.5px] font-extrabold text-[#12102E] mt-0.5">
                  {currentUser?.faculty_short || 'FKI'}
                </span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <MapPin className="w-4 h-4 text-[#5B18E5] mb-0.5 stroke-[2.2]" />
                <span className="text-[9.5px] text-slate-500 font-medium">
                  Location
                </span>
                <span className="text-[10.5px] font-extrabold text-[#12102E] leading-tight mt-0.5">
                  {currentUser?.location || 'Kota Kinabalu'}
                </span>
              </div>
            </div>

            {/* 4. BOTTOM SPLIT CARD: SKILLS & INTERESTS (Left) | HISTORY (Right) */}
            <div className="flex-1 min-h-[215px] shrink-0 rounded-[22px] bg-[#F8F6FF] p-3 shadow-lg border border-white/90 grid grid-cols-12 gap-2.5 overflow-hidden">
              {/* Left Column: Normalized Skills & Interests */}
              <div className="col-span-6 pr-1.5 border-r border-slate-200/90 flex flex-col justify-between overflow-y-auto no-scrollbar">
                {/* Skills Block (student_skills <-> skills) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#6C2BD9] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                        &lt;/&gt;
                      </div>
                      <span className="text-slate-300 font-light">|</span>
                      <span className="text-[13px] font-extrabold text-[#12102E]">
                        Skills
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('add-profile-skill')}
                      className="px-2 py-0.5 rounded-full bg-[#E5DCFF] hover:bg-[#D8C9FF] text-[#5B18E5] text-[10px] font-extrabold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {myNormalizedSkills.map((sk) => (
                      <button
                        key={sk.skill_id}
                        type="button"
                        onClick={() => removeStudentSkillById(sk.skill_id)}
                        title={`Proficiency: ${sk.proficiency} (Tap to remove)`}
                        className="px-2 py-0.5 rounded-full bg-[#E6DEFF] hover:bg-[#D9CCFF] text-[#4C1D95] text-[10px] font-bold cursor-pointer"
                      >
                        {sk.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="my-1.5 border-t border-slate-200/90" />

                {/* Interests Block (student_interests <-> interests) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#6C2BD9] text-white flex items-center justify-center">
                        <Gamepad2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-300 font-light">|</span>
                      <span className="text-[13px] font-extrabold text-[#12102E]">
                        Interests
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('add-profile-interest')}
                      className="px-2 py-0.5 rounded-full bg-[#E5DCFF] hover:bg-[#D8C9FF] text-[#5B18E5] text-[10px] font-extrabold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {myNormalizedInterests.map((intr) => (
                      <button
                        key={intr.interest_id}
                        type="button"
                        onClick={() =>
                          removeStudentInterestById(intr.interest_id)
                        }
                        title="Tap to remove interest"
                        className="px-2 py-0.5 rounded-full bg-[#E6DEFF] hover:bg-[#D9CCFF] text-[#4C1D95] text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {intr.name === 'Learning' && (
                          <BookOpen className="w-2.5 h-2.5" />
                        )}
                        <span>{intr.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: History (student_activity_history) */}
              <div className="col-span-6 flex flex-col min-h-0 relative pr-2">
                <div className="flex items-start gap-1.5 mb-1.5">
                  <History className="w-4 h-4 text-[#5B18E5] shrink-0 mt-0.5 stroke-[2.3]" />
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#12102E] leading-none">
                      History
                    </h3>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                      Past programs and activities
                    </p>
                  </div>
                </div>

                {/* History Items List */}
                <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pr-0.5">
                  {myHistoryRecords.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedHistoryItem(item);
                        setActiveModal('history-detail');
                      }}
                      className="w-full text-left rounded-xl bg-[#EFEAFF] hover:bg-[#E4DCFF] px-2 py-1.5 flex items-center justify-between gap-1 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-1 h-6 rounded-full bg-[#5B18E5] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-extrabold text-[#12102E] truncate">
                            {item.title}
                          </div>
                          <div className="text-[9px] text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span className="truncate">
                              {item.date_display}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#12102E] shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Purple Vertical Scrollbar Track Indicator */}
                <div className="absolute right-0 top-8 bottom-1 w-1 rounded-full bg-purple-200/70 overflow-hidden pointer-events-none">
                  <div className="w-full h-1/2 rounded-full bg-[#5B18E5]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            3. BOTTOM 2-NAVIGATION BAR + FLOATING '+' BUTTON (Hidden on Search, Activity Detail, Post Activity & Side Pages)
           ========================================================= */}
        {!isSearchPageOpen &&
          !isActivityPageOpen &&
          !isPostActivityPageOpen &&
          !activeSidePage && (
            <div className="relative z-20 px-4 pb-3.5 pt-1 flex items-center gap-3">
              <nav
                aria-label="Primary Navigation"
                className="flex-1 h-[52px] bg-[#F5F2FF] rounded-full p-1.5 shadow-[0_10px_28px_rgba(12,2,30,0.5)] border border-white/85 grid grid-cols-2 items-center"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className={`h-full rounded-full flex items-center justify-center gap-2 text-[14px] transition-all cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-[#E1D4FF] text-[#5515CE] font-extrabold shadow-xs'
                      : 'text-[#626077] font-semibold hover:text-[#14122E]'
                  }`}
                >
                  <Home
                    className={`w-5 h-5 ${
                      activeTab === 'home'
                        ? 'fill-[#5B18E5] text-[#5B18E5]'
                        : 'text-[#626077]'
                    }`}
                  />
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`h-full rounded-full flex items-center justify-center gap-2 text-[14px] transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#E1D4FF] text-[#5515CE] font-extrabold shadow-xs'
                      : 'text-[#626077] font-semibold hover:text-[#14122E]'
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${
                      activeTab === 'profile'
                        ? 'fill-[#5B18E5] text-[#5B18E5]'
                        : 'text-[#626077]'
                    }`}
                  />
                  <span>Profile</span>
                </button>
              </nav>

              {/* Circular Purple '+' Button with Glass Halo -> Opens Dedicated Full-Screen Post Activity Page */}
              <button
                type="button"
                onClick={openPostActivityPage}
                aria-label="Post New Activity or Project"
                className="w-[54px] h-[54px] rounded-full p-1 bg-white/15 border border-white/50 shadow-[0_8px_25px_rgba(139,92,246,0.65)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#9D5CFF] via-[#7B2CBF] to-[#4A0E9E] flex items-center justify-center text-white shadow-inner">
                  <Plus className="w-7 h-7 stroke-[2.8]" />
                </div>
              </button>
            </div>
          )}

        {/* =========================================================
            4. SIDE MENU DRAWER (Streamlined & Connected to Full-Screen Pages)
           ========================================================= */}
        {isSidebarOpen && (
          <div
            className="absolute inset-0 z-50 bg-[#12042E]/45 backdrop-blur-[2px] flex"
            onClick={() => setIsSidebarOpen(false)}
          >
            <aside
              className="w-[82%] max-w-[326px] h-full bg-white rounded-r-[32px] shadow-[12px_0_40px_rgba(15,3,38,0.45)] flex flex-col justify-between p-5 text-[#14122E]"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Top Window Dots + Close Button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="Close Side Menu"
                    className="w-7 h-7 rounded-full bg-[#F5F0FF] hover:bg-[#E9DFFF] text-[#5B18E5] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.4]" />
                  </button>
                </div>

                {/* Brand Row inside Sidebar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setActiveModal('app-icon-settings');
                      }}
                      title="Tukar Imej Ikon Aplikasi"
                      className="relative w-10 h-10 rounded-2xl bg-[#F0E9FF] hover:bg-[#E4D7FF] flex items-center justify-center transition-colors cursor-pointer group"
                    >
                      <ProjectLinkPLogo
                        src={appIconUrl}
                        className="w-7 h-7 rounded-md"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#5B18E5] text-white flex items-center justify-center shadow-xs">
                        <Camera className="w-2.5 h-2.5" />
                      </span>
                    </button>
                    <div>
                      <div className="text-[16px] font-extrabold font-display tracking-tight leading-tight">
                        <span className="text-[#14122E]">ProjectLink </span>
                        <span className="text-[#5B18E5]">UMS</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setActiveModal('app-icon-settings');
                        }}
                        className="text-[10px] font-bold text-[#6315EA] hover:underline cursor-pointer"
                      >
                        Tukar Ikon Aplikasi
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setActiveSidePage(null);
                      setIsActivityPageOpen(false);
                      setIsSearchPageOpen(true);
                    }}
                    aria-label="Search from sidebar"
                    className="p-1.5 text-slate-600 hover:text-[#5B18E5] cursor-pointer"
                  >
                    <Search className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>

                {/* STUDENT / ORGANIZER Segmented Toggle */}
                <div className="rounded-xl border border-slate-200 p-1 grid grid-cols-2 bg-white mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      updateProfileMetadata({role_mode: 'STUDENT'});
                      setIsSidebarOpen(false);
                    }}
                    className={`py-2 rounded-lg text-[10.5px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                      sidebarRole === 'STUDENT'
                        ? 'bg-[#5B18E5] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    STUDENT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateProfileMetadata({role_mode: 'ORGANIZER'});
                      setActiveSidebarItem('Settings');
                      setIsSidebarOpen(false);
                      setIsSearchPageOpen(false);
                      setIsActivityPageOpen(false);
                      setActiveSidePage('settings');
                    }}
                    className={`py-2 rounded-lg text-[10.5px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                      sidebarRole === 'ORGANIZER'
                        ? 'bg-[#5B18E5] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ORGANIZER
                  </button>
                </div>

                {/* Primary Menu List (Streamlined: Discover, My Activities, Saved Activities, Calendar) */}
                <div className="space-y-1">
                  {[
                    {
                      label: 'Discover',
                      icon: LayoutGrid,
                      badge: null,
                      action: () => {
                        setActiveSidebarItem('Discover');
                        setActiveSidePage(null);
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveTab('home');
                        setIsSidebarOpen(false);
                      },
                    },
                    {
                      label: 'My Activities',
                      icon: Layers,
                      badge: `${myHistoryRecords.length}`,
                      action: () => {
                        setActiveSidebarItem('My Activities');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveSidePage('my-activities');
                        setIsSidebarOpen(false);
                      },
                    },
                    {
                      label: 'Saved Activities',
                      icon: Bookmark,
                      badge: `${
                        savedProjects.filter(
                          (s) => s.student_id === currentUser?.id
                        ).length
                      }`,
                      action: () => {
                        setActiveSidebarItem('Saved Activities');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveSidePage('saved-activities');
                        setIsSidebarOpen(false);
                      },
                    },
                    {
                      label: 'Calendar',
                      icon: Calendar,
                      badge: null,
                      action: () => {
                        setActiveSidebarItem('Calendar');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveSidePage('calendar');
                        setIsSidebarOpen(false);
                      },
                    },
                  ].map(({label, icon: Icon, badge, action}) => {
                    const isActive = activeSidebarItem === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={action}
                        className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-[13px] transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#EFE9FF] text-[#5B18E5] font-bold'
                            : 'text-slate-600 font-medium hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? 'text-[#5B18E5]' : 'text-slate-500'
                            }`}
                          />
                          <span>{label}</span>
                        </span>
                        {badge && (
                          <span className="text-[11px] font-extrabold text-[#5B18E5] tabular-nums">
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Divider + ACCOUNT Section (Notifications & Settings only) */}
                <div className="my-3 border-t border-slate-100" />

                <div>
                  <div className="px-3.5 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    ACCOUNT
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSidebarItem('Notifications');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveSidePage('notifications');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-[13px] transition-colors cursor-pointer ${
                        activeSidebarItem === 'Notifications'
                          ? 'bg-[#EFE9FF] text-[#5B18E5] font-bold'
                          : 'font-medium text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-slate-500" />
                        <span>Notifications</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#D9F99D] text-[#365314] text-[10.5px] font-extrabold tabular-nums">
                        {unreadCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSidebarItem('Settings');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveSidePage('settings');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-[13px] transition-colors cursor-pointer ${
                        activeSidebarItem === 'Settings'
                          ? 'bg-[#EFE9FF] text-[#5B18E5] font-bold'
                          : 'font-medium text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom My Profile Footer Card & Sign Out Button */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidePage(null);
                    setIsSearchPageOpen(false);
                    setIsActivityPageOpen(false);
                    setActiveTab('profile');
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-purple-300 bg-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-200 bg-[#4C11C4] shrink-0">
                      <FahrinPortraitAvatar
                        variant={currentUser?.avatar_variant || 0}
                        avatarUrl={currentUser?.avatar_url}
                        zoom={currentUser?.avatar_zoom || 1}
                        offsetX={currentUser?.avatar_offset_x || 0}
                        offsetY={currentUser?.avatar_offset_y || 0}
                      />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-[12.5px] font-extrabold text-slate-900 leading-tight truncate">
                        {currentUser?.display_name || 'My Profile'}
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        {currentUser?.email || 'UMS student account'}
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={triggerSignOut}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11.5px] font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Log Keluar (Sign Out)</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* =========================================================
            5. CONTEXTUAL MODALS (100% Connected to Relational Backend)
           ========================================================= */}
        {activeModal && (
          <div
            className="absolute inset-0 z-50 bg-[#100326]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="w-full max-h-[84%] bg-white rounded-[28px] p-5 text-[#14122E] shadow-2xl overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL: ACTIVITY INFO, WHATSAPP DIRECT CONTACT & MATCH DETAILS */}
              {activeModal === 'match-details' && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0E9FF] text-[#6215E5] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                        <Bookmark className="w-3 h-3 fill-current" />
                        <span>Saved Activity &amp; Info</span>
                      </div>
                      <h3 className="text-lg font-extrabold font-display leading-tight">
                        {modalCard.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Full Activity Info Card */}
                  <div className="p-3.5 rounded-2xl bg-[#F8F6FF] border border-[#E4DAFF] space-y-2 text-xs">
                    <div className="space-y-1 text-[#1E1B38] font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#5B18E5] shrink-0" />
                        <span>{modalCard.dateText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#5B18E5] shrink-0" />
                        <span>{modalCard.locationText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#5B18E5] shrink-0" />
                        <span>{modalCard.audienceText}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed pt-1 border-t border-purple-200/70">
                      {modalCard.description}
                    </p>
                  </div>

                  {/* THIRD-PARTY CONNECTOR: DIRECT WHATSAPP CONTACT CARD */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-300 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          Penganjur / Wakil Aktiviti (WhatsApp Direct)
                        </div>
                        <div className="font-extrabold text-slate-900 truncate mt-0.5">
                          {modalCard.organizerName}
                        </div>
                        <div className="text-[11.5px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{modalCard.organizerPhone}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard
                              .writeText(modalCard.organizerPhone)
                              .catch(() => {});
                          }
                          notifyToast(
                            'No. WhatsApp Disalin',
                            modalCard.organizerPhone,
                            'success'
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-emerald-800 font-bold text-[10.5px] border border-emerald-200 shadow-2xs shrink-0 cursor-pointer"
                      >
                        Salin No.
                      </button>
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        notifyToast(
                          'Membuka WhatsApp',
                          `Menghubungi ${modalCard.organizerName} (${modalCard.organizerPhone})...`,
                          'success'
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>
                        WhatsApp Penganjur ({modalCard.organizerPhone})
                      </span>
                    </a>
                    <p className="text-[10.5px] text-emerald-900/80 leading-snug text-center">
                      ProjectLink UMS bertindak sebagai penghubung — tekan
                      butang di atas untuk mesej penganjur secara terus di
                      WhatsApp.
                    </p>
                  </div>

                  {/* 40/25/20/15 Score Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F4EFFF]">
                      <div className="text-slate-500">Skills Coverage (40%)</div>
                      <div className="text-base font-extrabold text-[#4E14B8]">
                        {modalMatchData.skillScore} / 40
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F4EFFF]">
                      <div className="text-slate-500">Shared Interests (25%)</div>
                      <div className="text-base font-extrabold text-[#4E14B8]">
                        {modalMatchData.interestScore} / 25
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F4EFFF]">
                      <div className="text-slate-500">Schedule Overlap (20%)</div>
                      <div className="text-base font-extrabold text-[#4E14B8]">
                        {modalMatchData.scheduleScore} / 20
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F4EFFF]">
                      <div className="text-slate-500">Goals &amp; Tags (15%)</div>
                      <div className="text-base font-extrabold text-[#4E14B8]">
                        {modalMatchData.goalScore} / 15
                      </div>
                    </div>
                  </div>

                  {/* Ranked Projects Comparison */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-800">
                      Senarai Kad Aktiviti Mengikut Skor Padanan:
                    </div>
                    {rankedProjectsList.map(({project, cardIdx, evalResult}) => (
                      <div
                        key={project.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          project.id === currentCard.id
                            ? 'bg-[#F4EFFF] border-[#6215E5]'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#14122E]">
                            {project.title}
                          </div>
                          <div className="text-[10.5px] text-slate-500">
                            WhatsApp: {project.organizer_phone || '+6012-883 4910'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCardIndex(cardIdx);
                            setActiveTab('home');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#5B18E5] text-white font-extrabold text-[11px] cursor-pointer"
                        >
                          {evalResult.totalScore}%
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* MODAL: ADD HOME SKILL FILTER */}
              {activeModal === 'add-home-skill' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Urus Penapis Kemahiran (Home)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Pilih penapis kemahiran untuk mengira semula skor{' '}
                    <strong>Matches Potential</strong> secara langsung:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Programming',
                      'Planning',
                      'Database',
                      'Extrovert',
                      'Female only',
                      'UI/UX Design',
                      'Python',
                      'React',
                      'Next.js',
                      'Figma',
                      'Data Analysis',
                    ].map((tagItem) => {
                      const added = selectedTags.includes(tagItem);
                      return (
                        <button
                          key={tagItem}
                          type="button"
                          onClick={() => toggleFilterTag(tagItem)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                            added
                              ? 'bg-[#6215E5] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {added ? `✓ ${tagItem}` : `+ ${tagItem}`}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* MODAL: CREATE NEW ACTIVITY / PROJECT (+ BUTTON -> Requires WhatsApp Number) */}
              {activeModal === 'create-project' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Cipta Aktiviti / Projek UMS
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newTitle.trim() || !newOrganizerPhone.trim()) return;
                      createProject({
                        p_title: newTitle.trim(),
                        p_description:
                          newDesc.trim() ||
                          'Aktiviti dan kolaborasi projek pelajar Universiti Malaysia Sabah (UMS).',
                        p_project_type: newType,
                        p_slots_needed: 4,
                        p_min_weekly_hours: 6,
                        p_deadline: '2026-11-24',
                        p_date_display: newDateText,
                        p_location: newLocationText,
                        p_audience: 'Terbuka kepada semua pelajar UMS',
                        p_badge_line_1: 'Program',
                        p_badge_line_2: newType,
                        p_tags: ['Tech', 'Networking', newType],
                        p_organizer_phone: newOrganizerPhone.trim(),
                        p_organizer_name: `${
                          currentUser?.display_name || 'Fahrin'
                        } (${currentUser?.faculty_short || 'FKI'})`,
                        p_required_skills: [
                          {
                            skill_id: 'sk-web',
                            mandatory: true,
                            importance: 5,
                          },
                          {
                            skill_id: 'sk-14',
                            mandatory: false,
                            importance: 4,
                          },
                        ],
                        p_interests: ['in-01', 'in-collab'],
                        p_meeting_slots: [
                          {
                            weekday: 3,
                            start_time: '14:00',
                            end_time: '17:00',
                          },
                        ],
                      });
                      setNewTitle('');
                      setNewDesc('');
                      setCardIndex(0);
                      setActiveTab('home');
                      setActiveModal(null);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block font-bold mb-1">
                        Nama Aktiviti / Projek *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="cth. Borneo AI Hackathon 2026"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-emerald-700">
                        No. WhatsApp Penganjur (Wajib untuk dihubungi) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newOrganizerPhone}
                        onChange={(e) => setNewOrganizerPhone(e.target.value)}
                        placeholder="cth. +6012-883 4910"
                        className="w-full rounded-xl border border-emerald-400 bg-emerald-50/40 px-3 py-2 font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">Tarikh</label>
                        <input
                          type="text"
                          value={newDateText}
                          onChange={(e) => setNewDateText(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Kategori</label>
                        <select
                          value={newType}
                          onChange={(e) =>
                            setNewType(e.target.value as ProjectType)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        >
                          <option value="Competition">Competition</option>
                          <option value="Innovation">Innovation</option>
                          <option value="Community">Community</option>
                          <option value="Assignment">Assignment</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Lokasi</label>
                      <input
                        type="text"
                        value={newLocationText}
                        onChange={(e) => setNewLocationText(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">
                        Penerangan Aktiviti
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Penerangan aktiviti untuk pelajar UMS..."
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#6215E5] text-white font-bold cursor-pointer"
                    >
                      Terbitkan ke Kad Home
                    </button>
                  </form>
                </>
              )}

              {/* MODAL: EDIT PROFILE (Updates Normalized profiles table) */}
              {activeModal === 'edit-profile' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Edit Profile (Normalized DB)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block font-bold mb-1">
                        Nama Paparan
                      </label>
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">
                          No. Matriks
                        </label>
                        <input
                          type="text"
                          value={draftMatric}
                          onChange={(e) => setDraftMatric(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">
                          Year of Study (1-8)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={draftYear}
                          onChange={(e) =>
                            setDraftYear(Number(e.target.value) || 2)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">
                          Kod Fakulti
                        </label>
                        <input
                          type="text"
                          value={draftFacultyShort}
                          onChange={(e) => setDraftFacultyShort(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Lokasi</label>
                        <input
                          type="text"
                          value={draftLocation}
                          onChange={(e) => setDraftLocation(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Program</label>
                      <input
                        type="text"
                        value={draftProgramme}
                        onChange={(e) => setDraftProgramme(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">
                        Nama Penuh Fakulti
                      </label>
                      <input
                        type="text"
                        value={draftFacultyFull}
                        onChange={(e) => setDraftFacultyFull(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openProfilePhotoModal}
                      className="w-full py-2 rounded-xl bg-[#F3EEFF] hover:bg-[#E6DBFF] text-[#5B18E5] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Muat Naik / Laras Foto Profil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateProfileMetadata({
                          display_name: draftName.trim() || 'Fahrin',
                          matric_no: draftMatric.trim() || 'A2412345',
                          year_of_study: draftYear,
                          programme:
                            draftProgramme.trim() || 'Software Engineering',
                          faculty_short: draftFacultyShort.trim() || 'FKI',
                          faculty:
                            draftFacultyFull.trim() ||
                            'Fakulti Komputeran dan Informatik (FKI), UMS',
                          location: draftLocation.trim() || 'Kota Kinabalu',
                        });
                        setActiveModal(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#6215E5] text-white font-bold cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </>
              )}

              {/* MODAL: PROFILE PHOTO STUDIO (Upload from Device, URL, Zoom 1x-3x, Pan X/Y & UMS Avatar) */}
              {activeModal === 'profile-photo' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold font-display">
                        Muat Naik &amp; Laras Foto Profil
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Muat naik gambar profil sendiri serta laras zum &amp; kedudukan
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Live Circular Avatar Preview */}
                  <div className="flex flex-col items-center justify-center py-2 bg-[#F7F4FF] rounded-2xl border border-purple-200/80 space-y-2">
                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-purple-900">
                      <FahrinPortraitAvatar
                        variant={draftAvatarVariant}
                        avatarUrl={
                          draftAvatarMode === 'photo' && draftAvatarUrl.trim()
                            ? draftAvatarUrl.trim()
                            : null
                        }
                        zoom={draftAvatarZoom}
                        offsetX={draftAvatarOffsetX}
                        offsetY={draftAvatarOffsetY}
                      />
                    </div>
                    <span className="text-[10.5px] font-bold text-[#5B18E5]">
                      {draftAvatarMode === 'photo' && draftAvatarUrl.trim()
                        ? `Zum: ${Math.round(draftAvatarZoom * 100)}% · X: ${draftAvatarOffsetX}% · Y: ${draftAvatarOffsetY}%`
                        : 'Mod Ilustrasi Sunset UMS'}
                    </span>
                  </div>

                  {/* Mode Switcher: Muat Naik Foto vs Ilustrasi UMS */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-extrabold">
                    <button
                      type="button"
                      onClick={() => setDraftAvatarMode('photo')}
                      className={`py-2 rounded-lg transition-colors cursor-pointer ${
                        draftAvatarMode === 'photo'
                          ? 'bg-[#5B18E5] text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Foto Sendiri / URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftAvatarMode('illustration')}
                      className={`py-2 rounded-lg transition-colors cursor-pointer ${
                        draftAvatarMode === 'illustration'
                          ? 'bg-[#5B18E5] text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Avatar Ilustrasi UMS
                    </button>
                  </div>

                  {draftAvatarMode === 'photo' ? (
                    <div className="space-y-3 text-xs">
                      <label className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-purple-300 bg-[#F9F6FF] hover:bg-purple-50 text-[#5B18E5] font-extrabold text-center flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>
                          {draftAvatarUrl
                            ? 'Tukar Foto dari Peranti (JPG/PNG)'
                            : 'Pilih Foto Profil dari Peranti'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed =
                                await compressImageFileToDataUrl(
                                  file,
                                  380,
                                  380,
                                  0.86
                                );
                              setDraftAvatarUrl(compressed);
                              setDraftAvatarZoom(1);
                              setDraftAvatarOffsetX(0);
                              setDraftAvatarOffsetY(0);
                              notifyToast(
                                'Foto Profil Dimuat Naik',
                                'Anda boleh laras zum dan kedudukan di bawah.',
                                'success'
                              );
                            } catch {
                              notifyToast(
                                'Gagal Memuat Naik Foto',
                                'Sila cuba fail gambar yang lain.',
                                'error'
                              );
                            }
                          }}
                        />
                      </label>

                      <div>
                        <label className="block font-bold mb-1 text-slate-700">
                          Atau Tampal URL Foto Profil:
                        </label>
                        <input
                          type="url"
                          value={
                            draftAvatarUrl.startsWith('data:')
                              ? ''
                              : draftAvatarUrl
                          }
                          onChange={(e) => setDraftAvatarUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                        />
                      </div>

                      {/* Zoom & Pan X/Y Controls */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-700">
                            Laras Zum &amp; Kedudukan Foto
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftAvatarZoom(1);
                              setDraftAvatarOffsetX(0);
                              setDraftAvatarOffsetY(0);
                            }}
                            className="text-[10.5px] font-extrabold text-[#5B18E5] hover:underline cursor-pointer"
                          >
                            Reset Posisi
                          </button>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10.5px] font-bold text-slate-600 mb-0.5">
                            <span>Tahap Zum</span>
                            <span className="tabular-nums">
                              {Math.round(draftAvatarZoom * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={2.6}
                            step={0.05}
                            value={draftAvatarZoom}
                            onChange={(e) =>
                              setDraftAvatarZoom(Number(e.target.value))
                            }
                            className="w-full accent-[#5B18E5]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="flex justify-between text-[10.5px] font-bold text-slate-600 mb-0.5">
                              <span>Kiri / Kanan (X)</span>
                              <span className="tabular-nums">
                                {draftAvatarOffsetX}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={-40}
                              max={40}
                              step={1}
                              value={draftAvatarOffsetX}
                              onChange={(e) =>
                                setDraftAvatarOffsetX(Number(e.target.value))
                              }
                              className="w-full accent-[#5B18E5]"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10.5px] font-bold text-slate-600 mb-0.5">
                              <span>Atas / Bawah (Y)</span>
                              <span className="tabular-nums">
                                {draftAvatarOffsetY}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={-40}
                              max={40}
                              step={1}
                              value={draftAvatarOffsetY}
                              onChange={(e) =>
                                setDraftAvatarOffsetY(Number(e.target.value))
                              }
                              className="w-full accent-[#5B18E5]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-slate-700">
                        Pilih Variasi Avatar Ilustrasi UMS:
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[0, 1, 2].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setDraftAvatarVariant(v)}
                            className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer ${
                              draftAvatarVariant === v
                                ? 'border-[#5B18E5] bg-[#F4EFFF]'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-white shadow-xs">
                              <FahrinPortraitAvatar variant={v} />
                            </div>
                            <span className="text-[10.5px] font-extrabold">
                              Gaya #{v + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {currentUser?.avatar_url && (
                      <button
                        type="button"
                        onClick={() => {
                          updateProfileMetadata({
                            avatar_url: null,
                            avatar_zoom: 1,
                            avatar_offset_x: 0,
                            avatar_offset_y: 0,
                          });
                          setActiveModal(null);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-xs cursor-pointer"
                      >
                        Padam Foto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (draftAvatarMode === 'illustration') {
                          updateProfileMetadata({
                            avatar_url: null,
                            avatar_variant: draftAvatarVariant,
                            avatar_zoom: 1,
                            avatar_offset_x: 0,
                            avatar_offset_y: 0,
                          });
                        } else {
                          updateProfileMetadata({
                            avatar_url: draftAvatarUrl.trim() || null,
                            avatar_zoom: draftAvatarZoom,
                            avatar_offset_x: draftAvatarOffsetX,
                            avatar_offset_y: draftAvatarOffsetY,
                          });
                        }
                        setActiveModal(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold text-xs cursor-pointer"
                    >
                      Simpan Foto Profil
                    </button>
                  </div>
                </>
              )}

              {/* MODAL: OWNER-ONLY EDIT ACTIVITY BANNER / POSTER */}
              {activeModal === 'edit-activity-banner' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold font-display">
                        Tukar Gambar Poster Aktiviti
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Khas untuk pemilik aktiviti — muat naik fail, URL, atau pilih preset UMS
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Live Poster Preview */}
                  <div className="relative h-[132px] w-full rounded-2xl overflow-hidden bg-[#240850] border-2 border-purple-200 shadow-md">
                    <ActivityCardBanner
                      cardId={editBannerPreset || editingBannerProjectId}
                      bannerUrl={
                        editBannerMode !== 'preset' && editBannerUrl.trim()
                          ? editBannerUrl.trim()
                          : null
                      }
                      bannerPreset={editBannerPreset}
                      bannerPositionY={editBannerPosY}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-extrabold truncate drop-shadow">
                        {projects.find((p) => p.id === editingBannerProjectId)
                          ?.title || 'Poster Aktiviti UMS'}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-300 shrink-0">
                        Pralihat Langsung
                      </span>
                    </div>
                  </div>

                  {/* Mode Switcher */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 text-xs font-extrabold">
                    <button
                      type="button"
                      onClick={() => setEditBannerMode('upload')}
                      className={`py-2 rounded-lg transition-colors cursor-pointer ${
                        editBannerMode === 'upload'
                          ? 'bg-[#5B18E5] text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Muat Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBannerMode('url')}
                      className={`py-2 rounded-lg transition-colors cursor-pointer ${
                        editBannerMode === 'url'
                          ? 'bg-[#5B18E5] text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      URL Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBannerMode('preset')}
                      className={`py-2 rounded-lg transition-colors cursor-pointer ${
                        editBannerMode === 'preset'
                          ? 'bg-[#5B18E5] text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Preset UMS
                    </button>
                  </div>

                  {editBannerMode === 'upload' && (
                    <div className="space-y-2 text-xs">
                      <label className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-purple-300 bg-[#F9F6FF] hover:bg-purple-50 text-[#5B18E5] font-extrabold text-center flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>
                          Pilih Gambar Poster dari Peranti (JPG/PNG)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed =
                                await compressImageFileToDataUrl(
                                  file,
                                  900,
                                  500,
                                  0.84
                                );
                              setEditBannerUrl(compressed);
                              notifyToast(
                                'Poster Dimuat Naik',
                                'Tekan Simpan Gambar Poster untuk mengesahkan.',
                                'success'
                              );
                            } catch {
                              notifyToast(
                                'Gagal Memuat Naik Fail',
                                'Sila cuba fail gambar yang lain.',
                                'error'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {editBannerMode === 'url' && (
                    <div className="space-y-1.5 text-xs">
                      <label className="block font-bold text-slate-700">
                        Pautan URL Gambar Poster:
                      </label>
                      <input
                        type="url"
                        value={
                          editBannerUrl.startsWith('data:') ? '' : editBannerUrl
                        }
                        onChange={(e) => setEditBannerUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                      />
                    </div>
                  )}

                  {editBannerMode !== 'preset' && editBannerUrl.trim() && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>Fokus Menegak Poster</span>
                        <span className="tabular-nums">{editBannerPosY}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editBannerPosY}
                        onChange={(e) =>
                          setEditBannerPosY(Number(e.target.value))
                        }
                        className="w-full accent-[#5B18E5]"
                      />
                    </div>
                  )}

                  {editBannerMode === 'preset' && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {UMS_BANNER_PRESETS.map((preset) => {
                        const selected = editBannerPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setEditBannerPreset(preset.id)}
                            className={`rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                              selected
                                ? 'border-[#5B18E5] ring-2 ring-purple-300'
                                : 'border-slate-200 opacity-85 hover:opacity-100'
                            }`}
                          >
                            <div className="relative h-12 w-full overflow-hidden bg-[#1E0842]">
                              <ActivityCardBanner cardId={preset.id} />
                            </div>
                            <div className="p-1.5 bg-white">
                              <div className="text-[10px] font-extrabold text-[#14122E] truncate">
                                {preset.label}
                              </div>
                              <div className="text-[8.5px] text-slate-500 truncate">
                                {preset.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      updateProjectBanner(editingBannerProjectId, {
                        banner_url:
                          editBannerMode !== 'preset' && editBannerUrl.trim()
                            ? editBannerUrl.trim()
                            : null,
                        banner_preset: editBannerPreset,
                        banner_position_y: editBannerPosY,
                      });
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold text-xs cursor-pointer"
                  >
                    Simpan Gambar Poster
                  </button>
                </>
              )}

              {/* MODAL: EDIT ABOUT ME */}
              {activeModal === 'edit-about' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Sunting About Me
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={draftBio}
                    onChange={(e) => setDraftBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateProfileMetadata({bio: draftBio.trim()});
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#6215E5] text-white font-bold text-xs cursor-pointer"
                  >
                    Simpan Bio
                  </button>
                </>
              )}

              {/* MODAL: ADD PROFILE SKILL (Inserts into student_skills) */}
              {activeModal === 'add-profile-skill' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Tambah Kemahiran (student_skills)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        placeholder="cth. TypeScript, Flutter, SQL, Figma..."
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                      />
                      <select
                        value={newSkillProf}
                        onChange={(e) =>
                          setNewSkillProf(e.target.value as Proficiency)
                        }
                        className="rounded-xl border border-slate-300 px-2.5 py-2"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skills
                        .filter(
                          (s) =>
                            !myNormalizedSkills.some(
                              (ms) => ms.skill_id === s.id
                            )
                        )
                        .slice(0, 8)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              addStudentSkillByName(s.name, newSkillProf);
                              setActiveModal(null);
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#EFE9FF] text-[#5B18E5] font-bold cursor-pointer"
                          >
                            + {s.name}
                          </button>
                        ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (newSkillInput.trim()) {
                          addStudentSkillByName(
                            newSkillInput.trim(),
                            newSkillProf
                          );
                          setNewSkillInput('');
                          setActiveModal(null);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#6215E5] text-white font-bold cursor-pointer"
                    >
                      Tambah ke Profil
                    </button>
                  </div>
                </>
              )}

              {/* MODAL: ADD PROFILE INTEREST (Inserts into student_interests) */}
              {activeModal === 'add-profile-interest' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Tambah Minat (student_interests)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newInterestInput}
                        onChange={(e) => setNewInterestInput(e.target.value)}
                        placeholder="cth. Hackathon, Artificial Intelligence..."
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newInterestInput.trim()) {
                            addStudentInterestByName(newInterestInput.trim());
                            setNewInterestInput('');
                            setActiveModal(null);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-[#6215E5] text-white font-bold cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {interests
                        .filter(
                          (i) =>
                            !myNormalizedInterests.some(
                              (mi) => mi.interest_id === i.id
                            )
                        )
                        .slice(0, 8)
                        .map((i) => (
                          <button
                            key={i.id}
                            type="button"
                            onClick={() => {
                              addStudentInterestByName(i.name);
                              setActiveModal(null);
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#EFE9FF] text-[#5B18E5] font-bold cursor-pointer"
                          >
                            + {i.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {/* MODAL: HISTORY ITEM DETAILS */}
              {activeModal === 'history-detail' && selectedHistoryItem && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6215E5]">
                        Rekod Aktiviti UMS
                      </span>
                      <h3 className="text-base font-extrabold font-display">
                        {selectedHistoryItem.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F4EFFF] space-y-1.5 text-xs">
                    <div>
                      <strong>Tarikh:</strong>{' '}
                      {selectedHistoryItem.date_display}
                    </div>
                    <div>
                      <strong>Peranan:</strong> {selectedHistoryItem.role}
                    </div>
                    <div>
                      <strong>Mata SDP Diperoleh:</strong>{' '}
                      <span className="font-extrabold text-[#5B18E5]">
                        +{selectedHistoryItem.sdp_earned} SDP
                      </span>
                    </div>
                    <p className="text-slate-600 pt-1">
                      {selectedHistoryItem.summary}
                    </p>
                  </div>
                </>
              )}

              {/* MODAL: SDP POINTS BREAKDOWN */}
              {activeModal === 'sdp-info' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Mata Pembangunan Pelajar (SDP: {totalSdpPoints})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {myHistoryRecords.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {act.title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {act.date_display} · {act.role}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#E9E0FF] text-[#5B18E5] font-extrabold">
                          +{act.sdp_earned} SDP
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* MODAL: CONTACT INFO */}
              {activeModal === 'contact-info' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Maklumat Hubungan {currentUser?.display_name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F4EFFF] text-xs space-y-2">
                    <div
                      className={
                        selectedContactType === 'email'
                          ? 'font-bold text-[#5B18E5]'
                          : ''
                      }
                    >
                      <strong>E-mel UMS:</strong>{' '}
                      {currentUser?.email ||
                        'fahrin.a2412345@student.ums.edu.my'}
                    </div>
                    <div
                      className={
                        selectedContactType === 'phone'
                          ? 'font-bold text-[#5B18E5]'
                          : ''
                      }
                    >
                      <strong>Telefon / WhatsApp:</strong>{' '}
                      {currentUser?.phone || '+60 13-884 2412'}
                    </div>
                    <div
                      className={
                        selectedContactType === 'linkedin'
                          ? 'font-bold text-[#5B18E5]'
                          : ''
                      }
                    >
                      <strong>LinkedIn:</strong>{' '}
                      {currentUser?.linkedin || 'linkedin.com/in/fahrin-ums-fki'}
                    </div>
                  </div>
                </>
              )}

              {/* Search is now a dedicated full-screen page (isSearchPageOpen) */}

              {/* MODAL: NOTIFICATIONS */}
              {activeModal === 'notifications' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Notifikasi Kampus ({unreadCount})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        markAllNotificationsRead();
                        setActiveModal(null);
                      }}
                      className="text-xs font-bold text-[#6215E5] cursor-pointer"
                    >
                      Tanda Dibaca
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {notifications
                      .filter((n) => n.recipient_id === currentUser?.id)
                      .map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border ${
                            !n.read_at
                              ? 'bg-[#F4EFFF] border-[#DFD2FF]'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="font-bold text-[#4E14B8]">
                            {n.title ||
                              n.event_type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <p className="text-slate-600 mt-0.5">
                            {n.body ||
                              `Kemaskini bagi kategori ${n.target_type}.`}
                          </p>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {/* MODAL: SAVED ACTIVITIES (saved_projects) */}
              {activeModal === 'saved-activities' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Saved Activities
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {savedProjects.filter(
                    (s) => s.student_id === currentUser?.id
                  ).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Tiada aktiviti disimpan. Tekan ikon penanda buku pada kad
                      aktiviti di halaman Home.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {savedProjects
                        .filter((s) => s.student_id === currentUser?.id)
                        .map((sp) => {
                          const found = cardsCatalog.find(
                            (c) => c.id === sp.project_id
                          );
                          return (
                            <div
                              key={sp.project_id}
                              className="p-3 rounded-xl bg-[#F4EFFF] flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-bold text-[#14122E]">
                                  {found?.title || sp.project_id}
                                </div>
                                <div className="text-[10.5px] text-slate-500">
                                  {found?.dateText}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCardInfoModal(sp.project_id)
                                  }
                                  className="px-3 py-1 rounded-lg bg-[#5B18E5] text-white font-bold cursor-pointer"
                                >
                                  Buka Info
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSaveProject(sp.project_id)
                                  }
                                  className="px-2 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 cursor-pointer"
                                >
                                  Buang
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {/* MODAL: MY ACTIVITIES (applications + student_activity_history) */}
              {activeModal === 'my-activities' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      My Activities (Applications & History)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {applications
                      .filter((a) => a.applicant_id === currentUser?.id)
                      .map((app) => {
                        const proj = projects.find(
                          (p) => p.id === app.project_id
                        );
                        return (
                          <div
                            key={app.id}
                            className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-[#14122E]">
                                {proj?.title || app.project_id}
                              </div>
                              <div className="text-[10.5px] text-slate-600">
                                Permohonan: {app.status.toUpperCase()}
                              </div>
                            </div>
                            {app.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => withdrawApplication(app.id)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[10.5px] font-bold text-slate-700 cursor-pointer"
                              >
                                Tarik Balik
                              </button>
                            )}
                          </div>
                        );
                      })}

                    {myHistoryRecords.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl bg-[#F4EFFF] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#14122E]">
                            {act.title}
                          </div>
                          <div className="text-[10.5px] text-slate-500">
                            {act.role} · {act.date_display}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          +{act.sdp_earned} SDP
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* MODAL: CALENDAR & AVAILABILITY SLOTS (project_meeting_slots + availability_slots) */}
              {activeModal === 'calendar' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Kalendar & Slot Ketersediaan (Asia/Kuching)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Student's Weekly Availability Slots */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-800">
                      Slot Masa Lapang Anda (availability_slots):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availabilitySlots
                        .filter((s) => s.student_id === currentUser?.id)
                        .map((sl) => (
                          <span
                            key={sl.id}
                            className="px-2.5 py-1 rounded-full bg-[#EFE9FF] text-[#4C1D95] font-bold inline-flex items-center gap-1.5"
                          >
                            <span>
                              {WEEKDAY_SHORT[sl.weekday]} {sl.start_time}–
                              {sl.end_time}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAvailabilitySlot(sl.id)}
                              className="text-slate-500 hover:text-red-600 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>

                    {/* Add New Availability Slot */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <select
                        value={newSlotDay}
                        onChange={(e) => setNewSlotDay(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 px-2 py-1.5"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <option key={d} value={d}>
                            {WEEKDAY_SHORT[d]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          addAvailabilitySlot({
                            weekday: newSlotDay,
                            start_time: newSlotStart,
                            end_time: newSlotEnd,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#5B18E5] text-white font-bold cursor-pointer"
                      >
                        + Slot
                      </button>
                    </div>
                  </div>

                  {/* UMS Activity Dates */}
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                    <div className="font-bold text-slate-800">
                      Jadual Aktiviti Kampus UMS:
                    </div>
                    {cardsCatalog.map((c, idx) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#5B18E5]">
                            {c.dateText}
                          </div>
                          <div className="font-bold text-slate-900">
                            {c.title}
                          </div>
                          <div className="text-[10.5px] text-slate-500">
                            {c.locationText}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCardIndex(idx);
                            setActiveTab('home');
                            setActiveModal(null);
                          }}
                          className="text-[#5B18E5] font-bold cursor-pointer"
                        >
                          Lihat →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* MODAL: MY TEAMS, INVITATIONS & KANBAN TASKS */}
              {activeModal === 'my-teams' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      My Teams, Invitations & Tasks
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Pending Invitations (project_invitations) */}
                    {projectInvitations
                      .filter(
                        (i) =>
                          i.invitee_id === currentUser?.id &&
                          i.status === 'pending'
                      )
                      .map((inv) => {
                        const proj = projects.find(
                          (p) => p.id === inv.project_id
                        );
                        return (
                          <div
                            key={inv.id}
                            className="p-3 rounded-xl bg-[#F4EFFF] border border-[#D8C7FF] space-y-2"
                          >
                            <div className="font-bold text-[#4C1D95]">
                              Jemputan: {proj?.title || inv.project_id}
                            </div>
                            {inv.note && (
                              <p className="text-slate-600 text-[11px]">
                                &ldquo;{inv.note}&rdquo;
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  respondInvitation(inv.id, 'accepted')
                                }
                                className="px-3 py-1 rounded-lg bg-[#5B18E5] text-white font-bold cursor-pointer"
                              >
                                Terima (Join Team)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  respondInvitation(inv.id, 'declined')
                                }
                                className="px-3 py-1 rounded-lg bg-white text-slate-700 font-semibold border border-slate-200 cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Active Team Memberships (project_members) */}
                    <div className="font-bold text-slate-800">
                      Pasukan Aktif Anda (project_members):
                    </div>
                    {projectMembers
                      .filter(
                        (m) =>
                          m.student_id === currentUser?.id &&
                          m.membership_status === 'active'
                      )
                      .map((mem) => {
                        const proj = projects.find(
                          (p) => p.id === mem.project_id
                        );
                        const teamMembers = projectMembers.filter(
                          (tm) =>
                            tm.project_id === mem.project_id &&
                            tm.membership_status === 'active'
                        );
                        return (
                          <div
                            key={`${mem.project_id}-${mem.student_id}`}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#14122E]">
                                {proj?.title || mem.project_id}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#5B18E5] text-[10px] font-bold uppercase">
                                {mem.member_role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Ahli Aktif: {teamMembers.length} pelajar UMS
                            </div>
                          </div>
                        );
                      })}

                    {/* Workspace Tasks (project_tasks) */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800">
                        Tugasan Pasukan (project_tasks):
                      </div>
                      {projectTasks.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl bg-slate-100 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {t.title}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">
                              Status: {t.status.replace('_', ' ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateTaskStatus(
                                t.id,
                                t.status === 'done' ? 'in_progress' : 'done'
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                              t.status === 'done'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#5B18E5] text-white'
                            }`}
                          >
                            {t.status === 'done' ? '✓ Done' : 'Tanda Siap'}
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Tambah tugasan baharu pasukan..."
                          className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newTaskTitle.trim()) return;
                            createTask({
                              project_id: currentCard.id,
                              title: newTaskTitle.trim(),
                              description: 'Tugasan pasukan ProjectLink UMS',
                              priority: 'high',
                              assignee_id: currentUser?.id || null,
                              due_at: '2026-11-14',
                            });
                            setNewTaskTitle('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#5B18E5] text-white font-bold cursor-pointer"
                        >
                          + Task
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* MODAL: MESSAGES (Backed by project_messages table) */}
              {activeModal === 'messages' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Messages ({projectMessages.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs max-h-52 overflow-y-auto">
                    {projectMessages.map((msg) => {
                      const senderProfile = profiles.find(
                        (p) => p.id === msg.sender_id
                      );
                      return (
                        <div
                          key={msg.id}
                          className="p-2.5 rounded-xl bg-[#F4EFFF] space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#4C1D95]">
                              {senderProfile?.display_name || msg.sender_id} (
                              {senderProfile?.faculty_short || 'UMS'})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700">{msg.body}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Balas mesej kepada pasukan..."
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!chatInput.trim()) return;
                        sendMessage(currentCard.id, chatInput.trim());
                        setChatInput('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#5B18E5] text-white text-xs font-bold cursor-pointer"
                    >
                      Hantar
                    </button>
                  </div>
                </>
              )}

              {/* MODAL: SETTINGS & ORGANIZER PANEL */}
              {(activeModal === 'settings' ||
                activeModal === 'organizer-panel') && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      {activeModal === 'organizer-panel'
                        ? 'Panel Penganjur (Organizer Mode)'
                        : 'Tetapan Akaun & Pangkalan Data'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Switch Active Student / Organizer Persona */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700">
                        Tukar Akaun Pengguna (profiles):
                      </label>
                      <select
                        value={currentUser?.id || ''}
                        onChange={(e) => switchPersona(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.display_name} ({p.matric_no || p.id}) —{' '}
                            {p.faculty_short || 'UMS'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Incoming Applications Management (RPC decide_application) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="font-bold text-slate-800">
                        Permohonan Masuk (RPC decide_application):
                      </div>
                      {applications.filter((a) => a.status === 'pending')
                        .length === 0 ? (
                        <p className="text-slate-500 text-[11px]">
                          Tiada permohonan tertangguh buat masa ini.
                        </p>
                      ) : (
                        applications
                          .filter((a) => a.status === 'pending')
                          .map((app) => {
                            const applicant = profiles.find(
                              (p) => p.id === app.applicant_id
                            );
                            const proj = projects.find(
                              (p) => p.id === app.project_id
                            );
                            return (
                              <div
                                key={app.id}
                                className="p-2.5 rounded-xl bg-[#F4EFFF] space-y-1.5"
                              >
                                <div className="font-bold text-[#14122E]">
                                  {applicant?.display_name} → {proj?.title}
                                </div>
                                {app.note && (
                                  <p className="text-[11px] text-slate-600">
                                    {app.note}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      decideApplication(app.id, 'accepted')
                                    }
                                    className="px-3 py-1 rounded-lg bg-[#5B18E5] text-white font-bold cursor-pointer"
                                  >
                                    Terima
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      decideApplication(app.id, 'declined')
                                    }
                                    className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* Invite Consenting Student Candidate (RPC invite_candidate) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="font-bold text-slate-800">
                        Jemput Pelajar ke {currentCard.title} (RPC
                        invite_candidate):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {profiles
                          .filter(
                            (p) => p.id !== currentUser?.id && p.discoverable
                          )
                          .map((cand) => (
                            <button
                              key={cand.id}
                              type="button"
                              onClick={() =>
                                inviteCandidate(
                                  currentCard.id,
                                  cand.id,
                                  `Jemputan menyertai pasukan ${currentCard.title}.`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#EFE9FF] text-[#4C1D95] font-bold cursor-pointer"
                            >
                              + Jemput {cand.display_name}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveModal('create-project')}
                        className="flex-1 py-2.5 rounded-xl bg-[#5B18E5] text-white font-bold cursor-pointer"
                      >
                        + Cipta Aktiviti Baharu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetDemoDatabase();
                          setActiveModal(null);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset DB</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 19. CUSTOM APP ICON IMAGE UPLOAD & PRESET MODAL */}
              {activeModal === 'app-icon-settings' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#6315EA]" />
                      <h3 className="text-base font-extrabold text-slate-900">
                        Ikon Aplikasi ProjectLink
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Live Header Preview */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#EEE7FF] to-[#F6F2FF] border border-[#DDD0FF] p-3.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6315EA] mb-2">
                        Pralihat Header Aplikasi
                      </div>
                      <div className="flex items-center justify-between bg-white/80 rounded-xl px-3.5 py-2.5 border border-white shadow-xs">
                        <div className="flex items-center gap-2">
                          <ProjectLinkPLogo
                            src={appIconUrl}
                            className="w-8 h-8 rounded-lg shrink-0"
                          />
                          <div className="text-[17px] font-extrabold tracking-[-0.02em] font-display leading-none">
                            <span className="text-[#141132]">ProjectLink </span>
                            <span className="text-[#6315EA]">UMS</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-[#141132]">
                          <Bookmark className="w-4 h-4 stroke-[2.1]" />
                          <Bell className="w-4 h-4 stroke-[2.1]" />
                          <Search className="w-4 h-4 stroke-[2.1]" />
                        </div>
                      </div>
                    </div>

                    {/* Upload Custom Image Button */}
                    <div>
                      <input
                        ref={appIconFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const dataUrl = await compressImageFileToDataUrl(
                              file,
                              256,
                              256,
                              0.9
                            );
                            updateCustomAppIcon(dataUrl);
                            notifyToast(
                              'Ikon aplikasi berjaya dikemas kini!',
                              'success'
                            );
                          } catch {
                            notifyToast(
                              'Gagal memuat naik imej ikon.',
                              'error'
                            );
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => appIconFileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#6315EA] hover:bg-[#5210C7] text-white font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Muat Naik Imej Ikon Aplikasi Anda</span>
                      </button>
                      <p className="text-[10.5px] text-slate-500 mt-1.5 text-center">
                        Sokong PNG, JPG, WebP atau SVG (disimpan automatik atau
                        gantikan fail <code>/public/app-icon.png</code>).
                      </p>
                    </div>

                    {/* Built-in Image Presets */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 mb-1.5">
                        Atau Pilih Imej Ikon Sedia Ada:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateCustomAppIcon('/app-icon.png');
                            notifyToast(
                              'Ikon P Komuniti dipilih.',
                              'default'
                            );
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                            appIconUrl === '/app-icon.png'
                              ? 'border-[#6315EA] bg-[#F5F0FF]'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/app-icon.png"
                            alt="Ikon P"
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">
                              Ikon P Komuniti
                            </div>
                            <div className="text-[9.5px] text-slate-500">
                              /app-icon.png
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateCustomAppIcon('/app-icon-hex.png');
                            notifyToast(
                              'Ikon Hex Link dipilih.',
                              'default'
                            );
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                            appIconUrl === '/app-icon-hex.png'
                              ? 'border-[#6315EA] bg-[#F5F0FF]'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/app-icon-hex.png"
                            alt="Ikon Hex"
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">
                              Ikon Hex Link
                            </div>
                            <div className="text-[9.5px] text-slate-500">
                              /app-icon-hex.png
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Custom URL Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        URL Imej Ikon / Laluan Fail:
                      </label>
                      <input
                        type="text"
                        value={
                          appIconUrl.startsWith('data:')
                            ? ''
                            : appIconUrl
                        }
                        onChange={(e) => updateCustomAppIcon(e.target.value)}
                        placeholder="/app-icon.png atau https://..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6315EA]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
