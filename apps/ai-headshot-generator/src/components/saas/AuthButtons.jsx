"use client";

import { signIn, signOut } from "next-auth/react";
import { FaGoogle, FaSignOutAlt } from "react-icons/fa";

export function LoginButton({ className }) {
  return (
    <button
      onClick={() => signIn("google")}
      className={`group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-full font-semibold overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] focus:ring-2 focus:ring-white/50 outline-none ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      <FaGoogle className="text-lg" />
      Sign in with Google
    </button>
  );
}

export function SignOutButton({ className }) {
  return (
    <button
      onClick={() => signOut()}
      className={`text-zinc-400 hover:text-white transition-colors ${className}`}
    >
      <FaSignOutAlt />
    </button>
  );
}
