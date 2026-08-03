import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, Clip, Track, BatchExportItem } from './types';
import { createDefaultProject, saveProjectToStorage, loadProjectFromStorage, calculateProjectDuration } from './utils/projectStorage';
import { generateVideoThumbnail, extractAudioWaveform, createDemoVideoBlob, createDemoAudioBlob } from './utils/media';

import { TopNavbar } from './components/TopNavbar';
import { PreviewMonitor } from './components/PreviewMonitor';
import { ToolTabs } from './components/ToolTabs';
import { Timeline } from './components/Timeline';
import { VoiceoverRecorderModal } from './components/VoiceoverRecorderModal';
import { ExportModal } from './components/ExportModal';
import { AIToolsDrawer } from './components/AIToolsDrawer';

export default function App() {
  // Main Project State
  const [project, setProject] = useState<Project>(() => loadProjectFromStorage());
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<Project[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  // Modals & Drawers State
  const [isVoiceoverModalOpen, setIsVoiceoverModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAIToolsOpen, setIsAIToolsOpen] = useState<boolean>(false);
  const [batchQueue, setBatchQueue] = useState<BatchExportItem[]>([]);

  // Hidden File Inputs for system file pickers
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const targetTrackForImportRef = useRef<string | null>(null);

  // Save project auto-persist
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      saveProjectToStorage(project);
      setIsSaving(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [project]);

  // Record undo state snapshot
  const pushHistory = useCallback((newProject: Project) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyPointer + 1);
      return [...updated, newProject];
    });
    setHistoryPointer((prev) => prev + 1);
  }, [historyPointer]);

  const updateProjectState = useCallback((updater: (prev: Project) => Project) => {
    setProject((prev) => {
      const next = updater(prev);
      const recalcedDuration = calculateProjectDuration(next.clips, 10);
      const updatedProject = { ...next, duration: recalcedDuration };
      pushHistory(updatedProject);
      return updatedProject;
    });
  }, [pushHistory]);

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prev = history[historyPointer - 1];
      setHistoryPointer(historyPointer - 1);
      setProject(prev);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const next = history[historyPointer + 1];
      setHistoryPointer(historyPointer + 1);
      setProject(next);
    }
  };

  // Playhead transport animation loop
  const lastTickTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      lastTickTimeRef.current = performance.now();

      const tick = (now: number) => {
        if (lastTickTimeRef.current !== null) {
          const deltaSec = (now - lastTickTimeRef.current) / 1000;
          setCurrentTime((prev) => {
            const next = prev + deltaSec;
            if (next >= project.duration) {
              setIsPlaying(false);
              return 0; // loop back to start
            }
            return next;
          });
        }
        lastTickTimeRef.current = now;
        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTickTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, project.duration]);

  // Handle native file import selection
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>, isAudio = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    const trackId = targetTrackForImportRef.current || (isAudio ? 'track-audio' : 'track-video');

    let mediaType: 'video' | 'image' | 'audio' = isAudio ? 'audio' : file.type.startsWith('image/') ? 'image' : 'video';
    let sourceDur = 8.0;
    let thumbUrl = '';

    if (mediaType === 'video') {
      try {
        thumbUrl = await generateVideoThumbnail(objectUrl, 0.5);
      } catch (err) {
        console.warn('Thumbnail generation failed:', err);
      }
    }

    const newClip: Clip = {
      id: 'clip-' + Date.now(),
      trackId,
      trackType: isAudio ? 'audio' : trackId === 'track-overlay' ? 'overlay' : 'video',
      name: file.name,
      src: objectUrl,
      mediaType,
      startTime: currentTime,
      duration: sourceDur,
      sourceDuration: sourceDur,
      trimStart: 0,
      trimEnd: sourceDur,
      speed: 1.0,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      isMuted: false,
      reverse: false,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 100 },
      color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
      transitionIn: { type: 'none', duration: 0.5 },
      transitionOut: { type: 'none', duration: 0.5 },
      thumbnailUrl: thumbUrl,
    };

    updateProjectState((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
    }));

    setSelectedClipId(newClip.id);
    // Reset file input
    e.target.value = '';
  };

  // Open system file picker for specific track
  const triggerImportPicker = (trackId?: string, trackType?: string) => {
    targetTrackForImportRef.current = trackId || null;
    if (trackType === 'audio' || trackType === 'voiceover') {
      audioInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  // Add 1-click synthetic demo clips
  const handleAddDemoClips = async () => {
    const vidBlob = await createDemoVideoBlob('Demo Video Clip', 8, '#ef4444');
    const vidUrl = URL.createObjectURL(vidBlob);
    const thumb = await generateVideoThumbnail(vidUrl, 0.5);

    const mainClip: Clip = {
      id: 'demo-vid-' + Date.now(),
      trackId: 'track-video',
      trackType: 'video',
      name: 'Sample Demo Video.mp4',
      src: vidUrl,
      mediaType: 'video',
      startTime: 0,
      duration: 8,
      sourceDuration: 8,
      trimStart: 0,
      trimEnd: 8,
      speed: 1.0,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      isMuted: false,
      reverse: false,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 100 },
      color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
      transitionIn: { type: 'fade', duration: 0.5 },
      transitionOut: { type: 'fade', duration: 0.5 },
      thumbnailUrl: thumb,
    };

    const audioBlob = await createDemoAudioBlob('Chill Beat', 8);
    const audioUrl = URL.createObjectURL(audioBlob);

    const audioClip: Clip = {
      id: 'demo-audio-' + Date.now(),
      trackId: 'track-audio',
      trackType: 'audio',
      name: 'Chill Background Beat.mp3',
      src: audioUrl,
      mediaType: 'audio',
      startTime: 0,
      duration: 8,
      sourceDuration: 8,
      trimStart: 0,
      trimEnd: 8,
      speed: 1.0,
      volume: 80,
      fadeIn: 0.5,
      fadeOut: 0.5,
      isMuted: false,
      reverse: false,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 100 },
      color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
    };

    updateProjectState((prev) => ({
      ...prev,
      clips: [...prev.clips, mainClip, audioClip],
    }));

    setSelectedClipId(mainClip.id);
  };

  // Split clip at playhead
  const handleSplitClip = (clipId: string, atTime: number) => {
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (atTime <= clip.startTime + 0.2 || atTime >= clip.startTime + clip.duration - 0.2) {
      alert("Move playhead inside the clip duration to split!");
      return;
    }

    const firstDur = atTime - clip.startTime;
    const secondDur = clip.duration - firstDur;

    const clip1: Clip = { ...clip, duration: firstDur, trimEnd: clip.trimStart + firstDur };
    const clip2: Clip = {
      ...clip,
      id: 'clip-' + Date.now(),
      startTime: atTime,
      duration: secondDur,
      trimStart: clip.trimStart + firstDur,
    };

    updateProjectState((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === clipId ? clip1 : c)).concat(clip2),
    }));

    setSelectedClipId(clip2.id);
  };

  const handleUpdateClip = (clipId: string, updates: Partial<Clip>) => {
    updateProjectState((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
    }));
  };

  const handleDeleteClip = (clipId: string) => {
    updateProjectState((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== clipId),
    }));
    if (selectedClipId === clipId) setSelectedClipId(undefined);
  };

  const handleDuplicateClip = (clipId: string) => {
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const dup: Clip = {
      ...clip,
      id: 'clip-' + Date.now(),
      startTime: clip.startTime + clip.duration + 0.2,
      name: clip.name + ' (Copy)',
    };

    updateProjectState((prev) => ({
      ...prev,
      clips: [...prev.clips, dup],
    }));

    setSelectedClipId(dup.id);
  };

  // Add text overlay or AI subtitle
  const handleAddTextOverlay = (textStr = 'Title Text', isSubtitle = false) => {
    const textClip: Clip = {
      id: 'text-' + Date.now(),
      trackId: isSubtitle ? 'track-subtitle' : 'track-text',
      trackType: isSubtitle ? 'subtitle' : 'text',
      name: isSubtitle ? 'AI Subtitle' : 'Title Text',
      src: textStr,
      mediaType: isSubtitle ? 'subtitle' : 'text',
      startTime: currentTime,
      duration: 3.5,
      sourceDuration: 3.5,
      trimStart: 0,
      trimEnd: 3.5,
      speed: 1.0,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      isMuted: false,
      reverse: false,
      transform: { x: 0, y: isSubtitle ? 38 : 0, scale: 1.0, rotation: 0, opacity: 100 },
      color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
      textStyle: {
        text: textStr,
        fontFamily: 'Inter',
        fontSize: isSubtitle ? 24 : 42,
        color: '#ffffff',
        backgroundColor: isSubtitle ? 'rgba(0, 0, 0, 0.75)' : undefined,
        outlineColor: '#000000',
        alignment: 'center',
        animation: isSubtitle ? 'none' : 'slide-up',
      },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
    };

    updateProjectState((prev) => ({
      ...prev,
      clips: [...prev.clips, textClip],
    }));

    setSelectedClipId(textClip.id);
  };

  // In-App Voiceover Save Handler
  const handleSaveVoiceover = (audioBlob: Blob, durationSec: number) => {
    const objectUrl = URL.createObjectURL(audioBlob);
    const voiceoverClip: Clip = {
      id: 'vo-' + Date.now(),
      trackId: 'track-voiceover',
      trackType: 'voiceover',
      name: 'Studio Voiceover.wav',
      src: objectUrl,
      mediaType: 'audio',
      startTime: currentTime,
      duration: durationSec,
      sourceDuration: durationSec,
      trimStart: 0,
      trimEnd: durationSec,
      speed: 1.0,
      volume: 100,
      fadeIn: 0.2,
      fadeOut: 0.2,
      isMuted: false,
      reverse: false,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 100 },
      color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
    };

    updateProjectState((prev) => ({
      ...prev,
      clips: [...prev.clips, voiceoverClip],
    }));

    setSelectedClipId(voiceoverClip.id);
  };

  // AI Feature Handlers (API Backend Integration)
  const handleAISubtitles = async (language: string) => {
    const mainVid = project.clips.find((c) => c.mediaType === 'video');
    const res = await fetch('/api/ai/subtitles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clipDescription: mainVid?.name || 'video montage', duration: project.duration, language }),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.subtitles)) {
      const subtitleClips: Clip[] = data.subtitles.map((sub: any, idx: number) => ({
        id: `sub-${Date.now()}-${idx}`,
        trackId: 'track-subtitle',
        trackType: 'subtitle',
        name: `Sub: ${sub.text.substring(0, 15)}...`,
        src: sub.text,
        mediaType: 'subtitle',
        startTime: sub.start,
        duration: Math.max(0.5, sub.end - sub.start),
        sourceDuration: sub.end - sub.start,
        trimStart: 0,
        trimEnd: sub.end - sub.start,
        speed: 1.0,
        volume: 100,
        fadeIn: 0,
        fadeOut: 0,
        isMuted: false,
        reverse: false,
        transform: { x: 0, y: 38, scale: 1.0, rotation: 0, opacity: 100 },
        color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
        textStyle: {
          text: sub.text,
          fontFamily: 'Inter',
          fontSize: 26,
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          alignment: 'center',
          animation: 'none',
        },
        transitionIn: { type: 'none', duration: 0 },
        transitionOut: { type: 'none', duration: 0 },
      }));

      updateProjectState((prev) => ({
        ...prev,
        clips: prev.clips.filter((c) => c.trackId !== 'track-subtitle').concat(subtitleClips),
      }));
    }
  };

  const handleAISceneDetect = async () => {
    const res = await fetch('/api/ai/scene-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: project.duration, description: project.name }),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.cuts) && data.cuts.length > 0) {
      const vidClip = project.clips.find((c) => c.mediaType === 'video');
      if (vidClip) {
        data.cuts.forEach((cutTime: number) => {
          if (cutTime > vidClip.startTime && cutTime < vidClip.startTime + vidClip.duration) {
            handleSplitClip(vidClip.id, cutTime);
          }
        });
      }
    }
  };

  const handleAIColorCorrect = async () => {
    if (!selectedClipId) return;
    const res = await fetch('/api/ai/color-correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: 'vivid cinematic' }),
    });
    const data = await res.json();
    if (data.success && data.colorGrade) {
      handleUpdateClip(selectedClipId, {
        color: {
          brightness: data.colorGrade.brightness || 10,
          contrast: data.colorGrade.contrast || 15,
          saturation: data.colorGrade.saturation || 20,
          exposure: data.colorGrade.exposure || 5,
          hueRotate: 0,
          filter: (data.colorGrade.lutPreset as any) || 'vivid',
        },
      });
    }
  };

  const handleAITTS = async (text: string, voice: string) => {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    const data = await res.json();
    if (data.success && data.base64Audio) {
      const audioSrc = `data:audio/mp3;base64,${data.base64Audio}`;
      const ttsClip: Clip = {
        id: 'tts-' + Date.now(),
        trackId: 'track-voiceover',
        trackType: 'voiceover',
        name: `AI Voice: ${text.substring(0, 15)}...`,
        src: audioSrc,
        mediaType: 'audio',
        startTime: currentTime,
        duration: 4.5,
        sourceDuration: 4.5,
        trimStart: 0,
        trimEnd: 4.5,
        speed: 1.0,
        volume: 100,
        fadeIn: 0.1,
        fadeOut: 0.1,
        isMuted: false,
        reverse: false,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 100 },
        color: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hueRotate: 0, filter: 'none' },
        transitionIn: { type: 'none', duration: 0 },
        transitionOut: { type: 'none', duration: 0 },
      };

      updateProjectState((prev) => ({
        ...prev,
        clips: [...prev.clips, ttsClip],
      }));
    }
  };

  const handleAIHighlights = async () => {
    const res = await fetch('/api/ai/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clipsCount: project.clips.length, targetDuration: 15 }),
    });
    const data = await res.json();
    if (data.success) {
      alert("AI Highlight Reel compilation completed!");
    }
  };

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Hidden system file picker inputs */}
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*,image/*"
        onChange={(e) => handleFileImport(e, false)}
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        onChange={(e) => handleFileImport(e, true)}
        className="hidden"
      />

      {/* Top Navbar */}
      <TopNavbar
        project={project}
        onUpdateProject={(updates) => updateProjectState((prev) => ({ ...prev, ...updates }))}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyPointer > 0}
        canRedo={historyPointer < history.length - 1}
        onOpenImport={() => triggerImportPicker()}
        onOpenAITools={() => setIsAIToolsOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenBatchQueue={() => setIsExportModalOpen(true)}
        isSaving={isSaving}
      />

      {/* Middle Section: Live Video Preview Monitor */}
      <PreviewMonitor
        project={project}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onSeek={(t) => setCurrentTime(t)}
        selectedClipId={selectedClipId}
        onSelectClip={(id) => setSelectedClipId(id)}
      />

      {/* Editing Toolbar Tabs */}
      <ToolTabs
        selectedClip={selectedClip}
        currentTime={currentTime}
        onUpdateClip={handleUpdateClip}
        onSplitClip={handleSplitClip}
        onDeleteClip={handleDeleteClip}
        onDuplicateClip={handleDuplicateClip}
        onOpenImportModal={(trackType) => triggerImportPicker(undefined, trackType)}
        onOpenVoiceoverModal={() => setIsVoiceoverModalOpen(true)}
        onAddTextOverlay={handleAddTextOverlay}
        onTriggerAISubtitles={() => setIsAIToolsOpen(true)}
        onTriggerAISceneDetect={handleAISceneDetect}
        onTriggerAIColorCorrect={handleAIColorCorrect}
        onTriggerAITTS={() => setIsAIToolsOpen(true)}
        onTriggerAIHighlights={handleAIHighlights}
        onAddDemoClips={handleAddDemoClips}
      />

      {/* Bottom Multi-Track Timeline */}
      <Timeline
        tracks={project.tracks}
        clips={project.clips}
        currentTime={currentTime}
        duration={project.duration}
        selectedClipId={selectedClipId}
        onSelectClip={(id) => setSelectedClipId(id)}
        onSeek={(t) => setCurrentTime(t)}
        onUpdateClip={handleUpdateClip}
        onOpenImportForTrack={(trackId, trackType) => triggerImportPicker(trackId, trackType)}
        onToggleMuteTrack={(trackId) => {
          updateProjectState((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t)),
          }));
        }}
        onToggleLockTrack={(trackId) => {
          updateProjectState((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, isLocked: !t.isLocked } : t)),
          }));
        }}
      />

      {/* Modals & Drawers */}
      <VoiceoverRecorderModal
        isOpen={isVoiceoverModalOpen}
        onClose={() => setIsVoiceoverModalOpen(false)}
        onSaveVoiceover={handleSaveVoiceover}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        batchQueue={batchQueue}
        onAddToBatchQueue={(item) => setBatchQueue((prev) => [item, ...prev])}
      />

      <AIToolsDrawer
        isOpen={isAIToolsOpen}
        onClose={() => setIsAIToolsOpen(false)}
        onGenerateSubtitles={handleAISubtitles}
        onDetectScenes={handleAISceneDetect}
        onColorCorrect={handleAIColorCorrect}
        onGenerateTTS={handleAITTS}
        onGenerateHighlights={handleAIHighlights}
      />
    </div>
  );
}
