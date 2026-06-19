import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { GpsCoordinates } from "../trackParcelUtils";
import { ACCRA_CENTER, attachPlacesAutocomplete, createDeliveryMap, loadGoogleMaps } from "../../../utils/googleMaps";

interface Props {
  coords: GpsCoordinates | null;
  onChange: (coords: GpsCoordinates) => void;
}

export const GoogleMapPicker = ({ coords, onChange }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const setPositionRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let detachAutocomplete: (() => void) | undefined;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;

        const initial = coords
          ? { lat: coords.latitude, lng: coords.longitude }
          : ACCRA_CENTER;

        const { setPosition } = createDeliveryMap(
          mapContainerRef.current,
          initial,
          (lat, lng) => onChangeRef.current({ latitude: lat, longitude: lng }),
        );

        setPositionRef.current = setPosition;

        if (!coords) {
          onChangeRef.current({ latitude: initial.lat, longitude: initial.lng });
        }

        if (searchInputRef.current) {
          detachAutocomplete = attachPlacesAutocomplete(searchInputRef.current, (lat, lng, label) => {
            setPosition(lat, lng);
            onChangeRef.current({ latitude: lat, longitude: lng, address: label });
          });
        }

        setLoading(false);
      })
      .catch(err => {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : "Could not load Google Maps.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      detachAutocomplete?.();
    };
  }, []);

  useEffect(() => {
    if (!coords || !setPositionRef.current) return;
    setPositionRef.current(coords.latitude, coords.longitude);
  }, [coords?.latitude, coords?.longitude]);

  const captureLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported. Search or tap the map to set your location.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        onChangeRef.current({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        if (searchInputRef.current) searchInputRef.current.value = "";
        setLocating(false);
      },
      () => {
        setLocationError("Could not get your location. Search or drag the pin on the map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const hasCoords = coords != null && !(coords.latitude === 0 && coords.longitude === 0);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a place or address..."
          disabled={loading || !!mapError}
          className="pl-9 rounded-xl border-slate-200 bg-white"
          autoComplete="off"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={captureLocation}
        disabled={locating || loading || !!mapError}
        className="w-full h-10 rounded-xl border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
      >
        {locating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Getting location...
          </>
        ) : (
          <>
            <Crosshair className="w-4 h-4 mr-2" />
            Use my current location
          </>
        )}
      </Button>

      {locationError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {locationError}
        </p>
      )}

      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
            <Loader2 className="w-6 h-6 animate-spin text-[#ea690c]" />
          </div>
        )}
        {mapError ? (
          <div className="h-56 flex items-center justify-center px-4 text-center text-sm text-red-600">
            {mapError}
          </div>
        ) : (
          <div ref={mapContainerRef} className="h-56 w-full" />
        )}
      </div>

      <p className="text-xs text-slate-500 flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Search for a place, tap the map, or drag the pin to set your delivery point.
      </p>

      {hasCoords && coords && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {coords.address ? (
            <>
              <span className="font-medium">{coords.address}</span>
              <br />
              <span className="text-emerald-600/80">
                {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              </span>
            </>
          ) : (
            <>Selected: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</>
          )}
        </p>
      )}
    </div>
  );
};
