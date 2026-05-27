"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateAudio, uploadFile } from "../muapi.js";
import { audioModels, getAudioModelById } from "../models.js";

// ---------------------------------------------------------------------------
// Upload button states
// ---------------------------------------------------------------------------
const UPLOAD_STATE = {
  IDLE: "idle",
  UPLOADING: "uploading",
  READY: "ready",
};

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const MusicIcon = ({ className = "text-[#22d3ee]" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// ---------------------------------------------------------------------------
// Single File Uploader Component
// ---------------------------------------------------------------------------
function AudioFileUploader({ label, value, onChange, apiKey }) {
  const [uploadState, setUploadState] = useState(value ? UPLOAD_STATE.READY : UPLOAD_STATE.IDLE);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(value ? value.split('/').pop().slice(-30) : "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setUploadState(UPLOAD_STATE.IDLE);
      setFileName("");
      setProgress(0);
    } else if (uploadState !== UPLOAD_STATE.READY) {
      setUploadState(UPLOAD_STATE.READY);
      setFileName(value.split('/').pop().slice(-30));
    }
  }, [value]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Audio file exceeds 20MB limit.");
      return;
    }

    setUploadState(UPLOAD_STATE.UPLOADING);
    setProgress(0);

    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setProgress(pct);
      });
      setFileName(file.name);
      setUploadState(UPLOAD_STATE.READY);
      onChange(url);
    } catch (err) {
      setUploadState(UPLOAD_STATE.IDLE);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setProgress(0);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          {label}
        </label>
        {uploadState === UPLOAD_STATE.READY && (
          <button
            type="button"
            onClick={clearFile}
            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider flex items-center gap-1.5"
          >
            <TrashIcon /> Clear
          </button>
        )}
      </div>

      <div 
        onClick={() => uploadState === UPLOAD_STATE.IDLE && fileInputRef.current?.click()}
        className={`relative border rounded p-4 transition-all duration-300 flex items-center gap-3.5 cursor-pointer ${
          uploadState === UPLOAD_STATE.READY 
            ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(34,211,238,0.05)]" 
            : "border-zinc-700 bg-zinc-900 hover:bg-zinc-850 hover:border-primary/50"
        }`}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="audio/*" 
          className="hidden" 
          onChange={handleUpload} 
        />

        {uploadState === UPLOAD_STATE.IDLE && (
          <>
            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-200 border border-zinc-700/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Upload audio track</div>
              <div className="text-[11px] text-zinc-300 font-medium mt-0.5">MP3, WAV, M4A up to 20MB</div>
            </div>
          </>
        )}

        {uploadState === UPLOAD_STATE.UPLOADING && (
          <div className="w-full flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-white/95 mb-1.5 font-bold">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {uploadState === UPLOAD_STATE.READY && (
          <>
            <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <MusicIcon className="text-primary" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{fileName}</div>
              <div className="text-[11px] text-primary font-bold mt-0.5">Ready to generate</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multiple File Uploader Component (for array fields like audios_list)
// ---------------------------------------------------------------------------
function AudioListUploader({ label, value = [], onChange, apiKey, maxItems = 2 }) {
  const handleItemChange = (index, url) => {
    const newItems = [...value];
    if (url) {
      newItems[index] = url;
    } else {
      newItems.splice(index, 1);
    }
    onChange(newItems.filter(Boolean));
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
        {label} (Max {maxItems})
      </label>
      <div className="space-y-3">
        {Array.from({ length: maxItems }).map((_, i) => (
          <AudioFileUploader
            key={i}
            label={`Track #${i + 1}`}
            value={value[i] || null}
            onChange={(url) => handleItemChange(i, url)}
            apiKey={apiKey}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Premium Custom Audio Player with Waveform Animation
// ---------------------------------------------------------------------------
function PremiumAudioPlayer({ url, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const visualizerIntervalRef = useRef(null);
  const [visualizerHeights, setVisualizerHeights] = useState(Array(18).fill(15));

  // Reset player when URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [url]);

  // Audio state event listeners
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Toggle playback
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  // Equalizer visualizer effect
  useEffect(() => {
    if (isPlaying) {
      visualizerIntervalRef.current = setInterval(() => {
        setVisualizerHeights(
          Array(18).fill(0).map(() => Math.floor(Math.random() * 32) + 6)
        );
      }, 100);
    } else {
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current);
      }
      setVisualizerHeights(Array(18).fill(12));
    }
    return () => {
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    };
  }, [isPlaying]);

  // Volume control
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Scrubbing
  const handleScrub = (e) => {
    if (!audioRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = Math.min(Math.max(pos * duration, 0), duration);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Helper formatting time
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const downloadAudio = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = title ? `${title.replace(/\s+/g, '_')}.mp3` : "generated_audio.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="w-full bg-zinc-900 border border-zinc-700/80 rounded p-6 shadow-3xl space-y-6 backdrop-blur-md">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onAudioEnded}
        preload="auto"
      />

      {/* Visualizer and Track Details */}
      <div className="flex flex-col items-center justify-center py-6 relative rounded bg-black/60 overflow-hidden border border-zinc-800">
        <div className="flex items-center gap-1.5 h-12 mb-4 justify-center">
          {visualizerHeights.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-primary to-[#a855f7] transition-all duration-100"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <div className="text-center px-4 max-w-full relative z-10">
          <span className="text-xs font-black text-primary uppercase tracking-[0.2em] block mb-1">
            Now Playing
          </span>
          <p className="text-white font-bold text-base truncate max-w-xs">{title || "Generated Track"}</p>
        </div>
      </div>

      {/* Controls & Progress bar */}
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-200 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          <div
            ref={progressBarRef}
            onClick={handleScrub}
            className="flex-1 h-2 bg-zinc-700 hover:bg-zinc-650 rounded-full cursor-pointer relative group transition-colors"
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-primary rounded-full group-hover:bg-primary/95 transition-all"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
            <div 
              className="absolute w-3.5 h-3.5 bg-white rounded-full -top-[3px] shadow-glow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 7px)` }}
            />
          </div>

          <span className="text-xs font-bold text-zinc-200 w-10 text-left">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          {/* Volume Control */}
          <div className="flex items-center gap-2 group/volume w-24">
            <button
              onClick={toggleMute}
              className="p-2 bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 rounded text-zinc-200 hover:text-white transition-all"
              title="Mute/Unmute"
              type="button"
            >
              {isMuted ? <VolumeMuteIcon /> : <VolumeIcon />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-primary hover:bg-zinc-600 transition-all opacity-0 group-hover/volume:opacity-100"
            />
          </div>

          {/* Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-primary hover:bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow"
            title={isPlaying ? "Pause" : "Play"}
            type="button"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* Download Button */}
          <button
            onClick={downloadAudio}
            className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-bold text-white flex items-center gap-2 hover:border-primary/45 transition-all"
            title="Download Audio"
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Audio Studio Component
// ---------------------------------------------------------------------------
export default function AudioStudio({
  apiKey,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  const PERSIST_KEY = "hg_audio_studio_persistent";

  // ── Mode & model state ──────────────────────────────────────────────────
  const [selectedModelId, setSelectedModelId] = useState(audioModels[0]?.id ?? "");
  const [params, setParams] = useState({});
  const [openDropdown, setOpenDropdown] = useState(false);
  const modelBtnRef = useRef(null);

  // ── Generation state ──────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [activeResultUrl, setActiveResultUrl] = useState(null);
  const [activeResultTitle, setActiveResultTitle] = useState("");
  const [view, setView] = useState("input"); // 'input' | 'result'

  // ── History state ────────────────────────────────────────────────────
  const [internalHistory, setInternalHistory] = useState([]);
  const history = historyItems ?? internalHistory;
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);

  const selectedModel = getAudioModelById(selectedModelId);

  // ── Initialize params when model changes ──────────────────────────────
  useEffect(() => {
    if (!selectedModel) return;
    const initial = {};
    Object.entries(selectedModel.inputs || {}).forEach(([key, schema]) => {
      // Don't overwrite parameters like vocal upload, list etc. if they are already in state
      if (params[key] !== undefined) {
        initial[key] = params[key];
      } else {
        initial[key] = schema.default !== undefined ? schema.default : "";
      }
    });
    setParams(initial);
  }, [selectedModelId]); // Only reset when model ID changes

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.params) setParams(data.params);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
        if (data.activeResultUrl) setActiveResultUrl(data.activeResultUrl);
        if (data.activeResultTitle) setActiveResultTitle(data.activeResultTitle);
        if (data.view) setView(data.view);
      }
    } catch (err) {
      console.warn("Failed to load AudioStudio persistence:", err);
    }
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          selectedModelId,
          params,
          internalHistory,
          activeResultUrl,
          activeResultTitle,
          view,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save AudioStudio persistence:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedModelId, params, internalHistory, activeResultUrl, activeResultTitle, view]);

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const audioFiles = droppedFiles.filter(f => f.type.startsWith('audio/'));
      if (audioFiles.length > 0 && selectedModel) {
        // Find the first audio input field in the current model
        const firstAudioField = Object.entries(selectedModel.inputs || {}).find(
          ([_, schema]) => schema.field === 'audio'
        );
        const firstAudioListField = Object.entries(selectedModel.inputs || {}).find(
          ([_, schema]) => schema.field === 'audios_list'
        );

        if (firstAudioField) {
          const [key] = firstAudioField;
          // Trigger file upload helper
          uploadFile(apiKey, audioFiles[0], () => {})
            .then(url => {
              setParams(prev => ({ ...prev, [key]: url }));
            })
            .catch(err => alert(`Failed to upload dropped file: ${err.message}`));
        } else if (firstAudioListField) {
          const [key] = firstAudioListField;
          uploadFile(apiKey, audioFiles[0], () => {})
            .then(url => {
              setParams(prev => {
                const currentList = Array.isArray(prev[key]) ? [...prev[key]] : [];
                if (currentList.length < 2) currentList.push(url);
                return { ...prev, [key]: currentList };
              });
            })
            .catch(err => alert(`Failed to upload dropped file: ${err.message}`));
        }
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, selectedModel, apiKey]);

  // ── History helpers ─────────────────────────────────────────────────────
  const addToInternalHistory = useCallback((entry) => {
    setInternalHistory((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const handleSelectHistory = (entry, index) => {
    setActiveResultUrl(entry.url);
    setActiveResultTitle(entry.title || entry.prompt || "Generated Track");
    setActiveHistoryIdx(index);
    setView("result");
  };

  const handleGenerate = async () => {
    if (!selectedModel) return;

    // Check required fields
    if (selectedModel.required) {
      for (const field of selectedModel.required) {
        if (!params[field] || (Array.isArray(params[field]) && params[field].length === 0)) {
          alert(`Please complete the required field: ${selectedModel.inputs?.[field]?.title || field}`);
          return;
        }
      }
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const audioParams = {
        ...params,
        _modelId: selectedModelId,
      };

      // Call generateAudio
      const res = await generateAudio(apiKey, audioParams);

      if (!res?.url) {
        throw new Error("No audio URL returned by the API.");
      }

      const title = params.title || params.prompt || `Generated ${selectedModel.name}`;
      const entry = {
        id: res.id || Date.now().toString(),
        url: res.url,
        title,
        prompt: params.prompt || "",
        model: selectedModelId,
        timestamp: new Date().toISOString(),
      };

      if (!historyItems) addToInternalHistory(entry);

      setActiveResultUrl(res.url);
      setActiveResultTitle(title);
      setView("result");
      setActiveHistoryIdx(0);

      if (onGenerationComplete) {
        onGenerationComplete({
          url: res.url,
          model: selectedModelId,
          prompt: params.prompt,
          type: "audio",
        });
      }
    } catch (e) {
      console.error("[AudioStudio]", e);
      setGenerateError(e.message?.slice(0, 100) ?? "Audio generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNew = () => {
    setView("input");
    setActiveResultUrl(null);
    setActiveResultTitle("");
    // Keep parameters to avoid having to reupload files if they wish to adjust details
  };

  return (
    <div className="w-full h-full flex bg-app-bg text-white overflow-hidden relative">
      
      {/* ─── LEFT CONFIGURATION SIDEBAR ─── */}
      <div className="w-full lg:w-[400px] border-r border-zinc-900 flex flex-col bg-zinc-950/40 backdrop-blur-lg flex-shrink-0 z-30">
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 pb-24">
          
          {/* Model Selector */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Audio Model
            </label>
            <button
              ref={modelBtnRef}
              type="button"
              onClick={() => setOpenDropdown(!openDropdown)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-3.5 text-sm text-left font-bold text-white flex items-center justify-between hover:bg-zinc-850 hover:border-primary/50 transition-all"
            >
              <span>{selectedModel?.name ?? "Select Model"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 ${openDropdown ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {openDropdown && (
              <div className="absolute left-0 right-0 mt-2 z-50 bg-[#161618] border border-zinc-700 rounded shadow-3xl max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                {audioModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelId(model.id);
                      setOpenDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded text-xs font-bold transition-all flex flex-col gap-1.5 border ${
                      model.id === selectedModelId ? "text-primary bg-primary/10 border-primary/20" : "text-zinc-200 border-transparent hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span>{model.name}</span>
                    {model.description && (
                      <span className="text-[10px] text-zinc-300 truncate max-w-[320px] font-normal">
                        {model.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Description */}
          {selectedModel?.description && (
            <div className="">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1.5">Description</span>
              <p className="text-zinc-400 text-xs leading-relaxed font-semibold">{selectedModel.description}</p>
            </div>
          )}

          {/* Dynamic Configuration Form */}
          <div className="space-y-5">
            {selectedModel && Object.entries(selectedModel.inputs || {}).map(([key, schema]) => {
              // Skip model switcher itself (if it's in schemas)
              if (key === 'model') return null;
              // Audio URL file upload (single)
              if (schema.type === "string" && schema.field === "audio") {
                return (
                  <AudioFileUploader
                    key={key}
                    label={schema.title || key}
                    value={params[key] || ""}
                    onChange={(url) => setParams(prev => ({ ...prev, [key]: url }))}
                    apiKey={apiKey}
                  />
                );
              }
              // Audio URLs list file upload (multiple)
              if (schema.type === "array" && schema.field === "audios_list") {
                return (
                  <AudioListUploader
                    key={key}
                    label={schema.title || key}
                    value={params[key] || []}
                    onChange={(urls) => setParams(prev => ({ ...prev, [key]: urls }))}
                    apiKey={apiKey}
                    maxItems={schema.maxItems || 2}
                  />
                );
              }
              // Boolean Toggles
              if (schema.type === "boolean") {
                return (
                  <div key={key} className="flex items-center justify-between bg-zinc-900 border border-zinc-700/80 rounded p-4 transition-all hover:border-zinc-600">
                    <div className="flex-1 pr-4">
                      <span className="block text-xs font-bold text-white tracking-tight">
                        {schema.title || key}
                      </span>
                      {schema.description && (
                        <span className="block text-[11px] text-zinc-300 leading-normal mt-1">
                          {schema.description}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setParams(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0 ${
                        params[key] ? "bg-primary" : "bg-zinc-800"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black shadow-md transform transition-all duration-300 ${
                        params[key] ? "translate-x-5 bg-white" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                );
              }
              // Enum Dropdowns
              if (schema.enum) {
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      {schema.title || key}
                    </label>
                    <select
                      value={params[key] || ""}
                      onChange={(e) => setParams(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      {schema.enum.map((opt) => (
                        <option key={opt} value={opt} className="bg-zinc-900 text-white text-xs">
                          {opt}
                        </option>
                      ))}
                    </select>
                    {schema.description && (
                      <span className="block text-[11px] text-zinc-300 leading-normal">
                        {schema.description}
                      </span>
                    )}
                  </div>
                );
              }

              // Number Sliders & Ranges
              const isNumber = schema.type === "int" || schema.type === "integer" || schema.type === "float" || schema.type === "number";
              const hasMinMax = schema.minValue !== undefined && schema.maxValue !== undefined;
              if (isNumber && hasMinMax) {
                const step = schema.step || (schema.type === "float" ? 0.05 : 1);
                return (
                  <div key={key} className="space-y-3 bg-zinc-900 border border-zinc-700/80 rounded p-4 transition-all hover:border-zinc-600">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white tracking-tight">{schema.title || key}</span>
                      <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{params[key] !== undefined ? params[key] : schema.default}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-300 font-medium w-6 text-right">{schema.minValue}</span>
                      <input
                        type="range"
                        min={schema.minValue}
                        max={schema.maxValue}
                        step={step}
                        value={params[key] !== undefined ? params[key] : (schema.default || 0)}
                        onChange={(e) => setParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                        className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary hover:bg-zinc-700 transition-all"
                      />
                      <span className="text-[10px] text-zinc-300 font-medium w-6 text-left">{schema.maxValue}</span>
                    </div>
                    {schema.description && (
                      <span className="block text-[11px] text-zinc-300 leading-normal">
                        {schema.description}
                      </span>
                    )}
                  </div>
                );
              }

              // Prompt / Textarea Input
              if (key === "prompt") {
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      {schema.title || "Lyrics / Prompt"}
                    </label>
                    <textarea
                      value={params[key] || ""}
                      onChange={(e) => setParams(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-primary/85 rounded p-3 text-xs text-white placeholder:text-zinc-400 focus:outline-none transition-all min-h-[100px] resize-none leading-relaxed shadow-inner"
                      placeholder={schema.description || "Enter what you want generated..."}
                    />
                    {schema.examples && Array.isArray(schema.examples) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {schema.examples.map((ex, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setParams(prev => ({ ...prev, [key]: ex }))}
                            className="text-[11px] px-3 py-1 bg-zinc-800/80 border border-zinc-700 hover:bg-primary/20 hover:border-primary/45 hover:text-white rounded-full transition-all font-semibold text-zinc-100"
                          >
                            "{ex.slice(0, 35)}..."
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Standard Text / Input fields
              return (
                <div key={key} className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    {schema.title || key}
                  </label>
                  <input
                    type={isNumber ? "number" : "text"}
                    value={params[key] !== undefined ? params[key] : ""}
                    placeholder={schema.placeholder || schema.description || `Enter ${key}...`}
                    onChange={(e) => {
                      const val = isNumber ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value;
                      setParams(prev => ({ ...prev, [key]: val }));
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-primary/80 rounded px-4 py-3.5 text-xs text-white placeholder:text-zinc-400 focus:outline-none transition-all shadow-inner"
                  />
                  {schema.description && (
                    <span className="block text-[11px] text-zinc-300 leading-normal">
                      {schema.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Dynamic Cost & Generate Section */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl absolute bottom-0 left-0 w-full lg:w-[400px] z-40">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedModel}
            className="w-full py-4 bg-primary text-black text-base font-bold rounded hover:bg-white transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale shadow-glow flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Generating Audio...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                <span>Generate Track</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* ─── RIGHT CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-20">
        
        {/* Main Display panel */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 flex flex-col justify-between">
          
          <div className="flex-1 flex items-center justify-center min-h-[400px] mb-8">
            
            {/* 1. Error Display */}
            {generateError && (
              <div className="w-full max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded flex flex-col items-center gap-4 animate-shake">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 border border-red-500/30 shadow-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-xs font-black text-red-500 uppercase tracking-widest block mb-1">
                    Generation Error
                  </span>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    {generateError}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Generating / Loading View */}
            {isGenerating && !generateError && (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative">
                  <div className="w-24 h-24 border-[3px] border-zinc-800 border-t-primary rounded-full animate-spin shadow-glow" />
                  <div className="absolute inset-0 flex items-center justify-center text-primary">
                    <MusicIcon className="animate-pulse text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-xs font-black text-primary uppercase tracking-[0.3em] animate-pulse">
                    Generating Soundtrack
                  </div>
                  <div className="text-sm text-zinc-200 font-bold">
                    Rendering audio waveforms and vocals...
                  </div>
                </div>
              </div>
            )}

            {/* 3. Empty State (no audio, not loading, no error) */}
            {view === "input" && !isGenerating && !generateError && (
              <div className="flex flex-col items-center gap-6 max-w-md text-center p-8 bg-zinc-900/40 border border-zinc-800 rounded backdrop-blur-sm relative group animate-fade-in-up">
                {/* Glow behind the icon */}
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-25 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-705 rounded flex items-center justify-center shadow-inner relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <MusicIcon className="text-primary w-8 h-8 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-white font-black text-xl mb-3 tracking-tight">Audio Studio</h3>
                  <p className="text-sm text-zinc-200 font-medium leading-relaxed px-4">
                    Choose an AI music model, voice cloner, or sound generator. Modify variables on the left and craft your next high-fidelity track.
                  </p>
                </div>
              </div>
            )}

            {/* 4. Active Result Player Display */}
            {view === "result" && activeResultUrl && !isGenerating && !generateError && (
              <div className="w-full max-w-2xl animate-fade-in-up space-y-4">
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={handleNew}
                    className="text-xs font-bold text-zinc-200 hover:text-primary flex items-center gap-2 transition-all bg-zinc-905 border border-zinc-700 hover:border-primary/30 px-4 py-2 rounded-full"
                    type="button"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>New Generation</span>
                  </button>
                  <span className="text-[11px] font-bold text-green-400 px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Success
                  </span>
                </div>
                <PremiumAudioPlayer url={activeResultUrl} title={activeResultTitle} />
              </div>
            )}

          </div>

          {/* ─── BOTTOM HISTORY FOOTER ─── */}
          {history.length > 0 && (
            <div className="border-t border-zinc-900 pt-6 w-full animate-fade-in-up">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 px-1">
                Generation History ({history.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {history.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    onClick={() => handleSelectHistory(entry, idx)}
                    className={`p-3.5 bg-zinc-900 border rounded cursor-pointer transition-all flex flex-col justify-between h-28 border-zinc-700/80 hover:bg-zinc-850 hover:border-zinc-500 ${
                      activeResultUrl === entry.url && view === "result"
                        ? "border-primary bg-primary/5 shadow-glow"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                        activeResultUrl === entry.url && view === "result" ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-200"
                      }`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
                        {entry.model ? entry.model.split('-').slice(0, 2).join(' ') : 'Audio'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-white line-clamp-2 leading-tight">
                      {entry.title || entry.prompt || "Untitled Audio"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
