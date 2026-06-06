"use client";

import { useMemo, useEffect, useState } from "react";
import { Trophy, Activity } from "lucide-react";
import ArcCatMascot from "@/components/ArcCatMascot";
import { usePublicClient } from "wagmi";
import { FACTORY_ADDRESS } from "@/config/contractConfig";

interface CreatorStat {
  address: string;
  tokens: number;
  latestLaunch: number;
}

export default function LeaderboardPage() {
  const publicClient = usePublicClient();
  const [leaderboard, setLeaderboard] = useState<CreatorStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const CHUNK_SIZE = 10000n; // Common max range for testnets
        const MAX_BLOCKS = 100000n; // Cover roughly ~2.7 days of history (at 2s/block)
        const startBlock = currentBlock > MAX_BLOCKS ? currentBlock - MAX_BLOCKS : 0n;

        let allLogs: any[] = [];
        
        // Fetch backwards from latest so we get recent stuff first
        for (let b = currentBlock; b >= startBlock; b -= CHUNK_SIZE) {
          if (cancelled) break;
          const fromB = (b - CHUNK_SIZE < startBlock) ? startBlock : (b - CHUNK_SIZE + 1n);
          
          try {
            const logs = await publicClient.getLogs({
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
              fromBlock: fromB,
              toBlock: b,
            });
            allLogs.push(...logs);
          } catch (err) {
            console.warn(`Failed to fetch logs for block range ${fromB}-${b}`, err);
          }
        }

        if (cancelled) return;

        const creatorMap: Record<string, CreatorStat> = {};
        for (const log of allLogs) {
          const { creator, timestamp } = (log as any).args;
          if (!creatorMap[creator]) {
            creatorMap[creator] = { address: creator, tokens: 0, latestLaunch: 0 };
          }
          creatorMap[creator].tokens += 1;
          const ts = Number(timestamp);
          if (ts > creatorMap[creator].latestLaunch) {
            creatorMap[creator].latestLaunch = ts;
          }
        }

        const sorted = Object.values(creatorMap).sort((a, b) => {
          if (b.tokens !== a.tokens) return b.tokens - a.tokens;
          return b.latestLaunch - a.latestLaunch;
        });

        if (!cancelled) setLeaderboard(sorted);
      } catch (e) {
        console.error("Leaderboard fetch failed:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [publicClient]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">Leaderboard</h1>
          <p className="text-sm font-sans text-[#8c909f] mt-1">
            Track top builders launching active curves.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono border border-[#424754] rounded-full px-3 py-1.5 text-[#8c909f]">
          <Trophy size={14} className="text-yellow-400" />
          <span>Top Cat Season 1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8c909f]">
              <Activity className="animate-spin mb-4" size={32} />
              <p className="font-mono text-sm">Fetching on-chain rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="border-2 border-dashed border-[#424754] rounded-2xl p-12 flex flex-col items-center text-center space-y-4">
              <Trophy size={48} className="text-[#8c909f]" />
              <h2 className="font-marker text-2xl text-[#ece1d5]">No Leaders Yet!</h2>
              <p className="font-mono text-sm text-[#8c909f]">Be the first to launch a token and claim the #1 spot!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((builder, i) => (
                <div
                  key={builder.address}
                  className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-5 flex items-center justify-between hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-marker text-lg ${
                      i === 0 ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"
                      : i === 1 ? "bg-gray-400/20 text-gray-300 border border-gray-400/40"
                      : i === 2 ? "bg-orange-400/20 text-orange-400 border border-orange-400/40"
                      : "bg-[#131313] text-[#8c909f] border border-[#424754]"
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <div className="font-mono text-xs md:text-sm text-[#ece1d5] break-all">{builder.address}</div>
                      <div className="font-mono text-[10px] text-[#8c909f] mt-0.5">
                        Latest: {builder.latestLaunch > 0 ? new Date(builder.latestLaunch * 1000).toLocaleDateString() : "—"}
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

        <div className="space-y-6">
          <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-5 text-center space-y-4">
            <h4 className="font-marker text-sm text-[#ece1d5]">Status Report</h4>
            <ArcCatMascot state="thinking" size="md" />
            <p className="text-xs font-mono text-[#bec6e0] leading-relaxed">
              "Rankings calculated directly from on-chain events. Meow."
            </p>
          </div>

          <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-5 space-y-3 text-xs">
            <h4 className="font-marker text-xs text-[#8c909f] uppercase tracking-wider">Scoring Rubric</h4>
            <div className="space-y-2 font-mono text-[#8c909f]">
              <div className="flex justify-between"><span>Deploy Token:</span><span>+100 XP</span></div>
              <div className="flex justify-between"><span>Transactions:</span><span>+10 XP</span></div>
              <div className="flex justify-between"><span>Daily Streak:</span><span>+50 XP/day</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
