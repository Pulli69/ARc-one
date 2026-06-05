"use client";

import { Plus, Coins, Calendar, ArrowUpRight, Shield, Construction, Activity } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import ArcCatMascot from "@/components/ArcCatMascot";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/config/contractConfig";

export default function MyMemecoinsPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  const { data: rawLaunches, isLoading } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getCreatorLaunches",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
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
      {/* Laboratory Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">
            My Laboratory Cabinet
          </h1>
          <p className="text-sm font-sans text-[#8c909f] mt-1">
            Browse and manage all the contract memecoins you've launched.
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-8">

          {/* Collection Status Bar */}
          {/* Collection Status Bar */}
          <div className="sketch-card p-4 flex flex-wrap gap-6 items-center justify-between bg-[#242424]/20">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-[#adc6ff]" />
              <span className="text-xs font-mono text-[#bec6e0]">
                Cabinet Total: <strong className="text-[#ece1d5]">{launches.length} memecoins</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8c909f]">
              <Shield size={14} className="text-green-500" />
              <span>Contracts compiled & deployed under Factory</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8c909f]">
              <Activity className="animate-spin mb-4" size={32} />
              <p className="font-sketch">Opening laboratory cabinet...</p>
            </div>
          ) : launches.length === 0 ? (
            <div className="sketch-card p-12 mt-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 rounded-full bg-[#131313] border-2 border-dashed border-[#8c909f]">
                <Construction size={48} className="text-[#8c909f]" />
              </div>
              <div className="max-w-md">
                <h2 className="font-marker text-2xl text-[#ece1d5] mb-2">Cabinet is Empty</h2>
                <p className="font-sketch text-[#8c909f] leading-relaxed">
                  You haven't forged any memecoins yet. Head over to the Workshop to launch your first token on Arc!
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
                      Your Contract
                    </div>
                    <button className="text-xs bg-[#adc6ff] text-blue-950 font-bold px-4 py-1.5 rounded hover:bg-[#d0bcff] transition-colors shadow-[2px_2px_0px_0px_#ece1d5]">
                      Manage
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}

        </div>
      ) : (
        <div className="sketch-card p-10 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto mt-12">
          <ArcCatMascot state="sleeping" size="lg" />
          <h2 className="font-marker text-2xl text-[#ece1d5]">Cabinet Locked</h2>
          <p className="text-sm text-[#bec6e0] max-w-sm">
            Please connect your wallet to load your private memecoin collections.
          </p>
          <button onClick={() => open()} className="sketch-btn sketch-btn-primary font-marker text-sm px-6 py-2">
            <span>Connect Wallet</span>
          </button>
        </div>
      )}
    </div>
  );
}
