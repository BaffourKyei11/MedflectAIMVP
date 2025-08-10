/**
 * @fileoverview Main entry point for Medflect AI Blockchain package
 * @description Provides utilities for consent management and blockchain integration
 */

export * from './types';
export * from './utils';
export * from './services';

// Re-export common utilities
export { ethers } from 'ethers';
export type { Signer, Provider, Contract } from 'ethers';

// Version information
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@medflect/blockchain';

// Default configuration
export const DEFAULT_CONFIG = {
  CONSENT_EXPIRY_DAYS: 365,
  NETWORK_TIMEOUT: 30000,
  GAS_LIMIT: 500000,
  GAS_PRICE: 'auto',
} as const;

// Export configuration type
export type BlockchainConfig = typeof DEFAULT_CONFIG;

// Utility function to get package info
export function getPackageInfo() {
  return {
    name: PACKAGE_NAME,
    version: VERSION,
    config: DEFAULT_CONFIG,
  };
}

// Main export
export default {
  VERSION,
  PACKAGE_NAME,
  DEFAULT_CONFIG,
  getPackageInfo,
}; 