import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Repeat, 
  Layers, 
  Eye, 
  Grid 
} from 'lucide-react';
import { Project, Clip } from '../types';
import { getCanvasDimensions, renderCanvasFrame } from '../utils/canvasRenderer';
import { formatTimecode } from '../utils/media';

interface PreviewMonitorProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  selectedClipId?: string;
  onSelectClip?: (clipId: string | undefined) => void;
}

export const PreviewMonitor: React.FC<PreviewMonitorProps> = ({
  project,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  selectedClipId,
  onSelectClip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);

  // Sync canvas size with aspect ratio and window resize
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        const dims = getCanvasDimensions(project.aspectRatio, Math.min(1920, containerWidth));
        setCanvasSize(dims);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [project.aspectRatio]);

  // Render composite frame whenever currentTime or clips change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCanvasFrame(
      ctx,
      canvas.width,
      canvas.height,
      currentTime,
      project.clips,
      selectedClipId
    );
  }, [currentTime, project.clips, selectedClipId, canvasSize]);

  // Keyboard shortcut for spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 0.1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(project.duration, currentTime + 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, project.duration, onTogglePlay, onSeek]);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => console.warn(err));
      } else {
        document.exitFullscreen().catch(err => console.warn(err));
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-slate-950 flex flex-col items-center justify-between p-3 select-none overflow-hidden min-h-[360px] sm:min-h-[420px]"
      style={{ height: '48vh' }}
    >
      {/* Top Monitor Status Bar */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 px-3 py-1 bg-slate-900/60 rounded-lg border border-slate-800/80 mb-2 z-10">
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-slate-500">/</span>
          <span>{formatTimecode(project.duration)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`p-1 rounded hover:text-white transition-colors ${showSafeZones ? 'text-red-400 bg-slate-800' : 'text-slate-400'}`}
            title="Toggle Safe Zone Guide Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
            {project.aspectRatio}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {project.fps} FPS
          </span>
        </div>
      </div>

      {/* Main Canvas Monitor Display */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-auto">
        <div 
          className="relative bg-slate-900 rounded-lg shadow-2xl border border-slate-800 flex items-center justify-center max-h-full max-w-full overflow-hidden"
          style={{
            aspectRatio: project.aspectRatio === '16:9' ? '16/9' : project.aspectRatio === '9:16' ? '9/16' : project.aspectRatio === '1:1' ? '1/1' : '4/5',
            maxHeight: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={() => onSelectClip?.(undefined)}
            className="w-full h-full object-contain cursor-crosshair rounded"
          />

          {/* Safe zone overlay guide */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-500/30 m-8 rounded">
              <div className="absolute inset-x-0 top-1/2 border-b border-cyan-500/20" />
              <div className="absolute inset-y-0 left-1/2 border-r border-cyan-500/20" />
              <span className="absolute top-2 left-2 text-[10px] text-cyan-400/80 font-mono">Title Safe Area</span>
            </div>
          )}

          {/* Center Play Overlay Button when paused */}
          {!isPlaying && project.clips.length > 0 && (
            <button
              onClick={onTogglePlay}
              className="absolute bg-red-600/90 hover:bg-red-500 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm border border-red-400/40"
            >
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            </button>
          )}

          {/* Empty state hint if no media imported */}
          {project.clips.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Layers className="w-12 h-12 text-slate-700 mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-slate-400">No media clips imported</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">Use the <span className="text-red-400 font-bold">Import Media</span> button or track "+" icons below to add video or audio.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Monitor Scrub Bar & Player Controls */}
      <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-xl px-4 py-2 mt-2 flex flex-col gap-2 backdrop-blur-md z-10">
        {/* Scrubber track */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
            {formatTimecode(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={project.duration}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 accent-red-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12">
            {formatTimecode(project.duration)}
          </span>
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${isMuted ? 'text-red-400' : 'text-slate-400 hover:text-white'}`}
              title={isMuted ? 'Unmute' : 'Mute Preview'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${isLooping ? 'text-red-500 bg-slate-800' : 'text-slate-400 hover:text-white'}`}
              title="Loop Playback"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Core Transport Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Step Back 1s"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
            </button>

            <button
              onClick={() => onSeek(Math.min(project.duration, currentTime + 1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Step Forward 1s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Fullscreen Preview"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
