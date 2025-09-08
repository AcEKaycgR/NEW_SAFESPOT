"use client";

import { useState, useEffect } from "react";
import { generateSafetyScore, type SafetyScoreOutput } from "@/app/actions";
import { SafetyGauge } from "@/components/ui/safety-gauge";
import { useToast } from "@/hooks/use-toast";

export default function SafetyScoreWrapper({ onExplanationChange }: { onExplanationChange?: (explanation: string) => void }) {
  const [scoreData, setScoreData] = useState<SafetyScoreOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number, timestamp: string} | null>(null);
  const { toast } = useToast();

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString(),
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsLoading(false);
            const errorMsg = "Location access required for safety analysis. Please enable location permissions.";
            setScoreData({
              safetyScore: -1,
              explanation: errorMsg
            });
            if (onExplanationChange) {
              onExplanationChange(errorMsg);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      } else {
        setIsLoading(false);
        const errorMsg = "Geolocation is not supported by this browser.";
        setScoreData({
          safetyScore: -1,
          explanation: errorMsg
        });
        if (onExplanationChange) {
          onExplanationChange(errorMsg);
        }
      }
    };

    getCurrentLocation();
  }, [onExplanationChange]);

  // Fetch safety score when location is available
  useEffect(() => {
    const fetchScore = async () => {
      if (!currentLocation) return;

      try {
        setIsLoading(true);
        
        // Simple region detection (you can enhance this with reverse geocoding)
        let region = "Unknown Location";
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentLocation.latitude},${currentLocation.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              region = data.results[0].formatted_address;
            }
          }
        } catch (geocodeError) {
          console.warn("Geocoding failed, using coordinates:", geocodeError);
          region = `${currentLocation.latitude.toFixed(3)}, ${currentLocation.longitude.toFixed(3)}`;
        }

        // Create basic location history (current and 5 minutes ago)
        const locationHistory = [
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          },
          currentLocation
        ];

        // Use current time for the safety score calculation
        const currentTime = new Date().toISOString();

        const input = {
          currentLocation,
          locationHistory,
          itinerary: "Tourist exploration",
          time: currentTime, // Using current time instead of hardcoded value
          region,
        };

        console.log('Fetching safety score with location:', input);
        const result = await generateSafetyScore(input);
        setScoreData(result);
        
        // Pass explanation to parent component if callback is provided
        if (onExplanationChange) {
          onExplanationChange(result.explanation);
        }
      } catch (error) {
        console.error("Failed to fetch safety score:", error);
        const errorMsg = "Could not calculate safety score. Please try again later.";
        setScoreData({
          safetyScore: -1,
          explanation: errorMsg
        });
        if (onExplanationChange) {
          onExplanationChange(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentLocation) {
      fetchScore();
      
      // Refresh every 5 minutes
      const intervalId = setInterval(fetchScore, 300000);
      return () => clearInterval(intervalId);
    }
  }, [currentLocation, onExplanationChange]);

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scoreData || scoreData.safetyScore === -1) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">{scoreData?.explanation || "Could not retrieve safety score."}</p>
      </div>
    );
  }

  return (
    <SafetyGauge 
      score={scoreData.safetyScore} 
      size="lg" 
      showTrend 
      trend="up" 
    />
  );
}