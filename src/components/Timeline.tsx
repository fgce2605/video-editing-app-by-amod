import React, { useRef, useState } from 'react';
import { 
  Plus, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Video, 
  Music, 
  Mic, 
  Type, 
  Subtitles, 
  Layers 
} from 'lucide-react';
import { Track, Clip } from '../types';
import { formatTimecode } from '../utils/media';

interface TimelineProps {
  tracks: Track[];
  clips: Clip[];
  currentTime: number;
  duration: number;
  selectedClipId?: string;
  onSelectClip: (clipId: string | undefined) => void;
  onSeek: (time: number) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onOpenImportForTrack: (trackId: string, trackType: string) => void;
  onToggleMuteTrack: (trackId: string) => void;
  onToggleLockTrack: (trackId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  clips,
  currentTime,
  duration,
  selectedClipId,
  onSelectClip,
  onSeek,
  onUpdateClip,
  onOpenImportForTrack,
  onToggleMuteTrack,
  onToggleLockTrack,
}) => {
  // Zoom level: pixels per second (e.g. 20px per sec to 100px per sec)
  const [zoomPxPerSec, setZoomPxPerSec] = useState(30);

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragOffsetTime, setDragOffsetTime] = useState(0);

  // Handle timeline ruler click seeking
  const handleTimelineRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(duration, clickX / zoomPxPerSec));
    onSeek(clickedTime);
  };

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-3.5 h-3.5 text-red-400" />;
      case 'overlay': return <Layers className="w-3.5 h-3.5 text-sky-400" />;
      case 'audio': return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'voiceover': return <Mic className="w-3.5 h-3.5 text-amber-400" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-purple-400" />;
      case 'subtitle': return <Subtitles className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <Video className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const timelineWidthPx = Math.max(800, duration * zoomPxPerSec);

  // Ruler timestamp markers
  const rulerStepSec = zoomPxPerSec < 25 ? 5 : zoomPxPerSec < 50 ? 2 : 1;
  const rulerTicks = [];
  for (let t = 0; t <= duration; t += rulerStepSec) {
    rulerTicks.push(t);
  }

  return (
    <div className="flex-1 bg-slate-950 border-t border-slate-800 flex flex-col select-none overflow-hidden min-h-[220px]">
      {/* Timeline Controls Header */}
      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
          <span className="text-red-500">PLAYHEAD:</span>
          <span>{formatTimecode(currentTime)}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomPxPerSec(Math.max(10, zoomPxPerSec - 10))}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={10}
            max={120}
            value={zoomPxPerSec}
            onChange={(e) => setZoomPxPerSec(parseInt(e.target.value))}
            className="w-24 accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
          />
          <button
            onClick={() => setZoomPxPerSec(Math.min(120, zoomPxPerSec + 10))}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Multi-Track Scroll Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers (Left Fixed Column) */}
        <div className="w-48 sm:w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20 shadow-md">
          {/* Ruler Spacer Header */}
          <div className="h-7 bg-slate-900 border-b border-slate-800 px-3 flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TRACKS
          </div>

          {/* Track List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-14 px-2.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  {getTrackIcon(track.type)}
                  <span className="text-xs font-semibold text-slate-200 truncate" title={track.name}>
                    {track.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* CRITICAL REQUIREMENT: Dedicated '+' Import button for every track */}
                  <button
                    onClick={() => onOpenImportForTrack(track.id, track.type)}
                    className="p-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors cursor-pointer"
                    title={`Import media to ${track.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleMuteTrack(track.id)}
                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                      track.isMuted ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
                  >
                    {track.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onToggleLockTrack(track.id)}
                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                      track.isLocked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
                  >
                    {track.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Tracks Area (Right Scrollable Workspace) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-950 scrollbar-thin">
          <div 
            ref={timelineContainerRef}
            className="relative min-h-full"
            style={{ width: `${timelineWidthPx}px` }}
          >
            {/* Timeline Time Ruler */}
            <div 
              onClick={handleTimelineRulerClick}
              className="h-7 bg-slate-900/80 border-b border-slate-800 relative cursor-pointer select-none"
            >
              {rulerTicks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 border-l border-slate-800 text-[9px] font-mono text-slate-500 pl-1 pt-0.5"
                  style={{ left: `${t * zoomPxPerSec}px` }}
                >
                  {formatTimecode(t)}
                </div>
              ))}
            </div>

            {/* Red Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-lg"
              style={{ left: `${currentTime * zoomPxPerSec}px` }}
            >
              {/* Top Playhead Triangle Head */}
              <div className="w-3 h-3 bg-red-500 rotate-45 -translate-x-1.25 -translate-y-1.5 shadow" />
            </div>

            {/* Track Lanes */}
            <div className="divide-y divide-slate-800/40">
              {tracks.map((track) => {
                const trackClips = clips.filter((c) => c.trackId === track.id);

                return (
                  <div
                    key={track.id}
                    className="h-14 relative bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                  >
                    {trackClips.map((clip) => {
                      const isSelected = selectedClipId === clip.id;
                      const leftPx = clip.startTime * zoomPxPerSec;
                      const widthPx = clip.duration * zoomPxPerSec;

                      let trackBgColor = 'bg-red-900/40 border-red-700/80 text-red-100';
                      if (clip.mediaType === 'audio' || clip.mediaType === 'voiceover') {
                        trackBgColor = 'bg-emerald-900/40 border-emerald-700/80 text-emerald-100';
                      } else if (clip.mediaType === 'text' || clip.mediaType === 'subtitle') {
                        trackBgColor = 'bg-indigo-900/40 border-indigo-700/80 text-indigo-100';
                      } else if (clip.trackId === 'track-overlay') {
                        trackBgColor = 'bg-sky-900/40 border-sky-700/80 text-sky-100';
                      }

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip.id);
                          }}
                          className={`absolute top-1 bottom-1 rounded-lg border px-2 flex items-center justify-between cursor-pointer transition-all shadow-md group ${trackBgColor} ${
                            isSelected ? 'ring-2 ring-red-500 border-white z-10' : 'hover:border-slate-400'
                          }`}
                          style={{
                            left: `${leftPx}px`,
                            width: `${Math.max(30, widthPx)}px`,
                          }}
                        >
                          {/* Clip Thumbnail or Waveform preview */}
                          <div className="flex items-center gap-1.5 truncate">
                            {clip.thumbnailUrl ? (
                              <img src={clip.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                              getTrackIcon(clip.trackType)
                            )}
                            <span className="text-[11px] font-bold truncate">
                              {clip.name}
                            </span>
                          </div>

                          <span className="text-[9px] font-mono opacity-80 pl-1 shrink-0">
                            {clip.duration.toFixed(1)}s
                          </span>

                          {/* Left Trim Handle */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/40 hover:bg-red-500 rounded-l"
                            title="Trim Clip Start"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              // Simple trim start drag simulation
                              const startX = e.clientX;
                              const origStart = clip.startTime;
                              const origDur = clip.duration;

                              const onMouseMove = (moveE: MouseEvent) => {
                                const deltaSec = (moveE.clientX - startX) / zoomPxPerSec;
                                const newStart = Math.max(0, origStart + deltaSec);
                                const newDur = Math.max(0.5, origDur - deltaSec);
                                onUpdateClip(clip.id, { startTime: newStart, duration: newDur });
                              };

                              const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                              };

                              window.addEventListener('mousemove', onMouseMove);
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          />

                          {/* Right Trim Handle */}
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/40 hover:bg-red-500 rounded-r"
                            title="Trim Clip End"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const origDur = clip.duration;

                              const onMouseMove = (moveE: MouseEvent) => {
                                const deltaSec = (moveE.clientX - startX) / zoomPxPerSec;
                                const newDur = Math.max(0.5, origDur + deltaSec);
                                onUpdateClip(clip.id, { duration: newDur });
                              };

                              const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                              };

                              window.addEventListener('mousemove', onMouseMove);
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
