/**
 * @fileoverview Consent management service
 * @description Handles consent lifecycle and validation
 */

import { Consent, ConsentPayload, ConsentGrantResult, ConsentRevokeResult } from '../types';
import { generateConsentHash, isConsentExpired } from '../utils';

export class ConsentService {
  /**
   * Grant consent for a patient resource
   */
  async grantConsent(
    patient: string,
    resourceType: string,
    resourceId: string,
    permissions: string[],
    expiryDate: string
  ): Promise<ConsentGrantResult> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const expiry = Math.floor(new Date(expiryDate).getTime() / 1000);
      
      const payload: ConsentPayload = {
        patientId: patient,
        resourceType,
        resourceId,
        permissions,
        expiryDate,
        metadata: {
          grantedAt: timestamp,
          grantedBy: 'system' // In real implementation, this would be the provider's address
        }
      };

      const consentHash = generateConsentHash(patient, resourceType, resourceId, timestamp);
      
      // In real implementation, this would call the smart contract
      const consent: Consent = {
        patient,
        provider: 'system', // Provider address
        resourceType,
        resourceId,
        payloadHash: consentHash,
        timestamp,
        expiry,
        isActive: true
      };

      return {
        success: true,
        consentHash,
        transactionHash: 'mock-tx-hash'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Revoke consent for a patient resource
   */
  async revokeConsent(consentHash: string): Promise<ConsentRevokeResult> {
    try {
      // In real implementation, this would call the smart contract
      return {
        success: true,
        transactionHash: 'mock-revoke-tx-hash'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if consent is valid for a resource
   */
  async checkConsent(
    patient: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      // In real implementation, this would query the smart contract
      // For now, return mock data
      return true;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Get consent details by hash
   */
  async getConsent(consentHash: string): Promise<Consent | null> {
    try {
      // In real implementation, this would query the smart contract
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error getting consent:', error);
      return null;
    }
  }

  /**
   * Get all consents for a patient
   */
  async getPatientConsents(patient: string): Promise<Consent[]> {
    try {
      // In real implementation, this would query the smart contract
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting patient consents:', error);
      return [];
    }
  }
} 