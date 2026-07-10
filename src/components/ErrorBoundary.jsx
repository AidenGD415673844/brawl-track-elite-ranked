import React from "react";

/**
 * ErrorBoundary — catches any render/mount error in the tree and shows a
 * visible fallback instead of a completely blank page. Critical for prod
 * publish: without this, one crash in a provider silently renders nothing.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            background:
              "radial-gradient(circle at 20% 0%, rgba(34,211,238,0.08), transparent 45%)," +
              "radial-gradient(circle at 90% 10%, rgba(168,85,247,0.08), transparent 45%)," +
              "#0a0f1e",
            color: "#e2e8f0",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: "100%",
              padding: "2rem",
              borderRadius: 20,
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(15,23,42,0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h1
              style={{
                fontSize: 24,
                margin: 0,
                background:
                  "linear-gradient(90deg,#67e8f9,#c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Something went wrong
            </h1>
            <p style={{ marginTop: 12, fontSize: 14, color: "#94a3b8" }}>
              The app hit an unexpected error while rendering. Your data is safe.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.3)",
                  color: "#fca5a5",
                  fontSize: 12,
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {String(this.state.error.message)}
              </pre>
            )}
            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "linear-gradient(90deg,#0891b2,#7c3aed)",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              >
                Reload
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "transparent",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
