import io
import os
import time
import uuid
from datetime import datetime
from logging import Logger
from typing import Dict

import pandas as pd
from crowdstrike.foundry.function import Function, Request, Response, APIError
from falconpy import APIHarnessV2

func = Function.instance()


@func.handler(method="POST", path="/import-csv")
def import_csv_handler(request: Request, config: Dict[str, object] | None, logger: Logger) -> Response:
    """Import CSV data into a Foundry Collection."""

    print("here")
    # Validate request
    if "csv_data" not in request.body and "csv_file_path" not in request.body:
        return Response(
            code=400,
            errors=[APIError(code=400, message="Either csv_data or csv_file_path is required")]
        )

    collection_name = request.body.get("collection_name", "security_events_csv")

    try:
        api_client = APIHarnessV2()
        headers = {}
        if os.environ.get("APP_ID"):
            headers = {"X-CS-APP-ID": os.environ.get("APP_ID")}

        logger.info(f"csv_data: {request.body['csv_data']}")
        # Read CSV data
        if "csv_data" in request.body:
            # CSV data provided as string
            csv_string = request.body["csv_data"]
            df = pd.read_csv(io.StringIO(csv_string))
            source_filename = "direct_upload"
        else:
            # CSV file path provided
            csv_file_path = request.body["csv_file_path"]

            logger.debug(f"Before: {csv_file_path}")
            # If it's just a filename (no directory separators), prepend current directory
            if not os.path.dirname(csv_file_path):
                csv_file_path = os.path.join(os.getcwd(), csv_file_path)
                logger.debug(f"After: {csv_file_path}")

            df = pd.read_csv(csv_file_path)
            source_filename = os.path.basename(csv_file_path)

        # Transform and validate data
        transformed_records = []
        import_timestamp = int(time.time())

        for index, row in df.iterrows():
            try:
                # Transform the row to match schema
                record = transform_csv_row(row, source_filename, import_timestamp)

                # Validate required fields
                validate_record(record)

                transformed_records.append(record)

            except Exception as row_error:
                print(f"Error processing row {index}: {str(row_error)}")
                continue

        # Import records to Collection with batch processing
        import_results = batch_import_records(api_client,
                                              transformed_records,
                                              collection_name,
                                              headers
                                              )

        return Response(
            body={
                "success": True,
                "total_rows": len(df),
                "processed_rows": len(transformed_records),
                "imported_records": import_results["success_count"],
                "failed_records": import_results["error_count"],
                "collection_name": collection_name,
                "source_file": source_filename,
                "import_timestamp": import_timestamp
            },
            code=200
        )

    except Exception as e:
        return Response(
            code=500,
            errors=[APIError(code=500, message=f"CSV import failed: {str(e)}")]
        )


def transform_csv_row(row, source_filename, import_timestamp):
    """Transform a CSV row to match the Collection schema."""

    # Parse timestamp
    timestamp_str = str(row.get("timestamp", ""))
    try:
        # Try parsing ISO format
        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        timestamp_unix = int(dt.timestamp())
    except:
        # Fallback to current timestamp
        timestamp_unix = import_timestamp
        timestamp_str = datetime.fromtimestamp(import_timestamp).isoformat() + "Z"

    # Create transformed record
    record = {
        "event_id": str(row.get("event_id", f"csv_{uuid.uuid4()}")),
        "timestamp": timestamp_str,
        "timestamp_unix": timestamp_unix,
        "event_type": str(row.get("event_type", "unknown")).lower(),
        "severity": str(row.get("severity", "low")).lower(),
        "source_ip": str(row.get("source_ip", "")),
        "destination_ip": str(row.get("destination_ip", "")),
        "user": str(row.get("user", "")),
        "description": str(row.get("description", "")),
        "imported_at": import_timestamp,
        "csv_source": source_filename
    }

    # Clean empty strings to None for optional fields
    for key, value in record.items():
        if value == "" and key not in ["event_id", "timestamp", "event_type", "severity"]:
            record[key] = None

    return record


def validate_record(record):
    """Validate that record meets schema requirements."""
    required_fields = ["event_id", "timestamp", "event_type", "severity"]

    for field in required_fields:
        if not record.get(field):
            raise ValueError(f"Missing required field: {field}")

    # Validate enums
    valid_severities = ["low", "medium", "high", "critical"]
    if record["severity"] not in valid_severities:
        raise ValueError(f"Invalid severity: {record['severity']}. Must be one of {valid_severities}")

    valid_event_types = ["login_failure", "malware_detected", "suspicious_network", "data_exfiltration",
                         "privilege_escalation"]
    if record["event_type"] not in valid_event_types:
        # Allow unknown event types but log a warning
        print(f"Warning: Unknown event type: {record['event_type']}")


def batch_import_records(api_client, records, collection_name, headers, batch_size=50):
    """Import records to Collection in batches with rate limiting."""

    success_count = 0
    error_count = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]

        # Rate limiting: pause between batches
        if i > 0:
            time.sleep(0.5)

        for record in batch:
            try:
                response = api_client.command("PutObject",
                                              body=record,
                                              collection_name=collection_name,
                                              object_key=record["event_id"],
                                              headers=headers)

                if response["status_code"] == 200:
                    success_count += 1
                else:
                    error_count += 1
                    print(f"Failed to import record {record["event_id"]}: {response}")

            except Exception as e:
                error_count += 1
                print(f"Error importing record {record.get("event_id", "unknown")}: {str(e)}")

        print(f"Processed batch {i // batch_size + 1}: {len(batch)} records")

    return {
        "success_count": success_count,
        "error_count": error_count
    }


if __name__ == "__main__":
    func.run()
