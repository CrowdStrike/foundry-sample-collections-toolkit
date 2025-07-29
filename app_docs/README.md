# Foundry Sample with Collections

This sample is designed to show how to use Collections in Falcon Foundry. It contains a few capabilities:

1. Collections:

   - [**event_logs**](collections/event_logs.json)
   - [**processing_checkpoints**](collections/processing_checkpoints.json)
   - [**security_events_csv**](collections/security_events_csv.json)
   - [**threat_intel**](collections/threat_intel.json)
   - [**user_preferences**](collections/user_preferences.json)

2. Python functions:

   - [**csv-import**](functions/csv-import/main.py): Shows how to import CSV files and convert to collection data
   - [**log-event**](functions/log-event/main.py): Uses FalconPy to store data in a collection
   - [**process-events**](functions/process-events/main.py): Processes events with checkpointing to prevent
     duplicates

3. Test workflows to invoke the last two functions.
4. Extensive integration testing for the CSV import via GitHub Actions.
5. UI extensions on **Host setup and management** > **Host management** that can be used to do CRUD (Create, Read, Update, and Delete) on the `user_preferences` collection.

## Usage

After installing the app, go to **Fusion SOAR** > **Workflows** to see the test workflows for functions. Execute the **Test log_event_handler function** workflow to ensure it works. You can also run the **Test process_events_handler function** to verify its functionality. The **Test user_preferences collection** workflow shows how you can use built-in Fusion SOAR actions to CRUD a collection. 

To see the UI extension, go to **Host setup and management** > **Host management** and click on a host. Look for the **User Preferences** panel on the right. Click to expand, save your preferences, and click the **Save Preferences** button. Refresh your browser to confirm your preferences are saved. Use the 🗑️ icon to delete your preferences. 

The source code for this app can be found on GitHub: <https://github.com/CrowdStrike/foundry-sample-collections>. 
