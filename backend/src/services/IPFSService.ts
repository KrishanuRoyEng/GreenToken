// Mock IPFS service for development (no real IPFS needed)
export class IPFSService {
  async uploadJSON(data: any): Promise<string> {
    // Mock IPFS hash
    const mockHash = 'Qm' + Math.random().toString(36).substring(2, 46);
    console.log('Mock IPFS upload:', mockHash, data);
    return mockHash;
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    // Mock file upload
    const mockHash = 'Qm' + Math.random().toString(36).substring(2, 46);
    console.log('Mock IPFS file upload:', mockHash, filename);
    return mockHash;
  }

  async retrieveJSON(hash: string): Promise<any> {
    // Mock retrieval
    return {
      message: 'Mock data retrieved from IPFS',
      hash,
      timestamp: new Date().toISOString()
    };
  }

  async retrieveFile(hash: string): Promise<Buffer> {
    // Mock file retrieval
    return Buffer.from(`Mock file content for hash: ${hash}`);
  }
}