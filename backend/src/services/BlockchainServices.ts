// Mock blockchain service for development (no real blockchain needed)
export class BlockchainService {
  async submitProject(project: any): Promise<number> {
    // Mock blockchain submission
    // In production, this would interact with smart contracts
    return Math.floor(Math.random() * 10000) + 1;
  }

  async approveProject(blockchainId: number): Promise<string> {
    // Mock transaction hash
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }

  async issueCredits(
    projectId: number,
    amount: number,
    recipientAddress: string,
    verificationHash: string
  ): Promise<string> {
    // Mock credit issuance
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }

  async mintSoulboundToken(
    recipientAddress: string,
    title: string,
    description: string,
    projectId: number,
    ipfsMetadata: string
  ): Promise<string> {
    // Mock soulbound token minting
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }

  async getTokenBalance(address: string): Promise<string> {
    // Mock balance
    return '100.0';
  }

  async getProjectDetails(projectId: number): Promise<any> {
    // Mock project details from blockchain
    return {
      id: projectId,
      owner: '0x' + Math.random().toString(16).substring(2, 42),
      name: 'Mock Project',
      status: 'Approved',
      issuedCredits: Math.floor(Math.random() * 1000)
    };
  }
}