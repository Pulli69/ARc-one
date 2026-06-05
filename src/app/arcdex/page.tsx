"use client";

import React, { useState } from "react";
import ArcCatMascot from "@/components/ArcCatMascot";
import { ArrowLeftRight, Settings, Info, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ArcDexPage() {
  const [payAmount, setPayAmount] = useState("1.0");
  
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 flex-1 flex flex-col justify-center items-center">
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-md">
        <h1 className="font-marker text-3xl md:text-4xl text-[#ece1d5] tracking-wide rotate-[-1deg] inline-block">
          ArcDEX Terminal
        </h1>
        <p className="text-sm font-sans text-[#8c909f]">
          Peer-to-peer liquidity pool swaps directly routed on-chain.
        </p>
      </div>

      {/* Swap Widget Container with construction overlay */}
      <div className="w-full max-w-md relative">
        
        {/* Mock Swap UI */}
        <div className="sketch-card p-6 space-y-6 opacity-40 select-none pointer-events-none filter blur-[1px]">
          <div className="flex justify-between items-center border-b border-dashed border-[#8c909f]/30 pb-3">
            <h3 className="font-marker text-lg text-[#ece1d5] flex items-center gap-2">
              <ArrowLeftRight size={18} />
              <span>Swap</span>
            </h3>
            <Settings size={18} className="text-[#8c909f]" />
          </div>

          <div className="space-y-4">
            {/* Pay Field */}
            <div className="bg-[#131313] border-2 border-[#8c909f] rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-[10px] text-[#8c909f] font-mono">
                <span>You Pay</span>
                <span>Balance: 0.00 ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-lg text-[#ece1d5]">{payAmount}</span>
                <span className="sticker sticker-blue text-xs font-mono">ETH</span>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center text-[#8c909f]">
              <ArrowLeftRight size={18} className="rotate-90" />
            </div>

            {/* Receive Field */}
            <div className="bg-[#131313] border-2 border-dashed border-[#424754] rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-[10px] text-[#8c909f] font-mono">
                <span>You Receive (Estimated)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-lg text-[#bec6e0]">500,000</span>
                <span className="sticker sticker-purple text-xs font-mono">RKT</span>
              </div>
            </div>
          </div>

          {/* Swap Info parameters */}
          <div className="space-y-1.5 text-[10px] font-mono text-[#8c909f] bg-[#131313] p-2.5 rounded-lg">
            <div className="flex justify-between">
              <span>Rate:</span>
              <span>1 ETH = 500,000 RKT</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Received:</span>
              <span>498,500 RKT</span>
            </div>
            <div className="flex justify-between">
              <span>Slippage Tolerance:</span>
              <span>0.5%</span>
            </div>
          </div>

          {/* Action button */}
          <button className="w-full sketch-btn sketch-btn-primary py-3 font-marker text-sm">
            Swap Tokens
          </button>
        </div>

        {/* Coming Soon Glass Overlay */}
        <div className="absolute inset-0 bg-[#0e0e0e]/80 border-2 border-dashed border-[#8c909f] rounded-3xl flex flex-col justify-center items-center p-6 text-center space-y-6 z-10 shadow-lg">
          
          <ArcCatMascot state="sleeping" size="lg" className="scale-105" />

          <div className="space-y-2">
            <span className="sticker sticker-purple text-xs font-mono select-none">
              <Calendar size={12} className="inline mr-1" />
              <span>Phase 2 Release</span>
            </span>
            
            <h3 className="font-marker text-2xl text-[#ece1d5] pt-1">Waking Up Soon</h3>
            
            <p className="text-xs text-[#bec6e0] font-sans max-w-xs mx-auto leading-relaxed">
              ArcDEX is currently under construction. Our engineering team (and the cat) are drafting liquidity routing pool formulas.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#8c909f]">
            <Info size={12} className="text-[#adc6ff]" />
            <span>Event emitters and indexing are active in staging.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
