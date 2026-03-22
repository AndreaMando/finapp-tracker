"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Globe, AlertCircle, Loader2, ArrowRight,
  CheckCircle2, Eye, EyeOff, Check, X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Password rules
// ─────────────────────────────────────────────
const passwordRules = [
  {
    id: "length",
    label: { en: "At least 8 characters",                   it: "Almeno 8 caratteri"                      },
    test: (p: string) => p.length >= 8,
  },
  {
    id: "upper",
    label: { en: "At least one uppercase letter",           it: "Almeno una maiuscola"                    },
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    label: { en: "At least one number",                     it: "Almeno un numero"                        },
    test: (p: string) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: { en: "At least one special character (!@#$…)",  it: "Almeno un carattere speciale (!@#$…)"    },
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // P8: inline validation — only show errors after field is blurred
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  // P7: respect prefers-reduced-motion
  const reduceMotion = useReducedMotion() ?? false;

  const passwordRef = useRef<HTMLDivElement>(null);
  // P8: focus management — ref to first error field
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // P1: close tooltip on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (passwordRef.current && !passwordRef.current.contains(e.target as Node)) {
        setPasswordFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // P1: close tooltip on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPasswordFocused(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Rule evaluation
  const ruleResults = passwordRules.map(r => ({ ...r, passed: r.test(password) }));
  const allRulesPassed = ruleResults.every(r => r.passed);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isFormValid = name && email && allRulesPassed && passwordsMatch;

  // P7: transition helper
  const trans = (opts: object) => reduceMotion ? { duration: 0 } : opts;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) {
      // P8: focus first invalid field
      if (!name) { nameRef.current?.focus(); return; }
      if (!email) { emailRef.current?.focus(); return; }
      return;
    }
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error) || t("An error occurred. Please try again."));
        setIsLoading(false);
        return;
      }
      setSuccess(t("Registration successful! Redirecting to login..."));
      setTimeout(() => router.push("/"), 1800);
    } catch {
      setError(t("Could not connect to the server. Please try again later."));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d0d0d] flex items-center justify-center min-h-[100dvh]">

      {/* Decorative glow — aria-hidden */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vh] h-[35vh] opacity-12 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, #00FFA3, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* P7: content block entrance — respects reduced motion */}
      <motion.div
        initial={{ opacity: 0, x: reduceMotion ? 0 : 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={trans({ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] as const })}
        className="relative z-10 w-full max-w-sm px-8 py-10"
      >

        {/* Logo + brand */}
        <div className="flex items-center gap-3 mb-10">
          <div style={{ width: 86, height: 86, borderRadius: "22%", overflow: "hidden", flexShrink: 0 }}>
            <Image
              src="/logo.png"
              alt="Vaulty logo"
              // P3: 2× for Retina sharpness
              width={172}
              height={172}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              priority
            />
          </div>
          <div>
            <p className="font-bold text-white text-4xl tracking-tight leading-none">Vaulty</p>
            <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mt-2">
              {t("Personal Finance")}
            </p>
          </div>
        </div>

        {/* P1: h1 page title */}
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          {t("Create your Account")}
        </h1>
        <p className="text-sm text-[#6b7280] mb-7">
          {t("Join Vaulty and take control of your finances.")}
        </p>

        <form
          onSubmit={handleRegister}
          className="space-y-4"
          noValidate
          aria-label={t("Registration form")}
        >

          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase"
            >
              {t("Name")}
              {/* P8: required indicator */}
              <span className="text-[#00FFA3] ml-1" aria-hidden="true">*</span>
            </label>
            <input
              ref={nameRef}
              type="text" id="name" name="name" value={name}
              onChange={(e) => setName(e.target.value)}
              // P8: validate on blur, not on keystroke
              onBlur={() => setNameTouched(true)}
              autoComplete="name" required disabled={isLoading} aria-required="true"
              aria-invalid={nameTouched && !name ? "true" : undefined}
              className="block w-full px-4 py-3 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder="Mario Rossi"
            />
            {/* P8: inline error after blur */}
            {nameTouched && !name && (
              <p className="text-[11px] text-red-400 mt-1" role="alert">
                {t("Name is required")}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase"
            >
              Email
              <span className="text-[#00FFA3] ml-1" aria-hidden="true">*</span>
            </label>
            <input
              ref={emailRef}
              type="email" id="email" name="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              autoComplete="email" required disabled={isLoading} aria-required="true"
              aria-invalid={emailTouched && !email ? "true" : undefined}
              className="block w-full px-4 py-3 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder={t("username@email.com")}
            />
            {emailTouched && !email && (
              <p className="text-[11px] text-red-400 mt-1" role="alert">
                {t("Email is required")}
              </p>
            )}
          </div>

          {/* Password + tooltip */}
          <div className="space-y-1.5" ref={passwordRef}>
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase"
            >
              Password
              <span className="text-[#00FFA3] ml-1" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password" name="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                autoComplete="new-password" required disabled={isLoading} aria-required="true"
                // P1: link to tooltip for screen readers
                aria-describedby="password-rules"
                aria-invalid={password.length > 0 && !allRulesPassed ? "true" : undefined}
                // P2: pr-12 leaves room for eye icon touch target
                className="block w-full px-4 py-3 pr-12 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />

              {/* P2: full-height eye button = 44×44 touch area */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("Hide password") : t("Show password")}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-[#6b7280] hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded-r-xl"
              >
                {showPassword
                  ? <EyeOff size={16} aria-hidden="true" />
                  : <Eye size={16} aria-hidden="true" />
                }
              </button>

              {/* Rules tooltip */}
              <AnimatePresence>
                {passwordFocused && (
                  <motion.div
                    id="password-rules"
                    // P1: status instead of tooltip — screen readers read it without hover
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 6, scale: reduceMotion ? 1 : 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : 4, scale: reduceMotion ? 1 : 0.97 }}
                    transition={trans({ duration: 0.18, ease: "easeOut" as const })}
                    className="absolute left-0 top-[calc(100%+8px)] w-full bg-[#1a1d24] border border-[#252830] rounded-xl px-4 py-3 shadow-2xl z-50"
                  >
                    {/* Arrow */}
                    <div
                      className="absolute -top-1.5 left-5 w-3 h-3 bg-[#1a1d24] border-l border-t border-[#252830] rotate-45"
                      aria-hidden="true"
                    />
                    <p className="text-[10px] font-semibold text-[#6b7280] tracking-widest uppercase mb-2.5">
                      {t("Password Requirements")}
                    </p>
                    <div className="space-y-1.5" role="list">
                      {ruleResults.map(rule => (
                        <div key={rule.id} className="flex items-center gap-2" role="listitem">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                              rule.passed ? "bg-[#00FFA3]/20" : "bg-[#252830]"
                            }`}
                            aria-hidden="true"
                          >
                            {rule.passed
                              ? <Check size={9} className="text-[#00FFA3]" strokeWidth={3} />
                              : <X size={9} className="text-[#6b7280]" strokeWidth={3} />
                            }
                          </div>
                          <span
                            className={`text-[11px] transition-colors duration-200 ${
                              rule.passed ? "text-[#00FFA3]" : "text-[#6b7280]"
                            }`}
                          >
                            {/* P1: screen reader gets explicit pass/fail */}
                            <span className="sr-only">{rule.passed ? "✓ " : "✗ "}</span>
                            {rule.label[lang]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase"
            >
              {t("Confirm Password")}
              <span className="text-[#00FFA3] ml-1" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="confirm-password" name="confirm-password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password" required disabled={isLoading} aria-required="true"
                aria-describedby={passwordsMismatch ? "confirm-error" : undefined}
                aria-invalid={passwordsMismatch ? "true" : undefined}
                className={`block w-full px-4 py-3 pr-20 text-sm text-white bg-[#111318] border rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                  passwordsMismatch
                    ? "border-red-500/50 focus:ring-red-500 focus:border-red-500"
                    : passwordsMatch
                    ? "border-[#00FFA3]/50 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
                    : "border-[#252830] focus:ring-[#00FFA3] focus:border-[#00FFA3]"
                }`}
                placeholder="••••••••"
              />

              {/* Match indicator — aria-hidden, color is not sole indicator (P1) */}
              {confirmPassword.length > 0 && (
                <div
                  className="absolute right-12 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                >
                  {passwordsMatch
                    ? <Check size={13} className="text-[#00FFA3]" strokeWidth={3} />
                    : <X size={13} className="text-red-400" strokeWidth={3} />
                  }
                </div>
              )}

              {/* P2: full-height eye button */}
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? t("Hide password") : t("Show password")}
                aria-pressed={showConfirm}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-[#6b7280] hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded-r-xl"
              >
                {showConfirm
                  ? <EyeOff size={16} aria-hidden="true" />
                  : <Eye size={16} aria-hidden="true" />
                }
              </button>
            </div>

            {/* P8: mismatch error near the field */}
            <AnimatePresence>
              {passwordsMismatch && (
                <motion.p
                  id="confirm-error"
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={trans({ duration: 0.15 })}
                  className="text-[11px] text-red-400 mt-1"
                >
                  {t("Passwords do not match")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Server error */}
          {error && (
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={trans({ duration: 0.2 })}
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
            >
              <AlertCircle size={13} className="shrink-0 text-red-400" aria-hidden="true" />
              <p className="text-xs font-medium text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={trans({ duration: 0.2 })}
              className="flex items-center gap-2.5 bg-[#00FFA3]/10 border border-[#00FFA3]/20 rounded-xl px-4 py-3"
            >
              <CheckCircle2 size={13} className="shrink-0 text-[#00FFA3]" aria-hidden="true" />
              <p className="text-xs font-medium text-[#00FFA3]">{success}</p>
            </motion.div>
          )}

          {/* P2: py-3 = min 44px, active:scale feedback */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            aria-busy={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#00FFA3] hover:bg-[#00ffb3] active:bg-[#00cc82] active:scale-[0.98] text-[#0d0d0d] py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />{t("Creating account...")}</>
              : <>{t("Sign up")} <ArrowRight size={15} aria-hidden="true" /></>
            }
          </button>
        </form>

        <p className="text-xs text-[#6b7280] text-center mt-5">
          {t("Already have an account?")}{" "}
          <Link
            href="/"
            className="font-bold text-white hover:text-[#00FFA3] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded"
          >
            {t("Sign in")}
          </Link>
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Globe size={12} className="text-[#6b7280]" aria-hidden="true" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "it")}
            aria-label={t("Select language")}
            className="bg-transparent px-2 py-1.5 text-sm text-[#9ca3af] border-0 cursor-pointer focus:outline-none appearance-none transition-colors hover:text-white"
          >
            <option value="en" className="bg-[#1a1d24] text-white">English</option>
            <option value="it" className="bg-[#1a1d24] text-white">Italiano</option>
          </select>
        </div>

        <p className="text-[10px] text-[#252830] text-center tracking-wide mt-6">
          © {new Date().getFullYear()} Vaulty
        </p>
      </motion.div>
    </div>
  );
}