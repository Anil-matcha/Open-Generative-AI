"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactflow = require("reactflow");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var NodeSendButton = function NodeSendButton(_ref) {
  var id = _ref.id,
    data = _ref.data,
    outputHistory = _ref.outputHistory,
    currentHistoryIndex = _ref.currentHistoryIndex,
    _ref$currentOutputInd = _ref.currentOutputIndex,
    currentOutputIndex = _ref$currentOutputInd === void 0 ? 0 : _ref$currentOutputInd;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    showMenu = _useState2[0],
    setShowMenu = _useState2[1];
  var connectedEdges = data.connectedEdges || [];
  if (connectedEdges.length === 0) return null;
  var handleSend = function handleSend(targetId) {
    var _latest$result;
    var latest = outputHistory[currentHistoryIndex];
    var outputs = latest === null || latest === void 0 || (_latest$result = latest.result) === null || _latest$result === void 0 ? void 0 : _latest$result.outputs;
    if (outputs) {
      var _outputs$currentOutpu, _outputs$;
      var specificOutput = ((_outputs$currentOutpu = outputs[currentOutputIndex]) === null || _outputs$currentOutpu === void 0 ? void 0 : _outputs$currentOutpu.value) || ((_outputs$ = outputs[0]) === null || _outputs$ === void 0 ? void 0 : _outputs$.value);
      data.onDataChange(id, {
        outputs: outputs,
        resultUrl: specificOutput
      }, targetId);
    }
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      if (connectedEdges.length === 1) {
        handleSend(connectedEdges[0].target);
      } else {
        setShowMenu(!showMenu);
      }
    },
    className: "group/btn relative flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 bg-blue-600 hover:bg-blue-500 text-white shadow-lg",
    title: "Send to Connected Node"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-1.5 h-1.5 rounded-full bg-current"
  })), showMenu && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 min-w-max"
  }, function () {
    var targetCounts = connectedEdges.reduce(function (acc, edge) {
      acc[edge.target] = (acc[edge.target] || 0) + 1;
      return acc;
    }, {});
    return connectedEdges.map(function (edge) {
      return /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        key: edge.id,
        className: "w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors truncate capitalize cursor-pointer block",
        onClick: function onClick(e) {
          e.stopPropagation();
          handleSend(edge.target);
          setShowMenu(false);
        }
      }, "Send to ", edge.target, " ", targetCounts[edge.target] > 1 ? "(".concat(edge.targetHandle, ")") : "");
    });
  }()), showMenu && /*#__PURE__*/_react["default"].createElement("div", {
    className: "fixed inset-0 z-40",
    onClick: function onClick(e) {
      e.stopPropagation();
      setShowMenu(false);
    }
  }));
};
var _default = exports["default"] = NodeSendButton;