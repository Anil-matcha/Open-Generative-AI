"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactHotToast = require("react-hot-toast");
var _fi = require("react-icons/fi");
var _reactflow = require("reactflow");
var _axios = _interopRequireDefault(require("axios"));
var _AudioPlayer = _interopRequireDefault(require("./AudioPlayer"));
var _VideoPlayer = _interopRequireDefault(require("./VideoPlayer"));
var _io = require("react-icons/io5");
var _utility = require("./utility");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var UploadNode = function UploadNode(_ref) {
  var id = _ref.id,
    data = _ref.data,
    formValues = _ref.formValues,
    setFormValues = _ref.setFormValues,
    selectedModel = _ref.selectedModel,
    loading = _ref.loading,
    uploadType = _ref.uploadType,
    acceptType = _ref.acceptType;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    uploading = _useState2[0],
    setUploading = _useState2[1];
  var _useState3 = (0, _react.useState)(0),
    _useState4 = _slicedToArray(_useState3, 2),
    uploadProgress = _useState4[0],
    setUploadProgress = _useState4[1];
  var _useState5 = (0, _react.useState)({
      width: 0,
      height: 0,
      size: null
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    imageMetadata = _useState6[0],
    setImageMetadata = _useState6[1];
  var videoRef = (0, _react.useRef)(null);
  var prevFormValues = (0, _react.useRef)(formValues);
  var handleDrop = function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e);
  };
  var handleFileUpload = function handleFileUpload(e) {
    var _e$dataTransfer;
    var file = null;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    } else {
      return;
    }
    var acceptedTypes = [];
    if (acceptType === "image") {
      acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    } else if (acceptType === "video") {
      acceptedTypes = ["video/mp4", "video/webm"];
    } else if (acceptType === "audio") {
      acceptedTypes = ["audio/mpeg", "audio/wav", "audio/webm"];
    }
    var type = file.type.startsWith("video") ? "video_url" : file.type.startsWith("image") ? "image_url" : "audio_url";
    if (!acceptedTypes.includes(file.type)) {
      _reactHotToast.toast.error("Please upload a valid ".concat(acceptType, " file"));
      return;
    }
    ;
    setUploading(true);
    _axios["default"].get("/api/upload-file", {
      params: {
        filename: file.name,
        type: file.type
      }
    }).then(function (response) {
      var _response$data = response.data,
        putUrl = _response$data.putUrl,
        publicUrl = _response$data.publicUrl;
      _axios["default"].put(putUrl, file, {
        headers: {
          "Content-Type": file.type
        },
        onUploadProgress: function onUploadProgress(progressEvent) {
          var percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      }).then(function () {
        setFormValues(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, type, publicUrl));
        });
        setTimeout(function () {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      });
    })["catch"](function (error) {
      var _error$response;
      console.error("Upload failed", error);
      _reactHotToast.toast.error("Upload failed.", error === null || error === void 0 || (_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.data);
      setUploading(false);
      setUploadProgress(0);
    });
  };
  var handleDragOver = function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleTextChange = function handleTextChange(e) {
    var textValue = e.target.value;
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: textValue
      });
    });
  };
  var handleWorkflowInputChange = function handleWorkflowInputChange(e) {
    var workflowInputValue = e.target.checked;
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        is_workflow_input: workflowInputValue
      });
    });
  };
  var removeData = function removeData() {
    var key = acceptType === "image" ? "image_url" : acceptType === "video" ? "video_url" : "audio_url";
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, null));
    });
  };
  var imageUrl = acceptType === "image" ? formValues.image_url || null : null;

  // Probe image dimensions / size only when the URL actually changes. Keeping
  // this in its own effect (keyed on the URL, not `data`) is what stops the
  // HEAD-request flood that exhausted the browser (ERR_INSUFFICIENT_RESOURCES).
  (0, _react.useEffect)(function () {
    if (acceptType !== "image") return;
    if (!imageUrl) {
      setImageMetadata({
        width: 0,
        height: 0,
        size: null
      });
      return;
    }
    var cancelled = false;
    var img = new Image();
    img.onload = function () {
      if (cancelled) return;
      setImageMetadata(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      });
    };
    img.src = imageUrl;
    fetch(imageUrl, {
      method: 'HEAD'
    }).then(function (res) {
      if (cancelled) return;
      var size = res.headers.get('content-length');
      setImageMetadata(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          size: size ? (parseInt(size) / (1024 * 1024)).toFixed(2) + ' MB' : null
        });
      });
    })["catch"](function () {
      if (!cancelled) setImageMetadata(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          size: null
        });
      });
    });
    return function () {
      cancelled = true;
    };
  }, [imageUrl, acceptType]);

  // Propagate this node's value to the parent. `data` is intentionally NOT a
  // dependency: the parent recreates the node's `data` object on every
  // onDataChange, so depending on it re-ran this effect forever (the source of
  // the white-screen React #185 loop). A stable, key-order-independent compare
  // ensures we only emit when the content really changed.
  (0, _react.useEffect)(function () {
    var _data$onDataChange;
    var outputs, resultUrl;
    if (acceptType === "image") {
      resultUrl = formValues.image_url || null;
      outputs = [{
        type: "image_url",
        value: resultUrl
      }];
    } else if (acceptType === "video") {
      resultUrl = formValues.video_url || null;
      outputs = [{
        type: "video_url",
        value: resultUrl
      }];
    } else if (acceptType === "audio") {
      resultUrl = formValues.audio_url || null;
      outputs = [{
        type: "audio_url",
        value: resultUrl
      }];
    } else {
      resultUrl = formValues.prompt || "";
      outputs = [{
        type: "text",
        value: resultUrl
      }];
    }
    if ((0, _utility.stableStringify)(prevFormValues.current) === (0, _utility.stableStringify)(formValues)) return;
    prevFormValues.current = formValues;
    data === null || data === void 0 || (_data$onDataChange = data.onDataChange) === null || _data$onDataChange === void 0 || _data$onDataChange.call(data, id, {
      selectedModel: selectedModel,
      formValues: formValues,
      loading: loading,
      outputs: outputs,
      resultUrl: resultUrl
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, selectedModel, loading, id, acceptType]);
  var hasFileUrl = (formValues === null || formValues === void 0 ? void 0 : formValues.image_url) || (formValues === null || formValues === void 0 ? void 0 : formValues.video_url) || (formValues === null || formValues === void 0 ? void 0 : formValues.audio_url);
  var textareaRef = (0, _react.useRef)(null);

  // Референс-теги: если этот текст-нод кормит видео/изображение-ноду, к которой
  // подключён Персонаж, показываем кликабельный чип @Имя с миниатюрой лица.
  // Клик вставляет @Имя в промпт (как в Студии Креаторов).
  var rfEdges = (0, _reactflow.useStore)(function (s) {
    return s.edges;
  });
  var rfNodes = (0, _reactflow.useStore)(function (s) {
    return s.nodeInternals;
  });
  var characterTags = (0, _react.useMemo)(function () {
    if (uploadType !== "text") return [];
    var nodesArr = rfNodes ? Array.from(rfNodes.values()) : [];
    // Ноды, которые кормит этот текст-нод (его промпт).
    var fedTargets = rfEdges.filter(function (e) {
      return e.source === id;
    }).map(function (e) {
      return e.target;
    });
    var targetSet = new Set(fedTargets.filter(function (tid) {
      var n = nodesArr.find(function (nn) {
        return nn.id === tid;
      });
      return (n === null || n === void 0 ? void 0 : n.type) === "videoNode" || (n === null || n === void 0 ? void 0 : n.type) === "imageNode";
    }));
    if (!targetSet.size) return [];
    // Персонаж-ноды, подключённые к тем же целям.
    var charIds = new Set(rfEdges.filter(function (e) {
      return targetSet.has(e.target);
    }).map(function (e) {
      return e.source;
    }).filter(function (sid) {
      var _nodesArr$find;
      return ((_nodesArr$find = nodesArr.find(function (nn) {
        return nn.id === sid;
      })) === null || _nodesArr$find === void 0 ? void 0 : _nodesArr$find.type) === "characterNode";
    }));
    var tags = [];
    var _iterator = _createForOfIteratorHelper(charIds),
      _step;
    try {
      var _loop = function _loop() {
        var _cnode$data;
        var cid = _step.value;
        var cnode = nodesArr.find(function (nn) {
          return nn.id === cid;
        });
        var fv = (cnode === null || cnode === void 0 || (_cnode$data = cnode.data) === null || _cnode$data === void 0 ? void 0 : _cnode$data.formValues) || {};
        var name = (fv.character_name || "лицо").trim();
        var thumb = fv.character_photo || fv.face_thumbnail || null;
        tags.push({
          id: cid,
          name: name,
          thumb: thumb
        });
      };
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return tags;
  }, [rfEdges, rfNodes, id, uploadType]);
  var insertCharTag = function insertCharTag(name) {
    var _ta$selectionStart, _ta$selectionEnd;
    var token = "@" + String(name || "лицо").trim().replace(/\s+/g, "_") + " ";
    var ta = textareaRef.current;
    var cur = (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "";
    if (!ta) {
      setFormValues(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          prompt: cur + token
        });
      });
      return;
    }
    var start = (_ta$selectionStart = ta.selectionStart) !== null && _ta$selectionStart !== void 0 ? _ta$selectionStart : cur.length;
    var end = (_ta$selectionEnd = ta.selectionEnd) !== null && _ta$selectionEnd !== void 0 ? _ta$selectionEnd : cur.length;
    var next = cur.slice(0, start) + token + cur.slice(end);
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: next
      });
    });
    requestAnimationFrame(function () {
      ta.focus();
      var pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };
  (0, _react.useEffect)(function () {
    var textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      var scrollHeight = textarea.scrollHeight;
      textarea.style.height = "".concat(Math.max(scrollHeight, 240), "px");
    }
  }, [formValues === null || formValues === void 0 ? void 0 : formValues.prompt]);
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col w-full flex-1 overflow-hidden rounded-b-2xl h-full"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center w-full h-full flex-1"
  }, uploadType === "text" ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col w-full h-full gap-1.5"
  }, characterTags.length > 0 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, characterTags.map(function (t) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      key: t.id,
      type: "button",
      onClick: function onClick() {
        return insertCharTag(t.name);
      },
      title: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C @".concat(t.name, " \u0432 \u043F\u0440\u043E\u043C\u043F\u0442"),
      className: "flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 transition-colors"
    }, t.thumb ? /*#__PURE__*/_react["default"].createElement("img", {
      src: t.thumb,
      alt: t.name,
      className: "w-7 h-7 rounded-md object-cover flex-shrink-0"
    }) : /*#__PURE__*/_react["default"].createElement("span", {
      className: "w-7 h-7 rounded-md bg-purple-500/20 flex items-center justify-center text-[12px] flex-shrink-0"
    }, "\uD83D\uDE42"), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px]"
    }, "@", t.name));
  })), /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: textareaRef,
    className: "bg-transparent border border-gray-800 w-full h-full max-h-96 p-2 text-xs text-white resize-none overflow-y-auto custom-scrollbar",
    placeholder: "Enter your text prompt here...",
    value: (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "",
    onChange: handleTextChange
  })) : uploadType === "upload" && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center w-full h-full relative",
    onDragOver: handleDragOver,
    onDrop: handleDrop
  }, uploading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col justify-center gap-2 w-full h-full max-w-[95%]"
  }, /*#__PURE__*/_react["default"].createElement("h4", {
    className: "text-xs text-white"
  }, "Uploading... ", uploadProgress, "%"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full bg-gray-100 rounded h-1 overflow-hidden"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "bg-blue-500 h-full",
    style: {
      width: "".concat(uploadProgress, "%")
    }
  }))) : hasFileUrl ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex-1 w-full h-full group z-0"
  }, formValues !== null && formValues !== void 0 && formValues.video_url ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative w-full h-full"
  }, /*#__PURE__*/_react["default"].createElement(_VideoPlayer["default"], {
    src: formValues === null || formValues === void 0 ? void 0 : formValues.video_url,
    accentColor: "#f97316"
  })) : formValues !== null && formValues !== void 0 && formValues.image_url ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative w-full h-full group/image"
  }, /*#__PURE__*/_react["default"].createElement("img", {
    src: formValues === null || formValues === void 0 ? void 0 : formValues.image_url,
    alt: "Uploaded",
    className: "w-full h-full object-contain"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-0.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-white/50 uppercase tracking-tighter font-semibold"
  }, "Dimensions"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-white font-medium tabular-nums"
  }, imageMetadata.width, " \xD7 ", imageMetadata.height)), imageMetadata.size && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-end gap-0.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-white/50 uppercase tracking-tighter font-semibold"
  }, "File Size"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-white font-medium tabular-nums"
  }, imageMetadata.size))))) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full h-full relative group/audio flex flex-col items-center justify-center"
  }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
    nodeId: id,
    src: formValues === null || formValues === void 0 ? void 0 : formValues.audio_url,
    className: "flex flex-col items-center justify-center px-5 py-4 w-full h-full relative group transition-all duration-500 select-none bg-black/10 rounded-b-2xl"
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    className: "text-white hover:text-red-500 bg-black/40 hover:bg-black cursor-pointer absolute left-4 top-4 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-300",
    onClick: removeData
  }, "\u2715")) : /*#__PURE__*/_react["default"].createElement("label", {
    style: {
      minHeight: 200
    },
    className: "cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400 border border-dashed border-gray-600 rounded-lg p-4 w-full flex-1 hover:bg-gray-700/50 h-full"
  }, "                ", /*#__PURE__*/_react["default"].createElement(_fi.FiUpload, {
    size: 20
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs capitalize"
  }, "Upload ", acceptType), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-gray-500"
  }, "Hint: drag and drop file(s) here."), /*#__PURE__*/_react["default"].createElement("input", {
    type: "file",
    accept: acceptType === "image" ? "image/*" : acceptType === "video" ? "video/*" : "audio/*",
    className: "hidden",
    onChange: handleFileUpload
  })))));
};
var _default = exports["default"] = UploadNode;