/**
 * @fileoverview Type definitions for Medflect AI Blockchain package
 * @description Core types for consent management and blockchain integration
 */

export interface Consent {
  patient: string;
  provider: string;
  resourceType: string;
  resourceId: string;
  payloadHash: string;
  timestamp: number;
  expiry: number;
  isActive: boolean;
}

export interface AccessLog {
  consentHash: string;
  resourceType: string;
  resourceId: string;
  accessType: string;
  timestamp: number;
  provider: string;
}

export interface ConsentStats {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  totalAccessLogs: number;
}

export interface ConsentPayload {
  patientId: string;
  resourceType: string;
  resourceId: string;
  permissions: string[];
  expiryDate: string;
  metadata?: Record<string, any>;
}

export interface BlockchainConfig {
  network: string;
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  privateKey?: string;
}

export interface ConsentVerificationResult {
  isValid: boolean;
  consent?: Consent;
  error?: string;
}

export interface ConsentGrantResult {
  success: boolean;
  consentHash?: string;
  transactionHash?: string;
  error?: string;
}

export interface ConsentRevokeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface AccessLogResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export type NetworkType = 'hardhat' | 'localhost' | 'ganache' | 'sepolia' | 'mainnet';

export type ResourceType = 'Patient' | 'Observation' | 'Encounter' | 'DocumentReference' | 'Consent';

export type AccessType = 'read' | 'write' | 'delete' | 'export' | 'share'; 