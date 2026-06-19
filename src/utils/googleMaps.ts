/* Minimal Google Maps loader for the receive delivery flow. */

export interface GoogleLatLng {
  lat: number;
  lng: number;
}

interface GoogleMapClickEvent {
  latLng: { lat: () => number; lng: () => number } | null;
}

interface GoogleMapsMarker {
  setPosition: (pos: GoogleLatLng) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (event: string, handler: (e: { latLng: { lat: () => number; lng: () => number } }) => void) => void;
}

interface GoogleMapInstance {
  setCenter: (pos: GoogleLatLng) => void;
  panTo: (pos: GoogleLatLng) => void;
  addListener: (event: string, handler: (e: GoogleMapClickEvent) => void) => void;
}

interface GooglePlaceGeometry {
  location?: { lat: () => number; lng: () => number };
}

interface GooglePlaceResult {
  geometry?: GooglePlaceGeometry;
  formatted_address?: string;
  name?: string;
}

interface GooglePlacesAutocomplete {
  getPlace: () => GooglePlaceResult;
  addListener: (event: string, handler: () => void) => { remove: () => void };
}

interface GoogleMapsApi {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMapInstance;
    Marker: new (opts: Record<string, unknown>) => GoogleMapsMarker;
    event: {
      addListener: (
        instance: GoogleMapInstance,
        event: string,
        handler: (e: GoogleMapClickEvent) => void,
      ) => void;
    };
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: Record<string, unknown>,
      ) => GooglePlacesAutocomplete;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let loadPromise: Promise<void> | null = null;

export function getGoogleMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
}

export function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const ACCRA_CENTER: GoogleLatLng = { lat: 5.6037, lng: -0.187 };

export function createDeliveryMap(
  container: HTMLElement,
  initial: GoogleLatLng,
  onPick: (lat: number, lng: number) => void,
): { map: GoogleMapInstance; marker: GoogleMapsMarker; setPosition: (lat: number, lng: number) => void } {
  const googleMaps = window.google!;
  const map = new googleMaps.maps.Map(container, {
    center: initial,
    zoom: 16,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  const marker = new googleMaps.maps.Marker({
    position: initial,
    map,
    draggable: true,
    title: "Drag to set delivery location",
  });

  const applyPosition = (lat: number, lng: number) => {
    const pos = { lat, lng };
    marker.setPosition(pos);
    map.panTo(pos);
    onPick(lat, lng);
  };

  map.addListener("click", e => {
    if (!e.latLng) return;
    applyPosition(e.latLng.lat(), e.latLng.lng());
  });

  marker.addListener("dragend", e => {
    applyPosition(e.latLng.lat(), e.latLng.lng());
  });

  return {
    map,
    marker,
    setPosition: applyPosition,
  };
}

export function attachPlacesAutocomplete(
  input: HTMLInputElement,
  onSelect: (lat: number, lng: number, label?: string) => void,
): () => void {
  const googleMaps = window.google!;
  const autocomplete = new googleMaps.maps.places.Autocomplete(input, {
    componentRestrictions: { country: "gh" },
    fields: ["geometry", "formatted_address", "name"],
  });

  const listener = autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    const location = place.geometry?.location;
    if (!location) return;

    const label = place.formatted_address || place.name;
    onSelect(location.lat(), location.lng(), label);
  });

  return () => {
    listener.remove();
  };
}
