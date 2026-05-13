"use client";

import { FaCoins } from "react-icons/fa";

export function CreditBadge({ credits, className }) {
  return (
    <div className={`flex items-center gap-2 text-sm text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 ${className}`}>
      <FaCoins className="text-yellow-500 text-xs" />
      <span>{credits} Credits</span>
    </div>
  );
}
