"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Globe, AlertCircle, Loader2, ArrowRight,
  CheckCircle2, Eye, EyeOff, Check, X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Logo } from "@/components/Logo";

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

  const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isEmailValid = !email || isValidEmail(email);

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
    <div className="fixed inset-0 bg-bg flex items-center justify-center min-h-[100dvh] overflow-y-auto">

      {/* P7: content block entrance — respects reduced motion */}
      <motion.div
        initial={{ opacity: 0, x: reduceMotion ? 0 : 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={trans({ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] as const })}
        className="relative z-10 w-full max-w-sm px-8 py-10"
      >

        {/* Logo + brand */}
        <div className="flex items-center gap-3 mb-10">
          <Logo size={62} className="text-ink shrink-0" />
          <div>
            <p className="font-semibold text-ink text-4xl tracking-tight leading-none">Vaulty</p>
            <p className="text-ink-faint text-[10px] font-mono tracking-widest uppercase mt-2">
              {t("Personal Finance")}
            </p>
          </div>
        </div>

        {/* P1: h1 page title */}
        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">
          {t("Create your Account")}
        </h1>
        <p className="text-sm text-ink-muted mb-7">
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
              className="block text-[11px] font-semibold text-ink-muted tracking-widest uppercase"
            >
              {t("Name")}
              {/* P8: required indicator */}
              <span className="text-accent ml-1" aria-hidden="true">*</span>
            </label>
            <input
              ref={nameRef}
              type="text" id="name" name="name" value={name}
              onChange={(e) => setName(e.target.value)}
              // P8: validate on blur, not on keystroke
              onBlur={() => setNameTouched(true)}
              autoComplete="name" required disabled={isLoading} aria-required="true"
              aria-invalid={nameTouched && !name ? "true" : undefined}
              className="block w-full px-4 py-3 text-sm text-ink bg-surface border border-hairline rounded-lg placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder="Mario Rossi"
            />
            {/* P8: inline error after blur */}
            {nameTouched && !name && (
              <p className="text-[11px] text-negative mt-1" role="alert">
                {t("Name is required")}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold text-ink-muted tracking-widest uppercase"
            >
              Email
              <span className="text-accent ml-1" aria-hidden="true">*</span>
            </label>
            <input
              ref={emailRef}
              type="email" id="email" name="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              autoComplete="email" required disabled={isLoading} aria-required="true"
              aria-invalid={emailTouched && !isEmailValid ? "true" : undefined}
              className="block w-full px-4 py-3 text-sm text-ink bg-surface border border-hairline rounded-lg placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder={t("username@email.com")}
            />
            {emailTouched && email && !isEmailValid && (
              <p className="text-[11px] text-negative mt-1" role="alert">
                {t("Please enter a valid email address")}
              </p>
            )}
          </div>

          {/* Password + tooltip */}
          <div className="space-y-1.5" ref={passwordRef}>
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold text-ink-muted tracking-widest uppercase"
            >
              Password
              <span className="text-accent ml-1" aria-hidden="true">*</span>
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
                className="block w-full px-4 py-3 pr-12 text-sm text-ink bg-surface border border-hairline rounded-lg placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />

              {/* P2: full-height eye button = 44×44 touch area */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("Hide password") : t("Show password")}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-r-lg"
              >
                {showPassword
                  ? <EyeOff size={16} aria-hidden="true" />
                  : <Eye size={16} aria-hidden="true" />
                }
              </button>
            </div>

            {/* Rules panel — P1 fix: in normal document flow (not absolutely
                overlaid) so it pushes Confirm Password / Sign Up down instead
                of covering them and causing a dead click while open. */}
            <AnimatePresence initial={false}>
              {passwordFocused && (
                <motion.div
                  key="password-rules-wrapper"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={trans({ duration: 0.18, ease: "easeOut" as const })}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    id="password-rules"
                    // P1: status instead of tooltip — screen readers read it without hover
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="relative mt-2 bg-surface-sunken border border-hairline rounded-lg px-4 py-3"
                  >
                    <p className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase mb-2.5">
                      {t("Password Requirements")}
                    </p>
                    <div className="space-y-1.5" role="list">
                      {ruleResults.map(rule => (
                        <div key={rule.id} className="flex items-center gap-2" role="listitem">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                              rule.passed ? "bg-accent/20" : "bg-hairline"
                            }`}
                            aria-hidden="true"
                          >
                            {rule.passed
                              ? <Check size={9} className="text-accent" strokeWidth={3} />
                              : <X size={9} className="text-ink-faint" strokeWidth={3} />
                            }
                          </div>
                          <span
                            className={`text-[11px] transition-colors duration-200 ${
                              rule.passed ? "text-accent" : "text-ink-muted"
                            }`}
                          >
                            {/* P1: screen reader gets explicit pass/fail */}
                            <span className="sr-only">{rule.passed ? "✓ " : "✗ "}</span>
                            {rule.label[lang]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-[11px] font-semibold text-ink-muted tracking-widest uppercase"
            >
              {t("Confirm Password")}
              <span className="text-accent ml-1" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="confirm-password" name="confirm-password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password" required disabled={isLoading} aria-required="true"
                aria-describedby={passwordsMismatch ? "confirm-error" : undefined}
                aria-invalid={passwordsMismatch ? "true" : undefined}
                className={`block w-full px-4 py-3 pr-20 text-sm text-ink bg-surface border rounded-lg placeholder-ink-faint transition-all focus:outline-none focus:ring-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                  passwordsMismatch
                    ? "border-negative/50 focus:ring-negative focus:border-negative"
                    : passwordsMatch
                    ? "border-accent/50 focus:ring-accent focus:border-accent"
                    : "border-hairline focus:ring-accent focus:border-accent"
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
                    ? <Check size={13} className="text-accent" strokeWidth={3} />
                    : <X size={13} className="text-negative" strokeWidth={3} />
                  }
                </div>
              )}

              {/* P2: full-height eye button */}
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? t("Hide password") : t("Show password")}
                aria-pressed={showConfirm}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-r-lg"
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
                  className="text-[11px] text-negative mt-1"
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
              className="flex items-center gap-2.5 bg-negative/10 border border-negative/20 rounded-lg px-4 py-3"
            >
              <AlertCircle size={13} className="shrink-0 text-negative" aria-hidden="true" />
              <p className="text-xs font-medium text-negative">{error}</p>
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
              className="flex items-center gap-2.5 bg-accent/10 border border-accent/20 rounded-lg px-4 py-3"
            >
              <CheckCircle2 size={13} className="shrink-0 text-accent" aria-hidden="true" />
              <p className="text-xs font-medium text-accent">{success}</p>
            </motion.div>
          )}

          {/* P2: py-3 = min 44px, active:scale feedback */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            aria-busy={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:brightness-110 active:brightness-95 active:scale-[0.98] text-accent-contrast py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />{t("Creating account...")}</>
              : <>{t("Sign up")} <ArrowRight size={15} aria-hidden="true" /></>
            }
          </button>
        </form>

        <p className="text-xs text-ink-muted text-center mt-5">
          {t("Already have an account?")}{" "}
          <Link
            href="/"
            className="font-semibold text-ink hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            {t("Sign in")}
          </Link>
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Globe size={12} className="text-ink-faint" aria-hidden="true" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "it")}
            aria-label={t("Select language")}
            className="bg-transparent px-2 py-1.5 text-sm text-ink-muted border-0 cursor-pointer focus:outline-none appearance-none transition-colors hover:text-ink"
          >
            <option value="en" className="bg-surface text-ink">English</option>
            <option value="it" className="bg-surface text-ink">Italiano</option>
          </select>
        </div>

        <p className="text-[10px] text-ink-faint text-center tracking-wide mt-6">
          © {new Date().getFullYear()} Vaulty
        </p>
      </motion.div>
    </div>
  );
}
