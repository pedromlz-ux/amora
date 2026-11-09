"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ConsultaTab from './ConsultaTab';
import HistoricoConsultasTab from './HistoricoConsultasTab';
import AlimentosTab from './AlimentosTab';
import ChatTab from './ChatTab';
import EnergyExpenditureCalculator from './EnergyExpenditureCalculator';
import { supabase } from '../lib/supabaseClient';

// ─── Utility ─────────────────────────────────────────────────────────────────
const HOUSEHOLD_UNITS = new Set(['un', 'colher', 'colher_sopa', 'colher_cha', 'xicara', 'copo', 'fatia', 'concha', 'pegador', 'prato_raso', 'prato_fundo']);

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
  if (unit === 'colher' || unit === 'colher_sopa') {
    if (desc.includes('arroz') || desc.includes('macarrão')) return 25;
    if (desc.includes('feijão') || desc.includes('lentilha')) return 20;
    if (desc.includes('azeite') || desc.includes('óleo') || desc.includes('manteiga')) return 13;
    if (desc.includes('açúcar') || desc.includes('mel')) return 15;
    return 15;
  }
  if (unit === 'colher_cha') return 5;
  if (unit === 'xicara') return 150;
  if (unit === 'copo') return 200;
  if (unit === 'fatia') return desc.includes('pão') ? 25 : 30;
  if (unit === 'pegador') return 80;
  if (unit === 'prato_raso') return 250;
  if (unit === 'prato_fundo') return 350;
  if (unit === 'concha') {
    if (desc.includes('arroz') || desc.includes('macarrão')) return 80;
    if (desc.includes('feijão') || desc.includes('lentilha')) return 100;
    return 80;
  }
  return 100;
};
const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const calculateAge = (birthDateString) => {
  if (!birthDateString) return '';
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} anos`;
};

// ─── Tab Components ───────────────────────────────────────────────────────────

function AnamneseTab({ patientId, token }) {
  const fields = [
    { key: 'chief_complaint', label: 'Queixa Principal / Objetivo', rows: 2 },
    { key: 'pathologies', label: 'Diagnóstico / Patologias', rows: 2 },
    { key: 'medications', label: 'Medicamentos em Uso', rows: 2 },
    { key: 'food_history', label: 'História Alimentar', rows: 3 },
    { key: 'meal_frequency', label: 'Frequência / Horário das Refeições', rows: 2 },
    { key: 'intolerances', label: 'Intolerâncias e Alergias Alimentares', rows: 2 },
    { key: 'physical_activity', label: 'Atividade Física (tipo, frequência, duração)', rows: 2 },
    { key: 'water_intake', label: 'Ingestão Hídrica Diária', rows: 1 },
    { key: 'bowel_habit', label: 'Hábito Intestinal', rows: 1 },
    { key: 'sleep_quality', label: 'Qualidade do Sono', rows: 1 },
    { key: 'notes', label: 'Observações Gerais', rows: 3 },
  ];
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetch(`/api/patients/${patientId}/anamnese`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setForm(d || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [patientId, token]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/patients/${patientId}/anamnese`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key} className={f.rows >= 3 ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
            <textarea
              rows={f.rows}
              value={form[f.key] || ''}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white resize-none"
              placeholder={`Registre aqui ${f.label.toLowerCase()}...`}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-purple-700 text-white py-3 rounded-xl font-bold hover:bg-purple-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
        <span className="material-symbols-outlined text-sm">{saved ? 'check_circle' : 'save'}</span>
        <span>{saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Anamnese'}</span>
      </button>
    </div>
  );
}

function AnthropometryTab({ patientId, selectedPatient, token }) {
  const emptyForm = { assessment_date: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '', waist_cm: '', hip_cm: '', arm_cm: '', calf_cm: '', triceps_skinfold: '', subscapular_skinfold: '', abdominal_skinfold: '', suprailiac_skinfold: '', body_fat_pct: '', lean_mass_kg: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/patients/${patientId}/anthropometry`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json(); setHistory(d);
  }, [patientId, token]);

  useEffect(() => { if (patientId) load(); }, [patientId, load]);

  const imc = form.weight_kg && form.height_cm ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1) : null;
  const rcq = form.waist_cm && form.hip_cm ? (parseFloat(form.waist_cm) / parseFloat(form.hip_cm)).toFixed(2) : null;
  const rce = form.waist_cm && form.height_cm ? (parseFloat(form.waist_cm) / parseFloat(form.height_cm)).toFixed(2) : null;

  const getImcClass = (val) => {
    const v = parseFloat(val);
    if(v < 18.5) return 'Baixo peso';
    if(v < 25) return 'Eutrofia';
    if(v < 30) return 'Sobrepeso';
    if(v < 35) return 'Obesidade I';
    if(v < 40) return 'Obesidade II';
    return 'Obesidade III';
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/patients/${patientId}/anthropometry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, imc: imc ? parseFloat(imc) : null })
    });
    setSaving(false); setShowForm(false); setForm(emptyForm); load();
  };

  const fields = [
    { key: 'weight_kg', label: 'Peso (kg)', ph: '70.0' },
    { key: 'height_cm', label: 'Altura (cm)', ph: '170.0' },
    { key: 'waist_cm', label: 'Cintura (cm)', ph: '80.0' },
    { key: 'hip_cm', label: 'Quadril (cm)', ph: '95.0' },
    { key: 'arm_cm', label: 'CB (cm)', ph: '28.0' },
    { key: 'calf_cm', label: 'Panturrilha (cm)', ph: '35.0' },
    { key: 'triceps_skinfold', label: 'DC Tricipital (mm)', ph: '15.0' },
    { key: 'subscapular_skinfold', label: 'DC Subescapular (mm)', ph: '12.0' },
    { key: 'abdominal_skinfold', label: 'DC Abdominal (mm)', ph: '20.0' },
    { key: 'suprailiac_skinfold', label: 'DC Suprailíaca (mm)', ph: '18.0' },
    { key: 'body_fat_pct', label: '% Gordura Estimada', ph: '25.0' },
    { key: 'lean_mass_kg', label: 'Massa Magra (kg)', ph: '52.0' },
  ];

  return (
    <div className="space-y-6">
      {/* Calculadora de Gasto Energético com Todas as Fórmulas */}
      <EnergyExpenditureCalculator
        selectedPatient={selectedPatient}
        latestAnthropometry={history[0]}
        formAnthropometry={showForm ? form : null}
      />

      <div className="flex items-center justify-between pt-2">
        <h4 className="text-sm font-bold dark:text-white">Histórico de Avaliações</h4>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-800 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-1.5 transition-colors">
          <span className="material-symbols-outlined text-sm">{showForm ? 'remove' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nova Avaliação'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Data da Avaliação</label>
              <input type="date" value={form.assessment_date} onChange={e => setForm(p => ({ ...p, assessment_date: e.target.value }))}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                <input type="number" step="0.1" value={form[f.key]} placeholder={f.ph}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
              </div>
            ))}
            {(imc || rcq || rce) && (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                {imc && (
                  <div>
                    <p className="text-xs text-gray-500">IMC</p>
                    <p className="text-lg font-black text-purple-700">{imc} kg/m²</p>
                    <p className="text-[10px] font-bold text-purple-600 uppercase">{getImcClass(imc)}</p>
                  </div>
                )}
                {rcq && (
                  <div>
                    <p className="text-xs text-gray-500">RCQ (Cintura/Quadril)</p>
                    <p className="text-lg font-black text-purple-700">{rcq}</p>
                  </div>
                )}
                {rce && (
                  <div>
                    <p className="text-xs text-gray-500">RCE (Cintura/Estatura)</p>
                    <p className="text-lg font-black text-purple-700">{rce}</p>
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Observações</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white resize-none" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-purple-700 text-white py-2.5 rounded-xl font-bold hover:bg-purple-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">save</span>
            {saving ? 'Salvando...' : 'Salvar Avaliação'}
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">straighten</span>
          <p className="text-sm">Nenhuma avaliação antropométrica registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={h.id} className={`rounded-xl border p-4 ${i === 0 ? 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="text-[10px] font-bold bg-purple-700 text-white px-2 py-0.5 rounded-full">ATUAL</span>}
                  <p className="text-xs font-bold text-gray-500">{fmtDate(h.assessment_date)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {h.weight_kg && <div><p className="text-[10px] text-gray-400">Peso</p><p className="text-sm font-bold dark:text-white">{h.weight_kg} kg</p></div>}
                {h.imc && <div><p className="text-[10px] text-gray-400">IMC</p><p className="text-sm font-bold dark:text-white">{h.imc} kg/m²</p></div>}
                {h.body_fat_pct && <div><p className="text-[10px] text-gray-400">% Gordura</p><p className="text-sm font-bold dark:text-white">{h.body_fat_pct}%</p></div>}
                {h.lean_mass_kg && <div><p className="text-[10px] text-gray-400">Massa Magra</p><p className="text-sm font-bold dark:text-white">{h.lean_mass_kg} kg</p></div>}
                {h.waist_cm && <div><p className="text-[10px] text-gray-400">Cintura</p><p className="text-sm font-bold dark:text-white">{h.waist_cm} cm</p></div>}
                {h.hip_cm && <div><p className="text-[10px] text-gray-400">Quadril</p><p className="text-sm font-bold dark:text-white">{h.hip_cm} cm</p></div>}
                {h.arm_cm && <div><p className="text-[10px] text-gray-400">CB</p><p className="text-sm font-bold dark:text-white">{h.arm_cm} cm</p></div>}
                {h.calf_cm && <div><p className="text-[10px] text-gray-400">Panturrilha</p><p className="text-sm font-bold dark:text-white">{h.calf_cm} cm</p></div>}
              </div>
              {h.notes && <p className="text-xs text-gray-500 mt-2 italic">{h.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BiaTab({ patientId, token }) {
  const emptyForm = { assessment_date: new Date().toISOString().split('T')[0], weight_kg: '', body_fat_pct: '', fat_mass_kg: '', lean_mass_kg: '', muscle_mass_kg: '', total_body_water_pct: '', icw_l: '', ecw_l: '', bmr_kcal: '', visceral_fat_level: '', bone_mass_kg: '', phase_angle: '', device: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [analyzingBia, setAnalyzingBia] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/patients/${patientId}/bia`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json(); setHistory(d);
  }, [patientId, token]);

  useEffect(() => { if (patientId) load(); }, [patientId, load]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/patients/${patientId}/bia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setSaving(false); setShowForm(false); setForm(emptyForm); load();
  };

  const handleBiaImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingBia(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        try {
          const res = await fetch('/api/analise-bia', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileType: file.type
            })
          });

          if (!res.ok) throw new Error('Falha ao processar imagem.');
          const data = await res.json();

          // Prefill BIA form fields
          setForm(p => ({
            ...p,
            weight_kg: data.weight_kg !== null ? String(data.weight_kg) : p.weight_kg,
            body_fat_pct: data.body_fat_pct !== null ? String(data.body_fat_pct) : p.body_fat_pct,
            fat_mass_kg: data.fat_mass_kg !== null ? String(data.fat_mass_kg) : p.fat_mass_kg,
            lean_mass_kg: data.lean_mass_kg !== null ? String(data.lean_mass_kg) : p.lean_mass_kg,
            muscle_mass_kg: data.muscle_mass_kg !== null ? String(data.muscle_mass_kg) : p.muscle_mass_kg,
            total_body_water_pct: data.total_body_water_pct !== null ? String(data.total_body_water_pct) : p.total_body_water_pct,
            icw_l: data.icw_l !== null ? String(data.icw_l) : p.icw_l,
            ecw_l: data.ecw_l !== null ? String(data.ecw_l) : p.ecw_l,
            bmr_kcal: data.bmr_kcal !== null ? String(data.bmr_kcal) : p.bmr_kcal,
            visceral_fat_level: data.visceral_fat_level !== null ? String(data.visceral_fat_level) : p.visceral_fat_level,
            bone_mass_kg: data.bone_mass_kg !== null ? String(data.bone_mass_kg) : p.bone_mass_kg,
            phase_angle: data.phase_angle !== null ? String(data.phase_angle) : p.phase_angle,
            device: data.device || p.device,
            notes: data.notes || p.notes,
          }));

          alert('Dados extraídos e preenchidos com sucesso!');
        } catch (err) {
          console.error(err);
          alert('Erro ao extrair informações do laudo.');
        } finally {
          setAnalyzingBia(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setAnalyzingBia(false);
    }
  };

  const biaFields = [
    { key: 'weight_kg', label: 'Peso (kg)', ph: '70.0' },
    { key: 'body_fat_pct', label: '% Gordura Corporal', ph: '25.0' },
    { key: 'fat_mass_kg', label: 'Massa Gorda (kg)', ph: '17.5' },
    { key: 'lean_mass_kg', label: 'Massa Magra (kg)', ph: '52.5' },
    { key: 'muscle_mass_kg', label: 'Massa Muscular (kg)', ph: '42.0' },
    { key: 'total_body_water_pct', label: 'Água Corporal Total (%)', ph: '55.0' },
    { key: 'icw_l', label: 'Água Intracelular (L)', ph: '22.0' },
    { key: 'ecw_l', label: 'Água Extracelular (L)', ph: '15.0' },
    { key: 'bmr_kcal', label: 'TMB pela BIA (kcal)', ph: '1500' },
    { key: 'visceral_fat_level', label: 'Gordura Visceral (nível)', ph: '8' },
    { key: 'bone_mass_kg', label: 'Massa Óssea (kg)', ph: '2.8' },
    { key: 'phase_angle', label: 'Ângulo de Fase (°)', ph: '5.5' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold dark:text-white">Histórico de BIA</h4>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-800 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-1.5 transition-colors">
          <span className="material-symbols-outlined text-sm">{showForm ? 'remove' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nova Avaliação'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] p-4 space-y-4">
          
          {/* Box de Upload para leitura IA */}
          <div className="p-4 rounded-xl border border-dashed border-purple-300 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-purple-700 text-3xl mb-1.5">auto_awesome</span>
            <p className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-1">Preenchimento Inteligente</p>
            <p className="text-[10px] text-gray-500 mb-3 max-w-[280px]">Anexe a imagem ou foto do resultado da BIA para preencher o formulário automaticamente com IA.</p>
            
            <input type="file" ref={fileInputRef} onChange={handleBiaImageUpload} className="hidden" accept="image/*" />
            
            <button 
              type="button"
              disabled={analyzingBia}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all disabled:opacity-60"
            >
              {analyzingBia ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Lendo laudo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>Anexar Foto da BIA</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Data da Avaliação</label>
              <input type="date" value={form.assessment_date} onChange={e => setForm(p => ({ ...p, assessment_date: e.target.value }))}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            {biaFields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                <input type="number" step="0.1" value={form[f.key]} placeholder={f.ph}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Equipamento Utilizado</label>
              <input type="text" value={form.device} placeholder="Ex: InBody 270, Tanita BC-545N..."
                onChange={e => setForm(p => ({ ...p, device: e.target.value }))}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Observações</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white resize-none" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-purple-700 text-white py-2.5 rounded-xl font-bold hover:bg-purple-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">save</span>
            {saving ? 'Salvando...' : 'Salvar BIA'}
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">monitor_weight</span>
          <p className="text-sm">Nenhuma bioimpedância registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={h.id} className={`rounded-xl border p-4 ${i === 0 ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">ATUAL</span>}
                  <p className="text-xs font-bold text-gray-500">{fmtDate(h.assessment_date)}</p>
                  {h.device && <p className="text-[10px] text-gray-400 italic">{h.device}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {h.weight_kg && <div><p className="text-[10px] text-gray-400">Peso</p><p className="text-sm font-bold dark:text-white">{h.weight_kg} kg</p></div>}
                {h.body_fat_pct && <div><p className="text-[10px] text-gray-400">% Gordura</p><p className="text-sm font-bold dark:text-white">{h.body_fat_pct}%</p></div>}
                {h.muscle_mass_kg && <div><p className="text-[10px] text-gray-400">Massa Muscular</p><p className="text-sm font-bold dark:text-white">{h.muscle_mass_kg} kg</p></div>}
                {h.lean_mass_kg && <div><p className="text-[10px] text-gray-400">Massa Magra</p><p className="text-sm font-bold dark:text-white">{h.lean_mass_kg} kg</p></div>}
                {h.total_body_water_pct && <div><p className="text-[10px] text-gray-400">Água Corporal</p><p className="text-sm font-bold dark:text-white">{h.total_body_water_pct}%</p></div>}
                {h.phase_angle && <div><p className="text-[10px] text-gray-400">Ângulo de Fase</p><p className="text-sm font-bold dark:text-white">{h.phase_angle}°</p></div>}
                {h.visceral_fat_level && <div><p className="text-[10px] text-gray-400">Gordura Visceral</p><p className="text-sm font-bold dark:text-white">Nível {h.visceral_fat_level}</p></div>}
                {h.bmr_kcal && <div><p className="text-[10px] text-gray-400">TMB (BIA)</p><p className="text-sm font-bold dark:text-white">{h.bmr_kcal} kcal</p></div>}
              </div>
              {h.notes && <p className="text-xs text-gray-500 mt-2 italic">{h.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamsTab({ patientId, token }) {
  const [exams, setExams] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState('sangue');
  const [examNotes, setExamNotes] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/patients/${patientId}/exams`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json(); setExams(d);
  }, [patientId, token]);

  useEffect(() => { if (patientId) load(); }, [patientId, load]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const ext = file.name.split('.').pop();
      const path = `${session.user.id}/${patientId}/${Date.now()}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage.from('patient-exams').upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('patient-exams').getPublicUrl(path);

      await fetch(`/api/patients/${patientId}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ file_name: file.name, file_url: publicUrl, exam_date: examDate, exam_type: examType, notes: examNotes })
      });
      setExamNotes(''); load();
    } catch (e) {
      alert('Erro ao enviar exame: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (!confirm('Excluir este exame?')) return;
    await fetch(`/api/patients/${patientId}/exams?examId=${examId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const examTypeLabels = { sangue: 'Exame de Sangue', urina: 'Exame de Urina', bioimpedancia: 'Bioimpedância', imagem: 'Imagem (Raio-X, US)', outro: 'Outro' };
  const examTypeColors = { sangue: 'bg-red-100 text-red-700', urina: 'bg-yellow-100 text-yellow-700', bioimpedancia: 'bg-blue-100 text-blue-700', imagem: 'bg-green-100 text-green-700', outro: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="bg-gray-50 dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] p-4">
        <h4 className="text-xs font-bold text-gray-500 mb-3">Anexar Novo Exame</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data do Exame</label>
            <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de Exame</label>
            <select value={examType} onChange={e => setExamType(e.target.value)}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white">
              {Object.entries(examTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">Observação (opcional)</label>
            <input type="text" value={examNotes} placeholder="Ex: Em jejum, 12h" onChange={e => setExamNotes(e.target.value)}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleUpload(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full border-2 border-dashed border-teal-400 dark:border-teal-700 rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all cursor-pointer disabled:opacity-60">
          {uploading ? (
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-3xl text-teal-600">upload_file</span>
              <p className="text-sm font-bold text-teal-700 dark:text-teal-400">Clique para anexar exame</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG</p>
            </>
          )}
        </button>
      </div>

      {/* Exams list */}
      {exams.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">lab_panel</span>
          <p className="text-sm">Nenhum exame anexado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exams.map(ex => (
            <div key={ex.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-teal-600">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold dark:text-white truncate">{ex.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-[10px] text-gray-400">{fmtDate(ex.exam_date)}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${examTypeColors[ex.exam_type] || examTypeColors.outro}`}>
                    {examTypeLabels[ex.exam_type] || ex.exam_type}
                  </span>
                  {ex.notes && <p className="text-[10px] text-gray-400 italic">{ex.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={ex.file_url} target="_blank" rel="noreferrer"
                  className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors" title="Abrir">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <button onClick={() => handleDelete(ex.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DietTab({ patientId, patientName, token }) {
  // ─── Diet Builder State ───────────────────────────────────────────────
  const [meals, setMeals] = useState([
    { id: 1, name: 'CAFÉ DA MANHÃ', time: '08:00', items: [], notes: '' },
    { id: 2, name: 'ALMOÇO', time: '12:30', items: [], notes: '' }
  ]);
  const [activeDb, setActiveDb] = useState('taco');
  const [mealSearchTerm, setMealSearchTerm] = useState('');
  const [mealSearchResults, setMealSearchResults] = useState([]);
  const [addingToMealId, setAddingToMealId] = useState(null);
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [subSearchResults, setSubSearchResults] = useState([]);
  const [addingSubToItem, setAddingSubToItem] = useState(null);
  const [showCustomSubFoodForm, setShowCustomSubFoodForm] = useState(false);
  const [customSubFoodForm, setCustomSubFoodForm] = useState({ description: '', base_kcal: '', base_carb: '', base_prot: '', base_fat: '', amount_g: 100, unit: 'g' });
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({ description: '', base_kcal: '', base_carb: '', base_prot: '', base_fat: '', amount_g: 100, unit: 'g' });
  const [macros, setMacros] = useState({ carb: 50, prot: 30, fat: 20 });
  const [showMacroSettings, setShowMacroSettings] = useState(false);
  const [planName, setPlanName] = useState('');
  const [dietNotes, setDietNotes] = useState('');
  const [substitutionScore, setSubstitutionScore] = useState(70);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [savedPlans, setSavedPlans] = useState([]);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [currentPlanAccessToken, setCurrentPlanAccessToken] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Search for foods in a meal
  useEffect(() => {
    if (addingToMealId === null) { setMealSearchResults([]); return; }
    const q = mealSearchTerm.trim();
    if (q.length < 2) { setMealSearchResults([]); return; }
    const h = setTimeout(() => {
      const url = activeDb === 'meus_alimentos' ? `/api/custom-foods?q=${encodeURIComponent(q)}` : `/api/alimentos?q=${encodeURIComponent(q)}&db=${activeDb}`;
      const headers = activeDb === 'meus_alimentos' ? { Authorization: `Bearer ${token}` } : {};
      fetch(url, { headers })
        .then(r => r.json()).then(d => setMealSearchResults(Array.isArray(d) ? d : []))
        .catch(() => { setMealSearchResults([]); });
    }, 300);
    return () => clearTimeout(h);
  }, [mealSearchTerm, activeDb, addingToMealId]);

  useEffect(() => {
    if (addingSubToItem === null) { setSubSearchResults([]); return; }
    const q = subSearchTerm.trim();
    if (q.length < 2) { setSubSearchResults([]); return; }
    const h = setTimeout(() => {
      const url = activeDb === 'meus_alimentos' ? `/api/custom-foods?q=${encodeURIComponent(q)}` : `/api/alimentos?q=${encodeURIComponent(q)}&db=${activeDb}`;
      const headers = activeDb === 'meus_alimentos' ? { Authorization: `Bearer ${token}` } : {};
      fetch(url, { headers })
        .then(r => r.json()).then(d => setSubSearchResults(Array.isArray(d) ? d : []))
        .catch(() => { setSubSearchResults([]); });
    }, 300);
    return () => clearTimeout(h);
  }, [subSearchTerm, activeDb, addingSubToItem]);

  const handleAddToMeal = (item, mealId) => {
    const newItem = { description: item.description, base_kcal: safeNum(item.energy_kcal), base_carb: safeNum(item.carbohydrate_g), base_prot: safeNum(item.protein_g), base_fat: safeNum(item.lipid_g), amount_g: 100, unit: 'g', substitutions: [] };
    setMeals(ms => ms.map(m => m.id === mealId ? { ...m, items: [...m.items, newItem] } : m));
    setAddingToMealId(null); setMealSearchTerm('');
  };

  const handleAddSubstitution = (mealId, itemIndex, item) => {
    const newSub = { description: item.description, base_kcal: safeNum(item.energy_kcal), base_carb: safeNum(item.carbohydrate_g), base_prot: safeNum(item.protein_g), base_fat: safeNum(item.lipid_g), amount_g: 100, unit: 'g' };
    setMeals(ms => ms.map(m => {
      if (m.id !== mealId) return m;
      const ni = [...m.items]; ni[itemIndex] = { ...ni[itemIndex], substitutions: [...(ni[itemIndex].substitutions || []), newSub] };
      return { ...m, items: ni };
    }));
    setAddingSubToItem(null); setSubSearchTerm('');
  };

  const handleAddCustomSubstitution = (mealId, itemIndex) => {
    if (!customSubFoodForm.description.trim()) return;
    const customFood = {
      description: customSubFoodForm.description.trim(),
      base_kcal: safeNum(customSubFoodForm.base_kcal),
      base_carb: safeNum(customSubFoodForm.base_carb),
      base_prot: safeNum(customSubFoodForm.base_prot),
      base_fat: safeNum(customSubFoodForm.base_fat),
      amount_g: Math.max(1, safeNum(customSubFoodForm.amount_g) || 100),
      unit: customSubFoodForm.unit || 'g'
    };
    setMeals(ms => ms.map(m => {
      if (m.id !== mealId) return m;
      const items = [...m.items];
      items[itemIndex] = { ...items[itemIndex], substitutions: [...(items[itemIndex].substitutions || []), customFood] };
      return { ...m, items };
    }));
    setCustomSubFoodForm({ description: '', base_kcal: '', base_carb: '', base_prot: '', base_fat: '', amount_g: 100, unit: 'g' });
    setShowCustomSubFoodForm(false); setAddingSubToItem(null); setSubSearchTerm('');
  };

  const handleRemoveFromMeal = (mealId, idx) => setMeals(ms => ms.map(m => m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== idx) } : m));
  const handleUpdateItemAmount = (mealId, idx, val) => setMeals(ms => ms.map(m => m.id === mealId ? { ...m, items: m.items.map((it, i) => i === idx ? { ...it, amount_g: Number(val) || 0 } : it) } : m));
  const handleUpdateItemUnit = (mealId, idx, unit) => {
    setMeals(ms => ms.map(m => {
      if (m.id !== mealId) return m;
      const ni = [...m.items]; const it = ni[idx];
      const wasD = HOUSEHOLD_UNITS.has(it.unit); const isD = HOUSEHOLD_UNITS.has(unit);
      let amount = it.amount_g;
      if (wasD && !isD) amount = Math.round(amount * getServingWeight(it.description, it.unit));
      else if (!wasD && isD) amount = Math.max(1, Math.round(amount / getServingWeight(it.description, unit)));
      ni[idx] = { ...it, unit, amount_g: amount };
      return { ...m, items: ni };
    }));
  };
  const handleUpdateMeal = (mealId, field, value) => setMeals(ms => ms.map(m => m.id === mealId ? { ...m, [field]: value } : m));
  const addMeal = () => setMeals(ms => [...ms, { id: Date.now(), name: 'NOVA REFEIÇÃO', time: '16:00', items: [], notes: '' }]);

  const calculateMealTotals = (meal) => meal.items.reduce((acc, item) => {
    const isD = HOUSEHOLD_UNITS.has(item.unit);
    const sw = isD ? getServingWeight(item.description, item.unit) : 1;
    const mult = isD ? (item.amount_g * sw / 100) : (item.amount_g / 100);
    acc.kcal += (item.base_kcal || 0) * mult; acc.carb += (item.base_carb || 0) * mult;
    acc.prot += (item.base_prot || 0) * mult; acc.fat += (item.base_fat || 0) * mult;
    return acc;
  }, { kcal: 0, carb: 0, prot: 0, fat: 0 });

  const dietTotals = meals.reduce((acc, m) => {
    const t = calculateMealTotals(m);
    acc.kcal += t.kcal; acc.carb += t.carb; acc.prot += t.prot; acc.fat += t.fat; return acc;
  }, { kcal: 0, carb: 0, prot: 0, fat: 0 });

  const totalMacroKcal = dietTotals.carb * 4 + dietTotals.prot * 4 + dietTotals.fat * 9;

  const loadDietPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const query = patientId
        ? supabase.from('diet_plans').select('id, plan_name, patient_name, updated_at, patient_access_token').eq('user_id', user.id).eq('patient_id', patientId).order('updated_at', { ascending: false }).limit(20)
        : supabase.from('diet_plans').select('id, plan_name, patient_name, updated_at, patient_access_token').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20);
      const { data } = await query;
      setSavedPlans(data || []);
    } finally { setLoadingPlans(false); }
  };

  const saveDietPlan = async () => {
    setSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus('error'); return; }
      const payload = { user_id: user.id, plan_name: planName.trim() || `Plano ${new Date().toLocaleDateString('pt-BR')}`, patient_name: patientName, diet_notes: dietNotes, substitution_score: substitutionScore, meals: meals.map(m => ({ ...m, _showNotes: undefined })), macros, patient_id: patientId || null };
      let error;
      if (currentPlanId) {
        ({ error } = await supabase.from('diet_plans').update(payload).eq('id', currentPlanId));
      } else {
        const { data, error: ie } = await supabase.from('diet_plans').insert(payload).select('id, patient_access_token').single();
        error = ie;
        if (data) {
          setCurrentPlanId(data.id);
          setCurrentPlanAccessToken(data.patient_access_token);
        }
      }
      if (error) throw error;
      setSaveStatus('saved'); loadDietPlans();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); }
  };

  const loadPlan = async (planId) => {
    const { data } = await supabase.from('diet_plans').select('*').eq('id', planId).single();
    if (!data) return;
    setPlanName(data.plan_name || ''); setDietNotes(data.diet_notes || ''); setSubstitutionScore(data.substitution_score ?? 70);
    setMeals(data.meals || []); if (data.macros) setMacros(data.macros);
    setCurrentPlanId(data.id); setCurrentPlanAccessToken(data.patient_access_token); setShowSavedPlans(false);
  };

  const deletePlan = async (planId, e) => {
    e.stopPropagation();
    if (!confirm('Excluir este plano?')) return;
    await supabase.from('diet_plans').delete().eq('id', planId);
    setSavedPlans(ps => ps.filter(p => p.id !== planId));
    if (currentPlanId === planId) { setCurrentPlanId(null); setCurrentPlanAccessToken(null); }
  };

  const newPlan = () => {
    if (!confirm('Criar novo plano? O atual não salvo será perdido.')) return;
    setPlanName(''); setDietNotes(''); setSubstitutionScore(70); setCurrentPlanId(null); setCurrentPlanAccessToken(null);
    setMeals([{ id: 1, name: 'CAFÉ DA MANHÃ', time: '08:00', items: [], notes: '' }, { id: 2, name: 'ALMOÇO', time: '12:30', items: [], notes: '' }]);
  };

  return (
    <div className="space-y-4">
      {/* Header: plan name + save */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Nome do Plano (ex: Plano Hipocalórico - Fase 1)"
          className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:text-white font-bold" />
        <div className="flex gap-2">
          <button onClick={() => { setShowSavedPlans(v => !v); if (!showSavedPlans) loadDietPlans(); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#27272A] text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-green-500 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">folder_open</span>
            <span className="hidden sm:inline">Planos</span>
          </button>
          <button onClick={newPlan}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#27272A] text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-green-500 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="hidden sm:inline">Novo</span>
          </button>
          {currentPlanId && currentPlanAccessToken && (
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/dieta/${currentPlanId}?access=${currentPlanAccessToken}`); alert('Link seguro do paciente copiado!'); }}
              className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-xs font-bold text-blue-600 dark:text-blue-400 hover:border-blue-500 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <span className="hidden sm:inline">Link do Paciente</span>
            </button>
          )}
          <button onClick={saveDietPlan} disabled={saveStatus === 'saving'}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 transition-all active:scale-[0.98] ${saveStatus === 'saved' ? 'bg-green-600' : saveStatus === 'error' ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
            <span className="material-symbols-outlined text-sm">{saveStatus === 'saved' ? 'check_circle' : 'save'}</span>
            <span>{saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Saved plans panel */}
      {showSavedPlans && (
        <div className="bg-gray-50 dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] p-4">
          <p className="text-xs font-bold text-gray-500 mb-3">Planos Salvos{patientId ? ' deste Paciente' : ''}</p>
          {loadingPlans ? <p className="text-xs text-gray-400">Carregando...</p> :
            savedPlans.length === 0 ? <p className="text-xs text-gray-400">Nenhum plano salvo.</p> :
            <div className="space-y-1">
              {savedPlans.map(p => (
                <div key={p.id} onClick={() => loadPlan(p.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A] cursor-pointer hover:border-green-500 transition-colors">
                  <div>
                    <p className="text-sm font-bold dark:text-white">{p.plan_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(p.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/dieta/${p.id}?access=${p.patient_access_token}`); alert('Link seguro copiado!'); }} className="p-1 text-blue-500 hover:text-blue-700" title="Copiar link do paciente">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </button>
                    <button onClick={(e) => deletePlan(p.id, e)} className="p-1 text-red-400 hover:text-red-600" title="Excluir plano">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* DB selector */}
      <div className="flex gap-2">
        {['taco', 'tbca', 'meus_alimentos'].map(db => (
          <button key={db} onClick={() => setActiveDb(db)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeDb === db ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-[#27272A] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {db === 'meus_alimentos' ? 'MEUS ALIMENTOS' : db.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Macros panel */}
      <div>
        <button onClick={() => setShowMacroSettings(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <span className="material-symbols-outlined text-sm">tune</span>
          Distribuição de Macros: {macros.carb}% C / {macros.prot}% P / {macros.fat}% G
          <span className="material-symbols-outlined text-sm">{showMacroSettings ? 'expand_less' : 'expand_more'}</span>
        </button>
        {showMacroSettings && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {Object.entries({ carb: 'Carboidrato', prot: 'Proteína', fat: 'Gordura' }).map(([k, label]) => (
              <div key={k}>
                <label className="text-xs text-gray-500">{label} (%)</label>
                <input type="number" min="0" max="100" value={macros[k]}
                  onChange={e => { let v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); const r = 100 - v; const others = Object.keys(macros).filter(x => x !== k); const s = macros[others[0]] + macros[others[1]]; const nm = { ...macros, [k]: v }; if (s > 0) { nm[others[0]] = Math.round(r * macros[others[0]] / s); nm[others[1]] = r - nm[others[0]]; } setMacros(nm); }}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 text-sm outline-none dark:text-white mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flexibility panel */}
      <div className="pt-2 border-t border-gray-100 dark:border-[#27272A]">
        <label className="text-xs font-bold text-gray-500 mb-1.5 block">
          Flexibilidade do Paciente para Substituições (Calculadora)
        </label>
        <select
          value={substitutionScore}
          onChange={e => setSubstitutionScore(parseInt(e.target.value))}
          className="w-full sm:w-1/2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-2 text-sm outline-none dark:text-white font-medium"
        >
          <option value={90}>Restrito (Score exigido: 90+)</option>
          <option value={80}>Moderado (Score exigido: 80+)</option>
          <option value={70}>Flexível (Score exigido: 70+)</option>
          <option value={60}>Muito Flexível (Score exigido: 60+)</option>
        </select>
        <p className="text-[10px] text-gray-400 mt-1">
          Determina a similaridade nutricional exigida para liberar uma troca de alimento feita pelo paciente.
        </p>
      </div>

      {/* Totals bar */}
      {dietTotals.kcal > 0 && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-3">
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[['Calorias', dietTotals.kcal.toFixed(0) + ' kcal', 'text-gray-900 dark:text-white'], ['Carb', dietTotals.carb.toFixed(1) + 'g', 'text-blue-700'], ['Prot', dietTotals.prot.toFixed(1) + 'g', 'text-green-700'], ['Gord', dietTotals.fat.toFixed(1) + 'g', 'text-yellow-600']].map(([l, v, c]) => (
              <div key={l} className="text-center">
                <p className="text-[10px] text-gray-400">{l}</p>
                <p className={`text-sm font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
          {totalMacroKcal > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              <div style={{ width: `${Math.round(dietTotals.carb * 4 / totalMacroKcal * 100)}%` }} className="bg-blue-500 transition-all" />
              <div style={{ width: `${Math.round(dietTotals.prot * 4 / totalMacroKcal * 100)}%` }} className="bg-green-500 transition-all" />
              <div style={{ width: `${Math.round(dietTotals.fat * 9 / totalMacroKcal * 100)}%` }} className="bg-yellow-400 transition-all" />
            </div>
          )}
        </div>
      )}

      {/* Meals */}
      <div className="space-y-3">
        {meals.map((meal, mealIdx) => {
          const mt = calculateMealTotals(meal);
          return (
            <div key={meal.id} className="bg-gray-50 dark:bg-[#0A0A0B] rounded-xl border border-gray-200 dark:border-[#27272A] overflow-hidden">
              {/* Meal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-[#27272A]">
                <input value={meal.name} onChange={e => handleUpdateMeal(meal.id, 'name', e.target.value)}
                  className="flex-1 bg-transparent text-xs font-bold uppercase tracking-wider dark:text-white outline-none" />
                <input type="time" value={meal.time} onChange={e => handleUpdateMeal(meal.id, 'time', e.target.value)}
                  className="text-xs text-gray-500 bg-transparent outline-none" />
                {mt.kcal > 0 && <span className="text-[10px] text-gray-400 shrink-0">{mt.kcal.toFixed(0)} kcal</span>}
                <button onClick={() => setMeals(ms => ms.filter(m => m.id !== meal.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
              {mt.kcal > 0 && (
                <div className="grid grid-cols-4 gap-1 px-4 py-2 bg-white/60 dark:bg-black/20 text-center text-[10px] border-b border-gray-100 dark:border-[#27272A]">
                  <span className="text-gray-500"><b className="block text-gray-700 dark:text-gray-200">{mt.kcal.toFixed(0)}</b>kcal</span>
                  <span className="text-blue-600"><b className="block">{mt.carb.toFixed(1)}g</b>carb.</span>
                  <span className="text-green-600"><b className="block">{mt.prot.toFixed(1)}g</b>prot.</span>
                  <span className="text-yellow-600"><b className="block">{mt.fat.toFixed(1)}g</b>gord.</span>
                </div>
              )}
              {/* Items */}
              <div className="divide-y divide-gray-100 dark:divide-[#27272A]">
                {meal.items.map((item, idx) => {
                  const isD = HOUSEHOLD_UNITS.has(item.unit);
                  const sw = isD ? getServingWeight(item.description, item.unit) : 1;
                  const mult = isD ? (item.amount_g * sw / 100) : (item.amount_g / 100);
                  const kcalItem = ((item.base_kcal || 0) * mult).toFixed(0);
                  return (
                    <div key={idx} className="px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold dark:text-white truncate">{item.description}</p>
                          <p className="text-[10px] text-gray-400">{kcalItem} kcal</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <input type="number" value={item.amount_g} onChange={e => handleUpdateItemAmount(meal.id, idx, e.target.value)}
                            className="w-14 text-xs text-right bg-transparent border border-gray-200 dark:border-[#27272A] rounded px-1 py-0.5 outline-none dark:text-white" />
                          <select value={item.unit || 'g'} onChange={e => handleUpdateItemUnit(meal.id, idx, e.target.value)}
                            className="text-[10px] bg-transparent border border-gray-200 dark:border-[#27272A] rounded px-1 py-0.5 outline-none dark:text-white">
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="un">un</option>
                            <option value="colher_sopa">col. sopa</option>
                            <option value="colher_cha">col. chá</option>
                            <option value="xicara">xícara</option>
                            <option value="copo">copo</option>
                            <option value="fatia">fatia</option>
                            <option value="concha">concha</option>
                            <option value="pegador">pegador</option>
                            <option value="prato_raso">prato raso</option>
                            <option value="prato_fundo">prato fundo</option>
                            <option value="colher">col. (legado)</option>
                          </select>
                          <button onClick={() => handleRemoveFromMeal(meal.id, idx)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                      {/* Substitutions */}
                      {(item.substitutions || []).length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-dashed border-gray-200 dark:border-[#27272A] space-y-1">
                          {item.substitutions.map((sub, si) => (
                            <div key={si} className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span className="text-gray-300">↔</span>
                              <span className="flex-1 truncate">{sub.description}</span>
                              <span>{sub.amount_g}g</span>
                              <button onClick={() => {
                                setMeals(ms => ms.map(m => {
                                  if (m.id !== meal.id) return m;
                                  const ni = [...m.items]; ni[idx] = { ...ni[idx], substitutions: (ni[idx].substitutions || []).filter((_, i) => i !== si) };
                                  return { ...m, items: ni };
                                }));
                              }} className="text-gray-300 hover:text-red-500"><span className="material-symbols-outlined text-[10px]">close</span></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add sub button */}
                      <button onClick={() => setAddingSubToItem(addingSubToItem?.mealId === meal.id && addingSubToItem?.itemIndex === idx ? null : { mealId: meal.id, itemIndex: idx })}
                        className="mt-1 text-[10px] text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">swap_horiz</span> Substituto
                      </button>
                      {addingSubToItem?.mealId === meal.id && addingSubToItem?.itemIndex === idx && (
                        <div className="mt-2">
                          {!showCustomSubFoodForm ? <>
                            <input value={subSearchTerm} onChange={e => setSubSearchTerm(e.target.value)} placeholder="Buscar substituto..."
                              className="w-full text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                            {subSearchResults.slice(0, 5).map(r => (
                              <div key={r.id} onClick={() => handleAddSubstitution(meal.id, idx, r)}
                                className="px-3 py-1.5 text-xs cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/10 dark:text-white rounded">
                                {r.description}
                              </div>
                            ))}
                            <button type="button" onClick={() => setShowCustomSubFoodForm(true)} className="mt-2 text-[10px] text-purple-600 hover:text-purple-700 font-medium">
                              + Criar alimento substituto
                            </button>
                          </> : <div className="rounded-lg border border-purple-200 dark:border-purple-900/50 p-2 space-y-2 bg-purple-50/50 dark:bg-purple-950/10">
                            <input autoFocus value={customSubFoodForm.description} onChange={e => setCustomSubFoodForm(f => ({ ...f, description: e.target.value }))} placeholder="Nome do alimento *" className="w-full text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded px-2 py-1.5 outline-none dark:text-white" />
                            <div className="grid grid-cols-4 gap-1">
                              {[['base_kcal', 'kcal'], ['base_carb', 'carb g'], ['base_prot', 'prot g'], ['base_fat', 'gord g']].map(([field, label]) => <input key={field} type="number" min="0" value={customSubFoodForm[field]} onChange={e => setCustomSubFoodForm(f => ({ ...f, [field]: e.target.value }))} placeholder={label} className="min-w-0 text-[10px] bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded px-1 py-1 outline-none dark:text-white" />)}
                            </div>
                            <div className="flex gap-1 justify-end">
                              <button type="button" onClick={() => setShowCustomSubFoodForm(false)} className="text-[10px] text-gray-500 px-2 py-1">Cancelar</button>
                              <button type="button" onClick={() => handleAddCustomSubstitution(meal.id, idx)} className="text-[10px] bg-purple-600 text-white rounded px-2 py-1">Adicionar</button>
                            </div>
                          </div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Add item to meal */}
              {addingToMealId === meal.id ? (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-[#27272A]">
                  {!showCustomFoodForm ? (
                    <>
                      <input value={mealSearchTerm} onChange={e => setMealSearchTerm(e.target.value)} placeholder="Buscar alimento (TACO/TBCA)..." autoFocus
                        className="w-full text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 dark:text-white" />
                      <div className="mt-1 rounded-xl overflow-hidden border border-gray-100 dark:border-[#27272A]">
                        {mealSearchResults.slice(0, 6).map(r => (
                          <div key={r.id} onClick={() => handleAddToMeal(r, meal.id)}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 dark:text-white border-b border-gray-50 dark:border-[#27272A] last:border-0 flex items-center justify-between">
                            <span>{r.description}</span>
                            <span className="text-[10px] text-gray-400">{safeNum(r.energy_kcal).toFixed(0)} kcal/100g</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <button onClick={() => { setAddingToMealId(null); setMealSearchTerm(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                        <button onClick={() => setShowCustomFoodForm(true)} className="text-xs font-bold text-green-600 hover:text-green-700">+ Adicionar Manualmente</button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 bg-gray-50 dark:bg-[#18181B] p-3 rounded-lg border border-gray-200 dark:border-[#27272A]">
                      <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300">Cadastrar Alimento Manual (por 100g)</h5>
                      <div>
                        <input value={customFoodForm.description} onChange={e => setCustomFoodForm({...customFoodForm, description: e.target.value})} placeholder="Nome do alimento..."
                          className="w-full text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-green-500 dark:text-white" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500">Kcal</label>
                          <input type="number" value={customFoodForm.base_kcal} onChange={e => setCustomFoodForm({...customFoodForm, base_kcal: e.target.value})} placeholder="0" className="w-full text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1 outline-none dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500">Carb (g)</label>
                          <input type="number" value={customFoodForm.base_carb} onChange={e => setCustomFoodForm({...customFoodForm, base_carb: e.target.value})} placeholder="0" className="w-full text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1 outline-none dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500">Prot (g)</label>
                          <input type="number" value={customFoodForm.base_prot} onChange={e => setCustomFoodForm({...customFoodForm, base_prot: e.target.value})} placeholder="0" className="w-full text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1 outline-none dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500">Gord (g)</label>
                          <input type="number" value={customFoodForm.base_fat} onChange={e => setCustomFoodForm({...customFoodForm, base_fat: e.target.value})} placeholder="0" className="w-full text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-lg px-2 py-1 outline-none dark:text-white" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <button onClick={() => setShowCustomFoodForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Voltar</button>
                        <button onClick={async () => {
                          if(!customFoodForm.description) return;
                          
                          const foodPayload = {
                            description: customFoodForm.description,
                            energy_kcal: parseFloat(customFoodForm.base_kcal) || 0,
                            carbohydrate_g: parseFloat(customFoodForm.base_carb) || 0,
                            protein_g: parseFloat(customFoodForm.base_prot) || 0,
                            lipid_g: parseFloat(customFoodForm.base_fat) || 0,
                          };

                          // Save to DB
                          try {
                            await fetch('/api/custom-foods', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify(foodPayload)
                            });
                          } catch (e) { console.error('Error saving custom food', e); }

                          // Add to meal
                          handleAddToMeal(foodPayload, meal.id);
                          
                          setShowCustomFoodForm(false);
                          setCustomFoodForm({ description: '', base_kcal: '', base_carb: '', base_prot: '', base_fat: '', amount_g: 100, unit: 'g' });
                        }} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">Adicionar</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setAddingToMealId(meal.id)} className="w-full px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span> Adicionar Alimento
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={addMeal} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#27272A] text-xs font-bold text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">add</span> Nova Refeição
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">Observações do Plano</label>
        <textarea rows={3} value={dietNotes} onChange={e => setDietNotes(e.target.value)} placeholder="Orientações gerais, restrições, preferências..."
          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:text-white resize-none" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PacientesPage() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ name: '', email: '', plan: 'Free', avatar: '' });
  const [token, setToken] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('anamnese');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  const [newPatientForm, setNewPatientForm] = useState({ name: '', email: '', phone: '', birth_date: '', gender: '', objective: '', substitution_score: 70 });
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientSaveError, setPatientSaveError] = useState('');

  const openNewPatient = () => {
    setNewPatientForm({ name: '', email: '', phone: '', birth_date: '', gender: '', objective: '', substitution_score: 70 });
    setPatientSaveError('');
    setIsEditingPatient(false);
    setShowNewPatient(true);
  };

  const openEditPatient = () => {
    if (!selectedPatient) return;
    setNewPatientForm({
      name: selectedPatient.name || '',
      email: selectedPatient.email || '',
      phone: selectedPatient.phone || '',
      birth_date: selectedPatient.birth_date || '',
      gender: selectedPatient.gender || '',
      objective: selectedPatient.objective || '',
      substitution_score: selectedPatient.substitution_score ?? 70
    });
    setPatientSaveError('');
    setIsEditingPatient(true);
    setShowNewPatient(true);
  };

  // Load user
  useEffect(() => {
    async function init() {
      let name = localStorage.getItem('user_name') || '';
      let email = localStorage.getItem('user_email') || '';
      let plan = localStorage.getItem('user_plan') || 'Free';
      let avatar = localStorage.getItem('user_avatar') || '';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setToken(session.access_token);
          email = session.user.email || '';
          localStorage.setItem('user_email', email);
          const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).single();
          name = profile?.full_name || session.user.email?.split('@')[0] || 'Nutricionista';
          localStorage.setItem('user_name', name);
          avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7e22ce&color=fff&size=128&bold=true`;
          localStorage.setItem('user_avatar', avatar);
          const { data: usage } = await supabase.from('user_usage').select('plan').eq('user_id', session.user.id).single();
          plan = usage?.plan || 'Free';
          localStorage.setItem('user_plan', plan);
        }
      } catch (e) { console.error(e); }
      setUserProfile({ name, email, plan, avatar });
      setLoading(false);
    }
    init();
  }, []);

  // Load patients
  const loadPatients = useCallback(async () => {
    if (!token) return;
    setLoadingPatients(true);
    try {
      const r = await fetch('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setPatients(Array.isArray(d) ? d : []);
    } finally { setLoadingPatients(false); }
  }, [token]);

  useEffect(() => { if (token) loadPatients(); }, [token, loadPatients]);

  const savePatient = async () => {
    if (!newPatientForm.name.trim()) return;
    setSavingPatient(true);
    setPatientSaveError('');
    try {
      if (isEditingPatient && selectedPatient) {
        const r = await fetch(`/api/patients/${selectedPatient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(newPatientForm)
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d?.id) throw new Error(d?.error || 'Não foi possível salvar as alterações.');
        setPatients(ps => ps.map(p => p.id === d.id ? d : p).sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedPatient(d);
        setShowNewPatient(false);
        setIsEditingPatient(false);
      } else {
        const r = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(newPatientForm)
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d?.id) throw new Error(d?.error || 'Não foi possível cadastrar o paciente.');
        setPatients(ps => [d, ...ps].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedPatient(d);
        setShowNewPatient(false);
      }
      setNewPatientForm({ name: '', email: '', phone: '', birth_date: '', gender: '', objective: '', substitution_score: 70 });
    } catch (error) {
      console.error('Unable to save patient', error);
      setPatientSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o paciente. Tente novamente.');
    } finally { setSavingPatient(false); }
  };

  const deletePatient = async (patientId, e) => {
    e.stopPropagation();
    if (!confirm('Excluir este paciente e todos os seus dados? Esta ação é irreversível.')) return;
    await fetch(`/api/patients/${patientId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setPatients(ps => ps.filter(p => p.id !== patientId));
    if (selectedPatient?.id === patientId) setSelectedPatient(null);
  };

  const isPremium = ['ultra', 'admin'].includes(userProfile.plan?.toLowerCase());
  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const tabs = [
    { id: 'consulta', label: 'Consulta', icon: 'medical_services' },
    { id: 'historico', label: 'Prontuário', icon: 'history' },
    { id: 'anamnese', label: 'Anamnese', icon: 'assignment' },
    { id: 'antropometria', label: 'Antropometria', icon: 'straighten' },
    { id: 'bia', label: 'BIA', icon: 'monitor_weight' },
    { id: 'exames', label: 'Exames', icon: 'lab_panel' },
    { id: 'dieta', label: 'Dieta', icon: 'restaurant_menu' },
    { id: 'alimentos', label: 'Tabelas Alimentares', icon: 'nutrition' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
  ];

  if (loading) return null;

  return (
    <div suppressHydrationWarning className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white">
      {/* Mobile overlay */}
      <div id="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} className={`fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}></div>

      {/* Sidebar — idêntica à do /recursos */}
      <nav id="sidebar-nav"
          className={`h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50 transform md:translate-x-0 transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <a href="/home" className="px-6 py-4 mb-4 flex items-center justify-center cursor-pointer decoration-none">
            <img src="/logo-horizontal.svg" alt="Amora Logo" className="w-32 h-auto object-contain dark:invert" />
        </a>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 space-y-6">
            {/* Section: Aprender */}
            <div>
                <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Aprender</p>
                <div className="space-y-1">
                    <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/home">
                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span className="font-label-md text-sm">Amora</span>
                    </a>
                    <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/recursos">
                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M12 11v-4"></path></svg>
                        <span className="font-label-md text-sm">Recursos Profissionais</span>
                    </a>
                    <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors" href="/pacientes">
                        <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span className="font-label-md text-sm">Pacientes</span>
                    </a>
                </div>
            </div>

            {/* Section: Ajustes */}
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
            <button onClick={() => { localStorage.removeItem('user_name'); localStorage.removeItem('user_email'); localStorage.removeItem('user_avatar'); window.location.href = '/login'; }} className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                <span className="font-label-md text-sm font-medium">Sair da conta</span>
            </button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="md:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#27272A] px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden text-gray-500"><span className="material-symbols-outlined">menu</span></button>
          <span className="material-symbols-outlined text-purple-700 text-xl">person_search</span>
          <h1 className="text-sm font-bold dark:text-white">Gestão de Pacientes</h1>
          <p className="text-xs text-gray-400 hidden sm:block">— Prontuário Nutricional</p>
        </div>

        {(!userProfile?.plan || (userProfile.plan.toLowerCase() !== 'ultra' && userProfile.plan.toLowerCase() !== 'admin')) ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-purple-700 mb-4 opacity-80">lock</span>
            <h2 className="text-2xl font-bold dark:text-white mb-2">Recurso Exclusivo</h2>
            <p className="text-gray-500 mb-6 max-w-md">
              A Gestão de Pacientes (Prontuário Nutricional, Dietas, Exames e Chat) está disponível apenas para usuários do plano <strong>Amora Ultra (Profissional)</strong>.
            </p>
            <a href="/configuracao" className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md">
              Fazer Upgrade para Ultra
            </a>
          </div>
        ) : (
          <div className="flex h-[calc(100vh-57px)]">
            {/* Patient sidebar */}
            <div className="w-64 shrink-0 border-r border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] flex flex-col hidden md:flex">
              <div className="p-3 border-b border-gray-100 dark:border-[#27272A] space-y-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar paciente..."
                    className="w-full bg-gray-50 dark:bg-[#0A0A0B] border border-gray-200 dark:border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                </div>
                <button onClick={openNewPatient}
                  className="w-full bg-purple-700 text-white py-2 rounded-xl text-xs font-bold hover:bg-purple-800 transition-all flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Novo Paciente
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" /></div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-8 px-3">
                    <span className="material-symbols-outlined text-3xl text-gray-300 block mb-2">person_off</span>
                    <p className="text-xs text-gray-400">{searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</p>
                  </div>
                ) : (
                  filteredPatients.map(p => (
                    <div key={p.id} onClick={() => { setSelectedPatient(p); setActiveTab('anamnese'); }}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-gray-50 dark:border-[#27272A] transition-colors group ${selectedPatient?.id === p.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${selectedPatient?.id === p.id ? 'text-purple-700 dark:text-purple-400' : 'dark:text-white'}`}>{p.name}</p>
                        {p.birth_date && <p className="text-[10px] text-gray-400">{fmtDate(p.birth_date)}</p>}
                      </div>
                      <button onClick={(e) => deletePatient(p.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
              {!selectedPatient && !showNewPatient ? (
                <>
                  {/* Empty state for Desktop, or Mobile when there are no patients at all */}
                  <div className={`flex-col items-center justify-center h-full text-center p-8 ${patients.length === 0 ? 'flex' : 'hidden md:flex'}`}>
                    <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-4xl text-purple-400">person_search</span>
                    </div>
                    <h2 className="text-base font-bold dark:text-white mb-2">Selecione um Paciente</h2>
                    <p className="text-sm text-gray-400 max-w-xs mb-6">Escolha um paciente na lista ao lado ou cadastre um novo para acessar o prontuário completo.</p>
                    <button onClick={openNewPatient}
                      className="bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-800 transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Cadastrar Primeiro Paciente
                    </button>
                  </div>

                  {/* Mobile Patients List when there are patients registered */}
                  {patients.length > 0 && (
                    <div className="md:hidden flex flex-col h-full bg-gray-50 dark:bg-[#0A0A0B] p-4">
                      <div className="flex flex-col gap-3 mb-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-base font-black dark:text-white">Seus Pacientes</h2>
                          <button onClick={openNewPatient}
                            className="bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-800 transition-all flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person_add</span>
                            Novo Paciente
                          </button>
                        </div>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar paciente..."
                            className="w-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pb-6">
                        {loadingPatients ? (
                          <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" /></div>
                        ) : filteredPatients.length === 0 ? (
                          <div className="text-center py-8 bg-white dark:bg-[#18181B] rounded-2xl border border-gray-100 dark:border-[#27272A] p-4">
                            <span className="material-symbols-outlined text-3xl text-gray-300 block mb-2">person_off</span>
                            <p className="text-xs text-gray-400">{searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</p>
                          </div>
                        ) : (
                          filteredPatients.map(p => (
                            <div key={p.id} onClick={() => { setSelectedPatient(p); setActiveTab('anamnese'); }}
                              className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#18181B] rounded-xl border border-gray-100 dark:border-[#27272A] active:scale-[0.99] transition-all cursor-pointer">
                              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold dark:text-white truncate">{p.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {p.birth_date && <p className="text-[10px] text-gray-400">{fmtDate(p.birth_date)} ({calculateAge(p.birth_date)})</p>}
                                  {p.objective && <p className="text-[10px] text-purple-600 dark:text-purple-400 truncate">• {p.objective}</p>}
                                </div>
                              </div>
                              <button onClick={(e) => deletePatient(p.id, e)} className="text-gray-300 hover:text-red-500 transition-all p-1">
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : showNewPatient ? (
                <div className="p-6 max-w-2xl animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-bold dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-700">{isEditingPatient ? 'edit' : 'person_add'}</span>
                      {isEditingPatient ? 'Editar Perfil do Paciente' : 'Novo Paciente'}
                    </h2>
                    <button onClick={() => setShowNewPatient(false)} className="text-gray-400 hover:text-gray-600">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo *</label>
                      <input value={newPatientForm.name} onChange={e => setNewPatientForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Maria Silva"
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">E-mail</label>
                      <input type="email" value={newPatientForm.email} onChange={e => setNewPatientForm(p => ({ ...p, email: e.target.value }))} placeholder="maria@email.com"
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Telefone</label>
                      <input value={newPatientForm.phone} onChange={e => setNewPatientForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999"
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Data de Nascimento</label>
                      <input type="date" value={newPatientForm.birth_date} onChange={e => setNewPatientForm(p => ({ ...p, birth_date: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Sexo</label>
                      <select value={newPatientForm.gender} onChange={e => setNewPatientForm(p => ({ ...p, gender: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white">
                        <option value="">Selecione</option>
                        <option value="feminino">Feminino</option>
                        <option value="masculino">Masculino</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Objetivo Principal</label>
                      <input value={newPatientForm.objective} onChange={e => setNewPatientForm(p => ({ ...p, objective: e.target.value }))} placeholder="Ex: Emagrecimento, Hipertrofia, Controle de DM..."
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Flexibilidade com Trocas Alimentares (Calculadora)</label>
                      <select value={newPatientForm.substitution_score} onChange={e => setNewPatientForm(p => ({ ...p, substitution_score: parseInt(e.target.value) }))}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-medium">
                        <option value={90}>Restrito (Score exigido: 90+)</option>
                        <option value={80}>Moderado (Score exigido: 80+)</option>
                        <option value={70}>Flexível (Score exigido: 70+)</option>
                        <option value={60}>Muito Flexível (Score exigido: 60+)</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Determina o Score de similaridade nutricional necessário para liberar trocas de alimentos na calculadora do paciente.</p>
                    </div>
                  </div>
                  {patientSaveError && (
                    <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                      {patientSaveError}
                    </p>
                  )}
                  <button onClick={savePatient} disabled={savingPatient || !newPatientForm.name.trim()}
                    className="mt-6 w-full bg-purple-700 text-white py-3 rounded-xl font-bold hover:bg-purple-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">{isEditingPatient ? 'save' : 'person_add'}</span>
                    {savingPatient ? 'Salvando...' : isEditingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                  </button>
                </div>
              ) : selectedPatient && (
                <div className="flex flex-col h-full">
                  {/* Patient header */}
                  <div className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-[#27272A] px-6 py-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedPatient(null)} className="md:hidden text-gray-500 hover:text-purple-700 transition-colors flex items-center justify-center -ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272A]">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                      </button>
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 font-black text-lg">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-base font-black dark:text-white">{selectedPatient.name}</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          {selectedPatient.birth_date && <p className="text-xs text-gray-400">Nasc. {fmtDate(selectedPatient.birth_date)} ({calculateAge(selectedPatient.birth_date)})</p>}
                          {selectedPatient.gender && <p className="text-xs text-gray-400 capitalize">• {selectedPatient.gender}</p>}
                          {selectedPatient.objective && <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">• {selectedPatient.objective}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={openEditPatient} className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center gap-1 font-bold border border-purple-100/50 dark:border-purple-800/30">
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar Perfil
                        </button>
                        {selectedPatient.phone && (
                          <a href={`tel:${selectedPatient.phone}`} className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <span className="material-symbols-outlined text-sm">phone</span>
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 overflow-x-auto">
                      {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
                          <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'consulta' && <ConsultaTab selectedPatient={selectedPatient} token={token} supabase={supabase} />}
                    {activeTab === 'historico' && <HistoricoConsultasTab patientId={selectedPatient.id} supabase={supabase} />}
                    {activeTab === 'anamnese' && <AnamneseTab patientId={selectedPatient.id} token={token} />}
                    {activeTab === 'antropometria' && <AnthropometryTab patientId={selectedPatient.id} selectedPatient={selectedPatient} token={token} />}
                    {activeTab === 'bia' && <BiaTab patientId={selectedPatient.id} token={token} />}
                    {activeTab === 'exames' && <ExamsTab patientId={selectedPatient.id} token={token} />}
                    {activeTab === 'dieta' && <DietTab patientId={selectedPatient.id} patientName={selectedPatient.name} token={token} />}
                    {activeTab === 'alimentos' && <AlimentosTab supabase={supabase} token={token} />}
                    {activeTab === 'chat' && <ChatTab selectedPatient={selectedPatient} supabase={supabase} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
