"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(t(data.error) || "Si è verificato un errore.");
        return;
      }

      setSuccess(t("Registration successful! Redirecting to login..."));
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError(t("Could not connect to the server. Please try again later."));
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
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
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">{t("Create your Account")}</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t("Name")}</label>
            <input
              type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-black sm:text-sm"
              placeholder="Mario Rossi" required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-black sm:text-sm"
              placeholder={t("username@email.com")} required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-black sm:text-sm"
              placeholder="••••••••" required
            />
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          {success && <p className="text-center text-sm text-green-500">{success}</p>}

          <button type="submit" className="w-full cursor-pointer rounded-xl bg-black py-3 text-white transition-colors hover:bg-gray-800">
            {t("Register")}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t("Already have an account?")}{" "}
            <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t("LogIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}