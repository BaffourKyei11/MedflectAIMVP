/**
 * @fileoverview Utility functions for Medflect AI Blockchain package
 * @description Helper functions for consent management and blockchain operations
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 hash of consent payload
 */
export function hashConsentPayload(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generate unique consent hash from patient, resource, and timestamp
 */
export function generateConsentHash(
  patient: string,
  resourceType: string,
  resourceId: string,
  timestamp: number
): string {
  const payload = `${patient}:${resourceType}:${resourceId}:${timestamp}`;
  return hashConsentPayload(payload);
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format timestamp to human-readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Check if consent is expired
 */
export function isConsentExpired(expiry: number): boolean {
  return Math.floor(Date.now() / 1000) > expiry;
}

/**
 * Generate random bytes for testing
 */
export function generateRandomBytes(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Convert wei to ether
 */
export function weiToEther(wei: string | number): number {
  const weiNum = typeof wei === 'string' ? parseInt(wei) : wei;
  return weiNum / Math.pow(10, 18);
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: number): string {
  return (ether * Math.pow(10, 18)).toString();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
} 