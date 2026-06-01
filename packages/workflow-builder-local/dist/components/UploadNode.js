"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactHotToast = require("react-hot-toast");
var _fi = require("react-icons/fi");
var _axios = _interopRequireDefault(require("axios"));
var _AudioPlayer = _interopRequireDefault(require("./AudioPlayer"));
var _VideoPlayer = _interopRequireDefault(require("./VideoPlayer"));
var _io = require("react-icons/io5");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
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
    var uploadFormData = new FormData();
    uploadFormData.append("file", file);
    _axios["default"].post("/api/upload-file", uploadFormData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: function onUploadProgress(progressEvent) {
        var percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
        setUploadProgress(percentCompleted);
      }
    }).then(function (response) {
      var uploadedUrl = response.data.url;
      setFormValues(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, type, uploadedUrl));
      });
      setTimeout(function () {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
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
  (0, _react.useEffect)(function () {
    var outputs = [{
      type: "",
      value: null
    }];
    var resultUrl;
    if (acceptType === "image") {
      outputs = [{
        type: "image_url",
        value: formValues.image_url ? formValues.image_url : null
      }];
      resultUrl = formValues.image_url ? formValues.image_url : null;
    } else if (acceptType === "video") {
      outputs = [{
        type: "video_url",
        value: formValues.video_url ? formValues.video_url : null
      }];
      resultUrl = formValues.video_url ? formValues.video_url : null;
    } else if (acceptType === "audio") {
      outputs = [{
        type: "audio_url",
        value: formValues.audio_url ? formValues.audio_url : null
      }];
      resultUrl = formValues.audio_url ? formValues.audio_url : null;
    } else {
      outputs = [{
        type: "text",
        value: formValues.prompt ? formValues.prompt : ""
      }];
      resultUrl = formValues.prompt ? formValues.prompt : "";
    }
    ;
    if (acceptType === "image" && resultUrl) {
      var img = new Image();
      img.onload = function () {
        setImageMetadata(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, {
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        });
      };
      img.src = resultUrl;
      fetch(resultUrl, {
        method: 'HEAD'
      }).then(function (res) {
        var size = res.headers.get('content-length');
        if (size) {
          var sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(2);
          setImageMetadata(function (prev) {
            return _objectSpread(_objectSpread({}, prev), {}, {
              size: sizeInMB + ' MB'
            });
          });
        } else {
          setImageMetadata(function (prev) {
            return _objectSpread(_objectSpread({}, prev), {}, {
              size: null
            });
          });
        }
      })["catch"](function () {
        setImageMetadata(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, {
            size: null
          });
        });
      });
    } else if (acceptType === "image") {
      setImageMetadata({
        width: 0,
        height: 0,
        size: null
      });
    }

    // if (!data.formValues) return;
    var incoming = JSON.stringify(prevFormValues.current);
    var current = JSON.stringify(formValues);
    if (incoming === current) return;
    prevFormValues.current = formValues;
    if (data !== null && data !== void 0 && data.onDataChange) {
      data === null || data === void 0 || data.onDataChange(id, {
        selectedModel: selectedModel,
        formValues: formValues,
        loading: loading,
        outputs: outputs,
        resultUrl: resultUrl
      });
    }
  }, [formValues, selectedModel, loading, id, data, acceptType]);
  var hasFileUrl = (formValues === null || formValues === void 0 ? void 0 : formValues.image_url) || (formValues === null || formValues === void 0 ? void 0 : formValues.video_url) || (formValues === null || formValues === void 0 ? void 0 : formValues.audio_url);
  var textareaRef = (0, _react.useRef)(null);
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
  }, uploadType === "text" ? /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: textareaRef,
    className: "bg-transparent border border-gray-800 w-full h-full max-h-96 p-2 text-xs text-white resize-none overflow-y-auto custom-scrollbar",
    placeholder: "Enter your text prompt here...",
    value: (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "",
    onChange: handleTextChange
  }) : uploadType === "upload" && /*#__PURE__*/_react["default"].createElement("div", {
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