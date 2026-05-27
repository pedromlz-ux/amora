
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabaseClient';

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

            // Interactive button scales / clicks
            document.querySelectorAll("button, a").forEach(btn => {
                btn.addEventListener("mousedown", () => btn.classList.add("scale-95"));
                btn.addEventListener("mouseup", () => btn.classList.remove("scale-95"));
                btn.addEventListener("mouseleave", () => btn.classList.remove("scale-95"));
            });

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
                        ${attachedFile.name} (${Math.round(attachedFile.size / 1024)} KB)
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

            if (typeof window !== "undefined") {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.lang = 'pt-BR';
                    recognition.interimResults = false;

                    recognition.onstart = () => {
                        isRecording = true;
                        btnMic.classList.add("bg-red-50", "dark:bg-red-950/20", "text-red-650", "dark:text-red-400", "border-red-500/50", "animate-pulse");
                        textarea.placeholder = "Ouvindo... 🎙️ Fale sua dúvida sobre nutrição.";
                        showToast("Microfone ativado! Fale agora 🎙️");
                    };

                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript;
                        textarea.value += (textarea.value ? " " : "") + transcript;
                        showToast("Voz transcrita com sucesso! ✨");
                    };

                    recognition.onerror = (event) => {
                        showToast("Erro ao reconhecer voz. Tente novamente.");
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
                        recognition.start();
                    }
                });
            }

            // Send Simulated Chat & AI Response Flow
            const btnSend = document.getElementById("btn-send");
            const btnClearChat = document.getElementById("btn-clear-chat");
            const emptyState = document.getElementById("empty-state");
            const chatMessages = document.getElementById("chat-messages");
            let chatHistory = [];

            if (btnClearChat) {
                btnClearChat.addEventListener("click", () => {
                    const email = localStorage.getItem("user_email") || "guest";
                    localStorage.removeItem(`amora_chat_history_${email}`);
                    chatHistory = [];
                    if (chatMessages) {
                        chatMessages.innerHTML = "";
                        chatMessages.classList.add("hidden");
                    }
                    if (emptyState) {
                        emptyState.classList.remove("hidden");
                    }
                    showToast("Histórico de conversa limpo.");
                });
            }

            function getAmoraResponse(prompt) {
                const cleaned = prompt.toLowerCase();
                if (cleaned.includes("proteina") || cleaned.includes("proteína")) {
                    return `Para otimizar a síntese proteica, o ideal é focar em fontes de proteínas ricas em **leucina** (como ovos, peito de frango, whey protein, tofu e leguminosas) combinadas com carboidratos de absorção moderada para estimular a insulina. \n\nO ideal é fracionar o consumo em porções de **20g a 40g** a cada 3 a 4 horas! 🍳`;
                } else if (cleaned.includes("jejum")) {
                    return `O **jejum intermitente** pode auxiliar na autofagia celular, controle da glicemia e flexibilidade metabólica. \n\nNo entanto, o mais importante é garantir que, durante a janela de alimentação, você consuma a quantidade adequada de macronutrientes e calorias. Lembre-se: jejum não substitui uma alimentação equilibrada! ⏳`;
                } else if (cleaned.includes("dieta") || cleaned.includes("nutrição") || cleaned.includes("nutricao")) {
                    return `A nutrição inteligente foca em densidade de nutrientes: alimentos in natura, fibras vegetais, gorduras de alta qualidade (como abacate, nozes e azeite) e hidratação constante. \n\nO equilíbrio metabólico começa quando entendemos que cada corpo responde de forma única aos alimentos! 🥑`;
                } else {
                    return `Esta é uma excelente pergunta sobre nutrição de precisão! Na Amora, defendemos que cada detalhe na sua rotina alimentar conta. \n\nPara dar uma resposta personalizada baseada em bio-disponibilidade celular, você poderia me contar um pouco mais sobre o seu objetivo principal (hipertrofia, emagrecimento, foco cognitivo)? 🌟`;
                }
            }

            function appendUserMessage(content, file) {
                const userMsg = document.createElement("div");
                userMsg.className = "flex items-start gap-4 justify-end";

                let fileBadgeHtml = "";
                if (file) {
                    fileBadgeHtml = `
                <div class="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 text-[11px] font-medium max-w-max">
                    <svg fill="none" height="12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/></svg>
                    Anexo: ${file.name}
                </div>
            `;
                }

                const avatar = localStorage.getItem("user_avatar") || "https://lh3.googleusercontent.com/aida-public/AB6AXuAcb76zVeNvWaW40zTrrzkpQaBZk6qO6Ey0TkOxy1dhyMk9RBKW9bfdiBqVBZ9VS6G4WcBMgYEFYIrnkeUnQwOaxt7-HKeEejqnbqXUzKbbkkQa7SCwWXi3pS0YpdM0DTjhXMfUVyx0fDpTCSOvBEyQ6njAST3EHllrte0fBE_AYuRhSnhuLnX0kCwON0rBKXdbnv13Iv_Fj-skyZyQbPwFOicwLJBOjFzyWe-_ZcH4zBzGcDMha6gP_xFqo7YxRpPWvc4uHqEi_tbx";
                let avatarHtml = "";
                if (avatar.startsWith("INITIALS:")) {
                    const initials = avatar.split(":")[1];
                    avatarHtml = `<div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-700 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-purple-200 dark:border-purple-800">${initials}</div>`;
                } else {
                    avatarHtml = `
                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 shadow-sm border border-purple-200 dark:border-purple-800">
                    <img class="w-full h-full object-cover" src="${avatar}"/>
                </div>
            `;
                }

                userMsg.innerHTML = `
            <div class="flex flex-col items-end max-w-[80%]">
                <div class="bg-purple-700 dark:bg-purple-400 text-white dark:text-gray-900 rounded-[20px] rounded-tr-[4px] px-5 py-3 text-sm leading-relaxed shadow-sm font-light">
                    ${content}
                </div>
                ${fileBadgeHtml}
            </div>
            ${avatarHtml}
        `;
                chatMessages.appendChild(userMsg);
                userMsg.scrollIntoView({ behavior: "smooth" });
            }

            function appendAIMessageWithTyping(responseText) {
                const aiMsg = document.createElement("div");
                aiMsg.className = "flex items-start gap-4";

                const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                aiMsg.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                <img class="w-full h-full object-contain" src="${logoSrc}"/>
            </div>
            <div class="flex-1 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-[20px] rounded-tl-[4px] p-5 text-sm leading-relaxed shadow-sm font-light text-gray-800 dark:text-gray-200 space-y-4">
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
                            currentText += char;
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
                thinkingMsg.className = "flex items-start gap-4";

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

            async function handleSend() {
                const text = textarea.value.trim();
                if (!text && !attachedFile) return;

                if (emptyState) emptyState.classList.add("hidden");
                chatMessages.classList.remove("hidden");

                const currentAttachedFile = attachedFile;
                const msgContent = text || (currentAttachedFile ? `[Arquivo Anexado: ${currentAttachedFile.name}]` : "");
                appendUserMessage(text || "Arquivo enviado", currentAttachedFile);

                textarea.value = "";
                attachedFile = null;
                badgeContainer.classList.add("hidden");
                badgeContainer.innerHTML = "";
                fileUploader.value = "";

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

                const newMessage = { role: 'user', content: msgContent };
                if (inlineData) {
                    newMessage.inlineData = inlineData;
                }
                chatHistory.push(newMessage);
                saveChatHistory();

                appendThinkingIndicator();

                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: chatHistory })
                    });

                    const indicator = document.getElementById("thinking-indicator");
                    if (indicator) indicator.remove();

                    if (!res.ok) throw new Error("Erro na API de Chat");

                    const reader = res.body.getReader();
                    const decoder = new TextDecoder("utf-8");

                    const aiMsg = document.createElement("div");
                    aiMsg.className = "flex items-start gap-4";
                    const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                    aiMsg.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                    <img class="w-full h-full object-contain" src="${logoSrc}"/>
                </div>
                <div class="flex-1 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-[20px] rounded-tl-[4px] p-5 text-sm leading-relaxed shadow-sm font-light text-gray-800 dark:text-gray-200 space-y-4">
                    <p class="typing-text-block"></p>
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

                        let styled = fullResponse.replace(/\n/g, '<br/>');
                        styled = styled.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-700 dark:text-purple-400">$1</strong>');
                        textBlock.innerHTML = styled;
                        aiMsg.scrollIntoView({ behavior: "smooth" });
                    }

                    chatHistory.push({ role: 'model', content: fullResponse });
                    saveChatHistory();

                } catch (error) {
                    const indicator = document.getElementById("thinking-indicator");
                    if (indicator) indicator.remove();
                    showToast("Erro ao contatar a Amora. Tente novamente.");
                    console.error(error);
                }

                function saveChatHistory() {
                    const email = localStorage.getItem("user_email") || "guest";
                    const cleanHistory = chatHistory.map(msg => ({ role: msg.role, content: msg.content }));
                    localStorage.setItem(`amora_chat_history_${email}`, JSON.stringify(cleanHistory));
                }

                function loadChatHistory() {
                    const email = localStorage.getItem("user_email") || "guest";
                    const saved = localStorage.getItem(`amora_chat_history_${email}`);
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            if (parsed && parsed.length > 0) {
                                chatHistory = parsed;
                                if (emptyState) emptyState.classList.add("hidden");
                                chatMessages.classList.remove("hidden");
                                chatMessages.innerHTML = "";
                                chatHistory.forEach(msg => {
                                    if (msg.role === 'user') {
                                        appendUserMessage(msg.content, null);
                                    } else if (msg.role === 'model') {
                                        appendStaticAIMessage(msg.content);
                                    }
                                });
                            }
                        } catch (e) {
                            console.error("Error loading chat history:", e);
                        }
                    }
                }

                function appendStaticAIMessage(responseText) {
                    const aiMsg = document.createElement("div");
                    aiMsg.className = "flex items-start gap-4";
                    const logoSrc = htmlEl.classList.contains("dark") ? ASSETS.dark.sidebarLogo : ASSETS.light.sidebarLogo;

                    let styled = responseText.replace(/\n/g, '<br/>');
                    styled = styled.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-700 dark:text-purple-400">$1</strong>');

                    aiMsg.innerHTML = `
                        <div class="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                            <img class="w-full h-full object-contain" src="${logoSrc}"/>
                        </div>
                        <div class="flex-1 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-[20px] rounded-tl-[4px] p-5 text-sm leading-relaxed shadow-sm font-light text-gray-800 dark:text-gray-200 space-y-4">
                            <p class="typing-text-block">${styled}</p>
                        </div>
                    `;
                    chatMessages.appendChild(aiMsg);
                }

                window.loadChatHistory = loadChatHistory;
            }

            if (btnSend && textarea) {
                btnSend.addEventListener("click", handleSend);

                textarea.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                });
            }

            // Load profile
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
                            initialsPlaceholder.className = "w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-750 to-pink-500 text-white font-bold text-xs";
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
            }
            
            // Função de Sign Out global
            window.handleSignOut = function() {
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                localStorage.removeItem("user_avatar");
                window.location.href = "/login";
            };

            // Call on load
            loadUserProfile();
            if (window.loadChatHistory) {
                window.loadChatHistory();
            }

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

<!-- SideNavBar Component -->
<nav
    class="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50">
    <a href="/" class="px-6 py-4 mb-4 flex items-center justify-center cursor-pointer decoration-none">
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
<main class="ml-64 flex-1 flex flex-col min-h-screen relative overflow-hidden bg-[#F9FAFB] dark:bg-[#0A0A0B]">
    <!-- Ambient Background Pattern -->
    <div class="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02]" style="background-image: radial-gradient(var(--tw-colors-purple-500) 1px, transparent 1px); background-size: 24px 24px;"></div>
    

    
    <div class="flex-1 max-w-3xl mx-auto w-full px-8 pt-24 pb-12 relative z-10 flex flex-col">
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
        <div id="dynamic-content-area" class="flex-1 flex flex-col justify-center">

            
            <div id="chat-messages" class="hidden space-y-6 w-full text-left pb-16">
                <!-- Chat messages will be injected here -->
            </div>
        </div>
    </div>
</main>


` }} />
    );
}
