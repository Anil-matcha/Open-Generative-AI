import React, { useState, useRef, useEffect } from "react";
import { IoPlay, IoPause, IoVolumeHigh, IoVolumeMute, IoExpand, IoContract } from "react-icons/io5";
import { toast } from "react-hot-toast";

const VideoPlayer = ({ 
  src, 
  poster, 
  autoPlay = true, 
  muted = true, 
  loop = true, 
  className = "w-full h-full object-contain",
  accentColor = "#f97316"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleToggleFullscreen = (e) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative group/video w-full h-full bg-black/90 overflow-hidden flex items-center justify-center ${isFullscreen ? '' : 'rounded-b-2xl'}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        className={`${className} cursor-pointer`}
      />

      {/* Center Play Icon Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover/video:opacity-100 transition-opacity duration-300"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl transform group-hover/video:scale-110 transition-transform pointer-events-auto cursor-pointer">
            <IoPlay size={32} className="ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 rounded-b-xl flex flex-col gap-2 z-20">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          step="0.01"
          onChange={(e) => {
            const time = parseFloat(e.target.value);
            videoRef.current.currentTime = time;
            setCurrentTime(time);
          }}
          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all seek-bar"
          style={{
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.2) 100%)`
          }}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={togglePlay}
              className="text-white/90 hover:text-white transition-colors"
            >
              {isPlaying ? <IoPause size={18} /> : <IoPlay size={18} />}
            </button>
            
            <div className="flex items-center gap-2 group/volume">
              <button
                type="button"
                suppressHydrationWarning={true}
                onClick={toggleMute}
                className="text-white/90 hover:text-white transition-colors"
              >
                {isMuted ? <IoVolumeMute size={18} /> : <IoVolumeHigh size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  videoRef.current.volume = val;
                  if (val > 0) setIsMuted(false);
                }}
                className="w-0 group-hover/volume:w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white transition-all overflow-hidden"
              />
            </div>
            
            <span className="text-[10px] text-white/70 font-medium tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            suppressHydrationWarning={true}
            onClick={handleToggleFullscreen}
            className="text-white/90 hover:text-white transition-colors"
          >
            {isFullscreen ? <IoContract size={18} /> : <IoExpand size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
