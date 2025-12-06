#!/bin/bash

# Script to find all instances where status/stage is displayed without translation
# This helps identify places that need i18n fixes

echo "🔍 Finding untranslated status displays in JSX files..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Direct status/stage display (e.g., {item.status})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -rn "\{[^}]*\.\(status\|stage\)\}" src/pages/*.jsx | grep -v "tPage\|getStageLabel\|getStatusLabel\|getInterviewStatusLabel\|getApplicationStageLabel" | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Status in string templates (e.g., \`Status: \${item.status}\`)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -rn '\${\([^}]*\)\.\(status\|stage\)}' src/pages/*.jsx | grep -v "tPage\|getStageLabel" | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Status comparisons (these are OK for API logic)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -rn "\.status === \|\.stage === " src/pages/*.jsx | head -10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Already translated (these are GOOD ✅)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -rn "tPage.*status\|getStageLabel\|getStatusLabel" src/pages/*.jsx | head -10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

UNTRANSLATED=$(grep -r "\{[^}]*\.\(status\|stage\)\}" src/pages/*.jsx | grep -v "tPage\|getStageLabel\|getStatusLabel" | wc -l)
TRANSLATED=$(grep -r "tPage.*status\|getStageLabel\|getStatusLabel" src/pages/*.jsx | wc -l)

echo "Untranslated status displays: $UNTRANSLATED"
echo "Translated status displays: $TRANSLATED"
echo ""
echo "📝 Review the output above and update files to use translation functions"
echo "   Pattern: {item.status} → {tPage(\`status.\${item.status}\`)}"
echo ""
