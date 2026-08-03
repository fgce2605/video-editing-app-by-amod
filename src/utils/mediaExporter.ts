import { Project, ExportConfig } from '../types';
import { getCanvasDimensions, renderCanvasFrame } from './canvasRenderer';

export interface ExportProgress {
  progressPercent: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  timeRemainingSec: number;
  statusText: string;
}

export async function exportProjectVideo(
  project: Project,
  config: ExportConfig,
  onProgress: (progress: ExportProgress) => void
): Promise<{ blobUrl: string; downloadName: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Setup resolution canvas dimensions
      let resWidth = 1920;
      switch (config.resolution) {
        case '480p': resWidth = 854; break;
        case '720p': resWidth = 1280; break;
        case '1080p': resWidth = 1920; break;
        case '2K': resWidth = 2560; break;
        case '4K': resWidth = 3840; break;
      }

      const dims = getCanvasDimensions(project.aspectRatio, resWidth);
      const canvas = document.createElement('canvas');
      canvas.width = dims.width;
      canvas.height = dims.height;
      const ctx = canvas.getContext('2d')!;

      const fps = config.fps || 30;
      const totalDurationSec = project.duration;
      const totalFrames = Math.ceil(totalDurationSec * fps);

      // 2. Setup MediaRecorder stream
      const stream = canvas.captureStream(fps);
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=h264')
        ? 'video/mp4;codecs=h264'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: config.bitrateKbps ? config.bitrateKbps * 1000 : 8000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const finalBlob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(finalBlob);
        const sanitizeName = project.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        const downloadName = `${sanitizeName}_${config.resolution}_${Date.now()}.${ext}`;
        resolve({ blobUrl, downloadName });
      };

      mediaRecorder.start();

      // 3. Render frame loop with async tick
      let currentFrame = 0;
      const startTimeMs = Date.now();

      const renderStep = async () => {
        if (currentFrame > totalFrames) {
          mediaRecorder.stop();
          return;
        }

        const currentTime = currentFrame / fps;
        
        // Render exact frame onto export canvas
        renderCanvasFrame(ctx, canvas.width, canvas.height, currentTime, project.clips);

        // Progress metrics
        const progressPercent = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
        const elapsedMs = Date.now() - startTimeMs;
        const estimatedTotalMs = currentFrame > 0 ? (elapsedMs / currentFrame) * totalFrames : 0;
        const timeRemainingSec = Math.max(0, Math.ceil((estimatedTotalMs - elapsedMs) / 1000));

        onProgress({
          progressPercent,
          currentFrame,
          totalFrames,
          timeRemainingSec,
          statusText: `Rendering frame ${currentFrame}/${totalFrames} (${progressPercent}%)`,
        });

        currentFrame++;
        // Short timeout yields execution back to UI thread so progress modal re-renders smoothly
        setTimeout(renderStep, 1000 / fps);
      };

      renderStep();
    } catch (err: any) {
      reject(err);
    }
  });
}
