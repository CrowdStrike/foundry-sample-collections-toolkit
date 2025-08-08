"""
CrowdStrike Foundry Function for importing CSV data into Collections.

This module provides a REST API endpoint for importing CSV data into CrowdStrike
Foundry Collections with data transformation and validation.
"""

import io
import os
import time
import uuid
from datetime import datetime
from logging import Logger
from typing import Dict, Any, List

import pandas as pd
from crowdstrike.foundry.function import Function, Request, Response, APIError
from falconpy import APIHarnessV2

FUNC = Function.instance()


@FUNC.handler(method="POST", path="/import-csv")
def import_csv_handler(request: Request, config: Dict[str, object] | None, logger: Logger) -> Response:
    """Import CSV data into a Foundry Collection."""
    # Mark unused config parameter
    _ = config

    # Validate request
    if "csv_data" not in request.body and "csv_file_path" not in request.body:
        return Response(
            code=400,
            errors=[APIError(code=400, message="Either csv_data or csv_file_path is required")]
        )

    collection_name = request.body.get("collection_name", "security_events_csv")

    try:
        # Process the import request
        return _process_import_request(request, collection_name, logger)

    except pd.errors.EmptyDataError as ede:
        return Response(
            code=400,
            errors=[APIError(code=400, message=f"CSV file is empty: {str(ede)}")]
        )
    except ValueError as ve:
        return Response(
            code=400,
            errors=[APIError(code=400, message=f"Validation error: {str(ve)}")]
        )
    except FileNotFoundError as fe:
        return Response(
            code=404,
            errors=[APIError(code=404, message=f"File not found: {str(fe)}")]
        )
    except (IOError, OSError) as ioe:
        return Response(
            code=500,
            errors=[APIError(code=500, message=f"File I/O error: {str(ioe)}")]
        )


def _process_import_request(request: Request, collection_name: str, logger: Logger) -> Response:
    """Process the import request and return response."""
    # Initialize API client and headers
    api_client = APIHarnessV2()
    headers = _get_headers()

    # Read CSV data
    csv_data_result = _read_csv_data(request, logger)
    df = csv_data_result["dataframe"]
    source_filename = csv_data_result["source_filename"]

    # Transform and validate data
    import_timestamp = int(time.time())
    transformed_records = _process_dataframe(df, source_filename, import_timestamp)

    # Import records to Collection with batch processing
    import_results = batch_import_records(api_client, transformed_records, collection_name, headers)

    return _create_success_response({
        "df": df,
        "transformed_records": transformed_records,
        "import_results": import_results,
        "collection_name": collection_name,
        "source_filename": source_filename,
        "import_timestamp": import_timestamp
    })


def _get_headers() -> Dict[str, str]:
    """Get headers for API requests."""
    headers = {}
    if os.environ.get("APP_ID"):
        headers = {"X-CS-APP-ID": os.environ.get("APP_ID")}
    return headers


def _read_csv_data(request: Request, logger: Logger) -> Dict[str, Any]:
    """Read CSV data from request body or file path."""
    if "csv_data" in request.body:
        # CSV data provided as string
        csv_string = request.body["csv_data"]
        df = pd.read_csv(io.StringIO(csv_string))
        source_filename = "direct_upload"
    else:
        # CSV file path provided
        csv_file_path = request.body["csv_file_path"]

        # If it's just a filename (no directory separators), prepend current directory
        if not os.path.dirname(csv_file_path):
            csv_file_path = os.path.join(os.getcwd(), csv_file_path)
            logger.debug(f"After: {csv_file_path}")

        df = pd.read_csv(csv_file_path)
        source_filename = os.path.basename(csv_file_path)

    return {"dataframe": df, "source_filename": source_filename}


def _process_dataframe(df: pd.DataFrame, source_filename: str, import_timestamp: int) -> List[Dict[str, Any]]:
    """Process dataframe and transform records."""
    transformed_records = []

    for index, row in df.iterrows():
        try:
            # Transform the row to match schema
            record = transform_csv_row(row, source_filename, import_timestamp)

            # Validate required fields
            validate_record(record)

            transformed_records.append(record)

        except ValueError as row_error:
            print(f"Error processing row {index}: {str(row_error)}")
            continue

    return transformed_records


def _create_success_response(response_data: Dict[str, Any]) -> Response:
    """Create success response with import results."""
    df = response_data["df"]
    transformed_records = response_data["transformed_records"]
    import_results = response_data["import_results"]
    collection_name = response_data["collection_name"]
    source_filename = response_data["source_filename"]
    import_timestamp = response_data["import_timestamp"]

    return Response(
        body={
            "success": import_results["success_count"] > 0,
            "total_rows": len(df),
            "processed_rows": len(transformed_records),
            "imported_records": import_results["success_count"],
            "failed_records": import_results["error_count"],
            "collection_name": collection_name,
            "source_file": source_filename,
            "import_timestamp": import_timestamp
        },
        code=200 if import_results["success_count"] > 0 else 207
    )


def transform_csv_row(row: pd.Series, source_filename: str, import_timestamp: int) -> Dict[str, Any]:
    """Transform a CSV row to match the Collection schema."""

    # Parse timestamp
    timestamp_str = str(row.get("timestamp", ""))
    try:
        # Try parsing ISO format
        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        timestamp_unix = int(dt.timestamp())
    except (ValueError, TypeError):
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


def validate_record(record: Dict[str, Any]) -> None:
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


def batch_import_records(
    api_client: APIHarnessV2,
    records: List[Dict[str, Any]],
    collection_name: str,
    headers: Dict[str, str],
    batch_size: int = 50
) -> Dict[str, int]:
    """Import records to Collection in batches with rate limiting."""

    success_count = 0
    error_count = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]

        # Rate limiting: pause between batches
        if i > 0:
            time.sleep(0.5)

        batch_context = {
            "api_client": api_client,
            "batch": batch,
            "collection_name": collection_name,
            "headers": headers,
            "batch_number": i // batch_size + 1
        }

        batch_results = _process_batch(batch_context)
        success_count += batch_results["success_count"]
        error_count += batch_results["error_count"]

    return {
        "success_count": success_count,
        "error_count": error_count
    }


def _process_batch(batch_context: Dict[str, Any]) -> Dict[str, int]:
    """Process a single batch of records."""
    api_client = batch_context["api_client"]
    batch = batch_context["batch"]
    collection_name = batch_context["collection_name"]
    headers = batch_context["headers"]
    batch_number = batch_context["batch_number"]

    success_count = 0
    error_count = 0

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
                print(f"Failed to import record {record['event_id']}: {response}")

        except (ConnectionError, TimeoutError) as conn_error:
            error_count += 1
            print(f"Connection error importing record {record.get('event_id', 'unknown')}: {str(conn_error)}")
        except KeyError as key_error:
            error_count += 1
            print(f"Key error importing record {record.get('event_id', 'unknown')}: {str(key_error)}")

    print(f"Processed batch {batch_number}: {len(batch)} records")

    return {
        "success_count": success_count,
        "error_count": error_count
    }


if __name__ == "__main__":
    FUNC.run()
