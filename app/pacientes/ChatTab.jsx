'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function ChatTab({ selectedPatient, supabase }) {
  const [loading, setLoading] = useState(true);
  const [dietPlan, setDietPlan] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef(null);

  // Fetch the latest diet plan and chat
  const fetchChat = async () => {
    if (!selectedPatient?.id) return;
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('id, patient_chat, created_at')
        .eq('patient_id', selectedPatient.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
        console.error('Error fetching chat:', error);
      } else if (data) {
        setDietPlan(data);
        if (data.patient_chat) {
          setMessages(data.patient_chat);
        } else {
          // Initialize empty if null
          setMessages([]);
        }
      } else {
        setDietPlan(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchChat();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [selectedPatient?.id, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !dietPlan?.id) return;

    const nutriMsg = {
      role: 'nutri',
      content: inputMessage.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, nutriMsg];
    setMessages(newMessages);
    setInputMessage('');

    try {
      const { error } = await supabase
        .from('diet_plans')
        .update({ patient_chat: newMessages })
        .eq('id', dietPlan.id);

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">chat_bubble_outline</span>
        <p>Este paciente ainda não possui nenhum plano alimentar salvo.</p>
        <p className="text-xs mt-1">Gere um plano na aba "Dieta" para ativar o chat.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
      
      {/* Header */}
      <div className="bg-purple-700 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="font-bold text-lg">{selectedPatient?.name?.charAt(0)}</span>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide">CANAL COM {selectedPatient?.name}</h3>
            <p className="text-[10px] text-purple-200">Deixe recados sobre ajustes na dieta</p>
          </div>
        </div>
        <span className="text-[10px] bg-purple-900/40 px-3 py-1 rounded-full font-medium border border-purple-500/30 text-purple-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          Resposta em até 24h
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-black/10">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 mt-10">
            Nenhuma mensagem ainda. Envie a primeira mensagem!
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'nutri' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === 'nutri' 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-[#27272A] border border-gray-150 dark:border-none shadow-sm rounded-tl-none text-gray-800 dark:text-gray-200'
              }`}>
                <div className="whitespace-pre-line">{m.content}</div>
                <div className={`text-[9px] mt-1 text-right ${m.role === 'nutri' ? 'text-purple-200' : 'text-gray-400'}`}>
                  {m.time}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 dark:border-[#27272A] bg-white dark:bg-[#18181B] flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          placeholder="Escreva uma mensagem para o paciente..."
          className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white focus:border-purple-400"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>

    </div>
  );
}
