"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { arcTestnet } from "@/config/walletConfig";
import { NetworkArc } from "@web3icons/react";

const ARC_TESTNET_ID = arcTestnet.id; // 5042002

export default function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);

  const isCorrectChain = chainId === ARC_TESTNET_ID;

  // Auto-switch to Arc Testnet when connected on wrong chain
  const handleSwitchChain = useCallback(async () => {
    if (!isConnected || isCorrectChain || isSwitching) return;
    setIsSwitching(true);
    try {
      switchChain({ chainId: ARC_TESTNET_ID });
    } catch (err) {
      console.warn("Chain switch failed — user may need to add Arc Testnet manually:", err);
    } finally {
      setIsSwitching(false);
    }
  }, [isConnected, isCorrectChain, isSwitching, switchChain]);

  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      handleSwitchChain();
    }
  }, [isConnected, isCorrectChain, handleSwitchChain]);

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // ── Not Connected ──
  if (!isConnected) {
    return (
      <button
        onClick={() => open()}
        className="w-full sketch-btn sketch-btn-primary py-2.5 flex items-center justify-center gap-2"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M16 12h2" />
        </svg>
        <span className="text-[11px] font-bold">Connect Wallet</span>
      </button>
    );
  }

  // ── Connected ──
  return (
    <div className="p-3 bg-[#131313]/80 border border-[#424754] rounded-xl flex flex-col gap-2">
      {/* Address Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Status Dot */}
          <div
            className={`w-2 h-2 rounded-full ${
              isCorrectChain
                ? "bg-green-500 animate-pulse"
                : "bg-red-500 animate-pulse"
            }`}
          />
          <span className="text-[11px] font-mono text-[#8c909f]">
            {shortenAddress(address!)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-1 rounded hover:bg-[#242424] text-[#8c909f] hover:text-red-400 transition-colors"
          title="Disconnect"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Wrong Network Warning */}
      {!isCorrectChain && (
        <button
          onClick={handleSwitchChain}
          disabled={isSwitching}
          className="text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-2 py-1 hover:bg-red-950/40 transition-colors"
        >
          {isSwitching ? "Switching..." : "⚠ Wrong network — tap to switch"}
        </button>
      )}

      {/* Correct Network Badge */}
      {isCorrectChain && (
        <div className="text-[10px] font-mono text-[#8c909f] flex items-center gap-1.5">
          <span className="text-green-400">●</span>
          <NetworkArc variant="background" size={16} />
          <span>Arc Testnet</span>
        </div>
      )}
    </div>
  );
}
