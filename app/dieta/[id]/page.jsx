'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function PatientDietPortal() {
  const getServingWeight = (description, unit) => {
    if (!description) return 100;
    const desc = description.toLowerCase();
    if (unit === 'un') {
      if (desc.includes('pão')) return 50;
      if (desc.includes('ovo')) return 50;
      if (desc.includes('banana')) return 90;
      if (desc.includes('maçã') || desc.includes('maca')) return 130;
      if (desc.includes('laranja')) return 130;
      if (desc.includes('iogurte')) return 170;
      return 100;
    }
    if (unit === 'colher') {
      if (desc.includes('arroz') || desc.includes('macarrão')) return 25;
      if (desc.includes('feijão') || desc.includes('lentilha')) return 20;
      if (desc.includes('azeite') || desc.includes('óleo') || desc.includes('manteiga')) return 13;
      if (desc.includes('açúcar') || desc.includes('mel')) return 15;
      return 15;
    }
    if (unit === 'concha') {
      if (desc.includes('arroz') || desc.includes('macarrão')) return 80;
      if (desc.includes('feijão') || desc.includes('lentilha')) return 100;
      return 80;
    }
    return 100;
  };

  const formatFoodName = (name) => {
    if (!name) return '';
    let formatted = name.replace(/,\s*cru/gi, '')
                        .replace(/,\s*cozido/gi, ' cozido')
                        .replace(/,\s*de galinha/gi, '')
                        .replace(/,\s*trigo/gi, '')
                        .replace(/,/g, '');
    
    if (formatted.toLowerCase().includes('pão francês')) return 'Pão Francês';
    
    return formatted.split(' ').map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const { id } = useParams();
  const patientAccess = useSearchParams().get('access') || '';
  const patientHeaders = patientAccess ? { 'X-Patient-Access': patientAccess } : {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('dieta'); // 'dieta' | 'chat' | 'nutri'

  // Hydration state (saved in local storage)
  const [waterDrunk, setWaterDrunk] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500); // fallback default

  // Checkboxes for meals consumed
  const [consumedItems, setConsumedItems] = useState({});

  // Chat AI state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou a Amora, sua assistente de saúde e nutrição. Estou aqui para te ajudar a seguir seu novo plano alimentar e tirar qualquer dúvida sobre substituições, horários ou nutrientes. Como posso te ajudar hoje?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Nutritionist messages (simulated chat)
  const [nutriMessages, setNutriMessages] = useState([
    {
      role: 'nutri',
      content: 'Olá! Preparei este plano alimentar com muito carinho baseado nos seus objetivos e exames. Fique à vontade para tirar dúvidas com o chat de IA clínico ou deixar sua mensagem por aqui que te respondo em breve!',
      time: 'Hoje, 09:00'
    }
  ]);
  const [nutriInput, setNutriInput] = useState('');

  // Equivalence Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcBaseFood, setCalcBaseFood] = useState(null);
  const [calcTargetSearch, setCalcTargetSearch] = useState('');
  const [calcTargetResults, setCalcTargetResults] = useState([]);
  const [calcTargetFood, setCalcTargetFood] = useState(null);
  const [calcResult, setCalcResult] = useState(null);

  const openCalculator = (item) => {
    setCalcBaseFood(item);
    setCalcTargetSearch('');
    setCalcTargetResults([]);
    setCalcTargetFood(null);
    setCalcResult(null);
    setShowCalculator(true);
  };

  useEffect(() => {
    if (!calcTargetSearch.trim() || calcTargetSearch.length < 2) {
      setCalcTargetResults([]);
      return;
    }
    const h = setTimeout(() => {
      fetch(`/api/alimentos?q=${encodeURIComponent(calcTargetSearch)}`)
        .then(r => r.json())
        .then(d => setCalcTargetResults(Array.isArray(d) ? d : []))
        .catch(() => setCalcTargetResults([]));
    }, 300);
    return () => clearTimeout(h);
  }, [calcTargetSearch]);

  useEffect(() => {
    if (calcBaseFood && calcTargetFood) {
      // Base macros per 100g
      const bKcal100 = parseFloat(calcBaseFood.base_kcal ?? calcBaseFood.energy_kcal) || 0;
      const bCarb100 = parseFloat(calcBaseFood.base_carb ?? calcBaseFood.carbohydrate_g) || 0;
      const bProt100 = parseFloat(calcBaseFood.base_prot ?? calcBaseFood.protein_g) || 0;
      const bFat100 = parseFloat(calcBaseFood.base_fat ?? calcBaseFood.lipid_g) || 0;

      // Base amount
      const bAmount = parseFloat(calcBaseFood.amount_g || calcBaseFood.amount || 100);
      const isD = ['un', 'colher', 'concha'].includes(calcBaseFood.unit);
      const sw = isD ? getServingWeight(calcBaseFood.name || calcBaseFood.description, calcBaseFood.unit) : 1;
      const bMultiplier = isD ? (bAmount * sw / 100) : (bAmount / 100);

      // Total macros in base food
      const baseKcal = bKcal100 * bMultiplier;
      const baseCarb = bCarb100 * bMultiplier;
      const baseProt = bProt100 * bMultiplier;
      const baseFat = bFat100 * bMultiplier;

      // Target macros per 100g
      const tKcal100 = parseFloat(calcTargetFood.energy_kcal) || 0;
      const tCarb100 = parseFloat(calcTargetFood.carbohydrate_g) || 0;
      const tProt100 = parseFloat(calcTargetFood.protein_g) || 0;
      const tFat100 = parseFloat(calcTargetFood.lipid_g) || 0;

      if (tKcal100 === 0) {
        setCalcResult(null);
        return;
      }

      // Find equivalent amount based on Kcal
      const equivalentAmount = (baseKcal / tKcal100) * 100;
      const tMultiplier = equivalentAmount / 100;

      // Target macros at equivalent amount
      const targetCarb = tCarb100 * tMultiplier;
      const targetProt = tProt100 * tMultiplier;
      const targetFat = tFat100 * tMultiplier;

      // Calculate score based on macros difference
      // Max diff per macro is 1 (100%). We cap at 1 to prevent negative scores from getting too large.
      const carbDiff = Math.min(Math.abs(baseCarb - targetCarb) / Math.max(baseCarb, 1), 1);
      const protDiff = Math.min(Math.abs(baseProt - targetProt) / Math.max(baseProt, 1), 1);
      const fatDiff = Math.min(Math.abs(baseFat - targetFat) / Math.max(baseFat, 1), 1);

      // Score 0-100 (Weighted: Carb 40%, Prot 40%, Fat 20%)
      const penalty = (carbDiff * 40) + (protDiff * 40) + (fatDiff * 20);
      let score = Math.round(100 - penalty);
      if (score < 0) score = 0;

      setCalcResult({
        equivalentAmount: Math.round(equivalentAmount),
        score,
        baseMacros: { carb: baseCarb, prot: baseProt, fat: baseFat, kcal: baseKcal },
        targetMacros: { carb: targetCarb, prot: targetProt, fat: targetFat, kcal: baseKcal } // kcal is same
      });
    }
  }, [calcBaseFood, calcTargetFood]);

  // Fetch diet plan on mount
  useEffect(() => {
    if (!id) return;
    async function fetchDiet() {
      try {
        const res = await fetch(`/api/diet-plans/${id}`, { headers: patientHeaders });
        if (!res.ok) {
          throw new Error('Plano de dieta não encontrado ou indisponível.');
        }
        const data = await res.json();
        setDietPlan(data);
        
        // Load water goal based on notes/hydration settings if parsed, or calculate default (35ml * 70kg = 2450ml)
        setWaterGoal(2500);

        // Load consumed status from localStorage
        const savedConsumed = localStorage.getItem(`consumed_${id}`);
        if (savedConsumed) {
          setConsumedItems(JSON.parse(savedConsumed));
        }

        // Load water from localStorage
        const todayStr = new Date().toDateString();
        const savedWaterDate = localStorage.getItem(`water_date_${id}`);
        if (savedWaterDate === todayStr) {
          const savedWater = localStorage.getItem(`water_drunk_${id}`);
          if (savedWater) setWaterDrunk(parseInt(savedWater));
        } else {
          localStorage.setItem(`water_date_${id}`, todayStr);
          localStorage.setItem(`water_drunk_${id}`, '0');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDiet();
  }, [id, patientAccess]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, nutriMessages, activeTab]);

  // Calculate totals and percentages
  const getDietTotals = () => {
    let kcal = 0, carb = 0, prot = 0, fat = 0;
    if (dietPlan && dietPlan.meals) {
      dietPlan.meals.forEach((m) => {
        if (m.items) {
          m.items.forEach((item) => {
            const amount = parseFloat(item.amount_g || item.amount || 0);
            const isD = ['un', 'colher', 'concha'].includes(item.unit);
            const sw = isD ? getServingWeight(item.name || item.description, item.unit) : 1;
            const multiplier = isD ? (amount * sw / 100) : (amount / 100);
            
            const itemKcal = (parseFloat(item.base_kcal ?? item.energy_kcal) || 0) * multiplier;
            const itemProt = (parseFloat(item.base_prot ?? item.protein_g) || 0) * multiplier;
            const itemCarb = (parseFloat(item.base_carb ?? item.carbohydrate_g) || 0) * multiplier;
            const itemFat = (parseFloat(item.base_fat ?? item.lipid_g) || 0) * multiplier;

            kcal += itemKcal;
            carb += itemCarb;
            prot += itemProt;
            fat += itemFat;
          });
        }
      });
    }
    const totalGrams = carb + prot + fat;
    return {
      kcal,
      carb,
      prot,
      fat,
      percentages: {
        carb: totalGrams > 0 ? Math.round((carb / totalGrams) * 100) : 0,
        prot: totalGrams > 0 ? Math.round((prot / totalGrams) * 100) : 0,
        fat: totalGrams > 0 ? Math.round((fat / totalGrams) * 100) : 0,
      }
    };
  };

  const totals = getDietTotals();

  // Handle item checkbox toggle
  const toggleItemConsumed = (mealId, itemIdx) => {
    const key = `${mealId}_${itemIdx}`;
    const newConsumed = {
      ...consumedItems,
      [key]: !consumedItems[key]
    };
    setConsumedItems(newConsumed);
    localStorage.setItem(`consumed_${id}`, JSON.stringify(newConsumed));
  };

  // Add water
  const addWater = (amount) => {
    const newWater = Math.max(0, waterDrunk + amount);
    setWaterDrunk(newWater);
    localStorage.setItem(`water_drunk_${id}`, String(newWater));
  };

  // Send message to AI clinical chat
  const handleSendAIMessage = async (overrideMessage = null) => {
    const text = overrideMessage || inputMessage;
    if (!text.trim()) return;

    // Check rate limit
    const todayStr = new Date().toDateString();
    let questionsAsked = 0;
    const savedDate = localStorage.getItem(`ai_chat_date_${id}`);
    if (savedDate === todayStr) {
      questionsAsked = parseInt(localStorage.getItem(`ai_chat_count_${id}`) || '0');
    } else {
      localStorage.setItem(`ai_chat_date_${id}`, todayStr);
      localStorage.setItem(`ai_chat_count_${id}`, '0');
    }

    if (questionsAsked >= 3) {
      setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: 'Desculpe, você atingiu o limite de 3 dúvidas por dia com a IA.\nPor favor, deixe sua dúvida na aba "Nutricionista" ou volte amanhã!' }]);
      setInputMessage('');
      return;
    }

    localStorage.setItem(`ai_chat_count_${id}`, (questionsAsked + 1).toString());

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat-paciente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...patientHeaders },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          dietPlanId: id
        })
      });

      if (!res.ok) throw new Error('Falha ao obter resposta do assistente.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        assistantResponse += chunkValue;
        
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: assistantResponse };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema ao processar sua pergunta. Tente novamente em alguns instantes.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Polling to get real-time message updates from nutritionist
  useEffect(() => {
    if (!id) return;
    
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/diet-plans/${id}/chat`, { headers: patientHeaders });
        if (res.ok) {
          const data = await res.json();
          setNutriMessages(data.length > 0 ? data : [
            {
              role: 'nutri',
              content: 'Olá! Preparei este plano alimentar com muito carinho baseado nos seus objetivos e exames. Fique à vontade para tirar dúvidas com o chat de IA clínico ou deixar sua mensagem por aqui que te respondo em breve!',
              time: 'Hoje, 09:00'
            }
          ]);
        }
      } catch (err) {
        console.error('Erro ao buscar chat do paciente:', err);
      }
    };
    
    fetchChat();

    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [id, activeTab, patientAccess]);

  // Send message to Nutritionist (synced with Database)
  const handleSendNutriMessage = async () => {
    if (!nutriInput.trim()) return;
    
    const userMsg = { 
      role: 'user', 
      content: nutriInput.trim(), 
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setNutriMessages(prev => [...prev, userMsg]);
    setNutriInput('');

    try {
      const res = await fetch(`/api/diet-plans/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...patientHeaders },
        body: JSON.stringify({ message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setNutriMessages(data);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem para o nutricionista:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] flex flex-col items-center justify-center p-6 text-gray-500">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/25 border-t-purple-600 animate-spin mb-4"></div>
        <p className="text-sm font-medium animate-pulse">Carregando seu plano alimentar...</p>
      </div>
    );
  }

  if (error || !dietPlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/20 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ops! Plano não encontrado</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {error || 'Não conseguimos carregar os dados deste plano alimentar. Verifique se o link está correto.'}
        </p>
        <a href="/" className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-sm transition-all shadow-md">
          Ir para Página Inicial
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-gray-100 font-sans pb-16 flex flex-col">
      {/* Dynamic Header */}
      <header className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-[#27272A] sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              A
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Amora Genômica</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Portal do Paciente</p>
            </div>
          </div>
          
          {/* Quick Stats/Badges */}
          <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">ATIVO</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-6">
        
        {/* User / Plan Welcome Card */}
        <section className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[160px]">restaurant</span>
          </div>
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Meu Plano Alimentar
              </span>
              <span className="text-xs text-white/75">{new Date(dietPlan.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div>
              <h2 className="text-xl font-black">{dietPlan.patient_name || 'Paciente'}</h2>
              <p className="text-sm text-purple-200 mt-0.5">{dietPlan.plan_name}</p>
            </div>

            {dietPlan.diet_notes && (
              <div className="pt-3 border-t border-white/10 text-xs text-purple-100/90 leading-relaxed italic">
                "{dietPlan.diet_notes}"
              </div>
            )}
          </div>
        </section>

        {/* Tab Navigation Menu */}
        <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-1 flex shadow-sm">
          <button
            onClick={() => setActiveTab('dieta')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dieta'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">nutrition</span>
            <span>Dieta</span>
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">clinical_notes</span>
            <span>Assistente Clínico IA</span>
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('nutri')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'nutri'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">chat_bubble</span>
            <span>Nutricionista</span>
          </button>
        </div>

        {/* Tab 1: Diet and Meals View */}
        {activeTab === 'dieta' && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Nutrition Overview Card */}
            <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Resumo Estimado</h3>
                <span className="text-base font-black text-purple-600 dark:text-purple-400">
                  {totals.kcal.toFixed(0)} <span className="text-xs font-medium">kcal/dia</span>
                </span>
              </div>

              {/* Progress split bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-[#27272A]">
                <div style={{ width: `${totals.percentages.carb}%` }} className="bg-blue-400 transition-all" title="Carboidratos"></div>
                <div style={{ width: `${totals.percentages.prot}%` }} className="bg-red-400 transition-all" title="Proteínas"></div>
                <div style={{ width: `${totals.percentages.fat}%` }} className="bg-yellow-400 transition-all" title="Gorduras"></div>
              </div>

              {/* Stats Split Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col border-l-2 border-blue-400 pl-2.5">
                  <span className="text-[10px] text-gray-500">Carboidratos</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{totals.carb.toFixed(0)}g</span>
                  <span className="text-[9px] text-gray-400">{totals.percentages.carb}% total</span>
                </div>
                <div className="flex flex-col border-l-2 border-red-400 pl-2.5">
                  <span className="text-[10px] text-gray-500">Proteínas</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{totals.prot.toFixed(0)}g</span>
                  <span className="text-[9px] text-gray-400">{totals.percentages.prot}% total</span>
                </div>
                <div className="flex flex-col border-l-2 border-yellow-400 pl-2.5">
                  <span className="text-[10px] text-gray-500">Gorduras</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{totals.fat.toFixed(0)}g</span>
                  <span className="text-[9px] text-gray-400">{totals.percentages.fat}% total</span>
                </div>
              </div>
            </div>

            {/* Hydration Tracker */}
            <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">water_drop</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Meta de Hidratação</h3>
                  <p className="text-xs text-gray-500">Acompanhe seu consumo de água</p>
                </div>
              </div>

              {/* Liquid Graphic */}
              <div className="flex items-center justify-between gap-6 py-2">
                <div className="relative w-20 h-28 border-4 border-gray-300 dark:border-gray-700 rounded-b-2xl rounded-t-lg overflow-hidden flex items-end shadow-inner bg-gray-50 dark:bg-black/20 shrink-0">
                  <div 
                    style={{ height: `${Math.min(100, (waterDrunk / waterGoal) * 100)}%` }} 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500 ease-out relative"
                  >
                    {/* Bubbles */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent)] animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black drop-shadow-md text-gray-800 dark:text-white">
                      {Math.round((waterDrunk / waterGoal) * 100)}%
                    </span>
                    <span className="text-[8px] text-gray-600 dark:text-gray-300 font-bold">concluído</span>
                  </div>
                </div>

                {/* Tracking stats */}
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{waterDrunk}</span>
                    <span className="text-xs text-gray-500 font-bold"> / {waterGoal} ml</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addWater(250)}
                      className="flex items-center justify-center gap-1 py-2 px-3 border border-blue-200 dark:border-blue-900/30 rounded-xl text-[11px] font-bold bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-xs">local_drink</span>
                      +250ml
                    </button>
                    <button
                      onClick={() => addWater(500)}
                      className="flex items-center justify-center gap-1 py-2 px-3 border border-blue-200 dark:border-blue-900/30 rounded-xl text-[11px] font-bold bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-xs">emoji_food_beverage</span>
                      +500ml
                    </button>
                  </div>

                  <button
                    onClick={() => setWaterDrunk(0)}
                    className="text-[9px] text-gray-400 hover:text-red-500 transition-all uppercase tracking-wider font-bold"
                  >
                    Resetar consumo hoje
                  </button>
                </div>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Refeições Programadas</h3>
              
              {dietPlan.meals && dietPlan.meals.map((meal) => (
                <div 
                  key={meal.id}
                  className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl overflow-hidden shadow-sm hover:border-purple-400/30 transition-all duration-200"
                >
                  {/* Meal Header */}
                  <div className="bg-gray-50 dark:bg-black/10 px-5 py-4 border-b border-gray-100 dark:border-[#27272A] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-black">
                        {meal.name ? meal.name[0] : 'R'}
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white">{meal.name}</h4>
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {meal.time || 'Sem horário'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meal Items */}
                  <div className="divide-y divide-gray-100 dark:divide-[#27272A] px-5">
                    {meal.items && meal.items.map((item, itemIdx) => {
                      const key = `${meal.id}_${itemIdx}`;
                      const isConsumed = consumedItems[key];
                      return (
                        <div 
                          key={itemIdx}
                          onClick={() => toggleItemConsumed(meal.id, itemIdx)}
                          className="py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Animated Checkbox */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isConsumed 
                                ? 'bg-green-600 border-green-600 text-white' 
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400'
                            }`}>
                              {isConsumed && <span className="material-symbols-outlined text-[12px] font-black">check</span>}
                            </div>
                            
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate transition-all ${
                                isConsumed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                              }`}>
                                {formatFoodName(item.name || item.description)}
                              </p>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                {item.amount_g || item.amount} {item.unit || 'g'} • {(() => {
                                  const isD = ['un', 'colher', 'concha'].includes(item.unit);
                                  const sw = isD ? getServingWeight(item.name || item.description, item.unit) : 1;
                                  const mult = isD ? (parseFloat(item.amount_g || item.amount || 0) * sw / 100) : (parseFloat(item.amount_g || item.amount || 0) / 100);
                                  return Math.round((parseFloat(item.base_kcal ?? item.energy_kcal) || 0) * mult);
                                })()} kcal
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); openCalculator(item); }}
                            className="text-[10px] px-2 py-1.5 bg-gray-50 dark:bg-purple-900/10 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-300 font-bold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-1 border border-gray-100 dark:border-[#27272A] hover:border-purple-200 dark:hover:border-purple-800/50"
                          >
                            <span className="material-symbols-outlined text-[12px]">swap_horiz</span>
                            Substituir
                          </button>
                        </div>
                      );
                    })}

                    {(!meal.items || meal.items.length === 0) && (
                      <div className="py-6 text-center text-xs text-gray-400 italic">Sem alimentos cadastrados nesta refeição.</div>
                    )}
                  </div>

                  {/* Meal Notes */}
                  {meal.notes && (
                    <div className="bg-purple-50/30 dark:bg-purple-950/5 px-5 py-3 border-t border-gray-100 dark:border-[#27272A] text-[11px] text-purple-800 dark:text-purple-300 leading-relaxed">
                      <strong>Dica:</strong> {meal.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 2: Clinical Assistant (AI) */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-3xl overflow-hidden shadow-md flex flex-col h-[520px] animate-slide-up">
            {/* Header info */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-4 text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-purple-200 animate-pulse">clinical_notes</span>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-200">Suporte Clínico Amora</h3>
                <p className="text-[10px] text-white/80">Tire dúvidas em tempo real sobre seu plano alimentar</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-black/10">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-[#27272A] border border-gray-150 dark:border-none shadow-sm rounded-tl-none'
                  }`}>
                    {/* Preserve linebreaks */}
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#27272A] border border-gray-150 dark:border-none shadow-sm rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions Pills */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-[#27272A] bg-white dark:bg-[#18181B] flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button 
                onClick={() => handleSendAIMessage('Posso substituir a batata doce do almoço por arroz?')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-full transition-all border border-purple-100/50 dark:border-purple-900/30"
              >
                Substituir batata doce
              </button>
              <button 
                onClick={() => handleSendAIMessage('Qual a melhor proteína para comer à noite?')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-full transition-all border border-purple-100/50 dark:border-purple-900/30"
              >
                Proteína para jantar
              </button>
              <button 
                onClick={() => handleSendAIMessage('Quantas kcal tem meu café da manhã?')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-full transition-all border border-purple-100/50 dark:border-purple-900/30"
              >
                Kcal do café da manhã
              </button>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-100 dark:border-[#27272A] bg-white dark:bg-[#18181B] flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendAIMessage(); }}
                placeholder="Pergunte sobre sua dieta..."
                className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-xs outline-none dark:text-white"
              />
              <button
                onClick={() => handleSendAIMessage()}
                className="w-10 h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Chat with Nutritionist (Simulated/Mocked) */}
        {activeTab === 'nutri' && (
          <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-3xl overflow-hidden shadow-md flex flex-col h-[520px] animate-slide-up">
            {/* Header info */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100/20 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-lg">medical_services</span>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-200">Canal com Profissional</h3>
                  <p className="text-[10px] text-white/80">Deixe recados sobre ajustes na dieta</p>
                </div>
              </div>
              <span className="text-[9px] bg-purple-950/40 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-800">
                Resposta em até 24h
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-black/10">
              {nutriMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-[#27272A] border border-gray-150 dark:border-none shadow-sm rounded-tl-none'
                    }`}>
                      <div>{m.content}</div>
                    </div>
                    <span className="text-[8px] text-gray-400 px-1">{m.time}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-100 dark:border-[#27272A] bg-white dark:bg-[#18181B] flex gap-2">
              <input
                type="text"
                value={nutriInput}
                onChange={(e) => setNutriInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendNutriMessage(); }}
                placeholder="Escreva uma mensagem para o nutricionista..."
                className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-xs outline-none dark:text-white"
              />
              <button
                onClick={handleSendNutriMessage}
                className="w-10 h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Equivalence Calculator Modal */}
      {showCalculator && calcBaseFood && (() => {
        const requiredScore = dietPlan?.substitution_score ?? dietPlan?.patients?.substitution_score ?? 70;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">sync_alt</span>
                    Calculadora de Equivalências
                  </h3>
                </div>
                <button onClick={() => setShowCalculator(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                {/* Base Food */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Sua Dieta (Você quer trocar):
                  </label>
                  <div className="bg-gray-50 dark:bg-black p-3 rounded-xl border border-gray-100 dark:border-[#27272A] flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {formatFoodName(calcBaseFood.name || calcBaseFood.description)}
                      </p>
                      <p className="text-xs text-gray-500">{calcBaseFood.amount_g || calcBaseFood.amount} {calcBaseFood.unit || 'g'}</p>
                    </div>
                    <p className="text-xs font-black text-orange-600">
                      {Math.round(
                        (parseFloat(calcBaseFood.base_kcal ?? calcBaseFood.energy_kcal) || 0) * 
                        (
                          ['un', 'colher', 'concha'].includes(calcBaseFood.unit)
                            ? (parseFloat(calcBaseFood.amount_g || calcBaseFood.amount || 0) * getServingWeight(calcBaseFood.name || calcBaseFood.description, calcBaseFood.unit) / 100)
                            : (parseFloat(calcBaseFood.amount_g || calcBaseFood.amount || 0) / 100)
                        )
                      )} kcal
                    </p>
                  </div>
                </div>

                {/* Target Search */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Por Qual Alimento?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={calcTargetSearch}
                      onChange={(e) => setCalcTargetSearch(e.target.value)}
                      placeholder="Ex: Tapioca, Arroz..."
                      className="w-full bg-white dark:bg-[#18181B] border border-purple-200 dark:border-purple-800/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 dark:text-white placeholder-gray-400"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-400">search</span>
                  </div>

                  {calcTargetResults.length > 0 && !calcTargetFood && (
                    <div className="mt-2 bg-white dark:bg-[#27272A] border border-gray-100 dark:border-gray-700 rounded-xl max-h-40 overflow-y-auto shadow-sm divide-y divide-gray-50 dark:divide-gray-800">
                      {calcTargetResults.map(r => (
                        <div
                          key={r.id}
                          onClick={() => { setCalcTargetFood(r); setCalcTargetResults([]); setCalcTargetSearch(''); }}
                          className="p-3 text-xs cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          <p className="font-bold text-gray-800 dark:text-gray-200">{formatFoodName(r.description)}</p>
                          <p className="text-[10px] text-gray-500">{r.energy_kcal} kcal / 100g</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Result Area */}
                {calcTargetFood && calcResult && (
                  <div className="mt-4 border-t border-gray-100 dark:border-[#27272A] pt-4 animate-slide-up">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300">Nova Sugestão:</h4>
                      <button onClick={() => setCalcTargetFood(null)} className="text-[10px] text-purple-600 font-bold hover:underline">Trocar Alimento</button>
                    </div>
                    
                    <div className={`p-4 rounded-xl border mb-4 ${
                      calcResult.score >= requiredScore
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}>
                      <p className="text-center text-[10px] font-bold mb-1 opacity-75">QUANTIDADE IDEAL</p>
                      <p className="text-center text-xl font-black mb-2 text-gray-900 dark:text-white">
                        {calcResult.equivalentAmount}g <span className="text-sm font-medium text-gray-500">de {formatFoodName(calcTargetFood.description)}</span>
                      </p>
                      
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        {calcResult.score >= requiredScore ? (
                          <>
                            <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                            <span className="text-xs font-bold text-green-700 dark:text-green-400">Substituição Liberada!</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-red-600 text-sm">warning</span>
                            <span className="text-xs font-bold text-red-700 dark:text-red-400">Não Recomendada</span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-center text-[10px] text-gray-500 dark:text-gray-400">
                        Score de Similaridade: {calcResult.score}/100 <br/>
                        (Mínimo exigido: {requiredScore})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-gray-50 dark:bg-black p-2 rounded-lg border border-gray-100 dark:border-[#27272A]">
                        <p className="font-bold mb-1 text-gray-600 dark:text-gray-400">Original</p>
                        <p>Carb: {Math.round(calcResult.baseMacros.carb)}g</p>
                        <p>Prot: {Math.round(calcResult.baseMacros.prot)}g</p>
                        <p>Gord: {Math.round(calcResult.baseMacros.fat)}g</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-black p-2 rounded-lg border border-gray-100 dark:border-[#27272A]">
                        <p className="font-bold mb-1 text-purple-700 dark:text-purple-400">Substituto ({calcResult.equivalentAmount}g)</p>
                        <p>Carb: {Math.round(calcResult.targetMacros.carb)}g</p>
                        <p>Prot: {Math.round(calcResult.targetMacros.prot)}g</p>
                        <p>Gord: {Math.round(calcResult.targetMacros.fat)}g</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 dark:border-[#27272A] bg-gray-50 dark:bg-black text-center">
                <button 
                  onClick={() => setShowCalculator(false)}
                  className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-[#27272A] dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
