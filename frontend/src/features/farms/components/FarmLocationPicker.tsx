import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

type FarmLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  location: string;
  onChange: (location: {
    latitude: number;
    longitude: number;
    location?: string;
  }) => void;
};

type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

const farmMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapFlyTo({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), {
        duration: 0.7,
      });
    }
  }, [latitude, longitude, map]);

  return null;
}

const formatCoordinate = (value: number | null) =>
  value === null ? "Not set" : value.toFixed(6);

// Purpose: map-based farm coordinate picker used before weather sync.
export default function FarmLocationPicker({
  latitude,
  longitude,
  location,
  onChange,
}: FarmLocationPickerProps) {
  const [query, setQuery] = useState(location);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");

  const hasCoordinates = latitude !== null && longitude !== null;
  const center: [number, number] = hasCoordinates
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  const pickLocation = (nextLatitude: number, nextLongitude: number, nextLocation?: string) => {
    onChange({
      latitude: Number(nextLatitude.toFixed(7)),
      longitude: Number(nextLongitude.toFixed(7)),
      location: nextLocation,
    });
    setMessage("");
  };

  const searchLocation = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setMessage("");

      const params = new URLSearchParams({
        name: query.trim(),
        count: "5",
        language: "en",
        format: "json",
      });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      const payload = (await response.json()) as { results?: GeocodingResult[] };
      setResults(payload.results ?? []);

      if (!payload.results?.length) {
        setMessage("No matching locations found.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Could not search locations right now.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Browser location is not available.");
      return;
    }

    setLocating(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        pickLocation(position.coords.latitude, position.coords.longitude, location || "Pinned farm location");
        setLocating(false);
      },
      () => {
        setMessage("Could not access your current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <section className="field-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="row flex-1">
          <label htmlFor="farm-location-search">Search Map</label>
          <input
            id="farm-location-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city, town, or farm area"
          />
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2"
          onClick={searchLocation}
          disabled={searching}
        >
          <Search size={16} strokeWidth={2.2} />
          {searching ? "Searching..." : "Search"}
        </button>

        <button
          type="button"
          className="secondary-button inline-flex items-center justify-center gap-2"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          <LocateFixed size={16} strokeWidth={2.2} />
          {locating ? "Locating..." : "Use Current"}
        </button>
      </div>

      {results.length > 0 ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {results.map((result) => {
            const label = [result.name, result.admin1, result.country].filter(Boolean).join(", ");

            return (
              <button
                key={result.id}
                type="button"
                className="secondary-button inline-flex items-center justify-start gap-2 rounded-2xl px-4 py-3 text-left"
                onClick={() => {
                  setQuery(label);
                  setResults([]);
                  pickLocation(result.latitude, result.longitude, label);
                }}
              >
                <MapPin size={16} strokeWidth={2.2} />
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="farm-map-shell">
        <MapContainer
          center={center}
          zoom={hasCoordinates ? 14 : DEFAULT_ZOOM}
          scrollWheelZoom
          className="farm-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={(lat, lng) => pickLocation(lat, lng)} />
          <MapFlyTo latitude={latitude} longitude={longitude} />
          {hasCoordinates ? (
            <Marker
              icon={farmMarkerIcon}
              position={[latitude, longitude]}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target as L.Marker;
                  const nextPosition = marker.getLatLng();
                  pickLocation(nextPosition.lat, nextPosition.lng);
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
          <strong className="text-sm font-semibold text-ink">Latitude</strong>
          <p className="mt-1 text-sm text-ink-muted">{formatCoordinate(latitude)}</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
          <strong className="text-sm font-semibold text-ink">Longitude</strong>
          <p className="mt-1 text-sm text-ink-muted">{formatCoordinate(longitude)}</p>
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
    </section>
  );
}
