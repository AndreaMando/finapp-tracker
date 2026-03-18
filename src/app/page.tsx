"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { DashboardPreview } from "@/components/DashboardPreview";
import { Globe, Wallet } from "lucide-react";

export default function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result && !result.error) {
      setIsLoggedIn(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 200);
    } else {
      setError(t("Invalid credentials. Please try again."));
    }
  };

  return (
  <div className="relative h-screen w-full bg-white overflow-hidden">
    <AnimatePresence mode="wait">
      {!isLoggedIn ? (
        <motion.div
          key="login-screen"
          exit={{ opacity: 0, x: -100 }}
          className="flex h-screen w-full"
        >
          {/* Left column */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col justify-center px-12 py-16 bg-white z-20 border-r border-gray-100">
            
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">FinTrack</p>
                <p className="text-gray-400 text-xs">{t("Personal Finance")}</p>
              </div>
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-2 mb-8">
              <Globe size={14} className="text-gray-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "en" | "it")}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-500 cursor-pointer bg-white"
              >
                <option value="en">English</option>
                <option value="it">Italiano</option>
              </select>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("Welcome back")}</h1>
            <p className="text-sm text-gray-400 mb-8">{t("Sign in to your account to continue")}</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email" id="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  placeholder={t("username@email.com")} required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input
                  type="password" id="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  placeholder="••••••••" required
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer mt-2">
                {t("Log in")}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6">
              {t("Don't have an account?")}{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                {t("Register")}
              </Link>
            </p>
          </div>

          {/* Right column — static preview */}
          <div className="hidden lg:flex h-full flex-1 bg-gray-50 items-center justify-center p-10">
            <motion.div
              layoutId="dashboard-container"
              transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
              className="w-full max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 opacity-70"
            >
              {/* Navbar mock */}
              <div className="bg-gray-900 h-10 flex items-center px-5 gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-700 rounded-md" />
                  <span className="text-white text-xs font-medium">FinTrack</span>
                </div>
                <div className="flex gap-1 mx-auto">
                  {["Cruscotto","Entrate","Spese Ricorrenti","Spese","Obiettivi"].map((item, i) => (
                    <span key={item} className={`text-xs px-3 py-1 rounded-lg ${i === 0 ? "bg-green-800 text-white" : "text-gray-400"}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {/* Dashboard content */}
              <div className="pointer-events-none">
                  <DashboardPreview />
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* fullscreen dashboard */
          <motion.div 
            key="real-dashboard"
            layoutId="dashboard-container"
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
            >
              <DashboardPreview />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
