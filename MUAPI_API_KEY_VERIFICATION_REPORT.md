# MuAPI.ai API Key Verification Report

## Executive Summary

After systematically searching the entire codebase, I found **critical inconsistencies** in how the muapi.ai API key is stored and transmitted. The main issue is that **sub-applications (sendspark, ai-vfx) are using the WRONG authentication header** (`Authorization: Bearer` instead of `x-api-key`).

---

## 1. API Key Storage Locations (INCONSISTENT!)

| Storage Location | Used By | Status |
|-----------------|---------|--------|
| `localStorage['muapi_key']` | Main app (muapi.js), SettingsModal, most components | ✅ PRIMARY (correct) |
| `window.__MUAPI_KEY__` | Main app (muapi.js) fallback | ✅ Used as fallback |
| `localStorage['openhiggsfield_api_key']` | apiKeyManager.js | ⚠️ DIFFERENT - migration exists |
| `sessionStorage['openhiggsfield_api_key']` | apiKeyManager.js | ⚠️ DIFFERENT |
| `localStorage['muapi_user_api_key']` | muapiWorkflowClient.js, WorkflowStudio | ⚠️ DIFFERENT |
| `securityService` encrypted storage | muapiEnhanced.js | ⚠️ DIFFERENT (encrypted) |

**Problem**: Multiple storage locations mean the API key set in SettingsModal (stores to `muapi_key`) may NOT be accessible by other parts of the app.

---

## 2. API Key Transmission Method

### ✅ CORRECT Implementations (using `x-api-key` header)

| File | Line(s) | Notes |
|------|---------|-------|
| `src/lib/muapi.js` | 287, 390, 464, 535, 578, 618, 1703 | Main client - CORRECT |
| `packages/studio/src/muapi.js` | 12, 34, 151, 196, 210, 224, 238, 253, 268, 284, 300, 316, 332, 348, 362, 377, 399, 420, 434, 448, 463, 479, 493, 516, 578, 594, 609 | CORRECT |
| `src/lib/muapi/MuAPIConnection.js` | 42, 287 | CORRECT |
| `src/lib/muapiWorkflowClient.js` | 16, 24 | CORRECT |
| `supabase/functions/muapi-proxy/index.ts` | 207 | Forwards to muapi.ai correctly |
| `supabase/functions/videoagent/index.ts` | 247 | CORRECT |

### ❌ INCORRECT Implementations (using `Authorization: Bearer`)

| File | Line(s) | Impact |
|------|---------|--------|
| `apps/sendspark/src/lib/muapi.js` | 80, 124, 224 | **WILL FAIL** - muapi.ai expects `x-api-key` |
| `apps/ai-vfx/src/lib/muapi.js` | 80, 124, 224 | **WILL FAIL** - muapi.ai expects `x-api-key` |

**These sub-apps will NOT work with muapi.ai because they send the API key using the wrong header!**

### ⚠️ OTHER Services (NOT for muapi.ai - may be correct for those APIs)

| File | API Service | Header Used |
|------|-------------|--------------|
| `src/services/whisper-client.js` | Whisper API | `Authorization: Bearer` (likely correct for Whisper) |
| `src/services/ltx-client.js` | LTX API (api.ltx.ai) | `Authorization: Bearer` (correct for LTX) |
| `src/services/rendiv-client.js` | Rendiv API (api.rendiv.ai) | `Authorization: Bearer` (correct for Rendiv) |

---

## 3. Sub-Applications Found

| App | Path | muapi.js | Storage | Header | Status |
|-----|------|----------|---------|--------|--------|
| sendspark | `apps/sendspark/src/lib/muapi.js` | Yes | `muapi_key` | ❌ `Bearer` | **BROKEN** |
| ai-vfx | `apps/ai-vfx/src/lib/muapi.js` | Yes | `muapi_key` | ❌ `Bearer` | **BROKEN** |

---

## 4. Base URL Verification

All implementations correctly use `https://api.muapi.ai` as the base URL:

- `src/lib/muapi.js` - via proxy or direct
- `packages/studio/src/muapi.js` - `https://api.muapi.ai`
- `apps/sendspark/src/lib/muapi.js` - `https://api.muapi.ai/api/v1`
- `apps/ai-vfx/src/lib/muapi.js` - `https://api.muapi.ai/api/v1`
- `src/lib/muapiEnhanced.js` - `https://api.muapi.ai`
- Supabase functions - `https://api.muapi.ai/api/v1`

✅ **Base URLs are consistent and correct**

---

## 5. OpenAI API Key Compatibility

**Question**: Will the user's OpenAI API key work with muapi.ai?

**Answer**: **YES** - muapi.ai acts as a proxy to multiple AI services including OpenAI's models.

From the codebase analysis:
- muapi.ai supports multiple AI providers (OpenAI, Kling, LTX, etc.)
- The API key is passed via `x-api-key` header to muapi.ai
- muapi.ai then routes to the appropriate backend service

**However**, the user's OpenAI key must be:
1. Stored in `localStorage['muapi_key']` (done by SettingsModal)
2. Sent via `x-api-key` header (NOT `Authorization: Bearer`)

---

## 6. Critical Issues to Fix

### Issue 1: Sub-apps using wrong authentication header

**Files to fix**:
- `apps/sendspark/src/lib/muapi.js`
- `apps/ai-vfx/src/lib/muapi.js`

**Current (WRONG)**:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.apiKey}`
}
```

**Should be (CORRECT)**:
```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': this.apiKey
}
```

### Issue 2: Inconsistent API key storage

**Recommendation**: Create a centralized API key manager that ALL parts of the app use.

Current inconsistent storage:
- `muapi_key` (main app)
- `openhiggsfield_api_key` (apiKeyManager)
- `muapi_user_api_key` (workflow client)

---

## 7. Recommended Fixes

### Fix 1: Create centralized API key manager

Create `src/lib/api-key-manager.js`:
```javascript
/**
 * Centralized API Key Manager for muapi.ai
 * All parts of the app should use this to get/set the API key
 */

const MUAPI_KEY_STORAGE = 'muapi_key';

export const muapiKeyManager = {
  setKey(key) {
    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      throw new Error('Invalid API key');
    }
    localStorage.setItem(MUAPI_KEY_STORAGE, key.trim());
    // Also set for backward compatibility
    window.__MUAPI_KEY__ = key.trim();
  },

  getKey() {
    return window.__MUAPI_KEY__ || localStorage.getItem(MUAPI_KEY_STORAGE);
  },

  hasKey() {
    return !!this.getKey();
  },

  removeKey() {
    localStorage.removeItem(MUAPI_KEY_STORAGE);
    delete window.__MUAPI_KEY__;
  },

  // For components that need to read the key
  getKeyForHeader() {
    const key = this.getKey();
    if (!key) {
      throw new Error('API Key missing. Please set it in Settings.');
    }
    return key;
  }
};
```

### Fix 2: Update sub-apps to use correct header

**apps/sendspark/src/lib/muapi.js** - Change all occurrences:
```javascript
// BEFORE (WRONG):
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.apiKey}`
}

// AFTER (CORRECT):
headers: {
  'Content-Type': 'application/json',
  'x-api-key': this.apiKey
}
```

**apps/ai-vfx/src/lib/muapi.js** - Same changes needed.

### Fix 3: Update SettingsModal to use centralized manager

```javascript
// In SettingsModal.js save handler:
import { muapiKeyManager } from '../lib/api-key-manager.js';

apiPanel.querySelector('#settings-save-btn').onclick = () => {
    const key = apiPanel.querySelector('#settings-api-key').value.trim();
    if (key) {
        muapiKeyManager.setKey(key);  // Use centralized manager
        close();
    } else {
        alert('Please enter a valid API key.');
    }
};
```

---

## 8. Files Requiring Updates

| File | Change Needed |
|------|----------------|
| `apps/sendspark/src/lib/muapi.js` | Change `Authorization: Bearer` to `x-api-key` (3 places) |
| `apps/ai-vfx/src/lib/muapi.js` | Change `Authorization: Bearer` to `x-api-key` (3 places) |
| `src/lib/muapi.js` | Already correct - uses `x-api-key` |
| `src/components/SettingsModal.js` | Could use centralized manager |
| `src/lib/apiKeyManager.js` | Consider consolidating with centralized manager |

---

## 9. Verification Steps

After applying fixes:

1. **Test main app**:
   - Open SettingsModal
   - Enter OpenAI API key
   - Generate an image
   - Check browser Network tab - request should have `x-api-key` header

2. **Test sub-apps**:
   - Navigate to sendspark app
   - Verify API key is read from `localStorage['muapi_key']`
   - Perform an action that calls muapi.ai
   - Check Network tab for `x-api-key` header (NOT `Authorization: Bearer`)

3. **Check proxy**:
   - Supabase muapi-proxy expects `x-user-api-key` header from client
   - Forwards as `x-api-key` to muapi.ai
   - This is correctly implemented

---

## 10. Summary

| Check | Status |
|-------|--------|
| Main muapi.js client | ✅ Correct (`x-api-key`) |
| Base URL | ✅ Correct (`https://api.muapi.ai`) |
| SettingsModal storage | ✅ Correct (`muapi_key` in localStorage) |
| sendspark sub-app | ❌ BROKEN (uses `Bearer`) |
| ai-vfx sub-app | ❌ BROKEN (uses `Bearer`) |
| API key storage consistency | ⚠️ INCONSISTENT (multiple locations) |
| OpenAI key compatibility | ✅ YES (if sent via `x-api-key`) |

**Critical Action Required**: Fix the sub-apps (sendspark, ai-vfx) to use `x-api-key` header instead of `Authorization: Bearer`.
