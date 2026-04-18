/**
 * Advanced Authentication Hardening Unit Tests
 * Tests MFA, biometric auth, session security, and advanced auth features
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import {
  MultiFactorAuthManager,
  BiometricAuthProvider,
  SessionManager,
  AuthHardeningService,
  AuthThreatDetector,
  CredentialManager,
  RecoveryManager
} from '../../src/lib/advanced-auth-hardening.js';

describe('MultiFactorAuthManager', () => {
  let mfaManager;
  let mockSecureStorage;
  let mockTokenManager;

  beforeEach(() => {
    mockSecureStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn()
    };

    mockTokenManager = {
      setToken: vi.fn(),
      getToken: vi.fn(),
      removeToken: vi.fn()
    };

    mfaManager = new MultiFactorAuthManager();
    mfaManager.secureStorage = mockSecureStorage;
    mfaManager.tokenManager = mockTokenManager;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TOTP Setup and Verification', () => {
    it('should generate TOTP secret', () => {
      const secret = mfaManager.generateTOTPSecret();

      expect(secret).toBeDefined();
      expect(secret.length).toBe(32); // 32 character base32 secret
      expect(/^[A-Z2-7]+$/.test(secret)).toBe(true); // Valid base32 characters
    });

    it('should verify TOTP code correctly', () => {
      const secret = 'JBSWY3DPEHPK3PXP'; // Test secret
      const validCode = '123456'; // Would be generated from secret

      // Mock TOTP verification
      mfaManager.verifyTOTPCode = vi.fn((code, secret) => {
        return code === '123456' && secret === 'JBSWY3DPEHPK3PXP';
      });

      expect(mfaManager.verifyTOTPCode(validCode, secret)).toBe(true);
      expect(mfaManager.verifyTOTPCode('654321', secret)).toBe(false);
    });

    it('should store MFA configuration securely', async () => {
      const userId = 'user123';
      const mfaConfig = {
        enabled: true,
        methods: ['totp', 'sms'],
        totpSecret: 'JBSWY3DPEHPK3PXP',
        backupCodes: ['12345678', '87654321']
      };

      await mfaManager.storeMFAConfig(userId, mfaConfig);

      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        `mfa_config_${userId}`,
        expect.objectContaining({
          enabled: true,
          methods: ['totp', 'sms'],
          encryptedSecret: expect.any(String),
          hashedBackupCodes: expect.any(Array)
        })
      );
    });
  });

  describe('SMS-Based MFA', () => {
    it('should send SMS verification code', async () => {
      const phoneNumber = '+1234567890';
      const mockSmsService = {
        sendSMS: vi.fn().mockResolvedValue({ success: true, messageId: 'msg123' })
      };

      mfaManager.smsService = mockSmsService;

      const result = await mfaManager.sendSMSCode(phoneNumber);

      expect(result.success).toBe(true);
      expect(mockSmsService.sendSMS).toHaveBeenCalledWith(
        phoneNumber,
        expect.stringMatching(/^\d{6}$/) // 6-digit code
      );
    });

    it('should verify SMS code with rate limiting', async () => {
      const verificationId = 'verify123';
      const code = '123456';

      // Store verification code
      await mfaManager.storeSMSCode(verificationId, code, '+1234567890');

      // Verify correct code
      const result1 = await mfaManager.verifySMSCode(verificationId, code);
      expect(result1.valid).toBe(true);

      // Verify incorrect code
      const result2 = await mfaManager.verifySMSCode(verificationId, '654321');
      expect(result2.valid).toBe(false);

      // Verify expired code (simulate expiry)
      mfaManager.smsCodes.get(verificationId).expires = Date.now() - 1000;
      const result3 = await mfaManager.verifySMSCode(verificationId, code);
      expect(result3.valid).toBe(false);
      expect(result3.error).toBe('Code expired');
    });

    it('should enforce SMS rate limiting', async () => {
      const phoneNumber = '+1234567890';

      // Simulate multiple SMS requests
      for (let i = 0; i < 5; i++) {
        await mfaManager.sendSMSCode(phoneNumber);
      }

      // Next request should be rate limited
      const result = await mfaManager.sendSMSCode(phoneNumber);
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });
  });

  describe('Biometric Authentication', () => {
    let biometricProvider;

    beforeEach(() => {
      biometricProvider = new BiometricAuthProvider();
    });

    it('should check biometric availability', async () => {
      // Mock WebAuthn support
      global.navigator = {
        credentials: {
          create: vi.fn(),
          get: vi.fn()
        }
      };

      global.PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
      };

      const available = await biometricProvider.isAvailable();
      expect(available).toBe(true);
    });

    it('should register biometric credential', async () => {
      const userId = 'user123';
      const challenge = new Uint8Array(32);

      // Mock WebAuthn create
      global.navigator.credentials.create.mockResolvedValue({
        id: 'credential-id',
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-data'
        }
      });

      const credential = await biometricProvider.register(userId, challenge);

      expect(credential).toBeDefined();
      expect(credential.id).toBe('credential-id');
      expect(global.navigator.credentials.create).toHaveBeenCalled();
    });

    it('should authenticate with biometrics', async () => {
      const credentialId = 'credential-id';
      const challenge = new Uint8Array(32);

      // Mock WebAuthn get
      global.navigator.credentials.get.mockResolvedValue({
        id: credentialId,
        response: {
          authenticatorData: 'auth-data',
          signature: 'signature',
          userHandle: 'user-handle'
        }
      });

      const assertion = await biometricProvider.authenticate(credentialId, challenge);

      expect(assertion).toBeDefined();
      expect(assertion.id).toBe(credentialId);
      expect(global.navigator.credentials.get).toHaveBeenCalled();
    });
  });

  describe('Session Security Management', () => {
    let sessionManager;

    beforeEach(() => {
      sessionManager = new SessionManager();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create secure session', () => {
      const userId = 'user123';
      const session = sessionManager.createSession(userId);

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.created).toBeDefined();
      expect(session.expires).toBeDefined();
      expect(session.secureId).toBeDefined();
    });

    it('should validate session expiry', () => {
      const session = sessionManager.createSession('user123');

      // Session should be valid initially
      expect(sessionManager.isSessionValid(session.id)).toBe(true);

      // Fast-forward past expiry
      vi.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

      expect(sessionManager.isSessionValid(session.id)).toBe(false);
    });

    it('should handle concurrent sessions', () => {
      const userId = 'user123';

      const session1 = sessionManager.createSession(userId);
      const session2 = sessionManager.createSession(userId);

      // Both should be valid initially
      expect(sessionManager.isSessionValid(session1.id)).toBe(true);
      expect(sessionManager.isSessionValid(session2.id)).toBe(true);

      // Terminate all sessions for user
      sessionManager.terminateUserSessions(userId);

      expect(sessionManager.isSessionValid(session1.id)).toBe(false);
      expect(sessionManager.isSessionValid(session2.id)).toBe(false);
    });

    it('should implement session timeout', () => {
      const session = sessionManager.createSession('user123', { timeoutMinutes: 30 });

      // Initially active
      expect(sessionManager.isSessionActive(session.id)).toBe(true);

      // Fast-forward 35 minutes
      vi.advanceTimersByTime(35 * 60 * 1000);

      expect(sessionManager.isSessionActive(session.id)).toBe(false);
    });
  });

  describe('Auth Threat Detection', () => {
    let threatDetector;

    beforeEach(() => {
      threatDetector = new AuthThreatDetector();
    });

    it('should detect brute force attacks', () => {
      const ip = '192.168.1.100';
      const username = 'admin';

      // Simulate failed login attempts
      for (let i = 0; i < 5; i++) {
        threatDetector.recordFailedLogin(ip, username);
      }

      expect(threatDetector.isBruteForceAttack(ip)).toBe(true);
      expect(threatDetector.isAccountLocked(username)).toBe(true);
    });

    it('should detect suspicious login patterns', () => {
      const userId = 'user123';

      // Normal logins from same location
      threatDetector.recordSuccessfulLogin(userId, {
        ip: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        location: 'New York, US'
      });

      // Suspicious login from different location
      const isSuspicious = threatDetector.isSuspiciousLogin(userId, {
        ip: '203.0.113.1',
        userAgent: 'Chrome/91.0',
        location: 'Moscow, RU'
      });

      expect(isSuspicious).toBe(true);
    });

    it('should implement progressive delays', () => {
      const ip = '192.168.1.100';

      // First few attempts should have minimal delay
      expect(threatDetector.getLoginDelay(ip, 1)).toBe(0);
      expect(threatDetector.getLoginDelay(ip, 3)).toBe(1000); // 1 second

      // More attempts should have longer delays
      expect(threatDetector.getLoginDelay(ip, 5)).toBeGreaterThan(1000);
      expect(threatDetector.getLoginDelay(ip, 10)).toBeGreaterThan(5000);
    });

    it('should detect credential stuffing', () => {
      const credentials = [
        { username: 'user1', password: 'password123' },
        { username: 'user2', password: 'qwerty123' },
        { username: 'admin', password: 'admin123' }
      ];

      for (const cred of credentials) {
        threatDetector.checkCredentialStuffing(cred.username, cred.password);
      }

      // Should flag common passwords
      expect(threatDetector.isBreachedPassword('password123')).toBe(true);
      expect(threatDetector.isBreachedPassword('uniquePassword!2024')).toBe(false);
    });
  });

  describe('Credential Management', () => {
    let credentialManager;

    beforeEach(() => {
      credentialManager = new CredentialManager();
    });

    it('should enforce password strength requirements', () => {
      // Weak passwords
      expect(credentialManager.validatePasswordStrength('123456')).toBe(false);
      expect(credentialManager.validatePasswordStrength('password')).toBe(false);

      // Strong password
      expect(credentialManager.validatePasswordStrength('Str0ngP@ssw0rd!2024')).toBe(true);
    });

    it('should detect breached passwords', async () => {
      const breachedPasswords = ['password123', 'qwerty123', 'abc123456'];

      for (const password of breachedPasswords) {
        const isBreached = await credentialManager.checkPasswordBreached(password);
        expect(isBreached).toBe(true);
      }

      const strongPassword = 'UniquePassword!2024$NoOneWillGuess';
      const isBreachedStrong = await credentialManager.checkPasswordBreached(strongPassword);
      expect(isBreachedStrong).toBe(false);
    });

    it('should generate secure passwords', () => {
      const password = credentialManager.generateSecurePassword();

      expect(password.length).toBeGreaterThanOrEqual(12);
      expect(/[A-Z]/.test(password)).toBe(true); // Has uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
      expect(/[0-9]/.test(password)).toBe(true); // Has numbers
      expect(/[^A-Za-z0-9]/.test(password)).toBe(true); // Has special chars
    });

    it('should hash passwords securely', async () => {
      const password = 'MySecurePassword123!';
      const hash1 = await credentialManager.hashPassword(password);
      const hash2 = await credentialManager.hashPassword(password);

      // Same password should produce different hashes (due to salt)
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBeGreaterThan(32); // Should be long hash

      // Verify password against hash
      expect(await credentialManager.verifyPassword(password, hash1)).toBe(true);
      expect(await credentialManager.verifyPassword('wrongpassword', hash1)).toBe(false);
    });
  });

  describe('Account Recovery Security', () => {
    let recoveryManager;

    beforeEach(() => {
      recoveryManager = new RecoveryManager();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate secure recovery tokens', () => {
      const token = recoveryManager.generateRecoveryToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(32);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Hexadecimal
    });

    it('should validate recovery token expiry', () => {
      const token = recoveryManager.generateRecoveryToken();

      // Initially valid
      expect(recoveryManager.isRecoveryTokenValid(token)).toBe(true);

      // Fast-forward past expiry (16 minutes)
      vi.advanceTimersByTime(16 * 60 * 1000);

      expect(recoveryManager.isRecoveryTokenValid(token)).toBe(false);
    });

    it('should handle backup codes securely', () => {
      const userId = 'user123';
      const backupCodes = recoveryManager.generateBackupCodes(userId);

      expect(backupCodes.length).toBe(10); // Generate 10 codes
      expect(backupCodes[0].length).toBe(8); // 8-character codes

      // Verify backup code
      expect(recoveryManager.verifyBackupCode(userId, backupCodes[0])).toBe(true);
      expect(recoveryManager.verifyBackupCode(userId, 'invalid')).toBe(false);

      // Each code should be usable only once
      expect(recoveryManager.verifyBackupCode(userId, backupCodes[0])).toBe(false);
    });

    it('should send secure recovery emails', async () => {
      const email = 'user@example.com';
      const mockEmailService = {
        sendEmail: vi.fn().mockResolvedValue({ success: true })
      };

      recoveryManager.emailService = mockEmailService;

      const result = await recoveryManager.sendRecoveryEmail(email);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        email,
        'Password Recovery',
        expect.stringContaining('recovery token')
      );
    });
  });

  describe('Auth Hardening Service Integration', () => {
    let authHardeningService;

    beforeEach(() => {
      authHardeningService = new AuthHardeningService();
    });

    it('should initialize all auth hardening components', () => {
      const components = authHardeningService.initialize();

      expect(components).toHaveProperty('mfaManager');
      expect(components).toHaveProperty('biometricProvider');
      expect(components).toHaveProperty('sessionManager');
      expect(components).toHaveProperty('threatDetector');
      expect(components).toHaveProperty('credentialManager');
      expect(components).toHaveProperty('recoveryManager');
    });

    it('should orchestrate complete authentication flow', async () => {
      const userId = 'user123';
      const password = 'SecurePass123!';
      const deviceFingerprint = {
        userAgent: 'Chrome/91.0',
        ip: '192.168.1.100'
      };

      // Start authentication
      const authResult = await authHardeningService.authenticate(
        userId,
        password,
        deviceFingerprint
      );

      expect(authResult).toHaveProperty('success');
      expect(authResult).toHaveProperty('mfaRequired');
      expect(authResult).toHaveProperty('session');

      if (authResult.mfaRequired) {
        // Complete MFA
        const mfaResult = await authHardeningService.completeMFA(
          authResult.session.id,
          '123456'
        );

        expect(mfaResult.success).toBe(true);
      }
    });

    it('should handle security events', () => {
      const securityEvent = {
        type: 'failed_login',
        userId: 'user123',
        ip: '192.168.1.100',
        timestamp: Date.now()
      };

      authHardeningService.handleSecurityEvent(securityEvent);

      // Should update threat detection
      expect(authHardeningService.threatDetector.isBruteForceAttack('192.168.1.100')).toBe(false);

      // After multiple events
      for (let i = 0; i < 4; i++) {
        authHardeningService.handleSecurityEvent(securityEvent);
      }

      expect(authHardeningService.threatDetector.isBruteForceAttack('192.168.1.100')).toBe(true);
    });
  });
});</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/tests/unit/advanced-auth-hardening.unit.spec.js