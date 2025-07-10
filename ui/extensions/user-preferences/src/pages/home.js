import React, { useContext, useEffect, useState } from 'react';
import { FalconApiContext } from '../contexts/falcon-api-context';

function Home() {
  const {falcon} = useContext(FalconApiContext);

  const userId = falcon?.data?.user?.username || "";
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(async () => {
    const loadPreferences = async () => {
      try {
        const userPrefs = falcon.collection({
          collection: "user_preferences"
        });

        const data = await userPrefs.read(userId);
        setPreferences(data);
      } catch (err) {
        console.error("Failed to load preferences:", err);
        setError("Unable to load preferences");
      } finally {
        setLoading(false);
      }
    };

    await loadPreferences();
  }, [userId]);

  if (loading) return <div>Loading preferences...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!preferences) return <div>No preferences found</div>;

  return (
    <div>
      <h2>User Preferences</h2>
      <div>Theme: {preferences.theme || "Default"}</div>
      <div>Layout: {preferences.dashboardLayout || "Standard"}</div>
      <div>Notifications: {preferences.notificationsEnabled ? "On" : "Off"}</div>
    </div>
  );
}

export { Home };
