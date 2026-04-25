import http from 'k6/http';
import { check } from 'k6';

// Mock authentication system for load testing
export class AuthManager {
    constructor(baseUrl = 'https://api.example.com') {
        this.baseUrl = baseUrl;
        this.tokens = new Map();
        this.userCounter = 0;
    }

    // Simulate user login and return auth token
    async login(userType = 'creator') {
        const userId = ++this.userCounter;
        const username = `user_${userId}_${userType}`;
        const password = `pass_${userId}`;

        const loginPayload = JSON.stringify({
            username: username,
            password: password,
            grant_type: 'password'
        });

        const params = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Mock login - in real scenario, this would hit actual auth endpoint
        const response = http.post(`${this.baseUrl}/auth/login`, loginPayload, params);

        // For load testing, we'll simulate successful auth
        // In real implementation, parse actual response
        const token = `mock_token_${userId}_${Date.now()}`;

        check(response, {
            'login successful': (r) => r.status === 200 || r.status === 201,
        });

        this.tokens.set(userId, {
            token: token,
            userId: userId,
            userType: userType,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });

        return this.tokens.get(userId);
    }

    // Get auth headers for API calls
    getAuthHeaders(userId) {
        const userSession = this.tokens.get(userId);
        if (!userSession) {
            throw new Error(`No session found for user ${userId}`);
        }

        // Check if token is expired (simulate)
        if (Date.now() > userSession.expiresAt) {
            throw new Error(`Token expired for user ${userId}`);
        }

        return {
            'Authorization': `Bearer ${userSession.token}`,
            'Content-Type': 'application/json',
            'X-User-Type': userSession.userType
        };
    }

    // Simulate token refresh
    async refreshToken(userId) {
        const userSession = this.tokens.get(userId);
        if (!userSession) {
            throw new Error(`No session found for user ${userId}`);
        }

        // Simulate refresh call
        const response = http.post(`${this.baseUrl}/auth/refresh`, JSON.stringify({
            token: userSession.token
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

        const newToken = `refreshed_token_${userId}_${Date.now()}`;

        userSession.token = newToken;
        userSession.expiresAt = Date.now() + (24 * 60 * 60 * 1000);

        return userSession;
    }

    // Cleanup expired sessions
    cleanup() {
        const now = Date.now();
        for (const [userId, session] of this.tokens) {
            if (now > session.expiresAt) {
                this.tokens.delete(userId);
            }
        }
    }
}

// User types for different behavior patterns
export const USER_TYPES = {
    CREATOR: 'creator',           // Heavy video generation
    COLLABORATOR: 'collaborator', // Script writing focus
    REVIEWER: 'reviewer',         // Analysis and effects
    CASUAL: 'casual'             // Light usage
};

// Export singleton instance
export const authManager = new AuthManager();