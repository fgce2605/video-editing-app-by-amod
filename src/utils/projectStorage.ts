import { Project, Track, Clip } from '../types';

const LOCAL_STORAGE_KEY = 'proedit_studio_project_v1';

export function createDefaultProject(): Project {
  const tracks: Track[] = [
    { id: 'track-video', type: 'video', name: 'Main Video', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-overlay', type: 'overlay', name: 'Overlay / Watermark', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-text', type: 'text', name: 'Text & Titles', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-subtitle', type: 'subtitle', name: 'AI Subtitles', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-audio', type: 'audio', name: 'Background Music', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-voiceover', type: 'voiceover', name: 'Voiceover', isMuted: false, isLocked: false, isVisible: true },
  ];

  return {
    id: 'proj-' + Date.now(),
    name: 'Untitled Project',
    updatedAt: Date.now(),
    aspectRatio: '16:9',
    resolution: '1080p',
    fps: 30,
    tracks,
    clips: [],
    duration: 10, // default 10s canvas workspace
  };
}

export function saveProjectToStorage(project: Project): void {
  try {
    const updated = { ...project, updatedAt: Date.now() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save project to localStorage:', e);
  }
}

export function loadProjectFromStorage(): Project {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tracks) && Array.isArray(parsed.clips)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load project from localStorage:', e);
  }
  return createDefaultProject();
}

/**
 * Recalculate total project duration based on clips max end time
 */
export function calculateProjectDuration(clips: Clip[], defaultDuration: number = 10): number {
  let maxEndTime = defaultDuration;
  for (const clip of clips) {
    const clipEnd = clip.startTime + clip.duration;
    if (clipEnd > maxEndTime) {
      maxEndTime = clipEnd;
    }
  }
  return Math.max(5, Math.ceil(maxEndTime + 2)); // 2 sec buffer at end
}
