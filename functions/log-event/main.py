from crowdstrike.foundry.function import Function, Request, Response, APIError
from falconpy import APIHarnessV2
import time
import os
import uuid

func = Function.instance()

@func.handler(method='POST', path='/log-event')
def log_event_handler(request: Request) -> Response:
    """Store event data in the event_logs collection."""

    # Validate request
    if 'event_data' not in request.body:
        return Response(
            code=400,
            errors=[APIError(code=400, message='missing event_data')]
        )

    event_data = request.body['event_data']

    try:
        # Initialize the API client
        api_client = APIHarnessV2()

        # Prepare data for storage
        event_id = str(uuid.uuid4())
        json_data = {
            "event_id": event_id,
            "data": event_data,
            "timestamp": int(time.time())
        }

        # Handle APP_ID for local testing
        headers = {}
        if os.environ.get("APP_ID"):
            headers = {"X-CS-APP-ID": os.environ.get("APP_ID")}

        collection_name = "event_logs"

        # Store data in the collection
        response = api_client.command("PutObject",
                                      body=json_data,
                                      collection_name=collection_name,
                                      object_key=event_id,
                                      headers=headers)

        if response["status_code"] != 200:
            error_message = response.get('error', {}).get('message', 'Unknown error')
            return Response(
                code=response["status_code"],
                errors=[APIError(
                    code=response["status_code"],
                    message=f"Failed to store event: {error_message}"
                )]
            )

        # Query the collection to verify storage
        query_response = api_client.command("SearchObjects",
                                            filter=f"event_id:'{event_id}'",
                                            collection_name=collection_name,
                                            limit=5,
                                            headers=headers)

        return Response(
            body={
                "stored": True,
                "event_id": event_id,
                "metadata": query_response.get("body", {}).get("resources", [])
            },
            code=200
        )

    except Exception as e:
        return Response(
            code=500,
            errors=[APIError(code=500, message=f"Error saving to collection: {str(e)}")]
        )

if __name__ == '__main__':
    func.run()
