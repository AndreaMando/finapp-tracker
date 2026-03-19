"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Globe, AlertCircle, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff, Check, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Password rules
// ─────────────────────────────────────────────
const passwordRules = [
  { id: "length",  label: { 
      en: "At least 8 characters", 
      it: "Almeno 8 caratteri" 
    }, 
    test: (p: string) => p.length >= 8 },
  { id: "upper",   label: { 
      en: "At least one uppercase letter", 
      it: "Almeno una maiuscola" 
    }, 
    test: (p: string) => /[A-Z]/.test(p) },
  { id: "number",   label: { 
      en: "At least one number", 
      it: "Almeno un numero" 
    }, 
    test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: { 
      en: "At least one special character (!@#$…)", 
      it: "Almeno un carattere speciale (!@#$…)" 
    }, 
    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
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
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  const passwordRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (passwordRef.current && !passwordRef.current.contains(e.target as Node)) {
        setPasswordFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Rule evaluation
  const ruleResults = passwordRules.map(r => ({ ...r, passed: r.test(password) }));
  const allRulesPassed = ruleResults.every(r => r.passed);

  // Password match
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Form validity
  const isFormValid = name && email && allRulesPassed && passwordsMatch;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;
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

      {/* Subtle glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vh] h-[35vh] opacity-12 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, #00FFA3, transparent 70%)" }}
      />

      {/* Content block */}
      <motion.div
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
        className="relative z-10 w-full max-w-sm px-8 py-10"
      >

        {/* Logo + brand */}
        <div className="flex items-center gap-3 mb-10">
          <div style={{ width: 86, height: 86, borderRadius: "22%", overflow: "hidden", flexShrink: 0 }}>
            <Image src="/logo.png" alt="Vaulty" width={86} height={86}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} priority />
          </div>
          <div>
            <p className="font-bold text-white text-4xl tracking-tight leading-none">Vaulty</p>
            <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mt-2">{t("Personal Finance")}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">{t("Create your Account")}</h1>
        <p className="text-sm text-[#6b7280] mb-7">{t("Join Vaulty and take control of your finances.")}</p>

        <form onSubmit={handleRegister} className="space-y-4" noValidate>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[11px] font-semibold text-[#6b7280] tracking-widest uppercase">
              {t("Name")}
            </label>
            <input
              type="text" id="name" name="name" value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name" required disabled={isLoading} aria-required="true"
              className="block w-full px-4 py-3 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder="Mario Rossi"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[11px] font-semibold text-[#6b7280] tracking-widest uppercase">
              Email
            </label>
            <input
              type="email" id="email" name="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required disabled={isLoading} aria-required="true"
              className="block w-full px-4 py-3 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder={t("username@email.com")}
            />
          </div>

          {/* Password — with tooltip popover */}
          <div className="space-y-1.5" ref={passwordRef}>
            <label htmlFor="password" className="block text-[11px] font-semibold text-[#6b7280] tracking-widest uppercase">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password" name="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                autoComplete="new-password" required disabled={isLoading} aria-required="true"
                aria-describedby="password-rules"
                className="block w-full px-4 py-3 pr-12 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? t("Hide password") : t("Show password")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              {/* ── Rules tooltip ── */}
              <AnimatePresence>
                {passwordFocused && (
                  <motion.div
                    id="password-rules"
                    role="tooltip"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-0 top-[calc(100%+8px)] w-full bg-[#1a1d24] border border-[#252830] rounded-xl px-4 py-3 shadow-2xl z-50"
                  >
                    {/* Tooltip arrow */}
                    <div className="absolute -top-1.5 left-5 w-3 h-3 bg-[#1a1d24] border-l border-t border-[#252830] rotate-45" />

                    <p className="text-[10px] font-semibold text-[#6b7280] tracking-widest uppercase mb-2.5">
                      {t("Password Requirements")}
                    </p>
                    <div className="space-y-1.5">
                      {ruleResults.map(rule => (
                        <div key={rule.id} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            rule.passed ? "bg-[#00FFA3]/20" : "bg-[#252830]"
                          }`}>
                            {rule.passed
                              ? <Check size={9} className="text-[#00FFA3]" strokeWidth={3} />
                              : <X size={9} className="text-[#6b7280]" strokeWidth={3} />
                            }
                          </div>
                          <span className={`text-[11px] transition-colors duration-200 ${
                            rule.passed ? "text-[#00FFA3]" : "text-[#6b7280]"
                          }`}>
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
            <label htmlFor="confirm-password" className="block text-[11px] font-semibold text-[#6b7280] tracking-widest uppercase">
              {t("Confirm Password")}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="confirm-password" name="confirm-password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password" required disabled={isLoading} aria-required="true"
                aria-describedby={passwordsMismatch ? "confirm-error" : undefined}
                className={`block w-full px-4 py-3 pr-12 text-sm text-white bg-[#111318] border rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                  passwordsMismatch
                    ? "border-red-500/50 focus:ring-red-500 focus:border-red-500"
                    : passwordsMatch
                    ? "border-[#00FFA3]/50 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
                    : "border-[#252830] focus:ring-[#00FFA3] focus:border-[#00FFA3]"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors cursor-pointer"
                aria-label={showConfirm ? t("Hide password") : t("Show password")}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  {passwordsMatch
                    ? <Check size={13} className="text-[#00FFA3]" strokeWidth={3} />
                    : <X size={13} className="text-red-400" strokeWidth={3} />
                  }
                </div>
              )}
            </div>

            {/* Mismatch message */}
            <AnimatePresence>
              {passwordsMismatch && (
                <motion.p
                  id="confirm-error"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[11px] text-red-400 mt-1"
                >
                  {t("Passwords do not match")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
            >
              <AlertCircle size={13} className="shrink-0 text-red-400" aria-hidden="true" />
              <p className="text-xs font-medium text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-[#00FFA3]/10 border border-[#00FFA3]/20 rounded-xl px-4 py-3"
            >
              <CheckCircle2 size={13} className="shrink-0 text-[#00FFA3]" aria-hidden="true" />
              <p className="text-xs font-medium text-[#00FFA3]">{success}</p>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            aria-busy={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#00FFA3] hover:bg-[#00ffb3] active:bg-[#00cc82] text-[#0d0d0d] py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />{t("Creating account...")}</>
              : <>{t("Sign up")} <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <p className="text-xs text-[#6b7280] text-center mt-5">
          {t("Already have an account?")}{" "}
          <Link href="/" className="font-bold text-white hover:text-[#00FFA3] transition-colors focus:outline-none focus:underline">
            {t("Sign in")}
          </Link>
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Globe size={12} className="text-[#6b7280]" aria-hidden="true" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "it")}
            className="bg-transparent px-2 py-1.5 text-sm text-[#9ca3af] border-0 cursor-pointer focus:outline-none appearance-none transition-colors"
            aria-label={t("Select language")}
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