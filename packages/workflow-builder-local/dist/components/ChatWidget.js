"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _io = require("react-icons/io");
var _bs = require("react-icons/bs");
var _reactMarkdown = _interopRequireDefault(require("react-markdown"));
var _remarkGfm = _interopRequireDefault(require("remark-gfm"));
var _fa = require("react-icons/fa6");
var _fi = require("react-icons/fi");
var _excluded = ["node"],
  _excluded2 = ["node"],
  _excluded3 = ["node"],
  _excluded4 = ["node"],
  _excluded5 = ["node"],
  _excluded6 = ["node"],
  _excluded7 = ["node"],
  _excluded8 = ["node"],
  _excluded9 = ["node"],
  _excluded0 = ["node"],
  _excluded1 = ["node", "inline", "className", "children"],
  _excluded10 = ["node"],
  _excluded11 = ["node"],
  _excluded12 = ["node"],
  _excluded13 = ["node"],
  _excluded14 = ["node"];
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var preprocessContent = function preprocessContent(content) {
  if (!content) return "";
  var lines = content.split("\n");
  var processedLines = [];
  var inTable = false;
  var tableRows = [];
  var isTableLine = function isTableLine(line) {
    var trimmed = line.trim();
    if (trimmed.startsWith("+")) return true;
    var pipes = (trimmed.match(/\|/g) || []).length;
    return pipes >= 2;
  };
  var isBorder = function isBorder(line) {
    return /^[\s]*\+[-+]+\+[\s]*$/.test(line);
  };
  var normalizeTableLine = function normalizeTableLine(line) {
    var trimmed = line.trim();
    if (trimmed.startsWith("+")) return null; // Ignore decorative borders
    var row = trimmed;
    if (!row.startsWith("|")) row = "| " + row;
    if (!row.endsWith("|")) row = row + " |";
    return row;
  };
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (isTableLine(line)) {
      inTable = true;
      var normalized = normalizeTableLine(line);
      if (normalized) tableRows.push(normalized);
    } else {
      if (inTable) {
        if (tableRows.length > 0) {
          processedLines.push(tableRows[0]);
          var columnCount = (tableRows[0].match(/\|/g) || []).length - 1;
          if (columnCount > 0) {
            processedLines.push("|" + "---|".repeat(columnCount));
          }
          for (var j = 1; j < tableRows.length; j++) {
            processedLines.push(tableRows[j]);
          }
        }
        tableRows = [];
        inTable = false;
      }
      processedLines.push(line);
    }
  }
  if (inTable && tableRows.length > 0) {
    processedLines.push(tableRows[0]);
    var _columnCount = (tableRows[0].match(/\|/g) || []).length - 1;
    if (_columnCount > 0) {
      processedLines.push("|" + "---|".repeat(_columnCount));
    }
    for (var _j = 1; _j < tableRows.length; _j++) {
      processedLines.push(tableRows[_j]);
    }
  }
  var processed = processedLines.join("\n");

  // Smart Code Block Detection: Detect loose code across multiple languages
  var codePatterns = [/^const\s+\w+\s+=/m, /^let\s+\w+\s+=/m, /^var\s+\w+\s+=/m, /^function\s+\w+\s*\(/m, /^class\s+\w+/m, /^def\s+\w+\s*\(/m, /^import\s+.*\s+from/m, /^import\s+[\'\"]\w+/m, /^fetch\s*\(/m, /JSON\.(parse|stringify)\(/g, /\w+\.then\(/g, /\w+\.forEach\(/g, /\w+\.map\(/g, /^if\s*\(.*\)\s*\{/m, /^while\s*\(.*\)\s*\{/m, /^for\s*\(.*\)\s*\{/m, /^for\s+.*\s+in\s+.*:/m, /^if\s+.*:/m, /^async\s+function/m, /^await\s+\w+/m, /^#\s+.*/gm, /^\s*\/\/.*/gm, /^return\s+/m, /^print\s*\(/m, /console\.(log|error|warn|info)\(/g, /assert\s+/g, /[{(:\[,]$/,
  // Lines ending in structural chars
  /^[ \t]*[})\]]/ // Lines starting with closing brackets
  ];
  if (!processed.includes("```")) {
    var _lines = processed.split("\n");
    var isInsideCode = false;
    var newProcessedLines = [];
    var currentLang = "javascript";

    // Patterns that strongly indicate a state change at line start
    var openPatterns = [/^const\s+/, /^let\s+/, /^var\s+/, /^function\s+/, /^class\s+/, /^def\s+/, /^import\s+/, /^async\s+/, /^for\s+/, /^while\s+/, /^if\s+/, /^\/\//, /^#/];
    var _loop = function _loop() {
      var line = _lines[_i];
      var trimmed = line.trim();
      var isMarkdownTable = trimmed.startsWith("|");
      var isMarkdownList = /^[ \t]*([-*+]|\d+\.)[ \t]+/.test(line);
      var hasPattern = codePatterns.some(function (pattern) {
        return pattern.test(line);
      });
      var hasOpenPattern = openPatterns.some(function (p) {
        return p.test(line);
      });
      if (!isInsideCode) {
        // Only open if it looks like code AND isn't markdown
        if (hasOpenPattern && !isMarkdownTable && !isMarkdownList) {
          if (line.includes("def ") || line.includes("elif ") || line.startsWith("#")) currentLang = "python";else currentLang = "javascript";
          newProcessedLines.push("```" + currentLang);
          isInsideCode = true;
        }
      } else {
        // Inside code: look ahead to see if we should close
        var nextLines = _lines.slice(_i + 1, _i + 3);
        var nextIsCode = nextLines.some(function (nl) {
          var t = nl.trim();
          return t !== "" && !t.startsWith("|") && !/^[ \t]*([-*+]|\d+\.)[ \t]+/.test(nl) && codePatterns.some(function (p) {
            return p.test(nl);
          });
        });
        var currentIsCodeOrEmpty = trimmed === "" || hasPattern && !isMarkdownTable && !isMarkdownList || /^[ \t]+/.test(line);
        if (!currentIsCodeOrEmpty && !nextIsCode) {
          newProcessedLines.push("```");
          isInsideCode = false;
          currentLang = "javascript";
        }
      }
      newProcessedLines.push(line);
    };
    for (var _i = 0; _i < _lines.length; _i++) {
      _loop();
    }
    if (isInsideCode) newProcessedLines.push("```");
    processed = newProcessedLines.join("\n");
  }

  // Existing title and list bolding logic
  processed = processed.replace(/^([A-Z][A-Za-z0-9\s\(\)\/-]+)(?=\n)/gm, function (match) {
    if (match.length < 50 && !match.startsWith("-") && !match.startsWith("#") && !match.startsWith("|")) {
      return "### ".concat(match);
    }
    return match;
  });
  processed = processed.replace(/^- ([^:\n]+):/gm, "- **$1**:");
  return processed;
};
var CodeBlock = function CodeBlock(_ref) {
  var language = _ref.language,
    value = _ref.value;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    copied = _useState2[0],
    setCopied = _useState2[1];
  var handleCopy = function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(function () {
      return setCopied(false);
    }, 2000);
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "my-4 rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl group/code"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] uppercase tracking-widest font-bold text-gray-400"
  }, language || "code"), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleCopy,
    className: "flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-white transition-colors"
  }, copied ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_io.IoMdCheckmark, {
    size: 12,
    className: "text-emerald-400"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-emerald-400 uppercase tracking-wider"
  }, "Copied!")) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_fa.FaRegCopy, {
    size: 12
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "uppercase tracking-wider"
  }, "Copy")))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-4 overflow-x-auto custom-scrollbar"
  }, /*#__PURE__*/_react["default"].createElement("code", {
    className: "text-[13px] font-mono text-gray-200 leading-relaxed block whitespace-pre"
  }, value)));
};
var DEFAULT_SUGGESTIONS = ["Create a workflow that generates an image and then a video from it.", "Help me build a YouTube Shorts automation pipeline.", "Add a text-to-speech node to my current workflow.", "Can you create a multi-model image generation grid?"];
var ChatWidget = function ChatWidget(_ref2) {
  var isOpen = _ref2.isOpen,
    toggleChat = _ref2.toggleChat,
    messages = _ref2.messages,
    onSendMessage = _ref2.onSendMessage,
    isLoading = _ref2.isLoading,
    onClearHistory = _ref2.onClearHistory;
  var _useState3 = (0, _react.useState)(""),
    _useState4 = _slicedToArray(_useState3, 2),
    inputValue = _useState4[0],
    setInputValue = _useState4[1];
  var _useState5 = (0, _react.useState)(0),
    _useState6 = _slicedToArray(_useState5, 2),
    loadingStep = _useState6[0],
    setLoadingStep = _useState6[1];
  var _useState7 = (0, _react.useState)(null),
    _useState8 = _slicedToArray(_useState7, 2),
    copiedId = _useState8[0],
    setCopiedId = _useState8[1];
  var _useState9 = (0, _react.useState)(false),
    _useState0 = _slicedToArray(_useState9, 2),
    isWide = _useState0[0],
    setIsWide = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    isMounted = _useState10[0],
    setIsMounted = _useState10[1];
  var loadingTexts = ["Thinking", "Analyzing", "Generating", "Refining", "Processing", "Running"];
  var messagesEndRef = (0, _react.useRef)(null);
  var inputRef = (0, _react.useRef)(null);
  var widgetRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var interval;
    if (isLoading) {
      interval = setInterval(function () {
        setLoadingStep(function (prev) {
          return (prev + 1) % loadingTexts.length;
        });
      }, 5000);
    } else {
      setLoadingStep(0);
    }
    return function () {
      return clearInterval(interval);
    };
  }, [isLoading]);
  (0, _react.useEffect)(function () {
    setIsMounted(true);
  }, []);
  var scrollToBottom = function scrollToBottom() {
    var _messagesEndRef$curre;
    (_messagesEndRef$curre = messagesEndRef.current) === null || _messagesEndRef$curre === void 0 || _messagesEndRef$curre.scrollIntoView({
      behavior: "smooth"
    });
  };
  (0, _react.useEffect)(function () {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);
  (0, _react.useEffect)(function () {
    var handleClickOutside = function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        if (isOpen) {
          toggleChat();
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
    }
    return function () {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen, toggleChat]);
  var handleSubmit = function handleSubmit(e) {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };
  var formatMessageDate = function formatMessageDate(isoString) {
    if (!isoString) return "";
    var date = new Date(isoString);
    var now = new Date();
    var diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });
  };
  var formatMessageTime = function formatMessageTime(isoString) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  var handleCopy = function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(function () {
      return setCopiedId(null);
    }, 2000);
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    ref: widgetRef,
    className: "fixed bottom-10 right-10 z-50 flex flex-col items-end gap-2 font-sans"
  }, isOpen && /*#__PURE__*/_react["default"].createElement("div", {
    className: "".concat(isWide ? 'w-[800px]' : 'w-[380px]', " max-w-[100vw] h-[600px] max-h-[100%] flex flex-col bg-[#0B0F17]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in text-left")
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-2 bg-blue-600 rounded-lg shadow-lg"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaRobot, {
    className: "text-white text-lg"
  })), /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "font-semibold text-white"
  }, "AI Assistant"), /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-xs text-gray-400 flex items-center gap-1"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
  }), "Online"))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick() {
      return setIsWide(!isWide);
    },
    title: isWide ? "Narrow View" : "Wide View",
    className: "hidden md:flex p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-white/5"
  }, isWide ? /*#__PURE__*/_react["default"].createElement(_fi.FiMinimize2, {
    size: 18
  }) : /*#__PURE__*/_react["default"].createElement(_fi.FiMaximize2, {
    size: 18
  })), messages.length > 0 && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: onClearHistory,
    title: "Clear Chat History",
    className: "p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoMdTrash, {
    size: 20
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: toggleChat,
    className: "p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoMdClose, {
    size: 20
  })))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col flex-1 h-full overflow-y-auto p-4 space-y-6 custom-scrollbar"
  }, messages.length === 0 ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center gap-6 text-center p-6 h-full"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center gap-2 text-gray-500"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaRobot, {
    className: "text-3xl text-blue-400 opacity-80"
  })), /*#__PURE__*/_react["default"].createElement("h4", {
    className: "text-lg font-semibold text-white mt-2"
  }, "Welcome!"), /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-sm max-w-[250px]"
  }, "How can I help you today? Choose a suggestion below or type your own.")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "grid ".concat(isWide ? "grid-cols-2" : "grid-cols-1", " gap-2 w-full")
  }, DEFAULT_SUGGESTIONS.map(function (suggestion, sIdx) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      key: sIdx,
      onClick: function onClick() {
        return onSendMessage(suggestion);
      },
      className: "px-4 py-3 text-xs font-medium bg-white/5 text-gray-300 rounded-xl hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/50 transition-all text-left border border-white/10 shadow-sm cursor-pointer flex items-center gap-3 group"
    }, /*#__PURE__*/_react["default"].createElement(_bs.BsStars, {
      size: 12,
      className: "text-blue-400/50 group-hover:text-blue-400 transition-colors"
    }), suggestion);
  }))) : messages.map(function (msg, idx) {
    var showDateLabel = idx === 0 || formatMessageDate(messages[idx - 1].timestamp) !== formatMessageDate(msg.timestamp);
    return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, {
      key: idx
    }, showDateLabel && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex justify-center my-2"
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "px-3 py-1 bg-white/5 text-[10px] uppercase font-bold text-gray-500 rounded-full border border-white/10"
    }, isMounted ? formatMessageDate(msg.timestamp) : "---")), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col ".concat(msg.role === "user" ? "items-end" : "items-start")
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col gap-4 max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ".concat(msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1A1F2B] text-gray-200 rounded-bl-none border border-white/5")
    }, /*#__PURE__*/_react["default"].createElement(_reactMarkdown["default"], {
      remarkPlugins: [_remarkGfm["default"]],
      components: {
        h1: function h1(_ref3) {
          var node = _ref3.node,
            props = _objectWithoutProperties(_ref3, _excluded);
          return /*#__PURE__*/_react["default"].createElement("h1", _extends({
            className: "text-xl font-bold text-white"
          }, props));
        },
        h2: function h2(_ref4) {
          var node = _ref4.node,
            props = _objectWithoutProperties(_ref4, _excluded2);
          return /*#__PURE__*/_react["default"].createElement("h2", _extends({
            className: "text-lg font-bold text-white"
          }, props));
        },
        h3: function h3(_ref5) {
          var node = _ref5.node,
            props = _objectWithoutProperties(_ref5, _excluded3);
          return /*#__PURE__*/_react["default"].createElement("h3", _extends({
            className: "text-base font-bold text-blue-400"
          }, props));
        },
        p: function p(_ref6) {
          var node = _ref6.node,
            props = _objectWithoutProperties(_ref6, _excluded4);
          return /*#__PURE__*/_react["default"].createElement("div", _extends({
            className: "leading-relaxed text-gray-300 whitespace-pre-wrap"
          }, props));
        },
        ul: function ul(_ref7) {
          var node = _ref7.node,
            props = _objectWithoutProperties(_ref7, _excluded5);
          return /*#__PURE__*/_react["default"].createElement("ul", _extends({
            className: "list-disc pl-5 space-y-1.5 text-gray-300"
          }, props));
        },
        ol: function ol(_ref8) {
          var node = _ref8.node,
            props = _objectWithoutProperties(_ref8, _excluded6);
          return /*#__PURE__*/_react["default"].createElement("ol", _extends({
            className: "list-decimal pl-5 space-y-1.5 text-gray-300"
          }, props));
        },
        li: function li(_ref9) {
          var node = _ref9.node,
            props = _objectWithoutProperties(_ref9, _excluded7);
          return /*#__PURE__*/_react["default"].createElement("li", _extends({
            className: "pl-1"
          }, props));
        },
        strong: function strong(_ref0) {
          var node = _ref0.node,
            props = _objectWithoutProperties(_ref0, _excluded8);
          return /*#__PURE__*/_react["default"].createElement("strong", _extends({
            className: "font-extrabold text-white"
          }, props));
        },
        em: function em(_ref1) {
          var node = _ref1.node,
            props = _objectWithoutProperties(_ref1, _excluded9);
          return /*#__PURE__*/_react["default"].createElement("em", _extends({
            className: "italic text-gray-400"
          }, props));
        },
        a: function a(_ref10) {
          var node = _ref10.node,
            props = _objectWithoutProperties(_ref10, _excluded0);
          return /*#__PURE__*/_react["default"].createElement("a", _extends({
            className: "text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 break-all transition-colors",
            target: "_blank",
            rel: "noopener noreferrer"
          }, props));
        },
        code: function code(_ref11) {
          var node = _ref11.node,
            inline = _ref11.inline,
            className = _ref11.className,
            children = _ref11.children,
            props = _objectWithoutProperties(_ref11, _excluded1);
          var match = /language-(\w+)/.exec(className || "");
          var lang = match ? match[1] : "";
          return inline ? /*#__PURE__*/_react["default"].createElement("code", _extends({
            className: "bg-white/10 rounded-md px-1.5 py-0.5 text-[13px] font-mono text-pink-400"
          }, props), children) : /*#__PURE__*/_react["default"].createElement(CodeBlock, {
            language: lang,
            value: String(children).replace(/\n$/, "")
          });
        },
        blockquote: function blockquote(_ref12) {
          var node = _ref12.node,
            props = _objectWithoutProperties(_ref12, _excluded10);
          return /*#__PURE__*/_react["default"].createElement("blockquote", _extends({
            className: "border-l-4 border-purple-500/50 pl-4 py-1 italic text-gray-500 bg-white/5 rounded-r-lg"
          }, props));
        },
        table: function table(_ref13) {
          var node = _ref13.node,
            props = _objectWithoutProperties(_ref13, _excluded11);
          return /*#__PURE__*/_react["default"].createElement("div", {
            className: "my-4 overflow-hidden border border-white/10 rounded-2xl shadow-xl bg-black/20 backdrop-blur-sm"
          }, /*#__PURE__*/_react["default"].createElement("div", {
            className: "overflow-x-auto custom-scrollbar"
          }, /*#__PURE__*/_react["default"].createElement("table", _extends({
            className: "min-w-full divide-y divide-white/10 border-collapse"
          }, props))));
        },
        th: function th(_ref14) {
          var node = _ref14.node,
            props = _objectWithoutProperties(_ref14, _excluded12);
          return /*#__PURE__*/_react["default"].createElement("th", _extends({
            className: "px-4 py-3 bg-gradient-to-b from-white/10 to-white/5 text-left text-[11px] font-bold uppercase tracking-wider text-blue-400 border-b border-white/10"
          }, props));
        },
        td: function td(_ref15) {
          var node = _ref15.node,
            props = _objectWithoutProperties(_ref15, _excluded13);
          return /*#__PURE__*/_react["default"].createElement("td", _extends({
            className: "px-4 py-2.5 text-[13px] text-gray-300 border-b border-white/5 transition-colors"
          }, props));
        },
        tr: function tr(_ref16) {
          var node = _ref16.node,
            props = _objectWithoutProperties(_ref16, _excluded14);
          return /*#__PURE__*/_react["default"].createElement("tr", _extends({
            className: "group transition-colors odd:bg-transparent even:bg-white-[0.02]"
          }, props));
        }
      }
    }, preprocessContent(msg.content) || ""), msg.suggestions && msg.suggestions.length > 0 && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col gap-2"
    }, /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-xs font-medium text-gray-400"
    }, "Suggested Actions:"), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-wrap gap-2 pt-2 border-t border-white/10"
    }, msg.suggestions.map(function (suggestion, sIdx) {
      return /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        key: sIdx,
        onClick: function onClick() {
          return onSendMessage(suggestion);
        },
        className: "px-3 py-1.5 text-xs font-medium bg-[#242936] text-gray-300 rounded-lg hover:bg-blue-600/20 hover:text-blue-400 transition-colors text-left border border-white/10 shadow-sm cursor-pointer"
      }, suggestion);
    })))), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 mt-1 px-1"
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px] text-gray-400"
    }, isMounted ? formatMessageTime(msg.timestamp) : "--:--"), /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      onClick: function onClick() {
        return handleCopy(msg.content, idx);
      },
      className: "text-gray-400 hover:text-blue-500 transition-colors cursor-pointer",
      title: "Copy Message"
    }, copiedId === idx ? /*#__PURE__*/_react["default"].createElement(_io.IoMdCheckmark, {
      size: 12,
      className: "text-green-500"
    }) : /*#__PURE__*/_react["default"].createElement(_fa.FaRegCopy, {
      size: 12
    })))));
  }), isLoading && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex justify-start animate-in fade-in slide-in-from-left-2 duration-300"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "bg-[#1A1F2B]/80 backdrop-blur-sm p-3.5 rounded-2xl rounded-bl-none border border-white/5 shadow-sm flex items-center gap-2 min-w-[70px]"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
  })), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] font-medium text-gray-500 tracking-widest ml-1"
  }, loadingTexts[loadingStep], "...")))), /*#__PURE__*/_react["default"].createElement("div", {
    ref: messagesEndRef
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-4 bg-white/5 border-t border-white/10"
  }, /*#__PURE__*/_react["default"].createElement("form", {
    onSubmit: handleSubmit,
    className: "flex items-center gap-2 bg-[#0B0F17] border border-white/10 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all"
  }, /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: inputRef,
    value: inputValue,
    onChange: function onChange(e) {
      return setInputValue(e.target.value);
    },
    onKeyDown: function onKeyDown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    placeholder: "Type a message...",
    rows: 1,
    autoFocus: true,
    className: "flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500 resize-none p-1 max-h-32 scrollbar-none border-none",
    style: {
      height: "auto"
    },
    onInput: function onInput(e) {
      e.target.style.height = "auto";
      e.target.style.height = "".concat(e.target.scrollHeight, "px");
    }
  }), /*#__PURE__*/_react["default"].createElement("button", {
    type: "submit",
    suppressHydrationWarning: true,
    disabled: !inputValue.trim(),
    className: "p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
  }, isLoading ? /*#__PURE__*/_react["default"].createElement(_fa.FaRegCirclePause, {
    size: 18
  }) : /*#__PURE__*/_react["default"].createElement(_io.IoMdSend, {
    size: 16
  }))))), !isOpen && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: toggleChat,
    className: "group relative right-6 md:right-0 flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-110 transition-all duration-300 ".concat(isLoading ? 'ring-2 ring-blue-200 ring-offset-2' : '')
  }, isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex gap-1 animate-pulse"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "w-1.5 h-1.5 bg-white rounded-full animate-bounce"
  })) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("span", {
    className: "absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"
  }), /*#__PURE__*/_react["default"].createElement(_fa.FaRobot, {
    className: "text-white text-2xl drop-shadow-md"
  }))));
};
var _default = exports["default"] = ChatWidget;