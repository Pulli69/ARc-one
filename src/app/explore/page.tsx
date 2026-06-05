"use client";

import React, { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { Search, SlidersHorizontal, TrendingUp, Sparkles, X, ArrowDown, Wallet, Construction, Activity } from "lucide-react";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/config/contractConfig";

export default function ExplorePage() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "newest">("all");

  const { data: rawLaunches, isLoading } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getAllLaunches",
  });

  const launches = (rawLaunches as any[]) || [];

  const parseMetadata = (uri: string) => {
    try {
      if (uri && uri.startsWith("{")) {
        return JSON.parse(uri);
      }
    } catch(e) {}
    return { description: uri, image: null };
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">
          Explore Sketches
        </h1>
        <p className="text-sm font-sans text-[#8c909f] mt-1">
          Discover other builders' ideas and swap tokens to push them through their bonding curves.
        </p>
      </div>

      {/* Filter Bar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between opacity-50 pointer-events-none">

        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token name or symbol..."
            className="w-full sketch-input pl-10 py-2.5 text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#8c909f]" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`sketch-btn text-xs py-2 px-4 ${activeTab === "all" ? "sketch-btn-primary" : ""}`}
          >
            All Ideas
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`sketch-btn text-xs py-2 px-4 ${activeTab === "trending" ? "sketch-btn-primary" : ""}`}
          >
            <TrendingUp size={12} className="inline mr-1" />
            <span>Trending Curves</span>
          </button>
          <button
            onClick={() => setActiveTab("newest")}
            className={`sketch-btn text-xs py-2 px-4 ${activeTab === "newest" ? "sketch-btn-primary" : ""}`}
          >
            <Sparkles size={12} className="inline mr-1" />
            <span>Newest</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#8c909f]">
          <Activity className="animate-spin mb-4" size={32} />
          <p className="font-sketch">Fetching blueprints from Arc Testnet...</p>
        </div>
      ) : launches.length === 0 ? (
        <div className="sketch-card p-12 mt-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="p-4 rounded-full bg-[#131313] border-2 border-dashed border-[#8c909f]">
            <Construction size={48} className="text-[#8c909f]" />
          </div>
          <div className="max-w-md">
            <h2 className="font-marker text-2xl text-[#ece1d5] mb-2">No Tokens Yet!</h2>
            <p className="font-sketch text-[#8c909f] leading-relaxed">
              The factory is live, but no one has launched a memecoin yet. Be the first to forge yours!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[...launches].reverse().map((launch, i) => {
            const meta = parseMetadata(launch.metadataURI);
            return (
            <div key={i} className="sketch-card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-[#424754] flex items-center justify-center bg-[#1b1b1b] overflow-hidden shrink-0">
                    {meta.image ? (
                      <img src={meta.image} alt={launch.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-sketch text-[#8c909f] text-xs">No Logo</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-marker text-xl text-[#ece1d5] line-clamp-1">{launch.name}</h3>
                    <span className="font-mono text-xs text-[#adc6ff]">${launch.symbol}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[#8c909f] border border-[#424754] px-2 py-1 rounded bg-[#131313] shrink-0">
                  {new Date(Number(launch.timestamp) * 1000).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-[#1b1b1b] p-3 rounded-lg border border-dashed border-[#424754] flex-1">
                <p className="text-xs font-sketch text-[#8c909f] italic line-clamp-3">
                  {meta.description || "No blueprint description provided..."}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#424754]/50">
                <div className="text-[10px] font-mono text-[#8c909f]">
                  Creator: {launch.creator.slice(0, 6)}...{launch.creator.slice(-4)}
                </div>
                <button className="text-xs bg-[#adc6ff] text-blue-950 font-bold px-4 py-1.5 rounded hover:bg-[#d0bcff] transition-colors shadow-[2px_2px_0px_0px_#ece1d5]">
                  Trade
                </button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
