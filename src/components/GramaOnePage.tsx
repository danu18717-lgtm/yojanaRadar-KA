import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { centers } from "../data/seed";
import type { Center } from "../types";
import CenterLocator from "./CenterLocator";

const linkButtonStyle: CSSProperties = {
  textDecoration: "none",
  textAlign: "center",
  boxSizing: "border-box",
  marginTop: "0.6rem",
};

export default function GramaOnePage() {
  const [hasSelection, setHasSelection] = useState(false);

  const handleSelect = (_center: Center) => {
    setHasSelection(true);
  };

  return (
    <section className="yr-page">
      <h2 className="yr-section-title">Grama One &amp; Karnataka One</h2>
      <p className="yr-hint">
        Find a nearby centre. Your Walk-In Pass is created from a match in the Matches tab.
      </p>

      <CenterLocator centers={centers} onSelect={handleSelect} />

      {hasSelection && (
        <div className="yr-card" role="status" style={{ marginTop: "1rem" }}>
          <p style={{ margin: "0 0 0.25rem" }}>
            Open a scheme in Matches and tap Check Documents &amp; Apply to generate your Walk-In Pass for this
            centre.
          </p>
          <Link to="/matches" className="yr-btn-primary yr-btn-full" style={linkButtonStyle}>
            Go to Matches
          </Link>
        </div>
      )}
    </section>
  );
}
