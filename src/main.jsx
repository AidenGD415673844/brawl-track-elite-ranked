import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
try {
  root.render(<App />)
} catch (err) {
  console.error("Fatal render error:", err)
  root.render(
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0c14", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", padding: 24
    }}>
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#38bdf8" }}>
          BrawlTrack Elite
        </div>
        <div style={{ opacity: 0.85, marginBottom: 16 }}>
          The app failed to start. This usually means the deployed build is missing
          backend configuration. Try republishing from the editor.
        </div>
        <pre style={{
          textAlign: "left", background: "#0f1420", padding: 12, borderRadius: 8,
          fontSize: 11, overflow: "auto", maxHeight: 200
        }}>{String(err?.message || err)}</pre>
        <button onClick={() => location.reload()} style={{
          marginTop: 16, padding: "10px 18px", borderRadius: 10, border: "1px solid #38bdf8",
          background: "transparent", color: "#38bdf8", fontWeight: 600, cursor: "pointer"
        }}>Reload</button>
      </div>
    </div>
  )
}
