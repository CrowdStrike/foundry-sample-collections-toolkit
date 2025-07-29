import React, { useContext, useEffect, useState } from 'react';
import { FalconApiContext } from '../contexts/falcon-api-context';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton.js';

import { SlButton, SlIconButton, SlOption, SlSelect, SlSwitch } from '@shoelace-style/shoelace/dist/react';

function Home() {
  const { falcon } = useContext(FalconApiContext);

  const userId = falcon?.data?.user?.uuid || "42";
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    theme: 'light',
    dashboardLayout: 'standard',
    notificationsEnabled: true
  });

  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId || !falcon) return;

      try {
        setLoading(true);
        const userPrefs = falcon.collection({
          collection: "user_preferences"
        });

        const data = await userPrefs.read(userId);

        if (data) {
          setPreferences(data);
          setFormData({
            theme: data.theme || 'light',
            dashboardLayout: data.dashboardLayout || 'standard',
            notificationsEnabled: data.notificationsEnabled !== false
          });
        } else {
          // Set default preferences
          setPreferences({
            theme: 'light',
            dashboardLayout: 'standard',
            notificationsEnabled: true
          });
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
        setError("Unable to load preferences");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId, falcon]);

  useEffect(() => {
    let timer;
    if (saveSuccess) {
      // Hide success message after 3 seconds
      timer = setTimeout(() => setSaveSuccess(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const userPrefs = falcon.collection({
        collection: "user_preferences"
      });

      const updatedPreferences = {
        userId: userId,
        theme: formData.theme,
        dashboardLayout: formData.dashboardLayout,
        notificationsEnabled: formData.notificationsEnabled,
        lastUpdated: Date.now()
      };

      await userPrefs.write(userId, updatedPreferences);
      setPreferences(updatedPreferences);
      setSaveSuccess(true);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setError("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let timer;
    if (deleteSuccess) {
      // Hide success message after 3 seconds
      timer = setTimeout(() => setDeleteSuccess(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [deleteSuccess]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteSuccess(false);

      const userPrefs = falcon.collection({
        collection: "user_preferences"
      });

      await userPrefs.delete(userId);

      // Reset to defaults
      const defaultPreferences = {
        theme: "light",
        dashboardLayout: "standard",
        notificationsEnabled: true
      };

      setPreferences(null);
      setFormData(defaultPreferences);
      setDeleteSuccess(true);
    } catch (err) {
      console.error("Failed to delete preferences:", err);
      setError("Failed to delete preferences");
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <sl-card class="preference-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <sl-skeleton style={{ width: '100%', height: '40px' }}></sl-skeleton>
            <sl-skeleton style={{ width: '100%', height: '40px' }}></sl-skeleton>
            <sl-skeleton style={{ width: '60%', height: '24px' }}></sl-skeleton>
            <sl-skeleton style={{ width: '120px', height: '36px' }}></sl-skeleton>
          </div>
        </sl-card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <sl-alert variant="danger" open>
          <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
          <strong>Error loading preferences</strong><br />
          {error}
        </sl-alert>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>

      <sl-card className="preference-card">

        <div className="card-content">
          <div className="card-header user-info" slot="header">
            <span>User preferences for: <strong
              style={{color: 'rgb(59, 130, 246)'}}>{falcon.data.user.username}</strong></span>
            {preferences?.lastUpdated && (
              <SlIconButton
                name="trash"
                label="Delete preferences"
                className="delete-button"
                loading={deleting}
                onClick={handleDelete}
                style={{
                  '--sl-color-neutral-600': 'var(--sl-color-danger-600)',
                  '--sl-color-neutral-700': 'var(--sl-color-danger-700)'
                }}
              ></SlIconButton>
            )}
          </div>

          {saveSuccess && (
            <sl-alert variant="success" open closable style={{ marginBottom: '0.75rem' }}>
              <sl-icon slot="icon" name="check-circle"></sl-icon>
              Preferences saved successfully!
            </sl-alert>
          )}

          {deleteSuccess && (
            <sl-alert variant="success" open closable style={{ marginBottom: '0.75rem' }}>
              <sl-icon slot="icon" name="check-circle"></sl-icon>
              Preferences deleted successfully! Default settings restored.
            </sl-alert>
          )}

          <div className="preference-section">
            {/* Theme Selection */}
            <div className="preference-item">
              <label className="preference-label">
                <sl-icon name="palette" style={{fontSize: '1rem', color: 'var(--sl-color-primary-500)'}}></sl-icon>
                Theme Preference
              </label>
              <SlSelect
                value={formData.theme}
                placeholder="Select theme"
                onSlChange={(e) => handleInputChange('theme', e.target.value)}
                style={{width: '100%'}}
              >
                <SlOption value="light">
                  <sl-icon slot="prefix" name="sun"></sl-icon>
                  Light Theme
                </SlOption>
                <SlOption value="dark">
                  <sl-icon slot="prefix" name="moon"></sl-icon>
                  Dark Theme
                </SlOption>
              </SlSelect>
            </div>

            {/* Layout Selection */}
            <div className="preference-item">
              <label className="preference-label">
                <sl-icon name="grid" style={{fontSize: '1rem', color: 'var(--sl-color-primary-500)'}}></sl-icon>
                Dashboard Layout
              </label>
              <SlSelect
                value={formData.dashboardLayout}
                placeholder="Select layout"
                onSlChange={(e) => handleInputChange('dashboardLayout', e.target.value)}
                style={{width: '100%'}}
              >
                <SlOption value="compact">
                  <sl-icon slot="prefix" name="grid-3x3"></sl-icon>
                  Compact - Dense information display
                </SlOption>
                <SlOption value="standard">
                  <sl-icon slot="prefix" name="grid"></sl-icon>
                  Standard - Balanced layout
                </SlOption>
                <SlOption value="expanded">
                  <sl-icon slot="prefix" name="grid-1x2"></sl-icon>
                  Expanded - Spacious layout
                </SlOption>
              </SlSelect>
            </div>

            {/* Notifications Toggle */}
            <div className="preference-item">
              <div className="switch-container">
                <div className="switch-label">
                  <sl-icon
                    name={formData.notificationsEnabled ? "bell" : "bell-slash"}
                    style={{fontSize: '1rem', color: 'var(--sl-color-primary-500)'}}
                  ></sl-icon>
                  Enable Notifications
                </div>
                <SlSwitch
                  checked={formData.notificationsEnabled}
                  onSlChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
                >
                </SlSwitch>
              </div>
              <div className="notification-help">
                {formData.notificationsEnabled
                  ? "You'll receive notifications for important security events"
                  : "Notifications are disabled - you won't receive alerts"
                }
              </div>
            </div>
          </div>

          <sl-divider style={{margin: '1rem 0 0.75rem 0'}}></sl-divider>

          <div className="save-section">
            <SlButton
              variant="primary"
              size="medium"
              loading={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Preferences"}
            </SlButton>

            {preferences?.lastUpdated && (
              <div style={{fontSize: '0.8rem', color: 'var(--sl-color-neutral-500)'}}>
                Last updated: {new Date(preferences.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </sl-card>
    </div>
  );
}

export { Home };
