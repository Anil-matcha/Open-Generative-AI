import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay, FaVolumeMute, FaVolumeUp } from "react-icons/fa";

const AudioPlayer = ({ src, className }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const setMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setMeta);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setMeta);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]); // Re-run effect if src changes

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = e.target.value;
    audio.currentTime = (value / 100) * audio.duration;
    setProgress(value);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds = 0) => {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const bars = [40, 70, 45, 90, 65, 30, 85, 50, 75, 40, 60, 95, 20, 55, 80, 35, 70, 45, 90, 60];

  return (
    <div className={className || "flex flex-col items-center justify-center p-4 w-full h-full bg-gradient-to-br from-[#121418] to-[#08090a] rounded-xl border border-white/5 relative group transition-all duration-500 select-none"}>
      <audio ref={audioRef} src={src} crossOrigin="anonymous" />
      <div 
        className="flex items-center justify-center gap-[2px] w-full h-12 mb-4 px-4 overflow-hidden"
        style={{ 
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
      >
        {bars.map((height, i) => (
          <div 
            key={i}
            className="w-1 rounded-full transition-all duration-300 ease-in-out"
            style={{ 
              height: isPlaying ? `${height}%` : '4px',
              backgroundColor: (i / bars.length) < (progress / 100) ? '#3b82f6' : '#2c3037',
              boxShadow: (i / bars.length) < (progress / 100) ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
              opacity: isPlaying ? 0.8 + Math.random() * 0.2 : 0.3,
              transform: isPlaying ? `scaleY(${0.8 + Math.random() * 0.4})` : 'scaleY(1)',
              transitionDelay: `${i * 20}ms`
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 w-full relative z-10">
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={toggleAudio}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-110 active:scale-95 group/play"
        >
          {isPlaying ? (
            <FaPause size={14} className="group-hover/play:scale-110 transition-transform" />
          ) : (
            <FaPlay size={14} className="translate-x-0.5 group-hover/play:scale-110 transition-transform" />
          )}
        </button>
        <div className="flex flex-col flex-grow gap-1.5 min-w-0">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress || 0}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer hover:h-2 transition-all seek-bar active:-translate-y-px"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress || 0}%, rgba(255, 255, 255, 0.1) ${progress || 0}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] text-gray-500 font-medium tracking-tight tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-tight tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 group/volume relative">
          <button 
            type="button"
            suppressHydrationWarning={true}
            onClick={toggleMute} 
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-full"
          >
            {isMuted || volume === 0 ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-4 opacity-0 group-hover/volume:opacity-100 pointer-events-none group-hover/volume:pointer-events-auto transition-all duration-300 translate-y-2 group-hover/volume:translate-y-0 z-30">
            <div className="bg-[#1a1b1e] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl flex flex-col items-center gap-2 h-24">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                vertical="true"
                value={volume} 
                onChange={handleVolumeChange}
                className="h-full w-1 accent-blue-500 cursor-pointer appearance-none bg-white/10 rounded-full"
                style={{
                  WebkitAppearance: 'slider-vertical',
                  appearance: 'slider-vertical',
                  writingMode: 'bt-lr'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

