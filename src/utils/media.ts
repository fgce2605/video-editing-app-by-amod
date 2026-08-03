/**
 * Utility functions for extracting video thumbnails, audio waveforms,
 * generating test sample media clips, and helper math.
 */

export async function generateVideoThumbnail(videoSrc: string, timeSeconds: number = 0.5): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoSrc;
    video.muted = true;
    video.currentTime = timeSeconds;

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Thumbnail capture failed:', err);
      }
      cleanup();
      resolve('');
    };

    const onError = () => {
      cleanup();
      resolve('');
    };

    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.removeAttribute('src');
      video.load();
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
  });
}

export async function extractAudioWaveform(audioBlobUrl: string, samplesCount: number = 50): Promise<number[]> {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const response = await fetch(audioBlobUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samplesCount);
    const waveform: number[] = [];

    for (let i = 0; i < samplesCount; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j] || 0);
      }
      waveform.push(Math.min(1, (sum / blockSize) * 2.5));
    }
    audioCtx.close();
    return waveform;
  } catch (err) {
    console.warn('Failed to extract waveform:', err);
    // Return pseudo waveform if decode fails
    return Array.from({ length: samplesCount }, () => Math.random() * 0.7 + 0.3);
  }
}

/**
 * Creates a synthetic demo video blob (e.g. animated color gradient canvas) 
 * so users can test immediately if they don't have local media files handy.
 */
export function createDemoVideoBlob(title: string = "Sample Video", durationSec: number = 8, color: string = "#ef4444"): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(30);
    
    // Create audio context oscillator for dummy background tone
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05; // soft tone
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    // Combine video and audio tracks
    const combinedTracks = [...stream.getVideoTracks(), ...dest.getAudioTracks()];
    const combinedStream = new MediaStream(combinedTracks);

    const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    mediaRecorder.start();

    let frame = 0;
    const totalFrames = durationSec * 30;

    const renderLoop = () => {
      if (frame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      // Draw animated background
      const progress = frame / totalFrames;
      const hue = (frame * 2) % 360;
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, `hsl(${hue}, 80%, 25%)`);
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, `hsl(${(hue + 120) % 360}, 80%, 15%)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw moving circle
      const cx = canvas.width * 0.5 + Math.sin(progress * Math.PI * 4) * 300;
      const cy = canvas.height * 0.5 + Math.cos(progress * Math.PI * 4) * 150;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Title & Timecode
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

      ctx.font = '32px monospace';
      const curSec = (frame / 30).toFixed(1);
      ctx.fillText(`00:00:${curSec.padStart(4, '0')} / ${durationSec}s`, canvas.width / 2, canvas.height / 2 + 50);

      frame++;
      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  });
}

/**
 * Creates a synthetic demo audio blob (e.g. relaxing synth chord)
 */
export function createDemoAudioBlob(title: string = "Chill Beat", durationSec: number = 10): Promise<Blob> {
  return new Promise((resolve) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    
    // Create 3 harmonic oscillators
    const freqs = [220, 277.18, 329.63]; // A minor chord
    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq + idx * 2;
      gain.gain.value = 0.1 / freqs.length;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
    });

    const recorder = new MediaRecorder(dest.stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      audioCtx.close();
      resolve(new Blob(chunks, { type: 'audio/webm' }));
    };

    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, durationSec * 1000);
  });
}

export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
