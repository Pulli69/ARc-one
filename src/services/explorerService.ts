import { explorerConfig } from "@/config/explorerConfig";

export interface ExplorerTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface ExplorerTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export const explorerService = {
  /**
   * Fetches normal transactions for a given wallet address.
   */
  getTransactions: async (address: string): Promise<ExplorerTransaction[]> => {
    try {
      const response = await fetch(explorerConfig.apiEndpoints.normalTxs(address));
      const data = await response.json();
      if (data.status === "1" && Array.isArray(data.result)) {
        return data.result;
      }
      return [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  },

  /**
   * Fetches ERC20 token transfers for a given wallet address.
   */
  getTokenTransfers: async (address: string): Promise<ExplorerTokenTransfer[]> => {
    try {
      const response = await fetch(explorerConfig.apiEndpoints.tokenTransfers(address));
      const data = await response.json();
      if (data.status === "1" && Array.isArray(data.result)) {
        return data.result;
      }
      return [];
    } catch (error) {
      console.error("Error fetching token transfers:", error);
      return [];
    }
  }
};
