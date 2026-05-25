
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
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
    }

    // Toast Alert Notification System
    function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "fixed top-6 right-6 z-[100] bg-white dark:bg-[#18181B] border border-purple-500/30 text-gray-900 dark:text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 transform translate-y-[-20px] opacity-0 transition-all duration-300";
        toast.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
            <span class="text-sm font-medium font-body-md">${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove("translate-y-[-20px]", "opacity-0");
        }, 10);
        
        setTimeout(() => {
            toast.classList.add("translate-y-[-20px]", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Load dynamic user profile
    function loadUserProfile() {
        const name = localStorage.getItem("user_name") || "Pedro Miguel";
        const email = localStorage.getItem("user_email") || "pedromlzaparoli@gmail.com";
        const avatar = localStorage.getItem("user_avatar") || "https://ui-avatars.com/api/?name=Pedro+Miguel&background=7e22ce&color=fff&size=256&bold=true";
        const plan = localStorage.getItem("user_plan") || "Free";

        const sidebarNameEl = document.getElementById("sidebar-name");
        const sidebarEmailEl = document.getElementById("sidebar-email");
        const sidebarAvatarEl = document.getElementById("sidebar-avatar");
        const sidebarPlanBadge = document.getElementById("sidebar-plan-badge");
        const sidebarWorkspaceTitle = document.getElementById("sidebar-workspace-title");
        const sidebarWorkspaceSubtitle = document.getElementById("sidebar-workspace-subtitle");

        if (sidebarNameEl) sidebarNameEl.innerText = name;
        if (sidebarEmailEl) sidebarEmailEl.innerText = email;
        
        if (sidebarWorkspaceTitle) sidebarWorkspaceTitle.innerText = name.split(' ')[0] + "'s Works...";
        if (sidebarWorkspaceSubtitle) sidebarWorkspaceSubtitle.innerText = "personal-" + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + "-DM...";
        
        if (sidebarAvatarEl) {
            if (avatar.startsWith("INITIALS:")) {
                const initials = avatar.split(":")[1];
                sidebarAvatarEl.style.display = "none";
                let initialsPlaceholder = document.getElementById("sidebar-avatar-initials");
                if (!initialsPlaceholder) {
                    initialsPlaceholder = document.createElement("div");
                    initialsPlaceholder.id = "sidebar-avatar-initials";
                    initialsPlaceholder.className = "w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-750 to-pink-500 text-white font-bold text-xs rounded-full";
                    sidebarAvatarEl.parentNode.appendChild(initialsPlaceholder);
                }
                initialsPlaceholder.innerText = initials;
                initialsPlaceholder.style.display = "flex";
            } else {
                sidebarAvatarEl.src = avatar;
                sidebarAvatarEl.style.display = "block";
                const initialsPlaceholder = document.getElementById("sidebar-avatar-initials");
                if (initialsPlaceholder) initialsPlaceholder.style.display = "none";
            }
        }
        
        if (sidebarPlanBadge) {
            sidebarPlanBadge.innerText = plan === "Premium" ? "Premium Plan" : "Free Plan";
            if (plan === "Premium") {
                sidebarPlanBadge.className = "inline-block px-2 py-1 rounded bg-amber-500 text-black dark:bg-amber-400 font-label-sm text-xs font-bold shadow-sm animate-pulse";
            } else {
                sidebarPlanBadge.className = "inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs";
            }
        }
        
        // Função de Sign Out global
        window.handleSignOut = function() {
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_email");
            localStorage.removeItem("user_avatar");
            window.location.href = "/login";
        };
    }

    // Call dynamic user profile load
    loadUserProfile();

    // Módulos Accordion Behavior
    const mod1Header = document.getElementById("module-1-header");
    const mod1Content = document.getElementById("module-1-content");
    const mod1Chevron = document.getElementById("module-1-chevron");

    if (mod1Header && mod1Content) {
        mod1Header.addEventListener("click", () => {
            const isClosed = mod1Content.style.maxHeight === "0px" || mod1Content.style.maxHeight === "";
            if (isClosed) {
                mod1Content.style.maxHeight = "500px";
                if (mod1Chevron) mod1Chevron.innerText = "expand_less";
            } else {
                mod1Content.style.maxHeight = "0px";
                if (mod1Chevron) mod1Chevron.innerText = "expand_more";
            }
        });
    }

    const mod2Header = document.getElementById("module-2-header");
    const mod2Content = document.getElementById("module-2-content");
    const mod2Chevron = document.getElementById("module-2-chevron");

    if (mod2Header && mod2Content) {
        mod2Header.addEventListener("click", () => {
            const isClosed = mod2Content.style.maxHeight === "0px";
            if (isClosed) {
                mod2Content.style.maxHeight = "500px";
                if (mod2Chevron) mod2Chevron.innerText = "expand_less";
            } else {
                mod2Content.style.maxHeight = "0px";
                if (mod2Chevron) mod2Chevron.innerText = "expand_more";
            }
        });
    }

    // Locked Module 3 Trigger
    const mod3Header = document.getElementById("module-3-header");
    if (mod3Header) {
        mod3Header.addEventListener("click", (e) => {
            e.preventDefault();
            showToast("Módulo Bloqueado! Conclua os módulos anteriores primeiro 🔒");
        });
    }

    // Lessons Database
    const LESSONS = {
        "lesson-m2-1": {
            title: "Fundamentos da Genômica",
            duration: "15:30",
            durationSec: 930,
            bg: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=800",
            instructor: "Prof. Dr. Ricardo Silva",
            instructorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
            description: "Nesta aula abordamos a base da genômica nutricional, investigando como variações genéticas específicas (polimorfismos de nucleotídeo único) influenciam a necessidade diária de nutrientes. Um guia introdutório essencial para a prática de nutrição de alta precisão baseada em biomarcadores celulares."
        },
        "lesson-m2-2": {
            title: "Mapeamento Nutricional de Precisão",
            duration: "42:15",
            durationSec: 2535,
            bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0zb65zuSBJax2iThGwJzOzw6piNdgeayq-m1I2fEHHJeEUYD4omlEVfA_RfUSx9Nl2IyoO3wVgrxBA-1uIw8gnxa7BZMT4lXRadilkEIqX9zdqm4JMsLBuJm2c9_PNyEyEtlsMlOZhzx20_zgGOReNwOwFQYqVZt7qFKl3TYfiqXFraTXZbud4Jj6DDwDbcqBVVWZJ9fanHkT09pk_tozv190JaJLg4CC3B7yNVeCMe4Fu2iuDfQIT49mbGLY1NE13jBgtQAonF13",
            instructor: "Profª Dra. Helena Martins",
            instructorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTtvKmM6Y6z80TTzNwLzrJJ5h120ae2Sdew0cDHBR0-xrCw49Iwc36J0c2-FcOBxPcYW9fbRywwnXEEKbDISC5f7lEdNs9W-_OPOpAC-4CHCxpKAdG6r6Y2zeXXaprcGpl05PdWCtSz2m5BnSE3N6PieJKfWfyZKoc3FgnmGRSyzQHG2ye5oZ55KYa_sTGDN5gqQ8j058fUBnmqwD2wJqFMpIWqwUTWeZjx9bMpHNtvwGyfRa1L0_6F3BCH5Qrm5Ttm0Ku1scDMrDa",
            description: "Nesta sessão avançada, exploramos como a tecnologia clean-tech permite a personalização nutricional baseada em sequenciamento genômico de alta precisão. Discutimos a bio-disponibilidade de micronutrientes e como o DNA individual dita a absorção e o metabolismo celular, otimizando protocolos clínicos para máxima performance e longevidade física."
        }
    };

    let activeLessonId = "lesson-m2-2";
    let isPlaying = false;
    let playProgressSec = 0;
    let playInterval = null;

    // Elements of Video Player & Details
    const videoThumbnail = document.getElementById("video-thumbnail");
    const videoPlayBtn = document.getElementById("video-play-btn");
    const videoPlayBtnIcon = document.getElementById("video-play-btn-icon");
    const videoTimeText = document.getElementById("video-time-text");
    const videoProgressFill = document.getElementById("video-progress-fill");
    const videoPlayerContainer = document.getElementById("video-player-container");
    const lessonTitle = document.getElementById("lesson-title");
    const instructorAvatar = document.getElementById("instructor-avatar");
    const instructorName = document.getElementById("instructor-name");
    const lessonDescription = document.getElementById("lesson-description");
    const btnSettings = document.getElementById("video-btn-settings");
    const btnFullscreen = document.getElementById("video-btn-fullscreen");

    // Format seconds to MM:SS
    function formatTime(secs) {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = Math.floor(secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    // Update Player & Information UI based on selected lesson
    function selectLesson(lessonId) {
        activeLessonId = lessonId;
        const lesson = LESSONS[lessonId];
        if (!lesson) return;

        // Reset player progress
        pauseVideo();
        playProgressSec = 0;
        updatePlayerUI(lesson.duration, 0);

        // Update details UI
        if (lessonTitle) lessonTitle.innerText = lesson.title;
        if (lessonDescription) lessonDescription.innerText = lesson.description;
        if (instructorName) instructorName.innerText = lesson.instructor;
        if (instructorAvatar) instructorAvatar.src = lesson.instructorAvatar;
        if (videoThumbnail) videoThumbnail.src = lesson.bg;

        // Update Sidebar items styling
        Object.keys(LESSONS).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === lessonId) {
                el.className = "w-full flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border-l-4 border-purple-750 dark:border-purple-400 transition-all text-left";
                // Update playing subtext
                const subtext = el.querySelector("p:last-of-type");
                if (subtext) {
                    subtext.innerText = `${LESSONS[id].duration} • Assistindo agora`;
                    subtext.className = "text-[9px] text-purple-600 dark:text-purple-400/80 font-medium";
                }
                const icon = el.querySelector(".material-symbols-outlined");
                if (icon) {
                    icon.innerText = "play_arrow";
                    icon.style.fontVariationSettings = "'FILL' 1";
                    icon.className = "material-symbols-outlined text-purple-750 dark:text-purple-400 !text-sm";
                }
            } else {
                el.className = "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left";
                const subtext = el.querySelector("p:last-of-type");
                if (subtext) {
                    subtext.innerText = `${LESSONS[id].duration} • Concluído`;
                    subtext.className = "text-[9px] text-gray-400 dark:text-gray-500";
                }
                const icon = el.querySelector(".material-symbols-outlined");
                if (icon) {
                    icon.innerText = "check";
                    icon.style.fontVariationSettings = "'FILL' 0";
                    icon.className = "material-symbols-outlined text-green-600 dark:text-green-400 !text-sm";
                }
            }
        });
    }

    function updatePlayerUI(durationStr, progressPercentage) {
        if (videoTimeText) {
            videoTimeText.innerText = `${formatTime(playProgressSec)} / ${durationStr}`;
        }
        if (videoProgressFill) {
            videoProgressFill.style.width = `${progressPercentage}%`;
        }
    }

    // Play simulation logic
    function playVideo() {
        if (isPlaying) return;
        isPlaying = true;
        
        // Hide large central play button gradually
        if (videoPlayBtn) {
            videoPlayBtn.classList.add("opacity-0", "scale-75");
        }

        const lesson = LESSONS[activeLessonId];
        
        playInterval = setInterval(() => {
            // Speed up simulation: increase 3 seconds for every tick of 500ms
            playProgressSec += 3;
            if (playProgressSec >= lesson.durationSec) {
                playProgressSec = lesson.durationSec;
                pauseVideo();
                showToast("Aula concluída! Parabéns por concluir este aprendizado! 🎓🌱");
            }
            const percentage = (playProgressSec / lesson.durationSec) * 100;
            updatePlayerUI(lesson.duration, percentage);
        }, 500);
    }

    function pauseVideo() {
        if (!isPlaying) return;
        isPlaying = false;
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }

        // Show central play button
        if (videoPlayBtn) {
            videoPlayBtn.classList.remove("opacity-0", "scale-75");
        }
    }

    function togglePlay() {
        if (isPlaying) {
            pauseVideo();
            showToast("Vídeo pausado ⏸️");
        } else {
            playVideo();
            showToast("Iniciando reprodução 🎥");
        }
    }

    // Bind Player Click Listeners
    if (videoPlayBtn) {
        videoPlayBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePlay();
        });
    }
    if (videoPlayerContainer) {
        videoPlayerContainer.addEventListener("click", () => {
            togglePlay();
        });
    }

    // Bind Module 2 click switchers
    const lesson1El = document.getElementById("lesson-m2-1");
    if (lesson1El) {
        lesson1El.addEventListener("click", () => {
            selectLesson("lesson-m2-1");
            showToast("Carregando aula: Fundamentos da Genômica 🧬");
        });
    }

    const lesson2El = document.getElementById("lesson-m2-2");
    if (lesson2El) {
        lesson2El.addEventListener("click", () => {
            selectLesson("lesson-m2-2");
            showToast("Carregando aula: Mapeamento Nutricional de Precisão 🔬");
        });
    }

    // Continue Watching Card Button
    const btnContinue = document.getElementById("btn-continue-watching");
    if (btnContinue) {
        btnContinue.addEventListener("click", () => {
            selectLesson("lesson-m2-2");
            setTimeout(() => {
                playVideo();
                showToast("Continuando de onde você parou! 📺");
            }, 300);
        });
    }

    // Like and Share Triggers
    const btnLike = document.getElementById("lesson-btn-like");
    const btnLikeText = document.getElementById("lesson-btn-like-text");
    const btnLikeIcon = document.getElementById("lesson-btn-like-icon");
    let isLiked = false;

    if (btnLike) {
        btnLike.addEventListener("click", () => {
            isLiked = !isLiked;
            if (isLiked) {
                btnLike.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-300 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-750 dark:text-purple-400 text-xs font-semibold active:scale-95 transition-all shadow-sm";
                if (btnLikeIcon) btnLikeIcon.style.fontVariationSettings = "'FILL' 1";
                showToast("Obrigado pelo seu feedback! Aula marcada como útil 👍💜");
            } else {
                btnLike.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#27272A] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs text-gray-600 dark:text-gray-400 font-medium active:scale-95";
                if (btnLikeIcon) btnLikeIcon.style.fontVariationSettings = "'FILL' 0";
                showToast("Feedback removido 🚫");
            }
        });
    }

    const btnShare = document.getElementById("lesson-btn-share");
    if (btnShare) {
        btnShare.addEventListener("click", () => {
            const simUrl = `https://amora.app/aulas/suplementacao-genomica?aula=${activeLessonId}`;
            navigator.clipboard.writeText(simUrl).then(() => {
                showToast("Link da aula copiado para a área de transferência! 🔗");
            }).catch(() => {
                showToast("Copiar falhou, compartilhando aula! 👥");
            });
        });
    }

    // Player Toolbar Settings Actions
    if (btnSettings) {
        btnSettings.addEventListener("click", (e) => {
            e.stopPropagation();
            showToast("Abrindo configurações do player (1080p, Auto) ⚙️");
        });
    }
    if (btnFullscreen) {
        btnFullscreen.addEventListener("click", (e) => {
            e.stopPropagation();
            showToast("Simulando exibição em Tela Cheia 📺");
        });
    }

    // Simulated Material PDF Downloads
    function simulateDownload(downloadBtnId, progressBarId, filename) {
        const btn = document.getElementById(downloadBtnId);
        const bar = document.getElementById(progressBarId);
        if (!btn || !bar) return;

        // Prevent double click during progress
        if (bar.style.width !== "0%" && bar.style.width !== "") return;

        showToast(`Iniciando download de ${filename}... 📥`);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            bar.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                showToast(`Download de ${filename} concluído com sucesso! ✅`);
                setTimeout(() => {
                    bar.style.width = "0%";
                }, 1000);
            }
        }, 150);
    }

    const downloadBtn1 = document.getElementById("material-download-1");
    if (downloadBtn1) {
        downloadBtn1.addEventListener("click", () => {
            simulateDownload("material-download-1", "download-progress-1", "Guia de Mapeamento.pdf");
        });
    }

    const downloadBtn2 = document.getElementById("material-download-2");
    if (downloadBtn2) {
        downloadBtn2.addEventListener("click", () => {
            simulateDownload("material-download-2", "download-progress-2", "Protocolos Clínicos.pdf");
        });
    }

    // Add interactive scales on pressing
    document.querySelectorAll("button, a, [role='button']").forEach(btn => {
        btn.addEventListener("mousedown", () => btn.classList.add("scale-95"));
        btn.addEventListener("mouseup", () => btn.classList.remove("scale-95"));
        btn.addEventListener("mouseleave", () => btn.classList.remove("scale-95"));
    });

    } catch(e) {
      console.error(e);
    }
  }, [loading]);

  if (loading) return null;

  return (
    <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white" dangerouslySetInnerHTML={{ __html: `

<!-- SideNavBar Component -->
<nav class="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50">
    <!-- Header -->
    <a href="/" class="px-6 pb-6 border-b border-gray-200 dark:border-[#27272A] mb-6 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg mx-2 p-2 block decoration-none">
        <div class="w-8 h-8 rounded shrink-0 flex items-center justify-center overflow-hidden">
            <img id="sidebar-logo" alt="Amora Logo" class="w-full h-full object-contain" src=""/>
        </div>
        <div class="flex-1 overflow-hidden">
            <h2 id="sidebar-workspace-title" class="font-label-md text-sm font-medium truncate text-gray-900 dark:text-white">Pedro Miguel's Works...</h2>
            <p id="sidebar-workspace-subtitle" class="font-label-sm text-xs text-gray-500 dark:text-gray-400 truncate">personal-pedro-miguel-DM...</p>
        </div>
        <svg class="text-gray-400 dark:text-gray-500" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>
    </a>
    
    <!-- Navigation Links -->
    <div class="flex-1 overflow-y-auto px-2 space-y-6">
        <!-- Section 1 -->
        <div>
            <p class="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Aprender</p>
            <div class="space-y-1">
                <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/">
                    <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span class="font-label-md text-sm">Amora</span>
                </a>
                <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors" href="/aulas">
                    <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    <span class="font-label-md text-sm">Aulas</span>
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
            <p class="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Ajustes</p>
            <div class="space-y-1">
                <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/configuracao">
                    <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <span class="font-label-md text-sm">Configuração</span>
                </a>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="px-4 pt-4 border-t border-gray-200 dark:border-[#27272A] space-y-4">
        <div class="px-2">
            <span id="sidebar-plan-badge" class="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs">Free Plan</span>
        </div>
        <div onclick="window.location.href='/configuracao'" class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative">
                <img id="sidebar-avatar" alt="Pedro Miguel" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcb76zVeNvWaW40zTrrzkpQaBZk6qO6Ey0TkOxy1dhyMk9RBKW9bfdiBqVBZ9VS6G4WcBMgYEFYIrnkeUnQwOaxt7-HKeEejqnbqXUzKbbkkQa7SCwWXi3pS0YpdM0DTjhXMfUVyx0fDpTCSOvBEyQ6njAST3EHllrte0fBE_AYuRhSnhuLnX0kCwON0rBKXdbnv13Iv_Fj-skyZyQbPwFOicwLJBOjFzyWe-_ZcH4zBzGcDMha6gP_xFqo7YxRpPWvc4uHqEi_tbx"/>
            </div>
            <div class="flex-1 overflow-hidden">
                <p id="sidebar-name" class="font-label-md text-sm font-medium text-gray-900 dark:text-white truncate">Pedro Miguel</p>
                <p id="sidebar-email" class="font-label-sm text-xs text-gray-500 truncate">pedromlzaparoli@gmail.com</p>
            </div>
            <svg class="text-gray-400 dark:text-gray-500 shrink-0" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>
        </div>
        
        <!-- Sign Out Button -->
        <button onclick="handleSignOut()" class="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span class="font-label-md text-sm font-medium">Sair da conta</span>
        </button>
    </div>
</nav>

<!-- Main Content Canvas -->
<main class="ml-64 flex-1 flex flex-col min-h-screen relative overflow-hidden bg-[#F9FAFB] dark:bg-[#0A0A0B]">
    <!-- Ambient Background Pattern -->
    <div class="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02]" style="background-image: radial-gradient(var(--tw-colors-purple-500) 1px, transparent 1px); background-size: 24px 24px;"></div>
    
    <div class="flex-1 max-w-6xl mx-auto w-full px-8 pt-20 pb-12 relative z-10 flex flex-col">
        <!-- Header Section -->
        <section class="mb-12">
            <h2 class="font-display font-semibold text-3xl text-gray-900 dark:text-white mb-2 tracking-tight">Aulas &amp; Capacitação</h2>
            <p class="font-body-lg text-base text-gray-500 dark:text-gray-400 max-w-2xl">Explore os módulos de treinamento clínico e desenvolvimento em biotecnologia da Amora.</p>
        </section>
        <!-- Top Progress Hero Card -->
        <section class="mb-8">
            <div class="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="font-label-sm text-xs text-purple-700 dark:text-purple-400 uppercase font-semibold">Progresso do Curso</span>
                        <span class="text-gray-300 dark:text-gray-600">•</span>
                        <span class="font-label-md font-bold text-sm text-gray-900 dark:text-white">65% concluído</span>
                    </div>
                    <div class="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3 border border-gray-100 dark:border-gray-900">
                        <div class="h-full bg-purple-700 dark:bg-purple-400 transition-all duration-1000" style="width: 65%;"></div>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Próxima aula sugerida: <span class="text-gray-900 dark:text-white font-medium">Nutrição Molecular</span></p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-continue-watching" class="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-400 dark:text-gray-900 dark:hover:bg-purple-500 rounded-full font-medium text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm">
                        <span class="material-symbols-outlined !text-base" style="font-variation-settings: 'FILL' 1;">play_circle</span>
                        Continuar assistindo
                    </button>
                </div>
            </div>
        </section>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <!-- Left Sidebar: Modules (4 Columns) -->
            <aside class="lg:col-span-4 space-y-4">
                <h3 class="font-display font-semibold text-lg text-gray-900 dark:text-white mb-4">Módulos</h3>
                
                <!-- Module 1 -->
                <div class="border border-gray-200 dark:border-[#27272A] rounded-xl overflow-hidden bg-white dark:bg-[#18181B] shadow-sm">
                    <button id="module-1-header" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Módulo 01</span>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white">Introdução ao Clean-Tech</span>
                        </div>
                        <span id="module-1-chevron" class="material-symbols-outlined text-gray-400 group-hover:translate-y-0.5 transition-transform">expand_more</span>
                    </button>
                    <div id="module-1-content" class="max-h-0 overflow-hidden transition-all duration-350 ease-in-out">
                        <div class="p-2 space-y-1 border-t border-gray-100 dark:border-[#27272A]/50 bg-gray-50/30 dark:bg-black/5">
                            <!-- Lesson 1.1 -->
                            <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                                <div class="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 border border-green-100 dark:border-green-950">
                                    <span class="material-symbols-outlined text-green-600 dark:text-green-400 !text-sm">check</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs font-medium text-gray-900 dark:text-white">Conceito de Clean-Tech na Saúde</p>
                                    <p class="text-[9px] text-gray-400 dark:text-gray-500">10:15 • Concluído</p>
                                </div>
                            </button>
                            <!-- Lesson 1.2 -->
                            <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                                <div class="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 border border-green-100 dark:border-green-950">
                                    <span class="material-symbols-outlined text-green-600 dark:text-green-400 !text-sm">check</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs font-medium text-gray-900 dark:text-white">Histórico de Alimentação e Tecnologia</p>
                                    <p class="text-[9px] text-gray-400 dark:text-gray-500">12:40 • Concluído</p>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div class="bg-gray-50/50 dark:bg-black/10 px-4 py-2 border-t border-gray-100 dark:border-[#27272A]/50">
                        <p class="text-[10px] font-medium text-gray-500 dark:text-gray-400">2 aulas concluídas</p>
                    </div>
                </div>

                <!-- Module 2: Active -->
                <div class="border border-purple-700/30 dark:border-purple-400/30 rounded-xl overflow-hidden bg-white dark:bg-[#18181B] shadow-sm">
                    <button id="module-2-header" class="w-full flex items-center justify-between p-4 bg-purple-50/30 dark:bg-purple-900/10 border-b border-gray-100 dark:border-[#27272A]/50 text-left group">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">Módulo 02</span>
                            <span class="text-sm font-bold text-gray-900 dark:text-white">Suplementação Genômica</span>
                        </div>
                        <span id="module-2-chevron" class="material-symbols-outlined text-purple-700 dark:text-purple-400">expand_less</span>
                    </button>
                    <div id="module-2-content" class="max-h-[500px] overflow-hidden transition-all duration-350 ease-in-out">
                        <div class="p-2 space-y-1">
                            <!-- Lesson 1 (Completed) -->
                            <button id="lesson-m2-1" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left">
                                <div class="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 border border-green-100 dark:border-green-950">
                                    <span class="material-symbols-outlined text-green-600 dark:text-green-400 !text-sm">check</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs font-medium text-gray-900 dark:text-white">Fundamentos da Genômica</p>
                                    <p class="text-[9px] text-gray-400 dark:text-gray-500">15:30 • Concluído</p>
                                </div>
                            </button>
                            <!-- Lesson 2 (Active/Watching) -->
                            <button id="lesson-m2-2" class="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border-l-4 border-purple-700 dark:border-purple-400 transition-all text-left">
                                <div class="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 border border-purple-200 dark:border-purple-900">
                                    <span id="lesson-m2-2-icon" class="material-symbols-outlined text-purple-700 dark:text-purple-400 !text-sm" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs font-semibold text-purple-700 dark:text-purple-400">Mapeamento Nutricional de Precisão</p>
                                    <p class="text-[9px] text-purple-600 dark:text-purple-400/80 font-medium">42:15 • Assistindo agora</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Module 3 -->
                <div class="border border-gray-200 dark:border-[#27272A] rounded-xl overflow-hidden bg-white dark:bg-[#18181B] opacity-60">
                    <button id="module-3-header" class="w-full flex items-center justify-between p-4 text-left cursor-not-allowed">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Módulo 03</span>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white">Biotecnologia Aplicada</span>
                        </div>
                        <span class="material-symbols-outlined text-gray-400">lock</span>
                    </button>
                </div>
            </aside>

            <!-- Right Column: Video & Details (8 Columns) -->
            <section class="lg:col-span-8 space-y-6">
                <!-- Video Player Container -->
                <div id="video-player-container" class="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-sm group border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] cursor-pointer">
                    <img id="video-thumbnail" alt="Lesson Background" class="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0zb65zuSBJax2iThGwJzOzw6piNdgeayq-m1I2fEHHJeEUYD4omlEVfA_RfUSx9Nl2IyoO3wVgrxBA-1uIw8gnxa7BZMT4lXRadilkEIqX9zdqm4JMsLBuJm2c9_PNyEyEtlsMlOZhzx20_zgGOReNwOwFQYqVZt7qFKl3TYfiqXFraTXZbud4Jj6DDwDbcqBVVWZJ9fanHkT09pk_tozv190JaJLg4CC3B7yNVeCMe4Fu2iuDfQIT49mbGLY1NE13jBgtQAonF13"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <!-- Center Play Button -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <button id="video-play-btn" class="w-16 h-16 bg-purple-700 text-white dark:bg-purple-400 dark:text-gray-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                            <span id="video-play-btn-icon" class="material-symbols-outlined !text-3xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        </button>
                    </div>
                    <!-- Bottom Controls Placeholder -->
                    <div class="absolute bottom-0 left-0 w-full p-4 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                        <div class="flex items-center gap-4">
                            <span id="video-time-text" class="text-xs text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded font-mono">00:00 / 42:15</span>
                            <div class="h-1.5 w-40 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
                                <div id="video-progress-fill" class="h-full bg-purple-700 dark:bg-purple-400 transition-all duration-300" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span id="video-btn-settings" class="material-symbols-outlined text-white text-base cursor-pointer hover:text-purple-400 transition-colors">settings</span>
                            <span id="video-btn-fullscreen" class="material-symbols-outlined text-white text-base cursor-pointer hover:text-purple-400 transition-colors">fullscreen</span>
                        </div>
                    </div>
                </div>

                <!-- Lesson Info -->
                <div class="space-y-4 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-6 shadow-sm">
                    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-150 dark:border-[#27272A]/50 pb-4">
                        <div>
                            <h2 id="lesson-title" class="font-display font-semibold text-xl text-gray-900 dark:text-white mb-2 leading-tight">Mapeamento Nutricional de Precisão</h2>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="w-6 h-6 rounded-full bg-gray-150 overflow-hidden">
                                    <img id="instructor-avatar" alt="Instructor" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTtvKmM6Y6z80TTzNwLzrJJ5h120ae2Sdew0cDHBR0-xrCw49Iwc36J0c2-FcOBxPcYW9fbRywwnXEEKbDISC5f7lEdNs9W-_OPOpAC-4CHCxpKAdG6r6Y2zeXXaprcGpl05PdWCtSz2m5BnSE3N6PieJKfWfyZKoc3FgnmGRSyzQHG2ye5oZ55KYa_sTGDN5gqQ8j058fUBnmqwD2wJqFMpIWqwUTWeZjx9bMpHNtvwGyfRa1L0_6F3BCH5Qrm5Ttm0Ku1scDMrDa"/>
                                </div>
                                <span id="instructor-name" class="text-xs text-gray-500 dark:text-gray-400 font-medium">Profª Dra. Helena Martins</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button id="lesson-btn-like" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#27272A] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs text-gray-600 dark:text-gray-400 font-medium active:scale-95">
                                <span id="lesson-btn-like-icon" class="material-symbols-outlined !text-sm">thumb_up</span>
                                <span id="lesson-btn-like-text">Útil</span>
                            </button>
                            <button id="lesson-btn-share" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#27272A] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs text-gray-600 dark:text-gray-400 font-medium active:scale-95">
                                <span class="material-symbols-outlined !text-sm">share</span>
                                <span>Compartilhar</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <h3 class="text-xs font-semibold text-gray-450 uppercase tracking-wider">Sobre esta aula</h3>
                        <p id="lesson-description" class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                            Nesta sessão avançada, exploramos como a tecnologia clean-tech permite a personalização nutricional baseada em sequenciamento genômico de alta precisão. Discutimos a bio-disponibilidade de micronutrientes e como o DNA individual dita a absorção e o metabolismo celular, otimizando protocolos clínicos para máxima performance e longevidade.
                        </p>
                    </div>

                    <!-- Supporting Materials -->
                    <div class="bg-gray-50/50 dark:bg-black/10 rounded-xl p-4 border border-gray-100 dark:border-[#27272A]/50 mt-6">
                        <h3 class="text-xs font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-purple-700 dark:text-purple-400 !text-sm">description</span>
                            Materiais de Apoio
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button id="material-download-1" class="flex items-center justify-between p-3 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-lg hover:border-purple-700 dark:hover:border-purple-400 transition-all group w-full text-left relative overflow-hidden active:scale-[0.99]">
                                <div class="flex items-center gap-3 relative z-10">
                                    <div class="w-8 h-8 bg-red-50 dark:bg-red-950/20 flex items-center justify-center rounded text-red-600 dark:text-red-400">
                                        <span class="material-symbols-outlined !text-sm">picture_as_pdf</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-medium text-gray-900 dark:text-white">Guia de Mapeamento.pdf</span>
                                        <span class="text-[9px] text-gray-400 dark:text-gray-500">2.4 MB</span>
                                    </div>
                                </div>
                                <span class="material-symbols-outlined text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-400 !text-sm relative z-10">download</span>
                                <div id="download-progress-1" class="absolute bottom-0 left-0 h-1 bg-purple-750 dark:bg-purple-400 transition-all duration-300" style="width: 0%;"></div>
                            </button>
                            <button id="material-download-2" class="flex items-center justify-between p-3 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-lg hover:border-purple-700 dark:hover:border-purple-400 transition-all group w-full text-left relative overflow-hidden active:scale-[0.99]">
                                <div class="flex items-center gap-3 relative z-10">
                                    <div class="w-8 h-8 bg-red-50 dark:bg-red-950/20 flex items-center justify-center rounded text-red-600 dark:text-red-400">
                                        <span class="material-symbols-outlined !text-sm">picture_as_pdf</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-medium text-gray-900 dark:text-white">Protocolos Clínicos.pdf</span>
                                        <span class="text-[9px] text-gray-400 dark:text-gray-500">1.8 MB</span>
                                    </div>
                                </div>
                                <span class="material-symbols-outlined text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-400 !text-sm relative z-10">download</span>
                                <div id="download-progress-2" class="absolute bottom-0 left-0 h-1 bg-purple-750 dark:bg-purple-400 transition-all duration-300" style="width: 0%;"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </section>              </div>
            </section>
        </div>
    </div>
</main>


` }} />
  );
}
