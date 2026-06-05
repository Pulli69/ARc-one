"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeatmapDay } from "@/types/data";

interface HeatmapProps {
  data: HeatmapDay[];
  title?: string;
  onCellClick?: (day: HeatmapDay) => void;
}

export default function Heatmap({ data, title = "Arc Chain Activity", onCellClick }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Summary stats from data
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, activeDays: 0, maxDay: 0 };
    const total = data.reduce((s, d) => s + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;
    const maxDay = Math.max(...data.map(d => d.count));
    return { total, activeDays, maxDay };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full p-6 border border-[#8c909f] border-dashed rounded-2xl flex items-center justify-center text-xs text-[#8c909f] h-40 font-mono">
        Waiting for activity data...
      </div>
    );
  }

  // Intensity colors — green-tinted like GitHub but with Arc palette
  const getCellColor = (count: number) => {
    if (count === 0) return "bg-[#161b22] border-[#21262d]";
    if (count <= 2) return "bg-[#0e4429] border-[#1a6b3a]";
    if (count <= 4) return "bg-[#006d32] border-[#26a641]";
    if (count <= 7) return "bg-[#26a641] border-[#3ad353]";
    return "bg-[#39d353] border-[#56e06e] shadow-[0_0_6px_rgba(57,211,83,0.4)]";
  };

  const getCellGlow = (count: number) => {
    if (count === 0) return "";
    if (count >= 8) return "ring-1 ring-[#39d353]/30";
    return "";
  };

  // Organize data into weeks (columns)
  const columns: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  data.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      columns.push(currentWeek);
      currentWeek = [];
    }
  });

  // 53 weeks = ~1 year
  const activeColumns = columns.slice(-53);

  // Month labels
  const getMonthLabels = () => {
    const labels: { text: string; colIndex: number }[] = [];
    let prevMonth = "";

    activeColumns.forEach((week, colIdx) => {
      if (week.length > 0) {
        const firstDayDate = new Date(week[0].date);
        const monthName = firstDayDate.toLocaleString("default", { month: "short" });
        if (monthName !== prevMonth) {
          labels.push({ text: monthName, colIndex: colIdx });
          prevMonth = monthName;
        }
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();

  const handleMouseEnter = (event: React.MouseEvent, day: HeatmapDay) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.parentElement?.parentElement?.parentElement?.getBoundingClientRect();

    if (parentRect) {
      setHoveredCell({
        date: day.date,
        count: day.count,
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 44,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("default", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full relative bg-[#0d1117] border-2 border-[#30363d] rounded-2xl p-6 shadow-[0_0_20px_rgba(57,211,83,0.04)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <h3 className="font-marker text-lg text-[#e6edf3]">{title}</h3>
          <p className="text-[11px] font-mono text-[#8b949e] mt-0.5">Last year of on-chain activity</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#39d353]/10 border border-[#39d353]/30 text-[10px] font-mono text-[#39d353]">
              {summaryStats.total} txns
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#adc6ff]/10 border border-[#adc6ff]/30 text-[10px] font-mono text-[#adc6ff]">
              {summaryStats.activeDays} days
            </span>
          </div>
          {/* Color Legend */}
          <div className="flex items-center gap-1 text-[10px] text-[#8b949e] font-mono">
            <span>Less</span>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22] border border-[#21262d]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429] border border-[#1a6b3a]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32] border border-[#26a641]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641] border border-[#3ad353]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#39d353] border border-[#56e06e]" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        {/* Tooltip Overlay */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.12 }}
              className="absolute z-20 bg-[#1c2128] border border-[#444c56] text-xs text-[#e6edf3] px-3 py-2 rounded-lg shadow-lg font-mono whitespace-nowrap pointer-events-none"
              style={{
                left: hoveredCell.x,
                top: hoveredCell.y,
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-bold text-[#39d353]">{hoveredCell.count} transaction{hoveredCell.count !== 1 ? 's' : ''}</div>
              <div className="text-[10px] text-[#8b949e] mt-0.5">{formatDate(hoveredCell.date)}</div>
              {/* Triangle */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1c2128] border-r border-b border-[#444c56] rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-1 select-none">
          {/* Month Labels row */}
          <div className="h-4 relative text-[10px] font-mono text-[#8b949e] mb-1 ml-8">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${lbl.colIndex * 15}px` }}
              >
                {lbl.text}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px] items-start">
            {/* Days of week labels */}
            <div className="flex flex-col gap-[3px] text-[9px] font-mono text-[#8b949e] pr-2 pt-0.5 w-7 h-[100px] justify-between">
              <span>Mon</span>
              <span className="opacity-0">T</span>
              <span>Wed</span>
              <span className="opacity-0">T</span>
              <span>Fri</span>
              <span className="opacity-0">S</span>
              <span className="opacity-0">S</span>
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-[3px] flex-1">
              {activeColumns.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, rowIdx) => (
                    <motion.div
                      key={`${colIdx}-${rowIdx}`}
                      whileHover={{ scale: 1.4, zIndex: 10 }}
                      onClick={() => onCellClick?.(day)}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-[14px] h-[14px] rounded-[3px] border cursor-pointer transition-all duration-150 ${getCellColor(day.count)} ${getCellGlow(day.count)}`}
                    />
                  ))}
                  {/* Fill empty cells if week is not full */}
                  {week.length < 7 &&
                    Array.from({ length: 7 - week.length }).map((_, emptyIdx) => (
                      <div
                        key={`empty-${emptyIdx}`}
                        className="w-[14px] h-[14px] bg-transparent border-none cursor-default"
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
