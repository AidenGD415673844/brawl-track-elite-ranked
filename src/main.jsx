import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'

const rootEl = document.getElementById('root')
const root = ReactDOM.createRoot(rootEl)

function FallbackScreen({ err }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0c14", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", padding: 24
    }}>
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#38bdf8" }}>
          BrawlTrack Elite
        </div>
        <div style={{ opacity: 0.85, marginBottom: 16 }}>
          The app failed to start. The deployed build is likely missing backend
          configuration. Republish from the editor to refresh it.
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

// Dynamic import so module-load errors (e.g. Supabase client throwing
// "supabaseUrl is required" when env vars weren't baked into the build) are
// caught here and shown as a helpful fallback instead of a blank white page.
;(async () => {
  try {
    const { default: App } = await import('@/App.jsx')
    root.render(<App />)
  } catch (err) {
    console.error("Fatal module-load error:", err)
    try {
      root.render(<FallbackScreen err={err} />)
    } catch {
      rootEl.innerHTML = `<pre style="padding:24px;color:#e2e8f0;background:#0a0c14;min-height:100vh;">${String(err?.message || err)}</pre>`
    }
  }
})()
