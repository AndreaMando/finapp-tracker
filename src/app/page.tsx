"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import DashboardPage from "./(authenticated)/dashboard/page";
import { Globe } from "lucide-react";

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
    <div className="relative min-h-screen w-full bg-white overflow-hidden">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <Globe size={16} className="text-gray-400" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as "en" | "it")}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 cursor-pointer bg-white"
        >
          <option value="en">English</option>
          <option value="it">Italiano</option>
        </select>
      </div>
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div 
            key="login-screen"
            exit={{ opacity: 0, x: -100 }}
            className="flex min-h-screen w-full"
          >
            {/* left column - for login form */}
            <div className="w-full lg:w-1/5 flex items-center p-12 bg-white z-20">
              <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6">{t("Welcome")}</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                      placeholder={t("username@email.com")}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-xl cursor-pointer"
                  >
                    {t("LogIn")}
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {t("Don't have an account?")}{" "}
                    <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {t("Register")}
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* dashboard preview (4/5) with layoutId */}
            <div className="hidden lg:flex lg:w-4/5 bg-gray-50 items-center justify-center p-12 relative">
              <motion.div 
                layoutId="dashboard-container"
                transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
                className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 opacity-60"
              >
                <div className="pointer-events-none scale-90 origin-top">
                  <DashboardPage />
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
              <DashboardPage />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
