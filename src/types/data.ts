export interface Token {
  id: string;
  name: string;
  symbol: string;
  description: string;
  creator: string; // Wallet address
  totalSupply: number;
  marketCap: number; // in USD or ETH
  fundingPercentage: number; // 0-100 for bonding curve status
  holders: number;
  imageUrl?: string;
  createdAt: string; // ISO date string
  priceChange24h?: number; // percentage
  volume24h?: number; // value in ETH
}

export interface Builder {
  address: string;
  username: string;
  onchainScore: number;
  totalTokensLaunched: number;
  totalTransactions: number;
  uniqueInteractions: number;
  activeDays: number;
  streakDays: number;
  rank: number;
  avatarUrl?: string;
}

export interface Activity {
  id: string;
  type: 'launch' | 'buy' | 'sell' | 'mint';
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  valueEth: number;
  builderAddress: string;
  builderUsername: string;
  timestamp: string; // ISO date string or relative text
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number; // number of activities on this day
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balanceEth: number;
}
