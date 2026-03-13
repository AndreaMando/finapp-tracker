"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DashboardPage from "./(authenticated)/dashboard/page";
import Cookies from 'js-cookie';
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogin = () => {
    setIsLoggedIn(true); // temporary login simulation
    //router.prefetch('/dashboard'); // prefetch dashboard page for faster navigation after animation
    Cookies.set('auth_token', 'true', { expires: 7, path: '/' });
    setTimeout(() => {  // redirect to dashboard page after animation completes
      window.location.href = '/dashboard';
    }, 200);
  };

  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden">
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
                <h1 className="text-3xl font-bold mb-6">{t("LogIn")}</h1>
                {/* put here inputs for username and password */}
                <button 
                  onClick={handleLogin}
                  className="w-full bg-black text-white py-3 rounded-xl cursor-pointer"
                >
                  {t("LogIn")}
                </button>
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
