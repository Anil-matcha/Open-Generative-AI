'use client';

import { useState } from 'react';

export default function ApiKeyModal({ onSave, requireApiKey = false, onToggleRequireApiKey }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) { setError('请输入 API 密钥'); return; }
    onSave(trimmed);
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4 font-inter">
      <div className="w-full max-w-sm bg-[#0a0a0a]/40 backdrop-blur-xl border border-white/10 rounded-xl p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 bg-[#d9ff00]/5 rounded-2xl flex items-center justify-center border border-[#d9ff00]/10 mb-6 group hover:border-[#d9ff00]/30 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" strokeWidth="1.5" className="group-hover:scale-110 transition-transform">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L12 17.25l-4.5-4.5L15.5 7.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-2">
            Open Generative AI
          </h1>
            <p className="text-white/40 text-[13px] leading-relaxed px-4">
            输入你的 <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" className="text-[#d9ff00] hover:text-[#e5ff33] transition-colors">Muapi.ai</a> API 密钥，即可开始创作
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {typeof onToggleRequireApiKey === 'function' && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-left">
                    <label className="block text-xs font-bold text-white/35 mb-1">
                    进入时要求输入 API 密钥
                  </label>
                  <p className="text-[12px] leading-relaxed text-white/35">
                    默认关闭。打开后，进入工作台前会先检查是否已保存 Muapi 密钥。
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={requireApiKey}
                  aria-label="进入时要求输入 API 密钥"
                  onClick={() => onToggleRequireApiKey(!requireApiKey)}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border transition-colors ${
                    requireApiKey ? 'border-[#d9ff00] bg-[#d9ff00]' : 'border-white/10 bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-black transition-transform ${
                      requireApiKey ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-white/30 ml-1">
              API 密钥
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              placeholder="粘贴 API 密钥"
              className="w-full bg-white/5 border border-white/[0.03] rounded-md px-5 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-[#d9ff00]/30 focus:bg-white/[0.07] transition-all"
              suppressHydrationWarning
            />
            {error && <p className="mt-2 text-red-500/80 text-[11px] font-medium ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#d9ff00] text-black font-medium py-2.5 rounded-md hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#d9ff00]/5"
            suppressHydrationWarning
          >
            {requireApiKey ? '保存并继续' : '保存密钥'}
          </button>

          <p className="text-center text-[12px] text-white/20 pt-2">
            还没有密钥？{' '}
            <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" className="text-white/40 hover:text-[#d9ff00] transition-colors font-medium">
              免费获取 →
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
