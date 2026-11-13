'use client';

import React, {useEffect, useRef, useState} from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  KeyRound,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {Profile} from '@/lib/types';

export interface EmailVerificationModalProps {
  /** The target email address receiving the 6-digit verification code */
  email: string;
  /** Controls whether the modal is visible (defaults to true when mounted) */
  isOpen?: boolean;
  /** Optional student display name shown in the recipient pill */
  displayName?: string;
  /** Optional faculty short code (e.g., FKI, FKJ) */
  facultyShort?: string;
  /** Optional simulated 6-digit OTP code from the server for preview testing */
  simulatedCode?: string;
  /** Initial countdown timer duration in seconds before Resend is enabled (default: 30) */
  initialCooldownSeconds?: number;
  /** Callback when the user closes/dismisses the modal */
  onClose?: () => void;
  /** Optional custom verification handler; if omitted, directly calls POST /api/auth */
  onVerifyCode?: (
    code: string
  ) => Promise<{ok: boolean; error?: string; profile?: Profile}>;
  /** Optional custom resend handler; if omitted, directly calls POST /api/auth */
  onResendCode?: () => Promise<{
    ok: boolean;
    error?: string;
    verificationCode?: string;
    message?: string;
  }>;
  /** Callback fired after /api/auth confirms the 6-digit code is valid */
  onVerifiedSuccess?: (result?: {
    email: string;
    profile?: Profile;
    token?: string;
  }) => void;
}

export function EmailVerificationModal({
  email,
  isOpen = true,
  displayName,
  facultyShort,
  simulatedCode,
  initialCooldownSeconds = 30,
  onClose,
  onVerifyCode,
  onResendCode,
  onVerifiedSuccess,
}: EmailVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(initialCooldownSeconds);
  const [overriddenHintCode, setOverriddenHintCode] = useState<string | null>(
    null
  );

  const activeHintCode = overriddenHintCode ?? simulatedCode ?? '';
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Focus first digit box when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, email]);

  // 1-second interval countdown timer for resending verification code
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const interval = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, cooldown]);

  if (!isOpen) return null;

  const combinedCode = digits.join('');
  const formattedCountdown = `00:${String(cooldown).padStart(2, '0')}`;

  const handleDigitChange = (index: number, rawValue: string) => {
    setErrorMsg(null);
    setInfoMsg(null);
    const numeric = rawValue.replace(/\D/g, '');

    if (!numeric) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    // Handle multi-character input or paste into any single box
    if (numeric.length > 1) {
      const chars = numeric.slice(0, 6).split('');
      setDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < 6; i++) {
          if (chars[i] !== undefined) {
            next[i] = chars[i];
          }
        }
        return next;
      });
      const focusIdx = Math.min(5, chars.length - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const char = numeric.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    setErrorMsg(null);
    setInfoMsg(null);
    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);
    const nextFocus = Math.min(5, pasted.length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const handleAutoFillSimulatedCode = () => {
    if (!activeHintCode || activeHintCode.length < 6) return;
    setErrorMsg(null);
    setInfoMsg('Kod pengesahan 6-digit telah diisi secara automatik.');
    setDigits(activeHintCode.slice(0, 6).split(''));
    inputRefs.current[5]?.focus();
  };

  // Triggers POST /api/auth verification endpoint upon submission
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (combinedCode.length !== 6) {
      setErrorMsg('Sila masukkan kesemua 6 digit kod pengesahan e-mel anda.');
      return;
    }

    setIsVerifying(true);
    try {
      if (onVerifyCode) {
        const customResult = await onVerifyCode(combinedCode);
        setIsVerifying(false);
        if (!customResult.ok) {
          setErrorMsg(
            customResult.error ||
              'Kod pengesahan tidak sepadan. Sila semak semula 6 digit kod anda.'
          );
          return;
        }
        onVerifiedSuccess?.({
          email,
          profile: customResult.profile,
        });
        return;
      }

      // Direct call to /api/auth verification endpoint
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'verify_signup_code',
          email: email.trim().toLowerCase(),
          code: combinedCode,
        }),
      });
      const data = await response.json();
      setIsVerifying(false);

      if (!response.ok || !data.ok) {
        setErrorMsg(
          data.error ||
            'Kod pengesahan 6-digit tidak sah. Sila cuba lagi.'
        );
        return;
      }

      setInfoMsg(
        data.message || `Alamat e-mel ${email} telah berjaya disahkan!`
      );
      onVerifiedSuccess?.({
        email,
        profile: data.profile as Profile | undefined,
        token: data.token as string | undefined,
      });
    } catch {
      setIsVerifying(false);
      setErrorMsg('Gagal menghubungi endpoint pengesahan /api/auth.');
    }
  };

  // Triggers POST /api/auth resend verification endpoint when countdown reaches 0
  const handleResendClick = async () => {
    if (isResending || cooldown > 0) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setIsResending(true);

    try {
      let res: {
        ok: boolean;
        error?: string;
        verificationCode?: string;
        message?: string;
      };

      if (onResendCode) {
        res = await onResendCode();
      } else {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            action: 'resend_verification_code',
            email: email.trim().toLowerCase(),
            displayName,
            facultyShort,
          }),
        });
        const data = await response.json();
        res = {
          ok: Boolean(response.ok && data.ok),
          error: data.error,
          verificationCode: data.verificationCode
            ? String(data.verificationCode)
            : undefined,
          message: data.message,
        };
      }

      setIsResending(false);

      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal menghantar semula kod pengesahan.');
        return;
      }

      if (res.verificationCode) {
        setOverriddenHintCode(res.verificationCode);
      }
      setDigits(['', '', '', '', '', '']);
      setCooldown(initialCooldownSeconds);
      setInfoMsg(
        res.message ||
          `Kod pengesahan 6-digit baharu telah dihantar ke ${email}.`
      );
      inputRefs.current[0]?.focus();
    } catch {
      setIsResending(false);
      setErrorMsg('Gagal menghubungi pelayan /api/auth untuk menghantar kod.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-verification-modal-title"
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-[#12042B]/80 backdrop-blur-md p-3 pb-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[390px] rounded-[34px] bg-white shadow-[0_24px_70px_rgba(15,4,40,0.65)] border border-purple-100 overflow-hidden">
        {/* Top Decorative Gradient Header */}
        <div className="relative bg-gradient-to-br from-[#6E23F7] via-[#5B18E5] to-[#3B0A99] px-6 pt-6 pb-6 text-white">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close email verification modal"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.4]" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner shrink-0">
              <Mail className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-extrabold uppercase tracking-wider text-purple-100 mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>Pengesahan E-mel (/api/auth)</span>
              </div>
              <h2
                id="email-verification-modal-title"
                className="text-[20px] font-extrabold font-display tracking-tight text-white leading-tight"
              >
                Verify Your Email
              </h2>
            </div>
          </div>

          <p className="mt-3 text-[11.5px] text-purple-100/90 leading-relaxed">
            Masukkan kod pengesahan 6-digit yang telah dihantar ke alamat e-mel
            pelajar anda:
          </p>

          <div className="mt-2 rounded-2xl bg-black/25 border border-white/15 px-3.5 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[12px] font-extrabold text-white truncate">
                {email}
              </div>
              {displayName && (
                <div className="text-[10px] text-purple-200/85 truncate">
                  {displayName} {facultyShort ? `· ${facultyShort}` : ''}
                </div>
              )}
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/35 text-[9.5px] font-extrabold text-emerald-200">
              6-Digit OTP
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmitVerification}
          className="px-6 pt-5 pb-6 space-y-4"
        >
          {/* Simulated UMS Webmail OTP Notification Banner for Preview Testing */}
          {activeHintCode && (
            <div className="rounded-2xl bg-[#F5F0FF] border border-purple-200/90 p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#6315EA] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <KeyRound className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6315EA]">
                    Peti Masuk Simulasi UMS
                  </div>
                  <div className="text-[12px] font-bold text-[#141132] truncate">
                    Kod OTP Anda:{' '}
                    <span className="font-mono font-extrabold tracking-widest text-[#6315EA] bg-white px-1.5 py-0.5 rounded-md border border-purple-200">
                      {activeHintCode}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoFillSimulatedCode}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-[10.5px] font-extrabold text-[#6315EA] shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Kod</span>
              </button>
            </div>
          )}

          {/* Error or Info Feedback Banner */}
          {(errorMsg || infoMsg) && (
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-[11.5px] font-bold leading-snug border ${
                errorMsg
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {errorMsg || infoMsg}
            </div>
          )}

          {/* 6-Digit Verification Code Input Field */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                Kod Pengesahan 6-Digit
              </label>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#6315EA]">
                <Clock className="w-3 h-3" />
                <span>
                  {cooldown > 0
                    ? `Hantar semula dalam ${formattedCountdown}`
                    : 'Sedia dihantar semula'}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${idx + 1} of 6`}
                  className={`w-full h-12 rounded-2xl text-center font-mono text-[18px] font-extrabold transition-all focus:outline-none ${
                    digit
                      ? 'bg-[#F3EEFF] border-2 border-[#6315EA] text-[#141132] shadow-[0_4px_12px_rgba(99,21,234,0.12)]'
                      : 'bg-[#EFEcf6] border-2 border-transparent focus:border-[#6315EA]/50 focus:bg-white text-[#141132]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Primary Submit Button -> Triggers /api/auth verification */}
          <button
            type="submit"
            disabled={isVerifying || combinedCode.length !== 6}
            className="w-full py-3.5 rounded-full bg-[#120E2E] hover:bg-[#1E1848] disabled:opacity-50 text-white font-extrabold text-[13.5px] shadow-[0_10px_26px_rgba(18,14,46,0.28)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <span>Sedang Mengesahkan (/api/auth)...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.6]" />
                <span>Verify &amp; Complete Registration</span>
                <ArrowRight className="w-4 h-4 stroke-[2.4]" />
              </>
            )}
          </button>

          {/* Resend Code Countdown Timer & Back Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="font-bold text-slate-500 hover:text-[#141132] transition-colors cursor-pointer"
              >
                ← Ubah Maklumat
              </button>
            ) : (
              <span className="text-slate-400 font-medium">
                Semak peti masuk e-mel UMS
              </span>
            )}

            <button
              type="button"
              disabled={isResending || cooldown > 0}
              onClick={handleResendClick}
              className="inline-flex items-center gap-1.5 font-extrabold text-[#6315EA] disabled:text-slate-400 hover:text-[#4C1D95] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isResending ? (
                <span>Menghantar...</span>
              ) : cooldown > 0 ? (
                <span>Resend Code ({formattedCountdown})</span>
              ) : (
                <span>Resend Verification Code</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmailVerificationModal;
