import FalconApi from '@crowdstrike/foundry-js';

(async () => {
    try {
      // Initialize and connect the SDK
      const falcon = new FalconApi();
      await falcon.connect();

      // Create a collection instance
      const userPreferences = falcon.collection({
        collection: 'user_preferences'
      });

      // CRUD Operations
      const userId = 'user123';

      // Create/Update: Store user preferences
      const userData = {
        theme: 'dark',
        dashboardLayout: 'compact',
        notificationsEnabled: true,
        lastUpdated: Date.now(),
        userId
      };

      await userPreferences.write(userId, userData);

      // Read: Retrieve user preferences
      const preferences = await userPreferences.read(userId);
      console.log(`User theme: ${preferences.theme}`);

      // Search: Find records that match criteria
      // Note: This doesn't use FQL. Exact matches are required
      const darkThemeUsers = await userPreferences.search({
        filter: `theme:'dark'`
      });
      console.log(`Dark theme users:`);
      console.table(darkThemeUsers.resources);

      // List: Get all keys in the collection (with pagination)
      const keys = await userPreferences.list({limit: 10})
      console.log("Collection keys:");
      console.table(keys.resources)

      // Delete: Remove a record
      await userPreferences.delete(userId);
    } catch (error) {
      console.error('Error performing collection operations:', error);
    }
  }
)();
