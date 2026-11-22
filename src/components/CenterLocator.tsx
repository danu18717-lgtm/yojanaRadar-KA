import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { filterByPincodeOrDistrict, sortByDistance } from "../engine/geo";
import type { Center } from "../types";

type Located = Center & { distanceKm: number };

const panelStyle: CSSProperties = {
  flex: "1 1 240px",
  minWidth: 0,
  boxSizing: "border-box",
  margin: 0,
};

const centerCardStyle: CSSProperties = {
  listStyle: "none",
  marginBottom: "0.75rem",
};

const directionsLinkStyle: CSSProperties = {
  textDecoration: "none",
  textAlign: "center",
  boxSizing: "border-box",
};

interface CenterCardProps {
  center: Center;
  distanceKm?: number;
  onSelect: (center: Center, distanceKm?: number) => void;
}

function CenterCard({ center, distanceKm, onSelect }: CenterCardProps) {
  return (
    <li className="yr-card" style={centerCardStyle}>
      <span className="yr-badge-type">{center.type}</span>
      <p style={{ margin: "0.5rem 0 0.25rem", fontWeight: 700 }}>{center.name}</p>
      <p className="yr-hint" style={{ margin: "0.25rem 0" }}>
        {center.address}
      </p>
      <p className="yr-hint" style={{ margin: "0.25rem 0" }}>
        Timings: {center.timings}
      </p>
      <p className="yr-hint" style={{ margin: "0.25rem 0" }}>
        Phone: <a href={`tel:${center.phone.replace(/\s+/g, "")}`}>{center.phone}</a>
      </p>
      {distanceKm !== undefined && (
        <p style={{ margin: "0.25rem 0", fontWeight: 600 }}>{distanceKm.toFixed(1)} km away</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.6rem" }}>
        <a
          href={center.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="yr-btn-secondary"
          style={directionsLinkStyle}
        >
          Get Directions
        </a>
        <button type="button" className="yr-btn-primary yr-btn-full" onClick={() => onSelect(center, distanceKm)}>
          Select Center &amp; Generate Walk-In Pass
        </button>
      </div>
    </li>
  );
}

interface CenterLocatorProps {
  centers: Center[];
  onSelect: (center: Center, distanceKm?: number) => void;
}

export default function CenterLocator({ centers, onSelect }: CenterLocatorProps) {
  // Result of the last "Use Current Location" action. null means the pincode/district search is shown.
  const [gpsCenters, setGpsCenters] = useState<Located[] | null>(null);
  const [gpsError, setGpsError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const pincodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gpsError) {
      pincodeRef.current?.focus();
    }
  }, [gpsError]);

  const handleUseLocation = () => {
    setGpsError(false);
    setLocating(true);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocating(false);
      setGpsCenters(null);
      setGpsError(true);
      pincodeRef.current?.focus();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCenters(sortByDistance(centers, position.coords.latitude, position.coords.longitude));
        setLocating(false);
      },
      () => {
        setGpsCenters(null);
        setLocating(false);
        setGpsError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setGpsCenters(null);
  };

  const listItems: { center: Center; distanceKm?: number }[] =
    gpsCenters !== null
      ? gpsCenters.map((c) => ({ center: c, distanceKm: c.distanceKm }))
      : filterByPincodeOrDistrict(centers, query).map((c) => ({ center: c }));

  return (
    <section aria-label="Center locator" style={{ marginTop: "1rem" }}>
      <h3 className="yr-section-title">Nearest Centre Locator</h3>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "stretch" }}>
        <div className="yr-card" style={panelStyle}>
          <h4 style={{ margin: "0 0 0.6rem" }}>Option A: Live Location</h4>
          <button
            type="button"
            className="yr-btn-mint yr-btn-full"
            onClick={handleUseLocation}
            disabled={locating}
          >
            Use Current Location
          </button>
          {locating && <p className="yr-hint">Locating…</p>}
          {gpsError && (
            <p role="alert" className="yr-danger-text" style={{ fontSize: "0.85rem" }}>
              Location permission was denied or unavailable. Use the pincode search instead.
            </p>
          )}
        </div>

        <div className="yr-card" style={panelStyle}>
          <h4 style={{ margin: "0 0 0.6rem" }}>Option B: Search</h4>
          <label htmlFor="center-pincode-input" className="yr-label">
            Enter 6-Digit Pincode
          </label>
          <input
            id="center-pincode-input"
            ref={pincodeRef}
            className="yr-input"
            type="text"
            inputMode="numeric"
            value={query}
            placeholder="e.g. 560070 or Mysuru"
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>
      </div>

      <ul style={{ paddingLeft: 0, marginTop: "0.75rem" }}>
        {listItems.length === 0 ? (
          <li style={{ listStyle: "none" }} className="yr-hint">
            No centres match this search.
          </li>
        ) : (
          listItems.map(({ center, distanceKm }) => (
            <CenterCard key={center.id} center={center} distanceKm={distanceKm} onSelect={onSelect} />
          ))
        )}
      </ul>
    </section>
  );
}
