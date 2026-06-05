"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import Heatmap from "@/components/Heatmap";
import ArcCatMascot from "@/components/ArcCatMascot";
import { 
  Flame, ShieldCheck, 
  Calendar, 
  Rocket, Code, Wallet, 
  Activity, Hash, Fingerprint, Zap, Target
} from "lucide-react";
import { explorerService, ExplorerTransaction } from "@/services/explorerService";
import { builderScoreService, BuilderStats } from "@/services/builderScoreService";
import { heatmapService, HeatmapDay } from "@/services/heatmapService";



export default function IdentityPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  
  const [txs, setTxs] = useState<ExplorerTransaction[]>([]);
  const [stats, setStats] = useState<BuilderStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setIsLoading(true);
      explorerService.getTransactions(address).then(data => {
        setTxs(data || []);
        setStats(builderScoreService.calculateStats(data || [], address));
        setHeatmapData(heatmapService.generateHeatmapData(data || []));
        setIsLoading(false);
      }).catch(err => {
        console.error(err);
        setIsLoading(false);
      });
    }
  }, [isConnected, address]);

  const onchainScore = stats?.onchainScore || 0;

  // Score tier label
  const getScoreTier = (score: number) => {
    if (score >= 1000) return { label: "Diamond", color: "text-cyan-300", bg: "bg-cyan-400/10", border: "border-cyan-400/40", glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]" };
    if (score >= 500) return { label: "Gold", color: "text-yellow-300", bg: "bg-yellow-400/10", border: "border-yellow-400/40", glow: "shadow-[0_0_20px_rgba(250,204,21,0.15)]" };
    if (score >= 200) return { label: "Silver", color: "text-[#c0c0c0]", bg: "bg-gray-400/10", border: "border-gray-400/40", glow: "shadow-[0_0_20px_rgba(192,192,192,0.1)]" };
    if (score >= 50) return { label: "Bronze", color: "text-orange-300", bg: "bg-orange-400/10", border: "border-orange-400/40", glow: "shadow-[0_0_20px_rgba(251,146,60,0.1)]" };
    return { label: "Newcomer", color: "text-[#8b949e]", bg: "bg-[#8b949e]/10", border: "border-[#8b949e]/40", glow: "" };
  };

  const tier = getScoreTier(onchainScore);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
      {/* Page Header */}
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[#1b1b1b] border-2 border-[#adc6ff] flex items-center justify-center shadow-[0_0_15px_rgba(173,198,255,0.2)]">
          <ArcCatMascot state="happy" size="sm" interactive={false} />
        </div>
        <div>
          <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">
            Arc Chain Activity
          </h1>
          <p className="text-sm font-sans text-[#8c909f] mt-1">
            Your on-chain reputation and builder profile on Arc.
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-10">
          
          {/* ═══ ONCHAIN SCORE — Hero Card ═══ */}
          <div className={`relative overflow-hidden rounded-2xl border-2 ${tier.border} ${tier.bg} ${tier.glow} p-6 md:p-8`}>
            {isLoading && (
              <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Activity className="animate-spin text-[#adc6ff]" size={28} />
              </div>
            )}
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#adc6ff]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e] uppercase tracking-widest">
                  <Fingerprint size={14} className="text-[#adc6ff]" /> Onchain Score
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-6xl font-marker text-[#e6edf3] tracking-tight">{onchainScore.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${tier.color} ${tier.bg} border ${tier.border}`}>
                    <ShieldCheck size={12} /> {tier.label}
                  </span>
                </div>
              </div>

              {/* Score Breakdown Mini */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Interactions", value: `${stats?.uniqueInteractions || 0}`, sub: "×15 pts", icon: <Target size={14} /> },
                  { label: "Active Days", value: `${stats?.activeDays || 0}`, sub: "×10 pts", icon: <Calendar size={14} /> },
                  { label: "Streak", value: `${stats?.streakDays || 0}d`, sub: "×25 pts", icon: <Flame size={14} /> },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center w-24 h-20 rounded-xl bg-[#0d1117]/60 border border-[#30363d] backdrop-blur-sm">
                    <div className="text-[#8b949e] mb-1">{item.icon}</div>
                    <div className="text-lg font-marker text-[#e6edf3]">{item.value}</div>
                    <div className="text-[9px] font-mono text-[#8b949e]">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ HIGHLIGHTED ON-CHAIN STATS GRID ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Unique Interactions — Highlighted */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#adc6ff]/40 bg-gradient-to-br from-[#adc6ff]/10 to-[#131313] p-5 space-y-2 shadow-[0_0_15px_rgba(173,198,255,0.08)]">
              {isLoading && <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm z-10" />}
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#adc6ff]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#adc6ff] uppercase tracking-wider">
                <Target size={14} className="text-[#adc6ff]" /> Unique Interactions
              </div>
              <div className="text-3xl font-marker text-[#e6edf3]">{stats?.uniqueInteractions || 0}</div>
              <div className="text-[10px] font-mono text-[#8b949e]">Distinct contracts</div>
            </div>

            {/* Unique Days — Highlighted */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#39d353]/40 bg-gradient-to-br from-[#39d353]/10 to-[#131313] p-5 space-y-2 shadow-[0_0_15px_rgba(57,211,83,0.08)]">
              {isLoading && <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm z-10" />}
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#39d353]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#39d353] uppercase tracking-wider">
                <Calendar size={14} className="text-[#39d353]" /> Unique Days
              </div>
              <div className="text-3xl font-marker text-[#e6edf3]">{stats?.activeDays || 0}</div>
              <div className="text-[10px] font-mono text-[#8b949e]">Days with activity</div>
            </div>

            {/* Streak — Highlighted */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-orange-400/40 bg-gradient-to-br from-orange-400/10 to-[#131313] p-5 space-y-2 shadow-[0_0_15px_rgba(251,146,60,0.08)]">
              {isLoading && <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm z-10" />}
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-400/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400 uppercase tracking-wider">
                <Flame size={14} className="text-orange-400" /> Current Streak
              </div>
              <div className="text-3xl font-marker text-orange-300 flex items-baseline gap-1">
                {stats?.streakDays || 0}
                <span className="text-sm text-orange-400/60">days</span>
              </div>
              <div className="text-[10px] font-mono text-[#8b949e]">Consecutive activity</div>
            </div>

            {/* Contracts Deployed — Highlighted */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#d0bcff]/40 bg-gradient-to-br from-[#d0bcff]/10 to-[#131313] p-5 space-y-2 shadow-[0_0_15px_rgba(208,188,255,0.08)]">
              {isLoading && <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm z-10" />}
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#d0bcff]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#d0bcff] uppercase tracking-wider">
                <Rocket size={14} className="text-[#d0bcff]" /> Deployed
              </div>
              <div className="text-3xl font-marker text-[#e6edf3]">{stats?.contractsDeployed || 0}</div>
              <div className="text-[10px] font-mono text-[#8b949e]">Contracts created</div>
            </div>
          </div>

          {/* ═══ SECONDARY STATS ROW ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Transactions", value: stats?.totalTransactions || 0, icon: <Hash size={14} className="text-[#8b949e]" /> },
              { label: "Smart Contract Calls", value: stats?.contractsUsed || 0, icon: <Code size={14} className="text-[#8b949e]" /> },
              { label: "First Activity", value: stats?.firstActivity ? new Date(stats.firstActivity).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : "—", icon: <Activity size={14} className="text-[#8b949e]" /> },
              { label: "Last Activity", value: stats?.lastActivity ? new Date(stats.lastActivity).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : "—", icon: <Zap size={14} className="text-green-400" /> },
            ].map((metric, i) => (
              <div key={i} className="rounded-xl border border-dashed border-[#30363d] bg-[#0d1117]/40 p-4 flex flex-col justify-between h-20 hover:border-[#8b949e] transition-colors relative overflow-hidden">
                {isLoading && <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm z-10" />}
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b949e] uppercase">
                  {metric.icon} {metric.label}
                </div>
                <div className="text-lg font-marker text-[#e6edf3]">{metric.value}</div>
              </div>
            ))}
          </div>

          {/* ═══ ACTIVITY HEATMAP — 6 Months ═══ */}
          <div className="relative">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-[#131313]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                  <Activity className="animate-spin text-[#39d353]" size={32} />
                </div>
              )}
              <Heatmap data={heatmapData} title="Arc Chain Activity" />
            </div>
          </div>

          {/* ═══ RECENT ON-CHAIN EVENTS — Only 4 ═══ */}
          <div className="rounded-2xl border-2 border-[#30363d] bg-[#0d1117] p-6 space-y-5">
            <h3 className="font-marker text-xl text-[#e6edf3] flex items-center gap-2 border-b border-dashed border-[#30363d] pb-4">
              <Activity size={20} className="text-green-400" />
              <span>Recent On-Chain Events</span>
              <span className="ml-auto text-[10px] font-mono text-[#8b949e] uppercase">Latest 4</span>
            </h3>
            
            <div className="space-y-4 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <Activity className="animate-spin text-[#adc6ff]" size={24} />
                </div>
              )}
              {txs.length === 0 && !isLoading ? (
                <div className="text-xs font-mono text-[#8b949e] text-center py-6">No on-chain activity found.</div>
              ) : (
                txs.slice(0, 4).map((act, idx) => (
                  <div key={act.hash} className="flex gap-4 items-start group">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        act.contractAddress ? 'bg-[#d0bcff] shadow-[0_0_6px_rgba(208,188,255,0.4)]' :
                        act.to && act.input && act.input !== '0x' ? 'bg-[#adc6ff] shadow-[0_0_6px_rgba(173,198,255,0.4)]' :
                        'bg-[#39d353] shadow-[0_0_6px_rgba(57,211,83,0.3)]'
                      }`} />
                      {idx < Math.min(txs.length, 4) - 1 && (
                        <div className="w-px h-8 bg-[#30363d] mt-1" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-sm font-sans text-[#e6edf3]">
                        {act.contractAddress ? (
                          <span>Deployed Contract <strong className="text-[#d0bcff]">{act.contractAddress.slice(0,6)}...{act.contractAddress.slice(-4)}</strong></span>
                        ) : act.to && act.input && act.input !== '0x' ? (
                          <span>Called Contract <strong className="text-[#adc6ff]">{act.to.slice(0,6)}...{act.to.slice(-4)}</strong></span>
                        ) : act.to ? (
                          <span>Transfer to <strong className="text-[#39d353]">{act.to.slice(0,6)}...{act.to.slice(-4)}</strong></span>
                        ) : (
                          <span>Transaction</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[#8b949e]">{new Date(parseInt(act.timeStamp) * 1000).toLocaleString()}</span>
                        <span className="text-[10px] font-mono text-[#30363d]">|</span>
                        <span className="text-[10px] font-mono text-[#8b949e] truncate">{act.hash.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      ) : (
        <div className="sketch-card p-10 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
          <ArcCatMascot state="sleeping" size="lg" />
          <h2 className="font-marker text-2xl text-[#ece1d5]">Identity Locked</h2>
          <p className="text-sm text-[#bec6e0] max-w-sm">
            Please connect your wallet to generate your Arc Identity profile and compile your on-chain achievements.
          </p>
          <button onClick={() => open()} className="sketch-btn sketch-btn-primary font-marker text-sm px-6 py-2">
            <span>Connect Wallet</span>
          </button>
        </div>
      )}
    </div>
  );
}
