export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type Resolution = '480p' | '720p' | '1080p' | '2K' | '4K';

export type ExportFormat = 'mp4' | 'webm' | 'gif';

export type TrackType = 'video' | 'overlay' | 'audio' | 'voiceover' | 'text' | 'subtitle';

export type TransitionType = 'none' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom';

export type FilterPreset = 'none' | 'vintage' | 'cyberpunk' | 'film' | 'bw' | 'warm' | 'cool' | 'vivid' | 'hdr';

export interface PositionTransform {
  x: number; // percentage offset -50 to 50
  y: number; // percentage offset -50 to 50
  scale: number; // 0.1 to 3.0
  rotation: number; // degrees 0-360
  opacity: number; // 0-100
  cropLeft?: number; // 0-100
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;
}

export interface ColorAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  hueRotate: number; // 0 to 360
  filter: FilterPreset;
  greenScreenKey?: boolean; // Chroma key green removal
  chromaColor?: string; // default "#00ff00"
}

export interface TextStyle {
  text: string;
  fontFamily: string; // 'Inter', 'Playfair Display', 'Roboto', 'Impact', 'Monospace'
  fontSize: number; // px
  color: string; // hex
  backgroundColor?: string;
  outlineColor?: string;
  alignment: 'left' | 'center' | 'right';
  animation: 'none' | 'fade' | 'slide-up' | 'bounce' | 'typewriter' | 'glow';
}

export interface Clip {
  id: string;
  trackId: string;
  trackType: TrackType;
  name: string;
  src: string; // Blob URL, Data URL, or text content
  mediaType: 'video' | 'image' | 'audio' | 'text' | 'subtitle';
  
  // Timeline placement (in seconds)
  startTime: number;
  duration: number; // Trimmed duration on timeline
  sourceDuration: number; // Native file duration
  trimStart: number; // Start offset within source media
  trimEnd: number; // End offset within source media
  
  // Playback & Sound
  speed: number; // 0.25 to 4.0
  volume: number; // 0 to 200%
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  isMuted: boolean;
  reverse: boolean;

  // Visual Transforms & Grading
  transform: PositionTransform;
  color: ColorAdjustments;
  
  // Text specific (if mediaType === 'text' or 'subtitle')
  textStyle?: TextStyle;
  
  // Transitions
  transitionIn: { type: TransitionType; duration: number };
  transitionOut: { type: TransitionType; duration: number };

  // AI & Inpainting
  aiRemovedObjectBoxes?: { x: number; y: number; w: number; h: number }[];
  thumbnailUrl?: string; // Pre-extracted frame for timeline thumbnail
  waveform?: number[]; // Audio amplitude array for waveform rendering
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  isMuted: boolean;
  isLocked: boolean;
  isVisible: boolean;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  duration: number; // calculated max duration of project
}

export interface ExportConfig {
  resolution: Resolution;
  format: ExportFormat;
  quality: 'low' | 'medium' | 'high' | 'custom';
  fps: number;
  bitrateKbps: number;
}

export interface BatchExportItem {
  id: string;
  projectName: string;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: string;
}
