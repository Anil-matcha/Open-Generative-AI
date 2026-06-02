"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
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
var RenderField = function RenderField(_ref) {
  var _ref2, _formValues$fieldName;
  var fieldName = _ref.fieldName,
    meta = _ref.meta,
    idx = _ref.idx,
    formValues = _ref.formValues,
    setFormValues = _ref.setFormValues,
    handleChange = _ref.handleChange,
    data = _ref.data,
    modelName = _ref.modelName;
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
  var buttonRef = (0, _react.useRef)(null);
  var isImageField = ['image', 'images_list'].includes(meta.field);
  var isVideoField = meta.field === 'video';
  var isAudioField = meta.field === 'audio';
  var value = (_ref2 = (_formValues$fieldName = formValues[fieldName]) !== null && _formValues$fieldName !== void 0 ? _formValues$fieldName : meta["default"]) !== null && _ref2 !== void 0 ? _ref2 : "";
  var isRequired = data.required && data.required.includes(fieldName);
  var label = /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[10px] font-bold text-zinc-500 text-start px-1 mb-1"
  }, meta.title || fieldName, isRequired && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-blue-500 text-[9px] ml-1"
  }, "* required"));
  var handleDropdownToggle = function handleDropdownToggle(value) {
    setDropDown(function (prev) {
      return prev === value ? -1 : value;
    });
  };
  (0, _react.useLayoutEffect)(function () {
    if (dropDown === idx + 1 && buttonRef.current) {
      var rect = buttonRef.current.getBoundingClientRect();
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
  var isInputModel = modelName.includes("passthrough");
  if (isInputModel && meta.type !== "boolean") return null;
  if (meta["enum"]) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 w-full"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
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
    }, /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      ref: buttonRef,
      onClick: function onClick() {
        return handleDropdownToggle(idx + 1);
      },
      className: "flex items-center justify-between gap-1 text-xs text-center text-white w-full h-full cursor-pointer whitespace-nowrap px-3 py-1.5 bg-zinc-900/50 border border-white/10 hover:border-white/20 focus:outline-none rounded-lg transition-all"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 truncate"
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "truncate"
    }, value)), /*#__PURE__*/_react["default"].createElement(_fa.FaAngleDown, {
      size: 14,
      className: "transition-all duration-300 ease-in-out text-zinc-400 group-hover:text-white ".concat(dropDown === idx + 1 ? "rotate-180" : "")
    })), /*#__PURE__*/_react["default"].createElement("div", {
      tabIndex: -1,
      style: dropdownStyle,
      className: "absolute left-0 ".concat(isOpeningUp ? "bottom-full mb-2" : "top-full mt-2", " border border-white/10 p-1 rounded-xl flex flex-col overflow-y-auto bg-zinc-900/95 backdrop-blur-3xl shadow-2xl transition-all duration-200 w-full z-50 max-h-60 custom-scrollbar-thin ").concat(dropDown === idx + 1 ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible ".concat(isOpeningUp ? "translate-y-2" : "-translate-y-2"))
    }, meta["enum"].map(function (option, i) {
      return /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        key: i,
        className: "flex items-center gap-2 px-3 py-2 text-xs cursor-pointer rounded-lg transition-all ".concat(formValues[fieldName] === option ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"),
        onClick: function onClick() {
          handleChange(fieldName, option);
          setDropDown(-1);
        }
      }, /*#__PURE__*/_react["default"].createElement("span", {
        className: "truncate"
      }, option), formValues[fieldName] === option && /*#__PURE__*/_react["default"].createElement("span", {
        className: "ml-auto text-blue-400 font-bold"
      }, "\u2713"));
    }))));
  }
  ;
  if (['image', 'video', 'audio'].includes(meta.field)) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-1"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      value: formValues[fieldName] || '',
      readOnly: true
      // onChange={(e) => handleChange(fieldName, e.target.value)} 
      ,
      className: "bg-zinc-900/50 text-white text-xs py-2 px-3 rounded-lg border border-white/10 transition-all hover:border-white/20 w-full outline-none focus:border-blue-500/50",
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
    }, meta.field === 'image' ? /*#__PURE__*/_react["default"].createElement("img", {
      src: formValues[fieldName],
      alt: "Preview",
      className: "w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg",
      width: 0,
      height: 0
    }) : meta.field === 'video' ? /*#__PURE__*/_react["default"].createElement("video", {
      src: formValues[fieldName],
      className: "w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg"
    }) : meta.field === 'audio' && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col w-full h-20 border border-white/10 rounded-xl overflow-hidden shadow-lg"
    }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
      src: formValues[fieldName]
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
  if (meta.type === "array" || fieldName === "images_list") {
    var imageList = formValues[fieldName] || [];
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center justify-between"
    }, label, /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px] text-gray-500"
    }, imageList.length, "/", meta.maxItems)), /*#__PURE__*/_react["default"].createElement("div", {
      className: "grid grid-cols-3 gap-2"
    }, imageList.map(function (url, idx) {
      return /*#__PURE__*/_react["default"].createElement("div", {
        key: idx,
        className: "flex items-center gap-2 relative group overflow-hidden ".concat(['audios_list', 'audio_files'].includes(meta.field) ? 'col-span-full' : '')
      }, meta.field === 'images_list' ? /*#__PURE__*/_react["default"].createElement("img", {
        src: url,
        alt: "Preview",
        className: "w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded"
      }) : ['videos_list', 'video_files'].includes(meta.field) ? /*#__PURE__*/_react["default"].createElement("video", {
        src: url,
        className: "w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded"
      }) : ['audios_list', 'audio_files'].includes(meta.field) && /*#__PURE__*/_react["default"].createElement("div", {
        className: "flex flex-col w-full h-20 border border-white/10 rounded-xl overflow-hidden shadow-lg"
      }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
        src: url
      })), /*#__PURE__*/_react["default"].createElement("div", {
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
  if (meta.minValue !== undefined && meta.maxValue !== undefined) {
    var _ref3, _formValues$fieldName2, _ref4, _formValues$fieldName3;
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col w-full"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 w-full"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "range",
      id: fieldName,
      min: meta.minValue,
      max: meta.maxValue,
      step: meta.step,
      value: (_ref3 = (_formValues$fieldName2 = formValues[fieldName]) !== null && _formValues$fieldName2 !== void 0 ? _formValues$fieldName2 : meta["default"]) !== null && _ref3 !== void 0 ? _ref3 : 0,
      onChange: function onChange(e) {
        return handleChange(fieldName, parseFloat(e.target.value));
      },
      className: "h-1.5 rounded-full cursor-pointer accent-blue-600 outline-none w-full bg-zinc-800"
    }), /*#__PURE__*/_react["default"].createElement("input", {
      type: "number",
      id: fieldName,
      min: meta.minValue,
      max: meta.maxValue,
      step: meta.step,
      value: (_ref4 = (_formValues$fieldName3 = formValues[fieldName]) !== null && _formValues$fieldName3 !== void 0 ? _formValues$fieldName3 : meta["default"]) !== null && _ref4 !== void 0 ? _ref4 : 0,
      readOnly: true
      // onChange={(e) => {
      //   const val = parseFloat(e.target.value) || meta.minValue;
      //   const clamped = Math.max(meta.minValue, Math.min(val, meta.maxValue));
      //   handleChange(fieldName, clamped);
      // }} 
      ,
      className: "w-12 h-8 text-center text-white rounded-lg border border-white/10 text-[10px] font-bold bg-zinc-900/50 outline-none focus:border-blue-500/50 transition-all"
    })));
  }
  ;
  if (meta.type === "int") {
    var _meta$minValue, _meta$maxValue, _meta$step, _formValues$fieldName4;
    var min = (_meta$minValue = meta.minValue) !== null && _meta$minValue !== void 0 ? _meta$minValue : 0;
    var max = (_meta$maxValue = meta.maxValue) !== null && _meta$maxValue !== void 0 ? _meta$maxValue : Number.MAX_SAFE_INTEGER;
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 w-full"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: fieldName,
      className: "flex items-center gap-2 text-sm text-white font-medium relative"
    }, label, isRequired && /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-blue-500 text-xs"
    }, "* required")), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 w-full"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "number",
      id: fieldName,
      min: min,
      max: max,
      step: (_meta$step = meta.step) !== null && _meta$step !== void 0 ? _meta$step : 1,
      value: (_formValues$fieldName4 = formValues[fieldName]) !== null && _formValues$fieldName4 !== void 0 ? _formValues$fieldName4 : "",
      onChange: function onChange(e) {
        var value = e.target.value;
        if (value === "") {
          handleChange(fieldName, "");
          return;
        }
        var num = Number(value);
        if (Number.isNaN(num)) return;
        num = Math.max(min, Math.min(num, max));
        handleChange(fieldName, num);
      },
      className: "w-full rounded-lg border border-white/10 px-3 py-2 text-white text-xs bg-zinc-900/50 hover:border-white/20 focus:border-blue-500/50 outline-none transition-all"
    })));
  }
  ;

  // if (meta.type === "int" || meta.type === "number") {
  //   return (
  //     <div key={fieldName} className="flex flex-col gap-1">
  //       {label}
  //       <input
  //         type="number"
  //         value={value}
  //         onChange={(e) => handleChange(fieldName, parseFloat(e.target.value))}
  //         placeholder={meta.description || ""}
  //         className="bg-[#1f2125] text-white text-xs p-1 rounded border border-gray-600 outline-none"
  //       />
  //     </div>
  //   );
  // };

  if (meta.format === 'text') {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2 w-full"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: fieldName,
      className: "flex items-center gap-2 text-sm font-medium relative"
    }, label), /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      id: fieldName,
      value: value,
      placeholder: meta.placeholder || "",
      onChange: function onChange(e) {
        return handleChange(fieldName, e.target.value);
      },
      className: "bg-zinc-900/50 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50"
    }));
  }
  ;
  if (meta.type === "boolean") {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: "instrumental-".concat(fieldName),
      className: "flex items-center justify-between cursor-pointer select-none relative shrink-0"
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
      className: "h-[12px] w-[12px] rounded-full bg-white duration-200 shadow-sm ".concat(!!formValues[fieldName] && "translate-x-[16px]")
    }))), /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-xs text-white"
    }, meta.description)));
  }
  ;
  if (meta.type === "string") {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col items-start gap-1"
    }, label, /*#__PURE__*/_react["default"].createElement("textarea", {
      value: value,
      readOnly: true
      // onChange={(e) => handleChange(fieldName, e.target.value)}
      ,
      placeholder: meta.description || "",
      className: "bg-zinc-900/50 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50",
      rows: 6
    }));
  }
  ;
};
var _default = exports["default"] = RenderField;