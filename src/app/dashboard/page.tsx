"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/config/contractConfig";
import { useAppKit } from "@reown/appkit/react";
import ArcCatMascot from "@/components/ArcCatMascot";
import {
  TrendingUp,
  Coins,
  Activity as ActivityIcon,
  Sparkles,
  ArrowUpRight,
  Zap,
  Heart,
  PlusCircle,
  Construction
} from "lucide-react";

export default function DashboardPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });

  const [catState, setCatState] = useState<"bubble" | "happy" | "thinking">("bubble");

  const totalMarketCap = 0;
  
  const { data: totalLaunchesData } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getTotalLaunches",
  });
  
  const activeCoinsCount = Number(totalLaunchesData || 0);
  const totalTradesCount = 0;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getCatWelcome = () => {
    if (isConnected) {
      return `Welcome back, ${address ? truncateAddress(address) : "Anon"}! Let's pump some sketches!`;
    }
    return "Meow! Connect your wallet or sketch a memecoin. What are we building today?";
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Banner with Mascot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center bg-[#1b1b1b] border-2 border-[#8c909f] rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_0px_#8c909f] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

        <div className="lg:col-span-2 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/40 border border-[#adc6ff]/50 rounded-full text-[#adc6ff] text-xs font-mono">
            <Sparkles size={12} className="animate-spin" />
            <span>Sketch & Launch Bonding Curves</span>
          </div>

          <h1 className="font-marker text-4xl md:text-5xl text-[#ece1d5] tracking-wide leading-tight">
            Draw Your Idea, <br />
            <span className="text-[#adc6ff] sketch-line sketch-line-blue">Pump the Market</span>
          </h1>

          <p className="font-sans text-sm md:text-base text-[#bec6e0] max-w-lg leading-relaxed">
            Welcome to Arc One — the home of builders on Arc.
            <br /><br />
            Launch tokens, build your on-chain identity, track your activity, and explore the Arc ecosystem from one place.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/launch" className="sketch-btn sketch-btn-primary">
              <PlusCircle size={18} />
              <span>Launch New Memecoin</span>
            </Link>

            {!isConnected && (
              <button onClick={() => open()} className="sketch-btn sketch-btn-purple">
                <Zap size={18} />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center relative z-10 pt-4 lg:pt-0">
          <ArcCatMascot
            state={catState}
            text={getCatWelcome()}
            size="lg"
            className="hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-80">
        <motion.div whileHover={{ y: -2 }} className="sketch-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-[#8c909f]">GLOBAL MARKET CAP</span>
            <span className="p-1.5 rounded-lg bg-green-950/20 text-green-400 border border-green-900/40">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-marker text-[#ece1d5]">{totalMarketCap.toFixed(1)} USDC</div>
            <span className="text-[11px] font-mono text-green-400 font-bold">Waiting for genesis</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="sketch-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-[#8c909f]">ACTIVE MEMECOINS</span>
            <span className="p-1.5 rounded-lg bg-blue-950/20 text-[#adc6ff] border border-blue-900/40">
              <Coins size={16} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-marker text-[#ece1d5]">{activeCoinsCount} launched</div>
            <span className="text-[11px] font-mono text-[#adc6ff]">Curve contracts active</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="sketch-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-[#8c909f]">TOTAL SWAPS</span>
            <span className="p-1.5 rounded-lg bg-purple-950/20 text-[#d0bcff] border border-purple-900/40">
              <ActivityIcon size={16} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-marker text-[#ece1d5]">{totalTradesCount} transactions</div>
            <span className="text-[11px] font-mono text-[#d0bcff]">Instant DEX routing</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="sketch-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-[#8c909f]">WALLET BALANCE</span>
            <span className="p-1.5 rounded-lg bg-[#242424] text-[#bec6e0] border border-[#424754]">
              <Zap size={16} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-marker text-[#ece1d5]">
              {isConnected ? `${balanceData ? Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4) : "0.0000"} USDC` : "0.00 USDC"}
            </div>
            <span className="text-[11px] font-mono text-[#8c909f]">
              {isConnected ? "Arc Testnet Connected" : "Disconnected"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Trending list & Global feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-marker text-2xl text-[#ece1d5]">Trending Memecoins</h2>
            <Link href="/explore" className="text-xs font-mono text-[#adc6ff] hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="sketch-card p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed h-[300px]">
            <Construction size={40} className="text-[#8c909f]" />
            <h3 className="font-marker text-xl text-[#ece1d5]">No Tokens Launched Yet</h3>
            <p className="text-sm font-sketch text-[#8c909f] max-w-sm">
              The Arc One Factory contract is being prepared. Once live, the trending algorithms will index tokens automatically.
            </p>
          </div>
        </div>

        {/* Live Feed */}
        <div className="sketch-card-secondary p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-dashed border-[#8c909f]/30 pb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <h2 className="font-marker text-xl text-[#ece1d5]">Live Laboratory Feed</h2>
          </div>

          <div className="flex flex-col items-center justify-center text-center h-[240px] space-y-3 opacity-60">
            <ActivityIcon size={32} className="text-[#8c909f]" />
            <p className="text-xs font-mono text-[#8c909f]">Waiting for on-chain events...</p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                const states: Array<"bubble" | "happy" | "thinking"> = ["bubble", "happy", "thinking"];
                const next = states[(states.indexOf(catState) + 1) % states.length];
                setCatState(next);
              }}
              className="w-full sketch-btn text-xs text-[#8c909f] hover:text-[#adc6ff] py-1.5 flex items-center justify-center gap-1.5"
            >
              <Heart size={12} className="text-red-400" />
              <span>Poke Mascot Cat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
