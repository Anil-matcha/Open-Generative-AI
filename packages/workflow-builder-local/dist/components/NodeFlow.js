"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _navigation = require("next/navigation");
var _reactflow = _interopRequireWildcard(require("reactflow"));
var _bs = require("react-icons/bs");
var _fi = require("react-icons/fi");
var _tfi = require("react-icons/tfi");
var _md = require("react-icons/md");
var _lu = require("react-icons/lu");
var _fa = require("react-icons/fa6");
var _fa2 = require("react-icons/fa");
var _io = require("react-icons/io5");
var _reactHotToast = require("react-hot-toast");
var _axios = _interopRequireDefault(require("axios"));
var _TextNode = _interopRequireDefault(require("./TextNode"));
var _ImageNode = _interopRequireDefault(require("./ImageNode"));
var _VideoNode = _interopRequireDefault(require("./VideoNode"));
var _WorkflowStore = require("./WorkflowStore");
var _utility = require("./utility");
var _link = _interopRequireDefault(require("next/link"));
var _RenderField = _interopRequireDefault(require("./RenderField"));
var _PromptConcate = _interopRequireDefault(require("./PromptConcate"));
var _tb = require("react-icons/tb");
var _ri = require("react-icons/ri");
var _ApiNode = _interopRequireDefault(require("./ApiNode"));
var _RenderApiField = _interopRequireDefault(require("./RenderApiField"));
var _AudioNode = _interopRequireDefault(require("./AudioNode"));
var _NodesNavbar = _interopRequireDefault(require("./NodesNavbar"));
var _ChatWidget = _interopRequireDefault(require("./ChatWidget"));
var _ai = require("react-icons/ai");
var _VideoCombiner = _interopRequireDefault(require("./VideoCombiner"));
var _CharacterNode = _interopRequireDefault(require("./CharacterNode"));
var _useGenerationCost2 = require("./useGenerationCost");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t9 in e) "default" !== _t9 && {}.hasOwnProperty.call(e, _t9) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t9)) && (i.get || i.set) ? o(f, _t9, i) : f[_t9] = e[_t9]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
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
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // import "reactflow/dist/style.css";
var nodeTypes = {
  textNode: _TextNode["default"],
  imageNode: _ImageNode["default"],
  videoNode: _VideoNode["default"],
  audioNode: _AudioNode["default"],
  concatNode: _PromptConcate["default"],
  vidConcatNode: _VideoCombiner["default"],
  apiNode: _ApiNode["default"],
  characterNode: _CharacterNode["default"]
};
var initialNodes = [{
  id: "text1",
  position: {
    x: 0,
    y: 100
  },
  data: {},
  type: "textNode"
}, {
  id: "image1",
  position: {
    x: 300,
    y: 100
  },
  data: {},
  type: "imageNode"
}];
var initialEdges = [];
var edgeStyles = {
  blue: {
    stroke: '#3b82f6',
    // blue-500
    strokeWidth: 2
    // animated: true,
  },
  green: {
    stroke: '#22c55e',
    // green-500
    strokeWidth: 2
    // animated: true,
  },
  orange: {
    stroke: '#f97316',
    // orange-500
    strokeWidth: 2
    // animated: true,
  },
  gray: {
    stroke: '#6b7280',
    // gray-500
    strokeWidth: 2
  },
  yellow: {
    stroke: '#eab308',
    // yellow-500
    strokeWidth: 2
  },
  white: {
    stroke: '#ffffff',
    strokeWidth: 2
  },
  purple: {
    stroke: '#a855f7',
    // purple-500 — character / face reference
    strokeWidth: 2
  }
};
var getEdgeColor = function getEdgeColor(sourceHandle, targetHandle) {
  var sourceNode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var targetNode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  if (sourceHandle === "apiOutput" && sourceNode) {
    var _sourceNode$data$outp, _sourceNode$data$form;
    var output = (_sourceNode$data$outp = sourceNode.data.outputs) === null || _sourceNode$data$outp === void 0 ? void 0 : _sourceNode$data$outp[0];
    var modelType = (_sourceNode$data$form = sourceNode.data.formValues) === null || _sourceNode$data$form === void 0 ? void 0 : _sourceNode$data$form.model_type;
    if ((output === null || output === void 0 ? void 0 : output.type) === 'text' || modelType === 'chat') return "blue";
    if ((output === null || output === void 0 ? void 0 : output.type) === 'video_url' || modelType === 'video') return "orange";
    if ((output === null || output === void 0 ? void 0 : output.type) === 'audio_url' || modelType === 'audio') return "yellow";
    return "green";
  }
  if (["textOutput", "concatOutput"].includes(sourceHandle)) return "blue";
  if (["imageOutput"].includes(sourceHandle)) return "green";
  if (["videoOutput"].includes(sourceHandle)) return "orange";
  if (["audioOutput"].includes(sourceHandle)) return "yellow";
  if (["characterOutput"].includes(sourceHandle)) return "purple";
  if (["textInput", "textInput4", "imageInput", "videoInput", "audioInput2", "concatInput", "apiInput"].includes(targetHandle)) return "blue";
  if (["textInput2", "textInput3", "imageInput2", "imageInput3", "videoInput2", "videoInput3", "videoInput6", "audioInput3", "apiInput2", "apiInput3"].includes(targetHandle)) return "green";
  if (["videoInput4", "audioInput4", "videoInput7"].includes(targetHandle)) return "orange";
  if (["audioInput", "videoInput5", "videoInput8"].includes(targetHandle)) return "yellow";
  if (sourceNode) {
    var type = sourceNode.type;
    if (type === 'textNode' || type === 'concatNode') return "blue";
    if (type === 'imageNode') return "green";
    if (type === 'videoNode' || type === 'vidConcatNode') return "orange";
    if (type === 'audioNode') return "yellow";
  }
  return "white";
};
var iconMap = {
  "plus": /*#__PURE__*/_react["default"].createElement(_fa.FaPlus, {
    size: 20
  }),
  "image": /*#__PURE__*/_react["default"].createElement(_io.IoImageOutline, {
    size: 20
  }),
  "video": /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, {
    size: 20
  }),
  "audio": /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineAudio, {
    size: 20
  }),
  "text": /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, {
    size: 20
  })
};
var SPECIAL_MODEL_NAMES = {
  "text-passthrough": "Input Text",
  "image-passthrough": "Input Image",
  "video-passthrough": "Input Video",
  "audio-passthrough": "Input Audio",
  "doubao-seedance-2-0-260128": "Seedance 2.0",
  "doubao-seedance-2-0-fast-260128": "Seedance 2.0 Fast"
};
var formatName = function formatName(id) {
  return id.replace(/-/g, ' ').split(' ').map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
};
var getModelObjStatic = function getModelObjStatic(category, modelId, nodeSchemas) {
  var _nodeSchemas$categori2;
  if (category === "api") {
    var _nodeSchemas$categori;
    // We can't easily access filteredApiNodeModels statically without passing it, 
    // but we can compute it on the fly or just return null and let useEffect handle it if needed.
    // For now, let's just use the shared logic.
    var apiModelsFromBackend = nodeSchemas !== null && nodeSchemas !== void 0 && (_nodeSchemas$categori = nodeSchemas.categories) !== null && _nodeSchemas$categori !== void 0 && (_nodeSchemas$categori = _nodeSchemas$categori.api) !== null && _nodeSchemas$categori !== void 0 && _nodeSchemas$categori.models ? Object.keys(nodeSchemas.categories.api.models) : [];
    var filtered = _utility.apiNodeModels.filter(function (model) {
      return apiModelsFromBackend.includes(model.id);
    });
    return filtered.find(function (m) {
      return m.id === modelId;
    }) || null;
  }
  if (!modelId || !(nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories)) return null;
  var rawModel = (_nodeSchemas$categori2 = nodeSchemas.categories[category]) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.models) === null || _nodeSchemas$categori2 === void 0 ? void 0 : _nodeSchemas$categori2[modelId];
  if (!rawModel) return null;
  return _objectSpread(_objectSpread({}, rawModel), {}, {
    id: modelId,
    name: SPECIAL_MODEL_NAMES[modelId] || formatName(modelId)
  });
};
var processWorkflowData = function processWorkflowData(workflowData, nodeSchemas, id) {
  if (!workflowData || !(nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories)) return null;
  var workflow = workflowData === null || workflowData === void 0 ? void 0 : workflowData.data;
  if (!(workflow !== null && workflow !== void 0 && workflow.nodes)) return null;
  var restoredNodes = workflow.nodes.map(function (n) {
    var _n$position$x, _n$position, _n$position$y, _n$position2, _n$output_params, _n$output_params2, _workflowData$run_his;
    return {
      id: n.id,
      type: n.category === "utility" ? n.model === "video-combiner" ? "vidConcatNode" : "concatNode" : "".concat(n.category, "Node"),
      position: {
        x: (_n$position$x = (_n$position = n.position) === null || _n$position === void 0 ? void 0 : _n$position.x) !== null && _n$position$x !== void 0 ? _n$position$x : 350,
        y: (_n$position$y = (_n$position2 = n.position) === null || _n$position2 === void 0 ? void 0 : _n$position2.y) !== null && _n$position$y !== void 0 ? _n$position$y : 0
      },
      data: {
        nodeSchemas: nodeSchemas,
        modelId: n.model,
        selectedModel: getModelObjStatic(n.category, n.model, nodeSchemas),
        outputs: ((_n$output_params = n.output_params) === null || _n$output_params === void 0 ? void 0 : _n$output_params.outputs) || [],
        resultUrl: ((_n$output_params2 = n.output_params) === null || _n$output_params2 === void 0 ? void 0 : _n$output_params2.resultUrl) || null,
        formValues: n.input_params || {},
        outputHistory: (((_workflowData$run_his = workflowData.run_history) === null || _workflowData$run_his === void 0 ? void 0 : _workflowData$run_his[n.id]) || []).sort(function (a, b) {
          return new Date(a.started_at) - new Date(b.started_at);
        })
      }
    };
  });
  var restoredEdges = (workflowData.edges || []).map(function (e) {
    var sourceNode = restoredNodes.find(function (n) {
      return n.id === e.source;
    });
    var targetNode = restoredNodes.find(function (n) {
      return n.id === e.target;
    });
    var edgeColor = getEdgeColor(e.sourceHandle, e.targetHandle, sourceNode, targetNode);
    return {
      id: e.id || "".concat(e.source, "-").concat(e.target),
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      style: edgeStyles[edgeColor]
    };
  });
  return {
    nodes: restoredNodes,
    edges: restoredEdges,
    metadata: {
      workflowId: id,
      runId: workflowData === null || workflowData === void 0 ? void 0 : workflowData.run_id,
      workflowName: workflowData.name,
      interactionMode: workflowData.is_owner,
      publishWorkflow: workflowData.is_published,
      template: {
        showTemplateBtn: workflowData.show_temp_button,
        isPublishedTemplate: workflowData.is_template
      },
      category: (workflowData === null || workflowData === void 0 ? void 0 : workflowData.category) || "General"
    }
  };
};
var NodeFlow = function NodeFlow(_ref) {
  var _initialState$metadat, _initialState$metadat2, _initialState$metadat3, _initialState$metadat4, _initialState$metadat5, _initialState$metadat6, _initialState$metadat7, _nodeSchemas$categori3, _selectedNode$data, _selectedNode$data2, _selectedNode$data3, _selectedNode$data6, _selectedNode$data16, _selectedNode$data17, _selectedNode$data18, _selectedNode$data19, _selectedNode$data20;
  var initialNodeSchemas = _ref.initialNodeSchemas,
    initialWorkflowData = _ref.initialWorkflowData;
  var params = (0, _navigation.useParams)();
  var id = params.id;

  // Pre-calculate initial state if data is provided
  var initialState = (0, _react.useMemo)(function () {
    return processWorkflowData(initialWorkflowData, initialNodeSchemas, id);
  }, [initialWorkflowData, initialNodeSchemas, id]);
  var _useNodesState = (0, _reactflow.useNodesState)((initialState === null || initialState === void 0 ? void 0 : initialState.nodes) || []),
    _useNodesState2 = _slicedToArray(_useNodesState, 3),
    nodes = _useNodesState2[0],
    setNodes = _useNodesState2[1],
    onNodesChange = _useNodesState2[2];
  var _useEdgesState = (0, _reactflow.useEdgesState)((initialState === null || initialState === void 0 ? void 0 : initialState.edges) || initialEdges),
    _useEdgesState2 = _slicedToArray(_useEdgesState, 3),
    edges = _useEdgesState2[0],
    setEdges = _useEdgesState2[1],
    onEdgesChange = _useEdgesState2[2];
  var _useState = (0, _react.useState)(null),
    _useState2 = _slicedToArray(_useState, 2),
    activeHandleColor = _useState2[0],
    setActiveHandleColor = _useState2[1];
  var _useState3 = (0, _react.useState)({}),
    _useState4 = _slicedToArray(_useState3, 2),
    loadingNodes = _useState4[0],
    setLoadingNodes = _useState4[1];
  var _useState5 = (0, _react.useState)(0),
    _useState6 = _slicedToArray(_useState5, 2),
    isRunning = _useState6[0],
    setIsRunning = _useState6[1];
  var _useState7 = (0, _react.useState)(0),
    _useState8 = _slicedToArray(_useState7, 2),
    dropDown = _useState8[0],
    setDropDown = _useState8[1];
  var _useState9 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat = initialState.metadata) === null || _initialState$metadat === void 0 ? void 0 : _initialState$metadat.workflowName) || "Untitled"),
    _useState0 = _slicedToArray(_useState9, 2),
    workflowName = _useState0[0],
    setWorkflowName = _useState0[1];
  var _useState1 = (0, _react.useState)(id),
    _useState10 = _slicedToArray(_useState1, 2),
    workflowId = _useState10[0],
    setWorkflowId = _useState10[1];
  var _useState11 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat2 = initialState.metadata) === null || _initialState$metadat2 === void 0 ? void 0 : _initialState$metadat2.runId) || null),
    _useState12 = _slicedToArray(_useState11, 2),
    runId = _useState12[0],
    setRunId = _useState12[1];
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    hasFit = _useState14[0],
    setHasFit = _useState14[1];
  var _useState15 = (0, _react.useState)(initialNodeSchemas || {}),
    _useState16 = _slicedToArray(_useState15, 2),
    nodeSchemas = _useState16[0],
    setNodeSchemas = _useState16[1];
  var _useState17 = (0, _react.useState)(null),
    _useState18 = _slicedToArray(_useState17, 2),
    contextMenu = _useState18[0],
    setContextMenu = _useState18[1];
  var _useState19 = (0, _react.useState)({
      x: 0,
      y: 0
    }),
    _useState20 = _slicedToArray(_useState19, 2),
    mousePos = _useState20[0],
    setMousePos = _useState20[1];
  var _useState21 = (0, _react.useState)(null),
    _useState22 = _slicedToArray(_useState21, 2),
    draggedEdgeInfo = _useState22[0],
    setDraggedEdgeInfo = _useState22[1];
  var _useState23 = (0, _react.useState)(null),
    _useState24 = _slicedToArray(_useState23, 2),
    edgePicker = _useState24[0],
    setEdgePicker = _useState24[1];
  var connectionMadeRef = (0, _react.useRef)(false);
  var onConnectRef = (0, _react.useRef)(null);
  var _useState25 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat3 = initialState.metadata) === null || _initialState$metadat3 === void 0 ? void 0 : _initialState$metadat3.interactionMode) || false),
    _useState26 = _slicedToArray(_useState25, 2),
    interactionMode = _useState26[0],
    setInteractionMode = _useState26[1];
  var _useState27 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat4 = initialState.metadata) === null || _initialState$metadat4 === void 0 ? void 0 : _initialState$metadat4.publishWorkflow) || false),
    _useState28 = _slicedToArray(_useState27, 2),
    publishWorkflow = _useState28[0],
    setPublishWorkflow = _useState28[1];
  var _useState29 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat5 = initialState.metadata) === null || _initialState$metadat5 === void 0 ? void 0 : _initialState$metadat5.template) || {
      showTemplateBtn: false,
      isPublishedTemplate: false
    }),
    _useState30 = _slicedToArray(_useState29, 2),
    template = _useState30[0],
    setTemplate = _useState30[1];
  var _useState31 = (0, _react.useState)(true),
    _useState32 = _slicedToArray(_useState31, 2),
    isDragging = _useState32[0],
    setIsDragging = _useState32[1];
  var _useState33 = (0, _react.useState)(""),
    _useState34 = _slicedToArray(_useState33, 2),
    modelSearch = _useState34[0],
    setModelSearch = _useState34[1];
  var _useState35 = (0, _react.useState)(true),
    _useState36 = _slicedToArray(_useState35, 2),
    isPresetsDismissed = _useState36[0],
    setIsPresetsDismissed = _useState36[1];
  var _useState37 = (0, _react.useState)(!initialState),
    _useState38 = _slicedToArray(_useState37, 2),
    isRestoring = _useState38[0],
    setIsRestoring = _useState38[1];
  var _useState39 = (0, _react.useState)(0),
    _useState40 = _slicedToArray(_useState39, 2),
    totalWorkflowCost = _useState40[0],
    setTotalWorkflowCost = _useState40[1];
  (0, _react.useEffect)(function () {
    var total = nodes.reduce(function (sum, node) {
      var _node$data;
      var cost = parseFloat((_node$data = node.data) === null || _node$data === void 0 ? void 0 : _node$data.cost) || 0;
      return sum + cost;
    }, 0);
    setTotalWorkflowCost(total.toFixed(3));
  }, [nodes]);

  // Sync global store with initial data if provided
  (0, _react.useEffect)(function () {
    if (initialState !== null && initialState !== void 0 && initialState.metadata) {
      (0, _WorkflowStore.setWorkflowIds)(id, initialState.metadata.runId);
    }
  }, [id, initialState]);
  var _useState41 = (0, _react.useState)(false),
    _useState42 = _slicedToArray(_useState41, 2),
    isChatOpen = _useState42[0],
    setIsChatOpen = _useState42[1];
  var _useState43 = (0, _react.useState)([]),
    _useState44 = _slicedToArray(_useState43, 2),
    chatMessages = _useState44[0],
    setChatMessages = _useState44[1];
  var _useState45 = (0, _react.useState)(false),
    _useState46 = _slicedToArray(_useState45, 2),
    isChatLoading = _useState46[0],
    setIsChatLoading = _useState46[1];
  var _useState47 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat6 = initialState.metadata) === null || _initialState$metadat6 === void 0 ? void 0 : _initialState$metadat6.category) || "General"),
    _useState48 = _slicedToArray(_useState47, 2),
    workflowCategory = _useState48[0],
    setWorkflowCategory = _useState48[1];
  var _useState49 = (0, _react.useState)((initialState === null || initialState === void 0 || (_initialState$metadat7 = initialState.metadata) === null || _initialState$metadat7 === void 0 ? void 0 : _initialState$metadat7.category) || "General"),
    _useState50 = _slicedToArray(_useState49, 2),
    categoryInput = _useState50[0],
    setCategoryInput = _useState50[1];
  var _useState51 = (0, _react.useState)(false),
    _useState52 = _slicedToArray(_useState51, 2),
    isCategoryPopupOpen = _useState52[0],
    setIsCategoryPopupOpen = _useState52[1];
  var _useState53 = (0, _react.useState)(false),
    _useState54 = _slicedToArray(_useState53, 2),
    isSettingsOpen = _useState54[0],
    setIsSettingsOpen = _useState54[1];
  var _useState55 = (0, _react.useState)(false),
    _useState56 = _slicedToArray(_useState55, 2),
    isModelDropdownUp = _useState56[0],
    setIsModelDropdownUp = _useState56[1];
  var modelDropdownTriggerRef = (0, _react.useRef)(null);
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    zoomIn = _useReactFlow.zoomIn,
    zoomOut = _useReactFlow.zoomOut,
    _fitView = _useReactFlow.fitView,
    getNodes = _useReactFlow.getNodes,
    screenToFlowPosition = _useReactFlow.screenToFlowPosition;
  var apiModelsFromBackend = nodeSchemas !== null && nodeSchemas !== void 0 && (_nodeSchemas$categori3 = nodeSchemas.categories) !== null && _nodeSchemas$categori3 !== void 0 && (_nodeSchemas$categori3 = _nodeSchemas$categori3.api) !== null && _nodeSchemas$categori3 !== void 0 && _nodeSchemas$categori3.models ? Object.keys(nodeSchemas.categories.api.models) : [];
  var filteredApiNodeModels = _utility.apiNodeModels.filter(function (model) {
    return apiModelsFromBackend.includes(model.id);
  });
  var loadPreset = function loadPreset(preset) {
    setIsPresetsDismissed(true);
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setTimeout(function () {
      return _fitView({
        padding: 0.4,
        duration: 500
      });
    }, 100);
  };

  // Moved SPECIAL_MODEL_NAMES, formatName and getModelObj logic to static helpers above

  (0, _react.useEffect)(function () {
    if (!initialNodeSchemas) {
      _axios["default"].get("/api/workflow/".concat(id, "/node-schemas")).then(function (res) {
        return setNodeSchemas(res.data || {});
      })["catch"](function (err) {
        return console.error("Failed to load node schemas", err);
      });
    }
    var handleMouseMove = function handleMouseMove(e) {
      setMousePos({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return function () {
      return window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  (0, _react.useLayoutEffect)(function () {
    if (dropDown === 3 && modelDropdownTriggerRef.current) {
      var rect = modelDropdownTriggerRef.current.getBoundingClientRect();
      var windowHeight = window.innerHeight;
      var spaceBelow = windowHeight - rect.bottom;
      setIsModelDropdownUp(spaceBelow < 250);
    }
  }, [dropDown]);
  (0, _react.useEffect)(function () {
    if (!(nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories)) return;
    setNodes(function (prev) {
      var needsUpdate = prev.some(function (n) {
        return n.data.nodeSchemas !== nodeSchemas;
      });
      if (!needsUpdate) return prev;
      return prev.map(function (n) {
        return _objectSpread(_objectSpread({}, n), {}, {
          data: _objectSpread(_objectSpread({}, n.data), {}, {
            nodeSchemas: nodeSchemas
          })
        });
      });
    });
  }, [nodeSchemas]);
  var getModelObj = (0, _react.useCallback)(function (category, modelId) {
    return getModelObjStatic(category, modelId, nodeSchemas);
  }, [nodeSchemas]);
  var restoreWorkflow = (0, _react.useCallback)(function (workflowData) {
    var workflow = workflowData === null || workflowData === void 0 ? void 0 : workflowData.data;
    if (!(workflow !== null && workflow !== void 0 && workflow.nodes)) return;
    var restoredNodes = workflow.nodes.map(function (n) {
      var _n$position$x2, _n$position3, _n$position$y2, _n$position4, _n$output_params3, _n$output_params4, _workflowData$run_his2;
      return {
        id: n.id,
        type: n.category === "utility" ? n.model === "video-combiner" ? "vidConcatNode" : "concatNode" : "".concat(n.category, "Node"),
        position: {
          x: (_n$position$x2 = (_n$position3 = n.position) === null || _n$position3 === void 0 ? void 0 : _n$position3.x) !== null && _n$position$x2 !== void 0 ? _n$position$x2 : 350,
          y: (_n$position$y2 = (_n$position4 = n.position) === null || _n$position4 === void 0 ? void 0 : _n$position4.y) !== null && _n$position$y2 !== void 0 ? _n$position$y2 : 0
        },
        data: {
          nodeSchemas: nodeSchemas,
          modelId: n.model,
          selectedModel: getModelObj(n.category, n.model),
          outputs: ((_n$output_params3 = n.output_params) === null || _n$output_params3 === void 0 ? void 0 : _n$output_params3.outputs) || [],
          resultUrl: ((_n$output_params4 = n.output_params) === null || _n$output_params4 === void 0 ? void 0 : _n$output_params4.resultUrl) || null,
          formValues: n.input_params || {},
          outputHistory: (((_workflowData$run_his2 = workflowData.run_history) === null || _workflowData$run_his2 === void 0 ? void 0 : _workflowData$run_his2[n.id]) || []).sort(function (a, b) {
            return new Date(a.started_at) - new Date(b.started_at);
          })
        }
      };
    });
    var restoredEdges = (workflowData.edges || []).map(function (e) {
      var sourceNode = restoredNodes.find(function (n) {
        return n.id === e.source;
      });
      var targetNode = restoredNodes.find(function (n) {
        return n.id === e.target;
      });
      var edgeColor = getEdgeColor(e.sourceHandle, e.targetHandle, sourceNode, targetNode);
      return {
        id: e.id || "".concat(e.source, "-").concat(e.target),
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        style: edgeStyles[edgeColor]
      };
    });
    setNodes(restoredNodes);
    setEdges(restoredEdges);
    setWorkflowId(id);
    setRunId(workflowData === null || workflowData === void 0 ? void 0 : workflowData.run_id);
    setWorkflowName(workflowData.name);
    setWorkflowCategory((workflowData === null || workflowData === void 0 ? void 0 : workflowData.category) || "General");
    (0, _WorkflowStore.setWorkflowIds)(workflowData.workflow_id, workflowData === null || workflowData === void 0 ? void 0 : workflowData.run_id);
    setInteractionMode(workflowData.is_owner);
    setPublishWorkflow(workflowData.is_published);
    setTemplate(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        showTemplateBtn: workflowData.show_temp_button,
        isPublishedTemplate: workflowData.is_template
      });
    });
    setIsRestoring(false);
  }, [id, nodeSchemas, getModelObj, setNodes, setEdges]);
  (0, _react.useEffect)(function () {
    if (initialWorkflowData && nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories) {
      return;
    }
    if (!id || !(nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories)) return;
    _axios["default"].get("/api/workflow/get-workflow-def/".concat(id)).then(function (res) {
      restoreWorkflow(res.data);
    })["catch"](function (error) {
      console.log(error);
      setInteractionMode(false);
      setIsRestoring(false);
    });
  }, [id, nodeSchemas, initialWorkflowData, restoreWorkflow]);
  (0, _react.useEffect)(function () {
    if (isRestoring) return;
    if (nodes.length > 0 && !hasFit) {
      var timeout = setTimeout(function () {
        _fitView({
          padding: 0.4,
          duration: 500,
          minZoom: 0.2
        });
        setHasFit(true);
      }, 100);
      return function () {
        return clearTimeout(timeout);
      };
    } else if (nodes.length === 0) {
      setIsPresetsDismissed(false);
    }
    ;
  }, [nodes, hasFit, _fitView, isRestoring]);
  var arrangeNodesInRow = (0, _react.useCallback)(function () {
    var spacing = 350;
    var y = 100;
    setNodes(function (nds) {
      return nds.map(function (node, index) {
        return _objectSpread(_objectSpread({}, node), {}, {
          position: {
            x: index * spacing,
            y: y
          }
        });
      });
    });
  }, [setNodes]);
  (0, _react.useEffect)(function () {
    if (workflowId) return;
    arrangeNodesInRow();
  }, [arrangeNodesInRow]);
  (0, _react.useEffect)(function () {
    setNodes(function (prevNodes) {
      var edgesBySource = {};
      edges.forEach(function (edge) {
        if (!edgesBySource[edge.source]) edgesBySource[edge.source] = [];
        edgesBySource[edge.source].push(edge);
      });
      var needsUpdate = prevNodes.some(function (node) {
        var currentEdges = node.data.connectedEdges || [];
        var newEdges = edgesBySource[node.id] || [];
        if (currentEdges.length !== newEdges.length) return true;
        var currentIds = currentEdges.map(function (e) {
          return e.id;
        }).sort().join(',');
        var newIds = newEdges.map(function (e) {
          return e.id;
        }).sort().join(',');
        return currentIds !== newIds;
      });
      if (!needsUpdate) return prevNodes;
      return prevNodes.map(function (node) {
        return _objectSpread(_objectSpread({}, node), {}, {
          data: _objectSpread(_objectSpread({}, node.data), {}, {
            connectedEdges: edgesBySource[node.id] || []
          })
        });
      });
    });
  }, [edges, setNodes]);
  var onDataChange = function onDataChange(id, newData) {
    var targetNodeId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    setNodes(function (prevNodes) {
      var _newData$outputs;
      var updatedNodes = prevNodes.map(function (node) {
        var match = node.id.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '');
        return match ? _objectSpread(_objectSpread({}, node), {}, {
          data: _objectSpread(_objectSpread({}, node.data), newData)
        }) : node;
      });
      if (newData.errorMsg && newData.errorMsg !== null) {
        updatedNodes = updatedNodes.map(function (node) {
          return node.id === id ? _objectSpread(_objectSpread({}, node), {}, {
            data: _objectSpread(_objectSpread({}, node.data), {}, {
              errorMsg: newData.errorMsg
            })
          }) : node;
        });
        return updatedNodes;
      }
      var connectedEdges = edges.filter(function (e) {
        return e.source === id;
      });
      if (targetNodeId) {
        connectedEdges = connectedEdges.filter(function (e) {
          return e.target === targetNodeId;
        });
      }
      if (!connectedEdges.length) return updatedNodes;
      var resultValue = newData.resultUrl || ((_newData$outputs = newData.outputs) === null || _newData$outputs === void 0 || (_newData$outputs = _newData$outputs[0]) === null || _newData$outputs === void 0 ? void 0 : _newData$outputs.value);
      // if (!resultValue) return updatedNodes;

      updatedNodes = updatedNodes.map(function (node) {
        var _sourceNode$data;
        var edge = connectedEdges.find(function (e) {
          return e.target === node.id;
        });
        if (!edge) return node;
        var targetHandle = edge.targetHandle;
        var updatedFormValues = _objectSpread({}, node.data.formValues);
        var sourceNode = updatedNodes.find(function (n) {
          return n.id === edge.source;
        });
        var sourceValue = (sourceNode === null || sourceNode === void 0 ? void 0 : sourceNode.type) === "concatNode" ? sourceNode === null || sourceNode === void 0 || (_sourceNode$data = sourceNode.data) === null || _sourceNode$data === void 0 || (_sourceNode$data = _sourceNode$data.formValues) === null || _sourceNode$data === void 0 ? void 0 : _sourceNode$data.prompt : resultValue;

        // A Character node plugged into a video node is a face reference — route
        // it to face_asset (reference_image) regardless of which image handle it
        // lands on, instead of treating it as a first-frame image.
        if ((sourceNode === null || sourceNode === void 0 ? void 0 : sourceNode.type) === "characterNode" && node.type === "videoNode") {
          var _sourceNode$data2;
          updatedFormValues.face_asset = resultValue;
          updatedFormValues.face_thumbnail = (sourceNode === null || sourceNode === void 0 || (_sourceNode$data2 = sourceNode.data) === null || _sourceNode$data2 === void 0 || (_sourceNode$data2 = _sourceNode$data2.formValues) === null || _sourceNode$data2 === void 0 ? void 0 : _sourceNode$data2.character_photo) || updatedFormValues.face_thumbnail || null;
        } else if (["textInput", "imageInput", "videoInput", "audioInput2", "apiInput"].includes(targetHandle)) {
          updatedFormValues.prompt = sourceValue;
        } else if (targetHandle === "textInput4") {
          updatedFormValues.system_prompt = sourceValue;
        } else if (["textInput3", "imageInput2", "videoInput6"].includes(targetHandle)) {
          var _resultValue$trim;
          var existing = Array.isArray(updatedFormValues.images_list) ? updatedFormValues.images_list : [];
          // Only assign a new array when the value is actually added — otherwise we
          // churn the reference every pass and feed an infinite update loop.
          if (resultValue && ((_resultValue$trim = resultValue.trim) === null || _resultValue$trim === void 0 ? void 0 : _resultValue$trim.call(resultValue)) !== "" && !existing.includes(resultValue)) {
            updatedFormValues.images_list = [].concat(_toConsumableArray(existing), [resultValue]);
          } else {
            updatedFormValues.images_list = existing;
          }
        } else if (targetHandle === "apiInput2") {
          var list = Array.isArray(updatedFormValues.images) ? _toConsumableArray(updatedFormValues.images) : [];
          if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") list.push(resultValue);
          updatedFormValues.images = list;
        } else if (["textInput2", "videoInput2", "imageInput3", "audioInput3"].includes(targetHandle)) {
          if (targetHandle === "videoInput2" && updatedFormValues.image_url && updatedFormValues.image_url !== resultValue) {
            var _list = Array.isArray(updatedFormValues.images_list) ? _toConsumableArray(updatedFormValues.images_list) : [];
            if (!_list.includes(resultValue) && resultValue && resultValue.trim() !== "") _list.push(resultValue);
            updatedFormValues.images_list = _list;
          } else {
            updatedFormValues.image_url = resultValue;
          }
        } else if (targetHandle === "apiInput3") {
          updatedFormValues.image = resultValue;
        } else if (targetHandle === "videoInput3") {
          updatedFormValues.last_image = resultValue;
        } else if (["videoInput4", "audioInput4"].includes(targetHandle)) {
          updatedFormValues.video_url = resultValue;
        } else if (targetHandle === "videoInput7") {
          var key = updatedFormValues.video_files ? "video_files" : "videos_list";
          var _list2 = Array.isArray(updatedFormValues[key]) ? _toConsumableArray(updatedFormValues[key]) : [];
          if (!_list2.includes(resultValue) && resultValue && resultValue.trim() !== "") _list2.push(resultValue);
          updatedFormValues[key] = _list2;
        } else if (targetHandle === "videoInput8") {
          var _key = updatedFormValues.audio_files ? "audio_files" : "audios_list";
          var _list3 = Array.isArray(updatedFormValues[_key]) ? _toConsumableArray(updatedFormValues[_key]) : [];
          if (!_list3.includes(resultValue) && resultValue && resultValue.trim() !== "") _list3.push(resultValue);
          updatedFormValues[_key] = _list3;
        } else if (["videoInput5", "audioInput"].includes(targetHandle)) {
          updatedFormValues.audio_url = resultValue;
        } else if (node.type === "apiNode") {
          var _node$data$taskData;
          var listFields = ["images", "image_urls", "images_list"];
          var isList = listFields.includes(targetHandle) || ((_node$data$taskData = node.data.taskData) === null || _node$data$taskData === void 0 || (_node$data$taskData = _node$data$taskData[targetHandle]) === null || _node$data$taskData === void 0 ? void 0 : _node$data$taskData.type) === "array";
          if (isList) {
            var _list4 = Array.isArray(updatedFormValues[targetHandle]) ? _toConsumableArray(updatedFormValues[targetHandle]) : [];
            if (sourceValue && sourceValue.trim() !== "" && !_list4.includes(sourceValue)) {
              _list4.push(sourceValue);
            }
            updatedFormValues[targetHandle] = _list4;
          } else {
            updatedFormValues[targetHandle] = sourceValue;
          }
        }
        return _objectSpread(_objectSpread({}, node), {}, {
          data: _objectSpread(_objectSpread({}, node.data), {}, {
            formValues: updatedFormValues
          })
        });
      });
      updatedNodes = updatedNodes.map(function (node) {
        if (node.type !== "concatNode") return node;
        var allConcatEdges = edges.filter(function (e) {
          return e.target === node.id && e.targetHandle === "concatInput";
        });
        if (allConcatEdges.length === 0) {
          return _objectSpread(_objectSpread({}, node), {}, {
            data: _objectSpread(_objectSpread({}, node.data), {}, {
              formValues: _objectSpread(_objectSpread({}, node.data.formValues), {}, {
                prompt: ""
              })
            })
          });
        }
        var concatValues = allConcatEdges.map(function (e) {
          var _sourceNode$data3, _sourceNode$data4;
          var sourceNode = updatedNodes.find(function (n) {
            return n.id === e.source;
          });
          return (sourceNode === null || sourceNode === void 0 || (_sourceNode$data3 = sourceNode.data) === null || _sourceNode$data3 === void 0 ? void 0 : _sourceNode$data3.resultUrl) || (sourceNode === null || sourceNode === void 0 || (_sourceNode$data4 = sourceNode.data) === null || _sourceNode$data4 === void 0 || (_sourceNode$data4 = _sourceNode$data4.outputs) === null || _sourceNode$data4 === void 0 || (_sourceNode$data4 = _sourceNode$data4[0]) === null || _sourceNode$data4 === void 0 ? void 0 : _sourceNode$data4.value) || "";
        }).filter(function (v) {
          return typeof v === "string" && v.trim() !== "";
        });
        return _objectSpread(_objectSpread({}, node), {}, {
          data: _objectSpread(_objectSpread({}, node.data), {}, {
            formValues: _objectSpread(_objectSpread({}, node.data.formValues), {}, {
              prompt: concatValues.length > 0 ? concatValues.join(" ").trim() : ""
            })
          })
        });
      });
      return updatedNodes;
    });
    if (newData.hasOwnProperty('isLoading')) {
      setLoadingNodes(function (prev) {
        var newLoadingNodes = _objectSpread({}, prev);
        if (newData.isLoading) {
          newLoadingNodes[id] = true;
        } else {
          delete newLoadingNodes[id];
        }
        return newLoadingNodes;
      });
    }
  };
  var onConnect = (0, _react.useCallback)(function (params) {
    var targetNodeExists = nodes.some(function (n) {
      return n.id === params.target;
    });
    if (targetNodeExists) {
      connectionMadeRef.current = true;
    }
    setEdges(function (eds) {
      var _sourceData$outputs, _sourceNode$data5;
      var sourceNode = nodes.find(function (n) {
        return n.id === params.source;
      }) || {};
      var targetNode = nodes.find(function (n) {
        return n.id === params.target;
      }) || {};
      var color = getEdgeColor(params.sourceHandle, params.targetHandle, sourceNode, targetNode);
      if (color === "blue" && (targetNode === null || targetNode === void 0 ? void 0 : targetNode.type) !== "concatNode" && targetNode.type !== "apiNode") {
        var hasExistingBlueConnection = eds.some(function (edge) {
          if (edge.target !== params.target) return false;
          // // Allow different handles to coexist even if they are both blue
          if (edge.targetHandle !== params.targetHandle) return false;
          var edgeColor = ["textInput", "imageInput", "videoInput", "audioInput2", "concatInput", "textInput4"].includes(edge.targetHandle) || ["textOutput", "concatOutput"].includes(edge.sourceHandle) ? "blue" : "other";
          return edgeColor === "blue";
        });
        if (hasExistingBlueConnection) {
          return eds;
        }
      }
      var newEdges = (0, _reactflow.addEdge)(_objectSpread(_objectSpread({}, params), {}, {
        style: edgeStyles[color]
      }), eds);
      if (!sourceNode || !targetNode || !sourceNode.data) return newEdges;
      var sourceData = sourceNode.data;
      var resultValue = sourceData.viewingOutput !== undefined ? sourceData.viewingOutput : sourceData.resultUrl || ((_sourceData$outputs = sourceData.outputs) === null || _sourceData$outputs === void 0 || (_sourceData$outputs = _sourceData$outputs[0]) === null || _sourceData$outputs === void 0 ? void 0 : _sourceData$outputs.value) || null;
      // if (!resultValue || resultValue.trim() === "") return newEdges;

      var sourceValue = (sourceNode === null || sourceNode === void 0 ? void 0 : sourceNode.type) === "concatNode" ? sourceNode === null || sourceNode === void 0 || (_sourceNode$data5 = sourceNode.data) === null || _sourceNode$data5 === void 0 || (_sourceNode$data5 = _sourceNode$data5.formValues) === null || _sourceNode$data5 === void 0 ? void 0 : _sourceNode$data5.prompt : resultValue;
      setNodes(function (prev) {
        return prev.map(function (n) {
          if (n.id !== targetNode.id) return n;
          var updatedFormValues = _objectSpread({}, n.data.formValues);
          if (n.id === params.target && n.type === "apiNode") {
            var _n$data$taskData;
            var listFields = ["images", "image_urls", "images_list"];
            var isList = listFields.includes(params.targetHandle) || ((_n$data$taskData = n.data.taskData) === null || _n$data$taskData === void 0 || (_n$data$taskData = _n$data$taskData[params.targetHandle]) === null || _n$data$taskData === void 0 ? void 0 : _n$data$taskData.type) === "array";
            if (isList) {
              var list = Array.isArray(updatedFormValues[params.targetHandle]) ? _toConsumableArray(updatedFormValues[params.targetHandle]) : [];
              if (sourceValue && sourceValue.trim() !== "" && !list.includes(sourceValue)) {
                list.push(sourceValue);
              }
              updatedFormValues[params.targetHandle] = list;
            } else {
              updatedFormValues[params.targetHandle] = sourceValue;
            }
          }

          // CharacterNode → VideoNode: treat the face reference as face_asset,
          // carry the thumbnail for display, and tag @Name into the prompt
          // (same UX as Video Studio).
          if ((sourceNode === null || sourceNode === void 0 ? void 0 : sourceNode.type) === "characterNode" && n.type === "videoNode") {
            var _sourceNode$data6, _sourceNode$data7;
            updatedFormValues.face_asset = resultValue || null;
            updatedFormValues.face_thumbnail = (sourceNode === null || sourceNode === void 0 || (_sourceNode$data6 = sourceNode.data) === null || _sourceNode$data6 === void 0 || (_sourceNode$data6 = _sourceNode$data6.formValues) === null || _sourceNode$data6 === void 0 ? void 0 : _sourceNode$data6.character_photo) || null;
            var cname = sourceNode === null || sourceNode === void 0 || (_sourceNode$data7 = sourceNode.data) === null || _sourceNode$data7 === void 0 || (_sourceNode$data7 = _sourceNode$data7.formValues) === null || _sourceNode$data7 === void 0 ? void 0 : _sourceNode$data7.character_name;
            if (cname && cname.trim()) {
              var token = "@" + cname.trim().replace(/\s+/g, "_");
              var cur = updatedFormValues.prompt || "";
              if (!cur.includes(token)) {
                updatedFormValues.prompt = (cur ? cur.trimEnd() + " " : "") + token;
              }
            }
          }
          if (color === "blue") {
            if (targetNode.type === "concatNode" && params.targetHandle === "concatInput") {
              var allConcatEdges = newEdges.filter(function (e) {
                return e.target === targetNode.id && e.targetHandle === "concatInput";
              });
              var concatValues = allConcatEdges.map(function (e) {
                var _sourceNode$data8, _sourceNode$data9;
                if (e.source === params.source) return resultValue;
                var sourceNode = prev.find(function (node) {
                  return node.id === e.source;
                });
                return (sourceNode === null || sourceNode === void 0 || (_sourceNode$data8 = sourceNode.data) === null || _sourceNode$data8 === void 0 ? void 0 : _sourceNode$data8.resultUrl) || (sourceNode === null || sourceNode === void 0 || (_sourceNode$data9 = sourceNode.data) === null || _sourceNode$data9 === void 0 || (_sourceNode$data9 = _sourceNode$data9.outputs) === null || _sourceNode$data9 === void 0 || (_sourceNode$data9 = _sourceNode$data9[0]) === null || _sourceNode$data9 === void 0 ? void 0 : _sourceNode$data9.value) || "";
              }).filter(function (v) {
                return v;
              });
              updatedFormValues.prompt = concatValues.join(" ");
            } else if (["textInput", "imageInput", "videoInput", "audioInput2", "apiInput"].includes(params.targetHandle)) {
              updatedFormValues.prompt = sourceValue || "";
            } else if (params.targetHandle === "textInput4") {
              updatedFormValues.system_prompt = sourceValue || "";
            }
          }
          if (color === "green") {
            if (["textInput2", "videoInput2", "imageInput3", "audioInput3"].includes(params.targetHandle)) {
              // If image_url is already occupied on a videoNode, stack into images_list
              // so both images reach Seedance as reference_images instead of overwriting.
              if (params.targetHandle === "videoInput2" && updatedFormValues.image_url && updatedFormValues.image_url !== resultValue) {
                var _list5 = Array.isArray(updatedFormValues.images_list) ? _toConsumableArray(updatedFormValues.images_list) : [];
                if (!_list5.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                  _list5.push(resultValue);
                }
                updatedFormValues.images_list = _list5;
              } else {
                updatedFormValues.image_url = resultValue || null;
              }
            } else if (["textInput3", "imageInput2", "videoInput6"].includes(params.targetHandle)) {
              var _list6 = Array.isArray(updatedFormValues.images_list) ? _toConsumableArray(updatedFormValues.images_list) : [];
              if (!_list6.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                _list6.push(resultValue);
              }
              updatedFormValues.images_list = _list6;
            } else if (params.targetHandle === "apiInput2") {
              var _list7 = Array.isArray(updatedFormValues.images) ? _toConsumableArray(updatedFormValues.images) : [];
              if (!_list7.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                _list7.push(resultValue);
              }
              updatedFormValues.images = _list7;
            } else if (params.targetHandle === "videoInput3") {
              updatedFormValues.last_image = resultValue || null;
            } else if (params.targetHandle === "apiInput3") {
              updatedFormValues.image = resultValue || null;
            }
          }
          if (color === "orange") {
            if (["videoInput4", "audioInput4"].includes(params.targetHandle)) {
              updatedFormValues.video_url = resultValue || null;
            } else if (params.targetHandle === "videoInput7") {
              var key = updatedFormValues.video_files ? "video_files" : "videos_list";
              var _list8 = Array.isArray(updatedFormValues[key]) ? _toConsumableArray(updatedFormValues[key]) : [];
              if (!_list8.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                _list8.push(resultValue);
              }
              updatedFormValues[key] = _list8;
            }
          }
          if (color === "yellow") {
            if (["audioInput", "videoInput5"].includes(params.targetHandle)) {
              updatedFormValues.audio_url = resultValue !== undefined ? resultValue : null;
            }
            if (params.targetHandle === "videoInput8") {
              var _key2 = updatedFormValues.audio_files ? "audio_files" : "audios_list";
              var _list9 = Array.isArray(updatedFormValues[_key2]) ? _toConsumableArray(updatedFormValues[_key2]) : [];
              if (!_list9.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                _list9.push(resultValue);
              }
              updatedFormValues[_key2] = _list9;
            }
          }
          return _objectSpread(_objectSpread({}, n), {}, {
            data: _objectSpread(_objectSpread({}, n.data), {}, {
              formValues: updatedFormValues
            })
          });
        });
      });
      return newEdges;
    });
  }, [nodes]);
  var pollArchitectStatus = function pollArchitectStatus(request_id) {
    var interval = setInterval(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var response, finalData, status, message, suggestions, workflow, newAgentMessage, idMapping, counts, newNodes, newEdges, errorMessage, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            _context.n = 1;
            return _axios["default"].get("/api/workflow/poll-architect/".concat(request_id, "/result"));
          case 1:
            response = _context.v;
            finalData = response.data;
            status = finalData.status;
            if (!(status === "completed")) {
              _context.n = 2;
              break;
            }
            clearInterval(interval);
            message = finalData.message, suggestions = finalData.suggestions, workflow = finalData.workflow;
            newAgentMessage = {
              role: "agent",
              content: message || "Tasks complete. Your workflow has been updated.",
              suggestions: suggestions || [],
              timestamp: new Date().toISOString()
            };
            setChatMessages(function (prev) {
              return [].concat(_toConsumableArray(prev), [newAgentMessage]);
            });
            if (workflow && workflow.nodes) {
              idMapping = {};
              counts = {
                text: 0,
                image: 0,
                video: 0,
                audio: 0
              };
              newNodes = workflow.nodes.map(function (n) {
                var _n$position$x3, _n$position5, _n$position$y3, _n$position6, _n$output_params5, _n$output_params6, _existingNode$data;
                var newId = n.id;
                var category = n.category;
                if (["user_text", "prompt_gen"].includes(n.id) || category === "text") {
                  counts.text++;
                  newId = "text".concat(counts.text);
                } else if (n.id === "image_gen" || category === "image") {
                  counts.image++;
                  newId = "image".concat(counts.image);
                } else if (category === "video") {
                  counts.video++;
                  newId = "video".concat(counts.video);
                } else if (category === "audio") {
                  counts.audio++;
                  newId = "audio".concat(counts.audio);
                }
                idMapping[n.id] = newId;
                var existingNode = nodes.find(function (en) {
                  return en.id === newId;
                });
                return {
                  id: newId,
                  type: n.category === "utility" ? n.model === "video-combiner" ? "vidConcatNode" : "concatNode" : "".concat(n.category, "Node"),
                  position: (existingNode === null || existingNode === void 0 ? void 0 : existingNode.position) || {
                    x: (_n$position$x3 = (_n$position5 = n.position) === null || _n$position5 === void 0 ? void 0 : _n$position5.x) !== null && _n$position$x3 !== void 0 ? _n$position$x3 : 350,
                    y: (_n$position$y3 = (_n$position6 = n.position) === null || _n$position6 === void 0 ? void 0 : _n$position6.y) !== null && _n$position$y3 !== void 0 ? _n$position$y3 : 0
                  },
                  data: _objectSpread(_objectSpread({}, existingNode === null || existingNode === void 0 ? void 0 : existingNode.data), {}, {
                    nodeSchemas: nodeSchemas,
                    modelId: n.model,
                    selectedModel: getModelObj(n.category, n.model),
                    outputs: ((_n$output_params5 = n.output_params) === null || _n$output_params5 === void 0 ? void 0 : _n$output_params5.outputs) || [],
                    resultUrl: ((_n$output_params6 = n.output_params) === null || _n$output_params6 === void 0 ? void 0 : _n$output_params6.resultUrl) || null,
                    formValues: n.input_params || n.params || {},
                    outputHistory: (existingNode === null || existingNode === void 0 || (_existingNode$data = existingNode.data) === null || _existingNode$data === void 0 ? void 0 : _existingNode$data.outputHistory) || []
                  })
                };
              });
              setNodes(newNodes);
              if (workflow.edges && workflow.edges.length > 0) {
                newEdges = workflow.edges.map(function (e) {
                  var source = idMapping[e.source] || e.source;
                  var target = idMapping[e.target] || e.target;
                  var sourceNode = newNodes.find(function (n) {
                    return n.id === source;
                  });
                  var targetNode = newNodes.find(function (n) {
                    return n.id === target;
                  });
                  var sourceHandle = e.sourceHandle;
                  var targetHandle = e.targetHandle;
                  if ((!sourceHandle || sourceHandle === 'output') && sourceNode) {
                    if (sourceNode.type === 'textNode') sourceHandle = 'textOutput';else if (sourceNode.type === 'imageNode') sourceHandle = 'imageOutput';else if (sourceNode.type === 'videoNode') sourceHandle = 'videoOutput';else if (sourceNode.type === 'audioNode') sourceHandle = 'audioOutput';else if (sourceNode.type === 'concatNode') sourceHandle = 'concatOutput';
                  }
                  if ((!targetHandle || targetHandle === 'prompt') && targetNode) {
                    if (targetNode.type === 'textNode') targetHandle = 'textInput';else if (targetNode.type === 'imageNode') targetHandle = 'imageInput';else if (targetNode.type === 'videoNode') targetHandle = 'videoInput';else if (targetNode.type === 'audioNode') targetHandle = 'audioInput2';else if (targetNode.type === 'concatNode') targetHandle = 'concatInput';
                  }
                  var edgeColor = getEdgeColor(sourceHandle, targetHandle, sourceNode, targetNode);
                  return {
                    id: "e-".concat(source, "-").concat(target),
                    source: source,
                    target: target,
                    sourceHandle: sourceHandle,
                    targetHandle: targetHandle,
                    style: edgeStyles[edgeColor]
                  };
                });
                setEdges(newEdges);
              }
            }
            setIsChatLoading(false);
            _context.n = 3;
            break;
          case 2:
            if (!(status === "failed")) {
              _context.n = 3;
              break;
            }
            clearInterval(interval);
            throw new Error("Architect processing failed");
          case 3:
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            clearInterval(interval);
            console.error("Polling error:", _t);
            errorMessage = {
              role: "agent",
              content: "Sorry, I encountered an error while updating your workflow.",
              timestamp: new Date().toISOString()
            };
            setChatMessages(function (prev) {
              return [].concat(_toConsumableArray(prev), [errorMessage]);
            });
            setIsChatLoading(false);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[0, 4]]);
    })), 3000);
  };
  var handleSendMessage = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(content) {
      var newMessage, savedWorkflowId, history, response, _response$data, request_id, status, errorMessage, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            newMessage = {
              role: "user",
              content: content,
              timestamp: new Date().toISOString()
            };
            setChatMessages(function (prev) {
              return [].concat(_toConsumableArray(prev), [newMessage]);
            });
            setIsChatLoading(true);
            _context2.p = 1;
            _context2.n = 2;
            return handleSaveWorkFlow();
          case 2:
            savedWorkflowId = _context2.v;
            history = chatMessages.map(function (msg) {
              return {
                role: msg.role === "agent" ? "assistant" : msg.role,
                content: msg.content
              };
            });
            _context2.n = 3;
            return _axios["default"].post("/api/workflow/architect", {
              prompt: content,
              workflow_id: savedWorkflowId,
              history: history
            });
          case 3:
            response = _context2.v;
            _response$data = response.data, request_id = _response$data.request_id, status = _response$data.status;
            pollArchitectStatus(request_id);
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
            console.error("Error sending message:", _t2);
            errorMessage = {
              role: "agent",
              content: "Sorry, I encountered an error processing your request.",
              timestamp: new Date().toISOString()
            };
            setChatMessages(function (prev) {
              return [].concat(_toConsumableArray(prev), [errorMessage]);
            });
            setIsChatLoading(false);
          case 5:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 4]]);
    }));
    return function handleSendMessage(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  (0, _react.useEffect)(function () {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  var onEdgeClick = function onEdgeClick(event, edge) {
    event.stopPropagation();
    setEdges(function (eds) {
      var updatedEdges = eds.filter(function (e) {
        return e.id !== edge.id;
      });
      var targetNode = nodes.find(function (n) {
        return n.id === edge.target;
      });

      // Disconnecting a Character node from a video node: clear the face
      // reference and strip its @Name token out of the prompt.
      var removedSource = nodes.find(function (n) {
        return n.id === edge.source;
      });
      if ((removedSource === null || removedSource === void 0 ? void 0 : removedSource.type) === "characterNode" && (targetNode === null || targetNode === void 0 ? void 0 : targetNode.type) === "videoNode") {
        var _removedSource$data;
        var cname = removedSource === null || removedSource === void 0 || (_removedSource$data = removedSource.data) === null || _removedSource$data === void 0 || (_removedSource$data = _removedSource$data.formValues) === null || _removedSource$data === void 0 ? void 0 : _removedSource$data.character_name;
        var token = cname && cname.trim() ? "@" + cname.trim().replace(/\s+/g, "_") : null;
        setNodes(function (prev) {
          return prev.map(function (n) {
            if (n.id !== targetNode.id) return n;
            var updatedFormValues = _objectSpread({}, n.data.formValues);
            updatedFormValues.face_asset = null;
            updatedFormValues.face_thumbnail = null;
            if (token && typeof updatedFormValues.prompt === "string") {
              updatedFormValues.prompt = updatedFormValues.prompt.replace(new RegExp("\\s*" + token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), "").trim();
            }
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                formValues: updatedFormValues
              })
            });
          });
        });
      }
      if ((targetNode === null || targetNode === void 0 ? void 0 : targetNode.type) === "concatNode" && edge.targetHandle === "concatInput") {
        setNodes(function (prev) {
          return prev.map(function (n) {
            if (n.id !== targetNode.id) return n;
            var remainingConcatEdges = updatedEdges.filter(function (e) {
              return e.target === targetNode.id && e.targetHandle === "concatInput";
            });
            var updatedFormValues = _objectSpread({}, n.data.formValues);
            if (remainingConcatEdges.length > 0) {
              var concatValues = remainingConcatEdges.map(function (e) {
                var _sourceNode$data0, _sourceNode$data1;
                var sourceNode = prev.find(function (node) {
                  return node.id === e.source;
                });
                return (sourceNode === null || sourceNode === void 0 || (_sourceNode$data0 = sourceNode.data) === null || _sourceNode$data0 === void 0 ? void 0 : _sourceNode$data0.resultUrl) || (sourceNode === null || sourceNode === void 0 || (_sourceNode$data1 = sourceNode.data) === null || _sourceNode$data1 === void 0 || (_sourceNode$data1 = _sourceNode$data1.outputs) === null || _sourceNode$data1 === void 0 || (_sourceNode$data1 = _sourceNode$data1[0]) === null || _sourceNode$data1 === void 0 ? void 0 : _sourceNode$data1.value) || "";
              }).filter(function (v) {
                return v;
              });
              updatedFormValues.prompt = concatValues.join(" ");
            } else {
              updatedFormValues.prompt = "";
            }
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                formValues: updatedFormValues
              })
            });
          });
        });
      }
      if ((targetNode === null || targetNode === void 0 ? void 0 : targetNode.type) === "vidConcatNode" && edge.targetHandle === "videoInput7") {
        setNodes(function (prev) {
          return prev.map(function (n) {
            var _removedSourceNode$da, _removedSourceNode$da2;
            if (n.id !== targetNode.id) return n;
            var removedSourceNode = prev.find(function (node) {
              return node.id === edge.source;
            });
            var removedUrl = (removedSourceNode === null || removedSourceNode === void 0 || (_removedSourceNode$da = removedSourceNode.data) === null || _removedSourceNode$da === void 0 ? void 0 : _removedSourceNode$da.resultUrl) || (removedSourceNode === null || removedSourceNode === void 0 || (_removedSourceNode$da2 = removedSourceNode.data) === null || _removedSourceNode$da2 === void 0 || (_removedSourceNode$da2 = _removedSourceNode$da2.outputs) === null || _removedSourceNode$da2 === void 0 || (_removedSourceNode$da2 = _removedSourceNode$da2[0]) === null || _removedSourceNode$da2 === void 0 ? void 0 : _removedSourceNode$da2.value);
            var remainingVideoEdges = updatedEdges.filter(function (e) {
              return e.target === targetNode.id && e.targetHandle === "videoInput7";
            });
            var remainingUrls = remainingVideoEdges.map(function (e) {
              var _src$data, _src$data2;
              var src = prev.find(function (node) {
                return node.id === e.source;
              });
              return (src === null || src === void 0 || (_src$data = src.data) === null || _src$data === void 0 ? void 0 : _src$data.resultUrl) || (src === null || src === void 0 || (_src$data2 = src.data) === null || _src$data2 === void 0 || (_src$data2 = _src$data2.outputs) === null || _src$data2 === void 0 || (_src$data2 = _src$data2[0]) === null || _src$data2 === void 0 ? void 0 : _src$data2.value) || "";
            }).filter(function (v) {
              return v;
            });
            var updatedFormValues = _objectSpread({}, n.data.formValues);
            if (remainingUrls.length > 0) {
              var key = updatedFormValues.video_files ? "video_files" : "videos_list";
              updatedFormValues[key] = remainingUrls;
            } else {
              var _key3 = updatedFormValues.video_files ? "video_files" : "videos_list";
              var currentList = Array.isArray(updatedFormValues[_key3]) ? updatedFormValues[_key3].filter(function (v) {
                return v !== removedUrl;
              }) : [];
              updatedFormValues[_key3] = currentList;
            }
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                formValues: updatedFormValues
              })
            });
          });
        });
      }
      return updatedEdges;
    });
  };
  var _stripB64Deep2 = function _stripB64Deep(v) {
    if (typeof v === "string") return v.indexOf("data:") === 0 && v.length > 500 ? "" : v;
    if (Array.isArray(v)) return v.map(_stripB64Deep2);
    if (v && _typeof(v) === "object") {
      var o = {};
      for (var k in v) {
        if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = _stripB64Deep2(v[k]);
      }
      return o;
    }
    return v;
  };
  var buildWorkflowPayload = function buildWorkflowPayload() {
    var nodeData = nodes.map(function (node) {
      var _node$data2, _node$data3, _nodeSchemas$categori4, _nodeSchemas$categori5, _nodeSchemas$categori6, _nodeSchemas$categori7, _node$data4;
      var connectedEdges = edges.filter(function (e) {
        return e.target === node.id;
      });
      var inputNodes = connectedEdges.map(function (e) {
        return e.source;
      });
      var category = node.type === "textNode" ? "text" : node.type === "imageNode" ? "image" : node.type === "videoNode" ? "video" : node.type === "apiNode" ? "api" : node.type === "audioNode" ? "audio" : node.type === "characterNode" ? "image" : "utility";
      var isVideoCombiner = node.type === "vidConcatNode";
      var model = (_node$data2 = node.data) !== null && _node$data2 !== void 0 && (_node$data2 = _node$data2.selectedModel) !== null && _node$data2 !== void 0 && _node$data2.id ? (_node$data3 = node.data) === null || _node$data3 === void 0 || (_node$data3 = _node$data3.selectedModel) === null || _node$data3 === void 0 ? void 0 : _node$data3.id : category === "utility" ? isVideoCombiner ? "video-combiner" : "prompt-concatenator" : "".concat(category, "-passthrough");
      var modelSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori4 = nodeSchemas.categories) === null || _nodeSchemas$categori4 === void 0 || (_nodeSchemas$categori4 = _nodeSchemas$categori4[category]) === null || _nodeSchemas$categori4 === void 0 || (_nodeSchemas$categori4 = _nodeSchemas$categori4.models) === null || _nodeSchemas$categori4 === void 0 || (_nodeSchemas$categori4 = _nodeSchemas$categori4[model]) === null || _nodeSchemas$categori4 === void 0 || (_nodeSchemas$categori4 = _nodeSchemas$categori4.input_schema) === null || _nodeSchemas$categori4 === void 0 || (_nodeSchemas$categori4 = _nodeSchemas$categori4.schemas) === null || _nodeSchemas$categori4 === void 0 ? void 0 : _nodeSchemas$categori4.input_data;
      var inputSchema = (modelSchema === null || modelSchema === void 0 ? void 0 : modelSchema.properties) || {};
      var wavespeedSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori5 = nodeSchemas.categories) === null || _nodeSchemas$categori5 === void 0 || (_nodeSchemas$categori5 = _nodeSchemas$categori5.api) === null || _nodeSchemas$categori5 === void 0 || (_nodeSchemas$categori5 = _nodeSchemas$categori5.models) === null || _nodeSchemas$categori5 === void 0 || (_nodeSchemas$categori5 = _nodeSchemas$categori5[model]) === null || _nodeSchemas$categori5 === void 0 ? void 0 : _nodeSchemas$categori5.input_schema;
      var concatSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori6 = nodeSchemas.categories) === null || _nodeSchemas$categori6 === void 0 || (_nodeSchemas$categori6 = _nodeSchemas$categori6.utility) === null || _nodeSchemas$categori6 === void 0 || (_nodeSchemas$categori6 = _nodeSchemas$categori6.models) === null || _nodeSchemas$categori6 === void 0 || (_nodeSchemas$categori6 = _nodeSchemas$categori6["prompt-concatenator"]) === null || _nodeSchemas$categori6 === void 0 ? void 0 : _nodeSchemas$categori6.input_schema;
      var videoCombinerSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori7 = nodeSchemas.categories) === null || _nodeSchemas$categori7 === void 0 || (_nodeSchemas$categori7 = _nodeSchemas$categori7.utility) === null || _nodeSchemas$categori7 === void 0 || (_nodeSchemas$categori7 = _nodeSchemas$categori7.models) === null || _nodeSchemas$categori7 === void 0 || (_nodeSchemas$categori7 = _nodeSchemas$categori7["video-combiner"]) === null || _nodeSchemas$categori7 === void 0 || (_nodeSchemas$categori7 = _nodeSchemas$categori7.input_schema) === null || _nodeSchemas$categori7 === void 0 || (_nodeSchemas$categori7 = _nodeSchemas$categori7.schemas) === null || _nodeSchemas$categori7 === void 0 || (_nodeSchemas$categori7 = _nodeSchemas$categori7.input_data) === null || _nodeSchemas$categori7 === void 0 ? void 0 : _nodeSchemas$categori7.properties;
      var formValues = ((_node$data4 = node.data) === null || _node$data4 === void 0 ? void 0 : _node$data4.formValues) || {};
      var dynamicPrompt = "";
      if (node.type === "concatNode") {
        var promptConnections = connectedEdges.filter(function (e) {
          return ["concatInput"].includes(e.targetHandle);
        });
        dynamicPrompt = promptConnections.length > 0 ? promptConnections.map(function (conn) {
          return "{{ ".concat(conn.source, ".outputs[0].value }}");
        }) : [];
      } else {
        var _promptConnections = connectedEdges.filter(function (e) {
          return ["textInput", "imageInput", "videoInput", "audioInput2", "apiInput"].includes(e.targetHandle);
        });
        dynamicPrompt = _promptConnections.length > 0 ? "{{ ".concat(_promptConnections[0].source, ".outputs[0].value }}") : "";
      }
      var systemPromptConnections = connectedEdges.filter(function (e) {
        return e.targetHandle === "textInput4";
      });
      var dynamicSystemPrompt = systemPromptConnections.length > 0 ? "{{ ".concat(systemPromptConnections[0].source, ".outputs[0].value }}") : (formValues === null || formValues === void 0 ? void 0 : formValues.system_prompt) || null;

      // Character nodes feed face_asset (reference image), not image_url/list.
      var isCharSource = function isCharSource(srcId) {
        var _nodes$find;
        return ((_nodes$find = nodes.find(function (n) {
          return n.id === srcId;
        })) === null || _nodes$find === void 0 ? void 0 : _nodes$find.type) === "characterNode";
      };
      var imageListConnections = connectedEdges.filter(function (e) {
        return ["textInput3", "imageInput2", "videoInput6", "apiInput2"].includes(e.targetHandle) && !isCharSource(e.source);
      });
      var dynamicImagesList = imageListConnections.length > 0 ? imageListConnections.map(function (conn) {
        return "{{ ".concat(conn.source, ".outputs[0].value }}");
      }) : (formValues === null || formValues === void 0 ? void 0 : formValues.images_list) || []; // || [node.data?.outputs?.[0]?.value]

      var imageUrlConnections = connectedEdges.filter(function (e) {
        return ["textInput2", "videoInput2", "imageInput3", "audioInput3", "apiInput3"].includes(e.targetHandle) && !isCharSource(e.source);
      });
      var videoUrlConnections = connectedEdges.filter(function (e) {
        return ["videoInput4", "audioInput4"].includes(e.targetHandle);
      });
      var videoListConnections = connectedEdges.filter(function (e) {
        return e.targetHandle === "videoInput7";
      });
      var audioListConnections = connectedEdges.filter(function (e) {
        return e.targetHandle === "videoInput8";
      });
      var dynamicVideosKey = formValues !== null && formValues !== void 0 && formValues.video_files ? "video_files" : "videos_list";
      var dynamicVideosList = videoListConnections.length > 0 ? videoListConnections.map(function (conn) {
        return "{{ ".concat(conn.source, ".outputs[0].value }}");
      }) : formValues[dynamicVideosKey] || [];
      var dynamicAudiosKey = formValues !== null && formValues !== void 0 && formValues.audio_files ? "audio_files" : "audios_list";
      var dynamicAudiosList = audioListConnections.length > 0 ? audioListConnections.map(function (conn) {
        return "{{ ".concat(conn.source, ".outputs[0].value }}");
      }) : formValues[dynamicAudiosKey] || [];
      var audioUrlConnections = connectedEdges.filter(function (e) {
        return ["audioInput", "videoInput5"].includes(e.targetHandle);
      });
      var dynamicImageUrl = imageUrlConnections.length > 0 ? "{{ ".concat(imageUrlConnections[0].source, ".outputs[0].value }}") : (formValues === null || formValues === void 0 ? void 0 : formValues.image_url) || null;
      var lastImageConnections = connectedEdges.filter(function (e) {
        return e.targetHandle === "videoInput3";
      });
      var dynamicVideoUrl = videoUrlConnections.length > 0 ? "{{ ".concat(videoUrlConnections[0].source, ".outputs[0].value }}") : (formValues === null || formValues === void 0 ? void 0 : formValues.video_url) || null;
      var dynamicAudioUrl = audioUrlConnections.length > 0 ? "{{ ".concat(audioUrlConnections[0].source, ".outputs[0].value }}") : (formValues === null || formValues === void 0 ? void 0 : formValues.audio_url) || null;
      var dynamicLastImage = lastImageConnections.length > 0 ? "{{ ".concat(lastImageConnections[0].source, ".outputs[0].value }}") : (formValues === null || formValues === void 0 ? void 0 : formValues.last_image) || null; // || node.data?.outputs?.[0]?.value

      // Character node connected to any image handle → face_asset (reference image).
      var faceAssetConnections = connectedEdges.filter(function (e) {
        return isCharSource(e.source);
      });
      var dynamicFaceAsset = faceAssetConnections.length > 0 ? "{{ ".concat(faceAssetConnections[0].source, ".outputs[0].value }}") : (formValues === null || formValues === void 0 ? void 0 : formValues.face_asset) || null;
      var localSources = _objectSpread(_objectSpread({}, formValues), {}, {
        prompt: dynamicPrompt ? dynamicPrompt : formValues === null || formValues === void 0 ? void 0 : formValues.prompt,
        system_prompt: dynamicSystemPrompt,
        images_list: dynamicImagesList,
        images: dynamicImagesList,
        image_urls: dynamicImagesList,
        image_url: dynamicImageUrl,
        video_url: dynamicVideoUrl,
        audio_url: dynamicAudioUrl,
        image: dynamicImageUrl,
        last_image: dynamicLastImage,
        videos_list: dynamicVideosList,
        video_files: dynamicVideosList,
        audios_list: dynamicAudiosList,
        audio_files: dynamicAudiosList
      }, dynamicFaceAsset ? {
        face_asset: dynamicFaceAsset
      } : {});
      if (node.type === "apiNode") {
        var listFields = ["images", "image_urls", "images_list"];
        connectedEdges.forEach(function (edge) {
          if (edge.target === node.id) {
            var _wavespeedSchema$edge;
            var val = "{{ ".concat(edge.source, ".outputs[0].value }}");
            var isList = listFields.includes(edge.targetHandle) || (wavespeedSchema === null || wavespeedSchema === void 0 || (_wavespeedSchema$edge = wavespeedSchema[edge.targetHandle]) === null || _wavespeedSchema$edge === void 0 ? void 0 : _wavespeedSchema$edge.type) === "array";
            if (isList) {
              if (!Array.isArray(localSources[edge.targetHandle])) {
                localSources[edge.targetHandle] = [];
              }
              if (!localSources[edge.targetHandle].includes(val)) {
                localSources[edge.targetHandle].push(val);
              }
            } else {
              localSources[edge.targetHandle] = val;
            }
          }
        });
      }
      var params = {};
      var input_params = formValues || {};
      var output_params = {};
      if (node.type === "apiNode") {
        for (var _i = 0, _Object$entries = Object.entries(wavespeedSchema); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
            key = _Object$entries$_i[0],
            meta = _Object$entries$_i[1];
          if (localSources[key] !== undefined && localSources[key] !== null) {
            params[key] = localSources[key];
          } else {
            var _meta$default;
            params[key] = (_meta$default = meta["default"]) !== null && _meta$default !== void 0 ? _meta$default : null;
          }
        }
        var filteredInputParams = Object.fromEntries(Object.entries(input_params).filter(function (_ref4) {
          var _ref5 = _slicedToArray(_ref4, 1),
            key = _ref5[0];
          return key !== "model_url" && key !== "api_key" && key !== "model_name" && key !== "model_type";
        }));
        params["params"] = filteredInputParams;
        for (var _i2 = 0, _Object$entries2 = Object.entries(filteredInputParams); _i2 < _Object$entries2.length; _i2++) {
          var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
            _key4 = _Object$entries2$_i[0],
            _meta = _Object$entries2$_i[1];
          if (localSources[_key4] !== undefined && localSources[_key4] !== null) {
            params.params[_key4] = localSources[_key4];
          } else {
            var _meta$default2;
            params.params[_key4] = (_meta$default2 = _meta === null || _meta === void 0 ? void 0 : _meta["default"]) !== null && _meta$default2 !== void 0 ? _meta$default2 : null;
          }
        }
      } else if (node.type === "vidConcatNode") {
        var vcSchema = videoCombinerSchema || {
          videos_list: {
            "default": []
          },
          aspect_ratio: {
            "default": "auto"
          }
        };
        for (var _i3 = 0, _Object$entries3 = Object.entries(vcSchema); _i3 < _Object$entries3.length; _i3++) {
          var _Object$entries3$_i = _slicedToArray(_Object$entries3[_i3], 2),
            _key5 = _Object$entries3$_i[0],
            _meta2 = _Object$entries3$_i[1];
          if (localSources[_key5] !== undefined && localSources[_key5] !== null) {
            params[_key5] = localSources[_key5];
          } else {
            var _meta2$default;
            params[_key5] = (_meta2$default = _meta2["default"]) !== null && _meta2$default !== void 0 ? _meta2$default : null;
          }
        }
      } else if (node.type === "concatNode") {
        for (var _i4 = 0, _Object$entries4 = Object.entries(concatSchema); _i4 < _Object$entries4.length; _i4++) {
          var _Object$entries4$_i = _slicedToArray(_Object$entries4[_i4], 2),
            _key6 = _Object$entries4$_i[0],
            _meta3 = _Object$entries4$_i[1];
          if (localSources[_key6] !== undefined && localSources[_key6] !== null) {
            params[_key6] = localSources[_key6];
          } else {
            var _meta3$default;
            params[_key6] = (_meta3$default = _meta3["default"]) !== null && _meta3$default !== void 0 ? _meta3$default : null;
          }
        }
      } else {
        for (var _i5 = 0, _Object$entries5 = Object.entries(inputSchema); _i5 < _Object$entries5.length; _i5++) {
          var _Object$entries5$_i = _slicedToArray(_Object$entries5[_i5], 2),
            _key7 = _Object$entries5$_i[0],
            _meta4 = _Object$entries5$_i[1];
          if (localSources[_key7] !== undefined && localSources[_key7] !== null) {
            params[_key7] = localSources[_key7];
          } else {
            var _meta4$default;
            params[_key7] = (_meta4$default = _meta4["default"]) !== null && _meta4$default !== void 0 ? _meta4$default : null;
          }
        }
        // face_asset isn't in the model schema, so carry it through explicitly
        // when a Character node feeds the video node.
        if (node.type === "videoNode" && localSources.face_asset) {
          params.face_asset = localSources.face_asset;
        }
      }
      if (node.type === "textNode") {
        var _node$data5, _node$data6;
        output_params = {
          resultUrl: ((_node$data5 = node.data) === null || _node$data5 === void 0 ? void 0 : _node$data5.resultUrl) || "",
          outputs: ((_node$data6 = node.data) === null || _node$data6 === void 0 ? void 0 : _node$data6.outputs) || []
        };
      } else if (["imageNode", "videoNode", "audioNode", "apiNode", "concatNode", "vidConcatNode", "characterNode"].includes(node.type)) {
        var _node$data7, _node$data8;
        output_params = {
          resultUrl: ((_node$data7 = node.data) === null || _node$data7 === void 0 ? void 0 : _node$data7.resultUrl) || null,
          outputs: ((_node$data8 = node.data) === null || _node$data8 === void 0 ? void 0 : _node$data8.outputs) || []
        };
      }
      return _objectSpread({
        id: node.id,
        category: category,
        model: model,
        input_params: input_params,
        output_params: output_params,
        params: params,
        position: node.position
      }, inputNodes.length > 0 ? {
        inputs: inputNodes
      } : {});
    });
    return {
      workflow_id: interactionMode ? workflowId || null : null,
      source_workflow_id: !interactionMode ? workflowId : null,
      name: workflowName || "Untitled",
      edges: edges,
      data: {
        nodes: _stripB64Deep2(nodeData)
      },
      is_vadoo: false,
      category: workflowCategory
    };
  };
  var handleSaveWorkFlow = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var workflowPayload, response, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (interactionMode) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            workflowPayload = buildWorkflowPayload();
            _context3.p = 2;
            _context3.n = 3;
            return _axios["default"].post("/api/workflow/create", workflowPayload);
          case 3:
            response = _context3.v;
            console.log("Workflow created:", response.data);
            setDropDown(0);
            (0, _WorkflowStore.setWorkflowIds)(response.data.workflow_id, runId);
            setWorkflowId(response.data.workflow_id);
            return _context3.a(2, response.data.workflow_id);
          case 4:
            _context3.p = 4;
            _t3 = _context3.v;
            console.log(_t3);
            if (_t3.response) {
              _reactHotToast.toast.error("Failed: ".concat(_t3.response.data.detail || "Server error"));
            } else {
              _reactHotToast.toast.error("Error: ".concat(_t3.message));
            }
          case 5:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 4]]);
    }));
    return function handleSaveWorkFlow() {
      return _ref6.apply(this, arguments);
    };
  }();
  var handleDuplicateWorkflow = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
      var workflowPayload, response, _t4;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (!interactionMode) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2);
          case 1:
            setIsRunning(3);
            workflowPayload = buildWorkflowPayload();
            _context4.p = 2;
            _context4.n = 3;
            return _axios["default"].post("/api/workflow/create", workflowPayload);
          case 3:
            response = _context4.v;
            console.log("Workflow created:", response.data);
            window.location.href = "/workflow/".concat(response.data.workflow_id);
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t4 = _context4.v;
            console.log(_t4);
            setIsRunning(0);
            if (_t4.response) {
              _reactHotToast.toast.error("Failed: ".concat(_t4.response.data.detail || "Server error"));
            } else {
              _reactHotToast.toast.error("Error: ".concat(_t4.message));
            }
          case 5:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4]]);
    }));
    return function handleDuplicateWorkflow() {
      return _ref7.apply(this, arguments);
    };
  }();
  (0, _react.useEffect)(function () {
    var handleBeforeUnload = function handleBeforeUnload(e) {
      handleSaveWorkFlow();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return function () {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleSaveWorkFlow]);
  var pollRunIdStatus = function pollRunIdStatus(runId) {
    var interval;
    var _check = function _check() {
      _axios["default"].get("/api/workflow/run/".concat(runId, "/status")).then(function (response) {
        var runData = response.data;
        var nodesStatus = (runData === null || runData === void 0 ? void 0 : runData.nodes) || {};
        (0, _WorkflowStore.setWorkflowIds)(workflowId, runId);
        Object.entries(nodesStatus).forEach(function (_ref8) {
          var _outputs$;
          var _ref9 = _slicedToArray(_ref8, 2),
            id = _ref9[0],
            runs = _ref9[1];
          if (!runs || runs.length === 0) return;
          var latestRun = runs[runs.length - 1];
          var status = latestRun === null || latestRun === void 0 ? void 0 : latestRun.status;
          var result = latestRun === null || latestRun === void 0 ? void 0 : latestRun.result;
          var outputs = (result === null || result === void 0 ? void 0 : result.outputs) || [];
          var first = (outputs === null || outputs === void 0 || (_outputs$ = outputs[0]) === null || _outputs$ === void 0 ? void 0 : _outputs$.value) || "";
          if (status === "processing" || status === "running") {
            setLoadingNodes(function (prev) {
              return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, id, true));
            });
            return;
          } else {
            setLoadingNodes(function (prev) {
              var copy = _objectSpread({}, prev);
              delete copy[id];
              return copy;
            });
          }
          if (status === "succeeded" || status === "completed") {
            setLoadingNodes(function (prev) {
              var copy = _objectSpread({}, prev);
              delete copy[id];
              return copy;
            });
            setNodes(function (prevNodes) {
              var updatedNodes = prevNodes.map(function (node) {
                var nodeIdMatch = id.toLowerCase().replace(/\s+/g, '') === node.id.toLowerCase().replace(/\s+/g, '');
                if (!nodeIdMatch || !result) return node;
                if (["textNode", "imageNode", "videoNode", "audioNode", "concatNode", "apiNode", "vidConcatNode"].includes(node.type)) {
                  var currentHistory = node.data.outputHistory || [];
                  var isAlreadyInHistory = currentHistory.some(function (h) {
                    var _h$result;
                    return ((_h$result = h.result) === null || _h$result === void 0 ? void 0 : _h$result.id) === result.id;
                  });
                  var newHistory = isAlreadyInHistory ? currentHistory.map(function (h) {
                    var _h$result2;
                    return ((_h$result2 = h.result) === null || _h$result2 === void 0 ? void 0 : _h$result2.id) === result.id ? latestRun : h;
                  }) : [].concat(_toConsumableArray(currentHistory), [latestRun]);
                  return _objectSpread(_objectSpread({}, node), {}, {
                    data: _objectSpread(_objectSpread({}, node.data), {}, {
                      outputs: outputs,
                      resultUrl: first,
                      isLoading: false,
                      errorMsg: null,
                      outputHistory: newHistory
                    })
                  });
                }
                return node;
              });
              updatedNodes = updatedNodes.map(function (node) {
                if (node.id === id) {
                  return node;
                }
                return node;
              });
              return updatedNodes;
            });
            onDataChange(id, {
              outputs: outputs,
              resultUrl: first,
              isLoading: false
            });
          } else if (status === "failed") {
            setLoadingNodes(function (prev) {
              var copy = _objectSpread({}, prev);
              delete copy[id];
              return copy;
            });
            setNodes(function (prevNodes) {
              return prevNodes.map(function (n) {
                if (n.id === id) {
                  return _objectSpread(_objectSpread({}, n), {}, {
                    data: _objectSpread(_objectSpread({}, n.data), {}, {
                      isLoading: false,
                      errorMsg: "Generation Failed"
                    })
                  });
                }
                return n;
              });
            });
          }
        });
        var allCompleted = Object.values(nodesStatus).every(function (nodeRuns) {
          var _nodeRuns$;
          return ((_nodeRuns$ = nodeRuns[0]) === null || _nodeRuns$ === void 0 ? void 0 : _nodeRuns$.status) === "succeeded";
        });
        var anyFailed = Object.values(nodesStatus).some(function (nodeRuns) {
          var _nodeRuns$2;
          return ((_nodeRuns$2 = nodeRuns[0]) === null || _nodeRuns$2 === void 0 ? void 0 : _nodeRuns$2.status) === "failed";
        });
        if (allCompleted) {
          clearInterval(interval);
          setLoadingNodes({});
          setIsRunning(0);
        } else if (anyFailed) {
          _reactHotToast.toast.error("Workflow failed on some nodes");
          clearInterval(interval);
          setLoadingNodes({});
          setIsRunning(0);
        }
        console.log("run", runData);
      })["catch"](function (error) {
        console.log(error);
        clearInterval(interval);
        setLoadingNodes({});
        setIsRunning(0);
        _reactHotToast.toast.error("Failed to get workflow status");
      });
    };
    _check();
    interval = setInterval(_check, 500);
  };
  var handleRunWorkflow = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      var savedWorkflowId, response, newRunId, _t5;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            if (interactionMode) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            _context5.p = 1;
            setIsRunning(1);
            setLoadingNodes({});
            _context5.n = 2;
            return handleSaveWorkFlow();
          case 2:
            savedWorkflowId = _context5.v;
            _context5.n = 3;
            return _axios["default"].post("/api/workflow/".concat(workflowId, "/run"), {
              cost: totalWorkflowCost
            });
          case 3:
            response = _context5.v;
            console.log("run data:", response.data);
            newRunId = response.data.run_id;
            setRunId(newRunId);
            (0, _WorkflowStore.setWorkflowIds)(workflowId, newRunId);
            pollRunIdStatus(newRunId);
            _context5.n = 5;
            break;
          case 4:
            _context5.p = 4;
            _t5 = _context5.v;
            console.log(_t5);
            if (_t5.response) {
              _reactHotToast.toast.error("Failed: ".concat(_t5.response.data.detail || "Server error"));
            } else {
              _reactHotToast.toast.error("Error: ".concat(_t5.message));
            }
            setLoadingNodes({});
            setIsRunning(0);
          case 5:
            return _context5.a(2);
        }
      }, _callee5, null, [[1, 4]]);
    }));
    return function handleRunWorkflow() {
      return _ref0.apply(this, arguments);
    };
  }();
  var handlePublishWorkflow = /*#__PURE__*/function () {
    var _ref1 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      var savedWorkflowId, response, _t6;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (interactionMode) {
              _context6.n = 1;
              break;
            }
            return _context6.a(2);
          case 1:
            _context6.p = 1;
            setIsRunning(2);
            _context6.n = 2;
            return handleSaveWorkFlow();
          case 2:
            savedWorkflowId = _context6.v;
            _context6.n = 3;
            return _axios["default"].post("/api/workflow/workflow/".concat(savedWorkflowId, "/publish"), {
              publish: !publishWorkflow
            });
          case 3:
            response = _context6.v;
            setIsRunning(0);
            _reactHotToast.toast.success(response.data.publish ? "Published successfully" : "Unpublished successfully");
            setPublishWorkflow(response.data.publish);
            _context6.n = 5;
            break;
          case 4:
            _context6.p = 4;
            _t6 = _context6.v;
            console.log(_t6);
            if (_t6.response) {
              _reactHotToast.toast.error("Failed: ".concat(_t6.response.data.detail || "Server error"));
            } else {
              _reactHotToast.toast.error("Error: ".concat(_t6.message));
            }
            setLoadingNodes({});
            setIsRunning(0);
          case 5:
            return _context6.a(2);
        }
      }, _callee6, null, [[1, 4]]);
    }));
    return function handlePublishWorkflow() {
      return _ref1.apply(this, arguments);
    };
  }();
  var handleTemplatePublish = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
      var savedWorkflowId, response, is_template, _t7;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            if (interactionMode) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2);
          case 1:
            _context7.p = 1;
            setIsRunning(4);
            _context7.n = 2;
            return handleSaveWorkFlow();
          case 2:
            savedWorkflowId = _context7.v;
            _context7.n = 3;
            return _axios["default"].post("/api/workflow/workflow/".concat(savedWorkflowId, "/template"), {
              is_template: !template.isPublishedTemplate
            });
          case 3:
            response = _context7.v;
            is_template = response.data.is_template;
            setIsRunning(0);
            _reactHotToast.toast.success(is_template ? "Published successfully" : "Unpublished successfully");
            setTemplate(function (prev) {
              return _objectSpread(_objectSpread({}, prev), {}, {
                isPublishedTemplate: is_template
              });
            });
            _context7.n = 5;
            break;
          case 4:
            _context7.p = 4;
            _t7 = _context7.v;
            console.log(_t7);
            if (_t7.response) {
              _reactHotToast.toast.error("Failed: ".concat(_t7.response.data.detail || "Server error"));
            } else {
              _reactHotToast.toast.error("Error: ".concat(_t7.message));
            }
            setIsRunning(0);
          case 5:
            return _context7.a(2);
        }
      }, _callee7, null, [[1, 4]]);
    }));
    return function handleTemplatePublish() {
      return _ref10.apply(this, arguments);
    };
  }();
  var handleCategorySave = /*#__PURE__*/function () {
    var _ref11 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
      var response, _t8;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.p = _context8.n) {
          case 0:
            if (workflowId) {
              _context8.n = 1;
              break;
            }
            _reactHotToast.toast.error("Workflow ID not found. Save the workflow first.");
            return _context8.a(2);
          case 1:
            _context8.p = 1;
            _context8.n = 2;
            return _axios["default"].post("/api/workflow/update-category/".concat(workflowId), {
              category: categoryInput
            });
          case 2:
            response = _context8.v;
            console.log("Category updated:", response.data);
            setWorkflowCategory(categoryInput);
            setIsCategoryPopupOpen(false);
            _reactHotToast.toast.success("Category updated successfully");
            _context8.n = 4;
            break;
          case 3:
            _context8.p = 3;
            _t8 = _context8.v;
            console.error("Error updating category:", _t8);
            if (_t8.response) {
              _reactHotToast.toast.error("Failed: ".concat(_t8.response.data.detail || "Server error"));
            } else {
              _reactHotToast.toast.error("Error: ".concat(_t8.message));
            }
          case 4:
            return _context8.a(2);
        }
      }, _callee8, null, [[1, 3]]);
    }));
    return function handleCategorySave() {
      return _ref11.apply(this, arguments);
    };
  }();
  var runNodeFromFlow = function runNodeFromFlow(nodeId) {
    setNodes(function (nds) {
      return nds.map(function (n) {
        return n.id === nodeId ? _objectSpread(_objectSpread({}, n), {}, {
          data: _objectSpread(_objectSpread({}, n.data), {}, {
            triggerRun: true
          })
        }) : n;
      });
    });
  };
  var runNodeInputsFromFlow = function runNodeInputsFromFlow(nodeId) {
    setNodes(function (nds) {
      return nds.map(function (n) {
        return n.id === nodeId ? _objectSpread(_objectSpread({}, n), {}, {
          data: _objectSpread(_objectSpread({}, n.data), {}, {
            triggerInputs: true
          })
        }) : n;
      });
    });
  };
  var getNextId = function getNextId(type) {
    var baseType = type.replace("Node", "");
    var existingIds = nodes.map(function (n) {
      return n.id;
    });
    var count = 1;
    while (existingIds.includes("".concat(baseType).concat(count))) {
      count++;
    }
    return "".concat(baseType).concat(count);
  };
  var duplicateNode = (0, _react.useCallback)(function (nodeId) {
    var nodeToDuplicate = nodes.find(function (n) {
      return n.id === nodeId;
    });
    if (!nodeToDuplicate) return;
    var newNodeId = getNextId(nodeToDuplicate.type);
    var newNode = _objectSpread(_objectSpread({}, nodeToDuplicate), {}, {
      id: newNodeId,
      position: {
        x: nodeToDuplicate.position.x + 40,
        y: nodeToDuplicate.position.y + 40
      },
      selected: true,
      data: _objectSpread({}, nodeToDuplicate.data)
    });
    setNodes(function (nds) {
      return nds.map(function (n) {
        return _objectSpread(_objectSpread({}, n), {}, {
          selected: false
        });
      }).concat(newNode);
    });
    _reactHotToast.toast.success("Duplicated node ".concat(nodeId, " to ").concat(newNodeId));
  }, [nodes, setNodes]);
  var nodesWithHandlers = nodes.map(function (node) {
    var _node$data9;
    return _objectSpread(_objectSpread({}, node), {}, {
      data: _objectSpread(_objectSpread({}, node.data), {}, {
        nodeSchemas: nodeSchemas,
        onDataChange: onDataChange,
        handleSaveWorkFlow: handleSaveWorkFlow,
        isLoading: loadingNodes[node.id] || false,
        activeHandleColor: activeHandleColor,
        triggerRun: node.data.triggerRun || false,
        triggerInputs: node.data.triggerInputs || false,
        runNodeFromFlow: runNodeFromFlow,
        runNodeInputsFromFlow: runNodeInputsFromFlow,
        runId: runId,
        duplicateNode: duplicateNode,
        setNodes: setNodes,
        setEdges: setEdges,
        handleTypes: _objectSpread(_objectSpread({}, node.type === 'apiNode' ? Object.keys(((_node$data9 = node.data) === null || _node$data9 === void 0 ? void 0 : _node$data9.formValues) || {}).reduce(function (acc, key) {
          return _objectSpread(_objectSpread({}, acc), {}, _defineProperty({}, key, 'white'));
        }, {}) : {}), {}, {
          concatInput: "blue",
          concatOutput: "blue",
          apiInput: "blue",
          apiInput2: "green",
          apiInput3: "green",
          apiOutput: function (_node$data0, _node$data1) {
            if (node.type !== 'apiNode') return "green";
            var output = (_node$data0 = node.data) === null || _node$data0 === void 0 || (_node$data0 = _node$data0.outputs) === null || _node$data0 === void 0 ? void 0 : _node$data0[0];
            var modelType = (_node$data1 = node.data) === null || _node$data1 === void 0 || (_node$data1 = _node$data1.formValues) === null || _node$data1 === void 0 ? void 0 : _node$data1.model_type;
            if ((output === null || output === void 0 ? void 0 : output.type) === 'text' || modelType === 'chat') return "blue";
            if ((output === null || output === void 0 ? void 0 : output.type) === 'video_url' || modelType === 'video') return "orange";
            if ((output === null || output === void 0 ? void 0 : output.type) === 'audio_url' || modelType === 'audio') return "yellow";
            return "green";
          }(),
          textInput: "blue",
          textInput2: "green",
          textInput3: "green",
          textInput4: "blue",
          textOutput: "blue",
          imageInput: "blue",
          imageInput2: "green",
          imageInput3: "green",
          imageOutput: "green",
          videoInput: "blue",
          videoInput2: "green",
          videoInput3: "green",
          videoInput4: "orange",
          videoInput5: "yellow",
          videoInput6: "green",
          videoInput7: "orange",
          videoInput8: "yellow",
          videoOutput: "orange",
          audioInput: "yellow",
          audioInput2: "blue",
          audioInput3: "green",
          audioInput4: "orange",
          audioOutput: "yellow",
          characterOutput: "green"
        })
      })
    });
  });
  var isValidConnection = function isValidConnection(connection) {
    var _sourceNode$data10, _targetNode$data, _targetNode$data2, _targetNode$data3, _targetNode$data4;
    var source = connection.source,
      target = connection.target,
      sourceHandle = connection.sourceHandle,
      targetHandle = connection.targetHandle;
    if (source === target) return false;
    var sourceNode = nodesWithHandlers.find(function (n) {
      return n.id === source;
    });
    var targetNode = nodesWithHandlers.find(function (n) {
      return n.id === target;
    });
    if (!sourceNode || !targetNode) return false;

    // CharacterNode feeds face_asset — allow it to land on any green image handle of a video node.
    if (sourceNode.type === "characterNode" && targetNode.type === "videoNode") {
      return ["videoInput2", "videoInput3", "videoInput6"].includes(targetHandle);
    }
    var sourceType = sourceNode === null || sourceNode === void 0 || (_sourceNode$data10 = sourceNode.data) === null || _sourceNode$data10 === void 0 || (_sourceNode$data10 = _sourceNode$data10.handleTypes) === null || _sourceNode$data10 === void 0 ? void 0 : _sourceNode$data10[sourceHandle];
    var targetType = targetNode === null || targetNode === void 0 || (_targetNode$data = targetNode.data) === null || _targetNode$data === void 0 || (_targetNode$data = _targetNode$data.handleTypes) === null || _targetNode$data === void 0 ? void 0 : _targetNode$data[targetHandle];
    if (!sourceType || !targetType || sourceType !== targetType && targetType !== 'white') return false;
    var isSourceOutput = sourceHandle.toLowerCase().includes("output");
    var isTargetInput = targetHandle.toLowerCase().includes("input") || targetNode.type === "apiNode" && targetHandle !== "apiOutput";
    if (!isSourceOutput || !isTargetInput) return false;
    var formValues = ((_targetNode$data2 = targetNode.data) === null || _targetNode$data2 === void 0 ? void 0 : _targetNode$data2.formValues) || {};
    var validHandles = [];
    switch (targetNode.type) {
      case "textNode":
        var hasTextPrompt = "prompt" in formValues;
        var hasTextImageUrl = "image_url" in formValues;
        var hasTextImagesList = "images_list" in formValues;
        var hasTextSystemPrompt = "system_prompt" in formValues;
        validHandles = [hasTextPrompt && "textInput", hasTextImageUrl && "textInput2", hasTextImagesList && "textInput3", hasTextSystemPrompt && "textInput4"].filter(Boolean);
        break;
      case "imageNode":
        var hasImagePrompt = "prompt" in formValues;
        var hasImagesList = "images_list" in formValues;
        var hasImageImageUrl = "image_url" in formValues;
        validHandles = [hasImagePrompt && "imageInput", hasImagesList && "imageInput2", hasImageImageUrl && "imageInput3"].filter(Boolean);
        break;
      case "videoNode":
        var hasVideoPrompt = "prompt" in formValues;
        var hasVideoImagesList = "images_list" in formValues;
        var hasVideoImageUrl = "image_url" in formValues;
        var hasLastImage = "last_image" in formValues;
        var hasVideoUrl = "video_url" in formValues;
        var hasVideoAudioUrl = "audio_url" in formValues;
        var hasVideosList = "videos_list" in formValues || "video_files" in formValues;
        var hasAudiosList = "audios_list" in formValues || "audio_files" in formValues;
        validHandles = [hasVideoPrompt && "videoInput", hasVideoImageUrl && "videoInput2", hasLastImage && "videoInput3", hasVideoUrl && "videoInput4", hasVideoAudioUrl && "videoInput5", hasVideoImagesList && "videoInput6", hasVideosList && "videoInput7", hasAudiosList && "videoInput8"].filter(Boolean);
        break;
      case "audioNode":
        var hasAudioUrl = "audio_url" in formValues;
        var hasAudioPrompt = "prompt" in formValues;
        var hasAudioImageUrl = "image_url" in formValues;
        var hasAudioVideoUrl = "video_url" in formValues;
        validHandles = [hasAudioUrl && "audioInput", hasAudioPrompt && "audioInput2", hasAudioImageUrl && "audioInput3", hasAudioVideoUrl && "audioInput4"].filter(Boolean);
        break;
      case "apiNode":
        var apiInputs = Object.keys(((_targetNode$data3 = targetNode.data) === null || _targetNode$data3 === void 0 ? void 0 : _targetNode$data3.formValues) || {});
        var exposedHandles = ((_targetNode$data4 = targetNode.data) === null || _targetNode$data4 === void 0 ? void 0 : _targetNode$data4.exposedHandles) || [];
        validHandles = apiInputs.filter(function (k) {
          return k !== 'apiOutput' && exposedHandles.includes(k);
        });
        break;
      case "vidConcatNode":
        validHandles = ["videoInput7"];
        break;
      default:
        return true;
    }
    if (!validHandles.includes(targetHandle)) {
      return false;
    }
    return true;
  };
  var onConnectStart = function onConnectStart(event, params) {
    var _node$data10;
    var node = nodesWithHandlers.find(function (n) {
      return n.id === params.nodeId;
    });
    var handleColor = node === null || node === void 0 || (_node$data10 = node.data) === null || _node$data10 === void 0 || (_node$data10 = _node$data10.handleTypes) === null || _node$data10 === void 0 ? void 0 : _node$data10[params.handleId];
    setActiveHandleColor(handleColor);
    var isOutput = params.handleId.toLowerCase().includes("output");
    setDraggedEdgeInfo({
      nodeId: params.nodeId,
      handleId: params.handleId,
      handleColor: handleColor,
      isOutput: isOutput
    });
  };
  var onConnectEnd = (0, _react.useCallback)(function (event) {
    setActiveHandleColor(null);
    if (draggedEdgeInfo && !connectionMadeRef.current) {
      var cursorX = (event === null || event === void 0 ? void 0 : event.clientX) || mousePos.x;
      var cursorY = (event === null || event === void 0 ? void 0 : event.clientY) || mousePos.y;
      setEdgePicker({
        sourceNodeId: draggedEdgeInfo.isOutput ? draggedEdgeInfo.nodeId : null,
        targetNodeId: draggedEdgeInfo.isOutput ? null : draggedEdgeInfo.nodeId,
        sourceHandleId: draggedEdgeInfo.isOutput ? draggedEdgeInfo.handleId : null,
        targetHandleId: draggedEdgeInfo.isOutput ? null : draggedEdgeInfo.handleId,
        handleColor: draggedEdgeInfo.handleColor,
        isOutput: draggedEdgeInfo.isOutput,
        cursorPos: {
          x: cursorX,
          y: cursorY
        }
      });
    }
    setDraggedEdgeInfo(null);
    connectionMadeRef.current = false;
  }, [draggedEdgeInfo, nodesWithHandlers, mousePos]);
  var handleSelectNodeFromEdgePicker = function handleSelectNodeFromEdgePicker(nodeType) {
    var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var initialData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!edgePicker) return;
    var newNodeId = getNextId(nodeType);
    var handleTypesMap = {
      concatInput: "blue",
      concatOutput: "blue",
      apiInput: "blue",
      apiInput2: "green",
      apiInput3: "green",
      apiOutput: "green",
      textInput: "blue",
      textInput2: "green",
      textInput3: "green",
      textInput4: "blue",
      textOutput: "blue",
      imageInput: "blue",
      imageInput2: "green",
      imageInput3: "green",
      imageOutput: "green",
      videoInput: "blue",
      videoInput2: "green",
      videoInput3: "green",
      videoInput4: "orange",
      videoInput5: "yellow",
      videoInput6: "green",
      videoInput7: "orange",
      videoInput8: "yellow",
      videoOutput: "orange",
      audioInput: "yellow",
      audioInput2: "blue",
      audioInput3: "green",
      audioInput4: "orange",
      audioOutput: "yellow"
    };
    var flowPosition = screenToFlowPosition({
      x: edgePicker.cursorPos.x,
      y: edgePicker.cursorPos.y
    });
    var newNode = {
      id: newNodeId,
      type: nodeType,
      position: {
        x: flowPosition.x - 160,
        y: flowPosition.y - 100
      },
      data: _objectSpread({}, initialData)
    };
    setNodes(function (prev) {
      return [].concat(_toConsumableArray(prev), [newNode]);
    });
    var connection;
    if (edgePicker.isOutput) {
      var nodeTypeToHandles = {
        textNode: ["textInput", "textInput2", "textInput3", "textInput4"],
        imageNode: ["imageInput", "imageInput2", "imageInput3"],
        videoNode: ["videoInput", "videoInput2", "videoInput3", "videoInput4", "videoInput5", "videoInput6", "videoInput7", "videoInput8"],
        audioNode: ["audioInput", "audioInput2", "audioInput3", "audioInput4"],
        apiNode: ["apiInput", "apiInput2", "apiInput3"],
        concatNode: ["concatInput"],
        vidConcatNode: ["videoInput7"]
      };
      var sourceHandleColor = handleTypesMap[edgePicker.sourceHandleId];
      var compatibleHandles = nodeTypeToHandles[nodeType] || [];
      var targetHandle = compatibleHandles.find(function (h) {
        return handleTypesMap[h] === sourceHandleColor;
      });
      if (targetHandle) {
        connection = {
          source: edgePicker.sourceNodeId,
          target: newNodeId,
          sourceHandle: edgePicker.sourceHandleId,
          targetHandle: targetHandle
        };
      }
    } else {
      var _nodeTypeToHandles = {
        textNode: ["textOutput"],
        imageNode: ["imageOutput"],
        videoNode: ["videoOutput"],
        audioNode: ["audioOutput"],
        apiNode: ["apiOutput"],
        concatNode: ["concatOutput"],
        vidConcatNode: ["videoOutput"]
      };
      var targetHandleColor = handleTypesMap[edgePicker.targetHandleId];
      var _compatibleHandles = _nodeTypeToHandles[nodeType] || [];
      var sourceHandle = _compatibleHandles.find(function (h) {
        return handleTypesMap[h] === targetHandleColor;
      });
      if (sourceHandle) {
        connection = {
          source: newNodeId,
          target: edgePicker.targetNodeId,
          sourceHandle: sourceHandle,
          targetHandle: edgePicker.targetHandleId
        };
      }
    }
    if (connection) {
      setTimeout(function () {
        connectionMadeRef.current = false;
        onConnectRef.current(connection);
      }, 100);
    }
    setEdgePicker(null);
    setDraggedEdgeInfo(null);
  };
  var getCompatibleNodeTypes = function getCompatibleNodeTypes(handleColor, isOutput) {
    if (isOutput) {
      var compatibilityMap = {
        blue: ['textNode', 'imageNode', 'videoNode', 'audioNode', 'apiNode', 'concatNode'],
        green: ['imageNode', 'videoNode', 'apiNode'],
        orange: ['videoNode', 'vidConcatNode'],
        yellow: ['audioNode', 'videoNode']
      };
      return compatibilityMap[handleColor] || [];
    } else {
      var _compatibilityMap = {
        blue: ['textNode', 'concatNode', 'apiNode'],
        green: ['imageNode', 'apiNode'],
        orange: ['videoNode', 'vidConcatNode'],
        yellow: ['audioNode']
      };
      return _compatibilityMap[handleColor] || [];
    }
  };
  var onPaneContextMenu = (0, _react.useCallback)(function (event) {
    event.preventDefault();
    var position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      position: position
    });
  }, [screenToFlowPosition]);
  var onPaneClick = (0, _react.useCallback)(function () {
    setContextMenu(null);
  }, []);
  var getNewNodePosition = function getNewNodePosition(lastNode) {
    if (!lastNode) return {
      x: 250,
      y: 250
    };
    var NODE_WIDTH = 320;
    var NODE_HEIGHT = 300;
    var GAP = 10;
    var MAX_ROW_WIDTH = 1200;

    // const offsetX = Math.random() * 200 - 100;
    // const offsetY = Math.random() * 200 - 100;

    // return {
    //   x: lastNode.position.x + offsetX,
    //   y: lastNode.position.y + offsetY
    // };
    var nextX = lastNode.position.x + NODE_WIDTH + GAP;
    if (nextX > MAX_ROW_WIDTH) {
      return {
        x: 250,
        y: lastNode.position.y + NODE_HEIGHT + GAP
      };
    }
    return {
      x: nextX,
      y: lastNode.position.y
    };
  };
  var _addNode = function addNode(nodeType) {
    var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var initialData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var isEmptyCanvas = nodes.length === 0;
    var id = getNextId(nodeType);
    var nodePosition;
    if (position) {
      nodePosition = position;
    } else {
      var lastNode = nodes[nodes.length - 1];
      nodePosition = getNewNodePosition(lastNode);
    }
    var newNode = {
      id: id,
      type: nodeType,
      position: nodePosition,
      data: _objectSpread({}, initialData)
    };
    setNodes(function (prev) {
      return [].concat(_toConsumableArray(prev), [newNode]);
    });
    setDropDown(0);
    setContextMenu(null);
    if (!position) {
      setTimeout(function () {
        return _fitView({
          padding: isEmptyCanvas ? 1.2 : 0.8,
          duration: 500,
          minZoom: isEmptyCanvas ? 0.15 : 0.2
        });
      }, 0);
    }
  };
  var onKeyDown = (0, _react.useCallback)(function (e) {
    if (e.key === "Delete") {
      setNodes(function (nds) {
        var deletedIds = nds.filter(function (n) {
          return n.selected;
        }).map(function (n) {
          return n.id;
        });
        var remainingNodes = nds.filter(function (n) {
          return !n.selected;
        });
        setEdges(function (eds) {
          return eds.filter(function (e) {
            return !(deletedIds !== null && deletedIds !== void 0 && deletedIds.includes(e.source)) && !(deletedIds !== null && deletedIds !== void 0 && deletedIds.includes(e.target));
          });
        });
        return remainingNodes;
      });
    }
  }, []);
  var selectedNodes = nodes.filter(function (node) {
    return node.selected;
  });
  var selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  var _useGenerationCost = (0, _useGenerationCost2.useGenerationCost)(selectedNode === null || selectedNode === void 0 || (_selectedNode$data = selectedNode.data) === null || _selectedNode$data === void 0 ? void 0 : _selectedNode$data.selectedModel, selectedNode === null || selectedNode === void 0 || (_selectedNode$data2 = selectedNode.data) === null || _selectedNode$data2 === void 0 ? void 0 : _selectedNode$data2.formValues),
    generationCost = _useGenerationCost.generationCost,
    isRefreshingCost = _useGenerationCost.isRefreshingCost;
  var updateNodeFromPanel = (0, _react.useCallback)(function (key, value) {
    if (!selectedNode) return;
    setNodes(function (nds) {
      return nds.map(function (node) {
        if (node.id === (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id)) {
          return _objectSpread(_objectSpread({}, node), {}, {
            data: _objectSpread(_objectSpread({}, node.data), {}, {
              formValues: _objectSpread(_objectSpread({}, node.data.formValues), {}, _defineProperty({}, key, value))
            })
          });
        }
        return node;
      });
    });
  }, [selectedNode, setNodes]);
  var updateModel = (0, _react.useCallback)(function (model) {
    if (!selectedNode) return;
    setNodes(function (nds) {
      return nds.map(function (node) {
        if (node.id === selectedNode.id) {
          return _objectSpread(_objectSpread({}, node), {}, {
            data: _objectSpread(_objectSpread({}, node.data), {}, {
              selectedModel: model
            })
          });
        }
        return node;
      });
    });
    setDropDown(0);
  }, [selectedNode, setNodes]);
  var getModelsForNode = function getModelsForNode(node) {
    var _nodeSchemas$categori8, _nodeSchemas$categori9, _nodeSchemas$categori0, _nodeSchemas$categori1;
    if (!node || !(nodeSchemas !== null && nodeSchemas !== void 0 && nodeSchemas.categories)) return [];
    var mapModels = function mapModels(modelsMap) {
      return modelsMap ? Object.entries(modelsMap).map(function (_ref12) {
        var _ref13 = _slicedToArray(_ref12, 2),
          id = _ref13[0],
          model = _ref13[1];
        return _objectSpread(_objectSpread({}, model), {}, {
          id: id,
          name: SPECIAL_MODEL_NAMES[id] || formatName(id)
        });
      }) : [];
    };
    if (node.type === "textNode") return mapModels((_nodeSchemas$categori8 = nodeSchemas.categories.text) === null || _nodeSchemas$categori8 === void 0 ? void 0 : _nodeSchemas$categori8.models);
    if (node.type === "imageNode") return mapModels((_nodeSchemas$categori9 = nodeSchemas.categories.image) === null || _nodeSchemas$categori9 === void 0 ? void 0 : _nodeSchemas$categori9.models);
    if (node.type === "videoNode") return mapModels((_nodeSchemas$categori0 = nodeSchemas.categories.video) === null || _nodeSchemas$categori0 === void 0 ? void 0 : _nodeSchemas$categori0.models);
    if (node.type === "audioNode") return mapModels((_nodeSchemas$categori1 = nodeSchemas.categories.audio) === null || _nodeSchemas$categori1 === void 0 ? void 0 : _nodeSchemas$categori1.models);
    if (node.type === "apiNode") return filteredApiNodeModels;
    return [];
  };
  var getFilteredModelsForNode = function getFilteredModelsForNode(node) {
    var models = getModelsForNode(node);
    if (!modelSearch.trim()) return models;
    var normalize = function normalize() {
      var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
      return text.toLowerCase().replace(/[^a-z0-9]/g, "");
    };
    var normalizedSearch = normalize(modelSearch);
    return models.filter(function (model) {
      var name = normalize(model.name);
      var id = normalize(model.id);
      return name.includes(normalizedSearch) || id.includes(normalizedSearch);
    });
  };
  var connectionLineStyle = {
    stroke: activeHandleColor === 'blue' ? '#3b82f6' : activeHandleColor === 'green' ? '#22c55e' : activeHandleColor === 'orange' ? '#f97316' : activeHandleColor === 'yellow' ? '#eab308' : '#ffffffff',
    strokeWidth: 2
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    tabIndex: 0,
    onKeyDown: onKeyDown,
    className: "flex h-dvh w-full relative"
  }, isRestoring && /*#__PURE__*/_react["default"].createElement("div", {
    className: "fixed inset-0 flex items-center justify-center gap-2 bg-black w-full h-full z-20"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-6 h-6 rounded-full border-[4px] border-white border-t-transparent animate-spin"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "text-white text-xl font-bold"
  }, "Loading...")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-center absolute top-0 z-20 bg-[#151618] w-full py-3 border-b border-gray-800"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[80%] overflow-x-auto"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 w-[35%]"
  }, /*#__PURE__*/_react["default"].createElement(_link["default"], {
    href: "/studio/workflows",
    className: "text-white"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, null)), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setDropDown(function (prev) {
        return prev === 2 ? 0 : 2;
      });
    },
    disabled: !interactionMode,
    className: "flex items-center gap-2 text-base outline-none text-[#adacaa] hover:text-white cursor-pointer bg-transparent max-w-[90%]"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "truncate block w-full"
  }, workflowName ? workflowName : "Untitled"), " ", /*#__PURE__*/_react["default"].createElement(_fa2.FaRegEdit, {
    size: 14
  }))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2"
  }, template.showTemplateBtn && /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative",
    onBlur: function onBlur(e) {
      var currentTarget = e.currentTarget;
      setTimeout(function () {
        if (currentTarget && !currentTarget.contains(document.activeElement)) {
          setIsSettingsOpen(false);
        }
      }, 150);
    },
    tabIndex: 0
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setIsSettingsOpen(!isSettingsOpen);
    },
    className: "flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-white text-black text-sm rounded-full hover:bg-black hover:text-white transition-colors"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaToolbox, {
    size: 14
  }), " Settings ", /*#__PURE__*/_react["default"].createElement(_fa.FaAngleDown, {
    size: 12,
    className: "transition-transform duration-300 ".concat(isSettingsOpen ? "rotate-180" : "")
  })), isSettingsOpen && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute right-0 mt-2 w-48 bg-[#1b1e23] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    disabled: isRunning === 4,
    onClick: function onClick() {
      handleTemplatePublish();
      setIsSettingsOpen(false);
    },
    className: "w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#2c3037] hover:text-white transition-colors border-b border-gray-700/50 disabled:opacity-50"
  }, isRunning === 4 ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-4 h-4 border-2 border-t-transparent border-gray-300 rounded-full animate-spin"
  }) : /*#__PURE__*/_react["default"].createElement(_lu.LuLayoutTemplate, {
    size: 16
  }), /*#__PURE__*/_react["default"].createElement("span", null, template.isPublishedTemplate ? "Undo Template" : "Make Template")), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      setIsCategoryPopupOpen(true);
      setIsSettingsOpen(false);
    },
    className: "w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#2c3037] hover:text-white transition-colors"
  }, /*#__PURE__*/_react["default"].createElement(_ri.RiInputMethodLine, {
    size: 16
  }), /*#__PURE__*/_react["default"].createElement("span", null, "Category")))), interactionMode ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    disabled: isRunning === 2 || !interactionMode,
    onClick: handlePublishWorkflow,
    className: "flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-white text-black text-sm rounded-full group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white"
  }, isRunning === 2 ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-4 h-4 border-2 border-t-transparent border-black group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin"
  }), " Publishing...") : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_fa2.FaTelegramPlane, {
    size: 16
  }), " ", publishWorkflow ? "Unpublish" : "Publish"))) : /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    disabled: interactionMode,
    onClick: handleDuplicateWorkflow,
    className: "flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-white text-black text-sm rounded-full group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white"
  }, isRunning === 3 ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-4 h-4 border-2 border-t-transparent border-black group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin"
  }), " Duplicating...") : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_io.IoDuplicateOutline, {
    size: 16
  }), " Duplicate"))))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute left-4 self-center z-20 flex flex-col gap-2 bg-[#151618] p-1 rounded-full border border-gray-700 shadow-xl ".concat(isRestoring && "hidden")
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return _reactHotToast.toast.error("This workflow can't be edited.");
    },
    className: "p-3 rounded-full bg-white hover:bg-[#1b1e23] cursor-pointer outline-none text-black active:bg-gray-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed ".concat(interactionMode && "hidden")
  }, /*#__PURE__*/_react["default"].createElement(_md.MdLockOutline, {
    size: 18
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative ".concat(!interactionMode && "hidden"),
    onBlur: function onBlur(e) {
      var currentTarget = e.currentTarget;
      setTimeout(function () {
        if (currentTarget && !currentTarget.contains(document.activeElement)) {
          setDropDown(0);
        }
      }, 100);
    },
    tabIndex: 0
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    disabled: !interactionMode,
    onClick: function onClick() {
      return setDropDown(function (prev) {
        return prev === 1 ? 0 : 1;
      });
    },
    className: "p-3 rounded-full cursor-pointer outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ".concat(dropDown === 1 ? "bg-white text-black" : "text-gray-300 active:bg-gray-600 hover:text-white hover:bg-[#1b1e23]")
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaPlus, {
    size: 18
  })), dropDown === 1 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute left-14 top-0 z-50"
  }, /*#__PURE__*/_react["default"].createElement(_NodesNavbar["default"], {
    addNode: _addNode,
    apiNodeModels: filteredApiNodeModels,
    nodeSchemas: nodeSchemas
  }))), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: zoomIn,
    className: "p-3 rounded-full hover:bg-[#1b1e23] cursor-pointer outline-none text-gray-300 active:bg-gray-600 hover:text-white transition"
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiZoomIn, {
    size: 18
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: zoomOut,
    className: "p-3 rounded-full hover:bg-[#1b1e23] cursor-pointer outline-none text-gray-300 active:bg-gray-600 hover:text-white transition"
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiZoomOut, {
    size: 18
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return _fitView({
        padding: 0.4,
        duration: 500,
        minZoom: 0.2
      });
    },
    className: "p-3 rounded-full hover:bg-[#1b1e23] cursor-pointer outline-none text-gray-300 active:bg-blue-600 hover:text-white transition"
  }, /*#__PURE__*/_react["default"].createElement(_md.MdOutlineZoomOutMap, {
    size: 18
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setIsDragging(!isDragging);
    },
    className: "p-3 rounded-full cursor-pointer outline-none active:bg-gray-600 transition ".concat(!isDragging ? "bg-white text-black" : "text-gray-300 hover:bg-[#1b1e23] hover:text-white")
  }, /*#__PURE__*/_react["default"].createElement(_lu.LuMousePointer2, {
    size: 18
  }))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "z-10 w-full h-full"
  }, /*#__PURE__*/_react["default"].createElement(_reactflow["default"], {
    nodes: nodesWithHandlers,
    edges: edges,
    onNodesChange: onNodesChange,
    onEdgesChange: onEdgesChange,
    onConnect: interactionMode ? onConnect : null,
    isValidConnection: isValidConnection,
    connectionMode: "loose",
    onConnectStart: interactionMode ? onConnectStart : null,
    onConnectEnd: interactionMode ? onConnectEnd : null,
    nodeTypes: nodeTypes,
    onEdgeClick: interactionMode ? onEdgeClick : null,
    onPaneContextMenu: interactionMode ? onPaneContextMenu : null,
    onPaneClick: interactionMode ? onPaneClick : null,
    nodesDraggable: interactionMode,
    nodesConnectable: interactionMode,
    elementsSelectable: interactionMode,
    minZoom: 0.1,
    maxZoom: 4,
    selectionOnDrag: !isDragging,
    panOnDrag: isDragging,
    selectionMode: !isDragging ? "partial" : null,
    multiSelectionKeyCode: "Shift",
    connectionLineStyle: connectionLineStyle,
    fitView: function fitView() {
      return _fitView({
        padding: 0.4,
        duration: 500,
        minZoom: 0.2
      });
    },
    proOptions: {
      hideAttribution: true
    }
  }, /*#__PURE__*/_react["default"].createElement(_reactflow.Background, null), edgePicker && function () {
    var compatibleTypes = getCompatibleNodeTypes(edgePicker.handleColor, edgePicker.isOutput);
    return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
      className: "fixed inset-0 z-40",
      onClick: function onClick() {
        return setEdgePicker(null);
      },
      style: {
        pointerEvents: 'auto'
      }
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "fixed z-50 pointer-events-auto",
      style: {
        left: "".concat(edgePicker.cursorPos.x + 10, "px"),
        top: "".concat(edgePicker.cursorPos.y, "px")
      },
      onClick: function onClick(e) {
        return e.stopPropagation();
      }
    }, /*#__PURE__*/_react["default"].createElement(_NodesNavbar["default"], {
      addNode: handleSelectNodeFromEdgePicker,
      apiNodeModels: filteredApiNodeModels,
      filterNodeTypes: compatibleTypes,
      nodeSchemas: nodeSchemas
    })));
  }())), selectedNode && !["concatNode"].includes(selectedNode.type) && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute right-2 top-16 z-50 w-80 h-full max-h-[90%] bg-[#09090b]/80 backdrop-blur-xl border border-white/20 rounded-2xl flex transition-all duration-300 ease-in-out shadow-2xl"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    className: "absolute top-2 right-2 text-zinc-400 hover:text-white cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-200",
    onClick: function onClick() {
      setNodes(function (nds) {
        return nds.map(function (n) {
          return _objectSpread(_objectSpread({}, n), {}, {
            selected: false
          });
        });
      });
    }
  }, "\u2715"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-4 h-full w-full"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-base font-semibold text-center text-white mt-6 tracking-tight"
  }, "Properties"), /*#__PURE__*/_react["default"].createElement("h1", {
    className: "flex items-center gap-2 text-sm font-medium text-start text-white mx-4 bg-zinc-800/50 border border-white/5 rounded-xl px-3 py-2 transition-all"
  }, selectedNode.id.startsWith("text") ? /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, {
    className: "text-blue-400"
  }) : selectedNode.id.startsWith("image") ? /*#__PURE__*/_react["default"].createElement(_io.IoImageOutline, {
    className: "text-green-400"
  }) : selectedNode.id.startsWith("video") ? /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, {
    className: "text-orange-400"
  }) : selectedNode.id.startsWith("audio") ? /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineAudio, {
    className: "text-yellow-400"
  }) : /*#__PURE__*/_react["default"].createElement(_ri.RiInputMethodLine, {
    className: "text-purple-400"
  }), selectedNode.id.replace(/(\D+)(\d+)/, "$1 $2").replace(/^./, function (c) {
    return c.toUpperCase();
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-4 w-full h-full overflow-y-auto px-4 custom-scrollbar-thin"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-4 w-full h-full"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1 relative w-full",
    onBlur: function onBlur(e) {
      var currentTarget = e.currentTarget;
      setTimeout(function () {
        if (currentTarget && !currentTarget.contains(document.activeElement)) {
          setDropDown(-1);
        }
      }, 100);
    },
    tabIndex: 0
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[10px] font-bold text-zinc-500 text-start px-1"
  }, "Model"), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    ref: modelDropdownTriggerRef,
    onClick: function onClick() {
      return setDropDown(function (prev) {
        return prev === 3 ? 0 : 3;
      });
    },
    className: "flex items-center justify-between gap-1 text-sm text-center text-white w-full h-full cursor-pointer whitespace-nowrap px-3 py-2 bg-zinc-900/50 border border-white/10 hover:border-white/20 focus:outline-none rounded-lg transition-all"
  }, (selectedNode === null || selectedNode === void 0 || (_selectedNode$data3 = selectedNode.data) === null || _selectedNode$data3 === void 0 || (_selectedNode$data3 = _selectedNode$data3.selectedModel) === null || _selectedNode$data3 === void 0 ? void 0 : _selectedNode$data3.name) || "", /*#__PURE__*/_react["default"].createElement(_fa.FaAngleDown, {
    size: 14,
    className: "transition-all duration-300 ".concat(dropDown === 3 && "rotate-180")
  })), dropDown === 3 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute left-0 ".concat(isModelDropdownUp ? "bottom-full mb-2" : "top-16", " bg-zinc-900/95 backdrop-blur-3xl z-20 border border-white/10 p-1 rounded-xl flex flex-col gap-2 shadow-2xl max-h-64 w-full animate-in fade-in zoom-in duration-200")
  }, /*#__PURE__*/_react["default"].createElement("input", {
    type: "search",
    value: modelSearch,
    onChange: function onChange(e) {
      return setModelSearch(e.target.value);
    },
    placeholder: "Search models...",
    className: "px-3 py-2 text-xs bg-black/40 border border-white/5 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-all"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col overflow-y-auto"
  }, getFilteredModelsForNode(selectedNode).length > 0 ? getFilteredModelsForNode(selectedNode).map(function (model, idx) {
    var _selectedNode$data4, _selectedNode$data5;
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: idx,
      className: "flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-all ".concat((selectedNode === null || selectedNode === void 0 || (_selectedNode$data4 = selectedNode.data) === null || _selectedNode$data4 === void 0 || (_selectedNode$data4 = _selectedNode$data4.selectedModel) === null || _selectedNode$data4 === void 0 ? void 0 : _selectedNode$data4.id) === model.id ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"),
      onClick: function onClick() {
        updateModel(model);
        setDropDown(0);
        setModelSearch("");
      }
    }, /*#__PURE__*/_react["default"].createElement("h2", {
      className: "text-sm whitespace-nowrap"
    }, model.name), (selectedNode === null || selectedNode === void 0 || (_selectedNode$data5 = selectedNode.data) === null || _selectedNode$data5 === void 0 || (_selectedNode$data5 = _selectedNode$data5.selectedModel) === null || _selectedNode$data5 === void 0 ? void 0 : _selectedNode$data5.id) === model.id && /*#__PURE__*/_react["default"].createElement(_fa.FaCheck, {
      size: 12,
      className: "ml-auto"
    }));
  }) : /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-xs text-gray-400 text-center py-2"
  }, "No models found")))), selectedNode !== null && selectedNode !== void 0 && (_selectedNode$data6 = selectedNode.data) !== null && _selectedNode$data6 !== void 0 && _selectedNode$data6.selectedModel ? function (_nodeSchemas$categori10, _selectedNode$data7, _fullSchema$schemas, _selectedNode$data8, _selectedNode$data9, _selectedNode$data0, _selectedNode$data1) {
    var nodeType = selectedNode.id.startsWith("text") ? "text" : selectedNode.id.startsWith("image") ? "image" : selectedNode.id.startsWith("video") ? "video" : selectedNode.id.startsWith("audio") ? "audio" : "utility";
    var fullSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori10 = nodeSchemas.categories) === null || _nodeSchemas$categori10 === void 0 || (_nodeSchemas$categori10 = _nodeSchemas$categori10[nodeType]) === null || _nodeSchemas$categori10 === void 0 || (_nodeSchemas$categori10 = _nodeSchemas$categori10.models[selectedNode === null || selectedNode === void 0 || (_selectedNode$data7 = selectedNode.data) === null || _selectedNode$data7 === void 0 || (_selectedNode$data7 = _selectedNode$data7.selectedModel) === null || _selectedNode$data7 === void 0 ? void 0 : _selectedNode$data7.id]) === null || _nodeSchemas$categori10 === void 0 ? void 0 : _nodeSchemas$categori10.input_schema;
    var inputSchema = (fullSchema === null || fullSchema === void 0 || (_fullSchema$schemas = fullSchema.schemas) === null || _fullSchema$schemas === void 0 ? void 0 : _fullSchema$schemas.input_data) || fullSchema || {};
    return (selectedNode === null || selectedNode === void 0 || (_selectedNode$data8 = selectedNode.data) === null || _selectedNode$data8 === void 0 ? void 0 : _selectedNode$data8.loading) === 1 ? /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col items-center justify-center gap-2 h-full w-full"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
    }), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-xs text-white"
    }, "Fetching model...")) : selectedNode.type === "apiNode" ? /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col gap-2 w-full h-full relative pt-2"
    }, /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      onClick: function onClick() {
        return selectedNode && runNodeInputsFromFlow(selectedNode.id);
      },
      disabled: (selectedNode === null || selectedNode === void 0 || (_selectedNode$data9 = selectedNode.data) === null || _selectedNode$data9 === void 0 ? void 0 : _selectedNode$data9.loading) === 1,
      className: "absolute top-0 z-10 text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 group disabled:cursor-not-allowed rounded-full text-white bg-blue-600 px-3 py-1 border border-blue-500/50 hover:bg-blue-500 transition-all self-end shadow-lg shadow-blue-900/20"
    }, (selectedNode === null || selectedNode === void 0 || (_selectedNode$data0 = selectedNode.data) === null || _selectedNode$data0 === void 0 ? void 0 : _selectedNode$data0.loading) === 1 ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-3 h-3 rounded-full border border-t-transparent group-hover:border-t-transparent border-black group-hover:border-white animate-spin"
    }), "Generating...") : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, "Fetch Model")), Object.entries((selectedNode === null || selectedNode === void 0 || (_selectedNode$data1 = selectedNode.data) === null || _selectedNode$data1 === void 0 ? void 0 : _selectedNode$data1.taskData) || {}).map(function (_ref14, idx) {
      var _selectedNode$data10, _selectedNode$data11, _selectedNode$data12;
      var _ref15 = _slicedToArray(_ref14, 2),
        key = _ref15[0],
        meta = _ref15[1];
      var hardcodedKeys = Object.keys((selectedNode === null || selectedNode === void 0 || (_selectedNode$data10 = selectedNode.data) === null || _selectedNode$data10 === void 0 || (_selectedNode$data10 = _selectedNode$data10.selectedModel) === null || _selectedNode$data10 === void 0 || (_selectedNode$data10 = _selectedNode$data10.input_params) === null || _selectedNode$data10 === void 0 ? void 0 : _selectedNode$data10.properties) || {});
      var isHardcoded = hardcodedKeys === null || hardcodedKeys === void 0 ? void 0 : hardcodedKeys.includes(key);
      return /*#__PURE__*/_react["default"].createElement(_RenderApiField["default"], {
        key: key,
        fieldName: key,
        meta: meta,
        idx: idx,
        formValues: (selectedNode === null || selectedNode === void 0 || (_selectedNode$data11 = selectedNode.data) === null || _selectedNode$data11 === void 0 ? void 0 : _selectedNode$data11.formValues) || {},
        setFormValues: function setFormValues(newValues) {
          setNodes(function (nds) {
            return nds.map(function (node) {
              if (node.id === (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id)) {
                var _node$data11;
                var updatedFormValues = typeof newValues === 'function' ? newValues(((_node$data11 = node.data) === null || _node$data11 === void 0 ? void 0 : _node$data11.formValues) || {}) : newValues;
                if (key === 'model_name' && node.data.dynamicSchemas) {
                  var modelNameValue = updatedFormValues.model_name;
                  var matchedModel = Object.values(node.data.dynamicSchemas).find(function (m) {
                    return m.model_id === modelNameValue;
                  });
                  if (matchedModel && matchedModel.model_type) {
                    updatedFormValues = _objectSpread(_objectSpread({}, updatedFormValues), {}, {
                      model_type: matchedModel.model_type
                    });
                  }
                }
                return _objectSpread(_objectSpread({}, node), {}, {
                  data: _objectSpread(_objectSpread({}, node.data), {}, {
                    formValues: updatedFormValues
                  })
                });
              }
              return node;
            });
          });
        },
        exposedHandles: (selectedNode === null || selectedNode === void 0 || (_selectedNode$data12 = selectedNode.data) === null || _selectedNode$data12 === void 0 ? void 0 : _selectedNode$data12.exposedHandles) || [],
        onToggleHandle: isHardcoded ? null : function (field) {
          var _selectedNode$data13;
          var current = (selectedNode === null || selectedNode === void 0 || (_selectedNode$data13 = selectedNode.data) === null || _selectedNode$data13 === void 0 ? void 0 : _selectedNode$data13.exposedHandles) || [];
          var isRemoving = current === null || current === void 0 ? void 0 : current.includes(field);
          if (isRemoving) {
            setEdges(function (eds) {
              return eds.filter(function (e) {
                return !(e.target === (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id) && e.targetHandle === field);
              });
            });
          }
          setNodes(function (nds) {
            return nds.map(function (node) {
              if (node.id === (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id)) {
                var updated = isRemoving ? current.filter(function (h) {
                  return h !== field;
                }) : [].concat(_toConsumableArray(current), [field]);
                return _objectSpread(_objectSpread({}, node), {}, {
                  data: _objectSpread(_objectSpread({}, node.data), {}, {
                    exposedHandles: updated
                  })
                });
              }
              return node;
            });
          });
        },
        handleChange: function handleChange(field, value) {
          updateNodeFromPanel(field, value);
          if (field === 'model_name' && selectedNode.data.dynamicSchemas) {
            var matchedModel = Object.values(selectedNode.data.dynamicSchemas).find(function (m) {
              return m.model_id === value;
            });
            if (matchedModel && matchedModel.model_type) {
              updateNodeFromPanel('model_type', matchedModel.model_type);
            }
          }
        }
      });
    })) : inputSchema !== null && inputSchema !== void 0 && inputSchema.properties || inputSchema && Object.keys(inputSchema).length > 0 ? Object.entries((inputSchema === null || inputSchema === void 0 ? void 0 : inputSchema.properties) || inputSchema).map(function (_ref16, idx) {
      var _selectedNode$data14, _selectedNode$data15;
      var _ref17 = _slicedToArray(_ref16, 2),
        key = _ref17[0],
        meta = _ref17[1];
      if (key === "schemas") return null;
      return /*#__PURE__*/_react["default"].createElement(_RenderField["default"], {
        key: key,
        fieldName: key,
        meta: meta,
        idx: idx,
        formValues: (selectedNode === null || selectedNode === void 0 || (_selectedNode$data14 = selectedNode.data) === null || _selectedNode$data14 === void 0 ? void 0 : _selectedNode$data14.formValues) || {},
        setFormValues: function setFormValues(newValues) {
          setNodes(function (nds) {
            return nds.map(function (node) {
              if (node.id === (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id)) {
                var _node$data12;
                return _objectSpread(_objectSpread({}, node), {}, {
                  data: _objectSpread(_objectSpread({}, node.data), {}, {
                    formValues: typeof newValues === 'function' ? newValues(((_node$data12 = node.data) === null || _node$data12 === void 0 ? void 0 : _node$data12.formValues) || {}) : newValues
                  })
                });
              }
              return node;
            });
          });
        },
        handleChange: updateNodeFromPanel,
        data: inputSchema,
        modelName: selectedNode === null || selectedNode === void 0 || (_selectedNode$data15 = selectedNode.data) === null || _selectedNode$data15 === void 0 || (_selectedNode$data15 = _selectedNode$data15.selectedModel) === null || _selectedNode$data15 === void 0 ? void 0 : _selectedNode$data15.name
      });
    }).filter(Boolean) : /*#__PURE__*/_react["default"].createElement("div", {
      className: "text-center py-8"
    }, /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-sm text-gray-400"
    }, "No properties available"));
  }() : /*#__PURE__*/_react["default"].createElement("div", {
    className: "text-center py-8"
  }, /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-sm text-gray-400"
  }, "Please select a model first")))), (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type) === "videoNode" && (selectedNode === null || selectedNode === void 0 || (_selectedNode$data16 = selectedNode.data) === null || _selectedNode$data16 === void 0 || (_selectedNode$data16 = _selectedNode$data16.formValues) === null || _selectedNode$data16 === void 0 ? void 0 : _selectedNode$data16.face_asset) && function () {
    var fa = String(selectedNode.data.formValues.face_asset);
    var isAsset = fa.startsWith("asset://");
    var thumb = selectedNode.data.formValues.face_thumbnail;
    // Prefer the stored thumbnail; fall back to the asset value itself
    // when it's a plain image URL.
    var photo = thumb || (!isAsset ? fa : null);
    return /*#__PURE__*/_react["default"].createElement("div", {
      className: "px-4 pb-3"
    }, /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-[10px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5"
    }, "\u0420\u0435\u0444\u0435\u0440\u0435\u043D\u0441 \u043B\u0438\u0446\u0430"), photo && /*#__PURE__*/_react["default"].createElement("div", {
      className: "rounded-xl overflow-hidden border border-purple-500/30 relative mb-1.5"
    }, /*#__PURE__*/_react["default"].createElement("img", {
      src: photo,
      alt: "face reference",
      className: "w-full h-28 object-cover object-top",
      onError: function onError(e) {
        e.target.style.display = 'none';
      }
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "absolute top-1.5 right-1.5 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
    }, "Face")), isAsset && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 rounded-lg bg-purple-900/20 border border-purple-500/30 px-2.5 py-2"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-4 h-4 rounded-full bg-purple-600 flex-shrink-0"
    }), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px] font-mono text-purple-200 truncate"
    }, fa)));
  }(), /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-4 flex flex-col gap-3"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "flex items-center justify-between cursor-pointer group"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-gray-300 font-medium"
  }, "Mark as Output"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative"
  }, /*#__PURE__*/_react["default"].createElement("input", {
    type: "checkbox",
    className: "sr-only peer",
    checked: (selectedNode === null || selectedNode === void 0 || (_selectedNode$data17 = selectedNode.data) === null || _selectedNode$data17 === void 0 || (_selectedNode$data17 = _selectedNode$data17.formValues) === null || _selectedNode$data17 === void 0 ? void 0 : _selectedNode$data17.make_output) === true,
    onChange: function onChange(e) {
      var checked = e.target.checked;
      setNodes(function (nds) {
        return nds.map(function (n) {
          return n.id === selectedNode.id ? _objectSpread(_objectSpread({}, n), {}, {
            data: _objectSpread(_objectSpread({}, n.data), {}, {
              formValues: _objectSpread(_objectSpread({}, n.data.formValues), {}, {
                make_output: checked
              })
            })
          }) : n;
        });
      });
    }
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform"
  }))), !(selectedNode !== null && selectedNode !== void 0 && (_selectedNode$data18 = selectedNode.data) !== null && _selectedNode$data18 !== void 0 && (_selectedNode$data18 = _selectedNode$data18.selectedModel) !== null && _selectedNode$data18 !== void 0 && (_selectedNode$data18 = _selectedNode$data18.id) !== null && _selectedNode$data18 !== void 0 && _selectedNode$data18.includes("passthrough")) && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return selectedNode && runNodeFromFlow(selectedNode.id);
    },
    disabled: loadingNodes[selectedNode.id] || (selectedNode === null || selectedNode === void 0 || (_selectedNode$data19 = selectedNode.data) === null || _selectedNode$data19 === void 0 ? void 0 : _selectedNode$data19.isLoading),
    className: "text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 group disabled:cursor-not-allowed rounded-lg text-white bg-blue-500 px-4 py-2 border border-blue-500/50 hover:bg-blue-600 w-full transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
  }, loadingNodes[selectedNode.id] || selectedNode !== null && selectedNode !== void 0 && (_selectedNode$data20 = selectedNode.data) !== null && _selectedNode$data20 !== void 0 && _selectedNode$data20.isLoading ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"
  }), "Generating...") : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_fa.FaPlay, {
    size: 16
  }), "Generate", generationCost !== null && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs font-medium"
  }, isRefreshingCost ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block align-middle"
  }) : generationCost === 0 ? 'Free' : "$".concat(generationCost))))))), contextMenu && /*#__PURE__*/_react["default"].createElement("div", {
    className: "fixed z-40",
    style: {
      top: contextMenu.y,
      left: contextMenu.x
    },
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/_react["default"].createElement(_NodesNavbar["default"], {
    addNode: function addNode(type, _, data) {
      return _addNode(type, contextMenu.position, data);
    },
    apiNodeModels: filteredApiNodeModels,
    nodeSchemas: nodeSchemas
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "fixed inset-0 flex flex-col items-center justify-center z-50 overflow-auto bg-black/30 backdrop-blur transition-all duration-200 ease-in-out ".concat(dropDown === 2 ? "opacity-100 scale-100 visible" : "opacity-0 scale-80 invisible"),
    onClick: function onClick() {
      return setDropDown(0);
    }
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "bg-[#242629] rounded-lg p-4 w-72 shadow-lg flex flex-col gap-4",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-base text-center font-semibold text-white"
  }, "Save Workflow"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-2 w-full"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-xs text-start text-gray-300"
  }, "Workflow Name"), /*#__PURE__*/_react["default"].createElement("input", {
    type: "text",
    value: workflowName,
    autoFocus: true,
    onChange: function onChange(e) {
      return setWorkflowName(e.target.value);
    },
    placeholder: "Enter Workflow Name",
    className: "border border-gray-700 px-2 py-1.5 text-sm text-white rounded bg-transparent w-full"
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center w-full gap-2"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setDropDown(0);
    },
    className: "px-4 py-2 bg-gray-700/50 text-white rounded-full text-sm hover:bg-gray-600/50 transition w-full cursor-pointer"
  }, "Cancel"), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleSaveWorkFlow,
    className: "px-4 py-2 bg-white text-black rounded-full hover:bg-blue-500 hover:text-white transition w-full text-sm cursor-pointer"
  }, "Save")))), nodes.length === 0 && !isPresetsDismissed && interactionMode && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "pointer-events-auto flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300 transform scale-90 md:scale-100 overflow-y-auto custom-scrollbar max-w-[90%] max-h-[80%] p-10"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-lg border border-white/10 shadow-xl"
  }, /*#__PURE__*/_react["default"].createElement("h2", {
    className: "text-xl font-semibold text-white tracking-tight"
  }, "Select a Workflow"), /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-xs text-gray-400 font-medium uppercase tracking-widest"
  }, "or start from scratch")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
  }, _utility.presets.map(function (preset) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      key: preset.id,
      onClick: function onClick() {
        return loadPreset(preset);
      },
      className: "group relative flex flex-col bg-[#151618] aspect-[4/3] border border-gray-700 hover:border-gray-500 rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-200 overflow-hidden text-left"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "z-10 p-2 bg-[#242629] border-b border-gray-700 flex items-center px-3 justify-between"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-2 h-2 rounded-full ".concat(preset.id === "empty-workflow" ? "bg-gray-400" : "bg-blue-500")
    }), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px] font-bold text-gray-300 uppercase tracking-wider"
    }, preset.id === "empty-workflow" ? "NEW" : "PRESET")), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex gap-1"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-1.5 h-1.5 rounded-full bg-gray-600"
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-1.5 h-1.5 rounded-full bg-gray-600"
    }))), /*#__PURE__*/_react["default"].createElement("div", {
      className: "z-0 p-4 flex flex-col gap-3 h-full"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center justify-center gap-2 z-10 w-full h-full"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "text-white group-hover:text-blue-400 transition-colors"
    }, iconMap[preset.icon] || /*#__PURE__*/_react["default"].createElement(_ri.RiInputMethodLine, {
      size: 16
    })), /*#__PURE__*/_react["default"].createElement("h3", {
      className: "text-sm font-medium text-white leading-tight group-hover:text-blue-400 transition-colors"
    }, preset.title)), preset.image && /*#__PURE__*/_react["default"].createElement("div", {
      className: "absolute inset-0 z-0 w-full h-full rounded overflow-hidden border border-gray-800"
    }, /*#__PURE__*/_react["default"].createElement("img", {
      src: preset.image,
      alt: "",
      className: "w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "absolute inset-0 z-10 w-full h-full bg-black/60"
    })), preset.description && /*#__PURE__*/_react["default"].createElement("p", {
      className: "z-10 text-[11px] text-gray-300 leading-relaxed border-t border-gray-500 pt-2 mt-auto"
    }, preset.description)));
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setIsPresetsDismissed(true);
    },
    className: "mt-4 px-5 py-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-xs text-gray-300 font-medium transition-colors border border-gray-700 hover:border-gray-500"
  }, "Dismiss & Enter Empty Canvas"))), interactionMode && /*#__PURE__*/_react["default"].createElement(_ChatWidget["default"], {
    isOpen: isChatOpen,
    toggleChat: function toggleChat() {
      return setIsChatOpen(!isChatOpen);
    },
    messages: chatMessages,
    onSendMessage: handleSendMessage,
    isLoading: isChatLoading,
    onClearHistory: function onClearHistory() {
      return setChatMessages([]);
    }
  }), isCategoryPopupOpen && /*#__PURE__*/_react["default"].createElement("div", {
    className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "bg-[#1b1e23] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-6"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-lg font-semibold text-white mb-4"
  }, "Edit Workflow Category"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-xs text-gray-400 uppercase tracking-wider"
  }, "Category Name"), /*#__PURE__*/_react["default"].createElement("input", {
    type: "text",
    value: categoryInput,
    onChange: function onChange(e) {
      return setCategoryInput(e.target.value);
    },
    placeholder: "Enter category...",
    className: "w-full px-4 py-3 bg-[#151618] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-600 transition-all",
    autoFocus: true
  })))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-4 bg-[#151618]/50 flex items-center justify-end gap-3 border-t border-gray-700/50"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setIsCategoryPopupOpen(false);
    },
    className: "px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
  }, "Cancel"), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleCategorySave,
    className: "flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
  }, /*#__PURE__*/_react["default"].createElement(_md.MdSave, {
    size: 18
  }), "Save Category")))), /*#__PURE__*/_react["default"].createElement(_reactHotToast.Toaster, null));
};
var _default = exports["default"] = NodeFlow;
