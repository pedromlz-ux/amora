'use client';
import React, { useState, useEffect } from 'react';

export default function HistoricoConsultasTab({ patientId, supabase }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          created_at,
          consultation_records(
            id,
            raw_transcription,
            additional_notes,
            structured_report,
            created_at
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        // filter out consultations without records
        const validRecords = data.filter(c => c.consultation_records && c.consultation_records.length > 0);
        setRecords(validRecords);
      } else if (error) {
        console.error("Erro ao buscar histórico de consultas:", error);
      }
      setLoading(false);
    }
    if (patientId) fetchHistory();
  }, [patientId, supabase]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">history</span>
        <p>Nenhuma consulta salva para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Histórico de Consultas</h2>
      
      {records.map(consultation => {
        const record = consultation.consultation_records[0]; // there should be 1 record per consultation
        let structuredReport = 'Nenhum relatório estruturado.';
        if (record?.structured_report?.report) {
            structuredReport = record.structured_report.report;
        } else if (typeof record?.structured_report === 'string') {
            try {
                structuredReport = JSON.parse(record.structured_report).report;
            } catch(e) {}
        }

        const date = new Date(consultation.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const isExpanded = expandedId === consultation.id;

        return (
          <div key={consultation.id} className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl overflow-hidden shadow-sm transition-all">
            <div 
              onClick={() => toggleExpand(consultation.id)}
              className="bg-gray-50 hover:bg-gray-100 dark:bg-[#111113] dark:hover:bg-[#1a1a1d] cursor-pointer p-4 border-b border-gray-200 dark:border-[#27272A] flex items-center justify-between transition-colors"
            >
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">event</span>
                Consulta de {date}
              </h3>
              <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
            {isExpanded && (
              <div className="p-6 space-y-6 animate-fade-in">
              
              <div>
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Relatório Estruturado</h4>
                <div className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-[#27272A] whitespace-pre-wrap">
                  {structuredReport}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-[#27272A]">
                <div>
                  <h4 className="font-bold text-xs text-gray-500 mb-2 uppercase">Transcrição Bruta</h4>
                  <div className="h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#18181B] p-3 rounded-lg border border-gray-200 dark:border-[#27272A] whitespace-pre-wrap">
                    {record?.raw_transcription || 'Nenhuma transcrição salva.'}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-500 mb-2 uppercase">Observações Extras</h4>
                  <div className="h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#18181B] p-3 rounded-lg border border-gray-200 dark:border-[#27272A] whitespace-pre-wrap">
                    {record?.additional_notes || 'Nenhuma observação salva.'}
                  </div>
                </div>
              </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
