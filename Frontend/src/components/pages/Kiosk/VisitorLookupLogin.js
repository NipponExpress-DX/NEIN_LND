// src/pages/Kiosk/VisitorLookupLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import kioskApi from "../../../utils/kioskApi";

const LOOKUP_AUTH_KEY = "ehsLookupAuthed";
const LOOKUP_AUTH_TTL_MS = 15 * 60 * 1000; // re-authenticate every 15 min

export default function VisitorLookupLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
    try {
      await kioskApi.post("/ehs/kiosk/lookup-auth", { username, password });
      sessionStorage.setItem(LOOKUP_AUTH_KEY, JSON.stringify({ ts: Date.now() }));
      navigate("/kiosk/lookup", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0d1b2a", fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        width: 380, background: "#fff", borderRadius: 12, padding: "40px 36px",
        borderTop: "5px solid #1A6B3C"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#1A005D", margin: 0 }}>
            Visitor Lookup — Security Login
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            Enter the same device credentials used to activate this kiosk
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="kiosk username"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
          />
        </div>

        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6,
                        padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "12px", background: "#1A6B3C", color: "#fff",
                   border: "none", borderRadius: 6, fontSize: 15, fontWeight: "bold",
                   cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Verifying…" : "Unlock Visitor Lookup →"}
        </button>

        <button
          onClick={() => navigate("/kiosk/inductiontype")}
          disabled={loading}
          style={{ width: "100%", padding: "10px", background: "transparent", color: "#888",
                   border: "none", fontSize: 12, cursor: "pointer", marginTop: 10 }}
        >
          ← Cancel
        </button>
      </div>
    </div>
  );
}

export { LOOKUP_AUTH_KEY, LOOKUP_AUTH_TTL_MS };