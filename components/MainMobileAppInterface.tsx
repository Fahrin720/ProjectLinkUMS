'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {useProjectLink} from '@/lib/store';
import {
  evaluateStudentProjectMatch,
  projectMatchesOfficialFilter,
} from '@/lib/matching-engine';
import {
  getDefaultGalleryForProject,
  INTEREST_CATEGORIES,
  OFFICIAL_CARD_HIGHLIGHT_TAGS,
  OFFICIAL_FILTER_TAGS,
  SKILL_CATEGORIES,
  UMS_FACULTY_CODES,
  WEEKDAY_SHORT,
} from '@/lib/seed-data';
import EmailVerificationModal from '@/components/EmailVerificationModal';
import {
  Proficiency,
  Project,
  ProjectGalleryItem,
  ProjectStatus,
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
  RefreshCw,
  Building2,
  Calendar,
  CalendarPlus,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Code2,
  Database,
  Eye,
  EyeOff,
  Flag,
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
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Trash2,
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
    isAdmin,
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
    reports,
    activityHistory,
    notifications,
    toasts,
    dismissToast,
    switchPersona,
    resetDemoDatabase,
    refreshProjectsFeed,
    seedStarterActivities,
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
    updateProjectDetails,
    deleteOwnProject,
    updateProjectBanner,
    addProjectGalleryImage,
    removeProjectGalleryImage,
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
    submitReport,
    resolveReport,
    adminDeleteProject,
    adminUpdateProjectStatus,
    adminDeleteUser,
    authSessionToken,
    loginWithApi,
    registerWithApi,
    initiateSignUpWithApi,
    verifySignUpCodeWithApi,
    resendVerificationCodeWithApi,
    initiatePasswordResetWithApi,
    resetPasswordWithApi,
    logoutWithApi,
  } = useProjectLink();

  // =========================================================
  // 3-STAGE AUTHENTICATION FLOW STATE (Splash -> Welcome -> Sign In / Sign Up / Forgot Password -> Authenticated)
  // =========================================================
  const [authStage, setAuthStage] = useState<
    | 'splash'
    | 'welcome'
    | 'signin'
    | 'signup'
    | 'forgot-password'
    | 'authenticated'
  >('splash');
  const [isExpandedCanvas, setIsExpandedCanvas] = useState(false);

  // Form states for Stage 3: Sign In, Sign Up & Reset Password (/api/auth)
  const [loginEmail, setLoginEmail] = useState('fahrinmuneer3@gmail.com');
  const [loginPassword, setLoginPassword] = useState('ums2026');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regFacultyShort, setRegFacultyShort] = useState('FKI');
  const [regMatricNo, setRegMatricNo] = useState('');
  const [regPhone, setRegPhone] = useState('+60 12-883 4910');

  const [resetEmail, setResetEmail] = useState('fahrinmuneer3@gmail.com');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [simulatedResetOtpCode, setSimulatedResetOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Pending Email Verification Modal State (triggered immediately after Sign Up)
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [pendingVerifyName, setPendingVerifyName] = useState('');
  const [pendingVerifyFaculty, setPendingVerifyFaculty] = useState('FKI');
  const [simulatedVerificationCode, setSimulatedVerificationCode] =
    useState('');

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
      short: 'FSSK',
      full: 'Fakulti Sains Sosial dan Kemanusiaan (FSSK), UMS',
    },
    {
      short: 'FPP',
      full: 'Fakulti Psikologi dan Pendidikan (FPP), UMS',
    },
    {
      short: 'FSMP',
      full: 'Fakulti Sains Makanan dan Pemakanan (FSMP), UMS',
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

  // Automatic transition from Stage 1 (Splash) -> Authenticated (if active session exists) or Stage 2 (Welcome)
  useEffect(() => {
    if (authStage !== 'splash') return;
    try {
      const savedSession = window.sessionStorage.getItem(
        'projectlink_auth_session_v1'
      );
      if (savedSession === 'authenticated') {
        const immediateTimer = window.setTimeout(() => {
          setAuthStage('authenticated');
        }, 0);
        return () => window.clearTimeout(immediateTimer);
      }
    } catch {
      // Ignore sessionStorage read errors
    }
    const timer = window.setTimeout(() => {
      setAuthStage('welcome');
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [authStage]);

  const switchAuthStage = (
    nextStage:
      | 'splash'
      | 'welcome'
      | 'signin'
      | 'signup'
      | 'forgot-password'
      | 'authenticated'
  ) => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthStage(nextStage);
  };

  const completeAuthentication = () => {
    setAuthError(null);
    setAuthSuccess(null);
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

  const triggerSignOut = async () => {
    await logoutWithApi();
    setIsSidebarOpen(false);
    setActiveSidePage(null);
    setIsSearchPageOpen(false);
    setIsActivityPageOpen(false);
    setIsPostActivityPageOpen(false);
    setActiveModal(null);
    setAuthError(null);
    setAuthSuccess('Anda telah berjaya log keluar daripada sesi akaun.');
    setAuthStage('welcome');
    notifyToast(
      'Log Keluar Berjaya',
      'Sesi pelayan telah ditamatkan. Sila Sign In semula untuk masuk.',
      'default'
    );
  };

  const handleEmailSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!loginEmail.trim()) {
      setAuthError('Sila masukkan alamat E-mel UMS atau No. Matrik anda.');
      return;
    }
    if (!loginPassword) {
      setAuthError('Sila masukkan kata laluan akaun anda.');
      return;
    }

    setIsSubmittingAuth(true);
    const result = await loginWithApi(loginEmail.trim(), loginPassword);
    setIsSubmittingAuth(false);

    if (!result.ok) {
      setAuthError(
        result.error ||
          'Gagal log masuk. Sila semak semula e-mel dan kata laluan anda.'
      );
      return;
    }
    completeAuthentication();
  };

  const handleQuickDemoAccountLogin = async (
    demoEmail: string,
    demoPass = 'ums2026'
  ) => {
    setAuthError(null);
    setAuthSuccess(null);
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setIsSubmittingAuth(true);
    const result = await loginWithApi(demoEmail, demoPass);
    setIsSubmittingAuth(false);
    if (!result.ok) {
      setAuthError(
        result.error ||
          'Kata laluan akaun ini mungkin telah ditukar. Sila masukkan kata laluan baharu atau guna Forgot Password?.'
      );
      return;
    }
    completeAuthentication();
  };

  const handleEmailSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!regFullName.trim() || regFullName.trim().length < 2) {
      setAuthError('Sila masukkan Nama Penuh pelajar anda.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setAuthError(
        'Sila masukkan alamat E-mel UMS yang sah (contoh: nama@student.ums.edu.my).'
      );
      return;
    }
    if (regPassword.length < 6) {
      setAuthError(
        'Kata laluan mestilah sekurang-kurangnya 6 aksara untuk keselamatan akaun.'
      );
      return;
    }

    const selectedFac =
      UMS_FACULTY_OPTIONS.find((f) => f.short === regFacultyShort) ||
      UMS_FACULTY_OPTIONS[0];

    setIsSubmittingAuth(true);
    const result = await initiateSignUpWithApi({
      displayName: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      facultyShort: selectedFac.short,
      facultyFull: selectedFac.full,
      matricNo: regMatricNo.trim() || undefined,
      phone: regPhone.trim() || '+60 12-883 4910',
    });
    setIsSubmittingAuth(false);

    if (!result.ok) {
      setAuthError(
        result.error ||
          'Pendaftaran tidak berjaya. Sila semak maklumat yang diisi.'
      );
      return;
    }

    setPendingVerifyEmail(result.email || regEmail.trim().toLowerCase());
    setPendingVerifyName(regFullName.trim());
    setPendingVerifyFaculty(selectedFac.short);
    setSimulatedVerificationCode(result.verificationCode || '');
    setIsVerifyEmailModalOpen(true);
  };

  const handleRequestResetOtp = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    if (!resetEmail.trim()) {
      setAuthError('Sila masukkan alamat E-mel UMS atau No. Matrik akaun anda.');
      return;
    }
    setIsSubmittingAuth(true);
    const res = await initiatePasswordResetWithApi(resetEmail.trim());
    setIsSubmittingAuth(false);
    if (!res.ok) {
      setAuthError(res.error || 'Gagal menjana kod OTP reset kata laluan.');
      return;
    }
    if (res.resetCode) {
      setSimulatedResetOtpCode(res.resetCode);
      setResetOtpCode(res.resetCode);
    }
    setAuthSuccess(
      `Kod OTP 6-digit telah dijana (${res.resetCode}). Sila semak kod dan tetapkan kata laluan baharu.`
    );
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!resetEmail.trim()) {
      setAuthError('Sila masukkan alamat E-mel UMS atau No. Matrik akaun anda.');
      return;
    }
    if (!resetOtpCode.trim() || resetOtpCode.trim().length !== 6) {
      setAuthError(
        'Sila mohon dan masukkan kod OTP 6-digit terlebih dahulu sebelum menukar kata laluan.'
      );
      return;
    }
    if (resetNewPassword.length < 6) {
      setAuthError('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsSubmittingAuth(true);
    const result = await resetPasswordWithApi(
      resetEmail.trim(),
      resetNewPassword,
      resetOtpCode.trim()
    );
    setIsSubmittingAuth(false);

    if (!result.ok) {
      setAuthError(result.error || 'Gagal menetapkan semula kata laluan.');
      return;
    }

    setLoginEmail(resetEmail.trim());
    setLoginPassword(resetNewPassword);
    setResetNewPassword('');
    setResetOtpCode('');
    setSimulatedResetOtpCode('');
    setAuthStage('signin');
    setAuthSuccess(
      result.message ||
        'Kata laluan berjaya dikemas kini! Sila tekan Sign In di bawah.'
    );
  };

  // Strictly 2 main pages: 'home' | 'activity', plus dedicated full-screen Search, Activity Detail, Post Activity & Side Menu pages
  const [activeTab, setActiveTab] = useState<'home' | 'activity'>('home');
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
  const [isActivityPageOpen, setIsActivityPageOpen] = useState(false);
  const [isPostActivityPageOpen, setIsPostActivityPageOpen] = useState(false);
  const [activeSidePage, setActiveSidePage] = useState<
    | null
    | 'profile'
    | 'my-activities'
    | 'saved-activities'
    | 'history'
    | 'calendar'
    | 'notifications'
    | 'settings'
    | 'admin-panel'
  >(null);

  // Dedicated Admin Panel State (Accessible only when role === 'admin')
  const [adminTab, setAdminTab] = useState<'activities' | 'users' | 'reports'>(
    'activities'
  );
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminReportNotes, setAdminReportNotes] = useState<
    Record<string, string>
  >({});
  const [newReportReason, setNewReportReason] = useState('');
  const [newReportTargetId, setNewReportTargetId] = useState('prj-techfest');

  // Enhanced Search, Filter, Category & Bookmarks State
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [searchSkillFilters, setSearchSkillFilters] = useState<string[]>([]);
  const [searchInterestFilters, setSearchInterestFilters] = useState<string[]>(
    []
  );
  const [searchFacultyFilter, setSearchFacultyFilter] = useState<string>('All');
  const [searchSortBy, setSearchSortBy] = useState<
    'match' | 'newest' | 'hours' | 'slots'
  >('match');
  const [homeStrictFilterMode, setHomeStrictFilterMode] =
    useState<boolean>(false);
  const [homeFilterQuery, setHomeFilterQuery] = useState<string>('');
  const [skillPickerCategory, setSkillPickerCategory] =
    useState<string>('Semua');
  const [skillPickerQuery, setSkillPickerQuery] = useState<string>('');
  const [interestPickerCategory, setInterestPickerCategory] =
    useState<string>('Semua');
  const [interestPickerQuery, setInterestPickerQuery] = useState<string>('');
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');
  const [savedCategoryFilter, setSavedCategoryFilter] = useState<string>('All');
  const [savedSortBy, setSavedSortBy] = useState<'match' | 'newest' | 'hours'>(
    'match'
  );
  const [bookmarkNotes, setBookmarkNotes] = useState<Record<string, string>>(
    {}
  );

  // Form & Filter state for Student Participation History & SDP page
  const [newHistTitle, setNewHistTitle] = useState('');
  const [newHistDate, setNewHistDate] = useState('Nov 2026');
  const [newHistRole, setNewHistRole] = useState('Peserta / Ahli Pasukan');
  const [newHistSdp, setNewHistSdp] = useState(30);
  const [newHistSummary, setNewHistSummary] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyRoleFilter, setHistoryRoleFilter] = useState<
    'all' | 'leadership' | 'participant' | 'high-sdp'
  >('all');
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);

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
  const [appIconUrl, setAppIconUrl] = useState<string>('/app-icon.png');
  useEffect(() => {
    try {
      const savedIcon = window.localStorage.getItem(
        'projectlink_custom_app_icon_v1'
      );
      if (savedIcon && savedIcon !== '/app-icon.png') {
        const timer = window.setTimeout(() => {
          setAppIconUrl(savedIcon);
        }, 0);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);
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
  const [dismissedCardIds, setDismissedCardIds] = useState<string[]>([]);
  const [lastDismissedCardId, setLastDismissedCardId] = useState<string | null>(
    null
  );
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
    | 'edit-project-info'
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
  const [newTag1, setNewTag1] = useState('AI & Tech');
  const [newTag2, setNewTag2] = useState('Networking');
  const [newTag3, setNewTag3] = useState('Competition');
  const [newBannerMode, setNewBannerMode] = useState<'upload' | 'preset'>(
    'upload'
  );
  const [newBannerUrl, setNewBannerUrl] = useState<string>('');
  const [newBannerPreset, setNewBannerPreset] =
    useState<string>('prj-techfest');
  const [newBannerPosY, setNewBannerPosY] = useState<number>(50);

  // Multi-image Poster & Catalog state for Post Activity Page & Activity Detail Page Lightbox
  const [newDraftGalleryImages, setNewDraftGalleryImages] = useState<
    ProjectGalleryItem[]
  >([]);

  // Collapsible section states for Post Activity (03. Syarat Kemahiran is optional & collapsed by default)
  const [openPostSections, setOpenPostSections] = useState<{
    s1: boolean;
    s2: boolean;
    s3: boolean;
    s4: boolean;
    s5: boolean;
  }>({
    s1: true,
    s2: true,
    s3: false,
    s4: true,
    s5: true,
  });

  const togglePostSection = (key: 's1' | 's2' | 's3' | 's4' | 's5') => {
    setOpenPostSections((prev) => ({...prev, [key]: !prev[key]}));
  };

  const [isAddingGalleryOnDetail, setIsAddingGalleryOnDetail] =
    useState<boolean>(false);
  const [detailGalleryUrl, setDetailGalleryUrl] = useState<string>('');
  const [activityDetailTab, setActivityDetailTab] = useState<
    'semua' | 'butiran' | 'padanan' | 'pasukan'
  >('semua');

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const lightboxTouchStartXRef = useRef<number | null>(null);

  const [newAttributeTags, setNewAttributeTags] = useState<string[]>([]);
  const [newRequiredSkills, setNewRequiredSkills] = useState<
    Array<{skill_id: string; mandatory: boolean; importance: number}>
  >([]);
  const [postSkillMandatory] = useState<boolean>(false);
  const [postSkillImportance] = useState<number>(3);
  const [newProjectInterests, setNewProjectInterests] = useState<string[]>([]);
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

  const applyPostActivityTemplate = (
    presetKey: 'techfest' | 'shuttle' | 'reef'
  ) => {
    const orgName = currentUser
      ? `${currentUser.display_name} (${currentUser.faculty_short || 'FKI'} UMS)`
      : 'Fahrin Muneer (FKI UMS)';
    const orgPhone = currentUser?.phone || '+60 12-883 4910';

    if (presetKey === 'techfest') {
      setNewTitle('Borneo AI & Smart Campus Hackathon 2026');
      setNewType('Competition');
      setNewBadgeLine1('Hackathon');
      setNewBadgeLine2('FKI · FKJ');
      setNewDateText('22 – 24 Nov 2026');
      setNewDeadline('2026-11-24');
      setNewLocationText('Dewan Kuliah Pusat 2 (DKP 2), UMS');
      setNewAudience('Terbuka kepada semua pelajar FKI, FKJ & UMS');
      setNewSlotsNeeded(4);
      setNewMinWeeklyHours(6);
      setNewOrganizerName(orgName);
      setNewOrganizerPhone(orgPhone);
      setNewDesc(
        'Pertandingan inovasi AI & kelestarian kampus peringkat UMS Kota Kinabalu. Membina prototaip aplikasi pintar bersama mentor industri.'
      );
      setNewTag1('AI & Tech');
      setNewTag2('Smart Campus');
      setNewTag3('Competition');
      setNewBannerMode('preset');
      setNewBannerPreset('prj-techfest');
      setNewAttributeTags([
        'Programming',
        'AI & Data',
        'UI/UX Design',
        'Rentas Fakulti',
      ]);
      setNewRequiredSkills([
        {skill_id: 'sk-web-mobile', mandatory: false, importance: 5},
        {skill_id: 'sk-python-ai', mandatory: false, importance: 4},
        {skill_id: 'sk-uiux-figma', mandatory: false, importance: 4},
      ]);
      setNewProjectInterests(['in-ai-ml', 'in-hackathon', 'in-smart-iot']);
    } else if (presetKey === 'shuttle') {
      setNewTitle('UMS Smart Shuttle Live Tracker (IoT + Mobile)');
      setNewType('Innovation');
      setNewBadgeLine1('Inovasi');
      setNewBadgeLine2('FKJ · FKI');
      setNewDateText('1 – 5 Dis 2026');
      setNewDeadline('2026-12-05');
      setNewLocationText('Makmal IoT FKJ & Perhentian Bas Tun Mustapha, UMS');
      setNewAudience('Pelajar Kejuruteraan (FKJ) & Komputeran (FKI)');
      setNewSlotsNeeded(4);
      setNewMinWeeklyHours(5);
      setNewOrganizerName(orgName);
      setNewOrganizerPhone(orgPhone);
      setNewDesc(
        'Projek inovasi penjejakan bas kampus UMS secara masa nyata menggunakan GPS ESP32 dan paparan peta interaktif untuk pelajar kolej kediaman.'
      );
      setNewTag1('IoT & Robotics');
      setNewTag2('Smart Campus');
      setNewTag3('Innovation');
      setNewBannerMode('preset');
      setNewBannerPreset('prj-shuttle');
      setNewAttributeTags([
        'Engineering & IoT',
        'Programming',
        'Database',
        'Fleksibel / Hibrid',
      ]);
      setNewRequiredSkills([
        {skill_id: 'sk-iot-embedded', mandatory: false, importance: 5},
        {skill_id: 'sk-web-mobile', mandatory: false, importance: 4},
      ]);
      setNewProjectInterests([
        'in-smart-iot',
        'in-renewable-energy',
        'in-climate-sdg',
      ]);
    } else {
      setNewTitle('Sepanggar Bay Coral & Marine GIS Expedition');
      setNewType('Community');
      setNewBadgeLine1('Lapangan');
      setNewBadgeLine2('FSSA · FPL');
      setNewDateText('12 – 14 Dis 2026');
      setNewDeadline('2026-12-14');
      setNewLocationText('Jeti IPMB & Akuarium UMS, Kota Kinabalu');
      setNewAudience('Terbuka kepada semua fakulti UMS');
      setNewSlotsNeeded(6);
      setNewMinWeeklyHours(4);
      setNewOrganizerName(orgName);
      setNewOrganizerPhone(orgPhone);
      setNewDesc(
        'Kolaborasi lapangan antara FSSA, FPL dan IPMB untuk memantau kesihatan terumbu karang Teluk Sepanggar menggunakan pemetaan GIS dan analisis kualiti air.'
      );
      setNewTag1('Marine & Eco');
      setNewTag2('Fieldwork');
      setNewTag3('SDP Tinggi');
      setNewBannerMode('preset');
      setNewBannerPreset('prj-reef');
      setNewAttributeTags([
        'Sains & Marin',
        'Kerja Lapangan',
        'Penyelidikan',
        'Beginner Friendly',
      ]);
      setNewRequiredSkills([
        {skill_id: 'sk-marine-survey', mandatory: false, importance: 5},
        {skill_id: 'sk-gis-mapping', mandatory: false, importance: 4},
      ]);
      setNewProjectInterests([
        'in-marine-reef',
        'in-climate-sdg',
        'in-biotech-lab',
      ]);
    }

    notifyToast(
      'Templat Aktiviti Diisi',
      'Semua ruangan borang telah diisi mengikut senarai rasmi UMS.',
      'success'
    );
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

  // Author-Only (or Admin) Edit Activity Banner Modal State
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
    if (!currentUser || (target.owner_id !== currentUser.id && !isAdmin)) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) aktiviti ini dibenarkan menukar gambar poster.',
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

  // Author-Only (or Admin) Edit Activity Info Modal State
  const [editingInfoProjectId, setEditingInfoProjectId] = useState<string>('');
  const [editInfoTitle, setEditInfoTitle] = useState<string>('');
  const [editInfoType, setEditInfoType] = useState<ProjectType>('Competition');
  const [editInfoStatus, setEditInfoStatus] = useState<ProjectStatus>('open');
  const [editInfoDateText, setEditInfoDateText] = useState<string>('');
  const [editInfoLocation, setEditInfoLocation] = useState<string>('');
  const [editInfoAudience, setEditInfoAudience] = useState<string>('');
  const [editInfoSlots, setEditInfoSlots] = useState<number>(4);
  const [editInfoHours, setEditInfoHours] = useState<number>(6);
  const [editInfoOrgName, setEditInfoOrgName] = useState<string>('');
  const [editInfoOrgPhone, setEditInfoOrgPhone] = useState<string>('');
  const [editInfoDesc, setEditInfoDesc] = useState<string>('');

  const openEditProjectInfoModal = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    if (!currentUser || (target.owner_id !== currentUser.id && !isAdmin)) {
      notifyToast(
        'Akses Ditolak (Bukan Pencipta)',
        'Hanya pencipta asal (Author) aktiviti ini dibenarkan menyunting maklumat.',
        'error'
      );
      return;
    }
    setEditingInfoProjectId(target.id);
    setEditInfoTitle(target.title);
    setEditInfoType(target.project_type);
    setEditInfoStatus(target.status);
    setEditInfoDateText(
      target.date_display || target.deadline || '12 – 14 Nov 2026'
    );
    setEditInfoLocation(target.location || 'Dewan Canselor, UMS');
    setEditInfoAudience(
      target.audience || 'Terbuka kepada semua pelajar UMS'
    );
    setEditInfoSlots(target.slots_needed || 4);
    setEditInfoHours(target.min_weekly_hours || 6);
    setEditInfoOrgName(target.organizer_name || '');
    setEditInfoOrgPhone(target.organizer_phone || '+6012-883 4910');
    setEditInfoDesc(target.description || '');
    setActiveModal('edit-project-info');
  };

  // Add Skill / Interest / Availability / Task / Message Form States (Predetermined Taxonomy Only)
  const [newSkillProf, setNewSkillProf] = useState<Proficiency>('intermediate');
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

  // Normalized Relational Queries for Current Student (Fahrin Muneer)
  const selectedTags = useMemo(
    () => currentUser?.active_filter_tags || [],
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
    return myHistoryRecords.reduce((acc, item) => acc + item.sdp_earned, 0);
  }, [myHistoryRecords]);

  const filteredHistoryRecords = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    return myHistoryRecords.filter((rec) => {
      if (q) {
        const hay =
          `${rec.title} ${rec.role} ${rec.date_display} ${rec.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (historyRoleFilter === 'leadership') {
        const r = rec.role.toLowerCase();
        return (
          r.includes('pengarah') ||
          r.includes('ketua') ||
          r.includes('ajk') ||
          r.includes('penganjur') ||
          r.includes('lead') ||
          r.includes('exco')
        );
      }
      if (historyRoleFilter === 'participant') {
        const r = rec.role.toLowerCase();
        return (
          r.includes('peserta') ||
          r.includes('ahli') ||
          r.includes('pembentang') ||
          r.includes('finalis') ||
          r.includes('sukarelawan')
        );
      }
      if (historyRoleFilter === 'high-sdp') {
        return rec.sdp_earned >= 40;
      }
      return true;
    });
  }, [myHistoryRecords, historySearchQuery, historyRoleFilter]);

  // Normalized Projects Catalog for the Home Deck
  const cardsCatalog = useMemo(() => {
    return projects.map((p) => {
      const ownerProfile = profiles.find((pr) => pr.id === p.owner_id);
      const isProjectOwner = Boolean(
        currentUser && p.owner_id === currentUser.id
      );
      return {
        id: p.id,
        ownerId: p.owner_id,
        isOwner: isProjectOwner,
        canManage: Boolean(isProjectOwner || isAdmin),
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
  }, [projects, profiles, currentUser, isAdmin]);

  // All projects ranked by match score & official filter synergy for Home Deck, Matches modal & Search page
  const rankedProjectsList = useMemo(() => {
    if (!currentUser) return [];
    return projects
      .map((proj, idx) => ({
        project: proj,
        cardIdx: idx,
        matchedFilterCount: selectedTags.filter((tag) =>
          projectMatchesOfficialFilter({
            filterLabel: tag,
            project: proj,
            reqSkills: projectRequiredSkills,
            projInterests: projectInterests,
            skillsCatalog: skills,
            interestsCatalog: interests,
          })
        ).length,
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
      .sort((a, b) => {
        if (selectedTags.length > 0 && b.matchedFilterCount !== a.matchedFilterCount) {
          return b.matchedFilterCount - a.matchedFilterCount;
        }
        return b.evalResult.totalScore - a.evalResult.totalScore;
      });
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

  // Active deck prioritizes projects matching selected Home filters + highest match score, and optionally filters strictly
  const activeDeckCards = useMemo(() => {
    const rankMap = new Map(
      rankedProjectsList.map((item, rankIdx) => [
        item.project.id,
        {rankIdx, matchedFilterCount: item.matchedFilterCount},
      ])
    );

    return cardsCatalog
      .filter((c) => !dismissedCardIds.includes(c.id))
      .filter((c) => {
        if (!homeStrictFilterMode || selectedTags.length === 0) return true;
        const info = rankMap.get(c.id);
        return (info?.matchedFilterCount || 0) > 0;
      })
      .sort((a, b) => {
        const ra = rankMap.get(a.id)?.rankIdx ?? 999;
        const rb = rankMap.get(b.id)?.rankIdx ?? 999;
        return ra - rb;
      });
  }, [
    cardsCatalog,
    dismissedCardIds,
    rankedProjectsList,
    homeStrictFilterMode,
    selectedTags,
  ]);

  const handleToggleHomeFilter = (tagLabel: string) => {
    toggleFilterTag(tagLabel);
    setCardIndex(0);
  };

  const currentCard =
    activeDeckCards.length > 0
      ? activeDeckCards[cardIndex % activeDeckCards.length]
      : cardsCatalog[0];
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

  // Poster & Catalog Gallery Images for modalCard (used on Dedicated Activity Detail Page & Fullscreen Lightbox)
  const modalGalleryImages = useMemo<ProjectGalleryItem[]>(() => {
    if (!modalCard) return [];
    const proj = modalCard.projectObj;
    if (Array.isArray(proj.gallery_images) && proj.gallery_images.length > 0) {
      return proj.gallery_images;
    }
    return getDefaultGalleryForProject(
      modalCard.id,
      modalCard.title,
      modalCard.locationText,
      modalCard.dateText
    );
  }, [modalCard]);

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

  // Enriched Search Catalog with live Match Score, Breakdown, Official Skills, Official Interests & Saved status
  const enrichedSearchCatalog = useMemo(() => {
    const skillMap = new Map(skills.map((s) => [s.id, s.name]));
    const interestMap = new Map(interests.map((i) => [i.id, i.name]));
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
      const projInterestIds = projectInterests
        .filter((pi) => pi.project_id === card.id)
        .map((pi) => pi.interest_id);
      const projInterestNames = projInterestIds.map(
        (iid) => interestMap.get(iid) || iid
      );
      const meetSlotsCount = projectMeetingSlots.filter(
        (ms) => ms.project_id === card.id
      ).length;
      return {
        ...card,
        orderIndex: idx,
        matchScore: score,
        isCardSaved,
        reqSkillNames,
        projInterestIds,
        projInterestNames,
        meetSlotsCount,
      };
    });
  }, [
    cardsCatalog,
    rankedProjectsList,
    currentUser,
    savedProjects,
    skills,
    interests,
    projectRequiredSkills,
    projectInterests,
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

  const toggleSearchInterestChip = (interestId: string) => {
    setSearchInterestFilters((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  // Filtered & Sorted Search Results based on query, category, all UMS faculties, official skill/filter tags, official interests, and sort order
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
          (item.projectObj.attribute_tags || []).some((at) =>
            at.toLowerCase().includes(q)
          ) ||
          item.reqSkillNames.some((sn) => sn.toLowerCase().includes(q)) ||
          item.projInterestNames.some((inName) =>
            inName.toLowerCase().includes(q)
          );
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
          item.organizerName.toLowerCase().includes(facLower) ||
          item.title.toLowerCase().includes(facLower) ||
          item.audienceText.toLowerCase().includes('semua fakulti');
        if (!matchesFaculty) return false;
      }

      if (searchSkillFilters.length > 0) {
        const matchesAllSelectedChips = searchSkillFilters.every((chip) =>
          projectMatchesOfficialFilter({
            filterLabel: chip,
            project: item.projectObj,
            reqSkills: projectRequiredSkills,
            projInterests: projectInterests,
            skillsCatalog: skills,
            interestsCatalog: interests,
          })
        );
        if (!matchesAllSelectedChips) return false;
      }

      if (searchInterestFilters.length > 0) {
        const matchesInterests = searchInterestFilters.some((targetIntrId) => {
          const targetObj = interests.find((i) => i.id === targetIntrId);
          const targetNameLower = targetObj?.name.toLowerCase() || '';
          return (
            item.projInterestIds.includes(targetIntrId) ||
            (targetNameLower &&
              item.projInterestNames.some(
                (nm) => nm.toLowerCase() === targetNameLower
              ))
          );
        });
        if (!matchesInterests) return false;
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
    searchInterestFilters,
    searchSortBy,
    projectRequiredSkills,
    projectInterests,
    skills,
    interests,
  ]);

  // Filtered Bookmarks / Saved Activities Catalog for the Activity page
  const filteredSavedCatalog = useMemo(() => {
    const q = savedSearchQuery.trim().toLowerCase();
    const filtered = enrichedSearchCatalog
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
      });

    return [...filtered].sort((a, b) => {
      if (savedSortBy === 'match') {
        return b.matchScore - a.matchScore;
      }
      if (savedSortBy === 'newest') {
        return (
          new Date(b.projectObj.created_at).getTime() -
          new Date(a.projectObj.created_at).getTime()
        );
      }
      if (savedSortBy === 'hours') {
        return (
          (a.projectObj.min_weekly_hours || 6) -
          (b.projectObj.min_weekly_hours || 6)
        );
      }
      return 0;
    });
  }, [
    enrichedSearchCatalog,
    savedSearchQuery,
    savedCategoryFilter,
    savedSortBy,
    bookmarkNotes,
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

  // Cycles to the next card without dismissing or bookmarking (used by pagination dots & shuffle)
  const advanceToNextCard = () => {
    if (flyOffDir || activeDeckCards.length === 0) return;
    setCardIndex((prev) => prev + 1);
  };

  const handleRandomize = () => {
    randomizeFilterTags();
    setCardIndex(0);
  };

  // Restores all dismissed cards back into the active Home deck
  const resetDismissedDeck = () => {
    setDismissedCardIds([]);
    setLastDismissedCardId(null);
    setCardIndex(0);
    setDragOffset({x: 0, y: 0});
    notifyToast(
      'Timbunan Kad Dimuat Semula',
      'Semua aktiviti kampus kini dipaparkan semula di halaman Home.',
      'success'
    );
  };

  // Restores the most recently dismissed card back to the front of the deck
  const undoLastDismissedCard = () => {
    if (!lastDismissedCardId) return;
    const restoredId = lastDismissedCardId;
    const nextDismissed = dismissedCardIds.filter((id) => id !== restoredId);
    const nextDeck = cardsCatalog.filter((c) => !nextDismissed.includes(c.id));
    const restoredIdx = nextDeck.findIndex((c) => c.id === restoredId);
    setDismissedCardIds(nextDismissed);
    setLastDismissedCardId(null);
    if (restoredIdx >= 0) {
      setCardIndex(restoredIdx);
    }
    notifyToast(
      'Kad Dikembalikan (Undo)',
      'Kad terakhir yang dibuang telah dikembalikan ke hadapan timbunan.',
      'success'
    );
  };

  // Swipe Right (SIMPAN & INFO) -> Front card flies off right, saves to Bookmarks & opens the Dedicated Activity Detail Page
  const triggerSwipeRight = () => {
    if (flyOffDir || activeDeckCards.length === 0 || !currentCard) return;
    const swipedCardId = currentCard.id;
    setInspectedCardId(swipedCardId);
    setIsDraggingCard(false);
    setFlyOffDir('right');
    saveProjectOnly(swipedCardId);
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
      setFlyOffDir(null);
      setDragOffset({x: 0, y: 0});
      setActiveModal(null);
      setIsActivityPageOpen(true);
    }, 230);
  };

  // Swipe Left (BUANG) -> Front card flies off left & is removed from the current active deck
  const triggerSwipeLeft = () => {
    if (flyOffDir || activeDeckCards.length === 0 || !currentCard) return;
    const dismissedId = currentCard.id;
    const dismissedTitle = currentCard.title;
    const currentModIdx = cardIndex % activeDeckCards.length;
    const nextLength = activeDeckCards.length - 1;
    setIsDraggingCard(false);
    setFlyOffDir('left');
    setTimeout(() => {
      setDismissedCardIds((prev) =>
        prev.includes(dismissedId) ? prev : [...prev, dismissedId]
      );
      setLastDismissedCardId(dismissedId);
      setCardIndex(nextLength > 0 ? currentModIdx % nextLength : 0);
      setFlyOffDir(null);
      setDragOffset({x: 0, y: 0});
      notifyToast(
        'Kad Dibuang dari Senarai Semasa',
        `"${dismissedTitle}" telah dikeluarkan. Anda boleh muat semula bila-bila masa.`,
        'default'
      );
    }, 230);
  };

  // Opens the Dedicated Full-Screen Activity Detail Page from any section in the app
  const openCardInfoModal = (cardId?: string) => {
    setInspectedCardId(cardId || currentCard?.id || null);
    setIsAddingGalleryOnDetail(false);
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
            ? `0 14px 34px rgba(244, 63, 94, ${(
                0.3 +
                dragProgress * 0.35
              ).toFixed(2)})`
            : dragOffset.x > 15
            ? `0 14px 34px rgba(168, 85, 247, ${(
                0.35 +
                dragProgress * 0.35
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

  const availabilityStatus = currentUser?.availability_status || 'Available';
  const openReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'open').length,
    [reports]
  );

  return (
    <div className="fixed inset-0 h-dvh w-screen overflow-hidden bg-gradient-to-br from-[#110329] via-[#1D0646] to-[#0B011C] flex items-center justify-center sm:gap-6 lg:gap-10 sm:p-4 lg:p-8 select-none">
      {/* =========================================================
          DESKTOP & TABLET COMPANION STUDIO PANEL (Visible on lg+ screens)
          Replaces the old screen blocker so laptop/desktop users get a
          first-class interactive command dock alongside the live mobile app.
         ========================================================= */}
      <aside className="hidden lg:flex flex-col justify-between w-[380px] xl:w-[410px] h-[min(92dvh,850px)] rounded-[36px] bg-white/[0.06] border border-white/15 backdrop-blur-2xl p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.55)] shrink-0">
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#F5F1FF] flex items-center justify-center shadow-lg shrink-0">
              <ProjectLinkPLogo src={appIconUrl} className="w-9 h-9" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display tracking-tight text-white">
                  ProjectLink UMS
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Live Studio
                </span>
              </div>
              <p className="text-xs text-purple-200/80 truncate">
                Ekosistem Kolaborasi &amp; Aktiviti Pelajar UMS
              </p>
            </div>
          </div>

          {/* Active User & Session Card */}
          <div className="rounded-2xl bg-white/[0.08] border border-white/15 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                  Sesi Akaun Semasa
                </div>
                <div className="text-sm font-extrabold text-white truncate">
                  {currentUser?.display_name || 'Fahrin Muneer'}
                </div>
                <div className="text-[11px] text-purple-200/80 truncate">
                  {currentUser?.email || 'fahrinmuneer3@gmail.com'} ·{' '}
                  {currentUser?.matric_no || 'A2412345'}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                  isAdmin
                    ? 'bg-amber-400/20 border border-amber-300/40 text-amber-200'
                    : 'bg-purple-500/25 border border-purple-300/30 text-purple-100'
                }`}
              >
                {isAdmin ? 'System Admin' : 'Pelajar UMS'}
              </span>
            </div>

            {/* Live Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="rounded-xl bg-black/25 py-2 px-1.5">
                <div className="text-base font-extrabold font-display text-white tabular-nums">
                  {projects.length}
                </div>
                <div className="text-[10px] text-purple-200/75 font-semibold">
                  Aktiviti UMS
                </div>
              </div>
              <div className="rounded-xl bg-black/25 py-2 px-1.5">
                <div className="text-base font-extrabold font-display text-emerald-300 tabular-nums">
                  {
                    studentSkills.filter(
                      (s) => s.student_id === currentUser?.id
                    ).length
                  }
                </div>
                <div className="text-[10px] text-purple-200/75 font-semibold">
                  Kemahiran
                </div>
              </div>
              <div className="rounded-xl bg-black/25 py-2 px-1.5">
                <div className="text-base font-extrabold font-display text-amber-300 tabular-nums">
                  {applications.length}
                </div>
                <div className="text-[10px] text-purple-200/75 font-semibold">
                  Permohonan
                </div>
              </div>
            </div>
          </div>

          {/* Quick Studio Shortcuts */}
          <div className="space-y-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-purple-300 px-1">
              Navigasi Pantas &amp; Tindakan Sistem
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (authStage !== 'authenticated') {
                    completeAuthentication();
                  }
                  setIsPostActivityPageOpen(false);
                  setIsActivityPageOpen(false);
                  setIsSearchPageOpen(false);
                  setActiveSidePage(null);
                  setActiveTab('home');
                }}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Home Deck</span>
                </div>
                <p className="text-[10.5px] text-purple-200/75 mt-0.5">
                  Kad swipe &amp; skor padanan
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (authStage !== 'authenticated') {
                    completeAuthentication();
                  }
                  openPostActivityPage();
                }}
                className="p-3 rounded-2xl bg-[#6215E5]/80 hover:bg-[#6215E5] border border-purple-300/40 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  <span>Post Aktiviti</span>
                </div>
                <p className="text-[10.5px] text-purple-100/85 mt-0.5">
                  Cipta siaran projek baharu
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (authStage !== 'authenticated') {
                    completeAuthentication();
                  }
                  setIsPostActivityPageOpen(false);
                  setIsActivityPageOpen(false);
                  setActiveSidePage(null);
                  setIsSearchPageOpen(true);
                }}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-sky-300" />
                  <span>Carian &amp; Filter</span>
                </div>
                <p className="text-[10.5px] text-purple-200/75 mt-0.5">
                  Teroka ikut fakulti &amp; tag
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (authStage !== 'authenticated') {
                    completeAuthentication();
                  }
                  setIsPostActivityPageOpen(false);
                  setIsActivityPageOpen(false);
                  setIsSearchPageOpen(false);
                  setActiveSidePage(isAdmin ? 'admin-panel' : null);
                  if (!isAdmin) setActiveTab('activity');
                }}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isAdmin ? 'Admin Panel' : 'Profil Saya'}</span>
                </div>
                <p className="text-[10.5px] text-purple-200/75 mt-0.5">
                  {isAdmin ? 'Urus aktiviti & pengguna' : 'Kemahiran & rekod SDP'}
                </p>
              </button>
            </div>
          </div>

          {/* Starter Catalog Helper Card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 via-indigo-500/15 to-emerald-500/15 border border-purple-300/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white">
                Pemuat Katalog Pantas UMS
              </span>
              <span className="text-[10px] font-bold text-emerald-300">
                1-Klik
              </span>
            </div>
            <p className="text-[11px] text-purple-100/85 leading-relaxed">
              Muatkan 3 aktiviti kampus UMS lengkap dengan kemahiran, minat, dan
              slot jadual mingguan untuk menguji enjin padanan 40/25/20/15.
            </p>
            <button
              type="button"
              onClick={() => {
                if (authStage !== 'authenticated') {
                  completeAuthentication();
                }
                seedStarterActivities();
                setCardIndex(0);
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-white text-[#23085A] hover:bg-purple-50 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#6215E5]" />
              <span>Muat 3 Aktiviti Contoh UMS</span>
            </button>
          </div>
        </div>

        {/* Footer Info & Responsive Viewport Size Switcher */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold text-purple-200/80">
              Saiz Paparan Skrin:
            </span>
            <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setIsExpandedCanvas(false)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  !isExpandedCanvas
                    ? 'bg-[#6215E5] text-white shadow-xs'
                    : 'text-purple-200/75 hover:text-white'
                }`}
              >
                Telefon (420px)
              </button>
              <button
                type="button"
                onClick={() => setIsExpandedCanvas(true)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  isExpandedCanvas
                    ? 'bg-[#6215E5] text-white shadow-xs'
                    : 'text-purple-200/75 hover:text-white'
                }`}
              >
                Kanvas Lebar
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-purple-200/70">
            <span>Universiti Malaysia Sabah (UMS)</span>
            <span className="font-mono text-purple-300">Spring 60fps UI</span>
          </div>
        </div>
      </aside>

      {/* Interactive App Screen Container (Full-bleed on mobile < 640px, responsive phone/tablet frame on >= 640px) */}
      <div
        className={`relative w-full h-dvh ${
          isExpandedCanvas
            ? 'sm:w-[min(94vw,640px)] lg:w-[580px] xl:w-[640px]'
            : 'sm:w-[min(94vw,430px)]'
        } sm:h-[min(94dvh,870px)] sm:rounded-[42px] sm:border-[6px] sm:border-white/15 sm:shadow-[0_28px_90px_rgba(0,0,0,0.75)] transition-[width,height,border-radius] duration-300 ease-out overflow-hidden flex flex-col justify-between bg-gradient-to-b from-[#F5F1FF] via-[#671AE6] via-[48%] to-[#220352] shrink-0`}
      >
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
        <AnimatePresence mode="wait">
          {authStage !== 'authenticated' && (
            <motion.div
              key="auth-flow-overlay"
              initial={{opacity: 0, scale: 0.985}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95, y: -20}}
              transition={{type: 'spring', stiffness: 360, damping: 32}}
              className="absolute inset-0 z-50 overflow-hidden flex flex-col select-none"
            >
              <AnimatePresence mode="wait" initial={false}>
                {/* -----------------------------------------------------
                    STAGE 1: SPLASH SCREEN (Matches Left Phone in Reference)
                   ----------------------------------------------------- */}
                {authStage === 'splash' && (
                  <motion.div
                    key="auth-stage-splash"
                    initial={{opacity: 0, scale: 0.96}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 1.03, y: -16}}
                    transition={{type: 'spring', stiffness: 380, damping: 32}}
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
                  </motion.div>
                )}

                {/* -----------------------------------------------------
                    STAGE 2: WELCOME SCREEN (Matches Middle Phone in Reference)
                   ----------------------------------------------------- */}
                {authStage === 'welcome' && (
                  <motion.div
                    key="auth-stage-welcome"
                    initial={{opacity: 0, y: 24, scale: 0.985}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, x: -32, scale: 0.98}}
                    transition={{type: 'spring', stiffness: 380, damping: 34}}
                    className="relative w-full h-full bg-[#FAF8FF] flex flex-col justify-between overflow-hidden"
                  >
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
                          onClick={() => switchAuthStage('signin')}
                          className="py-3.5 px-5 rounded-full bg-[#120E2E] hover:bg-[#1D1746] text-white font-extrabold text-[13.5px] shadow-[0_10px_24px_rgba(10,5,30,0.38)] active:scale-95 transition-all cursor-pointer"
                        >
                          Sign In
                        </button>

                        <button
                          type="button"
                          onClick={() => switchAuthStage('signup')}
                          className="py-3.5 px-5 rounded-full bg-white hover:bg-[#F5F1FF] text-[#141132] font-extrabold text-[13.5px] shadow-[0_10px_24px_rgba(18,14,46,0.18)] active:scale-95 transition-all cursor-pointer"
                        >
                          Sign Up
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* -----------------------------------------------------
                    STAGE 3: SIGN IN, SIGN UP & FORGOT PASSWORD SCREEN (/api/auth)
                   ----------------------------------------------------- */}
                {(authStage === 'signin' ||
                  authStage === 'signup' ||
                  authStage === 'forgot-password') && (
                  <motion.div
                    key={`auth-stage-${authStage}`}
                    initial={{opacity: 0, x: 36, scale: 0.985}}
                    animate={{opacity: 1, x: 0, scale: 1}}
                    exit={{opacity: 0, x: -28, scale: 0.985}}
                    transition={{type: 'spring', stiffness: 390, damping: 34}}
                    className="relative w-full h-full bg-gradient-to-br from-[#6E23F7] via-[#5B18E5] to-[#4311B5] flex flex-col overflow-hidden"
                  >
                {/* Top Purple Header Bar + Title + Subtitle */}
                <div className="px-6 pt-5 pb-8 text-white shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        switchAuthStage(
                          authStage === 'forgot-password' ? 'signin' : 'welcome'
                        )
                      }
                      aria-label="Back"
                      className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        switchAuthStage(
                          authStage === 'signin' ? 'signup' : 'signin'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-[12px] font-extrabold text-white transition-colors cursor-pointer"
                    >
                      {authStage === 'signin' ? 'Register' : 'Sign In'}
                    </button>
                  </div>

                  <h1 className="text-[28px] font-extrabold font-display tracking-tight text-white leading-tight">
                    {authStage === 'signin'
                      ? 'Sign In'
                      : authStage === 'signup'
                      ? 'Sign Up'
                      : 'Reset Password'}
                  </h1>

                  <p className="mt-1.5 text-[12px] text-purple-100/90 font-medium leading-relaxed max-w-[330px]">
                    {authStage === 'signin'
                      ? 'Log masuk menggunakan E-mel Pelajar UMS atau No. Matrik berserta kata laluan akaun anda.'
                      : authStage === 'signup'
                      ? 'Daftar akaun baharu dengan E-mel UMS, Kata Laluan, Nama Penuh, dan Fakulti anda.'
                      : 'Tetapkan semula kata laluan baharu untuk akaun E-mel UMS anda.'}
                  </p>
                </div>

                {/* Bottom Curved White Sheet */}
                <div className="flex-1 bg-[#FAF9FE] rounded-t-[38px] -mt-3 px-6 pt-6 pb-6 flex flex-col justify-between overflow-y-auto no-scrollbar shadow-[0_-14px_38px_rgba(18,6,52,0.28)]">
                  {/* Inline Backend Validation Alert Banner */}
                  {(authError || authSuccess) && (
                    <div
                      className={`mb-3.5 rounded-2xl px-4 py-3 text-[11.5px] font-bold leading-snug border ${
                        authError
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      {authError || authSuccess}
                    </div>
                  )}

                  {authStage === 'signin' ? (
                    <>
                      {/* SIGN IN FORM (Connected to POST /api/auth action: "signin") */}
                      <form
                        onSubmit={handleEmailSignInSubmit}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            E-mel Pelajar UMS atau No. Matrik
                          </label>
                          <input
                            type="text"
                            value={loginEmail}
                            onChange={(e) => {
                              setLoginEmail(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            placeholder="fahrin@student.ums.edu.my / A2412345"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3.5 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Kata Laluan (Password)
                          </label>
                          <div className="relative">
                            <input
                              type={showLoginPassword ? 'text' : 'password'}
                              value={loginPassword}
                              onChange={(e) => {
                                setLoginPassword(e.target.value);
                                if (authError) setAuthError(null);
                              }}
                              placeholder="Masukkan kata laluan"
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
                        </div>

                        <div className="flex items-center justify-between pt-0.5 px-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">
                            Kata laluan demo: <code>ums2026</code>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setResetEmail(
                                loginEmail.trim() || 'fahrin@student.ums.edu.my'
                              );
                              switchAuthStage('forgot-password');
                            }}
                            className="text-[11.5px] font-bold text-[#141132] hover:text-[#6315EA] transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingAuth}
                          className="mt-1 w-full py-3.5 rounded-full bg-[#120E2E] hover:bg-[#1E1848] disabled:opacity-60 text-white font-extrabold text-[14px] shadow-[0_10px_26px_rgba(18,14,46,0.28)] active:scale-[0.99] transition-all cursor-pointer"
                        >
                          {isSubmittingAuth
                            ? 'Sedang Mengesahkan...'
                            : 'Sign In'}
                        </button>
                      </form>

                      {/* Bottom Verified UMS Student Accounts & Sign Up Card */}
                      <div className="pt-4 mt-4 border-t border-slate-200/70 space-y-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                          Akaun Sedia Ada (Klik untuk Log Masuk Terus)
                        </div>

                        {[
                          {
                            name: 'Fahrin Muneer (Admin Sistem)',
                            email: 'fahrinmuneer3@gmail.com',
                          },
                        ].map((acc) => (
                          <button
                            key={acc.email}
                            type="button"
                            disabled={isSubmittingAuth}
                            onClick={() =>
                              handleQuickDemoAccountLogin(acc.email, 'ums2026')
                            }
                            className="w-full rounded-full bg-white hover:bg-[#F5F1FF] border border-slate-200/80 shadow-[0_4px_14px_rgba(20,17,50,0.05)] px-4 py-2.5 flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-[#EFE9FF] text-[#6315EA] flex items-center justify-center shrink-0">
                                <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
                              </div>
                              <div className="text-left min-w-0">
                                <div className="text-[12px] font-extrabold text-[#141132] truncate">
                                  {acc.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {acc.email} · Kata laluan: ums2026
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#141132] group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => switchAuthStage('signup')}
                          className="w-full rounded-full bg-[#F5F0FF] hover:bg-[#EBE0FF] border border-purple-200 px-4 py-2.5 flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#6315EA] text-white flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className="text-[12px] font-extrabold text-[#4C1D95] truncate">
                                Tiada akaun? Daftar Akaun Baharu (Sign Up)
                              </div>
                              <div className="text-[10px] text-[#6315EA]/80 truncate">
                                Daftar dengan E-mel UMS, Nama Penuh &amp; Fakulti
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#6315EA] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      </div>
                    </>
                  ) : authStage === 'signup' ? (
                    <>
                      {/* SIGN UP / REGISTER BY EMAIL + EXTRA DETAILS FORM (Connected to POST /api/auth action: "signup") */}
                      <form
                        onSubmit={handleEmailSignUpSubmit}
                        className="space-y-2.5"
                      >
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Nama Penuh Pelajar *
                          </label>
                          <input
                            type="text"
                            value={regFullName}
                            onChange={(e) => {
                              setRegFullName(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            placeholder="Contoh: Ahmad Zaki bin Ali"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            E-mel Pelajar UMS *
                          </label>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => {
                              setRegEmail(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            placeholder="nama@student.ums.edu.my"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Kata Laluan * (Min. 6 Aksara)
                          </label>
                          <div className="relative">
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => {
                                setRegPassword(e.target.value);
                                if (authError) setAuthError(null);
                              }}
                              placeholder="Sekurang-kurangnya 6 aksara"
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
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Fakulti UMS (FKI / FKJ / dll) *
                          </label>
                          <select
                            value={regFacultyShort}
                            onChange={(e) => setRegFacultyShort(e.target.value)}
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[12px] font-bold text-[#141132] focus:outline-none transition-all cursor-pointer"
                          >
                            {UMS_FACULTY_OPTIONS.map((fac) => (
                              <option key={fac.short} value={fac.short}>
                                {fac.short} — {fac.full}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                              No. Matrik (Pilihan)
                            </label>
                            <input
                              type="text"
                              value={regMatricNo}
                              onChange={(e) => setRegMatricNo(e.target.value)}
                              placeholder="BI24110123"
                              className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-4 py-2.5 text-[12px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                              No. WhatsApp
                            </label>
                            <input
                              type="text"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="+60 12-883 4910"
                              className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-4 py-2.5 text-[12px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            type="submit"
                            disabled={isSubmittingAuth}
                            className="w-full py-3.5 rounded-full bg-[#120E2E] hover:bg-[#1E1848] disabled:opacity-60 text-white font-extrabold text-[14px] shadow-[0_10px_26px_rgba(18,14,46,0.28)] active:scale-[0.99] transition-all cursor-pointer"
                          >
                            {isSubmittingAuth
                              ? 'Menghantar Kod Pengesahan...'
                              : 'Sign Up & Sahkan E-mel'}
                          </button>
                        </div>
                      </form>

                      {/* Bottom Switch to Sign In Card */}
                      <div className="pt-3 mt-3 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => switchAuthStage('signin')}
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
                  ) : (
                    <>
                      {/* FORGOT PASSWORD / RESET PASSWORD FORM (Connected to POST /api/auth action: "initiate_password_reset" + "reset_password") */}
                      <form
                        onSubmit={handleResetPasswordSubmit}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            E-mel Pelajar UMS atau No. Matrik
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={resetEmail}
                              onChange={(e) => {
                                setResetEmail(e.target.value);
                                if (authError) setAuthError(null);
                              }}
                              placeholder="fahrinmuneer3@gmail.com"
                              className="flex-1 rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                            <button
                              type="button"
                              disabled={isSubmittingAuth}
                              onClick={handleRequestResetOtp}
                              className="px-3.5 py-3 rounded-full bg-[#EFE9FF] hover:bg-[#E2D6FF] text-[#6315EA] text-[11px] font-extrabold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                            >
                              Mohon OTP
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1 px-3">
                            <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                              Kod OTP 6-Digit *
                            </label>
                            {simulatedResetOtpCode && (
                              <span className="text-[10px] font-bold text-[#6315EA] tabular-nums">
                                Kod Semasa: {simulatedResetOtpCode}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            value={resetOtpCode}
                            onChange={(e) => {
                              setResetOtpCode(
                                e.target.value.replace(/[^0-9]/g, '')
                              );
                              if (authError) setAuthError(null);
                            }}
                            placeholder="Masukkan 6-digit kod OTP"
                            className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white px-5 py-3 text-[13px] font-bold tracking-widest text-[#141132] placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-medium focus:outline-none transition-all tabular-nums"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 pl-3">
                            Kata Laluan Baharu (Min. 6 Aksara)
                          </label>
                          <div className="relative">
                            <input
                              type={showResetPassword ? 'text' : 'password'}
                              value={resetNewPassword}
                              onChange={(e) => {
                                setResetNewPassword(e.target.value);
                                if (authError) setAuthError(null);
                              }}
                              placeholder="Masukkan kata laluan baharu"
                              className="w-full rounded-full bg-[#EFEcf6] border border-transparent focus:border-[#6315EA]/40 focus:bg-white pl-5 pr-12 py-3 text-[13px] font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowResetPassword((prev) => !prev)
                              }
                              aria-label="Toggle reset password visibility"
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#6315EA] cursor-pointer"
                            >
                              {showResetPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingAuth}
                          className="w-full py-3.5 rounded-full bg-[#120E2E] hover:bg-[#1E1848] disabled:opacity-60 text-white font-extrabold text-[14px] shadow-[0_10px_26px_rgba(18,14,46,0.28)] active:scale-[0.99] transition-all cursor-pointer"
                        >
                          {isSubmittingAuth
                            ? 'Mengemas Kini Kata Laluan...'
                            : 'Sahkan OTP & Simpan Kata Laluan'}
                        </button>
                      </form>

                      <div className="pt-4 mt-4 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => switchAuthStage('signin')}
                          className="w-full rounded-full bg-white hover:bg-[#F5F1FF] border border-slate-200/80 px-4 py-3 flex items-center justify-between transition-all cursor-pointer"
                        >
                          <span className="text-[12px] font-extrabold text-[#141132]">
                            ← Kembali ke Skrin Sign In
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#141132]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reusable EmailVerificationModal (Appears immediately after Sign Up submission) */}
              <EmailVerificationModal
                key={`${pendingVerifyEmail}-${simulatedVerificationCode}`}
                isOpen={isVerifyEmailModalOpen}
                email={pendingVerifyEmail}
                displayName={pendingVerifyName}
                facultyShort={pendingVerifyFaculty}
                simulatedCode={simulatedVerificationCode}
                onClose={() => setIsVerifyEmailModalOpen(false)}
                onVerifyCode={(code) =>
                  verifySignUpCodeWithApi(pendingVerifyEmail, code)
                }
                onResendCode={async () => {
                  const res =
                    await resendVerificationCodeWithApi(pendingVerifyEmail);
                  if (res.verificationCode) {
                    setSimulatedVerificationCode(res.verificationCode);
                  }
                  return res;
                }}
                onVerifiedSuccess={() => {
                  setIsVerifyEmailModalOpen(false);
                  completeAuthentication();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
            1. TOP BRAND HEADER (Shared by Home & Activity — Hidden on Search, Activity Detail, Post Activity & Side Pages)
            Clicking the top-left App Icon opens the Side Menu Drawer!
           ========================================================= */}
        <AnimatePresence initial={false}>
          {!isSearchPageOpen &&
            !isActivityPageOpen &&
            !isPostActivityPageOpen &&
            !activeSidePage && (
              <motion.header
                key="shared-top-brand-header"
                initial={{opacity: 0, y: -16}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -16}}
                transition={{type: 'spring', stiffness: 400, damping: 34}}
                className="relative z-20 px-4 pt-3.5 pb-2 flex items-center justify-between gap-3"
              >
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
                      setActiveTab('activity');
                      setActiveSidePage(null);
                    }}
                    aria-label="Open Saved Bookmarks"
                    className={`relative p-1.5 rounded-xl hover:bg-white/50 active:scale-95 transition-all cursor-pointer ${
                      activeTab === 'activity'
                        ? 'bg-white/80 text-[#5B18E5] shadow-xs'
                        : ''
                    }`}
                  >
                    <Bookmark
                      className={`w-[19px] h-[19px] stroke-[2.1] ${
                        activeTab === 'activity' ? 'fill-current' : ''
                      }`}
                    />
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
              </motion.header>
            )}
        </AnimatePresence>

        {/* =========================================================
            2. MAIN CONTENT AREA (Animated with Spring Physics via AnimatePresence)
           ========================================================= */}
        <AnimatePresence mode="wait" initial={false}>
          {isActivityPageOpen && modalCard ? (
            /* ---------------------------------------------------------
               DEDICATED FULL-SCREEN ACTIVITY DETAIL PAGE
               (CONTINUOUS EDITORIAL EVENT SHEET — NO ROUNDED SQUARE BOX STACK)
               --------------------------------------------------------- */
            <motion.div
              key={`page-activity-detail-${modalCard.id}`}
              initial={{opacity: 0, x: 42, scale: 0.985}}
              animate={{opacity: 1, x: 0, scale: 1}}
              exit={{opacity: 0, x: 32, scale: 0.985}}
              transition={{type: 'spring', stiffness: 390, damping: 34}}
              className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden bg-[#FAF9FF]"
            >
              {/* Scrollable Continuous Editorial Sheet */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-28 overscroll-y-contain bg-[#FAF9FF]">
                {/* IMMERSIVE TALL HERO HEADER */}
                <div className="relative h-[252px] w-full overflow-hidden bg-[#18043C] shrink-0">
                  <ActivityCardBanner
                    cardId={modalCard.id}
                    bannerUrl={modalCard.bannerUrl}
                    bannerPreset={modalCard.bannerPreset}
                    bannerPositionY={modalCard.bannerPositionY}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0224] via-[#12042E]/45 to-black/25" />

                  {/* Top Floating Glassmorphic Bar */}
                  <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsActivityPageOpen(false)}
                      aria-label="Kembali ke halaman sebelumnya"
                      className="h-10 px-3.5 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white border border-white/25 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5] text-white" />
                      <span className="text-xs font-extrabold tracking-tight">
                        Kembali
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {modalCard.canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              openEditProjectInfoModal(modalCard.id)
                            }
                            aria-label="Sunting Maklumat Aktiviti"
                            className="h-10 px-3 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white border border-white/25 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-300 stroke-[2.2]" />
                            <span className="text-[11px] font-extrabold">
                              Sunting
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openEditActivityBannerModal(modalCard.id)
                            }
                            aria-label="Tukar Gambar Poster Aktiviti"
                            className="h-10 px-3 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white border border-white/25 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300 stroke-[2.2]" />
                            <span className="text-[11px] font-extrabold">
                              Poster
                            </span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleSaveProject(modalCard.id)}
                        aria-label="Simpan aktiviti ini"
                        className={`h-10 px-3.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                          isModalCardSaved
                            ? 'bg-[#6215E5] border-purple-300/80 text-white'
                            : 'bg-black/45 hover:bg-black/65 border-white/25 text-white'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 stroke-[2.2] ${
                            isModalCardSaved ? 'fill-current' : ''
                          }`}
                        />
                        <span className="text-[11px] font-extrabold">
                          {isModalCardSaved ? 'Saved' : 'Save'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Hero Bottom Editorial Title + Radial Match Gauge */}
                  <div className="absolute bottom-9 inset-x-5 z-10 flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-purple-200 mb-1.5">
                        <span className="text-emerald-300">
                          {modalCard.projectObj.status || 'OPEN'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{modalCard.facultyLabel1}</span>
                        <span aria-hidden="true">·</span>
                        <span>{modalCard.facultyLabel2}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300">+50 SDP</span>
                      </div>
                      <h1 className="text-[22px] sm:text-[24px] font-extrabold font-display text-white leading-[1.15] tracking-tight drop-shadow-md">
                        {modalCard.title}
                      </h1>
                    </div>

                    {/* Circular Precision Radial Match Indicator */}
                    <div className="relative w-14 h-14 shrink-0 flex flex-col items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/25 shadow-lg">
                      <svg
                        className="w-14 h-14 -rotate-90 absolute inset-0"
                        viewBox="0 0 56 56"
                      >
                        <circle
                          cx="28"
                          cy="28"
                          r="23"
                          fill="none"
                          stroke="rgba(255,255,255,0.16)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="23"
                          fill="none"
                          stroke="#A78BFA"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 23}`}
                          strokeDashoffset={`${
                            2 *
                            Math.PI *
                            23 *
                            (1 - Math.min(100, modalMatchData.score) / 100)
                          }`}
                        />
                      </svg>
                      <span className="text-[13px] font-extrabold font-display text-white tabular-nums leading-none">
                        {modalMatchData.score}%
                      </span>
                      <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-purple-200 mt-0.5">
                        Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* CONTINUOUS CURVED EDITORIAL EVENT SHEET */}
                <div className="relative z-10 -mt-6 rounded-t-[30px] bg-[#FAF9FF] text-[#14122E] pt-4 pb-8">
                  {/* Segmented Editorial Sub-Navigation Strip (No Boxy Cards) */}
                  <div className="px-5 border-b border-purple-100/90">
                    <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
                      {(
                        [
                          {id: 'semua', label: 'Semua Maklumat'},
                          {id: 'butiran', label: 'Logistik & Galeri'},
                          {id: 'padanan', label: 'Skor & Jadual'},
                          {
                            id: 'pasukan',
                            label: `Pasukan (${
                              projectMembers.filter(
                                (m) =>
                                  m.project_id === modalCard.id &&
                                  m.membership_status === 'active'
                              ).length
                            }/${(modalCard.projectObj.slots_needed || 4) + 1})`,
                          },
                        ] as const
                      ).map((tab) => {
                        const isActive = activityDetailTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActivityDetailTab(tab.id)}
                            className={`relative pb-2.5 text-xs font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                              isActive
                                ? 'text-[#5B18E5]'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {tab.label}
                            {isActive && (
                              <motion.div
                                layoutId="activity-detail-editorial-underline"
                                transition={{
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 34,
                                }}
                                className="absolute bottom-0 inset-x-0 h-[2.5px] rounded-full bg-[#5B18E5]"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ORGANIZER BYLINE & INLINE AUTHOR TOOLBAR */}
                  <div className="px-5 py-3.5 border-b border-purple-100/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B18E5] to-[#9333EA] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                        {(modalCard.organizerName || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-[#14122E] truncate">
                            {modalCard.organizerName}
                          </span>
                          <span className="text-[10px] font-bold text-[#5B18E5]">
                            · {modalCard.canManage ? 'Mod Pengurus' : 'Penganjur'}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate">
                          {modalCard.projectObj.slots_needed || 4} kekosongan ahli ·{' '}
                          {modalCard.projectObj.min_weekly_hours || 6} jam/minggu
                        </div>
                      </div>
                    </div>

                    {modalCard.canManage && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditProjectInfoModal(modalCard.id)}
                          className="text-[11px] font-extrabold text-[#5B18E5] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            const ok = deleteOwnProject(modalCard.id);
                            if (ok) {
                              setIsActivityPageOpen(false);
                              setCardIndex(0);
                            }
                          }}
                          className="text-[11px] font-extrabold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Padam</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION 1: LEFT-RAIL VERTICAL TIMELINE LOGISTICS & EDITORIAL NARRATIVE */}
                  {(activityDetailTab === 'semua' ||
                    activityDetailTab === 'butiran') && (
                    <div className="px-5 pt-5 pb-6 border-b border-purple-100/90 space-y-6">
                      {/* Editorial Narrative */}
                      <div className="pb-5 border-b border-purple-100/90 space-y-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B18E5]">
                          Ringkasan &amp; Objektif Aktiviti
                        </div>
                        <p className="text-[13.5px] text-[#1E1B3A] leading-relaxed font-medium">
                          {modalCard.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] font-bold text-slate-500">
                          <span className="text-[#4E14B8]">
                            #{modalCard.projectObj.project_type}
                          </span>
                          {modalCard.tags.map((tag) => (
                            <span key={tag} className="text-slate-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hairline Logistics Rows (Zero Rounded Boxes) */}
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5">
                          Garis Masa &amp; Logistik Kampus
                        </div>
                        <div className="divide-y divide-purple-100/80 border-y border-purple-100/80">
                          {/* Row 1: Tarikh */}
                          <div className="py-3 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-[#5B18E5]" />
                              <span>Tarikh &amp; Tempoh</span>
                            </div>
                            <div className="text-xs font-extrabold text-[#14122E] text-right">
                              {modalCard.dateText}
                            </div>
                          </div>

                          {/* Row 2: Lokasi */}
                          <div className="py-3 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 shrink-0">
                              <MapPin className="w-3.5 h-3.5 text-[#5B18E5]" />
                              <span>Lokasi Kampus</span>
                            </div>
                            <div className="text-xs font-extrabold text-[#14122E] text-right">
                              {modalCard.locationText}
                            </div>
                          </div>

                          {/* Row 3: Sasaran Penyertaan */}
                          <div className="py-3 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 shrink-0">
                              <Users className="w-3.5 h-3.5 text-[#5B18E5]" />
                              <span>Sasaran Pelajar</span>
                            </div>
                            <div className="text-xs font-extrabold text-[#14122E] text-right">
                              {modalCard.audienceText}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MAGAZINE FILMSTRIP & COLLAGE GALLERY */}
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                              Visual &amp; Lampiran
                            </div>
                            <h2 className="text-sm font-extrabold font-display text-[#14122E]">
                              Katalog &amp; Poster Aktiviti (
                              {modalGalleryImages.length})
                            </h2>
                          </div>

                          {modalCard.canManage && (
                            <div className="flex items-center gap-3">
                              <label className="text-[11px] font-extrabold text-[#5B18E5] hover:underline flex items-center gap-1 shrink-0 cursor-pointer">
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Muat Naik</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = Array.from(
                                      e.target.files || []
                                    );
                                    if (files.length === 0) return;
                                    for (let i = 0; i < files.length; i++) {
                                      try {
                                        const dataUrl =
                                          await compressImageFileToDataUrl(
                                            files[i],
                                            1000,
                                            1000,
                                            0.86
                                          );
                                        addProjectGalleryImage(modalCard.id, {
                                          url: dataUrl,
                                          caption: modalCard.title,
                                        });
                                      } catch {
                                        notifyToast(
                                          'Gagal Memuat Naik Gambar',
                                          'Sila cuba fail gambar yang lain.',
                                          'error'
                                        );
                                      }
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  setIsAddingGalleryOnDetail((prev) => !prev)
                                }
                                className="text-[11px] font-extrabold text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
                              >
                                {isAddingGalleryOnDetail
                                  ? 'Tutup URL'
                                  : '+ Pautan URL'}
                              </button>
                            </div>
                          )}
                        </div>

                        {modalCard.canManage && isAddingGalleryOnDetail && (
                          <div className="flex items-center gap-2 pb-2 border-b border-purple-200">
                            <input
                              type="url"
                              value={detailGalleryUrl}
                              onChange={(e) =>
                                setDetailGalleryUrl(e.target.value)
                              }
                              placeholder="Tampal URL gambar poster (https://...)"
                              className="flex-1 bg-transparent py-1.5 font-semibold text-xs text-[#14122E] placeholder:text-slate-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!detailGalleryUrl.trim()) return;
                                addProjectGalleryImage(modalCard.id, {
                                  url: detailGalleryUrl.trim(),
                                  caption: modalCard.title,
                                });
                                setDetailGalleryUrl('');
                                setIsAddingGalleryOnDetail(false);
                              }}
                              className="px-3 py-1 rounded-full bg-[#5B18E5] text-white font-extrabold text-[11px] shrink-0 cursor-pointer"
                            >
                              Tambah
                            </button>
                          </div>
                        )}

                        {/* Asymmetric Editorial Photo Strip */}
                        <div className="grid grid-cols-2 gap-2">
                          {modalGalleryImages.slice(0, 4).map((img, idx) => {
                            const total = modalGalleryImages.length;
                            const isFullWidthTop =
                              total === 1 || (total === 3 && idx === 0);
                            const extraCount =
                              total > 4 && idx === 3 ? total - 4 : 0;

                            return (
                              <div
                                key={img.id}
                                onClick={() => {
                                  setLightboxIndex(idx);
                                  setLightboxZoom(1);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setLightboxIndex(idx);
                                    setLightboxZoom(1);
                                  }
                                }}
                                className={`group relative overflow-hidden rounded-lg bg-[#12042E] cursor-pointer ${
                                  isFullWidthTop
                                    ? 'col-span-2 aspect-[16/9]'
                                    : 'col-span-1 aspect-[4/3]'
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={`${modalCard.title} - Gambar ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                />

                                {(modalCard.isOwner || isAdmin) &&
                                  modalGalleryImages.length > 1 &&
                                  extraCount === 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProjectGalleryImage(
                                          modalCard.id,
                                          img.id
                                        );
                                      }}
                                      aria-label="Padam gambar"
                                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/65 hover:bg-rose-600 text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                {extraCount > 0 && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="text-white text-2xl font-extrabold font-display tracking-tight">
                                      +{extraCount}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: INLINE TELEMETRY MATCH BREAKDOWN (40/25/20/15) & TIMELINE SCHEDULE */}
                  {(activityDetailTab === 'semua' ||
                    activityDetailTab === 'padanan') && (
                    <div className="px-5 py-5 border-b border-purple-100/90 space-y-6">
                      {/* Horizontal Telemetry Match Breakdown */}
                      <div className="space-y-3.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B18E5]">
                              Telemetri Kesesuaian
                            </div>
                            <h2 className="text-sm font-extrabold font-display text-[#14122E]">
                              Pecahan Skor Padanan (40/25/20/15)
                            </h2>
                          </div>
                          <span className="text-lg font-extrabold font-display text-[#5B18E5] tabular-nums">
                            {modalMatchData.score}
                            <span className="text-xs text-slate-400 font-bold">
                              /100
                            </span>
                          </span>
                        </div>

                        <div className="divide-y divide-purple-100/80 border-y border-purple-100/80">
                          {[
                            {
                              label: 'Kemahiran (40%)',
                              val: modalMatchData.skillScore,
                              max: 40,
                              barColor: 'bg-[#5B18E5]',
                            },
                            {
                              label: 'Minat Bersama (25%)',
                              val: modalMatchData.interestScore,
                              max: 25,
                              barColor: 'bg-[#7C3AED]',
                            },
                            {
                              label: 'Jadual Masa (20%)',
                              val: modalMatchData.scheduleScore,
                              max: 20,
                              barColor: 'bg-[#8B5CF6]',
                            },
                            {
                              label: 'Matlamat & Tag (15%)',
                              val: modalMatchData.goalScore,
                              max: 15,
                              barColor: 'bg-[#A855F7]',
                            },
                          ].map((metric) => {
                            const pct = Math.min(
                              100,
                              Math.round((metric.val / metric.max) * 100)
                            );
                            return (
                              <div
                                key={metric.label}
                                className="py-2.5 flex items-center gap-3 text-xs"
                              >
                                <span className="w-36 shrink-0 font-bold text-slate-600">
                                  {metric.label}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-purple-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${metric.barColor} transition-all duration-500`}
                                    style={{width: `${pct}%`}}
                                  />
                                </div>
                                <span className="w-12 text-right font-extrabold text-[#14122E] tabular-nums shrink-0">
                                  {metric.val}/{metric.max}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hairline Schedule List (No Nested Boxes) */}
                      <div className="space-y-2.5">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            Komitmen Mingguan
                          </div>
                          <h2 className="text-sm font-extrabold font-display text-[#14122E]">
                            Jadual Perjumpaan &amp; Ketersediaan
                          </h2>
                        </div>

                        {modalMeetingSlots.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">
                            Waktu fleksibel mengikut persetujuan ahli kumpulan
                            dan penganjur.
                          </p>
                        ) : (
                          <div className="divide-y divide-purple-100/80 border-y border-purple-100/80">
                            {modalMeetingSlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="py-2.5 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="font-extrabold text-[#14122E]">
                                    {slot.dayName}
                                  </span>
                                  <span className="text-slate-500 font-semibold tabular-nums">
                                    {slot.start_time} – {slot.end_time}
                                  </span>
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
                    </div>
                  )}

                  {/* SECTION 3: OPEN ROSTER DIRECTORY & SEAMLESS APPLICATION COMPOSER */}
                  {(activityDetailTab === 'semua' ||
                    activityDetailTab === 'pasukan') && (
                    <div className="px-5 pt-5 pb-4 space-y-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B18E5]">
                            Kolaborasi Kampus
                          </div>
                          <h2 className="text-sm font-extrabold font-display text-[#14122E]">
                            Penyertaan Pasukan &amp; Permohonan
                          </h2>
                        </div>
                        <span className="text-xs font-extrabold text-[#5B18E5] tabular-nums">
                          {
                            projectMembers.filter(
                              (m) =>
                                m.project_id === modalCard.id &&
                                m.membership_status === 'active'
                            ).length
                          }{' '}
                          / {(modalCard.projectObj.slots_needed || 4) + 1} Ahli
                          Aktif
                        </span>
                      </div>

                      {/* Open Directory List of Active Members */}
                      <div className="divide-y divide-purple-100/80 border-y border-purple-100/80">
                        {projectMembers
                          .filter(
                            (m) =>
                              m.project_id === modalCard.id &&
                              m.membership_status === 'active'
                          )
                          .map((member) => {
                            const memberProfile = profiles.find(
                              (p) => p.id === member.student_id
                            );
                            const initials = (
                              memberProfile?.display_name || 'U'
                            )
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase();
                            return (
                              <div
                                key={`${member.project_id}-${member.student_id}`}
                                className="py-2.5 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-purple-100 text-[#5B18E5] font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-[#14122E] truncate">
                                      {memberProfile?.display_name || 'Ahli UMS'}
                                    </div>
                                    <div className="text-[10.5px] text-slate-500 truncate">
                                      {memberProfile?.faculty_short || 'UMS'} ·{' '}
                                      {memberProfile?.matric_no || 'Pelajar'}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10.5px] font-extrabold text-[#5B18E5] shrink-0">
                                  {member.member_role === 'owner'
                                    ? 'Ketua Projek'
                                    : 'Ahli'}
                                </span>
                              </div>
                            );
                          })}
                      </div>

                      {/* Student Application or Organizer Approval Flow */}
                      {(() => {
                        const myApp = currentUser
                          ? applications.find(
                              (a) =>
                                a.project_id === modalCard.id &&
                                a.applicant_id === currentUser.id
                            )
                          : undefined;
                        const projectApps = applications.filter(
                          (a) => a.project_id === modalCard.id
                        );

                        return (
                          <div className="space-y-4">
                            {!modalCard.isOwner && (
                              <div>
                                {myApp && myApp.status !== 'withdrawn' ? (
                                  <div className="border-y border-purple-200/80 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-[#14122E]">
                                        Status Permohonan Anda
                                      </span>
                                      <span
                                        className={`text-[10.5px] font-extrabold uppercase ${
                                          myApp.status === 'accepted'
                                            ? 'text-emerald-700'
                                            : myApp.status === 'declined'
                                            ? 'text-rose-600'
                                            : 'text-amber-700'
                                        }`}
                                      >
                                        ● {myApp.status}
                                      </span>
                                    </div>
                                    {myApp.note && (
                                      <p className="text-[11.5px] text-slate-600 italic">
                                        &ldquo;{myApp.note}&rdquo;
                                      </p>
                                    )}
                                    {myApp.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          withdrawApplication(myApp.id)
                                        }
                                        className="text-[11px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                                      >
                                        Tarik Balik Permohonan
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                      Nota Ringkas Permohonan Anda
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={applyNote}
                                      onChange={(e) =>
                                        setApplyNote(e.target.value)
                                      }
                                      placeholder="Tulis mesej ringkas & kemahiran anda untuk menyertai aktiviti ini..."
                                      className="w-full border-b-2 border-purple-200 focus:border-[#5B18E5] bg-transparent py-1.5 text-xs text-[#14122E] placeholder:text-slate-400 focus:outline-none transition-colors"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        applyToProject(
                                          modalCard.id,
                                          applyNote.trim() ||
                                            `Saya berminat menyertai ${modalCard.title} dan sedia menyumbang kemahiran saya.`
                                        );
                                        setApplyNote('');
                                      }}
                                      className="w-full h-11 rounded-full bg-[#5B18E5] hover:bg-[#4B12C2] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Hantar Permohonan Penyertaan</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {(modalCard.isOwner || isAdmin) && (
                              <div className="space-y-2.5">
                                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#5B18E5]">
                                  Senarai Pemohon ({projectApps.length})
                                </div>
                                {projectApps.length === 0 ? (
                                  <p className="text-[11.5px] text-slate-500 italic">
                                    Belum ada permohonan diterima untuk aktiviti
                                    ini.
                                  </p>
                                ) : (
                                  <div className="divide-y divide-purple-100/80 border-y border-purple-100/80">
                                    {projectApps.map((app) => {
                                      const applicant = profiles.find(
                                        (p) => p.id === app.applicant_id
                                      );
                                      return (
                                        <div
                                          key={app.id}
                                          className="py-3 space-y-1.5 text-xs"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-extrabold text-[#14122E] truncate">
                                              {applicant?.display_name ||
                                                'Pelajar UMS'}
                                            </span>
                                            <span className="text-[10px] font-extrabold uppercase text-[#5B18E5]">
                                              {app.status}
                                            </span>
                                          </div>
                                          {app.note && (
                                            <p className="text-[11px] text-slate-600">
                                              {app.note}
                                            </p>
                                          )}
                                          {app.status === 'pending' && (
                                            <div className="flex items-center gap-3 pt-1">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  decideApplication(
                                                    app.id,
                                                    'accepted'
                                                  )
                                                }
                                                className="px-3.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] cursor-pointer"
                                              >
                                                Terima
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  decideApplication(
                                                    app.id,
                                                    'declined'
                                                  )
                                                }
                                                className="px-3.5 py-1 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-extrabold text-[11px] cursor-pointer"
                                              >
                                                Tolak
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* FLUSH BOTTOM STICKY ACTION DOCK (REPLACES FLOATING ROUNDED BOX) */}
              <div className="relative z-30 shrink-0 border-t border-purple-200/80 bg-white/95 backdrop-blur-xl px-5 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(20,10,50,0.06)]">
                <div className="min-w-0 flex-1">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                    Hubungi Penganjur · {modalCard.organizerName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-extrabold text-[#14122E] flex items-center gap-1 tabular-nums">
                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
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
                      className="text-[10.5px] font-extrabold text-[#5B18E5] hover:underline cursor-pointer"
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
                  className="h-11 px-5 rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                  <span>WhatsApp Direct</span>
                </a>
              </div>
            </motion.div>
          ) : isPostActivityPageOpen ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN POST ACTIVITY PAGE
             (EDGE-TO-EDGE COMPACT EDITORIAL STUDIO — NO ROUNDED-SQUARE BOXES)
             --------------------------------------------------------- */
          <motion.div
            key="page-post-activity"
            initial={{opacity: 0, y: 48, scale: 0.985}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 36, scale: 0.985}}
            transition={{type: 'spring', stiffness: 380, damping: 34}}
            className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden bg-[#FAF9FF] text-[#14122E]"
          >
            {/* Compact Flush Top Bar */}
            <div className="h-12 px-3.5 bg-white/95 backdrop-blur-md border-b border-purple-200/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPostActivityPageOpen(false)}
                  aria-label="Kembali ke halaman sebelumnya"
                  className="group h-8 pl-1.5 pr-3 rounded-full bg-white hover:bg-[#F5F0FF] border border-purple-200/95 shadow-[0_2px_8px_rgba(91,24,229,0.1)] flex items-center gap-1.5 text-[#14122E] active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#6B2CF5] to-[#4A11C4] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <ArrowLeft className="w-3 h-3 stroke-[2.6]" />
                  </span>
                  <span className="text-[11px] font-extrabold tracking-tight text-[#250E5E]">
                    Kembali
                  </span>
                </button>
                <div className="min-w-0">
                  <h1 className="text-[12.5px] font-extrabold font-display text-[#141132] tracking-tight truncate leading-tight">
                    Siarkan Aktiviti UMS
                  </h1>
                  <p className="text-[9.5px] font-semibold text-slate-400 truncate leading-tight">
                    Kongsi program kelab, pensyarah atau fakulti
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
                  setNewBannerMode('upload');
                  setNewBannerUrl('');
                  setNewBannerPreset('prj-techfest');
                  setNewBannerPosY(50);
                  setNewRequiredSkills([]);
                  notifyToast('Borang Dikosongkan', undefined, 'default');
                }}
                className="h-7 px-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 text-[10px] font-extrabold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5 stroke-[2.5]" />
                <span>Reset</span>
              </button>
            </div>

            {/* Edge-to-Edge Scrollable Form */}
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
                    newTag1.trim() || 'AI & Tech',
                    newTag2.trim() || 'Networking',
                    newTag3.trim() || newType,
                  ],
                  p_attribute_tags:
                    newAttributeTags.length > 0
                      ? newAttributeTags
                      : ['Rentas Fakulti', 'Beginner Friendly'],
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
                  p_gallery_images:
                    newDraftGalleryImages.length > 0
                      ? newDraftGalleryImages
                      : undefined,
                  p_required_skills: newRequiredSkills,
                  p_interests: newProjectInterests,
                  p_meeting_slots: newMeetingSlots,
                });
                if (createdId) {
                  setNewTitle('');
                  setNewDesc('');
                  setNewBannerUrl('');
                  setNewDraftGalleryImages([]);
                  setCardIndex(0);
                  setIsPostActivityPageOpen(false);
                  openCardInfoModal(createdId);
                }
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-purple-200/75 overscroll-y-contain">
                {/* SLIM 1-CLICK TEMPLATE STRIP */}
                <div className="px-3.5 py-2 bg-[#F4F0FF] flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-extrabold uppercase tracking-wider text-[#5B18E5] flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3" />
                    <span>Isi Pantas:</span>
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      {id: 'techfest', label: 'Hackathon AI'},
                      {id: 'shuttle', label: 'Smart Shuttle'},
                      {id: 'reef', label: 'Marine Reef'},
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() =>
                          applyPostActivityTemplate(
                            tpl.id as 'techfest' | 'shuttle' | 'reef'
                          )
                        }
                        className="px-2 py-0.5 rounded-md bg-white border border-purple-200/90 font-extrabold text-[#4C14B8] hover:bg-[#5B18E5] hover:text-white whitespace-nowrap transition-colors cursor-pointer"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* COMPACT HORIZONTAL LIVE PREVIEW STRIP */}
                <div className="px-3.5 py-2.5 bg-white/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                    <span>Pralihat Kad Aktiviti</span>
                    <span className="text-[#5B18E5] font-bold normal-case">
                      Terbuka untuk semua bidang &amp; fakulti
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="relative w-20 h-16 rounded overflow-hidden bg-[#240850] shrink-0">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute bottom-1 left-1 text-[8px] font-extrabold text-amber-300">
                        +50 SDP
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="text-[12px] font-extrabold font-display text-[#14122E] truncate">
                          {newTitle.trim() || 'Tajuk Aktiviti Anda...'}
                        </div>
                        <span className="text-[9px] font-extrabold text-[#5B18E5] shrink-0">
                          {newBadgeLine1 || 'Program'} ·{' '}
                          {newBadgeLine2 || newType}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {newDateText || 'Tarikh'} ·{' '}
                        {newLocationText || 'Lokasi UMS'}
                      </div>
                      <p className="text-[10px] text-slate-600 line-clamp-1 mt-0.5">
                        {newDesc.trim() ||
                          'Penerangan ringkas objektif aktiviti...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 01: MAKLUMAT ASAS, POSTER & KATALOG GAMBAR */}
                <div className="px-3.5 py-2.5 space-y-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => togglePostSection('s1')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F3EEFF] via-[#F7F4FF] to-white border border-purple-200/90 shadow-[0_1px_3px_rgba(91,24,229,0.06)] flex items-center justify-between gap-2 hover:border-[#5B18E5]/50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center min-w-[26px] h-5 px-1.5 rounded-md bg-gradient-to-br from-[#5B18E5] to-[#4310B8] text-white text-[10px] font-extrabold tracking-wider shadow-[0_2px_6px_rgba(91,24,229,0.25)] shrink-0">
                        01
                      </span>
                      <span className="text-[11px] font-extrabold font-display uppercase tracking-wide text-[#14122E] truncate">
                        Maklumat Asas &amp; Visual Poster
                      </span>
                    </div>
                    <span className="w-6 h-6 rounded-md bg-white border border-purple-200/80 flex items-center justify-center text-[#5B18E5] shrink-0">
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openPostSections.s1 ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {openPostSections.s1 && (
                    <div className="space-y-2.5 pt-0.5">
                      {/* Poster Mode Switcher: Default Muat Naik + Preset UMS (No URL) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                          Sumber Poster Utama
                        </span>
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#EFEAFF] border border-purple-200/80 text-[10px] font-extrabold">
                          {(
                            [
                              {id: 'upload', label: 'Muat Naik'},
                              {id: 'preset', label: 'Preset UMS'},
                            ] as const
                          ).map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setNewBannerMode(m.id)}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                newBannerMode === m.id
                                  ? 'bg-[#5B18E5] text-white shadow-xs'
                                  : 'text-[#5B18E5] hover:bg-purple-100/60'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Poster Selector Controls */}
                      {newBannerMode === 'upload' && (
                        <label className="w-full py-2 px-3 rounded-lg border border-dashed border-purple-300 bg-white/80 hover:bg-purple-50/60 text-[#5B18E5] font-extrabold text-[10.5px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                          <span>
                            {newBannerUrl.startsWith('data:')
                              ? 'Tukar Fail Poster dari Peranti'
                              : 'Pilih Fail Poster dari Peranti (JPG/PNG)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const dataUrl =
                                  await compressImageFileToDataUrl(
                                    file,
                                    900,
                                    500,
                                    0.84
                                  );
                                setNewBannerUrl(dataUrl);
                                notifyToast(
                                  'Gambar Poster Dimuat Naik',
                                  'Pralihat telah dikemas kini.',
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
                      )}

                      {newBannerMode === 'upload' && newBannerUrl.trim() && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-bold text-slate-500 shrink-0">
                            Fokus Y ({newBannerPosY}%):
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={newBannerPosY}
                            onChange={(e) =>
                              setNewBannerPosY(Number(e.target.value))
                            }
                            className="flex-1 accent-[#5B18E5] h-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewBannerUrl('');
                            }}
                            className="text-rose-600 font-extrabold hover:underline shrink-0 cursor-pointer"
                          >
                            Padam
                          </button>
                        </div>
                      )}

                      {newBannerMode === 'preset' && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {UMS_BANNER_PRESETS.map((preset) => {
                            const selected = newBannerPreset === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setNewBannerPreset(preset.id)}
                                className={`overflow-hidden rounded-md border text-left transition-all cursor-pointer ${
                                  selected
                                    ? 'border-[#5B18E5] bg-[#F3EEFF]'
                                    : 'border-purple-100 bg-white opacity-80 hover:opacity-100'
                                }`}
                              >
                                <div className="relative h-9 w-full overflow-hidden bg-[#1E0842]">
                                  <ActivityCardBanner cardId={preset.id} />
                                </div>
                                <div className="px-1.5 py-1">
                                  <div className="text-[9.5px] font-extrabold text-[#14122E] truncate">
                                    {preset.label}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Compact Multi-Image Catalog Row (Upload Only) */}
                      <div className="pt-1.5 border-t border-purple-100 flex items-center justify-between gap-2">
                        <label className="px-2.5 py-1 rounded-md bg-[#F3EEFF] hover:bg-[#E7DDFC] border border-purple-200/80 text-[10px] font-extrabold text-[#5B18E5] flex items-center gap-1.5 cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" />
                          <span>
                            + Lampirkan Katalog Gambar (
                            {newDraftGalleryImages.length})
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              const uploadedItems: ProjectGalleryItem[] = [];
                              for (let i = 0; i < files.length; i++) {
                                try {
                                  const dataUrl =
                                    await compressImageFileToDataUrl(
                                      files[i],
                                      1000,
                                      1000,
                                      0.86
                                    );
                                  uploadedItems.push({
                                    id: `draft-gal-${Date.now()}-${i}`,
                                    url: dataUrl,
                                    caption:
                                      newTitle.trim() || 'Poster Aktiviti',
                                  });
                                } catch {
                                  // Ignore failed file
                                }
                              }
                              if (uploadedItems.length > 0) {
                                setNewDraftGalleryImages((prev) => [
                                  ...prev,
                                  ...uploadedItems,
                                ]);
                                notifyToast(
                                  `${uploadedItems.length} Gambar Ditambah`,
                                  'Katalog sedia dipaparkan.',
                                  'success'
                                );
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {newDraftGalleryImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setNewDraftGalleryImages([])}
                            className="text-[9.5px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Kosongkan Katalog
                          </button>
                        )}
                      </div>

                      {newDraftGalleryImages.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                          {newDraftGalleryImages.map((gItem, idx) => (
                            <div
                              key={gItem.id}
                              className="relative w-12 h-12 rounded overflow-hidden bg-[#19063B] shrink-0"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={gItem.url}
                                alt={`Gambar ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setNewDraftGalleryImages((prev) =>
                                    prev.filter((x) => x.id !== gItem.id)
                                  )
                                }
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[9px] font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Title & Category / Badges in Compact Grid */}
                      <div>
                        <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                          Tajuk Aktiviti / Projek UMS *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="cth. Borneo AI & Smart Campus Hackathon 2026"
                          className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[12px] font-bold text-[#14122E] placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Kategori
                          </label>
                          <select
                            value={newType}
                            onChange={(e) => {
                              const val = e.target.value as ProjectType;
                              setNewType(val);
                              setNewTag3(val);
                            }}
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-bold text-[#14122E] focus:outline-none"
                          >
                            <option value="Competition">Competition</option>
                            <option value="Innovation">Innovation</option>
                            <option value="Community">Community</option>
                            <option value="Assignment">Assignment</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Lencana 1
                          </label>
                          <input
                            type="text"
                            value={newBadgeLine1}
                            onChange={(e) => setNewBadgeLine1(e.target.value)}
                            placeholder="Program"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Lencana 2
                          </label>
                          <input
                            type="text"
                            value={newBadgeLine2}
                            onChange={(e) => setNewBadgeLine2(e.target.value)}
                            placeholder="FKI / Kampus"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                          Penerangan &amp; Objektif Aktiviti *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          placeholder="Terangkan objektif program, peranan ahli yang dicari, atau hebahan pensyarah/kelab..."
                          className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-medium leading-snug focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
                          3 Tag Sorotan Kad (Senarai Rasmi UMS)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={newTag1}
                            onChange={(e) => setNewTag1(e.target.value)}
                            aria-label="Tag Sorotan Kad 1"
                            className="border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[10.5px] font-bold text-[#14122E] focus:outline-none"
                          >
                            {OFFICIAL_CARD_HIGHLIGHT_TAGS.map((tagOpt) => (
                              <option key={`t1-${tagOpt}`} value={tagOpt}>
                                {tagOpt}
                              </option>
                            ))}
                          </select>
                          <select
                            value={newTag2}
                            onChange={(e) => setNewTag2(e.target.value)}
                            aria-label="Tag Sorotan Kad 2"
                            className="border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[10.5px] font-bold text-[#14122E] focus:outline-none"
                          >
                            {OFFICIAL_CARD_HIGHLIGHT_TAGS.map((tagOpt) => (
                              <option key={`t2-${tagOpt}`} value={tagOpt}>
                                {tagOpt}
                              </option>
                            ))}
                          </select>
                          <select
                            value={newTag3}
                            onChange={(e) => setNewTag3(e.target.value)}
                            aria-label="Tag Sorotan Kad 3"
                            className="border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[10.5px] font-bold text-[#14122E] focus:outline-none"
                          >
                            {OFFICIAL_CARD_HIGHLIGHT_TAGS.map((tagOpt) => (
                              <option key={`t3-${tagOpt}`} value={tagOpt}>
                                {tagOpt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 02: LOGISTIK KAMPUS, TARIKH, SASARAN & KUOTA */}
                <div className="px-3.5 py-2.5 space-y-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => togglePostSection('s2')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F3EEFF] via-[#F7F4FF] to-white border border-purple-200/90 shadow-[0_1px_3px_rgba(91,24,229,0.06)] flex items-center justify-between gap-2 hover:border-[#5B18E5]/50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center min-w-[26px] h-5 px-1.5 rounded-md bg-gradient-to-br from-[#5B18E5] to-[#4310B8] text-white text-[10px] font-extrabold tracking-wider shadow-[0_2px_6px_rgba(91,24,229,0.25)] shrink-0">
                        02
                      </span>
                      <span className="text-[11px] font-extrabold font-display uppercase tracking-wide text-[#14122E] truncate">
                        Logistik Kampus &amp; Kuota
                      </span>
                    </div>
                    <span className="w-6 h-6 rounded-md bg-white border border-purple-200/80 flex items-center justify-center text-[#5B18E5] shrink-0">
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openPostSections.s2 ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {openPostSections.s2 && (
                    <div className="space-y-2.5 pt-0.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Tarikh Program
                          </label>
                          <input
                            type="text"
                            value={newDateText}
                            onChange={(e) => setNewDateText(e.target.value)}
                            placeholder="cth. 22 – 24 Nov 2026"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Tarikh Tutup
                          </label>
                          <input
                            type="date"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Lokasi Kampus UMS
                          </label>
                          <input
                            type="text"
                            value={newLocationText}
                            onChange={(e) => setNewLocationText(e.target.value)}
                            placeholder="DKP 2 / Makmal AI FKI"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Sasaran Pelajar
                          </label>
                          <input
                            type="text"
                            value={newAudience}
                            onChange={(e) => setNewAudience(e.target.value)}
                            placeholder="Semua pelajar FKI & UMS"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Kekosongan Ahli (Slot)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={newSlotsNeeded}
                            onChange={(e) =>
                              setNewSlotsNeeded(
                                Math.max(1, Number(e.target.value) || 4)
                              )
                            }
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-bold tabular-nums focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Komitmen (Jam / Minggu)
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
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-bold tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 03: SYARAT KEMAHIRAN (OPTIONAL COLLAPSIBLE DROPDOWN) */}
                <div className="px-3.5 py-2.5 space-y-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => togglePostSection('s3')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F3EEFF] via-[#F7F4FF] to-white border border-purple-200/90 shadow-[0_1px_3px_rgba(91,24,229,0.06)] flex items-center justify-between gap-2 hover:border-[#5B18E5]/50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center min-w-[26px] h-5 px-1.5 rounded-md bg-gradient-to-br from-[#5B18E5] to-[#4310B8] text-white text-[10px] font-extrabold tracking-wider shadow-[0_2px_6px_rgba(91,24,229,0.25)] shrink-0">
                        03
                      </span>
                      <span className="text-[11px] font-extrabold font-display uppercase tracking-wide text-[#14122E] truncate">
                        Syarat Kemahiran
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-300/80 text-amber-900 text-[9px] font-extrabold shrink-0">
                        Pilihan (Optional)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9.5px] font-bold text-slate-500 tabular-nums">
                        {newRequiredSkills.length > 0
                          ? `${newRequiredSkills.length} dipilih`
                          : 'Buka'}
                      </span>
                      <span className="w-6 h-6 rounded-md bg-white border border-purple-200/80 flex items-center justify-center text-[#5B18E5]">
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openPostSections.s3 ? 'rotate-180' : ''
                          }`}
                        />
                      </span>
                    </div>
                  </button>

                  {openPostSections.s3 && (
                    <div className="space-y-2.5 pt-1">
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Bahagian ini <strong>tidak wajib</strong>. Pilih daripada
                        katalog kemahiran rasmi merangkumi semua bidang UMS, atau
                        biarkan kosong jika terbuka kepada semua pelajar.
                      </p>

                      {/* Grouped Official Dropdown Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const selectedSkillId = e.target.value;
                            if (!selectedSkillId) return;
                            if (
                              newRequiredSkills.some(
                                (r) => r.skill_id === selectedSkillId
                              )
                            ) {
                              return;
                            }
                            setNewRequiredSkills((prev) => [
                              ...prev,
                              {
                                skill_id: selectedSkillId,
                                mandatory: postSkillMandatory,
                                importance: postSkillImportance,
                              },
                            ]);
                          }}
                          className="flex-1 border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-bold text-[#14122E] focus:outline-none"
                        >
                          <option value="">
                            ▾ Pilih terus daripada katalog kemahiran rasmi UMS...
                          </option>
                          {SKILL_CATEGORIES.map((cat) => (
                            <optgroup key={cat} label={cat}>
                              {skills
                                .filter((s) => s.category === cat)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Category Filter Tabs + Search Within Official Skills Catalog */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                          {['Semua', ...SKILL_CATEGORIES].map((cat) => {
                            const active = skillPickerCategory === cat;
                            return (
                              <button
                                key={`post-sk-cat-${cat}`}
                                type="button"
                                onClick={() => setSkillPickerCategory(cat)}
                                className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                                  active
                                    ? 'bg-[#5B18E5] text-white'
                                    : 'bg-[#F3EEFF] text-[#4C14B8] hover:bg-[#E7DDFC]'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>

                        <input
                          type="search"
                          value={skillPickerQuery}
                          onChange={(e) => setSkillPickerQuery(e.target.value)}
                          placeholder="Cari dalam senarai kemahiran rasmi UMS..."
                          className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[10.5px] font-semibold focus:outline-none"
                        />

                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar pt-0.5">
                          {skills
                            .filter(
                              (s) =>
                                (skillPickerCategory === 'Semua' ||
                                  s.category === skillPickerCategory) &&
                                (!skillPickerQuery.trim() ||
                                  s.name
                                    .toLowerCase()
                                    .includes(
                                      skillPickerQuery.trim().toLowerCase()
                                    ) ||
                                  s.category
                                    .toLowerCase()
                                    .includes(
                                      skillPickerQuery.trim().toLowerCase()
                                    ))
                            )
                            .map((s) => {
                              const selected = newRequiredSkills.some(
                                (r) => r.skill_id === s.id
                              );
                              return (
                                <button
                                  key={`post-sk-chip-${s.id}`}
                                  type="button"
                                  onClick={() =>
                                    setNewRequiredSkills((prev) =>
                                      prev.some((r) => r.skill_id === s.id)
                                        ? prev.filter(
                                            (r) => r.skill_id !== s.id
                                          )
                                        : [
                                            ...prev,
                                            {
                                              skill_id: s.id,
                                              mandatory: postSkillMandatory,
                                              importance: postSkillImportance,
                                            },
                                          ]
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold cursor-pointer transition-colors ${
                                    selected
                                      ? 'bg-[#5B18E5] border-[#5B18E5] text-white'
                                      : 'bg-white border-purple-200/80 text-slate-600 hover:border-purple-300'
                                  }`}
                                >
                                  {selected ? `✓ ${s.name}` : `+ ${s.name}`}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Active Required Skills as Compact Hairline Rows */}
                      {newRequiredSkills.length > 0 && (
                        <div className="divide-y divide-purple-100 border-y border-purple-100">
                          {newRequiredSkills.map((req) => {
                            const skObj = skills.find(
                              (s) => s.id === req.skill_id
                            );
                            return (
                              <div
                                key={req.skill_id}
                                className="py-1.5 flex items-center justify-between gap-2"
                              >
                                <span className="font-bold text-[#14122E] truncate">
                                  {skObj?.name || req.skill_id}
                                </span>

                                <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNewRequiredSkills((prev) =>
                                        prev.map((item) =>
                                          item.skill_id === req.skill_id
                                            ? {
                                                ...item,
                                                mandatory: !item.mandatory,
                                              }
                                            : item
                                        )
                                      )
                                    }
                                    className={`px-1.5 py-0.5 rounded font-extrabold cursor-pointer ${
                                      req.mandatory
                                        ? 'bg-[#F3EEFF] text-[#5B18E5]'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {req.mandatory ? 'Utama' : 'Pilihan'}
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
                                    className="bg-transparent font-bold text-slate-700 focus:outline-none"
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
                                          (item) =>
                                            item.skill_id !== req.skill_id
                                        )
                                      )
                                    }
                                    className="text-rose-600 hover:underline font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION 04: BIDANG MINAT & TAG PENAPIS HOME (OFFICIAL PREDETERMINED CATALOG) */}
                <div className="px-3.5 py-2.5 space-y-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => togglePostSection('s4')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F3EEFF] via-[#F7F4FF] to-white border border-purple-200/90 shadow-[0_1px_3px_rgba(91,24,229,0.06)] flex items-center justify-between gap-2 hover:border-[#5B18E5]/50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center min-w-[26px] h-5 px-1.5 rounded-md bg-gradient-to-br from-[#5B18E5] to-[#4310B8] text-white text-[10px] font-extrabold tracking-wider shadow-[0_2px_6px_rgba(91,24,229,0.25)] shrink-0">
                        04
                      </span>
                      <span className="text-[11px] font-extrabold font-display uppercase tracking-wide text-[#14122E] truncate">
                        Bidang Minat &amp; Tag Carian Rasmi
                      </span>
                    </div>
                    <span className="w-6 h-6 rounded-md bg-white border border-purple-200/80 flex items-center justify-center text-[#5B18E5] shrink-0">
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openPostSections.s4 ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {openPostSections.s4 && (
                    <div className="space-y-2.5 pt-0.5">
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {['Semua', ...INTEREST_CATEGORIES].map((cat) => {
                          const active = interestPickerCategory === cat;
                          return (
                            <button
                              key={`post-in-cat-${cat}`}
                              type="button"
                              onClick={() => setInterestPickerCategory(cat)}
                              className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                                active
                                  ? 'bg-[#5B18E5] text-white'
                                  : 'bg-[#F3EEFF] text-[#4C14B8] hover:bg-[#E7DDFC]'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      <input
                        type="search"
                        value={interestPickerQuery}
                        onChange={(e) => setInterestPickerQuery(e.target.value)}
                        placeholder="Cari topik minat rasmi UMS..."
                        className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[10.5px] font-semibold focus:outline-none"
                      />

                      <div className="flex flex-wrap gap-1.5 text-[10px] max-h-28 overflow-y-auto no-scrollbar">
                        {interests
                          .filter(
                            (i) =>
                              (interestPickerCategory === 'Semua' ||
                                i.category === interestPickerCategory) &&
                              (!interestPickerQuery.trim() ||
                                i.name
                                  .toLowerCase()
                                  .includes(
                                    interestPickerQuery.trim().toLowerCase()
                                  ))
                          )
                          .map((intrObj) => {
                            const active =
                              newProjectInterests.includes(intrObj.id) ||
                              newProjectInterests.includes(intrObj.name);
                            return (
                              <button
                                key={intrObj.id}
                                type="button"
                                onClick={() =>
                                  setNewProjectInterests((prev) =>
                                    prev.includes(intrObj.id) ||
                                    prev.includes(intrObj.name)
                                      ? prev.filter(
                                          (id) =>
                                            id !== intrObj.id &&
                                            id !== intrObj.name
                                        )
                                      : [...prev, intrObj.id]
                                  )
                                }
                                className={`px-2 py-0.5 rounded-md border font-extrabold cursor-pointer transition-colors ${
                                  active
                                    ? 'bg-[#5B18E5] border-[#5B18E5] text-white'
                                    : 'bg-white border-purple-200/80 text-slate-600 hover:border-purple-300'
                                }`}
                              >
                                {active
                                  ? `✓ ${intrObj.name}`
                                  : `+ ${intrObj.name}`}
                              </button>
                            );
                          })}
                      </div>

                      <div className="pt-1.5 border-t border-purple-100 space-y-2">
                        {(
                          [
                            'Kemahiran & Bidang',
                            'Gaya Kerja & Pasukan',
                          ] as const
                        ).map((grp) => (
                          <div key={grp} className="space-y-1">
                            <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                              Tag Penapis ({grp}):
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                              {OFFICIAL_FILTER_TAGS.filter(
                                (item) => item.group === grp
                              ).map((item) => {
                                const active = newAttributeTags.includes(
                                  item.label
                                );
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                      setNewAttributeTags((prev) =>
                                        prev.includes(item.label)
                                          ? prev.filter((a) => a !== item.label)
                                          : [...prev, item.label]
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded-md border font-extrabold cursor-pointer transition-colors ${
                                      active
                                        ? 'bg-[#141132] border-[#141132] text-white'
                                        : 'bg-white border-purple-200/80 text-slate-600 hover:border-purple-300'
                                    }`}
                                  >
                                    {active
                                      ? `✓ ${item.label}`
                                      : `+ ${item.label}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 05: JADUAL PERJUMPAAN & WHATSAPP PENGANJUR */}
                <div className="px-3.5 py-2.5 space-y-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => togglePostSection('s5')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F3EEFF] via-[#F7F4FF] to-white border border-purple-200/90 shadow-[0_1px_3px_rgba(91,24,229,0.06)] flex items-center justify-between gap-2 hover:border-[#5B18E5]/50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center min-w-[26px] h-5 px-1.5 rounded-md bg-gradient-to-br from-[#5B18E5] to-[#4310B8] text-white text-[10px] font-extrabold tracking-wider shadow-[0_2px_6px_rgba(91,24,229,0.25)] shrink-0">
                        05
                      </span>
                      <span className="text-[11px] font-extrabold font-display uppercase tracking-wide text-[#14122E] truncate">
                        Jadual Mingguan &amp; WhatsApp Penganjur
                      </span>
                    </div>
                    <span className="w-6 h-6 rounded-md bg-white border border-purple-200/80 flex items-center justify-center text-[#5B18E5] shrink-0">
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openPostSections.s5 ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {openPostSections.s5 && (
                    <div className="space-y-2.5 pt-0.5">
                      {newMeetingSlots.length > 0 && (
                        <div className="divide-y divide-purple-100 border-y border-purple-100">
                          {newMeetingSlots.map((slot, idx) => (
                            <div
                              key={`${slot.weekday}-${slot.start_time}-${idx}`}
                              className="py-1.5 flex items-center justify-between text-[10.5px]"
                            >
                              <span className="font-bold text-[#14122E] tabular-nums">
                                {WEEKDAY_SHORT[slot.weekday]} ·{' '}
                                {slot.start_time} – {slot.end_time}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewMeetingSlots((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="text-rose-600 font-bold hover:underline cursor-pointer"
                              >
                                Padam
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10.5px]">
                        <select
                          value={postSlotDay}
                          onChange={(e) =>
                            setPostSlotDay(Number(e.target.value))
                          }
                          className="border-b border-purple-200 bg-transparent py-1 font-bold focus:outline-none"
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
                          className="flex-1 border-b border-purple-200 bg-transparent py-1 tabular-nums focus:outline-none"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={postSlotEnd}
                          onChange={(e) => setPostSlotEnd(e.target.value)}
                          className="flex-1 border-b border-purple-200 bg-transparent py-1 tabular-nums focus:outline-none"
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
                          className="px-2.5 py-1 rounded-md bg-[#F3EEFF] hover:bg-[#E5DCFF] text-[10px] font-extrabold text-[#5B18E5] shrink-0 cursor-pointer"
                        >
                          + Slot
                        </button>
                      </div>

                      {/* Side-by-Side Organizer Name & WhatsApp Phone */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Nama Penganjur / Kelab *
                          </label>
                          <input
                            type="text"
                            required
                            value={newOrganizerName}
                            onChange={(e) =>
                              setNewOrganizerName(e.target.value)
                            }
                            placeholder="Kelab / Pensyarah / Fakulti"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700">
                            No. WhatsApp Penganjur *
                          </label>
                          <input
                            type="tel"
                            required
                            value={newOrganizerPhone}
                            onChange={(e) =>
                              setNewOrganizerPhone(e.target.value)
                            }
                            placeholder="+6012-883 4910"
                            className="w-full border-b-2 border-emerald-500 focus:border-emerald-700 bg-transparent py-1 text-[11px] font-extrabold text-emerald-950 tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FLUSH BOTTOM STICKY PUBLISH DOCK (NO SELF-MATCH SCORE) */}
              <div className="shrink-0 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-t border-purple-200/80 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full h-10 px-5 rounded-full bg-gradient-to-r from-[#5B18E5] to-[#4610B8] hover:from-[#4E12C7] hover:to-[#3A0C9E] text-white font-extrabold text-[12px] shadow-[0_4px_14px_rgba(91,24,229,0.28)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Terbitkan Aktiviti ke Feed UMS</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : isSearchPageOpen ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN SEARCH, MULTI-FILTER, CATEGORY & BOOKMARKS PAGE
             --------------------------------------------------------- */
          <motion.div
            key="page-search-hub"
            initial={{opacity: 0, x: 40, scale: 0.985}}
            animate={{opacity: 1, x: 0, scale: 1}}
            exit={{opacity: 0, x: 30, scale: 0.985}}
            transition={{type: 'spring', stiffness: 390, damping: 34}}
            className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden"
          >
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

                {enrichedSearchCatalog.length === 0 ? (
                  <div className="rounded-[22px] bg-white/90 border border-white p-4 text-center space-y-2 shadow-xs">
                    <p className="text-xs font-bold text-[#141132]">
                      Tiada aktiviti kampus diterbitkan buat masa ini
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={openPostActivityPage}
                        className="px-3 py-1.5 rounded-xl bg-[#5B18E5] text-white text-[11px] font-extrabold cursor-pointer"
                      >
                        + Post Aktiviti
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          seedStarterActivities();
                          setCardIndex(0);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#EFE9FF] text-[#5B18E5] text-[11px] font-extrabold cursor-pointer"
                      >
                        Muat 3 Contoh UMS
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
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

                {/* Row 2: All UMS Faculties Filter + Sort By Selector */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-purple-100">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
                      Fakulti:
                    </span>
                    {UMS_FACULTY_CODES.map((fac) => {
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

                {/* Row 3: Official Skill & Workstyle Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 border-t border-purple-100">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 pr-0.5">
                    Kemahiran:
                  </span>
                  {OFFICIAL_FILTER_TAGS.map((tagObj) => {
                    const active = searchSkillFilters.includes(tagObj.label);
                    return (
                      <button
                        key={tagObj.id}
                        type="button"
                        onClick={() => toggleSearchSkillChip(tagObj.label)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#5B18E5] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {active ? `✓ ${tagObj.label}` : tagObj.label}
                      </button>
                    );
                  })}
                </div>

                {/* Row 4: Official Student Interests (Minat) Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 border-t border-purple-100">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 pr-0.5">
                    Minat:
                  </span>
                  {interests.map((intrObj) => {
                    const active = searchInterestFilters.includes(intrObj.id);
                    return (
                      <button
                        key={intrObj.id}
                        type="button"
                        onClick={() => toggleSearchInterestChip(intrObj.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#141132] text-white'
                            : 'bg-[#F5F1FF] text-[#4C14B8] hover:bg-[#E7DDFC]'
                        }`}
                      >
                        {active ? `✓ ${intrObj.name}` : intrObj.name}
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
                      searchSkillFilters.length > 0 ||
                      searchInterestFilters.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchCategory('All');
                          setSearchFacultyFilter('All');
                          setSearchSkillFilters([]);
                          setSearchInterestFilters([]);
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
                      Cuba kata kunci atau penapis fakulti, kemahiran, atau
                      minat lain untuk melihat aktiviti kampus UMS.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchCategory('All');
                        setSearchFacultyFilter('All');
                        setSearchSkillFilters([]);
                        setSearchInterestFilters([]);
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
          </motion.div>
        ) : activeSidePage ? (
          /* ---------------------------------------------------------
             DEDICATED FULL-SCREEN SIDE NAVIGATION PAGES
             --------------------------------------------------------- */
          <motion.div
            key={`page-side-${activeSidePage}`}
            initial={{opacity: 0, x: 42, scale: 0.985}}
            animate={{opacity: 1, x: 0, scale: 1}}
            exit={{opacity: 0, x: 30, scale: 0.985}}
            transition={{type: 'spring', stiffness: 390, damping: 34}}
            className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden"
          >
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
                    {activeSidePage === 'profile' && 'Profil Pelajar UMS'}
                    {activeSidePage === 'my-activities' && 'My Activities & SDP'}
                    {activeSidePage === 'saved-activities' &&
                      'Bookmarks & Saved'}
                    {activeSidePage === 'history' && 'History & Rekod SDP'}
                    {activeSidePage === 'calendar' && 'Calendar & Schedule'}
                    {activeSidePage === 'notifications' && 'Notifications'}
                    {activeSidePage === 'settings' && 'Settings'}
                    {activeSidePage === 'admin-panel' && 'Admin Panel'}
                  </h1>
                  <p className="text-[10.5px] font-semibold text-[#5B18E5] truncate">
                    {activeSidePage === 'profile' &&
                      `${currentUser?.programme || 'Software Engineering'} · Fakulti Komputeran dan Informatik (FKI)`}
                    {activeSidePage === 'my-activities' &&
                      'Aktiviti dianjurkan & rekod penyertaan kampus UMS'}
                    {activeSidePage === 'saved-activities' &&
                      'Koleksi tanda buku aktiviti UMS, penapis & nota pantas'}
                    {activeSidePage === 'history' &&
                      'Sejarah penyertaan aktiviti lalu & mata SDP pelajar UMS'}
                    {activeSidePage === 'calendar' &&
                      'Waktu lapang mingguan & tarikh program UMS'}
                    {activeSidePage === 'notifications' &&
                      'Makluman terkini aktiviti dan kemaskini profil'}
                    {activeSidePage === 'settings' &&
                      'Tetapan akaun, keselamatan sesi & pangkalan data'}
                    {activeSidePage === 'admin-panel' &&
                      'Urus semua aktiviti, akaun pengguna & laporan moderasi'}
                  </p>
                </div>
              </div>

              {activeSidePage === 'profile' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={openProfilePhotoModal}
                    title="Tukar Foto Profil"
                    className="w-9 h-9 rounded-full bg-white border border-purple-200 text-[#5B18E5] flex items-center justify-center hover:bg-purple-50 transition-colors shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4 stroke-[2.2]" />
                  </button>
                  <button
                    type="button"
                    onClick={openEditProfileModal}
                    className="h-9 px-3 rounded-full bg-[#5B18E5] text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 hover:bg-[#4C12C2] cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Sunting</span>
                  </button>
                </div>
              )}

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

              {activeSidePage === 'history' && (
                <button
                  type="button"
                  onClick={() => setIsAddHistoryOpen((prev) => !prev)}
                  className="h-9 px-3 rounded-full bg-[#5B18E5] hover:bg-[#4B12C2] text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAddHistoryOpen ? 'Tutup Borang' : 'Rekod Lalu'}</span>
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
                  SIDE PAGE: DEDICATED STUDENT PROFILE (Accessed via Side Nav Footer)
                 ===================================================== */}
              {activeSidePage === 'profile' && (
                <div className="flex flex-col gap-3">
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
                            title="Log Keluar dari Akaun"
                            className="h-6 px-2.5 rounded-full bg-rose-500 hover:bg-rose-600 border border-rose-300 text-white text-[10px] font-extrabold shadow-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-2.5 h-2.5 stroke-[2.5]" />
                            <span>Log Keluar</span>
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
                            <h2 className="text-[19px] font-extrabold font-display text-[#12102E] leading-none">
                              {currentUser?.display_name || 'Fahrin'}
                            </h2>
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
                      <h3 className="text-[13.5px] font-extrabold font-display text-[#12102E]">
                        About Me
                      </h3>
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
                          {myNormalizedSkills.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">
                              Tiada kemahiran lagi. Tekan + Add.
                            </span>
                          ) : (
                            myNormalizedSkills.map((sk) => (
                              <button
                                key={sk.skill_id}
                                type="button"
                                onClick={() =>
                                  removeStudentSkillById(sk.skill_id)
                                }
                                title={`Proficiency: ${sk.proficiency} (Tap to remove)`}
                                className="px-2 py-0.5 rounded-full bg-[#E6DEFF] hover:bg-[#D9CCFF] text-[#4C1D95] text-[10px] font-bold cursor-pointer"
                              >
                                {sk.name}
                              </button>
                            ))
                          )}
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
                          {myNormalizedInterests.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">
                              Tiada minat lagi. Tekan + Add.
                            </span>
                          ) : (
                            myNormalizedInterests.map((intr) => (
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
                            ))
                          )}
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
                        {myHistoryRecords.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-[#EFEAFF]/70 text-[10px] text-slate-500 text-center">
                            Tiada rekod aktiviti lepas lagi.
                          </div>
                        ) : (
                          myHistoryRecords.map((item) => (
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
                          ))
                        )}
                      </div>

                      {/* Purple Vertical Scrollbar Track Indicator */}
                      <div className="absolute right-0 top-8 bottom-1 w-1 rounded-full bg-purple-200/70 overflow-hidden pointer-events-none">
                        <div className="w-full h-1/2 rounded-full bg-[#5B18E5]" />
                      </div>
                    </div>
                  </div>

                  {/* 5. ACCOUNT SESSION & LOG OUT BAR ON PROFILE PAGE */}
                  <div className="shrink-0 rounded-[20px] bg-white/95 px-3.5 py-2.5 shadow-md border border-white/90 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-[#12102E] truncate">
                        Log Masuk Sebagai: {currentUser?.email || 'fahrin@student.ums.edu.my'}
                      </div>
                      <div className="text-[9.5px] text-slate-500">
                        Sesi disahkan melalui pelayan ProjectLink UMS
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={triggerSignOut}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[11px] font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 stroke-[2.3]" />
                      <span>Log Keluar</span>
                    </button>
                  </div>
                </div>
              )}

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

                  {/* Section A1: Activities Authored / Created by Current User (Author Mode) */}
                  <div className="rounded-[24px] bg-white/95 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-2.5 text-[#14122E]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[14px] font-extrabold font-display">
                          Aktiviti Ciptaan Anda (Author ·{' '}
                          {cardsCatalog.filter((c) => c.isOwner).length})
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Hanya aktiviti yang anda muat naik sendiri boleh
                          disunting maklumat atau ditukar gambar poster
                        </p>
                      </div>
                    </div>

                    {cardsCatalog.filter((c) => c.isOwner).length === 0 ? (
                      <div className="p-3.5 rounded-2xl bg-[#F8F6FF] border border-purple-100 text-xs text-slate-600 flex items-center justify-between gap-2">
                        <span>
                          Anda belum memuat naik sebarang aktiviti kampus.
                        </span>
                        <button
                          type="button"
                          onClick={openPostActivityPage}
                          className="px-3 py-1.5 rounded-xl bg-[#5B18E5] text-white text-[10.5px] font-extrabold shrink-0 cursor-pointer"
                        >
                          + Post Aktiviti
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cardsCatalog
                          .filter((c) => c.isOwner)
                          .map((c) => (
                            <div
                              key={c.id}
                              onClick={() => openCardInfoModal(c.id)}
                              className="p-2.5 rounded-2xl bg-[#F8F6FF] hover:bg-[#EFE9FF] border border-purple-200 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
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
                                  <span className="text-[9px] font-extrabold text-[#5B18E5] shrink-0">
                                    · Author
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                                  {c.dateText} · {c.locationText}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditProjectInfoModal(c.id);
                                  }}
                                  className="px-2 py-1.5 rounded-xl bg-[#5B18E5] text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Sunting</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditActivityBannerModal(c.id);
                                  }}
                                  className="px-2 py-1.5 rounded-xl bg-white border border-purple-200 text-[#5B18E5] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Section A2: Campus Activities by Other Organizers (Viewer Read-Only Mode) */}
                  <div className="rounded-[24px] bg-white/95 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-2.5 text-[#14122E]">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display">
                        Aktiviti Kampus UMS Lain (Mod Pelajar · Baca Sahaja)
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Tekan mana-mana aktiviti untuk lihat info penuh atau
                        hubungi penganjur di WhatsApp
                      </p>
                    </div>

                    <div className="space-y-2">
                      {cardsCatalog
                        .filter((c) => !c.isOwner)
                        .map((c) => (
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
                              <div className="text-xs font-extrabold text-[#14122E] truncate">
                                {c.title}
                              </div>
                              <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                                {c.dateText} · {c.locationText}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-700 mt-0.5 truncate">
                                Penganjur: {c.organizerName}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#5B18E5] shrink-0" />
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
                  (CONTINUOUS EDITORIAL LEDGER — NO ROUNDED SQUARE BOXES)
                 ===================================================== */}
              {activeSidePage === 'saved-activities' && (
                <div className="-mx-4 px-5 pt-4 pb-10 rounded-t-[28px] bg-[#FAF9FF] border-t border-white/90 text-[#14122E] min-h-full shadow-[0_-10px_30px_rgba(16,4,42,0.14)] space-y-5">
                  {/* Open Editorial Telemetry & Search Header */}
                  <div className="space-y-4 border-b border-purple-200/75 pb-4">
                    {/* Inline Telemetry Strip (Zero Nested Boxes) */}
                    <div className="grid grid-cols-3 divide-x divide-purple-200/80 border-y border-purple-200/70 py-2.5 text-center">
                      <div className="px-2">
                        <div className="text-base font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                          {searchCategoryCounts.Saved}
                        </div>
                        <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                          Disimpan
                        </div>
                      </div>
                      <div className="px-2">
                        <div className="text-base font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                          {filteredSavedCatalog.length > 0
                            ? `${Math.round(
                                filteredSavedCatalog.reduce(
                                  (acc, cur) => acc + cur.matchScore,
                                  0
                                ) / filteredSavedCatalog.length
                              )}%`
                            : '0%'}
                        </div>
                        <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                          Purata Skor
                        </div>
                      </div>
                      <div className="px-2">
                        <div className="text-base font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                          {filteredSavedCatalog.reduce(
                            (acc, cur) =>
                              acc + (cur.projectObj.min_weekly_hours || 6),
                            0
                          )}
                          j/mgg
                        </div>
                        <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                          Jumlah Masa
                        </div>
                      </div>
                    </div>

                    {/* Minimalist Bottom-Line Search */}
                    <div className="relative flex items-center border-b-2 border-purple-200 focus-within:border-[#5B18E5] transition-colors">
                      <Search className="w-4 h-4 text-[#5B18E5] shrink-0 mr-2.5" />
                      <input
                        type="text"
                        value={savedSearchQuery}
                        onChange={(e) => setSavedSearchQuery(e.target.value)}
                        placeholder="Cari tajuk, fakulti, atau kemahiran dalam simpanan..."
                        className="w-full py-2 bg-transparent text-xs font-semibold text-[#141132] placeholder:text-slate-400 focus:outline-none"
                      />
                      {savedSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSavedSearchQuery('')}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sliding Underline Category Filter */}
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar border-b border-purple-100">
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
                            className={`relative pb-2 text-[11px] font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                              active
                                ? 'text-[#5B18E5]'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {cat === 'All' ? 'Semua Simpanan' : cat}
                            {active && (
                              <motion.div
                                layoutId="side-saved-cat-underline"
                                transition={{
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 34,
                                }}
                                className="absolute bottom-0 inset-x-0 h-[2.5px] rounded-full bg-[#5B18E5]"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Open Editorial Ledger List */}
                  {filteredSavedCatalog.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <Bookmark className="w-8 h-8 text-[#5B18E5] mx-auto stroke-[1.8]" />
                      <div className="text-sm font-extrabold text-[#141132]">
                        Tiada Aktiviti dalam Koleksi Ini
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        Swipe ke kanan pada kad di halaman Home atau tekan ikon
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
                        className="px-5 py-2.5 rounded-full bg-[#5B18E5] text-white text-xs font-extrabold cursor-pointer"
                      >
                        Teroka Aktiviti di Home
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-purple-200/75">
                      {filteredSavedCatalog.map((item, idx) => {
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
                            className="py-5 first:pt-1 group cursor-pointer space-y-3"
                          >
                            {/* Top Editorial Index & Category Kicker */}
                            <div className="flex items-center justify-between gap-2 text-[10.5px]">
                              <div className="flex items-center gap-2 font-extrabold uppercase tracking-wider">
                                <span className="text-[#5B18E5] font-display tabular-nums">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span className="text-slate-300">/</span>
                                <span className="text-[#4E14B8]">
                                  {item.projectObj.project_type}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-500">
                                  {item.facultyLabel1}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-[#5B18E5] tabular-nums">
                                  {item.matchScore}% Match
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveProject(item.id);
                                  }}
                                  className="text-[10.5px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                                >
                                  Buang
                                </button>
                              </div>
                            </div>

                            {/* Main Split Row: Editorial Image + Typography */}
                            <div className="flex gap-3.5 items-start">
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-[#1D0642]">
                                <ActivityCardBanner
                                  cardId={item.id}
                                  bannerUrl={item.bannerUrl}
                                  bannerPreset={item.bannerPreset}
                                  bannerPositionY={item.bannerPositionY}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                                  +50 SDP
                                </span>
                              </div>

                              <div className="flex-1 min-w-0 space-y-1.5">
                                <h3 className="text-[15px] font-extrabold font-display text-[#14122E] group-hover:text-[#5B18E5] transition-colors leading-snug">
                                  {item.title}
                                </h3>
                                <div className="pt-1 border-t border-purple-100/80 space-y-0.5 text-[11px] text-slate-600 font-medium">
                                  <div className="truncate">
                                    {item.dateText} · {item.locationText}
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 truncate">
                                    {item.projectObj.slots_needed || 4} ahli (
                                    {item.projectObj.min_weekly_hours || 6}j/mgg) ·{' '}
                                    {item.organizerName}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Inline Dot-Style Personal Note Switcher */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-between gap-2 pt-1 text-[10.5px]"
                            >
                              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                                {[
                                  'Prioriti Utama',
                                  'Ajak Kawan FKI',
                                  'Tanya Penganjur',
                                ].map((lbl) => {
                                  const isSelected = currentNote === lbl;
                                  return (
                                    <button
                                      key={lbl}
                                      type="button"
                                      onClick={() =>
                                        setBookmarkNotes((prev) => ({
                                          ...prev,
                                          [item.id]: lbl,
                                        }))
                                      }
                                      className={`font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'text-[#5B18E5] underline underline-offset-4'
                                          : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      {isSelected ? `● ${lbl}` : lbl}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCardInfoModal(item.id);
                                  }}
                                  className="text-[11px] font-extrabold text-[#5B18E5] hover:underline cursor-pointer"
                                >
                                  Info →
                                </button>
                                <a
                                  href={itemWaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-3 py-1 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-[10.5px] font-extrabold flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle className="w-3 h-3 fill-current" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* =====================================================
                  SIDE PAGE: HISTORY & REKOD PENYERTAAN SDP PELAJAR
                  (CONTINUOUS EDITORIAL SHEET — NO ROUNDED SQUARE BOXES)
                 ===================================================== */}
              {activeSidePage === 'history' && (
                <div className="-mx-4 px-4 pt-3.5 pb-12 rounded-t-[28px] bg-[#FAF9FF] border-t border-white/95 text-[#14122E] min-h-full shadow-[0_-10px_30px_rgba(16,4,42,0.14)] divide-y divide-purple-200/75">
                  {/* 1. EDITORIAL HEADER & INLINE SDP TELEMETRY STRIP */}
                  <div className="pb-3.5 space-y-3">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#5B18E5] flex items-center gap-1">
                          <History className="w-3 h-3 stroke-[2.5]" />
                          <span>Transkrip Ko-Kurikulum &amp; SDP UMS</span>
                        </div>
                        <h2 className="text-[18px] font-extrabold font-display tracking-tight text-[#14122E] leading-tight mt-0.5">
                          Sejarah Penyertaan Lalu
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModal('sdp-info')}
                        className="text-[10.5px] font-extrabold text-[#5B18E5] hover:underline cursor-pointer shrink-0"
                      >
                        Info SDP →
                      </button>
                    </div>

                    {/* 3-Column Hairline Telemetry Strip (Zero Box) */}
                    <div className="grid grid-cols-3 divide-x divide-purple-200/80 border-y border-purple-200/75 py-2.5 text-center">
                      <div className="px-1.5">
                        <div className="text-[17px] font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                          {totalSdpPoints}
                        </div>
                        <div className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                          Jumlah SDP
                        </div>
                      </div>
                      <div className="px-1.5">
                        <div className="text-[17px] font-extrabold font-display text-[#14122E] tabular-nums leading-none">
                          {myHistoryRecords.length}
                        </div>
                        <div className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                          Rekod Aktiviti
                        </div>
                      </div>
                      <div className="px-1.5">
                        <div className="text-[17px] font-extrabold font-display text-amber-600 tabular-nums leading-none">
                          {myHistoryRecords.length > 0
                            ? Math.round(
                                totalSdpPoints / myHistoryRecords.length
                              )
                            : 0}
                        </div>
                        <div className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                          Purata / Program
                        </div>
                      </div>
                    </div>

                    {/* Slim SDP Graduation Milestone Progress Strip */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-500">
                          Sasaran Kepemimpinan &amp; Graduasi UMS (200 SDP)
                        </span>
                        <span className="font-extrabold text-[#5B18E5] tabular-nums">
                          {Math.min(
                            100,
                            Math.round((totalSdpPoints / 200) * 100)
                          )}
                          % ({totalSdpPoints}/200 SDP)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-purple-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#5B18E5] via-[#7C3AED] to-[#F59E0B] transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((totalSdpPoints / 200) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. COLLAPSIBLE INLINE ADD PAST RECORD FORM */}
                  <div className="py-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddHistoryOpen((prev) => !prev)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F3EEFF] via-[#F7F4FF] to-white border border-purple-200/90 flex items-center justify-between gap-2 text-left hover:border-[#5B18E5]/50 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-md bg-gradient-to-br from-[#5B18E5] to-[#4310B8] text-white text-[10px] font-extrabold shrink-0">
                          +
                        </span>
                        <span className="text-[11px] font-extrabold font-display uppercase tracking-wide text-[#14122E] truncate">
                          Log Rekod Penyertaan Aktiviti Lalu
                        </span>
                      </div>
                      <span className="w-6 h-6 rounded-md bg-white border border-purple-200/80 flex items-center justify-center text-[#5B18E5] shrink-0">
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isAddHistoryOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </span>
                    </button>

                    {isAddHistoryOpen && (
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
                          setIsAddHistoryOpen(false);
                        }}
                        className="pt-3 space-y-2.5 text-[11px]"
                      >
                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Nama Program / Aktiviti Lalu *
                          </label>
                          <input
                            type="text"
                            required
                            value={newHistTitle}
                            onChange={(e) => setNewHistTitle(e.target.value)}
                            placeholder="cth. Borneo AI & Smart Campus Hackathon 2025"
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11.5px] font-bold text-[#14122E] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                              Tarikh / Sesi
                            </label>
                            <input
                              type="text"
                              value={newHistDate}
                              onChange={(e) => setNewHistDate(e.target.value)}
                              placeholder="Okt 2026"
                              className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                              Peranan Anda
                            </label>
                            <input
                              type="text"
                              value={newHistRole}
                              onChange={(e) => setNewHistRole(e.target.value)}
                              placeholder="AJK / Peserta"
                              className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                              Mata SDP
                            </label>
                            <input
                              type="number"
                              min={5}
                              max={200}
                              value={newHistSdp}
                              onChange={(e) =>
                                setNewHistSdp(Number(e.target.value) || 30)
                              }
                              className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-extrabold text-[#5B18E5] tabular-nums focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            Ringkasan Sumbangan / Pencapaian
                          </label>
                          <input
                            type="text"
                            value={newHistSummary}
                            onChange={(e) => setNewHistSummary(e.target.value)}
                            placeholder="cth. Membangunkan prototaip sistem atau mengurus logistik peserta..."
                            className="w-full border-b border-purple-200 focus:border-[#5B18E5] bg-transparent py-1 text-[11px] font-medium focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddHistoryOpen(false)}
                            className="px-3 py-1 rounded-full text-[10.5px] font-extrabold text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-full bg-[#5B18E5] hover:bg-[#4A11C4] text-white text-[10.5px] font-extrabold shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            Simpan Rekod SDP →
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* 3. BOTTOM-BORDER SEARCH & UNDERLINE ROLE FILTER TABS */}
                  <div className="py-3 space-y-2.5">
                    <div className="relative flex items-center border-b border-purple-200 focus-within:border-[#5B18E5] pb-1.5 transition-colors">
                      <Search className="w-3.5 h-3.5 text-[#5B18E5] mr-2 shrink-0 stroke-[2.3]" />
                      <input
                        type="text"
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        placeholder="Cari nama aktiviti lalu, peranan, atau tarikh..."
                        className="w-full bg-transparent text-[11.5px] font-semibold text-[#14122E] placeholder:text-slate-400 focus:outline-none"
                      />
                      {historySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setHistorySearchQuery('')}
                          className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                        >
                          Padam
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar border-b border-purple-100">
                      {(
                        [
                          {id: 'all', label: `Semua (${myHistoryRecords.length})`},
                          {id: 'leadership', label: 'AJK & Penganjur'},
                          {id: 'participant', label: 'Peserta & Ahli'},
                          {id: 'high-sdp', label: 'SDP Tinggi (≥40)'},
                        ] as const
                      ).map((tab) => {
                        const active = historyRoleFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setHistoryRoleFilter(tab.id)}
                            className={`pb-2 text-[11px] font-extrabold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                              active
                                ? 'border-[#5B18E5] text-[#5B18E5]'
                                : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. CONTINUOUS CHRONOLOGICAL HISTORY STREAM (DIVIDE-Y) */}
                  {filteredHistoryRecords.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <div className="text-[13px] font-extrabold text-[#14122E]">
                        Tiada rekod sejarah ditemui
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto">
                        Cuba tukar penapis carian atau tambah rekod penyertaan
                        aktiviti lalu anda di atas.
                      </p>
                      {(historySearchQuery || historyRoleFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setHistorySearchQuery('');
                            setHistoryRoleFilter('all');
                          }}
                          className="text-[11px] font-extrabold text-[#5B18E5] underline cursor-pointer"
                        >
                          Reset Penapis History
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-purple-200/75">
                      {filteredHistoryRecords.map((act, idx) => (
                        <div
                          key={act.id}
                          onClick={() => {
                            setSelectedHistoryItem(act);
                            setActiveModal('history-detail');
                          }}
                          className="py-3.5 space-y-1.5 group cursor-pointer active:bg-purple-50/50 transition-colors"
                        >
                          {/* Top Metadata Index & SDP Score Line */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="inline-flex items-center justify-center min-w-[22px] h-4.5 px-1 rounded bg-[#EFE9FF] text-[#5B18E5] font-mono text-[9.5px] font-extrabold tabular-nums shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B18E5] truncate">
                                {act.role}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                                {act.date_display}
                              </span>
                            </div>

                            <span className="px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-[10px] font-extrabold tabular-nums shrink-0">
                              +{act.sdp_earned} SDP
                            </span>
                          </div>

                          {/* Activity Title & Summary */}
                          <div className="pl-7 space-y-1">
                            <h3 className="text-[13.5px] font-extrabold font-display text-[#14122E] group-hover:text-[#5B18E5] transition-colors leading-snug">
                              {act.title}
                            </h3>
                            {act.summary && (
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {act.summary}
                              </p>
                            )}
                            <div className="pt-0.5 flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Disahkan dalam Transkrip SDP UMS</span>
                              </span>
                              <span className="font-extrabold text-[#5B18E5] group-hover:underline">
                                Lihat Butiran →
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  SIDE PAGE 5: CLEAN ACCOUNT & APP SETTINGS (2-Role System: Admin & User)
                 ===================================================== */}
              {activeSidePage === 'settings' && (
                <>
                  {/* Card 0: Backend Session & Account Security (/api/auth) */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-3 text-[#14122E] text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-[14px] font-extrabold font-display">
                          Sesi Log Masuk &amp; Keselamatan Akaun
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Status pengesahan pelayan <code>/api/auth</code>
                        </p>
                      </div>
                      <span className="text-emerald-700 text-[10.5px] font-extrabold">
                        Sesi Aktif · {isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-[#F6F3FF] border border-purple-100 p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[12.5px] font-extrabold text-[#141132]">
                          {currentUser?.display_name} ({currentUser?.matric_no || 'UMS'})
                        </div>
                        {isAdmin && (
                          <span className="text-[10px] font-extrabold text-[#5B18E5]">
                            Role: Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5B18E5] font-semibold">
                        {currentUser?.email || 'fahrin@student.ums.edu.my'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {currentUser?.faculty || 'Universiti Malaysia Sabah'} · Peranan:{' '}
                        <span className="font-bold text-[#141132]">
                          {isAdmin ? 'admin (fahrinmuneer3@gmail.com)' : 'user'}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSidebarItem('Admin Panel');
                          setActiveSidePage('admin-panel');
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#141132] hover:bg-[#1E1848] text-white font-extrabold text-[11.5px] flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Buka Admin Panel (Urus Sistem)</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(
                            currentUser?.email || 'fahrin@student.ums.edu.my'
                          );
                          setActiveSidePage(null);
                          switchAuthStage('forgot-password');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-[#F2ECFF] hover:bg-[#E5DAFF] text-[#5B18E5] font-extrabold text-[11.5px] cursor-pointer"
                      >
                        Tukar Kata Laluan
                      </button>

                      <button
                        type="button"
                        onClick={triggerSignOut}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11.5px] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Keluar</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 1: Profile & Availability Settings */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-3.5 text-[#14122E] text-xs">
                    <div>
                      <h2 className="text-[14px] font-extrabold font-display">
                        Tetapan Profil &amp; Ketersediaan
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Kemas kini status ketersediaan atau uji pertukaran akaun User / Admin
                      </p>
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

                    {/* Switch Active Account for Testing User vs Admin */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700">
                        Tukar Akaun Pantas (Ujian Role User vs Admin):
                      </label>
                      <select
                        value={currentUser?.id || ''}
                        onChange={(e) => switchPersona(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-bold bg-white"
                      >
                        {profiles.map((p) => {
                          const pRole =
                            p.role === 'admin' ||
                            p.is_admin ||
                            p.email?.toLowerCase() === 'fahrinmuneer3@gmail.com'
                              ? 'ADMIN'
                              : 'USER';
                          return (
                            <option key={p.id} value={p.id}>
                              [{pRole}] {p.display_name} —{' '}
                              {p.email || p.matric_no || 'UMS'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={openEditProfileModal}
                      className="w-full py-2.5 rounded-xl bg-[#F2ECFF] hover:bg-[#E5DAFF] text-[#5B18E5] font-extrabold cursor-pointer"
                    >
                      Sunting Maklumat Profil ({currentUser?.display_name})
                    </button>
                  </div>

                  {/* Card 2: Quick Post Activity & Database Actions */}
                  <div className="rounded-[24px] bg-white/96 border border-white p-4 shadow-[0_10px_24px_rgba(20,5,58,0.18)] space-y-2.5 text-[#14122E] text-xs">
                    <div className="font-extrabold text-[14px] font-display">
                      Aktiviti &amp; Pangkalan Data
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Siarkan aktiviti baharu atau tetapkan semula data pangkalan data kepada asal.
                    </p>
                    <button
                      type="button"
                      onClick={openPostActivityPage}
                      className="w-full py-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold cursor-pointer"
                    >
                      + Post Aktiviti / Projek Baharu
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

              {/* =====================================================
                  SIDE PAGE 6: DEDICATED ADMIN PANEL (Role: 'admin' only)
                  Manage all activities, registered users, and moderation reports
                 ===================================================== */}
              {activeSidePage === 'admin-panel' && (
                <>
                  {/* Top Admin Summary & KPI Strip */}
                  <div className="rounded-[24px] bg-[#141132] text-white p-4 shadow-[0_14px_32px_rgba(12,3,36,0.35)] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#5B18E5] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-extrabold font-display truncate">
                            Kawalan Pentadbir Sistem
                          </div>
                          <div className="text-[10.5px] text-purple-200/85 truncate">
                            {currentUser?.email || 'fahrinmuneer3@gmail.com'} · Role: Admin
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openPostActivityPage}
                        className="px-3 py-1.5 rounded-xl bg-white text-[#141132] text-[11px] font-extrabold shrink-0 cursor-pointer"
                      >
                        + Aktiviti
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="rounded-2xl bg-white/10 px-2.5 py-2">
                        <div className="text-[17px] font-extrabold font-display tabular-nums">
                          {projects.length}
                        </div>
                        <div className="text-[10px] text-purple-200/80">
                          Aktiviti
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-2.5 py-2">
                        <div className="text-[17px] font-extrabold font-display tabular-nums">
                          {profiles.length}
                        </div>
                        <div className="text-[10px] text-purple-200/80">
                          Pengguna
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-2.5 py-2">
                        <div className="text-[17px] font-extrabold font-display text-amber-300 tabular-nums">
                          {openReportsCount}
                        </div>
                        <div className="text-[10px] text-purple-200/80">
                          Laporan Aktif
                        </div>
                      </div>
                    </div>

                    {/* 3 Segmented Control Tabs: Aktiviti | Pengguna | Laporan */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/10">
                      {(
                        [
                          {id: 'activities', label: `Aktiviti (${projects.length})`},
                          {id: 'users', label: `Pengguna (${profiles.length})`},
                          {id: 'reports', label: `Laporan (${reports.length})`},
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAdminTab(tab.id)}
                          className={`py-2 px-2 rounded-lg text-[11px] font-extrabold transition-colors whitespace-nowrap truncate cursor-pointer ${
                            adminTab === tab.id
                              ? 'bg-white text-[#141132] shadow-xs'
                              : 'text-purple-100/80 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Filter Bar for Activities & Users */}
                  {adminTab !== 'reports' && (
                    <div className="rounded-2xl bg-white/95 border border-white px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#5B18E5] shrink-0" />
                      <input
                        type="text"
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        placeholder={
                          adminTab === 'activities'
                            ? 'Cari tajuk aktiviti, lokasi atau penganjur...'
                            : 'Cari nama pengguna, e-mel atau No. Matrik...'
                        }
                        className="w-full bg-transparent text-xs font-medium text-[#141132] placeholder:text-slate-400 focus:outline-none"
                      />
                      {adminSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setAdminSearchQuery('')}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* TAB 1: MANAGE ALL ACTIVITIES */}
                  {adminTab === 'activities' && (
                    <div className="space-y-2.5">
                      {projects.length === 0 ? (
                        <div className="rounded-[22px] bg-white/96 border border-white p-5 text-center space-y-3 text-xs text-[#14122E]">
                          <div className="font-extrabold text-sm text-[#141132]">
                            Tiada Aktiviti Diterbitkan Lagi
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Katalog aktiviti kampus kini kosong. Anda boleh
                            menerbitkan aktiviti baharu atau memuatkan 3 aktiviti
                            contoh UMS dengan satu klik.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={openPostActivityPage}
                              className="px-3.5 py-2 rounded-xl bg-[#5B18E5] text-white font-extrabold text-[11px] cursor-pointer"
                            >
                              + Post Aktiviti
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                seedStarterActivities();
                                setCardIndex(0);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#EFE9FF] text-[#5B18E5] font-extrabold text-[11px] cursor-pointer"
                            >
                              Muat 3 Contoh UMS
                            </button>
                          </div>
                        </div>
                      ) : (
                        projects
                          .filter((proj) => {
                            const q = adminSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              proj.title.toLowerCase().includes(q) ||
                              (proj.location || '').toLowerCase().includes(q) ||
                              (proj.organizer_name || '')
                                .toLowerCase()
                                .includes(q)
                            );
                          })
                          .map((proj) => (
                            <div
                              key={proj.id}
                              className="rounded-[22px] bg-white/96 border border-white p-3.5 shadow-[0_8px_22px_rgba(14,3,38,0.16)] space-y-2.5 text-xs text-[#14122E]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-extrabold text-[13.5px] font-display text-[#141132] truncate">
                                    {proj.title}
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                                    {proj.project_type} · {proj.location || 'UMS'} ·{' '}
                                    {proj.organizer_name || 'UMS'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => adminDeleteProject(proj.id)}
                                  title="Padam Aktiviti"
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Status Segmented Control: Open | Closed | Completed */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                <span className="text-[10.5px] font-bold text-slate-500">
                                  Status Siaran:
                                </span>
                                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                                  {(
                                    ['open', 'closed', 'completed'] as ProjectStatus[]
                                  ).map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() =>
                                        adminUpdateProjectStatus(proj.id, st)
                                      }
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                                        proj.status === st
                                          ? 'bg-[#5B18E5] text-white shadow-2xs'
                                          : 'text-slate-600 hover:text-[#141132]'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: MANAGE REGISTERED USERS */}
                  {adminTab === 'users' && (
                    <div className="space-y-2.5">
                      {profiles
                        .filter((prof) => {
                          const q = adminSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            prof.display_name.toLowerCase().includes(q) ||
                            (prof.email || '').toLowerCase().includes(q) ||
                            (prof.matric_no || '').toLowerCase().includes(q) ||
                            (prof.faculty_short || '')
                              .toLowerCase()
                              .includes(q)
                          );
                        })
                        .map((prof) => {
                          const profIsAdmin =
                            prof.role === 'admin' ||
                            prof.is_admin ||
                            prof.email?.toLowerCase() ===
                              'fahrinmuneer3@gmail.com';
                          return (
                            <div
                              key={prof.id}
                              className="rounded-[22px] bg-white/96 border border-white p-3.5 shadow-[0_8px_22px_rgba(14,3,38,0.16)] flex items-center justify-between gap-3 text-xs text-[#14122E]"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-[13px] text-[#141132] truncate">
                                    {prof.display_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">·</span>
                                  <span
                                    className={`text-[10px] font-extrabold uppercase ${
                                      profIsAdmin
                                        ? 'text-[#5B18E5]'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {profIsAdmin ? 'admin' : 'user'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-[#5B18E5] truncate mt-0.5">
                                  {prof.email || 'Tiada e-mel'}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {prof.matric_no || 'UMS'} ·{' '}
                                  {prof.faculty_short || 'UMS'} ·{' '}
                                  {prof.availability_status || 'Available'}
                                </div>
                              </div>

                              {!profIsAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => adminDeleteUser(prof.id)}
                                  title="Padam Akaun Pengguna"
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10.5px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Padam</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-extrabold text-emerald-700 shrink-0">
                                  Admin Utama
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* TAB 3: MANAGE MODERATION REPORTS */}
                  {adminTab === 'reports' && (
                    <div className="space-y-3">
                      {reports.map((rep) => {
                        const reporter = profiles.find(
                          (p) => p.id === rep.reporter_id
                        );
                        const targetProj = projects.find(
                          (p) => p.id === rep.target_id
                        );
                        const noteVal =
                          adminReportNotes[rep.id] ??
                          rep.resolution_note ??
                          '';

                        return (
                          <div
                            key={rep.id}
                            className="rounded-[22px] bg-white/96 border border-white p-3.5 shadow-[0_8px_22px_rgba(14,3,38,0.16)] space-y-2.5 text-xs text-[#14122E]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-extrabold text-[13px] text-[#141132] truncate">
                                  {targetProj?.title || rep.target_id}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Dilaporkan oleh{' '}
                                  {reporter?.display_name || 'Pengguna UMS'} ·{' '}
                                  Status:{' '}
                                  <span className="font-extrabold uppercase text-[#5B18E5]">
                                    {rep.status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-[11.5px] text-slate-700 bg-[#F6F3FF] rounded-xl p-2.5">
                              {rep.reason}
                            </p>

                            {rep.status === 'open' ? (
                              <div className="space-y-2 pt-1">
                                <input
                                  type="text"
                                  value={noteVal}
                                  onChange={(e) =>
                                    setAdminReportNotes((prev) => ({
                                      ...prev,
                                      [rep.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Nota tindakan Admin (pilihan)..."
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] focus:outline-none focus:border-[#5B18E5]"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      resolveReport(
                                        rep.id,
                                        'resolved',
                                        noteVal ||
                                          'Telah disemak dan diambil tindakan oleh Admin.'
                                      )
                                    }
                                    className="py-2 rounded-xl bg-[#5B18E5] text-white font-extrabold text-[11px] cursor-pointer"
                                  >
                                    Selesaikan (Resolve)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      resolveReport(
                                        rep.id,
                                        'dismissed',
                                        noteVal || 'Laporan ditutup tanpa perubahan.'
                                      )
                                    }
                                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    Tolak (Dismiss)
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10.5px] text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                                Nota Admin:{' '}
                                {rep.resolution_note || 'Diselesaikan oleh Admin.'}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Quick Submit New Moderation Report Card */}
                      <div className="rounded-[22px] bg-white/95 border border-white p-3.5 shadow-sm space-y-2 text-xs text-[#14122E]">
                        <div className="font-extrabold text-[12.5px] flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5 text-[#5B18E5]" />
                          <span>Rekod Laporan Moderasi Baharu</span>
                        </div>
                        <select
                          value={newReportTargetId}
                          onChange={(e) => setNewReportTargetId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11.5px] font-semibold bg-white"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              Aktiviti: {p.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newReportReason}
                          onChange={(e) => setNewReportReason(e.target.value)}
                          placeholder="Sebab laporan atau catatan semakan..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11.5px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newReportReason.trim()) return;
                            submitReport({
                              target_type: 'project',
                              target_id: newReportTargetId,
                              reason: newReportReason.trim(),
                            });
                            setNewReportReason('');
                            notifyToast(
                              'Laporan Direkodkan',
                              'Laporan baharu telah ditambah ke senarai moderasi.',
                              'success'
                            );
                          }}
                          className="w-full py-2 rounded-xl bg-[#141132] text-white font-extrabold text-[11.5px] cursor-pointer"
                        >
                          Tambah Laporan
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'home' ? (
          /* ---------------------------------------------------------
             PAGE 1: HOME SCREEN (Scrollable with comfortable spacing & spring transition)
             --------------------------------------------------------- */
          <motion.div
            key="tab-page-home"
            initial={{opacity: 0, x: -26, scale: 0.99}}
            animate={{opacity: 1, x: 0, scale: 1}}
            exit={{opacity: 0, x: -20, scale: 0.99}}
            transition={{type: 'spring', stiffness: 390, damping: 34}}
            className="relative z-10 flex-1 min-h-0 px-4 pt-1 pb-5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-y-contain"
          >
            {/* A. MULTI-CARD LOOPING STACK (Swipe Left = Buang from current deck | Swipe Right = Simpan to Bookmarks) */}
            <div className="relative pt-3 select-none shrink-0">
              {dismissedCardIds.length > 0 && activeDeckCards.length > 0 && (
                <div className="mb-2.5 px-3 py-1.5 rounded-2xl bg-[#240954]/85 border border-purple-300/35 flex items-center justify-between text-[11px] text-purple-100 shadow-sm">
                  <span>
                    <strong className="text-white">
                      {activeDeckCards.length}
                    </strong>{' '}
                    kad aktif ·{' '}
                    <span className="text-rose-300 font-semibold">
                      {dismissedCardIds.length} dibuang
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {lastDismissedCardId && (
                      <button
                        type="button"
                        onClick={undoLastDismissedCard}
                        className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-amber-200 font-extrabold text-[10px] cursor-pointer"
                      >
                        Undo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetDismissedDeck}
                      className="px-2 py-0.5 rounded-lg bg-[#6215E5] hover:bg-[#5210C4] text-white font-extrabold text-[10px] cursor-pointer"
                    >
                      Muat Semula
                    </button>
                  </div>
                </div>
              )}

              {activeDeckCards.length === 0 ? (
                <div className="rounded-[26px] p-[2px] bg-gradient-to-b from-white/95 via-purple-200/85 to-purple-400/50 shadow-[0_12px_30px_rgba(24,4,64,0.32)]">
                  <div className="rounded-[24px] bg-[#F7F5FF] p-6 text-center space-y-3 text-[#14122E]">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAE2FF] border border-[#D8C7FF] text-[#5B18E5] flex items-center justify-center mx-auto shadow-xs">
                      {cardsCatalog.length === 0 ? (
                        <Plus className="w-6 h-6 stroke-[2.4]" />
                      ) : (
                        <RefreshCw className="w-6 h-6 stroke-[2.2]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-extrabold font-display text-[#11102E]">
                        {cardsCatalog.length === 0
                          ? 'Belum Ada Aktiviti Kampus Diterbitkan'
                          : 'Semua Kad Aktiviti Telah Disemak'}
                      </h2>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {cardsCatalog.length === 0
                          ? 'Semua data contoh telah dibersihkan. Tekan butang di bawah untuk menerbitkan aktiviti atau projek pertama di ProjectLink UMS.'
                          : `Anda telah membuang semua ${dismissedCardIds.length} kad daripada senarai semasa. Muat semula timbunan kad untuk meneroka semula aktiviti kampus UMS.`}
                      </p>
                    </div>
                    <div className="pt-1 flex flex-col gap-2">
                      {cardsCatalog.length === 0 ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={openPostActivityPage}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#6215E5] hover:bg-[#5011BE] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Post Aktiviti Pertama</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              seedStarterActivities();
                              setCardIndex(0);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#EFE9FF] hover:bg-[#E2D6FF] text-[#4C14B8] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-[#6215E5]" />
                            <span>Muat 6 Aktiviti Contoh Rentas Fakulti</span>
                          </button>
                        </div>
                      ) : homeStrictFilterMode && selectedTags.length > 0 ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHomeStrictFilterMode(false);
                              setCardIndex(0);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#6215E5] hover:bg-[#5011BE] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Papar Semua Kad Mengikut Skor</span>
                          </button>
                          {dismissedCardIds.length > 0 && (
                            <button
                              type="button"
                              onClick={resetDismissedDeck}
                              className="w-full py-2 px-4 rounded-xl bg-[#EFE9FF] text-[#4C14B8] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Muat Semula Kad Dibuang</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={resetDismissedDeck}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#6215E5] hover:bg-[#5011BE] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Muat Semula Semua Kad</span>
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        {lastDismissedCardId && (
                          <button
                            type="button"
                            onClick={undoLastDismissedCard}
                            className="flex-1 py-2 px-3 rounded-xl bg-white border border-purple-200 text-[#3F1994] text-xs font-bold hover:bg-purple-50 cursor-pointer"
                          >
                            Undo Kad Terakhir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('activity');
                            setActiveSidePage(null);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#EAE2FF] text-[#5B18E5] text-xs font-extrabold hover:bg-[#DFD2FF] cursor-pointer"
                        >
                          Lihat Bookmarks ({searchCategoryCounts.Saved})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                (activeDeckCards.length >= 3
                  ? [2, 1, 0]
                  : activeDeckCards.length === 2
                  ? [1, 0]
                  : [0]
                ).map((stackOffset) => {
                  const stepNumber = cardIndex + stackOffset;
                  const cardItem =
                    activeDeckCards[stepNumber % activeDeckCards.length] ||
                    activeDeckCards[0];
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
                      key={`deck-card-${cardItem.id}-offset-${stackOffset}`}
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
                      {/* Dynamic Swipe Stamps on Front Card while dragging (Left = BUANG, Right = SIMPAN) */}
                      {isFront &&
                        (dragOffset.x < -25 || flyOffDir === 'left') && (
                          <div className="absolute top-12 right-4 z-30 pointer-events-none px-3.5 py-1 rounded-xl bg-rose-600/95 border-2 border-white text-white font-extrabold text-xs tracking-wider uppercase shadow-xl transform rotate-12">
                            ← BUANG
                          </div>
                        )}
                      {isFront &&
                        (dragOffset.x > 25 || flyOffDir === 'right') && (
                          <div className="absolute top-12 left-4 z-30 pointer-events-none px-3.5 py-1 rounded-xl bg-[#5B18E5]/95 border-2 border-white text-white font-extrabold text-xs tracking-wider uppercase shadow-xl transform -rotate-12">
                            SIMPAN &amp; INFO →
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
                            {activeDeckCards.slice(0, 4).map((c, dotIdx) => {
                              const isActiveDot =
                                stepNumber % activeDeckCards.length === dotIdx;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardIndex(dotIdx);
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

                          {/* Interactive Swipe Guide Row (Swipe Left = Buang | Swipe Right = Simpan & Info) */}
                          <div className="mt-2 pt-1.5 border-t border-purple-200/60 flex items-center justify-between text-[10px] font-semibold italic text-[#3F1994]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerSwipeLeft();
                              }}
                              className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-600 cursor-pointer"
                            >
                              <span className="not-italic font-bold">←</span>
                              <span>Swipe kiri untuk buang</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerSwipeRight();
                              }}
                              className="inline-flex items-center gap-1 text-[#5B18E5] hover:text-[#4B0FB8] cursor-pointer"
                            >
                              <span>Swipe kanan untuk simpan &amp; info</span>
                              <span className="not-italic font-bold">→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
                  onClick={() =>
                    currentCard
                      ? openCardInfoModal(currentCard.id)
                      : openPostActivityPage()
                  }
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
                        strokeDashoffset={
                          currentCard ? ringOffset : ringCircumference
                        }
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-[stroke-dashoffset] duration-75 ease-out"
                      />
                    </svg>

                    <span
                      key={`num-pop-${matchAnimKey}`}
                      className="animate-match-number-pop absolute text-[21px] font-extrabold font-display text-[#12102E] tracking-tight tabular-nums"
                    >
                      {currentCard ? `${effectiveRingScore}%` : '--'}
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
                      onClick={() =>
                        currentCard
                          ? openCardInfoModal(currentCard.id)
                          : openPostActivityPage()
                      }
                      className="text-[11px] font-bold text-[#3B188C] hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      <span>{currentCard ? 'see more...' : 'post activity'}</span>
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
                        {!currentCard
                          ? 'Sedia Dipadankan'
                          : matchData.score >= 70
                          ? 'High Match!'
                          : 'Good Match!'}
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
                    {currentCard ? (
                      <>
                        Great fit! This activity matches{' '}
                        <span className="font-bold tabular-nums text-[#4C1D95]">
                          {effectiveRingScore}%
                        </span>{' '}
                        of your interests and profile.
                      </>
                    ) : (
                      'Terbitkan aktiviti atau muat contoh UMS untuk melihat padanan kemahiran & masa anda.'
                    )}
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

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHomeStrictFilterMode((prev) => !prev);
                      setCardIndex(0);
                    }}
                    className={`text-[11.5px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                      homeStrictFilterMode
                        ? 'bg-amber-300 text-[#141132] border-amber-200'
                        : 'bg-white/10 text-white/85 border-white/30 hover:bg-white/20'
                    }`}
                  >
                    {homeStrictFilterMode ? 'Tapis Ketat: ON' : 'Susun Skor'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="text-[13px] font-semibold inline-flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    <Shuffle className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Randomize</span>
                  </button>
                </div>
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
                      onClick={() => handleToggleHomeFilter(label)}
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
                  onClick={() => handleToggleHomeFilter('Extrovert')}
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
                  onClick={() => handleToggleHomeFilter('Female only')}
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
                    onClick={() => handleToggleHomeFilter(tag)}
                    className="h-[32px] px-3 rounded-full bg-white/20 border border-white/75 text-white text-[11.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.14)]"
                  >
                    <span>{tag}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ---------------------------------------------------------
             PAGE 2: ACTIVITY SCREEN (SAVED ACTIVITIES HUB)
             (CONTINUOUS EDITORIAL MAGAZINE STREAM — NO ROUNDED SQUARE BOXES)
             --------------------------------------------------------- */
          <motion.div
            key="tab-page-activity"
            initial={{opacity: 0, x: 26, scale: 0.99}}
            animate={{opacity: 1, x: 0, scale: 1}}
            exit={{opacity: 0, x: 20, scale: 0.99}}
            transition={{type: 'spring', stiffness: 390, damping: 34}}
            className="relative z-10 flex-1 min-h-0 rounded-t-[28px] bg-[#FAF9FF] border-t border-white/90 text-[#14122E] px-5 pt-4 pb-24 flex flex-col overflow-y-auto no-scrollbar overscroll-y-contain shadow-[0_-10px_28px_rgba(14,3,38,0.2)]"
          >
            {/* 1. OPEN EDITORIAL MASTHEAD & LIVE TELEMETRY STRIP */}
            <div className="border-b border-purple-200/80 pb-4 space-y-4 shrink-0">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B18E5] flex items-center gap-1.5">
                    <Bookmark className="w-3 h-3 fill-current" />
                    <span>Arkib Pilihan Pelajar</span>
                  </div>
                  <h2 className="text-[20px] font-extrabold font-display leading-tight text-[#141132] tracking-tight mt-0.5">
                    Aktiviti Disimpan
                  </h2>
                </div>

                {/* Inline Telemetry Numbers (Zero Boxy Pills) */}
                <div className="flex items-center divide-x divide-purple-200/80 text-right">
                  <div className="pr-3">
                    <div className="text-sm font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                      {searchCategoryCounts.Saved}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      Simpanan
                    </div>
                  </div>
                  <div className="px-3">
                    <div className="text-sm font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                      {filteredSavedCatalog.length > 0
                        ? `${Math.round(
                            filteredSavedCatalog.reduce(
                              (acc, cur) => acc + cur.matchScore,
                              0
                            ) / filteredSavedCatalog.length
                          )}%`
                        : '0%'}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      Purata
                    </div>
                  </div>
                  <div className="pl-3">
                    <div className="text-sm font-extrabold font-display text-[#5B18E5] tabular-nums leading-none">
                      {filteredSavedCatalog.reduce(
                        (acc, cur) =>
                          acc + (cur.projectObj.min_weekly_hours || 6),
                        0
                      )}
                      j
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      Seminggu
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimalist Bottom-Border Editorial Search */}
              <div className="relative flex items-center border-b-2 border-purple-200 focus-within:border-[#5B18E5] transition-colors">
                <Search className="w-4 h-4 text-[#5B18E5] shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={savedSearchQuery}
                  onChange={(e) => setSavedSearchQuery(e.target.value)}
                  placeholder="Cari aktiviti disimpan mengikut tajuk, lokasi, kemahiran..."
                  className="w-full py-2 bg-transparent text-xs font-semibold text-[#141132] placeholder:text-slate-400 focus:outline-none"
                />
                {savedSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSavedSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sliding Underline Category Tabs */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1 border-b border-purple-100">
                  {[
                    {
                      id: 'All',
                      label: 'Semua',
                      count: searchCategoryCounts.Saved,
                    },
                    {
                      id: 'High Match',
                      label: 'Padanan >70%',
                      count: searchCategoryCounts['High Match'] || 0,
                    },
                    {
                      id: 'Competition',
                      label: 'Competition',
                      count: searchCategoryCounts.Competition || 0,
                    },
                    {
                      id: 'Innovation',
                      label: 'Innovation',
                      count: searchCategoryCounts.Innovation || 0,
                    },
                    {
                      id: 'Community',
                      label: 'Community',
                      count: searchCategoryCounts.Community || 0,
                    },
                    {
                      id: 'Assignment',
                      label: 'Assignment',
                      count: searchCategoryCounts.Assignment || 0,
                    },
                  ].map(({id, label, count}) => {
                    const active = savedCategoryFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSavedCategoryFilter(id)}
                        className={`relative pb-2 text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 shrink-0 ${
                          active
                            ? 'text-[#5B18E5]'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="text-[9.5px] opacity-75 tabular-nums">
                          ({count})
                        </span>
                        {active && (
                          <motion.div
                            layoutId="tab-saved-category-underline"
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 34,
                            }}
                            className="absolute bottom-0 inset-x-0 h-[2.5px] rounded-full bg-[#5B18E5]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Inline Sort Switcher */}
                <div className="flex items-center gap-1.5 text-[10px] shrink-0 pb-1.5">
                  <span className="font-bold text-slate-400">Susun:</span>
                  {[
                    {id: 'match', label: 'Skor'},
                    {id: 'newest', label: 'Baru'},
                    {id: 'hours', label: 'Masa'},
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        setSavedSortBy(st.id as 'match' | 'newest' | 'hours')
                      }
                      className={`font-extrabold cursor-pointer transition-colors ${
                        savedSortBy === st.id
                          ? 'text-[#5B18E5] underline underline-offset-4'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. OPEN EDITORIAL MAGAZINE STREAM (ZERO ROUNDED-SQUARE CARDS) */}
            {filteredSavedCatalog.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <Bookmark className="w-8 h-8 text-[#5B18E5] mx-auto stroke-[1.8]" />
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-[#141132]">
                    {savedSearchQuery || savedCategoryFilter !== 'All'
                      ? 'Tiada Aktiviti Ditemui untuk Penapis Ini'
                      : 'Belum Ada Aktiviti Disimpan'}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    {savedSearchQuery || savedCategoryFilter !== 'All'
                      ? 'Cuba padam kata kunci carian atau pilih kategori lain.'
                      : 'Swipe kad ke kanan di halaman Home untuk simpan aktiviti menarik terus ke sini!'}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  {(savedSearchQuery || savedCategoryFilter !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSavedSearchQuery('');
                        setSavedCategoryFilter('All');
                      }}
                      className="text-xs font-extrabold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Reset Penapis
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSavedSearchQuery('');
                      setSavedCategoryFilter('All');
                      setActiveTab('home');
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#5B18E5] hover:bg-[#4C12C2] text-white text-xs font-extrabold cursor-pointer"
                  >
                    Teroka Aktiviti di Home
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-purple-200/75">
                {filteredSavedCatalog.map((item, idx) => {
                  const rawDigits = (
                    item.organizerPhone || '+60128834910'
                  ).replace(/[^0-9]/g, '');
                  const normalizedPhone = rawDigits.startsWith('0')
                    ? `6${rawDigits}`
                    : rawDigits;
                  const itemWaUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
                    `Salam / Hi ${item.organizerName}, saya ${
                      currentUser?.display_name || 'Fahrin'
                    } dari UMS berminat dengan aktiviti "${
                      item.title
                    }" di ProjectLink UMS.`
                  )}`;
                  const currentNote =
                    bookmarkNotes[item.id] || 'Prioriti Utama';
                  const itemGallery = item.projectObj.gallery_images || [];

                  return (
                    <article
                      key={item.id}
                      onClick={() => openCardInfoModal(item.id)}
                      className="py-5 first:pt-4 group cursor-pointer space-y-3.5 transition-colors"
                    >
                      {/* Top Editorial Kicker Row: Index Number + Category + Radial Match + Unsave */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-wider">
                          <span className="text-[#5B18E5] font-display text-xs tabular-nums">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-purple-300">/</span>
                          <span className="text-[#4E14B8]">
                            {item.projectObj.project_type}
                          </span>
                          <span className="text-purple-300">·</span>
                          <span className="text-slate-500">
                            {item.facultyLabel1}
                          </span>
                          <span className="text-purple-300">·</span>
                          <span className="text-amber-600">+50 SDP</span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-extrabold font-display text-[#5B18E5] tabular-nums">
                            {item.matchScore}% Match
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveProject(item.id);
                            }}
                            title="Buang daripada simpanan"
                            aria-label={`Unsave ${item.title}`}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                          >
                            <Bookmark className="w-4 h-4 fill-[#5B18E5] text-[#5B18E5] hover:fill-rose-600 hover:text-rose-600" />
                          </button>
                        </div>
                      </div>

                      {/* Main Asymmetric Magazine Split: Left Portrait Visual + Right Editorial Typography */}
                      <div className="flex gap-4 items-start">
                        <div className="relative w-[108px] h-[116px] rounded-lg overflow-hidden bg-[#1D0642] shrink-0 shadow-sm">
                          <ActivityCardBanner
                            cardId={item.id}
                            bannerUrl={item.bannerUrl}
                            bannerPreset={item.bannerPreset}
                            bannerPositionY={item.bannerPositionY}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[9px] font-extrabold text-white">
                            <span className="truncate">
                              {item.projectObj.slots_needed || 4} Slot
                            </span>
                            <span>
                              {item.projectObj.min_weekly_hours || 6}j/mgg
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="text-[16px] font-extrabold font-display text-[#14122E] group-hover:text-[#5B18E5] transition-colors leading-snug">
                            {item.title}
                          </h3>

                          <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Hairline Logistics Summary (Replaces Purple Box) */}
                          <div className="pt-1.5 border-t border-purple-100/85 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                              <Calendar className="w-3 h-3 text-[#5B18E5] shrink-0" />
                              <span className="truncate">{item.dateText}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 truncate">
                              <MapPin className="w-3 h-3 text-[#5B18E5] shrink-0" />
                              <span className="truncate">
                                {item.locationText} · {item.organizerName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inline Hashtag Skill Strip */}
                      {item.reqSkillNames.length > 0 && (
                        <div className="flex items-center gap-2.5 flex-wrap text-[10.5px] font-bold text-[#4C1D95]">
                          {item.reqSkillNames.slice(0, 4).map((sk) => (
                            <span key={sk}>#{sk}</span>
                          ))}
                        </div>
                      )}

                      {/* Filmstrip Thumbnail Row for Catalog Images (If Any) */}
                      {itemGallery.length > 0 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5"
                        >
                          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                            Lampiran ({itemGallery.length}):
                          </span>
                          {itemGallery.map((img, gIdx) => (
                            <div
                              key={img.id}
                              onClick={() => {
                                setInspectedCardId(item.id);
                                setLightboxIndex(gIdx);
                                setLightboxZoom(1);
                              }}
                              className="relative w-12 h-9 rounded overflow-hidden bg-[#1D0642] shrink-0 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.caption || item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Bar: Minimalist Dot-Note Selector + Editorial Action Links */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[10.5px]"
                      >
                        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                          {[
                            'Prioriti Utama',
                            'Ajak Kawan FKI',
                            'Tanya Penganjur',
                            'Bincang Jadual',
                          ].map((lbl) => {
                            const isSelected = currentNote === lbl;
                            return (
                              <button
                                key={lbl}
                                type="button"
                                onClick={() =>
                                  setBookmarkNotes((prev) => ({
                                    ...prev,
                                    [item.id]: lbl,
                                  }))
                                }
                                className={`font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'text-[#5B18E5] underline underline-offset-4'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {isSelected ? `● ${lbl}` : lbl}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCardInfoModal(item.id);
                            }}
                            className="text-[11px] font-extrabold text-[#5B18E5] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Lihat Lembaran</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={itemWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              notifyToast(
                                'Membuka WhatsApp',
                                `Menghubungi ${item.organizerName} (${item.organizerPhone})...`,
                                'success'
                              );
                            }}
                            className="h-8 px-3.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 fill-current" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {/* =========================================================
            3. BOTTOM 2-NAVIGATION BAR + FLOATING '+' BUTTON (With Shared layoutId Active Capsule)
           ========================================================= */}
        <AnimatePresence initial={false}>
          {!isSearchPageOpen &&
            !isActivityPageOpen &&
            !isPostActivityPageOpen &&
            !activeSidePage && (
              <motion.div
                key="shared-bottom-nav-bar"
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 20}}
                transition={{type: 'spring', stiffness: 400, damping: 34}}
                className={
                  activeTab === 'activity'
                    ? 'absolute bottom-0 inset-x-0 z-30 pointer-events-none px-4 pb-3.5 pt-6 flex items-center gap-3 bg-gradient-to-t from-[#FAF9FF] via-[#FAF9FF]/92 to-transparent'
                    : 'relative z-20 px-4 pb-3.5 pt-1 flex items-center gap-3'
                }
              >
                <nav
                  aria-label="Primary Navigation"
                  className={`pointer-events-auto flex-1 h-[52px] rounded-full p-1.5 grid grid-cols-2 items-center transition-shadow ${
                    activeTab === 'activity'
                      ? 'bg-white/95 backdrop-blur-xl shadow-[0_10px_28px_rgba(32,12,82,0.18)] border border-purple-200/85'
                      : 'bg-[#F5F2FF] shadow-[0_10px_28px_rgba(12,2,30,0.5)] border border-white/85'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className={`relative h-full rounded-full flex items-center justify-center gap-2 text-[14px] transition-colors cursor-pointer ${
                      activeTab === 'home'
                        ? 'text-[#5515CE] font-extrabold'
                        : 'text-[#626077] font-semibold hover:text-[#14122E]'
                    }`}
                  >
                    {activeTab === 'home' && (
                      <motion.span
                        layoutId="bottom-nav-active-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 440,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-full bg-[#E1D4FF] shadow-xs"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Home
                        className={`w-5 h-5 ${
                          activeTab === 'home'
                            ? 'fill-[#5B18E5] text-[#5B18E5]'
                            : 'text-[#626077]'
                        }`}
                      />
                      <span>Home</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('activity');
                      setActiveSidePage(null);
                    }}
                    className={`relative h-full rounded-full flex items-center justify-center gap-2 text-[14px] transition-colors cursor-pointer ${
                      activeTab === 'activity'
                        ? 'text-[#5515CE] font-extrabold'
                        : 'text-[#626077] font-semibold hover:text-[#14122E]'
                    }`}
                  >
                    {activeTab === 'activity' && (
                      <motion.span
                        layoutId="bottom-nav-active-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 440,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-full bg-[#E1D4FF] shadow-xs"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <div className="relative flex items-center">
                        <Bookmark
                          className={`w-5 h-5 ${
                            activeTab === 'activity'
                              ? 'fill-[#5B18E5] text-[#5B18E5]'
                              : 'text-[#626077]'
                          }`}
                        />
                        {searchCategoryCounts.Saved > 0 && (
                          <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#5B18E5] text-white text-[8.5px] font-extrabold flex items-center justify-center tabular-nums">
                            {searchCategoryCounts.Saved}
                          </span>
                        )}
                      </div>
                      <span>Activity</span>
                    </span>
                  </button>
                </nav>

                {/* Circular Purple '+' Button with Glass Halo -> Opens Dedicated Full-Screen Post Activity Page */}
                <button
                  type="button"
                  onClick={openPostActivityPage}
                  aria-label="Post New Activity or Project"
                  className={`pointer-events-auto w-[54px] h-[54px] rounded-full p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0 ${
                    activeTab === 'activity'
                      ? 'bg-[#EFE9FF] border border-purple-300/80 shadow-[0_8px_22px_rgba(91,24,229,0.3)]'
                      : 'bg-white/15 border border-white/50 shadow-[0_8px_25px_rgba(139,92,246,0.65)]'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-[#9D5CFF] via-[#7B2CBF] to-[#4A0E9E] flex items-center justify-center text-white shadow-inner">
                    <Plus className="w-7 h-7 stroke-[2.8]" />
                  </div>
                </button>
              </motion.div>
            )}
        </AnimatePresence>

        {/* =========================================================
            4. SIDE MENU DRAWER (Spring Slide-In/Out + Backdrop Blur + Staggered Menu Items)
           ========================================================= */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              key="side-menu-backdrop"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.22}}
              className="absolute inset-0 z-50 bg-[#12042E]/50 backdrop-blur-[3px] flex"
              onClick={() => setIsSidebarOpen(false)}
            >
              <motion.aside
                key="side-menu-drawer"
                initial={{x: '-104%'}}
                animate={{x: 0}}
                exit={{x: '-104%'}}
                transition={{type: 'spring', stiffness: 380, damping: 34}}
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
                    <div className="relative w-10 h-10 rounded-2xl bg-[#F0E9FF] flex items-center justify-center">
                      <ProjectLinkPLogo
                        src={appIconUrl}
                        className="w-7 h-7 rounded-md"
                      />
                    </div>
                    <div>
                      <div className="text-[16px] font-extrabold font-display tracking-tight leading-tight">
                        <span className="text-[#14122E]">ProjectLink </span>
                        <span className="text-[#5B18E5]">UMS</span>
                      </div>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSidebarOpen(false);
                            setActiveModal('app-icon-settings');
                          }}
                          className="text-[10px] font-bold text-[#6315EA] hover:underline cursor-pointer"
                        >
                          Tukar Ikon Aplikasi (Admin)
                        </button>
                      ) : (
                        <div className="text-[10px] font-semibold text-slate-400">
                          Portal Aktiviti Pelajar UMS
                        </div>
                      )}
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

                {/* Primary Menu List (Clean User Navigation — No Student/Organizer Toggle) */}
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
                        setActiveSidebarItem('Discover');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveTab('activity');
                        setActiveSidePage(null);
                        setIsSidebarOpen(false);
                      },
                    },
                    {
                      label: 'History',
                      icon: History,
                      badge: `${myHistoryRecords.length}`,
                      action: () => {
                        setActiveSidebarItem('History');
                        setIsSearchPageOpen(false);
                        setIsActivityPageOpen(false);
                        setActiveSidePage('history');
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
                  ].map(({label, icon: Icon, badge, action}, itemIdx) => {
                    const isActive = activeSidebarItem === label;
                    return (
                      <motion.button
                        key={label}
                        type="button"
                        initial={{opacity: 0, x: -16}}
                        animate={{opacity: 1, x: 0}}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 32,
                          delay: 0.04 + itemIdx * 0.035,
                        }}
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
                      </motion.button>
                    );
                  })}
                </div>

                {/* Divider + ACCOUNT Section (Notifications, Settings, and Admin Panel only if role === 'admin') */}
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
                      <span className="text-[11px] font-extrabold text-[#5B18E5] tabular-nums">
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

                    {/* Exclusive Admin Panel Tab — Shown ONLY when logged in as Admin (fahrinmuneer3@gmail.com) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSidebarItem('Admin Panel');
                          setIsSearchPageOpen(false);
                          setIsActivityPageOpen(false);
                          setActiveSidePage('admin-panel');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-[13px] transition-colors cursor-pointer ${
                          activeSidebarItem === 'Admin Panel'
                            ? 'bg-[#141132] text-white font-extrabold'
                            : 'bg-[#F5F0FF] text-[#5B18E5] font-bold hover:bg-[#EBE0FF]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <ShieldCheck
                            className={`w-4 h-4 ${
                              activeSidebarItem === 'Admin Panel'
                                ? 'text-emerald-300'
                                : 'text-[#5B18E5]'
                            }`}
                          />
                          <span>Admin Panel</span>
                        </span>
                        <span className="text-[11px] font-extrabold tabular-nums">
                          {openReportsCount > 0
                            ? `${openReportsCount} laporan`
                            : `${projects.length}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom My Profile Footer Card & Sign Out Button */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidePage('profile');
                    setIsSearchPageOpen(false);
                    setIsActivityPageOpen(false);
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-extrabold text-slate-900 leading-tight truncate">
                          {currentUser?.display_name || 'My Profile'}
                        </span>
                        {isAdmin && (
                          <span className="text-[9.5px] font-extrabold text-[#5B18E5] shrink-0">
                            · Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        {currentUser?.email || 'UMS account'}
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
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================
            5. CONTEXTUAL MODALS (Animated Spring Sheet & Backdrop Blur)
           ========================================================= */}
        <AnimatePresence>
          {activeModal && (
            <motion.div
              key={`modal-backdrop-${activeModal}`}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
              className="absolute inset-0 z-50 bg-[#100326]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
              onClick={() => setActiveModal(null)}
            >
              <motion.div
                key={`modal-sheet-${activeModal}`}
                initial={{opacity: 0, y: 36, scale: 0.96}}
                animate={{opacity: 1, y: 0, scale: 1}}
                exit={{opacity: 0, y: 28, scale: 0.96}}
                transition={{type: 'spring', stiffness: 400, damping: 34}}
                className="w-full max-h-[84%] bg-white rounded-[28px] p-5 text-[#14122E] shadow-2xl overflow-y-auto space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
              {/* MODAL: ACTIVITY INFO, WHATSAPP DIRECT CONTACT & MATCH DETAILS */}
              {activeModal === 'match-details' && modalCard && (
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
                          project.id === currentCard?.id
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

              {/* MODAL: ADD HOME SKILL FILTER (OFFICIAL PREDETERMINED TAXONOMY) */}
              {activeModal === 'add-home-skill' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-display">
                      Penapis Rasmi Bidang &amp; Kemahiran UMS
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
                    Pilih penapis rasmi merentasi semua fakulti UMS untuk
                    menyusun kad <strong>Home</strong> dan mengira semula skor{' '}
                    <strong>Matches Potential</strong>:
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="search"
                      value={homeFilterQuery}
                      onChange={(e) => setHomeFilterQuery(e.target.value)}
                      placeholder="Cari penapis rasmi..."
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-[#6215E5]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setHomeStrictFilterMode((prev) => !prev);
                        setCardIndex(0);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer whitespace-nowrap ${
                        homeStrictFilterMode
                          ? 'bg-[#141132] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {homeStrictFilterMode ? 'Tapis Ketat: ON' : 'Susun Skor'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-0.5">
                    {(
                      [
                        'Kemahiran & Bidang',
                        'Gaya Kerja & Pasukan',
                      ] as const
                    ).map((grp) => {
                      const items = OFFICIAL_FILTER_TAGS.filter(
                        (item) =>
                          item.group === grp &&
                          (!homeFilterQuery.trim() ||
                            item.label
                              .toLowerCase()
                              .includes(homeFilterQuery.trim().toLowerCase()))
                      );
                      if (items.length === 0) return null;
                      return (
                        <div key={grp} className="space-y-1.5">
                          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                            {grp}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((tagObj) => {
                              const added = selectedTags.includes(tagObj.label);
                              return (
                                <button
                                  key={tagObj.id}
                                  type="button"
                                  onClick={() =>
                                    handleToggleHomeFilter(tagObj.label)
                                  }
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                    added
                                      ? 'bg-[#6215E5] text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {added
                                    ? `✓ ${tagObj.label}`
                                    : `+ ${tagObj.label}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                      {selectedTags.length} penapis aktif
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedTags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            selectedTags.forEach((t) => toggleFilterTag(t));
                            setCardIndex(0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="px-4 py-1.5 rounded-xl bg-[#6215E5] text-white text-xs font-bold cursor-pointer"
                      >
                        Selesai
                      </button>
                    </div>
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
                        p_tags: ['AI & Tech', 'Networking', newType],
                        p_organizer_phone: newOrganizerPhone.trim(),
                        p_organizer_name: `${
                          currentUser?.display_name || 'Fahrin Muneer'
                        } (${currentUser?.faculty_short || 'FKI'})`,
                        p_required_skills: [],
                        p_interests: [],
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

              {/* MODAL: AUTHOR-ONLY EDIT ACTIVITY INFO & DETAILS */}
              {activeModal === 'edit-project-info' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B18E5]">
                        Kawalan Pencipta (Author Only)
                      </div>
                      <h3 className="text-base font-extrabold font-display">
                        Sunting Maklumat Aktiviti
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

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block font-bold mb-1">
                        Tajuk Aktiviti / Projek *
                      </label>
                      <input
                        type="text"
                        value={editInfoTitle}
                        onChange={(e) => setEditInfoTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">Kategori</label>
                        <select
                          value={editInfoType}
                          onChange={(e) =>
                            setEditInfoType(e.target.value as ProjectType)
                          }
                          className="w-full rounded-xl border border-slate-300 px-2.5 py-2 font-semibold bg-white"
                        >
                          <option value="Competition">Competition</option>
                          <option value="Innovation">Innovation</option>
                          <option value="Community">Community</option>
                          <option value="Assignment">Assignment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">
                          Status Siaran
                        </label>
                        <select
                          value={editInfoStatus}
                          onChange={(e) =>
                            setEditInfoStatus(e.target.value as ProjectStatus)
                          }
                          className="w-full rounded-xl border border-slate-300 px-2.5 py-2 font-semibold bg-white"
                        >
                          <option value="open">Open (Dibuka)</option>
                          <option value="closed">Closed (Ditutup)</option>
                          <option value="completed">Completed (Selesai)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">
                          Tarikh Program
                        </label>
                        <input
                          type="text"
                          value={editInfoDateText}
                          onChange={(e) => setEditInfoDateText(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">
                          Lokasi Kampus
                        </label>
                        <input
                          type="text"
                          value={editInfoLocation}
                          onChange={(e) => setEditInfoLocation(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        Sasaran Penyertaan Pelajar
                      </label>
                      <input
                        type="text"
                        value={editInfoAudience}
                        onChange={(e) => setEditInfoAudience(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">
                          Kekosongan Ahli
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={editInfoSlots}
                          onChange={(e) =>
                            setEditInfoSlots(Number(e.target.value) || 1)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">
                          Komitmen (Jam/Minggu)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={40}
                          value={editInfoHours}
                          onChange={(e) =>
                            setEditInfoHours(Number(e.target.value) || 1)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">
                          Nama Penganjur
                        </label>
                        <input
                          type="text"
                          value={editInfoOrgName}
                          onChange={(e) => setEditInfoOrgName(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-emerald-700">
                          No. WhatsApp *
                        </label>
                        <input
                          type="tel"
                          value={editInfoOrgPhone}
                          onChange={(e) => setEditInfoOrgPhone(e.target.value)}
                          className="w-full rounded-xl border border-emerald-400 bg-emerald-50/40 px-3 py-2 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        Penerangan Terperinci &amp; Objektif
                      </label>
                      <textarea
                        rows={3}
                        value={editInfoDesc}
                        onChange={(e) => setEditInfoDesc(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const saved = updateProjectDetails(
                          editingInfoProjectId,
                          {
                            title: editInfoTitle,
                            project_type: editInfoType,
                            status: editInfoStatus,
                            date_display: editInfoDateText,
                            location: editInfoLocation,
                            audience: editInfoAudience,
                            slots_needed: editInfoSlots,
                            min_weekly_hours: editInfoHours,
                            organizer_name: editInfoOrgName,
                            organizer_phone: editInfoOrgPhone,
                            description: editInfoDesc,
                          }
                        );
                        if (saved) {
                          setActiveModal(null);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#5B18E5] hover:bg-[#4C11C4] text-white font-extrabold cursor-pointer"
                    >
                      Simpan Perubahan Maklumat
                    </button>
                  </div>
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

              {/* MODAL: ADD PROFILE SKILL (OFFICIAL PREDETERMINED CATALOG ONLY) */}
              {activeModal === 'add-profile-skill' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold font-display">
                        Pilih Kemahiran Rasmi UMS
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pilih daripada katalog rasmi mengikut bidang &amp; tahap
                        kemahiran anda.
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

                  <div className="space-y-2.5 text-xs">
                    <div className="flex gap-2">
                      <input
                        type="search"
                        value={skillPickerQuery}
                        onChange={(e) => setSkillPickerQuery(e.target.value)}
                        placeholder="Cari dalam senarai kemahiran rasmi..."
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-[#6215E5]"
                      />
                      <select
                        value={newSkillProf}
                        onChange={(e) =>
                          setNewSkillProf(e.target.value as Proficiency)
                        }
                        aria-label="Tahap kemahiran"
                        className="rounded-xl border border-slate-300 px-2.5 py-2 font-semibold"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {['Semua', ...SKILL_CATEGORIES].map((cat) => {
                        const active = skillPickerCategory === cat;
                        return (
                          <button
                            key={`modal-sk-cat-${cat}`}
                            type="button"
                            onClick={() => setSkillPickerCategory(cat)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-[#6215E5] text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-0.5">
                      {SKILL_CATEGORIES.filter(
                        (cat) =>
                          skillPickerCategory === 'Semua' ||
                          skillPickerCategory === cat
                      ).map((cat) => {
                        const catSkills = skills.filter(
                          (s) =>
                            s.category === cat &&
                            (!skillPickerQuery.trim() ||
                              s.name
                                .toLowerCase()
                                .includes(
                                  skillPickerQuery.trim().toLowerCase()
                                ))
                        );
                        if (catSkills.length === 0) return null;
                        return (
                          <div key={`grp-${cat}`} className="space-y-1.5">
                            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                              {cat}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {catSkills.map((s) => {
                                const existing = myNormalizedSkills.find(
                                  (ms) => ms.skill_id === s.id
                                );
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      if (existing) {
                                        removeStudentSkillById(s.id);
                                      } else {
                                        addStudentSkillByName(
                                          s.name,
                                          newSkillProf
                                        );
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-full font-bold cursor-pointer transition-colors ${
                                      existing
                                        ? 'bg-[#6215E5] text-white'
                                        : 'bg-[#EFE9FF] text-[#5B18E5] hover:bg-[#E1D6FF]'
                                    }`}
                                  >
                                    {existing
                                      ? `✓ ${s.name} (${existing.proficiency})`
                                      : `+ ${s.name}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                        {myNormalizedSkills.length} kemahiran dipilih dalam
                        profil
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="px-4 py-2 rounded-xl bg-[#6215E5] text-white font-bold cursor-pointer"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* MODAL: ADD PROFILE INTEREST (OFFICIAL PREDETERMINED MINAT CATALOG ONLY) */}
              {activeModal === 'add-profile-interest' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold font-display">
                        Pilih Minat Rasmi (Minat &amp; Topik UMS)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pilih minat daripada kluster rasmi UMS untuk ketepatan
                        padanan aktiviti.
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

                  <div className="space-y-2.5 text-xs">
                    <input
                      type="search"
                      value={interestPickerQuery}
                      onChange={(e) => setInterestPickerQuery(e.target.value)}
                      placeholder="Cari dalam senarai minat rasmi..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-[#6215E5]"
                    />

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {['Semua', ...INTEREST_CATEGORIES].map((cat) => {
                        const active = interestPickerCategory === cat;
                        return (
                          <button
                            key={`modal-in-cat-${cat}`}
                            type="button"
                            onClick={() => setInterestPickerCategory(cat)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-[#6215E5] text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-0.5">
                      {INTEREST_CATEGORIES.filter(
                        (cat) =>
                          interestPickerCategory === 'Semua' ||
                          interestPickerCategory === cat
                      ).map((cat) => {
                        const catInterests = interests.filter(
                          (i) =>
                            i.category === cat &&
                            (!interestPickerQuery.trim() ||
                              i.name
                                .toLowerCase()
                                .includes(
                                  interestPickerQuery.trim().toLowerCase()
                                ))
                        );
                        if (catInterests.length === 0) return null;
                        return (
                          <div key={`intr-grp-${cat}`} className="space-y-1.5">
                            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                              {cat}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {catInterests.map((i) => {
                                const isAdded = myNormalizedInterests.some(
                                  (mi) => mi.interest_id === i.id
                                );
                                return (
                                  <button
                                    key={i.id}
                                    type="button"
                                    onClick={() => {
                                      if (isAdded) {
                                        removeStudentInterestById(i.id);
                                      } else {
                                        addStudentInterestByName(i.name);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-full font-bold cursor-pointer transition-colors ${
                                      isAdded
                                        ? 'bg-[#6215E5] text-white'
                                        : 'bg-[#EFE9FF] text-[#5B18E5] hover:bg-[#E1D6FF]'
                                    }`}
                                  >
                                    {isAdded ? `✓ ${i.name}` : `+ ${i.name}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                        {myNormalizedInterests.length} minat dipilih dalam
                        profil
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="px-4 py-2 rounded-xl bg-[#6215E5] text-white font-bold cursor-pointer"
                      >
                        Selesai
                      </button>
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
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B18E5]">
                        Koleksi Tanda Buku
                      </div>
                      <h3 className="text-base font-extrabold font-display">
                        Saved Activities
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
                  {savedProjects.filter(
                    (s) => s.student_id === currentUser?.id
                  ).length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Tiada aktiviti disimpan. Tekan ikon penanda buku pada kad
                      aktiviti di halaman Home.
                    </p>
                  ) : (
                    <div className="divide-y divide-purple-100 border-b border-purple-100">
                      {savedProjects
                        .filter((s) => s.student_id === currentUser?.id)
                        .map((sp, idx) => {
                          const found = cardsCatalog.find(
                            (c) => c.id === sp.project_id
                          );
                          return (
                            <div
                              key={sp.project_id}
                              className="py-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className="text-[11px] font-extrabold font-display text-[#5B18E5] tabular-nums mt-0.5">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-[#14122E] truncate">
                                    {found?.title || sp.project_id}
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 truncate">
                                    {found?.dateText} · {found?.locationText}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCardInfoModal(sp.project_id)
                                  }
                                  className="text-xs font-extrabold text-[#5B18E5] hover:underline cursor-pointer"
                                >
                                  Buka →
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSaveProject(sp.project_id)
                                  }
                                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
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
                            if (!newTaskTitle.trim() || !currentCard) return;
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
                        if (!chatInput.trim() || !currentCard) return;
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
                    {currentCard && (
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
                    )}

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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FULL-SCREEN INTERACTIVE POSTER & CATALOG LIGHTBOX MODAL (Zoom 1x-3x + Touch Swipe) */}
        {lightboxIndex !== null && modalGalleryImages[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-[#070214]/96 backdrop-blur-md flex flex-col select-none"
            onClick={() => {
              setLightboxIndex(null);
              setLightboxZoom(1);
            }}
          >
            {/* Top Bar: Counter, Category Badge, Zoom Controls & Close */}
            <div
              className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-white/10 text-white shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-300 tabular-nums">
                    {lightboxIndex + 1} / {modalGalleryImages.length}
                  </span>
                  <span className="text-xs font-extrabold text-white truncate">
                    {modalCard?.title || 'Poster Aktiviti'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))
                  }
                  aria-label="Zum keluar"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxZoom((z) => (z >= 3 ? 1 : Number((z + 0.5).toFixed(1))))
                  }
                  className="h-9 px-2.5 rounded-xl bg-[#5B18E5] text-white font-extrabold text-xs tabular-nums cursor-pointer"
                >
                  {lightboxZoom}x
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxZoom((z) => Math.min(3, Number((z + 0.5).toFixed(1))))
                  }
                  aria-label="Zum masuk"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex(null);
                    setLightboxZoom(1);
                  }}
                  aria-label="Tutup Lightbox"
                  className="w-9 h-9 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center ml-1 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Center Interactive Poster Viewport (Swipe Left/Right + Double Tap to Zoom) */}
            <div
              className="relative flex-1 min-h-0 flex items-center justify-center overflow-auto p-4"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => {
                if (lightboxZoom > 1) return;
                lightboxTouchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (
                  lightboxZoom > 1 ||
                  lightboxTouchStartXRef.current === null
                ) {
                  lightboxTouchStartXRef.current = null;
                  return;
                }
                const dx =
                  e.changedTouches[0].clientX - lightboxTouchStartXRef.current;
                lightboxTouchStartXRef.current = null;
                if (dx < -45 && modalGalleryImages.length > 1) {
                  setLightboxIndex(
                    (prev) => ((prev ?? 0) + 1) % modalGalleryImages.length
                  );
                  setLightboxZoom(1);
                } else if (dx > 45 && modalGalleryImages.length > 1) {
                  setLightboxIndex(
                    (prev) =>
                      ((prev ?? 0) - 1 + modalGalleryImages.length) %
                      modalGalleryImages.length
                  );
                  setLightboxZoom(1);
                }
              }}
            >
              {/* Previous Poster Arrow */}
              {modalGalleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex(
                      (prev) =>
                        ((prev ?? 0) - 1 + modalGalleryImages.length) %
                        modalGalleryImages.length
                    );
                    setLightboxZoom(1);
                  }}
                  aria-label="Gambar sebelumnya"
                  className="absolute left-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/25 text-white flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Poster Image with Smooth Scale Zoom */}
              <div
                onDoubleClick={() =>
                  setLightboxZoom((z) => (z === 1 ? 2 : 1))
                }
                style={{
                  transform: `scale(${lightboxZoom})`,
                  transformOrigin: 'center center',
                }}
                className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={modalGalleryImages[lightboxIndex].url}
                  alt={modalGalleryImages[lightboxIndex].caption}
                  className="max-h-[68vh] w-auto rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.75)] border border-white/20 object-contain"
                />
              </div>

              {/* Next Poster Arrow */}
              {modalGalleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex(
                      (prev) => ((prev ?? 0) + 1) % modalGalleryImages.length
                    );
                    setLightboxZoom(1);
                  }}
                  aria-label="Gambar seterusnya"
                  className="absolute right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/25 text-white flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            <div
              className="px-4 pt-3 pb-5 bg-[#0E0424]/95 border-t border-white/10 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {modalGalleryImages.map((thumb, tIdx) => {
                  const active = tIdx === lightboxIndex;
                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      onClick={() => {
                        setLightboxIndex(tIdx);
                        setLightboxZoom(1);
                      }}
                      className={`relative w-13 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        active
                          ? 'border-amber-400 scale-105 shadow-md'
                          : 'border-white/20 opacity-60 hover:opacity-95'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb.url}
                        alt={thumb.caption}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
