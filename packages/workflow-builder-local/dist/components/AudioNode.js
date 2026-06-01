"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactflow = require("reactflow");
var _WorkflowStore = require("./WorkflowStore");
var _reactHotToast = require("react-hot-toast");
var _io = require("react-icons/io5");
var _ai = require("react-icons/ai");
var _UploadNode = _interopRequireDefault(require("./UploadNode"));
var _utility = require("./utility");
var _AudioPlayer = _interopRequireDefault(require("./AudioPlayer"));
var _axios = _interopRequireDefault(require("axios"));
var _sl = require("react-icons/sl");
var _md = require("react-icons/md");
var _fa = require("react-icons/fa6");
var _NodeSendButton = _interopRequireDefault(require("./NodeSendButton"));
var _NodeOptionsMenu = _interopRequireDefault(require("./NodeOptionsMenu"));
var _useGenerationCost2 = require("./useGenerationCost");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t3 in e) "default" !== _t3 && {}.hasOwnProperty.call(e, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e[_t3]); return f; })(e, t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
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
var inputHandles = ["audioInput", "audioInput2", "audioInput3", "audioInput4"];
var outputHandles = ["audioOutput"];
var AudioGeneration = function AudioGeneration(_ref) {
  var _data$runId, _nodeSchemas$categori, _data$selectedModel2, _data$selectedModel3, _data$selectedModel4, _data$selectedModel5, _outputHistory$curren, _currentOutputList$cu, _currentOutputList$, _data$selectedModel6;
  var id = _ref.id,
    data = _ref.data,
    selected = _ref.selected;
  var models = (0, _react.useMemo)(function () {
    var _data$nodeSchemas;
    return (_data$nodeSchemas = data.nodeSchemas) !== null && _data$nodeSchemas !== void 0 && (_data$nodeSchemas = _data$nodeSchemas.categories) !== null && _data$nodeSchemas !== void 0 && (_data$nodeSchemas = _data$nodeSchemas.audio) !== null && _data$nodeSchemas !== void 0 && _data$nodeSchemas.models ? Object.values(data.nodeSchemas.categories.audio.models) : [];
  }, [data.nodeSchemas]);
  var _useState = (0, _react.useState)(data.selectedModel || models[1] || models[0] || {}),
    _useState2 = _slicedToArray(_useState, 2),
    selectedModel = _useState2[0],
    setSelectedModel = _useState2[1];
  var _useState3 = (0, _react.useState)({}),
    _useState4 = _slicedToArray(_useState3, 2),
    connectedInputs = _useState4[0],
    setConnectedInputs = _useState4[1];
  var _useState5 = (0, _react.useState)({}),
    _useState6 = _slicedToArray(_useState5, 2),
    connectedOutputs = _useState6[0],
    setConnectedOutputs = _useState6[1];
  var _useState7 = (0, _react.useState)(data.formValues || {}),
    _useState8 = _slicedToArray(_useState7, 2),
    formValues = _useState8[0],
    setFormValues = _useState8[1];
  var _useState9 = (0, _react.useState)(0),
    _useState0 = _slicedToArray(_useState9, 2),
    dropDown = _useState0[0],
    setDropDown = _useState0[1];
  var _useState1 = (0, _react.useState)(0),
    _useState10 = _slicedToArray(_useState1, 2),
    loading = _useState10[0],
    setLoading = _useState10[1];
  var _useState11 = (0, _react.useState)(-1),
    _useState12 = _slicedToArray(_useState11, 2),
    currentHistoryIndex = _useState12[0],
    setCurrentHistoryIndex = _useState12[1];
  var _useState13 = (0, _react.useState)(0),
    _useState14 = _slicedToArray(_useState13, 2),
    currentAudioIndex = _useState14[0],
    setCurrentAudioIndex = _useState14[1];
  var outputHistory = data.outputHistory || [];
  var prevHistoryLengthRef = (0, _react.useRef)(outputHistory.length);
  var workflowId = (0, _WorkflowStore.getWorkflowId)();
  var runId = (_data$runId = data.runId) !== null && _data$runId !== void 0 ? _data$runId : (0, _WorkflowStore.getRunId)();
  var nodeSchemas = data.nodeSchemas || {};
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    setNodes = _useReactFlow.setNodes,
    setEdges = _useReactFlow.setEdges;
  var updateNodeInternals = (0, _reactflow.useUpdateNodeInternals)();
  var edges = (0, _reactflow.useStore)(function (state) {
    return state.edges;
  });
  var properties = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori = nodeSchemas.categories) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.audio) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.models) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori[selectedModel.id]) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.input_schema) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.schemas) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.input_data) === null || _nodeSchemas$categori === void 0 ? void 0 : _nodeSchemas$categori.properties;
  var _useGenerationCost = (0, _useGenerationCost2.useGenerationCost)(selectedModel, formValues),
    generationCost = _useGenerationCost.generationCost,
    isRefreshingCost = _useGenerationCost.isRefreshingCost;
  (0, _react.useEffect)(function () {
    if (data.cost !== generationCost) {
      var _data$onDataChange;
      (_data$onDataChange = data.onDataChange) === null || _data$onDataChange === void 0 || _data$onDataChange.call(data, id, {
        cost: generationCost
      });
    }
  }, [id, generationCost, data.cost]);
  var _initializeFormData = function initializeFormData(schemaProperties) {
    var initialData = {};
    var fieldEntries = Object.entries(schemaProperties || {});
    fieldEntries.forEach(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
        fieldName = _ref3[0],
        fieldSchema = _ref3[1];
      if (fieldSchema.type === "array") {
        var _fieldSchema$items;
        if (((_fieldSchema$items = fieldSchema.items) === null || _fieldSchema$items === void 0 ? void 0 : _fieldSchema$items.type) === "object") {
          var examples = fieldSchema.examples;
          if (Array.isArray(examples) && examples.length > 0) {
            initialData[fieldName] = examples.map(function (ex) {
              return _objectSpread({}, ex);
            });
          } else {
            initialData[fieldName] = [];
          }
        } else {
          initialData[fieldName] = fieldSchema.examples || [];
        }
      } else if (fieldSchema.type === "object") {
        var nestedProps = fieldSchema.properties || {};
        initialData[fieldName] = _initializeFormData(nestedProps);
      } else if (fieldSchema["default"] !== undefined) {
        initialData[fieldName] = fieldSchema["default"];
      } else if (fieldSchema.examples && fieldSchema.examples.length > 0) {
        initialData[fieldName] = fieldSchema.examples[0];
      } else {
        switch (fieldSchema.type) {
          case "boolean":
            initialData[fieldName] = false;
            break;
          case "int":
          case "number":
            initialData[fieldName] = 0;
            break;
          default:
            initialData[fieldName] = "";
        }
      }
    });
    return initialData;
  };
  var addFormValuesInTaskData = function addFormValuesInTaskData(properties) {
    var defaults = _initializeFormData(properties);
    var validKeys = Object.keys(properties);
    var filteredFormValues = Object.entries(data.formValues || {}).reduce(function (acc, _ref4) {
      var _ref5 = _slicedToArray(_ref4, 2),
        key = _ref5[0],
        val = _ref5[1];
      if (validKeys.includes(key)) acc[key] = val;
      return acc;
    }, {});
    var merged = Object.entries(_objectSpread(_objectSpread({}, defaults), filteredFormValues)).reduce(function (acc, _ref6) {
      var _ref7 = _slicedToArray(_ref6, 2),
        key = _ref7[0],
        val = _ref7[1];
      var meta = properties[key];
      if (meta !== null && meta !== void 0 && meta["enum"] && !meta["enum"].includes(val)) {
        var _ref8, _meta$default;
        acc[key] = (_ref8 = (_meta$default = meta["default"]) !== null && _meta$default !== void 0 ? _meta$default : meta["enum"][0]) !== null && _ref8 !== void 0 ? _ref8 : "";
      } else {
        acc[key] = val;
      }
      return acc;
    }, {});

    // Preserve UI-only flags that are not part of the model schema
    var UI_KEYS = ["make_output", "make_input"];
    UI_KEYS.forEach(function (k) {
      var _data$formValues;
      if (((_data$formValues = data.formValues) === null || _data$formValues === void 0 ? void 0 : _data$formValues[k]) !== undefined) merged[k] = data.formValues[k];
    });
    setFormValues(merged);
  };
  (0, _react.useEffect)(function () {
    setLoading(1);
    if (properties) {
      addFormValuesInTaskData(properties);
    }
    setLoading(0);
  }, [selectedModel]);
  (0, _react.useEffect)(function () {
    if (data.selectedModel) {
      setSelectedModel(data.selectedModel);
    }
    if (data.triggerRun) {
      handleRunSingleNode();
      data.onDataChange(id, {
        triggerRun: false
      });
    }
    if (data.outputHistory && data.outputHistory.length > 0) {
      if (currentHistoryIndex === -1) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentAudioIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentAudioIndex(0);
      }
    }
    prevHistoryLengthRef.current = data.outputHistory ? data.outputHistory.length : 0;
  }, [data.selectedModel, data.triggerRun, data.outputHistory]);
  (0, _react.useEffect)(function () {
    updateNodeInternals(id);
  }, [formValues, id]);
  (0, _react.useEffect)(function () {
    if (!data.formValues) return;
    var incoming = JSON.stringify(data.formValues);
    var current = JSON.stringify(formValues);
    if (incoming === current) return;
    var timer = setTimeout(function () {
      if (Object.entries(data.formValues || {}).length > 0) {
        setFormValues(data.formValues);
      }
    }, 200);
    return function () {
      return clearTimeout(timer);
    };
  }, [data.formValues]);
  (0, _react.useEffect)(function () {
    var _data$selectedModel;
    if (data !== null && data !== void 0 && data.onDataChange && (data === null || data === void 0 || (_data$selectedModel = data.selectedModel) === null || _data$selectedModel === void 0 ? void 0 : _data$selectedModel.id) !== "audio-passthrough") {
      data.onDataChange(id, {
        selectedModel: selectedModel,
        formValues: formValues,
        loading: loading
      });
    }
  }, [selectedModel, formValues, loading]);
  var handleChange = function handleChange(key, value) {
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, value));
    });
    setDropDown(-1);
  };
  var pollNodeStatus = function pollNodeStatus(run_id) {
    var interval = setInterval(function () {
      _axios["default"].get("/api/workflow/run/".concat(run_id, "/status")).then(function (response) {
        var _Object$entries$find;
        var nodesInRes = response.data.nodes || {};
        var nodeData = nodesInRes[id] || ((_Object$entries$find = Object.entries(nodesInRes).find(function (_ref9) {
          var _ref0 = _slicedToArray(_ref9, 1),
            key = _ref0[0];
          return key.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '');
        })) === null || _Object$entries$find === void 0 ? void 0 : _Object$entries$find[1]);
        if (!nodeData || nodeData.length === 0) return;
        var latest = nodeData[nodeData.length - 1];
        if (latest.status === "succeeded" || latest.status === "completed") {
          var _output$, _data$onDataChange2;
          var output = latest.result.outputs;
          var val = ((_output$ = output[0]) === null || _output$ === void 0 ? void 0 : _output$.value) || "";
          var currentHistory = data.outputHistory || [];
          var result = latest.result;
          var isAlreadyInHistory = currentHistory.some(function (h) {
            var _h$result;
            return ((_h$result = h.result) === null || _h$result === void 0 ? void 0 : _h$result.id) === result.id;
          });
          var newHistory = isAlreadyInHistory ? currentHistory.map(function (h) {
            var _h$result2;
            return ((_h$result2 = h.result) === null || _h$result2 === void 0 ? void 0 : _h$result2.id) === result.id ? latest : h;
          }) : [].concat(_toConsumableArray(currentHistory), [latest]);
          data === null || data === void 0 || (_data$onDataChange2 = data.onDataChange) === null || _data$onDataChange2 === void 0 || _data$onDataChange2.call(data, id, {
            outputs: output,
            resultUrl: val,
            isLoading: false,
            errorMsg: null,
            outputHistory: newHistory
          });
          setCurrentHistoryIndex(newHistory.length - 1);
          setCurrentAudioIndex(0);
          clearInterval(interval);
        }
        if (latest.status === "failed") {
          var _latest$result, _outputs$;
          var outputs = latest === null || latest === void 0 || (_latest$result = latest.result) === null || _latest$result === void 0 ? void 0 : _latest$result.outputs;
          var errorMsg = "Generation failed";
          if (outputs && (_outputs$ = outputs[0]) !== null && _outputs$ !== void 0 && (_outputs$ = _outputs$.value) !== null && _outputs$ !== void 0 && _outputs$.error) {
            errorMsg = outputs[0].value.error;
          }
          _reactHotToast.toast.error("Node ".concat(id, " failed"));
          var _currentHistory = data.outputHistory || [];
          data.onDataChange(id, {
            isLoading: false,
            errorMsg: errorMsg,
            outputHistory: _currentHistory
          });
          clearInterval(interval);
        }
      })["catch"](function (error) {
        console.log(error);
        clearInterval(interval);
        data.onDataChange(id, {
          isLoading: false
        });
        _reactHotToast.toast.error("Failed to get workflow status Audio ".concat(id.replace(/^\D+/g, "")));
      });
    }, 3000);
  };
  var handleRunSingleNode = /*#__PURE__*/function () {
    var _ref1 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _nodeSchemas$categori2, workflow_id, modelSchema, params, inputSchema, localSources, _i, _Object$entries, _Object$entries$_i, key, meta, _meta$default2, response, _error$response, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.n = 1;
            break;
          case 1:
            ;
            _context.p = 2;
            data.onDataChange(id, {
              isLoading: true
            });
            _context.n = 3;
            return data.handleSaveWorkFlow();
          case 3:
            workflow_id = _context.v;
            if (workflow_id) {
              _context.n = 4;
              break;
            }
            _reactHotToast.toast.error("Failed to save workflow before running node");
            data.onDataChange(id, {
              isLoading: false
            });
            return _context.a(2);
          case 4:
            modelSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori2 = nodeSchemas.categories) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.audio) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.models[selectedModel.id]) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.input_schema) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.schemas) === null || _nodeSchemas$categori2 === void 0 ? void 0 : _nodeSchemas$categori2.input_data;
            if (!(!modelSchema || !modelSchema.properties)) {
              _context.n = 5;
              break;
            }
            _reactHotToast.toast.error("No input schema found for this model");
            data.onDataChange(id, {
              isLoading: false
            });
            return _context.a(2);
          case 5:
            params = {};
            inputSchema = modelSchema.properties;
            localSources = formValues || {};
            for (_i = 0, _Object$entries = Object.entries(inputSchema); _i < _Object$entries.length; _i++) {
              _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), key = _Object$entries$_i[0], meta = _Object$entries$_i[1];
              if (localSources.hasOwnProperty(key)) {
                params[key] = localSources[key];
              } else {
                params[key] = (_meta$default2 = meta["default"]) !== null && _meta$default2 !== void 0 ? _meta$default2 : null;
              }
            }
            _context.n = 6;
            return _axios["default"].post("/api/workflow/".concat(workflow_id, "/node/").concat(id, "/run"), {
              run_id: runId,
              model: selectedModel.id,
              params: params,
              cost: generationCost,
              node_id: "AI Audio"
            });
          case 6:
            response = _context.v;
            { var _r = response.data; var _nd = _r && _r.nodes && (_r.nodes[id] || Object.values(_r.nodes)[0]); var _lt = _nd && _nd[_nd.length - 1]; if (_lt && (_lt.status === "succeeded" || _lt.status === "completed") && _lt.result && _lt.result.outputs) { var _o = _lt.result.outputs; data && data.onDataChange && data.onDataChange(id, { outputs: _o, resultUrl: (_o[0] && _o[0].value) || "", isLoading: false, errorMsg: null, outputHistory: (data.outputHistory || []).concat([_lt]) }); } else if (_lt && _lt.status === "failed") { data && data.onDataChange && data.onDataChange(id, { isLoading: false, errorMsg: "Generation failed" }); } else { pollNodeStatus(_r.run_id); } }
            _context.n = 8;
            break;
          case 7:
            _context.p = 7;
            _t = _context.v;
            data.onDataChange(id, {
              isLoading: false
            });
            _reactHotToast.toast.error(((_error$response = _t.response) === null || _error$response === void 0 || (_error$response = _error$response.data) === null || _error$response === void 0 ? void 0 : _error$response.detail) || "Error running node");
            console.error(_t);
          case 8:
            ;
          case 9:
            return _context.a(2);
        }
      }, _callee, null, [[2, 7]]);
    }));
    return function handleRunSingleNode() {
      return _ref1.apply(this, arguments);
    };
  }();
  var handleDeleteNode = function handleDeleteNode() {
    if (window.confirm("Are you sure you want to delete this ".concat(id, " node?"))) {
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
      _reactHotToast.toast.success("Deleted node ".concat(id));
    }
    ;
  };
  var hasPrompt = properties && "prompt" in properties && !((_data$selectedModel2 = data.selectedModel) !== null && _data$selectedModel2 !== void 0 && _data$selectedModel2.id.includes("passthrough"));
  var hasImageUrl = properties && "image_url" in properties && !((_data$selectedModel3 = data.selectedModel) !== null && _data$selectedModel3 !== void 0 && _data$selectedModel3.id.includes("passthrough"));
  var hasVideoUrl = properties && "video_url" in properties && !((_data$selectedModel4 = data.selectedModel) !== null && _data$selectedModel4 !== void 0 && _data$selectedModel4.id.includes("passthrough"));
  var hasAudioUrl = properties && "audio_url" in properties && !((_data$selectedModel5 = data.selectedModel) !== null && _data$selectedModel5 !== void 0 && _data$selectedModel5.id.includes("passthrough"));
  (0, _react.useEffect)(function () {
    var timeout = setTimeout(function () {
      var validHandles = [hasAudioUrl && "audioInput", hasPrompt && "audioInput2", hasImageUrl && "audioInput3", hasVideoUrl && "audioInput4"].filter(Boolean);
      setEdges(function (prevEdges) {
        return prevEdges.filter(function (edge) {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        });
      });
    }, 2000);
    return function () {
      return clearTimeout(timeout);
    };
  }, [hasAudioUrl, hasPrompt, hasImageUrl, hasVideoUrl, id, setEdges]);
  var handlePrev = function handlePrev(e) {
    e.stopPropagation();
    if (currentHistoryIndex > 0) {
      var _outputHistory$newInd;
      var newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentAudioIndex(0);
      var viewing = (_outputHistory$newInd = outputHistory[newIndex]) === null || _outputHistory$newInd === void 0 || (_outputHistory$newInd = _outputHistory$newInd.result) === null || _outputHistory$newInd === void 0 || (_outputHistory$newInd = _outputHistory$newInd.outputs) === null || _outputHistory$newInd === void 0 || (_outputHistory$newInd = _outputHistory$newInd[0]) === null || _outputHistory$newInd === void 0 ? void 0 : _outputHistory$newInd.value;
      setNodes(function (nds) {
        return nds.map(function (n) {
          if (n.id === id) {
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                viewingOutput: viewing
              })
            });
          }
          return n;
        });
      });
    }
  };
  var handleNext = function handleNext(e) {
    e.stopPropagation();
    if (currentHistoryIndex < outputHistory.length - 1) {
      var _outputHistory$newInd2;
      var newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentAudioIndex(0);
      var viewing = (_outputHistory$newInd2 = outputHistory[newIndex]) === null || _outputHistory$newInd2 === void 0 || (_outputHistory$newInd2 = _outputHistory$newInd2.result) === null || _outputHistory$newInd2 === void 0 || (_outputHistory$newInd2 = _outputHistory$newInd2.outputs) === null || _outputHistory$newInd2 === void 0 || (_outputHistory$newInd2 = _outputHistory$newInd2[0]) === null || _outputHistory$newInd2 === void 0 ? void 0 : _outputHistory$newInd2.value;
      setNodes(function (nds) {
        return nds.map(function (n) {
          if (n.id === id) {
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                viewingOutput: viewing
              })
            });
          }
          return n;
        });
      });
    }
  };
  var handleDeleteHistory = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
      var currentHistory, _data$onDataChange3, newHistory, _error$response2, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            e.stopPropagation();
            currentHistory = outputHistory[currentHistoryIndex];
            if (!(!currentHistory || !currentHistory.node_run_id)) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            if (!window.confirm("Are you sure you want to delete this history entry?")) {
              _context2.n = 5;
              break;
            }
            _context2.p = 2;
            _context2.n = 3;
            return _axios["default"]["delete"]("/api/workflow/node-run/".concat(currentHistory.node_run_id));
          case 3:
            newHistory = outputHistory.filter(function (_, i) {
              return i !== currentHistoryIndex;
            });
            data === null || data === void 0 || (_data$onDataChange3 = data.onDataChange) === null || _data$onDataChange3 === void 0 || _data$onDataChange3.call(data, id, _objectSpread({
              outputHistory: newHistory
            }, newHistory.length === 0 ? {
              outputs: [],
              resultUrl: null
            } : {}));
            if (newHistory.length === 0) {
              setCurrentHistoryIndex(-1);
            } else {
              setCurrentHistoryIndex(Math.max(0, currentHistoryIndex - 1));
            }
            _reactHotToast.toast.success("History entry deleted");
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
            _reactHotToast.toast.error(((_error$response2 = _t2.response) === null || _error$response2 === void 0 || (_error$response2 = _error$response2.data) === null || _error$response2 === void 0 ? void 0 : _error$response2.detail) || "Failed to delete history entry");
            console.error(_t2);
          case 5:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4]]);
    }));
    return function handleDeleteHistory(_x) {
      return _ref10.apply(this, arguments);
    };
  }();
  (0, _react.useEffect)(function () {
    var connectedInputs = {};
    inputHandles.forEach(function (h) {
      connectedInputs[h] = edges.some(function (e) {
        return e.target === id && e.targetHandle === h;
      });
    });
    var connectedOutputs = {};
    outputHandles.forEach(function (h) {
      connectedOutputs[h] = edges.some(function (e) {
        return e.source === id && e.sourceHandle === h;
      });
    });
    setConnectedInputs(connectedInputs);
    setConnectedOutputs(connectedOutputs);
  }, [edges, id]);
  var currentOutputList = currentHistoryIndex !== -1 && outputHistory[currentHistoryIndex] ? ((_outputHistory$curren = outputHistory[currentHistoryIndex]) === null || _outputHistory$curren === void 0 || (_outputHistory$curren = _outputHistory$curren.result) === null || _outputHistory$curren === void 0 ? void 0 : _outputHistory$curren.outputs) || [] : data.outputs || [];
  var currentOutput = currentOutputList.length > 0 ? ((_currentOutputList$cu = currentOutputList[currentAudioIndex]) === null || _currentOutputList$cu === void 0 ? void 0 : _currentOutputList$cu.value) || ((_currentOutputList$ = currentOutputList[0]) === null || _currentOutputList$ === void 0 ? void 0 : _currentOutputList$.value) || data.resultUrl : data.resultUrl;
  return /*#__PURE__*/_react["default"].createElement("div", {
    style: {
      minHeight: 220,
      '--loader-color': '#eab308'
    },
    className: "\n        nowheel group flex flex-col flex-1 w-80 \n        rounded-2xl border-2 relative transition-all duration-300 ease-in-out \n        ".concat(selected ? "border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.3)] scale-[1.02] ring-1 ring-yellow-500/20" : "border-zinc-800 hover:border-zinc-700 shadow-lg", " \n        bg-[#0c0d0f]/95 backdrop-blur-sm\n      ")
  }, data.isLoading && /*#__PURE__*/_react["default"].createElement("div", {
    className: "loader-border"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 absolute -top-5 left-0"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-zinc-400 text-[10px] font-medium tracking-wider uppercase"
  }, "Audio ", id.replace(/^\D+/g, "")), generationCost !== null && !(selectedModel !== null && selectedModel !== void 0 && selectedModel.id.includes("passthrough")) && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-yellow-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80"
  }, isRefreshingCost ? /*#__PURE__*/_react["default"].createElement("span", {
    className: "flex items-center gap-1 italic text-yellow-200"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-2 h-2 border-[1.5px] border-yellow-200/30 border-t-yellow-400 rounded-full animate-spin"
  })) : /*#__PURE__*/_react["default"].createElement("span", null, generationCost === 0 ? 'Free' : "$".concat(generationCost)))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-1.5 rounded-lg ".concat(selected ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400", " transition-colors")
  }, /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineAudio, {
    size: 14
  })), /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-xs font-bold text-zinc-100"
  }, selectedModel.name)), outputHistory.length > 0 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute -top-10 right-0 bg-[#0c0d0f]/95 flex items-center gap-1 p-1 border border-white/10 rounded-full ml-auto"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handlePrev,
    disabled: currentHistoryIndex <= 0,
    className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors",
    title: "Previous"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, {
    size: 10
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-1.5 px-0.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] font-medium text-white/90 tabular-nums tracking-wide"
  }, currentHistoryIndex + 1, "/", outputHistory.length), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-[1px] h-2.5 bg-white/10"
  }), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleDeleteHistory,
    className: "p-1 hover:bg-red-500/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center",
    title: "Delete history"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoTrashOutline, {
    size: 10
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-[1px] h-2.5 bg-white/10"
  }), /*#__PURE__*/_react["default"].createElement(_NodeSendButton["default"], {
    id: id,
    data: data,
    outputHistory: outputHistory,
    currentHistoryIndex: currentHistoryIndex,
    currentOutputIndex: currentAudioIndex
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleNext,
    disabled: currentHistoryIndex >= outputHistory.length - 1,
    className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors",
    title: "Next"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
    size: 10
  }))), /*#__PURE__*/_react["default"].createElement(_NodeOptionsMenu["default"], {
    nodeId: id,
    onDuplicate: data.duplicateNode,
    onDelete: handleDeleteNode,
    downloadUrl: currentOutput
  }))), ((_data$selectedModel6 = data.selectedModel) === null || _data$selectedModel6 === void 0 ? void 0 : _data$selectedModel6.id) === "audio-passthrough" ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full h-full flex-1"
  }, /*#__PURE__*/_react["default"].createElement(_UploadNode["default"], {
    id: id,
    data: data,
    formValues: formValues,
    setFormValues: setFormValues,
    selectedModel: selectedModel,
    loading: loading,
    uploadType: "upload",
    acceptType: "audio"
  })) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center flex-grow justify-center w-full h-full rounded transition-all duration-500"
  }, data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1] bg-white/5 animate-pulse rounded-b-2xl"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center gap-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] font-bold text-yellow-500 tracking-wider uppercase"
  }, "Generating..."))) : data.errorMsg ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 m-3 w-full"
  }, data.errorMsg || "Generation failed") : currentOutput && !data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full h-full relative group/audio flex flex-col items-center justify-center"
  }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
    src: currentOutput,
    nodeId: id,
    className: "flex flex-col items-center justify-center px-5 py-4 w-full h-full relative group transition-all duration-500 select-none bg-black/10 rounded-b-2xl"
  }), currentOutputList.length > 1 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 z-10 shadow-xl"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setCurrentAudioIndex(function (prev) {
        return prev > 0 ? prev - 1 : currentOutputList.length - 1;
      });
    },
    className: "w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, {
    size: 12
  })), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] font-medium text-white/90 tabular-nums"
  }, currentAudioIndex + 1, "/", currentOutputList.length), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setCurrentAudioIndex(function (prev) {
        return prev < currentOutputList.length - 1 ? prev + 1 : 0;
      });
    },
    className: "w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
    size: 12
  })))) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center text-zinc-400 gap-2"
  }, /*#__PURE__*/_react["default"].createElement(_ai.AiOutlineAudio, {
    size: 32
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] italic"
  }, "Result appeared here..."))), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "audioInput",
    style: {
      top: 70,
      opacity: hasAudioUrl ? 1 : 0,
      pointerEvents: hasAudioUrl ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.audioInput ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm', "\n        "),
    "data-type": "yellow"
  }), hasAudioUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -left-7 top-[70px] text-xs text-yellow-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "yellow" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Audio"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "audioInput2",
    style: {
      top: 100,
      opacity: hasPrompt ? 1 : 0,
      pointerEvents: hasPrompt ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.audioInput2 ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm', "\n        "),
    "data-type": "blue"
  }), hasPrompt && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -left-8 top-[100px] text-xs text-blue-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "blue" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Text"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "audioInput3",
    style: {
      top: 130,
      opacity: hasImageUrl ? 1 : 0,
      pointerEvents: hasImageUrl ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.audioInput3 ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm', "\n        "),
    "data-type": "green"
  }), hasImageUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -left-10 top-[130px] text-xs text-green-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "green" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Image"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "audioInput4",
    style: {
      top: 160,
      opacity: hasVideoUrl ? 1 : 0,
      pointerEvents: hasVideoUrl ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.audioInput4 ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm', "\n        "),
    "data-type": "orange"
  }), hasVideoUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -left-10 top-[160px] text-xs text-orange-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Video"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "audioOutput",
    style: {
      top: 100,
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !right-[-8px] transition-all\n          ".concat(connectedOutputs.audioOutput ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm', "\n        "),
    "data-type": "yellow"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -right-10 top-[100px] text-xs text-yellow-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "yellow" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Audio"));
};
var _default = exports["default"] = AudioGeneration;