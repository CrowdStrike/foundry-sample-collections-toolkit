#!/bin/bash

# Script to import large security events dataset

set -e

echo "=== Checking for security_events_large.csv ==="
if [ ! -f "security_events_large.csv" ]; then
    echo "❌ security_events_large.csv not found"
    echo "📝 Please run: python generate_security_events.py"
    echo "   This will generate the required CSV file with 250 security events"
    exit 1
fi

echo "✅ Found security_events_large.csv"

echo ""
echo "=== Checking dependencies ==="
if ! command -v http &> /dev/null; then
    echo "❌ HTTPie is not installed"
    echo "📝 Please install HTTPie: pip install httpie"
    echo "   Or on macOS: brew install httpie"
    exit 1
fi
echo "✅ HTTPie is available"

echo ""
echo "=== Importing large security events dataset ==="
set +e
http --ignore-stdin POST :8081 method=POST url=/import-csv "body[csv_file_path]=../security_events_large.csv" > import_large_output.log 2>&1
IMPORT_EXIT_CODE=$?
set -e

if [ $IMPORT_EXIT_CODE -eq 0 ] && grep -q '"success": true' import_large_output.log; then
    echo "✅ Import of 250 security events completed successfully"
    echo "📊 Check import_large_output.log for detailed results"
else
    echo "❌ Import failed"
    echo "📋 Import log output:"
    cat import_large_output.log
fi

echo ""
if [ $IMPORT_EXIT_CODE -eq 0 ] && grep -q '"success": true' import_large_output.log; then
    echo "🎉 Large dataset import completed successfully!"
else
    echo "💥 Large dataset import failed"
    exit 1
fi
