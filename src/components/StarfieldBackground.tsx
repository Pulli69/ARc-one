import React from "react";

// Deterministic seeded PRNG to avoid SSR/client hydration mismatches
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Pre-compute star data once at module level so server & client match
const rand = seededRandom(42);
const STARS = Array.from({ length: 60 }).map(() => ({
  width: 1 + rand() * 1.5,
  height: 1 + rand() * 1.5,
  top: rand() * 100,
  left: rand() * 100,
  delay: rand() * 4,
}));

export default function StarfieldBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Tiny dots / stars */}
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{
            width: `${star.width}px`,
            height: `${star.height}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      
      {/* ─── Hand-drawn Cosmic Doodles (5% - 10% opacity) ─── */}
      <div className="absolute inset-0 opacity-[0.06] text-[#adc6ff]">
        {/* Top-left: Stylized Planet */}
        <svg className="absolute top-[10%] left-[15%] w-32 h-32 rotate-[-15deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="50" cy="50" r="30" strokeDasharray="6 4" />
          <ellipse cx="50" cy="50" rx="45" ry="12" transform="rotate(-20 50 50)" />
          <path d="M 35,40 Q 45,35 60,45" strokeDasharray="3 3" />
        </svg>
        
        {/* Top-right: Comet / Shooting Star */}
        <svg className="absolute top-[20%] right-[10%] w-24 h-24 rotate-[25deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 20,80 L 70,30" />
          <path d="M 15,70 L 60,25" opacity="0.6" />
          <path d="M 30,85 L 75,40" opacity="0.6" />
          <circle cx="75" cy="25" r="4" fill="currentColor" />
          <path d="M 70,20 Q 80,10 90,30 Q 80,35 70,20" />
        </svg>

        {/* Center-left: Sketch Circles / Notebook scribble */}
        <svg className="absolute top-[55%] left-[5%] w-20 h-20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="50" cy="50" r="40" strokeDasharray="4 6" />
          <path d="M 30,50 Q 50,20 70,50 T 30,50" />
          <path d="M 40,40 L 60,60" />
          <path d="M 60,40 L 40,60" />
        </svg>

        {/* Bottom-right: Galaxy swirl */}
        <svg className="absolute bottom-[15%] right-[15%] w-40 h-40 opacity-70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M 50,50 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0" strokeDasharray="4 4" />
          <path d="M 50,50 m -35,0 a 35,35 0 1,0 70,0 a 35,35 0 1,0 -70,0" strokeDasharray="2 6" />
          <circle cx="50" cy="50" r="2" fill="currentColor" />
          <path d="M 50,25 L 50,15 M 50,75 L 50,85 M 25,50 L 15,50 M 75,50 L 85,50" />
        </svg>

        {/* Center-right: Sparkle cluster */}
        <svg className="absolute top-[45%] right-[25%] w-16 h-16" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 50,20 Q 50,50 80,50 Q 50,50 50,80 Q 50,50 20,50 Q 50,50 50,20" fill="currentColor" fillOpacity="0.2" />
          <path d="M 20,20 L 30,30 M 80,20 L 70,30 M 20,80 L 30,70" opacity="0.5" />
        </svg>

        {/* Bottom-left: Arc shape abstract doodle */}
        <svg className="absolute bottom-[10%] left-[20%] w-28 h-28 opacity-80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M 20,80 Q 50,10 80,80" strokeDasharray="8 4" />
          <path d="M 30,80 Q 50,30 70,80" strokeDasharray="4 8" />
          <circle cx="50" cy="20" r="3" fill="currentColor" />
        </svg>
      </div>

      {/* Subtle radial glows */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#adc6ff]/[0.03] blur-[120px]" />
      <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[#d0bcff]/[0.03] blur-[100px]" />
    </div>
  );
}
