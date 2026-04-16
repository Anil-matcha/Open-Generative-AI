#!/bin/bash

# Test Director Backend Deployment
echo "🧪 Testing Director Backend Deployment..."
echo ""

BACKEND_URL="https://videoagencyai.netlify.app/.netlify/functions/director-backend"

# Test 1: Basic function availability
echo "1️⃣ Testing function availability..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL")
if [ "$response" -eq 200 ]; then
    echo "✅ Function is accessible (HTTP $response)"
else
    echo "❌ Function not accessible (HTTP $response)"
fi
echo ""

# Test 2: Agent request
echo "2️⃣ Testing agent request..."
test_payload='{
  "session_id": "test_session_123",
  "conv_id": "test_conv_123",
  "agents": ["summarizer"],
  "content": [{"type": "text", "text": "Test video summarization"}],
  "actions": ["Testing summarizer agent"]
}'

response=$(curl -s -X POST "$BACKEND_URL" \
  -H "Content-Type: application/json" \
  -d "$test_payload")

if echo "$response" | grep -q "status.*success"; then
    echo "✅ Agent request successful"
    echo "📄 Response preview: $(echo "$response" | head -c 200)..."
else
    echo "❌ Agent request failed"
    echo "📄 Error response: $response"
fi
echo ""

# Test 3: Content factory features
echo "3️⃣ Testing content factory features..."
features=("faceless_video_creator" "ai_ad_films" "tiktok_lyric_video" "ai_voiceovers" "trailer_narration" "kids_storyteller" "year_in_frames")

for feature in "${features[@]}"; do
    test_payload="{
      \"session_id\": \"test_$feature\",
      \"agents\": [\"$feature\"],
      \"content\": [{\"text\": \"Create a test $feature\"}]
    }"

    response=$(curl -s -X POST "$BACKEND_URL" \
      -H "Content-Type: application/json" \
      -d "$test_payload")

    if echo "$response" | grep -q "status.*success\|message.*created"; then
        echo "✅ $feature: Working"
    else
        echo "❌ $feature: Failed"
    fi
done

echo ""
echo "🎯 Test complete! Check results above."
echo "📋 If all tests pass, your director backend is fully operational!"