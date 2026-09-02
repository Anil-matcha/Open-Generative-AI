"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  decomposeLayers,
  uploadFile,
  generateI2I,
  upscaleImage,
  removeBackground,
  expandImage,
} from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";
import en from "../messages/en/layersStudio.json";
import zh from "../messages/zh/layersStudio.json";
import { resolveCopy } from "../i18nUtils";

// Upscale Models Definition from schema_data.json
const UPSCALE_MODELS = [
  {
    id: "topaz-image-upscale",
    name: "Topaz",
    subtitle: "The default model for general-purpose...",
    cost: "1.0",
  },
  {
    id: "seedvr2-image-upscale",
    name: "SeedVR2",
    subtitle: "Diffusion-transformer super-resolution (up to 8K)",
    cost: "0.02",
  },
  {
    id: "ai-image-upscaler",
    name: "AI Upscaler",
    subtitle: "Fast 1-click automatic super-resolution",
    cost: "1.0",
  },
];

// Sample initial image & decomposed layers for demonstration (Seedream Wild Beauty via CDN)
const DEFAULT_SAMPLE_IMAGE =
  "https://cdn.muapi.ai/assets/1786019968051_cKRYLHHu.png";

const DEFAULT_SAMPLE_LAYERS = [
  "https://cdn.muapi.ai/assets/1786021161819_iOe80bNR.webp",
  "https://cdn.muapi.ai/assets/1786020452731_mB4m6NFR.webp",
  "https://cdn.muapi.ai/assets/1786021169234_iyVccSAA.webp",
  "https://cdn.muapi.ai/assets/1786021154170_Dx9snemT.webp",
  "https://cdn.muapi.ai/assets/1786021150882_p9lgz4lY.webp",
];

// Preset colors for Marker & Shapes tool
const PRESET_COLORS = [
  "#ffffff", // White
  "#22c55e", // Green
  "#eab308", // Yellow
  "#ef4444", // Red
  "#14b8a6", // Turquoise
  "#38bdf8", // Sky Blue
  "#ec4899", // Pink
  "#000000", // Black
];

const DEFAULT_COLOR_GRADING = {
  colorCorrect: {
    temp: 0,
    hue: 0.0,
    saturation: 0,
    contrast: 0,
    splitTone: 0.0,
  },
  softenDetails: { radius: 0, detail: 0.0 },
  bloom: { radius: 0, bright: 4.0, fade: 0.0, blend: "Screen" },
  halation: { strength: 0.0, threshold: 0.0, radius: 0 },
  lensInstructions: {
    strength: 0.0,
    radius: 0,
    vignette: 0.0,
    distortion: 0.0,
  },
  exposure: { stops: 0.0 },
  filmGrain: { strength: 0.0, bias: 0.0, size: "16mm" },
};

export default function LayersStudio({
  apiKey,
  droppedFiles,
  onFilesHandled,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  locale = "en",
}) {
  const copy = resolveCopy(en, zh, locale);

  // Main canvas & image state
  const [currentImageUrl, setCurrentImageUrl] = useState(DEFAULT_SAMPLE_IMAGE);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Layer Decomposition Sidebar Settings
  const [resolution, setResolution] = useState("1K"); // '1K' | '1.5K' | '2K'
  const [layerCount, setLayerCount] = useState(8);
  const [outputFormat, setOutputFormat] = useState("png");

  // Upscale Clean Panel State
  const [upscaleModel, setUpscaleModel] = useState("topaz-image-upscale");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [topazFactor, setTopazFactor] = useState(1);
  const [seedvrResolution, setSeedvrResolution] = useState("4k");

  // Color Grading State (Individual Category Resets, No Toggles)
  const [colorGrading, setColorGrading] = useState(DEFAULT_COLOR_GRADING);

  // Accordion open/close state for Color Grading sections
  const [openSections, setOpenSections] = useState({
    colorCorrect: true,
    softenDetails: true,
    bloom: true,
    halation: true,
    lensInstructions: true,
    exposure: true,
    filmGrain: true,
  });

  // Active Tool state: 'pointer' | 'hand' | 'lasso' | 'regional-edit' | 'draw' | 'eraser' | 'shapes'
  const [activeTool, setActiveTool] = useState("pointer");

  // Viewport Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 1. FREEHAND LASSO EDIT STATE
  const [lassoPoints, setLassoPoints] = useState([]);
  const [isDraggingLasso, setIsDraggingLasso] = useState(false);

  // 2. RECTANGULAR REGIONAL EDIT BOX STATE
  const [regionalBox, setRegionalBox] = useState({
    x: 25,
    y: 35,
    width: 50,
    height: 30,
  });
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [dragStartRegion, setDragStartRegion] = useState(null);

  // Floating Regional/Lasso Prompt State
  const [regionalPrompt, setRegionalPrompt] = useState("");

  // 3. MARKED REGIONS STACK FOR SEEDREAM 5 PRO BBOX LAYER PROMPTING
  const [markedRegions, setMarkedRegions] = useState([]);

  // 4. SHAPES (R) TOOL STATE
  const [activeShape, setActiveShape] = useState("rect");
  const [shapeColor, setShapeColor] = useState("#ffffff");
  const [shapeSize, setShapeSize] = useState(3);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState({ x: 0, y: 0 });
  const tempCanvasImageData = useRef(null);

  // 5. DRAWING / MARKER PEN STATE
  const [brushColor, setBrushColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);

  // Right Inspector Panel State: 'layer-decomposition' | 'upscale' | 'color-grading' | 'remove-bg' | 'expand-crop' | 'menu' | etc.
  const [activeSideTab, setActiveSideTab] = useState("layer-decomposition");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Tool Specific Inputs
  const [textEditPrompt, setTextEditPrompt] = useState("");

  // Upload & Decomposed Layers State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [decomposedLayers, setDecomposedLayers] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [visibleLayers, setVisibleLayers] = useState({});
  const [isSoloMode, setIsSoloMode] = useState(false);

  // Canvas Refs
  const fileInputRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Drag & Drop Upload State
  const [isDropzoneDragging, setIsDropzoneDragging] = useState(false);
  const dropzoneDragCounterRef = useRef(0);

  // Drawing History Stack
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Handle external dropped files passed from parent shell
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      if (file.type.startsWith("image/")) {
        handleUploadFile(file);
        if (onFilesHandled) onFilesHandled();
      }
    }
  }, [droppedFiles, onFilesHandled]);

  // Sync drawing canvas overlay resolution with displayed image
  const syncCanvasDimensions = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const img = imageRef.current;
    if (canvas && img && img.complete) {
      canvas.width = img.naturalWidth || img.clientWidth || 1024;
      canvas.height = img.naturalHeight || img.clientHeight || 1024;
    }
  }, []);

  useEffect(() => {
    syncCanvasDimensions();
  }, [currentImageUrl, syncCanvasDimensions]);

  // Live CSS Filter computation from Color Grading settings
  const getColorGradingCSSFilter = () => {
    let filterStr = "";
    const { colorCorrect, exposure, softenDetails, bloom, halation } =
      colorGrading;

    // Exposure (stops: -5..5 -> brightness multiplier 2^stops)
    if (exposure.stops !== 0) {
      const expBrightness = Math.max(0, Math.pow(2, exposure.stops) * 100);
      filterStr += `brightness(${expBrightness}%) `;
    }

    // Color Correct (contrast, saturation, hue, temp, splitTone)
    if (colorCorrect.contrast !== 0) {
      filterStr += `contrast(${100 + colorCorrect.contrast}%) `;
    }
    if (colorCorrect.saturation !== 0) {
      filterStr += `saturate(${100 + colorCorrect.saturation}%) `;
    }
    if (colorCorrect.hue !== 0) {
      filterStr += `hue-rotate(${colorCorrect.hue}deg) `;
    }
    if (colorCorrect.temp !== 0) {
      if (colorCorrect.temp > 0) {
        filterStr += `sepia(${colorCorrect.temp * 0.45}%) saturate(${100 + colorCorrect.temp * 0.3}%) `;
      } else {
        filterStr += `hue-rotate(${colorCorrect.temp * 0.5}deg) saturate(${100 + Math.abs(colorCorrect.temp) * 0.2}%) `;
      }
    }
    if (colorCorrect.splitTone > 0) {
      filterStr += `saturate(${100 + colorCorrect.splitTone * 40}%) contrast(${100 + colorCorrect.splitTone * 20}%) `;
    }

    // Soften Details (blur)
    if (softenDetails.radius > 0) {
      filterStr += `blur(${softenDetails.radius * 0.25}px) `;
    }

    // Bloom (glow / brightness halo)
    if (bloom.radius > 0 || bloom.bright !== 4.0) {
      const bloomOpacity = (bloom.bright / 10) * (1 - bloom.fade) * 0.45;
      if (bloomOpacity > 0) {
        filterStr += `drop-shadow(0 0 ${bloom.radius || 8}px rgba(255,255,255,${bloomOpacity})) `;
      }
    }

    // Halation (red edge glow around highlights)
    if (halation.strength > 0) {
      filterStr += `drop-shadow(0 0 ${halation.radius || 6}px rgba(255, 45, 30, ${halation.strength * 0.85})) `;
    }

    return filterStr.trim() || "none";
  };

  // Upload File Helper
  const handleUploadFile = async (file) => {
    if (!apiKey) {
      toast.error(copy.toasts.enterApiKeyUpload);
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const uploadedUrl = await uploadFile(apiKey, file, (pct) =>
        setUploadProgress(pct),
      );
      setCurrentImageUrl(uploadedUrl);
      setDecomposedLayers([]);
      setMarkedRegions([]);
      setCarouselIndex(0);
      setLassoPoints([]);
      clearDrawingCanvas();
      toast.success(copy.toasts.imageUploaded);
    } catch (err) {
      toast.error(copy.toasts.uploadFailed.replace('{error}', formatErrorMessage(err)));
    } finally {
      setUploading(false);
    }
  };

  // Shared entry point for both click-to-browse and drag-and-drop uploads
  const handleFiles = (files) => {
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
    const file = fileList.find((f) => f.type.startsWith("image/")) || fileList[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(copy.toasts.uploadImageFileOnly);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(copy.toasts.fileTooLarge.replace('{name}', file.name));
      return;
    }

    handleUploadFile(file);
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDropzoneDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneDragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDropzoneDragging(true);
    }
  };

  const handleDropzoneDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneDragCounterRef.current -= 1;
    if (dropzoneDragCounterRef.current <= 0) {
      dropzoneDragCounterRef.current = 0;
      setIsDropzoneDragging(false);
    }
  };

  const handleDropzoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropzoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneDragCounterRef.current = 0;
    setIsDropzoneDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Helper to convert mouse/touch events to normalized coordinates (0 to 1000) & percentages
  const getImageNormalizedCoords = (e) => {
    const wrapper = imageWrapperRef.current || imageRef.current;
    if (!wrapper) return { x: 0, y: 0, xPct: 0, yPct: 0 };
    const rect = wrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const xPx = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const yPx = Math.max(0, Math.min(rect.height, clientY - rect.top));

    return {
      x: (xPx / rect.width) * 1000,
      y: (yPx / rect.height) * 1000,
      xPct: (xPx / rect.width) * 100,
      yPct: (yPx / rect.height) * 100,
    };
  };

  // --- LASSO, REGIONAL & REAL-TIME SHAPE SELECTION DRAG LOGIC ---
  const handleImageMouseDown = (e) => {
    const coords = getImageNormalizedCoords(e);

    if (activeTool === "lasso") {
      e.stopPropagation();
      setIsDraggingLasso(true);
      setLassoPoints([{ x: coords.x, y: coords.y }]);
    } else if (activeTool === "regional-edit") {
      e.stopPropagation();
      setDragStartRegion(coords);
      setIsSelectingRegion(true);
      setRegionalBox({ x: coords.xPct, y: coords.yPct, width: 0, height: 0 });
    } else if (activeTool === "shapes") {
      e.stopPropagation();
      setIsDrawingShape(true);
      const canvasCoords = getCanvasCoords(e);
      setShapeStart(canvasCoords);

      const canvas = drawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        tempCanvasImageData.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
    }
  };

  const handleImageMouseMove = (e) => {
    const coords = getImageNormalizedCoords(e);

    if (activeTool === "lasso" && isDraggingLasso) {
      e.stopPropagation();
      setLassoPoints((prev) => [...prev, { x: coords.x, y: coords.y }]);
    } else if (
      activeTool === "regional-edit" &&
      isSelectingRegion &&
      dragStartRegion
    ) {
      e.stopPropagation();
      const minX = Math.min(dragStartRegion.xPct, coords.xPct);
      const minY = Math.min(dragStartRegion.yPct, coords.yPct);
      const width = Math.abs(coords.xPct - dragStartRegion.xPct);
      const height = Math.abs(coords.yPct - dragStartRegion.yPct);

      setRegionalBox({
        x: minX,
        y: minY,
        width: Math.max(2, width),
        height: Math.max(2, height),
      });
    } else if (activeTool === "shapes" && isDrawingShape) {
      e.stopPropagation();
      const endCoords = getCanvasCoords(e);
      drawLiveShapePreview(shapeStart, endCoords);
    }
  };

  const drawLiveShapePreview = (start, end) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (tempCanvasImageData.current) {
      ctx.putImageData(tempCanvasImageData.current, 0, 0);
    }

    ctx.beginPath();
    ctx.strokeStyle = shapeColor;
    ctx.fillStyle = shapeColor;
    ctx.lineWidth = shapeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeShape === "line") {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (activeShape === "arrow") {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - 14 * Math.cos(angle - Math.PI / 6),
        end.y - 14 * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        end.x - 14 * Math.cos(angle + Math.PI / 6),
        end.y - 14 * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
    } else if (activeShape === "rect") {
      const w = end.x - start.x;
      const h = end.y - start.y;
      ctx.strokeRect(start.x, start.y, w, h);
    } else if (activeShape === "circle") {
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = Math.min(start.x, end.x) + rx;
      const cy = Math.min(start.y, end.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleImageMouseUp = (e) => {
    if (isDraggingLasso) {
      if (e) e.stopPropagation();
      setIsDraggingLasso(false);
      if (lassoPoints.length > 5) {
        const xs = lassoPoints.map((p) => p.x);
        const ys = lassoPoints.map((p) => p.y);
        const minX = Math.round(Math.min(...xs));
        const minY = Math.round(Math.min(...ys));
        const maxX = Math.round(Math.max(...xs));
        const maxY = Math.round(Math.max(...ys));
        setMarkedRegions((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "lasso",
            label: `Layer ${prev.length + 1}`,
            bbox: { xmin: minX, ymin: minY, xmax: maxX, ymax: maxY },
          },
        ]);
      }
    }
    if (isSelectingRegion) {
      if (e) e.stopPropagation();
      setIsSelectingRegion(false);
      if (regionalBox.width > 2 && regionalBox.height > 2) {
        const xmin = Math.round(regionalBox.x * 10);
        const ymin = Math.round(regionalBox.y * 10);
        const xmax = Math.round((regionalBox.x + regionalBox.width) * 10);
        const ymax = Math.round((regionalBox.y + regionalBox.height) * 10);
        setMarkedRegions((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "region",
            label: `Layer ${prev.length + 1}`,
            bbox: { xmin, ymin, xmax, ymax },
          },
        ]);
      }
    }
    if (isDrawingShape && activeTool === "shapes") {
      if (e) e.stopPropagation();
      setIsDrawingShape(false);
      const endCoords = getCanvasCoords(e);
      drawLiveShapePreview(shapeStart, endCoords);
      tempCanvasImageData.current = null;
      saveCanvasState();

      const canvas = drawingCanvasRef.current;
      if (canvas && canvas.width && canvas.height) {
        const xmin = Math.round(
          (Math.min(shapeStart.x, endCoords.x) / canvas.width) * 1000,
        );
        const ymin = Math.round(
          (Math.min(shapeStart.y, endCoords.y) / canvas.height) * 1000,
        );
        const xmax = Math.round(
          (Math.max(shapeStart.x, endCoords.x) / canvas.width) * 1000,
        );
        const ymax = Math.round(
          (Math.max(shapeStart.y, endCoords.y) / canvas.height) * 1000,
        );
        setMarkedRegions((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: activeShape,
            label: `Layer ${prev.length + 1}`,
            bbox: { xmin, ymin, xmax, ymax },
          },
        ]);
      }
    }
  };

  // --- DRAWING CANVAS LOGIC ---
  const saveCanvasState = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(dataUrl);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const clearDrawingCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMarkedRegions([]);
    saveCanvasState();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = historyStack[prevIndex];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(prevIndex);
      };
    } else if (historyIndex === 0) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistoryIndex(-1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = historyStack[nextIndex];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(nextIndex);
      };
    }
  };

  const getCanvasCoords = (e) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (activeTool !== "draw" && activeTool !== "eraser") return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
    }
  };

  const drawStroke = (e) => {
    if (!isDrawing || (activeTool !== "draw" && activeTool !== "eraser"))
      return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      if (e) e.stopPropagation();
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  // --- PAN / HAND TOOL LOGIC ---
  const startPan = (e) => {
    if (activeTool !== "hand") return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const doPan = (e) => {
    if (!isPanning || activeTool !== "hand") return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const stopPan = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
    toast(copy.toasts.viewReset);
  };

  // --- REGIONAL & LASSO EDIT AI SUBMIT WITH <bbox> BBOX TAGS ---
  const handleRunRegionalEdit = async () => {
    if (!apiKey) {
      toast.error(copy.toasts.enterApiKey);
      return;
    }
    if (!regionalPrompt) {
      toast.error(copy.toasts.enterRegionPrompt);
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    onGenerationStart?.();

    try {
      let bboxTag = "";
      if (activeTool === "lasso" && lassoPoints.length > 0) {
        const xs = lassoPoints.map((p) => p.x);
        const ys = lassoPoints.map((p) => p.y);
        const minX = Math.round(Math.min(...xs));
        const minY = Math.round(Math.min(...ys));
        const maxX = Math.round(Math.max(...xs));
        const maxY = Math.round(Math.max(...ys));
        bboxTag = `<bbox>${minY} ${minX} ${maxY} ${maxX}</bbox>`;
      } else if (activeTool === "regional-edit") {
        const minX = Math.round(regionalBox.x * 10);
        const minY = Math.round(regionalBox.y * 10);
        const maxX = Math.round((regionalBox.x + regionalBox.width) * 10);
        const maxY = Math.round((regionalBox.y + regionalBox.height) * 10);
        bboxTag = `<bbox>${minY} ${minX} ${maxY} ${maxX}</bbox>`;
      }

      const formattedPrompt = bboxTag
        ? `Modify ${bboxTag}: ${regionalPrompt}`
        : regionalPrompt;

      const result = await decomposeLayers(apiKey, {
        image_url: currentImageUrl,
        prompt: formattedPrompt,
        resolution: resolution,
        output_format: outputFormat,
      });

      setProgress(100);
      const rawImages =
        result.images ||
        result.output?.images ||
        result.outputs ||
        (result.url ? [result.url] : []);
      const layerUrls = Array.isArray(rawImages) ? rawImages : [rawImages];

      if (layerUrls.length > 0) {
        setDecomposedLayers(layerUrls);
        setCarouselIndex(0);
        const initialVis = {};
        layerUrls.forEach((_, idx) => {
          initialVis[idx] = true;
        });
        setVisibleLayers(initialVis);
        toast.success(
          `Generated ${layerUrls.length} layer(s) with Seedream 5 Pro!`,
        );
        onGenerationComplete?.(result);
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      toast.error(copy.toasts.editFailed.replace('{error}', errorMsg));
      onGenerationError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onGenerationEnd?.();
    }
  };

  // --- HELPER TO CONSTRUCT SEEDREAM 5.0 PRO LAYER DECOMPOSITION PROMPT WITH BBOX ---
  const buildSeedreamLayerPrompt = (rawPrompt) => {
    if (
      rawPrompt &&
      (rawPrompt.includes("<bbox>") ||
        rawPrompt.toLowerCase().includes("split the content"))
    ) {
      return rawPrompt;
    }

    if (markedRegions.length > 0) {
      const numLayers = Math.max(markedRegions.length, layerCount);
      let promptLines = [
        `Split the content in the image into ${numLayers} layers:`,
      ];
      markedRegions.forEach((item, idx) => {
        const { xmin, ymin, xmax, ymax } = item.bbox;
        const tag = rawPrompt || `Element ${idx + 1}`;
        promptLines.push(
          `Layer ${idx + 1}: ${tag} <bbox>${xmin} ${ymin} ${xmax} ${ymax}</bbox>`,
        );
      });
      return promptLines.join("\n");
    }

    return (
      rawPrompt ||
      `Split the content in the image into ${layerCount} transparent layers by separating foreground subjects, texts, and background elements cleanly.`
    );
  };

  // --- API CALL: SEEDREAM 5.0 PRO LAYER DECOMPOSITION ---
  const handleDecompose = async (overridePrompt) => {
    const rawPrompt = overridePrompt !== undefined ? overridePrompt : prompt;
    const finalSeedreamPrompt = buildSeedreamLayerPrompt(rawPrompt);

    if (!apiKey) {
      toast.error(copy.toasts.apiKeyMissingSet);
      return;
    }
    if (!currentImageUrl) {
      toast.error(copy.toasts.uploadOrSelectDecompose);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    onGenerationStart?.();

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 800);

      const result = await decomposeLayers(apiKey, {
        image_url: currentImageUrl,
        prompt: finalSeedreamPrompt,
        resolution: resolution,
        output_format: outputFormat,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const rawImages =
        result.images ||
        result.output?.images ||
        result.outputs ||
        (result.url ? [result.url] : []);
      const layerUrls = Array.isArray(rawImages) ? rawImages : [rawImages];

      setDecomposedLayers(layerUrls);
      setCarouselIndex(0);

      const initialVis = {};
      layerUrls.forEach((_, idx) => {
        initialVis[idx] = true;
      });
      setVisibleLayers(initialVis);

      toast.success(copy.toasts.decomposedInto.replace('{count}', layerUrls.length));
      onGenerationComplete?.(result);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      toast.error(copy.toasts.decompositionFailed.replace('{error}', errorMsg));
      onGenerationError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onGenerationEnd?.();
    }
  };

  // --- API CALL: UPSCALE IMAGE (seedvr2-image-upscale, topaz-image-upscale, ai-image-upscaler) ---
  const handleRunUpscale = async () => {
    if (!apiKey) {
      toast.error(copy.toasts.enterApiKey);
      return;
    }
    if (!currentImageUrl) {
      toast.error(copy.toasts.uploadOrSelectUpscale);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    onGenerationStart?.();

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 700);

      const result = await upscaleImage(apiKey, {
        model: upscaleModel,
        image_url: currentImageUrl,
        resolution: seedvrResolution,
        upscale_factor: topazFactor,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const outputUrl =
        result.outputs?.[0] ||
        result.url ||
        result.output?.image ||
        result.output?.images?.[0] ||
        result.output?.url;

      if (outputUrl) {
        setCurrentImageUrl(outputUrl);
        const selectedModelObj = UPSCALE_MODELS.find(
          (m) => m.id === upscaleModel,
        );
        toast.success(
          copy.toasts.upscaleSuccess.replace('{model}', selectedModelObj?.name || "AI Upscaler"),
        );
        onGenerationComplete?.(result);
      } else {
        toast.error(copy.toasts.upscaleNoOutput);
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      toast.error(copy.toasts.upscaleFailed.replace('{error}', errorMsg));
      onGenerationError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onGenerationEnd?.();
    }
  };

  // --- API CALL: REMOVE BACKGROUND (ai-background-remover) ---
  const handleRunRemoveBg = async () => {
    if (!apiKey) {
      toast.error(copy.toasts.enterApiKey);
      return;
    }
    if (!currentImageUrl) {
      toast.error(copy.toasts.uploadOrSelectRemoveBg);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    onGenerationStart?.();

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 700);

      const result = await removeBackground(apiKey, {
        image_url: currentImageUrl,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const outputUrl =
        result.outputs?.[0] ||
        result.url ||
        result.output?.image ||
        result.output?.images?.[0] ||
        result.output?.url;

      if (outputUrl) {
        setCurrentImageUrl(outputUrl);
        setDecomposedLayers((prev) => [
          outputUrl,
          ...prev.filter((u) => u !== outputUrl),
        ]);
        setCarouselIndex(0);
        toast.success(copy.toasts.removeBgSuccess);
        onGenerationComplete?.(result);
      } else {
        toast.error(copy.toasts.removeBgNoOutput);
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      toast.error(copy.toasts.removeBgFailed.replace('{error}', errorMsg));
      onGenerationError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onGenerationEnd?.();
    }
  };

  // --- API CALL: EXPAND / OUTPAINT IMAGE (ai-image-extension) ---
  const handleRunExpand = async () => {
    if (!apiKey) {
      toast.error(copy.toasts.enterApiKey);
      return;
    }
    if (!currentImageUrl) {
      toast.error(copy.toasts.uploadOrSelectExpand);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    onGenerationStart?.();

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 700);

      const result = await expandImage(apiKey, {
        image_url: currentImageUrl,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const outputUrl =
        result.outputs?.[0] ||
        result.url ||
        result.output?.image ||
        result.output?.images?.[0] ||
        result.output?.url;

      if (outputUrl) {
        setCurrentImageUrl(outputUrl);
        toast.success(copy.toasts.expandSuccess);
        onGenerationComplete?.(result);
      } else {
        toast.error(copy.toasts.expandNoOutput);
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      toast.error(copy.toasts.expandFailed.replace('{error}', errorMsg));
      onGenerationError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onGenerationEnd?.();
    }
  };

  // Reset Upscale parameters to default
  const handleResetUpscale = () => {
    setUpscaleModel("topaz-image-upscale");
    setTopazFactor(1);
    setSeedvrResolution("4k");
    toast(copy.toasts.upscaleSettingsReset);
  };

  // Reset individual Color Grading category
  const resetCategory = (catKey) => {
    setColorGrading((prev) => ({
      ...prev,
      [catKey]: { ...DEFAULT_COLOR_GRADING[catKey] },
    }));
    toast(copy.toasts.resetCategory.replace('{category}', catKey));
  };

  // Reset all Color Grading parameters
  const handleResetAllColorGrading = () => {
    setColorGrading(DEFAULT_COLOR_GRADING);
    toast(copy.toasts.colorGradingReset);
  };

  // Download Color Graded Image (Includes live filters, vignette, halation, and film grain)
  const handleDownloadGradedImage = async () => {
    if (!currentImageUrl) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = currentImageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1024;
      canvas.height = img.naturalHeight || 1024;
      const ctx = canvas.getContext("2d");

      // 1. Draw filtered base image
      ctx.filter = getColorGradingCSSFilter();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      // 2. Add Vignette if configured
      if (colorGrading.lensInstructions.vignette > 0) {
        const vRadius = Math.max(canvas.width, canvas.height) * 0.7;
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          vRadius * 0.35,
          canvas.width / 2,
          canvas.height / 2,
          vRadius,
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(
          1,
          `rgba(0,0,0,${colorGrading.lensInstructions.vignette * 0.95})`,
        );
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 3. Add Film Grain if configured
      if (colorGrading.filmGrain.strength > 0) {
        const grainCanvas = document.createElement("canvas");
        grainCanvas.width = 128;
        grainCanvas.height = 128;
        const gCtx = grainCanvas.getContext("2d");
        const gImgData = gCtx.createImageData(128, 128);
        const data = gImgData.data;
        const bias = colorGrading.filmGrain.bias * 50;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 255 + bias;
          data[i] = noise;
          data[i + 1] = noise;
          data[i + 2] = noise;
          data[i + 3] = 40;
        }
        gCtx.putImageData(gImgData, 0, 0);

        ctx.globalAlpha = colorGrading.filmGrain.strength * 0.5;
        ctx.globalCompositeOperation = "overlay";
        const pat = ctx.createPattern(grainCanvas, "repeat");
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
      }

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "color_graded_image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(copy.toasts.downloadedGraded);
    } catch {
      handleDownloadSingle(currentImageUrl, "color_graded_image.png");
    }
  };

  // Load Seedream Wild Beauty 5-Layer Decomposition Example via CDN
  const handleLoadSampleLayers = () => {
    setCurrentImageUrl(
      "https://cdn.muapi.ai/assets/1786019968051_cKRYLHHu.png",
    );
    setDecomposedLayers(DEFAULT_SAMPLE_LAYERS);
    setCarouselIndex(0);
    const initialVis = {};
    DEFAULT_SAMPLE_LAYERS.forEach((_, idx) => {
      initialVis[idx] = true;
    });
    setVisibleLayers(initialVis);
    clearDrawingCanvas();
    setMarkedRegions([]);
    toast.success(copy.toasts.loadedSample);
  };

  // Explicit Side Tool Execution Handler
  const handleExecuteSideTool = async (toolId) => {
    if (!apiKey) {
      toast.error(copy.toasts.apiKeyMissing);
      return;
    }
    if (!currentImageUrl) {
      toast.error(copy.toasts.uploadImageFirst);
      return;
    }

    if (toolId === "remove-bg") {
      return handleRunRemoveBg();
    }
    if (toolId === "expand-crop") {
      return handleRunExpand();
    }

    setIsProcessing(true);
    setProgress(20);
    onGenerationStart?.();

    try {
      let result;
      if (toolId === "enhancer") {
        result = await generateI2I(apiKey, {
          model: "nano-banana-pro-edit",
          prompt:
            "Enhance image contrast, color balance, exposure, and sharpness.",
          image_url: currentImageUrl,
        });
      } else if (toolId === "edit-text") {
        const textPrompt =
          textEditPrompt ||
          prompt ||
          "Edit and sharpen text overlay on the image cleanly.";
        result = await generateI2I(apiKey, {
          model: "nano-banana-pro-edit",
          prompt: textPrompt,
          image_url: currentImageUrl,
        });
      } else {
        result = await generateI2I(apiKey, {
          model: "nano-banana-pro-edit",
          prompt: prompt || `Apply ${toolId} image transformation.`,
          image_url: currentImageUrl,
        });
      }

      setProgress(100);
      if (result?.url) {
        setCurrentImageUrl(result.url);
        toast.success(copy.toasts.toolCompleted.replace('{tool}', toolId));
        onGenerationComplete?.(result);
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      toast.error(copy.toasts.operationFailed.replace('{error}', errorMsg));
      onGenerationError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onGenerationEnd?.();
    }
  };

  const toggleLayerVisibility = (idx) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleDownloadSingle = async (url, filename) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || `layer.${outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleDownloadAll = () => {
    if (decomposedLayers.length === 0) {
      if (currentImageUrl) {
        handleDownloadSingle(currentImageUrl, `image.${outputFormat}`);
      }
      return;
    }
    decomposedLayers.forEach((url, i) => {
      setTimeout(() => {
        handleDownloadSingle(url, `layer_${i + 1}.${outputFormat}`);
      }, i * 300);
    });
    toast.success(copy.toasts.downloadingAll);
  };

  const sideMenuItems = [
    { id: "layer-decomposition", label: copy.menuItems["layer-decomposition"], isNew: true },
    { id: "upscale", label: copy.menuItems.upscale, isNew: true },
    { id: "color-grading", label: copy.menuItems["color-grading"], isNew: true },
    { id: "remove-bg", label: copy.menuItems["remove-bg"], isNew: true },
    { id: "expand-crop", label: copy.menuItems["expand-crop"], isNew: true },
    { id: "edit-text", label: copy.menuItems["edit-text"], isNew: false },
    { id: "enhancer", label: copy.menuItems.enhancer, isNew: false },
    { id: "relight", label: copy.menuItems.relight, isNew: false },
    { id: "angles", label: copy.menuItems.angles, isNew: false },
  ];

  const getLassoPathString = () => {
    if (lassoPoints.length < 2) return "";
    return (
      lassoPoints
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        )
        .join(" ") + " Z"
    );
  };

  return (
    <div className="relative w-full h-full bg-[#121318] text-white flex overflow-hidden font-sans select-none">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1c1e24",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Left Thumbnail Pill Strip */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          title={copy.tools.uploadOrChangeImage}
          className="group relative w-12 h-14 rounded-2xl overflow-hidden bg-[#1a1c23] border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)] ring-2 ring-[#84cc16]/80"
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Input thumb"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold tracking-tighter text-white">
            CHANGE
          </div>
        </button>

        {markedRegions.length > 0 && (
          <button
            onClick={() => setMarkedRegions([])}
            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-black rounded-lg border border-red-500/40 shadow-sm"
            title={copy.tools.clearMarkedRegions}
          >
            Clear ({markedRegions.length})
          </button>
        )}
      </div>

      {/* Main Canvas Area with Live Color Grading Filter & Realtime Vignette / Grain */}
      <div
        ref={canvasContainerRef}
        onMouseDown={startPan}
        onMouseMove={doPan}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        className={`flex-1 relative h-full flex flex-col items-center justify-center p-4 pb-28 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d2029] via-[#0f1015] to-[#08090c] ${
          activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div className="absolute w-[700px] h-[700px] bg-[#84cc16]/5 rounded-full blur-[160px] pointer-events-none" />

        {/* Central Display Viewport Container */}
        <div
          className="relative max-w-[90%] max-h-[78vh] flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
            filter: getColorGradingCSSFilter(),
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#1a1c23]/80 backdrop-blur-md rounded-3xl border border-white/10">
              <div className="w-12 h-12 border-4 border-[#84cc16]/20 border-t-[#84cc16] rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-white/80">
                Uploading image... {uploadProgress}%
              </p>
            </div>
          ) : currentImageUrl ? (
            <div
              ref={imageWrapperRef}
              onMouseDown={handleImageMouseDown}
              onMouseMove={handleImageMouseMove}
              onMouseUp={handleImageMouseUp}
              onTouchStart={handleImageMouseDown}
              onTouchMove={handleImageMouseMove}
              onTouchEnd={handleImageMouseUp}
              className={`relative group rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 ${
                activeTool === "lasso" ||
                activeTool === "regional-edit" ||
                activeTool === "shapes"
                  ? "cursor-crosshair"
                  : ""
              }`}
              style={{
                transform:
                  colorGrading.lensInstructions.distortion !== 0
                    ? `scale(${1 + Math.abs(colorGrading.lensInstructions.distortion) * 0.08})`
                    : undefined,
              }}
            >
              <img
                ref={imageRef}
                src={currentImageUrl}
                alt="Main canvas"
                onLoad={syncCanvasDimensions}
                className={`max-h-[72vh] max-w-[70vw] object-contain transition-opacity duration-300 pointer-events-none ${
                  decomposedLayers.length > 0
                    ? "opacity-30 blur-[1px]"
                    : "opacity-100"
                }`}
              />

              {/* Realtime Vignette Layer Overlay */}
              {colorGrading.lensInstructions.vignette > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl z-20 transition-opacity duration-150"
                  style={{
                    background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${colorGrading.lensInstructions.vignette * 0.95}) 100%)`,
                  }}
                />
              )}

              {/* Realtime Film Grain SVG Noise Layer Overlay */}
              {colorGrading.filmGrain.strength > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl z-20 mix-blend-overlay transition-opacity duration-150"
                  style={{
                    opacity: colorGrading.filmGrain.strength,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${
                      colorGrading.filmGrain.size === "35mm"
                        ? "0.85"
                        : colorGrading.filmGrain.size === "16mm"
                          ? "0.65"
                          : "0.45"
                    }' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${
                      0.35 + colorGrading.filmGrain.bias * 0.45
                    }'/%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {/* 1. FREEHAND LASSO EDIT OVERLAY */}
              {activeTool === "lasso" && lassoPoints.length > 1 && (
                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none z-30"
                >
                  <path
                    d={getLassoPathString()}
                    fill="rgba(56, 189, 248, 0.18)"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeDasharray="8 8"
                    className="drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]"
                  />
                </svg>
              )}

              {/* 2. RECTANGULAR REGIONAL EDIT BOX OVERLAY */}
              {activeTool === "regional-edit" &&
                regionalBox.width > 0 &&
                regionalBox.height > 0 && (
                  <div
                    className="absolute border-2 border-dashed border-[#38bdf8] bg-[#38bdf8]/10 rounded-lg pointer-events-auto shadow-[0_0_25px_rgba(56,189,248,0.5)] z-30"
                    style={{
                      left: `${regionalBox.x}%`,
                      top: `${regionalBox.y}%`,
                      width: `${regionalBox.width}%`,
                      height: `${regionalBox.height}%`,
                    }}
                  >
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full" />
                  </div>
                )}

              {/* FLOATING REGIONAL / LASSO PROMPT BAR */}
              {((activeTool === "lasso" &&
                lassoPoints.length > 2 &&
                !isDraggingLasso) ||
                (activeTool === "regional-edit" &&
                  regionalBox.width > 2 &&
                  !isSelectingRegion)) && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[280px] sm:w-[340px] bg-[#161822]/95 backdrop-blur-2xl border border-white/20 rounded-full px-3.5 py-2 flex items-center gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.9)] z-50 animate-fade-in"
                >
                  <span className="text-white/40 font-semibold text-sm ml-1">
                    +
                  </span>
                  <input
                    type="text"
                    value={regionalPrompt}
                    onChange={(e) => setRegionalPrompt(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRunRegionalEdit()
                    }
                    placeholder={copy.tools.regionalPromptPlaceholder}
                    className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none min-w-0 font-medium"
                  />
                  <button
                    onClick={handleRunRegionalEdit}
                    disabled={isProcessing}
                    className="w-7 h-7 rounded-full bg-[#84cc16] hover:bg-[#a3e635] text-black flex items-center justify-center shadow-[0_0_12px_rgba(132,204,22,0.6)] transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                    title={copy.tools.runSelectionEdit}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Interactive HTML5 Drawing & Shapes Overlay Canvas */}
              <canvas
                ref={drawingCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={drawStroke}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawStroke}
                onTouchEnd={stopDrawing}
                className={`absolute inset-0 w-full h-full touch-none ${
                  activeTool === "draw" ||
                  activeTool === "eraser" ||
                  activeTool === "shapes"
                    ? "cursor-crosshair z-30 pointer-events-auto"
                    : "pointer-events-none z-10"
                }`}
              />

              {/* Decomposed Layer Overlay Stack on Canvas */}
              {decomposedLayers.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {decomposedLayers.map((layerUrl, idx) => {
                    const isVisible = isSoloMode
                      ? carouselIndex === idx
                      : visibleLayers[idx];
                    if (!isVisible) return null;
                    const isSelected = carouselIndex === idx;
                    return (
                      <img
                        key={idx}
                        src={layerUrl}
                        alt={`Layer ${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(idx);
                        }}
                        className={`absolute inset-0 w-full h-full object-contain transition-all duration-200 cursor-pointer pointer-events-auto ${
                          isSelected
                            ? "ring-2 ring-[#84cc16] drop-shadow-[0_0_20px_rgba(132,204,22,0.6)]"
                            : "hover:opacity-90"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Loading Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-40">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-[#84cc16]/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm font-bold tracking-wide text-white">
                    Processing Image...
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Open Generative AI Studio
                  </p>

                  <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden mt-4">
                    <div
                      className="bg-gradient-to-r from-[#84cc16] to-[#a3e635] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDropzoneDragEnter}
              onDragLeave={handleDropzoneDragLeave}
              onDragOver={handleDropzoneDragOver}
              onDrop={handleDropzoneDrop}
              className={`flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-200 ${
                isDropzoneDragging
                  ? "border-[#84cc16] bg-[#84cc16]/10 scale-[1.02]"
                  : "border-white/20 hover:border-[#84cc16]/60 bg-[#16181f]/50 hover:bg-[#16181f]/80"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-base font-bold text-white mb-1">
                Click or Drop Image Here
              </p>
              <p className="text-xs text-white/50">
                Supports PNG, JPEG, WEBP up to 20MB
              </p>
            </div>
          )}
        </div>

        {/* Floating Canvas Controls & Prompt Composer */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5 w-full max-w-xl px-4">
          {/* SHAPES (R) POPOVER TOOLBAR */}
          {activeTool === "shapes" && (
            <div className="flex items-center gap-3 px-4 py-2 bg-[#1b1e26]/95 backdrop-blur-xl border border-[#84cc16]/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-fade-in">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveShape("line")}
                  className={`p-1.5 rounded-lg border transition-all ${
                    activeShape === "line"
                      ? "bg-[#84cc16] text-black border-[#84cc16]"
                      : "text-white/70 hover:text-white border-transparent"
                  }`}
                  title={copy.tools.line}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="19" x2="19" y2="5" />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveShape("arrow")}
                  className={`p-1.5 rounded-lg border transition-all ${
                    activeShape === "arrow"
                      ? "bg-[#84cc16] text-black border-[#84cc16]"
                      : "text-white/70 hover:text-white border-transparent"
                  }`}
                  title={copy.tools.arrow}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="19" x2="19" y2="5" />
                    <polyline points="12 5 19 5 19 12" />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveShape("rect")}
                  className={`p-1.5 rounded-lg border transition-all ${
                    activeShape === "rect"
                      ? "bg-[#84cc16] text-black border-[#84cc16]"
                      : "text-white/70 hover:text-white border-transparent"
                  }`}
                  title={copy.tools.rectangle}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveShape("circle")}
                  className={`p-1.5 rounded-lg border transition-all ${
                    activeShape === "circle"
                      ? "bg-[#84cc16] text-black border-[#84cc16]"
                      : "text-white/70 hover:text-white border-transparent"
                  }`}
                  title={copy.tools.circle}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </button>
              </div>

              <div className="w-[1px] h-4 bg-white/10" />

              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setShapeColor(c)}
                    className={`w-4 h-4 rounded-full border border-white/20 transition-all ${
                      shapeColor === c
                        ? "scale-125 ring-2 ring-white shadow-md"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Drawing Tool Popover Options Bar */}
          {(activeTool === "draw" || activeTool === "eraser") && (
            <div className="flex items-center gap-3 px-4 py-2 bg-[#1b1e26]/95 backdrop-blur-xl border border-[#84cc16]/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-fade-in">
              <span className="text-xs font-extrabold uppercase text-[#a3e635] tracking-wider">
                {activeTool === "draw" ? "Marker Pen" : "Eraser"}
              </span>

              {activeTool === "draw" && (
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-5 h-5 rounded-full border border-white/20 transition-all ${
                        brushColor === c
                          ? "scale-125 ring-2 ring-white shadow-md"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-5 h-5 rounded-full border-0 cursor-pointer bg-transparent"
                    title={copy.tools.customColor}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                <span className="text-[11px] text-white/60 font-semibold">
                  Size:
                </span>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-[#84cc16] cursor-pointer"
                />
                <span className="text-xs font-bold text-white min-w-[20px]">
                  {brushSize}px
                </span>
              </div>

              <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex < 0}
                  className="p-1.5 text-white/70 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5"
                  title={copy.tools.undoStroke}
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  className="p-1.5 text-white/70 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5"
                  title={copy.tools.redoStroke}
                >
                  ↷
                </button>
                <button
                  onClick={clearDrawingCanvas}
                  className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-white/5 text-xs font-bold"
                  title={copy.tools.clearDrawings}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Bottom Floating Micro Toolbar */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1b1e26]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => setActiveTool("pointer")}
              className={`p-2 rounded-xl transition-all ${
                activeTool === "pointer"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.selectPointerTool}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="3 3 10.07 19.97 12.58 12.58 19.97 10.07 3 3" />
              </svg>
            </button>

            <button
              onClick={() => setActiveTool("hand")}
              className={`p-2 rounded-xl transition-all ${
                activeTool === "hand"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.panTool}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 11V6a2 2 0 0 0-4 0v5" />
                <path d="M14 10V4a2 2 0 0 0-4 0v6" />
                <path d="M10 10.5V6a2 2 0 0 0-4 0v9" />
                <path d="M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.8-5.6-2.4l-3-4.2a2 2 0 0 1 3.2-2.4l1.4 1.6" />
              </svg>
            </button>

            <button
              onClick={() =>
                setActiveTool(activeTool === "lasso" ? "pointer" : "lasso")
              }
              className={`group relative p-2 rounded-xl transition-all ${
                activeTool === "lasso"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.lassoEdit}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M4 16c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2"
                  strokeDasharray="3 3"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                Lasso edit
              </div>
            </button>

            <button
              onClick={() =>
                setActiveTool(
                  activeTool === "regional-edit" ? "pointer" : "regional-edit",
                )
              }
              className={`group relative p-2 rounded-xl transition-all ${
                activeTool === "regional-edit"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.regionalEdit}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="2"
                  strokeDasharray="3 3"
                />
                <path d="M9 12h6M12 9v6" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                Regional edit
              </div>
            </button>

            <button
              onClick={() =>
                setActiveTool(activeTool === "draw" ? "pointer" : "draw")
              }
              className={`p-2 rounded-xl transition-all ${
                activeTool === "draw"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.highlightMarkerPen}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
            </button>

            <button
              onClick={() =>
                setActiveTool(activeTool === "eraser" ? "pointer" : "eraser")
              }
              className={`p-2 rounded-xl transition-all ${
                activeTool === "eraser"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.eraserTool}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L21 6C22 7 22 9 21 10L12 19" />
              </svg>
            </button>

            <button
              onClick={() =>
                setActiveTool(activeTool === "shapes" ? "pointer" : "shapes")
              }
              className={`group relative p-2 rounded-xl transition-all ${
                activeTool === "shapes"
                  ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={copy.tools.shapes}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="10" height="10" rx="1" />
                <circle cx="16" cy="16" r="5" />
              </svg>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                Shapes (R)
              </div>
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="px-1.5 py-1 text-white/60 hover:text-white text-xs font-bold"
            >
              –
            </button>
            <button
              onClick={resetView}
              className="text-xs font-semibold text-white/80 min-w-[36px] text-center hover:text-white"
              title={copy.tools.resetZoomPan}
            >
              {zoomLevel}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
              className="px-1.5 py-1 text-white/60 hover:text-white text-xs font-bold"
            >
              +
            </button>
          </div>

          {/* Bottom Floating Main Prompt Bar */}
          <div className="w-full relative flex items-center bg-[#15171e]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all mr-2 flex-shrink-0"
              title={copy.tools.addImage}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDecompose()}
              placeholder={
                markedRegions.length > 0
                  ? `Describe layers for ${markedRegions.length} marked region(s)...`
                  : "Describe how to edit image or split layers..."
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none px-2 font-medium min-w-0"
            />

            <button
              onClick={() => handleDecompose()}
              disabled={isProcessing}
              className="w-10 h-10 rounded-full bg-[#84cc16] hover:bg-[#a3e635] text-black flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ml-2 flex-shrink-0"
              title={copy.tools.runLayerDecomposition}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right Inspector Panel */}
      {isSidebarOpen && (
        <div className="w-[380px] h-full bg-[#242833] border-l border-white/10 flex flex-col justify-between z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] animate-fade-in">
          {/* Top Header & Panel Content */}
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
            {/* Header with Back, Title & Close */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSideTab("menu")}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                  title={copy.tools.backToTools}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black shadow-sm">
                    {activeSideTab === "upscale" ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    ) : activeSideTab === "color-grading" ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"
                          opacity="0.4"
                        />
                        <circle cx="9" cy="9" r="3" />
                        <circle cx="15" cy="9" r="3" />
                        <circle cx="12" cy="15" r="3" />
                      </svg>
                    ) : activeSideTab === "remove-bg" ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                      </svg>
                    ) : activeSideTab === "expand-crop" ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <polyline points="21 15 21 21 15 21" />
                        <polyline points="3 9 3 3 9 3" />
                      </svg>
                    ) : (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">
                    {copy.panels[activeSideTab] || copy.panels.tools}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors"
                title={copy.tools.closePanel}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* --- VIEW 1: LAYER DECOMPOSITION VIEW --- */}
            {activeSideTab === "layer-decomposition" && (
              <div className="space-y-4">
                {/* Hero Feature Card with 5 CDN Layers */}
                <div
                  onClick={handleLoadSampleLayers}
                  className="group w-full bg-[#f4f4f7] hover:bg-white rounded-3xl p-3 shadow-lg overflow-hidden border border-white/20 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                  title={copy.sample.clickToLoad}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-28 h-36 rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0 shadow-md">
                      <img
                        src="https://cdn.muapi.ai/assets/1786019968051_cKRYLHHu.png"
                        alt="Seedream original demo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d8ff00]/90 to-transparent blur-[3px] animate-pulse" />
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 text-[8px] font-black text-white backdrop-blur-sm">
                        {copy.sample.original}
                      </div>
                    </div>

                    <div className="flex-1 bg-[#13151d] rounded-2xl p-2.5 flex flex-col justify-between h-36 shadow-inner overflow-hidden">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-[#a3e635] uppercase tracking-wider">
                          {copy.sample.layersCount}
                        </span>
                        <span className="text-[9px] font-bold text-white/50 group-hover:text-white transition-colors">
                          {copy.sample.try}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                        {DEFAULT_SAMPLE_LAYERS.map((layerUrl, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 w-11 h-16 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center p-1 bg-[#1a1d26] shadow-sm hover:border-[#84cc16]/50 transition-all"
                            style={{
                              backgroundImage: `linear-gradient(45deg, #242733 25%, transparent 25%), linear-gradient(-45deg, #242733 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #242733 75%), linear-gradient(-45deg, transparent 75%, #242733 75%)`,
                              backgroundSize: "6px 6px",
                            }}
                            title={`Layer ${idx + 1}`}
                          >
                            <img
                              src={layerUrl}
                              alt={`Layer ${idx + 1}`}
                              className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                            />
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black text-white/90 bg-black/70 px-1 rounded">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[9px] text-center text-white/40 font-semibold group-hover:text-[#84cc16] transition-colors">
                        {copy.sample.clickToExplore}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="bg-[#2d313d] rounded-3xl p-5 border border-white/5 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {copy.settings.heading}
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                      {copy.settings.resolution}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-[#1a1c24] p-1 rounded-2xl border border-white/5">
                      {["1K", "1.5K", "2K"].map((res) => (
                        <button
                          key={res}
                          onClick={() => setResolution(res)}
                          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                            resolution === res
                              ? "bg-[#383c4a] text-white shadow-md border border-white/10"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
                        {copy.settings.layers}
                      </label>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#1a1c24] border border-white/10 text-xs font-black text-white shadow-sm">
                        {layerCount}
                      </span>
                    </div>
                    <div className="bg-[#1a1c24] rounded-2xl p-3 border border-white/5 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-white/30">
                        2
                      </span>
                      <input
                        type="range"
                        min="2"
                        max="16"
                        value={layerCount}
                        onChange={(e) => setLayerCount(Number(e.target.value))}
                        className="w-full accent-[#e2f924] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                      />
                      <span className="text-[10px] font-bold text-white/30">
                        16
                      </span>
                    </div>
                  </div>
                </div>

                {/* RESULTS: DECOMPOSED LAYERS INTERACTIVE CAROUSEL */}
                {decomposedLayers.length > 0 && (
                  <div className="space-y-4 border-t border-white/10 pt-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-white/80">
                          {copy.carousel.heading}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#84cc16]/20 text-[#a3e635] text-[10px] font-black">
                          {carouselIndex + 1} / {decomposedLayers.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsSoloMode(!isSoloMode)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                            isSoloMode
                              ? "bg-[#84cc16] text-black border-[#84cc16]"
                              : "bg-white/5 text-white/60 hover:text-white border-white/10"
                          }`}
                          title={copy.carousel.viewOnlyActive}
                        >
                          {isSoloMode ? copy.carousel.soloActive : copy.carousel.stackMode}
                        </button>
                        <button
                          onClick={handleDownloadAll}
                          className="text-xs text-[#a3e635] hover:underline font-semibold"
                        >
                          {copy.carousel.downloadAll}
                        </button>
                      </div>
                    </div>

                    <div className="relative group bg-[#111319] border border-white/15 rounded-2xl overflow-hidden p-3 flex flex-col items-center shadow-xl">
                      <div
                        className="w-full h-48 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/10"
                        style={{
                          backgroundImage: `linear-gradient(45deg, #1c1f26 25%, transparent 25%), linear-gradient(-45deg, #1c1f26 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1f26 75%), linear-gradient(-45deg, transparent 75%, #1c1f26 75%)`,
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }}
                      >
                        <img
                          src={decomposedLayers[carouselIndex]}
                          alt={`Layer ${carouselIndex + 1}`}
                          className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300 transform group-hover:scale-105"
                        />

                        <button
                          onClick={() =>
                            setCarouselIndex((prev) =>
                              prev > 0 ? prev - 1 : decomposedLayers.length - 1,
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#84cc16] text-white hover:text-black flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md"
                          title={copy.carousel.previousLayer}
                        >
                          ‹
                        </button>

                        <button
                          onClick={() =>
                            setCarouselIndex((prev) =>
                              prev < decomposedLayers.length - 1 ? prev + 1 : 0,
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#84cc16] text-white hover:text-black flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md"
                          title={copy.carousel.nextLayer}
                        >
                          ›
                        </button>
                      </div>

                      <div className="w-full flex items-center justify-between mt-3 px-1 text-xs">
                        <div>
                          <span className="font-extrabold text-white text-sm">
                            {copy.carousel.layerLabel.replace('{n}', carouselIndex + 1)}
                          </span>
                          <span className="text-[11px] text-white/40 ml-2">
                            {copy.carousel.seedreamDecomposed}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleLayerVisibility(carouselIndex)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              visibleLayers[carouselIndex]
                                ? "bg-white/10 text-[#a3e635] border-white/10"
                                : "text-white/30 border-transparent"
                            }`}
                            title={copy.carousel.toggleVisibility}
                          >
                            👁
                          </button>

                          <button
                            onClick={() =>
                              handleDownloadSingle(
                                decomposedLayers[carouselIndex],
                                `layer_${carouselIndex + 1}.${outputFormat}`,
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-black font-extrabold text-xs flex items-center gap-1 shadow-md"
                            title={copy.carousel.downloadThisLayer}
                          >
                            <span>⬇</span>
                            <span>{copy.carousel.save}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {decomposedLayers.map((layerUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={`relative flex-shrink-0 w-14 h-12 rounded-xl overflow-hidden border transition-all p-1 bg-[#181a22] ${
                            carouselIndex === idx
                              ? "border-[#84cc16] ring-2 ring-[#84cc16]/50 scale-105"
                              : "border-white/10 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={layerUrl}
                            alt={`Thumb ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute bottom-0.5 right-1 text-[8px] font-black text-white/80 bg-black/60 px-1 rounded">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW 2: DEDICATED CLEAN UPSCALE VIEW --- */}
            {activeSideTab === "upscale" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                      {copy.common.model}
                    </span>
                    <button
                      onClick={handleResetUpscale}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white transition-colors"
                      title={copy.colorGrading.resetToDefault}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsModelDropdownOpen(!isModelDropdownOpen)
                      }
                      className="w-full bg-[#2d313d] hover:bg-[#343946] p-3 rounded-2xl border border-white/5 flex items-center justify-between text-left transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <rect x="4" y="14" width="5" height="5" rx="1" />
                            <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
                            <rect x="15" y="4" width="5" height="5" rx="1" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {UPSCALE_MODELS.find((m) => m.id === upscaleModel)
                              ?.name || "Topaz"}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate max-w-[200px]">
                            {
                              UPSCALE_MODELS.find((m) => m.id === upscaleModel)
                                ?.subtitle
                            }
                          </p>
                        </div>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-white/40 transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isModelDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f222b] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1">
                        {UPSCALE_MODELS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setUpscaleModel(opt.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex flex-col transition-all ${
                              upscaleModel === opt.id
                                ? "bg-[#343946] text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">
                                {opt.name}
                              </span>
                              <span className="text-[10px] font-bold text-[#a3e635]">
                                {opt.cost} credits
                              </span>
                            </div>
                            <span className="text-[10px] text-white/40">
                              {opt.subtitle}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {upscaleModel === "topaz-image-upscale" && (
                  <div className="bg-[#2d313d] rounded-2xl p-3 border border-white/5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                        Upscale Factor
                      </span>
                      <span className="bg-[#181a22] text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/10">
                        {topazFactor * 442}×{topazFactor * 413}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 bg-[#1a1c24] p-1 rounded-xl border border-white/5">
                      {[1, 2, 4, 8].map((fac) => (
                        <button
                          key={fac}
                          onClick={() => setTopazFactor(fac)}
                          className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                            topazFactor === fac
                              ? "bg-[#383c4a] text-white shadow-md border border-white/10"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          x{fac}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {upscaleModel === "seedvr2-image-upscale" && (
                  <div className="bg-[#2d313d] rounded-2xl p-3 border border-white/5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                        {copy.settings.resolution}
                      </span>
                      <span className="bg-[#181a22] text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/10">
                        {seedvrResolution.toUpperCase()} UHD
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-[#1a1c24] p-1 rounded-xl border border-white/5">
                      {["2k", "4k", "8k"].map((res) => (
                        <button
                          key={res}
                          onClick={() => setSeedvrResolution(res)}
                          className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all ${
                            seedvrResolution === res
                              ? "bg-[#383c4a] text-white shadow-md border border-white/10"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {upscaleModel === "ai-image-upscaler" && (
                  <div className="bg-[#2d313d] rounded-2xl p-4 border border-white/5 flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center flex-shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        Automatic AI Super-Resolution
                      </h5>
                      <p className="text-[10px] text-white/50">
                        1-click neural clarity and noise reduction.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW 3: DEDICATED COLOR GRADING VIEW --- */}
            {activeSideTab === "color-grading" && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Color Correct Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          colorCorrect: !prev.colorCorrect,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.colorCorrect ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Color Correct
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.colorCorrect.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("colorCorrect")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.colorCorrect.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.colorCorrect && (
                    <div className="space-y-2 pt-1">
                      {/* Temp */}
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Temp
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={colorGrading.colorCorrect.temp}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                colorCorrect: {
                                  ...prev.colorCorrect,
                                  temp: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.colorCorrect.temp}
                          </span>
                        </div>
                      </div>

                      {/* Hue */}
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Hue
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="0.5"
                            value={colorGrading.colorCorrect.hue}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                colorCorrect: {
                                  ...prev.colorCorrect,
                                  hue: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.colorCorrect.hue.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Saturation */}
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Saturation
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={colorGrading.colorCorrect.saturation}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                colorCorrect: {
                                  ...prev.colorCorrect,
                                  saturation: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.colorCorrect.saturation}
                          </span>
                        </div>
                      </div>

                      {/* Contrast */}
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Contrast
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={colorGrading.colorCorrect.contrast}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                colorCorrect: {
                                  ...prev.colorCorrect,
                                  contrast: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.colorCorrect.contrast}
                          </span>
                        </div>
                      </div>

                      {/* Split Tone */}
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Split Tone
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.colorCorrect.splitTone}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                colorCorrect: {
                                  ...prev.colorCorrect,
                                  splitTone: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.colorCorrect.splitTone.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Soften Details Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          softenDetails: !prev.softenDetails,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.softenDetails ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Soften Details
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.softenDetails.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("softenDetails")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.softenDetails.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.softenDetails && (
                    <div className="space-y-2 pt-1">
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Radius
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={colorGrading.softenDetails.radius}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                softenDetails: {
                                  ...prev.softenDetails,
                                  radius: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.softenDetails.radius}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Detail
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.softenDetails.detail}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                softenDetails: {
                                  ...prev.softenDetails,
                                  detail: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.softenDetails.detail.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Bloom Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          bloom: !prev.bloom,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.bloom ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Bloom
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.bloom.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("bloom")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.bloom.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.bloom && (
                    <div className="space-y-2 pt-1">
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Radius
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={colorGrading.bloom.radius}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                bloom: {
                                  ...prev.bloom,
                                  radius: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.bloom.radius}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Bright
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={colorGrading.bloom.bright}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                bloom: {
                                  ...prev.bloom,
                                  bright: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.bloom.bright.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Fade
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.bloom.fade}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                bloom: {
                                  ...prev.bloom,
                                  fade: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.bloom.fade.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70 px-1">
                          Blend
                        </span>
                        <div className="grid grid-cols-2 gap-1 bg-[#151720] p-0.5 rounded-xl border border-white/5">
                          {["Screen", "Soft Light"].map((b) => (
                            <button
                              key={b}
                              onClick={() =>
                                setColorGrading((prev) => ({
                                  ...prev,
                                  bloom: { ...prev.bloom, blend: b },
                                }))
                              }
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                colorGrading.bloom.blend === b
                                  ? "bg-[#383c4a] text-white shadow"
                                  : "text-white/40 hover:text-white"
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Halation Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          halation: !prev.halation,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.halation ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Halation
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.halation.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("halation")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.halation.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.halation && (
                    <div className="space-y-2 pt-1">
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Strength
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.halation.strength}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                halation: {
                                  ...prev.halation,
                                  strength: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.halation.strength.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Threshold
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.halation.threshold}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                halation: {
                                  ...prev.halation,
                                  threshold: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.halation.threshold.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Radius
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={colorGrading.halation.radius}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                halation: {
                                  ...prev.halation,
                                  radius: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.halation.radius}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Lens Instructions Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          lensInstructions: !prev.lensInstructions,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.lensInstructions ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Lens Instructions
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.lensInstructions.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("lensInstructions")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.lensInstructions.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.lensInstructions && (
                    <div className="space-y-2 pt-1">
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Strength
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={colorGrading.lensInstructions.strength}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                lensInstructions: {
                                  ...prev.lensInstructions,
                                  strength: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.lensInstructions.strength.toFixed(3)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Radius
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={colorGrading.lensInstructions.radius}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                lensInstructions: {
                                  ...prev.lensInstructions,
                                  radius: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.lensInstructions.radius}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Vignette
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.lensInstructions.vignette}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                lensInstructions: {
                                  ...prev.lensInstructions,
                                  vignette: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.lensInstructions.vignette.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Distortion
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.05"
                            value={colorGrading.lensInstructions.distortion}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                lensInstructions: {
                                  ...prev.lensInstructions,
                                  distortion: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.lensInstructions.distortion.toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Exposure Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          exposure: !prev.exposure,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.exposure ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Exposure
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.exposure.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("exposure")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.exposure.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.exposure && (
                    <div className="space-y-2 pt-1">
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Stops
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-5"
                            max="5"
                            step="0.1"
                            value={colorGrading.exposure.stops}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                exposure: {
                                  ...prev.exposure,
                                  stops: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.exposure.stops.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Film Grain Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          filmGrain: !prev.filmGrain,
                        }))
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-white/40 transition-transform ${openSections.filmGrain ? "" : "-rotate-90"}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span className="text-sm font-bold text-white tracking-tight">
                        Film Grain
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help"
                        title={copy.colorGrading.filmGrain.info}
                      >
                        ℹ
                      </span>
                    </button>

                    <button
                      onClick={() => resetCategory("filmGrain")}
                      className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={copy.colorGrading.filmGrain.reset}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>{copy.common.reset}</span>
                    </button>
                  </div>

                  {openSections.filmGrain && (
                    <div className="space-y-2 pt-1">
                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Strength
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.filmGrain.strength}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                filmGrain: {
                                  ...prev.filmGrain,
                                  strength: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.filmGrain.strength.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70">
                          Bias
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={colorGrading.filmGrain.bias}
                            onChange={(e) =>
                              setColorGrading((prev) => ({
                                ...prev,
                                filmGrain: {
                                  ...prev.filmGrain,
                                  bias: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                          />
                          <span className="text-xs font-bold text-white min-w-[28px] text-right">
                            {colorGrading.filmGrain.bias.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#1f222d] rounded-2xl p-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/70 px-1">
                          Size
                        </span>
                        <div className="grid grid-cols-3 gap-1 bg-[#151720] p-0.5 rounded-xl border border-white/5">
                          {["35mm", "16mm", "8mm"].map((sz) => (
                            <button
                              key={sz}
                              onClick={() =>
                                setColorGrading((prev) => ({
                                  ...prev,
                                  filmGrain: { ...prev.filmGrain, size: sz },
                                }))
                              }
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                colorGrading.filmGrain.size === sz
                                  ? "bg-[#383c4a] text-white shadow"
                                  : "text-white/40 hover:text-white"
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- VIEW 4: DEDICATED REMOVE BACKGROUND VIEW (ai-background-remover) --- */}
            {activeSideTab === "remove-bg" && (
              <div className="space-y-4 animate-fade-in">
                {/* Model Selector Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                      {copy.common.model}
                    </span>
                    <span className="text-[10px] font-bold text-[#a3e635] bg-[#84cc16]/15 px-2 py-0.5 rounded-md">
                      {copy.removeBg.credit}
                    </span>
                  </div>

                  <div className="bg-[#2d313d] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center flex-shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {copy.removeBg.modelName}
                      </h4>
                      <p className="text-[11px] text-white/50">
                        ai-background-remover
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transparency Preview Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {copy.removeBg.targetPreview}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {copy.removeBg.alphaMatte}
                    </span>
                  </div>

                  <div
                    className="w-full h-44 rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #1c1f26 25%, transparent 25%), linear-gradient(-45deg, #1c1f26 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1f26 75%), linear-gradient(-45deg, transparent 75%, #1c1f26 75%)`,
                      backgroundSize: "14px 14px",
                      backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
                    }}
                  >
                    {currentImageUrl && (
                      <img
                        src={currentImageUrl}
                        alt="Current input"
                        className="max-h-full max-w-full object-contain drop-shadow-md"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-[#a3e635] font-bold">✓</span>
                      <span>
                        {copy.removeBg.feature1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-[#a3e635] font-bold">✓</span>
                      <span>{copy.removeBg.feature2}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- VIEW 5: DEDICATED EXPAND IMAGE VIEW (ai-image-extension) --- */}
            {activeSideTab === "expand-crop" && (
              <div className="space-y-4 animate-fade-in">
                {/* Model Selector Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                      {copy.common.model}
                    </span>
                    <span className="text-[10px] font-bold text-[#a3e635] bg-[#84cc16]/15 px-2 py-0.5 rounded-md">
                      {copy.expandCrop.credit}
                    </span>
                  </div>

                  <div className="bg-[#2d313d] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center flex-shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <polyline points="21 15 21 21 15 21" />
                        <polyline points="3 9 3 3 9 3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {copy.expandCrop.modelName}
                      </h4>
                      <p className="text-[11px] text-white/50">
                        ai-image-extension
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Outpaint Expansion Canvas Preview Card */}
                <div className="bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {copy.expandCrop.canvasPreview}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {copy.expandCrop.boundaryOutpainting}
                    </span>
                  </div>

                  <div className="w-full h-44 rounded-2xl overflow-hidden relative flex items-center justify-center border border-dashed border-[#84cc16]/50 bg-[#161822] p-4">
                    {/* Corner Guides */}
                    <div className="absolute top-2 left-2 text-[#84cc16] text-[10px] font-mono">
                      {'↖ ' + copy.expandCrop.expand}
                    </div>
                    <div className="absolute top-2 right-2 text-[#84cc16] text-[10px] font-mono">
                      {'↗ ' + copy.expandCrop.expand}
                    </div>
                    <div className="absolute bottom-2 left-2 text-[#84cc16] text-[10px] font-mono">
                      {'↙ ' + copy.expandCrop.expand}
                    </div>
                    <div className="absolute bottom-2 right-2 text-[#84cc16] text-[10px] font-mono">
                      {'↘ ' + copy.expandCrop.expand}
                    </div>

                    {currentImageUrl && (
                      <div className="relative border border-white/30 rounded-lg overflow-hidden shadow-2xl max-h-[75%] max-w-[75%]">
                        <img
                          src={currentImageUrl}
                          alt="Current input"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 ring-1 ring-white/40 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-[#a3e635] font-bold">✓</span>
                      <span>
                        {copy.expandCrop.feature1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-[#a3e635] font-bold">✓</span>
                      <span>
                        {copy.expandCrop.feature2}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- VIEW 6: TOOLS MENU --- */}
            {activeSideTab === "menu" && (
              <div className="space-y-1 mb-6">
                {sideMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSideTab(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span>{item.label}</span>
                    </div>
                    {item.isNew && (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-[#84cc16] text-black rounded-md tracking-wider">
                        {copy.menuItems.new}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Sub-Panels for Other Side Tools */}
            {activeSideTab === "edit-text" && (
              <div className="p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#a3e635]">
                  {copy.editText.heading}
                </h4>
                <input
                  type="text"
                  value={textEditPrompt}
                  onChange={(e) => setTextEditPrompt(e.target.value)}
                  placeholder={copy.editText.placeholder}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#84cc16]"
                />
                <button
                  onClick={() => handleExecuteSideTool("edit-text")}
                  disabled={isProcessing}
                  className="w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md"
                >
                  {isProcessing ? copy.editText.processing : copy.editText.run}
                </button>
              </div>
            )}

            {activeSideTab === "enhancer" && (
              <div className="p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#a3e635]">
                  {copy.enhancer.heading}
                </h4>
                <p className="text-xs text-white/60">
                  {copy.enhancer.description}
                </p>
                <button
                  onClick={() => handleExecuteSideTool("enhancer")}
                  disabled={isProcessing}
                  className="w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md"
                >
                  {isProcessing ? copy.enhancer.processing : copy.enhancer.run}
                </button>
              </div>
            )}

            {activeSideTab === "relight" && (
              <div className="p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#a3e635]">
                  {copy.relight.heading}
                </h4>
                <p className="text-xs text-white/60">
                  {copy.relight.description}
                </p>
                <button
                  onClick={() => handleExecuteSideTool("relight")}
                  disabled={isProcessing}
                  className="w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md"
                >
                  {isProcessing ? copy.relight.processing : copy.relight.run}
                </button>
              </div>
            )}

            {activeSideTab === "angles" && (
              <div className="p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#a3e635]">
                  {copy.angles.heading}
                </h4>
                <p className="text-xs text-white/60">
                  {copy.angles.description}
                </p>
                <button
                  onClick={() => handleExecuteSideTool("angles")}
                  disabled={isProcessing}
                  className="w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md"
                >
                  {isProcessing ? copy.angles.processing : copy.angles.run}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 bg-[#242833] border-t border-white/10 flex flex-col gap-2">
            {activeSideTab === "layer-decomposition" ? (
              <button
                onClick={() => handleDecompose()}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>{copy.footer.decomposing.replace('{progress}', progress)}</span>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                    </svg>
                    <span>{copy.footer.separateLayers.replace('{count}', layerCount > 4 ? 12 : 8)}</span>
                  </>
                )}
              </button>
            ) : activeSideTab === "upscale" ? (
              <button
                onClick={handleRunUpscale}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>{copy.footer.upscaling.replace('{progress}', progress)}</span>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                    </svg>
                    <span>
                      {copy.footer.upscaleCost.replace(
                        '{cost}',
                        upscaleModel === "seedvr2-image-upscale" ? "0.02" : "1.0",
                      )}
                    </span>
                  </>
                )}
              </button>
            ) : activeSideTab === "color-grading" ? (
              <div className="flex items-center gap-2.5 w-full">
                <button
                  onClick={handleResetAllColorGrading}
                  className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-all border border-white/10 hover:border-white/20 flex-shrink-0"
                  title={copy.colorGrading.resetAll}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>

                <button
                  onClick={handleDownloadGradedImage}
                  className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            ) : activeSideTab === "remove-bg" ? (
              <button
                onClick={handleRunRemoveBg}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>{copy.footer.removingBackground.replace('{progress}', progress)}</span>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                    </svg>
                    <span>{copy.footer.removeBackgroundCost}</span>
                  </>
                )}
              </button>
            ) : activeSideTab === "expand-crop" ? (
              <button
                onClick={handleRunExpand}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>{copy.footer.expandingBorders.replace('{progress}', progress)}</span>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                    </svg>
                    <span>{copy.footer.expandImageCost}</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
