"use client";

import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import ArcCatMascot from "@/components/ArcCatMascot";
import { motion } from "framer-motion";
import { Rocket, Compass, Wallet, Moon, Sun } from "lucide-react";
import { NetworkArc } from "@web3icons/react";
import { useTheme } from "next-themes";

// Deterministic seeded PRNG — identical output on server & client
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rand = seededRandom(99);
const INTRO_STARS = Array.from({ length: 60 }).map(() => ({
  width: 1 + rand() * 1.5,
  height: 1 + rand() * 1.5,
  top: rand() * 100,
  left: rand() * 100,
  delay: rand() * 4,
}));

export default function IntroPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { theme, setTheme } = useTheme();

  // Hydration state check
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] overflow-hidden flex flex-col">
      {/* Star field background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Tiny dots / stars */}
        {INTRO_STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
        {/* Subtle radial glow behind mascot area */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#adc6ff]/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[#d0bcff]/[0.03] blur-[100px]" />
      </div>

      {/* ─── Top Navigation Bar ─── */}
      <header className="relative z-20 flex items-center justify-between px-8 md:px-16 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-marker text-xl text-[#adc6ff] italic tracking-wide hover:opacity-80 transition-opacity">
          <NetworkArc variant="background" size={20} />
          <span>Arc One</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-sans">
          <Link href="/dashboard" className="text-[#ece1d5] border-b-2 border-[#adc6ff] pb-0.5">Home</Link>
          <Link href="/launch" className="text-[#8c909f] hover:text-[#ece1d5] transition-colors">Launch</Link>
          <Link href="/explore" className="text-[#8c909f] hover:text-[#ece1d5] transition-colors">Explore</Link>
          <Link href="/leaderboard" className="text-[#8c909f] hover:text-[#ece1d5] transition-colors">Leaderboard</Link>
          <Link href="/arcdex" className="text-[#8c909f] hover:text-[#ece1d5] transition-colors">ArcDEX</Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-[#424754] text-[#8c909f] hover:text-[#ece1d5] hover:border-[#8c909f] transition-colors"
          >
            {mounted && theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {isConnected ? (
            <button
              onClick={() => open()}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#424754] rounded-full text-xs font-mono text-[#8c909f] hover:border-[#adc6ff] hover:text-[#adc6ff] transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </button>
          ) : (
            <button
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-[#8c909f] rounded-full text-xs font-sketch text-[#ece1d5] hover:border-[#adc6ff] hover:text-[#adc6ff] transition-colors"
            >
              <Wallet size={14} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <div className="relative z-10 flex-1 flex items-center px-8 md:px-16 lg:px-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto w-full">

          {/* ─── Left Column: Heading & CTA ─── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* "Start here!" annotation */}
            <div className="relative inline-block">
              <span className="font-sketch text-sm text-[#bec6e0] italic tracking-wide">Start here!</span>
              {/* Small curved arrow SVG */}
              <svg
                className="absolute -left-6 top-0 w-5 h-5 text-[#bec6e0]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M 4,4 Q 2,12 8,18" />
                <path d="M 5,16 L 8,18 L 11,15" />
              </svg>
            </div>

            {/* Main Heading */}
            <h1 className="leading-[1.15]">
              <span className="block font-marker text-5xl md:text-6xl lg:text-7xl text-[#ece1d5] tracking-wide">
                Create Your Own
              </span>
              <span className="block font-marker text-5xl md:text-6xl lg:text-7xl text-[#d0bcff] tracking-wide mt-1 relative inline-flex items-center gap-4">
                <span>Meme Coin</span>
                {/* Hand-drawn Golden Coin */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative shrink-0 rotate-12 drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]"
                >
                  <svg viewBox="0 0 100 100" className="w-12 h-12 md:w-16 md:h-16 -mt-2">
                    {/* Wavy outer coin edge */}
                    <path
                      d="M50 5 C75 2, 95 20, 96 48 C97 78, 70 98, 45 95 C18 92, 2 70, 5 45 C8 18, 25 7, 50 5 Z"
                      fill="url(#goldGradient)"
                      stroke="#713f12"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Inner sketchy border */}
                    <path
                      d="M50 12 C68 10, 85 25, 86 48 C87 70, 65 85, 45 83 C25 81, 12 65, 14 45 C16 25, 30 14, 50 12 Z"
                      fill="none"
                      stroke="#854d0e"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                    />
                    {/* Sketched Dollar Sign */}
                    <path d="M47 25 L45 75 M55 23 L53 73" stroke="#422006" strokeWidth="3" strokeLinecap="round" />
                    <path
                      d="M62 35 C60 22, 38 25, 40 38 C42 50, 65 48, 62 62 C58 78, 35 70, 38 58"
                      fill="none"
                      stroke="#422006"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Little sparkle elements inside */}
                    <path d="M22 22 L28 28 M28 22 L22 28" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M78 72 L82 76 M82 72 L78 76" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
                    
                    <defs>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="40%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#a16207" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
                {/* Wavy underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0,6 Q 25,0 50,6 T 100,6 T 150,6 T 200,6"
                    stroke="#d0bcff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </span>
              <span className="block font-marker text-5xl md:text-6xl lg:text-7xl text-[#ece1d5] tracking-wide mt-1">
                on Arc Testnet
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-sketch text-sm md:text-base text-[#8c909f] max-w-md leading-relaxed">
              Launch memecoins in under 30 seconds and build your on-chain reputation. Experience the speed and security of the Arc ecosystem.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Link href="/launch">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 px-6 py-3 bg-transparent border-2 border-[#8c909f] rounded-full text-sm font-sketch text-[#ece1d5] hover:border-[#adc6ff] hover:text-[#adc6ff] transition-colors cursor-pointer"
                >
                  <Rocket size={16} />
                  <span>Launch Memecoin</span>
                </motion.div>
              </Link>

              <Link href="/explore">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 px-6 py-3 bg-transparent border-2 border-[#424754] rounded-full text-sm font-sketch text-[#8c909f] hover:border-[#bec6e0] hover:text-[#ece1d5] transition-colors cursor-pointer"
                >
                  <Compass size={16} />
                  <span>Explore Memecoins</span>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* ─── Right Column: Arc Cat Mascot Card ─── */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center items-center relative"
          >
            {/* Sparkle decorations */}
            <Sparkle className="absolute -top-8 right-12 text-[#bec6e0]" size={18} delay={0} />
            <Sparkle className="absolute top-4 -right-4 text-[#8c909f]" size={12} delay={0.5} />
            <Sparkle className="absolute -top-4 left-16 text-[#adc6ff]" size={10} delay={1} />
            <Sparkle className="absolute bottom-16 -left-6 text-[#d0bcff]" size={14} delay={1.5} />

            {/* Rocket decoration */}
            <motion.div
              className="absolute -top-2 right-4 text-[#8c909f] rotate-45"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Rocket size={16} />
            </motion.div>

            {/* Card Frame */}
            <div className="relative group">
              <ArcCatMascot state="idle" size="xl" interactive={false} />
            </div>

              {/* "So premium, meow!" annotation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-4 -right-16 md:-right-24"
              >
                <span className="font-sketch text-xs text-[#8c909f] italic whitespace-nowrap">
                  So premium, meow!
                </span>
                {/* Arrow towards card */}
                <svg
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c909f] rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M 4,12 L 18,12" />
                  <path d="M 14,8 L 18,12 L 14,16" />
                </svg>
              </motion.div>
          </motion.div>

        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="relative z-20 w-full flex flex-col items-center justify-center py-6 mt-auto border-t border-[#424754]/30">
        <div className="flex flex-col items-center gap-2">
          {/* Social Links (Placeholder) */}
          <div className="flex items-center gap-4 text-[#8c909f] mb-1">
            <a href="https://x.com/dexi269" target="_blank" rel="noopener noreferrer" className="hover:text-[#ece1d5] transition-colors" aria-label="X (Twitter)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
          
          {/* Founder Attribution */}
          <div className="text-xs font-mono text-[#8c909f]">
            Builder: <a href="https://x.com/dexi269" target="_blank" rel="noopener noreferrer" className="hover:text-[#adc6ff] transition-colors underline decoration-[#424754] underline-offset-4">@dexi269</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sparkle helper component ── */
function Sparkle({ className, size, delay }: { className?: string; size: number; delay: number }) {
  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 3, delay, ease: "easeInOut" }}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </motion.svg>
  );
}
