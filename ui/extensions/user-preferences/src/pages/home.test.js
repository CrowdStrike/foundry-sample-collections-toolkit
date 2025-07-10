import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Home } from './Home';
import { FalconApiContext } from '../contexts/falcon-api-context';

// Mock Shoelace components
jest.mock('@shoelace-style/shoelace/dist/react', () => ({
  SlButton: ({ children, onClick, loading, ...props }) => (
    <button onClick={onClick} disabled={loading} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  ),
  SlIconButton: ({ onClick, loading, name, ...props }) => (
    <button onClick={onClick} disabled={loading} {...props}>
      {name}
    </button>
  ),
  SlSelect: ({ children, onSlChange, value, ...props }) => (
    <select
      onChange={(e) => onSlChange?.({ target: { value: e.target.value } })}
      value={value} // This ensures the value is actually set
      {...props}
    >
      {children}
    </select>
  ),
  SlOption: ({ children, value, ...props }) => (
    <option value={value} {...props}>
      {children}
    </option>
  ),
  SlSwitch: ({ onSlChange, checked, ...props }) => (
    <input
      type="checkbox"
      onChange={(e) => onSlChange?.({ target: { checked: e.target.checked } })}
      checked={checked}
      {...props}
    />
  )
}));

// Mock CSS imports
jest.mock('@shoelace-style/shoelace/dist/themes/light.css', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/card/card.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/select/select.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/option/option.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/switch/switch.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/button/button.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/icon/icon.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/spinner/spinner.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/alert/alert.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/divider/divider.js', () => ({}));
jest.mock('@shoelace-style/shoelace/dist/components/skeleton/skeleton.js', () => ({}));

describe('Home Component', () => {
  const mockCollection = {
    read: jest.fn(),
    write: jest.fn(),
    delete: jest.fn()
  };

  const mockFalcon = {
    data: {
      user: {
        uuid: 'test-user-123',
        username: 'test.user@company.com'
      }
    },
    collection: jest.fn().mockReturnValue(mockCollection)
  };

  const renderWithContext = (falconValue = mockFalcon) => {
    return render(
      <FalconApiContext.Provider value={{ falcon: falconValue }}>
        <Home />
      </FalconApiContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear any remaining timers
    jest.clearAllTimers();
  });

  describe('Loading State', () => {
    it('shows loading skeleton initially', async () => {
      // Mock read to never resolve to keep component in loading state
      mockCollection.read.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        renderWithContext();
      });

      // Look for specific skeleton element instead of generic role
      expect(document.querySelector('sl-skeleton')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when preferences fail to load', async () => {
      mockCollection.read.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        renderWithContext();
      });

      await waitFor(() => {
        expect(screen.getByText('Error loading preferences')).toBeInTheDocument();
        expect(screen.getByText('Unable to load preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Load', () => {
    const mockPreferences = {
      theme: 'dark',
      dashboardLayout: 'compact',
      notificationsEnabled: false,
      lastUpdated: 1640995200000
    };

    beforeEach(() => {
      mockCollection.read.mockResolvedValue(mockPreferences);
    });

    it('displays user preferences correctly', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(() => {
        expect(screen.getByText('User preferences for:')).toBeInTheDocument();
        expect(screen.getByText('test.user@company.com')).toBeInTheDocument();
      });
    });

    it('shows delete button when preferences exist', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('trash');
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('populates form with existing preferences', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(() => {
        // Use more specific queries since getByDisplayValue might not work with our mock
        const selects = screen.getAllByRole('combobox');
        const themeSelect = selects[0]; // First select should be theme
        const layoutSelect = selects[1]; // Second select should be layout

        expect(themeSelect.value).toBe('dark');
        expect(layoutSelect.value).toBe('compact');

        // Check checkbox state
        const notificationSwitch = screen.getByRole('checkbox');
        expect(notificationSwitch).not.toBeChecked();
      });
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      mockCollection.read.mockResolvedValue(null); // No existing preferences
    });

    it('updates theme selection', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(async () => {
        const selects = screen.getAllByRole('combobox');
        const themeSelect = selects[0]; // First select is theme

        // Initially should be 'light' (default)
        expect(themeSelect.value).toBe('light');

        await act(async () => {
          fireEvent.change(themeSelect, { target: { value: 'dark' } });
        });

        expect(themeSelect.value).toBe('dark');
      });
    });

    it('updates layout selection', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(async () => {
        const selects = screen.getAllByRole('combobox');
        const layoutSelect = selects[1]; // Second select is layout

        // Initially should be 'standard' (default)
        expect(layoutSelect.value).toBe('standard');

        await act(async () => {
          fireEvent.change(layoutSelect, { target: { value: 'compact' } });
        });

        expect(layoutSelect.value).toBe('compact');
      });
    });

    it('toggles notifications switch', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(async () => {
        const notificationSwitch = screen.getByRole('checkbox');
        expect(notificationSwitch).toBeChecked();

        await act(async () => {
          fireEvent.click(notificationSwitch);
        });

        expect(notificationSwitch).not.toBeChecked();
      });
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockCollection.read.mockResolvedValue(null);
      mockCollection.write.mockResolvedValue({});
    });

    it('saves preferences successfully', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(async () => {
        const saveButton = screen.getByText('Save Preferences');

        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(mockCollection.write).toHaveBeenCalledWith(
          'test-user-123',
          expect.objectContaining({
            userId: 'test-user-123',
            theme: 'light',
            dashboardLayout: 'standard',
            notificationsEnabled: true,
            lastUpdated: expect.any(Number)
          })
        );
      });
    });

    it('shows success message after saving', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(async () => {
        const saveButton = screen.getByText('Save Preferences');

        await act(async () => {
          fireEvent.click(saveButton);
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    const existingPreferences = {
      theme: 'dark',
      dashboardLayout: 'compact',
      notificationsEnabled: false,
      lastUpdated: Date.now()
    };

    beforeEach(() => {
      mockCollection.read.mockResolvedValue(existingPreferences);
      mockCollection.delete.mockResolvedValue({});
    });

    it('deletes preferences successfully', async () => {
      await act(async () => {
        renderWithContext();
      });

      await waitFor(async () => {
        const deleteButton = screen.getByText('trash');

        await act(async () => {
          fireEvent.click(deleteButton);
        });

        expect(mockCollection.delete).toHaveBeenCalledWith('test-user-123');
      });
    });

    it('resets form to defaults after deletion', async () => {
      await act(async () => {
        renderWithContext();
      });

      // First verify the existing preferences are loaded
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects[0].value).toBe('dark'); // theme
        expect(selects[1].value).toBe('compact'); // layout
      });

      // Now delete and check reset to defaults
      await act(async () => {
        const deleteButton = screen.getByText('trash');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects[0].value).toBe('light'); // theme reset to default
        expect(selects[1].value).toBe('standard'); // layout reset to default

        const notificationSwitch = screen.getByRole('checkbox');
        expect(notificationSwitch).toBeChecked(); // notifications reset to default (true)
      });
    });
  });

  describe('No Falcon Context', () => {
    it('handles missing falcon context gracefully', async () => {
      await act(async () => {
        render(
          <FalconApiContext.Provider value={{ falcon: null }}>
            <Home />
          </FalconApiContext.Provider>
        );
      });

      // Should still render without crashing
      expect(document.querySelector('sl-card')).toBeInTheDocument();
    });
  });
});
