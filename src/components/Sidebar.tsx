"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import WalletButton from "@/components/WalletButton";
import { NetworkArc } from "@web3icons/react";
import {
  Home,
  Rocket,
  User,
  Coins,
  Compass,
  Trophy,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Telescope,
  Droplets
} from "lucide-react";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Launch Memecoin", href: "/launch", icon: Rocket, doodle: "rocket" },
    { name: "ARC Testnet Stats", href: "/identity", icon: User },
    { name: "My Memecoins", href: "/my-memecoin", icon: Coins },
    { name: "Explore", href: "/explore", icon: Compass, doodle: "telescope" },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "ArcDEX", href: "/arcdex", icon: ArrowLeftRight },
    { name: "Faucet", href: "https://faucet.circle.com/", icon: Droplets, external: true },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="h-screen sticky top-0 left-0 bg-[#13141a] border-r-2 border-[#8c909f] flex flex-col justify-between py-6 px-4 z-40 shrink-0 relative overflow-hidden"
    >
      {/* ── Cosmic Background Doodles ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] overflow-hidden">
        {/* Sketch Planet with Ring */}
        <svg className="absolute top-1/4 -right-12 w-32 h-32 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="50" cy="50" r="30" strokeDasharray="6 4" />
          <ellipse cx="50" cy="50" rx="45" ry="15" transform="rotate(-20 50 50)" strokeDasharray="4 6" />
          {/* Craters */}
          <circle cx="40" cy="45" r="4" />
          <circle cx="60" cy="55" r="6" />
        </svg>

        {/* Orbit Path */}
        <svg className="absolute -top-10 -left-10 w-48 h-48 text-white opacity-40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="50" cy="50" r="48" strokeDasharray="2 8" />
        </svg>

        {/* Constellation */}
        <svg className="absolute bottom-1/4 left-2 w-24 h-24 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <circle cx="80" cy="40" r="2" fill="currentColor" />
          <circle cx="40" cy="80" r="2" fill="currentColor" />
          <circle cx="60" cy="20" r="2" fill="currentColor" />
          <polyline points="20,20 60,20 80,40 40,80" strokeDasharray="4 4" />
        </svg>

        {/* UFO */}
        <svg className="absolute top-12 left-4 w-12 h-12 text-white transform rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4 C8 4, 6 8, 6 10 M12 4 C16 4, 18 8, 18 10" />
          <ellipse cx="12" cy="12" rx="10" ry="3" strokeDasharray="3 2" />
          <path d="M7 13 L5 18 M17 13 L19 18 M12 14 L12 18" />
        </svg>

        {/* Star */}
        <svg className="absolute bottom-12 right-6 w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5l-10 14M7 5l10 14M2 12h20" strokeDasharray="2 2" />
        </svg>

        {/* Tiny Comet */}
        <svg className="absolute top-1/2 -right-4 w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M 4 20 L 16 8 M 16 8 C 18 6, 22 4, 22 4 C 22 4, 20 8, 18 10 Z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="12" x2="6" y2="18" strokeDasharray="1 3" />
          <line x1="14" y1="14" x2="8" y2="20" strokeDasharray="1 3" />
        </svg>
      </div>

      {/* Top Header & Logo */}
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex flex-col">
              <Link href="/" className="flex items-center gap-2 group">
                {/* Arc Logo */}
                <div className="group-hover:rotate-12 transition-transform">
                  <NetworkArc variant="background" size={24} />
                </div>
                {/* Arc One Text */}
                <span className="font-marker text-2xl text-[#adc6ff] tracking-wide inline-block group-hover:scale-105 transition-transform duration-200">
                  Arc One
                </span>
              </Link>
              <span className="font-sketch text-xs text-[#8c909f] italic ml-8 mt-0.5 select-none">
                Arc Cat's Workshop
              </span>
            </div>
          )}

          {isCollapsed && (
            <Link href="/" className="mx-auto mt-2 block hover:rotate-12 transition-transform">
              <NetworkArc variant="background" size={32} />
            </Link>
          )}

          <button
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg border border-[#8c909f] bg-[#131313] hover:border-[#adc6ff] text-[#8c909f] hover:text-[#adc6ff] transition-colors ${!isCollapsed ? 'absolute -right-7 bg-[#1b1b1b] border-[#424754]' : ''}`}
            style={!isCollapsed ? { zIndex: 50, top: '10px' } : {}}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const linkProps = item.external
              ? { href: item.href, target: "_blank" as const, rel: "noopener noreferrer" }
              : { href: item.href };
            return (
              <Link key={item.name} {...linkProps}>
                <div className="relative group cursor-pointer">
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-gradient-to-r from-[#d0bcff]/30 to-[#d0bcff]/10 rounded-full shadow-[0_0_20px_rgba(208,188,255,0.4),inset_0_0_15px_rgba(208,188,255,0.2)] z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors relative z-10 ${isActive
                      ? "text-[#d0bcff]"
                      : "text-[#bec6e0] hover:text-[#ece1d5] hover:bg-[#242424]/40"
                      }`}
                  >
                    <item.icon size={18} className={isActive ? "text-[#d0bcff] drop-shadow-[0_0_10px_rgba(208,188,255,1)]" : "text-[#8c909f] group-hover:text-[#bec6e0]"} />

                    {!isCollapsed && (
                      <span className="font-sans font-medium text-[13px] flex-1">
                        {item.name}
                      </span>
                    )}

                    {/* Doodles next to text */}
                    {!isCollapsed && item.doodle === "rocket" && (
                      <Rocket size={12} className="text-[#8c909f]/40 rotate-45 transform translate-y-0.5 group-hover:text-[#d0bcff]/80 transition-colors" />
                    )}
                    {!isCollapsed && item.doodle === "telescope" && (
                      <Telescope size={14} className="text-[#8c909f]/40 group-hover:text-[#adc6ff]/80 transition-colors" />
                    )}

                    {/* External link indicator */}
                    {!isCollapsed && item.external && (
                      <svg width="10" height="10" viewBox="0 0 12 12" className="text-[#8c909f]/60 group-hover:text-[#adc6ff]/80 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 1h7v7M11 1L4.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-20 bg-[#242424] border border-[#8c909f] text-xs text-[#ece1d5] px-2 py-1 rounded shadow-md font-sketch opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Wallet Connection */}
      <div className="flex flex-col gap-4 relative z-10">
        {!isCollapsed ? (
          <WalletButton />
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl border border-[#424754] bg-[#131313] flex items-center justify-center text-[#8c909f] hover:text-[#adc6ff] hover:border-[#adc6ff] transition-colors group relative"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M16 12h2" />
              </svg>
              <div className="absolute left-16 bg-[#242424] border border-[#8c909f] text-xs text-[#ece1d5] px-2 py-1 rounded shadow-md font-sketch opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Wallet
              </div>
            </button>
          </div>
        )}

        {/* Mascot Mini Tag */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1 bg-[#131313]/50 border border-dashed border-[#8c909f]/40 rounded-lg opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-5 h-5 rounded-full bg-[#242424] flex items-center justify-center border border-[#424754] overflow-hidden">
              <span className="text-[9px]">🐱</span>
            </div>
            <span className="text-[9px] font-sketch text-[#8c909f]">
              Arc Cat watching...
            </span>
          </div>
        )}

        {/* Builder Socials */}
        {!isCollapsed && (
          <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-[#8c909f]/20">
            <div className="flex items-center gap-3">
              <a href="https://x.com/dexi269" target="_blank" rel="noopener noreferrer" className="text-[#8c909f] hover:text-[#adc6ff] transition-colors" aria-label="X (Twitter)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
            <div className="text-[10px] font-mono text-[#8c909f]">
              Builder: <a href="https://x.com/dexi269" target="_blank" rel="noopener noreferrer" className="text-[#adc6ff] hover:text-[#ece1d5] transition-colors underline decoration-[#424754] underline-offset-2">@dexi269</a>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
