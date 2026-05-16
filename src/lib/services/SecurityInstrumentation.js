/**
 * Security Instrumentation Service
 * Instruments critical application functions with security logging
 */

import { securityLogger } from '../lib/services/SecurityLogger.js';

class SecurityInstrumentation {
  constructor() {
    this.instrumented = new Set();
    this.init();
  }

  init() {
    // Mark this as loaded
    this.instrumented.add('instrumentation-service');

    // Log initialization
    securityLogger.info('instrumentation_initialized', {
      service: 'security-instrumentation',
      version: '1.0'
    });
  }

  /**
   * Instrument authentication flows
   */
  instrumentAuth(authService) {
    if (this.instrumented.has('auth')) return;

    // Wrap login method
    const originalLogin = authService.login.bind(authService);
    authService.login = async (credentials) => {
      const startTime = Date.now();

      try {
        securityLogger.info('auth_attempt', {
          event: 'login_attempt',
          username: credentials.username ? '[REDACTED]' : 'unknown',
          hasPassword: !!credentials.password
        });

        const result = await originalLogin(credentials);

        securityLogger.info('auth_success', {
          event: 'login_success',
          username: credentials.username ? '[REDACTED]' : 'unknown',
          duration: Date.now() - startTime
        });

        return result;
      } catch (error) {
        securityLogger.warn('auth_failure', {
          event: 'login_failed',
          username: credentials.username ? '[REDACTED]' : 'unknown',
          error: error.message,
          duration: Date.now() - startTime
        });

        throw error;
      }
    };

    // Wrap logout
    const originalLogout = authService.logout.bind(authService);
    authService.logout = async (userId) => {
      securityLogger.info('auth_logout', {
        event: 'user_logout',
        userId: userId ? '[REDACTED]' : 'unknown'
      });

      return originalLogout(userId);
    };

    // Wrap token refresh
    const originalRefresh = authService.refreshToken?.bind(authService);
    if (originalRefresh) {
      authService.refreshToken = async (token) => {
        securityLogger.info('token_refresh', {
          event: 'token_refresh_attempt'
        });

        try {
          const result = await originalRefresh(token);
          securityLogger.info('token_refresh_success', {
            event: 'token_refresh_success'
          });
          return result;
        } catch (error) {
          securityLogger.warn('token_refresh_failure', {
            event: 'token_refresh_failed',
            error: error.message
          });
          throw error;
        }
      };
    }

    this.instrumented.add('auth');
    securityLogger.info('auth_instrumented', {
      component: 'authService'
    });
  }

  /**
   * Instrument file upload operations
   */
  instrumentUpload(uploadService) {
    if (this.instrumented.has('upload')) return;

    const originalUpload = uploadService.upload.bind(uploadService);
    uploadService.upload = async (file, metadata) => {
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };

      securityLogger.info('upload_attempt', {
        event: 'file_upload_start',
        file: fileInfo,
        metadata: metadata
      });

      try {
        const result = await originalUpload(file, metadata);

        securityLogger.info('upload_success', {
          event: 'file_upload_complete',
          fileId: result.id,
          fileSize: file.size,
          duration: result.duration
        });

        return result;
      } catch (error) {
        securityLogger.error('upload_failure', {
          event: 'file_upload_failed',
          file: fileInfo,
          error: error.message,
          code: error.code
        });

        throw error;
      }
    };

    const originalDelete = uploadService.delete?.bind(uploadService);
    if (originalDelete) {
      uploadService.delete = async (fileId) => {
        securityLogger.info('file_delete', {
          event: 'file_deletion',
          fileId
        });

        return originalDelete(fileId);
      };
    }

    this.instrumented.add('upload');
  }

  /**
   * Instrument admin actions
   */
  instrumentAdmin(adminService) {
    if (this.instrumented.has('admin')) return;

    const adminActions = [
      'createUser',
      'deleteUser',
      'updateUser',
      'banUser',
      'revokeToken',
      'updateConfig',
      'deleteAsset',
      'exportData'
    ];

    adminActions.forEach(action => {
      if (typeof adminService[action] === 'function') {
        const original = adminService[action].bind(adminService);
        adminService[action] = async (...args) => {
          const context = args[0] || {};
          const adminUser = context.adminId || context.userId || 'unknown';

          securityLogger.security('admin_action', {
            event: `admin_${action}`,
            adminUser: adminUser ? '[REDACTED]' : 'unknown',
            target: args[1] ? '[REDACTED]' : 'unknown',
            hasContext: !!context,
            timestamp: new Date().toISOString()
          });

          return original(...args);
        };
      }
    });

    this.instrumented.add('admin');
  }

  /**
   * Instrument rate limit responses
   */
  instrumentRateLimit(rateLimiter) {
    if (this.instrumented.has('rate-limit')) return;

    // Wrap isAllowed to log blocks
    const originalIsAllowed = rateLimiter.isAllowed.bind(rateLimiter);
    rateLimiter.isAllowed = async (identifier) => {
      const result = await originalIsAllowed(identifier);

      if (!result.allowed) {
        securityLogger.warn('rate_limit_block', {
          event: 'rate_limit_exceeded',
          identifier: identifier ? '[HASHED]' : 'unknown',
          prefix: rateLimiter.keyPrefix,
          maxRequests: rateLimiter.maxRequests,
          windowMs: rateLimiter.windowMs,
          retryAfter: result.retryAfter
        });
      }

      return result;
    };

    this.instrumented.add('rate-limit');
  }

  /**
   * Instrument API routes in backend
   */
  instrumentBackendRoutes(app) {
    if (this.instrumented.has('backend')) return;

    // Wrap route handlers
    const originalUse = app.use.bind(app);
    app.use = async function(path, ...handlers) {
      // Check if this is a security-related route
      const isSecurityRoute = path?.includes('/api/security') ||
                             path?.includes('/api/admin');

      if (isSecurityRoute && handlers.length > 0) {
        const handler = handlers[0];

        // Only wrap async functions
        if (handler.constructor.name === 'AsyncFunction') {
          const wrappedHandler = async (req, res, next) => {
            const startTime = Date.now();
            const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

            try {
              securityLogger.info('api_request', {
                event: 'api_call',
                path: req.path,
                method: req.method,
                ip: clientIp,
                userAgent: req.headers['user-agent']
              });

              const result = await handler(req, res, next);

              securityLogger.info('api_response', {
                event: 'api_response',
                path: req.path,
                method: req.method,
                statusCode: res.statusCode,
                duration: Date.now() - startTime
              });

              return result;
            } catch (error) {
              securityLogger.error('api_error', {
                event: 'api_error',
                path: req.path,
                method: req.method,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
              });

              throw error;
            }
          };

          return originalUse(path, wrappedHandler);
        }
      }

      return originalUse(path, ...handlers);
    }.bind(app);

    this.instrumented.add('backend');
  }

  /**
   * Instrument WebSocket connections
   */
  instrumentWebSocket(wss) {
    if (this.instrumented.has('websocket')) return;

    wss.on('connection', (ws, req) => {
      const clientIp = req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

      securityLogger.info('websocket_connect', {
        event: 'websocket_connection',
        path: req.url,
        ip: clientIp,
        userAgent: req.headers['user-agent']
      });

      const originalMessageHandler = ws.onmessage?.bind(ws);
      ws.onmessage = async (message) => {
        try {
          // Log WebSocket messages (sanitized)
          securityLogger.info('websocket_message', {
            event: 'websocket_message',
            type: typeof message,
            size: message?.length || 0
          });

          if (originalMessageHandler) {
            return originalMessageHandler(message);
          }
        } catch (error) {
          securityLogger.error('websocket_error', {
            event: 'websocket_message_error',
            error: error.message
          });
        }
      };

      ws.on('close', () => {
        securityLogger.info('websocket_disconnect', {
          event: 'websocket_disconnection'
        });
      });

      ws.on('error', (error) => {
        securityLogger.error('websocket_error', {
          event: 'websocket_error',
          error: error.message
        });
      });
    });

    this.instrumented.add('websocket');
  }

  /**
   * Get instrumentation status
   */
  getStatus() {
    return {
      instrumented: Array.from(this.instrumented),
      count: this.instrumented.size
    };
  }
}

export const securityInstrumentation = new SecurityInstrumentation();
export default SecurityInstrumentation;
