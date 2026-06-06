"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount, useBalance, useReadContract, useReadContracts, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, ERC20_ABI, USDC_ADDRESS } from "@/config/contractConfig";
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

// ─── Dashboard Token Card ──────────────────────────────────────────────────
function DashboardTokenCard({ tokenAddress }: { tokenAddress: string }) {
  const { data: name } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "name" as any,
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol" as any,
  });

  const nameStr = (name as string) ?? "Loading...";
  const symbolStr = (symbol as string) ?? "...";

  return (
    <Link
      href={`/token/${tokenAddress}`}
      className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-4 flex items-center justify-between hover:-translate-y-1 hover:border-[#adc6ff]/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-[#424754] flex items-center justify-center bg-[#131313] overflow-hidden shrink-0 group-hover:bg-[#adc6ff]/10 transition-colors">
          <span className="font-mono text-base text-[#adc6ff] font-bold">
            {symbolStr?.charAt(0) ?? "?"}
          </span>
        </div>
        <div>
          <h3 className="font-marker text-base text-[#ece1d5] line-clamp-1">{nameStr}</h3>
          <span className="font-mono text-xs text-[#adc6ff]">${symbolStr}</span>
        </div>
      </div>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#131313] border border-[#424754] group-hover:bg-[#adc6ff] group-hover:text-blue-950 text-[#8c909f] transition-all">
        <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}

// ─── Live Feed Item ────────────────────────────────────────────────────────
function LiveFeedItem({ tokenAddress }: { tokenAddress: string }) {
  const { data: name } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "name" as any,
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol" as any,
  });

  const nameStr = (name as string) ?? "Loading...";
  const symbolStr = (symbol as string) ?? "...";

  return (
    <div className="flex items-start gap-3 border-b border-[#424754]/50 pb-3 last:border-0 last:pb-0">
      <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
      <div>
        <p className="text-xs font-mono text-[#ece1d5]">
          <span className="text-[#adc6ff]">${symbolStr}</span> ({nameStr}) was forged!
        </p>
        <p className="text-[10px] font-mono text-[#8c909f] mt-1 break-all">
          Contract: {tokenAddress}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────
export default function DashboardPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Note: we fetch USDC balance instead of native ETH balance to match Arc Testnet context
  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : "0.0000";

  const [catState, setCatState] = useState<"bubble" | "happy" | "thinking">("bubble");
  const [totalTradesCount, setTotalTradesCount] = useState(0);
  
  const { data: allTokensRaw } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getAllTokens",
  });
  
  const allTokens = Array.isArray(allTokensRaw) ? [...allTokensRaw].reverse() : [];
  const activeCoinsCount = allTokens.length;

  const { data: curveStates } = useReadContracts({
    contracts: allTokens.map((addr) => ({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: "getCurveState",
      args: [addr],
    })),
  });

  const totalMarketCap = (curveStates ?? []).reduce((acc, result) => {
    if (result.status === "success" && result.result) {
      const curve = result.result as any;
      const price = Number(formatUnits(curve.virtualUsdcReserve, 6)) / Number(formatUnits(curve.virtualTokenReserve, 18));
      return acc + (price * 1_000_000_000);
    }
    return acc;
  }, 0);

  // Fetch recent trades for the counter
  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;

    const fetchTrades = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const CHUNK_SIZE = 10000n;
        const MAX_BLOCKS = 100000n;
        const startBlock = currentBlock > MAX_BLOCKS ? currentBlock - MAX_BLOCKS : 0n;

        let buyCount = 0;
        let sellCount = 0;

        for (let b = currentBlock; b >= startBlock; b -= CHUNK_SIZE) {
          if (cancelled) break;
          const fromB = (b - CHUNK_SIZE < startBlock) ? startBlock : (b - CHUNK_SIZE + 1n);
          
          try {
            const buys = await publicClient.getLogs({
              address: FACTORY_ADDRESS as `0x${string}`,
              event: {
                type: "event",
                name: "TokensBought",
                inputs: [
                  { indexed: true, name: "token", type: "address" },
                  { indexed: true, name: "buyer", type: "address" },
                  { indexed: false, name: "usdcIn", type: "uint256" },
                  { indexed: false, name: "tokenOut", type: "uint256" },
                  { indexed: false, name: "newPrice", type: "uint256" },
                  { indexed: false, name: "fee", type: "uint256" }
                ],
              },
              fromBlock: fromB,
              toBlock: b,
            });
            buyCount += buys.length;

            const sells = await publicClient.getLogs({
              address: FACTORY_ADDRESS as `0x${string}`,
              event: {
                type: "event",
                name: "TokensSold",
                inputs: [
                  { indexed: true, name: "token", type: "address" },
                  { indexed: true, name: "seller", type: "address" },
                  { indexed: false, name: "tokenIn", type: "uint256" },
                  { indexed: false, name: "usdcOut", type: "uint256" },
                  { indexed: false, name: "newPrice", type: "uint256" },
                  { indexed: false, name: "fee", type: "uint256" }
                ],
              },
              fromBlock: fromB,
              toBlock: b,
            });
            sellCount += sells.length;
          } catch (e) {}
        }
        if (!cancelled) setTotalTradesCount(buyCount + sellCount);
      } catch (e) {}
    };

    fetchTrades();
    return () => { cancelled = true; };
  }, [publicClient]);

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
              {isConnected ? `${Number(usdcBalance).toFixed(4)} USDC` : "0.00 USDC"}
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

          {allTokens.length === 0 ? (
            <div className="sketch-card p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed h-[300px]">
              <Construction size={40} className="text-[#8c909f]" />
              <h3 className="font-marker text-xl text-[#ece1d5]">No Tokens Launched Yet</h3>
              <p className="text-sm font-sketch text-[#8c909f] max-w-sm">
                The Arc One Factory contract is being prepared. Once live, the trending algorithms will index tokens automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allTokens.slice(0, 6).map((addr) => (
                <DashboardTokenCard key={addr} tokenAddress={addr} />
              ))}
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="sketch-card-secondary p-6 space-y-6 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 border-b border-dashed border-[#8c909f]/30 pb-4 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
            <h2 className="font-marker text-xl text-[#ece1d5]">Live Laboratory Feed</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {allTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full space-y-3 opacity-60">
                <ActivityIcon size={32} className="text-[#8c909f]" />
                <p className="text-xs font-mono text-[#8c909f]">Waiting for on-chain events...</p>
              </div>
            ) : (
              allTokens.slice(0, 5).map((addr) => <LiveFeedItem key={addr} tokenAddress={addr} />)
            )}
          </div>

          <div className="pt-4 mt-auto border-t border-[#8c909f]/20 shrink-0">
            <button
              onClick={() => {
                const states: Array<"bubble" | "happy" | "thinking"> = ["bubble", "happy", "thinking"];
                const next = states[(states.indexOf(catState) + 1) % states.length];
                setCatState(next);
              }}
              className="w-full sketch-btn text-xs text-[#8c909f] hover:text-[#adc6ff] py-2 flex items-center justify-center gap-1.5 bg-[#131313] border border-[#424754] rounded-xl transition-all"
            >
              <Heart size={14} className="text-red-400" />
              <span>Poke Mascot Cat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
