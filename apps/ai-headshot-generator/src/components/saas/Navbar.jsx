"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FaCoins, FaUser, FaSignOutAlt, FaChevronDown, FaRocket, FaBars, FaTimes, FaGithub } from "react-icons/fa";
import { SiVercel } from "react-icons/si";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginButton } from "./AuthButtons";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "AI Headshot", href: "/" },
    { name: "My Creations", href: "/creations" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <nav className="h-20 border-b border-glass-border bg-glass-bg backdrop-blur-3xl sticky top-0 z-[100] px-4 md:px-12 flex items-center justify-between">
      {/* Logo Section */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
          <FaRocket className="text-white text-lg" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-black text-xl tracking-tighter uppercase text-foreground">
            AI HeadShot
          </span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          // Hide "My Creations" from guests
          if (!session && link.href === "/creations") return null;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-semibold tracking-tight transition-all relative py-2 ${
                isActive ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {link.name}
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <>
            <Link href="/pricing" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-glass-bg border border-glass-border hover:bg-glass-hover transition-all group shadow-sm drop-shadow-sm">
              <FaCoins className="text-yellow-600 text-xs group-hover:scale-125 transition-transform" />
              <div className="flex flex-col gap-2 items-start leading-none">
                <span className="text-[10px] font-medium text-muted">Balance</span>
                <span className="text-xs font-semibold text-foreground">{session.user.credits} Credits</span>
              </div>
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-2xl hover:bg-glass-bg transition-all outline-none"
              >
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-white/5 shadow-lg"
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-56 bg-glass-bg border border-glass-border rounded-2xl shadow-2xl p-2 z-[200] backdrop-blur-3xl"
                  >
                    <div className="flex flex-col gap-2 p-3 border-b border-glass-border">
                      <div className="text-xs font-medium text-muted">Account</div>
                      <h3 className="text-xs font-bold text-foreground truncate">{session.user.name}</h3>
                      <div className="text-xs font-medium text-muted truncate">{session.user.email}</div>
                    </div>
                    
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 text-muted hover:text-red-500 transition-all font-semibold text-xs group"
                    >
                      Sign Out
                      <FaSignOutAlt className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <LoginButton className="!h-10 !px-6 !text-[10px] !tracking-widest !font-bold" />
        )}
        
        <a 
          href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-headshot-generator"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-slate-900/10"
        >
          <SiVercel className="text-xs" />
          Deploy
        </a>

        
        {/* Mobile menu toggle */}
        <button 
          className="md:hidden ml-2 p-2 text-muted hover:text-foreground transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-0 right-0 bg-[var(--solid-bg)]/90 backdrop-blur-2xl border-b border-glass-border shadow-2xl flex flex-col md:hidden z-50 p-4 gap-2"
          >
            {navLinks.map((link) => {
              if (!session && link.href === "/creations") return null;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-4 rounded-xl font-semibold text-sm transition-all ${
                    isActive 
                      ? "bg-primary-50 text-primary-600" 
                      : "text-muted hover:bg-glass-bg"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* Mobile Credits Display */}
            {session && (
              <div className="mt-2 p-4 rounded-xl bg-glass-bg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <FaCoins className="text-yellow-600 text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</span>
                    <span className="text-sm font-black text-foreground">{session.user.credits} Credits</span>
                  </div>
                </div>
                <Link 
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold transition-all hover:bg-slate-950"
                >
                  Top Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
