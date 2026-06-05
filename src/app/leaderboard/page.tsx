"use client";

import { useMemo } from "react";
import { Trophy, Construction, Activity } from "lucide-react";
import ArcCatMascot from "@/components/ArcCatMascot";
import { useReadContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/config/contractConfig";

export default function LeaderboardPage() {
  const { data: rawLaunches, isLoading } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getAllLaunches",
  });

  const leaderboard = useMemo(() => {
    if (!rawLaunches) return [];
    const launches = rawLaunches as any[];
    
    // Group by creator
    const creatorMap: Record<string, { address: string; tokens: number; latestLaunch: number }> = {};
    
    for (const launch of launches) {
      const creator = launch.creator;
      if (!creatorMap[creator]) {
        creatorMap[creator] = { address: creator, tokens: 0, latestLaunch: 0 };
      }
      creatorMap[creator].tokens += 1;
      const ts = Number(launch.timestamp);
      if (ts > creatorMap[creator].latestLaunch) {
        creatorMap[creator].latestLaunch = ts;
      }
    }

    // Convert to array and sort by tokens descending, then latestLaunch descending
    return Object.values(creatorMap).sort((a, b) => {
      if (b.tokens !== a.tokens) return b.tokens - a.tokens;
      return b.latestLaunch - a.latestLaunch;
    });
  }, [rawLaunches]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">
            Leaderboard
          </h1>
          <p className="text-sm font-sans text-[#8c909f] mt-1">
            Track top builders launching active curves and drawing code.
          </p>
        </div>

        {/* Small top badge banner */}
        <div className="sticker sticker-purple flex items-center gap-1.5 text-xs opacity-100">
          <Trophy size={14} className="text-yellow-400" />
          <span>Top Cat Season 1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Main List */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8c909f]">
              <Activity className="animate-spin mb-4" size={32} />
              <p className="font-sketch">Calculating scores on Arc Testnet...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="sketch-card p-12 flex flex-col items-center justify-center text-center space-y-6">
               <Trophy size={48} className="text-[#8c909f]" />
               <h2 className="font-marker text-2xl text-[#ece1d5] mb-2">No Leaders Yet!</h2>
               <p className="font-sketch text-[#8c909f]">Be the first to launch a token and claim the #1 spot!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((builder, i) => (
                <div key={builder.address} className="sketch-card p-5 flex items-center justify-between hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-marker text-lg ${i === 0 ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : i === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/40' : i === 2 ? 'bg-orange-400/20 text-orange-400 border border-orange-400/40' : 'bg-[#131313] text-[#8c909f] border border-[#424754]'}`}>
                      #{i + 1}
                    </div>
                    <div>
                      <div className="font-mono text-xs md:text-sm text-[#ece1d5] break-all">{builder.address}</div>
                      <div className="font-sketch text-xs text-[#8c909f] mt-1">
                        Latest Launch: {new Date(builder.latestLaunch * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <div className="font-marker text-xl text-[#adc6ff]">{builder.tokens}</div>
                    <div className="font-mono text-[10px] text-[#8c909f] uppercase tracking-wider">Tokens</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Cat commentary and stats */}
        <div className="space-y-6">
          <div className="sketch-card-secondary p-5 text-center space-y-4">
            <h4 className="font-marker text-sm text-[#ece1d5]">Status Report</h4>
            
            <ArcCatMascot state="thinking" size="md" />

            <p className="text-xs font-sketch text-[#bec6e0] leading-relaxed">
              "The Wizards are preparing for the competition! Meow. Rankings will be calculated directly from on-chain activity."
            </p>
          </div>

          <div className="sketch-card p-5 space-y-3 text-xs">
            <h4 className="font-marker text-xs text-[#8c909f] uppercase tracking-wider">Scoring Rubric</h4>
            <div className="space-y-2 font-mono text-[#8c909f]">
              <div className="flex justify-between">
                <span>Deploy Token:</span>
                <span>+100 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions:</span>
                <span>+10 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Streak:</span>
                <span>+50 XP/day</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
