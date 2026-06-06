"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import ArcCatMascot from "@/components/ArcCatMascot";
import { FACTORY_ADDRESS, FACTORY_ABI, USDC_ADDRESS, ERC20_ABI } from "@/config/contractConfig";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, CheckCircle2, Shield, AlertCircle, Link as LinkIcon, MessageCircle } from "lucide-react";

export default function LaunchPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  // Supply is hardcoded to 1,000,000,000 in the new ArcPumpFactory contract

  const [isLaunching, setIsLaunching] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  // Tracks which step we are on: idle | approving | launching
  const [launchStep, setLaunchStep] = useState<"idle" | "approving" | "launching">("idle");

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Read the launch fee from the contract
  const { data: launchFeeRaw } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "launchFee",
  });
  const launchFee = (launchFeeRaw as bigint) ?? BigInt(100000); // default 0.1 USDC (6 dec)

  // Read current USDC allowance granted to the factory
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", FACTORY_ADDRESS as `0x${string}`],
    query: { enabled: !!address },
  });
  const currentAllowance = (allowanceRaw as bigint) ?? BigInt(0);

  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string | null>(null);

  const [showLogoOptions, setShowLogoOptions] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingMouse, setIsDrawingMouse] = useState(false);

  // Watch for transaction success
  React.useEffect(() => {
    if (isConfirmed && receipt) {
      let tokenAddr = null;
      const factoryLog = receipt.logs.find(
        (log: any) => log.address.toLowerCase() === (FACTORY_ADDRESS as string).toLowerCase() && log.topics.length >= 3
      );

      if (factoryLog && factoryLog.topics[2]) {
        tokenAddr = "0x" + factoryLog.topics[2].slice(26);
        setDeployedTokenAddress(tokenAddr);
      }

      setIsLaunching(false);
      setLaunchSuccess(true);

      if (tokenAddr && typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddr,
              symbol: symbol,
              decimals: 18,
              image: logoImage || "",
            },
          },
        }).catch(console.error);
      }
    }
  }, [isConfirmed, receipt, symbol, logoImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
        setShowLogoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawingMouse(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMouse) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#ece1d5';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawingMouse(false);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setLogoImage(canvas.toDataURL());
      setIsDrawing(false);
      setShowLogoOptions(false);
    }
  };

  const formatSupply = (val: string) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, '') + "K";
    return num.toString();
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return alert("Please connect wallet first!");
    if (!publicClient) return;

    setIsLaunching(true);
    setLaunchStep("idle");

    try {
      const metadataObj = { description, image: logoImage || "" };
      const metadataURI = JSON.stringify(metadataObj);

      // ── Step 1: Check USDC allowance ────────────────────────────────────
      const { data: freshAllowance } = await refetchAllowance();
      const allowance = (freshAllowance as bigint) ?? BigInt(0);

      if (allowance < launchFee) {
        // ── Step 2: Approve USDC ───────────────────────────────────────────
        setLaunchStep("approving");
        const approveTx = await writeContractAsync({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [FACTORY_ADDRESS as `0x${string}`, launchFee],
        });

        // Wait for approval to be confirmed on-chain
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      // ── Step 3: Launch the memecoin ────────────────────────────────────
      setLaunchStep("launching");
      await writeContractAsync({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "launchMemecoin",
        args: [name, symbol, metadataURI],
      });
      // The useEffect will handle success state once launchMemecoin is confirmed
    } catch (error: any) {
      console.error(error);
      setIsLaunching(false);
      setLaunchStep("idle");
      alert(error?.shortMessage || error?.message || "Failed to launch token. Check console for details.");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8 relative">
      {/* Header */}
      <div className="space-y-2 relative">
        <h1 className="font-marker text-4xl md:text-5xl text-[#adc6ff] tracking-wide">
          Arc Cat's Workshop
        </h1>
        <p className="text-sm font-sans text-[#bec6e0] max-w-xl leading-relaxed">
          Draft your smart contract blueprints. No magic needed, just good old-fashioned engineering!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Form Setup */}
        <div className="lg:col-span-7 relative">

          {/* Hand-drawn frame around the form */}
          <div className="absolute -inset-6 border-2 border-dashed border-[#8c909f]/40 rounded-3xl pointer-events-none"
            style={{ borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px" }} />

          {/* "Start here!" annotation */}
          <div className="absolute -top-10 -left-16 hidden md:block">
            <span className="font-sketch text-sm text-[#bec6e0] italic tracking-wide">Start here!</span>
            <svg className="w-5 h-5 text-[#bec6e0] ml-4 transform rotate-[130deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M 4,4 Q 2,12 8,18" />
              <path d="M 5,16 L 8,18 L 11,15" />
            </svg>
          </div>

          {/* Form */}
          <form onSubmit={handleLaunch} className="space-y-8 relative z-10 p-2">
            <div className="text-right pb-2">
              <span className="font-sketch text-xs text-[#8c909f] italic">Blueprint v1.0</span>
            </div>

            {/* Logo / Identity */}
            <div className="flex gap-6 items-center">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-[#8c909f] border-dashed flex flex-col items-center justify-center text-[#8c909f] hover:text-[#adc6ff] hover:border-[#adc6ff] transition-colors cursor-pointer bg-[#131313]/50 overflow-hidden"
                  onClick={() => setShowLogoOptions(true)}
                >
                  {logoImage ? (
                    <img src={logoImage} alt="Token Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <PenTool size={20} className="mb-1" />
                      <span className="font-sketch text-xs">Upload</span>
                    </>
                  )}
                </div>
                {/* "Draw logo" annotation */}
                <div className="absolute top-6 -left-20">
                  <span className="font-sketch text-xs text-[#8c909f] italic tracking-wide">Draw logo</span>
                  <svg className="w-8 h-4 text-[#8c909f] absolute top-1 right-[-30px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M 0,12 L 18,12" />
                    <path d="M 14,8 L 18,12 L 14,16" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-[#ece1d5]">Memecoin Identity</h3>
                <p className="text-xs text-[#8c909f] mt-1">Drop a recognizable 1:1 image. Recommended size 400x400px.</p>
              </div>
            </div>

            {/* Name and Symbol */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-sketch text-[#ece1d5]">Memecoin Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. ArcPulse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1b1b1b]/80 border border-[#424754] rounded-lg px-4 py-2.5 text-sm text-[#ece1d5] placeholder-[#8c909f] focus:outline-none focus:border-[#adc6ff] font-sans"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-sketch text-[#ece1d5]">Symbol</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c909f] font-mono text-sm">$</span>
                  <input
                    required
                    type="text"
                    placeholder="PULSE"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-[#1b1b1b]/80 border border-[#424754] rounded-lg pl-7 pr-4 py-2.5 text-sm font-mono text-[#ece1d5] placeholder-[#8c909f] focus:outline-none focus:border-[#adc6ff]"
                  />
                </div>
              </div>
            </div>

            {/* Supply (read-only — fixed at 1B) */}
            <div className="space-y-2">
              <label className="text-xs font-sketch text-[#ece1d5]">Total Supply</label>
              <div className="w-full bg-[#131313] border border-[#424754] rounded-lg px-4 py-2.5 text-sm font-mono text-[#8c909f] cursor-not-allowed">
                1,000,000,000
              </div>
              <p className="text-[11px] font-sketch text-[#8c909f] italic">Supply is fixed at 1,000,000,000 tokens — hardcoded in the contract.</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-sketch text-[#ece1d5]">Blueprint Details</label>
              <textarea
                required
                placeholder="Describe the purpose of your creation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 bg-[#1b1b1b]/80 border border-[#424754] rounded-lg px-4 py-3 text-sm font-sans text-[#ece1d5] placeholder-[#8c909f] focus:outline-none focus:border-[#adc6ff] resize-none"
              />
            </div>

            {/* Links */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-sketch text-[#ece1d5]">Comms Links (Optional)</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c909f]" />
                  <input
                    type="text"
                    placeholder="Website URL"
                    className="w-full bg-[#1b1b1b]/80 border border-[#424754] rounded-lg pl-9 pr-4 py-2 text-xs font-sans text-[#ece1d5] placeholder-[#8c909f] focus:outline-none focus:border-[#adc6ff]"
                  />
                </div>
                <div className="relative">
                  <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c909f]" />
                  <input
                    type="text"
                    placeholder="Telegram Group"
                    className="w-full bg-[#1b1b1b]/80 border border-[#424754] rounded-lg pl-9 pr-4 py-2 text-xs font-sans text-[#ece1d5] placeholder-[#8c909f] focus:outline-none focus:border-[#adc6ff]"
                  />
                </div>
              </div>
            </div>

            {/* Footer / Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-dashed border-[#8c909f]/30 relative">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#d0bcff]" />
                <span className="text-xs font-mono text-[#8c909f]">Cost to build: <strong className="text-[#d0bcff]">0.05 USDC</strong></span>
              </div>

              <div className="relative">
                <button
                  type="submit"
                  disabled={isLaunching || !isConnected}
                  className="px-6 py-2.5 bg-[#adc6ff] text-blue-950 font-bold font-sans text-sm rounded-lg hover:bg-[#d0bcff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[2px_2px_0px_0px_#ece1d5]"
                >
                  Forge Memecoin <PenTool size={14} />
                </button>

                {/* "Ready to forge!" annotation */}
                <div className="absolute -top-6 -left-20">
                  <span className="font-sketch text-xs text-[#8c909f] italic">Ready to forge!</span>
                  <svg className="w-4 h-6 text-[#8c909f] absolute top-2 right-[-10px] transform rotate-[160deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M 4,4 Q 2,12 8,18" />
                    <path d="M 5,16 L 8,18 L 11,15" />
                  </svg>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Preview & Mascot */}
        <div className="lg:col-span-5 relative mt-16 lg:mt-12 lg:pl-8">

          {/* Annotation above card */}
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} className="text-[#8c909f]" />
            <span className="font-sketch text-sm text-[#8c909f] italic">Trading Card Preview</span>
          </div>

          <div className="relative">
            {/* Mascot hanging off the top right */}
            <div className="absolute -top-24 -right-2 z-20">
              <ArcCatMascot state="thinking" size="md" interactive={false} />
            </div>

            {/* Faint hand-drawn outline for the card preview */}
            <div className="absolute -inset-3 border-2 border-dashed border-[#8c909f]/30 rounded-xl pointer-events-none"
              style={{ borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px" }} />

            {/* Card Content */}
            <div className="relative bg-[#0a0a0f] border border-[#424754] rounded-xl p-6 shadow-xl z-10 flex flex-col h-full gap-4">

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-[#424754] flex flex-col items-center justify-center text-[#424754] bg-[#1b1b1b] overflow-hidden">
                    {logoImage ? (
                      <img src={logoImage} alt="Preview Logo" className="w-full h-full object-cover" />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-marker text-lg text-[#ece1d5]">{name || "Memecoin Name"}</h3>
                    <span className="font-mono text-sm text-[#adc6ff]">${symbol || "SYMBOL"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#1b1b1b] border border-[#424754] px-2 py-1 rounded text-[10px] font-mono text-[#8c909f]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#424754]" />
                  Not Forged
                </div>
              </div>

              <div className="flex-1 bg-[#1b1b1b]/50 border border-dashed border-[#424754] rounded-lg p-3">
                <p className="text-xs font-sketch text-[#8c909f] italic">
                  {description || "Memecoin details will be etched here..."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1b1b1b] border border-[#424754] rounded-lg p-3">
                  <span className="text-[10px] font-sketch text-[#8c909f] block">Max Supply</span>
                  <span className="font-mono text-xs text-[#ece1d5] mt-1 block">1,000,000,000</span>
                </div>
                <div className="bg-[#1b1b1b] border border-[#424754] rounded-lg p-3">
                  <span className="text-[10px] font-sketch text-[#8c909f] block">Workshop</span>
                  <div className="flex items-center gap-1 mt-1">
                    <PenTool size={10} className="text-[#adc6ff]" />
                    <span className="font-mono text-xs text-[#ece1d5]">Arc</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-2.5 rounded-lg border border-[#424754] bg-[#131313] text-[#8c909f] font-sketch text-sm italic cursor-not-allowed">
                Trade (Locked)
              </button>
            </div>

            {/* Badges below card */}
            <div className="flex gap-3 mt-4 ml-2">
              <div className="flex items-center gap-1.5 border border-[#424754] rounded text-[10px] font-mono text-[#8c909f] px-2 py-1">
                <CheckCircle2 size={10} /> Checked
              </div>
              <div className="flex items-center gap-1.5 border border-[#424754] rounded text-[10px] font-mono text-[#8c909f] px-2 py-1">
                <Shield size={10} /> Secure
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Transaction Mining Modal overlay */}
      <AnimatePresence>
        {(isLaunching || launchSuccess) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1b1b1b] border-2 border-[#8c909f] rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl font-mono relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

              {isLaunching ? (
                <div className="space-y-5 relative z-10">
                  <div className="w-16 h-16 border-4 border-[#adc6ff] border-t-transparent rounded-full animate-spin mx-auto" />

                  {/* Step indicator */}
                  <div className="flex items-center justify-center gap-3">
                    <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border ${launchStep === "approving" ? "bg-[#adc6ff]/20 border-[#adc6ff] text-[#adc6ff]" : launchStep === "launching" ? "bg-green-950/30 border-green-600 text-green-400" : "bg-[#131313] border-[#424754] text-[#8c909f]"}`}>
                      {launchStep === "launching" ? <CheckCircle2 size={10} /> : null}
                      Step 1: Approve USDC
                    </div>
                    <span className="text-[#424754]">→</span>
                    <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border ${launchStep === "launching" ? "bg-[#adc6ff]/20 border-[#adc6ff] text-[#adc6ff]" : "bg-[#131313] border-[#424754] text-[#8c909f]"}`}>
                      Step 2: Launch Token
                    </div>
                  </div>

                  <h3 className="font-marker text-xl text-[#ece1d5]">
                    {launchStep === "approving" ? "Approving USDC..." : launchStep === "launching" ? "Launching Memecoin..." : "Preparing..."}
                  </h3>
                  <p className="text-xs text-[#bec6e0] leading-relaxed">
                    {launchStep === "approving"
                      ? "Please confirm the USDC approval in your wallet. This allows the factory to collect the launch fee."
                      : launchStep === "launching"
                      ? "USDC approved! Now confirm the launch transaction in your wallet."
                      : "Checking your USDC allowance..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  <div className="mx-auto w-16 h-16 bg-green-950/30 border-2 border-green-500 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-marker text-xl text-[#ece1d5]">Token Launched!</h3>
                  <p className="text-xs text-[#bec6e0] leading-relaxed">
                    Your memecoin was successfully forged on the Arc Testnet.
                  </p>

                  {/* Token Details */}
                  <div className="bg-[#131313] border border-[#424754] rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8c909f] font-sketch">Name</span>
                      <span className="text-[#ece1d5] font-mono">{name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8c909f] font-sketch">Symbol</span>
                      <span className="text-[#adc6ff] font-mono">${symbol}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8c909f] font-sketch">Total Supply</span>
                      <span className="text-[#ece1d5] font-mono">1,000,000,000</span>
                    </div>
                    {deployedTokenAddress && (
                      <div className="pt-2 border-t border-[#424754]/50">
                        <span className="text-[#8c909f] font-sketch text-xs block mb-1">Contract Address</span>
                        <span className="text-[#adc6ff] font-mono text-xs break-all">{deployedTokenAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Add to MetaMask Button */}
                  {deployedTokenAddress && (
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && (window as any).ethereum) {
                          (window as any).ethereum.request({
                            method: 'wallet_watchAsset',
                            params: {
                              type: 'ERC20',
                              options: {
                                address: deployedTokenAddress,
                                symbol: symbol,
                                decimals: 18,
                                image: logoImage || "",
                              },
                            },
                          }).catch(console.error);
                        }
                      }}
                      className="w-full py-2 bg-[#242424] border border-[#424754] rounded-lg text-xs font-mono text-[#bec6e0] hover:text-[#ece1d5] hover:border-[#adc6ff] transition-colors flex items-center justify-center gap-2"
                    >
                      🦊 Add to MetaMask
                    </button>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setLaunchSuccess(false)}
                      className="flex-1 py-2.5 bg-[#242424] text-[#8c909f] hover:text-[#ece1d5] border border-[#424754] rounded-lg font-sans text-sm transition-colors"
                    >
                      Close
                    </button>
                    <button
                      disabled
                      className="flex-1 py-2.5 bg-[#adc6ff]/50 text-blue-950/50 font-bold font-sans text-sm rounded-lg cursor-not-allowed"
                    >
                      List on DEX (Coming Soon)
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo Upload / Draw Modal */}
      <AnimatePresence>
        {showLogoOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1b1b1b] border border-[#424754] rounded-xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-[#ece1d5] font-marker text-xl">Logo Options</h3>
                <button onClick={() => { setShowLogoOptions(false); setIsDrawing(false); }} className="text-[#8c909f] hover:text-white">x</button>
              </div>

              {!isDrawing ? (
                <div className="grid grid-cols-2 gap-4">
                  <label className="border border-[#424754] rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#adc6ff] hover:text-[#adc6ff] text-[#8c909f] transition-colors bg-[#131313]/50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <span className="font-sketch text-sm">Upload from PC</span>
                  </label>
                  <button onClick={() => setIsDrawing(true)} type="button" className="border border-[#424754] rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-[#adc6ff] hover:text-[#adc6ff] text-[#8c909f] transition-colors bg-[#131313]/50">
                    <PenTool size={20} />
                    <span className="font-sketch text-sm">Draw Logo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[#8c909f] font-sans">Draw your token logo below:</p>
                  <div className="border border-[#424754] rounded-lg bg-[#131313] overflow-hidden flex justify-center p-2">
                    <canvas
                      ref={canvasRef}
                      width={200}
                      height={200}
                      className="bg-black/20 cursor-crosshair border border-dashed border-[#8c909f]/30 rounded"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsDrawing(false)} className="flex-1 py-2 text-xs border border-[#424754] rounded text-[#8c909f] hover:bg-[#424754]/30">Back</button>
                    <button type="button" onClick={() => {
                      const canvas = canvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                      }
                    }} className="flex-1 py-2 text-xs border border-[#424754] rounded text-[#8c909f] hover:bg-[#424754]/30">Clear</button>
                    <button type="button" onClick={saveDrawing} className="flex-1 py-2 text-xs bg-[#adc6ff] text-blue-950 font-bold rounded hover:bg-[#d0bcff]">Save</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
