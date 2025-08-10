import { supabase } from '../lib/supabase';
import { patientStorage, observationStorage, offlineChanges } from '../utils/offlineStorage';
import { useAuth } from '../contexts/AuthContext';

// FHIR Resource types
export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId: string;
    lastUpdated: string;
    profile?: string[];
    tag?: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  [key: string]: any;
}

// FHIR Patient resource
export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  active?: boolean;
  name?: Array<{
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
  }>;
  telecom?: Array<{
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type?: 'postal' | 'physical' | 'both';
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  maritalStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  contact?: Array<{
    relationship?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    name?: {
      use?: string;
      text?: string;
      family?: string;
      given?: string[];
      prefix?: string[];
      suffix?: string[];
    };
    telecom?: Array<{
      system?: string;
      value?: string;
      use?: string;
    }>;
    address?: {
      use?: string;
      type?: string;
      text?: string;
      line?: string[];
      city?: string;
      district?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    gender?: 'male' | 'female' | 'other' | 'unknown';
    organization?: {
      reference?: string;
      display?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  communication?: Array<{
    language: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    preferred?: boolean;
  }>;
  generalPractitioner?: Array<{
    reference?: string;
    display?: string;
  }>;
  managingOrganization?: {
    reference?: string;
    display?: string;
  };
  link?: Array<{
    other: {
      reference?: string;
      display?: string;
    };
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }>;
}

// FHIR Observation resource
export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
    display?: string;
  };
  focus?: Array<{
    reference?: string;
    display?: string;
  }>;
  encounter?: {
    reference?: string;
    display?: string;
  };
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  issued?: string;
  performer?: Array<{
    reference?: string;
    display?: string;
  }>;
  valueQuantity?: {
    value?: number;
    comparator?: '<' | '<=' | '>=' | '>';
    unit?: string;
    system?: string;
    code?: string;
  };
  valueCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: {
    low?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    high?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  };
  valueRatio?: {
    numerator?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    denominator?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  };
  valueSampledData?: {
    origin: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    period?: number;
    factor?: number;
    lowerLimit?: number;
    upperLimit?: number;
    dimensions?: number;
    data?: string;
  };
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: {
    start?: string;
    end?: string;
  };
  dataAbsentReason?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  interpretation?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  note?: Array<{
    authorReference?: {
      reference?: string;
      display?: string;
    };
    authorString?: string;
    time?: string;
    text: string;
  }>;
  bodySite?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  method?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  specimen?: {
    reference?: string;
    display?: string;
  };
  device?: {
    reference?: string;
    display?: string;
  };
  referenceRange?: Array<{
    low?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    high?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    appliesTo?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    age?: {
      low?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      high?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    };
    text?: string;
  }>;
  hasMember?: Array<{
    reference?: string;
    display?: string;
  }>;
  derivedFrom?: Array<{
    reference?: string;
    display?: string;
  }>;
  component?: Array<{
    code: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    valueQuantity?: {
      value?: number;
      comparator?: '<' | '<=' | '>=' | '>';
      unit?: string;
      system?: string;
      code?: string;
    };
    valueCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueRange?: {
      low?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      high?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    };
    valueRatio?: {
      numerator?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      denominator?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    };
    valueSampledData?: {
      origin: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      period?: number;
      factor?: number;
      lowerLimit?: number;
      upperLimit?: number;
      dimensions?: number;
      data?: string;
    };
    valueTime?: string;
    valueDateTime?: string;
    valuePeriod?: {
      start?: string;
      end?: string;
    };
    dataAbsentReason?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    interpretation?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    referenceRange?: Array<{
      low?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      high?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      type?: {
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
        text?: string;
      };
      appliesTo?: Array<{
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
        text?: string;
      }>;
      age?: {
        low?: {
          value?: number;
          unit?: string;
          system?: string;
          code?: string;
        };
        high?: {
          value?: number;
          unit?: string;
          system?: string;
          code?: string;
        };
      };
      text?: string;
    }>;
  }>;
}

// FHIR Service class
export class FHIRService {
  private static instance: FHIRService;
  private supabase = supabase;

  private constructor() {}

  public static getInstance(): FHIRService {
    if (!FHIRService.instance) {
      FHIRService.instance = new FHIRService();
    }
    return FHIRService.instance;
  }

  // Create a new FHIR resource
  async createResource<T extends FHIRResource>(
    resourceType: string,
    resource: Omit<T, 'id' | 'meta'>
  ): Promise<T> {
    try {
      // Add metadata
      const resourceWithMeta: T = {
        ...resource,
        id: crypto.randomUUID(),
        meta: {
          versionId: '1',
          lastUpdated: new Date().toISOString(),
          profile: [`http://hl7.org/fhir/StructureDefinition/${resourceType}`]
        }
      } as T;

      // Store offline first
      await this.storeOffline(resourceType, resourceWithMeta);

      // Try to sync to server
      try {
        const { data, error } = await this.supabase
          .from('fhir_resources')
          .insert({
            resource_type: resourceType,
            resource_id: resourceWithMeta.id,
            resource_json: resourceWithMeta,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Mark as synced
        await offlineChanges.markSynced(resourceWithMeta.id);
      } catch (error) {
        console.warn('Failed to sync to server, keeping offline:', error);
      }

      return resourceWithMeta;
    } catch (error) {
      console.error('Error creating FHIR resource:', error);
      throw error;
    }
  }

  // Get a FHIR resource by ID
  async getResource<T extends FHIRResource>(
    resourceType: string,
    id: string
  ): Promise<T | null> {
    try {
      // Try server first
      try {
        const { data, error } = await this.supabase
          .from('fhir_resources')
          .select('*')
          .eq('resource_type', resourceType)
          .eq('resource_id', id)
          .single();

        if (error) throw error;
        if (data) {
          // Cache locally
          await this.storeOffline(resourceType, data.resource_json);
          return data.resource_json as T;
        }
      } catch (error) {
        console.warn('Failed to get from server, trying offline:', error);
      }

      // Try offline storage
      return await this.getOffline(resourceType, id);
    } catch (error) {
      console.error('Error getting FHIR resource:', error);
      return null;
    }
  }

  // Update a FHIR resource
  async updateResource<T extends FHIRResource>(
    resourceType: string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    try {
      const existing = await this.getResource<T>(resourceType, id);
      if (!existing) throw new Error('Resource not found');

      const updated: T = {
        ...existing,
        ...updates,
        meta: {
          ...existing.meta,
          versionId: String(Number(existing.meta?.versionId || '1') + 1),
          lastUpdated: new Date().toISOString()
        }
      };

      // Store offline first
      await this.storeOffline(resourceType, updated);

      // Try to sync to server
      try {
        const { error } = await this.supabase
          .from('fhir_resources')
          .upsert({
            resource_type: resourceType,
            resource_id: id,
            resource_json: updated,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Mark as synced
        await offlineChanges.markSynced(id);
      } catch (error) {
        console.warn('Failed to sync to server, keeping offline:', error);
      }

      return updated;
    } catch (error) {
      console.error('Error updating FHIR resource:', error);
      throw error;
    }
  }

  // Delete a FHIR resource
  async deleteResource(resourceType: string, id: string): Promise<boolean> {
    try {
      // Mark for deletion offline
      await offlineChanges.add({
        type: 'DELETE',
        resourceType,
        resourceId: id,
        resource: null,
        userId: 'current-user' // TODO: Get from auth context
      });

      // Remove from offline storage
      await this.removeOffline(resourceType, id);

      // Try to sync to server
      try {
        const { error } = await this.supabase
          .from('fhir_resources')
          .delete()
          .eq('resource_type', resourceType)
          .eq('resource_id', id);

        if (error) throw error;

        // Mark as synced
        await offlineChanges.markSynced(id);
      } catch (error) {
        console.warn('Failed to sync to server, keeping offline:', error);
      }

      return true;
    } catch (error) {
      console.error('Error deleting FHIR resource:', error);
      throw error;
    }
  }

  // Search FHIR resources
  async searchResources<T extends FHIRResource>(
    resourceType: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    try {
      // Try server first
      try {
        let query = this.supabase
          .from('fhir_resources')
          .select('*')
          .eq('resource_type', resourceType);

        // Apply search parameters
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(`resource_json->>${key}`, value);
          }
        });

        const { data, error } = await query;

        if (error) throw error;
        if (data && data.length > 0) {
          // Cache locally
          for (const item of data) {
            await this.storeOffline(resourceType, item.resource_json);
          }
          return data.map(item => item.resource_json as T);
        }
      } catch (error) {
        console.warn('Failed to search server, trying offline:', error);
      }

      // Try offline storage
      return await this.searchOffline<T>(resourceType, params);
    } catch (error) {
      console.error('Error searching FHIR resources:', error);
      return [];
    }
  }

  // Offline storage methods
  private async storeOffline<T extends FHIRResource>(
    resourceType: string,
    resource: T
  ): Promise<void> {
    switch (resourceType) {
      case 'Patient':
        await patientStorage.save(resource);
        break;
      case 'Observation':
        await observationStorage.save(resource);
        break;
      default:
        // Store in generic offline storage
        const storage = new (await import('../utils/offlineStorage')).OfflineStorageManager();
        await storage.set(`${resourceType.toLowerCase()}s`, resource);
    }
  }

  private async getOffline<T extends FHIRResource>(
    resourceType: string,
    id: string
  ): Promise<T | null> {
    switch (resourceType) {
      case 'Patient':
        return await patientStorage.getById(id);
      case 'Observation':
        const observations = await observationStorage.getAll();
        return observations.find(o => o.id === id) || null;
      default:
        const storage = new (await import('../utils/offlineStorage')).OfflineStorageManager();
        const resources = await storage.get(`${resourceType.toLowerCase()}s`) || [];
        return resources.find((r: any) => r.id === id) || null;
    }
  }

  private async removeOffline(resourceType: string, id: string): Promise<void> {
    switch (resourceType) {
      case 'Patient':
        await patientStorage.delete(id);
        break;
      case 'Observation':
        await observationStorage.delete(id);
        break;
      default:
        const storage = new (await import('../utils/offlineStorage')).OfflineStorageManager();
        const resources = await storage.get(`${resourceType.toLowerCase()}s`) || [];
        const filtered = resources.filter((r: any) => r.id !== id);
        await storage.set(`${resourceType.toLowerCase()}s`, filtered);
    }
  }

  private async searchOffline<T extends FHIRResource>(
    resourceType: string,
    params: Record<string, any>
  ): Promise<T[]> {
    switch (resourceType) {
      case 'Patient':
        const patients = await patientStorage.getAll();
        return this.filterResources(patients, params) as T[];
      case 'Observation':
        const observations = await observationStorage.getAll();
        return this.filterResources(observations, params) as T[];
      default:
        const storage = new (await import('../utils/offlineStorage')).OfflineStorageManager();
        const resources = await storage.get(`${resourceType.toLowerCase()}s`) || [];
        return this.filterResources(resources, params) as T[];
    }
  }

  private filterResources<T extends FHIRResource>(
    resources: T[],
    params: Record<string, any>
  ): T[] {
    return resources.filter(resource => {
      return Object.entries(params).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        
        const resourceValue = this.getNestedValue(resource, key);
        return resourceValue === value;
      });
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Sync offline changes
  async syncOfflineChanges(): Promise<void> {
    try {
      const unsynced = await offlineChanges.getUnsynced();
      
      for (const change of unsynced) {
        try {
          if (change.type === 'CREATE' || change.type === 'UPDATE') {
            await this.supabase
              .from('fhir_resources')
              .upsert({
                resource_type: change.resourceType,
                resource_id: change.resourceId,
                resource_json: change.resource,
                updated_at: new Date().toISOString()
              });
          } else if (change.type === 'DELETE') {
            await this.supabase
              .from('fhir_resources')
              .delete()
              .eq('resource_type', change.resourceType)
              .eq('resource_id', change.resourceId);
          }

          await offlineChanges.markSynced(change.id);
        } catch (error) {
          console.error(`Failed to sync change ${change.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing offline changes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const fhirService = FHIRService.getInstance(); 