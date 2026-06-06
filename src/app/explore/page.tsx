"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useReadContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { Search, TrendingUp, Sparkles, Activity, Construction, Rocket } from "lucide-react";
import { FACTORY_ADDRESS, FACTORY_ABI, ERC20_ABI } from "@/config/contractConfig";

// ─── Sub-component: reads one token's data from the chain ─────────────────────
function TokenCard({ tokenAddress, searchQuery }: { tokenAddress: string; searchQuery: string }) {
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

  // Try to get metadata from the factory curve state (metadataURI is in the TokenCreated event)
  // Fallback: read from a local cache set during launch
  const [meta, setMeta] = useState<{ description?: string; image?: string; creator?: string; timestamp?: number }>({});
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient || !tokenAddress) return;
    let cancelled = false;
    publicClient.getLogs({
      address: FACTORY_ADDRESS as `0x${string}`,
      event: {
        type: "event",
        name: "TokenCreated",
        inputs: [
          { indexed: true, name: "creator", type: "address" },
          { indexed: true, name: "tokenAddress", type: "address" },
          { indexed: false, name: "name", type: "string" },
          { indexed: false, name: "symbol", type: "string" },
          { indexed: false, name: "metadataURI", type: "string" },
          { indexed: false, name: "timestamp", type: "uint256" },
        ],
      },
      args: { tokenAddress: tokenAddress as `0x${string}` },
      fromBlock: BigInt(0),
      toBlock: "latest",
    }).then((logs) => {
      if (cancelled || !logs[0]) return;
      const { metadataURI, creator, timestamp } = (logs[0] as any).args;
      let description: string | undefined;
      let image: string | undefined;
      try {
        const m = JSON.parse(metadataURI);
        description = m.description || metadataURI;
        image = m.image;
      } catch {
        description = metadataURI;
      }
      if (!cancelled) setMeta({ description, image, creator, timestamp: Number(timestamp) });
    }).catch((err) => {
      console.error("Error fetching TokenCreated logs:", err);
    });
    return () => { cancelled = true; };
  }, [publicClient, tokenAddress]);

  // Read curve state & progress
  const { data: curveStateRaw } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getCurveState",
    args: [tokenAddress as `0x${string}`],
  });

  const { data: progressRaw } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getGraduationProgress",
    args: [tokenAddress as `0x${string}`],
  });

  const curve = curveStateRaw as any;
  const progressPct = progressRaw ? Math.min(100, Number(progressRaw) / 100) : 0;
  const realUsdcRaised = curve ? Number(formatUnits(curve.realUsdcAccumulated, 6)) : 0;
  const currentPrice = curve
    ? Number(formatUnits(curve.virtualUsdcReserve, 6)) /
      Number(formatUnits(curve.virtualTokenReserve, 18))
    : 0;
  const marketCap = currentPrice * 1_000_000_000;

  // Filter by search
  const nameStr = (name as string) ?? "";
  const symbolStr = (symbol as string) ?? "";
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!nameStr.toLowerCase().includes(q) && !symbolStr.toLowerCase().includes(q)) return null;
  }

  return (
    <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:border-[#adc6ff]/50 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-[#424754] flex items-center justify-center bg-[#131313] overflow-hidden shrink-0">
            {meta.image ? (
              <img src={meta.image} alt={nameStr} className="w-full h-full object-cover" />
            ) : (
              <span className="font-mono text-lg text-[#adc6ff] font-bold">
                {symbolStr?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-marker text-lg text-[#ece1d5] line-clamp-1">{nameStr || "Loading..."}</h3>
            <span className="font-mono text-xs text-[#adc6ff]">${symbolStr || "..."}</span>
          </div>
        </div>
        {meta.timestamp && meta.timestamp > 0 && (
          <div className="text-[10px] font-mono text-[#8c909f] border border-[#424754] px-2 py-1 rounded bg-[#131313] shrink-0">
            {new Date(meta.timestamp * 1000).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-[#131313] p-3 rounded-lg border border-dashed border-[#424754] flex-1 min-h-[60px]">
        <p className="text-xs font-mono text-[#8c909f] italic line-clamp-3">
          {meta.description || "No description provided..."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#adc6ff]/10 border border-[#adc6ff]/30 rounded-lg p-2 col-span-3">
          <span className="text-[9px] font-mono text-[#adc6ff] block uppercase tracking-wider">Market Cap</span>
          <span className="text-sm font-marker text-[#ece1d5] mt-0.5 block">{marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
        </div>
        <div className="bg-[#131313] border border-[#424754] rounded-lg p-2">
          <span className="text-[9px] font-mono text-[#8c909f] block">Price</span>
          <span className="text-xs font-mono text-[#ece1d5] font-bold mt-0.5 block line-clamp-1">{currentPrice.toFixed(8)}</span>
        </div>
        <div className="bg-[#131313] border border-[#424754] rounded-lg p-2">
          <span className="text-[9px] font-mono text-[#8c909f] block">Raised</span>
          <span className="text-xs font-mono text-[#ece1d5] font-bold mt-0.5 block line-clamp-1">{realUsdcRaised.toFixed(1)}</span>
        </div>
        <div className="bg-[#131313] border border-[#424754] rounded-lg p-2">
          <span className="text-[9px] font-mono text-[#8c909f] block">Progress</span>
          <span className="text-xs font-mono text-[#adc6ff] font-bold mt-0.5 block">{progressPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-[#424754]/50">
        <div className="text-[10px] font-mono text-[#8c909f]">
          {meta.creator
            ? `by ${meta.creator.slice(0, 6)}...${meta.creator.slice(-4)}`
            : tokenAddress.slice(0, 8) + "..."}
        </div>
        <Link
          href={`/token/${tokenAddress}`}
          className="text-xs bg-[#adc6ff] text-blue-950 font-bold px-4 py-1.5 rounded-lg hover:bg-[#d0bcff] transition-colors shadow-[2px_2px_0px_0px_#ece1d5]"
        >
          Trade →
        </Link>
      </div>
    </div>
  );
}

// ─── Main Explore Page ─────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "newest">("all");

  // Read all token addresses from the factory — this is the most reliable call
  const { data: allTokensRaw, isLoading } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getAllTokens",
  });

  const allTokens: string[] = ((allTokensRaw as string[]) ?? []).slice().reverse(); // newest first

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">
          Explore Memecoins
        </h1>
        <p className="text-sm font-sans text-[#8c909f] mt-1">
          Discover tokens launched on Arc Pump and swap to push them through their bonding curves.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token name or symbol..."
            className="w-full bg-[#1b1b1b] border border-[#424754] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#ece1d5] placeholder-[#8c909f] focus:outline-none focus:border-[#adc6ff]"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#8c909f]" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {(["all", "newest"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs rounded-lg border font-mono transition-colors ${
                activeTab === tab
                  ? "bg-[#adc6ff] text-blue-950 border-[#adc6ff] font-bold"
                  : "bg-[#1b1b1b] text-[#8c909f] border-[#424754] hover:border-[#adc6ff]"
              }`}
            >
              {tab === "all" ? "All Tokens" : "✨ Newest"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs font-mono text-[#8c909f] border border-[#424754] rounded-lg px-3 py-2 bg-[#131313]">
            <Activity size={12} className={isLoading ? "animate-spin" : ""} />
            {allTokens.length} tokens
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#8c909f]">
          <Activity className="animate-spin mb-4" size={32} />
          <p className="font-mono text-sm">Fetching tokens from Arc Testnet...</p>
        </div>
      ) : allTokens.length === 0 ? (
        <div className="border-2 border-dashed border-[#424754] rounded-2xl p-16 mt-8 flex flex-col items-center text-center space-y-4">
          <Construction size={48} className="text-[#8c909f]" />
          <h2 className="font-marker text-2xl text-[#ece1d5]">No Tokens Yet!</h2>
          <p className="font-mono text-sm text-[#8c909f] max-w-sm">
            No memecoins have been launched yet. Be the first to forge one!
          </p>
          <Link
            href="/launch"
            className="mt-2 px-6 py-2.5 bg-[#adc6ff] text-blue-950 font-bold text-sm rounded-xl hover:bg-[#d0bcff] transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_#ece1d5]"
          >
            <Rocket size={16} /> Launch First Token
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTokens.map((addr) => (
            <TokenCard key={addr} tokenAddress={addr} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}
