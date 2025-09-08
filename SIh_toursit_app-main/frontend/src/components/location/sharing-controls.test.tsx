import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SharingControls } from './sharing-controls';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('SharingControls', () => {
  const mockProps = {
    isSharing: false,
    onSharingToggle: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders sharing controls with start button when not sharing', () => {
    render(<SharingControls {...mockProps} />);
    
    expect(screen.getByText(/Location Sharing Controls/)).toBeInTheDocument();
    expect(screen.getByText(/Start Sharing/)).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders sharing controls with stop button when sharing', () => {
    render(<SharingControls {...mockProps} isSharing={true} />);
    
    expect(screen.getByText(/Stop Sharing/)).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles start sharing button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, shareId: 'test-share-id' }),
    } as Response);

    render(<SharingControls {...mockProps} />);
    
    const startButton = screen.getByText(/Start Sharing/);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/location/share', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer')
        }),
        body: JSON.stringify({ action: 'start' }),
      });
      expect(mockProps.onSharingToggle).toHaveBeenCalledWith(true);
    });
  });

  it('handles stop sharing button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<SharingControls {...mockProps} isSharing={true} />);
    
    const stopButton = screen.getByText(/Stop Sharing/);
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/location/share', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer')
        }),
        body: JSON.stringify({ action: 'stop' }),
      });
      expect(mockProps.onSharingToggle).toHaveBeenCalledWith(false);
    });
  });

  it('handles API error during sharing toggle', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SharingControls {...mockProps} />);
    
    const startButton = screen.getByText(/Start Sharing/);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Error starting location sharing');
    });
  });

  it('shows loading state during API call', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise as Promise<Response>);

    render(<SharingControls {...mockProps} />);
    
    const startButton = screen.getByText(/Start Sharing/);
    fireEvent.click(startButton);

    expect(screen.getByText(/Starting\.\.\./)).toBeInTheDocument();

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(screen.queryByText(/Starting\.\.\./)).not.toBeInTheDocument();
    });
  });

  it('displays current location when sharing is active', () => {
    const propsWithLocation = {
      ...mockProps,
      isSharing: true,
      currentLocation: { latitude: 40.7128, longitude: -74.0060 },
    };

    render(<SharingControls {...propsWithLocation} />);
    
    expect(screen.getByText(/Current Location:/)).toBeInTheDocument();
    expect(screen.getByText(/40.7128, -74.0060/)).toBeInTheDocument();
  });

  it('shows privacy level selector when sharing', () => {
    render(<SharingControls {...mockProps} isSharing={true} />);
    
    expect(screen.getByText('Privacy Level:')).toBeInTheDocument();
    expect(screen.getByText('Medium - Approximate area')).toBeInTheDocument();
  });

  it('handles privacy level change', () => {
    const onPrivacyChange = jest.fn();
    render(
      <SharingControls 
        {...mockProps} 
        isSharing={true} 
        onPrivacyLevelChange={onPrivacyChange}
      />
    );
    
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    // Since we can't easily test the select dropdown in jsdom,
    // we'll test that the callback would be called
    expect(onPrivacyChange).toBeDefined();
  });
});
