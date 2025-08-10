# Medflect AI Security Guide

## Security Overview

Medflect AI implements a comprehensive security framework designed to protect sensitive healthcare data while maintaining compliance with healthcare regulations like HIPAA. This guide covers all security measures, best practices, and implementation details.

## Security Architecture

### Defense in Depth

The application implements multiple layers of security:

1. **Network Security**: HTTPS, CORS, rate limiting
2. **Application Security**: Input validation, authentication, authorization
3. **Data Security**: Encryption at rest and in transit
4. **Infrastructure Security**: Container security, environment isolation
5. **Audit & Compliance**: Comprehensive logging, blockchain audit trail

### Security Principles

- **Zero Trust**: Never trust, always verify
- **Least Privilege**: Minimum access required for functionality
- **Defense in Depth**: Multiple security layers
- **Secure by Default**: Security features enabled by default
- **Privacy by Design**: Data protection built into architecture

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

```typescript
// Implementation in AuthContext.tsx
const enableMFA = async () => {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });
    
    if (error) throw error;
    
    // Generate QR code for TOTP app
    return data;
  } catch (error) {
    console.error('MFA enrollment failed:', error);
    throw error;
  }
};
```

### Role-Based Access Control (RBAC)

```typescript
// User roles defined in types/index.ts
export enum UserRole {
  ADMIN = 'admin',
  CLINICIAN = 'clinician',
  RESEARCHER = 'researcher',
  AUDITOR = 'auditor'
}

// Permission matrix
export const PERMISSIONS = {
  [UserRole.ADMIN]: ['*'], // All permissions
  [UserRole.CLINICIAN]: [
    'patients:read',
    'patients:write',
    'observations:read',
    'observations:write',
    'ai:summary:read'
  ],
  [UserRole.RESEARCHER]: [
    'patients:read:anonymized',
    'observations:read:anonymized',
    'analytics:read'
  ],
  [UserRole.AUDITOR]: [
    'audit:read',
    'consent:read',
    'blockchain:read'
  ]
};
```

### JWT Token Security

```typescript
// JWT configuration in supabase.ts
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: import.meta.env.DEV
    },
    global: {
      headers: {
        'X-Client-Info': 'medflect-ai-web'
      }
    }
  }
);
```

## Data Protection

### Encryption

#### At Rest Encryption

```typescript
// Database encryption configuration
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  saltLength: 32,
  ivLength: 16,
  tagLength: 16
};

// Field-level encryption for sensitive data
export const encryptField = async (value: string, key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
};
```

#### In Transit Encryption

```typescript
// HTTPS enforcement
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
};

// API security middleware
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Enforce HTTPS
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'HTTPS required' });
  }
  
  // Rate limiting
  const clientId = req.ip || req.connection.remoteAddress;
  if (rateLimitExceeded(clientId)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  next();
};
```

### Data Classification

```typescript
// Data sensitivity levels
export enum DataSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

// Data classification mapping
export const DATA_CLASSIFICATION = {
  'Patient.name': DataSensitivity.CONFIDENTIAL,
  'Patient.birthDate': DataSensitivity.CONFIDENTIAL,
  'Patient.identifier': DataSensitivity.CONFIDENTIAL,
  'Observation.value': DataSensitivity.RESTRICTED,
  'Observation.note': DataSensitivity.RESTRICTED,
  'Consent.status': DataSensitivity.INTERNAL,
  'AuditLog.timestamp': DataSensitivity.INTERNAL
};
```

## Row Level Security (RLS)

### Database Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- User access policy
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Patient access policy
CREATE POLICY "Clinicians can access assigned patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_patient_assignments
      WHERE user_id = auth.uid()
      AND patient_id = patients.id
    )
  );

-- FHIR resource access policy
CREATE POLICY "Access FHIR resources for assigned patients" ON fhir_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN user_patient_assignments upa ON p.id = upa.patient_id
      WHERE upa.user_id = auth.uid()
      AND fhir_resources.patient_id = p.id
    )
  );
```

### Policy Enforcement

```typescript
// RLS policy enforcement in services
export class FHIRService {
  private async enforceAccessControl(resourceType: string, resourceId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Check user permissions
    const hasPermission = await this.checkPermission(
      user.id,
      resourceType,
      'read'
    );
    
    if (!hasPermission) {
      throw new Error('Access denied');
    }
    
    return true;
  }
  
  private async checkPermission(
    userId: string,
    resourceType: string,
    action: string
  ): Promise<boolean> {
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (!userRole) return false;
    
    const permissions = PERMISSIONS[userRole.role] || [];
    return permissions.includes('*') || permissions.includes(`${resourceType}:${action}`);
  }
}
```

## API Security

### Input Validation

```typescript
// FHIR resource validation
export const validateFHIRResource = (resource: any, resourceType: string): ValidationResult => {
  const schema = FHIR_SCHEMAS[resourceType];
  if (!schema) {
    return { valid: false, errors: [`Unknown resource type: ${resourceType}`] };
  }
  
  try {
    // Validate against JSON schema
    const validation = schema.validate(resource);
    
    if (validation.error) {
      return {
        valid: false,
        errors: validation.error.details.map(d => d.message)
      };
    }
    
    // Additional FHIR-specific validation
    const fhirValidation = validateFHIRConstraints(resource, resourceType);
    if (!fhirValidation.valid) {
      return fhirValidation;
    }
    
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [`Validation error: ${error.message}`] };
  }
};

// SQL injection prevention
export const sanitizeSQLInput = (input: string): string => {
  // Remove SQL injection patterns
  const dangerousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\b(and|or)\b\s+\d+\s*=\s*\d+)/gi
  ];
  
  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};
```

### Rate Limiting

```typescript
// Rate limiting implementation
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, [now]);
      return true;
    }
    
    const clientRequests = this.requests.get(clientId)!;
    const recentRequests = clientRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    
    return true;
  }
  
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [clientId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, recentRequests);
      }
    }
  }
}
```

## Blockchain Security

### Smart Contract Security

```solidity
// ConsentAudit.sol - Security features
contract ConsentAudit {
    // Access control
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || 
            authorizedUsers[msg.sender], 
            "Not authorized"
        );
        _;
    }
    
    // Reentrancy protection
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    // Event logging for audit
    event ConsentGranted(
        address indexed patient,
        address indexed provider,
        bytes32 indexed consentHash,
        uint256 timestamp
    );
    
    event ConsentRevoked(
        address indexed patient,
        address indexed provider,
        bytes32 indexed consentHash,
        uint256 timestamp
    );
    
    // Secure consent management
    function grantConsent(
        address patient,
        bytes32 consentHash,
        uint256 expiry
    ) external onlyAuthorized nonReentrant {
        require(patient != address(0), "Invalid patient address");
        require(consentHash != bytes32(0), "Invalid consent hash");
        require(expiry > block.timestamp, "Expiry must be in future");
        
        consents[patient][consentHash] = Consent({
            provider: msg.sender,
            grantedAt: block.timestamp,
            expiresAt: expiry,
            isActive: true
        });
        
        emit ConsentGranted(patient, msg.sender, consentHash, block.timestamp);
    }
}
```

### Private Key Management

```typescript
// Secure private key handling
export class KeyManager {
  private static readonly KEY_STORAGE_KEY = 'medflect_encrypted_key';
  
  // Never store private keys in plain text
  static async storePrivateKey(privateKey: string, password: string): Promise<void> {
    const encryptedKey = await this.encryptPrivateKey(privateKey, password);
    localStorage.setItem(this.KEY_STORAGE_KEY, encryptedKey);
  }
  
  static async getPrivateKey(password: string): Promise<string> {
    const encryptedKey = localStorage.getItem(this.KEY_STORAGE_KEY);
    if (!encryptedKey) {
      throw new Error('No private key found');
    }
    
    return await this.decryptPrivateKey(encryptedKey, password);
  }
  
  private static async encryptPrivateKey(privateKey: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('medflect-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(privateKey)
    );
    
    return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
  }
}
```

## Audit & Compliance

### Comprehensive Logging

```typescript
// Audit logging service
export class AuditLogger {
  static async logAction(action: AuditAction): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const auditEntry = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'anonymous',
      action: action.type,
      resource_type: action.resourceType,
      resource_id: action.resourceId,
      details: action.details,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      blockchain_hash: null // Will be set after blockchain logging
    };
    
    // Store in database
    const { error: dbError } = await supabase
      .from('audit_logs')
      .insert(auditEntry);
    
    if (dbError) {
      console.error('Failed to log audit entry:', dbError);
    }
    
    // Log to blockchain for immutability
    try {
      const blockchainHash = await this.logToBlockchain(auditEntry);
      
      // Update database with blockchain hash
      await supabase
        .from('audit_logs')
        .update({ blockchain_hash: blockchainHash })
        .eq('id', auditEntry.id);
    } catch (error) {
      console.error('Failed to log to blockchain:', error);
    }
  }
  
  private static async logToBlockchain(auditEntry: any): Promise<string> {
    // Implementation for blockchain logging
    // This would interact with the smart contract
    return '0x...'; // Transaction hash
  }
}
```

### Compliance Monitoring

```typescript
// Compliance checker
export class ComplianceChecker {
  static async checkHIPAACompliance(): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      timestamp: new Date().toISOString(),
      checks: [],
      overall: 'PASS'
    };
    
    // Check encryption at rest
    const encryptionCheck = await this.checkEncryptionAtRest();
    report.checks.push(encryptionCheck);
    
    // Check access controls
    const accessControlCheck = await this.checkAccessControls();
    report.checks.push(accessControlCheck);
    
    // Check audit logging
    const auditCheck = await this.checkAuditLogging();
    report.checks.push(auditCheck);
    
    // Check data retention
    const retentionCheck = await this.checkDataRetention();
    report.checks.push(retentionCheck);
    
    // Determine overall status
    const failedChecks = report.checks.filter(check => check.status === 'FAIL');
    if (failedChecks.length > 0) {
      report.overall = 'FAIL';
      report.failedChecks = failedChecks;
    }
    
    return report;
  }
}
```

## Security Testing

### Automated Security Tests

```typescript
// Security test suite
describe('Security Tests', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const result = await fhirService.searchPatients(maliciousInput);
    
    // Should not execute malicious SQL
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  test('should enforce authentication', async () => {
    // Clear authentication
    await supabase.auth.signOut();
    
    try {
      await fhirService.getPatient('123');
      fail('Should require authentication');
    } catch (error) {
      expect(error.message).toContain('Authentication required');
    }
  });
  
  test('should enforce authorization', async () => {
    // Login as non-admin user
    await supabase.auth.signInWithPassword({
      email: 'clinician@example.com',
      password: 'password'
    });
    
    try {
      await adminService.getAllUsers();
      fail('Should require admin role');
    } catch (error) {
      expect(error.message).toContain('Access denied');
    }
  });
  
  test('should validate FHIR resources', async () => {
    const invalidResource = {
      resourceType: 'Patient',
      // Missing required fields
    };
    
    const validation = validateFHIRResource(invalidResource, 'Patient');
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
```

### Penetration Testing

```typescript
// Security scanner
export class SecurityScanner {
  static async runVulnerabilityScan(): Promise<VulnerabilityReport> {
    const report: VulnerabilityReport = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      riskLevel: 'LOW'
    };
    
    // Check for common vulnerabilities
    const checks = [
      this.checkXSSVulnerabilities(),
      this.checkCSRFVulnerabilities(),
      this.checkInjectionVulnerabilities(),
      this.checkAuthenticationVulnerabilities(),
      this.checkAuthorizationVulnerabilities()
    ];
    
    const results = await Promise.all(checks);
    
    results.forEach(result => {
      if (result.vulnerabilities.length > 0) {
        report.vulnerabilities.push(...result.vulnerabilities);
      }
    });
    
    // Calculate risk level
    const highRiskCount = report.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumRiskCount = report.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    
    if (highRiskCount > 0) {
      report.riskLevel = 'HIGH';
    } else if (mediumRiskCount > 0) {
      report.riskLevel = 'MEDIUM';
    }
    
    return report;
  }
}
```

## Incident Response

### Security Incident Handling

```typescript
// Incident response service
export class IncidentResponse {
  static async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // Log the incident
    await this.logIncident(incident);
    
    // Assess severity
    const severity = this.assessSeverity(incident);
    
    // Take immediate action
    if (severity === 'CRITICAL') {
      await this.takeEmergencyAction(incident);
    }
    
    // Notify stakeholders
    await this.notifyStakeholders(incident, severity);
    
    // Begin investigation
    await this.investigateIncident(incident);
    
    // Implement remediation
    await this.remediateIncident(incident);
    
    // Document lessons learned
    await this.documentLessonsLearned(incident);
  }
  
  private static async takeEmergencyAction(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'DATA_BREACH':
        await this.quarantineAffectedData(incident);
        await this.disableCompromisedAccounts(incident);
        break;
      
      case 'UNAUTHORIZED_ACCESS':
        await this.revokeAllSessions(incident.userId);
        await this.enableEnhancedMonitoring();
        break;
      
      case 'MALWARE_DETECTION':
        await this.isolateAffectedSystems(incident);
        await this.scanAllSystems();
        break;
    }
  }
}
```

## Security Best Practices

### Development Guidelines

1. **Never commit secrets to version control**
   - Use environment variables
   - Use .env files (never committed)
   - Use secret management services

2. **Always validate and sanitize inputs**
   - Use TypeScript for type safety
   - Validate against schemas
   - Sanitize SQL inputs
   - Escape HTML outputs

3. **Implement proper error handling**
   - Don't expose internal errors
   - Log errors securely
   - Use generic error messages for users

4. **Follow the principle of least privilege**
   - Grant minimum required permissions
   - Use role-based access control
   - Regularly review permissions

5. **Keep dependencies updated**
   - Regular security audits
   - Automated vulnerability scanning
   - Prompt security updates

### Operational Security

1. **Regular security audits**
   - Code reviews with security focus
   - Penetration testing
   - Vulnerability assessments

2. **Monitor and log everything**
   - Application logs
   - Access logs
   - Security event logs
   - Blockchain audit trail

3. **Incident response planning**
   - Documented procedures
   - Regular drills
   - Clear escalation paths

4. **Employee security training**
   - Security awareness programs
   - Phishing simulation
   - Social engineering training

## Compliance & Regulations

### HIPAA Compliance

- **Administrative Safeguards**: Policies, procedures, training
- **Physical Safeguards**: Facility access, workstation security
- **Technical Safeguards**: Access control, audit logs, integrity

### GDPR Compliance

- **Data Minimization**: Collect only necessary data
- **Consent Management**: Clear consent mechanisms
- **Right to be Forgotten**: Data deletion capabilities
- **Data Portability**: Export capabilities

### FHIR Compliance

- **Resource Validation**: Schema compliance
- **Terminology Binding**: Standard code systems
- **Security Labels**: Sensitivity classifications
- **Provenance**: Data lineage tracking

## Security Monitoring

### Real-time Monitoring

```typescript
// Security monitoring service
export class SecurityMonitor {
  private static alerts: SecurityAlert[] = [];
  
  static async monitorSecurityEvents(): Promise<void> {
    // Monitor authentication events
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await this.logSuccessfulLogin(session?.user);
      } else if (event === 'SIGNED_OUT') {
        await this.logLogout(session?.user);
      }
    });
    
    // Monitor API usage
    this.monitorAPIUsage();
    
    // Monitor database access
    this.monitorDatabaseAccess();
    
    // Monitor blockchain transactions
    this.monitorBlockchainActivity();
  }
  
  private static async logSuccessfulLogin(user: User | null): Promise<void> {
    if (!user) return;
    
    const loginEvent = {
      type: 'LOGIN_SUCCESS',
      user_id: user.id,
      timestamp: new Date().toISOString(),
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    };
    
    await AuditLogger.logAction(loginEvent);
    
    // Check for suspicious activity
    await this.checkSuspiciousActivity(user.id);
  }
}
```

### Threat Detection

```typescript
// Threat detection engine
export class ThreatDetector {
  static async detectThreats(): Promise<ThreatReport[]> {
    const threats: ThreatReport[] = [];
    
    // Check for brute force attacks
    const bruteForceThreats = await this.detectBruteForce();
    threats.push(...bruteForceThreats);
    
    // Check for data exfiltration
    const exfiltrationThreats = await this.detectDataExfiltration();
    threats.push(...exfiltrationThreats);
    
    // Check for privilege escalation
    const escalationThreats = await this.detectPrivilegeEscalation();
    threats.push(...escalationThreats);
    
    // Check for anomalous behavior
    const anomalousThreats = await this.detectAnomalousBehavior();
    threats.push(...anomalousThreats);
    
    return threats;
  }
  
  private static async detectBruteForce(): Promise<ThreatReport[]> {
    const threats: ThreatReport[] = [];
    
    // Check for multiple failed login attempts
    const { data: failedLogins } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'LOGIN_FAILED')
      .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes
    
    if (failedLogins && failedLogins.length > 5) {
      threats.push({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        description: `Multiple failed login attempts detected: ${failedLogins.length}`,
        affected_users: [...new Set(failedLogins.map(l => l.user_id))],
        timestamp: new Date().toISOString()
      });
    }
    
    return threats;
  }
}
```

This comprehensive security guide ensures that Medflect AI maintains the highest security standards while protecting sensitive healthcare data and maintaining regulatory compliance. 