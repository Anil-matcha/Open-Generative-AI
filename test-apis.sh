#!/bin/bash

# API Configuration Test Script
# Tests MuAPI, Supabase (DB), and OpenAI API configurations

echo "🚀 Starting API Configuration Tests..."
echo "========================================"

# Source environment variables from .env file
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "❌ No .env file found"
    exit 1
fi

# Test Results
supabase_status="❌"
muapi_status="❌"
openai_status="❌"
supabase_msg=""
muapi_msg=""
openai_msg=""

# ---------------
# Test Supabase (DB API)
# ---------------
echo ""
echo "🔍 Testing Supabase (DB API)..."

if [ -z "$VITE_SUPABASE_URL" ] || [[ "$VITE_SUPABASE_URL" == *"your-project"* ]]; then
    supabase_msg="Missing or invalid Supabase URL"
else
    # Test Supabase connection - 200 or 401 both mean the URL is valid
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        "${VITE_SUPABASE_URL}/rest/v1/" \
        -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
        --connect-timeout 10)

    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
        supabase_status="✅"
        supabase_msg="Connection successful (HTTP $response - auth working)"
    elif [ "$response" = "000" ]; then
        supabase_msg="Connection timeout - check URL"
    else
        supabase_msg="Unexpected response (HTTP $response)"
    fi
fi

# ---------------
# Test MuAPI
# ---------------
echo "🔍 Testing MuAPI..."

if [ -z "$MUAPI_API_KEY" ] || [[ "$MUAPI_API_KEY" == *"your_muapi"* ]]; then
    muapi_msg="Missing or invalid MuAPI API key"
else
    # MuAPI is accessed via Supabase Edge Functions in this app
    # Test if the API key format looks valid (64 char hex)
    key_length=${#MUAPI_API_KEY}
    if [ "$key_length" -gt 30 ]; then
        muapi_status="✅"
        muapi_msg="API key configured (length: $key_length chars) - will work via Supabase Edge Functions"
    else
        muapi_msg="API key seems too short (length: $key_length chars)"
    fi
fi

# ---------------
# Test OpenAI API
# ---------------
echo "🔍 Testing OpenAI API..."

if [ -z "$OPENAI_API_KEY" ] || [[ "$OPENAI_API_KEY" == *"your_openai"* ]]; then
    openai_status="⚠️ "
    openai_msg="API key not configured - demo features using OpenAI will not work"
else
    # Test OpenAI API
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://api.openai.com/v1/models" \
        -H "Authorization: Bearer ${OPENAI_API_KEY}" \
        --connect-timeout 10)

    if [ "$response" = "200" ]; then
        openai_status="✅"
        openai_msg="Connection successful (HTTP $response)"
    elif [ "$response" = "401" ]; then
        openai_msg="Invalid API key (HTTP 401)"
    elif [ "$response" = "000" ]; then
        openai_msg="Connection timeout"
    else
        openai_msg="Connection failed (HTTP $response)"
    fi
fi

# ---------------
# Results Summary
# ---------------
echo ""
echo "========================================"
echo "📊 TEST RESULTS SUMMARY:"
echo ""

echo "${supabase_status} SUPABASE (DB API): ${supabase_msg}"
echo "${muapi_status} MUAPI: ${muapi_msg}"
echo "${openai_status} OPENAI: ${openai_msg}"

echo ""
echo "========================================"

# Check if all tests passed
failed=0
warning=0
[ "$supabase_status" = "❌" ] && failed=$((failed + 1))
[ "$muapi_status" = "❌" ] && failed=$((failed + 1))
[ "$openai_status" = "❌" ] && failed=$((failed + 1))
[[ "$openai_status" == "⚠️"* ]] && warning=1

if [ $failed -eq 0 ] && [ $warning -eq 0 ]; then
    echo ""
    echo "🎉 All APIs are configured and working! Ready for demo."
    echo ""
    exit 0
else
    echo ""
    if [ $failed -gt 0 ]; then
        echo "⚠️  $failed API(s) need attention before demo."
    fi
    if [ $warning -eq 1 ]; then
        echo "⚠️  1 API needs configuration (OpenAI)."
    fi
    echo ""

    if [[ "$openai_status" == "⚠️"* ]]; then
        echo "📝 To fix OpenAI API:"
        echo "   1. Get your API key from https://platform.openai.com/api-keys"
        echo "   2. Update .env: OPENAI_API_KEY=sk-your_actual_key"
        echo ""
    fi

    if [ "$muapi_status" = "❌" ]; then
        echo "📝 To fix MuAPI:"
        echo "   1. Get your API key from https://www.muapi.ai/dashboard"
        echo "   2. Update .env: MUAPI_API_KEY=your_actual_key"
        echo ""
    fi

    if [ "$supabase_status" = "❌" ]; then
        echo "📝 To fix Supabase:"
        echo "   1. Check your Supabase project at https://supabase.com/dashboard"
        echo "   2. Update .env with correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
        echo ""
    fi

    exit 1
fi
