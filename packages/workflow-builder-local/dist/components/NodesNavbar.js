"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _ai = require("react-icons/ai");
var _fa = require("react-icons/fa6");
var _io = require("react-icons/io5");
var _tfi = require("react-icons/tfi");
var _md = require("react-icons/md");
var _ri = require("react-icons/ri");
var _utility = require("./utility");
var _tb = require("react-icons/tb");
var _lu = require("react-icons/lu");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
var formatName = function formatName(id) {
  return id.replace(/-/g, ' ').split(' ').map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
};
var SPECIAL_MODEL_NAMES = {
  "text-passthrough": "Input Text",
  "image-passthrough": "Input Image",
  "video-passthrough": "Input Video",
  "audio-passthrough": "Input Audio",
  "gpt-image-2": "GPT Image 2",
  "gemini-3.1-flash-image-preview": "Nano Banana 2",
  "gemini-3-pro-image-preview": "Nano Banana Pro"
};

// Only these three image models are exposed in the "Generate Image" menu.
// Editing is disabled in the builder, so the "Edit Image" category is hidden.
var ALLOWED_GENERATE_IMAGE = new Set(["gpt-image-2", "gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview"]);
var NodesNavbar = function NodesNavbar(_ref) {
  var addNode = _ref.addNode,
    apiNodeModels = _ref.apiNodeModels,
    _ref$filterNodeTypes = _ref.filterNodeTypes,
    filterNodeTypes = _ref$filterNodeTypes === void 0 ? null : _ref$filterNodeTypes,
    _ref$nodeSchemas = _ref.nodeSchemas,
    nodeSchemas = _ref$nodeSchemas === void 0 ? {} : _ref$nodeSchemas;
  var _useState = (0, _react.useState)(null),
    _useState2 = _slicedToArray(_useState, 2),
    activeSubMenu = _useState2[0],
    setActiveSubMenu = _useState2[1];
  var _useState3 = (0, _react.useState)(""),
    _useState4 = _slicedToArray(_useState3, 2),
    searchQuery = _useState4[0],
    setSearchQuery = _useState4[1];
  var menuRef = (0, _react.useRef)(null);
  var getNodeTypeFromSubmenuId = function getNodeTypeFromSubmenuId(id) {
    if (id === 'inputs') return ['textNode', 'imageNode', 'videoNode', 'audioNode'];
    if (id.includes('text-llms') || id === 'text-llms') return 'textNode';
    if (id === 'concat' || id === 'text-utils' || id === 'utilities') return ['concatNode', 'vidConcatNode'];
    if (id.includes('image')) return 'imageNode';
    if (id.includes('video')) return 'videoNode';
    if (id.includes('audio')) return 'audioNode';
    if (id === 'api-models') return 'apiNode';
    return null;
  };
  (0, _react.useEffect)(function () {
    var handleClickOutside = function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveSubMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return function () {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  var hasSearch = searchQuery.trim().length > 0;
  var getCategorizedModels = function getCategorizedModels() {
    var _categories$image, _categories$video, _categories$text, _categories$audio, _categories$api, _categories$utility;
    var categories = (nodeSchemas === null || nodeSchemas === void 0 ? void 0 : nodeSchemas.categories) || {};
    var mapModels = function mapModels(modelsMap) {
      return modelsMap ? Object.entries(modelsMap).map(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
          id = _ref3[0],
          model = _ref3[1];
        return _objectSpread(_objectSpread({}, model), {}, {
          id: id,
          name: SPECIAL_MODEL_NAMES[id] || formatName(id)
        });
      }) : [];
    };
    var imageModels = mapModels((_categories$image = categories.image) === null || _categories$image === void 0 ? void 0 : _categories$image.models);
    var videoModels = mapModels((_categories$video = categories.video) === null || _categories$video === void 0 ? void 0 : _categories$video.models);
    var textModels = mapModels((_categories$text = categories.text) === null || _categories$text === void 0 ? void 0 : _categories$text.models);
    var audioModels = mapModels((_categories$audio = categories.audio) === null || _categories$audio === void 0 ? void 0 : _categories$audio.models);
    var apiModels = mapModels((_categories$api = categories.api) === null || _categories$api === void 0 ? void 0 : _categories$api.models);
    var rawUtilityModels = mapModels((_categories$utility = categories.utility) === null || _categories$utility === void 0 ? void 0 : _categories$utility.models);
    var utilityModels = _toConsumableArray(rawUtilityModels);

    // Add local models if they are not in the backend response
    [].concat(_toConsumableArray(_utility.concatModels), _toConsumableArray(_utility.videoCombinerModels)).forEach(function (m) {
      if (!utilityModels.find(function (um) {
        return um.id === m.id;
      })) {
        utilityModels.push(m);
      }
    });
    var isPassthrough = function isPassthrough(m) {
      return (m === null || m === void 0 ? void 0 : m.id) && m.id.includes("passthrough");
    };
    var inputsModels = [].concat(_toConsumableArray(textModels.filter(isPassthrough).map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: 'textNode'
      });
    })), _toConsumableArray(imageModels.filter(isPassthrough).map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: 'imageNode'
      });
    })), _toConsumableArray(videoModels.filter(isPassthrough).map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: 'videoNode'
      });
    })), _toConsumableArray(audioModels.filter(isPassthrough).map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: 'audioNode'
      });
    })));

    // Restrict the Generate Image menu to the three allowed models only.
    var generateImageModels = imageModels.filter(function (m) {
      return ALLOWED_GENERATE_IMAGE.has(m === null || m === void 0 ? void 0 : m.id);
    });
    // Editing is disabled in the builder — keep the list empty.
    var editImageModels = [];
    var upscaleImageModels = imageModels.filter(function (m) {
      return (m === null || m === void 0 ? void 0 : m.id) && !isPassthrough(m) && m.id.includes("upscale");
    });
    var generateVideoModels = videoModels.filter(function (m) {
      return (m === null || m === void 0 ? void 0 : m.id) && !isPassthrough(m) && !m.id.includes("edit");
    });
    var editVideoModels = videoModels.filter(function (m) {
      return (m === null || m === void 0 ? void 0 : m.id) && !isPassthrough(m) && m.id.includes("edit");
    });
    var textModelsFiltered = textModels.filter(function (m) {
      return !isPassthrough(m);
    });
    var audioModelsFiltered = audioModels.filter(function (m) {
      return !isPassthrough(m);
    });
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
      api: apiNodeModels
    };
  };
  var categorizedModels = getCategorizedModels();
  var handleAddNode = function handleAddNode(type, model) {
    addNode(type, null, {
      selectedModel: model
    });
    setActiveSubMenu(null);
    setSearchQuery("");
  };
  var menuStructure = [{
    label: "Inputs",
    items: [{
      label: "Input Models",
      icon: /*#__PURE__*/_react["default"].createElement(_lu.LuUpload, null),
      hasSubmenu: true,
      id: "inputs"
    }]
  }, {
    label: "Text",
    items: [{
      label: "Text (LLMs)",
      icon: /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, null),
      hasSubmenu: true,
      id: "text-llms"
    }, {
      label: "Utilities",
      icon: /*#__PURE__*/_react["default"].createElement(_tb.TbArrowMerge, {
        className: "rotate-90"
      }),
      hasSubmenu: true,
      id: "utilities"
    }]
  }, {
    label: "Image",
    items: [{
      label: "Generate Image",
      icon: /*#__PURE__*/_react["default"].createElement(_io.IoImageOutline, null),
      hasSubmenu: true,
      id: "generate-image"
    }
    // Edit Image disabled — generation only.
    // { label: "Edit Image", icon: <RiImageAiLine />, hasSubmenu: true, id: "edit-image" },
    // { label: "Upscale Image", icon: <MdOutlineImage />, hasSubmenu: true, id: "upscale-image" },
    // { label: "Image Utilities", icon: <MdCrop />, hasSubmenu: true, id: "image-utils" },
    ]
  }, {
    label: "Video",
    items: [{
      label: "Generate Video",
      icon: /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, null),
      hasSubmenu: true,
      id: "generate-video"
    }, {
      label: "Edit Video",
      icon: /*#__PURE__*/_react["default"].createElement(_ri.RiVideoOnAiLine, null),
      hasSubmenu: true,
      id: "edit-video"
    }]
  }
  // Audio (Generate Audio) and API Models (Api Node) sections removed.
  ];
  var getSubmenuItems = function getSubmenuItems(id) {
    switch (id) {
      case "inputs":
        return categorizedModels.inputs.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: m.type
          };
        });
      case "text-utils":
      case "utilities":
        return categorizedModels.utilities.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: m.id === "video-combiner" ? "vidConcatNode" : "concatNode"
          };
        });
      case "generate-image":
        return categorizedModels.generateImage.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "imageNode"
          };
        });
      case "edit-image":
        return categorizedModels.editImage.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "imageNode"
          };
        });
      case "upscale-image":
        return categorizedModels.upscaleImage.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "imageNode"
          };
        });
      // May be empty
      case "text-llms":
        return categorizedModels.text.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "textNode"
          };
        });
      case "generate-video":
        return categorizedModels.generateVideo.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "videoNode"
          };
        });
      case "edit-video":
        return categorizedModels.editVideo.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "videoNode"
          };
        });
      case "generate-audio":
        return categorizedModels.audio.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "audioNode"
          };
        });
      case "api-models":
        return categorizedModels.api.map(function (m) {
          return {
            label: m.name,
            model: m,
            type: "apiNode"
          };
        });
      default:
        return [];
    }
  };
  var renderSearchResults = function renderSearchResults() {
    var inputs = categorizedModels.inputs,
      generateImage = categorizedModels.generateImage,
      editImage = categorizedModels.editImage,
      upscaleImage = categorizedModels.upscaleImage,
      generateVideo = categorizedModels.generateVideo,
      editVideo = categorizedModels.editVideo,
      text = categorizedModels.text,
      audio = categorizedModels.audio,
      textUtils = categorizedModels.textUtils,
      api = categorizedModels.api;
    var allModels = [].concat(_toConsumableArray(inputs.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: m.type
      });
    })), _toConsumableArray(generateImage.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "imageNode"
      });
    })), _toConsumableArray(editImage.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "imageNode"
      });
    })), _toConsumableArray(upscaleImage.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "imageNode"
      });
    })), _toConsumableArray(generateVideo.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "videoNode"
      });
    })), _toConsumableArray(editVideo.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "videoNode"
      });
    })), _toConsumableArray(text.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "textNode"
      });
    })), _toConsumableArray(audio.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "audioNode"
      });
    })), _toConsumableArray(textUtils.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: m.id === "video-combiner" ? "vidConcatNode" : "concatNode"
      });
    })), _toConsumableArray(apiNodeModels.map(function (m) {
      return _objectSpread(_objectSpread({}, m), {}, {
        type: "apiNode"
      });
    })));
    var filtered = allModels.filter(function (m) {
      return m && m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col gap-1 w-full max-h-96 overflow-y-auto"
    }, filtered.length > 0 ? filtered.map(function (item, idx) {
      return /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        key: idx,
        className: "flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-[#2c3037] rounded cursor-pointer transition text-left",
        onClick: function onClick() {
          return handleAddNode(item.type, item);
        }
      }, item.type === "imageNode" && /*#__PURE__*/_react["default"].createElement(_io.IoImageOutline, null), item.type === "videoNode" && /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, null), item.type === "textNode" && /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, null), item.type === "audioNode" && /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineAudio, null), item.type === "concatNode" && /*#__PURE__*/_react["default"].createElement(_tb.TbArrowMerge, {
        className: "rotate-90"
      }), item.type === "apiNode" && /*#__PURE__*/_react["default"].createElement(_ri.RiInputMethodLine, null), /*#__PURE__*/_react["default"].createElement("span", null, item.name));
    }) : /*#__PURE__*/_react["default"].createElement("div", {
      className: "px-3 py-2 text-xs text-gray-500"
    }, "No results found"));
  };
  var anchorRef = (0, _react.useRef)(null);
  var _useState5 = (0, _react.useState)({
      opacity: 0
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    menuStyle = _useState6[0],
    setMenuStyle = _useState6[1];
  (0, _react.useLayoutEffect)(function () {
    if (anchorRef.current && menuRef.current) {
      var anchorRect = anchorRef.current.getBoundingClientRect();
      var menuRect = menuRef.current.getBoundingClientRect();
      var windowWidth = window.innerWidth;
      var windowHeight = window.innerHeight;
      var padding = 12;
      var left = anchorRect.left;
      var top = anchorRect.top;
      var maxHeight = "";
      if (left + menuRect.width > windowWidth - padding) {
        left = windowWidth - menuRect.width - padding;
      }
      if (left < padding) {
        left = padding;
      }
      if (top + menuRect.height > windowHeight - padding) {
        var overflowY = top + menuRect.height - (windowHeight - padding);
        top = top - overflowY;
      }
      if (top < padding) {
        top = padding;
        maxHeight = "".concat(windowHeight - padding * 2, "px");
      }
      setMenuStyle({
        position: 'fixed',
        left: "".concat(left, "px"),
        top: "".concat(top, "px"),
        maxHeight: maxHeight,
        opacity: 1
      });
    }
  }, [searchQuery]);
  var filteredMenuStructure = filterNodeTypes ? menuStructure.map(function (section) {
    return _objectSpread(_objectSpread({}, section), {}, {
      items: section.items.filter(function (item) {
        var nodeType = getNodeTypeFromSubmenuId(item.id);
        if (Array.isArray(nodeType)) {
          return nodeType.some(function (type) {
            return filterNodeTypes.includes(type);
          });
        }
        return filterNodeTypes.includes(nodeType);
      })
    });
  }).filter(function (section) {
    return section.items.length > 0;
  }) : menuStructure;
  return /*#__PURE__*/_react["default"].createElement("div", {
    ref: anchorRef,
    className: "flex flex-col gap-2 relative z-50"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    ref: menuRef,
    className: "flex flex-col gap-2 bg-[#151618] border border-gray-700 p-2 rounded-xl w-60 shadow-xl",
    style: menuStyle
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center relative w-full pl-2 bg-[#1c1e21] border border-gray-600 rounded-lg shrink-0"
  }, /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineSearch, {
    className: "text-gray-400"
  }), /*#__PURE__*/_react["default"].createElement("input", {
    type: "search",
    placeholder: "Search nodes or models",
    className: "w-full h-full py-2 px-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 bg-transparent",
    value: searchQuery,
    onChange: function onChange(e) {
      return setSearchQuery(e.target.value);
    }
  })), !hasSearch ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-0"
  }, filteredMenuStructure.map(function (section, idx) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: idx,
      className: "flex flex-col gap-1"
    }, /*#__PURE__*/_react["default"].createElement("h3", {
      className: "text-[10px] text-gray-500 text-left px-2 font-medium sticky top-0 bg-[#151618] z-10"
    }, section.label), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col gap-0.5"
    }, section.items.map(function (item, i) {
      return /*#__PURE__*/_react["default"].createElement("div", {
        key: i,
        className: "flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer group transition-colors relative ".concat(activeSubMenu === item.id ? "bg-[#2c3037] text-white" : "text-gray-300 hover:bg-[#212326] hover:text-white"),
        onMouseEnter: function onMouseEnter() {
          if (item.hasSubmenu) {
            setActiveSubMenu(item.id);
          } else {
            setActiveSubMenu(null);
          }
        },
        onClick: function onClick() {
          if (item.hasSubmenu) {
            setActiveSubMenu(item.id);
          } else if (item.action) {
            item.action();
          }
        }
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "flex items-center gap-3"
      }, /*#__PURE__*/_react["default"].createElement("span", {
        className: "text-gray-400 group-hover:text-white"
      }, item.icon), /*#__PURE__*/_react["default"].createElement("span", {
        className: "text-xs font-medium"
      }, item.label)), /*#__PURE__*/_react["default"].createElement("div", {
        className: "flex items-center gap-2"
      }, item.shortcut && /*#__PURE__*/_react["default"].createElement("span", {
        className: "text-[10px] text-gray-600"
      }, item.shortcut), item.hasSubmenu && /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
        size: 10,
        className: "text-gray-500"
      })));
    })));
  })) : renderSearchResults(), activeSubMenu && !hasSearch && /*#__PURE__*/_react["default"].createElement(Submenu, {
    activeSubMenu: activeSubMenu,
    menuStructure: menuStructure,
    getSubmenuItems: getSubmenuItems,
    handleAddNode: handleAddNode,
    parentRef: menuRef,
    onBack: function onBack() {
      return setActiveSubMenu(null);
    }
  })));
};
var Submenu = function Submenu(_ref4) {
  var _menuStructure$flatMa;
  var activeSubMenu = _ref4.activeSubMenu,
    menuStructure = _ref4.menuStructure,
    getSubmenuItems = _ref4.getSubmenuItems,
    handleAddNode = _ref4.handleAddNode,
    parentRef = _ref4.parentRef,
    onBack = _ref4.onBack;
  var _useState7 = (0, _react.useState)({
      side: "right",
      top: 0
    }),
    _useState8 = _slicedToArray(_useState7, 2),
    position = _useState8[0],
    setPosition = _useState8[1];
  var submenuRef = (0, _react.useRef)(null);
  (0, _react.useLayoutEffect)(function () {
    if (parentRef.current && submenuRef.current) {
      var parentRect = parentRef.current.getBoundingClientRect();
      var submenuRect = submenuRef.current.getBoundingClientRect();
      var windowWidth = window.innerWidth;
      var windowHeight = window.innerHeight;
      var newSide = "right";
      if (windowWidth < 640) {
        newSide = "overlay";
      } else {
        var spaceRight = windowWidth - parentRect.right;
        if (spaceRight < 260) {
          newSide = "left";
        }
      }
      var newTop = 0;
      if (newSide !== "overlay") {
        var projectedBottom = parentRect.top + submenuRect.height;
        if (projectedBottom > windowHeight) {
          var overlap = projectedBottom - windowHeight;
          newTop = -overlap - 10;
        }
      }
      setPosition({
        side: newSide,
        top: newTop
      });
    }
  }, [activeSubMenu, parentRef]);
  var getOverlayClass = function getOverlayClass() {
    if (position.side === "overlay") return "left-0 top-0 h-full w-full";
    if (position.side === "right") return "left-full ml-2";
    return "right-full mr-2";
  };
  var getLabelIcon = function getLabelIcon(label) {
    switch (label) {
      case "Input Models":
        return /*#__PURE__*/_react["default"].createElement(_lu.LuUpload, null);
      case "Text (LLMs)":
        return /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, null);
      case "Text Utilities":
      case "Utilities":
        return /*#__PURE__*/_react["default"].createElement(_tb.TbArrowMerge, {
          className: "rotate-90"
        });
      case "Generate Image":
        return /*#__PURE__*/_react["default"].createElement(_io.IoImageOutline, null);
      case "Edit Image":
        return /*#__PURE__*/_react["default"].createElement(_ri.RiImageAiLine, null);
      case "Upscale Image":
        return /*#__PURE__*/_react["default"].createElement(_md.MdCrop, null);
      case "Image Utilities":
        return /*#__PURE__*/_react["default"].createElement(_md.MdAutoFixHigh, null);
      case "Generate Video":
        return /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, null);
      case "Edit Video":
        return /*#__PURE__*/_react["default"].createElement(_ri.RiVideoOnAiLine, null);
      case "Upscale Video":
        return /*#__PURE__*/_react["default"].createElement(_md.MdCrop, null);
      case "Generate Audio":
        return /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineAudio, null);
      case "Api Node":
        return /*#__PURE__*/_react["default"].createElement(_ri.RiInputMethodLine, null);
      default:
        return null;
    }
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    ref: submenuRef,
    style: {
      top: position.side === "overlay" ? 0 : "".concat(position.top, "px")
    },
    className: "absolute flex flex-col gap-2 bg-[#151618] border border-gray-700 p-2 rounded-xl w-60 shadow-xl overflow-hidden z-50 ".concat(position.side === "overlay" ? "h-full" : "h-fit max-h-[80vh]", " ").concat(getOverlayClass())
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 text-[10px] text-gray-400 px-2 py-2 font-medium border-b border-gray-800 cursor-pointer hover:text-white transition-colors",
    onClick: function onClick() {
      return position.side === "overlay" && onBack();
    }
  }, position.side === "overlay" && /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, null), (_menuStructure$flatMa = menuStructure.flatMap(function (s) {
    return s.items;
  }).find(function (i) {
    return i.id === activeSubMenu;
  })) === null || _menuStructure$flatMa === void 0 ? void 0 : _menuStructure$flatMa.label), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar"
  }, getSubmenuItems(activeSubMenu).length > 0 ? getSubmenuItems(activeSubMenu).map(function (item, idx) {
    var _menuStructure$flatMa2;
    return /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      key: idx,
      className: "flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:bg-[#2c3037] hover:text-white rounded-lg cursor-pointer transition text-left",
      onClick: function onClick() {
        return handleAddNode(item.type, item.model);
      }
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-gray-400 group-hover:text-white text-sm"
    }, getLabelIcon((_menuStructure$flatMa2 = menuStructure.flatMap(function (s) {
      return s.items;
    }).find(function (i) {
      return i.id === activeSubMenu;
    })) === null || _menuStructure$flatMa2 === void 0 ? void 0 : _menuStructure$flatMa2.label)), /*#__PURE__*/_react["default"].createElement("span", {
      className: "truncate"
    }, item.label));
  }) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "px-2 py-4 text-xs text-gray-500 text-center"
  }, "No items available")));
};
var _default = exports["default"] = NodesNavbar;