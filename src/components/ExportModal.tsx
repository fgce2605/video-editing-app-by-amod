import React, { useState } from 'react';
import { 
  Download, 
  X, 
  CheckCircle2, 
  Loader2, 
  ListVideo, 
  FileVideo, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';
import { Project, ExportConfig, Resolution, ExportFormat, BatchExportItem } from '../types';
import { exportProjectVideo, ExportProgress } from '../utils/mediaExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  batchQueue: BatchExportItem[];
  onAddToBatchQueue: (item: BatchExportItem) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  batchQueue,
  onAddToBatchQueue,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'queue'>('export');

  const [config, setConfig] = useState<ExportConfig>({
    resolution: project.resolution || '1080p',
    format: 'mp4',
    quality: 'high',
    fps: project.fps || 30,
    bitrateKbps: 8000,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [completedResult, setCompletedResult] = useState<{ blobUrl: string; downloadName: string } | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setCompletedResult(null);
    setProgress({
      progressPercent: 0,
      currentFrame: 0,
      totalFrames: Math.ceil(project.duration * config.fps),
      timeRemainingSec: 0,
      statusText: 'Initializing Canvas & MediaRecorder engine...',
    });

    try {
      const res = await exportProjectVideo(project, config, (prog) => {
        setProgress(prog);
      });

      setCompletedResult(res);
      setIsExporting(false);

      // Add to batch queue record
      onAddToBatchQueue({
        id: 'export-' + Date.now(),
        projectName: project.name,
        progress: 100,
        status: 'completed',
        downloadUrl: res.blobUrl,
        fileSize: `${(project.duration * 0.8).toFixed(1)} MB`,
      });
    } catch (err: any) {
      alert('Export failed: ' + err.message);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl text-white">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'export' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" /> Export Video
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'queue' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListVideo className="w-4 h-4" /> Batch Queue ({batchQueue.length})
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. EXPORT CONFIG TAB */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            {/* Resolution selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block">
                Export Resolution:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['480p', '720p', '1080p', '2K', '4K'] as Resolution[]).map((res) => (
                  <button
                    key={res}
                    disabled={isExporting}
                    onClick={() => setConfig({ ...config, resolution: res })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      config.resolution === res
                        ? 'bg-red-600 border-red-500 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Format & FPS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Format:</label>
                <select
                  disabled={isExporting}
                  value={config.format}
                  onChange={(e) => setConfig({ ...config, format: e.target.value as ExportFormat })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-red-500"
                >
                  <option value="mp4">MP4 Video (H.264 / AAC)</option>
                  <option value="webm">WebM Video (VP9)</option>
                  <option value="gif">Animated GIF</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Frame Rate (FPS):</label>
                <select
                  disabled={isExporting}
                  value={config.fps}
                  onChange={(e) => setConfig({ ...config, fps: parseInt(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-red-500"
                >
                  <option value={24}>24 FPS (Cinematic Film)</option>
                  <option value={30}>30 FPS (Standard Video)</option>
                  <option value={60}>60 FPS (Ultra Smooth)</option>
                </select>
              </div>
            </div>

            {/* Quality Preset */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Bitrate / Quality Preset:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'low', label: 'Low (Fast Export)', kbps: 3000 },
                  { name: 'medium', label: 'Medium (Balanced)', kbps: 6000 },
                  { name: 'high', label: 'High Quality (8 Mbps)', kbps: 12000 },
                ].map((q) => (
                  <button
                    key={q.name}
                    disabled={isExporting}
                    onClick={() => setConfig({ ...config, quality: q.name as any, bitrateKbps: q.kbps })}
                    className={`p-2 rounded-xl text-xs font-semibold border text-center transition-colors ${
                      config.quality === q.name
                        ? 'bg-red-600/30 border-red-500 text-red-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Progress Bar during export */}
            {isExporting && progress && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    {progress.statusText}
                  </span>
                  <span>{progress.timeRemainingSec}s left</span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completed Result Download Box */}
            {completedResult && (
              <div className="bg-emerald-950/80 border border-emerald-700/80 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-100">Rendering Complete!</h4>
                    <p className="text-xs text-emerald-300/80">{completedResult.downloadName}</p>
                  </div>
                </div>

                <a
                  href={completedResult.blobUrl}
                  download={completedResult.downloadName}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            )}

            {/* Main Export Action Button */}
            {!isExporting && !completedResult && (
              <button
                onClick={handleStartExport}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Download className="w-5 h-5" /> Start Video Export Rendering
              </button>
            )}
          </div>
        )}

        {/* 2. BATCH QUEUE TAB */}
        {activeTab === 'queue' && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {batchQueue.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Batch export queue is empty. Complete an export to track history here.</p>
            ) : (
              batchQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-5 h-5 text-red-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.projectName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{item.fileSize || 'Rendered'} • {item.status}</p>
                    </div>
                  </div>

                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      download={`${item.projectName}.mp4`}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
