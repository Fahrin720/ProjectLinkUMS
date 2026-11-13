'use client';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  downloadProjectLinkPptx,
  EIS26_GUIDELINE_RULES,
  EIS26_JURY_QA_BANK,
  EIS26_OFFICIAL_INFO,
  PITCH_DECK_SLIDES,
} from '@/lib/pptx-exporter';
import {
  INITIAL_AVAILABILITY_SLOTS,
  INITIAL_INTERESTS,
  INITIAL_PROFILES,
  INITIAL_PROJECT_INTERESTS,
  INITIAL_PROJECT_MEETING_SLOTS,
  INITIAL_PROJECT_REQUIRED_SKILLS,
  INITIAL_PROJECTS,
  INITIAL_SKILLS,
  INITIAL_STUDENT_INTERESTS,
  INITIAL_STUDENT_SKILLS,
  SKILL_CATEGORIES,
  UMS_FACULTY_CODES,
} from '@/lib/seed-data';
import {evaluateStudentProjectMatch} from '@/lib/matching-engine';

interface PitchDeckStudioProps {
  onClose?: () => void;
}

// Synthesizes a clean bell chime using Web Audio API (1 bell at 4:00, 2 bells at 5:00)
function playBellChime(bellCount: 1 | 2) {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as {webkitAudioContext?: typeof AudioContext})
      .webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const ringOnce = (startOffsetSec: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + startOffsetSec);
      osc.frequency.exponentialRampToValueAtTime(
        1318.5,
        ctx.currentTime + startOffsetSec + 0.08
      );
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startOffsetSec);
      gain.gain.exponentialRampToValueAtTime(
        0.28,
        ctx.currentTime + startOffsetSec + 0.03
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + startOffsetSec + 0.65
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffsetSec);
      osc.stop(ctx.currentTime + startOffsetSec + 0.68);
    };

    ringOnce(0);
    if (bellCount === 2) {
      ringOnce(0.36);
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export default function PitchDeckStudio({onClose}: PitchDeckStudioProps) {
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<
    'slide' | 'grid' | 'eis-rules' | 'qa-bank'
  >('slide');
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloadingPptx, setIsDownloadingPptx] = useState<boolean>(false);
  const [downloadBanner, setDownloadBanner] = useState<string | null>(null);

  // EIS'26 Official Timer State: 'pitch' (5 mins = 300s elapsed counter) or 'qa' (10 mins = 600s)
  const [timerPhase, setTimerPhase] = useState<'pitch' | 'qa'>('pitch');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bellBannerText, setBellBannerText] = useState<string | null>(null);
  const bell4TriggeredRef = useRef<boolean>(false);
  const bell5TriggeredRef = useRef<boolean>(false);

  // Interactive EIS'26 Readiness Checklist State
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({
    'chk-link': true,
    'chk-early': true,
    'chk-backdrop': false,
    'chk-mic': false,
    'chk-cam': false,
    'chk-slides': true,
  });

  // Interactive Slide 05 Taxonomy Category & Slide 07 Live Simulation Project State
  const [selectedTaxCategory, setSelectedTaxCategory] = useState<string>(
    SKILL_CATEGORIES[0]
  );
  const [simProjectId, setSimProjectId] = useState<string>('prj-techfest');

  const currentSlide =
    PITCH_DECK_SLIDES[currentSlideIdx] || PITCH_DECK_SLIDES[0];

  const totalPhaseSeconds = timerPhase === 'pitch' ? 300 : 600;
  const remainingSeconds = Math.max(0, totalPhaseSeconds - elapsedSeconds);

  // Format mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Timer tick & EIS'26 4th-minute (240s) 1-Bell + 5th-minute (300s) 2-Bell signals
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (timerPhase === 'pitch') {
          if (next === 240 && !bell4TriggeredRef.current) {
            bell4TriggeredRef.current = true;
            if (soundEnabled) playBellChime(1);
            setBellBannerText(
              '🔔 MINIT KE-4 (1 LOCENG): Baki 1 minit lagi! Sila mula menggulung pembentangan.'
            );
          }
          if (next === 300 && !bell5TriggeredRef.current) {
            bell5TriggeredRef.current = true;
            if (soundEnabled) playBellChime(2);
            setBellBannerText(
              '🔔🔔 MINIT KE-5 (2 LOCENG): Masa Pembentangan TAMAT! Sila berhenti membentang serta-merta.'
            );
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning, timerPhase, soundEnabled]);

  const resetTimer = (nextPhase: 'pitch' | 'qa' = timerPhase) => {
    setIsTimerRunning(false);
    setTimerPhase(nextPhase);
    setElapsedSeconds(0);
    setBellBannerText(null);
    bell4TriggeredRef.current = false;
    bell5TriggeredRef.current = false;
  };

  const goPrevSlide = useCallback(() => {
    setCurrentSlideIdx((prev) =>
      prev > 0 ? prev - 1 : PITCH_DECK_SLIDES.length - 1
    );
  }, []);

  const goNextSlide = useCallback(() => {
    setCurrentSlideIdx((prev) =>
      prev < PITCH_DECK_SLIDES.length - 1 ? prev + 1 : 0
    );
  }, []);

  // Keyboard navigation (ArrowLeft, ArrowRight, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'slide') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, goNextSlide, goPrevSlide]);

  const handleDownloadPptx = () => {
    setIsDownloadingPptx(true);
    try {
      downloadProjectLinkPptx(PITCH_DECK_SLIDES);
      setDownloadBanner(
        'Fail "ProjectLink_UMS_EIS26_Pitch_Deck.pptx" berjaya dijana dan dimuat turun!'
      );
      setTimeout(() => setDownloadBanner(null), 5000);
    } finally {
      setIsDownloadingPptx(false);
    }
  };

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Live Match Evaluation for Slide 07 Interactive Demo
  const liveSimulatedMatch = useMemo(() => {
    const student = INITIAL_PROFILES[0];
    const project =
      INITIAL_PROJECTS.find((p) => p.id === simProjectId) ||
      INITIAL_PROJECTS[0];
    const evaluated = evaluateStudentProjectMatch({
      student,
      project,
      skillsCatalog: INITIAL_SKILLS,
      interestsCatalog: INITIAL_INTERESTS,
      studentSkills: INITIAL_STUDENT_SKILLS,
      projectRequiredSkills: INITIAL_PROJECT_REQUIRED_SKILLS,
      studentInterests: INITIAL_STUDENT_INTERESTS,
      projectInterests: INITIAL_PROJECT_INTERESTS,
      studentSlots: INITIAL_AVAILABILITY_SLOTS,
      projectSlots: INITIAL_PROJECT_MEETING_SLOTS,
      projectMembers: [],
      activeFilterTags: student.active_filter_tags,
      requireDiscoveryConsent: false,
    });
    return {project, evaluated};
  }, [simProjectId]);

  const isDarkSlide = currentSlide.themeMode === 'dark-hero';

  return (
    <div className="fixed inset-0 z-[90] h-dvh w-screen overflow-hidden bg-[#0E0920] text-slate-900 flex flex-col select-none">
      {/* =====================================================================
          1. TOP PRESENTER COMMAND BAR (3-Zone Discipline + EIS'26 Bell Timer)
         ===================================================================== */}
      <header className="shrink-0 h-14 px-4 lg:px-6 bg-[#141132] border-b border-white/10 flex items-center justify-between gap-4 text-white">
        {/* Zone 1: Back / Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Aplikasi</span>
            </button>
          ) : (
            <Link
              href="/"
              className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Buka Aplikasi Utama</span>
            </Link>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-extrabold font-display tracking-tight text-white whitespace-nowrap">
              ProjectLink UMS
            </span>
            <span className="text-white/30">·</span>
            <span className="text-xs font-semibold text-amber-300 whitespace-nowrap">
              EIS’26 CEDeC Pitch Studio
            </span>
          </div>
        </div>

        {/* Zone 2: Mode Tabs & Live EIS'26 5-Min / 10-Min Bell Timer */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.07] border border-white/10">
            {[
              {id: 'slide', label: 'Slide 16:9', icon: BookOpen},
              {id: 'grid', label: '10 Slide Grid', icon: LayoutGrid},
              {id: 'eis-rules', label: 'Syarat EIS’26', icon: ShieldCheck},
              {id: 'qa-bank', label: 'Bank Q&A (10m)', icon: HelpCircle},
            ].map(({id, label, icon: Icon}) => {
              const active = viewMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setViewMode(
                      id as 'slide' | 'grid' | 'eis-rules' | 'qa-bank'
                    )
                  }
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#5B18E5] text-white'
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* EIS'26 Official Timer Control Pill */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold tabular-nums ${
              timerPhase === 'pitch' && elapsedSeconds >= 300
                ? 'bg-rose-600/90 border-rose-300 text-white'
                : timerPhase === 'pitch' && elapsedSeconds >= 240
                ? 'bg-amber-500/90 border-amber-200 text-[#141132]'
                : 'bg-white/[0.08] border-white/15 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <button
              type="button"
              onClick={() =>
                resetTimer(timerPhase === 'pitch' ? 'qa' : 'pitch')
              }
              title="Tukar antara Masa Bentang (5m) dan Sesi Q&A (10m)"
              className="underline decoration-dotted underline-offset-2 cursor-pointer whitespace-nowrap"
            >
              {timerPhase === 'pitch' ? 'Pitch 5m:' : 'Q&A 10m:'}
            </button>
            <span className="text-sm font-extrabold">
              {formatTime(remainingSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setIsTimerRunning((prev) => !prev)}
              aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
              className="p-1 rounded bg-white/15 hover:bg-white/25 cursor-pointer"
            >
              {isTimerRunning ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() => resetTimer(timerPhase)}
              aria-label="Reset timer"
              className="p-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSoundEnabled((prev) => !prev);
                if (!soundEnabled) playBellChime(1);
              }}
              title="Uji / Hidupkan Loceng Masa EIS’26"
              className="p-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3 h-3 text-amber-300" />
              ) : (
                <VolumeX className="w-3 h-3 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Zone 3: Primary Export Action (.PPTX + Print PDF + Fullscreen) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPptx}
            disabled={isDownloadingPptx}
            className="h-9 px-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#141132] text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>
              {isDownloadingPptx ? 'Menjana .PPTX...' : 'Muat Turun .PPTX'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title="Cetak atau Simpan sebagai PDF"
            className="hidden sm:flex h-9 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="hidden sm:flex h-9 w-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 items-center justify-center text-white cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Live Notification Strip for Bell Signals or PPTX Download */}
      {(bellBannerText || downloadBanner) && (
        <div
          className={`shrink-0 px-4 py-2 text-xs font-extrabold flex items-center justify-between gap-3 ${
            bellBannerText?.includes('MINIT KE-5')
              ? 'bg-rose-600 text-white'
              : bellBannerText
              ? 'bg-amber-400 text-[#141132]'
              : 'bg-emerald-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 shrink-0" />
            <span>{bellBannerText || downloadBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setBellBannerText(null);
              setDownloadBanner(null);
            }}
            className="underline text-[11px] font-bold cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* =====================================================================
          2. MAIN STAGE CANVAS (SLIDE 16:9 / GRID / EIS'26 RULES / Q&A BANK)
         ===================================================================== */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 flex flex-col items-center justify-between gap-4">
        {viewMode === 'slide' && (
          <>
            {/* Top Chapter Rail (01 .. 10) */}
            <div className="w-full max-w-6xl flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-1.5">
                {PITCH_DECK_SLIDES.map((s, idx) => {
                  const active = idx === currentSlideIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`h-8 px-2.5 rounded-md text-xs font-extrabold tabular-nums transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        active
                          ? 'bg-[#5B18E5] text-white shadow-sm'
                          : 'bg-white/[0.07] text-purple-200/80 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      <span>{s.indexNumber}</span>
                      {active && (
                        <span className="hidden md:inline text-[11px] font-semibold text-purple-100">
                          · {s.timeWindow.split(' ')[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSpeakerNotes((prev) => !prev)}
                  className={`h-8 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    showSpeakerNotes
                      ? 'bg-white/15 text-amber-300 border border-amber-300/40'
                      : 'bg-white/[0.07] text-purple-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {showSpeakerNotes ? 'Sembunyi Skrip' : 'Papar Skrip'}
                  </span>
                </button>
              </div>
            </div>

            {/* WIDESCREEN 16:9 EDITORIAL SLIDE CANVAS */}
            <div
              className={`w-full max-w-6xl flex-1 min-h-[420px] rounded-2xl border shadow-[0_24px_70px_rgba(0,0,0,0.55)] overflow-y-auto flex flex-col justify-between p-5 sm:p-8 lg:p-10 transition-colors duration-200 ${
                isDarkSlide
                  ? 'bg-gradient-to-br from-[#141132] via-[#1F1147] to-[#2B0C63] border-purple-400/30 text-white'
                  : 'bg-[#FAF9FF] border-purple-200/90 text-[#141132]'
              }`}
            >
              {/* Top Kicker & EIS'26 Time Window Strip */}
              <div className="space-y-4">
                <div
                  className={`pb-3 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider ${
                    isDarkSlide
                      ? 'border-white/15 text-amber-300'
                      : 'border-purple-200/80 text-[#5B18E5]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">
                      SLIDE {currentSlide.indexNumber} / 10
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{currentSlide.chapterKicker}</span>
                  </div>

                  <div className="flex items-center gap-3 tabular-nums">
                    <span
                      className={
                        currentSlide.bellAlert === 'two-bell-stop'
                          ? 'text-rose-400'
                          : currentSlide.bellAlert === 'one-bell-warning'
                          ? 'text-amber-500'
                          : isDarkSlide
                          ? 'text-purple-200'
                          : 'text-slate-500'
                      }
                    >
                      Sasaran Masa EIS’26: {currentSlide.timeWindow}
                    </span>
                  </div>
                </div>

                {/* Slide Headline & Subtitle */}
                <div className="space-y-2 max-w-4xl">
                  <h1
                    className={`text-2xl sm:text-3xl lg:text-[34px] font-extrabold font-display tracking-tight leading-tight text-balance ${
                      isDarkSlide ? 'text-white' : 'text-[#141132]'
                    }`}
                  >
                    {currentSlide.title}
                  </h1>
                  <p
                    className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
                      isDarkSlide ? 'text-purple-100/90' : 'text-slate-600'
                    }`}
                  >
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* 3 Key Quantitative Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {currentSlide.metrics.map((m, mIdx) => (
                    <div
                      key={`${currentSlide.id}-metric-${mIdx}`}
                      className={`p-4 rounded-xl border ${
                        isDarkSlide
                          ? 'bg-white/[0.07] border-white/15'
                          : 'bg-white border-purple-200/80 shadow-2xs'
                      }`}
                    >
                      <div
                        className={`text-xl sm:text-2xl font-extrabold font-display tabular-nums ${
                          isDarkSlide ? 'text-amber-300' : 'text-[#5B18E5]'
                        }`}
                      >
                        {m.value}
                      </div>
                      <div
                        className={`text-xs font-extrabold mt-0.5 ${
                          isDarkSlide ? 'text-white' : 'text-[#141132]'
                        }`}
                      >
                        {m.label}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isDarkSlide ? 'text-purple-200/80' : 'text-slate-500'
                        }`}
                      >
                        {m.sublabel}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two-Column Structured Content + Interactive Domain Modules on Slides 04, 05, 07, 08 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                  {/* Left Column */}
                  <div
                    className={`p-4 sm:p-5 rounded-xl border space-y-2.5 ${
                      isDarkSlide
                        ? 'bg-white/[0.05] border-white/15'
                        : 'bg-white border-purple-200/80'
                    }`}
                  >
                    <h2
                      className={`text-sm font-extrabold font-display uppercase tracking-wide ${
                        isDarkSlide ? 'text-amber-300' : 'text-[#5B18E5]'
                      }`}
                    >
                      {currentSlide.leftColumn.heading}
                    </h2>
                    <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                      {currentSlide.leftColumn.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-2.5"
                        >
                          <span
                            className={`font-extrabold tabular-nums shrink-0 ${
                              isDarkSlide
                                ? 'text-amber-300'
                                : 'text-[#5B18E5]'
                            }`}
                          >
                            0{bIdx + 1}.
                          </span>
                          <span
                            className={
                              isDarkSlide
                                ? 'text-purple-50'
                                : 'text-slate-700 font-medium'
                            }
                          >
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column */}
                  <div
                    className={`p-4 sm:p-5 rounded-xl border space-y-2.5 ${
                      isDarkSlide
                        ? 'bg-white/[0.05] border-white/15'
                        : 'bg-white border-purple-200/80'
                    }`}
                  >
                    <h2
                      className={`text-sm font-extrabold font-display uppercase tracking-wide ${
                        isDarkSlide ? 'text-amber-300' : 'text-[#5B18E5]'
                      }`}
                    >
                      {currentSlide.rightColumn.heading}
                    </h2>
                    <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                      {currentSlide.rightColumn.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-2.5"
                        >
                          <span
                            className={`font-extrabold tabular-nums shrink-0 ${
                              isDarkSlide
                                ? 'text-amber-300'
                                : 'text-[#5B18E5]'
                            }`}
                          >
                            0{bIdx + 1}.
                          </span>
                          <span
                            className={
                              isDarkSlide
                                ? 'text-purple-50'
                                : 'text-slate-700 font-medium'
                            }
                          >
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* BESPOKE INTERACTIVE WIDGET FOR SLIDE 05: LIVE TAXONOMY EXPLORER */}
                {currentSlide.id === 'slide-05' && (
                  <div className="p-4 rounded-xl bg-[#F3EEFF] border border-purple-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#141132]">
                        Uji Katalog Kemahiran Rasmi UMS (Klik Bidang):
                      </span>
                      <span className="text-[11px] font-bold text-[#5B18E5]">
                        Liputan Fakulti:{' '}
                        {UMS_FACULTY_CODES.filter((f) => f !== 'All').join(' · ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {SKILL_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedTaxCategory(cat)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                            selectedTaxCategory === cat
                              ? 'bg-[#5B18E5] text-white'
                              : 'bg-white text-slate-700 border border-purple-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-[#141132]">
                      {INITIAL_SKILLS.filter(
                        (s) => s.category === selectedTaxCategory
                      ).map((sk) => (
                        <span
                          key={sk.id}
                          className="px-2.5 py-1 rounded bg-white border border-purple-200/80"
                        >
                          ✓ {sk.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* BESPOKE INTERACTIVE WIDGET FOR SLIDE 07: LIVE 40/25/20/15 MATCH SIMULATOR */}
                {currentSlide.id === 'slide-07' && (
                  <div className="p-4 rounded-xl bg-[#141132] text-white space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                        Simulasi Langsung Enjin Padanan 40/25/20/15 (Profil: Fahrin Muneer — FKI):
                      </span>
                      <span className="text-sm font-extrabold tabular-nums text-emerald-300">
                        Skor Semasa: {liveSimulatedMatch.evaluated.totalScore}% Match
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {INITIAL_PROJECTS.map((proj) => {
                        const active = proj.id === simProjectId;
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => setSimProjectId(proj.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-[#5B18E5] text-white border border-purple-300'
                                : 'bg-white/10 text-purple-200 hover:bg-white/20'
                            }`}
                          >
                            {proj.badge_line_2} · {proj.title.slice(0, 26)}...
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                      <div className="p-2 rounded bg-white/10">
                        <span className="text-purple-200">Kemahiran (40%): </span>
                        <strong className="text-white">
                          {liveSimulatedMatch.evaluated.skillScore}/40
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-white/10">
                        <span className="text-purple-200">Minat (25%): </span>
                        <strong className="text-white">
                          {liveSimulatedMatch.evaluated.interestScore}/25
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-white/10">
                        <span className="text-purple-200">Jadual (20%): </span>
                        <strong className="text-white">
                          {liveSimulatedMatch.evaluated.scheduleScore}/20
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-white/10">
                        <span className="text-purple-200">Matlamat (15%): </span>
                        <strong className="text-white">
                          {liveSimulatedMatch.evaluated.goalScore}/15
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Takeaway Strip inside Slide */}
              <div
                className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-bold ${
                  isDarkSlide
                    ? 'border-white/15 text-amber-300'
                    : 'border-purple-200/80 text-[#4C1D95]'
                }`}
              >
                <span>{currentSlide.bottomTakeaway}</span>
                {currentSlide.id === 'slide-10' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('qa-bank')}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-[#141132] font-extrabold cursor-pointer"
                    >
                      Buka Bank Q&amp;A Juri (10 Minit)
                    </button>
                    {onClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#141132] font-extrabold cursor-pointer"
                      >
                        Lancarkan Live Demo Aplikasi →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Presenter Script & Slide Prev/Next Controls */}
            <div className="w-full max-w-6xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {showSpeakerNotes ? (
                <div className="flex-1 rounded-xl bg-white/[0.07] border border-white/15 px-4 py-2.5 text-white">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-0.5">
                    Skrip Pembentang ({currentSlide.timeWindow}) — Bahasa Melayu Profesional
                  </div>
                  <p className="text-xs sm:text-[13px] text-purple-100 leading-relaxed">
                    &ldquo;{currentSlide.speakerScript}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={goPrevSlide}
                  className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelum</span>
                </button>
                <span className="px-2 text-xs font-extrabold text-white tabular-nums">
                  {currentSlideIdx + 1} / {PITCH_DECK_SLIDES.length}
                </span>
                <button
                  type="button"
                  onClick={goNextSlide}
                  className="h-10 px-4 rounded-xl bg-[#5B18E5] hover:bg-[#4C12C4] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Seterusnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            VIEW MODE 2: 10-SLIDE OVERVIEW GRID
           =================================================================== */}
        {viewMode === 'grid' && (
          <div className="w-full max-w-6xl space-y-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-lg font-extrabold font-display">
                  Gambaran Keseluruhan 10 Slide Pitching EIS’26 (5 Minit)
                </h2>
                <p className="text-xs text-purple-200">
                  Klik mana-mana slide untuk membentang secara skrin penuh.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadPptx}
                className="px-4 py-2 rounded-xl bg-amber-400 text-[#141132] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Muat Turun Semua (.PPTX)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PITCH_DECK_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setCurrentSlideIdx(idx);
                    setViewMode('slide');
                  }}
                  className="p-4 rounded-xl bg-[#FAF9FF] hover:bg-white border border-purple-200 text-left space-y-2 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-[#5B18E5] tabular-nums">
                    <span>SLIDE {s.indexNumber}</span>
                    <span>{s.timeWindow}</span>
                  </div>
                  <h3 className="text-sm font-extrabold font-display text-[#141132] group-hover:text-[#5B18E5] line-clamp-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {s.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW MODE 3: OFFICIAL EIS'26 PARTICIPANT GUIDELINES & CHECKLIST
           =================================================================== */}
        {viewMode === 'eis-rules' && (
          <div className="w-full max-w-6xl bg-[#FAF9FF] rounded-2xl border border-purple-200 p-5 sm:p-8 space-y-6 text-[#141132]">
            <div className="pb-4 border-b border-purple-200 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#5B18E5]">
                  {EIS26_OFFICIAL_INFO.organizer} · {EIS26_OFFICIAL_INFO.university}
                </div>
                <h2 className="text-2xl font-extrabold font-display mt-1">
                  📢 {EIS26_OFFICIAL_INFO.eventTitle} — Garis Panduan Rasmi Peserta
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  &ldquo;{EIS26_OFFICIAL_INFO.tagline}&rdquo;
                </p>
              </div>

              <a
                href={EIS26_OFFICIAL_INFO.scheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#5B18E5] hover:bg-[#4A11C0] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm"
              >
                <span>Semak Jadual &amp; Pautan Sesi Selari</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Interactive Pre-Pitch Readiness Checklist */}
            <div className="p-4 rounded-xl bg-[#F3EEFF] border border-purple-200 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#4C1D95]">
                Senarai Semak Persediaan Kumpulan Sebelum Giliran Pitching:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {[
                  {
                    id: 'chk-link',
                    label: 'Semak masa & pautan sesi selari (tinyurl.com/eispitchingschedule)',
                  },
                  {
                    id: 'chk-early',
                    label: 'Masuk ke bilik sesi selari sekurang-kurangnya 10 minit awal',
                  },
                  {
                    id: 'chk-backdrop',
                    label: 'Pasang Latar Belakang Maya Rasmi EIS’26 (Virtual Background)',
                  },
                  {
                    id: 'chk-mic',
                    label: 'Mute mikrofon semasa masuk & ketika memerhati peserta lain',
                  },
                  {
                    id: 'chk-cam',
                    label: 'Buka kamera (Camera ON) semasa membentang & sesi Q&A',
                  },
                  {
                    id: 'chk-slides',
                    label: 'Sedia kongsi Slide Pembentangan (.PPTX / Web) atau Poster A1',
                  },
                ].map((item) => {
                  const checked = Boolean(checkedRules[item.id]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setCheckedRules((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className={`p-3 rounded-lg border text-left font-bold flex items-start gap-2.5 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-white border-[#5B18E5] text-[#141132]'
                          : 'bg-white/60 border-purple-200 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          checked
                            ? 'bg-[#5B18E5] text-white'
                            : 'border border-slate-400'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6 Official EIS'26 Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EIS26_GUIDELINE_RULES.map((rule) => (
                <div
                  key={rule.number}
                  className={`p-4 rounded-xl border space-y-2 ${
                    rule.critical
                      ? 'bg-white border-[#5B18E5]/40'
                      : 'bg-white border-purple-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#5B18E5] tabular-nums">
                      PERATURAN {rule.number}
                    </span>
                    {rule.critical && (
                      <span className="text-[11px] font-extrabold text-rose-600">
                        Penting · Wajib Patuh
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold font-display">
                    {rule.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    {rule.summary}
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    {rule.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW MODE 4: 10-MINUTE JURY Q&A DEFENSE BANK
           =================================================================== */}
        {viewMode === 'qa-bank' && (
          <div className="w-full max-w-6xl bg-[#FAF9FF] rounded-2xl border border-purple-200 p-5 sm:p-8 space-y-5 text-[#141132]">
            <div className="pb-4 border-b border-purple-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#5B18E5]">
                  PERSEDIAAN SESI SOAL JAWAB (10 MINIT Q&amp;A EIS’26)
                </div>
                <h2 className="text-2xl font-extrabold font-display mt-1">
                  Bank Soalan &amp; Jawapan Padat Panel Juri
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetTimer('qa');
                  setIsTimerRunning(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#141132] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-300" />
                <span>Mulakan Pemasa 10 Minit Q&amp;A</span>
              </button>
            </div>

            <div className="divide-y divide-purple-200/80">
              {EIS26_JURY_QA_BANK.map((qa, idx) => (
                <div key={qa.id} className="py-4 first:pt-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[#5B18E5]">
                    <span>
                      0{idx + 1} · {qa.category}
                    </span>
                    <span className="text-slate-500">{qa.evidenceMetric}</span>
                  </div>
                  <h3 className="text-base font-extrabold font-display text-[#141132]">
                    S: &ldquo;{qa.question}&rdquo;
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-purple-200/80">
                    <strong className="text-[#5B18E5]">Jawapan Cadangan: </strong>
                    {qa.answerPoint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
