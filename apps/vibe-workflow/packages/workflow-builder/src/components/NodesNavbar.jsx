import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { AiOutlineAudio, AiOutlineSearch, AiOutlineCloudUpload } from "react-icons/ai";
import { FaAngleLeft, FaAngleRight, FaLayerGroup } from "react-icons/fa6";
import { IoImageOutline, IoVideocamOutline, IoAddCircleOutline } from "react-icons/io5";
import { TfiText } from "react-icons/tfi";
import { MdAutoFixHigh, MdCrop, MdOutlineImage } from "react-icons/md";
import { RiImageAiLine, RiVideoOnAiLine } from "react-icons/ri";
import {
  imageModels,
  videoModels,
  textModels,
  audioModels,
  concatModels,
  videoCombinerModels
} from "./utility";
import { TbArrowMerge } from "react-icons/tb";
import { RiInputMethodLine } from "react-icons/ri";
import { LuUpload } from "react-icons/lu";

const formatName = (id) => id.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const SPECIAL_MODEL_NAMES = {
  "text-passthrough": "Input Text",
  "image-passthrough": "Input Image",
  "video-passthrough": "Input Video",
  "audio-passthrough": "Input Audio",
};

const NodesNavbar = ({ addNode, apiNodeModels, filterNodeTypes = null, nodeSchemas = {} }) => {
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  const getNodeTypeFromSubmenuId = (id) => {
    if (id === 'inputs') return ['textNode', 'imageNode', 'videoNode', 'audioNode'];
    if (id.includes('text-llms') || id === 'text-llms') return 'textNode';
    if (id === 'concat' || id === 'text-utils' || id === 'utilities') return ['concatNode', 'vidConcatNode'];
    if (id.includes('image')) return 'imageNode';
    if (id.includes('video')) return 'videoNode';
    if (id.includes('audio')) return 'audioNode';
    if (id === 'api-models') return 'apiNode';
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveSubMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasSearch = searchQuery.trim().length > 0;

  const getCategorizedModels = () => {
    const categories = nodeSchemas?.categories || {};
    
    const mapModels = (modelsMap) => 
      modelsMap ? Object.entries(modelsMap).map(([id, model]) => ({
        ...model,
        id,
        name: SPECIAL_MODEL_NAMES[id] || formatName(id)
      })) : [];

    const imageModels = mapModels(categories.image?.models);
    const videoModels = mapModels(categories.video?.models);
    const textModels = mapModels(categories.text?.models);
    const audioModels = mapModels(categories.audio?.models);
    const apiModels = mapModels(categories.api?.models);
    const rawUtilityModels = mapModels(categories.utility?.models);
    const utilityModels = [...rawUtilityModels];

    // Add local models if they are not in the backend response
    [...concatModels, ...videoCombinerModels].forEach(m => {
      if (!utilityModels.find(um => um.id === m.id)) {
        utilityModels.push(m);
      }
    });

    const isPassthrough = (m) => m?.id && m.id.includes("passthrough");

    const inputsModels = [
      ...textModels.filter(isPassthrough).map(m => ({ ...m, type: 'textNode' })),
      ...imageModels.filter(isPassthrough).map(m => ({ ...m, type: 'imageNode' })),
      ...videoModels.filter(isPassthrough).map(m => ({ ...m, type: 'videoNode' })),
      ...audioModels.filter(isPassthrough).map(m => ({ ...m, type: 'audioNode' })),
    ];

    const generateImageModels = imageModels.filter(m => m?.id && !isPassthrough(m) && !m.id.includes("edit") && !m.id.includes("reference") && !m.id.includes("image-to-image"));
    const editImageModels = imageModels.filter(m => m?.id && !isPassthrough(m) && (m.id.includes("edit") || m.id.includes("reference") || m.id.includes("image-to-image")));
    const upscaleImageModels = imageModels.filter(m => m?.id && !isPassthrough(m) && m.id.includes("upscale"));
    const generateVideoModels = videoModels.filter(m => m?.id && !isPassthrough(m) && !m.id.includes("edit"));
    const editVideoModels = videoModels.filter(m => m?.id && !isPassthrough(m) && m.id.includes("edit"));
    const textModelsFiltered = textModels.filter(m => !isPassthrough(m));
    const audioModelsFiltered = audioModels.filter(m => !isPassthrough(m));

    return {
      inputs: inputsModels,
      generateImage: generateImageModels,
      editImage: editImageModels,
      upscaleImage: upscaleImageModels,
      generateVideo: generateVideoModels,
      editVideo: editVideoModels,
      audio: audioModelsFiltered,
      text: textModelsFiltered,
      textUtils: utilityModels,
      utilities: utilityModels,
      api: apiNodeModels,
    };
  };

  const categorizedModels = getCategorizedModels();

  const handleAddNode = (type, model) => {
    addNode(type, null, { selectedModel: model });
    setActiveSubMenu(null);
    setSearchQuery("");
  };

  const menuStructure = [
    {
      label: "Inputs",
      items: [
        { label: "Input Models", icon: <LuUpload />, hasSubmenu: true, id: "inputs" },
      ]
    },
    {
      label: "Text",
      items: [
        { label: "Text (LLMs)", icon: <TfiText />, hasSubmenu: true, id: "text-llms" },
        { label: "Utilities", icon: <TbArrowMerge className="rotate-90" />, hasSubmenu: true, id: "utilities" },
      ]
    },
    {
      label: "Image",
      items: [
        { label: "Generate Image", icon: <IoImageOutline />, hasSubmenu: true, id: "generate-image" },
        { label: "Edit Image", icon: <RiImageAiLine />, hasSubmenu: true, id: "edit-image" },
        // { label: "Upscale Image", icon: <MdOutlineImage />, hasSubmenu: true, id: "upscale-image" },
        // { label: "Image Utilities", icon: <MdCrop />, hasSubmenu: true, id: "image-utils" },
      ]
    },
    {
      label: "Video",
      items: [
        { label: "Generate Video", icon: <IoVideocamOutline />, hasSubmenu: true, id: "generate-video" },
        { label: "Edit Video", icon: <RiVideoOnAiLine />, hasSubmenu: true, id: "edit-video" },
      ]
    },
    {
      label: "Audio",
      items: [
        { label: "Generate Audio", icon: <AiOutlineAudio />, hasSubmenu: true, id: "generate-audio" },
      ]
    },
    {
      label: "API Models",
      items: [
        { label: "Api Node", icon: <RiInputMethodLine />, hasSubmenu: true, id: "api-models" },
      ]
    }
  ];

  const getSubmenuItems = (id) => {
    switch (id) {
      case "inputs": return categorizedModels.inputs.map(m => ({ label: m.name, model: m, type: m.type }));
      case "text-utils": 
      case "utilities": 
        return categorizedModels.utilities.map(m => ({ 
          label: m.name, 
          model: m, 
          type: m.id === "video-combiner" ? "vidConcatNode" : "concatNode" 
        }));
      case "generate-image": return categorizedModels.generateImage.map(m => ({ label: m.name, model: m, type: "imageNode" }));
      case "edit-image": return categorizedModels.editImage.map(m => ({ label: m.name, model: m, type: "imageNode" }));
      case "upscale-image": return categorizedModels.upscaleImage.map(m => ({ label: m.name, model: m, type: "imageNode" })); // May be empty
      case "text-llms": return categorizedModels.text.map(m => ({ label: m.name, model: m, type: "textNode" }));
      case "generate-video": return categorizedModels.generateVideo.map(m => ({ label: m.name, model: m, type: "videoNode" }));
      case "edit-video": return categorizedModels.editVideo.map(m => ({ label: m.name, model: m, type: "videoNode" }));
      case "generate-audio": return categorizedModels.audio.map(m => ({ label: m.name, model: m, type: "audioNode" }));
      case "api-models": return categorizedModels.api.map(m => ({ label: m.name, model: m, type: "apiNode" }));
      default: return [];
    }
  };

  const renderSearchResults = () => {
    const { 
      inputs,
      generateImage, editImage, upscaleImage, 
      generateVideo, editVideo, 
      text, audio, textUtils, api 
    } = categorizedModels;

    const allModels = [
      ...inputs.map(m => ({ ...m, type: m.type })),
      ...generateImage.map(m => ({ ...m, type: "imageNode" })),
      ...editImage.map(m => ({ ...m, type: "imageNode" })),
      ...upscaleImage.map(m => ({ ...m, type: "imageNode" })),
      ...generateVideo.map(m => ({ ...m, type: "videoNode" })),
      ...editVideo.map(m => ({ ...m, type: "videoNode" })),
      ...text.map(m => ({ ...m, type: "textNode" })),
      ...audio.map(m => ({ ...m, type: "audioNode" })),
      ...textUtils.map(m => ({ ...m, type: m.id === "video-combiner" ? "vidConcatNode" : "concatNode" })),
      ...apiNodeModels.map(m => ({ ...m, type: "apiNode" })),
    ];

    const filtered = allModels.filter(m => m && m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="flex flex-col gap-1 w-full max-h-96 overflow-y-auto">
        {filtered.length > 0 ? filtered.map((item, idx) => (
          <button
            type="button"
            suppressHydrationWarning={true}
            key={idx}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-[#2c3037] rounded cursor-pointer transition text-left"
            onClick={() => handleAddNode(item.type, item)}
          >
            {item.type === "imageNode" && <IoImageOutline />}
            {item.type === "videoNode" && <IoVideocamOutline />}
            {item.type === "textNode" && <TfiText />}
            {item.type === "audioNode" && <AiOutlineAudio />}
            {item.type === "concatNode" && <TbArrowMerge className="rotate-90" />}
            {item.type === "apiNode" && <RiInputMethodLine />}
            <span>{item.name}</span>
          </button>
        )) : (
          <div className="px-3 py-2 text-xs text-gray-500">No results found</div>
        )}
      </div>
    );
  };

  const anchorRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({ opacity: 0 });

  useLayoutEffect(() => {
    if (anchorRef.current && menuRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const padding = 12;

      let left = anchorRect.left;
      let top = anchorRect.top;
      let maxHeight = "";

      if (left + menuRect.width > windowWidth - padding) {
         left = windowWidth - menuRect.width - padding;
      }

      if (left < padding) {
        left = padding;
      }

      if (top + menuRect.height > windowHeight - padding) {
         const overflowY = (top + menuRect.height) - (windowHeight - padding);
         top = top - overflowY;
      }
      
      if (top < padding) {
        top = padding;
        maxHeight = `${windowHeight - (padding * 2)}px`;
      }

      setMenuStyle({ 
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: maxHeight,
        opacity: 1
      });
    }
  }, [searchQuery]);

  const filteredMenuStructure = filterNodeTypes 
    ? menuStructure.map(section => ({
        ...section,
        items: section.items.filter(item => {
          const nodeType = getNodeTypeFromSubmenuId(item.id);
          if (Array.isArray(nodeType)) {
            return nodeType.some(type => filterNodeTypes.includes(type));
          }
          return filterNodeTypes.includes(nodeType);
        })
      })).filter(section => section.items.length > 0)
    : menuStructure;

  return (
    <div ref={anchorRef} className="flex flex-col gap-2 relative z-50">
      <div 
        ref={menuRef}
        className="flex flex-col gap-2 bg-[#151618] border border-gray-700 p-2 rounded-xl w-60 shadow-xl"
        style={menuStyle}
      >
        <div className="flex items-center relative w-full pl-2 bg-[#1c1e21] border border-gray-600 rounded-lg shrink-0">
          <AiOutlineSearch className="text-gray-400" />
          <input
            type="search"
            placeholder="Search nodes or models"
            className="w-full h-full py-2 px-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {!hasSearch ? (
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-0">
            {filteredMenuStructure.map((section, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <h3 className="text-[10px] text-gray-500 text-left px-2 font-medium sticky top-0 bg-[#151618] z-10">{section.label}</h3>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer group transition-colors relative ${activeSubMenu === item.id ? "bg-[#2c3037] text-white" : "text-gray-300 hover:bg-[#212326] hover:text-white"}`}
                      onMouseEnter={() => {
                        if (item.hasSubmenu) {
                          setActiveSubMenu(item.id);
                        } else {
                          setActiveSubMenu(null);
                        }
                      }}
                      onClick={() => {
                        if (item.hasSubmenu) {
                          setActiveSubMenu(item.id);
                        } else if (item.action) {
                          item.action();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 group-hover:text-white">{item.icon}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.shortcut && <span className="text-[10px] text-gray-600">{item.shortcut}</span>}
                        {item.hasSubmenu && <FaAngleRight size={10} className="text-gray-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderSearchResults()
        )}
        {activeSubMenu && !hasSearch && (
          <Submenu
            activeSubMenu={activeSubMenu}
            menuStructure={menuStructure}
            getSubmenuItems={getSubmenuItems}
            handleAddNode={handleAddNode}
            parentRef={menuRef}
            onBack={() => setActiveSubMenu(null)}
          />
        )}
      </div>
    </div>
  );
};

const Submenu = ({ activeSubMenu, menuStructure, getSubmenuItems, handleAddNode, parentRef, onBack }) => {
  const [position, setPosition] = useState({ side: "right", top: 0 });
  const submenuRef = useRef(null);

  useLayoutEffect(() => {
    if (parentRef.current && submenuRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const submenuRect = submenuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newSide = "right";

      if (windowWidth < 640) {
        newSide = "overlay";
      } else {
        const spaceRight = windowWidth - parentRect.right;
        if (spaceRight < 260) {
          newSide = "left";
        }
      }

      let newTop = 0;

      if (newSide !== "overlay") {
        const projectedBottom = parentRect.top + submenuRect.height;
        if (projectedBottom > windowHeight) {
          const overlap = projectedBottom - windowHeight;
          newTop = -overlap - 10;
        }
      }

      setPosition({ side: newSide, top: newTop });
    }
  }, [activeSubMenu, parentRef]);

  const getOverlayClass = () => {
    if (position.side === "overlay") return "left-0 top-0 h-full w-full";
    if (position.side === "right") return "left-full ml-2";
    return "right-full mr-2";
  };

  const getLabelIcon = (label) => {
    switch (label) {
      case "Input Models":
        return <LuUpload />;
      case "Text (LLMs)":
        return <TfiText />;
      case "Text Utilities":
      case "Utilities":
        return <TbArrowMerge className="rotate-90" />;
      case "Generate Image":
        return <IoImageOutline />;
      case "Edit Image":
        return <RiImageAiLine />;
      case "Upscale Image":
        return <MdCrop />;
      case "Image Utilities":
        return <MdAutoFixHigh />;
      case "Generate Video":
        return <IoVideocamOutline />;
      case "Edit Video":
        return <RiVideoOnAiLine />;
      case "Upscale Video":
        return <MdCrop />;
      case "Generate Audio":
        return <AiOutlineAudio />;
      case "Api Node":
        return <RiInputMethodLine />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={submenuRef}
      style={{ top: position.side === "overlay" ? 0 : `${position.top}px` }}
      className={`absolute flex flex-col gap-2 bg-[#151618] border border-gray-700 p-2 rounded-xl w-60 shadow-xl overflow-hidden z-50 ${position.side === "overlay" ? "h-full" : "h-fit max-h-[80vh]"} ${getOverlayClass()}`}
    >
      <div
        className="flex items-center gap-2 text-[10px] text-gray-400 px-2 py-2 font-medium border-b border-gray-800 cursor-pointer hover:text-white transition-colors"
        onClick={() => position.side === "overlay" && onBack()}
      >
        {position.side === "overlay" && <FaAngleLeft />}
        {menuStructure.flatMap(s => s.items).find(i => i.id === activeSubMenu)?.label}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
        {getSubmenuItems(activeSubMenu).length > 0 ? (
          getSubmenuItems(activeSubMenu).map((item, idx) => (
            <button
              type="button"
              suppressHydrationWarning={true}
              key={idx}
              className="flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:bg-[#2c3037] hover:text-white rounded-lg cursor-pointer transition text-left"
              onClick={() => handleAddNode(item.type, item.model)}
            >
              <span className="text-gray-400 group-hover:text-white text-sm">
                {getLabelIcon(menuStructure.flatMap(s => s.items).find(i => i.id === activeSubMenu)?.label)}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))
        ) : (
          <div className="px-2 py-4 text-xs text-gray-500 text-center">No items available</div>
        )}
      </div>
    </div>
  );
};

export default NodesNavbar;
