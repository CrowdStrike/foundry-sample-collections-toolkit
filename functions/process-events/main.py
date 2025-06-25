from crowdstrike.foundry.function import Function, Request, Response, APIError
from falconpy import APIHarnessV2
import time
import os

func = Function.instance()

@func.handler(method='POST', path='/process-events')
def process_events_handler(request: Request) -> Response:
    """Process events with checkpointing to prevent duplicate processing."""

    try:
        api_client = APIHarnessV2()
        headers = {}
        if os.environ.get("APP_ID"):
            headers = {"X-CS-APP-ID": os.environ.get("APP_ID")}

        checkpoint_collection = "processing_checkpoints"
        workflow_id = request.body.get('workflow_id', 'default')

        # Retrieve last checkpoint
        checkpoint_response = api_client.command("SearchObjects",
                                                 filter=f"workflow_id:'{workflow_id}'",
                                                 collection_name=checkpoint_collection,
                                                 limit=1,
                                                 headers=headers)

        # Get last processed timestamp or use default
        last_timestamp = 0
        if checkpoint_response.get("body", {}).get("resources"):
            last_checkpoint = checkpoint_response["body"]["resources"][0]
            last_timestamp = last_checkpoint.get("last_processed_timestamp", 0)

        # Simulate fetching new events since last checkpoint
        current_timestamp = int(time.time())
        new_events = simulate_fetch_events_since(last_timestamp, current_timestamp)

        # Process the events
        processed_count = len(new_events)

        # Simulate event processing
        for event in new_events:
            process_single_event(event)

        # Update checkpoint with latest processing state
        checkpoint_data = {
            "workflow_id": workflow_id,
            "last_processed_timestamp": current_timestamp,
            "processed_count": processed_count,
            "last_updated": current_timestamp,
            "status": "completed"
        }

        api_client.command("PutObject",
                           body=checkpoint_data,
                           collection_name=checkpoint_collection,
                           object_key=f"checkpoint_{workflow_id}",
                           headers=headers)

        return Response(
            body={
                "processed_events": processed_count,
                "last_checkpoint": current_timestamp,
                "previous_checkpoint": last_timestamp,
                "status": "success"
            },
            code=200
        )

    except Exception as e:
        return Response(
            code=500,
            errors=[APIError(code=500, message=f"Processing failed: {str(e)}")]
        )

def simulate_fetch_events_since(timestamp, current_time):
    """Simulate fetching events from a data source."""
    return [
        {"id": f"event_{i}", "timestamp": current_time - i, "data": f"sample_data_{i}"}
        for i in range(5)
    ]

def process_single_event(event):
    """Simulate processing a single event."""
    print(f"Processing event: {event['id']}")

if __name__ == '__main__':
    func.run()
