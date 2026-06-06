"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { parseUnits, formatUnits } from "viem";
import {
  ArrowLeft,
  TrendingUp,
  ArrowDown,
  Wallet,
  CheckCircle2,
  Activity,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { FACTORY_ADDRESS, FACTORY_ABI, ERC20_ABI, USDC_ADDRESS } from "@/config/contractConfig";

interface CurveState {
  virtualUsdcReserve: bigint;
  virtualTokenReserve: bigint;
  realUsdcAccumulated: bigint;
  tokensSold: bigint;
  tokenGraduationThreshold: bigint;
  graduated: boolean;
  pendingDexPool: boolean;
}

interface TokenMeta {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creator?: string;
}

export default function TokenTradePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: tokenAddress } = use(params);
  const { address: userAddress, isConnected } = useAccount();
  const { open } = useAppKit();
  const publicClient = usePublicClient();

  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  // name/symbol come from direct ERC20 reads — instant, no event log needed
  const [metaExtra, setMetaExtra] = useState<{ description?: string; image?: string; creator?: string }>({});
  const [txStatus, setTxStatus] = useState<"idle" | "approving" | "trading" | "success" | "error">("idle");
  const [txError, setTxError] = useState<string>("");

  const { writeContractAsync } = useWriteContract();

  // ─── Direct ERC20 reads for name & symbol (instant, no event log) ────────
  const { data: tokenNameRaw } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "name" as any,
  });
  const { data: tokenSymbolRaw } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol" as any,
  });

  const tokenName   = (tokenNameRaw   as string) || "";
  const tokenSymbol = (tokenSymbolRaw as string) || "";

  // Combined meta object — name/symbol always from chain, rest from events
  const tokenMeta: TokenMeta = {
    name:        tokenName   || "Loading...",
    symbol:      tokenSymbol || "...",
    description: metaExtra.description,
    image:       metaExtra.image,
    creator:     metaExtra.creator,
  };

  // ─── Read curve state ─────────────────────────────────────────────────────
  const { data: curveStateRaw, refetch: refetchCurve } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getCurveState",
    args: [tokenAddress as `0x${string}`],
  });

  const { data: progressRaw, refetch: refetchProgress } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getGraduationProgress",
    args: [tokenAddress as `0x${string}`],
  });

  const curve = curveStateRaw as CurveState | undefined;
  const progressBps = progressRaw ? Number(progressRaw) : 0;
  const progressPct = Math.min(100, progressBps / 100);

  // ─── Buy / sell quote ────────────────────────────────────────────────────
  const parsedAmount = (() => {
    try { return parseUnits(amount || "0", mode === "buy" ? 6 : 18); } catch { return BigInt(0); }
  })();

  const { data: buyQuoteRaw } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getBuyQuote",
    args: [tokenAddress as `0x${string}`, parsedAmount],
    query: { enabled: mode === "buy" && parsedAmount > 0n },
  });

  const { data: sellQuoteRaw } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getSellQuote",
    args: [tokenAddress as `0x${string}`, parsedAmount],
    query: { enabled: mode === "sell" && parsedAmount > 0n },
  });

  const buyQuote = buyQuoteRaw as [bigint, bigint] | undefined;
  const sellQuote = sellQuoteRaw as [bigint, bigint] | undefined;

  // ─── User token balance ───────────────────────────────────────────────────
  const { data: tokenBalanceRaw } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress },
  });

  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress },
  });

  const tokenBalance = tokenBalanceRaw ? formatUnits(tokenBalanceRaw as bigint, 18) : "0";
  const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : "0";

  // ─── Fetch extra metadata (description/image/creator) from event logs ────
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
      const { metadataURI, creator } = (logs[0] as any).args;
      let description: string | undefined;
      let image: string | undefined;
      try {
        if (metadataURI?.startsWith("{")) {
          const m = JSON.parse(metadataURI);
          description = m.description;
          image = m.image;
        } else {
          description = metadataURI;
        }
      } catch {}
      if (!cancelled) setMetaExtra({ description, image, creator });
    }).catch(() => {}); // silently ignore RPC range errors

    return () => { cancelled = true; };
  }, [publicClient, tokenAddress]);


  // ─── Execute buy ──────────────────────────────────────────────────────────
  const handleBuy = async () => {
    if (!isConnected) { open(); return; }
    if (!parsedAmount || parsedAmount === 0n) return;
    setTxError("");

    try {
      // 1. Approve USDC
      setTxStatus("approving");
      await writeContractAsync({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [FACTORY_ADDRESS as `0x${string}`, parsedAmount],
      });

      // 2. Buy tokens (0.5% slippage tolerance)
      setTxStatus("trading");
      const minOut = buyQuote ? (buyQuote[0] * 995n) / 1000n : 0n;
      await writeContractAsync({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "buyTokens",
        args: [tokenAddress as `0x${string}`, parsedAmount, minOut],
      });

      setTxStatus("success");
      setAmount("");
      setTimeout(() => { refetchCurve(); refetchProgress(); }, 2000);
    } catch (e: any) {
      console.error(e);
      setTxError(e?.shortMessage || e?.message || "Transaction failed");
      setTxStatus("error");
    }
  };

  // ─── Execute sell ─────────────────────────────────────────────────────────
  const handleSell = async () => {
    if (!isConnected) { open(); return; }
    if (!parsedAmount || parsedAmount === 0n) return;
    setTxError("");

    try {
      setTxStatus("trading");
      const minOut = sellQuote ? (sellQuote[0] * 995n) / 1000n : 0n;
      await writeContractAsync({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "sellTokens",
        args: [tokenAddress as `0x${string}`, parsedAmount, minOut],
      });

      setTxStatus("success");
      setAmount("");
      setTimeout(() => { refetchCurve(); refetchProgress(); }, 2000);
    } catch (e: any) {
      console.error(e);
      setTxError(e?.shortMessage || e?.message || "Transaction failed");
      setTxStatus("error");
    }
  };

  const isExecuting = txStatus === "approving" || txStatus === "trading";

  // ─── Derived curve stats ──────────────────────────────────────────────────
  const realUsdcRaised = curve ? Number(formatUnits(curve.realUsdcAccumulated, 6)) : 0;
  const graduationTarget = curve ? Number(formatUnits(curve.tokenGraduationThreshold, 6)) : 3;
  const currentPrice = curve
    ? Number(formatUnits(curve.virtualUsdcReserve, 6)) /
      Number(formatUnits(curve.virtualTokenReserve, 18))
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Back Link */}
      <Link href="/explore" className="inline-flex items-center gap-2 text-[#8c909f] hover:text-[#ece1d5] transition-colors text-sm font-mono mb-6">
        <ArrowLeft size={16} /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: Token Info + Curve ──────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Token Header */}
          <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-[#424754] flex items-center justify-center bg-[#131313] overflow-hidden shrink-0">
              {tokenMeta.image ? (
                <img src={tokenMeta.image} alt={tokenMeta.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-mono text-2xl text-[#adc6ff] font-bold">
                  {tokenMeta.symbol?.charAt(0) ?? "?"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-marker text-2xl text-[#ece1d5]">{tokenMeta.name}</h1>
              <span className="font-mono text-sm text-[#adc6ff]">${tokenMeta.symbol}</span>
              {tokenMeta.creator && (
                <p className="text-[11px] font-mono text-[#8c909f] mt-1">
                  by {tokenMeta.creator.slice(0, 8)}...{tokenMeta.creator.slice(-6)}
                </p>
              )}
            </div>
            {curve?.graduated && (
              <div className="bg-green-950/40 border border-green-600 text-green-400 text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Graduated
              </div>
            )}
          </div>

          {/* Description */}
          {tokenMeta.description && (
            <div className="bg-[#131313] border border-dashed border-[#424754] rounded-2xl p-5">
              <p className="text-sm font-mono text-[#8c909f] leading-relaxed">{tokenMeta.description}</p>
            </div>
          )}

          {/* Bonding Curve Progress */}
          <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-marker text-lg text-[#ece1d5] flex items-center gap-2">
                <TrendingUp size={18} className="text-[#adc6ff]" />
                Bonding Curve
              </h2>
              <span className="font-mono text-sm text-[#adc6ff] font-bold">{progressPct.toFixed(1)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#131313] rounded-full h-4 border border-[#424754] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 100
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : "linear-gradient(90deg, #adc6ff, #d0bcff)",
                }}
              />
            </div>

            <div className="flex justify-between text-xs font-mono text-[#8c909f]">
              <span>{realUsdcRaised.toFixed(2)} USDC raised</span>
              <span>Target: {graduationTarget.toFixed(2)} USDC</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#adc6ff]/10 border border-[#adc6ff]/30 rounded-xl p-3 md:col-span-2">
                <span className="text-[10px] font-mono text-[#adc6ff] block uppercase tracking-wider">Market Cap</span>
                <span className="text-xl font-marker text-[#ece1d5] mt-1 block">{(currentPrice * 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
              </div>
              <div className="bg-[#131313] border border-[#424754] rounded-xl p-3">
                <span className="text-[10px] font-mono text-[#8c909f] block">Current Price</span>
                <span className="text-sm font-mono text-[#ece1d5] font-bold mt-1 block">{currentPrice.toFixed(8)} USDC</span>
              </div>
              <div className="bg-[#131313] border border-[#424754] rounded-xl p-3">
                <span className="text-[10px] font-mono text-[#8c909f] block">USDC Raised</span>
                <span className="text-sm font-mono text-[#ece1d5] font-bold mt-1 block">{realUsdcRaised.toFixed(4)} USDC</span>
              </div>
            </div>
          </div>

          {/* Contract Address */}
          <div className="bg-[#131313] border border-[#424754] rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#8c909f] mb-1">Token Contract</p>
            <p className="text-xs font-mono text-[#adc6ff] break-all">{tokenAddress}</p>
          </div>
        </div>

        {/* ── Right: Trade Panel ────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-[#1b1b1b] border border-[#424754] rounded-2xl p-6 space-y-5 sticky top-6">
            <h2 className="font-marker text-xl text-[#ece1d5]">Trade</h2>

            {/* Buy / Sell Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[#424754]">
              <button
                onClick={() => { setMode("buy"); setAmount(""); setTxStatus("idle"); }}
                className={`flex-1 py-2.5 text-sm font-bold font-mono transition-colors ${
                  mode === "buy" ? "bg-[#adc6ff] text-blue-950" : "bg-[#131313] text-[#8c909f] hover:text-[#ece1d5]"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => { setMode("sell"); setAmount(""); setTxStatus("idle"); }}
                className={`flex-1 py-2.5 text-sm font-bold font-mono transition-colors ${
                  mode === "sell" ? "bg-red-500 text-white" : "bg-[#131313] text-[#8c909f] hover:text-[#ece1d5]"
                }`}
              >
                Sell
              </button>
            </div>

            {/* Balance */}
            {isConnected && (
              <div className="flex justify-between text-xs font-mono text-[#8c909f] px-1">
                <span>USDC Balance: <span className="text-[#ece1d5]">{Number(usdcBalance).toFixed(4)}</span></span>
                <span>Token Balance: <span className="text-[#ece1d5]">{Number(tokenBalance).toFixed(2)}</span></span>
              </div>
            )}

            {/* Input */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8c909f]">
                {mode === "buy" ? "You pay (USDC)" : `You sell ($${tokenMeta.symbol})`}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setTxStatus("idle"); }}
                  placeholder="0.00"
                  className="w-full bg-[#131313] border border-[#424754] rounded-xl px-4 py-3 text-lg font-mono text-[#ece1d5] placeholder-[#424754] focus:outline-none focus:border-[#adc6ff]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8c909f]">
                  {mode === "buy" ? "USDC" : tokenMeta.symbol}
                </span>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2 pt-1">
                {(mode === "buy" ? ["0.1", "0.5", "1", "5"] : ["25%", "50%", "100%"]).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      if (mode === "buy") {
                        setAmount(v);
                      } else {
                        const pct = parseInt(v) / 100;
                        setAmount((Number(tokenBalance) * pct).toFixed(4));
                      }
                    }}
                    className="flex-1 py-1 text-[10px] font-mono bg-[#131313] border border-[#424754] rounded-lg text-[#8c909f] hover:border-[#adc6ff] hover:text-[#adc6ff] transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="p-2 bg-[#131313] border border-[#424754] rounded-lg">
                <ArrowDown size={16} className="text-[#8c909f]" />
              </div>
            </div>

            {/* Output Quote */}
            <div className="bg-[#131313] border border-[#424754] rounded-xl p-4 space-y-2">
              <p className="text-xs font-mono text-[#8c909f]">
                {mode === "buy" ? `You receive ($${tokenMeta.symbol})` : "You receive (USDC)"}
              </p>
              <p className="text-2xl font-mono text-[#ece1d5] font-bold">
                {parsedAmount > 0n
                  ? mode === "buy"
                    ? buyQuote ? Number(formatUnits(buyQuote[0], 18)).toFixed(4) : "..."
                    : sellQuote ? Number(formatUnits(sellQuote[0], 6)).toFixed(6) : "..."
                  : "0.00"}
              </p>
              {parsedAmount > 0n && (
                <p className="text-[10px] font-mono text-[#8c909f]">
                  Protocol fee:{" "}
                  {mode === "buy"
                    ? buyQuote ? Number(formatUnits(buyQuote[1], 6)).toFixed(6) + " USDC" : "..."
                    : sellQuote ? Number(formatUnits(sellQuote[1], 6)).toFixed(6) + " USDC" : "..."}
                  {" "}(0.5%)
                </p>
              )}
            </div>

            {/* Status / Error */}
            {txStatus === "success" && (
              <div className="flex items-center gap-2 text-green-400 text-xs font-mono bg-green-950/30 border border-green-600 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={14} /> Transaction confirmed!
              </div>
            )}
            {txStatus === "error" && txError && (
              <div className="flex items-start gap-2 text-red-400 text-xs font-mono bg-red-950/30 border border-red-600 rounded-xl px-4 py-2.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span className="break-all">{txError}</span>
              </div>
            )}

            {/* Submit Button */}
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="w-full py-3.5 bg-[#adc6ff] text-blue-950 font-bold font-mono text-sm rounded-xl hover:bg-[#d0bcff] transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#ece1d5]"
              >
                <Wallet size={16} /> Connect Wallet
              </button>
            ) : curve?.graduated ? (
              <button
                disabled
                className="w-full py-3.5 bg-[#242424] text-[#8c909f] font-mono text-sm rounded-xl cursor-not-allowed border border-[#424754]"
              >
                Token Graduated — Trade on DEX
              </button>
            ) : (
              <button
                onClick={mode === "buy" ? handleBuy : handleSell}
                disabled={isExecuting || !amount || Number(amount) <= 0}
                className={`w-full py-3.5 font-bold font-mono text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#ece1d5] disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === "buy"
                    ? "bg-[#adc6ff] text-blue-950 hover:bg-[#d0bcff]"
                    : "bg-red-500 text-white hover:bg-red-400"
                }`}
              >
                {isExecuting ? (
                  <>
                    <Activity size={16} className="animate-spin" />
                    {txStatus === "approving" ? "Approving USDC..." : "Confirming Trade..."}
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    {mode === "buy" ? `Buy $${tokenMeta.symbol}` : `Sell $${tokenMeta.symbol}`}
                  </>
                )}
              </button>
            )}

            <p className="text-center text-[10px] font-mono text-[#8c909f]">
              0.5% protocol fee · Slippage tolerance 0.5%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
