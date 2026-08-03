import React, { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Palette, 
  Type, 
  Volume2, 
  Crop, 
  Layers, 
  Wand2, 
  Plus, 
  Trash2, 
  Copy, 
  Zap, 
  Mic, 
  FastForward, 
  RotateCw, 
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { Clip, FilterPreset, TextStyle, TransitionType } from '../types';

interface ToolTabsProps {
  selectedClip?: Clip;
  currentTime: number;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onSplitClip: (clipId: string, atTime: number) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onOpenImportModal: (trackType?: string) => void;
  onOpenVoiceoverModal: () => void;
  onAddTextOverlay: (text?: string, isSubtitle?: boolean) => void;
  onTriggerAISubtitles: () => void;
  onTriggerAISceneDetect: () => void;
  onTriggerAIColorCorrect: () => void;
  onTriggerAITTS: () => void;
  onTriggerAIHighlights: () => void;
  onAddDemoClips: () => void;
}

export const ToolTabs: React.FC<ToolTabsProps> = ({
  selectedClip,
  currentTime,
  onUpdateClip,
  onSplitClip,
  onDeleteClip,
  onDuplicateClip,
  onOpenImportModal,
  onOpenVoiceoverModal,
  onAddTextOverlay,
  onTriggerAISubtitles,
  onTriggerAISceneDetect,
  onTriggerAIColorCorrect,
  onTriggerAITTS,
  onTriggerAIHighlights,
  onAddDemoClips,
}) => {
  const [activeTab, setActiveTab] = useState<
    'trim' | 'transitions' | 'color' | 'text' | 'audio' | 'ai' | 'transform' | 'import'
  >('trim');

  return (
    <div className="bg-slate-900 border-t border-b border-slate-800 text-slate-200 select-none z-20">
      {/* Top Tab Bar Navigation */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto border-b border-slate-800/80 scrollbar-none">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'import' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Import & Media</span>
        </button>

        <button
          onClick={() => setActiveTab('trim')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'trim' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Trim & Split</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'color' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Color & Filters</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'text' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text & Titles</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'audio' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Audio & Voice</span>
        </button>

        <button
          onClick={() => setActiveTab('transitions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'transitions' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Transitions</span>
        </button>

        <button
          onClick={() => setActiveTab('transform')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'transform' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Crop & Rotate</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Magic Tools</span>
        </button>
      </div>

      {/* Tab Panels Content Container */}
      <div className="p-3 bg-slate-900/90 max-h-36 overflow-y-auto">
        {/* 1. IMPORT TAB */}
        {activeTab === 'import' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onOpenImportModal('video')}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Import Video File
            </button>

            <button
              onClick={() => onOpenImportModal('overlay')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-sky-400" /> Import Video/Image Overlay
            </button>

            <button
              onClick={() => onOpenImportModal('audio')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" /> Import Music File
            </button>

            <button
              onClick={onOpenVoiceoverModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow cursor-pointer"
            >
              <Mic className="w-4 h-4 text-amber-400" /> Record Voiceover
            </button>

            <div className="border-l border-slate-800 pl-3">
              <button
                onClick={onAddDemoClips}
                className="bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Add sample animated clips if you don't have local media files"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Sample Demo Media</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. TRIM & SPLIT TAB */}
        {activeTab === 'trim' && (
          <div className="flex items-center gap-4 flex-wrap">
            {selectedClip ? (
              <>
                <button
                  onClick={() => onSplitClip(selectedClip.id, currentTime)}
                  className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Split at Playhead (S)</span>
                </button>

                <div className="flex items-center gap-2 border-l border-r border-slate-800 px-3">
                  <span className="text-xs text-slate-400 font-medium">Speed:</span>
                  {[0.5, 1.0, 1.5, 2.0, 4.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => onUpdateClip(selectedClip.id, { speed: spd })}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                        selectedClip.speed === spd ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onDuplicateClip(selectedClip.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => onDeleteClip(selectedClip.id)}
                  className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete Clip</span>
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">Select a clip on the timeline below to split, duplicate, or adjust speed.</p>
            )}
          </div>
        )}

        {/* 3. COLOR & FILTERS TAB */}
        {activeTab === 'color' && (
          <div className="flex items-center gap-6 flex-wrap">
            {selectedClip ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Preset LUTs:</span>
                  {(['none', 'vintage', 'cyberpunk', 'film', 'bw', 'warm', 'cool', 'vivid'] as FilterPreset[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => onUpdateClip(selectedClip.id, { color: { ...selectedClip.color, filter: f } })}
                      className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-colors ${
                        selectedClip.color.filter === f ? 'bg-red-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
                  <div className="flex flex-col gap-1 w-28">
                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between">
                      Brightness <span>{selectedClip.color.brightness}</span>
                    </label>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={selectedClip.color.brightness}
                      onChange={(e) => onUpdateClip(selectedClip.id, { color: { ...selectedClip.color, brightness: parseInt(e.target.value) } })}
                      className="accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-28">
                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between">
                      Contrast <span>{selectedClip.color.contrast}</span>
                    </label>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={selectedClip.color.contrast}
                      onChange={(e) => onUpdateClip(selectedClip.id, { color: { ...selectedClip.color, contrast: parseInt(e.target.value) } })}
                      className="accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-28">
                    <label className="text-[10px] text-slate-400 font-semibold flex justify-between">
                      Saturation <span>{selectedClip.color.saturation}</span>
                    </label>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={selectedClip.color.saturation}
                      onChange={(e) => onUpdateClip(selectedClip.id, { color: { ...selectedClip.color, saturation: parseInt(e.target.value) } })}
                      className="accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={onTriggerAIColorCorrect}
                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Auto Color Grade</span>
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">Select a clip to apply color grading, brightness adjustments, or filter presets.</p>
            )}
          </div>
        )}

        {/* 4. TEXT & TITLES TAB */}
        {activeTab === 'text' && (
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => onAddTextOverlay("Sample Title")}
              className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Text Title
            </button>

            {selectedClip && (selectedClip.mediaType === 'text' || selectedClip.mediaType === 'subtitle') && selectedClip.textStyle && (
              <div className="flex items-center gap-3 border-l border-slate-800 pl-3 flex-wrap">
                <input
                  type="text"
                  value={selectedClip.textStyle.text}
                  onChange={(e) => onUpdateClip(selectedClip.id, {
                    textStyle: { ...selectedClip.textStyle!, text: e.target.value }
                  })}
                  className="bg-slate-800 border border-slate-700 text-white px-2.5 py-1 rounded text-xs font-semibold w-48 outline-none focus:border-red-500"
                  placeholder="Overlay Text"
                />

                <input
                  type="color"
                  value={selectedClip.textStyle.color}
                  onChange={(e) => onUpdateClip(selectedClip.id, {
                    textStyle: { ...selectedClip.textStyle!, color: e.target.value }
                  })}
                  className="w-7 h-7 rounded border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                  title="Text Color"
                />

                <select
                  value={selectedClip.textStyle.animation}
                  onChange={(e) => onUpdateClip(selectedClip.id, {
                    textStyle: { ...selectedClip.textStyle!, animation: e.target.value as any }
                  })}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded px-2 py-1 outline-none"
                >
                  <option value="none">No Animation</option>
                  <option value="typewriter">Typewriter</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="bounce">Bounce</option>
                  <option value="fade">Fade In</option>
                  <option value="glow">Glow Pulse</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* 5. AUDIO & VOICE TAB */}
        {activeTab === 'audio' && (
          <div className="flex items-center gap-6 flex-wrap">
            <button
              onClick={onOpenVoiceoverModal}
              className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Record Live Voiceover</span>
            </button>

            {selectedClip && (
              <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
                <div className="flex flex-col gap-1 w-32">
                  <label className="text-[10px] text-slate-400 font-semibold flex justify-between">
                    Volume <span>{selectedClip.volume}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={selectedClip.volume}
                    onChange={(e) => onUpdateClip(selectedClip.id, { volume: parseInt(e.target.value) })}
                    className="accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. TRANSITIONS TAB */}
        {activeTab === 'transitions' && (
          <div className="flex items-center gap-4 flex-wrap">
            {selectedClip ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-semibold">Transition In:</span>
                {(['none', 'fade', 'dissolve', 'wipe', 'slide', 'zoom'] as TransitionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdateClip(selectedClip.id, { transitionIn: { ...selectedClip.transitionIn, type: t } })}
                    className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-colors ${
                      selectedClip.transitionIn.type === t ? 'bg-red-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Select a video clip to configure entry/exit transition animations.</p>
            )}
          </div>
        )}

        {/* 7. CROP & TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <div className="flex items-center gap-6 flex-wrap">
            {selectedClip ? (
              <>
                <button
                  onClick={() => onUpdateClip(selectedClip.id, {
                    transform: { ...selectedClip.transform, rotation: (selectedClip.transform.rotation + 90) % 360 }
                  })}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90° ({selectedClip.transform.rotation}°)</span>
                </button>

                <div className="flex flex-col gap-1 w-32">
                  <label className="text-[10px] text-slate-400 font-semibold flex justify-between">
                    Scale <span>{Math.round(selectedClip.transform.scale * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.2}
                    max={2.5}
                    step={0.05}
                    value={selectedClip.transform.scale}
                    onChange={(e) => onUpdateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, scale: parseFloat(e.target.value) }
                    })}
                    className="accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">Select a clip to rotate, scale, or reposition.</p>
            )}
          </div>
        )}

        {/* 8. AI MAGIC TOOLS TAB */}
        {activeTab === 'ai' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onTriggerAISubtitles}
              className="bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto Subtitles & Captions</span>
            </button>

            <button
              onClick={onTriggerAISceneDetect}
              className="bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Scene Cut Detector</span>
            </button>

            <button
              onClick={onTriggerAITTS}
              className="bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              <span>Text-to-Speech Voiceover</span>
            </button>

            <button
              onClick={onTriggerAIHighlights}
              className="bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Auto Highlight Reel</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
