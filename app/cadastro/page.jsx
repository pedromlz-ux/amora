"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Cadastro() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Automaticamente o usuário já fica logado se o e-mail confirmation estiver desativado no supabase
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0B] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-[400px] w-full bg-white dark:bg-[#18181B] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-[#27272A] p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo-black.svg" alt="Amora Logo" className="h-8 dark:hidden" />
            <img src="/logo-white.svg" alt="Amora Logo" className="h-8 hidden dark:block" />
          </div>
          <h1 className="font-['Geist'] text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Criar Conta
          </h1>
          <p className="text-gray-500 dark:text-[#A1A1AA] text-sm mt-2 text-center">
            Junte-se à revolução nutricional e acelere seus estudos.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Geist']">
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#27272A] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-700 dark:focus:ring-purple-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Geist']">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#27272A] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-700 dark:focus:ring-purple-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Geist']">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#27272A] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-700 dark:focus:ring-purple-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold tracking-wide transition-colors mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
            )}
            Cadastrar
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-purple-700 dark:text-purple-400 hover:underline"
          >
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
