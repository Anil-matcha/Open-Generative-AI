import React, { useState, useEffect, useRef } from "react";
import { uploadFile, generateI2I } from "../muapi.js";

export default function DrawModal({
  isOpen,
  onClose,
  apiKey,
  batchSize = 1,
  onAddHistoryItem,
}) {
  const [activeTab, setActiveTab] = useState("draw-to-edit"); // 'sketch-to-video' | 'draw-to-video' | 'draw-to-edit'
  const [viewState, setViewState] = useState("setup"); // 'setup' | 'canvas'
  const [bgImageUrl, setBgImageUrl] = useState(null); // Image dataURL or src
  const [aspectRatio, setAspectRatio] = useState("16:9"); // '16:9' | '1:1' | 'Auto'
  const [selectedModel, setSelectedModel] = useState("nano-banana-pro-edit"); // 'nano-banana-2-edit' | 'nano-banana-pro-edit'
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isArDropdownOpen, setIsArDropdownOpen] = useState(false);
  const [promptText, setPromptText] = useState("Edit the image based on the drawing overlay"); // text prompt for generation

  // Drawing Tools
  const [activeTool, setActiveTool] = useState("pencil"); // 'pointer' | 'pencil' | 'eraser' | 'rect' | 'arrow' | 'text' | 'image'
  const [brushColor, setBrushColor] = useState("#eab308"); // default yellow
  const [brushSize, setBrushSize] = useState(5);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);

  // Unified Object-based Canvas state
  const [canvasObjects, setCanvasObjects] = useState([]); // [{id, type, points, x, y, width, height, color, brushSize}]
  const [selectedObjectId, setSelectedObjectId] = useState(null);

  // History Undo/Redo stack for objects
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvas Dimensions State
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 450,
  });
  const [generating, setGenerating] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const drawingState = useRef({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    activePoints: [],
  });

  const fileInputRef = useRef(null);
  const insertImageInputRef = useRef(null);
  const [isBgDragging, setIsBgDragging] = useState(false);
  const bgDragCounterRef = useRef(0);
  const [isOverlayDragging, setIsOverlayDragging] = useState(false);
  const overlayDragCounterRef = useRef(0);
  const modelDropdownRef = useRef(null);
  const arDropdownRef = useRef(null);

  // Predefined colors for drawing toolbar (rendered inline now)
  const PRESET_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#ffffff", // White
    "#000000", // Black
  ];

  const handleSelectTool = (tool) => {
    setActiveTool(tool);
    setSelectedObjectId(null);
  };

  // Adjust container clicks to close open menus
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target)
      ) {
        setIsModelDropdownOpen(false);
      }
      if (arDropdownRef.current && !arDropdownRef.current.contains(e.target)) {
        setIsArDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Keep refs to latest handlers to avoid stale closures in keyboard shortcut listener
  const keyboardCallbacksRef = useRef({});

  // Keyboard shortcuts event listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Ignore shortcuts if writing in an input, textarea or contenteditable element
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && key === "z") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleUndo?.();
      } else if ((e.ctrlKey || e.metaKey) && key === "y") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleRedo?.();
      }
      // Delete Selected Object
      else if (key === "delete" || key === "backspace") {
        if (keyboardCallbacksRef.current.selectedObjectId) {
          e.preventDefault();
          keyboardCallbacksRef.current.handleRemoveSelected?.();
        }
      }
      // Toolbar selections
      else if (key === "v" || key === "1") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleSelectTool?.("pointer");
      } else if (key === "b" || key === "2") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleSelectTool?.("pencil");
      } else if (key === "e" || key === "3") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleSelectTool?.("eraser");
      } else if (key === "r" || key === "4") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleSelectTool?.("rect");
      } else if (key === "a" || key === "5") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleSelectTool?.("arrow");
      } else if (key === "t" || key === "6") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleSelectTool?.("text");
      } else if (key === "i" || key === "7") {
        e.preventDefault();
        keyboardCallbacksRef.current.handleInsertImageClick?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Save history state
  const saveStateToHistory = (newObjects) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(newObjects);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
    setCanUndo(nextHistory.length > 1);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      setCanvasObjects(history[nextIdx]);
      setSelectedObjectId(null);
      setCanUndo(nextIdx > 0);
      setCanRedo(true);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setCanvasObjects(history[nextIdx]);
      setSelectedObjectId(null);
      setCanUndo(true);
      setCanRedo(nextIdx < history.length - 1);
    }
  };

  // Initialize Canvas
  useEffect(() => {
    if (viewState !== "canvas") return;

    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext("2d");
    const bgCtx = bgCanvas.getContext("2d");

    const initCanvas = (img) => {
      // Canvas always matches the image's natural dimensions (aspect ratio dropdown is for AI output only)
      let width, height;

      if (img) {
        const maxW = 800;
        const maxH = 800;
        const imgW = img.naturalWidth || img.width || 800;
        const imgH = img.naturalHeight || img.height || 600;
        const scale = Math.min(maxW / imgW, maxH / imgH, 1);
        width  = Math.round(imgW * scale);
        height = Math.round(imgH * scale);
      } else {
        // Blank canvas: default 800×600
        width  = 800;
        height = 600;
      }

      canvas.width = width;
      canvas.height = height;
      bgCanvas.width = width;
      bgCanvas.height = height;

      // Draw background image if exists, else white background
      if (img) {
        bgCtx.drawImage(img, 0, 0, width, height);
      } else {
        bgCtx.fillStyle = "#ffffff";
        bgCtx.fillRect(0, 0, width, height);
      }

      // Reset drawing canvases
      ctx.clearRect(0, 0, width, height);

      setCanvasDimensions({ width, height });
      setHistory([[]]);
      setHistoryIdx(0);
      setCanvasObjects([]);
      setSelectedObjectId(null);
      setCanUndo(false);
      setCanRedo(false);
    };

    if (bgImageUrl) {
      const img = new Image();
      img.onload = () => {
        initCanvas(img);
      };
      img.src = bgImageUrl;
    } else {
      initCanvas(null);
    }
  }, [viewState, bgImageUrl]);

  // Redraw main drawing ink canvas when objects or active sketch changes
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvasObjects.forEach((obj) => {
      ctx.lineWidth = obj.brushSize || 5;
      ctx.strokeStyle = obj.color || "#eab308";
      ctx.fillStyle = obj.color || "#eab308";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (obj.type === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        const p = obj.points;
        if (p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
          }
          ctx.stroke();
        }
      } else if (obj.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        const p = obj.points;
        if (p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
          }
          ctx.stroke();
        }
      } else if (obj.type === "rect") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === "arrow") {
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(obj.x1, obj.y1);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();

        const angle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
        ctx.beginPath();
        ctx.moveTo(obj.x2, obj.y2);
        ctx.lineTo(
          obj.x2 - 15 * Math.cos(angle - Math.PI / 6),
          obj.y2 - 15 * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(obj.x2, obj.y2);
        ctx.lineTo(
          obj.x2 - 15 * Math.cos(angle + Math.PI / 6),
          obj.y2 - 15 * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    });

    // Draw temporary preview stroke if actively drawing
    if (drawingState.current.isDrawing) {
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startX = drawingState.current.startX;
      const startY = drawingState.current.startY;
      const currX = drawingState.current.currX;
      const currY = drawingState.current.currY;

      if (activeTool === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        const p = drawingState.current.activePoints;
        if (p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
          }
          ctx.stroke();
        }
      } else if (activeTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = brushSize * 2;
        const p = drawingState.current.activePoints;
        if (p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
          }
          ctx.stroke();
        }
      } else if (activeTool === "rect") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeRect(startX, startY, currX - startX, currY - startY);
      } else if (activeTool === "arrow") {
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currX, currY);
        ctx.stroke();

        const angle = Math.atan2(currY - startY, currX - startX);
        ctx.beginPath();
        ctx.moveTo(currX, currY);
        ctx.lineTo(
          currX - 15 * Math.cos(angle - Math.PI / 6),
          currY - 15 * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(currX, currY);
        ctx.lineTo(
          currX - 15 * Math.cos(angle + Math.PI / 6),
          currY - 15 * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    }
  };

  // Trigger redraw on object updates
  useEffect(() => {
    redrawCanvas();
  }, [canvasObjects, canvasDimensions, activeTool]);

  // Drawing coordinates resolver
  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Resolve touch or mouse events
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  // Click on canvas (used to detect selection or place text)
  const handleCanvasClick = (e) => {
    const pos = getCanvasMousePos(e);

    if (activeTool === "pointer") {
      // Select the clicked object (traverse backwards to select top element first)
      let foundId = null;
      for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        const bbox = getObjectBoundingBox(obj);
        if (bbox) {
          // Add 16px selection tolerance to make small sketches/lines easy to click
          const tolerance = Math.max(16, (obj.brushSize || 5) * 2);
          if (
            pos.x >= bbox.x - tolerance &&
            pos.x <= bbox.x + bbox.width + tolerance &&
            pos.y >= bbox.y - tolerance &&
            pos.y <= bbox.y + bbox.height + tolerance
          ) {
            foundId = obj.id;
            break;
          }
        }
      }
      setSelectedObjectId(foundId);
    } else if (activeTool === "text") {
      const fontSize = brushSize * 4 > 12 ? brushSize * 4 : 20;
      const newText = {
        id: Math.random().toString(36).substring(7),
        type: "text",
        text: "Type text here...",
        x: Math.round(pos.x),
        y: Math.round(pos.y),
        width: 160,
        height: Math.round(fontSize * 1.5),
        fontSize,
        color: brushColor,
      };
      const nextObjs = [...canvasObjects, newText];
      setCanvasObjects(nextObjs);
      saveStateToHistory(nextObjs);
      setSelectedObjectId(newText.id);
      setActiveTool("pointer"); // switch back to pointer to allow typing and dragging
    }
  };

  const handleStartDraw = (e) => {
    if (activeTool === "pointer" || activeTool === "text") return;
    const pos = getCanvasMousePos(e);

    drawingState.current.isDrawing = true;
    drawingState.current.startX = pos.x;
    drawingState.current.startY = pos.y;
    drawingState.current.currX = pos.x;
    drawingState.current.currY = pos.y;
    drawingState.current.activePoints = [pos];

    redrawCanvas();
  };

  const handleDrawing = (e) => {
    if (!drawingState.current.isDrawing) return;
    const pos = getCanvasMousePos(e);

    drawingState.current.currX = pos.x;
    drawingState.current.currY = pos.y;

    if (activeTool === "pencil" || activeTool === "eraser") {
      drawingState.current.activePoints.push(pos);
    }

    redrawCanvas();
  };

  const handleEndDraw = (e) => {
    if (!drawingState.current.isDrawing) return;
    drawingState.current.isDrawing = false;
    const pos = getCanvasMousePos(e);

    let newObj = null;
    const startX = drawingState.current.startX;
    const startY = drawingState.current.startY;

    if (activeTool === "pencil") {
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "pencil",
        points: drawingState.current.activePoints,
        color: brushColor,
        brushSize: brushSize,
      };
    } else if (activeTool === "eraser") {
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "eraser",
        points: drawingState.current.activePoints,
        brushSize: brushSize * 2,
      };
    } else if (activeTool === "rect") {
      const w = pos.x - startX;
      const h = pos.y - startY;
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "rect",
        x: w < 0 ? startX + w : startX,
        y: h < 0 ? startY + h : startY,
        width: Math.abs(w),
        height: Math.abs(h),
        color: brushColor,
        brushSize: brushSize,
      };
    } else if (activeTool === "arrow") {
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "arrow",
        x1: startX,
        y1: startY,
        x2: pos.x,
        y2: pos.y,
        color: brushColor,
        brushSize: brushSize,
      };
    }

    if (newObj) {
      const nextObjs = [...canvasObjects, newObj];
      setCanvasObjects(nextObjs);
      saveStateToHistory(nextObjs);
      setSelectedObjectId(newObj.id);
    }
  };

  // Helper: compute bounding box of any object type
  const getObjectBoundingBox = (obj) => {
    if (!obj) return null;
    if (obj.type === "pencil" || obj.type === "eraser") {
      const xs = obj.points.map((p) => p.x);
      const ys = obj.points.map((p) => p.y);
      if (xs.length === 0) return null;
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    if (obj.type === "rect" || obj.type === "text" || obj.type === "image") {
      return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
    }
    if (obj.type === "arrow") {
      const minX = Math.min(obj.x1, obj.x2);
      const maxX = Math.max(obj.x1, obj.x2);
      const minY = Math.min(obj.y1, obj.y2);
      const maxY = Math.max(obj.y1, obj.y2);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return null;
  };

  // Drag selected object
  const handleStartMoveSelected = (e) => {
    e.preventDefault();
    if (activeTool !== "pointer") return;
    const startX = e.clientX;
    const startY = e.clientY;

    const targetObj = canvasObjects.find((o) => o.id === selectedObjectId);
    if (!targetObj) return;

    const origObj = JSON.parse(JSON.stringify(targetObj));

    const handleMove = (moveEvent) => {
      if (!canvasWrapperRef.current) return;
      const rect = canvasWrapperRef.current.getBoundingClientRect();
      const scaleX = canvasDimensions.width / rect.width;
      const scaleY = canvasDimensions.height / rect.height;

      const dx = (moveEvent.clientX - startX) * scaleX;
      const dy = (moveEvent.clientY - startY) * scaleY;

      setCanvasObjects((prev) =>
        prev.map((o) => {
          if (o.id !== selectedObjectId) return o;
          if (o.type === "pencil" || o.type === "eraser") {
            return {
              ...o,
              points: origObj.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }
          if (o.type === "rect" || o.type === "text" || o.type === "image") {
            return {
              ...o,
              x: Math.round(origObj.x + dx),
              y: Math.round(origObj.y + dy),
            };
          }
          if (o.type === "arrow") {
            return {
              ...o,
              x1: Math.round(origObj.x1 + dx),
              y1: Math.round(origObj.y1 + dy),
              x2: Math.round(origObj.x2 + dx),
              y2: Math.round(origObj.y2 + dy),
            };
          }
          return o;
        }),
      );
    };

    const handleMoveEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleMoveEnd);
      saveStateToHistory(canvasObjects);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleMoveEnd);
  };

  // Resize selected object using corner handles
  const handleStartResizeSelected = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;

    const targetObj = canvasObjects.find((o) => o.id === selectedObjectId);
    if (!targetObj) return;

    const origObj = JSON.parse(JSON.stringify(targetObj));
    const origBbox = getObjectBoundingBox(origObj);

    const handleResize = (moveEvent) => {
      if (!canvasWrapperRef.current) return;
      const rect = canvasWrapperRef.current.getBoundingClientRect();
      const scaleX = canvasDimensions.width / rect.width;
      const scaleY = canvasDimensions.height / rect.height;

      const dx = (moveEvent.clientX - startX) * scaleX;
      const dy = (moveEvent.clientY - startY) * scaleY;

      setCanvasObjects((prev) =>
        prev.map((o) => {
          if (o.id !== selectedObjectId) return o;

          if (o.type === "rect" || o.type === "text" || o.type === "image") {
            let newX = origObj.x;
            let newY = origObj.y;
            let newW = origObj.width;
            let newH = origObj.height;

            if (direction.includes("l")) {
              newX = origObj.x + dx;
              newW = origObj.width - dx;
            }
            if (direction.includes("r")) {
              newW = origObj.width + dx;
            }
            if (direction.includes("t")) {
              newY = origObj.y + dy;
              newH = origObj.height - dy;
            }
            if (direction.includes("b")) {
              newH = origObj.height + dy;
            }

            return {
              ...o,
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.max(15, Math.round(newW)),
              height: Math.max(15, Math.round(newH)),
            };
          }
          if (o.type === "arrow") {
            let newX1 = origObj.x1;
            let newY1 = origObj.y1;
            let newX2 = origObj.x2;
            let newY2 = origObj.y2;

            if (direction.includes("t") || direction.includes("l")) {
              newX1 = origObj.x1 + dx;
              newY1 = origObj.y1 + dy;
            }
            if (direction.includes("b") || direction.includes("r")) {
              newX2 = origObj.x2 + dx;
              newY2 = origObj.y2 + dy;
            }

            return {
              ...o,
              x1: Math.round(newX1),
              y1: Math.round(newY1),
              x2: Math.round(newX2),
              y2: Math.round(newY2),
            };
          }
          if (o.type === "pencil" || o.type === "eraser") {
            // Scale vector points relative to bounding box scale changes
            const wScale = (origBbox.width + dx) / origBbox.width;
            const hScale = (origBbox.height + dy) / origBbox.height;
            return {
              ...o,
              points: origObj.points.map((p) => ({
                x: origBbox.x + (p.x - origBbox.x) * wScale,
                y: origBbox.y + (p.y - origBbox.y) * hScale,
              })),
            };
          }
          return o;
        }),
      );
    };

    const handleResizeEnd = () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
      saveStateToHistory(canvasObjects);
    };

    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", handleResizeEnd);
  };

  // Remove the currently selected drawing object
  const handleRemoveSelected = () => {
    if (selectedObjectId) {
      const nextObjs = canvasObjects.filter((o) => o.id !== selectedObjectId);
      setCanvasObjects(nextObjs);
      saveStateToHistory(nextObjs);
      setSelectedObjectId(null);
    }
  };

  // Listen for brush property changes and update selected text/shape colors or sizes
  useEffect(() => {
    if (selectedObjectId) {
      setCanvasObjects((prev) =>
        prev.map((o) => {
          if (o.id !== selectedObjectId) return o;
          const updates = {};
          if (o.type === "text" || o.type === "rect" || o.type === "arrow") {
            updates.color = brushColor;
          }
          return { ...o, ...updates };
        }),
      );
    }
  }, [brushColor]);

  useEffect(() => {
    if (selectedObjectId) {
      setCanvasObjects((prev) =>
        prev.map((o) => {
          if (o.id !== selectedObjectId) return o;
          const updates = {};
          if (o.type === "text") {
            updates.fontSize = brushSize * 4 > 12 ? brushSize * 4 : 20;
            updates.height = Math.round(updates.fontSize * 1.5);
          } else if (o.type === "rect" || o.type === "arrow") {
            // Only update shapes (not pencil/eraser — those are pixel-based strokes.
            // Retroactively resizing an eraser stroke would cause erased content to reappear.)
            updates.brushSize = brushSize;
          }
          return { ...o, ...updates };
        }),
      );
    }
  }, [brushSize]);

  // Upload background file
  const handleUploadBg = (filesOrEvent) => {
    const files = Array.isArray(filesOrEvent)
      ? filesOrEvent
      : Array.from(filesOrEvent?.target?.files || []);
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBgImageUrl(event.target.result);
      setAspectRatio("Auto");
      setViewState("canvas");
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop handlers for the background upload dropzone
  const handleBgDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    bgDragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsBgDragging(true);
    }
  };

  const handleBgDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    bgDragCounterRef.current -= 1;
    if (bgDragCounterRef.current <= 0) {
      bgDragCounterRef.current = 0;
      setIsBgDragging(false);
    }
  };

  const handleBgDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBgDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    bgDragCounterRef.current = 0;
    setIsBgDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleUploadBg(Array.from(files));
    }
  };

  // Insert Overlay image
  const handleInsertImageClick = () => {
    insertImageInputRef.current?.click();
  };

  const handleInsertImage = (filesOrEvent) => {
    const files = Array.isArray(filesOrEvent)
      ? filesOrEvent
      : Array.from(filesOrEvent?.target?.files || []);
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const id = Math.random().toString(36).substring(7);
        const w = img.naturalWidth || img.width || 150;
        const h = img.naturalHeight || img.height || 150;

        const maxDim = 150;
        const scale = Math.min(maxDim / w, maxDim / h);
        const startW = Math.round(w * scale);
        const startH = Math.round(h * scale);

        const newImageObj = {
          id,
          type: "image",
          img,
          url: event.target.result,
          x: Math.round((canvasDimensions.width - startW) / 2),
          y: Math.round((canvasDimensions.height - startH) / 2),
          width: startW,
          height: startH,
        };

        const nextObjs = [...canvasObjects, newImageObj];
        setCanvasObjects(nextObjs);
        saveStateToHistory(nextObjs);
        setSelectedObjectId(id);
        setActiveTool("pointer");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop handlers for the insert-overlay-image tool
  const handleOverlayDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlayDragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsOverlayDragging(true);
    }
  };

  const handleOverlayDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlayDragCounterRef.current -= 1;
    if (overlayDragCounterRef.current <= 0) {
      overlayDragCounterRef.current = 0;
      setIsOverlayDragging(false);
    }
  };

  const handleOverlayDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleOverlayDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlayDragCounterRef.current = 0;
    setIsOverlayDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleInsertImage(Array.from(files));
    }
  };

  // Clear Canvas (Remove image, drawings, text overlays and reset to setup screen)
  const handleClearCanvas = () => {
    if (
      confirm(
        "Clear all drawings, text overlays, and remove the background image?",
      )
    ) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setCanvasObjects([]);
      setSelectedObjectId(null);
      saveStateToHistory([]);
      setBgImageUrl(null);
      setViewState("setup");
    }
  };

  // Merge Layers and Trigger Generation
  const handleGenerateClick = async () => {
    if (generating) return;

    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    setGenerating(true);

    try {
      const mergeCanvas = document.createElement("canvas");
      mergeCanvas.width = canvas.width;
      mergeCanvas.height = canvas.height;
      const mCtx = mergeCanvas.getContext("2d");

      // 1. Draw static background layer (preserving asynchronous image loading coordinates)
      if (bgImageUrl) {
        const bgImg = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = bgImageUrl;
        });
        mCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      } else {
        mCtx.drawImage(bgCanvas, 0, 0);
      }

      // 2. Draw overlay image objects (in lower order than drawings)
      canvasObjects
        .filter((o) => o.type === "image")
        .forEach((imgObj) => {
          mCtx.drawImage(
            imgObj.img,
            imgObj.x,
            imgObj.y,
            imgObj.width,
            imgObj.height,
          );
        });

      // 3. Draw drawing overlay layer
      mCtx.drawImage(canvas, 0, 0);

      // 4. Draw texts with wrap formatting
      canvasObjects
        .filter((o) => o.type === "text")
        .forEach((textObj) => {
          mCtx.fillStyle = textObj.color;
          mCtx.font = `bold ${textObj.fontSize}px Inter, sans-serif`;
          mCtx.textBaseline = "top";

          const words = textObj.text.split(" ");
          let line = "";
          let testY = textObj.y;
          const lineHeight = textObj.fontSize * 1.25;

          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + " ";
            let metrics = mCtx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > textObj.width && n > 0) {
              mCtx.fillText(line, textObj.x, testY);
              line = words[n] + " ";
              testY += lineHeight;
            } else {
              line = testLine;
            }
          }
          mCtx.fillText(line, textObj.x, testY);
        });

      const blob = await new Promise((resolve) =>
        mergeCanvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Canvas serialization failed");

      const uploadedUrl = await uploadFile(apiKey, blob);

      const results = await Promise.all(
        Array.from({ length: batchSize }).map(async () => {
          const genParams = {
            model: selectedModel,
            prompt: promptText.trim() || "Edit the image based on the drawing overlay",
            images_list: [uploadedUrl],
            aspect_ratio: aspectRatio === "Auto" ? "1:1" : aspectRatio,
          };
          return await generateI2I(apiKey, genParams);
        }),
      );

      results.forEach((res) => {
        if (res && res.url) {
          const entry = {
            id: res.id || Math.random().toString(36).substring(7),
            url: res.url,
            prompt: `Draw to Edit with ${selectedModel === "nano-banana-pro-edit" ? "Nano Banana Pro Edit" : "Nano Banana 2 Edit"}`,
            model: selectedModel,
            aspect_ratio: aspectRatio === "Auto" ? "1:1" : aspectRatio,
            timestamp: new Date().toISOString(),
          };
          onAddHistoryItem(entry);
        }
      });

      alert("Generations complete!");
      onClose();
    } catch (e) {
      console.error("[DrawModal] Generation failed:", e);
      alert(`Generation failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Keep keyboardCallbacksRef up-to-date every render (placed after all handlers are defined)
  keyboardCallbacksRef.current = {
    selectedObjectId,
    handleRemoveSelected,
    handleUndo,
    handleRedo,
    handleSelectTool,
    handleInsertImageClick,
  };

  if (!isOpen) return null;

  // Helper variables for outline layout
  const selectedObj = canvasObjects.find((o) => o.id === selectedObjectId);
  const bbox = getObjectBoundingBox(selectedObj);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      {/* Modal Box */}
      <div className="relative w-full max-w-5xl bg-[#0b0b0d] border border-white/10 rounded-2xl flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden h-[90vh]">
        {/* Header Tab Selector */}
        <div className="flex items-center justify-between border-b border-white/5 p-4 shrink-0 bg-[#0f0f12]">
          <div className="flex items-center gap-1.5 bg-[#131316]/60 border border-white/5 p-1 rounded-full select-none">
            {/* <button
              onClick={() => setActiveTab("sketch-to-video")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "sketch-to-video"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Sketch to Video
              <span className="bg-[#b5f500] text-black text-[8px] font-black px-1 rounded">
                NEW
              </span>
            </button>
            <button
              onClick={() => setActiveTab("draw-to-video")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "draw-to-video"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Draw to Video
            </button> */}
            <button
              onClick={() => setActiveTab("draw-to-edit")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "draw-to-edit"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Draw to Edit
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            ×
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar relative bg-[#070708]/30">
          {viewState === "setup" ? (
            /* Setup Card */
            <div
              onDragEnter={handleBgDragEnter}
              onDragLeave={handleBgDragLeave}
              onDragOver={handleBgDragOver}
              onDrop={handleBgDrop}
              className={`border-2 border-dashed rounded-2xl p-8 max-w-md w-full text-center flex flex-col items-center gap-6 bg-[#070708]/50 transition-colors ${
                isBgDragging
                  ? "border-[#b5f500] bg-[#b5f500]/5"
                  : "border-white/10"
              }`}
            >
              <div className="w-56 h-36 rounded-xl border border-white/5 overflow-hidden shadow-lg select-none relative bg-black/40">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif"
                  alt="Draw visual representation"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-md p-1 px-2 border border-white/5 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#b5f500] animate-pulse"></div>
                  <span className="text-[9px] text-white/50 tracking-wider uppercase font-bold">
                    Sketchpad active
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-white font-extrabold text-lg tracking-wide mb-1.5 uppercase">
                  DRAW TO EDIT
                </h2>
                <p className="text-white/40 text-xs font-medium max-w-xs leading-relaxed mx-auto">
                  From sketch to a complete picture in a second. No prompt
                  needed.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full max-w-[240px]">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-white/90 text-black font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  Upload Media
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadBg}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  onClick={() => {
                    setBgImageUrl(null);
                    setViewState("canvas");
                  }}
                  className="bg-[#131316]/80 hover:bg-[#1c1c22] text-white border border-white/10 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-inner"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  Create blank
                </button>
              </div>
            </div>
          ) : (
            /* Canvas Screen */
            <div className="flex-1 flex flex-col items-center justify-center w-full relative h-full">
              {/* Height-first container: fixes height, derives width from aspect ratio */}
              <div
                className="flex items-center justify-center w-full"
                style={{ height: "60vh", maxHeight: "60vh" }}
              >
                {/* Stacked Canvases Wrapper - width auto-derived from height via aspect-ratio */}
                <div
                  ref={canvasWrapperRef}
                  className="relative border border-white/10 shadow-2xl rounded-lg overflow-hidden bg-black select-none"
                  style={{
                    height: "100%",
                    width: "auto",
                    aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
                    maxWidth: "100%",
                  }}
                >
                  {/* Background Image Layer */}
                  <canvas
                    ref={bgCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {/* Drawing Ink Layer */}
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDrawing}
                    onMouseUp={handleEndDraw}
                    onMouseLeave={handleEndDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDrawing}
                    onTouchEnd={handleEndDraw}
                    className={`absolute inset-0 w-full h-full ${
                      activeTool === "pointer"
                        ? "cursor-default"
                        : "cursor-crosshair"
                    }`}
                  />

                  {/* Floating Overlay HTML Images */}
                  {canvasObjects
                    .filter((o) => o.type === "image")
                    .map((imgObj) => {
                      const leftPct = (imgObj.x / canvasDimensions.width) * 100;
                      const topPct = (imgObj.y / canvasDimensions.height) * 100;
                      const widthPct =
                        (imgObj.width / canvasDimensions.width) * 100;
                      const heightPct =
                        (imgObj.height / canvasDimensions.height) * 100;
                      const isSelected = selectedObjectId === imgObj.id;

                      return (
                        <div
                          key={imgObj.id}
                          className={`absolute group cursor-move ${isSelected ? "ring-2 ring-[#b5f500] ring-offset-1 ring-offset-black z-10" : ""}`}
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            pointerEvents:
                              activeTool === "pointer" ? "auto" : "none",
                          }}
                          onMouseDown={(e) => {
                            if (activeTool !== "pointer") return;
                            setSelectedObjectId(imgObj.id);
                            handleStartMoveSelected(e);
                          }}
                        >
                          <img
                            src={imgObj.url}
                            alt=""
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        </div>
                      );
                    })}

                  {/* Text overlays with Native Focusing and Typing */}
                  {canvasObjects
                    .filter((o) => o.type === "text")
                    .map((textObj) => {
                      const leftPct =
                        (textObj.x / canvasDimensions.width) * 100;
                      const topPct =
                        (textObj.y / canvasDimensions.height) * 100;
                      const widthPct =
                        (textObj.width / canvasDimensions.width) * 100;
                      const heightPct =
                        (textObj.height / canvasDimensions.height) * 100;
                      const isSelected = selectedObjectId === textObj.id;

                      return (
                        <textarea
                          key={textObj.id}
                          value={textObj.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCanvasObjects((prev) =>
                              prev.map((o) =>
                                o.id === textObj.id ? { ...o, text: val } : o,
                              ),
                            );
                          }}
                          onFocus={() => {
                            if (activeTool === "pointer") {
                              setSelectedObjectId(textObj.id);
                            }
                          }}
                          className={`absolute bg-transparent border-none outline-none resize-none font-bold text-left overflow-hidden select-text z-10 ${
                            isSelected
                              ? "ring-1 ring-[#b5f500] ring-dashed bg-black/25"
                              : ""
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            fontSize: `${(textObj.fontSize / canvasDimensions.height) * 100}cqh`,
                            color: textObj.color,
                            lineHeight: 1.25,
                            pointerEvents:
                              activeTool === "pointer" ? "auto" : "none",
                          }}
                        />
                      );
                    })}

                  {/* Unified Outline Handles Overlay for Selected Object */}
                  {activeTool === "pointer" && selectedObjectId && bbox && (
                    <div
                      className="absolute border border-dashed border-[#b5f500] pointer-events-auto z-20 cursor-move"
                      style={{
                        left: `${(bbox.x / canvasDimensions.width) * 100}%`,
                        top: `${(bbox.y / canvasDimensions.height) * 100}%`,
                        width: `${(bbox.width / canvasDimensions.width) * 100}%`,
                        height: `${(bbox.height / canvasDimensions.height) * 100}%`,
                      }}
                      onMouseDown={handleStartMoveSelected}
                    >
                      {/* Corner handles */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nwse-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "tl")}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nesw-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "tr")}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nesw-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "bl")}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nwse-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "br")}
                      />

                      {/* Edge handles */}
                      <div
                        className="absolute -top-1.5 left-[calc(50%-6px)] w-3 h-3 bg-white border border-[#b5f500] cursor-ns-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "t")}
                      />
                      <div
                        className="absolute -bottom-1.5 left-[calc(50%-6px)] w-3 h-3 bg-white border border-[#b5f500] cursor-ns-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "b")}
                      />
                      <div
                        className="absolute top-[calc(50%-6px)] -left-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-ew-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "l")}
                      />
                      <div
                        className="absolute top-[calc(50%-6px)] -right-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-ew-resize rounded-full"
                        onMouseDown={(e) => handleStartResizeSelected(e, "r")}
                      />
                    </div>
                  )}

                  {/* Remove Selected Button Centered at Bottom of Canvas Image */}
                  {activeTool === "pointer" && selectedObjectId && (
                    <button
                      onClick={handleRemoveSelected}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 hover:bg-black text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xl z-30 transition-all pointer-events-auto select-none"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                      Remove selected
                    </button>
                  )}
                </div>
                {/* Close height-first container */}
              </div>

              {/* Centered Drawing Toolbar */}
              <div className="mt-6 bg-[#0f0f11]/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl z-20 select-none">
                {/* Pointer tool */}
                <button
                  onClick={() => {
                    setActiveTool("pointer");
                    setSelectedObjectId(null);
                  }}
                  title="Selection pointer"
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === "pointer"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                </button>

                {/* Pencil tool */}
                <button
                  onClick={() => {
                    setActiveTool("pencil");
                    setSelectedObjectId(null);
                  }}
                  title="Draw pencil"
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === "pencil"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>

                {/* Eraser tool */}
                <button
                  onClick={() => {
                    setActiveTool("eraser");
                    setSelectedObjectId(null);
                  }}
                  title="Eraser (E)"
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === "eraser"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M20 20H7L3 16c-1-1-1-2.5 0-3.5L13 2c1-1 2.5-1 3.5 0l4 4c1 1 1 2.5 0 3.5L11 19l9 1z" />
                  </svg>
                </button>

                {/* Shape rect tool */}
                <button
                  onClick={() => {
                    setActiveTool("rect");
                    setSelectedObjectId(null);
                  }}
                  title="Rectangle shape"
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === "rect"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                </button>

                {/* Arrow tool */}
                <button
                  onClick={() => {
                    setActiveTool("arrow");
                    setSelectedObjectId(null);
                  }}
                  title="Arrow shape"
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === "arrow"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="5" y1="19" x2="19" y2="5" />
                    <polyline points="12 5 19 5 19 12" />
                  </svg>
                </button>

                {/* Text tool */}
                <button
                  onClick={() => {
                    setActiveTool("text");
                    setSelectedObjectId(null);
                  }}
                  title="Text tool"
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === "text"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <span className="text-sm font-black tracking-tight select-none px-0.5">
                    T
                  </span>
                </button>

                {/* Insert Overlay Image Tool */}
                <button
                  onClick={handleInsertImageClick}
                  onDragEnter={handleOverlayDragEnter}
                  onDragLeave={handleOverlayDragLeave}
                  onDragOver={handleOverlayDragOver}
                  onDrop={handleOverlayDrop}
                  title="Insert overlay image (or drop an image here)"
                  className={`p-1.5 rounded-lg transition-all ${
                    isOverlayDragging
                      ? "bg-[#b5f500] text-black ring-2 ring-[#b5f500]"
                      : activeTool === "image"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={insertImageInputRef}
                  onChange={handleInsertImage}
                  accept="image/*"
                  className="hidden"
                />

                <div className="h-6 w-px bg-white/10 mx-0.5" />

                {/* Inline Preset Color Selection */}
                <div className="flex items-center gap-1.5 bg-[#16161a]/60 px-2 py-1 rounded-xl border border-white/5">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      onClick={() => setBrushColor(col)}
                      className="w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform relative flex items-center justify-center"
                      style={{ backgroundColor: col }}
                    >
                      {brushColor === col && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white mix-blend-difference" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="h-6 w-px bg-white/10 mx-0.5" />

                {/* Undo */}
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-25 transition-all"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                  </svg>
                </button>

                {/* Redo */}
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-25 transition-all"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                  </svg>
                </button>

                {/* Generate Action Button */}
                <button
                  onClick={handleGenerateClick}
                  disabled={generating}
                  className="ml-1 bg-[#b5f500] hover:opacity-90 active:scale-[0.97] transition-all text-black font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#b5f500]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin inline-block">◌</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Image
                      <span className="opacity-80">✦ {batchSize}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Static Footer Control Row (Overlap Prevention) */}
        {viewState === "canvas" && (
          <div className="border-t border-white/5 p-4 shrink-0 bg-[#0f0f12] flex items-center justify-between z-20">
            {/* Left Options */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={modelDropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="h-[38px] flex items-center gap-2 px-3 bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-xs text-white/70 whitespace-nowrap shadow-xl"
                >
                  <span className="text-[10px] text-[#b5f500] font-black bg-[#b5f500]/10 px-1.5 rounded border border-[#b5f500]/25">
                    G
                  </span>
                  {selectedModel === "nano-banana-pro-edit"
                    ? "Nano Banana Pro Edit"
                    : "Nano Banana 2 Edit"}
                  <span className="opacity-45 text-[8px] ml-0.5">▼</span>
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 bg-[#0f0f12] border border-white/10 rounded-2xl p-2 w-64 shadow-2xl flex flex-col gap-1 z-30">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest p-1.5 pb-1 select-none">
                      Select model
                    </div>

                    <button
                      onClick={() => {
                        setSelectedModel("nano-banana-2-edit");
                        setIsModelDropdownOpen(false);
                      }}
                      className={`flex flex-col text-left p-2.5 rounded-xl transition-all ${
                        selectedModel === "nano-banana-2-edit"
                          ? "bg-[#b5f500]/10 text-white"
                          : "hover:bg-white/5 text-white/70"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        Nano Banana 2 Edit
                        {selectedModel === "nano-banana-2-edit" && (
                          <span className="text-[#b5f500]">✓</span>
                        )}
                      </div>
                      <div className="text-[9px] text-white/30 leading-snug mt-0.5">
                        Google's Advanced Image Editing Model
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedModel("nano-banana-pro-edit");
                        setIsModelDropdownOpen(false);
                      }}
                      className={`flex flex-col text-left p-2.5 rounded-xl transition-all ${
                        selectedModel === "nano-banana-pro-edit"
                          ? "bg-[#b5f500]/10 text-white"
                          : "hover:bg-white/5 text-white/70"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        Nano Banana Pro Edit
                        {selectedModel === "nano-banana-pro-edit" && (
                          <span className="text-[#b5f500]">✓</span>
                        )}
                      </div>
                      <div className="text-[9px] text-white/30 leading-snug mt-0.5">
                        Best 4K Image Model Ever
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Size Slider (Brush or active text font size adjustment) */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className="h-[38px] w-[38px] flex items-center justify-center bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-white/60 shadow-xl transition-all"
                  title="Adjust Brush / Font Size"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                </button>

                {showSettingsPopover && (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 bg-[#0f0f12] border border-white/10 rounded-2xl p-3.5 w-44 shadow-2xl flex flex-col gap-2 z-30">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      {selectedObj && selectedObj.type === "text"
                        ? "Text Size"
                        : "Brush Size"}
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#b5f500]"
                    />
                    <span className="text-[11px] font-bold text-white/60 text-right">
                      {brushSize}px
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Center: Prompt input (required by the API) */}
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !generating) handleGenerateClick();
              }}
              placeholder="Describe what you want to generate…"
              className="flex-1 mx-3 h-[38px] bg-[#131316]/80 border border-white/5 rounded-xl px-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-[#b5f500]/40 focus:ring-1 focus:ring-[#b5f500]/20 transition-all"
            />

            {/* Right Options */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={arDropdownRef}>
                <button
                  onClick={() => setIsArDropdownOpen(!isArDropdownOpen)}
                  className="h-[38px] flex items-center gap-2 px-3 bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-xs text-white/70 whitespace-nowrap shadow-xl"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="opacity-50"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  {aspectRatio}
                  <span className="opacity-45 text-[8px] ml-0.5">▼</span>
                </button>

                {isArDropdownOpen && (
                  <div className="absolute bottom-[calc(100%+8px)] right-0 bg-[#0f0f12] border border-white/10 rounded-xl p-2 w-36 max-h-72 overflow-y-auto shadow-2xl flex flex-col gap-1 z-30">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest p-1.5 pb-1 select-none">
                      Aspect Ratio
                    </div>
                    {["16:9", "9:16", "4:3", "3:4", "1:1", "Auto"].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setAspectRatio(r);
                          setIsArDropdownOpen(false);
                        }}
                        className={`text-left p-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                          aspectRatio === r
                            ? "bg-[#b5f500]/10 text-white"
                            : "hover:bg-white/5 text-white/70"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleClearCanvas}
                title="Clear drawings"
                className="h-[38px] w-[38px] flex items-center justify-center bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-white/60 shadow-xl transition-all"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>

              <button
                onClick={() =>
                  alert(
                    "Draw to Edit: paint directly over an image, insert overlay image/text objects, drag/resize elements, or select and delete specific components.",
                  )
                }
                title="Info"
                className="h-[38px] w-[38px] flex items-center justify-center bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-white/60 shadow-xl transition-all"
              >
                <span className="text-xs font-bold leading-none">i</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
