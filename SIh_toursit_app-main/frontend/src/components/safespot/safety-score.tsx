"use client";

import { useState, useEffect } from "react";
import { generateSafetyScore, type SafetyScoreOutput } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function getScoreColor(score: number) {
  if (score > 75) return "bg-green-500";
  if (score > 40) return "bg-yellow-500";
  return "bg-red-500";
}

export default function SafetyScore() {
  const [scoreData, setScoreData] = useState<SafetyScoreOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number, timestamp: string} | null>(null);

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
            setScoreData({
              safetyScore: -1,
              explanation: "Location access required for safety analysis. Please enable location permissions."
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      } else {
        setIsLoading(false);
        setScoreData({
          safetyScore: -1,
          explanation: "Geolocation is not supported by this browser."
        });
      }
    };

    getCurrentLocation();
  }, []);

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

        const input = {
          currentLocation,
          locationHistory,
          itinerary: "Tourist exploration",
          time: new Date().toISOString(),
          region,
        };

        console.log('Fetching safety score with location:', input);
        const result = await generateSafetyScore(input);
        setScoreData(result);
      } catch (error) {
        console.error("Failed to fetch safety score:", error);
        setScoreData({
          safetyScore: -1,
          explanation: "Could not calculate safety score. Please try again later."
        });
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
  }, [currentLocation]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!scoreData || scoreData.safetyScore === -1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Safety Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{scoreData?.explanation || "Could not retrieve safety score."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Safety Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold">{scoreData.safetyScore}</p>
          <p className="text-muted-foreground">/ 100</p>
        </div>
        <Progress 
          value={scoreData.safetyScore} 
          className="h-2" 
          indicatorClassName={getScoreColor(scoreData.safetyScore)} 
        />
        <p className="text-sm text-muted-foreground">
          {scoreData.explanation}
        </p>
      </CardContent>
    </Card>
  );
}
