'use client';
import React, { useState, useEffect } from 'react';
import MetCalculator from '../../components/MetCalculator';
import { supabase } from '../../lib/supabaseClient';

export default function MetsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: 'Nutricionista', email: '', avatar: '', plan: 'Free' });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const email = user.email;
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();

          const name = profile?.full_name || user.user_metadata?.full_name || email.split('@')[0];
          const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7e22ce&color=fff&size=256&bold=true`;

          setUserProfile({ name, email, avatar, plan: 'Premium' });
        }
      } catch (e) {
        console.error('Error loading user profile in METs page:', e);
      }
    }
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white flex flex-col justify-between">
      {/* Mobile Overlay */}
      <div
        id="mobile-sidebar-overlay"
        onClick={() => setMobileSidebarOpen(false)}
        className={`fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'
        }`}
      />

      {/* SideNavBar Component */}
      <nav
        id="sidebar-nav"
        className={`h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50 transform md:translate-x-0 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logo */}
        <a href="/home" className="px-6 py-4 mb-4 flex items-center justify-center cursor-pointer decoration-none">
          <img src="/logo-horizontal.svg" alt="Amora Logo" className="w-32 h-auto object-contain dark:invert" />
        </a>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          <div>
            <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Aprender</p>
            <div className="space-y-1">
              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/home">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-medium">Amora</span>
              </a>

              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors" href="/recursos">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 14h6" />
                  <path d="M9 18h6" />
                  <path d="M12 11v-4" />
                </svg>
                <span className="text-sm font-medium">Recursos Profissionais</span>
              </a>

              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/pacientes">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-sm font-medium">Pacientes</span>
              </a>
            </div>
          </div>

          <div>
            <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Ajustes</p>
            <div className="space-y-1">
              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/configuracao">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="text-sm font-medium">Configuração</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="px-4 pt-4 border-t border-gray-200 dark:border-[#27272A] space-y-4">
          <div onClick={() => (window.location.href = '/configuracao')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative">
              <img alt={userProfile.name} className="w-full h-full object-cover" src={userProfile.avatar} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile.name}</p>
              <p className="text-xs text-gray-500 truncate">{userProfile.email || 'nutricionista@amora.app'}</p>
            </div>
          </div>

          <button onClick={handleSignOut} className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="md:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#27272A] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 md:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <a href="/recursos" className="text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Recursos</span>
              </a>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <span className="font-bold text-gray-900 dark:text-white">Calculadora de METs</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/recursos"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#27272A] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Todos os Recursos</span>
            </a>
          </div>
        </header>

        {/* Page Body */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
          {/* Hero Banner with Quick Stats - Clean White & Amora Purple */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#18181B] text-gray-900 dark:text-white border border-gray-200 dark:border-[#27272A] shadow-sm relative overflow-hidden">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-xs font-extrabold text-purple-700 dark:text-purple-300">
                <span className="material-symbols-outlined text-sm">science</span>
                <span>Compêndio de Ainsworth & Nutritotal PRO</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                Calculadora de Gasto Energético por METs
              </h1>

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                Estime com precisão científica o gasto calórico de mais de <strong>80 atividades físicas</strong> e do cotidiano utilizando Múltiplos de Equivalentes Metabólicos (METs), com taxa de queima por minuto, consumo de oxigênio (VO₂) e somatório da rotina do paciente.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-[#27272A]">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[11px] text-gray-400 font-semibold uppercase">1 MET Equivale a</p>
                <p className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">1 kcal/kg/h</p>
                <p className="text-[10px] text-gray-500">3.5 ml O₂/kg/min</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Base de Dados</p>
                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">+80 Atividades</p>
                <p className="text-[10px] text-gray-500">8 categorias completas</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Fórmula Padrão</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-1 font-mono">MET × kg × h</p>
                <p className="text-[10px] text-gray-500">Precisão clínica direta</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Rotina do Dia</p>
                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">Múltiplos Itens</p>
                <p className="text-[10px] text-gray-500">Soma diária integrada</p>
              </div>
            </div>
          </div>

          {/* Core Interactive Calculator Component */}
          <MetCalculator />

          {/* Quick Links Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <a
              href="/recursos"
              className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] hover:border-purple-500/50 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">restaurant</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Montador de Dietas & TACO</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tabela TACO/TBCA integrada com cálculo instantâneo de macro e micronutrientes.
              </p>
            </a>

            <a
              href="/pacientes"
              className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] hover:border-purple-500/50 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">local_fire_department</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Gasto Energético (11 Fórmulas)</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mifflin, Harris-Benedict, Cunningham, Katch-McArdle, FAO/OMS e TMB completa.
              </p>
            </a>

            <a
              href="/configuracao"
              className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] hover:border-purple-500/50 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">tune</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Configurações & Prescrições</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Personalize seus protocolos clínicos, cabeçalhos de prontuário e dados do consultório.
              </p>
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
