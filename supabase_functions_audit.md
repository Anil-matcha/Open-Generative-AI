# Supabase Edge Functions Audit

## Overview
This document summarizes the audit of Supabase Edge Functions across the main repository and all integrated component repositories.

## Main Repository Functions
Location: `supabase/functions/`

The following functions are present in the main repository:

- director-agent
- media-service
- project-service
- rendiv-render
- template-service
- user-service

Additional functions found:
- create-share
- frame-agent
- muapi-proxy
- muapi-webhook
- process-upload
- videoagent
- yucut-processor

## Integrated Repositories Audit
Checked the following integrated repositories (submodules) for Supabase functions:

1. `modules/rendiv` - No supabase/functions/ directory
2. `modules/LTX-Desktop` - No supabase/functions/ directory
3. `modules/chatvideo-yucut` - No supabase/functions/ directory
4. `modules/CineGen` - No supabase/functions/ directory (empty repository)

## Deployment Status
All functions listed in `supabase/functions/` are successfully deployed to Supabase.

Verification command: `supabase functions list`

Status: All functions ACTIVE with recent deployment timestamps (2026-04-13).

## Findings
- ✅ All required functions from Task 1 are present in main repo
- ✅ All functions are deployed and active
- ✅ No integrated repositories have their own Supabase functions (centralized in main repo)

## Recommendations
- Continue maintaining functions centrally in the main repository
- No additional Supabase functions needed in integrated repositories</content>
<parameter name="filePath">supabase_functions_audit.md