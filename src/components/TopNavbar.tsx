import React from 'react';
import { 
  Film, 
  RotateCcw, 
  RotateCw, 
  Plus, 
  Sparkles, 
  Download, 
  Monitor, 
  Smartphone, 
  Square, 
  SlidersHorizontal,
  CheckCircle2,
  ListVideo
} from 'lucide-react';
import { AspectRatio, Resolution, Project } from '../types';

interface TopNavbarProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenImport: () => void;
  onOpenAITools: () => void;
  onOpenExport: () => void;
  onOpenBatchQueue: () => void;
  isSaving?: boolean;
  onTriggerInstall?: () => void;
  isInstalled?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  project,
  onUpdateProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenImport,
  onOpenAITools,
  onOpenExport,
  onOpenBatchQueue,
  isSaving,
  onTriggerInstall,
  isInstalled,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between shadow-md select-none z-30">
      {/* Left: Branding & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-black px-3 py-1.5 rounded-lg shadow-sm text-sm tracking-wider">
          <Film className="w-4 h-4 text-white" />
          <span>PROEDIT</span>
          <span className="text-xs bg-red-950/60 px-1.5 py-0.5 rounded font-mono text-red-200">STUDIO</span>
        </div>

        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdateProject({ name: e.target.value })}
          className="bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-950 border border-slate-700/60 focus:border-red-500 text-slate-100 font-semibold px-2.5 py-1 rounded text-sm outline-none transition-all w-44 sm:w-60 truncate"
          placeholder="Project Title"
        />

        <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 pl-2">
          {isSaving ? (
            <span className="text-amber-400 animate-pulse flex items-center gap-1">Saving...</span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Middle: Aspect Ratio, Resolution & History Controls */}
      <div className="flex items-center gap-2">
        {/* Aspect Ratio Switcher */}
        <div className="bg-slate-800/90 border border-slate-700 p-1 rounded-lg flex items-center gap-1">
          <button
            onClick={() => onUpdateProject({ aspectRatio: '16:9' })}
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors ${
              project.aspectRatio === '16:9' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="16:9 Landscape (YouTube)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">16:9</span>
          </button>
          <button
            onClick={() => onUpdateProject({ aspectRatio: '9:16' })}
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors ${
              project.aspectRatio === '9:16' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="9:16 Portrait (TikTok/Shorts/Reels)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">9:16</span>
          </button>
          <button
            onClick={() => onUpdateProject({ aspectRatio: '1:1' })}
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors ${
              project.aspectRatio === '1:1' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="1:1 Square (Instagram)"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">1:1</span>
          </button>
        </div>

        {/* Resolution selector */}
        <select
          value={project.resolution}
          onChange={(e) => onUpdateProject({ resolution: e.target.value as Resolution })}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg px-2 py-1.5 outline-none focus:border-red-500 cursor-pointer hidden sm:block"
        >
          <option value="480p">480p SD</option>
          <option value="720p">720p HD</option>
          <option value="1080p">1080p Full HD</option>
          <option value="2K">2K Quad HD</option>
          <option value="4K">4K Ultra HD</option>
        </select>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg border border-slate-800 transition-all ${
              canUndo
                ? 'text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg border border-slate-800 transition-all ${
              canRedo
                ? 'text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* PWA Native Install Button */}
        {onTriggerInstall && !isInstalled && (
          <button
            onClick={onTriggerInstall}
            className="bg-red-950/80 hover:bg-red-900 border border-red-600/80 text-red-100 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="Install ProEdit Studio PWA App"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Prominent ALWAYS-VISIBLE Import Media Button */}
        <button
          onClick={onOpenImport}
          className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Import Video, Image, Audio"
        >
          <Plus className="w-4 h-4 text-red-500" />
          <span>Import Media</span>
        </button>

        {/* AI Tools */}
        <button
          onClick={onOpenAITools}
          className="bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          title="AI Subtitles & Magic Tools"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="hidden md:inline">AI Studio</span>
        </button>

        {/* Batch Queue */}
        <button
          onClick={onOpenBatchQueue}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg border border-slate-700 hidden sm:flex items-center justify-center cursor-pointer"
          title="Batch Export Queue"
        >
          <ListVideo className="w-4 h-4" />
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
