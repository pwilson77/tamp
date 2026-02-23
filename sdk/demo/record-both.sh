#!/bin/bash
set -e

echo "🎬 Recording TAMP Narrative Demos (Trader + Security)..."
echo ""

cd "$(dirname "$0")/.."

echo "✓ Recording Trader Agent demo..."
PERSONA=trader npm run demo:record

echo ""
echo "✓ Recording Security Agent demo..."
PERSONA=security npm run demo:record

echo ""
echo "🎉 Both demos recorded successfully!"
echo ""
echo "Check the demo/ folder for transcript files."
