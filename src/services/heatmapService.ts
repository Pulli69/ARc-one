import { ExplorerTransaction } from "./explorerService";

export interface HeatmapDay {
  date: string;
  count: number;
}

export const heatmapService = {
  /**
   * Generates heatmap data array covering the last year (365 days).
   * Dates without transactions will have a count of 0.
   */
  generateHeatmapData: (transactions: ExplorerTransaction[]): HeatmapDay[] => {
    const today = new Date();
    const heatmap: HeatmapDay[] = [];
    const countsByDate = new Map<string, number>();

    // Count txs per date
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        const d = new Date(parseInt(tx.timeStamp) * 1000);
        const dateStr = d.toISOString().split("T")[0];
        countsByDate.set(dateStr, (countsByDate.get(dateStr) || 0) + 1);
      }
    }

    // Generate last 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      heatmap.push({
        date: dateStr,
        count: countsByDate.get(dateStr) || 0,
      });
    }

    return heatmap;
  }
};
