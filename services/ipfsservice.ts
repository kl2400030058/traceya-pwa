'use client';

// IPFS Service for decentralized storage

/**
 * Interface for IPFS upload result
 */
export interface IPFSUploadResult {
  cid: string;
  size: number;
  url: string;
}

/**
 * Interface for IPFS file
 */
export interface IPFSFile {
  cid: string;
  size: number;
  url: string;
}

/**
 * Service for handling IPFS operations
 */
export const ipfsService = {
  /**
   * Initialize the IPFS service
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    console.log('IPFS Service initialized');
    // Initialization logic would go here in a real implementation
    return Promise.resolve();
  },

  /**
   * Upload a file to IPFS
   * @param file The file to upload
   * @returns Promise with the upload result
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  },

  /**
   * Get a file from IPFS by its CID
   * @param cid The content identifier of the file
   * @returns Promise with the file URL
   */
  async getFile(cid: string): Promise<string> {
    try {
      const response = await fetch(`/api/ipfs/get?cid=${cid}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get file from IPFS: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error getting file from IPFS:', error);
      throw error;
    }
  },

  /**
   * Get all files for a user
   * @param userId The ID of the user
   * @returns Promise with an array of IPFSFile objects
   */
  async getUserFiles(userId: string): Promise<{cid: string, size: number, url: string}[]> {
    try {
      const response = await fetch(`/api/ipfs/user-files?userId=${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get user files: ${response.statusText}`);
      }

      const data = await response.json();
      // Convert string CIDs to IPFSFile objects
      if (Array.isArray(data.files)) {
        return data.files.map((cid: string) => ({
          cid,
          size: 0, // Default size since we don't have this information
          url: this.getFileUrl(cid)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting user files:', error);
      return [];
    }
  },
  
  /**
   * Get the public URL for an IPFS file
   * @param cid The content identifier of the file
   * @returns The public URL for the file
   */
  getFileUrl(cid: string): string {
    // Using a public IPFS gateway
    return `https://ipfs.io/ipfs/${cid}`;
  }
};