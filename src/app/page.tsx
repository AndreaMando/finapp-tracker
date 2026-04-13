"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Globe, AlertCircle, Loader2, ArrowRight,
  TrendingUp, RefreshCw, Target, LayoutDashboard,
  Eye, EyeOff,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import DashboardPage from "./(authenticated)/dashboard/page";

// ─────────────────────────────────────────────
// Slide definitions
// ─────────────────────────────────────────────
const slides = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label:       { en: "Dashboard",  it: "Panoramica"   },
    title:       { en: "Everything under control",                   it: "Tutto sotto controllo"         },
    description: { en: "Monthly income, expenses and savings in a single dashboard. Always up to date.", it: "Entrate, spese e risparmi in un unico cruscotto mensile. Sempre aggiornato." },
    accentColor: "#00FFA3",
    screenshot:  { en: "/screenshots/dashboard_en.png", it: "/screenshots/dashboard_it.png" },
  },
  {
    id: "income",
    icon: TrendingUp,
    label:       { en: "Income",     it: "Entrate"      },
    title:       { en: "Track every income",                         it: "Traccia ogni guadagno"         },
    description: { en: "Record your salary and monitor the monthly progress with a complete history.",   it: "Registra lo stipendio e monitora l'andamento mese per mese con storico completo." },
    accentColor: "#66dae9",
    screenshot:  { en: "/screenshots/income_en.png",    it: "/screenshots/income_it.png"    },
  },
  {
    id: "expenses",
    icon: RefreshCw,
    label:       { en: "Expenses",   it: "Spese fisse"  },
    title:       { en: "Zero surprises at the end of the month",     it: "Zero sorprese a fine mese"     },
    description: { en: "Subscriptions, insurance and installments always visible. No forgotten expenses.", it: "Abbonamenti, assicurazioni e rate sempre visibili. Nessuna spesa dimenticata." },
    accentColor: "#fb923c",
    screenshot:  { en: "/screenshots/expenses_en.png",  it: "/screenshots/expenses_it.png"  },
  },
  {
    id: "goals",
    icon: Target,
    label:       { en: "Goals",      it: "Obiettivi"    },
    title:       { en: "Save with a plan",                           it: "Risparmia con metodo"          },
    description: { en: "Create savings goals, track your progress and plan for the future.",             it: "Crea obiettivi di risparmio, monitora i progressi e pianifica il futuro."    },
    accentColor: "#f02b76",
    screenshot:  { en: "/screenshots/goals_en.png",     it: "/screenshots/goals_it.png"     },
  },
];

// ─────────────────────────────────────────────
// Feature carousel — right column
// ─────────────────────────────────────────────
function FeatureCarousel({ reduceMotion }: { reduceMotion: boolean }) {
  const [current, setCurrent] = useState(0);
  const { t, lang } = useTranslation();

  // P7: pause auto-advance when reduced motion is on
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const slide = slides[current];
  const Icon = slide.icon;

  // P7: skip transform animations when reduced motion
  const transition = reduceMotion
  ? { duration: 0 as const }
  : { duration: 0.25, ease: "easeOut" as const };

  return (
    <div className="flex flex-col h-full">

      {/* Section 1: Motto */}
      <div className="flex items-center justify-center flex-1">
        {/* P1: landmark text, not decorative */}
        <p
          className="text-white font-bold italic text-center leading-tight tracking-tight"
          style={{ fontSize: "clamp(1.3rem, 2vw, 2rem)" }}
        >
          {t("Because our goal is to make your goals easier.")}
        </p>
      </div>

      {/* P1: keyboard-accessible dot navigation */}
      <div
        className="flex gap-1.5 mt-4 justify-center"
        role="tablist"
        aria-label="Seleziona schermata"
      >
        {slides.map((s, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={s.label[lang]}
            // P2: 44×44 touch target via padding
            onClick={() => setCurrent(i)}
            className="cursor-pointer p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded"
          >
            <div
              className="h-1 rounded-full"
              style={{
                width: i === current ? "20px" : "6px",
                backgroundColor: i === current ? slide.accentColor : "#363a44",
                transition: reduceMotion ? "none" : "all 300ms",
              }}
            />
          </button>
        ))}
      </div>

      {/* Section 2: Title + description */}
      <div className="flex flex-col items-center flex-1 justify-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`desc-${current}`}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            transition={transition}
            className="text-center"
            // P1: live region so screen readers announce changes
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex justify-center items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${slide.accentColor}25` }}
                aria-hidden="true"
              >
                <Icon size={13} style={{ color: slide.accentColor }} />
              </div>
              <h2 className="text-lg font-bold text-white leading-tight max-w-sm">
                {slide.title[lang]}
              </h2>
            </div>
            <p className="text-sm text-[#6b7280] leading-relaxed max-w-sm">
              {slide.description[lang]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Section 3: Screenshot in browser mockup */}
      <div className="flex flex-col items-center flex-1 justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`img-${current}`}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -14 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
            className="w-[60%] relative"
          >
            <div className="bg-[#1a1d24] rounded-xl overflow-hidden border border-[#252830] shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#111318] border-b border-[#252830]">
                <div className="flex gap-1.5 shrink-0" aria-hidden="true">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#363a44]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#363a44]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#363a44]" />
                </div>
                <div className="flex-1 bg-[#1a1d24] rounded-md px-2.5 py-1 flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: slide.accentColor }} aria-hidden="true" />
                  <span className="text-[9px] text-[#6b7280] font-mono truncate">app.vaulty.io/{slide.id}</span>
                </div>
              </div>
              {/* P3: explicit aspect ratio prevents CLS */}
              <div className="relative w-full opacity-80" style={{ aspectRatio: "16/10" }}>
                <Image
                  src={slide.screenshot[lang]}
                  // P1: meaningful alt text describing the screen
                  alt={`Schermata ${slide.label[lang]} di Vaulty`}
                  fill
                  className="object-cover object-top"
                  // P3: correct sizes for 60% of the right column (~30% of viewport)
                  sizes="(min-width: 1024px) 60vw, 0px"
                  // P3: only first slide eager, rest lazy
                  priority={current === 0}
                  loading={current === 0 ? undefined : "lazy"}
                />
              </div>
            </div>
            {/* Glow */}
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full blur-xl opacity-30 pointer-events-none"
              style={{ backgroundColor: slide.accentColor }}
              aria-hidden="true"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main LoginPage
// ─────────────────────────────────────────────
export default function LoginPage() {
  const [phase, setPhase] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  // P7: respect prefers-reduced-motion system setting
  const reduceMotion = useReducedMotion() ?? false;
  // P8: ref to focus email after error
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), reduceMotion ? 0 : 200);
    const t2 = setTimeout(() => setPhase(2), reduceMotion ? 0 : 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduceMotion]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await signIn("credentials", { redirect: false, email, password });
    setIsLoading(false);
    if (result && !result.error) {
      setIsLoggedIn(true);
      setTimeout(() => router.push("/dashboard"), 200);
    } else {
      setError(t("Invalid credentials. Please try again."));
      // P8: focus-management — move focus to email field after error
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  };

  const logoStates = {
    0: { top: "50%", left: "50%",  x: "-50%", y: "-50%", width: 140, height: 140 },
    1: { top: "36px", left: "50%", x: "-50%", y: "0%",   width: 88,  height: 88  },
    2: { top: "28px", left: "40px", x: "0%",  y: "0%",   width: 66,  height: 66  },
  };
  const ls = logoStates[phase as 0 | 1 | 2];

  // P7: skip logo animation entirely if reduced motion
  const logoTransition = reduceMotion
  ? { duration: 0 as const }
  : { duration: 0.75, ease: [0.43, 0.13, 0.23, 0.96] as const };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0d0d0d]">

      {/* Animated logo */}
      <motion.div
        initial={{ top: ls.top, left: ls.left, x: ls.x, y: ls.y, width: ls.width, height: ls.height }}
        animate={{ top: ls.top, left: ls.left, x: ls.x, y: ls.y, width: ls.width, height: ls.height }}
        transition={logoTransition}
        style={{ position: "fixed", zIndex: 100, borderRadius: "22%" }}
        className="overflow-hidden"
        // P1: decorative — hidden from screen readers
        aria-hidden="true"
      >
        <Image
          src="/logo.png"
          alt=""
          // P3: 2× the display size for Retina sharpness
          width={280}
          height={280}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          priority
        />
      </motion.div>

      <AnimatePresence>
        {phase > 0 && !isLoggedIn && (
          <motion.div
            key="layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.4 }}
            className="flex h-[100dvh] w-full"
          >
            {/* Left column */}
            <div className="w-full lg:w-[420px] shrink-0 flex flex-col h-full bg-[#0d0d0d] z-20 border-r border-[#1a1d24] px-10 py-7">

              {/* Logo spacer + brand text */}
              <div className="flex items-center gap-3" style={{ minHeight: 66 }}>
                <div style={{ width: 66, height: 66, flexShrink: 0 }} aria-hidden="true" />
                <AnimatePresence>
                  {phase >= 2 && (
                    <motion.div
                      key="brand-text"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut", delay: 0.55 }}
                    >
                      <p className="font-bold text-white text-4xl tracking-tight leading-none">Vaulty</p>
                      <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mt-2">
                        {t("Personal Finance")}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1" />

              {/* Form block */}
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: "easeOut", delay: 0.35 }}
              >
                {/* P1: h1 is the page title */}
                <h1 className="text-4xl font-bold text-white tracking-tight mb-1">
                  {t("Welcome back")}
                </h1>
                <p className="text-sm text-[#6b7280] mb-6">
                  {t("Sign in to your account to continue")}
                </p>

                {/* P1: role="main" equivalent via semantic form */}
                <form
                  onSubmit={handleLogin}
                  className="space-y-4"
                  noValidate
                  aria-label={t("Sign in form")}
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase"
                    >
                      Email
                    </label>
                    <input
                      ref={emailRef}
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      disabled={isLoading}
                      aria-required="true"
                      aria-describedby={error ? "login-error" : undefined}
                      aria-invalid={error ? "true" : undefined}
                      // P2: py-3 ensures min 44px height
                      className="block w-full px-4 py-3 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
                      placeholder={t("username@email.com")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        disabled={isLoading}
                        aria-required="true"
                        aria-invalid={error ? "true" : undefined}
                        className="block w-full px-4 py-3 pr-14 text-sm text-white bg-[#111318] border border-[#252830] rounded-xl placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed"
                        placeholder="••••••••"
                      />
                      {/* P2: 44×44 touch target for eye icon */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        // P1: descriptive aria-label
                        aria-label={showPassword ? t("Hide password") : t("Show password")}
                        aria-pressed={showPassword}
                        className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-[#6b7280] hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded-r-xl"
                      >
                        {showPassword
                          ? <EyeOff size={16} aria-hidden="true" />
                          : <Eye size={16} aria-hidden="true" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* P1: role="alert" + aria-live for screen readers */}
                  {error && (
                    <motion.div
                      id="login-error"
                      role="alert"
                      aria-live="assertive"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
                      className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      <AlertCircle size={13} className="shrink-0 text-red-400" aria-hidden="true" />
                      <p className="text-xs font-medium text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* P2: full-width, py-3 = 44px min height */}
                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    aria-busy={isLoading}
                    // P2: active:scale feedback
                    className="w-full flex items-center justify-center gap-2 bg-[#00FFA3] hover:bg-[#00ffb3] active:bg-[#00cc82] active:scale-[0.98] text-[#0d0d0d] py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                  >
                    {isLoading
                      ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />{t("Signing in...")}</>
                      : <>{t("Sign in")} <ArrowRight size={15} aria-hidden="true" /></>
                    }
                  </button>
                </form>

                {/* Register link */}
                <p className="text-xs text-[#6b7280] text-center mt-5">
                  {t("Don't have an account?")}{" "}
                  <Link
                    href="/register"
                    className="font-bold text-white hover:text-[#00FFA3] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded"
                  >
                    {t("Sign up")}
                  </Link>
                </p>

                {/* Language selector */}
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
              </motion.div>

              <div className="flex-1" />
              <p className="text-[10px] text-[#252830] text-center tracking-wide">
                © {new Date().getFullYear()} Vaulty
              </p>
            </div>

            {/* Right column */}
            <div
              className="hidden lg:flex flex-1 h-full bg-[#080a0d] relative overflow-hidden px-10 py-8"
              // P1: decorative, not part of main content flow
              aria-hidden="true"
            >
              <div
                className="absolute bottom-0 right-0 w-[75vh] h-[50vh] opacity-10 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse at bottom right, #00FFA3, transparent 70%)" }}
              />
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 1.2, duration: 0.6, ease: "easeOut" }}
                className="w-full relative z-10 h-full"
              >
                <FeatureCarousel reduceMotion={reduceMotion} />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Post-login transition */}
        {isLoggedIn && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 bg-[#0d0d0d] z-50 overflow-y-auto"
          >
            <DashboardPage />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}