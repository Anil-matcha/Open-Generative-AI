"use strict";

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
var _utility = require("./utility");
var _tb = require("react-icons/tb");
var _NodeOptionsMenu = _interopRequireDefault(require("./NodeOptionsMenu"));
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
var inputHandles = ["concatInput"];
var outputHandles = ["concatOutput"];
var PromptConcate = function PromptConcate(_ref) {
  var _data$runId, _selectedModel$input_;
  var id = _ref.id,
    data = _ref.data,
    selected = _ref.selected;
  var _useState = (0, _react.useState)(_utility.concatModels[0]),
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
  var _useState7 = (0, _react.useState)({}),
    _useState8 = _slicedToArray(_useState7, 2),
    formValues = _useState8[0],
    setFormValues = _useState8[1];
  var _useState9 = (0, _react.useState)(0),
    _useState0 = _slicedToArray(_useState9, 2),
    dropDown = _useState0[0],
    setDropDown = _useState0[1];
  var workflowId = (0, _WorkflowStore.getWorkflowId)();
  var runId = (_data$runId = data.runId) !== null && _data$runId !== void 0 ? _data$runId : (0, _WorkflowStore.getRunId)();
  var nodeSchemas = data.nodeSchemas || {};
  var textareaRef = (0, _react.useRef)(null);
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    setNodes = _useReactFlow.setNodes,
    setEdges = _useReactFlow.setEdges;
  var updateNodeInternals = (0, _reactflow.useUpdateNodeInternals)();
  var edges = (0, _reactflow.useStore)(function (state) {
    return state.edges;
  });
  var properties = (selectedModel === null || selectedModel === void 0 || (_selectedModel$input_ = selectedModel.input_params) === null || _selectedModel$input_ === void 0 ? void 0 : _selectedModel$input_.properties) || {};
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
  (0, _react.useEffect)(function () {
    var defaults = _initializeFormData(properties);
    var validKeys = Object.keys(properties);
    var filteredFormValues = Object.entries(data.formValues || {}).reduce(function (acc, _ref4) {
      var _ref5 = _slicedToArray(_ref4, 2),
        key = _ref5[0],
        val = _ref5[1];
      if (validKeys !== null && validKeys !== void 0 && validKeys.includes(key)) acc[key] = val;
      return acc;
    }, {});
    var merged = Object.entries(_objectSpread(_objectSpread({}, defaults), filteredFormValues)).reduce(function (acc, _ref6) {
      var _meta$enum;
      var _ref7 = _slicedToArray(_ref6, 2),
        key = _ref7[0],
        val = _ref7[1];
      var meta = properties[key];
      if (meta !== null && meta !== void 0 && meta["enum"] && !((_meta$enum = meta["enum"]) !== null && _meta$enum !== void 0 && _meta$enum.includes(val))) {
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
  }, [selectedModel]);
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
    if (!(data !== null && data !== void 0 && data.onDataChange)) return;
    var currentData = {
      formValues: data.formValues
    };
    var newData = {
      formValues: formValues
    };
    if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
      data.onDataChange(id, newData);
    }
  }, [formValues]);
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
  var hasPrompt = properties && "prompt" in properties;
  (0, _react.useEffect)(function () {
    var timeout = setTimeout(function () {
      var validHandles = [hasPrompt && "concatInput"].filter(Boolean);
      setEdges(function (prevEdges) {
        return prevEdges.filter(function (edge) {
          if (edge.target !== id) return true;
          return validHandles === null || validHandles === void 0 ? void 0 : validHandles.includes(edge.targetHandle);
        });
      });
    }, 2000);
    return function () {
      return clearTimeout(timeout);
    };
  }, [hasPrompt, id, setEdges]);
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
  (0, _react.useEffect)(function () {
    var textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      var scrollHeight = textarea.scrollHeight;
      textarea.style.height = "".concat(Math.max(scrollHeight, 210), "px");
    }
  }, [formValues, selectedModel.name]);
  return /*#__PURE__*/_react["default"].createElement("div", {
    style: {
      minHeight: 280,
      '--loader-color': '#2563eb'
    },
    className: "\n        nowheel group flex flex-col flex-1 w-80 \n        rounded-2xl border-2 relative transition-all duration-300 ease-in-out \n        ".concat(selected ? "border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.02] ring-1 ring-blue-500/20" : "border-zinc-800 hover:border-zinc-700 shadow-lg", " \n        bg-[#0c0d0f]/95 backdrop-blur-sm\n      ")
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "absolute -top-5 left-0 text-zinc-400 text-[10px] font-medium tracking-wider uppercase"
  }, "Prompt Concatenator ", id.replace(/^\D+/g, "")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-1.5 rounded-lg ".concat(selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400", " transition-colors")
  }, /*#__PURE__*/_react["default"].createElement(_tb.TbArrowMerge, {
    size: 14,
    className: "rotate-90"
  })), /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-xs font-bold text-zinc-100"
  }, selectedModel.name)), /*#__PURE__*/_react["default"].createElement(_NodeOptionsMenu["default"], {
    nodeId: id,
    onDuplicate: data.duplicateNode,
    onDelete: handleDeleteNode
  }))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative flex flex-col gap-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 w-full h-full p-2"
  }, /*#__PURE__*/_react["default"].createElement("textarea", {
    type: "text",
    ref: textareaRef,
    readOnly: true,
    value: (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "",
    className: "w-full h-full max-h-96 text-xs leading-relaxed outline-none bg-transparent resize-none text-zinc-100 font-medium placeholder:italic placeholder:opacity-50"
  })), hasPrompt && /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "concatInput",
    style: {
      top: 100,
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-2 transition-all duration-200 !left-[-7px]\n              ".concat(connectedInputs.concatInput ? '!bg-blue-500 !border-white shadow-[0_0_20px_rgba(59,130,246,1)]' : '!bg-black !border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]', "\n              hover:!scale-125 hover:shadow-[0_0_20px_rgba(59,130,246,1)]\n            "),
    "data-type": "blue"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -left-7 top-[100px] text-xs text-blue-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "blue" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Text")), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "concatOutput",
    style: {
      top: 100,
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-2 transition-all duration-200 !right-[-7px]\n          ".concat(connectedOutputs.concatOutput ? '!bg-blue-500 !border-white shadow-[0_0_20px_rgba(59,130,246,1)]' : '!bg-black !border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]', "\n          hover:!scale-125 hover:shadow-[0_0_20px_rgba(59,130,246,1)]\n        "),
    "data-type": "blue"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute -right-7 top-[100px] text-xs text-blue-500 transition-opacity duration-200 ".concat(data.activeHandleColor === "blue" ? "opacity-100" : "opacity-0 group-hover:opacity-100")
  }, "Text"));
};
var _default = exports["default"] = PromptConcate;