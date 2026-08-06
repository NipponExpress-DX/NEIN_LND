// src/pages/Kiosk/EHSAdminChangePassword.jsx
// Route: /ehs/admin/change-password — any logged-in admin/HR user.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API   = process.env.REACT_APP_API_BASE_URL;
const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";

function getSession() {
  try { return JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
  catch { return null; }
}

export default function EHSAdminChangePassword() {
  const navigate = useNavigate();
  const session = getSession();
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  if (!session?.token) { navigate("/ehs/admin/login", { replace: true }); return null; }

  const handleSubmit = async () => {
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/ehs/admin/change-password`,
        { current_password: current, new_password: next },
        { headers: { Authorization: `Bearer ${session.token}` } });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: 380, background: "#fff", borderRadius: 12, padding: "36px 32px",
                    borderTop: `5px solid ${GREEN}` }}>
        <h1 style={{ fontSize: 18, color: NAVY, marginTop: 0 }}>🔑 Change Password</h1>

        {done ? (
          <>
            <p style={{ color: GREEN, fontSize: 14 }}>✓ Password updated successfully.</p>
            <button onClick={() => navigate(sessionStorage.getItem("ehsWorkerSession") ? "/ehs/workspace" : "/ehs/admin")}
              style={{ width: "100%", padding: 12, background: GREEN, color: "#fff", border: "none",
                       borderRadius: 6, fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
              Back to Dashboard →
            </button>
          </>
        ) : (
          <>
            {["Current Password", "New Password", "Confirm New Password"].map((label, i) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  type="password"
                  value={i === 0 ? current : i === 1 ? next : confirm}
                  onChange={e => {
                    const v = e.target.value;
                    if (i === 0) setCurrent(v); else if (i === 1) setNext(v); else setConfirm(v);
                    setError("");
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6,
                           fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            ))}
            {error && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 14 }}>{error}</p>}
            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: 12, background: GREEN, color: "#fff", border: "none",
                       borderRadius: 6, fontSize: 14, fontWeight: "bold",
                       cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : "Update Password"}
            </button>
          <button onClick={() => navigate(sessionStorage.getItem("ehsWorkerSession") ? "/ehs/workspace" : "/ehs/admin")}
              style={{ width: "100%", padding: 10, background: "transparent", color: "#888",
                       border: "none", fontSize: 12, cursor: "pointer", marginTop: 8 }}>
              ← Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}