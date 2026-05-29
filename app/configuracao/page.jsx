
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (loading) return;

    // Execute legacy scripts
    try {
      
        // Asset URLs for Light and Dark (Night) Themes
        const ASSETS = {
            light: {
                sidebarLogo: "/logo-black.svg",
                mainLogo: "/logo-black.svg"
            },
            dark: {
                sidebarLogo: "/logo-white.svg",
                mainLogo: "/logo-white.svg"
            }
        };

        // DOM Elements
        const htmlEl = document.documentElement;
        const sidebarLogoEl = document.getElementById("sidebar-logo");
        const mainLogoEl = document.getElementById("main-logo");
        const themeToggleBtn = document.getElementById("theme-toggle");
        const themeToggleIcon = document.getElementById("theme-toggle-icon");
        const themeToggleText = document.getElementById("theme-toggle-text");

        // Icon SVGs
        const SUN_SVG = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`;
        const MOON_SVG = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;

        // Apply selected theme
        function setTheme(theme) {
            if (theme === "dark") {
                htmlEl.classList.add("dark");
                if (sidebarLogoEl) sidebarLogoEl.src = ASSETS.dark.sidebarLogo;
                if (mainLogoEl) mainLogoEl.src = ASSETS.dark.mainLogo;
                if (themeToggleIcon) themeToggleIcon.innerHTML = SUN_SVG;
                if (themeToggleText) themeToggleText.innerText = "Modo claro";
                localStorage.setItem("theme", "dark");
            } else {
                htmlEl.classList.remove("dark");
                if (sidebarLogoEl) sidebarLogoEl.src = ASSETS.light.sidebarLogo;
                if (mainLogoEl) mainLogoEl.src = ASSETS.light.mainLogo;
                if (themeToggleIcon) themeToggleIcon.innerHTML = MOON_SVG;
                if (themeToggleText) themeToggleText.innerText = "Modo escuro";
                localStorage.setItem("theme", "light");
            }
        }

        // Toggle event listener
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener("click", () => {
                const isDark = htmlEl.classList.contains("dark");
                setTheme(isDark ? "light" : "dark");
            });
        }

        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            setTheme("light");
        }

        // Interactive button scales / clicks
        document.querySelectorAll("button:not(#btn-hamburger), a").forEach(btn => {
            btn.addEventListener("mousedown", () => btn.classList.add("scale-95"));
            btn.addEventListener("mouseup", () => btn.classList.remove("scale-95"));
            btn.addEventListener("mouseleave", () => btn.classList.remove("scale-95"));
        });

        // Mobile Sidebar Toggle Logic
        const btnHamburger = document.getElementById("btn-hamburger");
        const sidebarNav = document.getElementById("sidebar-nav");
        const mobileOverlay = document.getElementById("mobile-sidebar-overlay");

        if (btnHamburger && sidebarNav && mobileOverlay) {
            const toggleMenu = () => {
                const isOpen = !sidebarNav.classList.contains("-translate-x-full");
                if (isOpen) {
                    sidebarNav.classList.add("-translate-x-full");
                    mobileOverlay.classList.remove("opacity-100");
                    mobileOverlay.classList.add("opacity-0");
                    setTimeout(() => mobileOverlay.classList.add("hidden"), 300);
                } else {
                    sidebarNav.classList.remove("-translate-x-full");
                    mobileOverlay.classList.remove("hidden");
                    setTimeout(() => {
                        mobileOverlay.classList.remove("opacity-0");
                        mobileOverlay.classList.add("opacity-100");
                    }, 10);
                }
            };

            btnHamburger.addEventListener("click", toggleMenu);
            mobileOverlay.addEventListener("click", toggleMenu);
            
            const navLinks = sidebarNav.querySelectorAll("a");
            navLinks.forEach(link => {
                link.addEventListener("click", () => {
                    if (window.innerWidth < 768) {
                        toggleMenu();
                    }
                });
            });
        }

        // Utility function for Toasts if it doesn't exist yet
        function showToast(message) {
            let toastContainer = document.getElementById("toast-container");
            if (!toastContainer) {
                toastContainer = document.createElement("div");
                toastContainer.id = "toast-container";
                toastContainer.className = "fixed bottom-24 right-8 z-50 flex flex-col gap-2";
                document.body.appendChild(toastContainer);
            }
            const toast = document.createElement("div");
            toast.className = "bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-xl shadow-lg font-medium text-sm flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300";
            toast.innerHTML = `<span class="material-symbols-outlined !text-base">info</span> ${message}`;
            toastContainer.appendChild(toast);
            
            // Animate in
            requestAnimationFrame(() => {
                toast.classList.remove("translate-y-4", "opacity-0");
            });
            
            // Remove after 3 seconds
            setTimeout(() => {
                toast.classList.add("translate-y-4", "opacity-0");
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        async function loadUserProfile() {
            let name = localStorage.getItem("user_name") || "Carregando...";
            let email = localStorage.getItem("user_email") || "";
            let avatar = localStorage.getItem("user_avatar") || "";
            
            const profileName = document.getElementById("profile-name");
            const profileEmail = document.getElementById("profile-email");
            const profileNameInput = document.getElementById("profile-name-input");
            const userNameInput = document.getElementById("user-name-input");
            const userEmailInput = document.getElementById("user-email-input");
            const userAvatarImage = document.getElementById("user-avatar-image");

            const sidebarAvatar = document.getElementById("sidebar-avatar");
            const sidebarNameEl = document.getElementById("sidebar-name");
            const sidebarEmailEl = document.getElementById("sidebar-email");
            const sidebarWorkspaceTitle = document.getElementById("sidebar-workspace-title");
            const sidebarWorkspaceSubtitle = document.getElementById("sidebar-workspace-subtitle");

            function renderProfile(n, e, a) {
                if (profileName) profileName.innerText = n;
                if (profileEmail) profileEmail.innerText = e;
                if (profileNameInput) profileNameInput.value = n;
                if (userNameInput) userNameInput.value = n;
                if (userEmailInput) userEmailInput.value = e;
                if (userAvatarImage) userAvatarImage.src = a;

                if (sidebarNameEl) sidebarNameEl.innerText = n;
                if (sidebarEmailEl) sidebarEmailEl.innerText = e;
                if (sidebarWorkspaceTitle) sidebarWorkspaceTitle.innerText = n.split(' ')[0] + "'s Works...";
                if (sidebarWorkspaceSubtitle) {
                    const sanitizedName = n.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    sidebarWorkspaceSubtitle.innerText = `personal-${sanitizedName}-DM...`;
                }

                if (sidebarAvatar) sidebarAvatar.src = a;
            }

            if (localStorage.getItem("user_name")) {
                renderProfile(name, email, avatar);
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    email = user.email;
                    localStorage.setItem("user_email", email);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', user.id)
                        .single();
                    
                    name = profile?.full_name || user.user_metadata?.full_name || email.split('@')[0];
                    localStorage.setItem("user_name", name);

                    avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7e22ce&color=fff&size=256&bold=true`;
                    localStorage.setItem("user_avatar", avatar);

                    renderProfile(name, email, avatar);
                }
            } catch (e) {
                console.error("Error loading user profile in config page:", e);
            }
        }

        async function fetchUsageData() {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            try {
                const res = await fetch('/api/usage', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.plan) {
                        localStorage.setItem("user_plan", data.plan);
                    }
                    
                    const planBadge = document.getElementById("plan-badge-main");
                    const planTitle = document.getElementById("plan-title-main");
                    const limitsLabel = document.getElementById("billing-limits-label");
                    const limitsPercentage = document.getElementById("billing-limits-percentage");
                    const limitsBar = document.getElementById("billing-limits-bar");
                    const btnUpgrade = document.getElementById("btn-upgrade-plan");

                    if (data.plan === 'admin') {
                        if (planBadge) {
                            planBadge.innerText = 'ADM';
                            planBadge.className = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-amber-100/50 dark:border-amber-950 animate-pulse';
                        }
                        if (planTitle) planTitle.innerText = 'Você está usando o Amora ADM';
                        if (btnUpgrade) btnUpgrade.style.display = 'none';
                        const sidebarPlanBadge = document.getElementById("sidebar-plan-badge");
                        if (sidebarPlanBadge) {
                            sidebarPlanBadge.innerText = 'ADM';
                            sidebarPlanBadge.className = 'inline-block px-2.5 py-1 rounded bg-amber-500 text-black font-label-sm text-xs shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-400 font-bold uppercase tracking-wider animate-pulse';
                        }
                    } else if (data.plan === 'ultra') {
                        if (planBadge) {
                            planBadge.innerText = 'Plano Ultra';
                            planBadge.className = 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-blue-100/50 dark:border-blue-950';
                        }
                        if (planTitle) planTitle.innerText = 'Você está usando o Amora Ultra';
                        if (btnUpgrade) btnUpgrade.style.display = 'none';
                        const sidebarPlanBadge = document.getElementById("sidebar-plan-badge");
                        if (sidebarPlanBadge) {
                            sidebarPlanBadge.innerText = 'Ultra Plan';
                            sidebarPlanBadge.className = 'inline-block px-2 py-1 rounded bg-blue-600 text-white font-label-sm text-xs shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400 dark:border-blue-500';
                        }
                    } else if (data.plan === 'premium') {
                        if (planBadge) {
                            planBadge.innerText = 'Plano Premium';
                            planBadge.className = 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-yellow-100/50 dark:border-yellow-950';
                        }
                        if (planTitle) planTitle.innerText = 'Você está usando o Amora Premium';
                        if (btnUpgrade) btnUpgrade.style.display = 'none';
                        const sidebarPlanBadge = document.getElementById("sidebar-plan-badge");
                        if (sidebarPlanBadge) {
                            sidebarPlanBadge.innerText = 'Premium Plan';
                            sidebarPlanBadge.className = 'inline-block px-2 py-1 rounded bg-purple-600 text-white font-label-sm text-xs shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400 dark:border-purple-500';
                        }
                    } else {
                        if (planBadge) {
                            planBadge.innerText = 'Plano Gratuito';
                            planBadge.className = 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-purple-100/50 dark:border-purple-950';
                        }
                        if (planTitle) planTitle.innerText = 'Você está usando o Amora Free';
                        const sidebarPlanBadge = document.getElementById("sidebar-plan-badge");
                        if (sidebarPlanBadge) {
                            sidebarPlanBadge.innerText = 'Free Plan';
                            sidebarPlanBadge.className = 'inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs';
                        }
                    }

                    if (limitsLabel) limitsLabel.innerText = `${data.questions_count} de ${data.limit} perguntas feitas`;
                    if (limitsPercentage) limitsPercentage.innerText = `${data.percentage}% do limite`;
                    if (limitsBar) limitsBar.style.width = `${data.percentage}%`;
                }
            } catch (e) {
                console.error("Erro ao carregar dados de uso", e);
            }
        }

        loadUserProfile();
        fetchUsageData();

        // Tab Switching Logic
        const tabs = ["perfil", "cobranca", "preferencias", "seguranca"];
        tabs.forEach(tab => {
            const btn = document.getElementById("tab-" + tab);
            if (btn) {
                btn.addEventListener("click", () => {
                    tabs.forEach(t => {
                        const tBtn = document.getElementById("tab-" + t);
                        const tPanel = document.getElementById("panel-" + t);
                        if (tBtn && tPanel) {
                            if (t === tab) {
                                tBtn.className = "py-4 px-1 border-b-2 border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-400 font-bold text-sm";
                                tBtn.setAttribute("aria-selected", "true");
                                tPanel.classList.remove("hidden");
                            } else {
                                tBtn.className = "py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors";
                                tBtn.setAttribute("aria-selected", "false");
                                tPanel.classList.add("hidden");
                            }
                        }
                    });
                });
            }
        });

        // Give life to buttons
        const btnChangeAvatar = document.getElementById("btn-change-avatar");
        const avatarFileInput = document.getElementById("avatar-file-input");
        if (btnChangeAvatar && avatarFileInput) {
            btnChangeAvatar.addEventListener("click", () => {
                avatarFileInput.click();
            });
            avatarFileInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const imgData = evt.target.result;
                        localStorage.setItem("user_avatar", imgData);
                        const userAvatarImage = document.getElementById("user-avatar-image");
                        if (userAvatarImage) userAvatarImage.src = imgData;
                        const sidebarAvatar = document.getElementById("sidebar-avatar");
                        if (sidebarAvatar) sidebarAvatar.src = imgData;
                    };
                    reader.readAsDataURL(file);
                    showToast("Foto atualizada com sucesso!");
                }
            });
        }

        const btnRemoveAvatar = document.getElementById("btn-remove-avatar");
        if (btnRemoveAvatar) {
            btnRemoveAvatar.addEventListener("click", () => {
                localStorage.removeItem("user_avatar");
                showToast("Sua foto foi removida.");
                window.location.reload();
            });
        }

        const btnDiscard = document.getElementById("btn-discard-settings");
        if (btnDiscard) {
            btnDiscard.addEventListener("click", () => {
                showToast("Alterações descartadas.");
            });
        }

        const btnSave = document.getElementById("btn-save-settings");
        if (btnSave) {
            btnSave.addEventListener("click", () => {
                btnSave.innerHTML = `<span class="material-symbols-outlined animate-spin !text-sm">progress_activity</span> Salvando...`;
                setTimeout(() => {
                    btnSave.innerHTML = `Salvar Alterações`;
                    showToast("Configurações salvas com sucesso!");
                }, 1500);
            });
        }

        const btnUpgrade = document.getElementById("btn-upgrade-plan");
        const upgradeModal = document.getElementById("upgrade-modal");
        const btnCloseUpgrade = document.getElementById("btn-close-upgrade");
        const btnSubscribePremium = document.getElementById("btn-subscribe-premium");
        const btnSubscribeUltra = document.getElementById("btn-subscribe-ultra");

        if (btnUpgrade && upgradeModal) {
            btnUpgrade.addEventListener("click", () => {
                upgradeModal.classList.remove("hidden");
                setTimeout(() => upgradeModal.classList.remove("opacity-0"), 10);
                const innerContainer = upgradeModal.querySelector("div");
                if (innerContainer) {
                    innerContainer.classList.remove("scale-95");
                }
            });
        }

        if (btnCloseUpgrade && upgradeModal) {
            btnCloseUpgrade.addEventListener("click", () => {
                upgradeModal.classList.add("opacity-0");
                const innerContainer = upgradeModal.querySelector("div");
                if (innerContainer) {
                    innerContainer.classList.add("scale-95");
                }
                setTimeout(() => upgradeModal.classList.add("hidden"), 300);
            });
        }

        const handleSubscribe = async (planName, buttonEl) => {
            const originalText = buttonEl.innerHTML;
            buttonEl.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle mr-2 text-sm">progress_activity</span> Redirecionando...`;
            buttonEl.disabled = true;

            try {
                const res = await fetch(`/api/subscription?plan=${planName}`);
                const data = await res.json();
                if (data.url) {
                    const email = localStorage.getItem("user_email") || "";
                    alert(`ATENÇÃO:\n\nPara que o seu plano seja ativado automaticamente, você DEVE utilizar o e-mail: ${email} na hora de pagar no Mercado Pago!`);
                    window.location.href = data.url;
                } else {
                    showToast("Erro ao gerar link de assinatura.");
                }
            } catch (e) {
                showToast("Erro na comunicação com o servidor.");
            } finally {
                buttonEl.innerHTML = originalText;
                buttonEl.disabled = false;
            }
        };

        if (btnSubscribePremium) {
            btnSubscribePremium.addEventListener("click", () => handleSubscribe("premium", btnSubscribePremium));
        }

        if (btnSubscribeUltra) {
            btnSubscribeUltra.addEventListener("click", () => handleSubscribe("ultra", btnSubscribeUltra));
        }

        // Initialize Theme preference select buttons
        const btnSelectLight = document.getElementById("theme-select-light");
        const btnSelectDark = document.getElementById("theme-select-dark");

        function updateThemeSelectionUI(theme) {
            if (theme === "dark") {
                if (btnSelectDark) {
                    btnSelectDark.className = "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-purple-700 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/20 transition-all text-center";
                }
                if (btnSelectLight) {
                    btnSelectLight.className = "flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-black/25 hover:border-purple-500 dark:hover:border-purple-400 transition-all text-center opacity-70";
                }
            } else {
                if (btnSelectLight) {
                    btnSelectLight.className = "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-purple-700 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/20 transition-all text-center";
                }
                if (btnSelectDark) {
                    btnSelectDark.className = "flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-black/25 hover:border-purple-500 dark:hover:border-purple-400 transition-all text-center opacity-70";
                }
            }
        }

        const currentTheme = localStorage.getItem("theme") || "light";
        updateThemeSelectionUI(currentTheme);

        if (btnSelectLight) {
            btnSelectLight.addEventListener("click", () => {
                setTheme("light");
                updateThemeSelectionUI("light");
                showToast("Tema claro ativado");
            });
        }

        if (btnSelectDark) {
            btnSelectDark.addEventListener("click", () => {
                setTheme("dark");
                updateThemeSelectionUI("dark");
                showToast("Tema escuro ativado");
            });
        }
        
        // Função de Sign Out global
        window.handleSignOut = function() {
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_email");
            localStorage.removeItem("user_avatar");
            window.location.href = "/login";
        };
    
    } catch(e) {
      console.error(e);
    }
  }, [loading]);

  if (loading) return null;

  return (
    <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white" dangerouslySetInnerHTML={{ __html: `

    <!-- Mobile Overlay (hidden by default) -->
    <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 hidden md:hidden transition-opacity duration-300 opacity-0"></div>

    <!-- SideNavBar Component -->
    <nav id="sidebar-nav"
        class="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
        <a href="/"
            class="px-6 py-4 mb-4 flex items-center justify-center cursor-pointer decoration-none">
            <img src="/logo-horizontal.svg" alt="Amora Logo" class="w-32 h-auto object-contain dark:invert" />
        </a>

        <!-- Navigation Links -->
        <div class="flex-1 overflow-y-auto px-2 space-y-6">
            <!-- Section 1 -->
            <div>
                <p class="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                    Aprender</p>
                <div class="space-y-1">
                    <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        href="/">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round"
                            stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="font-label-md text-sm">Amora</span>
                    </a>
                    <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/recursos">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M12 11v-4"></path></svg>
                        <span class="font-label-md text-sm">Recursos Profissionais</span>
                    </a>
                    <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/blog">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        <span class="font-label-md text-sm">Blog</span>
                    </a>
                </div>
            </div>

            <!-- Section 3 -->
            <div>
                <p class="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                    Ajustes</p>
                <div class="space-y-1">
                    <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors"
                        href="/configuracao">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round"
                            stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18"
                            xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path
                                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z">
                            </path>
                        </svg>
                        <span class="font-label-md text-sm">Configuração</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-4 pt-4 border-t border-gray-200 dark:border-[#27272A] space-y-4">
            <div class="px-2">
                <span id="sidebar-plan-badge"
                    class="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs">Free
                    Plan</span>
            </div>
            <div onclick="window.location.href='/configuracao'"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative">
                    <img id="sidebar-avatar" alt="Pedro Miguel" class="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcb76zVeNvWaW40zTrrzkpQaBZk6qO6Ey0TkOxy1dhyMk9RBKW9bfdiBqVBZ9VS6G4WcBMgYEFYIrnkeUnQwOaxt7-HKeEejqnbqXUzKbbkkQa7SCwWXi3pS0YpdM0DTjhXMfUVyx0fDpTCSOvBEyQ6njAST3EHllrte0fBE_AYuRhSnhuLnX0kCwON0rBKXdbnv13Iv_Fj-skyZyQbPwFOicwLJBOjFzyWe-_ZcH4zBzGcDMha6gP_xFqo7YxRpPWvc4uHqEi_tbx" />
                </div>
                <div class="flex-1 overflow-hidden">
                    <p id="sidebar-name" class="font-label-md text-sm font-medium text-gray-900 dark:text-white truncate">Pedro Miguel</p>
                    <p id="sidebar-email" class="font-label-sm text-xs text-gray-500 truncate">pedromlzaparoli@gmail.com</p>
                </div>
                <svg class="text-gray-400 dark:text-gray-500 shrink-0" fill="none" height="16" stroke="currentColor"
                    stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="m7 15 5 5 5-5"></path>
                    <path d="m7 15 5 5 5-5"></path>
                    <path d="m7 9 5-5 5 5"></path>
                </svg>
            </div>
            
            <!-- Sign Out Button -->
            <button onclick="handleSignOut()" class="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                <span class="font-label-md text-sm font-medium">Sair da conta</span>
            </button>
        </div>
    </nav>

    <!-- Main Content Canvas -->
    <main class="md:ml-64 flex-1 flex flex-col w-full md:w-auto min-h-screen relative overflow-x-hidden bg-[#F9FAFB] dark:bg-[#0A0A0B]">
        <!-- Mobile Header / Hamburger Menu -->
        <div class="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272A] bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md sticky top-0 z-30">
            <div class="flex items-center gap-2">
                <button id="btn-hamburger" aria-label="Abrir menu" class="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24"><path d="M4 12h16M4 6h16M4 18h16"></path></svg>
                </button>
                <img src="/logo-horizontal.svg" alt="Amora Logo" width="128" height="32" class="h-8 w-auto object-contain dark:invert" />
            </div>
        </div>

        <!-- Ambient Background Pattern -->
        <div class="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02]"
            style="background-image: radial-gradient(var(--tw-colors-purple-500) 1px, transparent 1px); background-size: 24px 24px;">
        </div>

        <div class="flex-1 max-w-6xl mx-auto w-full px-8 pt-20 pb-32 relative z-10 flex flex-col">
            <!-- Header Section -->
            <section class="mb-12">
                <h2 class="font-display font-semibold text-3xl text-gray-900 dark:text-white mb-2 tracking-tight">
                    Configurações</h2>
                <p class="font-body-lg text-base text-gray-500 dark:text-gray-400 max-w-2xl">Gerencie seus dados de
                    usuário, preferências do sistema e detalhes do plano.</p>
            </section>

            <!-- Tabbed Navigation Layer -->
            <div class="flex border-b border-gray-200 dark:border-[#27272A] gap-8 mb-8" role="tablist">
                <button id="tab-perfil"
                    class="py-4 px-1 border-b-2 border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-400 font-bold text-sm"
                    role="tab" aria-selected="true" aria-controls="panel-perfil">Meu Perfil</button>
                <button id="tab-cobranca"
                    class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors"
                    role="tab" aria-selected="false" aria-controls="panel-cobranca">Plano &amp; Cobrança</button>
                <button id="tab-preferencias"
                    class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors"
                    role="tab" aria-selected="false" aria-controls="panel-preferencias">Preferências</button>
                <button id="tab-seguranca"
                    class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors"
                    role="tab" aria-selected="false" aria-controls="panel-seguranca">Segurança</button>
            </div>

            <!-- Content Area -->
            <div class="space-y-12">
                <!-- PANEL: Meu Perfil -->
                <div id="panel-perfil" class="space-y-6 transition-all duration-300 animate-fadeIn" role="tabpanel"
                    aria-labelledby="tab-perfil">
                    <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1">
                            <h3 class="font-display font-semibold text-lg text-gray-900 dark:text-white">Informações
                                Pessoais</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light">Atualize sua foto e
                                detalhes pessoais para manter seu perfil clínico atualizado.</p>
                        </div>
                        <div class="md:col-span-2 space-y-6">
                            <div
                                class="flex items-center gap-8 bg-white dark:bg-[#18181B] p-6 rounded-2xl border border-gray-200 dark:border-[#27272A] shadow-sm">
                                <div id="avatar-container"
                                    class="relative group shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-purple-700 dark:border-purple-400 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                                    <img id="user-avatar-image" alt="Avatar Pedro" class="w-full h-full object-cover"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcb76zVeNvWaW40zTrrzkpQaBZk6qO6Ey0TkOxy1dhyMk9RBKW9bfdiBqVBZ9VS6G4WcBMgYEFYIrnkeUnQwOaxt7-HKeEejqnbqXUzKbbkkQa7SCwWXi3pS0YpdM0DTjhXMfUVyx0fDpTCSOvBEyQ6njAST3EHllrte0fBE_AYuRhSnhuLnX0kCwON0rBKXdbnv13Iv_Fj-skyZyQbPwFOicwLJBOjFzyWe-_ZcH4zBzGcDMha6gP_xFqo7YxRpPWvc4uHqEi_tbx" />
                                    <div id="avatar-edit-overlay"
                                        class="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <span class="material-symbols-outlined text-white">edit</span>
                                    </div>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <div class="flex gap-4">
                                        <input type="file" id="avatar-file-input" accept="image/*" class="hidden" />
                                        <button id="btn-change-avatar"
                                            class="px-4 py-2 border border-purple-700/30 dark:border-purple-400/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/15 transition-colors">Alterar
                                            Foto</button>
                                        <button id="btn-remove-avatar"
                                            class="px-4 py-2 text-red-650 dark:text-red-400 text-xs font-semibold hover:underline transition-colors">Remover</button>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">JPG, GIF ou PNG. Max 2MB.</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Nome
                                        Completo</label>
                                    <input id="user-name-input"
                                        class="w-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-700 dark:focus:ring-purple-400 focus:border-purple-700 dark:focus:border-purple-400 outline-none transition-all font-body-md"
                                        type="text" value="Pedro Miguel" />
                                </div>
                                <div class="space-y-2">
                                    <label
                                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 block">E-mail</label>
                                    <input id="user-email-input"
                                        class="w-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-700 dark:focus:ring-purple-400 focus:border-purple-700 dark:focus:border-purple-400 outline-none transition-all font-body-md"
                                        type="email" value="pedromlzaparoli@gmail.com" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- PANEL: Plano & Cobrança -->
                <div id="panel-cobranca" class="space-y-6 transition-all duration-300 hidden" role="tabpanel"
                    aria-labelledby="tab-cobranca">
                    <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1">
                            <h3 class="font-display font-semibold text-lg text-gray-900 dark:text-white">Assinatura e
                                Limites</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light">Acompanhe seu uso atual
                                e faça upgrade do seu plano para remover restrições.</p>
                        </div>
                        <div class="md:col-span-2 space-y-6">
                            <div
                                class="bg-white dark:bg-[#18181B] p-6 rounded-2xl border border-gray-200 dark:border-[#27272A] shadow-sm relative overflow-hidden">
                                <div
                                    class="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none text-purple-700 dark:text-purple-400">
                                    <span class="material-symbols-outlined text-[80px]"
                                        style="font-variation-settings: 'wght' 100;">clinical_notes</span>
                                </div>
                                <div
                                    class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <span id="plan-badge-main"
                                            class="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-purple-100/50 dark:border-purple-950">Plano
                                            Gratuito</span>
                                        <h4 id="plan-title-main"
                                            class="font-display font-semibold text-xl text-gray-900 dark:text-white mt-3">
                                            Você está usando o Amora Free</h4>
                                    </div>
                                    <button id="btn-upgrade-plan"
                                        class="bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-400 dark:text-gray-900 dark:hover:bg-purple-500 px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm active:scale-95">Fazer
                                        Upgrade para Premium</button>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs font-semibold">
                                        <span id="billing-limits-label" class="text-gray-900 dark:text-white">1 de 3
                                            projetos construídos</span>
                                        <span id="billing-limits-percentage"
                                            class="text-gray-500 dark:text-gray-400">33% do limite</span>
                                    </div>
                                    <div
                                        class="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-950">
                                        <div id="billing-limits-bar"
                                            class="h-full bg-purple-700 dark:bg-purple-400 rounded-full shadow-[0_0_12px_rgba(124,58,237,0.3)] transition-all duration-500"
                                            style="width: 33%;"></div>
                                    </div>
                                </div>
                                <div
                                    class="mt-6 pt-6 border-t border-gray-100 dark:border-[#27272A]/50 flex flex-wrap gap-6">
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="material-symbols-outlined text-purple-700 dark:text-purple-400 !text-sm">check_circle</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Relatórios
                                            Avançados</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="material-symbols-outlined text-purple-700 dark:text-purple-400 !text-sm">check_circle</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">100 Projetos
                                            Simultâneos</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="material-symbols-outlined text-purple-700 dark:text-purple-400 !text-sm">check_circle</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Suporte
                                            Prioritário</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- PANEL: Preferências -->
                <div id="panel-preferencias" class="space-y-6 transition-all duration-300 hidden" role="tabpanel"
                    aria-labelledby="tab-preferencias">
                    <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1">
                            <h3 class="font-display font-semibold text-lg text-gray-900 dark:text-white">Preferências do
                                Sistema</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light">Ajuste como a Amora se
                                comporta, desde a aparência às notificações clínicas.</p>
                        </div>
                        <div class="md:col-span-2 space-y-6">
                            <div
                                class="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-6 shadow-sm space-y-6">

                                <!-- Theme Selection: Tema da interface -->
                                <div
                                    class="flex flex-col gap-3 pb-6 border-b border-gray-100 dark:border-[#27272A]/50">
                                    <div>
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Tema da interface</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">Escolha a aparência da interface do Amora de acordo com a sua preferência.</p>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 mt-2">
                                        <!-- Option Light -->
                                        <button type="button" id="theme-select-light" class="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-black/25 hover:border-purple-500 dark:hover:border-purple-400 transition-all text-center">
                                            <span class="material-symbols-outlined text-gray-500 mb-2">light_mode</span>
                                            <span class="text-xs font-semibold text-gray-900 dark:text-white">Claro</span>
                                        </button>
                                        <!-- Option Dark -->
                                        <button type="button" id="theme-select-dark" class="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-black/25 hover:border-purple-500 dark:hover:border-purple-400 transition-all text-center">
                                            <span class="material-symbols-outlined text-gray-500 mb-2">dark_mode</span>
                                            <span class="text-xs font-semibold text-gray-900 dark:text-white">Escuro</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Toggle 2: Notificações por E-mail -->
                                <div
                                    class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#27272A]/50">
                                    <div class="flex-1 pr-4">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Notificações por
                                            E-mail</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">Receba
                                            atualizações sobre novas aulas de capacitação e resumos clínicos.</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer select-none">
                                        <input type="checkbox" id="pref-email" class="sr-only peer" checked />
                                        <div
                                            class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-650 peer-checked:bg-purple-750">
                                        </div>
                                    </label>
                                </div>

                                <!-- Toggle 3: Notificações Push -->
                                <div
                                    class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#27272A]/50">
                                    <div class="flex-1 pr-4">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Notificações
                                            Push no Navegador</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">Receba
                                            alertas em tempo real de mensagens prontas do assistente.</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer select-none">
                                        <input type="checkbox" id="pref-push" class="sr-only peer" />
                                        <div
                                            class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-650 peer-checked:bg-purple-750">
                                        </div>
                                    </label>
                                </div>

                                <!-- Toggle 4: Recomendações Inteligentes -->
                                <div class="flex items-center justify-between">
                                    <div class="flex-1 pr-4">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Recomendações
                                            Clínicas Inteligentes</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">Permita que
                                            a IA processe dados anônimos para sugerir melhores caminhos terapêuticos.
                                        </p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer select-none">
                                        <input type="checkbox" id="pref-clinical" class="sr-only peer" checked />
                                        <div
                                            class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-650 peer-checked:bg-purple-750">
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- PANEL: Segurança -->
                <div id="panel-seguranca" class="space-y-6 transition-all duration-300 hidden" role="tabpanel"
                    aria-labelledby="tab-seguranca">
                    <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1">
                            <h3 class="font-display font-semibold text-lg text-gray-900 dark:text-white">Segurança da
                                Conta</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light">Gerencie sua senha de
                                acesso e configure chaves de autenticação de dois fatores.</p>
                        </div>
                        <div class="md:col-span-2 space-y-6">
                            <!-- Password Reset -->
                            <div
                                class="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-6 shadow-sm space-y-4">
                                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Alterar Senha</h4>

                                <div class="space-y-3">
                                    <div>
                                        <label
                                            class="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Senha
                                            Atual</label>
                                        <input id="pass-current"
                                            class="w-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-750 transition-all font-body-md"
                                            type="password" placeholder="••••••••" />
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                class="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Nova
                                                Senha</label>
                                            <input id="pass-new"
                                                class="w-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-750 transition-all font-body-md"
                                                type="password" placeholder="Mínimo 6 caracteres" />
                                        </div>
                                        <div>
                                            <label
                                                class="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Confirmar
                                                Nova Senha</label>
                                            <input id="pass-confirm"
                                                class="w-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-750 transition-all font-body-md"
                                                type="password" placeholder="Repita a senha" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Password strength visualizer -->
                                <div class="space-y-1.5 pt-2">
                                    <div class="flex justify-between items-center text-xs font-semibold">
                                        <span class="text-gray-500 dark:text-gray-400">Força da Senha:</span>
                                        <span id="pass-strength-text" class="text-gray-400">Não digitada</span>
                                    </div>
                                    <div
                                        class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-50 dark:border-gray-900">
                                        <div id="pass-strength-bar" class="h-full w-0 transition-all duration-300"
                                            style="background-color: transparent;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- 2FA Multi factor -->
                            <div
                                class="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-6 shadow-sm flex items-center justify-between">
                                <div class="flex-1 pr-4">
                                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Autenticação em Duas
                                        Etapas (2FA)</h4>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">Adicione uma
                                        camada extra de proteção na sua conta clínica exigindo token do celular.</p>
                                    <p class="text-xs text-purple-750 dark:text-purple-400 font-semibold mt-1"
                                        id="sec-2fa-status">Status: Desativado</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer select-none">
                                    <input type="checkbox" id="sec-2fa" class="sr-only peer" />
                                    <div
                                        class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-650 peer-checked:bg-purple-750">
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <!-- Upgrade Modal Component -->
        <div id="upgrade-modal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 hidden opacity-0">
            <div
                class="bg-white/95 dark:bg-[#18181B]/95 border border-purple-500/20 shadow-2xl rounded-3xl p-8 max-w-4xl w-full relative transform scale-95 transition-all duration-300 mx-4 overflow-y-auto max-h-[90vh]">
                <div class="flex items-center justify-between mb-6">
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-purple-700 text-white dark:bg-purple-400 dark:text-gray-905 font-display text-xs font-bold shadow-sm uppercase tracking-wider animate-pulse">
                        <span class="material-symbols-outlined !text-xs">workspace_premium</span>
                        Planos de Assinatura
                    </span>
                    <button id="btn-close-upgrade"
                        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span class="material-symbols-outlined text-gray-500 dark:text-gray-400 !text-base">close</span>
                    </button>
                </div>

                <div class="text-center mb-8">
                    <h3 class="font-display font-semibold text-3xl text-gray-900 dark:text-white mb-2 leading-tight">Escolha seu plano Amora</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 font-light">Selecione o plano ideal para a sua jornada profissional ou acadêmica.</p>
                </div>

                <!-- Two columns pricing grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <!-- Card 1: Premium (Student) -->
                    <div class="bg-gray-50/50 dark:bg-[#202024]/50 border border-gray-200 dark:border-[#2d2d30] p-6 rounded-2xl flex flex-col justify-between hover:border-purple-500/30 transition-all relative">
                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Estudante</span>
                                <span class="text-2xl font-bold text-gray-900 dark:text-white">R$ 19,90<span class="text-xs text-gray-400 font-light">/mês</span></span>
                            </div>
                            <h4 class="font-display font-semibold text-lg text-gray-900 dark:text-white mb-1">Amora Premium</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 font-light mb-4">Perfeito para estudantes que buscam estender o uso da IA para seus estudos acadêmicos.</p>
                            
                            <ul class="space-y-2 mb-6">
                                <li class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <span class="material-symbols-outlined text-purple-750 dark:text-purple-400 !text-sm">check_circle</span>
                                    <span>300 conversas/ativações mensais do chat</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <span class="material-symbols-outlined text-purple-750 dark:text-purple-400 !text-sm">check_circle</span>
                                    <span>Modelos baseados na tabela oficial TACO</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <span class="material-symbols-outlined text-purple-750 dark:text-purple-400 !text-sm">check_circle</span>
                                    <span>Suporte prioritário via e-mail</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 line-through">
                                    <span class="material-symbols-outlined !text-sm">block</span>
                                    <span>Recursos Clínicos Profissionais</span>
                                </li>
                            </ul>
                        </div>
                        <button id="btn-subscribe-premium" class="w-full bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-400 dark:text-gray-900 dark:hover:bg-purple-500 py-3 rounded-full font-semibold text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2">
                            Assinar Premium (Estudante)
                        </button>
                    </div>

                    <!-- Card 2: Ultra (Professional) -->
                    <div class="bg-purple-50/20 dark:bg-[#2a1b40]/20 border-2 border-purple-500/40 p-6 rounded-2xl flex flex-col justify-between hover:border-purple-500/60 transition-all relative font-body-md">
                        <div class="absolute -top-3 right-4 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Profissional</div>
                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <span class="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Nutricionista</span>
                                <span class="text-2xl font-bold text-gray-900 dark:text-white">R$ 29,90<span class="text-xs text-gray-400 font-light">/mês</span></span>
                            </div>
                            <h4 class="font-display font-semibold text-lg text-gray-900 dark:text-white mb-1">Amora Ultra</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 font-light mb-4">Para profissionais da prática clínica que precisam de ferramentas avançadas e segurança.</p>
                            
                            <ul class="space-y-2 mb-6">
                                <li class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <span class="material-symbols-outlined text-purple-750 dark:text-purple-400 !text-sm">check_circle</span>
                                    <span>200 conversas/ativações do chat</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-purple-750 dark:text-purple-400 font-semibold">
                                    <span class="material-symbols-outlined !text-sm">check_circle</span>
                                    <span>Histórico de Chat Ilimitado</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-purple-750 dark:text-purple-400 font-semibold">
                                    <span class="material-symbols-outlined !text-sm">check_circle</span>
                                    <span>Acesso Completo aos Recursos Clínicos</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <span class="material-symbols-outlined text-purple-750 dark:text-purple-400 !text-sm">check_circle</span>
                                    <span>Montador de Dietas e Tabela TACO</span>
                                </li>
                                <li class="flex items-center gap-2 text-xs text-purple-750 dark:text-purple-400 font-semibold">
                                    <span class="material-symbols-outlined !text-sm">check_circle</span>
                                    <span>Simulador de Terapia Nutricional</span>
                                </li>
                            </ul>
                        </div>
                        <button id="btn-subscribe-ultra" class="w-full bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-400 dark:text-gray-900 dark:hover:bg-purple-500 py-3 rounded-full font-semibold text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2">
                            Assinar Ultra (Profissional)
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- Bottom Action Bar (Contextual/Sticky) -->
        <div
            class="fixed bottom-0 left-64 right-0 h-20 bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-xl border-t border-gray-200 dark:border-[#27272A] flex items-center justify-end px-8 gap-4 z-40">
            <button id="btn-discard-settings"
                class="px-6 py-2.5 border border-gray-200 dark:border-[#27272A] text-gray-650 dark:text-gray-400 font-semibold text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95">
                Descartar alterações
            </button>
            <button id="btn-save-settings"
                class="px-8 py-2.5 bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-400 dark:text-gray-900 dark:hover:bg-purple-500 font-semibold text-sm rounded-full shadow-sm transition-all active:scale-95">
                Salvar Alterações
            </button>
        </div>
    </main>

    
` }} />
  );
}
