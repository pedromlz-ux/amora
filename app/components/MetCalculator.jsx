'use client';
import React, { useState, useMemo } from 'react';
import { MET_ACTIVITIES, MET_CATEGORIES, getIntensity, calculateMetExpenditure, INTENSITY_LEVELS } from '../lib/metData';

export default function MetCalculator({ defaultWeight = '70', onCalculate = null }) {
  // Mode: 'single' | 'routine' | 'table' | 'guide'
  const [activeTab, setActiveTab] = useState('single');

  // Single Calculator State
  const [weight, setWeight] = useState(String(defaultWeight || '70'));
  const [selectedActivityId, setSelectedActivityId] = useState('aerobia_baixo_impacto');
  const [isCustomMet, setIsCustomMet] = useState(false);
  const [customMetName, setCustomMetName] = useState('Atividade Personalizada');
  const [customMetValue, setCustomMetValue] = useState('5.0');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copied, setCopied] = useState(false);

  // Routine / Multiple Activities State
  const [routineWeight, setRoutineWeight] = useState(String(defaultWeight || '70'));
  const [routineItems, setRoutineItems] = useState([
    { id: 1, activityId: 'caminhada_mod_forte', customName: '', customMet: 5.0, duration: 45 },
    { id: 2, activityId: 'musculacao_media', customName: '', customMet: 4.5, duration: 60 }
  ]);
  const [routineSearch, setRoutineSearch] = useState('');

  // Table Search & Filter State
  const [tableSearch, setTableSearch] = useState('');
  const [tableCategory, setTableCategory] = useState('all');
  const [tableIntensity, setTableIntensity] = useState('all');
  const [tableSort, setTableSort] = useState('met_desc'); // met_desc, met_asc, name_asc

  // Current selected activity object
  const currentActivity = useMemo(() => {
    if (isCustomMet) {
      const metVal = parseFloat(String(customMetValue).replace(',', '.')) || 1.0;
      return {
        id: 'custom',
        name: customMetName || 'Atividade Personalizada',
        met: metVal,
        category: 'custom'
      };
    }
    return MET_ACTIVITIES.find(a => a.id === selectedActivityId) || MET_ACTIVITIES[0];
  }, [isCustomMet, customMetName, customMetValue, selectedActivityId]);

  // Calculation for Single Mode
  const singleResult = useMemo(() => {
    const p = parseFloat(String(weight).replace(',', '.')) || 0;
    const d = parseFloat(String(durationMinutes).replace(',', '.')) || 0;
    const m = currentActivity?.met || 0;
    return calculateMetExpenditure({ met: m, weightKg: p, durationMinutes: d });
  }, [weight, durationMinutes, currentActivity]);

  // Routine Calculation
  const routineResults = useMemo(() => {
    const p = parseFloat(String(routineWeight).replace(',', '.')) || 0;
    if (p <= 0) return { items: [], totalKcal: 0, totalMinutes: 0, totalLitersVo2: 0, totalFatGrams: 0 };

    let totalKcal = 0;
    let totalMinutes = 0;
    let totalLitersVo2 = 0;
    let totalFatGrams = 0;

    const items = routineItems.map(item => {
      let act = MET_ACTIVITIES.find(a => a.id === item.activityId);
      const met = act ? act.met : (parseFloat(item.customMet) || 1.0);
      const name = act ? act.name : (item.customName || 'Atividade');
      const calc = calculateMetExpenditure({ met, weightKg: p, durationMinutes: item.duration });

      totalKcal += calc.kcal;
      totalMinutes += (parseFloat(item.duration) || 0);
      totalLitersVo2 += calc.vo2_liters_total;
      totalFatGrams += calc.fatGramsBurnEstimate;

      return {
        ...item,
        name,
        met,
        intensity: getIntensity(met),
        calc
      };
    });

    return {
      items,
      totalKcal: parseFloat(totalKcal.toFixed(2)),
      totalMinutes,
      totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
      totalLitersVo2: parseFloat(totalLitersVo2.toFixed(2)),
      totalFatGrams: parseFloat(totalFatGrams.toFixed(1))
    };
  }, [routineWeight, routineItems]);

  // Filtered Activities for Selector
  const filteredActivities = useMemo(() => {
    return MET_ACTIVITIES.filter(act => {
      const matchCat = selectedCategory === 'all' || act.category === selectedCategory;
      const matchSearch = !searchTerm.trim() || 
        act.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (act.keywords && act.keywords.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Filtered Activities for Table
  const tableActivities = useMemo(() => {
    let list = MET_ACTIVITIES.filter(act => {
      const matchCat = tableCategory === 'all' || act.category === tableCategory;
      const matchSearch = !tableSearch.trim() || 
        act.name.toLowerCase().includes(tableSearch.toLowerCase()) || 
        (act.keywords && act.keywords.toLowerCase().includes(tableSearch.toLowerCase()));
      
      let matchIntensity = true;
      if (tableIntensity === 'leve') matchIntensity = act.met < 3.0;
      else if (tableIntensity === 'moderada') matchIntensity = act.met >= 3.0 && act.met < 6.0;
      else if (tableIntensity === 'vigorosa') matchIntensity = act.met >= 6.0 && act.met < 9.0;
      else if (tableIntensity === 'muito_intensa') matchIntensity = act.met >= 9.0;

      return matchCat && matchSearch && matchIntensity;
    });

    if (tableSort === 'met_desc') {
      list.sort((a, b) => b.met - a.met);
    } else if (tableSort === 'met_asc') {
      list.sort((a, b) => a.met - b.met);
    } else if (tableSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [tableCategory, tableSearch, tableIntensity, tableSort]);

  // Copy Summary to Clipboard
  const handleCopySingle = () => {
    if (!singleResult) return;
    const intensity = getIntensity(currentActivity.met);
    const text = [
      `🏃‍♂️ *Cálculo de Gasto Energético (METs) - Amora*`,
      `---------------------------------------`,
      `📌 *Atividade:* ${currentActivity.name}`,
      `⚡ *Valor MET:* ${currentActivity.met} (${intensity.label})`,
      `⏱️ *Duração:* ${durationMinutes} min (${(parseFloat(durationMinutes) / 60).toFixed(2)}h)`,
      `⚖️ *Peso Corporal:* ${weight} kg`,
      `---------------------------------------`,
      `🔥 *Gasto Calórico Total:* ${singleResult.kcal} kcal`,
      `⚡ *Taxa por Minuto:* ${singleResult.kcalPerMinute} kcal/min`,
      `🫁 *Consumo de O₂ Total:* ${singleResult.vo2_liters_total} L (${singleResult.vo2_ml_kg_min} ml/kg/min)`,
      `💧 *Estimativa de Queima Lipídica:* ~${singleResult.fatGramsBurnEstimate}g de gordura`,
      `---------------------------------------`,
      `Fórmula: MET × Peso (kg) × (Minutos / 60)`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyRoutine = () => {
    const text = [
      `📋 *Rotina Diária de Atividades Físicas (METs) - Amora*`,
      `⚖️ *Peso Corporal:* ${routineWeight} kg | ⏱️ *Tempo Total:* ${routineResults.totalMinutes} min (${routineResults.totalHours}h)`,
      `🔥 *Gasto Energético Total:* ${routineResults.totalKcal} kcal`,
      `---------------------------------------`,
      ...routineResults.items.map((it, idx) => 
        `${idx + 1}. ${it.name} | ${it.duration} min | MET ${it.met} ➔ *${it.calc.kcal} kcal*`
      ),
      `---------------------------------------`,
      `💧 *Estimativa de Gordura Oxidada:* ~${routineResults.totalFatGrams}g`,
      `🫁 *Consumo de Oxigênio:* ${routineResults.totalLitersVo2} Litros`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Add Item to Routine
  const handleAddRoutineItem = (actId = 'caminhada_mod_forte') => {
    const newItem = {
      id: Date.now(),
      activityId: actId,
      customName: '',
      customMet: 5.0,
      duration: 30
    };
    setRoutineItems(prev => [...prev, newItem]);
  };

  const handleRemoveRoutineItem = (id) => {
    setRoutineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateRoutineItem = (id, field, value) => {
    setRoutineItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  return (
    <div className="w-full bg-white dark:bg-[#121214] rounded-2xl border border-purple-200 dark:border-[#27272A] p-4 sm:p-7 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-[#27272A]">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Calculadora de METs
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Gasto Energético
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Equivalentes Metabólicos de Tarefa (Ainsworth Compendium / Nutritotal)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#1C1C20] rounded-xl border border-gray-200/70 dark:border-[#27272A] self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'single'
                ? 'bg-white dark:bg-[#27272A] text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">calculate</span>
            <span>Calculadora Direta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'routine'
                ? 'bg-white dark:bg-[#27272A] text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">view_timeline</span>
            <span>Rotina do Dia ({routineItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'table'
                ? 'bg-white dark:bg-[#27272A] text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">table_chart</span>
            <span>Tabela de METs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-[#27272A] text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            <span>Guia Clínico</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CALCULADORA DIRETA (SINGLE) */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Inputs & Activity Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Main Parameters: Weight & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/70 dark:bg-[#18181B]/70 rounded-xl border border-gray-100 dark:border-[#27272A]">
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  <span>Peso Corporal (kg)</span>
                  <span className="text-purple-600 dark:text-purple-400 text-[11px] font-semibold">Obrigatório</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 70.0"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-3.5 py-2.5 text-base font-bold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    kg
                  </span>
                </div>
                {/* Weight quick toggles */}
                <div className="flex items-center gap-1.5 mt-2">
                  {['55', '65', '70', '80', '90', '100'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeight(w)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                        weight === w
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white dark:bg-black border-gray-200 dark:border-[#27272A] text-gray-600 dark:text-gray-400 hover:border-purple-300'
                      }`}
                    >
                      {w}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  <span>Duração da Atividade</span>
                  <span className="text-purple-600 dark:text-purple-400 text-[11px] font-semibold">
                    {(parseFloat(durationMinutes) / 60 || 0).toFixed(2)}h
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 60"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-3.5 py-2.5 text-base font-bold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    minutos
                  </span>
                </div>
                {/* Duration Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {['15', '30', '45', '60', '90', '120'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationMinutes(d)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                        durationMinutes === d
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white dark:bg-black border-gray-200 dark:border-[#27272A] text-gray-600 dark:text-gray-400 hover:border-purple-300'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mode Switch: Standard Compendium vs Custom MET */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-base">directions_run</span>
                <span>Selecione ou Busque a Atividade Física</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCustomMet(v => !v)}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {isCustomMet ? 'list' : 'tune'}
                </span>
                <span>{isCustomMet ? 'Usar lista de atividades' : 'Digitar MET manual'}</span>
              </button>
            </div>

            {/* Custom MET Inputs */}
            {isCustomMet ? (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Atividade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Treino Funcional Personalizado"
                    value={customMetName}
                    onChange={e => setCustomMetName(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-purple-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Valor de MET (Múltiplo Metabólico)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 5.5"
                      value={customMetValue}
                      onChange={e => setCustomMetValue(e.target.value)}
                      className="w-32 bg-white dark:bg-black border border-purple-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      (1 MET = repouso; 3-6 = moderado; &gt;6 = intenso)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Selection with Search and Categories */
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar atividade... (ex: corrida, natação, musculação, caminhada)"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {MET_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-[#1C1C20] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#27272A]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Activities Scrollable Grid */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-[#27272A] rounded-xl p-2 bg-white dark:bg-black divide-y divide-gray-100 dark:divide-[#1F1F23]">
                  {filteredActivities.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      Nenhuma atividade encontrada com o termo "{searchTerm}".
                    </div>
                  ) : (
                    filteredActivities.map(act => {
                      const isSelected = selectedActivityId === act.id;
                      const intensity = getIntensity(act.met);

                      return (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => setSelectedActivityId(act.id)}
                          className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 transition-all ${
                            isSelected
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-600'
                              : 'hover:bg-gray-50 dark:hover:bg-[#18181B] text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold truncate">{act.name}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${intensity.bgClass}`}>
                              {intensity.label}
                            </span>
                            <span className="font-mono font-black text-xs text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded">
                              {act.met.toFixed(2)} MET
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Card: Result Showcase & Detailed Metrics (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Result Box - Clean White / Amora Purple Accent */}
            <div className="p-6 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/50 text-gray-900 dark:text-white shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Gasto Energético Estimado
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_fire_department</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 my-2">
                <span className="text-4xl sm:text-5xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
                  {singleResult.kcal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-base font-bold text-gray-500 dark:text-gray-400">Kcal</span>
              </div>

              {/* Selected Activity Pill */}
              <div className="mt-3 pt-3 border-t border-purple-200/80 dark:border-purple-900/50 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Atividade selecionada:</p>
                  <p className="font-bold truncate text-gray-900 dark:text-white">{currentActivity?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Intensidade:</p>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    {currentActivity?.met} METs
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Rate per minute */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                  <span className="text-[11px] font-bold">Taxa de Queima</span>
                  <span className="material-symbols-outlined text-sm text-purple-600">speed</span>
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {singleResult.kcalPerMinute} <span className="text-xs font-medium text-gray-400">kcal/min</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Ritmo durante a atividade</p>
              </div>

              {/* VO2 Oxygen */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                  <span className="text-[11px] font-bold">Consumo de Oxigênio</span>
                  <span className="material-symbols-outlined text-sm text-blue-600">air</span>
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {singleResult.vo2_liters_total} <span className="text-xs font-medium text-gray-400">Litros O₂</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{singleResult.vo2_ml_kg_min} ml/kg/min</p>
              </div>

              {/* Fat oxidation estimate */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                  <span className="text-[11px] font-bold">Gordura Estimada</span>
                  <span className="material-symbols-outlined text-sm text-amber-600">water_drop</span>
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  ~{singleResult.fatGramsBurnEstimate} <span className="text-xs font-medium text-gray-400">g</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Equivalente lipídico puro</p>
              </div>

              {/* Intensity classification */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                  <span className="text-[11px] font-bold">Classificação</span>
                  <span className="material-symbols-outlined text-sm text-emerald-600">ecg_heart</span>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  {getIntensity(currentActivity.met).label}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{getIntensity(currentActivity.met).range}</p>
              </div>
            </div>

            {/* Formula Explanation box */}
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-200">
              <p className="font-bold flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-sm">functions</span>
                <span>Fórmula Aplicada:</span>
              </p>
              <p className="font-mono text-[11px] text-purple-800 dark:text-purple-300">
                {currentActivity.met} (MET) × {weight || 0} (kg) × ({(durationMinutes || 0)} / 60) h = <strong>{singleResult.kcal} Kcal</strong>
              </p>
            </div>

            {/* Actions: Copy and Send */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySingle}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Resumo da Atividade'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROTINA DIÁRIA (MÚLTIPLAS ATIVIDADES) */}
      {activeTab === 'routine' && (
        <div className="space-y-6">
          {/* Top Parameters for Routine */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50/80 dark:bg-[#18181B]/70 rounded-xl border border-gray-100 dark:border-[#27272A]">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Peso do Paciente (kg):
              </label>
              <input
                type="number"
                step="0.1"
                value={routineWeight}
                onChange={e => setRoutineWeight(e.target.value)}
                className="w-24 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2.5 py-1.5 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddRoutineItem()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Adicionar Atividade</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRoutine}
                className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado!' : 'Copiar Rotina'}</span>
              </button>
            </div>
          </div>

          {/* Routine Summary Highlight Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
              <span className="text-[11px] font-extrabold uppercase text-purple-700 dark:text-purple-300">Gasto Total do Dia</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                {routineResults.totalKcal} <span className="text-xs font-bold text-gray-500">kcal</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
              <span className="text-[11px] font-bold text-gray-500">Tempo de Atividade</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {routineResults.totalMinutes} <span className="text-xs font-bold text-gray-500">min ({routineResults.totalHours}h)</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
              <span className="text-[11px] font-bold text-gray-500">Consumo Total de O₂</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {routineResults.totalLitersVo2} <span className="text-xs font-bold text-gray-500">Litros</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A]">
              <span className="text-[11px] font-bold text-gray-500">Gordura Oxidada</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                ~{routineResults.totalFatGrams} <span className="text-xs font-bold text-gray-500">gramas</span>
              </p>
            </div>
          </div>

          {/* Routine Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">
              Atividades Registradas na Rotina
            </h4>

            {routineResults.items.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 bg-white dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Activity Selector inside item */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.activityId}
                      onChange={e => handleUpdateRoutineItem(item.id, 'activityId', e.target.value)}
                      className="w-full bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer p-0"
                    >
                      {MET_ACTIVITIES.map(a => (
                        <option key={a.id} value={a.id} className="bg-white dark:bg-black text-gray-900 dark:text-white">
                          {a.name} ({a.met.toFixed(1)} MET)
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${item.intensity.bgClass}`}>
                        {item.intensity.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {item.met} METs • {item.calc.kcalPerMinute} kcal/min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Duration input & Calorie result */}
                <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={item.duration}
                      onChange={e => handleUpdateRoutineItem(item.id, 'duration', e.target.value)}
                      className="w-16 bg-gray-50 dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 font-medium">min</span>
                  </div>

                  <div className="w-24 text-right">
                    <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-400">
                      {item.calc.kcal}
                    </span>
                    <span className="text-[10px] text-gray-400 block">kcal</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRoutineItem(item.id)}
                    className="text-gray-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                    title="Remover atividade"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}

            {routineResults.items.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-[#27272A] rounded-xl">
                <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">fitness_center</span>
                <p className="text-xs font-bold text-gray-500">Nenhuma atividade na rotina</p>
                <button
                  type="button"
                  onClick={() => handleAddRoutineItem()}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Adicionar primeira atividade</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TABELA COMPLETA DE METS */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50/80 dark:bg-[#18181B]/70 rounded-xl border border-gray-100 dark:border-[#27272A]">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Buscar Atividade</label>
              <input
                type="text"
                placeholder="Ex: corrida, bike, remo..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Categoria</label>
              <select
                value={tableCategory}
                onChange={e => setTableCategory(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
              >
                {MET_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Intensidade / Ordenação</label>
              <div className="flex items-center gap-2">
                <select
                  value={tableIntensity}
                  onChange={e => setTableIntensity(e.target.value)}
                  className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                >
                  <option value="all">Todas Intensidades</option>
                  <option value="leve">Leve (&lt;3.0)</option>
                  <option value="moderada">Moderada (3.0-5.9)</option>
                  <option value="vigorosa">Vigorosa (6.0-8.9)</option>
                  <option value="muito_intensa">Muito Intensa (≥9.0)</option>
                </select>

                <select
                  value={tableSort}
                  onChange={e => setTableSort(e.target.value)}
                  className="w-32 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                >
                  <option value="met_desc">Maior MET</option>
                  <option value="met_asc">Menor MET</option>
                  <option value="name_asc">Nome (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 dark:border-[#27272A] rounded-xl overflow-hidden bg-white dark:bg-[#0A0A0B]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-[#18181B] text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-[#27272A]">
                  <tr>
                    <th className="p-3">Atividade Física</th>
                    <th className="p-3 text-center">Valor MET</th>
                    <th className="p-3 text-center">Intensidade</th>
                    <th className="p-3 text-right">Gasto (70kg / 60min)</th>
                    <th className="p-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#27272A]">
                  {tableActivities.map(act => {
                    const intensity = getIntensity(act.met);
                    const sampleKcal = (act.met * 70 * 1).toFixed(0);

                    return (
                      <tr key={act.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">
                          {act.name}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                          {act.met.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${intensity.bgClass}`}>
                            {intensity.label}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                          ~{sampleKcal} kcal/h
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedActivityId(act.id);
                              setIsCustomMet(false);
                              setActiveTab('single');
                            }}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors"
                          >
                            Calcular
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GUIA CLÍNICO & FUNDAMENTO TEÓRICO */}
      {activeTab === 'guide' && (
        <div className="space-y-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-3">
            <h3 className="text-base font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600">school</span>
              <span>O que são os METs e como funcionam?</span>
            </h3>
            <p>
              Do inglês <em>“Metabolic Equivalent of Task”</em>, a sigla <strong>MET</strong> (múltiplos de equivalentes metabólicos) é uma medida fisiológica padrão que expressa o custo energético de atividades físicas.
            </p>
            <div className="p-3.5 bg-white dark:bg-black rounded-xl border border-purple-200 dark:border-purple-900/50 font-mono text-xs space-y-1">
              <p><strong>1 MET = 3.5 ml O₂ / kg / minuto</strong></p>
              <p><strong>1 MET = 1 kcal / kg / hora</strong> (equivalente ao gasto basal de repouso sentado)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] space-y-2">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-purple-600">functions</span>
                <span>Fórmula de Cálculo do Gasto Energético</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                O gasto calórico de qualquer atividade física é obtido multiplicando o valor de MET pelo peso corporal do paciente e pelo tempo praticado em horas:
              </p>
              <div className="p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-100 dark:border-[#27272A] font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                Gasto (kcal) = MET × Peso (kg) × (Tempo em min / 60)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] space-y-2">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-indigo-600">clinical_notes</span>
                <span>Aplicação na Prática Clínica Nutricional</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No cálculo do <strong>GET (Gasto Energético Total)</strong>, os METs permitem quantificar com precisão o gasto dos exercícios ou recordatórios de atividade diária do paciente, somando-o à <strong>TMB (Taxa Metabólica Basal)</strong> para uma prescrição dietética assertiva.
              </p>
            </div>
          </div>

          {/* Scientific References */}
          <div className="p-4 bg-gray-50 dark:bg-[#18181B] rounded-xl border border-gray-100 dark:border-[#27272A] space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            <h5 className="font-bold text-gray-700 dark:text-gray-300">Referências Científicas:</h5>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ainsworth BE, Haskell WL, Herrmann SD, et al. <em>2011 Compendium of Physical Activities: a second update of codes and MET intensities</em>. Med Sci Sports Exerc. 2011;43(8):1575-1581.</li>
              <li>Nutritotal PRO. <em>MET (múltiplos de equivalentes metabólicos) - Calculadora</em>. 2022.</li>
              <li>CDC - Centers for Disease Control and Prevention. <em>General Physical Activities Defined by Level of Intensity</em>. 2022.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
