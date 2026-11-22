import PlansPage from "./PlansPage";

/** Thin overlay around PlansPage. The pricing UI lives only in PlansPage. */
export default function PlansModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Plans and pricing"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#F8F9FB",
          borderRadius: "20px",
          maxWidth: "960px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: "44px",
              padding: "0 1rem",
              borderRadius: "999px",
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#111827",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
        <PlansPage />
      </div>
    </div>
  );
}
