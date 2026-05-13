import React, { useState, useRef, useEffect } from "react";
import { BsThreeDots } from "react-icons/bs";
import { IoDuplicateOutline, IoTrashOutline } from "react-icons/io5";
import { MdOutlineFileDownload } from "react-icons/md";
import { HiOutlinePhotograph } from "react-icons/hi";
import { downloadFile } from "./utility";

const NodeOptionsMenu = ({ 
  nodeId, 
  onDuplicate, 
  onDelete, 
  downloadUrl, 
  onSetThumbnail, 
  showThumbnailOption 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        suppressHydrationWarning={true}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all outline-none"
      >
        <BsThreeDots size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 whitespace-nowrap bg-[#1b1e23]/95 backdrop-blur-xl border border-white/10 rounded-md shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
          <button
            type="button"
            suppressHydrationWarning={true}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(nodeId);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
          >
            <IoDuplicateOutline size={14} className="text-blue-400" />
            <span>Duplicate</span>
          </button>

          {downloadUrl && (
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(downloadUrl, `${nodeId}_output`);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
            >
              <MdOutlineFileDownload size={14} className="text-emerald-400" />
              <span>Download</span>
            </button>
          )}

          {showThumbnailOption && (
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={(e) => {
                e.stopPropagation();
                if (onSetThumbnail) onSetThumbnail();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
            >
              <HiOutlinePhotograph size={14} className="text-purple-400" />
              <span>Set Thumbnail</span>
            </button>
          )}

          <button
            type="button"
            suppressHydrationWarning={true}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <IoTrashOutline size={14} />
            <span>Delete Node {nodeId}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NodeOptionsMenu;
