#!/usr/bin/env python3
import csv
import random
from datetime import datetime, timedelta

# Configuration
NUM_EVENTS = 250
OUTPUT_FILE = "security_events_large.csv"

# Event types and their typical severities (matching schema)
EVENT_TYPES = {
    "login_failure": ["low", "medium"],
    "malware_detected": ["high", "critical"],
    "suspicious_network": ["low", "medium", "high"],
    "data_exfiltration": ["high", "critical"],
    "privilege_escalation": ["medium", "high"]
}

# Sample data pools
USERS = [
    "john.doe", "alice.smith", "bob.johnson", "carol.brown", "david.wilson",
    "eve.davis", "frank.miller", "grace.taylor", "henry.anderson", "iris.thomas",
    "jack.jackson", "karen.white", "larry.harris", "mary.martin", "nathan.garcia",
    "olivia.martinez", "peter.robinson", "quinn.clark", "rachel.rodriguez", "steve.lewis",
    "tina.lee", "ulrich.walker", "victor.hall", "wendy.allen", "xavier.young",
    "yvonne.hernandez", "zach.king", "system", "admin", "service_account"
]

INTERNAL_IPS = [f"192.168.{random.randint(1,10)}.{random.randint(1,254)}" for _ in range(50)]
INTERNAL_IPS.extend([f"10.0.{random.randint(0,255)}.{random.randint(1,254)}" for _ in range(50)])

EXTERNAL_IPS = [
    f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
    for _ in range(100)
]

DESCRIPTIONS = {
    "login_failure": [
        "Failed login attempt",
        "Invalid credentials provided",
        "Account locked due to multiple failed attempts",
        "Authentication failure from suspicious IP",
        "Password authentication failed"
    ],
    "malware_detected": [
        "Malware detected on endpoint",
        "Trojan horse identified and quarantined",
        "Virus signature match found",
        "Suspicious executable behavior detected",
        "Rootkit activity identified"
    ],
    "suspicious_network": [
        "Unusual network traffic pattern",
        "Unexpected outbound connection",
        "High volume data transfer detected",
        "Connection to known malicious domain",
        "Abnormal port scanning activity"
    ],
    "data_exfiltration": [
        "Large data transfer to external IP",
        "Sensitive file access outside normal hours",
        "Unauthorized database query detected",
        "Confidential data copied to external drive"
    ],
    "privilege_escalation": [
        "User gained elevated privileges",
        "Unauthorized admin access attempt",
        "Service account privilege abuse",
        "Sudo command executed by non-admin user"
    ]
}

def generate_timestamp(base_time, event_num):
    """Generate realistic timestamps with some clustering"""
    # Add some randomness but keep events mostly chronological
    minutes_offset = event_num * 0.5 + random.uniform(-30, 30)
    return base_time + timedelta(minutes=minutes_offset)

def generate_ip_pair(event_type):
    """Generate realistic source/destination IP pairs based on event type"""
    if event_type in ["login_failure"]:
        # External to internal for login events
        return random.choice(EXTERNAL_IPS), random.choice(INTERNAL_IPS)
    elif event_type in ["data_exfiltration", "suspicious_network"]:
        # Internal to external for data exfil
        return random.choice(INTERNAL_IPS), random.choice(EXTERNAL_IPS)
    elif event_type in ["malware_detected", "privilege_escalation"]:
        # Internal to internal
        return random.choice(INTERNAL_IPS), random.choice(INTERNAL_IPS)
    else:
        # Mixed scenarios
        if random.random() < 0.6:
            return random.choice(EXTERNAL_IPS), random.choice(INTERNAL_IPS)
        else:
            return random.choice(INTERNAL_IPS), random.choice(EXTERNAL_IPS)

def generate_event(event_num, base_time):
    """Generate a single security event"""
    event_type = random.choice(list(EVENT_TYPES.keys()))
    severity = random.choice(EVENT_TYPES[event_type])
    source_ip, dest_ip = generate_ip_pair(event_type)

    # Some events are system-generated
    if event_type in ["malware_detected", "suspicious_network"]:
        user = "system" if random.random() < 0.7 else random.choice(USERS)
    else:
        user = random.choice(USERS)

    timestamp = generate_timestamp(base_time, event_num)
    description = random.choice(DESCRIPTIONS[event_type])

    return {
        "event_id": f"EVT-{event_num+1:06d}",
        "timestamp": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "event_type": event_type,
        "severity": severity,
        "source_ip": source_ip,
        "destination_ip": dest_ip,
        "user": user,
        "description": description
    }

def main():
    print(f"Generating {NUM_EVENTS} security events...")

    # Start from a base time (January 1, 2024)
    base_time = datetime(2024, 1, 1, 8, 0, 0)

    events = []
    for i in range(NUM_EVENTS):
        events.append(generate_event(i, base_time))

        if (i + 1) % 1000 == 0:
            print(f"Generated {i + 1} events...")

    # Write to CSV
    print(f"Writing events to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', newline='') as csvfile:
        fieldnames = ["event_id", "timestamp", "event_type", "severity",
                     "source_ip", "destination_ip", "user", "description"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(events)

    print(f"Successfully generated {NUM_EVENTS} security events in {OUTPUT_FILE}")

    # Print some statistics
    event_type_counts = {}
    severity_counts = {}
    for event in events:
        event_type = event["event_type"]
        severity = event["severity"]
        event_type_counts[event_type] = event_type_counts.get(event_type, 0) + 1
        severity_counts[severity] = severity_counts.get(severity, 0) + 1

    print("\nEvent Type Distribution:")
    for event_type, count in sorted(event_type_counts.items()):
        print(f"  {event_type}: {count}")

    print("\nSeverity Distribution:")
    for severity, count in sorted(severity_counts.items()):
        print(f"  {severity}: {count}")

if __name__ == "__main__":
    main()
