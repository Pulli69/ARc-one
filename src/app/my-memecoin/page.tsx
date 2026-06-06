"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Coins, Shield, Construction, Activity } from "lucide-react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { useAppKit } from "@reown/appkit/react";
import ArcCatMascot from "@/components/ArcCatMascot";
import { FACTORY_ADDRESS, FACTORY_ABI, ERC20_ABI } from "@/config/contractConfig";

// ─── Sub-component: one token card reading its own data ────────────────────────
function MyTokenCard({ tokenAddress }: { tokenAddress: string }) {
  const publicClient = usePublicClient();

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

  const { data: curveState } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getCurveState",
    args: [tokenAddress as `0x${string}`],
  });

  const { data: progress } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getGraduationProgress",
    args: [tokenAddress as `0x${string}`],
  });

  const [meta, setMeta] = useState<{ description?: string; image?: string; timestamp?: number }>({});

  useEffect(() => {
    if (!publicClient) return;
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
          { indexed: false, name: "supply", type: "uint256" },
          { indexed: false, name: "metadataURI", type: "string" },
          { indexed: false, name: "timestamp", type: "uint256" },
        ],
      },
      args: { tokenAddress: tokenAddress as `0x${string}` },
      fromBlock: BigInt(0),
      toBlock: "latest",
    }).then((logs) => {
      if (cancelled || !logs[0]) return;
      const { metadataURI, timestamp } = (logs[0] as any).args;
      let description: string | undefined;
      let image: string | undefined;
      try {
        const m = JSON.parse(metadataURI);
        description = m.description || metadataURI;
        image = m.image;
      } catch {
        description = metadataURI;
      }
      if (!cancelled) setMeta({ description, image, timestamp: Number(timestamp) });
    }).catch((err) => {
      console.error("Error fetching TokenCreated logs:", err);
    });
    return () => { cancelled = true; };
  }, [publicClient, tokenAddress]);

  const nameStr = (name as string) ?? "";
  const symbolStr = (symbol as string) ?? "";
  
  const curve = curveState as any;
  const progressPct = progress ? Math.min(100, Number(progress) / 100) : 0;
  const realUsdcRaised = curve ? Number(formatUnits(curve.realUsdcAccumulated, 6)) : 0;
  const currentPrice = curve
    ? Number(formatUnits(curve.virtualUsdcReserve, 6)) /
      Number(formatUnits(curve.virtualTokenReserve, 18))
    : 0;
  const marketCap = currentPrice * 1_000_000_000;

  return (
    <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:border-[#adc6ff]/50 transition-all">
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

      <div className="bg-[#131313] p-3 rounded-lg border border-dashed border-[#424754] flex-1 min-h-[60px]">
        <p className="text-xs font-mono text-[#8c909f] italic line-clamp-3">
          {meta.description || "No description provided..."}
        </p>
      </div>

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

      <div className="text-[10px] font-mono text-[#adc6ff] bg-[#131313] border border-[#424754] rounded-lg px-3 py-2 break-all">
        {tokenAddress}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#424754]/50">
        <div className="text-[10px] font-mono text-[#8c909f]">Your Contract</div>
        <Link
          href={`/token/${tokenAddress}`}
          className="text-xs bg-[#adc6ff] text-blue-950 font-bold px-4 py-1.5 rounded-lg hover:bg-[#d0bcff] transition-colors shadow-[2px_2px_0px_0px_#ece1d5]"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyMemecoinsPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  // Use getCreatorTokens — reliable on-chain read, no event log dependency
  const { data: myTokensRaw, isLoading } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getCreatorTokens",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const myTokens: string[] = ((myTokensRaw as string[]) ?? []).slice().reverse();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide">My Laboratory Cabinet</h1>
          <p className="text-sm font-sans text-[#8c909f] mt-1">Browse and manage all the memecoins you've launched.</p>
        </div>
        <Link
          href="/launch"
          className="px-5 py-2.5 bg-[#adc6ff] text-blue-950 font-bold text-sm rounded-xl hover:bg-[#d0bcff] transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_#ece1d5]"
        >
          <Plus size={16} /> Launch New
        </Link>
      </div>

      {isConnected ? (
        <div className="space-y-8">
          <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-4 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-[#adc6ff]" />
              <span className="text-xs font-mono text-[#bec6e0]">
                Cabinet Total: <strong className="text-[#ece1d5]">{myTokens.length} memecoins</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8c909f]">
              <Shield size={14} className="text-green-500" />
              <span>Deployed under ArcPumpFactory</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8c909f]">
              <Activity className="animate-spin mb-4" size={32} />
              <p className="font-mono text-sm">Opening laboratory cabinet...</p>
            </div>
          ) : myTokens.length === 0 ? (
            <div className="border-2 border-dashed border-[#424754] rounded-2xl p-16 flex flex-col items-center text-center space-y-4">
              <Construction size={48} className="text-[#8c909f]" />
              <h2 className="font-marker text-2xl text-[#ece1d5]">Cabinet is Empty</h2>
              <p className="font-mono text-sm text-[#8c909f]">
                You haven't forged any memecoins yet. Head to the Workshop!
              </p>
              <Link
                href="/launch"
                className="mt-2 px-6 py-2.5 bg-[#adc6ff] text-blue-950 font-bold text-sm rounded-xl hover:bg-[#d0bcff] transition-colors shadow-[2px_2px_0px_0px_#ece1d5]"
              >
                Go to Workshop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTokens.map((addr) => (
                <MyTokenCard key={addr} tokenAddress={addr} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#424754] rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto mt-12">
          <ArcCatMascot state="sleeping" size="lg" />
          <h2 className="font-marker text-2xl text-[#ece1d5]">Cabinet Locked</h2>
          <p className="text-sm font-mono text-[#8c909f] max-w-sm">
            Connect your wallet to load your private memecoin collection.
          </p>
          <button
            onClick={() => open()}
            className="px-6 py-2.5 bg-[#adc6ff] text-blue-950 font-bold text-sm rounded-xl hover:bg-[#d0bcff] transition-colors shadow-[2px_2px_0px_0px_#ece1d5]"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
