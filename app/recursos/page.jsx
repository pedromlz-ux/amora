"use client"
import React, { useEffect, useState, useRef } from 'react';

export default function Recursos() {
  const [loading, setLoading] = useState(true);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState({ name: '', email: '', avatar: '' });

  // IMC State
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('feminino');
  const [resultadoImc, setResultadoImc] = useState(null);

  // TACO State
  const [tacoData, setTacoData] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [tacoPorcao, setTacoPorcao] = useState('100g'); // 100g, 50g, Porção

  // Meals State
  const [meals, setMeals] = useState([
    { id: 1, name: 'CAFÉ DA MANHÃ', time: '08:00', items: [] },
    { id: 2, name: 'ALMOÇO', time: '12:30', items: [] }
  ]);
  const [addingToMealId, setAddingToMealId] = useState(null);
  const [mealSearchTerm, setMealSearchTerm] = useState('');

  // Macros Setting State
  const [showMacroSettings, setShowMacroSettings] = useState(false);
  const [macros, setMacros] = useState({ carb: 50, prot: 30, fat: 20 });

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

  useEffect(() => {
    // Load User
    const name = localStorage.getItem("user_name") || "Pedro Miguel";
    const email = localStorage.getItem("user_email") || "pedromlzaparoli@gmail.com";
    const avatar = localStorage.getItem("user_avatar") || "https://ui-avatars.com/api/?name=Pedro+Miguel&background=7e22ce&color=fff&size=256&bold=true";
    setUserProfile({ name, email, avatar });

    // Load TACO
    fetch('/TACO.json')
      .then(res => res.json())
      .then(data => setTacoData(data))
      .catch(err => console.error("Erro ao carregar TACO", err));

    setLoading(false);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_avatar");
    window.location.href = "/login";
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

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      setExameNome(fileName);
      setExameStatus('analyzing');
      setExameResultado(null);
      
      // Simulate AI processing
      setTimeout(() => {
        setExameStatus('done');
        setExameResultado({
          summary: "Identificamos alterações no Perfil Lipídico.",
          details: "O LDL-C está em 145 mg/dL (acima da meta ideal para o paciente). Recomenda-se focar na redução de saturadas no Plano Alimentar.",
          date: new Date().toLocaleDateString('pt-BR')
        });
      }, 3500); // 3.5s reading simulation
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // TACO Filter
  const alimentosFiltrados = termoBusca 
    ? tacoData.filter(item => item.description.toLowerCase().includes(termoBusca.toLowerCase())).slice(0, 15)
    : tacoData.slice(0, 5); // Show first 5 initially
    
  // Meal Filter
  const mealAlimentosFiltrados = mealSearchTerm
    ? tacoData.filter(item => item.description.toLowerCase().includes(mealSearchTerm.toLowerCase())).slice(0, 5)
    : [];

  const handleAddToMeal = (item, mealId) => {
    const newItem = {
      description: item.description,
      base_kcal: typeof item.energy_kcal === 'number' ? item.energy_kcal : 0,
      base_carb: typeof item.carbohydrate_g === 'number' ? item.carbohydrate_g : 0,
      base_prot: typeof item.protein_g === 'number' ? item.protein_g : 0,
      base_fat: typeof item.lipid_g === 'number' ? item.lipid_g : 0,
      amount_g: 100 // default 100g
    };
    setMeals(meals.map(m => m.id === mealId ? { ...m, items: [...m.items, newItem] } : m));
    setAddingToMealId(null);
    setMealSearchTerm('');
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

  const handleRemoveFromMeal = (mealId, itemIndex) => {
    setMeals(meals.map(m => m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== itemIndex) } : m));
  };
  
  const handleUpdateMeal = (mealId, field, value) => {
    setMeals(meals.map(m => m.id === mealId ? { ...m, [field]: value } : m));
  };
  
  const addMeal = () => {
    setMeals([...meals, { id: Date.now(), name: 'NOVA REFEIÇÃO', time: '16:00', items: [] }]);
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
      const mult = (item.amount_g || 0) / 100;
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

  const workspaceSubtitle = `personal-${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-DM...`;

  return (
    <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white">

      {/* SideNavBar Component */}
      <nav className="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50">
          {/* Header */}
          <a href="/" className="px-6 pb-6 border-b border-gray-200 dark:border-[#27272A] mb-6 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg mx-2 p-2 block decoration-none">
              <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center overflow-hidden">
                  <img alt="Amora Logo" className="w-full h-full object-contain" src=""/>
              </div>
              <div className="flex-1 overflow-hidden">
                  <h2 className="font-label-md text-sm font-medium truncate text-gray-900 dark:text-white">{userProfile.name.split(' ')[0]}'s Works...</h2>
                  <p className="font-label-sm text-xs text-gray-500 dark:text-gray-400 truncate">{workspaceSubtitle}</p>
              </div>
              <svg className="text-gray-400 dark:text-gray-500" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>
          </a>
          
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-2 space-y-6">
              {/* Section 1 */}
              <div>
                  <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Aprender</p>
                  <div className="space-y-1">
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <span className="font-label-md text-sm">Amora</span>
                      </a>
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/aulas">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                          <span className="font-label-md text-sm">Aulas</span>
                      </a>
                      <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors" href="/recursos">
                          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M12 11v-4"></path></svg>
                          <span className="font-label-md text-sm">Recursos Profissionais</span>
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
                  <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-label-sm text-xs">Free Plan</span>
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

      {/* TopAppBar Anchor */}
      <header className="fixed top-0 right-0 left-64 z-40 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#27272A] flex justify-between items-center h-16 px-6 w-[calc(100%-16rem)]">
        <div className="flex items-center gap-4">
        <h1 className="text-xl font-extrabold text-purple-700 dark:text-purple-400 tracking-tight">Clinical Intelligence</h1>
        </div>
        <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-200 dark:border-[#27272A] w-64">
        <span className="material-symbols-outlined text-gray-500 text-sm mr-2">search</span>
        <input className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none dark:text-white" placeholder="Pesquisar..." type="text"/>
        </div>
        <div className="flex items-center gap-4">
        <button className="material-symbols-outlined text-gray-500 hover:text-purple-700 transition-colors">notifications</button>
        <button className="material-symbols-outlined text-gray-500 hover:text-purple-700 transition-colors" onClick={() => window.location.href='/configuracao'}>settings</button>
        <button className="material-symbols-outlined text-gray-500 hover:text-purple-700 transition-colors">help</button>
        </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 pb-12 px-8 max-w-[1280px] mx-auto min-h-screen">
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
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 group shadow-sm">
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
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
        <span className="material-symbols-outlined">nutrition</span>
        </div>
        <div>
        <h3 className="text-sm font-bold dark:text-white">Tabela TACO</h3>
        <p className="text-xs text-gray-500">Composição de Alimentos (Real)</p>
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

        {/* Card 3: Montador de Dietas */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 shadow-sm md:row-span-1 relative">
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
        <span className="material-symbols-outlined">restaurant</span>
        </div>
        <div>
        <h3 className="text-sm font-bold dark:text-white">Montador de Dietas</h3>
        <p className="text-xs text-gray-500">Planejamento alimentar</p>
        </div>
        </div>
        <button onClick={() => setShowMacroSettings(!showMacroSettings)} className={`p-2 rounded-full transition-colors ${showMacroSettings ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' : 'hover:bg-gray-100 dark:hover:bg-[#27272A] dark:text-gray-400'}`}>
        <span className="material-symbols-outlined">settings_suggest</span>
        </button>
        </div>
        
        {/* Modal de Configuração de Macros */}
        {showMacroSettings && (
          <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-[#0A0A0B]">
            <h4 className="text-xs font-bold uppercase mb-3 dark:text-white">Distribuição de Macros (%)</h4>
            <div className="grid grid-cols-3 gap-3">
               <div>
                  <label className="text-xs text-gray-500">Carboidratos</label>
                  <input type="number" value={macros.carb} onChange={e => handleMacroChange('carb', e.target.value)} className="w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded p-2 text-sm text-center dark:text-white outline-none focus:ring-1 focus:ring-purple-500"/>
               </div>
               <div>
                  <label className="text-xs text-gray-500">Proteínas</label>
                  <input type="number" value={macros.prot} onChange={e => handleMacroChange('prot', e.target.value)} className="w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded p-2 text-sm text-center dark:text-white outline-none focus:ring-1 focus:ring-purple-500"/>
               </div>
               <div>
                  <label className="text-xs text-gray-500">Gorduras</label>
                  <input type="number" value={macros.fat} onChange={e => handleMacroChange('fat', e.target.value)} className="w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded p-2 text-sm text-center dark:text-white outline-none focus:ring-1 focus:ring-purple-500"/>
               </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
        {/* Painel de Balanço da Dieta */}
        <div className="mb-6 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-900/10">
          <div className="flex justify-between items-center mb-4">
             <h4 className="text-xs font-bold uppercase dark:text-teal-400 text-teal-700">Balanço Total da Dieta</h4>
             <span className="text-sm font-bold dark:text-white">{dietTotals.kcal.toFixed(0)} kcal</span>
          </div>
          
          <div className="flex w-full h-3 rounded-full overflow-hidden mb-3">
             <div style={{width: `${dietPercentages.carb}%`}} className="bg-blue-400 transition-all"></div>
             <div style={{width: `${dietPercentages.prot}%`}} className="bg-red-400 transition-all"></div>
             <div style={{width: `${dietPercentages.fat}%`}} className="bg-yellow-400 transition-all"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             <div className="flex flex-col border-l-2 border-blue-400 pl-2">
                <span className="text-[10px] text-gray-500">Carboidratos</span>
                <span className="text-xs font-bold dark:text-white">{dietPercentages.carb}% <span className="text-gray-400 font-normal">/ {macros.carb}%</span></span>
                <span className="text-[10px] text-gray-400">{dietTotals.carb.toFixed(0)}g</span>
             </div>
             <div className="flex flex-col border-l-2 border-red-400 pl-2">
                <span className="text-[10px] text-gray-500">Proteínas</span>
                <span className="text-xs font-bold dark:text-white">{dietPercentages.prot}% <span className="text-gray-400 font-normal">/ {macros.prot}%</span></span>
                <span className="text-[10px] text-gray-400">{dietTotals.prot.toFixed(0)}g</span>
             </div>
             <div className="flex flex-col border-l-2 border-yellow-400 pl-2">
                <span className="text-[10px] text-gray-500">Gorduras</span>
                <span className="text-xs font-bold dark:text-white">{dietPercentages.fat}% <span className="text-gray-400 font-normal">/ {macros.fat}%</span></span>
                <span className="text-[10px] text-gray-400">{dietTotals.fat.toFixed(0)}g</span>
             </div>
          </div>
        </div>

        {meals.map((meal) => {
          const mTotals = calculateMealTotals(meal);
          return (
          <div key={meal.id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#0A0A0B] border border-gray-100 dark:border-[#27272A]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <input 
                value={meal.name} 
                onChange={(e) => handleUpdateMeal(meal.id, 'name', e.target.value)} 
                className="text-xs font-bold uppercase tracking-tight bg-transparent outline-none dark:text-white focus:border-b focus:border-purple-500 w-32" 
              />
              <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                 <span className="font-medium text-purple-700 dark:text-purple-400">{mTotals.kcal.toFixed(0)} kcal</span>
                 <span>C: {mTotals.carb.toFixed(0)}g</span>
                 <span>P: {mTotals.prot.toFixed(0)}g</span>
                 <span>G: {mTotals.fat.toFixed(0)}g</span>
              </div>
            </div>
          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={meal.time} 
              onChange={(e) => handleUpdateMeal(meal.id, 'time', e.target.value)}
              className="text-xs text-gray-500 bg-transparent outline-none"
            />
            <span className="material-symbols-outlined text-xs text-red-500 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setMeals(meals.filter(m => m.id !== meal.id))}>close</span>
          </div>
          </div>
          {meal.items.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-[#18181B] px-3 py-2 rounded-md mb-2 text-sm border border-gray-200 dark:border-[#27272A] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-1 gap-2">
                 <span className="truncate flex-1 font-medium text-gray-900 dark:text-white" title={item.description}>{item.description}</span>
                 <div className="flex gap-2 items-center shrink-0">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#27272A] rounded px-2 py-0.5 border border-gray-200 dark:border-gray-700">
                       <input 
                          type="number" 
                          value={item.amount_g || ''} 
                          onChange={(e) => handleUpdateItemAmount(meal.id, idx, e.target.value)} 
                          className="w-10 text-xs bg-transparent text-right outline-none dark:text-white"
                       />
                       <span className="text-[10px] text-gray-500">g</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-red-500 cursor-pointer" onClick={() => handleRemoveFromMeal(meal.id, idx)}>delete</span>
                 </div>
              </div>
              <div className="flex gap-2 text-[10px] text-gray-500">
                 <span>{((item.base_kcal || item.kcal || 0) * ((item.amount_g||0)/100)).toFixed(0)} kcal</span>
                 <span className="text-gray-300 dark:text-gray-600">|</span>
                 <span>C: {((item.base_carb || item.carb || 0) * ((item.amount_g||0)/100)).toFixed(1)}g</span>
                 <span>P: {((item.base_prot || item.prot || 0) * ((item.amount_g||0)/100)).toFixed(1)}g</span>
                 <span>G: {((item.base_fat || item.fat || 0) * ((item.amount_g||0)/100)).toFixed(1)}g</span>
              </div>
            </div>
          ))}
          {addingToMealId === meal.id ? (
             <div className="bg-gray-100 dark:bg-[#18181B] p-2 rounded-lg border border-purple-200 dark:border-purple-900/30">
                <input 
                  autoFocus
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-700 outline-none text-sm dark:text-white mb-2" 
                  placeholder="Buscar na TACO..." 
                  value={mealSearchTerm} onChange={e => setMealSearchTerm(e.target.value)}
                />
                <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto">
                   {mealAlimentosFiltrados.map((item, idx) => (
                      <button key={idx} onClick={() => handleAddToMeal(item, meal.id)} className="text-left text-xs p-2 leading-relaxed hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded truncate">{item.description}</button>
                   ))}
                   {mealAlimentosFiltrados.length === 0 && mealSearchTerm && <span className="text-xs text-gray-500 px-1 py-2">Nenhum resultado</span>}
                </div>
                <button onClick={() => {setAddingToMealId(null); setMealSearchTerm('')}} className="mt-2 text-xs text-red-500 w-full text-center py-1">Cancelar</button>
             </div>
          ) : (
            <button onClick={() => setAddingToMealId(meal.id)} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 dark:border-[#27272A] rounded-lg text-sm text-gray-500 hover:border-purple-700 hover:text-purple-700 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Adicionar item</span>
            </button>
          )}
          </div>
        )})}
        
        <button onClick={addMeal} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 transition-all">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>Adicionar nova refeição</span>
        </button>

        </div>
        </section>

        {/* Card 4: Análise de Exames (AI) */}
        <section className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] p-6 rounded-2xl flex flex-col transition-all hover:border-purple-500/50 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 relative">
        <span className="material-symbols-outlined">clinical_notes</span>
        <span className="material-symbols-outlined absolute -top-1 -right-1 text-[12px] text-purple-700" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
        </div>
        <div>
        <h3 className="text-sm font-bold dark:text-white">Análise de Exames</h3>
        <p className="text-xs text-gray-500">Insights com IA preditiva</p>
        </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />

        <div onClick={triggerUpload} className="flex-1 min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-[#27272A] rounded-xl p-8 bg-gray-50 dark:bg-[#0A0A0B] hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-700 transition-all cursor-pointer group">
        
        {exameStatus === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin mb-4"></div>
            <p className="text-sm font-bold dark:text-white mb-1">Analisando Laudo...</p>
            <p className="text-xs text-gray-500 animate-pulse">Lendo padrões biomarcadores</p>
          </div>
        )}

        {exameStatus === 'done' && exameResultado && (
          <div className="flex flex-col items-start w-full cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 w-full border-b border-gray-100 dark:border-[#27272A] pb-4">
               <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-xl text-teal-600">check_circle</span>
               </div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold dark:text-white truncate" title={exameNome}>{exameNome}</p>
                 <p className="text-[10px] text-gray-500">Lido com Sucesso • {exameResultado.date}</p>
               </div>
               <button onClick={(e) => { e.stopPropagation(); setExameStatus('idle'); setExameNome(''); setExameResultado(null); }} className="text-[10px] text-red-500 hover:underline">Remover</button>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4 w-full">
               <div className="flex items-center gap-2 mb-2">
                 <span className="material-symbols-outlined text-purple-700 text-sm">robot_2</span>
                 <p className="text-xs font-bold text-purple-700 dark:text-purple-400">Insight Gerado</p>
               </div>
               <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{exameResultado.summary}</p>
               <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{exameResultado.details}</p>
            </div>
          </div>
        )}

        {exameStatus === 'idle' && (
          <>
            <div className="w-16 h-16 rounded-full bg-white dark:bg-[#18181B] shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 group-hover:text-purple-700 transition-colors">upload_file</span>
            </div>
            <p className="text-sm font-bold mb-1 dark:text-white">Arraste seus laudos aqui</p>
            <p className="text-xs text-gray-500 mb-6">Suporta PDF, JPG e PNG</p>
          </>
        )}

        <div className="flex gap-2 items-center py-1 px-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
        <span className="material-symbols-outlined text-sm text-purple-700 dark:text-purple-400" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
        <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Análise IA Ativada</span>
        </div>
        </div>
        <p className="mt-4 text-[10px] text-center text-gray-400">Os dados são processados localmente seguindo as normas da LGPD.</p>
        </section>
        </div>

        {/* Secondary Section: Insights */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
        <div className="bg-white dark:bg-[#18181B] p-6 rounded-2xl border border-gray-200 dark:border-[#27272A] shadow-sm">
        <div className="flex justify-between items-center mb-6">
        <h4 className="text-sm font-bold dark:text-white">Últimas Atividades</h4>
        <button className="text-purple-700 dark:text-purple-400 text-xs font-bold hover:underline">Ver tudo</button>
        </div>
        <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#27272A] last:border-0">
        <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-purple-700"></div>
        <div>
        <p className="text-sm font-medium dark:text-white">Cálculo de IMC realizado</p>
        <p className="text-[10px] text-gray-500">Paciente: Maria S. • Há 2 horas</p>
        </div>
        </div>
        <span className="text-sm font-bold dark:text-white">24.5 kg/m²</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#27272A] last:border-0">
        <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
        <div>
        <p className="text-sm font-medium dark:text-white">Dieta atualizada</p>
        <p className="text-[10px] text-gray-500">Paciente: João P. • Há 5 horas</p>
        </div>
        </div>
        <span className="material-symbols-outlined text-sm text-gray-400">open_in_new</span>
        </div>
        </div>
        </div>
        </div>
        
        {/* Quick Link Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-[#27272A] group cursor-pointer shadow-sm min-h-[200px] h-full bg-gradient-to-br from-gray-800 to-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
        <span className="text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-1">Base de Conhecimento</span>
        <h4 className="text-sm font-bold mb-2 text-white">Novos Protocolos de Interpretação</h4>
        <p className="text-xs text-gray-300 leading-tight mb-4">Acesse os guias atualizados para 2024 sobre análise lipídica.</p>
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white self-end">
        <span className="material-symbols-outlined">arrow_forward</span>
        </div>
        </div>
        </div>
        </section>
      </main>
    </div>
  );
}
