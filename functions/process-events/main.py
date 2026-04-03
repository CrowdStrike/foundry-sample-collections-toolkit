"""
CrowdStrike Foundry Function for processing events with checkpointing.

This module provides a REST API endpoint for processing events with checkpointing
to prevent duplicate processing and maintain state across function invocations.
"""

import json
import os
import time
from logging import Logger
from typing import Dict, List, Any

from crowdstrike.foundry.function import Function, Request, Response, APIError
from falconpy import CustomStorage

FUNC = Function.instance()


@FUNC.handler(method="POST", path="/process-events")
def process_events_handler(request: Request, config: Dict[str, object] | None, logger: Logger) -> Response:
    """Process events with checkpointing to prevent duplicate processing."""
    # Mark unused config parameter
    _ = config

    try:
        # Initialize custom storage and workflow
        workflow_context = _initialize_workflow(request, logger)

        # Get checkpoint data
        checkpoint_data = _get_checkpoint(workflow_context)

        # Process events and update checkpoint
        return _process_and_update(workflow_context, checkpoint_data)

    except ValueError as ve:
        return Response(
            code=400,
            errors=[APIError(code=400, message=f"Validation error: {str(ve)}")]
        )
    except (ConnectionError, TimeoutError) as conn_error:
        return Response(
            code=503,
            errors=[APIError(code=503, message=f"Connection error: {str(conn_error)}")]
        )
    except KeyError as ke:
        return Response(
            code=400,
            errors=[APIError(code=400, message=f"Missing required field: {str(ke)}")]
        )


def _initialize_workflow(request: Request, logger: Logger) -> Dict[str, Any]:
    """Initialize workflow context with custom storage and configuration."""
    custom_storage = CustomStorage(ext_headers=_app_headers())

    checkpoint_collection = "processing_checkpoints"
    workflow_id = request.body.get("workflow_id", "default")

    logger.info(f"Processing workflow ID: {workflow_id}")

    return {
        "custom_storage": custom_storage,
        "checkpoint_collection": checkpoint_collection,
        "workflow_id": workflow_id,
        "logger": logger
    }


def _app_headers() -> Dict[str, str]:
    """Build app headers for CustomStorage construction."""
    app_id = os.environ.get("APP_ID")
    if app_id:
        return {"X-CS-APP-ID": app_id}
    return {}


def _get_checkpoint(workflow_context: Dict[str, Any]) -> Dict[str, Any]:
    """Retrieve the last checkpoint for the workflow."""
    custom_storage = workflow_context["custom_storage"]
    checkpoint_collection = workflow_context["checkpoint_collection"]
    workflow_id = workflow_context["workflow_id"]
    logger = workflow_context["logger"]

    # Retrieve the most recent checkpoint for this workflow
    checkpoint_response = custom_storage.SearchObjects(filter=f"workflow_id:'{workflow_id}'",
                                                   collection_name=checkpoint_collection,
                                                   sort="last_processed_timestamp.desc",
                                                   limit=1)

    logger.debug(f"checkpoint response: {checkpoint_response}")

    # Get last processed timestamp or use default
    last_timestamp = 0
    if checkpoint_response.get("body", {}).get("resources"):
        last_checkpoint = checkpoint_response["body"]["resources"][0]
        logger.debug(f"last_checkpoint: {last_checkpoint}")

        # SearchObjects returns metadata, not actual objects, so use GetObject for details
        object_details = custom_storage.GetObject(collection_name=checkpoint_collection,
                                              object_key=last_checkpoint["object_key"])

        # GetObject returns bytes; convert to JSON
        json_response = json.loads(object_details.decode("utf-8"))
        logger.debug(f"object_details response: {json_response}")

        last_timestamp = json_response["last_processed_timestamp"]

    logger.debug(f"last_timestamp: {last_timestamp}")

    return {"last_timestamp": last_timestamp}


def _process_and_update(workflow_context: Dict[str, Any], checkpoint_data: Dict[str, Any]) -> Response:
    """Process events and update checkpoint."""
    custom_storage = workflow_context["custom_storage"]
    checkpoint_collection = workflow_context["checkpoint_collection"]
    workflow_id = workflow_context["workflow_id"]
    logger = workflow_context["logger"]
    last_timestamp = checkpoint_data["last_timestamp"]

    # Simulate fetching new events since last checkpoint
    current_timestamp = int(time.time())
    new_events = simulate_fetch_events_since(last_timestamp)

    # Process the events
    processed_count = len(new_events)

    # Simulate event processing
    for event in new_events:
        process_single_event(event)

    # Update checkpoint with latest processing state
    checkpoint_update = {
        "workflow_id": workflow_id,
        "last_processed_timestamp": current_timestamp,
        "processed_count": processed_count,
        "last_updated": current_timestamp,
        "status": "completed"
    }

    logger.debug(f"Sending data to PutObject: {checkpoint_update}")

    custom_storage.PutObject(body=checkpoint_update,
                         collection_name=checkpoint_collection,
                         object_key=f"checkpoint_{workflow_id}")

    return Response(
        body={
            "processed_events": processed_count,
            "last_checkpoint": current_timestamp,
            "previous_checkpoint": last_timestamp,
            "status": "success"
        },
        code=200
    )


def simulate_fetch_events_since(last_timestamp: int) -> List[Dict[str, Any]]:
    """Simulate fetching events from a data source."""
    # Use last_timestamp to simulate fetching only new events
    current_time = int(time.time())

    # Only return events that are newer than the last processed timestamp
    return [
        {"id": f"event_{i}", "timestamp": current_time - i, "data": f"sample_data_{i}"}
        for i in range(5)
        if (current_time - i) > last_timestamp
    ]


def process_single_event(event: Dict[str, Any]) -> None:
    """Simulate processing a single event."""
    print(f"Processing event: {event['id']}")


if __name__ == "__main__":
    FUNC.run()
