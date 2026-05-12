#!/bin/bash
# scripts/detect-duplicate-hero-images.sh
# Detect duplicate hero images using md5sum and file size comparison

HERO_DIR="public/thumbnails/heroes"
OUTPUT_FILE="/tmp/duplicate-hero-images.json"

echo "Analyzing hero images in ${HERO_DIR}..."

# Check if directory exists
if [ ! -d "$HERO_DIR" ]; then
    echo "ERROR: Directory $HERO_DIR does not exist"
    exit 1
fi

# Get file list
FILES=$(ls -1 "$HERO_DIR" | grep -E '\.(webp|png|jpg)$')

# Create temporary files
MD5_FILE="/tmp/hero-md5sums.txt"
SIZE_FILE="/tmp/hero-sizes.txt"

# Generate md5 sums
echo "Generating md5 checksums..."
cd "$HERO_DIR" && md5sum * > "$MD5_FILE" 2>/dev/null

# Find duplicates by md5
echo "Finding exact duplicates (same md5 hash)..."
DUPLICATES_MD5=$(cat "$MD5_FILE" | sort | uniq -w32 -D)

# Generate file sizes
echo "Generating file size report..."
cd "$HERO_DIR" && ls -la * > "$SIZE_FILE" 2>/dev/null

# Generate JSON report
echo "{" > "$OUTPUT_FILE"
echo '  "analysis_date": "'$(date -Iseconds)'",' >> "$OUTPUT_FILE"
echo '  "hero_directory": "'"$HERO_DIR"'",' >> "$OUTPUT_FILE"

# File count
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo '  "total_files": '"$FILE_COUNT"',' >> "$OUTPUT_FILE"

# Duplicate groups
if [ -z "$DUPLICATES_MD5" ]; then
    echo '  "duplicate_groups": [],' >> "$OUTPUT_FILE"
    echo '  "has_duplicates": false,' >> "$OUTPUT_FILE"
else
    echo '  "duplicate_groups": [' >> "$OUTPUT_FILE"
    # Process duplicate groups (simplified)
    echo '    {"note": "Duplicates detected, manual review needed"}' >> "$OUTPUT_FILE"
    echo '  ],' >> "$OUTPUT_FILE"
    echo '  "has_duplicates": true,' >> "$OUTPUT_FILE"
fi

# Small files (potential placeholders)
echo '  "small_files": [' >> "$OUTPUT_FILE"
cd "$HERO_DIR"
find . -name "*.webp" -o -name "*.png" -o -name "*.jpg" -size -50k | while read file; do
    SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    echo "    {\"file\": \"$file\", \"size\": $SIZE}," >> "$OUTPUT_FILE"
done
echo '  ],' >> "$OUTPUT_FILE"

echo '  "recommendations": [' >> "$OUTPUT_FILE"
if [ ! -z "$DUPLICATES_MD5" ]; then
    echo '    "Replace duplicate images with unique AI-generated content"' >> "$OUTPUT_FILE"
fi
echo '    "Verify all images are genuine AI-generated content"' >> "$OUTPUT_FILE"
echo '  ]' >> "$OUTPUT_FILE"

echo "}" >> "$OUTPUT_FILE"

echo "Report generated: $OUTPUT_FILE"
cat "$OUTPUT_FILE"

# Cleanup
rm -f "$MD5_FILE" "$SIZE_FILE"
