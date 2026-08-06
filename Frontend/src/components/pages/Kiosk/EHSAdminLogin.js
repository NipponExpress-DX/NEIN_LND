// src/pages/Kiosk/EHSAdminLogin.jsx
//
// Login for both the super admin and location-scoped HR users.
// Route suggestion: /ehs/admin/login
// On success: stores { token, role, full_name, email, location_code }
// under sessionStorage "ehsAdminSession", then routes to
// /ehs/admin (HR + super admin land here — dashboard shows a
// "Warehouses & Kiosks" / "Reports" / "Manage HR" nav only if
// role === "super_admin").

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const API   = process.env.REACT_APP_API_BASE_URL;
const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";

export default function EHSAdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword]             = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");

  const finishLogin = (data) => {
    sessionStorage.setItem("ehsAdminSession", JSON.stringify({
      token:         data.token,
      role:          data.role,
      full_name:     data.full_name,
      email:         data.email,
      location_code: data.location_code,
      expires_at:    data.expires_at,
    }));
    navigate("/ehs/admin", { replace: true });
  };

  const handleLogin = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API}/ehs/admin/login`, { username, password });
      if (data.must_change_password) { setMustChangePassword(true); return; }
      finishLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (newPassword.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword === password) { setError("New password must differ from the temporary password"); return; }

    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API}/ehs/admin/login`, {
        username, password, new_password: newPassword,
      });
      finishLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not set new password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#0d1b2a", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: 380, background: "#fff", borderRadius: 12, padding: "40px 36px",
                    borderTop: `5px solid ${GREEN}` }}>

        {!mustChangePassword ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛡️</div>
              <h1 style={{ fontSize: 20, fontWeight: "bold", color: NAVY, margin: 0 }}>EHS Admin Portal</h1>
              <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
                For warehouse HR &amp; system administrators
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6,
                         fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6,
                         fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6,
                            padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin} disabled={loading}
              style={{ width: "100%", padding: "12px", background: GREEN, color: "#fff", border: "none",
                       borderRadius: 6, fontSize: 15, fontWeight: "bold",
                       cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔑</div>
              <h1 style={{ fontSize: 20, fontWeight: "bold", color: NAVY, margin: 0 }}>Set a New Password</h1>
              <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
                This account was just created (or reset). Choose your own password before continuing.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
                New Password
              </label>
              <input
                type="password" value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(""); }}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6,
                         fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                type="password" value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSetNewPassword()}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6,
                         fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6,
                            padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSetNewPassword} disabled={loading}
              style={{ width: "100%", padding: "12px", background: GREEN, color: "#fff", border: "none",
                       borderRadius: 6, fontSize: 15, fontWeight: "bold",
                       cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Saving…" : "Save Password & Continue →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}