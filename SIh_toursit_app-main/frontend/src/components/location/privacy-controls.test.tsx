import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivacyControls } from './privacy-controls';

// Mock the precision selector component
jest.mock('./precision-selector', () => ({
  PrecisionSelector: ({ value, onChange, disabled }) => (
    React.createElement('div', { 'data-testid': 'precision-selector' },
      React.createElement('label', { htmlFor: 'precision' }, 'Precision Level'),
      React.createElement('select', {
        id: 'precision',
        value: value,
        onChange: (e) => onChange(e.target.value),
        disabled: disabled
      },
        React.createElement('option', { value: 'exact' }, 'Exact Location'),
        React.createElement('option', { value: 'street' }, 'Street Level (±100m)'),
        React.createElement('option', { value: 'neighborhood' }, 'Neighborhood Level'),
        React.createElement('option', { value: 'city' }, 'City Level')
      )
    )
  )
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('PrivacyControls', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  const defaultProps = {
    userId: 'user123',
    onUpdate: mockOnUpdate,
    settings: {
      precisionLevel: 'street',
      emergencyAccess: true,
      timeBasedSharing: false,
      shareDuration: 60,
      maxSharingDuration: 1440,
      sharingDurationHours: 24,
      autoStopSharing: true,
      allowedContacts: ['friend1', 'family1'],
      blockedContacts: ['blocked1']
    }
  };

  it('renders privacy settings form', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    expect(screen.getByText(/Privacy Settings/)).toBeInTheDocument();
    expect(screen.getByText('Location Precision')).toBeInTheDocument();
    expect(screen.getByText('Emergency Access')).toBeInTheDocument();
  });

  it('renders precision selector with correct props', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    const precisionSelector = screen.getByTestId('precision-selector');
    expect(precisionSelector).toBeInTheDocument();
    
    // Check that the select has the correct value selected
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('street');
  });

  it('handles precision level changes', async () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    const precisionSelect = screen.getByRole('combobox');
    
    fireEvent.change(precisionSelect, { target: { value: 'city' } });
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        precisionLevel: 'city'
      }));
    });
  });

  it('toggles emergency access', async () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    const emergencySwitch = screen.getByRole('switch', { name: /emergency access/i });
    expect(emergencySwitch).toBeChecked();
    
    fireEvent.click(emergencySwitch);
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        emergencyAccess: false
      }));
    });
  });

  it('toggles time-based sharing', async () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    const timeBasedSwitch = screen.getByRole('switch', { name: /time-based sharing/i });
    expect(timeBasedSwitch).not.toBeChecked();
    
    fireEvent.click(timeBasedSwitch);
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        timeBasedSharing: true
      }));
    });
  });

  it('displays contact management section', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    expect(screen.getByText(/Contact Permissions/)).toBeInTheDocument();
    expect(screen.getByText('Allowed Contacts')).toBeInTheDocument();
    expect(screen.getByText('Blocked Contacts')).toBeInTheDocument();
  });

  it('displays contact badges', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    expect(screen.getByText('friend1')).toBeInTheDocument();
    expect(screen.getByText('family1')).toBeInTheDocument();
    expect(screen.getByText('blocked1')).toBeInTheDocument();
  });

  it('shows manage contacts button', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    expect(screen.getByRole('button', { name: /manage contacts/i })).toBeInTheDocument();
  });

  it('displays privacy summary', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    expect(screen.getByText('Privacy Summary')).toBeInTheDocument();
    expect(screen.getByText('Precision Level:')).toBeInTheDocument();
    expect(screen.getByText('Emergency Access:')).toBeInTheDocument();
    expect(screen.getByText('Time Controls:')).toBeInTheDocument();
  });

  it('shows loading state during API calls', async () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true })
      }), 100))
    );
    
    render(React.createElement(PrivacyControls, defaultProps));
    
    const emergencySwitch = screen.getByRole('switch', { name: /emergency access/i });
    fireEvent.click(emergencySwitch);
    
    // Check that controls are disabled during loading
    expect(emergencySwitch).toBeDisabled();
    
    await waitFor(() => {
      expect(emergencySwitch).not.toBeDisabled();
    });
  });

  it('renders component when loading', () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    // Just check that the component renders successfully
    expect(screen.getByText(/Privacy Settings/)).toBeInTheDocument();
    expect(screen.getByTestId('precision-selector')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(React.createElement(PrivacyControls, defaultProps));
    
    const emergencySwitch = screen.getByRole('switch', { name: /emergency access/i });
    fireEvent.click(emergencySwitch);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to update privacy settings/i)).toBeInTheDocument();
    });
  });

  it('saves settings when changes are made', async () => {
    render(React.createElement(PrivacyControls, defaultProps));
    
    // Make a change first
    const emergencySwitch = screen.getByRole('switch', { name: /emergency access/i });
    fireEvent.click(emergencySwitch);
    
    await waitFor(() => {
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith('/api/privacy/settings', expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer')
        }),
        body: expect.stringContaining('allowEmergencyServices')
      }));
    });
  });
});
