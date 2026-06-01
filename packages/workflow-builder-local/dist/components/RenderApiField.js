"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _image = _interopRequireDefault(require("next/image"));
var _react = _interopRequireWildcard(require("react"));
var _fa = require("react-icons/fa6");
var _fi = require("react-icons/fi");
var _reactHotToast = require("react-hot-toast");
var _AudioPlayer = _interopRequireDefault(require("./AudioPlayer"));
var _io = require("react-icons/io5");
var _reactflow = require("reactflow");
var _tb = require("react-icons/tb");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var RenderApiField = function RenderApiField(_ref) {
  var _ref2, _formValues$fieldName;
  var fieldName = _ref.fieldName,
    meta = _ref.meta,
    idx = _ref.idx,
    formValues = _ref.formValues,
    setFormValues = _ref.setFormValues,
    handleChange = _ref.handleChange,
    _ref$hasHandle = _ref.hasHandle,
    hasHandle = _ref$hasHandle === void 0 ? false : _ref$hasHandle,
    _ref$exposedHandles = _ref.exposedHandles,
    exposedHandles = _ref$exposedHandles === void 0 ? [] : _ref$exposedHandles,
    onToggleHandle = _ref.onToggleHandle;
  var _useState = (0, _react.useState)(0),
    _useState2 = _slicedToArray(_useState, 2),
    uploadProgress = _useState2[0],
    setUploadProgress = _useState2[1];
  var _useState3 = (0, _react.useState)(-1),
    _useState4 = _slicedToArray(_useState3, 2),
    dropDown = _useState4[0],
    setDropDown = _useState4[1];
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    uploading = _useState6[0],
    setUploading = _useState6[1];
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isOpeningUp = _useState8[0],
    setIsOpeningUp = _useState8[1];
  var _useState9 = (0, _react.useState)({}),
    _useState0 = _slicedToArray(_useState9, 2),
    dropdownStyle = _useState0[0],
    setDropdownStyle = _useState0[1];
  var containerRef = (0, _react.useRef)(null);
  var isImageUrl = function isImageUrl(url) {
    if (typeof url !== 'string') return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|avif|HEIC)(\?.*)?$/i) !== null || url.startsWith('https://cdn.muapi.ai/');
  };
  var isImageField = ['image', 'last_image', 'image_url'].includes(meta.field) || ['image', 'last_image', 'image_url'].includes(fieldName);
  var isImagesListField = ['images', 'image_urls', 'images_list'].includes(fieldName) || meta.field === 'images_list';
  var isVideoField = ['video', 'video_url'].includes(meta.field) || ['video', 'video_url'].includes(fieldName);
  var isAudioField = ['audio', 'audio_url'].includes(meta.field) || ['audio', 'audio_url'].includes(fieldName);
  var value = (_ref2 = (_formValues$fieldName = formValues[fieldName]) !== null && _formValues$fieldName !== void 0 ? _formValues$fieldName : meta["default"]) !== null && _ref2 !== void 0 ? _ref2 : "";
  var isRequired = meta.required || false;
  var label = /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between w-full group/label"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    htmlFor: fieldName,
    className: "text-xs font-bold text-zinc-500 text-start flex-grow cursor-pointer"
  }, fieldName, isRequired && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-blue-500 text-[9px] ml-1"
  }, "* required")), onToggleHandle && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      onToggleHandle(fieldName);
    },
    className: "p-1 rounded-lg transition-all group-hover/label:opacity-100 h-6 w-6 flex items-center justify-center ".concat(exposedHandles.includes(fieldName) ? "text-blue-500 bg-blue-500/10 opacity-100" : "text-zinc-500 hover:text-white hover:bg-white/5 opacity-0"),
    title: exposedHandles.includes(fieldName) ? "Remove input" : "Set as input"
  }, /*#__PURE__*/_react["default"].createElement(_tb.TbExternalLink, {
    size: 14
  })));
  (0, _react.useLayoutEffect)(function () {
    if (dropDown === idx + 1 && containerRef.current) {
      var rect = containerRef.current.getBoundingClientRect();
      var windowHeight = window.innerHeight;
      var spaceBelow = windowHeight - rect.bottom;
      setIsOpeningUp(spaceBelow < 200);
    }
  }, [dropDown, idx]);
  var handleFileUpload = function handleFileUpload(field, fieldSchema, e) {
    var _e$dataTransfer;
    var file = null;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    } else {
      return;
    }
    var acceptedTypes = isImageField ? ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] : isVideoField ? ["video/mp4", "video/webm"] : isAudioField ? ["audio/mpeg", "audio/wav", "audio/webm", "audio/mp3"] : ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm"];
    if (!acceptedTypes.includes(file.type)) {
      _reactHotToast.toast.error("Unsupported file type");
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
          var current = prev[field];
          var updatedValue = fieldSchema.type === 'array' ? [].concat(_toConsumableArray(current || []), [publicUrl]) : publicUrl;
          return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, field, updatedValue));
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
  var handleStyle = {
    width: 10,
    height: 10,
    transition: 'all 0.2s ease-in-out',
    background: '#3b82f6',
    border: '2px solid #fff',
    zIndex: 10,
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
  };
  if (meta["enum"]) {
    var isManual = meta.allowManual || false;
    var filteredOptions = isManual && value ? meta["enum"].filter(function (opt) {
      return (opt || "").toString().toLowerCase().includes((value || "").toString().toLowerCase());
    }) : meta["enum"];
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 w-full relative"
    }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
      type: "target",
      position: _reactflow.Position.Left,
      id: fieldName,
      style: _objectSpread(_objectSpread({}, handleStyle), {}, {
        top: '50%',
        transform: 'translateY(-50%)'
      }),
      className: "!rounded-full input-handle !left-[-17px]"
    }), label, /*#__PURE__*/_react["default"].createElement("div", {
      tabIndex: 0,
      onBlur: function onBlur(e) {
        var currentTarget = e.currentTarget;
        setTimeout(function () {
          if (currentTarget && !currentTarget.contains(document.activeElement)) {
            setDropDown(-1);
          }
        }, 100);
      },
      className: "flex flex-col gap-1 relative w-full"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      ref: containerRef,
      className: "flex items-center gap-1 border border-white/10 rounded-lg bg-zinc-900/50 hover:border-white/20 transition-all relative overflow-hidden"
    }, isManual ? /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      value: value,
      onChange: function onChange(e) {
        return handleChange(fieldName, e.target.value);
      },
      onFocus: function onFocus() {
        return setDropDown(idx + 1);
      },
      placeholder: "Select or type...",
      className: "flex-grow text-xs text-white bg-transparent outline-none px-2 py-[5px] w-full"
    }) : /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      onClick: function onClick() {
        return setDropDown(function (prev) {
          return prev === idx + 1 ? -1 : idx + 1;
        });
      },
      className: "flex items-center justify-between gap-1 text-xs text-center text-white w-full h-full cursor-pointer whitespace-nowrap px-3 py-1.5 focus:outline-none"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 truncate"
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "truncate"
    }, function (_meta$enum) {
      if (_typeof(value) === 'object') return value.label || value.value;
      var option = (_meta$enum = meta["enum"]) === null || _meta$enum === void 0 ? void 0 : _meta$enum.find(function (opt) {
        return (_typeof(opt) === 'object' ? opt.value : opt) === value;
      });
      return _typeof(option) === 'object' ? option.label : value;
    }()))), /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      onClick: function onClick() {
        return setDropDown(function (prev) {
          return prev === idx + 1 ? -1 : idx + 1;
        });
      },
      className: "px-2 text-gray-400 hover:text-white cursor-pointer border-l border-gray-700 h-full flex items-center justify-center"
    }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleDown, {
      size: 14,
      className: "transition-all duration-300 ease-in-out ".concat(dropDown === idx + 1 ? "rotate-180" : "")
    }))), /*#__PURE__*/_react["default"].createElement("div", {
      tabIndex: -1,
      style: dropdownStyle,
      className: "absolute left-0 ".concat(isOpeningUp ? "bottom-full mb-2" : "top-full mt-2", " border border-white/10 p-2 rounded-lg flex flex-col overflow-y-auto bg-zinc-900/95 backdrop-blur-3xl shadow-2xl z-50 transition-all duration-200 w-full max-h-60 custom-scrollbar-thin ").concat(dropDown === idx + 1 ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible ".concat(isOpeningUp ? "translate-y-2" : "-translate-y-2"))
    }, filteredOptions.length > 0 ? filteredOptions.map(function (option, i) {
      return /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        key: i,
        className: "flex items-center gap-2 px-3 py-2 text-xs cursor-pointer rounded-lg transition-all ".concat((_typeof(option) === "object" ? formValues[fieldName] === option.value : formValues[fieldName] === option) ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"),
        onClick: function onClick() {
          handleChange(fieldName, _typeof(option) === "object" ? option.value : option);
          setDropDown(-1);
        }
      }, /*#__PURE__*/_react["default"].createElement("span", {
        className: "truncate"
      }, _typeof(option) === "object" ? option.label || option.value : option), (_typeof(option) === "object" ? formValues[fieldName] === option.value : formValues[fieldName] === option) && /*#__PURE__*/_react["default"].createElement("span", {
        className: "ml-auto text-blue-400 font-bold"
      }, "\u2713"));
    }) : /*#__PURE__*/_react["default"].createElement("div", {
      className: "text-gray-500 text-xs p-2 text-center"
    }, "No options found"))));
  }
  ;
  if (isImageField || isVideoField || isAudioField) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2 relative"
    }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
      type: "target",
      position: _reactflow.Position.Left,
      id: fieldName,
      style: _objectSpread(_objectSpread({}, handleStyle), {}, {
        top: '25px'
      }),
      className: "!rounded-full input-handle !left-[-17px]"
    }), label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-1"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      value: formValues[fieldName] || '',
      readOnly: true
      // onChange={(e) => handleChange(fieldName, e.target.value)} 
      ,
      className: "bg-zinc-900/50 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50",
      placeholder: "Add a file or provide an URL"
    })), uploading && /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-full bg-gray-700/70 rounded h-1 overflow-hidden"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "bg-blue-500 h-full",
      style: {
        width: "".concat(uploadProgress, "%")
      }
    })), formValues[fieldName] && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 relative group overflow-hidden self-start w-full"
    }, isImageField || isImageUrl(value) ? /*#__PURE__*/_react["default"].createElement("img", {
      src: value,
      alt: "Preview",
      className: "w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg",
      width: 0,
      height: 0
    }) : isVideoField ? /*#__PURE__*/_react["default"].createElement("video", {
      src: value,
      className: "w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg"
    }) : isAudioField && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col w-full h-16 border border-white/10 rounded-xl overflow-hidden shadow-lg"
    }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
      src: value
    })), /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      onClick: function onClick() {
        return handleChange(fieldName, '');
      },
      className: "text-gray-500 group-hover:text-red-600 group-hover:font-black cursor-pointer absolute top-2 left-2"
    }, "\u2715")));
  }
  ;
  if (isImagesListField) {
    var imageList = Array.isArray(formValues[fieldName]) ? formValues[fieldName] : [];
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 relative"
    }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
      type: "target",
      position: _reactflow.Position.Left,
      id: fieldName,
      style: _objectSpread(_objectSpread({}, handleStyle), {}, {
        top: '25px'
      }),
      className: "!rounded-full input-handle !left-[-17px]"
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center justify-between"
    }, label, meta.maxItems && /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-xs text-gray-400"
    }, "max items: ", meta.maxItems)), /*#__PURE__*/_react["default"].createElement("div", {
      className: "grid grid-cols-3 gap-2"
    }, imageList.map(function (url, idx) {
      return /*#__PURE__*/_react["default"].createElement("div", {
        key: idx,
        className: "flex items-center gap-2 relative group overflow-hidden"
      }, isImageUrl(url) ? /*#__PURE__*/_react["default"].createElement("img", {
        src: url,
        alt: "Preview",
        className: "w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded"
      }) : (url.includes('.mp4') || url.includes('.webm')) && /*#__PURE__*/_react["default"].createElement("video", {
        src: url,
        className: "w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded"
      }), /*#__PURE__*/_react["default"].createElement("div", {
        className: "inset-0 group-hover:bg-gray-600/40 absolute rounded"
      }, /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        onClick: function onClick() {
          var updated = _toConsumableArray(imageList);
          updated.splice(idx, 1);
          handleChange(fieldName, updated);
        },
        className: "text-gray-500 group-hover:text-red-600 hover:font-bold cursor-pointer absolute top-2 left-2"
      }, "\u2715")));
    })));
  }
  ;

  // if (meta.minValue !== undefined && meta.maxValue !== undefined) {
  //   return (
  //     <div key={fieldName} className="flex flex-col w-full">
  //       {label}
  //       <div className="flex items-center gap-2 w-full">
  //         <input
  //           type="range"
  //           id={fieldName}
  //           min={meta.minValue}
  //           max={meta.maxValue}
  //           step={meta.step}
  //           value={formValues[fieldName] ?? meta.default}
  //           onChange={(e) => handleChange(fieldName, parseFloat(e.target.value))}
  //           className="h-1 rounded-full cursor-pointer accent-blue-600 active:accent-blue-600 outline-none w-full"
  //         />
  //         <input 
  //           type="number" 
  //           id={fieldName} 
  //           min={meta.minValue} 
  //           max={meta.maxValue} 
  //           step={meta.step}
  //           value={formValues[fieldName] ?? meta.default} 
  //           readOnly
  //           // onChange={(e) => {
  //           //   const val = parseFloat(e.target.value) || meta.minValue;
  //           //   const clamped = Math.max(meta.minValue, Math.min(val, meta.maxValue));
  //           //   handleChange(fieldName, clamped);
  //           // }} 
  //           className="w-12 h-7 text-center text-white rounded border border-gray-300 text-xs" 
  //         />
  //       </div>
  //     </div>
  //   );
  // };

  if (meta.type === "int" || meta.type === "number") {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 relative"
    }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
      type: "target",
      position: _reactflow.Position.Left,
      id: fieldName,
      style: _objectSpread(_objectSpread({}, handleStyle), {}, {
        top: '50%',
        transform: 'translateY(-50%)'
      }),
      className: "!rounded-full input-handle !left-[-17px]"
    }), label, /*#__PURE__*/_react["default"].createElement("input", {
      type: "number",
      value: value,
      onChange: function onChange(e) {
        return handleChange(fieldName, parseFloat(e.target.value || 0));
      },
      placeholder: meta.description || "",
      className: "bg-zinc-900/50 text-white text-xs p-2 rounded-lg border border-white/10 hover:border-white/20 transition-all outline-none focus:border-blue-500/50"
    }));
  }
  ;
  if (meta.format === 'text') {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2 w-full relative"
    }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
      type: "target",
      position: _reactflow.Position.Left,
      id: fieldName,
      style: _objectSpread(_objectSpread({}, handleStyle), {}, {
        top: '25px'
      }),
      className: "!rounded-full input-handle !left-[-17px]"
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 text-sm font-medium relative"
    }, label), /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      id: fieldName,
      value: value,
      placeholder: meta.placeholder || meta.description || fieldName,
      onChange: function onChange(e) {
        return handleChange(fieldName, e.target.value);
      },
      className: "bg-zinc-900/50 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50"
    }));
  }
  ;
  if (meta.type === "bool") {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 relative"
    }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
      type: "target",
      position: _reactflow.Position.Left,
      id: fieldName,
      style: _objectSpread(_objectSpread({}, handleStyle), {}, {
        top: '50%',
        transform: 'translateY(-50%)'
      }),
      className: "!rounded-full input-handle !left-[-17px]"
    }), label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: "instrumental-".concat(fieldName),
      className: "flex items-center justify-between cursor-pointer select-none relative"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "checkbox",
      id: "instrumental-".concat(fieldName),
      className: "sr-only peer",
      checked: !!formValues[fieldName],
      onChange: function onChange(e) {
        return handleChange(fieldName, e.target.checked);
      }
    }), /*#__PURE__*/_react["default"].createElement("span", {
      className: "flex items-center h-[20px] w-[36px] rounded-full p-1 duration-200 transition-all ".concat(!!formValues[fieldName] ? "bg-blue-600 shadow-lg shadow-blue-900/40" : "bg-zinc-800 border border-white/10")
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "h-[12px] w-[12px] rounded-full bg-white duration-200 shadow-sm ".concat(!!formValues[fieldName] && "translate-x-4")
    }))), /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-xs"
    }, meta.description)));
  }
  ;

  // if (meta.type === "string") {
  return /*#__PURE__*/_react["default"].createElement("div", {
    key: fieldName,
    className: "flex flex-col items-start gap-1 relative"
  }, hasHandle && /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: fieldName,
    style: _objectSpread(_objectSpread({}, handleStyle), {}, {
      top: '25px'
    }),
    className: "!rounded-full input-handle !left-[-17px]"
  }), label, /*#__PURE__*/_react["default"].createElement("textarea", {
    value: value,
    readOnly: true
    // onChange={(e) => handleChange(fieldName, e.target.value)}
    ,
    placeholder: meta.description || "",
    className: "bg-zinc-900/50 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50",
    rows: 6
  }));
  // }
};
var _default = exports["default"] = RenderApiField;