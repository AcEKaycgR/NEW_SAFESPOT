'use server';

import { baseUrl } from '@/lib/config';
console.log('🚀 Actions using base URL:', baseUrl);

// Define types that match the backend flow inputs/outputs
export type SafetyScoreInput = {
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  itinerary?: string;
  time: string;
  region: string;
};

export type SafetyScoreOutput = {
  safetyScore: number;
  explanation: string;
};

export type DetectAnomaliesInIncidentsInput = {
  incidentReport: string;
  location: {
    latitude: number;
    longitude: number;
  };
  time: string;
};

export type DetectAnomaliesInIncidentsOutput = {
  isAnomalous: boolean;
  anomalyExplanation: string;
  confidenceScore: number;
};

export type TouristAssistantInput = {
  message: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
};

export type TouristAssistantOutput = {
  intent: 'itinerary' | 'safety' | 'emergency' | 'general';
  responseText: string;
  itineraryItems?: Array<{
    title: string;
    date: string;
    details?: string;
    type: 'flight' | 'hotel' | 'activity' | 'other';
  }>;
  isEmergency: boolean;
};

// Helper function to make API requests to the backend
async function callBackendApi(endpoint: string, data: any) {
  // Use baseUrl for client-side requests
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling backend API ${endpoint}:`, error);
    throw error;
  }
}

export async function generateSafetyScore(input: SafetyScoreInput): Promise<SafetyScoreOutput> {
  try {
    return await callBackendApi('/generateSafetyScoreFlow', input);
  } catch (error) {
    console.error("Error generating safety score:", error);
    // Return a default/error state
    return { safetyScore: -1, explanation: 'Could not calculate safety score at this time.' };
  }
}

export async function detectAnomaliesInIncidents(input: DetectAnomaliesInIncidentsInput): Promise<DetectAnomaliesInIncidentsOutput> {
  try {
    return await callBackendApi('/detectAnomaliesInIncidentsFlow', input);
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return { 
      isAnomalous: false, 
      anomalyExplanation: 'Could not analyze incident report at this time.', 
      confidenceScore: 0 
    };
  }
}

export async function touristAssistant(input: TouristAssistantInput): Promise<TouristAssistantOutput> {
  try {
    return await callBackendApi('/touristAssistantFlow', input);
  } catch (error) {
    console.error("Error with tourist assistant:", error);
    return {
      intent: 'general',
      responseText: 'Sorry, I am having trouble connecting. Please try again later.',
      isEmergency: false,
    };
  }
}