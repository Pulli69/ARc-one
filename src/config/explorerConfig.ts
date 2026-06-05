export const explorerConfig = {
  baseUrl: "https://testnet.arcscan.app",
  apiUrl: "https://testnet.arcscan.app/api",
  
  // URL Helpers
  addressUrl: (address: string) => `${explorerConfig.baseUrl}/address/${address}`,
  txUrl: (hash: string) => `${explorerConfig.baseUrl}/tx/${hash}`,
  tokenUrl: (address: string) => `${explorerConfig.baseUrl}/token/${address}`,
  
  // API Endpoint Helpers
  apiEndpoints: {
    // Standard Blockscout / Etherscan API endpoints
    normalTxs: (address: string) => 
      `${explorerConfig.apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`,
    tokenTransfers: (address: string) => 
      `${explorerConfig.apiUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc`,
    internalTxs: (address: string) => 
      `${explorerConfig.apiUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc`
  }
};
