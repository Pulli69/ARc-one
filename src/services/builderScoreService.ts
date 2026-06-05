import { ExplorerTransaction } from "./explorerService";

export interface BuilderStats {
  onchainScore: number;
  totalTransactions: number;
  activeDays: number;
  streakDays: number;
  uniqueInteractions: number;
  firstActivity: string | null;
  lastActivity: string | null;
  contractsDeployed: number;
  contractsUsed: number;
}

/**
 * Onchain Score Breakdown:
 *
 * The score is calculated from three core pillars:
 *   1. Unique Interactions  — number of unique contracts interacted with (×15 pts each)
 *   2. Unique Days          — number of distinct days with on-chain activity (×10 pts each)
 *   3. Streak               — consecutive days of activity from most recent (×25 pts per day)
 *
 * Bonus:
 *   - Contract deployments: +100 pts each
 *   - Base transaction activity: +2 pts per tx (capped contribution)
 */
export const builderScoreService = {
  calculateStats: (transactions: ExplorerTransaction[], userAddress: string): BuilderStats => {
    if (!transactions || transactions.length === 0) {
      return {
        onchainScore: 0,
        totalTransactions: 0,
        activeDays: 0,
        streakDays: 0,
        uniqueInteractions: 0,
        firstActivity: null,
        lastActivity: null,
        contractsDeployed: 0,
        contractsUsed: 0,
      };
    }

    let score = 0;
    let contractsDeployed = 0;
    const uniqueContractsUsed = new Set<string>();
    const activeDates = new Set<string>();

    const sortedTxs = [...transactions].sort(
      (a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp)
    );

    const firstActivity = new Date(parseInt(sortedTxs[0].timeStamp) * 1000).toISOString();
    const lastActivity = new Date(parseInt(sortedTxs[sortedTxs.length - 1].timeStamp) * 1000).toISOString();

    for (const tx of sortedTxs) {
      // Only count outgoing transactions
      if (tx.from.toLowerCase() !== userAddress.toLowerCase()) continue;

      const dateStr = new Date(parseInt(tx.timeStamp) * 1000).toISOString().split("T")[0];
      activeDates.add(dateStr);

      // Contract deployment
      if (!tx.to && tx.contractAddress) {
        contractsDeployed++;
      }

      // Contract interaction (unique)
      if (tx.to && tx.input && tx.input !== "0x") {
        uniqueContractsUsed.add(tx.to.toLowerCase());
      }
    }

    const activeDays = activeDates.size;
    const uniqueInteractions = uniqueContractsUsed.size;
    const sortedDates = Array.from(activeDates).sort();

    // Calculate streak (consecutive days from most recent going backwards)
    let streakDays = 0;
    if (sortedDates.length > 0) {
      streakDays = 1;
      const oneDayMs = 24 * 60 * 60 * 1000;
      for (let i = sortedDates.length - 1; i > 0; i--) {
        const current = new Date(sortedDates[i]).getTime();
        const prev = new Date(sortedDates[i - 1]).getTime();
        if (current - prev <= oneDayMs * 1.5) {
          streakDays++;
        } else {
          break;
        }
      }
    }

    // --- Onchain Score Calculation ---
    // Pillar 1: Unique Interactions (15 pts each)
    score += uniqueInteractions * 15;

    // Pillar 2: Unique Days (10 pts each)
    score += activeDays * 10;

    // Pillar 3: Streak (25 pts per day)
    score += streakDays * 25;

    // Bonus: Contract deployments
    score += contractsDeployed * 100;

    // Bonus: Base tx activity (2 pts per tx, capped at 200)
    score += Math.min(sortedTxs.length * 2, 200);

    return {
      onchainScore: score,
      totalTransactions: sortedTxs.length,
      activeDays,
      streakDays,
      uniqueInteractions,
      firstActivity,
      lastActivity,
      contractsDeployed,
      contractsUsed: uniqueContractsUsed.size,
    };
  }
};
