import { useState } from 'react';
import PersonalizerDialog from './PersonalizerDialog';

export default function GlobalPersonalizerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 group"
        aria-label="Open AI Personalizer"
        data-tooltip="AI Personalizer — Create personalized content for any video or image project"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-left">
          <span className="text-xs font-medium text-white block mb-1">AI Personalizer</span>
          <span className="text-[10px] text-gray-400 leading-relaxed block">Scan public profiles and generate personalized content for any video or image project.</span>
        </span>
      </button>

      {isOpen && (
        <PersonalizerDialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          appId="ai-video-agency"
        />
      )}
    </>
  );
}
