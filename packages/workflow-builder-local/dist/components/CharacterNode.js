"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactflow = require("reactflow");
var _reactHotToast = require("react-hot-toast");
var _axios = _interopRequireDefault(require("axios"));
var _fi = require("react-icons/fi");
var _io = require("react-icons/io5");
var _utility = require("./utility");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
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
// Shared with Video Studio's FaceAssetDialog — the same saved-faces library.
var LIBRARY_KEY = "face_library_v1";
function loadLibrary() {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
  } catch (_unused) {
    return [];
  }
}
function saveLibrary(items) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
  } catch (_unused2) {}
}

// "Персонаж" — an input node that carries a face/character reference (a public
// image URL or an asset://… URI). Its output feeds the Seedance video node's
// face_asset, so the generated video keeps the same face.
var CharacterNode = function CharacterNode(_ref) {
  var _data$connectedOutput;
  var id = _ref.id,
    data = _ref.data,
    selected = _ref.selected;
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    setNodes = _useReactFlow.setNodes,
    setEdges = _useReactFlow.setEdges;
  var fv = data.formValues || {};
  var _useState = (0, _react.useState)(fv.character_name || ""),
    _useState2 = _slicedToArray(_useState, 2),
    name = _useState2[0],
    setName = _useState2[1];
  var _useState3 = (0, _react.useState)("photo"),
    _useState4 = _slicedToArray(_useState3, 2),
    tab = _useState4[0],
    setTab = _useState4[1]; // "photo" | "uri"
  var _useState5 = (0, _react.useState)(fv.face_asset || ""),
    _useState6 = _slicedToArray(_useState5, 2),
    assetUri = _useState6[0],
    setAssetUri = _useState6[1];
  var _useState7 = (0, _react.useState)(fv.character_photo || ""),
    _useState8 = _slicedToArray(_useState7, 2),
    photoUrl = _useState8[0],
    setPhotoUrl = _useState8[1];
  var _useState9 = (0, _react.useState)([]),
    _useState0 = _slicedToArray(_useState9, 2),
    library = _useState0[0],
    setLibrary = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    uploading = _useState10[0],
    setUploading = _useState10[1];
  var _useState11 = (0, _react.useState)(0),
    _useState12 = _slicedToArray(_useState11, 2),
    progress = _useState12[0],
    setProgress = _useState12[1];
  var prevSig = (0, _react.useRef)("");
  (0, _react.useEffect)(function () {
    setLibrary(loadLibrary());
  }, []);

  // The reference that actually goes downstream: an asset:// URI takes priority,
  // otherwise the uploaded photo's public URL.
  var faceValue = (assetUri.trim() || photoUrl || "").trim();
  var isAsset = faceValue.startsWith("asset://");

  // Propagate the value to the parent (echo-suppressed to avoid the React #185
  // render loop that has bitten this builder before).
  (0, _react.useEffect)(function () {
    var _data$onDataChange;
    // Output the face reference. Typed as image_url so it rides the existing
    // image-passthrough plumbing on the backend; the value is the asset://… URI
    // or the uploaded photo's public URL.
    var outputs = [{
      type: "image_url",
      value: faceValue || null
    }];
    var payload = {
      formValues: {
        character_name: name,
        face_asset: faceValue,
        character_photo: photoUrl,
        image_url: faceValue || null
      },
      outputs: outputs,
      resultUrl: faceValue || null
    };
    var sig = (0, _utility.stableStringify)(payload);
    if (sig === prevSig.current) return;
    prevSig.current = sig;
    data === null || data === void 0 || (_data$onDataChange = data.onDataChange) === null || _data$onDataChange === void 0 || _data$onDataChange.call(data, id, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceValue, name, photoUrl, id]);
  var handleDeleteNode = function handleDeleteNode() {
    if (window.confirm("Удалить ноду «Персонаж»?")) {
      setNodes(function (nds) {
        return nds.filter(function (n) {
          return n.id !== id;
        });
      });
      setEdges(function (eds) {
        return eds.filter(function (e) {
          return e.source !== id && e.target !== id;
        });
      });
    }
  };
  var handlePhotoUpload = function handlePhotoUpload(e) {
    var _e$target$files;
    var file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      _reactHotToast.toast.error("Загрузите изображение");
      return;
    }
    setUploading(true);
    setProgress(0);
    _axios["default"].get("/api/upload-file", {
      params: {
        filename: file.name,
        type: file.type
      }
    }).then(function (_ref2) {
      var _ref2$data = _ref2.data,
        putUrl = _ref2$data.putUrl,
        publicUrl = _ref2$data.publicUrl;
      return _axios["default"].put(putUrl, file, {
        headers: {
          "Content-Type": file.type
        },
        onUploadProgress: function onUploadProgress(ev) {
          return setProgress(Math.round(ev.loaded * 100 / ev.total));
        }
      }).then(function () {
        setPhotoUrl(publicUrl);
        setAssetUri("");
        setTab("photo");
      });
    })["catch"](function (err) {
      console.error("Upload failed", err);
      _reactHotToast.toast.error("Не удалось загрузить фото");
    })["finally"](function () {
      setUploading(false);
      setProgress(0);
    });
  };
  var pickFromLibrary = function pickFromLibrary(face) {
    if (String(face.assetUri || "").startsWith("asset://")) {
      setAssetUri(face.assetUri);
      setPhotoUrl(face.thumbnail || "");
      setTab("uri");
    } else {
      setPhotoUrl(face.assetUri || face.thumbnail || "");
      setAssetUri("");
      setTab("photo");
    }
    if (face.name && !name) setName(face.name);
  };
  var saveToLibrary = function saveToLibrary() {
    if (!faceValue) {
      _reactHotToast.toast.error("Сначала выберите фото или Asset URI");
      return;
    }
    var item = {
      id: Date.now().toString(),
      name: name || faceValue.replace(/^asset:\/\//, "").slice(0, 16),
      assetUri: faceValue,
      thumbnail: photoUrl || null,
      addedAt: Date.now()
    };
    var next = [item].concat(_toConsumableArray(library.filter(function (f) {
      return f.assetUri !== faceValue;
    })));
    saveLibrary(next);
    setLibrary(next);
    _reactHotToast.toast.success("Сохранено в библиотеку");
  };
  var deleteFromLibrary = function deleteFromLibrary(libId) {
    var next = library.filter(function (f) {
      return f.id !== libId;
    });
    saveLibrary(next);
    setLibrary(next);
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    style: {
      minHeight: 220,
      "--loader-color": "#a855f7"
    },
    className: "nowheel group flex flex-col flex-1 w-80 rounded-2xl border-2 relative transition-all duration-300 ease-in-out\n        ".concat(selected ? "border-purple-600 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02] ring-1 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700 shadow-lg", "\n        bg-[#0c0d0f]/95 backdrop-blur-sm")
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 absolute -top-5 left-0"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-zinc-400 text-[10px] font-medium tracking-wider uppercase"
  }, "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 ", id.replace(/^\D+/g, ""))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between bg-gradient-to-r from-[#1a1320] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 p-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-1.5 rounded-lg ".concat(selected ? "bg-purple-600 text-white" : "bg-zinc-800 text-purple-300", " transition-colors")
  }, /*#__PURE__*/_react["default"].createElement(_io.IoPersonCircleOutline, {
    size: 16
  })), /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-xs font-bold text-zinc-100"
  }, "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436")), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: handleDeleteNode,
    className: "text-zinc-500 hover:text-red-400 transition-colors",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoTrashOutline, {
    size: 15
  }))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-2.5 p-3"
  }, /*#__PURE__*/_react["default"].createElement("input", {
    value: name,
    onChange: function onChange(e) {
      return setName(e.target.value);
    },
    placeholder: "\u0418\u043C\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430\u2026",
    className: "h-9 px-3 rounded-lg bg-white/5 border border-zinc-800 text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500/50"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setTab("photo");
    },
    className: "h-8 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ".concat(tab === "photo" ? "bg-purple-600/30 border-purple-500/50 text-purple-100" : "bg-white/5 border-zinc-800 text-zinc-400 hover:text-white")
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiUpload, {
    size: 12
  }), " \u0424\u043E\u0442\u043E"), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setTab("uri");
    },
    className: "h-8 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ".concat(tab === "uri" ? "bg-purple-600/30 border-purple-500/50 text-purple-100" : "bg-white/5 border-zinc-800 text-zinc-400 hover:text-white")
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiLink, {
    size: 12
  }), " Asset URI")), tab === "photo" ? uploading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1.5 py-2"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[11px] text-zinc-400"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026 ", progress, "%"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full bg-zinc-800 rounded h-1 overflow-hidden"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "bg-purple-500 h-full transition-all",
    style: {
      width: "".concat(progress, "%")
    }
  }))) : photoUrl && !isAsset ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative group/photo rounded-lg overflow-hidden border border-zinc-800"
  }, /*#__PURE__*/_react["default"].createElement("img", {
    src: photoUrl,
    alt: "face",
    className: "w-full h-32 object-cover"
  }), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: function onClick() {
      return setPhotoUrl("");
    },
    className: "absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded px-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
  }, "\u2715")) : /*#__PURE__*/_react["default"].createElement("label", {
    className: "cursor-pointer flex flex-col items-center justify-center gap-1.5 text-zinc-500 border border-dashed border-zinc-700 rounded-lg p-4 hover:bg-zinc-800/40"
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiUpload, {
    size: 18
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[11px]"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E \u043B\u0438\u0446\u0430"), /*#__PURE__*/_react["default"].createElement("input", {
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: handlePhotoUpload
  })) : /*#__PURE__*/_react["default"].createElement("input", {
    value: assetUri,
    onChange: function onChange(e) {
      setAssetUri(e.target.value);
      setPhotoUrl("");
    },
    placeholder: "asset://asset-\u2026",
    className: "h-9 px-3 rounded-lg bg-white/5 border border-zinc-800 text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 font-mono"
  }), faceValue && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "text-[10px] font-mono text-zinc-500 truncate bg-black/30 rounded px-2 py-1 border border-zinc-800"
  }, faceValue), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-emerald-400 flex items-center gap-1"
  }, "\u2713 ", isAsset ? "Trusted asset подключён. Доступен в Seedance 2.0." : "Фото подключено как референс лица.")), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: saveToLibrary,
    disabled: !faceValue,
    className: "h-9 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  }, "+ \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0432 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443"), library.length > 0 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1.5 border-t border-zinc-800 pt-2"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] uppercase tracking-wider text-zinc-500 font-semibold"
  }, "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 (", library.length, ")"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-wrap gap-2"
  }, library.map(function (face) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: face.id,
      className: "relative group/lib flex flex-col items-center gap-0.5"
    }, /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      onClick: function onClick() {
        return pickFromLibrary(face);
      },
      title: face.name,
      className: "w-12 h-12 rounded-lg overflow-hidden border transition-all flex items-center justify-center bg-white/5 ".concat(faceValue && faceValue === face.assetUri ? "border-purple-500" : "border-zinc-800 hover:border-purple-500/50")
    }, face.thumbnail ? /*#__PURE__*/_react["default"].createElement("img", {
      src: face.thumbnail,
      alt: face.name,
      className: "w-full h-full object-cover"
    }) : /*#__PURE__*/_react["default"].createElement(_io.IoPersonCircleOutline, {
      size: 22,
      className: "text-purple-300"
    })), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[8px] text-zinc-500 truncate w-12 text-center"
    }, face.name), /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      onClick: function onClick() {
        return deleteFromLibrary(face.id);
      },
      className: "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 text-white text-[8px] hidden group-hover/lib:flex items-center justify-center"
    }, "\xD7"));
  })))), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "characterOutput",
    style: {
      top: 100,
      width: 12,
      height: 12,
      transition: "all 0.2s ease-in-out"
    },
    className: "!rounded-full !border-[3px] !right-[-8px] transition-all\n          ".concat((_data$connectedOutput = data.connectedOutputs) !== null && _data$connectedOutput !== void 0 && _data$connectedOutput.characterOutput ? "!bg-purple-600 !border-zinc-900 shadow-[0_0_15px_rgba(168,85,247,0.8)]" : "!bg-zinc-900 !border-purple-600/50 hover:!border-purple-600 shadow-sm"),
    "data-type": "purple"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -right-12 top-[100px] text-xs text-purple-400 transition-opacity duration-200 ".concat(data.activeHandleColor === "purple" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "\u041B\u0438\u0446\u043E"));
};
var _default = exports["default"] = CharacterNode;