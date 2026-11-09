
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Page() {
    const router = useRouter();
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setAuthLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    useEffect(() => {
        if (authLoading) return;

        // Execute legacy scripts
        try {

            const escapeHtml = (value) => String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

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

            // Toast Alert Notification System
            function showToast(message) {
                const toast = document.createElement("div");
                toast.className = "fixed top-6 right-6 z-[100] bg-white dark:bg-[#18181B] border border-purple-500/30 text-gray-900 dark:text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 transform translate-y-[-20px] opacity-0 transition-all duration-300";
                toast.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
            <span class="text-sm font-medium font-body-md">${escapeHtml(message)}</span>
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
                        setTimeout(() => mobileOverlay.classList.add("hidden"), 300); // Wait for transition
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
                
                // Close menu when clicking links on mobile
                const navLinks = sidebarNav.querySelectorAll("a");
                navLinks.forEach(link => {
                    link.addEventListener("click", () => {
                        if (window.innerWidth < 768) { // md breakpoint
                            toggleMenu();
                        }
                    });
                });
            }

            // Top Badge interaction
            const topBadge = document.querySelector("a[href='#']");
            if (topBadge) {
                topBadge.addEventListener("click", (e) => {
                    e.preventDefault();
                    showToast("Amora Nutrição ativa! Como posso ajudar você hoje? 🌿");
                });
            }

            // Tab Switching
            const tabMeus = document.getElementById("tab-meus");
            const tabTime = document.getElementById("tab-time");
            const emptyTitle = document.getElementById("empty-title");
            const emptySubtitle = document.getElementById("empty-subtitle");

            if (tabMeus && tabTime) {
                tabMeus.addEventListener("click", () => {
                    tabMeus.className = "px-6 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors active:scale-98";
                    tabTime.className = "px-6 py-2 rounded-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-98";
                    if (emptyTitle) emptyTitle.innerText = "Nenhum projeto ainda";
                    if (emptySubtitle) emptySubtitle.innerText = "Descreva o que você quer aprender acima e nós ajudaremos você a começar.";
                    showToast("Exibindo seus projetos pessoais 📂");
                });

                tabTime.addEventListener("click", () => {
                    tabTime.className = "px-6 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors active:scale-98";
                    tabMeus.className = "px-6 py-2 rounded-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-98";
                    if (emptyTitle) emptyTitle.innerText = "Nenhum projeto de time";
                    if (emptySubtitle) emptySubtitle.innerText = "Os projetos compartilhados com a sua equipe serão listados aqui.";
                    showToast("Exibindo projetos compartilhados da equipe 👥");
                });
            }

            // Attach File Flow
            const fileUploader = document.getElementById("file-uploader");
            const btnAttach = document.getElementById("btn-attach");
            const badgeContainer = document.getElementById("upload-badge-container");
            let attachedFile = null;

            if (btnAttach && fileUploader) {
                btnAttach.addEventListener("click", () => fileUploader.click());

                fileUploader.addEventListener("change", (e) => {
                    if (e.target.files.length > 0) {
                        attachedFile = e.target.files[0];
                        badgeContainer.innerHTML = `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-medium">
                        <svg fill="none" height="12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/></svg>
                        ${escapeHtml(attachedFile.name)} (${Math.round(attachedFile.size / 1024)} KB)
                        <button id="btn-remove-file" class="ml-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 font-bold">×</button>
                    </div>
                `;
                        badgeContainer.classList.remove("hidden");
                        showToast("Arquivo anexado com sucesso! 📄");

                        document.getElementById("btn-remove-file").addEventListener("click", () => {
                            attachedFile = null;
                            badgeContainer.classList.add("hidden");
                            badgeContainer.innerHTML = "";
                            fileUploader.value = "";
                            showToast("Anexo removido 🗑️");
                        });
                    }
                });
            }

            // Microphone Voice Input Flow using Web Speech API
            const btnMic = document.getElementById("btn-mic");
            const textarea = document.getElementById("prompt-textarea");
            let isRecording = false;
            let recognition = null;
            let finalTranscript = "";

            if (typeof window !== "undefined") {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.lang = 'pt-BR';
                    recognition.interimResults = true;

                    recognition.onstart = () => {
                        isRecording = true;
                        finalTranscript = textarea.value.trim();
                        btnMic.classList.add("bg-red-50", "dark:bg-red-950/20", "text-red-650", "dark:text-red-400", "border-red-500/50", "animate-pulse");
                        textarea.placeholder = "Ouvindo... 🎙️ Fale sua dúvida sobre nutrição.";
                        showToast("Microfone ativado! Fale agora 🎙️");
                    };

                    recognition.onresult = (event) => {
                        let interimTranscript = "";
                        for (let i = event.resultIndex; i < event.results.length; i++) {
                            const transcript = event.results[i][0].transcript.trim();
                            if (event.results[i].isFinal) {
                                finalTranscript += (finalTranscript ? " " : "") + transcript;
                            } else {
                                interimTranscript += (interimTranscript ? " " : "") + transcript;
                            }
                        }
                        textarea.value = `${finalTranscript}${finalTranscript && interimTranscript ? " " : ""}${interimTranscript}`;
                    };

                    recognition.onerror = (event) => {
                        const errors = {
                            'not-allowed': 'Permita o acesso ao microfone no navegador para usar a digitação por voz.',
                            'service-not-allowed': 'O reconhecimento de voz foi bloqueado pelo navegador.',
                            'no-speech': 'Não foi detectada fala. Tente novamente.',
                            'network': 'Falha de rede no reconhecimento de voz. Verifique a conexão.',
                            'audio-capture': 'Nenhum microfone disponível no momento.'
                        };
                        if (event.error !== 'aborted') showToast(errors[event.error] || "Erro ao reconhecer voz. Tente novamente.");
                    };

                    recognition.onend = () => {
                        isRecording = false;
                        btnMic.classList.remove("bg-red-50", "dark:bg-red-950/20", "text-red-650", "dark:text-red-400", "border-red-500/50", "animate-pulse");
                        textarea.placeholder = "Escreva sua dúvida sobre nutrição ou saúde...";
                    };
                }
            }

            if (btnMic && textarea) {
                btnMic.addEventListener("click", () => {
                    if (!recognition) {
                        showToast("Reconhecimento de voz não suportado neste navegador.");
                        return;
                    }
                    if (isRecording) {
                        recognition.stop();
                    } else {
                        try {
                            recognition.start();
                        } catch (error) {
                            showToast("A digitação por voz já está sendo iniciada. Tente novamente em instantes.");
                        }
                    }
                });
            }

            // Send Simulated Chat & AI Response Flow
            const btnSend = document.getElementById("btn-send");
            const btnClearChat = document.getElementById("btn-clear-chat");
            const emptyState = document.getElementById("empty-state");
            const chatMessages = document.getElementById("chat-messages");
            let chatHistory = [];
            const MAX_CHAT_CONTEXT_MESSAGES = 40;

            // Arquivos servem somente como contexto da mensagem em que foram
            // enviados. Não os persistimos nem os reenviamos em cada turno,
            // evitando que conversas longas ultrapassem o limite da API.
            function messagesForStorage() {
                return chatHistory.map(({ role, content }) => ({ role, content }));
            }

            function messagesForModel() {
                const start = Math.max(0, chatHistory.length - MAX_CHAT_CONTEXT_MESSAGES);
                return chatHistory.slice(start).map((message, index) => {
                    const isLatest = start + index === chatHistory.length - 1;
                    return isLatest && message.inlineData
                        ? message
                        : { role: message.role, content: message.content };
                });
            }

            // Supabase Chat History state and logic
            let activeChatId = null;
            let chatsList = [];
            let showAllChats = false;
            let currentUser = null;

            // Fetch current user and load their chats
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    currentUser = user;
                    loadChatsList();
                }
            });

            async function loadChatsList() {
                if (!currentUser) return;
                const { data, error } = await supabase
                    .from('chats')
                    .select('id, title, created_at')
                    .order('created_at', { ascending: false });
                if (error) {
                    console.error("Error loading chats list:", error);
                    return;
                }
                chatsList = data || [];
                renderChatsList();
            }

            function renderChatsList() {
                const listContainer = document.getElementById("sidebar-chats-list");
                if (!listContainer) return;

                if (chatsList.length === 0) {
                    listContainer.innerHTML = `
                        <div class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">
                            Nenhuma conversa salva
                        </div>
                    `;
                    return;
                }

                const visibleChats = showAllChats ? chatsList : chatsList.slice(0, 3);

                let html = visibleChats.map(chat => {
                    const isActive = chat.id === activeChatId;
                    const activeClass = isActive 
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-medium" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50";
                    return `
                        <div data-chat-id="${chat.id}" class="group flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeClass}">
                            <span class="truncate flex-1 font-label-md select-none">${escapeHtml(chat.title)}</span>
                            <button class="btn-delete-chat p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-450 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-pointer" data-id="${chat.id}" title="Excluir conversa">
                                <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" x2="10" y1="11" y2="17"></line>
                                    <line x1="14" x2="14" y1="11" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    `;
                }).join('');

                if (chatsList.length > 3) {
                    html += `
                        <button type="button" id="btn-toggle-chats" class="w-full text-center py-2 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline transition-colors mt-1 select-none flex items-center justify-center gap-1 cursor-pointer">
                            <span>${showAllChats ? "Ver menos" : "Ver mais"}</span>
                            <svg class="transition-transform duration-200 ${showAllChats ? "rotate-180" : ""}" fill="none" height="12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    `;
                }

                listContainer.innerHTML = html;

                // Attach click listeners to loaded chat items and delete buttons
                listContainer.querySelectorAll('[data-chat-id]').forEach(item => {
                    item.addEventListener("click", () => {
                        const chatId = item.getAttribute("data-chat-id");
                        selectChatSession(chatId);
                    });
                });

                listContainer.querySelectorAll('.btn-delete-chat').forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const chatId = btn.getAttribute("data-id");
                        deleteChatSession(chatId);
                    });
                });

                const toggleBtn = document.getElementById("btn-toggle-chats");
                if (toggleBtn) {
                    toggleBtn.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showAllChats = !showAllChats;
                        renderChatsList();
                    });
                }
            }

            async function selectChatSession(chatId) {
                activeChatId = chatId;
                const { data, error } = await supabase
                    .from('chats')
                    .select('messages')
                    .eq('id', chatId)
                    .single();
                if (error) {
                    showToast("Erro ao carregar conversa.");
                    return;
                }
                chatHistory = data.messages || [];
                renderChatHistory();
                renderChatsList();
            }

            function appendStaticAIMessage(responseText, isLastInHistory = false) {
                const aiMsg = document.createElement("div");
                aiMsg.className = "flex items-start gap-3 sm:gap-4 w-full min-w-0";
                const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                let styled = escapeHtml(responseText).replace(/\n/g, '<br/>');
                styled = styled.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-700 dark:text-purple-400">$1</strong>');

                const subChatId = 'sub-chat-hist-' + Math.random().toString(36).substring(2, 9);

                aiMsg.innerHTML = `
                    <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                        <img class="w-full h-full object-contain" src="${logoSrc}"/>
                    </div>
                    <div class="flex-grow min-w-0 flex flex-col gap-4">
                        <div class="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-[20px] rounded-tl-[4px] p-5 text-sm leading-relaxed shadow-sm font-light text-gray-800 dark:text-gray-200 space-y-4 break-words [overflow-wrap:anywhere] min-w-0">
                            <p class="typing-text-block">${styled}</p>
                        </div>
                        
                        <!-- Sub-chat box under the response (only shown if it is the last message or part of history setup) -->
                        <div class="w-full bg-white dark:bg-[#18181B] rounded-[16px] border border-gray-200 dark:border-[#27272A] shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-1 focus-within:ring-purple-700 dark:focus-within:ring-purple-400 focus-within:border-purple-700 dark:focus-within:border-purple-400 relative ${isLastInHistory ? '' : 'hidden'}">
                            <input type="file" id="uploader-${subChatId}" class="hidden" accept="image/*,application/pdf" />
                            <div id="badge-${subChatId}" class="px-4 pt-3 hidden flex flex-wrap gap-2"></div>
                            <div class="flex items-center px-4 py-2 gap-2">
                                <input type="text" id="input-${subChatId}" class="flex-1 bg-transparent border-none p-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 font-light" placeholder="Responder à Amora..." />
                                <button id="attach-${subChatId}" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer" title="Anexar arquivo">
                                    <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                </button>
                                <button id="send-${subChatId}" class="w-8 h-8 rounded-full flex items-center justify-center bg-purple-700 dark:bg-purple-400 text-white dark:text-gray-900 hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0">
                                    <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                chatMessages.appendChild(aiMsg);

                if (isLastInHistory) {
                    // Set up event listeners for this historical chat input box
                    setTimeout(() => {
                        const subInput = document.getElementById(`input-${subChatId}`);
                        const subSend = document.getElementById(`send-${subChatId}`);
                        const subAttach = document.getElementById(`attach-${subChatId}`);
                        const subUploader = document.getElementById(`uploader-${subChatId}`);
                        const subBadge = document.getElementById(`badge-${subChatId}`);
                        let subAttachedFile = null;

                        if (subAttach && subUploader) {
                            subAttach.addEventListener("click", () => subUploader.click());
                            subUploader.addEventListener("change", (e) => {
                                if (e.target.files.length > 0) {
                                    subAttachedFile = e.target.files[0];
                                    subBadge.innerHTML = `
                                        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[10px] font-medium">
                                            ${escapeHtml(subAttachedFile.name)}
                                            <button id="remove-${subChatId}" class="ml-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 font-bold">×</button>
                                        </div>
                                    `;
                                    subBadge.classList.remove("hidden");
                                    document.getElementById(`remove-${subChatId}`).addEventListener("click", () => {
                                        subAttachedFile = null;
                                        subBadge.classList.add("hidden");
                                        subBadge.innerHTML = "";
                                        subUploader.value = "";
                                    });
                                }
                            });
                        }

                        const triggerSubSend = () => {
                            const val = subInput.value.trim();
                            if (!val && !subAttachedFile) return;
                            subInput.closest('.w-full').classList.add('hidden');
                            handleSend(val, subAttachedFile, subBadge, subUploader);
                        };

                        if (subSend && subInput) {
                            subSend.addEventListener("click", triggerSubSend);
                            subInput.addEventListener("keydown", (e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    triggerSubSend();
                                }
                            });
                        }
                    }, 50);
                }
            }

            function renderChatHistory() {
                if (!chatMessages) return;
                
                chatMessages.innerHTML = "";
                if (chatHistory.length === 0) {
                    if (emptyState) emptyState.classList.remove("hidden");
                    chatMessages.classList.add("hidden");
                    return;
                }

                if (emptyState) emptyState.classList.add("hidden");
                chatMessages.classList.remove("hidden");

                chatHistory.forEach((msg, idx) => {
                    if (msg.role === 'user') {
                        appendUserMessage(msg.content, null);
                    } else if (msg.role === 'model') {
                        const isLast = idx === chatHistory.length - 1;
                        appendStaticAIMessage(msg.content, isLast);
                    }
                });
            }

            async function createNewChatSession() {
                activeChatId = null;
                chatHistory = [];
                renderChatHistory();
                renderChatsList();
                if (textarea) {
                    textarea.value = "";
                    textarea.focus();
                }
            }

            async function deleteChatSession(chatId) {
                if (!confirm("Tem certeza que deseja excluir esta conversa?")) return;
                
                const { error } = await supabase
                    .from('chats')
                    .delete()
                    .eq('id', chatId);
                if (error) {
                    showToast("Erro ao excluir conversa.");
                    return;
                }
                showToast("Conversa excluída.");
                if (activeChatId === chatId) {
                    activeChatId = null;
                    chatHistory = [];
                    renderChatHistory();
                }
                await loadChatsList();
            }

            // Setup new conversation button listener
            setTimeout(() => {
                const btnNewChat = document.getElementById("btn-new-chat");
                if (btnNewChat) {
                    btnNewChat.addEventListener("click", () => {
                        const plan = localStorage.getItem("user_plan") || "Free";
                        if (plan.toLowerCase() === 'free' && chatsList.length >= 3) {
                            showUpgradeModal();
                        } else {
                            createNewChatSession();
                        }
                    });
                }
            }, 100);

            function getAmoraResponse(prompt) {
                const cleaned = prompt.toLowerCase();
                if (cleaned.includes("proteina") || cleaned.includes("proteína")) {
                    return `Para otimizar a síntese proteica, o ideal é focar em fontes de proteínas ricas em **leucina** (como ovos, peito de frango, whey protein, tofu e leguminosas) combinadas com carboidratos de absorção moderada para estimular a insulina. \n\nO ideal é fracionar o consumo em porções de **20g a 40g** a cada 3 a 4 horas! 🍳`;
                } else if (cleaned.includes("jejum")) {
                    return `O **jejum intermitente** pode auxiliar na autofagia celular, controle da glicemia e flexibilidade metabólica. \n\nMetabolicamente, é ideal garantir o consumo calórico adequado na janela de alimentação. Lembre-se: jejum não substitui qualidade alimentar! ⏳`;
                } else if (cleaned.includes("dieta") || cleaned.includes("nutrição") || cleaned.includes("nutricao")) {
                    return `A nutrição inteligente foca em densidade de nutrientes: alimentos in natura, fibras vegetais, gorduras de alta qualidade (como abacate, nozes e azeite) e hidratação constante. \n\nO equilíbrio metabólico começa quando entendemos que cada corpo responde de forma única! 🥑`;
                } else {
                    return `Esta é uma excelente pergunta sobre nutrição de precisão! Na Amora, defendemos que cada detalhe na sua rotina alimentar conta. \n\nPara dar uma resposta personalizada baseada em bio-disponibilidade celular, você poderia me contar um pouco mais sobre o seu objetivo principal (hipertrofia, emagrecimento, foco cognitivo)? 🌟`;
                }
            }

            function appendUserMessage(content, file) {
                const userMsg = document.createElement("div");
                userMsg.className = "flex items-start gap-3 sm:gap-4 justify-end w-full min-w-0";

                let fileBadgeHtml = "";
                if (file) {
                    fileBadgeHtml = `
                <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 text-[11px] font-medium max-w-max">
                    <svg fill="none" height="12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/></svg>
                    <span>Anexo: ${escapeHtml(file.name)}</span>
                </div>
            `;
                }

                const avatar = localStorage.getItem("user_avatar") || "https://lh3.googleusercontent.com/aida-public/AB6AXuAcb76zVeNvWaW40zTrrzkpQaBZk6qO6Ey0TkOxy1dhyMk9RBKW9bfdiBqVBZ9VS6G4WcBMgYEFYIrnkeUnQwOaxt7-HKeEejqnbqXUzKbbkkQa7SCwWXi3pS0YpdM0DTjhXMfUVyx0fDpTCSOvBEyQ6njAST3EHllrte0fBE_AYuRhSnhuLnX0kCwON0rBKXdbnv13Iv_Fj-skyZyQbPwFOicwLJBOjFzyWe-_ZcH4zBzGcDMha6gP_xFqo7YxRpPWvc4uHqEi_tbx";
                let avatarHtml = "";
                if (avatar.startsWith("INITIALS:")) {
                    const initials = avatar.split(":")[1];
                    avatarHtml = `<div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-700 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-purple-200 dark:border-purple-800 select-none">${escapeHtml(initials)}</div>`;
                } else {
                    avatarHtml = `
                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 shadow-sm border border-purple-200 dark:border-purple-800">
                    <img class="w-full h-full object-cover" src="${escapeHtml(avatar)}" alt="Avatar"/>
                </div>
            `;
                }

                const msgId = 'user-msg-' + Math.random().toString(36).substring(2, 9);
                const textStr = String(content ?? '');
                const isLargePrompt = textStr.length > 380 || (textStr.match(/\n/g) || []).length > 5;

                let bodyHtml = "";
                if (isLargePrompt) {
                    bodyHtml = `
                        <div class="relative min-w-0">
                            <div id="content-${msgId}" class="max-h-44 sm:max-h-48 overflow-hidden transition-[max-height] duration-300 ease-in-out whitespace-pre-wrap select-text break-words [overflow-wrap:anywhere] leading-relaxed text-sm">${escapeHtml(textStr)}</div>
                            <div id="fade-${msgId}" class="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-purple-700 dark:from-purple-800 to-transparent pointer-events-none rounded-b-[18px]"></div>
                        </div>
                        <button type="button" id="toggle-${msgId}" class="mt-2.5 pt-2 border-t border-purple-400/30 text-xs font-medium text-purple-100 hover:text-white flex items-center justify-between gap-3 transition-colors cursor-pointer select-none w-full">
                            <span id="label-${msgId}" class="flex items-center gap-1.5 font-medium">
                                <svg class="w-3.5 h-3.5 opacity-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                <span>Ver prompt completo</span>
                            </span>
                            <span class="text-[11px] opacity-75 bg-purple-900/50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full font-mono">${textStr.length} caracteres</span>
                        </button>
                    `;
                } else {
                    bodyHtml = `
                        <div class="whitespace-pre-wrap select-text break-words [overflow-wrap:anywhere] leading-relaxed text-sm">${escapeHtml(textStr)}</div>
                    `;
                }

                userMsg.innerHTML = `
                    <div class="flex flex-col items-end max-w-[85%] sm:max-w-[78%] min-w-0 w-fit">
                        <div class="bg-purple-700 dark:bg-purple-800 text-white rounded-[20px] rounded-tr-[4px] px-5 py-3.5 shadow-sm font-normal break-words [overflow-wrap:anywhere] min-w-0 w-fit max-w-full">
                            ${bodyHtml}
                        </div>
                        ${fileBadgeHtml}
                    </div>
                    ${avatarHtml}
                `;

                chatMessages.appendChild(userMsg);

                if (isLargePrompt) {
                    const toggleBtn = userMsg.querySelector(`#toggle-${msgId}`);
                    const contentEl = userMsg.querySelector(`#content-${msgId}`);
                    const fadeEl = userMsg.querySelector(`#fade-${msgId}`);
                    const labelEl = userMsg.querySelector(`#label-${msgId}`);
                    let expanded = false;

                    if (toggleBtn && contentEl && fadeEl && labelEl) {
                        toggleBtn.addEventListener("click", () => {
                            expanded = !expanded;
                            if (expanded) {
                                contentEl.classList.remove("max-h-44", "sm:max-h-48", "overflow-hidden");
                                contentEl.classList.add("max-h-none");
                                fadeEl.classList.add("hidden");
                                labelEl.innerHTML = `
                                    <svg class="w-3.5 h-3.5 opacity-90 rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    <span>Ver menos</span>
                                `;
                            } else {
                                contentEl.classList.add("max-h-44", "sm:max-h-48", "overflow-hidden");
                                contentEl.classList.remove("max-h-none");
                                fadeEl.classList.remove("hidden");
                                labelEl.innerHTML = `
                                    <svg class="w-3.5 h-3.5 opacity-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    <span>Ver prompt completo</span>
                                `;
                                userMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                        });
                    }
                }

                userMsg.scrollIntoView({ behavior: "smooth" });
            }



            function appendAIMessageWithTyping(responseText) {
                const aiMsg = document.createElement("div");
                aiMsg.className = "flex items-start gap-3 sm:gap-4 w-full min-w-0";

                const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                aiMsg.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                <img class="w-full h-full object-contain" src="${logoSrc}"/>
            </div>
            <div class="flex-1 min-w-0 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-[20px] rounded-tl-[4px] p-5 text-sm leading-relaxed shadow-sm font-light text-gray-800 dark:text-gray-200 space-y-4 break-words [overflow-wrap:anywhere]">
                <!-- Typing container -->
                <p class="typing-text-block"></p>
            </div>
        `;

                chatMessages.appendChild(aiMsg);
                aiMsg.scrollIntoView({ behavior: "smooth" });

                const textBlock = aiMsg.querySelector(".typing-text-block");
                let currentText = "";
                let textIndex = 0;

                const typingTimer = setInterval(() => {
                    if (textIndex < responseText.length) {
                        const char = responseText[textIndex];
                        if (char === "\n") {
                            currentText += "<br/>";
                        } else {
                            currentText += escapeHtml(char);
                        }
                        textBlock.innerHTML = currentText;
                        textIndex++;
                    } else {
                        clearInterval(typingTimer);
                        // Convert simple Markdown markers into HTML styling
                        let styled = textBlock.innerHTML;
                        styled = styled.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-700 dark:text-purple-400">$1</strong>');
                        textBlock.innerHTML = styled;
                    }
                }, 15);
            }

            function appendThinkingIndicator() {
                const thinkingMsg = document.createElement("div");
                thinkingMsg.id = "thinking-indicator";
                thinkingMsg.className = "flex items-start gap-3 sm:gap-4 w-full min-w-0";

                const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                thinkingMsg.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                <img class="w-full h-full object-contain" src="${logoSrc}"/>
            </div>
            <div class="flex items-center gap-1.5 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-full px-5 py-3 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0ms"></span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms"></span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 300ms"></span>
            </div>
        `;
                chatMessages.appendChild(thinkingMsg);
                thinkingMsg.scrollIntoView({ behavior: "smooth" });
            }



            // Function to handle send actions from either the main chat box or the response-nested chat inputs
            async function handleSend(customText = null, customFile = null, customBadgeContainer = null, customFileUploader = null) {
                const text = customText !== null ? customText.trim() : textarea.value.trim();
                const currentAttachedFile = customFile !== null ? customFile : attachedFile;
                
                if (!text && !currentAttachedFile) return;

                // Check saved chats limit for Free plan (max 3 chats)
                if (!activeChatId && currentUser) {
                    const plan = localStorage.getItem("user_plan") || "Free";
                    if (plan.toLowerCase() === 'free' && chatsList.length >= 3) {
                        showUpgradeModal();
                        return;
                    }
                }

                if (emptyState) emptyState.classList.add("hidden");
                chatMessages.classList.remove("hidden");

                appendUserMessage(text || "Arquivo enviado", currentAttachedFile);

                // Reset inputs
                if (customText !== null) {
                    // It's a nested input, we don't clear the main one
                } else {
                    textarea.value = "";
                    textarea.style.height = "";
                    attachedFile = null;
                    badgeContainer.classList.add("hidden");
                    badgeContainer.innerHTML = "";
                    fileUploader.value = "";
                }

                let inlineData = null;
                if (currentAttachedFile) {
                    const reader = new FileReader();
                    reader.readAsDataURL(currentAttachedFile);
                    await new Promise(resolve => {
                        reader.onload = () => {
                            const base64data = reader.result.split(',')[1];
                            inlineData = {
                                data: base64data,
                                mimeType: currentAttachedFile.type || "application/octet-stream"
                            };
                            resolve(null);
                        };
                        reader.onerror = () => resolve(null);
                    });
                }

                const newMessage = { role: 'user', content: text || (currentAttachedFile ? `[Arquivo Anexado: ${currentAttachedFile.name}]` : "") };
                if (inlineData) {
                    newMessage.inlineData = inlineData;
                }
                chatHistory.push(newMessage);

                // Create a session in Supabase if no active chat session is set
                if (!activeChatId && currentUser) {
                    try {
                        const title = text.length > 25 ? text.substring(0, 25) + "..." : (text || "Nova conversa");
                        const { data: newSession, error: createErr } = await supabase
                            .from('chats')
                            .insert({
                                user_id: currentUser.id,
                                title: title,
                                messages: messagesForStorage()
                            })
                            .select()
                            .single();
                        if (createErr) throw createErr;
                        activeChatId = newSession.id;
                        await loadChatsList();
                    } catch (e) {
                        console.error("Error creating new chat session:", e);
                    }
                } else if (activeChatId) {
                    // Update messages in the existing session
                    await supabase
                        .from('chats')
                        .update({ messages: messagesForStorage() })
                        .eq('id', activeChatId);
                }

                appendThinkingIndicator();

                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token || "";

                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ messages: messagesForModel() })
                    });

                    const indicator = document.getElementById("thinking-indicator");
                    if (indicator) indicator.remove();

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || "Erro na API de Chat");
                    }

                    const reader = res.body.getReader();
                    const decoder = new TextDecoder("utf-8");

                    const aiMsg = document.createElement("div");
                    aiMsg.className = "flex items-start gap-3 sm:gap-4 w-full min-w-0";
                    const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                    // Generate a unique ID for the sub-chat input
                    const subChatId = 'sub-chat-' + Date.now();

                    aiMsg.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                    <img class="w-full h-full object-contain" src="${logoSrc}"/>
                </div>
                <div class="flex-grow min-w-0 flex flex-col gap-4">
                    <div class="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-[20px] rounded-tl-[4px] p-5 text-sm leading-relaxed shadow-sm font-light text-gray-800 dark:text-gray-200 space-y-4 break-words [overflow-wrap:anywhere] min-w-0">
                        <p class="typing-text-block"></p>
                    </div>
                    
                    <!-- Sub-chat box under the response -->
                    <div class="w-full bg-white dark:bg-[#18181B] rounded-[16px] border border-gray-200 dark:border-[#27272A] shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-1 focus-within:ring-purple-700 dark:focus-within:ring-purple-400 focus-within:border-purple-700 dark:focus-within:border-purple-400 relative">
                        <input type="file" id="uploader-${subChatId}" class="hidden" accept="image/*,application/pdf" />
                        <div id="badge-${subChatId}" class="px-4 pt-3 hidden flex flex-wrap gap-2"></div>
                        <div class="flex items-center px-4 py-2 gap-2">
                            <input type="text" id="input-${subChatId}" class="flex-1 bg-transparent border-none p-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 font-light" placeholder="Responder à Amora..." />
                            <button id="attach-${subChatId}" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer" title="Anexar arquivo">
                                <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                            </button>
                            <button id="send-${subChatId}" class="w-8 h-8 rounded-full flex items-center justify-center bg-purple-700 dark:bg-purple-400 text-white dark:text-gray-900 hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0">
                                <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
                    chatMessages.appendChild(aiMsg);
                    aiMsg.scrollIntoView({ behavior: "smooth" });
                    const textBlock = aiMsg.querySelector(".typing-text-block");
                    let fullResponse = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunkText = decoder.decode(value, { stream: true });
                        fullResponse += chunkText;

                        let styled = escapeHtml(fullResponse).replace(/\n/g, '<br/>');
                        styled = styled.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-700 dark:text-purple-400">$1</strong>');
                        textBlock.innerHTML = styled;
                        aiMsg.scrollIntoView({ behavior: "smooth" });
                    }

                    chatHistory.push({ role: 'model', content: fullResponse });
                    
                    if (activeChatId) {
                        await supabase
                            .from('chats')
                            .update({ messages: messagesForStorage() })
                            .eq('id', activeChatId);
                    }

                    // Attach logic to the sub-chat inputs dynamically
                    const subInput = document.getElementById(`input-${subChatId}`);
                    const subSend = document.getElementById(`send-${subChatId}`);
                    const subAttach = document.getElementById(`attach-${subChatId}`);
                    const subUploader = document.getElementById(`uploader-${subChatId}`);
                    const subBadge = document.getElementById(`badge-${subChatId}`);
                    let subAttachedFile = null;

                    if (subAttach && subUploader) {
                        subAttach.addEventListener("click", () => subUploader.click());
                        subUploader.addEventListener("change", (e) => {
                            if (e.target.files.length > 0) {
                                subAttachedFile = e.target.files[0];
                                subBadge.innerHTML = `
                                    <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[10px] font-medium">
                                        ${escapeHtml(subAttachedFile.name)}
                                        <button id="remove-${subChatId}" class="ml-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 font-bold">×</button>
                                    </div>
                                `;
                                subBadge.classList.remove("hidden");
                                document.getElementById(`remove-${subChatId}`).addEventListener("click", () => {
                                    subAttachedFile = null;
                                    subBadge.classList.add("hidden");
                                    subBadge.innerHTML = "";
                                    subUploader.value = "";
                                });
                            }
                        });
                    }

                    const triggerSubSend = () => {
                        const val = subInput.value.trim();
                        if (!val && !subAttachedFile) return;
                        
                        // Hide this sub-chat box since we are submitting
                        subInput.closest('.w-full').classList.add('hidden');
                        
                        handleSend(val, subAttachedFile, subBadge, subUploader);
                    };

                    if (subSend && subInput) {
                        subSend.addEventListener("click", triggerSubSend);
                        subInput.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                triggerSubSend();
                            }
                        });
                    }

                } catch (error) {
                    const indicator = document.getElementById("thinking-indicator");
                    if (indicator) indicator.remove();
                    showToast(error.message || "Erro ao contatar a Amora. Tente novamente.");
                    console.error(error);
                }
            }

            if (btnSend && textarea) {
                btnSend.addEventListener("click", () => handleSend());

                const adjustTextareaHeight = () => {
                    textarea.style.height = "auto";
                    const newH = Math.min(Math.max(textarea.scrollHeight, 128), 280);
                    textarea.style.height = newH + "px";
                };
                textarea.addEventListener("input", adjustTextareaHeight);

                textarea.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                });
            }

            // Load profile
            async function loadUserProfile() {
                let name = localStorage.getItem("user_name") || "Carregando...";
                let email = localStorage.getItem("user_email") || "";
                let avatar = localStorage.getItem("user_avatar") || "";
                let plan = localStorage.getItem("user_plan") || "Free";

                const sidebarNameEl = document.getElementById("sidebar-name");
                const sidebarEmailEl = document.getElementById("sidebar-email");
                const sidebarAvatarEl = document.getElementById("sidebar-avatar");
                const sidebarPlanBadge = document.getElementById("sidebar-plan-badge");
                const sidebarWorkspaceTitle = document.getElementById("sidebar-workspace-title");
                const sidebarWorkspaceSubtitle = document.getElementById("sidebar-workspace-subtitle");

                function renderProfile(n, e, a, p) {
                    if (sidebarNameEl) sidebarNameEl.innerText = n;
                    if (sidebarEmailEl) sidebarEmailEl.innerText = e;
                    
                    if (sidebarWorkspaceTitle) sidebarWorkspaceTitle.innerText = n.split(' ')[0] + "'s Works...";
                    if (sidebarWorkspaceSubtitle) sidebarWorkspaceSubtitle.innerText = "personal-" + n.toLowerCase().replace(/[^a-z0-9]/g, '-') + "-DM...";

                    if (sidebarAvatarEl) {
                        if (a.startsWith("INITIALS:")) {
                            const initials = a.split(":")[1];
                            sidebarAvatarEl.style.display = "none";
                            let initialsPlaceholder = document.getElementById("sidebar-avatar-initials");
                            if (!initialsPlaceholder) {
                                initialsPlaceholder = document.createElement("div");
                                initialsPlaceholder.id = "sidebar-avatar-initials";
                                initialsPlaceholder.className = "w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-750 to-pink-500 text-white font-bold text-xs";
                                sidebarAvatarEl.parentNode.appendChild(initialsPlaceholder);
                            }
                            initialsPlaceholder.innerText = initials;
                            initialsPlaceholder.style.display = "flex";
                        } else {
                            sidebarAvatarEl.src = a;
                            sidebarAvatarEl.style.display = "block";
                            const initialsPlaceholder = document.getElementById("sidebar-avatar-initials");
                            if (initialsPlaceholder) initialsPlaceholder.style.display = "none";
                        }
                    }

                    if (sidebarPlanBadge) {
                        if (p === "admin" || p === "Admin" || p === "ADM") {
                            sidebarPlanBadge.innerText = "ADM";
                            sidebarPlanBadge.className = 'inline-block px-2.5 py-1 rounded bg-amber-500 text-black font-label-sm text-xs shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-400 font-bold uppercase tracking-wider animate-pulse';
                        } else if (p === "ultra" || p === "Ultra") {
                            sidebarPlanBadge.innerText = "Ultra Plan";
                            sidebarPlanBadge.className = 'inline-block px-2 py-1 rounded bg-blue-600 text-white font-label-sm text-xs shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400 dark:border-blue-500';
                        } else if (p === "Premium" || p === "premium") {
                            sidebarPlanBadge.innerText = "Premium Plan";
                            sidebarPlanBadge.className = 'inline-block px-2 py-1 rounded bg-purple-600 text-white font-label-sm text-xs shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400 dark:border-purple-500';
                        } else {
                            sidebarPlanBadge.innerText = "Free Plan";
                            sidebarPlanBadge.className = 'inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs';
                        }
                    }
                }

                // Render cached data immediately
                if (localStorage.getItem("user_name")) {
                    renderProfile(name, email, avatar, plan);
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

                        const { data: usageData } = await supabase
                            .from('user_usage')
                            .select('plan')
                            .eq('user_id', user.id)
                            .single();
                        if (usageData && usageData.plan) {
                            plan = usageData.plan;
                            localStorage.setItem("user_plan", plan);
                        }

                        renderProfile(name, email, avatar, plan);
                    }
                } catch (e) {
                    console.error("Error loading user plan/profile from database:", e);
                }
            }
            
            // Função de Sign Out global
            window.handleSignOut = function() {
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                localStorage.removeItem("user_avatar");
                window.location.href = "/login";
            };

            function showUpgradeModal() {
                let modal = document.getElementById("upgrade-modal");
                if (modal) {
                    modal.classList.remove("hidden", "opacity-0");
                    modal.classList.add("opacity-100");
                    modal.querySelector("div").classList.remove("scale-95");
                    return;
                }

                modal = document.createElement("div");
                modal.id = "upgrade-modal";
                modal.className = "fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 opacity-0";
                
                modal.innerHTML = `
                    <div class="bg-white dark:bg-[#18181B] rounded-[24px] border border-gray-200 dark:border-[#27272A] shadow-2xl p-8 max-w-md w-full relative overflow-hidden transform scale-95 transition-transform duration-300">
                        <div class="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <!-- Close button -->
                        <button id="close-upgrade-modal" class="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        
                        <!-- Icon -->
                        <div class="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-6 shadow-sm">
                            <span class="material-symbols-outlined text-3xl animate-bounce">workspace_premium</span>
                        </div>
                        
                        <!-- Title & Subtitle -->
                        <h3 class="font-display font-extrabold text-2xl text-gray-900 dark:text-white mb-2 leading-tight">
                            Limite de Chats Atingido
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 font-light leading-relaxed">
                            No <span class="font-semibold text-purple-700 dark:text-purple-400">Plano Gratuito</span>, você pode salvar até 3 chats simultâneos. Faça o upgrade agora para ter conversas ilimitadas e recursos avançados de IA!
                        </p>
                        
                        <!-- Benefits list -->
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-purple-700 dark:text-purple-400 text-sm">check_circle</span>
                                <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">Conversas salvas ilimitadas</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-purple-700 dark:text-purple-400 text-sm">check_circle</span>
                                <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">Suporte prioritário e maior limite de IA</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-purple-700 dark:text-purple-400 text-sm">check_circle</span>
                                <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">Acesso a todos os recursos profissionais</span>
                            </li>
                        </ul>
                        
                        <!-- CTA buttons -->
                        <div class="flex flex-col gap-3">
                            <button id="modal-btn-upgrade" class="w-full bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-400 dark:text-gray-900 dark:hover:bg-purple-500 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2">
                                <span>Fazer Upgrade para Premium</span>
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                            <button id="modal-btn-close" class="w-full py-3 text-center text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                Continuar no plano básico
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Animate entrance
                requestAnimationFrame(() => {
                    modal.classList.remove("opacity-0");
                    modal.querySelector("div").classList.remove("scale-95");
                });
                
                // Event Listeners
                const closeModal = () => {
                    modal.classList.add("opacity-0");
                    modal.querySelector("div").classList.add("scale-95");
                    setTimeout(() => modal.classList.add("hidden"), 300);
                };
                
                document.getElementById("close-upgrade-modal").addEventListener("click", closeModal);
                document.getElementById("modal-btn-close").addEventListener("click", closeModal);
                
                document.getElementById("modal-btn-upgrade").addEventListener("click", () => {
                    closeModal();
                    window.location.href = "/configuracao?tab=cobranca";
                });
            }

            window.showUpgradeModal = showUpgradeModal;

            // Call on load
            loadUserProfile();

        } catch (e) {
            console.error(e);
        }
    }, [authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0A0B]">
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin"></div>
            </div>
        );
    }

    return (
        <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white" dangerouslySetInnerHTML={{
            __html: `

<!-- Mobile Overlay (hidden by default) -->
<div id="mobile-sidebar-overlay" class="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 hidden md:hidden transition-opacity duration-300 opacity-0"></div>

<!-- SideNavBar Component -->
<nav id="sidebar-nav"
    class="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
    <a href="/home" class="px-6 py-4 mb-4 flex items-center justify-center cursor-pointer decoration-none">
        <img src="/logo-horizontal.svg" alt="Amora Logo" class="w-32 h-auto object-contain dark:invert" />
    </a>

    <!-- Navigation Links -->
    <div class="flex-1 overflow-y-auto px-2 space-y-6">
        <!-- Section 1 -->
        <div>
            <p class="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                Aprender</p>
            <div class="space-y-1">
                <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors"
                    href="/home">
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
                <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/pacientes">
                    <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span class="font-label-md text-sm">Pacientes</span>
                </a>
            </div>
        </div>
        
        <!-- Section 2: Conversas -->
        <div class="border-t border-gray-100 dark:border-gray-800/40 pt-4">
            <div class="flex items-center justify-between px-4 mb-2">
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Conversas</p>
                <button id="btn-new-chat" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer" title="Nova Conversa">
                    <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" x2="12" y1="5" y2="19"></line>
                        <line x1="5" x2="19" y1="12" y2="12"></line>
                    </svg>
                </button>
            </div>
            <div id="sidebar-chats-list" class="space-y-1 max-h-48 overflow-y-auto pr-1">
                <!-- Chats will be injected dynamically here -->
            </div>
        </div>

        <!-- Section 3 -->
        <div>
            <p class="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                Ajustes</p>
            <div class="space-y-1">
                <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
    <div class="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02]" style="background-image: radial-gradient(var(--tw-colors-purple-500) 1px, transparent 1px); background-size: 24px 24px;"></div>
    
    <div class="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-8 pt-20 sm:pt-24 pb-12 relative z-10 flex flex-col min-w-0">
        <!-- Header Section -->
        <div class="flex flex-col items-center text-center mb-16">
            <a class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors mb-8 shadow-sm border border-purple-200 dark:border-purple-800/50" href="#">
                Aprenda nutrição com a Amora.
                <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </a>
            <div class="flex items-center justify-center gap-4">
                <div class="w-auto h-12 flex items-center justify-center">
                    <img id="main-logo" alt="Amora Wordmark" class="h-full w-auto object-contain" src=""/>
                </div>
                <h1 class="font-display text-4xl text-gray-900 dark:text-white tracking-tight">O que você vai aprender hoje?</h1>
            </div>
        </div>
        
        <!-- Central Prompt Box -->
        <div class="w-full bg-white dark:bg-[#18181B] rounded-[24px] border border-gray-200 dark:border-[#27272A] shadow-sm mb-12 overflow-hidden transition-all duration-300 focus-within:ring-1 focus-within:ring-purple-700 dark:focus-within:ring-purple-400 focus-within:border-purple-700 dark:focus-within:border-purple-400 relative">
            <!-- Hidden input for file upload -->
            <input type="file" id="file-uploader" class="hidden" accept="image/*,application/pdf" />
            
            <div id="upload-badge-container" class="px-6 pt-4 hidden flex flex-wrap gap-2">
                <!-- Badges injected here -->
            </div>
            <textarea id="prompt-textarea" class="w-full h-32 bg-transparent border-none resize-none p-6 text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 font-light" placeholder="Escreva sua dúvida sobre nutrição ou saúde..."></textarea>
            <div class="px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-[#27272A]/50 bg-gray-50/50 dark:bg-[#18181B]/50">
                <div class="flex items-center gap-3">
                    <button id="btn-attach" class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-[#27272A] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 text-gray-600 dark:text-gray-400 text-sm font-medium">
                        <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        Anexar
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <button id="btn-mic" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 border border-gray-200 dark:border-[#27272A]">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                    </button>
                    <button id="btn-send" class="w-10 h-10 rounded-full flex items-center justify-center bg-purple-700 dark:bg-purple-400 text-white dark:text-gray-900 hover:opacity-90 transition-all active:scale-95 shadow-sm">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>
                    </button>
                </div>
            </div>
        </div>
        

        
        <!-- Empty State & Chat Area -->
        <div id="dynamic-content-area" class="flex-1 flex flex-col justify-center min-w-0 w-full">
            <div id="chat-messages" class="hidden space-y-6 w-full min-w-0 text-left pb-16">
                <!-- Chat messages will be injected here -->
            </div>
        </div>
    </div>
</main>


` }} />
    );
}
