// src/pages/Kiosk/KioskActivation.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const KIOSK_SESSION_KEY = "ehsKioskDeviceSession"; // localStorage key
const API = process.env.REACT_APP_API_BASE_URL;

export default function KioskActivation() {
  const navigate  = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [checking, setChecking] = useState(true);
    const [activatedInfo, setActivatedInfo] = useState(null); // { device_name, location_code }


  // ── Forced first-login password change ─────────────────────
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword,        setNewPassword]         = useState("");
  const [confirmPassword,    setConfirmPassword]      = useState("");

  // On mount: check if kiosk is already activated today
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KIOSK_SESSION_KEY));
      if (stored?.token && stored?.expires_at) {
        const expiresAt = new Date(stored.expires_at);
        if (expiresAt > new Date()) {
          // Still valid — store in sessionStorage for this tab and go
          sessionStorage.setItem("kioskDeviceToken", stored.token);
          sessionStorage.setItem("kioskDeviceName",  stored.device_name || "");
          setChecking(false);
          navigate("/kiosk/inductiontype", { replace: true });

          return;
        }
      }
    } catch {}
    setChecking(false);
  }, [navigate]);

 const finishActivation = (data) => {
    // Direct device activation — wipe any leftover corporate session so it
  // can't be picked up by KioskGuard or anything else downstream.
  sessionStorage.removeItem("userDetails");
  sessionStorage.removeItem("rolePermissions");

  // ← TEMP DEBUG — remove once we confirm the cause
  console.warn("[KioskActivation] finishActivation called with:", data);

  const sessionPayload = {
    token:         data.token,
    device_name:   data.device_name,
    location_code: data.location_code,
    expires_at:    data.expires_at,
  };

  try {
    localStorage.setItem("ehsKioskDeviceSession", JSON.stringify(sessionPayload));
    // Read it straight back to confirm the write actually landed
    const verify = localStorage.getItem("ehsKioskDeviceSession");
    console.warn("[KioskActivation] write verified — read back:", verify);
  } catch (err) {
    console.error("[KioskActivation] localStorage.setItem THREW:", err);
  }

  sessionStorage.setItem("kioskDeviceToken",  data.token);
  sessionStorage.setItem("kioskLocationCode", data.location_code);
  sessionStorage.setItem("kioskDeviceName",   data.device_name);

  sessionStorage.setItem("kioskFlowState", JSON.stringify({
    entrySource:    "direct",
    location_code:  data.location_code,
    device_name:    data.device_name,
  }));

  // Show a brief "you're logged into <warehouse>" confirmation instead
  // of jumping straight to /kiosk/welcome, so mis-provisioned devices
  // get caught immediately rather than silently tagging visitors to
  // the wrong warehouse.
 setActivatedInfo({ device_name: data.device_name, location_code: data.location_code });
  setTimeout(() => navigate("/kiosk/inductiontype", { replace: true }), 2000);
};

  const handleActivate = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API}/ehs/kiosk/activate`, { username, password });

      // Admin just created this device (or reset its password) —
      // the kiosk must set its own real password before it can activate.
      if (data.must_change_password) {
        setMustChangePassword(true);
        setLoading(false);
        return;
      }

      finishActivation(data);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (newPassword.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword === password) { setError("New password must be different from the temporary password"); return; }

    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API}/ehs/kiosk/activate`, {
        username, password, new_password: newPassword,
      });
      finishActivation(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not set new password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
if (activatedInfo) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0d1b2a", fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        width: 380, background: "#fff", borderRadius: 12, padding: "40px 36px",
        borderTop: "5px solid #1A6B3C", textAlign: "center"
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
        <h1 style={{ fontSize: 18, fontWeight: "bold", color: "#1A005D", margin: "0 0 6px" }}>
          Kiosk Activated
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>You're logged in at</p>
        <p style={{ fontSize: 17, fontWeight: "bold", color: "#1A6B3C" }}>
          {activatedInfo.device_name}
        </p>
        <p style={{ fontSize: 12, color: "#aaa" }}>
          Warehouse code: {activatedInfo.location_code}
        </p>
      </div>
    </div>
  );
}
  if (checking) return null;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0d1b2a", fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        width: 380, background: "#fff", borderRadius: 12, padding: "40px 36px",
        borderTop: "5px solid #1A6B3C"
      }}>
        {!mustChangePassword ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛡️</div>
              <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#1A005D", margin: 0 }}>
                EHS Kiosk Activation
              </h1>
              <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
                Security / admin login to activate this device for today
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
                onKeyDown={e => e.key === "Enter" && handleActivate()}
                placeholder="kiosk username"
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                  borderRadius: 6, fontSize: 14, boxSizing: "border-box"
                }}
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
                onKeyDown={e => e.key === "Enter" && handleActivate()}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                  borderRadius: 6, fontSize: 14, boxSizing: "border-box"
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6,
                padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={loading}
              style={{
                width: "100%", padding: "12px", background: "#1A6B3C", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 15, fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Activating…" : "Activate Kiosk →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 20 }}>
              This activation is valid until midnight today.
              <br />Contact your L&amp;D admin if you need a new device account.
            </p>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔑</div>
              <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#1A005D", margin: 0 }}>
                Set a New Password
              </h1>
              <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
                This device was just set up (or had its password reset). Choose a new password
                before continuing — you won't need the temporary one again.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(""); }}
                placeholder="At least 8 characters"
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                  borderRadius: 6, fontSize: 14, boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSetNewPassword()}
                placeholder="Re-enter new password"
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                  borderRadius: 6, fontSize: 14, boxSizing: "border-box"
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6,
                padding: "10px 14px", fontSize: 13, color: "#c0392b", marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSetNewPassword}
              disabled={loading}
              style={{
                width: "100%", padding: "12px", background: "#1A6B3C", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 15, fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Saving…" : "Save Password & Activate →"}
            </button>

            <button
              onClick={() => { setMustChangePassword(false); setPassword(""); setError(""); }}
              disabled={loading}
              style={{
                width: "100%", padding: "10px", background: "transparent", color: "#888",
                border: "none", fontSize: 12, cursor: "pointer", marginTop: 10
              }}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}