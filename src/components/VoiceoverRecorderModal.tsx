import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Check, X, Volume2 } from 'lucide-react';

interface VoiceoverRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoiceover: (audioBlob: Blob, durationSec: number) => void;
}

export const VoiceoverRecorderModal: React.FC<VoiceoverRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveVoiceover,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio VU Meter
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start VU meter loop
      const updateVolume = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolumeLevel(Math.min(100, avg * 1.5));
        if (mediaRecorderRef.current?.state === 'recording') {
          requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert("Microphone access is required to record voiceover: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleConfirmSave = () => {
    if (recordedBlob && recordingSeconds > 0) {
      onSaveVoiceover(recordedBlob, recordingSeconds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-lg">Record In-App Voiceover</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recording Visualizer Container */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-xl border border-slate-800/80 my-2">
          {isRecording ? (
            <div className="relative flex items-center justify-center">
              <div 
                className="w-24 h-24 rounded-full bg-red-600/30 flex items-center justify-center transition-all duration-75"
                style={{ transform: `scale(${1 + volumeLevel / 200})` }}
              >
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Mic className="w-10 h-10 text-slate-400" />
            </div>
          )}

          <div className="mt-4 font-mono font-bold text-2xl text-slate-100">
            00:{recordingSeconds.toString().padStart(2, '0')}
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {isRecording ? 'Recording microphone input...' : recordedBlob ? 'Recording complete!' : 'Click Record to start studio voiceover'}
          </p>
        </div>

        {/* Audio Playback Preview */}
        {audioUrl && !isRecording && (
          <div className="my-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Preview Voiceover Audio</span>
            </div>
            <audio src={audioUrl} controls className="h-8 w-44" />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between mt-5 gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Mic className="w-4 h-4" /> Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" /> Stop Recording
            </button>
          )}

          {recordedBlob && !isRecording && (
            <button
              onClick={handleConfirmSave}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Check className="w-4 h-4" /> Add to Timeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
