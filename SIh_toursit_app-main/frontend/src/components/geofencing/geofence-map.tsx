// Additional context for the end of the file
"use client";

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for client-side only components
let L: any = null;
let leafletDraw: any = null;

interface GeofenceMapProps {
  className?: string;
  height?: string;
  center?: [number, number];
  zoom?: number;
  onGeofenceCreated?: (geofence: any) => void;
  onGeofenceSelected?: (geofence: any) => void;
  geofences?: any[];
  userLocation?: [number, number];
  showDrawControls?: boolean;
  mode?: 'admin' | 'tourist' | 'view';
}

const GeofenceMap: React.FC<GeofenceMapProps> = ({
  className = '',
  height = '500px',
  center = [40.7128, -74.0060], // NYC default
  zoom = 13,
  onGeofenceCreated,
  onGeofenceSelected,
  geofences = [],
  userLocation,
  showDrawControls = false,
  mode = 'view'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const geofenceLayersRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<any>(null); // Store the drawn polygon data
  const [initialLocation, setInitialLocation] = useState<[number, number]>(center);

  // Initialize refs once and get user's location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!drawnItemsRef.current) {
        drawnItemsRef.current = null;
      }
      if (!geofenceLayersRef.current) {
        geofenceLayersRef.current = null;
      }
      // Only run once on mount
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
            setInitialLocation(userLocation);
            console.log('Initial location set to:', userLocation);
            // Always zoom in to 16 and show marker on load
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView(userLocation, 16, {
                animate: true,
                duration: 1.5
              });
              // Remove existing user marker if any
              if (userMarkerRef.current) {
                mapInstanceRef.current.removeLayer(userMarkerRef.current);
              }
              // Add new user marker
              const userMarker = L.marker(userLocation, {
                icon: createUserIcon(),
                zIndexOffset: 1000
              });
              userMarker.bindPopup(`
                <div class="p-2">
                  <h4 class="font-bold">Your Location</h4>
                  <p class="text-sm text-gray-600">Lat: ${userLocation[0].toFixed(6)}</p>
                  <p class="text-sm text-gray-600">Lng: ${userLocation[1].toFixed(6)}</p>
                </div>
              `);
              userMarker.addTo(mapInstanceRef.current);
              userMarkerRef.current = userMarker;
            }
          },
          (error) => {
            console.log('Could not get initial location, using default:', error.message);
            // Do not update initialLocation, keep default center
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
          }
        );
      }
    }
  }, []);

  // Load Leaflet dynamically on client side
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Suppress analytics errors (like Mixpanel being blocked)
        const originalError = console.error;
        console.error = (...args) => {
          const message = args[0]?.toString() || '';
          if (message.includes('mixpanel') || message.includes('ERR_BLOCKED_BY_CLIENT')) {
            return; // Ignore these errors
          }
          originalError.apply(console, args);
        };

        // Dynamic imports
        const leafletModule = await import('leaflet');
        L = leafletModule.default;
        
        // Load leaflet-draw
        await import('leaflet-draw');

        // Load CSS dynamically
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          document.head.appendChild(leafletCSS);
        }

        if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
          const drawCSS = document.createElement('link');
          drawCSS.rel = 'stylesheet';
          drawCSS.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
          document.head.appendChild(drawCSS);
        }

        // Fix for default markers in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setIsLeafletLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  // Professional dark theme style
  const getDarkStyle = () => {
    return {
      filter: 'hue-rotate(180deg) invert(90%) brightness(110%) contrast(90%)',
      transition: 'filter 0.3s ease'
    };
  };

  // Risk level colors with transparency
  // Get color based on zone type
  // Zone type color and shade mapping
  const zoneTypeColorMap: Record<string, { base: string; shade: string }> = {
    // Green group
    'SAFE_ZONE': { base: '#4CAF50', shade: '#81C784' },
    'TOURIST_HUB': { base: '#4CAF50', shade: '#388E3C' },
    'GREEN_CORRIDOR': { base: '#4CAF50', shade: '#A5D6A7' },
    // Yellow group
    'CAUTION_ZONE': { base: '#FFC107', shade: '#FFD54F' },
    'BUSY_MARKET_ZONE': { base: '#FFC107', shade: '#FFA000' },
    'FESTIVAL_ZONE': { base: '#FFC107', shade: '#FFF8E1' },
    // Orange group
    'SENSITIVE_ZONE': { base: '#FF9800', shade: '#FFB74D' },
    'WILDLIFE_AREA': { base: '#FF9800', shade: '#F57C00' },
    'ECO_ZONE': { base: '#FF9800', shade: '#FFE0B2' },
    // Red group
    'ALERT_ZONE_HIGH': { base: '#F44336', shade: '#E57373' },
    'ALERT_ZONE_MEDIUM': { base: '#F44336', shade: '#FFCDD2' },
    'ALERT_ZONE_LOW': { base: '#F44336', shade: '#B71C1C' },
    'RED_ZONE': { base: '#F44336', shade: '#FF5252' },
    // Blue group
    'INFO_ZONE': { base: '#2196F3', shade: '#64B5F6' },
    'TRANSIT_HUB': { base: '#2196F3', shade: '#1976D2' },
    'HELP_ZONE': { base: '#2196F3', shade: '#BBDEFB' },
    // Purple group
    'SACRED_ZONE': { base: '#9C27B0', shade: '#CE93D8' },
    'CULTURAL_ZONE': { base: '#9C27B0', shade: '#6A1B9A' },
    'RESPECT_ZONE': { base: '#9C27B0', shade: '#F3E5F5' },
  };

  const getZoneBaseColor = (type: string) => zoneTypeColorMap[type]?.base || '#6b7280';
  const getZoneShadeColor = (type: string) => zoneTypeColorMap[type]?.shade || '#bdbdbd';

  // Get shade based on risk level
  const getRiskShade = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 0.9;
      case 'MEDIUM': return 0.7;
      case 'LOW': return 0.5;
      default: return 0.3;
    }
  };

  // Zone type styles
  const getZoneStyle = (riskLevel: string, type: string) => {
    const baseColor = getZoneBaseColor(type);
    const shadeColor = getZoneShadeColor(type);
    return {
      color: shadeColor, // border uses shade
      weight: 3,
      opacity: 0.8,
      fillColor: baseColor, // fill uses base
      fillOpacity: 0.25,
      className: 'geofence-zone animated-border'
    };
  };

  // Custom user location icon
  const createUserIcon = () => {
    if (!L) return null;
    return L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="relative">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div class="absolute top-0 left-0 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // Initialize map (only run once when Leaflet is loaded)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !isLeafletLoaded || !L || !initialLocation) return;

    console.log('Initializing map at', initialLocation);

    // Initialize drawnItems
    drawnItemsRef.current = new L.FeatureGroup();

    // Create map instance at correct location and zoom
    const map = L.map(mapRef.current, {
      center: initialLocation,
      zoom: 16,
      zoomControl: true,
      attributionControl: true
    });
    // Add current location marker immediately
    if (initialLocation && L) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }
      const userMarker = L.marker(initialLocation, {
        icon: createUserIcon(),
        zIndexOffset: 1000
      });
      userMarker.bindPopup(`
        <div class="p-2">
          <h4 class="font-bold">Your Location</h4>
          <p class="text-sm text-gray-600">Lat: ${initialLocation[0].toFixed(6)}</p>
          <p class="text-sm text-gray-600">Lng: ${initialLocation[1].toFixed(6)}</p>
        </div>
      `);
      userMarker.addTo(map);
      userMarkerRef.current = userMarker;
    }

    // Add tile layer with professional styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      className: mode === 'admin' ? 'dark-tiles' : ''
    }).addTo(map);

    // Initialize layer groups only once
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
    }
    if (!geofenceLayersRef.current) {
      geofenceLayersRef.current = new L.FeatureGroup();
    }

    // Add layer groups to map
    map.addLayer(drawnItemsRef.current);
    map.addLayer(geofenceLayersRef.current);

    // Add draw controls if enabled
    if (showDrawControls) {
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true
        },
        draw: {
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: '#e74c3c',
              timeout: 1000
            },
            shapeOptions: {
              color: '#3498db',
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.2
            }
          }
        }
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Handle polygon creation
      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        const coordinates = layer.getLatLngs()[0].map((latlng: L.LatLng) => ({
          lat: latlng.lat,
          lng: latlng.lng
        }));

        console.log('Polygon created with coordinates:', coordinates);
        console.log('Layer created:', layer);
        console.log('DrawnItems ref:', drawnItemsRef.current);
        
        // Store the polygon data for persistence
        const polygonData = {
          coordinates,
          style: {
            color: '#3B82F6',
            weight: 3,
            opacity: 0.8,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            dashArray: '5, 5'
          }
        };
        setDrawnPolygon(polygonData);
        
        // Clear any existing drawn polygons first (only keep one preview)
        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
        }
        
        // Style the drawn polygon as a preview
        layer.setStyle(polygonData.style);

        // Add a popup to indicate it's a preview
        layer.bindPopup(`
          <div class="p-2 text-center">
            <h4 class="font-bold text-blue-600">Preview Polygon</h4>
            <p class="text-sm text-gray-600">Fill in the form and click "Create Geofence" to save</p>
          </div>
        `);

        // Add to drawn items layer
        if (drawnItemsRef.current) {
          drawnItemsRef.current.addLayer(layer);
          console.log('Layer added to drawnItems, total layers:', drawnItemsRef.current.getLayers().length);
          
          // Force a refresh of the map
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);
        } else {
          console.error('drawnItemsRef.current is null');
        }

        if (onGeofenceCreated) {
          const geofenceData = {
            polygon_coords: coordinates,
            layer: layer
          };
          console.log('Calling onGeofenceCreated with:', geofenceData);
          onGeofenceCreated(geofenceData);
        }
      });

      // Handle polygon editing
      map.on(L.Draw.Event.EDITED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          // Handle edited polygons
          console.log('Polygon edited:', layer);
        });
      });

      // Handle polygon deletion
      map.on(L.Draw.Event.DELETED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          // Handle deleted polygons
          console.log('Polygon deleted:', layer);
        });
      });
    }

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Expose clear function globally for dashboard to use
    if (typeof window !== 'undefined') {
      (window as any).clearDrawnPolygon = () => {
        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
        }
        setDrawnPolygon(null); // Clear stored polygon data
      };
    }

    return () => {
      // Clear global function
      if (typeof window !== 'undefined') {
        delete (window as any).clearDrawnPolygon;
      }
      
      // Remove map if it exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isLeafletLoaded]); // Only depend on Leaflet being loaded

  // Update geofences on map
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !geofenceLayersRef.current) return;

    // Clear existing geofence layers only
    geofenceLayersRef.current.clearLayers();

    // Add geofences to map
    geofences.forEach((geofence) => {
      if (!geofence.polygon_coords) return;

      const coordinates = geofence.polygon_coords.map((coord: any) => [coord.lat, coord.lng]);
      const style = getZoneStyle(geofence.risk_level, geofence.type);

      const polygon = L.polygon(coordinates, style);

      // Add hover effects
      polygon.on('mouseover', function(this: L.Polygon) {
        this.setStyle({
          weight: 5,
          opacity: 1.0,
          fillOpacity: style.fillOpacity + 0.2
        });
      });

      polygon.on('mouseout', function(this: L.Polygon) {
        this.setStyle(style);
      });

      // Add click handler
      polygon.on('click', () => {
        if (onGeofenceSelected) {
          onGeofenceSelected(geofence);
        }
      });

      // Create info popup
      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-lg mb-2">${geofence.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${geofence.description || 'No description'}</p>
          <div class="flex flex-col space-y-1">
            <div class="flex justify-between">
              <span class="text-sm font-medium">Risk Level:</span>
              <span class="text-sm px-2 py-1 rounded text-white" style="background-color: ${getRiskShade(geofence.risk_level)}">${geofence.risk_level}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm font-medium">Type:</span>
              <span class="text-sm">${geofence.type.replace('_', ' ')}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm font-medium">Status:</span>
              <span class="text-sm ${geofence.is_active ? 'text-green-600' : 'text-red-600'}">${geofence.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      `;

      polygon.bindPopup(popupContent);
      geofenceLayersRef.current.addLayer(polygon);
    });
  }, [geofences, isMapReady]);

  // Restore drawn polygon if map reinitializes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !drawnPolygon || !drawnItemsRef.current) return;

    console.log('Restoring drawn polygon:', drawnPolygon);
    
    // Clear existing layers first
    drawnItemsRef.current.clearLayers();
    
    // Recreate the polygon
    const coordinates = drawnPolygon.coordinates.map((coord: any) => [coord.lat, coord.lng]);
    const polygon = L.polygon(coordinates, drawnPolygon.style);
    
    polygon.bindPopup(`
      <div class="p-2 text-center">
        <h4 class="font-bold text-blue-600">Preview Polygon</h4>
        <p class="text-sm text-gray-600">Fill in the form and click "Create Geofence" to save</p>
      </div>
    `);
    
    drawnItemsRef.current.addLayer(polygon);
    console.log('Polygon restored successfully');
  }, [drawnPolygon, isMapReady]);

  // Update user location
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    // Add new user marker
    const userMarker = L.marker(userLocation, {
      icon: createUserIcon(),
      zIndexOffset: 1000
    });

    userMarker.bindPopup(`
      <div class="p-2">
        <h4 class="font-bold">Your Location</h4>
        <p class="text-sm text-gray-600">Lat: ${userLocation[0].toFixed(6)}</p>
        <p class="text-sm text-gray-600">Lng: ${userLocation[1].toFixed(6)}</p>
      </div>
    `);

    userMarker.addTo(mapInstanceRef.current);
    userMarkerRef.current = userMarker;
  }, [userLocation, isMapReady]);

  // Function to go to current location
  const goToCurrentLocation = () => {
    console.log('Current location button clicked');
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    if (!mapInstanceRef.current) {
      console.error('Map not initialized');
      alert('Map not ready. Please try again.');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Got current location:', latitude, longitude);
        
        if (mapInstanceRef.current) {
          // Center map on current location with a smooth animation
          mapInstanceRef.current.setView([latitude, longitude], 16, {
            animate: true,
            duration: 1.5
          });
          
          // Remove existing current location markers
          const existingMarkers: any[] = [];
          mapInstanceRef.current.eachLayer((layer: any) => {
            if (layer.options && layer.options.isCurrentLocationMarker) {
              existingMarkers.push(layer);
            }
          });
          existingMarkers.forEach((marker: any) => mapInstanceRef.current.removeLayer(marker));
          
          // Add/update current location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker-current',
            html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          const marker = L.marker([latitude, longitude], { 
            icon: userIcon,
            isCurrentLocationMarker: true 
          } as any);
          marker.bindPopup(`
            <div class="p-2">
              <h4 class="font-bold text-blue-600">Your Current Location</h4>
              <p class="text-sm text-gray-600">Lat: ${latitude.toFixed(6)}</p>
              <p class="text-sm text-gray-600">Lng: ${longitude.toFixed(6)}</p>
              <p class="text-xs text-gray-500 mt-1">Accuracy: ${position.coords.accuracy?.toFixed(0)}m</p>
            </div>
          `);
          
          marker.addTo(mapInstanceRef.current);
          console.log('Current location marker added');
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        let errorMessage = 'Unable to get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        alert(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Show loading state while Leaflet is loading
  if (!isLeafletLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full rounded-lg overflow-hidden shadow-lg border border-gray-200"
        style={{ 
          height,
          ...(mode === 'admin' ? getDarkStyle() : {})
        }}
      />
      
      {/* Current location marker always shown if userLocation is set */}
      {userLocation && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="flex items-center justify-center h-full">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
      )}
      
      {/* Go to Current Location Button (Google Maps-style icon) */}
      {(mode === 'admin' || mode === 'tourist') && (
        <button
          onClick={goToCurrentLocation}
          disabled={isLocating}
          className={`absolute top-3 right-3 z-[1000] bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-2 shadow-md transition-all duration-200 ${
            isLocating ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-xl'
          }`}
          title="Go to current location"
        >
          {/* Google Maps-style locate icon */}
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="#fff" />
            <circle cx="12" cy="12" r="3" fill="#3b82f6" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        .animated-border {
          animation: borderPulse 2s infinite;
        }
        
        @keyframes borderPulse {
          0% { stroke-width: 3; }
          50% { stroke-width: 4; }
          100% { stroke-width: 3; }
        }
        
        .user-location-marker {
          background: none;
          border: none;
        }
        
        .user-location-marker-current {
          background: none;
          border: none;
        }
        
        .dark-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
};
export default GeofenceMap;
