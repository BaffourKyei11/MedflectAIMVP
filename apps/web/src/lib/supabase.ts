import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'clinician' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'admin' | 'clinician' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'clinician' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
      };
      fhir_resources: {
        Row: {
          id: string;
          resource_type: string;
          resource_id: string;
          resource_json: any;
          created_at: string;
          updated_at: string;
          created_by: string;
          organization_id: string;
        };
        Insert: {
          id?: string;
          resource_type: string;
          resource_id: string;
          resource_json: any;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          organization_id?: string;
        };
        Update: {
          id?: string;
          resource_type?: string;
          resource_id?: string;
          resource_json?: any;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          organization_id?: string;
        };
      };
      ai_summaries: {
        Row: {
          id: string;
          patient_id: string;
          summary: string;
          type: 'discharge' | 'progress' | 'risk' | 'general';
          provenance: any;
          metadata: any;
          created_at: string;
          updated_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          summary: string;
          type?: 'discharge' | 'progress' | 'risk' | 'general';
          provenance?: any;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          summary?: string;
          type?: 'discharge' | 'progress' | 'risk' | 'general';
          provenance?: any;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id: string;
          details: any;
          ip_address: string;
          user_agent: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id: string;
          details?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          details?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
      consents: {
        Row: {
          id: string;
          patient_id: string;
          consent_type: string;
          status: 'active' | 'revoked' | 'expired';
          granted_at: string;
          expires_at: string;
          granted_by: string;
          blockchain_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          consent_type: string;
          status?: 'active' | 'revoked' | 'expired';
          granted_at?: string;
          expires_at?: string;
          granted_by?: string;
          blockchain_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          consent_type?: string;
          status?: 'active' | 'revoked' | 'expired';
          granted_at?: string;
          expires_at?: string;
          granted_by?: string;
          blockchain_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rules: {
        Row: {
          id: string;
          name: string;
          description: string;
          rule_definition: any;
          is_active: boolean;
          priority: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          rule_definition: any;
          is_active?: boolean;
          priority?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          rule_definition?: any;
          is_active?: boolean;
          priority?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Export typed client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper functions for common operations
export const supabaseHelpers = {
  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  },

  // Get user role
  async getUserRole(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.role || null;
    } catch {
      return null;
    }
  },

  // Check if user has permission
  async hasPermission(requiredRole: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole();
      if (!userRole) return false;

      const roleHierarchy = {
        'viewer': 1,
        'clinician': 2,
        'admin': 3
      };

      return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
    } catch {
      return false;
    }
  }
}; 