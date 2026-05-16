# Security Hardening Implementation Plan
## Using Superpowers Systematic Workflow

### Current State Assessment
- **SRI Manager**: Exists with placeholder SHA-384 hashes (needs real hashes)
- **Security Logger**: Client-side exists, backend endpoint missing
- **Rate Limiter**: Local implementation exists, needs Redis distribution
- **CSP**: Has unsafe-inline/unsafe-eval in dev mode
- **HSTS**: Not implemented
- **Audit**: CI has basic audit but no automated fixes
- **Instrumentation**: Basic framework exists, needs expansion
- **CI/CD**: Basic pipeline exists, needs security automation

---

## Phase 1: Dependency Security (CRITICAL)

### Task 1.1: Run Full pnpm Audit
**Files**: Root package.json, backend/package.json, apps/*/package.json

**Steps**:
1. `pnpm audit --json > security-audit.json`
2. Parse vulnerabilities by severity
3. Identify critical packages to update
4. Generate update plan

### Task 1.2: Update Vulnerable Dependencies
**Target packages identified from audit**:
- `@opentelemetry/auto-instrumentations-node` → update to 0.76.0+
- Check Next.js vulnerabilities
- Update any high-risk packages

**Implementation**:
```bash
# Update root dependencies
pnpm update <package> --latest

# Update backend dependencies  
cd backend && pnpm update <package> --latest

# Verify no breaking changes
pnpm install --check-files
```

### Task 1.3: Create Automated Update Workflow
**File**: `.github/workflows/dependency-updates.yml`

**Features**:
- Weekly scheduled runs
- Automated Dependabot configuration
- Renovate bot setup
- Auto-merge for minor/patch updates
- Security-only PRs for major updates

---

## Phase 2: Fix SRI Hashes (CRITICAL)

### Task 2.1: Generate Real SHA-384 Hashes
**File**: `src/lib/services/SRIManager.js`

**Process**:
1. Download each CDN script
2. Generate SHA-384 hash: `openssl dgst -sha384 -binary < file | openssl base64 -A`
3. Update SRI_HASHES object
4. Add to vite.config.js for build-time validation

**Scripts to create**:
- `scripts/generate-sri-hashes.js` - Automated hash generation
- `scripts/verify-sri.js` - CI verification

### Task 2.2: Integrate SRI into Build Pipeline
**File**: `vite.config.js`

**Changes**:
- Add SRI generation plugin
- Inject hashes into HTML during build
- Add CSP nonce generation
- Remove 'unsafe-inline' from CSP

### Task 2.3: Update index.html
**File**: `index.html`

**Changes**:
- Add csp-nonce attribute to script tags
- Use integrity attributes with real hashes
- Add Subresource Integrity verification

### Task 2.4: Add SRI Tests
**Files**: `tests/unit/sri.unit.spec.ts`

**Coverage**:
- Hash validation
- Nonce generation
- Script tag generation
- CSP header generation

---

## Phase 3: Security Logging Backend (CRITICAL)

### Task 3.1: Create POST /api/security/logs Endpoint
**File**: `backend/server.js`

**Endpoint design**:
```javascript
app.post('/api/security/logs', async (req, res) => {
  // Auth check (admin only)
  // Validate log format
  // Store to file/DB with retention
  // Return acknowledgment
});
```

### Task 3.2: Implement Log Storage
**File**: `backend/services/securityLogStorage.js`

**Options**:
- File-based with rotation (simpler)
- Database table for querying (PostgreSQL)
- Structured JSON format with TTL

**Structure**:
```json
{
  "timestamp": "2026-05-14T05:07:12.000Z",
  "level": "security",
  "event": "rate_limit_breach",
  "service": "higgsfield",
  "details": { "ip": "1.2.3.4", "userAgent": "..." },
  "severity": "high",
  "requiresReview": true
}
```

### Task 3.3: Connect SecurityLogger.js to Endpoint
**File**: `src/lib/services/SecurityLogger.js`

**Changes**:
- Update endpoint URL (proxy to backend)
- Add authentication header
- Implement retry logic with exponential backoff
- Add offline queue with IndexedDB

### Task 3.4: Application Instrumentation
**Files to instrument**:
- `src/lib/services/AuthService.js` - auth events
- `src/lib/services/UploadService.js` - file uploads
- `backend/server.js` - rate limit blocks
- Admin action handlers - audit trail

---

## Phase 4: Enable Distributed Rate Limiting (HIGH)

### Task 4.1: Provision Redis Configuration
**Files**: 
- `backend/.env.example` (add Redis config)
- `netlify.toml` (add Redis env vars for functions)

**Configuration**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SSL=false
```

**For Netlify**: Use Redis add-on or Upstash

### Task 4.2: Update DistributedRateLimiter.js
**File**: `src/lib/services/DistributedRateLimiter.js`

**Implementation**:
- Add Redis client connection
- Replace localStorage simulation with actual Redis commands
- Add connection pooling
- Implement fallback to in-memory if Redis fails
- Add metrics collection

### Task 4.3: Configure in backend/server.js
**File**: `backend/server.js`

**Changes**:
```javascript
import { createClient } from 'redis';
const redisClient = createClient({
  url: process.env.REDIS_URL
});
await redisClient.connect();

const apiRateLimiter = new ApiRateLimiter({
  distributedStorage: redisClient
});
```

### Task 4.4: Add Rate Limit Tests
**Files**: `tests/unit/distributed-rate-limiter.unit.spec.ts`

**Tests**:
- Distributed limit enforcement
- Redis failure fallback
- Concurrent request handling
- TTL expiration

---

## Phase 5: Tighten CSP (HIGH)

### Task 5.1: Remove 'unsafe-inline' and 'unsafe-eval'
**Files**: `vite.config.js`, `netlify.toml`

**Strategy**:
1. Implement nonce-based script loading
2. Move inline scripts to external files
3. Use 'strict-dynamic' with nonces
4. Hash-based approach for static scripts

**Production CSP**:
```
default-src 'self';
script-src 'self' 'nonce-${NONCE}' https://cdn.jsdelivr.net;
style-src 'self' 'nonce-${NONCE}' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.supabase.co https://api.muapi.ai;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

### Task 5.2: Implement Nonce-Based Loading
**Files to modify**:
- `src/main.js` - Add nonce to entry script
- `index.html` - Generate and inject nonce
- Vite plugin for nonce injection

### Task 5.3: Update netlify.toml CSP
**File**: `netlify.toml`

**Changes**:
- Remove unsafe-inline/unsafe-eval
- Add nonce support
- Add hash-based script allowlist

### Task 5.4: Test Without Unsafe Directives
**Files**: `tests/e2e/csp-validation.e2e.spec.ts`

**Tests**:
- CSP header presence and correctness
- Script execution with nonces
- Blocked inline scripts
- CDN script allowance

---

## Phase 6: Add HSTS Header (MEDIUM)

### Task 6.1: Add Strict-Transport-Security Header
**Files**: `netlify.toml`, `vite.config.js`, `backend/server.js`

**Implementation**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Phased approach**:
1. Add header without preload
2. Validate for 6 months
3. Submit to Chrome preload list
4. Enable preload

### Task 6.2: Enable After Validation
**Process**:
- Monitor for 6 months
- Ensure no mixed content issues
- Submit to `hstspreload.org`
- Update header with `preload` directive

---

## Phase 7: Security Instrumentation (MEDIUM)

### Task 7.1: Auth Flow Instrumentation
**Files**: `src/lib/services/AuthService.js`

**Events to log**:
- Login success/failure
- Registration attempts
- Password reset requests
- Token refresh
- Auth errors

### Task 7.2: Rate Limit Block Instrumentation
**Files**: `src/lib/services/DistributedRateLimiter.js`, `backend/server.js`

**Events**:
- Rate limit triggered (IP, user ID)
- Block duration
- Request patterns
- Threshold breaches

### Task 7.3: File Upload Instrumentation
**Files**: `src/lib/services/UploadService.js`, `backend/services/aiAgentService.js`

**Events**:
- Upload attempts (size, type)
- Validation failures
- Malware scan results
- Storage errors

### Task 7.4: Admin Action Audit Trail
**Files**: `src/lib/services/AdminService.js` (create if needed)

**Track**:
- User management actions
- Content moderation
- Configuration changes
- Data exports

---

## Phase 8: CI/CD Security Automation (MEDIUM)

### Task 8.1: Weekly pnpm Audit Runs
**File**: `.github/workflows/weekly-security-audit.yml`

**Schedule**: `0 2 * * 1` (Mondays 2am UTC)

**Steps**:
1. Run `pnpm audit --json`
2. Compare with previous results
3. Create issue if new vulnerabilities
4. Auto-create PR for minor updates

### Task 8.2: Add ESLint Security Plugin
**Files**: `.eslintrc.js`, `package.json`

**Plugin**: `eslint-plugin-security`
**Rules**: Enable all security-related rules

### Task 8.3: Configure Dependabot
**File**: `.github/dependabot.yml`

**Configuration**:
- Weekly update schedule
- Security-only PRs for major versions
- Group dependencies by category
- Auto-assign to team

### Task 8.4: Add Security Scanning to Pipeline
**File**: `.github/workflows/comprehensive-testing.yml`

**Additions**:
- Snyk integration (free tier)
- OWASP Dependency-Check
- Trivy vulnerability scanner
- gitleaks for secrets detection

---

## Testing Strategy per Phase

### TDD Approach
1. Write failing tests first
2. Implement minimal fix
3. Refactor while maintaining green tests
4. Document test coverage

### Verification Steps
1. Local manual testing
2. Automated test suite
3. E2E validation
4. CI/CD pipeline verification

### Documentation Requirements
1. Update README.md with security features
2. Add SECURITY.md with vulnerability reporting
3. Document CSP policy in comments
4. Create deployment checklist

---

## Execution Order (Prioritized)

### Week 1: Critical Dependencies
1. Dependency audit and updates
2. SRI hash generation
3. CSP tightening

### Week 2: Backend Security
4. Security logging endpoint
5. Distributed rate limiting with Redis
6. HSTS header

### Week 3: Instrumentation & CI/CD
7. Application instrumentation
8. CI/CD automation
9. Comprehensive testing

### Week 4: Validation & Documentation
10. End-to-end testing
11. Performance validation
12. Documentation updates
13. Deployment prep

---

## Success Criteria

### Must-Have (100%)
- [ ] Zero critical vulnerabilities (pnpm audit clean)
- [ ] Real SRI hashes for all CDN scripts
- [ ] POST /api/security/logs endpoint operational
- [ ] Redis-backed distributed rate limiting
- [ ] CSP without unsafe-inline/unsafe-eval
- [ ] HSTS header with 1-year max-age

### Should-Have (100%)
- [ ] Comprehensive security event logging
- [ ] Weekly automated security scans
- [ ] Dependabot configured
- [ ] Full test coverage for security features

### Nice-to-Have (100%)
- [ ] Audit trail dashboard
- [ ] Security metrics dashboard
- [ ] Automated incident response
- [ ] Compliance reporting

---

## Risk Mitigation

### Breaking Changes
- Test in staging environment first
- Feature flags for gradual rollout
- Rollback plan for each phase

### Downtime Prevention
- Blue-green deployment strategy
- Health checks for new services
- Canary releases for rate limiting

### Performance Impact
- Baseline metrics before changes
- Load testing after each phase
- Redis connection pooling
- Async log flushing

---

## Monitoring & Alerting

### Post-Deployment
1. Monitor audit logs daily for 1 week
2. Alert on rate limit spikes
3. Track CSP violation reports
4. Review SRI verification failures

### Long-term
1. Monthly security reviews
2. Quarterly penetration testing
3. Annual compliance audit

---

**Total Estimated Tasks**: 8 major features, ~40 subtasks
**Estimated Effort**: 4-6 weeks with comprehensive testing
**Risk Level**: Medium (requires careful rollout)
**Confidence**: High (all tasks are well-defined)