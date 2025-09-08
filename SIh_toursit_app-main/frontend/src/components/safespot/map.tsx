"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon } from "@react-google-maps/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useGeolocation } from "@/hooks/use-geolocation";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const mapStyles = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const getGeofenceOptions = (risk: string) => {
    // Handle undefined or null risk
    if (!risk) {
        return { fillColor: '#10B981', strokeColor: '#047857' }; // Default to Green
    }
    
    switch(risk) {
        case 'High':
            return { fillColor: '#EF4444', strokeColor: '#B91C1C' }; // Red
        case 'Medium':
            return { fillColor: '#F59E0B', strokeColor: '#D97706' }; // Amber
        default:
            return { fillColor: '#10B981', strokeColor: '#047857' }; // Green
    }
}


type MapProps = {
  className?: string;
  showControls?: boolean;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  showCurrentLocation?: boolean;
  showGeofences?: boolean;
  geofences?: any[];
  onLoad?: (map: any) => void;
};

export default function Map({
  className,
  showControls = false,
  initialCenter = { lat: 19.076, lng: 72.8777 }, // Default to Mumbai
  initialZoom = 12,
  showCurrentLocation = false,
  showGeofences = false,
  geofences = [],
  onLoad,
}: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "placeholder-key-for-build",
  });

  // Use the geolocation hook for improved accuracy
  const { location: currentLocation, loading: locationLoading, error: locationError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000, // 30 seconds
    watch: showCurrentLocation, // Only watch when we need current location
  });

  // Convert to Map format
  const currentPosition = currentLocation ? {
    lat: currentLocation.latitude,
    lng: currentLocation.longitude
  } : null;


  const mapRef = React.useRef<any>(null);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "placeholder-key-for-build") {
    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-lg border bg-card shadow-sm flex items-center justify-center",
          className
        )}
      >
        <div className="text-center p-4">
          <p className="font-semibold text-destructive">Map Not Configured</p>
          <p className="text-xs text-muted-foreground">
            Please provide a Google Maps API key in your environment variables.
          </p>
        </div>
      </div>
    );
  }
  
  if (!isLoaded) {
    return <Skeleton className={cn("h-full w-full rounded-lg", className)} />;
  }

  // Handler for pan-to-current-location button
  const panToCurrentLocation = () => {
    if (mapRef.current && currentPosition) {
      mapRef.current.panTo(currentPosition);
      mapRef.current.setZoom(16);
    }
  };

  // Pass map instance to parent on load
  const handleMapLoad = (map: any) => {
    mapRef.current = map;
    if (onLoad) onLoad(map);
  };

  return (
    <div className={cn("h-full w-full overflow-hidden rounded-lg", className)}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentPosition || initialCenter}
        zoom={initialZoom}
        options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: showControls,
            styles: mapStyles,
            mapTypeId: 'roadmap',
        }}
        onLoad={handleMapLoad}
      >
        {showCurrentLocation && currentPosition && (
            <Marker 
                position={currentPosition} 
                title="My Location"
                icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                }}
            />
        )}
        {showGeofences && Array.isArray(geofences) && geofences.map(fence => (
            <Polygon 
                key={fence?.id || Math.random()}
                paths={fence?.polygon_coords?.map((coord: any) => ({ lat: coord?.lat, lng: coord?.lng })) || []}
                options={{
                    ...getGeofenceOptions(fence?.risk_level || fence?.risk || 'Low'),
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillOpacity: 0.35,
                }}
            />
        ))}
      </GoogleMap>
    </div>
  );
}
