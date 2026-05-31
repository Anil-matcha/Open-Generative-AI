"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _io = require("react-icons/io5");
var _reactHotToast = require("react-hot-toast");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var VideoPlayer = function VideoPlayer(_ref) {
  var src = _ref.src,
    poster = _ref.poster,
    _ref$autoPlay = _ref.autoPlay,
    autoPlay = _ref$autoPlay === void 0 ? true : _ref$autoPlay,
    _ref$muted = _ref.muted,
    muted = _ref$muted === void 0 ? true : _ref$muted,
    _ref$loop = _ref.loop,
    loop = _ref$loop === void 0 ? true : _ref$loop,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? "w-full h-full object-contain" : _ref$className,
    _ref$accentColor = _ref.accentColor,
    accentColor = _ref$accentColor === void 0 ? "#f97316" : _ref$accentColor;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isPlaying = _useState2[0],
    setIsPlaying = _useState2[1];
  var _useState3 = (0, _react.useState)(0),
    _useState4 = _slicedToArray(_useState3, 2),
    currentTime = _useState4[0],
    setCurrentTime = _useState4[1];
  var _useState5 = (0, _react.useState)(0),
    _useState6 = _slicedToArray(_useState5, 2),
    duration = _useState6[0],
    setDuration = _useState6[1];
  var _useState7 = (0, _react.useState)(1),
    _useState8 = _slicedToArray(_useState7, 2),
    volume = _useState8[0],
    setVolume = _useState8[1];
  var _useState9 = (0, _react.useState)(muted),
    _useState0 = _slicedToArray(_useState9, 2),
    isMuted = _useState0[0],
    setIsMuted = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    isFullscreen = _useState10[0],
    setIsFullscreen = _useState10[1];
  var videoRef = (0, _react.useRef)(null);
  var containerRef = (0, _react.useRef)(null);
  var togglePlay = function togglePlay(e) {
    e === null || e === void 0 || e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };
  var toggleMute = function toggleMute(e) {
    e === null || e === void 0 || e.stopPropagation();
    setIsMuted(!isMuted);
  };
  var handleToggleFullscreen = function handleToggleFullscreen(e) {
    e === null || e === void 0 || e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()["catch"](function (err) {
        _reactHotToast.toast.error("Error attempting to enable full-screen mode: ".concat(err.message));
      });
    } else {
      document.exitFullscreen();
    }
  };
  (0, _react.useEffect)(function () {
    var handleFullscreenChange = function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return function () {
      return document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  var formatTime = function formatTime(seconds) {
    var min = Math.floor(seconds / 60);
    var sec = Math.floor(seconds % 60);
    return "".concat(min, ":").concat(sec.toString().padStart(2, '0'));
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    ref: containerRef,
    className: "relative group/video w-full h-full bg-black/90 overflow-hidden flex items-center justify-center ".concat(isFullscreen ? '' : 'rounded-b-2xl')
  }, /*#__PURE__*/_react["default"].createElement("video", {
    ref: videoRef,
    src: src,
    poster: poster,
    autoPlay: autoPlay,
    muted: isMuted,
    loop: loop,
    playsInline: true,
    onTimeUpdate: function onTimeUpdate() {
      var _videoRef$current;
      return setCurrentTime(((_videoRef$current = videoRef.current) === null || _videoRef$current === void 0 ? void 0 : _videoRef$current.currentTime) || 0);
    },
    onLoadedMetadata: function onLoadedMetadata() {
      var _videoRef$current2;
      return setDuration(((_videoRef$current2 = videoRef.current) === null || _videoRef$current2 === void 0 ? void 0 : _videoRef$current2.duration) || 0);
    },
    onPlay: function onPlay() {
      return setIsPlaying(true);
    },
    onPause: function onPause() {
      return setIsPlaying(false);
    },
    onClick: togglePlay,
    className: "".concat(className, " cursor-pointer")
  }), !isPlaying && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute inset-0 flex items-center justify-center pointer-events-none group-hover/video:opacity-100 transition-opacity duration-300",
    onClick: togglePlay
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-16 h-16 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl transform group-hover/video:scale-110 transition-transform pointer-events-auto cursor-pointer"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoPlay, {
    size: 32,
    className: "ml-1"
  }))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 rounded-b-xl flex flex-col gap-2 z-20"
  }, /*#__PURE__*/_react["default"].createElement("input", {
    type: "range",
    min: "0",
    max: duration || 0,
    value: currentTime,
    step: "0.01",
    onChange: function onChange(e) {
      var time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    },
    className: "w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all seek-bar",
    style: {
      background: "linear-gradient(to right, ".concat(accentColor, " 0%, ").concat(accentColor, " ").concat(currentTime / (duration || 1) * 100, "%, rgba(255, 255, 255, 0.2) ").concat(currentTime / (duration || 1) * 100, "%, rgba(255, 255, 255, 0.2) 100%)")
    }
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: togglePlay,
    className: "text-white/90 hover:text-white transition-colors"
  }, isPlaying ? /*#__PURE__*/_react["default"].createElement(_io.IoPause, {
    size: 18
  }) : /*#__PURE__*/_react["default"].createElement(_io.IoPlay, {
    size: 18
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 group/volume"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: toggleMute,
    className: "text-white/90 hover:text-white transition-colors"
  }, isMuted ? /*#__PURE__*/_react["default"].createElement(_io.IoVolumeMute, {
    size: 18
  }) : /*#__PURE__*/_react["default"].createElement(_io.IoVolumeHigh, {
    size: 18
  })), /*#__PURE__*/_react["default"].createElement("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.1",
    value: isMuted ? 0 : volume,
    onChange: function onChange(e) {
      var val = parseFloat(e.target.value);
      setVolume(val);
      videoRef.current.volume = val;
      if (val > 0) setIsMuted(false);
    },
    className: "w-0 group-hover/volume:w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white transition-all overflow-hidden"
  })), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-white/70 font-medium tabular-nums"
  }, formatTime(currentTime), " / ", formatTime(duration))), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleToggleFullscreen,
    className: "text-white/90 hover:text-white transition-colors"
  }, isFullscreen ? /*#__PURE__*/_react["default"].createElement(_io.IoContract, {
    size: 18
  }) : /*#__PURE__*/_react["default"].createElement(_io.IoExpand, {
    size: 18
  })))));
};
var _default = exports["default"] = VideoPlayer;