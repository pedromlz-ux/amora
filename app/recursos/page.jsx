"use client"
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Returns grams per 1 serving unit for discrete units (un, colher, concha)
const getServingWeight = (description, unit) => {
  if (!description) return 100;
  const desc = description.toLowerCase();

  if (unit === 'un') {
    if (desc.includes('pão, trigo, forma') || desc.includes('pão de forma') || desc.includes('pao de forma') || desc.includes('forma, integral')) return 25;
    if (desc.includes('pão') || desc.includes('pao')) return 50;
    if (desc.includes('ovo')) return 50;
    if (desc.includes('banana')) return 90;
    if (desc.includes('maçã') || desc.includes('maca')) return 130;
    if (desc.includes('laranja')) return 130;
    if (desc.includes('limão') || desc.includes('limao')) return 50;
    if (desc.includes('iogurte')) return 170;
    if (desc.includes('leite') || desc.includes('suco') || desc.includes('bebida') || desc.includes('água') || desc.includes('agua')) return 200;
    return 100;
  }

  if (unit === 'colher') {
    // Colher de sopa (tablespoon) — TACO/IBGE household measure references
    if (desc.includes('arroz') || desc.includes('macarrão') || desc.includes('massa') || desc.includes('macarrao')) return 25;
    if (desc.includes('feijão') || desc.includes('feijao') || desc.includes('lentilha') || desc.includes('grão') || desc.includes('grao')) return 20;
    if (desc.includes('aveia') || desc.includes('farelo') || desc.includes('granola') || desc.includes('quinoa')) return 15;
    if (desc.includes('farinha') || desc.includes('amido') || desc.includes('polvilho')) return 12;
    if (desc.includes('azeite') || desc.includes('óleo') || desc.includes('oleo') || desc.includes('manteiga') || desc.includes('margarina')) return 13;
    if (desc.includes('açúcar') || desc.includes('acucar') || desc.includes('mel') || desc.includes('geleia') || desc.includes('geleia')) return 15;
    if (desc.includes('cream cheese') || desc.includes('requeijão') || desc.includes('requeijao')) return 20;
    if (desc.includes('pasta') || desc.includes('tahine') || desc.includes('pasta de amendoim')) return 16;
    return 15; // default tablespoon
  }

  if (unit === 'concha') {
    // Concha de servir — TACO/IBGE household measure references
    if (desc.includes('arroz') || desc.includes('macarrão') || desc.includes('massa') || desc.includes('macarrao')) return 80;
    if (desc.includes('feijão') || desc.includes('feijao') || desc.includes('lentilha') || desc.includes('grão') || desc.includes('grao')) return 100;
    if (desc.includes('sopa') || desc.includes('caldo') || desc.includes('creme')) return 120;
    return 80; // default ladle
  }

  return 100;
};
// Legacy alias used in older calls
const getUnitWeight = (desc) => getServingWeight(desc, 'un');


export default function Recursos() {
  const [loading, setLoading] = useState(true);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState({ name: '', email: '', avatar: '', plan: 'Free' });

  // IMC State
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('feminino');
  const [resultadoImc, setResultadoImc] = useState(null);

  // TACO State
  const [tacoData, setTacoData] = useState([]);
  const [mealSearchResults, setMealSearchResults] = useState([]);
  const [subSearchResults, setSubSearchResults] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [tacoPorcao, setTacoPorcao] = useState('100g'); // 100g, 50g, Porção
  const [activeDb, setActiveDb] = useState('taco'); // 'taco' or 'tbca'

  // Meals State
  const [meals, setMeals] = useState([
    { id: 1, name: 'CAFÉ DA MANHÃ', time: '08:00', items: [], notes: '' },
    { id: 2, name: 'ALMOÇO', time: '12:30', items: [], notes: '' }
  ]);
  const [addingToMealId, setAddingToMealId] = useState(null);
  const [mealSearchTerm, setMealSearchTerm] = useState('');
  
  // Patient and Diet Customization State
  const [patientName, setPatientName] = useState('');
  const [dietNotes, setDietNotes] = useState('');
  const [planName, setPlanName] = useState('');
  const [addingSubToItem, setAddingSubToItem] = useState(null); // { mealId, itemIndex }
  const [subSearchTerm, setSubSearchTerm] = useState('');

  // Macros Setting State
  const [showMacroSettings, setShowMacroSettings] = useState(false);
  const [macros, setMacros] = useState({ carb: 50, prot: 30, fat: 20 });

  // Save / Load Plan State
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [savedPlans, setSavedPlans] = useState([]);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null); // id if editing an existing plan
  const [patientChat, setPatientChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  // Polling patient chat history if editing a plan
  useEffect(() => {
    if (!currentPlanId) return;
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/diet-plans/${currentPlanId}/chat`, {
          headers: await getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPatientChat(data);
        }
      } catch (e) {
        console.error('Erro ao buscar chat no painel:', e);
      }
    };
    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [currentPlanId]);

  const sendProfessionalChatReply = async () => {
    if (!chatInput.trim() || !currentPlanId) return;
    const newMsg = {
      role: 'nutri',
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    
    setPatientChat(prev => [...prev, newMsg]);
    setChatInput('');

    try {
      const res = await fetch(`/api/diet-plans/${currentPlanId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ message: newMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setPatientChat(data);
      }
    } catch (e) {
      console.error('Erro ao responder chat do paciente:', e);
    }
  };

  // Load Macros from localStorage on mount
  useEffect(() => {
    const savedMacros = localStorage.getItem('amora_macros');
    if (savedMacros) {
      try {
        setMacros(JSON.parse(savedMacros));
      } catch(e) {}
    }
  }, []);

  // Save Macros to localStorage on change
  useEffect(() => {
    localStorage.setItem('amora_macros', JSON.stringify(macros));
  }, [macros]);

  // Exams State
  const [exameNome, setExameNome] = useState('');
  const [exameStatus, setExameStatus] = useState('idle'); // idle, analyzing, done
  const [exameResultado, setExameResultado] = useState(null);
  const fileInputRef = useRef(null);

  // Gasto Energético State
  const [gastoPeso, setGastoPeso] = useState('');
  const [gastoAltura, setGastoAltura] = useState('');
  const [gastoIdade, setGastoIdade] = useState('');
  const [gastoSexo, setGastoSexo] = useState('feminino');
  const [gastoFormula, setGastoFormula] = useState('mifflin');
  const [gastoAtividade, setGastoAtividade] = useState('1.2');
  const [resultadoGasto, setResultadoGasto] = useState(null);

  // Nutritional Therapy Simulator State
  const [simPeso, setSimPeso] = useState(70);
  const [simDiagnostico, setSimDiagnostico] = useState('renal');
  const [simFatDiagnostico, setSimFatDiagnostico] = useState('renal');
  const [simCaloriasRef, setSimCaloriasRef] = useState(2000);

  // Hydration Calculator State
  const [hidroPeso, setHidroPeso] = useState('');
  const [hidroIdade, setHidroIdade] = useState('');
  const [hidroAtividade, setHidroAtividade] = useState('0');
  const [hidroFator, setHidroFator] = useState('nenhum');
  const [hidroClima, setHidroClima] = useState('ameno');
  const [resultadoHidro, setResultadoHidro] = useState(null);

  // Mobile Menu State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      let name = localStorage.getItem("user_name") || "Carregando...";
      let email = localStorage.getItem("user_email") || "";
      let avatar = localStorage.getItem("user_avatar") || "";
      let plan = localStorage.getItem("user_plan") || "Free";

      setUserProfile({ name, email, avatar, plan });

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

          setUserProfile({ name, email, avatar, plan });
        }
      } catch (e) {
        console.error("Error loading user profile in recursos page:", e);
      }
    }

    loadProfile();
    setLoading(false);
  }, []);

  // 1. General food lookup tool (termoBusca)
  useEffect(() => {
    const q = termoBusca.trim();
    if (q.length < 2) {
      fetch(`/api/alimentos?db=${activeDb}`)
        .then(res => res.json())
        .then(data => setTacoData(data))
        .catch(err => console.error('Erro ao carregar alimentos base', err));
      return;
    }
    const handler = setTimeout(() => {
      fetch(`/api/alimentos?q=${encodeURIComponent(q)}&db=${activeDb}`)
        .then(res => res.json())
        .then(data => setTacoData(data))
        .catch(err => console.error('Erro ao buscar alimentos', err));
    }, 300);
    return () => clearTimeout(handler);
  }, [termoBusca, activeDb]);

  // 2. Meal item search (inside each meal ’s "+ Adicionar item" panel)
  useEffect(() => {
    if (addingToMealId === null) { setMealSearchResults([]); return; }
    const q = mealSearchTerm.trim();
    if (q.length < 2) { setMealSearchResults([]); return; }
    const handler = setTimeout(() => {
      fetch(`/api/alimentos?q=${encodeURIComponent(q)}&db=${activeDb}`)
        .then(res => res.json())
        .then(data => setMealSearchResults(data))
        .catch(err => console.error('Erro ao buscar alimento na refeição', err));
    }, 300);
    return () => clearTimeout(handler);
  }, [mealSearchTerm, activeDb, addingToMealId]);

  // 3. Substitution item search (inside each item’s sub panel)
  useEffect(() => {
    if (addingSubToItem === null) { setSubSearchResults([]); return; }
    const q = subSearchTerm.trim();
    if (q.length < 2) { setSubSearchResults([]); return; }
    const handler = setTimeout(() => {
      fetch(`/api/alimentos?q=${encodeURIComponent(q)}&db=${activeDb}`)
        .then(res => res.json())
        .then(data => setSubSearchResults(data))
        .catch(err => console.error('Erro ao buscar substituto', err));
    }, 300);
    return () => clearTimeout(handler);
  }, [subSearchTerm, activeDb, addingSubToItem]);

  const handleSignOut = () => {
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_avatar");
    window.location.href = "/login";
  };

  const calcularGasto = () => {
    if (!gastoPeso || !gastoAltura || !gastoIdade) return;
    const p = parseFloat(gastoPeso);
    const a = parseFloat(gastoAltura);
    const i = parseInt(gastoIdade);
    let tmb = 0;

    if (gastoFormula === 'mifflin') {
      if (gastoSexo === 'masculino') {
        tmb = (10 * p) + (6.25 * a) - (5 * i) + 5;
      } else {
        tmb = (10 * p) + (6.25 * a) - (5 * i) - 161;
      }
    } else if (gastoFormula === 'harris') {
      if (gastoSexo === 'masculino') {
        tmb = 88.362 + (13.397 * p) + (4.799 * a) - (5.677 * i);
      } else {
        tmb = 447.593 + (9.247 * p) + (3.098 * a) - (4.330 * i);
      }
    } else if (gastoFormula === 'fao') {
      if (gastoSexo === 'masculino') {
        if (i >= 18 && i <= 30) tmb = (15.3 * p) + 679;
        else if (i > 30 && i <= 60) tmb = (11.6 * p) + 879;
        else tmb = (13.5 * p) + 487;
      } else {
        if (i >= 18 && i <= 30) tmb = (14.7 * p) + 496;
        else if (i > 30 && i <= 60) tmb = (8.7 * p) + 829;
        else tmb = (10.5 * p) + 596;
      }
    }

    const tdee = tmb * parseFloat(gastoAtividade);
    
    setResultadoGasto({
      tmb: Math.round(tmb),
      tdee: Math.round(tdee)
    });
  };

  const calcularImc = () => {
    if (!peso || !altura) return;
    const p = parseFloat(peso);
    const a = parseFloat(altura) / 100;
    const imc = (p / (a * a)).toFixed(1);
    
    let classificacao = '';
    
    // Simplification for classification adjusting slightly by age/sex for visual effect
    if (imc < 18.5) classificacao = 'Abaixo do peso';
    else if (imc < 25) classificacao = 'Peso normal';
    else if (imc < 30) classificacao = 'Sobrepeso';
    else classificacao = 'Obesidade';
    
    if (idade && parseInt(idade) > 65) {
      if (imc < 22) classificacao = 'Abaixo do peso (Idoso)';
      else if (imc < 27) classificacao = 'Peso adequado (Idoso)';
      else classificacao = 'Sobrepeso (Idoso)';
    }

    setResultadoImc({ valor: imc, classificacao, sexoFormatado: sexo === 'feminino' ? 'Feminino' : 'Masculino' });
  };

  const calcularHidratacao = () => {
    if (!hidroPeso || !hidroIdade) return;
    const p = parseFloat(hidroPeso);
    const i = parseInt(hidroIdade);
    const act = parseFloat(hidroAtividade) || 0;
    
    let baseFator = 35;
    if (i >= 55 && i <= 65) baseFator = 30;
    else if (i > 65) baseFator = 25;
    
    let totalMl = p * baseFator;
    totalMl += (act / 30) * 350;
    
    if (hidroFator === 'gestacao') {
      totalMl += 300;
    } else if (hidroFator === 'lactacao') {
      totalMl += 700;
    }
    
    if (hidroClima === 'quente') {
      totalMl += 500;
    } else if (hidroClima === 'muito_quente') {
      totalMl += 1000;
    }
    
    const finalMl = Math.round(totalMl);
    const finalLitros = (finalMl / 1000).toFixed(2);
    const copos250 = Math.round(finalMl / 250);
    
    const manha = Math.round(finalMl * 0.40);
    const tarde = Math.round(finalMl * 0.40);
    const noite = Math.round(finalMl * 0.20);
    
    setResultadoHidro({
      ml: finalMl,
      litros: finalLitros,
      copos: copos250,
      distribuicao: {
        manha,
        tarde,
        noite
      }
    });
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileName = file.name;
      setExameNome(fileName);
      setExameStatus('analyzing');
      setExameResultado(null);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch('/api/analise-exame', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: fileName,
              fileType: file.type
            })
          });
          
          const result = await response.json();
          if (response.ok) {
            setExameStatus('done');
            setExameResultado({
              summary: result.summary,
              details: result.details,
              date: new Date().toLocaleDateString('pt-BR')
            });
          } else {
            throw new Error(result.error || 'Erro na análise');
          }
        } catch (error) {
          console.error("Erro ao analisar exame:", error);
          setExameStatus('idle');
          alert("Erro ao analisar o exame: " + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // TACO / TBCA Filtered results (already filtered by backend)
  const alimentosFiltrados = tacoData.slice(0, 15);

  // Meal search results — independent state, no cross-contamination with general search
  const mealAlimentosFiltrados = mealSearchResults.slice(0, 8);

  // Substitution search results — independent state
  const subAlimentosFiltrados = subSearchResults.slice(0, 8);

  // Safe number parser: handles NA, *, Tr, empty strings, etc.
  const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  const handleAddToMeal = (item, mealId) => {
    const newItem = {
      description: item.description,
      base_kcal: safeNum(item.energy_kcal),
      base_carb: safeNum(item.carbohydrate_g),
      base_prot: safeNum(item.protein_g),
      base_fat: safeNum(item.lipid_g),
      amount_g: 100, // default 100g
      unit: 'g',
      substitutions: []
    };
    setMeals(meals.map(m => m.id === mealId ? { ...m, items: [...m.items, newItem] } : m));
    setAddingToMealId(null);
    setMealSearchTerm('');
  };

  const handleAddSubstitution = (mealId, itemIndex, item) => {
    const newSub = {
      description: item.description,
      base_kcal: safeNum(item.energy_kcal),
      base_carb: safeNum(item.carbohydrate_g),
      base_prot: safeNum(item.protein_g),
      base_fat: safeNum(item.lipid_g),
      amount_g: 100,
      unit: 'g'
    };
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const newItems = [...m.items];
        const mainItem = newItems[itemIndex];
        const subs = mainItem.substitutions || [];
        newItems[itemIndex] = { ...mainItem, substitutions: [...subs, newSub] };
        return { ...m, items: newItems };
      }
      return m;
    }));
    setAddingSubToItem(null);
    setSubSearchTerm('');
  };

  const handleRemoveSubstitution = (mealId, itemIndex, subIndex) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const newItems = [...m.items];
        const mainItem = newItems[itemIndex];
        const subs = (mainItem.substitutions || []).filter((_, idx) => idx !== subIndex);
        newItems[itemIndex] = { ...mainItem, substitutions: subs };
        return { ...m, items: newItems };
      }
      return m;
    }));
  };

  const handleUpdateSubstitutionAmount = (mealId, itemIndex, subIndex, newAmount) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const newItems = [...m.items];
        const mainItem = newItems[itemIndex];
        const subs = [...(mainItem.substitutions || [])];
        subs[subIndex] = { ...subs[subIndex], amount_g: Number(newAmount) || 0 };
        newItems[itemIndex] = { ...mainItem, substitutions: subs };
        return { ...m, items: newItems };
      }
      return m;
    }));
  };

  const handleUpdateSubstitutionUnit = (mealId, itemIndex, subIndex, newUnit) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const newItems = [...m.items];
        const mainItem = newItems[itemIndex];
        const subs = [...(mainItem.substitutions || [])];
        let amount = subs[subIndex].amount_g;
        const unitW = getUnitWeight(subs[subIndex].description);
        if (newUnit === 'un' && subs[subIndex].unit !== 'un') {
          amount = Math.round(amount / unitW) || 1;
        } else if (newUnit !== 'un' && subs[subIndex].unit === 'un') {
          amount = amount * unitW;
        }
        subs[subIndex] = { ...subs[subIndex], unit: newUnit, amount_g: amount };
        newItems[itemIndex] = { ...mainItem, substitutions: subs };
        return { ...m, items: newItems };
      }
      return m;
    }));
  };

  const handleUpdateItemAmount = (mealId, itemIndex, newAmount) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const newItems = [...m.items];
        newItems[itemIndex] = { ...newItems[itemIndex], amount_g: Number(newAmount) || 0 };
        return { ...m, items: newItems };
      }
      return m;
    }));
  };

  const handleUpdateItemUnit = (mealId, itemIndex, newUnit) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const newItems = [...m.items];
        const currentItem = newItems[itemIndex];
        const currentUnit = currentItem.unit || 'g';
        let amount = currentItem.amount_g;

        const discreteUnits = ['un', 'colher', 'concha'];
        const wasDiscrete = discreteUnits.includes(currentUnit);
        const isDiscrete = discreteUnits.includes(newUnit);

        if (wasDiscrete && !isDiscrete) {
          // Convert count → grams
          amount = Math.round(amount * getServingWeight(currentItem.description, currentUnit));
        } else if (!wasDiscrete && isDiscrete) {
          // Convert grams → count
          const servW = getServingWeight(currentItem.description, newUnit);
          amount = Math.max(1, Math.round(amount / servW));
        } else if (wasDiscrete && isDiscrete && currentUnit !== newUnit) {
          // Convert between discrete units (e.g. colher → concha)
          const gramsNow = amount * getServingWeight(currentItem.description, currentUnit);
          amount = Math.max(1, Math.round(gramsNow / getServingWeight(currentItem.description, newUnit)));
        }

        newItems[itemIndex] = { ...currentItem, unit: newUnit, amount_g: amount };
        return { ...m, items: newItems };
      }
      return m;
    }));
  };

  const handleRemoveFromMeal = (mealId, itemIndex) => {
    setMeals(meals.map(m => m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== itemIndex) } : m));
  };
  
  const handleUpdateMeal = (mealId, field, value) => {
    setMeals(meals.map(m => m.id === mealId ? { ...m, [field]: value } : m));
  };

  const handleMoveMeal = (index, direction) => {
    setMeals(prev => {
      const next = [...prev];
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= next.length) return next;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };
  
  // ── Save / Load Diet Plans ──────────────────────────────────────────────────
  const saveDietPlan = async () => {
    setSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus('error'); return; }

      const payload = {
        user_id: user.id,
        plan_name: planName.trim() || `Plano ${new Date().toLocaleDateString('pt-BR')}`,
        patient_name: patientName,
        diet_notes: dietNotes,
        meals: meals.map(m => ({ ...m, _showNotes: undefined })), // strip UI-only field
        macros,
      };

      let error;
      if (currentPlanId) {
        ({ error } = await supabase.from('diet_plans').update(payload).eq('id', currentPlanId));
      } else {
        const { data, error: insertError } = await supabase.from('diet_plans').insert(payload).select('id').single();
        error = insertError;
        if (data) setCurrentPlanId(data.id);
      }

      if (error) throw error;
      setSaveStatus('saved');
      
      // Refresh the saved plans list in memory so the new name/patient shows up instantly
      loadDietPlans();
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Erro ao salvar plano:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const loadDietPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('diet_plans')
        .select('id, plan_name, patient_name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setSavedPlans(data || []);
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadPlan = async (planId) => {
    try {
      const { data, error } = await supabase.from('diet_plans').select('*').eq('id', planId).single();
      if (error) throw error;
      setPlanName(data.plan_name || '');
      setPatientName(data.patient_name || '');
      setDietNotes(data.diet_notes || '');
      setMeals(data.meals || []);
      if (data.macros) setMacros(data.macros);
      setPatientChat(data.patient_chat || []);
      setCurrentPlanId(data.id);
      setShowSavedPlans(false);
    } catch (e) {
      console.error('Erro ao abrir plano:', e);
    }
  };

  const deletePlan = async (planId, e) => {
    e.stopPropagation();
    if (!confirm('Excluir este plano? Esta ação é irreversível.')) return;
    try {
      await supabase.from('diet_plans').delete().eq('id', planId);
      setSavedPlans(prev => prev.filter(p => p.id !== planId));
      if (currentPlanId === planId) setCurrentPlanId(null);
    } catch (e) {
      console.error('Erro ao excluir plano:', e);
    }
  };

  const newPlan = () => {
    if (!confirm('Criar um novo plano? O plano atual não salvo será perdido.')) return;
    setPlanName('');
    setPatientName('');
    setDietNotes('');
    setMeals([
      { id: 1, name: 'CAFÉ DA MANHÃ', time: '08:00', items: [], notes: '' },
      { id: 2, name: 'ALMOÇO', time: '12:30', items: [], notes: '' }
    ]);
    setPatientChat([]);
    setCurrentPlanId(null);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const addMeal = () => {
    setMeals([...meals, { id: Date.now(), name: 'NOVA REFEIÇÃO', time: '16:00', items: [], notes: '' }]);
  };

  const handleMacroChange = (field, value) => {
    let numValue = parseInt(value) || 0;
    if (numValue > 100) numValue = 100;
    if (numValue < 0) numValue = 0;

    const remaining = 100 - numValue;
    const otherFields = Object.keys(macros).filter(k => k !== field);
    const sumOthers = macros[otherFields[0]] + macros[otherFields[1]];

    let newMacros = { ...macros, [field]: numValue };

    if (sumOthers > 0) {
      newMacros[otherFields[0]] = Math.round(remaining * (macros[otherFields[0]] / sumOthers));
      newMacros[otherFields[1]] = remaining - newMacros[otherFields[0]]; // Adjust remaining purely to otherFields[1] to ensure sum is exactly 100
    } else {
      newMacros[otherFields[0]] = Math.floor(remaining / 2);
      newMacros[otherFields[1]] = remaining - newMacros[otherFields[0]];
    }

    setMacros(newMacros);
  };

  const calculateMealTotals = (meal) => {
    return meal.items.reduce((acc, item) => {
      const isDiscrete = item.unit === 'un' || item.unit === 'colher' || item.unit === 'concha';
      const servW = isDiscrete ? getServingWeight(item.description, item.unit) : 1;
      const mult = isDiscrete ? ((item.amount_g || 0) * servW / 100) : ((item.amount_g || 0) / 100);
      acc.kcal += (item.base_kcal || item.kcal || 0) * mult;
      acc.carb += (item.base_carb || item.carb || 0) * mult;
      acc.prot += (item.base_prot || item.prot || 0) * mult;
      acc.fat += (item.base_fat || item.fat || 0) * mult;
      return acc;
    }, { kcal: 0, carb: 0, prot: 0, fat: 0 });
  };

  const dietTotals = meals.reduce((acc, meal) => {
    const mt = calculateMealTotals(meal);
    acc.kcal += mt.kcal;
    acc.carb += mt.carb;
    acc.prot += mt.prot;
    acc.fat += mt.fat;
    return acc;
  }, { kcal: 0, carb: 0, prot: 0, fat: 0 });

  const totalMacroKcal = (dietTotals.carb * 4) + (dietTotals.prot * 4) + (dietTotals.fat * 9);
  const dietPercentages = {
    carb: totalMacroKcal > 0 ? Math.round(((dietTotals.carb * 4) / totalMacroKcal) * 100) : 0,
    prot: totalMacroKcal > 0 ? Math.round(((dietTotals.prot * 4) / totalMacroKcal) * 100) : 0,
    fat: totalMacroKcal > 0 ? Math.round(((dietTotals.fat * 9) / totalMacroKcal) * 100) : 0,
  };

  if (loading) return null;

  const isPremium = userProfile?.plan?.toLowerCase() === 'ultra' || userProfile?.plan?.toLowerCase() === 'admin';

  const workspaceSubtitle = `personal-${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-DM...`;

  // Calculate Terapia Nutricional Simulator values reactively
  let simProteinaGramas = 0.8;
  let simConduta = '';

  if (simDiagnostico === 'renal') {
    simProteinaGramas = 0.6;
    simConduta = 'Restrição proteica severa (IRC Conservador - evitar sobrecarga renal)';
  } else if (simDiagnostico === 'diabetes') {
    simProteinaGramas = 1.0;
    simConduta = 'Estabilização de glicemia (baixo índice glicêmico & fibras)';
  } else if (simDiagnostico === 'hepática') {
    simProteinaGramas = 1.2;
    simConduta = 'Prevenção de catabolismo proteico em cirrose hepática compensada';
  } else if (simDiagnostico === 'sarcopenia') {
    simProteinaGramas = 1.5;
    simConduta = 'Aporte proteico elevado para prevenção e tratamento de sarcopenia (ESPEN 2018)';
  } else if (simDiagnostico === 'obesidade') {
    simProteinaGramas = 1.3;
    simConduta = 'Déficit calórico estratégico com preservação de massa magra';
  } else if (simDiagnostico === 'manutencao') {
    simProteinaGramas = 1.0;
    simConduta = 'Ingestão proteica para manutenção do peso e composição corporal estável';
  } else if (simDiagnostico === 'hipercolesterolemia') {
    simProteinaGramas = 1.0;
    simConduta = 'Redução de gordura saturada, aumento de fibras solúveis e fitosteróis (AHA/EAS)';
  } else if (simDiagnostico === 'hipertrigliceridemia') {
    simProteinaGramas = 1.0;
    simConduta = 'Restrição de carboidratos simples, álcool e gorduras saturadas — ômega-3 indicado';
  } else if (simDiagnostico === 'cardíaca') {
    simProteinaGramas = 1.1;
    simConduta = 'Restrição de sódio (<2g/dia), dieta DASH e controle hídrico (IC - ESPEN/ESC)';
  } else if (simDiagnostico === 'celíaca') {
    simProteinaGramas = 1.0;
    simConduta = 'Dieta 100% isenta de glúten — recuperação da mucosa intestinal e reposição nutricional';
  } else if (simDiagnostico === 'lactose') {
    simProteinaGramas = 1.0;
    simConduta = 'Restrição de lactose com substituição de fontes de cálcio e vitamina D';
  }

  const simTotalProteina = (simPeso * simProteinaGramas).toFixed(1);

  // Calculate Fat Simulator values reactively
  let simGorduraPct = 25; // % do VET
  let simGorduraConduta = '';
  let simGorduraTipo = '';

  if (simFatDiagnostico === 'renal') {
    simGorduraPct = 30;
    simGorduraTipo = 'AGM e AGPI prioritários';
    simGorduraConduta = 'Gordura normal-alta para atingir VET; limitar AGS por risco cardiovascular elevado (KDOQI)';
  } else if (simFatDiagnostico === 'diabetes') {
    simGorduraPct = 30;
    simGorduraTipo = 'AGM/AGPI; AGS <7% VET';
    simGorduraConduta = 'Priorizar ácidos graxos monoinsaturados (azeite) e poli-insaturados; restringir saturados e excluir trans';
  } else if (simFatDiagnostico === 'hepática') {
    simGorduraPct = 30;
    simGorduraTipo = 'Gordura normal; TCM se esteatorreia';
    simGorduraConduta = 'Manter aporte lipídico normal (25-35% VET); TCM indicado se má-absorção ou colestase (ESPEN)';
  } else if (simFatDiagnostico === 'sarcopenia') {
    simGorduraPct = 28;
    simGorduraTipo = 'Sem restrição específica';
    simGorduraConduta = 'Aporte lipídico adequado para garantir densidade energética e absorção de vitaminas lipossolúveis (ESPEN 2018)';
  } else if (simFatDiagnostico === 'obesidade') {
    simGorduraPct = 25;
    simGorduraTipo = 'Reduzir AGS; priorizar AGPI';
    simGorduraConduta = 'Redução moderada do aporte de gordura, priorizando qualidade (AGM/AGPI); eliminar trans';
  } else if (simFatDiagnostico === 'manutencao') {
    simGorduraPct = 28;
    simGorduraTipo = 'Equilibrado';
    simGorduraConduta = 'Distribuição equilibrada de gorduras; priorizar fontes de qualidade (azeite, ovo, castanhas)';
  } else if (simFatDiagnostico === 'hipercolesterolemia') {
    simGorduraPct = 30;
    simGorduraTipo = 'AGS <7% VET; trans excluído';
    simGorduraConduta = 'AGS <7% VET, trans excluído, fitosterol 2g/dia (↓~10% LDL), fibras solúveis aumentadas (AHA/EAS 2020)';
  } else if (simFatDiagnostico === 'hipertrigliceridemia') {
    simGorduraPct = 28;
    simGorduraTipo = 'AGS <5% VET; ômega-3 indicado';
    simGorduraConduta = 'Restrição de AGS (<5% VET), excluir trans; ômega-3 >2g/dia em TG >500 mg/dL (GNUT/AHA)';
  } else if (simFatDiagnostico === 'cardíaca') {
    simGorduraPct = 32;
    simGorduraTipo = 'AGM/AGPI; AGS restrito';
    simGorduraConduta = '30-35% VET priorizando AGM e AGPI; ômega-3 1g/dia pode reduzir mortalidade cardiovascular (Arq Bras Cardiol 2017)';
  } else if (simFatDiagnostico === 'celíaca') {
    simGorduraPct = 28;
    simGorduraTipo = 'Normal após excluir glúten';
    simGorduraConduta = 'Aporte lipídico normal; atenção a vitaminas lipossolúveis (A, D, E, K) em fase de recuperação da mucosa';
  } else if (simFatDiagnostico === 'lactose') {
    simGorduraPct = 28;
    simGorduraTipo = 'Evitar laticínios integrais';
    simGorduraConduta = 'Substituir laticínios convencionais por versões sem lactose ou vegetais; garantir cálcio e vitamina D adequados';
  }

  const simGorduraTotalG = ((simCaloriasRef * (simGorduraPct / 100)) / 9).toFixed(1);

  return (
    <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white">

      {/* Mobile Overlay (hidden by default) */}
<div id="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} className={`fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}></div>

{/* SideNavBar Component */}
<nav id="sidebar-nav"
    className={`h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50 transform md:translate-x-0 transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Header */}
          <a href="/home" className="px-6 py-4 mb-4 flex items-center justify-center cursor-pointer decoration-none">
              <img src="/logo-horizontal.svg" alt="Amora Logo" className="w-32 h-auto object-contain dark:invert" />
          </a>
          
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-2 space-y-6">
              {/* Section 1 */}
              <div>
                  <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Aprender</p>
                  <div className="space-y-1">
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/home">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <span className="font-label-md text-sm">Amora</span>
                      </a>
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors" href="/recursos">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M12 11v-4"></path></svg>
                          <span className="font-label-md text-sm">Recursos Profissionais</span>
                      </a>
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/pacientes">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          <span className="font-label-md text-sm">Pacientes</span>
                      </a>
                  </div>
              </div>

              {/* Section 3 */}
              <div>
                  <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Ajustes</p>
                  <div className="space-y-1">
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/configuracao">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                          <span className="font-label-md text-sm">Configuração</span>
                      </a>
                  </div>
              </div>
          </div>
          
          {/* Footer */}
          <div className="px-4 pt-4 border-t border-gray-200 dark:border-[#27272A] space-y-4">
              <div className="px-2">
                  {userProfile?.plan?.toLowerCase() === 'admin' ? (
                      <span className="inline-block px-2.5 py-1 rounded bg-amber-500 text-black font-label-sm text-xs shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-400 font-bold uppercase tracking-wider animate-pulse">ADM</span>
                  ) : userProfile?.plan?.toLowerCase() === 'ultra' ? (
                      <span className="inline-block px-2 py-1 rounded bg-blue-600 text-white font-label-sm text-xs shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400 dark:border-blue-500">Ultra Plan</span>
                  ) : userProfile?.plan?.toLowerCase() === 'premium' ? (
                      <span className="inline-block px-2 py-1 rounded bg-purple-600 text-white font-label-sm text-xs shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400 dark:border-purple-500">Premium Plan</span>
                  ) : (
                      <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs">Free Plan</span>
                  )}
              </div>
              <div onClick={() => window.location.href='/configuracao'} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative">
                      <img alt={userProfile.name} className="w-full h-full object-cover" src={userProfile.avatar}/>
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <p className="font-label-md text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile.name}</p>
                      <p className="font-label-sm text-xs text-gray-500 truncate">{userProfile.email}</p>
                  </div>
                  <svg className="text-gray-400 dark:text-gray-500 shrink-0" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>
              </div>
              
              {/* Sign Out Button */}
              <button onClick={handleSignOut} className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  <span className="font-label-md text-sm font-medium">Sair da conta</span>
              </button>
          </div>
      </nav>

      {/* Main Content Canvas */}
<main className="md:ml-64 flex-1 flex flex-col w-full md:w-auto min-h-screen relative overflow-x-hidden bg-[#F9FAFB] dark:bg-[#0A0A0B]">
    {/* Mobile Header / Hamburger Menu */}
    <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272A] bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
            <button id="btn-hamburger" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} aria-label="Abrir menu" className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg aria-hidden="true" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M4 12h16M4 6h16M4 18h16"></path></svg>
            </button>
            <img src="/logo-horizontal.svg" alt="Amora Logo" width="128" height="32" className="h-8 w-auto object-contain dark:invert" />
        </div>
    </div>

    {/* Ambient Background Pattern */}
    <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: "radial-gradient(var(--tw-colors-purple-500) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
    
    <div className="relative z-10 pt-8 pb-12 px-8 max-w-[1280px] mx-auto w-full">
        {/* Hero Header */}
        <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
        <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">Dashboard</span>
        <span className="material-symbols-outlined text-[10px] opacity-40">chevron_right</span>
        <span className="text-gray-500 text-xs">Recursos Profissionais</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Recursos Profissionais</h2>
        <p className="text-base text-gray-500 max-w-2xl mt-2">Ferramentas clínicas e calculadoras nutricionais para o seu dia a dia.</p>
        </div>

        {/* 2x2 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Calculadora de IMC */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 group shadow-sm relative overflow-hidden">
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#18181B]/95 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                <span className="material-symbols-outlined font-bold text-2xl">lock</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Calculadora de IMC</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] mb-4">
                Calcule o Índice de Massa Corporal de forma rápida e profissional.
              </p>
              <a 
                href="/configuracao"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                <span>Desbloquear com Plano Ultra</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-700 dark:text-purple-400">
          <span className="material-symbols-outlined">calculate</span>
          </div>
          <div>
          <h3 className="text-sm font-bold dark:text-white">Calculadora de IMC</h3>
          <p className="text-xs text-gray-500">Índice de Massa Corporal</p>
          </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Idade</label>
              <input 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all dark:text-white" 
                placeholder="Ex: 30" type="number"
                value={idade} onChange={(e) => setIdade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Sexo biológico</label>
              <select 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all dark:text-white"
                value={sexo} onChange={(e) => setSexo(e.target.value)}
              >
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Peso (kg)</label>
              <input 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all dark:text-white" 
                placeholder="70.0" type="number"
                value={peso} onChange={(e) => setPeso(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Altura (cm)</label>
              <input 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none transition-all dark:text-white" 
                placeholder="175" type="number"
                value={altura} onChange={(e) => setAltura(e.target.value)}
              />
            </div>
          </div>

          {resultadoImc && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
               <div>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Seu IMC</p>
                 <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{resultadoImc.valor} kg/m²</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-gray-500 dark:text-gray-400">Classificação</p>
                 <p className="text-sm font-semibold text-gray-900 dark:text-white">{resultadoImc.classificacao}</p>
               </div>
            </div>
          )}

          <button onClick={calcularImc} className="w-full bg-purple-700 text-white py-3 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-auto">
          <span>Calcular IMC</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </section>

        {/* Card 2: Tabela TACO */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 shadow-sm relative overflow-hidden">
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#18181B]/95 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                <span className="material-symbols-outlined font-bold text-2xl">lock</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Tabela TACO</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] mb-4">
                Consulte a composição oficial de mais de 2.000 alimentos reais.
              </p>
              <a 
                href="/configuracao"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                <span>Desbloquear com Plano Ultra</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <span className="material-symbols-outlined">nutrition</span>
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white">Tabela {activeDb.toUpperCase()}</h3>
              <p className="text-xs text-gray-500">
                {activeDb === 'taco' ? 'Composição de Alimentos (Real)' : 'Tabela Brasileira de Composição de Alimentos'}
              </p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-[#27272A] rounded-lg p-0.5 border border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => setActiveDb('taco')} 
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeDb === 'taco' ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              TACO
            </button>
            <button 
              onClick={() => setActiveDb('tbca')} 
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeDb === 'tbca' ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              TBCA
            </button>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">search</span>
        <input 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg focus:ring-2 focus:ring-purple-700 outline-none text-sm dark:text-white" 
          placeholder="Buscar alimento..." 
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
        </div>
        <select value={tacoPorcao} onChange={(e)=>setTacoPorcao(e.target.value)} className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 text-sm outline-none dark:text-white">
        <option value="100g">100g</option>
        <option value="50g">50g</option>
        </select>
        </div>
        <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-[#27272A] min-h-[150px] max-h-[250px]">
        <table className="w-full text-left text-sm dark:text-white">
        <thead className="bg-gray-50 dark:bg-[#27272A] text-gray-500 text-xs sticky top-0">
        <tr>
        <th className="p-2 font-medium">Alimento</th>
        <th className="p-2 font-medium">Kcal</th>
        <th className="p-2 font-medium">Prot</th>
        <th className="p-2 font-medium">Carb</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-[#27272A]">
          {alimentosFiltrados.map((item, idx) => {
            const multiplier = tacoPorcao === '50g' ? 0.5 : 1;
            const kcal = item.energy_kcal !== "NA" ? (parseFloat(item.energy_kcal) * multiplier).toFixed(0) : "-";
            const prot = item.protein_g !== "NA" ? (parseFloat(item.protein_g) * multiplier).toFixed(1) : "-";
            const carb = item.carbohydrate_g !== "NA" ? (parseFloat(item.carbohydrate_g) * multiplier).toFixed(1) : "-";

            return (
              <tr key={idx} className="hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                <td className="p-2 truncate max-w-[120px]" title={item.description}>{item.description}</td>
                <td className="p-2 font-bold">{kcal}</td>
                <td className="p-2 text-gray-500">{prot}g</td>
                <td className="p-2 text-gray-500">{carb}g</td>
              </tr>
            )
          })}
          {alimentosFiltrados.length === 0 && (
            <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum alimento encontrado.</td></tr>
          )}
        </tbody>
        </table>
        </div>
        </section>


        {/* Card 5: Calculadora de Gasto Energético */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 group shadow-sm md:col-span-2 relative overflow-hidden">
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#18181B]/95 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                <span className="material-symbols-outlined font-bold text-2xl">lock</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Calculadora de Gasto Energético</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[300px] mb-4">
                Calcule a Taxa Metabólica Basal (TMB) e o Gasto Energético Total Diário (TDEE) com as fórmulas Mifflin, Harris-Benedict e FAO/OMS.
              </p>
              <a 
                href="/configuracao"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                <span>Desbloquear com Plano Ultra</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          )}
           <div className="flex items-center gap-4 mb-6">
             <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-700 dark:text-red-400">
               <span className="material-symbols-outlined">local_fire_department</span>
             </div>
             <div>
               <h3 className="text-sm font-bold dark:text-white">Calculadora de Gasto Energético</h3>
               <p className="text-xs text-gray-500">TMB e Gasto Total (TDEE)</p>
             </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
             <div className="space-y-2">
               <label className="text-xs text-gray-500">Idade</label>
               <input 
                 className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white" 
                 type="number" value={gastoIdade} onChange={(e) => setGastoIdade(e.target.value)} 
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs text-gray-500">Sexo biológico</label>
               <select 
                 className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white" 
                 value={gastoSexo} onChange={(e) => setGastoSexo(e.target.value)}
               >
                 <option value="feminino">Feminino</option>
                 <option value="masculino">Masculino</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-xs text-gray-500">Peso (kg)</label>
               <input 
                 className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white" 
                 type="number" value={gastoPeso} onChange={(e) => setGastoPeso(e.target.value)} 
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs text-gray-500">Altura (cm)</label>
               <input 
                 className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white" 
                 type="number" value={gastoAltura} onChange={(e) => setGastoAltura(e.target.value)} 
               />
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div className="space-y-2">
               <label className="text-xs text-gray-500">Fórmula</label>
               <select 
                 className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white" 
                 value={gastoFormula} onChange={(e) => setGastoFormula(e.target.value)}
               >
                 <option value="mifflin">Mifflin-St Jeor (Mais precisa)</option>
                 <option value="harris">Harris-Benedict</option>
                 <option value="fao">FAO/OMS</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-xs text-gray-500">Nível de Atividade</label>
               <select 
                 className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white" 
                 value={gastoAtividade} onChange={(e) => setGastoAtividade(e.target.value)}
               >
                 <option value="1.2">Sedentário (pouco/nenhum exercício)</option>
                 <option value="1.375">Levemente ativo (exercício 1-3 dias/sem)</option>
                 <option value="1.55">Moderadamente ativo (exercício 3-5 dias/sem)</option>
                 <option value="1.725">Muito ativo (exercício 6-7 dias/sem)</option>
                 <option value="1.9">Extremamente ativo (físico/treino 2x/dia)</option>
               </select>
             </div>
           </div>

           {resultadoGasto && (
             <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 flex justify-around items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Taxa Metabólica Basal (TMB)</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{resultadoGasto.tmb} kcal</p>
                </div>
                <div className="w-px h-8 bg-red-200 dark:bg-red-900/30"></div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gasto Energético Total (TDEE)</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{resultadoGasto.tdee} kcal</p>
                </div>
             </div>
           )}

           <button onClick={calcularGasto} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-auto">
             <span>Calcular Gasto Energético</span>
             <span className="material-symbols-outlined text-sm">arrow_forward</span>
           </button>
        </section>

        {/* Card 5b: Calculadora de METs (Múltiplos Metabólicos) */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col justify-between transition-all hover:border-purple-500/50 group shadow-sm md:col-span-2">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-700 dark:text-purple-400">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Calculadora de Gasto por METs</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      NOVO • +80 Atividades
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Múltiplos de Equivalentes Metabólicos (Ainsworth / Nutritotal)</p>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
              Estime com precisão o gasto calórico de caminhadas, corridas, musculação, natação, lutas e rotinas diárias com cálculo da taxa por minuto, consumo de oxigênio (VO₂) e somatório de atividades do paciente.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Fórmula</p>
                <p className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 font-mono mt-0.5">MET × kg × h</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Base</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5">+80 Atividades</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Métricas</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5">Kcal/min & VO₂</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Modo</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5">Rotina Diária</p>
              </div>
            </div>
          </div>

          <a
            href="/recursos/mets"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm text-xs sm:text-sm"
          >
            <span>Abrir Calculadora Completa de METs</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </section>

        {/* Card 6: Simulador de Terapia Nutricional */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 group shadow-sm relative overflow-hidden">
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#18181B]/95 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                <span className="material-symbols-outlined font-bold text-2xl">lock</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Simulador de Terapia Nutricional</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[300px] mb-4">
                Simule metas proteicas recomendadas e condutas direcionadas baseadas no diagnóstico e peso atual.
              </p>
              <a 
                href="/configuracao"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                <span>Desbloquear com Plano Ultra</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-700 dark:text-purple-400">
              <span className="material-symbols-outlined">biotech</span>
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white">Simulador de Terapia Nutricional</h3>
              <p className="text-xs text-gray-500">Conduta Direcionada e Meta Proteica</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-[#0A0A0B] p-4 rounded-xl border border-gray-100 dark:border-[#27272A]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Meta Proteica Recomendada</span>
              <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-1">{simProteinaGramas} g/kg ({simTotalProteina}g total)</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#0A0A0B] p-4 rounded-xl border border-gray-100 dark:border-[#27272A]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Conduta Direcionada</span>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mt-1">{simConduta}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <label className="block text-xs font-bold text-gray-500">Selecione o Diagnóstico / Patologia</label>
            <select 
              value={simDiagnostico} 
              onChange={(e) => setSimDiagnostico(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 text-sm outline-none dark:text-white"
            >
              <option value="renal">Insuficiência Renal Crônica (Conservador)</option>
              <option value="diabetes">Diabetes Mellitus</option>
              <option value="hepática">Cirrose Hepática</option>
              <option value="sarcopenia">Sarcopenia (Diretrizes ESPEN)</option>
              <option value="obesidade">Obesidade (Preservação de Massa Magra)</option>
              <option value="manutencao">Manutenção de Peso</option>
              <option value="hipercolesterolemia">Hipercolesterolemia</option>
              <option value="hipertrigliceridemia">Hipertrigliceridemia</option>
              <option value="cardíaca">Insuficiência Cardíaca</option>
              <option value="celíaca">Doença Celíaca</option>
              <option value="lactose">Intolerância à Lactose</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Peso Corporal Atual</span>
              <span className="font-bold text-gray-800 dark:text-white">{simPeso} kg</span>
            </div>
            <input 
              type="range" 
              min="40" 
              max="150" 
              value={simPeso} 
              onChange={(e) => setSimPeso(Number(e.target.value))} 
              className="w-full accent-purple-700" 
            />
          </div>
        </section>

        {/* Card 6b: Simulador de Gorduras */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-yellow-500/50 group shadow-sm relative overflow-hidden">
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#18181B]/95 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                <span className="material-symbols-outlined font-bold text-2xl">lock</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Simulador de Gorduras</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[300px] mb-4">
                Simule a meta lipídica recomendada e a conduta direcionada baseada no diagnóstico e ingestão calórica.
              </p>
              <a 
                href="/configuracao"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                <span>Desbloquear com Plano Ultra</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-700 dark:text-yellow-400">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white">Simulador de Gorduras</h3>
              <p className="text-xs text-gray-500">Meta Lipídica e Conduta Direcionada</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-[#0A0A0B] p-4 rounded-xl border border-gray-100 dark:border-[#27272A]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">% VET Recomendada</span>
              <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-1">{simGorduraPct}% do VET</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#0A0A0B] p-4 rounded-xl border border-gray-100 dark:border-[#27272A]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total em Gramas</span>
              <p className="text-base sm:text-lg font-black text-yellow-700 dark:text-yellow-400 mt-1">~{simGorduraTotalG}g/dia</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#0A0A0B] p-4 rounded-xl border border-gray-100 dark:border-[#27272A]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Tipo Prioritário</span>
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mt-1">{simGorduraTipo}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#0A0A0B] p-4 rounded-xl border border-gray-100 dark:border-[#27272A] mb-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Conduta Direcionada</span>
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-500 mt-1">{simGorduraConduta}</p>
          </div>

          <div className="space-y-4 mb-6">
            <label className="block text-xs font-bold text-gray-500">Selecione o Diagnóstico / Patologia</label>
            <select 
              value={simFatDiagnostico} 
              onChange={(e) => setSimFatDiagnostico(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 text-sm outline-none dark:text-white"
            >
              <option value="renal">Insuficiência Renal Crônica (Conservador)</option>
              <option value="diabetes">Diabetes Mellitus</option>
              <option value="hepática">Cirrose Hepática</option>
              <option value="sarcopenia">Sarcopenia (Diretrizes ESPEN)</option>
              <option value="obesidade">Obesidade (Preservação de Massa Magra)</option>
              <option value="manutencao">Manutenção de Peso</option>
              <option value="hipercolesterolemia">Hipercolesterolemia</option>
              <option value="hipertrigliceridemia">Hipertrigliceridemia</option>
              <option value="cardíaca">Insuficiência Cardíaca</option>
              <option value="celíaca">Doença Celíaca</option>
              <option value="lactose">Intolerância à Lactose</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Ingestão Calórica de Referência (VET)</span>
              <span className="font-bold text-gray-800 dark:text-white">{simCaloriasRef} kcal</span>
            </div>
            <input 
              type="range" 
              min="1200" 
              max="4000"
              step="50"
              value={simCaloriasRef} 
              onChange={(e) => setSimCaloriasRef(Number(e.target.value))} 
              className="w-full accent-yellow-500" 
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1200 kcal</span>
              <span>4000 kcal</span>
            </div>
          </div>
        </section>

        {/* Card 7: Calculadora de Hidratação */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 group shadow-sm relative overflow-hidden">
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#18181B]/95 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                <span className="material-symbols-outlined font-bold text-2xl">lock</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Calculadora de Hidratação</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[300px] mb-4">
                Calcule a necessidade de ingestão de água diária com base em idade, peso, clima e atividade física.
              </p>
              <a 
                href="/configuracao"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                <span>Desbloquear com Plano Ultra</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white">Calculadora de Hidratação</h3>
              <p className="text-xs text-gray-500">Diretrizes Acadêmicas e Clínicas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Idade</label>
              <input 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
                placeholder="Ex: 30" type="number"
                value={hidroIdade} onChange={(e) => setHidroIdade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Peso (kg)</label>
              <input 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
                placeholder="Ex: 70" type="number"
                value={hidroPeso} onChange={(e) => setHidroPeso(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Clima</label>
              <select 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-xs sm:text-sm"
                value={hidroClima} onChange={(e) => setHidroClima(e.target.value)}
              >
                <option value="ameno">Ameno / Frio (&lt; 25°C)</option>
                <option value="quente">Quente (&gt; 25°C)</option>
                <option value="muito_quente">Muito Quente (&gt; 35°C)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Atividade (min/dia)</label>
              <input 
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
                placeholder="Ex: 60" type="number"
                value={hidroAtividade} onChange={(e) => setHidroAtividade(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-xs text-gray-500">Estado Fisiológico Especial</label>
            <select 
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              value={hidroFator} onChange={(e) => setHidroFator(e.target.value)}
            >
              <option value="nenhum">Nenhum / Padrão</option>
              <option value="gestacao">Gestação (+300 ml)</option>
              <option value="lactacao">Lactação (+700 ml)</option>
            </select>
          </div>

          {resultadoHidro && (
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                 <div>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Água Diária</p>
                   <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{resultadoHidro.ml} ml ({resultadoHidro.litros} L)</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-gray-500 dark:text-gray-400">Copos (250ml)</p>
                   <p className="text-sm font-semibold text-gray-900 dark:text-white">~ {resultadoHidro.copos} copos/dia</p>
                 </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#0A0A0B] border border-gray-200 dark:border-[#27272A] rounded-lg p-3 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                 <p className="font-bold text-gray-700 dark:text-gray-300">Sugestão de Distribuição:</p>
                 <div className="flex justify-between">
                   <span>Manhã (40%): <strong>{resultadoHidro.distribuicao.manha} ml</strong></span>
                   <span>Tarde (40%): <strong>{resultadoHidro.distribuicao.tarde} ml</strong></span>
                   <span>Noite (20%): <strong>{resultadoHidro.distribuicao.noite} ml</strong></span>
                 </div>
              </div>
            </div>
          )}

          <button onClick={calcularHidratacao} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-auto">
            <span>Calcular Hidratação</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </section>

        </div>
        </div>
      </main>

      {/* Layout de Impressão de Dieta (Apenas para Impressão) */}
      <div id="print-diet-plan" className="hidden print:block bg-white text-black p-8 max-w-4xl mx-auto">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #print-diet-plan, #print-diet-plan * {
                visibility: visible;
              }
              #print-diet-plan {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `
        }} />
        <div className="border-b-2 border-purple-800 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-purple-900 uppercase tracking-tight">Plano Alimentar</h1>
            <p className="text-xs text-gray-500 mt-1">Gerado por Amora Genômica e Nutrição</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">Data: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {patientName && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Paciente</span>
            <h2 className="text-lg font-bold text-gray-800 mt-0.5">{patientName}</h2>
          </div>
        )}

        {/* Resumo de Macronutrientes no PDF */}
        <div className="mb-6 p-4 border border-teal-100 bg-teal-50/20 rounded-lg">
          <h3 className="text-xs font-bold uppercase text-teal-800 mb-3">Resumo Nutricional Estimado</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase">Calorias</span>
              <span className="text-sm font-bold text-gray-800">{dietTotals.kcal.toFixed(0)} kcal</span>
            </div>
            <div className="flex flex-col border-l border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase">Carboidratos</span>
              <span className="text-sm font-bold text-gray-800">{dietTotals.carb.toFixed(0)}g ({dietPercentages.carb}%)</span>
            </div>
            <div className="flex flex-col border-l border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase">Proteínas</span>
              <span className="text-sm font-bold text-gray-800">{dietTotals.prot.toFixed(0)}g ({dietPercentages.prot}%)</span>
            </div>
            <div className="flex flex-col border-l border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase">Gorduras</span>
              <span className="text-sm font-bold text-gray-800">{dietTotals.fat.toFixed(0)}g ({dietPercentages.fat}%)</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {meals.map((meal, mIdx) => {
            const mTotals = calculateMealTotals(meal);
            if (meal.items.length === 0) return null;
            return (
              <div key={meal.id} className="border border-gray-200 rounded-lg p-4 bg-white page-break-inside-avoid">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{meal.time}</span>
                    <h3 className="font-bold text-gray-800 uppercase text-sm">{meal.name}</h3>
                  </div>
                  <span className="text-xs text-gray-500">{mTotals.kcal.toFixed(0)} kcal</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {meal.items.map((item, idx) => {
                    return (
                      <div key={idx} className="py-2.5">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-sm font-medium text-gray-800">{item.description}</span>
                          <span className="text-xs font-bold text-gray-600 shrink-0">{item.amount_g}{item.unit || 'g'}</span>
                        </div>
                        {item.substitutions && item.substitutions.length > 0 && (
                          <div className="mt-1.5 pl-3 border-l-2 border-purple-200 space-y-1">
                            {item.substitutions.map((sub, sIdx) => (
                              <div key={sIdx} className="flex justify-between items-baseline gap-2 text-xs text-gray-500">
                                <span><span className="text-purple-600 font-semibold italic mr-1">ou</span> {sub.description}</span>
                                <span className="font-semibold">{sub.amount_g}{sub.unit || 'g'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {meal.notes && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                    <p className="text-[11px] text-gray-500 italic leading-relaxed whitespace-pre-line">{meal.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {dietNotes && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Instruções / Observações Gerais</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{dietNotes}</p>
          </div>
        )}

        <div className="mt-12 text-center border-t border-gray-100 pt-4 text-[10px] text-gray-400">
          Este plano alimentar foi elaborado sob medida para o paciente utilizando o sistema inteligente Amora Genômica e Nutrição.
        </div>
      </div>

      {/* Floating Action Button for Chat (Patient Chat) - Only for Ultra or Admin users */}
      {currentPlanId && (userProfile?.plan?.toLowerCase() === 'ultra' || userProfile?.plan?.toLowerCase() === 'admin') && (
        <button
          onClick={() => setChatDrawerOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-700 hover:bg-purple-800 text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(147,51,234,0.4)] transition-all transform hover:scale-105 active:scale-95 z-50 group"
          title="Chat com o Paciente"
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          {/* Notification Dot */}
          {patientChat.length > 0 && patientChat[patientChat.length - 1].role === 'user' && (
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white dark:border-[#18181B]"></span>
            </span>
          )}
        </button>
      )}

      {/* Right Slide-over Chat Drawer - Only for Ultra or Admin users */}
      {currentPlanId && (userProfile?.plan?.toLowerCase() === 'ultra' || userProfile?.plan?.toLowerCase() === 'admin') && (
        <>
          {/* Backdrop overlay */}
          <div 
            onClick={() => setChatDrawerOpen(false)}
            className={`fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 z-50 ${
              chatDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
          
          {/* Drawer Body */}
          <div 
            className={`fixed top-0 right-0 h-screen w-96 bg-white dark:bg-[#18181B] border-l border-gray-200 dark:border-[#27272A] shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
              chatDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">chat_bubble</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white">Chat com Paciente</h3>
                  <p className="text-[10px] text-gray-500">
                    {patientName ? `Conversa com ${patientName}` : 'Canal direto'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setChatDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white material-symbols-outlined text-xl"
              >
                close
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-black/20 flex flex-col">
              {patientChat.map((m, idx) => (
                <div key={idx} className={`flex flex-col max-w-[85%] ${m.role === 'nutri' ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`rounded-xl p-2.5 text-xs ${
                    m.role === 'nutri' 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-[#27272A] border border-gray-200 dark:border-[#27272A] shadow-sm rounded-tl-none text-gray-900 dark:text-gray-100'
                  }`}>
                    {m.content}
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
              {patientChat.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700 mb-2">forum</span>
                  <p className="text-xs text-gray-400 italic font-medium">Nenhuma mensagem trocada ainda.</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendProfessionalChatReply(); }}
                placeholder="Responda o paciente..."
                className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-xs outline-none dark:text-white focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={sendProfessionalChatReply}
                className="w-9 h-9 rounded-lg bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
