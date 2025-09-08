import { useState, useEffect } from 'react';

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface GeolocationState {
  location: GeolocationCoordinates | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  onLocationUpdate?: (location: GeolocationCoordinates) => void;
}

export const useGeolocation = (options: UseGeolocationOptions = {}): GeolocationState => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000, // 1 minute
    watch = true,
    onLocationUpdate
  } = options;

  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        loading: false,
        error: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    const geolocationOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const location: GeolocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      setState({
        location,
        loading: false,
        error: null
      });

      // Call the callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'An unknown error occurred.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setState({
        location: null,
        loading: false,
        error: errorMessage
      });
    };

    let watchId: number | null = null;

    if (watch) {
      // Use watchPosition for continuous location updates
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    } else {
      // Use getCurrentPosition for a single location request
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    }

    // Cleanup function
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watch, onLocationUpdate]);

  return state;
};

// Helper function to get current location once
export const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};
