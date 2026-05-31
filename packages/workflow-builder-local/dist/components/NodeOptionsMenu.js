"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _bs = require("react-icons/bs");
var _io = require("react-icons/io5");
var _md = require("react-icons/md");
var _hi = require("react-icons/hi");
var _utility = require("./utility");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var NodeOptionsMenu = function NodeOptionsMenu(_ref) {
  var nodeId = _ref.nodeId,
    onDuplicate = _ref.onDuplicate,
    onDelete = _ref.onDelete,
    downloadUrl = _ref.downloadUrl,
    onSetThumbnail = _ref.onSetThumbnail,
    showThumbnailOption = _ref.showThumbnailOption;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isOpen = _useState2[0],
    setIsOpen = _useState2[1];
  var menuRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var handleClickOutside = function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return function () {
      return document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen]);
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative",
    ref: menuRef
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    className: "p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all outline-none"
  }, /*#__PURE__*/_react["default"].createElement(_bs.BsThreeDots, {
    size: 18
  })), isOpen && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute right-0 mt-2 whitespace-nowrap bg-[#1b1e23]/95 backdrop-blur-xl border border-white/10 rounded-md shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      onDuplicate(nodeId);
      setIsOpen(false);
    },
    className: "w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoDuplicateOutline, {
    size: 14,
    className: "text-blue-400"
  }), /*#__PURE__*/_react["default"].createElement("span", null, "Duplicate")), downloadUrl && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      (0, _utility.downloadFile)(downloadUrl, "".concat(nodeId, "_output"));
      setIsOpen(false);
    },
    className: "w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
  }, /*#__PURE__*/_react["default"].createElement(_md.MdOutlineFileDownload, {
    size: 14,
    className: "text-emerald-400"
  }), /*#__PURE__*/_react["default"].createElement("span", null, "Download")), showThumbnailOption && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      if (onSetThumbnail) onSetThumbnail();
      setIsOpen(false);
    },
    className: "w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
  }, /*#__PURE__*/_react["default"].createElement(_hi.HiOutlinePhotograph, {
    size: 14,
    className: "text-purple-400"
  }), /*#__PURE__*/_react["default"].createElement("span", null, "Set Thumbnail")), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      onDelete();
      setIsOpen(false);
    },
    className: "w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoTrashOutline, {
    size: 14
  }), /*#__PURE__*/_react["default"].createElement("span", null, "Delete Node ", nodeId))));
};
var _default = exports["default"] = NodeOptionsMenu;