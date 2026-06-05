"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MascotState = "idle" | "happy" | "thinking" | "sleeping" | "celebrate" | "bubble";

interface ArcCatMascotProps {
  state?: MascotState;
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  interactive?: boolean;
}

const DEFAULT_BUBBLE_MESSAGES = [
  "Meow! Ready to launch some sketchy ideas?",
  "Your Builder Score is looking very premium today!",
  "Rocket Moon is fueling up. Don't fall asleep!",
  "Need help drawing your token? Just start sketching!",
  "The bonding curve is looking spicy! Meow.",
  "Check the Leaderboard to see who's top cat."
];

export default function ArcCatMascot({
  state = "idle",
  text,
  size = "md",
  className = "",
  interactive = true,
}: ArcCatMascotProps) {
  const [clickCount, setClickCount] = useState(0);
  const [currentState, setCurrentState] = useState<MascotState>(state);
  const [bubbleMessage, setBubbleMessage] = useState(text || DEFAULT_BUBBLE_MESSAGES[0]);

  // Synchronize internal state with prop changes
  useEffect(() => {
    setCurrentState(state);
    if (text) setBubbleMessage(text);
  }, [state, text]);

  // Periodic speech bubble updates if in bubble state
  useEffect(() => {
    if (currentState === "bubble" && !text) {
      const interval = setInterval(() => {
        const idx = Math.floor(Math.random() * DEFAULT_BUBBLE_MESSAGES.length);
        setBubbleMessage(DEFAULT_BUBBLE_MESSAGES[idx]);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [currentState, text]);

  const handleCatClick = () => {
    if (!interactive) return;
    setClickCount((prev) => prev + 1);
    
    // Cycle state temporarily on click
    const tempStates: MascotState[] = ["happy", "celebrate", "thinking"];
    const randomTempState = tempStates[Math.floor(Math.random() * tempStates.length)];
    setCurrentState(randomTempState);
    
    if (randomTempState === "happy") {
      setBubbleMessage("Purrr... That tickles! Meow.");
    } else if (randomTempState === "celebrate") {
      setBubbleMessage("YAY! You clicked me! Let's build!");
    } else {
      setBubbleMessage("Hmm... Let me think about that...");
    }

    // Revert back after 2.5 seconds
    setTimeout(() => {
      setCurrentState(state);
      setBubbleMessage(text || DEFAULT_BUBBLE_MESSAGES[Math.floor(Math.random() * DEFAULT_BUBBLE_MESSAGES.length)]);
    }, 2500);
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
    xl: "w-72 h-72",
  };

  // Determine SVG styling and coordinates
  const isSleeping = currentState === "sleeping";
  const isHappy = currentState === "happy";
  const isThinking = currentState === "thinking";
  const isCelebrate = currentState === "celebrate";

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {(currentState === "bubble" || currentState === "thinking" || isCelebrate) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-20 z-10 max-w-[220px] bg-[#242424] border-2 border-[#8c909f] text-[#ece1d5] p-3 text-xs md:text-sm font-sketch rounded-xl shadow-[4px_4px_0px_0px_#8c909f]"
            style={{ transformOrigin: "bottom center" }}
          >
            <div className="relative">
              {bubbleMessage}
              {/* Arrow */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#242424] border-r-2 border-b-2 border-[#8c909f] rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleeping Animated Zzz's */}
      {isSleeping && (
        <div className="absolute top-0 right-4 w-12 h-16 pointer-events-none overflow-visible">
          <span className="absolute animate-zzz text-[#d0bcff] font-marker text-sm" style={{ animationDelay: "0s", top: "20px", left: "10px" }}>Z</span>
          <span className="absolute animate-zzz text-[#d0bcff] font-marker text-lg" style={{ animationDelay: "0.6s", top: "10px", left: "20px" }}>z</span>
          <span className="absolute animate-zzz text-[#d0bcff] font-marker text-2xl" style={{ animationDelay: "1.2s", top: "0px", left: "30px" }}>Z</span>
        </div>
      )}

      {/* Thinking Bubble Icon */}
      {isThinking && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-8 right-6 w-8 h-8 rounded-full border-2 border-[#8c909f] bg-[#1b1b1b] flex items-center justify-center text-xs font-marker text-[#adc6ff] shadow-[2px_2px_0px_0px_#8c909f]"
        >
          ?
        </motion.div>
      )}

      {/* Mascot Graphic container */}
      <motion.div
        className={`${sizeClasses[size]} cursor-pointer relative overflow-visible`}
        onClick={handleCatClick}
        animate={isSleeping ? "sleeping" : "idle"}
        variants={{
          idle: {
            y: [0, -6, 0],
            rotate: [0, 0.5, -0.5, 0],
            transition: {
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            },
          },
          sleeping: {
            y: [0, 2, 0],
            scaleY: [1, 0.96, 1],
            transition: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            },
          },
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Confetti if celebrating */}
          {isCelebrate && (
            <g>
              <circle cx="20" cy="50" r="3" fill="#adc6ff" className="animate-pulse" />
              <rect x="180" y="60" width="6" height="6" fill="#d0bcff" transform="rotate(45 180 60)" />
              <circle cx="160" cy="30" r="4" fill="#bec6e0" />
              <path d="M 30,30 Q 35,20 40,30" stroke="#d0bcff" strokeWidth="2" strokeLinecap="round" />
              <path d="M 170,110 Q 175,100 180,110" stroke="#adc6ff" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* Cat Shadow */}
          <ellipse cx="100" cy="180" rx="65" ry="12" fill="#0c0c0c" opacity="0.6" />

          {/* Animated Tail */}
          <motion.path
            d="M 140,165 Q 180,180 175,120 Q 172,110 180,105 Q 185,100 190,115 Q 185,160 145,175 Z"
            fill="#1b1b1b"
            stroke="#8c909f"
            strokeWidth="2.5"
            strokeLinejoin="round"
            animate={{ rotate: [0, 15, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ transformOrigin: "140px 165px" }}
          />

          {/* Cat Body */}
          <path
            d="M 50,150 Q 100,100 150,150 Q 170,180 150,180 H 50 Q 30,180 50,150 Z"
            fill="#1b1b1b"
            stroke="#8c909f"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Back Legs (Full Body look) */}
          <g>
            <path
              d="M 45,155 Q 30,170 45,180"
              fill="#1b1b1b"
              stroke="#8c909f"
              strokeWidth="2.5"
            />
            <path
              d="M 155,155 Q 170,170 155,180"
              fill="#1b1b1b"
              stroke="#8c909f"
              strokeWidth="2.5"
            />
          </g>

          {/* Front Paws */}
          <g>
            {/* Left Paw */}
            <path
              d="M 80,165 Q 80,180 72,180 Q 64,180 68,165"
              fill="#1b1b1b"
              stroke="#8c909f"
              strokeWidth="2.5"
            />
            {/* Right Paw */}
            <path
              d="M 120,165 Q 120,180 128,180 Q 136,180 132,165"
              fill="#1b1b1b"
              stroke="#8c909f"
              strokeWidth="2.5"
            />
          </g>

          {/* Left Ear */}
          <path
            d="M 45,95 L 30,35 Q 65,50 65,80 Z"
            fill="#1b1b1b"
            stroke="#8c909f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 40,85 L 35,48 Q 55,58 55,75 Z"
            fill="#d0bcff"
            opacity="0.5"
          />

          {/* Right Ear */}
          <path
            d="M 155,95 L 170,35 Q 135,50 135,80 Z"
            fill="#1b1b1b"
            stroke="#8c909f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 160,85 L 165,48 Q 145,58 145,75 Z"
            fill="#d0bcff"
            opacity="0.5"
          />

          {/* Cat Head Outline (Uneven hand-drawn style) */}
          <path
            d="M 45,95 Q 35,135 100,140 Q 165,135 155,95 Q 150,75 100,75 Q 50,75 45,95 Z"
            fill="#1b1b1b"
            stroke="#8c909f"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Celebrate Hat */}
          {isCelebrate && (
            <path
              d="M 85,75 L 100,35 L 115,75 Z"
              fill="#adc6ff"
              stroke="#8c909f"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}

          {/* Cat Eyes */}
          <g>
            {isSleeping ? (
              // Sleeping eyes (curved lines)
              <>
                <path d="M 65,108 Q 75,115 85,108" stroke="#8c909f" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 115,108 Q 125,115 135,108" stroke="#8c909f" strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            ) : isHappy ? (
              // Happy squinting eyes (curved upwards)
              <>
                <path d="M 65,112 Q 75,100 85,112" stroke="#adc6ff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M 115,112 Q 125,100 135,112" stroke="#adc6ff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </>
            ) : (
              // Normal eyes
              <>
                {/* Left Eye */}
                <ellipse cx="75" cy="108" rx="10" ry="12" fill="#131313" stroke="#8c909f" strokeWidth="2" />
                <circle cx="78" cy="105" r="3" fill="#ffffff" />
                <circle cx="73" cy="111" r="1.5" fill="#ffffff" />

                {/* Right Eye */}
                <ellipse cx="125" cy="108" rx="10" ry="12" fill="#131313" stroke="#8c909f" strokeWidth="2" />
                <circle cx="128" cy="105" r="3" fill="#ffffff" />
                <circle cx="123" cy="111" r="1.5" fill="#ffffff" />
              </>
            )}
          </g>

          {/* Eyebrows if thinking */}
          {isThinking && (
            <g>
              <path d="M 68,95 Q 75,90 82,97" stroke="#8c909f" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 118,97 Q 125,90 132,95" stroke="#8c909f" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Cat Nose & Whiskers */}
          <g>
            {/* Nose */}
            <polygon points="97,118 103,118 100,122" fill="#d0bcff" stroke="#8c909f" strokeWidth="1.5" />
            
            {/* Mouth */}
            {isHappy || isCelebrate ? (
              // Open happy mouth
              <path d="M 94,124 Q 100,132 106,124 Z" fill="#adc6ff" stroke="#8c909f" strokeWidth="2" />
            ) : (
              // Classic w mouth
              <path d="M 92,124 Q 96,127 100,124 Q 104,127 108,124" stroke="#8c909f" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}

            {/* Whiskers */}
            <path d="M 50,118 L 30,115" stroke="#8c909f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 50,123 L 28,125" stroke="#8c909f" strokeWidth="1.5" strokeLinecap="round" />
            
            <path d="M 150,118 L 170,115" stroke="#8c909f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 150,123 L 172,125" stroke="#8c909f" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Cat Blush (Cheeks) */}
          <g opacity="0.6">
            <ellipse cx="60" cy="120" rx="6" ry="3" fill="#d0bcff" />
            <ellipse cx="140" cy="120" rx="6" ry="3" fill="#d0bcff" />
          </g>

          {/* Star builder badge on chest */}
          <g transform="translate(90, 145) scale(0.6)">
            <path
              d="M 16.5,0 L 21.5,10 L 33,11.5 L 24.5,19.5 L 27,31 L 16.5,25 L 6,31 L 8.5,19.5 L 0,11.5 L 11.5,10 Z"
              fill={isHappy || isCelebrate ? "#adc6ff" : "#bec6e0"}
              stroke="#8c909f"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
