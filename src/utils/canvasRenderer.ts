import { Clip, AspectRatio, FilterPreset } from '../types';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export function getCanvasDimensions(aspectRatio: AspectRatio, targetWidth = 1920): CanvasDimensions {
  switch (aspectRatio) {
    case '16:9':
      return { width: targetWidth, height: Math.round(targetWidth * (9 / 16)) }; // 1920x1080
    case '9:16':
      return { width: Math.round(targetWidth * (9 / 16)), height: targetWidth }; // 1080x1920
    case '1:1':
      return { width: targetWidth, height: targetWidth }; // 1080x1080
    case '4:5':
      return { width: Math.round(targetWidth * (4 / 5)), height: targetWidth }; // 1080x1350
    default:
      return { width: 1920, height: 1080 };
  }
}

// Media element cache to avoid recreating video/img HTML objects on every frame render
const mediaCache: Map<string, HTMLVideoElement | HTMLImageElement> = new Map();

export function getCachedMedia(src: string, isVideo: boolean): HTMLVideoElement | HTMLImageElement {
  if (mediaCache.has(src)) {
    return mediaCache.get(src)!;
  }

  if (isVideo) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    mediaCache.set(src, video);
    return video;
  } else {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    mediaCache.set(src, img);
    return img;
  }
}

/**
 * Builds CSS filter string for canvas context based on clip color grading settings
 */
export function buildCanvasFilterString(clip: Clip): string {
  const { brightness, contrast, saturation, exposure, filter } = clip.color;
  
  // Base adjustments
  const bVal = 100 + brightness;
  const cVal = 100 + contrast;
  const sVal = 100 + saturation;
  
  let filterStr = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%)`;

  if (exposure !== 0) {
    filterStr += ` brightness(${100 + exposure}%)`;
  }

  // LUT / Filter presets
  switch (filter) {
    case 'vintage':
      filterStr += ' sepia(50%) contrast(110%) warm(20%)';
      break;
    case 'cyberpunk':
      filterStr += ' hue-rotate(180deg) saturate(160%) contrast(120%)';
      break;
    case 'film':
      filterStr += ' sepia(20%) contrast(120%) saturate(85%)';
      break;
    case 'bw':
      filterStr += ' grayscale(100%) contrast(130%)';
      break;
    case 'warm':
      filterStr += ' sepia(30%) saturate(120%)';
      break;
    case 'cool':
      filterStr += ' hue-rotate(30deg) saturate(90%)';
      break;
    case 'vivid':
      filterStr += ' saturate(180%) contrast(115%)';
      break;
    case 'hdr':
      filterStr += ' contrast(140%) saturate(130%) brightness(105%)';
      break;
  }

  return filterStr.trim();
}

/**
 * Main render function for canvas compositing
 */
export function renderCanvasFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentTime: number,
  clips: Clip[],
  selectedClipId?: string
): void {
  // 1. Clear background canvas
  ctx.save();
  ctx.fillStyle = '#0f172a'; // Deep studio slate background
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle grid lines for canvas background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 2;
  const step = 80;
  for (let x = 0; x < canvasWidth; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y < canvasHeight; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // 2. Sort clips by track order (video -> overlay -> text -> subtitle)
  const trackOrderMap: Record<string, number> = {
    'track-video': 1,
    'track-overlay': 2,
    'track-text': 3,
    'track-subtitle': 4,
  };

  const activeClips = clips.filter((clip) => {
    return currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration;
  }).sort((a, b) => {
    const orderA = trackOrderMap[a.trackId] || 1;
    const orderB = trackOrderMap[b.trackId] || 1;
    return orderA - orderB;
  });

  // 3. Render active clips frame by frame
  for (const clip of activeClips) {
    const clipProgress = (currentTime - clip.startTime) / clip.duration;
    
    // Calculate transition opacity/progress
    let transitionOpacity = 1.0;
    const timeInClip = currentTime - clip.startTime;
    
    if (clip.transitionIn.type !== 'none' && timeInClip < clip.transitionIn.duration) {
      const p = timeInClip / clip.transitionIn.duration;
      if (clip.transitionIn.type === 'fade' || clip.transitionIn.type === 'dissolve') {
        transitionOpacity = Math.min(1.0, Math.max(0, p));
      }
    }
    
    const timeRemainingInClip = (clip.startTime + clip.duration) - currentTime;
    if (clip.transitionOut.type !== 'none' && timeRemainingInClip < clip.transitionOut.duration) {
      const p = timeRemainingInClip / clip.transitionOut.duration;
      if (clip.transitionOut.type === 'fade' || clip.transitionOut.type === 'dissolve') {
        transitionOpacity = Math.min(transitionOpacity, Math.max(0, p));
      }
    }

    ctx.save();

    // Overall clip opacity
    const finalOpacity = (clip.transform.opacity / 100) * transitionOpacity;
    ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));

    if (clip.mediaType === 'video' || clip.mediaType === 'image') {
      renderVisualClip(ctx, canvasWidth, canvasHeight, clip, currentTime, selectedClipId === clip.id);
    } else if (clip.mediaType === 'text' || clip.mediaType === 'subtitle') {
      renderTextClip(ctx, canvasWidth, canvasHeight, clip, clipProgress, selectedClipId === clip.id);
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Render Video or Image Clip
 */
function renderVisualClip(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  clip: Clip,
  currentTime: number,
  isSelected: boolean
) {
  const isVideo = clip.mediaType === 'video';
  const media = getCachedMedia(clip.src, isVideo);

  let mediaWidth = 1920;
  let mediaHeight = 1080;

  if (isVideo) {
    const vid = media as HTMLVideoElement;
    if (vid.videoWidth) {
      mediaWidth = vid.videoWidth;
      mediaHeight = vid.videoHeight;
    }
    
    // Calculate target frame time in source media
    const offsetInClip = (currentTime - clip.startTime) * clip.speed;
    const sourceTargetTime = clip.trimStart + offsetInClip;
    
    // Seek video if needed
    if (Math.abs(vid.currentTime - sourceTargetTime) > 0.15) {
      vid.currentTime = Math.max(0, sourceTargetTime);
    }
  } else if (media instanceof HTMLImageElement && media.naturalWidth) {
    mediaWidth = media.naturalWidth;
    mediaHeight = media.naturalHeight;
  }

  // Calculate cover/contain positioning
  const scaleX = canvasWidth / mediaWidth;
  const scaleY = canvasHeight / mediaHeight;
  const coverScale = Math.max(scaleX, scaleY);

  const drawWidth = mediaWidth * coverScale * clip.transform.scale;
  const drawHeight = mediaHeight * coverScale * clip.transform.scale;

  const posX = (canvasWidth / 2) + (clip.transform.x * canvasWidth / 100);
  const posY = (canvasHeight / 2) + (clip.transform.y * canvasHeight / 100);

  ctx.save();

  // Apply transforms
  ctx.translate(posX, posY);
  ctx.rotate((clip.transform.rotation * Math.PI) / 180);

  // Apply CSS color grading filter
  ctx.filter = buildCanvasFilterString(clip);

  // Draw media image/video frame centered
  try {
    ctx.drawImage(media, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } catch (err) {
    // Fallback placeholder rectangle if video frame isn't loaded yet
    ctx.fillStyle = '#334155';
    ctx.fillRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  }

  // Inpainting / Smart Object Removal patch simulation
  if (clip.aiRemovedObjectBoxes && clip.aiRemovedObjectBoxes.length > 0) {
    ctx.filter = 'none';
    for (const box of clip.aiRemovedObjectBoxes) {
      const bx = (-drawWidth / 2) + (box.x * drawWidth);
      const by = (-drawHeight / 2) + (box.y * drawHeight);
      const bw = box.w * drawWidth;
      const bh = box.h * drawHeight;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // blended background fill
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.restore();
    }
  }

  // Selection bounding box
  if (isSelected) {
    ctx.filter = 'none';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Corner handle circles
    ctx.fillStyle = '#ffffff';
    const corners = [
      [-drawWidth / 2, -drawHeight / 2],
      [drawWidth / 2, -drawHeight / 2],
      [drawWidth / 2, drawHeight / 2],
      [-drawWidth / 2, drawHeight / 2],
    ];
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Render Text or Subtitle Clip
 */
function renderTextClip(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  clip: Clip,
  progress: number,
  isSelected: boolean
) {
  if (!clip.textStyle) return;

  const style = clip.textStyle;
  const text = style.text || '';
  
  // Positioning
  const posX = (canvasWidth / 2) + (clip.transform.x * canvasWidth / 100);
  const posY = (canvasHeight / 2) + (clip.transform.y * canvasHeight / 100);

  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate((clip.transform.rotation * Math.PI) / 180);

  // Scaled font size
  const fontPx = style.fontSize * (canvasWidth / 1000) * clip.transform.scale;
  ctx.font = `bold ${fontPx}px ${style.fontFamily || 'Inter'}, sans-serif`;
  ctx.textAlign = style.alignment || 'center';
  ctx.textBaseline = 'middle';

  // Text Animation progress calculation
  let displayText = text;
  let animYOffset = 0;
  let animOpacity = 1.0;

  if (style.animation === 'typewriter') {
    const charsToShow = Math.floor(text.length * Math.min(1.0, progress * 2));
    displayText = text.substring(0, charsToShow);
  } else if (style.animation === 'slide-up' && progress < 0.2) {
    animYOffset = (1.0 - (progress / 0.2)) * 40;
  } else if (style.animation === 'fade' && progress < 0.2) {
    animOpacity = progress / 0.2;
  } else if (style.animation === 'bounce') {
    animYOffset = Math.sin(progress * Math.PI * 6) * 10;
  }

  ctx.globalAlpha *= animOpacity;

  // Measure text width for background pill
  const metrics = ctx.measureText(displayText || ' ');
  const textWidth = metrics.width;
  const paddingX = fontPx * 0.5;
  const paddingY = fontPx * 0.3;

  // Draw background pill if specified (e.g. for subtitles)
  if (style.backgroundColor) {
    ctx.fillStyle = style.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(
      -textWidth / 2 - paddingX,
      -fontPx / 2 - paddingY + animYOffset,
      textWidth + paddingX * 2,
      fontPx + paddingY * 2,
      12
    );
    ctx.fill();
  }

  // Draw glow / outline if specified
  if (style.animation === 'glow') {
    ctx.shadowColor = style.color;
    ctx.shadowBlur = 20;
  }

  if (style.outlineColor) {
    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = fontPx * 0.1;
    ctx.strokeText(displayText, 0, animYOffset);
  }

  // Draw main text
  ctx.fillStyle = style.color || '#ffffff';
  ctx.fillText(displayText, 0, animYOffset);

  // Selection outline
  if (isSelected) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      -textWidth / 2 - paddingX,
      -fontPx / 2 - paddingY + animYOffset,
      textWidth + paddingX * 2,
      fontPx + paddingY * 2
    );
  }

  ctx.restore();
}
