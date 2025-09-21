/**
 * Crypto utilities for Traceya app
 * Provides cryptographic functions for blockchain anchoring and verification
 */
import * as CryptoJS from 'crypto-js';

/**
 * Generate a SHA-256 hash of the input string
 * @param data The string data to hash
 * @returns SHA-256 hash as a hexadecimal string
 */
export const sha256 = async (data: string): Promise<string> => {
  try {
    // Primary implementation using Web Crypto API
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      
      // Convert the hash buffer to a hexadecimal string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    }
    
    // Fallback to CryptoJS for environments without Web Crypto API
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('SHA-256 hashing failed:', error);
    // Fallback to CryptoJS if Web Crypto API fails
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }
};

/**
 * Generate a synchronous SHA-256 hash (for use in non-async contexts)
 * Uses CryptoJS for reliable SHA-256 hashing
 * @param data The string data to hash
 * @returns SHA-256 hash as a hexadecimal string
 */
export const sha256Sync = (data: string): string => {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
};

/**
 * Generate a hash for a file using its content
 * @param fileContent The file content as string or ArrayBuffer
 * @returns SHA-256 hash as a hexadecimal string
 */
export const hashFile = async (fileContent: string | ArrayBuffer): Promise<string> => {
  if (typeof fileContent === 'string') {
    return sha256(fileContent);
  }
  
  // Convert ArrayBuffer to WordArray for CryptoJS
  const wordArray = CryptoJS.lib.WordArray.create(fileContent);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
};

/**
 * Verify a digital signature
 * @param data The original data that was signed
 * @param signature The signature to verify
 * @param publicKey The public key to use for verification
 * @returns Whether the signature is valid
 */
export const verifySignature = (data: string, signature: string, publicKey: string): boolean => {
  // This is a placeholder for actual signature verification
  // In a real implementation, this would use a proper digital signature algorithm
  // For now, we'll just compare hashes as a simulation
  const dataHash = sha256Sync(data);
  return signature === dataHash;
};