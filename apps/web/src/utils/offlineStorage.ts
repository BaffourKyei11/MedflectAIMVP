import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'MedflectAI',
  storeName: 'offline_data',
  description: 'Offline storage for Medflect AI application'
});

// Storage keys
export const STORAGE_KEYS = {
  PATIENTS: 'patients',
  OBSERVATIONS: 'observations',
  ENCOUNTERS: 'encounters',
  DOCUMENTS: 'documents',
  CONSENTS: 'consents',
  OFFLINE_CHANGES: 'offline_changes',
  USER_PREFERENCES: 'user_preferences',
  CACHE_TIMESTAMP: 'cache_timestamp'
} as const;

// Offline change types
export interface OfflineChange {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId: string;
  resource: any;
  timestamp: number;
  userId: string;
  synced: boolean;
}

// Offline storage interface
export interface OfflineStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// Offline storage implementation
class OfflineStorageManager implements OfflineStorage {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await localforage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await localforage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await localforage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await localforage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return await localforage.keys();
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }
}

// Patient storage operations
export const patientStorage = {
  async getAll(): Promise<any[]> {
    const storage = new OfflineStorageManager();
    return await storage.get(STORAGE_KEYS.PATIENTS) || [];
  },

  async getById(id: string): Promise<any | null> {
    const patients = await this.getAll();
    return patients.find(p => p.id === id) || null;
  },

  async save(patient: any): Promise<void> {
    const storage = new OfflineStorageManager();
    const patients = await this.getAll();
    const existingIndex = patients.findIndex(p => p.id === patient.id);
    
    if (existingIndex >= 0) {
      patients[existingIndex] = patient;
    } else {
      patients.push(patient);
    }
    
    await storage.set(STORAGE_KEYS.PATIENTS, patients);
  },

  async delete(id: string): Promise<void> {
    const storage = new OfflineStorageManager();
    const patients = await this.getAll();
    const filtered = patients.filter(p => p.id !== id);
    await storage.set(STORAGE_KEYS.PATIENTS, filtered);
  }
};

// Observation storage operations
export const observationStorage = {
  async getAll(): Promise<any[]> {
    const storage = new OfflineStorageManager();
    return await storage.get(STORAGE_KEYS.OBSERVATIONS) || [];
  },

  async getByPatientId(patientId: string): Promise<any[]> {
    const observations = await this.getAll();
    return observations.filter(o => o.subject?.reference === `Patient/${patientId}`);
  },

  async save(observation: any): Promise<void> {
    const storage = new OfflineStorageManager();
    const observations = await this.getAll();
    const existingIndex = observations.findIndex(o => o.id === observation.id);
    
    if (existingIndex >= 0) {
      observations[existingIndex] = observation;
    } else {
      observations.push(observation);
    }
    
    await storage.set(STORAGE_KEYS.OBSERVATIONS, observations);
  },

  async delete(id: string): Promise<void> {
    const storage = new OfflineStorageManager();
    const observations = await this.getAll();
    const filtered = observations.filter(o => o.id !== id);
    await storage.set(STORAGE_KEYS.OBSERVATIONS, filtered);
  }
};

// Offline changes tracking
export const offlineChanges = {
  async getAll(): Promise<OfflineChange[]> {
    const storage = new OfflineStorageManager();
    return await storage.get(STORAGE_KEYS.OFFLINE_CHANGES) || [];
  },

  async add(change: Omit<OfflineChange, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const storage = new OfflineStorageManager();
    const changes = await this.getAll();
    const newChange: OfflineChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false
    };
    
    changes.push(newChange);
    await storage.set(STORAGE_KEYS.OFFLINE_CHANGES, changes);
  },

  async markSynced(id: string): Promise<void> {
    const storage = new OfflineStorageManager();
    const changes = await this.getAll();
    const change = changes.find(c => c.id === id);
    
    if (change) {
      change.synced = true;
      await storage.set(STORAGE_KEYS.OFFLINE_CHANGES, changes);
    }
  },

  async getUnsynced(): Promise<OfflineChange[]> {
    const changes = await this.getAll();
    return changes.filter(c => !c.synced);
  },

  async clearSynced(): Promise<void> {
    const storage = new OfflineStorageManager();
    const changes = await this.getAll();
    const unsynced = changes.filter(c => !c.synced);
    await storage.set(STORAGE_KEYS.OFFLINE_CHANGES, unsynced);
  }
};

// Cache management
export const cacheManager = {
  async setTimestamp(): Promise<void> {
    const storage = new OfflineStorageManager();
    await storage.set(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now());
  },

  async getTimestamp(): Promise<number | null> {
    const storage = new OfflineStorageManager();
    return await storage.get(STORAGE_KEYS.CACHE_TIMESTAMP);
  },

  async isStale(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    const timestamp = await this.getTimestamp();
    if (!timestamp) return true;
    
    return Date.now() - timestamp > maxAgeMs;
  }
};

// Export the main storage instance
export const offlineStorage = new OfflineStorageManager(); 