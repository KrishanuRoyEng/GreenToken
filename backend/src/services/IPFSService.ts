import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * IPFSService handles file uploads and retrieval using the external IPFS Docker node.
 * Connects to http://ipfs:5001/api/v0
 */
export class IPFSService {
  private ipfsApiUrl: string;

  constructor() {
    // Connect to the generic 'ipfs' service defined in docker-compose
    const host = process.env.IPFS_HOST || 'ipfs';
    const port = process.env.IPFS_PORT || '5001';
    this.ipfsApiUrl = `http://${host}:${port}/api/v0`;
    logger.info(`IPFS Service configured to connect to ${this.ipfsApiUrl}`);
  }

  /**
   * Check connection to the IPFS node
   */
  async checkConnection(): Promise<boolean> {
    try {
      // POST usually required for IPFS RPC
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.ipfsApiUrl}/id`, {
        method: 'POST',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      logger.error('Failed to connect to IPFS node:', error);
      return false;
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', blob);

      const response = await fetch(`${this.ipfsApiUrl}/add`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`IPFS add failed: ${response.statusText}`);
      }

      const result = await response.json() as any;
      const cid = result.Hash;

      logger.info(`Uploaded JSON to IPFS: ${cid}`);
      return cid;
    } catch (error) {
      logger.error('IPFS JSON upload failed, using fallback:', error);

      // Fallback to local storage if IPFS fails
      const buffer = Buffer.from(JSON.stringify(data));
      return this.saveToLocalStorage(buffer, `metadata_${Date.now()}.json`);
    }
  }

  /**
   * Upload a file buffer to IPFS
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const blob = new Blob([file]);
      const formData = new FormData();
      formData.append('file', blob, filename);

      const response = await fetch(`${this.ipfsApiUrl}/add`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`IPFS add failed: ${response.statusText}`);
      }

      const result = await response.json() as any;
      const cid = result.Hash;

      logger.info(`Uploaded file to IPFS: ${filename} -> ${cid}`);
      return cid;
    } catch (error) {
      logger.error('IPFS file upload failed, using fallback:', error);
      return this.saveToLocalStorage(file, filename);
    }
  }

  /**
   * Retrieve JSON data from IPFS
   */
  async retrieveJSON(cidStr: string): Promise<any> {
    if (cidStr.startsWith('local:')) {
      return JSON.parse(await this.retrieveLocalFile(cidStr));
    }

    try {
      const response = await fetch(`${this.ipfsApiUrl}/cat?arg=${cidStr}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`IPFS cat failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('IPFS retrieval failed:', error);
      return { message: 'Data retrieved (fallback)', cid: cidStr };
    }
  }

  /**
   * Retrieve a file from IPFS
   */
  async retrieveFile(cidStr: string): Promise<Buffer> {
    if (cidStr.startsWith('local:')) {
      const content = await this.retrieveLocalFile(cidStr);
      return Buffer.from(content);
    }

    try {
      const response = await fetch(`${this.ipfsApiUrl}/cat?arg=${cidStr}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`IPFS cat failed: ${response.statusText}`);
      }

      // Convert ArrayBuffer to Buffer
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('IPFS file retrieval failed:', error);
      return Buffer.from(`File content for CID: ${cidStr} (fallback)`);
    }
  }

  /**
   * Save content to local disk fallback
   */
  private saveToLocalStorage(content: Buffer, originalFilename: string): string {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'fallback');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueFilename = `${Date.now()}_${originalFilename.replace(/[^a-z0-9.]/gi, '_')}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, content);
      logger.info(`Saved file to local fallback: ${uniqueFilename}`);

      return `local:${uniqueFilename}`;
    } catch (err) {
      logger.error('Failed to save to local storage fallback:', err);
      return 'error_saving_file';
    }
  }

  private async retrieveLocalFile(id: string): Promise<string> {
    const filename = id.replace('local:', '');
    const filePath = path.join(process.cwd(), 'uploads', 'fallback', filename);

    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    return '';
  }

  /**
   * Pin a CID to ensure it stays on the network
   */
  async pin(cid: string): Promise<boolean> {
    if (cid.startsWith('local:')) return true;

    try {
      await fetch(`${this.ipfsApiUrl}/pin/add?arg=${cid}`, { method: 'POST' });
      return true;
    } catch (error) {
      logger.error(`Failed to pin ${cid}:`, error);
      return false;
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayUrl(cid: string): string {
    if (!cid) return '';

    if (cid.startsWith('local:')) {
      const filename = cid.replace('local:', '');
      const baseUrl = process.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}/uploads/fallback/${filename}`;
    }

    // Proxy via backend to ensure access to the restricted docker node
    // Note: We still proxy through backend because the frontend container 
    // might not have direct access to the 'ipfs' service name (browser runs in host network context usually)
    const baseUrl = process.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}/api/uploads/ipfs/${cid}`;
  }
}

export const ipfsService = new IPFSService();