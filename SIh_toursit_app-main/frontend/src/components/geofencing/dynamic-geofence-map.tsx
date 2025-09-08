"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import GeofenceMap with no SSR
const GeofenceMap = dynamic(
  () => import('./geofence-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: '500px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default GeofenceMap;
