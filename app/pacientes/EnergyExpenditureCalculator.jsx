'use client';
import React, { useState, useEffect, useMemo } from 'react';

export default function EnergyExpenditureCalculator({ selectedPatient, latestAnthropometry, formAnthropometry }) {
  // Extract initial values from patient & anthropometry
  const patientGender = (selectedPatient?.gender || '').toLowerCase().startsWith('f') ? 'feminino' : 'masculino';
  
  const getPatientAge = (birthDateString) => {
    if (!birthDateString) return 25;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 25;
  };

  const initialAge = selectedPatient?.birth_date ? getPatientAge(selectedPatient.birth_date) : 25;
  const initialWeight = formAnthropometry?.weight_kg || latestAnthropometry?.weight_kg || '';
  const initialHeight = formAnthropometry?.height_cm || latestAnthropometry?.height_cm || '';
  const initialBodyFat = formAnthropometry?.body_fat_pct || latestAnthropometry?.body_fat_pct || '';
  const initialLeanMass = formAnthropometry?.lean_mass_kg || latestAnthropometry?.lean_mass_kg || '';

  // Form states
  const [weight, setWeight] = useState(initialWeight ? String(initialWeight) : '');
  const [height, setHeight] = useState(initialHeight ? String(initialHeight) : '');
  const [age, setAge] = useState(initialAge ? String(initialAge) : '25');
  const [gender, setGender] = useState(patientGender);
  const [bodyFat, setBodyFat] = useState(initialBodyFat ? String(initialBodyFat) : '');
  const [leanMass, setLeanMass] = useState(initialLeanMass ? String(initialLeanMass) : '');

  const [formula, setFormula] = useState('mifflin'); // 'mifflin', 'harris_roza', 'harris_orig', 'katch', 'cunningham', 'fao_who', 'schofield', 'henry_rees', 'dri_eer', 'tinsley', 'pocket_rule', 'all'
  const [naf, setNaf] = useState('1.55'); // Nível de atividade física
  const [customNaf, setCustomNaf] = useState('1.55');
  const [injuryFactor, setInjuryFactor] = useState('1.0'); // Fator Injúria / Estresse
  const [useTef, setUseTef] = useState(false); // Efeito Térmico dos Alimentos (+10%)
  const [goal, setGoal] = useState('manutencao'); // 'deficit_300', 'deficit_500', 'deficit_750', 'manutencao', 'superavit_250', 'superavit_500', 'custom'
  const [customAdjustment, setCustomAdjustment] = useState('0'); // kcal adjustment
  const [pocketKcalPerKg, setPocketKcalPerKg] = useState('30'); // For pocket rule

  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync with prop changes if patient or anthropometry updates
  useEffect(() => {
    if (formAnthropometry?.weight_kg) setWeight(String(formAnthropometry.weight_kg));
    else if (latestAnthropometry?.weight_kg && !weight) setWeight(String(latestAnthropometry.weight_kg));

    if (formAnthropometry?.height_cm) setHeight(String(formAnthropometry.height_cm));
    else if (latestAnthropometry?.height_cm && !height) setHeight(String(latestAnthropometry.height_cm));

    if (formAnthropometry?.body_fat_pct) setBodyFat(String(formAnthropometry.body_fat_pct));
    else if (latestAnthropometry?.body_fat_pct && !bodyFat) setBodyFat(String(latestAnthropometry.body_fat_pct));

    if (formAnthropometry?.lean_mass_kg) setLeanMass(String(formAnthropometry.lean_mass_kg));
    else if (latestAnthropometry?.lean_mass_kg && !leanMass) setLeanMass(String(latestAnthropometry.lean_mass_kg));
  }, [formAnthropometry, latestAnthropometry]);

  // Sync age and gender when selectedPatient changes
  useEffect(() => {
    if (selectedPatient?.birth_date) {
      setAge(String(getPatientAge(selectedPatient.birth_date)));
    }
    if (selectedPatient?.gender) {
      setGender(selectedPatient.gender.toLowerCase().startsWith('f') ? 'feminino' : 'masculino');
    }
  }, [selectedPatient]);

  const p = parseFloat(weight) || 0;
  const a = parseFloat(height) || 0;
  const i = parseInt(age, 10) || 0;
  const bf = parseFloat(bodyFat) || 0;
  // Compute lean mass if not explicitly given but weight and %BF are present
  const calculatedLeanMass = parseFloat(leanMass) || (p && bf ? p * (1 - bf / 100) : 0);

  const activeNaf = naf === 'custom' ? (parseFloat(customNaf) || 1.2) : parseFloat(naf);
  const activeInjury = parseFloat(injuryFactor) || 1.0;
  const tefMultiplier = useTef ? 1.10 : 1.0;

  // Calculate formulas
  const calculations = useMemo(() => {
    if (p <= 0) return null;

    const isMasc = gender === 'masculino';

    // 1. Mifflin-St Jeor (1990)
    let tmbMifflin = 0;
    if (a > 0 && i > 0) {
      tmbMifflin = isMasc
        ? (10 * p) + (6.25 * a) - (5 * i) + 5
        : (10 * p) + (6.25 * a) - (5 * i) - 161;
    }

    // 2. Harris-Benedict (1984 - Roza & Shizgal Revisada)
    let tmbHarrisRoza = 0;
    if (a > 0 && i > 0) {
      tmbHarrisRoza = isMasc
        ? 88.362 + (13.397 * p) + (4.799 * a) - (5.677 * i)
        : 447.593 + (9.247 * p) + (3.098 * a) - (4.330 * i);
    }

    // 3. Harris-Benedict (1919 - Original)
    let tmbHarrisOrig = 0;
    if (a > 0 && i > 0) {
      tmbHarrisOrig = isMasc
        ? 66.473 + (13.7516 * p) + (5.0033 * a) - (6.7550 * i)
        : 655.0955 + (9.5634 * p) + (1.8496 * a) - (4.6756 * i);
    }

    // 4. Katch-McArdle (1996)
    let tmbKatch = 0;
    if (calculatedLeanMass > 0) {
      tmbKatch = 370 + (21.6 * calculatedLeanMass);
    }

    // 5. Cunningham (1980 / 1991)
    let tmbCunningham = 0;
    if (calculatedLeanMass > 0) {
      tmbCunningham = 500 + (22 * calculatedLeanMass);
    }

    // 6. FAO / OMS / UNU (1985 / 2004)
    let tmbFao = 0;
    if (isMasc) {
      if (i < 3) tmbFao = (60.9 * p) - 54;
      else if (i <= 10) tmbFao = (22.7 * p) + 495;
      else if (i <= 18) tmbFao = (17.5 * p) + 651;
      else if (i <= 30) tmbFao = (15.3 * p) + 679;
      else if (i <= 60) tmbFao = (11.6 * p) + 879;
      else tmbFao = (13.5 * p) + 487;
    } else {
      if (i < 3) tmbFao = (61.0 * p) - 51;
      else if (i <= 10) tmbFao = (22.5 * p) + 499;
      else if (i <= 18) tmbFao = (12.2 * p) + 746;
      else if (i <= 30) tmbFao = (14.7 * p) + 496;
      else if (i <= 60) tmbFao = (8.7 * p) + 829;
      else tmbFao = (10.5 * p) + 596;
    }

    // 7. Schofield (1985 - W/H)
    let tmbSchofield = 0;
    if (a > 0) {
      if (isMasc) {
        if (i < 3) tmbSchofield = (0.167 * p) + (15.174 * a) - 617.6 > 0 ? (0.167 * p) + (15.174 * a) - 617.6 : (59.512 * p) - 30.4;
        else if (i <= 10) tmbSchofield = (19.59 * p) + (1.303 * a) + 414.9;
        else if (i <= 18) tmbSchofield = (16.25 * p) + (1.372 * a) + 515.5;
        else if (i <= 30) tmbSchofield = (15.057 * p) - (1.004 * a) + 705.8;
        else if (i <= 60) tmbSchofield = (11.472 * p) + (0.873 * a) + 873.1;
        else tmbSchofield = (11.711 * p) + (0.588 * a) + 587.7;
      } else {
        if (i < 3) tmbSchofield = (16.252 * p) + (10.232 * a) - 413.5 > 0 ? (16.252 * p) + (10.232 * a) - 413.5 : (58.317 * p) - 31.1;
        else if (i <= 10) tmbSchofield = (16.969 * p) + (1.618 * a) + 371.2;
        else if (i <= 18) tmbSchofield = (8.365 * p) + (4.65 * a) + 200.0;
        else if (i <= 30) tmbSchofield = (13.623 * p) + (2.83 * a) + 98.2;
        else if (i <= 60) tmbSchofield = (8.126 * p) + (8.456 * a) - 686.0 > 0 ? (8.126 * p) + (8.456 * a) - 686.0 : (8.7 * p) - (0.025 * a) + 865;
        else tmbSchofield = (9.082 * p) + (6.585 * a) + 46.5;
      }
    } else {
      tmbSchofield = tmbFao;
    }

    // 8. Henry & Rees (1991 / Oxford 2005 - Tropicais)
    let tmbHenry = 0;
    if (isMasc) {
      if (i <= 30) tmbHenry = (14.4 * p) + 778;
      else if (i <= 60) tmbHenry = (13.7 * p) + 801;
      else tmbHenry = (12.6 * p) + 682;
    } else {
      if (i <= 30) tmbHenry = (13.1 * p) + 558;
      else if (i <= 60) tmbHenry = (9.74 * p) + 694;
      else tmbHenry = (10.1 * p) + 569;
    }

    // 9. DRI / IOM (2002/2005 - EER)
    let getDri = 0;
    let tmbDri = 0;
    if (a > 0 && i > 0) {
      // Activity coefficient PA for DRI
      let pa = 1.0;
      if (activeNaf >= 1.9) pa = isMasc ? 1.48 : 1.45;
      else if (activeNaf >= 1.7) pa = isMasc ? 1.25 : 1.27;
      else if (activeNaf >= 1.4) pa = isMasc ? 1.11 : 1.12;
      else pa = 1.0;

      const altMeters = a / 100;
      if (isMasc) {
        getDri = 662 - (9.53 * i) + pa * ((15.91 * p) + (539.6 * altMeters));
      } else {
        getDri = 354 - (6.91 * i) + pa * ((9.36 * p) + (726.0 * altMeters));
      }
      tmbDri = getDri / pa;
    }

    // 10. Tinsley (2018 - Musculação / Atletas)
    let tmbTinsley = 0;
    if (calculatedLeanMass > 0) {
      tmbTinsley = (25.9 * calculatedLeanMass) + 284;
    } else {
      tmbTinsley = (24.8 * p) + 10;
    }

    // 11. Regra de Bolso (kcal/kg)
    const pocketKcal = parseFloat(pocketKcalPerKg) || 30;
    const getPocket = p * pocketKcal;
    const tmbPocket = getPocket / activeNaf;

    // Helper to build formula object
    const makeFormula = (id, name, tmbValue, directGet = null, requiresComposition = false, description = '') => {
      const valid = tmbValue > 0 || (directGet && directGet > 0);
      const finalTmb = Math.round(tmbValue);
      const finalGet = Math.round(directGet ? directGet * activeInjury * tefMultiplier : finalTmb * activeNaf * activeInjury * tefMultiplier);
      
      let goalDelta = 0;
      if (goal === 'deficit_300') goalDelta = -300;
      else if (goal === 'deficit_500') goalDelta = -500;
      else if (goal === 'deficit_750') goalDelta = -750;
      else if (goal === 'superavit_250') goalDelta = 250;
      else if (goal === 'superavit_500') goalDelta = 500;
      else if (goal === 'custom') goalDelta = parseFloat(customAdjustment) || 0;

      const vet = Math.max(800, finalGet + goalDelta);
      const kcalPerKg = p > 0 ? (vet / p).toFixed(1) : '0';

      return {
        id,
        name,
        tmb: finalTmb,
        get: finalGet,
        vet,
        kcalPerKg,
        valid,
        requiresComposition,
        description
      };
    };

    const list = [
      makeFormula('mifflin', 'Mifflin-St Jeor (1990)', tmbMifflin, null, false, 'Padrão-ouro clínico recomendado pela ADA/AND para adultos eutróficos e obesos.'),
      makeFormula('harris_roza', 'Harris-Benedict (1984 - Revisada)', tmbHarrisRoza, null, false, 'Equação clássica revisada por Roza & Shizgal, amplamente utilizada.'),
      makeFormula('harris_orig', 'Harris-Benedict (1919 - Original)', tmbHarrisOrig, null, false, 'Equação original histórica de Harris-Benedict.'),
      makeFormula('katch', 'Katch-McArdle (1996)', tmbKatch, null, true, 'Baseada na massa livre de gordura (massa magra). Altamente precisa para indivíduos ativos.'),
      makeFormula('cunningham', 'Cunningham (1980 / 1991)', tmbCunningham, null, true, 'Baseada na massa livre de gordura (FFM), excelente para atletas e esportistas.'),
      makeFormula('fao_who', 'FAO / OMS / UNU (1985 / 2004)', tmbFao, null, false, 'Equação da Organização Mundial da Saúde baseada em faixas etárias.'),
      makeFormula('schofield', 'Schofield (1985)', tmbSchofield, null, false, 'Recomendação baseada em peso e estatura segmentada por faixas etárias.'),
      makeFormula('henry_rees', 'Henry & Rees (1991 / Oxford)', tmbHenry, null, false, 'Adaptada para populações residentes em climas tropicais e subtropicais.'),
      makeFormula('dri_eer', 'DRI / IOM (2002 / 2005 - EER)', tmbDri, getDri, false, 'Requisito Energético Estimado pelas Diretrizes Dietéticas do Institute of Medicine.'),
      makeFormula('tinsley', 'Tinsley (2018 - Treinamento Resistido)', tmbTinsley, null, false, 'Desenvolvida especificamente para praticantes de musculação e treinamento de força.'),
      makeFormula('pocket_rule', `Regra Prática (${pocketKcalPerKg} kcal/kg)`, tmbPocket, getPocket, false, 'Estimativa rápida direta por quilograma de peso corporal.')
    ];

    const validList = list.filter(item => item.valid);
    const avgTmb = validList.length ? Math.round(validList.reduce((acc, curr) => acc + curr.tmb, 0) / validList.length) : 0;
    const avgGet = validList.length ? Math.round(validList.reduce((acc, curr) => acc + curr.get, 0) / validList.length) : 0;
    const avgVet = validList.length ? Math.round(validList.reduce((acc, curr) => acc + curr.vet, 0) / validList.length) : 0;
    const minGet = validList.length ? Math.min(...validList.map(v => v.get)) : 0;
    const maxGet = validList.length ? Math.max(...validList.map(v => v.get)) : 0;

    const selectedItem = list.find(l => l.id === formula) || list[0];

    return {
      list,
      validList,
      selectedItem,
      avgTmb,
      avgGet,
      avgVet,
      minGet,
      maxGet
    };
  }, [p, a, i, gender, calculatedLeanMass, activeNaf, activeInjury, tefMultiplier, goal, customAdjustment, pocketKcalPerKg, formula]);

  // Sync inputs from current anthropometry record
  const syncWithAnthropometry = () => {
    if (formAnthropometry?.weight_kg || latestAnthropometry?.weight_kg) {
      setWeight(String(formAnthropometry?.weight_kg || latestAnthropometry?.weight_kg));
    }
    if (formAnthropometry?.height_cm || latestAnthropometry?.height_cm) {
      setHeight(String(formAnthropometry?.height_cm || latestAnthropometry?.height_cm));
    }
    if (formAnthropometry?.body_fat_pct || latestAnthropometry?.body_fat_pct) {
      setBodyFat(String(formAnthropometry?.body_fat_pct || latestAnthropometry?.body_fat_pct));
    }
    if (formAnthropometry?.lean_mass_kg || latestAnthropometry?.lean_mass_kg) {
      setLeanMass(String(formAnthropometry?.lean_mass_kg || latestAnthropometry?.lean_mass_kg));
    }
    if (selectedPatient?.birth_date) {
      setAge(String(getPatientAge(selectedPatient.birth_date)));
    }
    if (selectedPatient?.gender) {
      setGender(selectedPatient.gender.toLowerCase().startsWith('f') ? 'feminino' : 'masculino');
    }
  };

  const handleCopySummary = () => {
    if (!calculations || !calculations.selectedItem) return;
    const item = calculations.selectedItem;
    const lines = [
      `📊 *Cálculo de Gasto Energético - Amora Nutrição*`,
      `Paciente: ${selectedPatient?.name || 'Paciente'}`,
      `Dados: ${p} kg | ${a} cm | ${i} anos | Sexo: ${gender === 'masculino' ? 'Masculino' : 'Feminino'}${calculatedLeanMass > 0 ? ` | Massa Magra: ${calculatedLeanMass.toFixed(1)} kg` : ''}`,
      `---------------------------------`,
      `Fórmula Utilizada: ${item.name}`,
      `🔥 Taxa Metabólica Basal (TMB): ${item.tmb} kcal`,
      `⚡ Gasto Energético Total (GET): ${item.get} kcal (NAF: ${activeNaf}${activeInjury > 1 ? ` | F. Injúria: ${activeInjury}` : ''}${useTef ? ' | ETA: +10%' : ''})`,
      `🎯 Meta Calórica Prescrita (VET): ${item.vet} kcal (${item.kcalPerKg} kcal/kg/dia)`,
      `---------------------------------`,
      `Média de Todas as Fórmulas: TMB ~${calculations.avgTmb} kcal | GET ~${calculations.avgGet} kcal (Variação: ${calculations.minGet} - ${calculations.maxGet} kcal)`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Macro suggested breakdown based on selected VET
  const macroBreakdown = useMemo(() => {
    if (!calculations?.selectedItem || p <= 0) return null;
    const vet = calculations.selectedItem.vet;
    
    // Determine macro split based on goal / context
    let protPerKg = 2.0; // g/kg
    let fatPct = 0.25; // 25% of calories from fat

    if (goal.startsWith('deficit')) {
      protPerKg = 2.2; // High protein in deficit to preserve muscle
      fatPct = 0.25;
    } else if (goal.startsWith('superavit')) {
      protPerKg = 2.0;
      fatPct = 0.22;
    } else {
      protPerKg = 1.8;
      fatPct = 0.25;
    }

    const protGrams = Math.round(p * protPerKg);
    const protKcal = protGrams * 4;
    const fatKcal = Math.round(vet * fatPct);
    const fatGrams = Math.round(fatKcal / 9);
    const carbKcal = Math.max(0, vet - protKcal - fatKcal);
    const carbGrams = Math.round(carbKcal / 4);
    const carbPerKg = (carbGrams / p).toFixed(1);
    const fatPerKg = (fatGrams / p).toFixed(1);

    const protPercent = Math.round((protKcal / vet) * 100);
    const carbPercent = Math.round((carbKcal / vet) * 100);
    const fatPercent = Math.max(0, 100 - protPercent - carbPercent);

    return {
      prot: { grams: protGrams, gPerKg: protPerKg.toFixed(1), kcal: protKcal, pct: protPercent },
      carb: { grams: carbGrams, gPerKg: carbPerKg, kcal: carbKcal, pct: carbPercent },
      fat: { grams: fatGrams, gPerKg: fatPerKg, kcal: fatKcal, pct: fatPercent }
    };
  }, [calculations, p, goal]);

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-purple-200 dark:border-[#27272A] p-4 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-[#27272A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
            <span className="material-symbols-outlined text-2xl">local_fire_department</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-gray-900 dark:text-white">Calculadora de Gasto Energético</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                11 Fórmulas
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Taxa Metabólica Basal (TMB), Gasto Energético Total (GET) e Valor Energético Total (VET)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={syncWithAnthropometry}
            title="Sincronizar variáveis com a avaliação mais recente"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#27272A] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-purple-600">sync</span>
            <span>Sincronizar Dados</span>
          </button>
          
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272A] transition-colors"
            title={isExpanded ? 'Recolher calculadora' : 'Expandir calculadora'}
          >
            <span className="material-symbols-outlined text-xl">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Step 1: Input Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-gray-50/70 dark:bg-[#0A0A0B]/60 rounded-xl border border-gray-100 dark:border-[#27272A]">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Peso (kg) <span className="text-purple-600">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 70.0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Altura (cm) <span className="text-purple-600">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Ex: 175"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Idade (anos) <span className="text-purple-600">*</span>
              </label>
              <input
                type="number"
                placeholder="Ex: 28"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Sexo Biológico <span className="text-purple-600">*</span>
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2.5 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                % Gordura <span className="text-gray-400 text-[10px]">(opcional)</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 18.5"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Massa Magra (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder={calculatedLeanMass > 0 ? calculatedLeanMass.toFixed(1) : 'Ex: 56.0'}
                value={leanMass}
                onChange={e => setLeanMass(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>
          </div>

          {/* Step 2: Multipliers & Factors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nível de Atividade Física (NAF) */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                <span>Nível de Atividade (NAF)</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono font-bold text-xs">{activeNaf}x</span>
              </label>
              <select
                value={naf}
                onChange={e => setNaf(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              >
                <option value="1.2">Sedentário (1.20) - Pouco/nenhum exercício</option>
                <option value="1.375">Leve (1.375) - Exercício 1-3 dias/sem</option>
                <option value="1.55">Moderado (1.55) - Treino regular 3-5 dias/sem</option>
                <option value="1.725">Intenso (1.725) - Treino pesado 6-7 dias/sem</option>
                <option value="1.9">Muito Intenso (1.90) - Atleta / Treino 2x/dia</option>
                <option value="custom">Personalizado (Digitar valor)</option>
              </select>
              {naf === 'custom' && (
                <input
                  type="number"
                  step="0.05"
                  placeholder="Ex: 1.6"
                  value={customNaf}
                  onChange={e => setCustomNaf(e.target.value)}
                  className="w-full mt-1.5 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              )}
            </div>

            {/* Fator Injúria / Estresse Clínico */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                <span>Fator Injúria / Estresse</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono font-bold text-xs">{activeInjury}x</span>
              </label>
              <select
                value={injuryFactor}
                onChange={e => setInjuryFactor(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              >
                <option value="1.0">1.00 - Normal / Paciente Ambulatorial</option>
                <option value="1.1">1.10 - Pós-operatório eletivo / Cirurgia leve</option>
                <option value="1.2">1.20 - Fratura / Trauma esquelético</option>
                <option value="1.35">1.35 - Infecção moderada / Sepse</option>
                <option value="1.5">1.50 - Politrauma / Trauma craniano severo</option>
                <option value="1.75">1.75 - Queimadura extensa (&gt;40% SCQ)</option>
              </select>
            </div>

            {/* Objetivo / Meta Calórica */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Objetivo / Prescrição Calórica
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-gray-500 dark:text-gray-400 hover:text-purple-600">
                  <input
                    type="checkbox"
                    checked={useTef}
                    onChange={e => setUseTef(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                  />
                  <span>+ETA (10%)</span>
                </label>
              </div>
              <select
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              >
                <option value="manutencao">Manutenção Energética (GET 100%)</option>
                <option value="deficit_300">Emagrecimento Leve (-300 kcal/dia)</option>
                <option value="deficit_500">Emagrecimento Moderado (-500 kcal/dia)</option>
                <option value="deficit_750">Emagrecimento Agressivo (-750 kcal/dia)</option>
                <option value="superavit_250">Hipertrofia Leve (+250 kcal/dia)</option>
                <option value="superavit_500">Hipertrofia / Bulking (+500 kcal/dia)</option>
                <option value="custom">Ajuste Personalizado (kcal)</option>
              </select>
              {goal === 'custom' && (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="number"
                    placeholder="Ex: -400 ou +350"
                    value={customAdjustment}
                    onChange={e => setCustomAdjustment(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                  <span className="text-xs text-gray-500 font-bold whitespace-nowrap">kcal</span>
                </div>
              )}
            </div>
          </div>

          {/* Formula Selector Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-purple-600">functions</span>
                <span>Fórmula de Cálculo</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormula('all')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    formula === 'all'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#27272A] text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">table_chart</span>
                  <span>Comparar Todas as 11 Fórmulas</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                { id: 'mifflin', name: 'Mifflin-St Jeor (1990)', tag: 'Padrão-Ouro' },
                { id: 'harris_roza', name: 'Harris-Benedict (1984)', tag: 'Revisada' },
                { id: 'harris_orig', name: 'Harris-Benedict (1919)', tag: 'Clássica' },
                { id: 'katch', name: 'Katch-McArdle (1996)', tag: 'Massa Magra' },
                { id: 'cunningham', name: 'Cunningham (1980)', tag: 'Atletas/FFM' },
                { id: 'fao_who', name: 'FAO / OMS (1985)', tag: 'Idade/Peso' },
                { id: 'schofield', name: 'Schofield (1985)', tag: 'Peso/Altura' },
                { id: 'henry_rees', name: 'Henry & Rees (1991)', tag: 'Tropical' },
                { id: 'dri_eer', name: 'DRI / IOM (2005)', tag: 'EER' },
                { id: 'tinsley', name: 'Tinsley (2018)', tag: 'Musculação' },
                { id: 'pocket_rule', name: 'Regra Prática (kcal/kg)', tag: 'Direta' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormula(f.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all relative ${
                    formula === f.id
                      ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-900/20 text-purple-900 dark:text-purple-200 ring-1 ring-purple-600'
                      : 'border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0B] text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold truncate pr-1">{f.name}</p>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      formula === f.id
                        ? 'bg-purple-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {f.tag}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {formula === 'pocket_rule' && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200">Faixa calórica por kg:</span>
                <div className="flex items-center gap-2">
                  {['20', '25', '30', '35', '40'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPocketKcalPerKg(val)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        pocketKcalPerKg === val
                          ? 'bg-purple-700 text-white'
                          : 'bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {val} kcal/kg
                    </button>
                  ))}
                  <input
                    type="number"
                    value={pocketKcalPerKg}
                    onChange={e => setPocketKcalPerKg(e.target.value)}
                    className="w-16 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1 text-xs font-bold text-center dark:text-white"
                  />
                  <span className="text-xs text-gray-500">kcal/kg/dia</span>
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          {calculations ? (
            <div className="space-y-4 pt-2">
              {/* Primary Highlights: TMB, GET, VET */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* TMB Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200 dark:border-amber-900/40">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Taxa Metabólica Basal</span>
                    <span className="material-symbols-outlined text-lg">bedtime</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                      {calculations.selectedItem?.tmb || calculations.avgTmb}
                    </span>
                    <span className="text-xs font-bold text-gray-500">kcal/dia</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Gasto mínimo em repouso absoluto
                  </p>
                </div>

                {/* GET Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200 dark:border-blue-900/40">
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Gasto Total (GET / TDEE)</span>
                    <span className="material-symbols-outlined text-lg">directions_run</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                      {calculations.selectedItem?.get || calculations.avgGet}
                    </span>
                    <span className="text-xs font-bold text-gray-500">kcal/dia</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    TMB × NAF ({activeNaf}x){activeInjury > 1 ? ` × Injúria (${activeInjury})` : ''}
                  </p>
                </div>

                {/* VET Meta Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/10 border border-purple-300 dark:border-purple-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Meta Diária (VET)</span>
                    <span className="material-symbols-outlined text-lg">flag</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300">
                      {calculations.selectedItem?.vet || calculations.avgVet}
                    </span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">kcal/dia</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                      {calculations.selectedItem?.kcalPerKg} kcal/kg/dia
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                      {goal === 'manutencao' ? 'Manutenção' : goal.startsWith('deficit') ? 'Déficit' : 'Superávit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparative Table View if 'all' is selected or toggle is on */}
              {formula === 'all' && (
                <div className="border border-gray-200 dark:border-[#27272A] rounded-xl overflow-hidden bg-white dark:bg-[#0A0A0B]">
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-900/20 border-b border-gray-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-purple-600">compare</span>
                        <span>Comparativo de Todas as Equações Preditivas</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Média geral: TMB ~{calculations.avgTmb} kcal | GET ~{calculations.avgGet} kcal (Faixa: {calculations.minGet} a {calculations.maxGet} kcal)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-[#18181B] text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-[#27272A]">
                        <tr>
                          <th className="p-3">Equação / Fórmula</th>
                          <th className="p-3 text-right">TMB (Basal)</th>
                          <th className="p-3 text-right">GET (Gasto Total)</th>
                          <th className="p-3 text-right">VET (Meta Prescrita)</th>
                          <th className="p-3 text-right">kcal / kg</th>
                          <th className="p-3 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#27272A]">
                        {calculations.list.map(item => (
                          <tr
                            key={item.id}
                            className={`hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors ${
                              item.id === 'mifflin' ? 'font-medium bg-purple-50/20 dark:bg-purple-900/5' : ''
                            }`}
                          >
                            <td className="p-3">
                              <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-[10px] text-gray-400">{item.description}</p>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                              {item.tmb ? `${item.tmb} kcal` : '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                              {item.get ? `${item.get} kcal` : '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-purple-700 dark:text-purple-300">
                              {item.vet ? `${item.vet} kcal` : '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-gray-500 dark:text-gray-400">
                              {item.kcalPerKg}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setFormula(item.id)}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors"
                              >
                                Selecionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Macro Breakdown Box */}
              {macroBreakdown && (
                <div className="p-4 bg-gray-50 dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-purple-600">pie_chart</span>
                      <span>Sugestão de Distribuição de Macronutrientes</span>
                    </h4>
                    <span className="text-[11px] text-gray-400">Baseado no VET ({calculations.selectedItem?.vet || calculations.avgVet} kcal)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Proteína */}
                    <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-red-100 dark:border-red-900/30">
                      <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                        <span>Proteínas ({macroBreakdown.prot.pct}%)</span>
                        <span>{macroBreakdown.prot.gPerKg} g/kg</span>
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        {macroBreakdown.prot.grams} g
                      </p>
                      <p className="text-[10px] text-gray-400">{macroBreakdown.prot.kcal} kcal</p>
                    </div>

                    {/* Carboidratos */}
                    <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-amber-100 dark:border-amber-900/30">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                        <span>Carboidratos ({macroBreakdown.carb.pct}%)</span>
                        <span>{macroBreakdown.carb.gPerKg} g/kg</span>
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        {macroBreakdown.carb.grams} g
                      </p>
                      <p className="text-[10px] text-gray-400">{macroBreakdown.carb.kcal} kcal</p>
                    </div>

                    {/* Lipídios */}
                    <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                        <span>Gorduras ({macroBreakdown.fat.pct}%)</span>
                        <span>{macroBreakdown.fat.gPerKg} g/kg</span>
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        {macroBreakdown.fat.grams} g
                      </p>
                      <p className="text-[10px] text-gray-400">{macroBreakdown.fat.kcal} kcal</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-gray-400 italic">
                  * Valores calculados conforme diretrizes internacionais de nutrição clínica e esportiva.
                </p>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                  <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Resumo do Cálculo'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 bg-gray-50 dark:bg-[#0A0A0B] rounded-xl">
              <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">calculate</span>
              <p className="text-xs">Preencha o peso e altura do paciente para calcular o gasto energético.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
