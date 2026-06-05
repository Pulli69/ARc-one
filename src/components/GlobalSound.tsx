"use client";

import { useEffect } from "react";
import { playClickSound } from "@/utils/audio";

export default function GlobalSound() {
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest("button") ||
        el.closest("a") ||
        el.closest("[role='button']") ||
        el.closest(".cursor-pointer") ||
        el.closest(".sketch-btn")
      ) {
        playClickSound();
      }
    };

    document.addEventListener("pointerdown", handler, { capture: true });
    return () =>
      document.removeEventListener("pointerdown", handler, { capture: true });
  }, []);

  return null;
}
