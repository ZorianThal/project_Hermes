import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Download,
  Sparkles,
  Sliders,
  Crop,
  Layers,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { api } from '../services/api';

export const MediaLab: React.FC = () => {
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video'>('image');

  // Image Resizer & AI Editor State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [targetWidth, setTargetWidth] = useState<number>(1024);
  const [targetHeight, setTargetHeight] = useState<number>(1024);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Gemini AI Enhance / Transformation
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isProcessingAiImage, setIsProcessingAiImage] = useState<boolean>(false);
  const [aiResultImage, setAiResultImage] = useState<string | null>(null);
  const [aiResultText, setAiResultText] = useState<string | null>(null);

  // Video Generator State
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [videoStatusMsg, setVideoStatusMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoImageRef = useRef<HTMLInputElement>(null);
  const [videoSeedImage, setVideoSeedImage] = useState<string | null>(null);

  // Handle image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);

      // Measure natural dimensions
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.width);
        setNaturalHeight(img.height);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Perform client-side canvas high-precision resize
  const handleClientResize = (format: 'png' | 'jpeg' | 'webp' = 'png'): string => {
    if (!selectedImage) return '';
    const img = new Image();
    img.src = selectedImage;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // High quality bicubic filtering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL(`image/${format}`, 0.95);
  };

  const handleDownloadResized = (format: 'png' | 'jpeg' | 'webp' = 'png') => {
    const resizedData = handleClientResize(format);
    if (!resizedData) return;

    const link = document.createElement('a');
    link.download = `hellgate_resized_${targetWidth}x${targetHeight}.${format}`;
    link.href = resizedData;
    link.click();
  };

  // Run Gemini AI Image Edit / Enhancement
  const handleGeminiImageEdit = async () => {
    if (!selectedImage || isProcessingAiImage) return;

    setIsProcessingAiImage(true);
    setAiResultImage(null);
    setAiResultText(null);

    try {
      const res = await api.geminiImageEdit(
        selectedImage,
        aiPrompt || 'Enhance quality, sharpen details, and balance contrast',
        aspectRatio,
        imageMime
      );
      if (res.success && res.imageUrl) {
        setAiResultImage(res.imageUrl);
        setAiResultText(res.text || 'Processed with Gemini Flash Image.');
      }
    } catch (err: any) {
      alert(`AI Image Transformation failed: ${err.message}`);
    } finally {
      setIsProcessingAiImage(false);
    }
  };

  // Run Gemini Video Generation
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() && !videoSeedImage) return;

    setIsGeneratingVideo(true);
    setResultVideoUrl(null);
    setVideoStatusMsg(null);

    try {
      const res = await api.geminiVideoGenerate(
        videoPrompt,
        videoAspectRatio,
        videoSeedImage || undefined
      );

      if (res.videoUrl) {
        setResultVideoUrl(res.videoUrl);
      } else {
        setVideoStatusMsg(
          res.message || 'Video generation task dispatched to Gemini Omni engine.'
        );
      }
    } catch (err: any) {
      alert(`Video Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-mono">
      {/* Sub-Header Tabs */}
      <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMediaTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMediaTab === 'image'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>IMAGE RESIZING & GEMINI ENHANCE</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMediaTab === 'video'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>VIDEO SYNTHESIZER & RESIZE</span>
            <span className="text-[9px] px-1 rounded bg-rose-900/60 text-rose-200">Omni 1.1</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          High-performance canvas processing + Gemini multimodal
        </span>
      </div>

      {/* TAB 1: IMAGE STUDIO */}
      {activeMediaTab === 'image' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Controls Column */}
          <div className="w-full lg:w-96 border-r border-slate-900 bg-slate-950/70 p-4 overflow-y-auto space-y-4">
            {/* Upload Area */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                1. Source Image
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-800 hover:border-rose-500/60 rounded-xl p-4 text-center bg-slate-900/30 hover:bg-slate-900/60 transition flex flex-col items-center justify-center gap-2 group"
              >
                <Upload className="w-5 h-5 text-slate-500 group-hover:text-rose-400 transition" />
                <span className="text-xs text-slate-300 group-hover:text-white font-medium">
                  {selectedImage ? 'Replace Image' : 'Upload Image (PNG, JPG, WebP)'}
                </span>
                {naturalWidth > 0 && (
                  <span className="text-[10px] text-slate-500">
                    Natural: {naturalWidth} × {naturalHeight} px
                  </span>
                )}
              </button>
            </div>

            {/* Dimensional Resize Controls */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Target Dimensions
                </span>
                <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintainAspect}
                    onChange={(e) => setMaintainAspect(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span>Lock Ratio</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Width (px)</span>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setTargetWidth(val);
                      if (maintainAspect && naturalWidth > 0) {
                        setTargetHeight(Math.round((val / naturalWidth) * naturalHeight));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Height (px)</span>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setTargetHeight(val);
                      if (maintainAspect && naturalHeight > 0) {
                        setTargetWidth(Math.round((val / naturalHeight) * naturalWidth));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Quick Dimension Presets */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[
                  { label: 'Avatar (512²)', w: 512, h: 512 },
                  { label: 'HD (1280x720)', w: 1280, h: 720 },
                  { label: 'FHD (1920x1080)', w: 1920, h: 1080 },
                  { label: 'Square (1024²)', w: 1024, h: 1024 },
                  { label: 'Story (1080x1920)', w: 1080, h: 1920 },
                  { label: 'Thumbnail (320x180)', w: 320, h: 180 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTargetWidth(preset.w);
                      setTargetHeight(preset.h);
                    }}
                    className="px-1.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 text-center truncate transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Download Buttons */}
              <div className="pt-2 flex items-center gap-1.5">
                <button
                  onClick={() => handleDownloadResized('png')}
                  disabled={!selectedImage}
                  className="flex-1 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => handleDownloadResized('webp')}
                  disabled={!selectedImage}
                  className="flex-1 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>WebP</span>
                </button>
                <button
                  onClick={() => handleDownloadResized('jpeg')}
                  disabled={!selectedImage}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JPG</span>
                </button>
              </div>
            </div>

            {/* Gemini AI Image Transformation / Inpainting */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Gemini AI Image Modifier
                </span>
                <span className="text-[10px] text-rose-400 font-mono">3.1-flash-image</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Target Aspect Ratio:</span>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1 rounded border text-center transition ${
                        aspectRatio === ratio
                          ? 'border-rose-500 bg-rose-900/60 text-white font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">
                  AI Modification Instruction
                </span>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 'Enhance lighting with cinematic cyber-neon reflections and ultra-sharp 8k resolution'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none h-18"
                />
              </div>

              <button
                onClick={handleGeminiImageEdit}
                disabled={!selectedImage || isProcessingAiImage}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-rose-950/40"
              >
                {isProcessingAiImage ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-rose-300" />
                    <span>SYNTHESIZING WITH GEMINI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>GENERATE AI MODIFICATION</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Canvas Area */}
          <div className="flex-1 flex flex-col p-4 bg-black/70 overflow-y-auto items-center justify-center">
            {selectedImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-h-[70vh] w-full">
                  {/* Original / Resized Preview */}
                  <div className="flex flex-col items-center gap-2 max-w-md w-full">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5 text-cyan-400" /> Target Canvas: {targetWidth} × {targetHeight}
                    </span>
                    <div
                      style={{
                        aspectRatio: `${targetWidth} / ${targetHeight}`,
                      }}
                      className="max-h-[50vh] max-w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50 flex items-center justify-center shadow-xl"
                    >
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* AI Generated Result if available */}
                  {aiResultImage && (
                    <div className="flex flex-col items-center gap-2 max-w-md w-full">
                      <span className="text-xs text-rose-300 font-mono flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Gemini Enhanced Result
                      </span>
                      <div className="max-h-[50vh] max-w-full rounded-xl border border-rose-800/80 overflow-hidden bg-slate-900/50 flex items-center justify-center shadow-xl shadow-rose-950/20">
                        <img
                          src={aiResultImage}
                          alt="AI Result"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <a
                        href={aiResultImage}
                        download="gemini_enhanced_image.png"
                        className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Result</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 gap-3">
                <ImageIcon className="w-16 h-16 opacity-30" />
                <span className="text-sm">Upload an image on the left to begin resizing or AI enhancing</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VIDEO STUDIO */}
      {activeMediaTab === 'video' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Video Controls Column */}
          <div className="w-full lg:w-96 border-r border-slate-900 bg-slate-950/70 p-4 overflow-y-auto space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Video className="w-4 h-4 text-rose-400" />
                VIDEO SYNTHESIS & RESIZER
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Generate or animate videos using Gemini Omni Multimodal Engine
              </p>
            </div>

            {/* Optional Initial Frame / Seed Image */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                Optional Seed Frame
              </label>
              <input
                type="file"
                ref={videoImageRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setVideoSeedImage(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
              <button
                onClick={() => videoImageRef.current?.click()}
                className="w-full p-2.5 rounded-lg border border-slate-800 hover:border-rose-500 bg-slate-900/40 text-xs text-slate-300 flex items-center justify-between transition"
              >
                <span>{videoSeedImage ? 'Seed Frame Loaded' : 'Upload Seed Frame Image'}</span>
                <Upload className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {videoSeedImage && (
                <div className="mt-2 relative w-20 h-20 rounded border border-rose-800 overflow-hidden">
                  <img src={videoSeedImage} alt="Seed" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setVideoSeedImage(null)}
                    className="absolute top-0 right-0 bg-black/80 text-rose-400 text-[10px] px-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Video Aspect Ratio */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-bold">
                Output Video Aspect Ratio:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setVideoAspectRatio('16:9')}
                  className={`p-2 rounded-lg border text-left transition ${
                    videoAspectRatio === '16:9'
                      ? 'border-rose-500 bg-rose-950/50 text-rose-200'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <span className="font-bold block">16:9 Landscape</span>
                  <span className="text-[10px] text-slate-500">Desktop / YouTube</span>
                </button>
                <button
                  onClick={() => setVideoAspectRatio('9:16')}
                  className={`p-2 rounded-lg border text-left transition ${
                    videoAspectRatio === '9:16'
                      ? 'border-rose-500 bg-rose-950/50 text-rose-200'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <span className="font-bold block">9:16 Portrait</span>
                  <span className="text-[10px] text-slate-500">Shorts / Reels</span>
                </button>
              </div>
            </div>

            {/* Video Prompt */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-bold">
                Motion & Visual Description:
              </span>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe cinematic motion, camera panning, lighting shift, or dynamic sci-fi sequence..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none h-28"
              />
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo || (!videoPrompt.trim() && !videoSeedImage)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 via-indigo-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-rose-950/40"
            >
              {isGeneratingVideo ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-rose-300" />
                  <span>SYNTHESIZING VIDEO (OMNI)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>GENERATE VIDEO</span>
                </>
              )}
            </button>
          </div>

          {/* Video Preview Column */}
          <div className="flex-1 flex flex-col p-6 bg-black/70 overflow-y-auto items-center justify-center">
            {resultVideoUrl ? (
              <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
                <span className="text-xs text-rose-300 font-mono font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Synthesized Video Stream
                </span>
                <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                  <video src={resultVideoUrl} controls autoPlay loop className="w-full h-auto" />
                </div>
                <a
                  href={resultVideoUrl}
                  download="gemini_omni_video.mp4"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download MP4 Video</span>
                </a>
              </div>
            ) : videoStatusMsg ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-md text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-200">Video Processing Completed</h4>
                <p className="text-xs text-slate-400">{videoStatusMsg}</p>
              </div>
            ) : isGeneratingVideo ? (
              <div className="flex flex-col items-center gap-3 text-rose-400 animate-pulse">
                <RotateCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono">
                  Synthesizing neural video frames with Gemini Omni...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 gap-3">
                <Video className="w-16 h-16 opacity-30" />
                <span className="text-sm">
                  Configure prompt and aspect ratio to generate high-definition video
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
