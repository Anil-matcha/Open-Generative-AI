"use client";

import React, { useState, useEffect, useRef } from "react";
import { IoMdClose, IoMdSend, IoMdTrash, IoMdCopy, IoMdCheckmark } from "react-icons/io";
import { BsStars } from "react-icons/bs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaRegCirclePause, FaRegCopy, FaRobot } from "react-icons/fa6";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

const preprocessContent = (content) => {
  if (!content) return "";

  let lines = content.split("\n");
  let processedLines = [];
  let inTable = false;
  let tableRows = [];

  const isTableLine = (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("+")) return true;
    const pipes = (trimmed.match(/\|/g) || []).length;
    return pipes >= 2;
  };

  const isBorder = (line) => /^[\s]*\+[-+]+\+[\s]*$/.test(line);

  const normalizeTableLine = (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("+")) return null; // Ignore decorative borders
    let row = trimmed;
    if (!row.startsWith("|")) row = "| " + row;
    if (!row.endsWith("|")) row = row + " |";
    return row;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableLine(line)) {
      inTable = true;
      const normalized = normalizeTableLine(line);
      if (normalized) tableRows.push(normalized);
    } else {
      if (inTable) {
        if (tableRows.length > 0) {
          processedLines.push(tableRows[0]);
          const columnCount = (tableRows[0].match(/\|/g) || []).length - 1;
          if (columnCount > 0) {
            processedLines.push("|" + "---|".repeat(columnCount));
          }
          for (let j = 1; j < tableRows.length; j++) {
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
    const columnCount = (tableRows[0].match(/\|/g) || []).length - 1;
    if (columnCount > 0) {
      processedLines.push("|" + "---|".repeat(columnCount));
    }
    for (let j = 1; j < tableRows.length; j++) {
      processedLines.push(tableRows[j]);
    }
  }

  let processed = processedLines.join("\n");

  // Smart Code Block Detection: Detect loose code across multiple languages
  const codePatterns = [
    /^const\s+\w+\s+=/m, /^let\s+\w+\s+=/m, /^var\s+\w+\s+=/m,
    /^function\s+\w+\s*\(/m, /^class\s+\w+/m, /^def\s+\w+\s*\(/m,
    /^import\s+.*\s+from/m, /^import\s+[\'\"]\w+/m, /^fetch\s*\(/m,
    /JSON\.(parse|stringify)\(/g, /\w+\.then\(/g, /\w+\.forEach\(/g,
    /\w+\.map\(/g, /^if\s*\(.*\)\s*\{/m, /^while\s*\(.*\)\s*\{/m,
    /^for\s*\(.*\)\s*\{/m, /^for\s+.*\s+in\s+.*:/m, /^if\s+.*:/m,
    /^async\s+function/m, /^await\s+\w+/m, /^#\s+.*/gm, /^\s*\/\/.*/gm,
    /^return\s+/m, /^print\s*\(/m, /console\.(log|error|warn|info)\(/g, /assert\s+/g,
    /[{(:\[,]$/, // Lines ending in structural chars
    /^[ \t]*[})\]]/, // Lines starting with closing brackets
  ];

  if (!processed.includes("```")) {
    const lines = processed.split("\n");
    let isInsideCode = false;
    let newProcessedLines = [];
    let currentLang = "javascript";
    
    // Patterns that strongly indicate a state change at line start
    const openPatterns = [
      /^const\s+/, /^let\s+/, /^var\s+/, /^function\s+/, /^class\s+/, /^def\s+/, 
      /^import\s+/, /^async\s+/, /^for\s+/, /^while\s+/, /^if\s+/, /^\/\//, /^#/
    ];

    for (let i = 0; i < lines.length; i++) {
       const line = lines[i];
       const trimmed = line.trim();
       const isMarkdownTable = trimmed.startsWith("|");
       const isMarkdownList = /^[ \t]*([-*+]|\d+\.)[ \t]+/.test(line);
       
       const hasPattern = codePatterns.some(pattern => pattern.test(line));
       const hasOpenPattern = openPatterns.some(p => p.test(line));

       if (!isInsideCode) {
         // Only open if it looks like code AND isn't markdown
         if (hasOpenPattern && !isMarkdownTable && !isMarkdownList) {
           if (line.includes("def ") || line.includes("elif ") || line.startsWith("#")) currentLang = "python";
           else currentLang = "javascript";
           
           newProcessedLines.push("```" + currentLang);
           isInsideCode = true;
         }
       } else {
         // Inside code: look ahead to see if we should close
         const nextLines = lines.slice(i + 1, i + 3);
         const nextIsCode = nextLines.some(nl => {
           const t = nl.trim();
           return t !== "" && !t.startsWith("|") && !/^[ \t]*([-*+]|\d+\.)[ \t]+/.test(nl) && codePatterns.some(p => p.test(nl));
         });
         
         const currentIsCodeOrEmpty = trimmed === "" || (hasPattern && !isMarkdownTable && !isMarkdownList) || /^[ \t]+/.test(line);

         if (!currentIsCodeOrEmpty && !nextIsCode) {
           newProcessedLines.push("```");
           isInsideCode = false;
           currentLang = "javascript";
         }
       }
       newProcessedLines.push(line);
    }
    if (isInsideCode) newProcessedLines.push("```");
    processed = newProcessedLines.join("\n");
  }

  // Existing title and list bolding logic
  processed = processed.replace(/^([A-Z][A-Za-z0-9\s\(\)\/-]+)(?=\n)/gm, (match) => {
    if (match.length < 50 && !match.startsWith("-") && !match.startsWith("#") && !match.startsWith("|")) {
      return `### ${match}`;
    }
    return match;
  });
  processed = processed.replace(/^- ([^:\n]+):/gm, "- **$1**:");

  return processed;
};

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl group/code">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
          {language || "code"}
        </span>
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <IoMdCheckmark size={12} className="text-emerald-400" />
              <span className="text-emerald-400 uppercase tracking-wider">Copied!</span>
            </>
          ) : (
            <>
              <FaRegCopy size={12} />
              <span className="uppercase tracking-wider">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <code className="text-[13px] font-mono text-gray-200 leading-relaxed block whitespace-pre">
          {value}
        </code>
      </div>
    </div>
  );
};

const DEFAULT_SUGGESTIONS = [
  "Create a workflow that generates an image and then a video from it.",
  "Help me build a YouTube Shorts automation pipeline.",
  "Add a text-to-speech node to my current workflow.",
  "Can you create a multi-model image generation grid?"
];

const ChatWidget = ({ isOpen, toggleChat, messages, onSendMessage, isLoading, onClearHistory }) => {
  const [inputValue, setInputValue] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [isWide, setIsWide] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const loadingTexts = ["Thinking", "Analyzing", "Generating", "Refining", "Processing", "Running"];
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingTexts.length);
      }, 5000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        if (isOpen) {
          toggleChat();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen, toggleChat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const formatMessageDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div ref={widgetRef} className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-2 font-sans">
      {isOpen && (
        <div className={`${isWide ? 'w-[800px]' : 'w-[380px]'} max-w-[100vw] h-[600px] max-h-[100%] flex flex-col bg-[#0B0F17]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in text-left`}>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                <FaRobot className="text-white text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  AI Assistant
                </h3>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                suppressHydrationWarning={true}
                onClick={() => setIsWide(!isWide)}
                title={isWide ? "Narrow View" : "Wide View"}
                className="hidden md:flex p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-white/5"
              >
                {isWide ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={onClearHistory}
                  title="Clear Chat History"
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
                >
                  <IoMdTrash size={20} />
                </button>
              )}
              <button
                type="button"
                suppressHydrationWarning={true}
                onClick={toggleChat}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <IoMdClose size={20} />
              </button>
            </div>
          </div>
          <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 text-center p-6 h-full">
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="p-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                    <FaRobot className="text-3xl text-blue-400 opacity-80" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mt-2">Welcome!</h4>
                  <p className="text-sm max-w-[250px]">How can I help you today? Choose a suggestion below or type your own.</p>
                </div>
                
                <div className={`grid ${isWide ? "grid-cols-2" : "grid-cols-1"} gap-2 w-full`}>
                  {DEFAULT_SUGGESTIONS.map((suggestion, sIdx) => (
                    <button
                      type="button"
                      suppressHydrationWarning={true}
                      key={sIdx}
                      onClick={() => onSendMessage(suggestion)}
                      className="px-4 py-3 text-xs font-medium bg-white/5 text-gray-300 rounded-xl hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/50 transition-all text-left border border-white/10 shadow-sm cursor-pointer flex items-center gap-3 group"
                    >
                      <BsStars size={12} className="text-blue-400/50 group-hover:text-blue-400 transition-colors" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const showDateLabel =
                  idx === 0 ||
                  formatMessageDate(messages[idx - 1].timestamp) !==
                    formatMessageDate(msg.timestamp);

                return (
                  <React.Fragment key={idx}>
                    {showDateLabel && (
                      <div className="flex justify-center my-2">
                        <span className="px-3 py-1 bg-white/5 text-[10px] uppercase font-bold text-gray-500 rounded-full border border-white/10">
                          {isMounted ? formatMessageDate(msg.timestamp) : "---"}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`flex flex-col gap-4 max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-[#1A1F2B] text-gray-200 rounded-bl-none border border-white/5"
                        }`}
                      >
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold text-blue-400" {...props} />,
                            p: ({node, ...props}) => <div className="leading-relaxed text-gray-300 whitespace-pre-wrap" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1.5 text-gray-300" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1.5 text-gray-300" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-extrabold text-white" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-400" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 break-all transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                            code: ({node, inline, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || "");
                              const lang = match ? match[1] : "";
                              return inline ? (
                                <code className="bg-white/10 rounded-md px-1.5 py-0.5 text-[13px] font-mono text-pink-400" {...props}>{children}</code>
                              ) : (
                                <CodeBlock language={lang} value={String(children).replace(/\n$/, "")} />
                              );
                            },
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500/50 pl-4 py-1 italic text-gray-500 bg-white/5 rounded-r-lg" {...props} />,
                            table: ({node, ...props}) => (
                              <div className="my-4 overflow-hidden border border-white/10 rounded-2xl shadow-xl bg-black/20 backdrop-blur-sm">
                                <div className="overflow-x-auto custom-scrollbar">
                                  <table className="min-w-full divide-y divide-white/10 border-collapse" {...props} />
                                </div>
                              </div>
                            ),
                            th: ({node, ...props}) => (
                              <th className="px-4 py-3 bg-gradient-to-b from-white/10 to-white/5 text-left text-[11px] font-bold uppercase tracking-wider text-blue-400 border-b border-white/10" {...props} />
                            ),
                            td: ({node, ...props}) => (
                              <td className="px-4 py-2.5 text-[13px] text-gray-300 border-b border-white/5 transition-colors" {...props} />
                            ),
                            tr: ({node, ...props}) => (
                              <tr className="group transition-colors odd:bg-transparent even:bg-white-[0.02]" {...props} />
                            ),
                          }}
                        >
                          {preprocessContent(msg.content) || ""}
                        </ReactMarkdown>
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-medium text-gray-400">Suggested Actions:</p>
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                              {msg.suggestions.map((suggestion, sIdx) => (
                                <button
                                  type="button"
                                  suppressHydrationWarning={true}
                                  key={sIdx}
                                  onClick={() => onSendMessage(suggestion)}
                                  className="px-3 py-1.5 text-xs font-medium bg-[#242936] text-gray-300 rounded-lg hover:bg-blue-600/20 hover:text-blue-400 transition-colors text-left border border-white/10 shadow-sm cursor-pointer"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[10px] text-gray-400">
                          {isMounted ? formatMessageTime(msg.timestamp) : "--:--"}
                        </span>
                        <button
                          type="button"
                          suppressHydrationWarning={true}
                          onClick={() => handleCopy(msg.content, idx)}
                          className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                          title="Copy Message"
                        >
                          {copiedId === idx ? <IoMdCheckmark size={12} className="text-green-500" /> : <FaRegCopy size={12} />}
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col gap-1">
                  <div className="bg-[#1A1F2B]/80 backdrop-blur-sm p-3.5 rounded-2xl rounded-bl-none border border-white/5 shadow-sm flex items-center gap-2 min-w-[70px]">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 tracking-widest ml-1">{loadingTexts[loadingStep]}...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 bg-white/5 border-t border-white/10">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 bg-[#0B0F17] border border-white/10 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all"
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                autoFocus
                className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500 resize-none p-1 max-h-32 scrollbar-none border-none"
                style={{ height: "auto" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
              <button
                type="submit"
                suppressHydrationWarning={true}
                disabled={!inputValue.trim()}
                className="p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
              >
                {isLoading ? <FaRegCirclePause size={18} /> : <IoMdSend size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
      {!isOpen && (
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={toggleChat}
          className={`group relative right-6 md:right-0 flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-110 transition-all duration-300 ${isLoading ? 'ring-2 ring-blue-200 ring-offset-2' : ''}`}
        >
          {isLoading ? (
            <div className="flex gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
            </div>
          ) : (
            <>
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000" />
              <FaRobot className="text-white text-2xl drop-shadow-md" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
