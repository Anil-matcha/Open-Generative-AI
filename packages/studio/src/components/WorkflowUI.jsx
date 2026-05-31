"use client";

import React, { useState, useEffect, useCallback } from "react";

const MODELS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

function getApiKey() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/muapi_key=([^;]+)/);
  return match?.[1] || "";
}

function loadSteps(workflowId) {
  try {
    const stored = localStorage.getItem(`mf_wf_steps_${workflowId}`);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function saveSteps(workflowId, steps) {
  try { localStorage.setItem(`mf_wf_steps_${workflowId}`, JSON.stringify(steps)); } catch {}
}

const defaultStep = () => ({ id: Date.now(), prompt: "", model: "gpt-4o-mini", result: null, error: null, running: false });

const WorkflowUI = ({ workflowId }) => {
  const [steps, setSteps] = useState(() => loadSteps(workflowId) || [defaultStep()]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const stored = loadSteps(workflowId);
    if (stored) setSteps(stored);
  }, [workflowId]);

  const persist = useCallback((newSteps) => {
    setSteps(newSteps);
    saveSteps(workflowId, newSteps.map(s => ({ ...s, result: s.result, error: s.error, running: false })));
  }, [workflowId]);

  const addStep = () => persist([...steps, defaultStep()]);

  const removeStep = (id) => persist(steps.filter(s => s.id !== id));

  const updateStep = (id, field, value) =>
    persist(steps.map(s => s.id === id ? { ...s, [field]: value } : s));

  const runAll = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return alert("API ключ не найден");
    setIsRunning(true);
    let prevOutput = "";
    const updated = steps.map(s => ({ ...s, result: null, error: null, running: false }));

    for (let i = 0; i < updated.length; i++) {
      const step = updated[i];
      updated[i] = { ...step, running: true };
      setSteps([...updated]);

      const prompt = step.prompt.replace(/\{\{prev\}\}/g, prevOutput).trim();
      if (!prompt) { updated[i] = { ...updated[i], running: false }; continue; }

      try {
        const res = await fetch("/api/mf/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: step.model,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
        prevOutput = data.choices?.[0]?.message?.content || "";
        updated[i] = { ...updated[i], running: false, result: prevOutput, error: null };
      } catch (err) {
        updated[i] = { ...updated[i], running: false, error: err.message };
        break;
      }
      setSteps([...updated]);
    }

    saveSteps(workflowId, updated.map(s => ({ ...s, running: false })));
    setIsRunning(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Конструктор процессов</h2>
            <p className="text-xs text-white/30 mt-1">Используйте <code className="text-[#22d3ee]">{"{{prev}}"}</code> чтобы передать вывод предыдущего шага</p>
          </div>
          <button
            onClick={runAll}
            disabled={isRunning}
            className="px-4 py-2 bg-[#22d3ee] text-black text-sm font-bold rounded-md hover:bg-[#e5ff33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? "Выполняется..." : "▶ Запустить"}
          </button>
        </div>

        {steps.map((step, i) => (
          <div key={step.id} className="border border-white/[0.06] rounded-xl bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center text-[10px] font-black text-[#22d3ee]">
                  {i + 1}
                </div>
                <select
                  value={step.model}
                  onChange={e => updateStep(step.id, "model", e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/30"
                >
                  {MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeStep(step.id)}
                disabled={steps.length === 1}
                className="text-white/20 hover:text-red-400 disabled:opacity-0 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                value={step.prompt}
                onChange={e => updateStep(step.id, "prompt", e.target.value)}
                placeholder={i === 0 ? "Введите промпт для первого шага..." : "Введите промпт (используйте {{prev}} для вывода предыдущего шага)..."}
                rows={3}
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/30 resize-none"
              />

              {step.running && (
                <div className="flex items-center gap-2 text-xs text-[#22d3ee]/60">
                  <div className="w-3 h-3 border border-[#22d3ee]/40 border-t-[#22d3ee] rounded-full animate-spin" />
                  Выполняется...
                </div>
              )}

              {step.result && (
                <div className="bg-[#22d3ee]/5 border border-[#22d3ee]/10 rounded-lg p-3">
                  <div className="text-[10px] font-black text-[#22d3ee]/50 uppercase tracking-widest mb-2">Результат</div>
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{step.result}</p>
                </div>
              )}

              {step.error && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">{step.error}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addStep}
          className="w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
        >
          + Добавить шаг
        </button>
      </div>
    </div>
  );
};

export default WorkflowUI;
