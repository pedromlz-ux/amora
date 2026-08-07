'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function MobileRecorder() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('Pronto para gravar');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!sessionId) setStatus('Sessão inválida');
  }, [sessionId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
      setStatus('Gravando áudio de backup...');
    } catch (err) {
      console.error(err);
      setStatus('Erro ao acessar microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
      setStatus('Processando e enviando...');
    }
  };

  const uploadAudio = async (blob: Blob) => {
    try {
      // Create a FormData or Base64. Let's use Base64 for simplicity with the same API route if needed,
      // But actually we should upload directly to Supabase Storage.
      // Wait, this page might not be authenticated. So we should send it to an API route that uploads using Service Role.
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        try {
          const res = await fetch('/api/mobile-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, audioData: base64data })
          });
          if (res.ok) {
            setStatus('Áudio enviado com sucesso!');
          } else {
            setStatus('Erro ao enviar áudio.');
          }
        } catch(e) {
          setStatus('Falha de rede ao enviar.');
        }
      };
    } catch (err) {
      setStatus('Erro ao processar áudio.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Gravador de Segurança</h1>
        <p className="text-sm text-gray-500 mb-8">
          Sessão: {sessionId?.substring(0,8)}...<br/>
          Deixe o celular próximo para garantir um backup com boa qualidade.
        </p>

        <p className={`font-semibold mb-6 ${recording ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
          {status}
        </p>

        {!recording ? (
          <button 
            onClick={startRecording}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary-dark transition-colors text-lg"
          >
            Iniciar Gravação
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="w-full bg-red-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-red-600 transition-colors text-lg"
          >
            Parar e Enviar
          </button>
        )}
      </div>
    </div>
  );
}
