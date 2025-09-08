import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccessHistory } from './access-history';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AccessHistory', () => {
  const mockAccessHistory = [
    {
      id: '1',
      accessorId: 'user-123',
      accessorName: 'Emergency Services',
      accessTime: '2024-01-15T10:30:00Z',
      purpose: 'Emergency Response',
      location: { latitude: 40.7128, longitude: -74.0060 },
      approved: true,
    },
    {
      id: '2',
      accessorId: 'user-456',
      accessorName: 'Family Contact',
      accessTime: '2024-01-14T15:45:00Z',
      purpose: 'Safety Check',
      location: { latitude: 40.7589, longitude: -73.9851 },
      approved: true,
    },
    {
      id: '3',
      accessorId: 'user-789',
      accessorName: 'Unknown Service',
      accessTime: '2024-01-14T12:00:00Z',
      purpose: 'Unauthorized Access',
      location: null,
      approved: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders access history title', () => {
    render(<AccessHistory />);
    
    expect(screen.getByText(/Recent Access History/)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    
    render(<AccessHistory />);
    
    expect(screen.getByText(/Loading access history/)).toBeInTheDocument();
  });

  it('loads and displays access history', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Services')).toBeInTheDocument();
      expect(screen.getByText('Family Contact')).toBeInTheDocument();
      expect(screen.getByText('Unknown Service')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/location/access-history', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': expect.stringContaining('Bearer')
      })
    }));
  });

  it('displays access details correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Response')).toBeInTheDocument();
      expect(screen.getByText('Safety Check')).toBeInTheDocument();
      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    });
  });

  it('shows approved and denied access with different styling', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      // Check for approved badges
      const approvedBadges = screen.getAllByText('Approved');
      expect(approvedBadges).toHaveLength(2);
      
      // Check for denied badge
      expect(screen.getByText('Denied')).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      // Should show relative time format
      expect(screen.getAllByText(/Jan 15/)).toHaveLength(1);
      expect(screen.getAllByText(/Jan 14/)).toHaveLength(2);
    });
  });

  it('handles empty access history', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      expect(screen.getByText('No location access history found')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<AccessHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load access history/)).toBeInTheDocument();
    });
  });

  it('shows location coordinates for approved access', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      expect(screen.getByText(/40\.7128, -74\.0060/)).toBeInTheDocument();
      expect(screen.getByText(/40\.7589, -73\.9851/)).toBeInTheDocument();
    });
  });

  it('does not show location for denied access', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    render(<AccessHistory />);

    await waitFor(() => {
      // Should not show location for denied access
      const deniedEntry = screen.getByText('Unknown Service').closest('[data-testid="access-entry"]');
      expect(deniedEntry).not.toHaveTextContent('40.');
    });
  });

  it('refreshes history when refresh prop changes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAccessHistory }),
    } as Response);

    const { rerender } = render(<AccessHistory refresh={false} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    rerender(<AccessHistory refresh={true} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
