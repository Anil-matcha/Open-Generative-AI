"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaRocket, FaBars, FaTimes } from "react-icons/fa";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "AI Headshot", href: "/" },
    { name: "My Headshots", href: "/creations" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-glass-border bg-glass-bg/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <FaRocket className="text-white text-lg" />
            </div>
            <div>
              <div className="font-black tracking-[-0.02em] text-xl">Headshot</div>
              <div className="text-[9px] text-muted -mt-1">STUDIO</div>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-foreground ${pathname === link.href ? "text-foreground" : "text-muted"}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
}
