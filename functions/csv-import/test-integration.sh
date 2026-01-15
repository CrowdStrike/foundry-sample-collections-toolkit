#!/bin/bash
#
# Integration test script for the CSV import function.
# This script starts the function server and tests the import endpoints.
#
# Prerequisites:
#   - Python 3.x with dependencies installed (pip install -r requirements.txt)
#   - HTTPie installed (pip install httpie)
#   - Falcon API credentials configured
#
# Usage:
#   ./test-integration.sh
#
# Environment variables (will prompt if not set):
#   FALCON_CLIENT_ID     - Your Falcon API client ID
#   FALCON_CLIENT_SECRET - Your Falcon API client secret
#   FALCON_BASE_URL      - Falcon API base URL (e.g., https://api.crowdstrike.com)
#   APP_ID               - Your Foundry app ID

set -e

# Prompt for credentials if not set
if [ -z "$FALCON_CLIENT_ID" ]; then
    read -p "Enter FALCON_CLIENT_ID: " FALCON_CLIENT_ID
    export FALCON_CLIENT_ID
fi

if [ -z "$FALCON_CLIENT_SECRET" ]; then
    read -s -p "Enter FALCON_CLIENT_SECRET: " FALCON_CLIENT_SECRET
    echo
    export FALCON_CLIENT_SECRET
fi

if [ -z "$FALCON_BASE_URL" ]; then
    read -p "Enter FALCON_BASE_URL (e.g., https://api.crowdstrike.com): " FALCON_BASE_URL
    export FALCON_BASE_URL
fi

if [ -z "$APP_ID" ]; then
    read -p "Enter APP_ID: " APP_ID
    export APP_ID
fi

echo "Starting integration tests..."

# Start the function
python main.py > output.log 2>&1 &
PID=$!

# Wait for server to start
timeout=30
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if grep -q "running at port 8081" output.log; then
        echo "Application started successfully"
        break
    fi
    sleep 1
    elapsed=$((elapsed+1))
done

if [ $elapsed -ge $timeout ]; then
    echo "Application failed to start within $timeout seconds"
    cat output.log
    kill $PID 2>/dev/null || true
    exit 1
fi

TEST_FAILURES=0

echo "Running CSV import tests..."
sleep 2

# Create sample CSV if needed
if [ ! -f "security_events.csv" ]; then
    echo "timestamp,event_type,severity,description,source_ip,destination_ip,user" > security_events.csv
    echo "2025-07-11T14:14:08Z,login_failure,medium,Failed login from IP 192.168.1.100,192.168.1.100,192.168.1.1,test.user" >> security_events.csv
    echo "2025-07-11T14:15:22Z,malware_detected,high,Malware detected on workstation,192.168.1.101,192.168.1.1,admin.user" >> security_events.csv
fi

# Test 1: Import CSV with file path
echo "=== Test 1: Import file path ==="
set +e
http --ignore-stdin POST :8081 method=POST url=/import-csv "body[csv_file_path]=security_events.csv" > import_file_output.log 2>&1
IMPORT_FILE_EXIT_CODE=$?
set -e

if [ $IMPORT_FILE_EXIT_CODE -eq 0 ] && grep -q '"success": true' import_file_output.log; then
    echo "Import file path test passed"
else
    echo "Import file path test failed"
    cat import_file_output.log
    TEST_FAILURES=$((TEST_FAILURES + 1))
fi

# Test 2: Import CSV with inline data
echo "=== Test 2: Import inline data ==="
CSV_DATA=$(cat security_events.csv)
set +e
http --ignore-stdin POST :8081 method=POST url=/import-csv "body[csv_data]=$CSV_DATA" > import_data_output.log 2>&1
IMPORT_DATA_EXIT_CODE=$?
set -e

if [ $IMPORT_DATA_EXIT_CODE -eq 0 ] && grep -q '"success": true' import_data_output.log; then
    echo "Import inline data test passed"
else
    echo "Import inline data test failed"
    cat import_data_output.log
    TEST_FAILURES=$((TEST_FAILURES + 1))
fi

# Test 3: Execute import.py script
if [ -f "import.py" ]; then
    echo "=== Test 3: Import script ==="
    set +e
    python import.py > import_script_output.log 2>&1
    IMPORT_SCRIPT_EXIT_CODE=$?
    set -e

    if [ $IMPORT_SCRIPT_EXIT_CODE -eq 0 ] && grep -q '"success": true' import_script_output.log; then
        echo "Import script test passed"
    else
        echo "Import script test failed"
        cat import_script_output.log
        TEST_FAILURES=$((TEST_FAILURES + 1))
    fi
fi

# Cleanup
kill $PID 2>/dev/null || true

# Final result
if [ $TEST_FAILURES -gt 0 ]; then
    echo "$TEST_FAILURES test(s) failed"
    exit 1
else
    echo "All tests passed"
fi
