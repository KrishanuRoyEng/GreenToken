import { useState, useEffect } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

interface LocationSelectorProps {
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
}

export function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string>("");
  const [manualAddress, setManualAddress] = useState("");

  const detectLocation = () => {
    setIsDetecting(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Mock reverse geocoding (in real app, use proper geocoding service)
        const mockAddress = `Coastal Area, ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        const newLocation = {
          lat: latitude,
          lng: longitude,
          address: mockAddress
        };
        
        setLocation(newLocation);
        onLocationChange(newLocation);
        setIsDetecting(false);
      },
      (error) => {
        setError("Unable to detect location. Please enter manually.");
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleManualLocation = () => {
    if (manualAddress.trim()) {
      // Mock geocoding for manual address
      const newLocation = {
        lat: 12.9716 + (Math.random() - 0.5) * 0.1,
        lng: 77.5946 + (Math.random() - 0.5) * 0.1,
        address: manualAddress
      };
      setLocation(newLocation);
      onLocationChange(newLocation);
    }
  };

  return (
    <Card className="p-4 bg-teal-50 border-teal-200">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-teal-600" />
        <h3 className="text-teal-800">Location</h3>
      </div>

      {location ? (
        <div className="bg-white rounded-lg p-3 border border-teal-200">
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-teal-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-800">{location.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={detectLocation}
            disabled={isDetecting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            variant="default"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {isDetecting ? "Detecting..." : "Auto-detect GPS Location"}
          </Button>

          <div className="flex gap-2">
            <Input
              placeholder="Enter location manually"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleManualLocation}
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              Set
            </Button>
          </div>

          {error && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
}