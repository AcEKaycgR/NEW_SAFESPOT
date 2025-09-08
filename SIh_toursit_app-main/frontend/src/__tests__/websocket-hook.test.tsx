import { renderHook } from '@testing-library/react';
import { useLocationWebSocket } from '../hooks/use-location-websocket';

describe('useLocationWebSocket', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLocationWebSocket());

    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toBeNull();
    expect(result.current.notifications).toEqual([]);
  });
});
