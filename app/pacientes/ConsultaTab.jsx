import React, { useState, useRef, useEffect } from 'react';

const AUDIO_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function getSupportedAudioMimeType() {
  return AUDIO_MIME_TYPES.find((mimeType) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)
  ) || '';
}

function getAudioMimeType(mimeType) {
  const normalized = (mimeType || '').split(';')[0].toLowerCase();
  return ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'].includes(normalized)
    ? normalized
    : 'audio/webm';
}

export default function ConsultaTab({ selectedPatient, token, supabase }) {
  const [consultationId, setConsultationId] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [notes, setNotes] = useState('');
  const [structuredReport, setStructuredReport] = useState('');
  const [desktopAudio, setDesktopAudio] = useState(null);
  const [desktopAudioMimeType, setDesktopAudioMimeType] = useState('audio/webm');
  const [processingAudio, setProcessingAudio] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [startingConsultation, setStartingConsultation] = useState(false);
  const [consultationStatus, setConsultationStatus] = useState('');
  const [evolutionAnalysis, setEvolutionAnalysis] = useState('');
  const [analyzingEvolution, setAnalyzingEvolution] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!selectedPatient?.id) return;
    setConsultationId(null);
    setDesktopAudio(null);
    setDesktopAudioMimeType('audio/webm');
    setTranscription('');
    setNotes('');
    setStructuredReport('');
    setRecordingError('');
    setConsultationStatus('Clique em “Nova Consulta” para iniciar o atendimento atual.');
    setEvolutionAnalysis('');
  }, [selectedPatient?.id, supabase]);

  const startRecording = async () => {
    if (!consultationId) {
      setRecordingError('A sessão da consulta ainda está sendo preparada. Aguarde alguns segundos e tente novamente.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getSupportedAudioMimeType();
      const mediaRecorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingError('');
      setProcessingAudio(false);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = getAudioMimeType(mediaRecorder.mimeType || chunksRef.current[0]?.type || preferredMimeType);
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        setDesktopAudio(audioBlob);
        setDesktopAudioMimeType(mimeType);
        setProcessingAudio(false);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Erro no microfone', err);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const processAudio = async (blob, mimeType) => {
    setProcessingAudio(true);
    setRecordingError('');
    try {
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Não foi possível ler o áudio gravado.'));
        reader.readAsDataURL(blob);
      });
      const res = await fetch('/api/transcribe-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileData: base64data, fileType: getAudioMimeType(mimeType), consultationId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.transcription) throw new Error(data.error || 'Não foi possível transcrever o áudio.');
      setTranscription(prev => prev ? prev + '\n\n' + data.transcription : data.transcription);
    } catch (e) {
      console.error(e);
      setRecordingError(e instanceof Error ? e.message : 'Não foi possível transcrever o áudio.');
    } finally {
      setProcessingAudio(false);
    }
  };

  const generateReport = async (type) => {
    setProcessingAI(true);
    try {
      const res = await fetch('/api/structure-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          transcription,
          notes,
          type,
          patientData: {
            cpf: selectedPatient.cpf,
            allergies: selectedPatient.allergies,
            chronic_diseases: selectedPatient.diagnoses
          }
        })
      });
      const data = await res.json();
      if (data.report) {
        setStructuredReport(data.report);
      } else {
        alert('Erro ao gerar relatório: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Erro na requisição.');
    } finally {
      setProcessingAI(false);
    }
  };

  const handleNewConsultation = async () => {
    if (!selectedPatient?.id || startingConsultation) return;
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
    setStartingConsultation(true);
    setRecordingError('');
    setConsultationStatus('Iniciando nova consulta...');
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId: selectedPatient.id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.consultation?.id) throw new Error(data.error || 'Não foi possível iniciar a consulta.');

      setConsultationId(data.consultation.id);
      setTranscription('');
      setNotes('');
      setStructuredReport('');
      setDesktopAudio(null);
      setEvolutionAnalysis('');
      setConsultationStatus('Nova consulta iniciada. Você já pode gravar ou preencher as anotações.');
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Não foi possível iniciar a consulta.';
      setRecordingError(message);
      setConsultationStatus('A consulta não foi iniciada. Tente novamente.');
    } finally {
      setStartingConsultation(false);
    }
  };

  const analyzeEvolution = async () => {
    if (!consultationId || analyzingEvolution) return;
    setAnalyzingEvolution(true);
    setRecordingError('');
    try {
      const response = await fetch('/api/structure-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'evolution',
          patientId: selectedPatient.id,
          currentConsultationId: consultationId,
          transcription,
          notes,
          patientData: { allergies: selectedPatient.allergies, chronic_diseases: selectedPatient.diagnoses }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.report) throw new Error(data.error || 'Não foi possível analisar as consultas anteriores.');
      setEvolutionAnalysis(data.report);
    } catch (e) {
      setRecordingError(e instanceof Error ? e.message : 'Não foi possível analisar as consultas anteriores.');
    } finally {
      setAnalyzingEvolution(false);
    }
  };

  const saveReportToRecord = async () => {
    if (!consultationId) return alert('Sessão de consulta não encontrada.');
    if (!structuredReport) return alert('Gere um relatório primeiro.');

    setProcessingAI(true);
    try {
      const { error } = await supabase.from('consultation_records').upsert({
        consultation_id: consultationId,
        raw_transcription: transcription,
        additional_notes: notes,
        structured_report: JSON.stringify({ report: structuredReport })
      }, { onConflict: 'consultation_id' });

      if (error) throw error;
      alert('Relatório salvo com sucesso no prontuário!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar o relatório.');
    } finally {
      setProcessingAI(false);
    }
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Consulta Médica/Nutricional</h2>
        <button 
          onClick={handleNewConsultation}
          disabled={startingConsultation}
          className="bg-purple-700 hover:bg-purple-800 transition-colors text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 flex items-center gap-2 disabled:opacity-60"
        >
          {startingConsultation ? 'Iniciando...' : '+ Nova Consulta'}
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className={`text-xs flex-1 ${consultationId ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>{consultationStatus}</p>
        <button
          type="button"
          onClick={analyzeEvolution}
          disabled={!consultationId || analyzingEvolution}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          title="Compara as duas últimas consultas salvas com o atendimento atual"
        >
          <span className="material-symbols-outlined text-base">monitoring</span>
          {analyzingEvolution ? 'Analisando evolução...' : 'Analisar evolução anterior'}
        </button>
      </div>

      {/* Header Info */}
      <div className="bg-[#f2f8f5] dark:bg-[#182825] border border-[#d8ebe1] dark:border-[#203a33] p-4 rounded-xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 font-semibold mb-1 text-[10px] tracking-wide uppercase">CPF</p>
            <p className="font-medium text-gray-900 dark:text-white">{selectedPatient?.cpf || 'Não informado'}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-2 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-500 font-bold mb-1 text-[10px] tracking-wide uppercase flex items-center gap-1">
              Alergias
            </p>
            <p className="font-medium text-gray-900 dark:text-white">{selectedPatient?.allergies || '—'}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2 rounded-lg">
            <p className="text-blue-700 dark:text-blue-500 font-bold mb-1 text-[10px] tracking-wide uppercase flex items-center gap-1">
              Doenças Crônicas
            </p>
            <p className="font-medium text-gray-900 dark:text-white">{selectedPatient?.diagnoses || '—'}</p>
          </div>
        </div>
      </div>

      {/* Main Recorder */}
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 p-4 rounded-xl mb-6">
        <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-semibold text-sm mb-4">
          Consulta com gravação longa
        </div>
        <div className="border border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-[#111113]">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Gravação de Consulta</h3>
          <p className="text-xs text-gray-500 mb-6">Clique no botão para iniciar a gravação da conversa com o paciente.</p>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
          >
            {recording ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            )}
          </button>

          {recording && <p className="text-red-500 font-bold text-sm mt-4 animate-pulse">Gravando... Não feche a página.</p>}
          {desktopAudio && !recording && !processingAudio && (
            <button
              onClick={() => processAudio(desktopAudio, desktopAudioMimeType)}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-sm"
            >
              Transcrever Consulta
            </button>
          )}
          {processingAudio && <p className="text-blue-500 font-bold text-sm mt-4 animate-pulse">Processando áudio com Gemini IA...</p>}
          {recordingError && <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{recordingError}</p>}
        </div>
      </div>

      {evolutionAnalysis && (
        <section className="mb-6 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/20 p-5">
          <h3 className="font-bold text-sm text-purple-900 dark:text-purple-200 flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-lg">trending_up</span>
            Evolução clínica entre consultas
          </h3>
          <p className="text-xs text-purple-800/70 dark:text-purple-200/70 mb-4">Baseada nas duas consultas salvas mais recentes e no atendimento atual.</p>
          <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{evolutionAnalysis}</div>
        </section>
      )}

      {/* Transcrição e Notas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">Transcrição</h3>
          </div>
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="w-full h-64 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-[#124f5a] dark:text-white"
            placeholder="A transcrição aparecerá aqui. Você também pode editar manualmente..."
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">Observações Adicionais</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-64 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-[#124f5a] dark:text-white"
            placeholder="Adicione observações clínicas, condutas que não foram faladas, hipóteses diagnósticas extras..."
          />
        </div>
      </div>

      {/* Ações de IA */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          Relatório Final de IA
        </h3>
        <p className="text-xs text-gray-500 mb-6">Gere uma documentação estruturada ou resumo usando a transcrição e suas observações.</p>

        <div className="flex flex-wrap gap-4">
          <button onClick={() => generateReport('synthetic')} disabled={processingAI || !transcription} className="flex items-center gap-2 px-6 py-3 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            Relatório IA Sintético
          </button>
          <button onClick={() => generateReport('structured')} disabled={processingAI || !transcription} className="flex items-center gap-2 px-6 py-3 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            Transcrição Estruturada IA
          </button>
        </div>
        {processingAI && <p className="text-sm text-blue-600 mt-4 animate-pulse">O Gemini está analisando e estruturando os dados...</p>}
      </div>

      {/* Resultado Estruturado */}
        {structuredReport && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#27272A]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 dark:text-white">Resultado Estruturado</h4>
              <button onClick={saveReportToRecord} disabled={processingAI} className="bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2 rounded-xl font-bold text-sm">
                Salvar no Prontuário
              </button>
            </div>
            <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#111113] p-6 rounded-xl border border-gray-200 dark:border-[#27272A] whitespace-pre-wrap">
              {structuredReport}
            </div>
          </div>
        )}
    </div>
  );
}
