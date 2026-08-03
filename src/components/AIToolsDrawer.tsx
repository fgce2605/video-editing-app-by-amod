import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Scissors, 
  Palette, 
  Mic, 
  FastForward, 
  Wand2, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

interface AIToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSubtitles: (language: string) => Promise<void>;
  onDetectScenes: () => Promise<void>;
  onColorCorrect: () => Promise<void>;
  onGenerateTTS: (text: string, voice: string) => Promise<void>;
  onGenerateHighlights: () => Promise<void>;
}

export const AIToolsDrawer: React.FC<AIToolsDrawerProps> = ({
  isOpen,
  onClose,
  onGenerateSubtitles,
  onDetectScenes,
  onColorCorrect,
  onGenerateTTS,
  onGenerateHighlights,
}) => {
  const [activeTool, setActiveTool] = useState<
    'subtitles' | 'scenes' | 'color' | 'tts' | 'highlights'
  >('subtitles');

  const [language, setLanguage] = useState('English');
  const [ttsText, setTtsText] = useState('Welcome to ProEdit Studio, powered by Google Gemini AI!');
  const [ttsVoice, setTtsVoice] = useState('Kore');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleRunSubtitles = async () => {
    setIsLoading(true);
    setStatusMsg('Asking Gemini to transcribe & generate synchronized subtitles...');
    try {
      await onGenerateSubtitles(language);
      setStatusMsg('AI Subtitles generated & added to Subtitle Track!');
    } catch (err: any) {
      alert('AI Subtitles error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSceneDetect = async () => {
    setIsLoading(true);
    setStatusMsg('Analyzing clip scene cuts with AI...');
    try {
      await onDetectScenes();
      setStatusMsg('Scene cut detection complete!');
    } catch (err: any) {
      alert('AI Scene detect error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunColor = async () => {
    setIsLoading(true);
    setStatusMsg('Analyzing mood and applying AI color correction...');
    try {
      await onColorCorrect();
      setStatusMsg('AI Color Correction applied!');
    } catch (err: any) {
      alert('AI Color error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTTS = async () => {
    if (!ttsText) return;
    setIsLoading(true);
    setStatusMsg('Generating Gemini Text-to-Speech audio...');
    try {
      await onGenerateTTS(ttsText, ttsVoice);
      setStatusMsg('TTS Voiceover clip added to Voiceover track!');
    } catch (err: any) {
      alert('TTS error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunHighlights = async () => {
    setIsLoading(true);
    setStatusMsg('Compiling best moments with AI Reel Generator...');
    try {
      await onGenerateHighlights();
      setStatusMsg('AI Highlight Reel generated!');
    } catch (err: any) {
      alert('Highlights error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-6 w-full max-w-xl shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-lg text-indigo-200">Gemini AI Studio Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 mb-5 scrollbar-none">
          {[
            { id: 'subtitles', name: 'Auto Subtitles', icon: Sparkles },
            { id: 'scenes', name: 'Scene Cuts', icon: Scissors },
            { id: 'color', name: 'Color Grade', icon: Palette },
            { id: 'tts', name: 'Text-to-Speech', icon: Mic },
            { id: 'highlights', name: 'Reel Generator', icon: FastForward },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTool === t.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tool Configuration Box */}
        <div className="space-y-4 min-h-[160px]">
          {activeTool === 'subtitles' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Automatically transcribe video speech and generate synchronized caption text overlay tracks using Gemini AI.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Target Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold outline-none"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="German">German (Deutsch)</option>
                </select>
              </div>
              <button
                disabled={isLoading}
                onClick={handleRunSubtitles}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wand2 className="w-4 h-4" /> Generate Subtitles Track
              </button>
            </div>
          )}

          {activeTool === 'scenes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Detect scene cut locations in video footage and automatically introduce split cuts on the main timeline.
              </p>
              <button
                disabled={isLoading}
                onClick={handleRunSceneDetect}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scissors className="w-4 h-4" /> Auto-Split Scenes
              </button>
            </div>
          )}

          {activeTool === 'color' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Let Gemini recommend and apply optimal color grading settings, contrast, and LUT filter presets for selected clips.
              </p>
              <button
                disabled={isLoading}
                onClick={handleRunColor}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Palette className="w-4 h-4" /> Auto-Grade Color
              </button>
            </div>
          )}

          {activeTool === 'tts' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Text Prompt:</label>
                <textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Voice Accent:</label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                >
                  <option value="Kore">Kore (Warm Female)</option>
                  <option value="Puck">Puck (Energetic Male)</option>
                  <option value="Charon">Charon (Deep Male)</option>
                  <option value="Zephyr">Zephyr (Smooth Female)</option>
                </select>
              </div>

              <button
                disabled={isLoading}
                onClick={handleRunTTS}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" /> Generate Text-to-Speech Voiceover
              </button>
            </div>
          )}

          {activeTool === 'highlights' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Compile best clip segments into a fast-paced 15s highlight reel for social media.
              </p>
              <button
                disabled={isLoading}
                onClick={handleRunHighlights}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <FastForward className="w-4 h-4" /> Generate Highlight Reel
              </button>
            </div>
          )}

          {/* Status message */}
          {statusMsg && (
            <div className="p-3 bg-slate-950 rounded-xl border border-indigo-900/50 flex items-center gap-2 text-xs font-medium text-indigo-300">
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
