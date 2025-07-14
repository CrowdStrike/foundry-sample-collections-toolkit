import json

import pandas as pd
import requests

# Prepare CSV data
df = pd.DataFrame([
    {
        "event_id": "EVT-004",
        "timestamp": "2024-01-15T11:00:00Z",
        "event_type": "data_exfiltration",
        "severity": "critical",
        "source_ip": "192.168.1.200",
        "destination_ip": "external",
        "user": "compromised.user",
        "description": "Large data transfer detected"
    },
    {
        "event_id": "EVT-005",
        "timestamp": "2024-01-15T11:05:00Z",
        "event_type": "privilege_escalation",
        "severity": "high",
        "source_ip": "192.168.1.150",
        "destination_ip": "internal",
        "user": "admin.account",
        "description": "Unauthorized privilege escalation"
    }
])

# Convert to CSV string
csv_data = df.to_csv(index=False)

# Send to import function
response = requests.post(
    "http://localhost:8081",
    json={
        "method": "POST",
        "url": "/import-csv",
        "body": {
            "csv_file_path": "security_events.csv",
            "collection_name": "security_events_csv"
        }
    }
)

print("Import result:")
print(json.dumps(response.json(), indent=2))
