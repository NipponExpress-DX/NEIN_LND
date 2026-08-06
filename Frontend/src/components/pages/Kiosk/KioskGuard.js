// src/routes/KioskGuard.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const KIOSK_SESSION_KEY = "ehsKioskDeviceSession";
export default function KioskGuard({ children }) {
  const userDetails = JSON.parse(sessionStorage.getItem("userDetails") || "null");
  const flowState    = JSON.parse(sessionStorage.getItem("kioskFlowState") || "null");

  // Corporate bypass — require an explicit "this session is currently doing
  // the corporate kiosk flow" marker, not just a leftover corporate login
  // from earlier in this browser/tab.
  if (userDetails?.loginType === "corporate" && flowState?.entrySource === "corporate") {
    return children;
  }

  // Returning visitor authenticated via mobile+PIN on their own phone —
  // no physical kiosk device activation required for this path.
  try {
    const workerSession = JSON.parse(sessionStorage.getItem("ehsWorkerSession") || "null");
    if (workerSession?.visitor_id && flowState?.entrySource === "returning_visitor") {
      return children;
    }
  } catch {}

  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    const stored = JSON.parse(raw);
    const hasToken = !!stored?.token;
    const expiresAt = stored?.expires_at ? new Date(stored.expires_at) : null;
    const stillValid = hasToken && expiresAt && expiresAt > new Date();

    if (stillValid) {
      sessionStorage.setItem("kioskDeviceToken", stored.token);
      return children;
    }

    console.warn("[KioskGuard] rejected session", { /* ...unchanged... */ });
  } catch (err) {
    console.warn("[KioskGuard] localStorage parse error", err);
  }

  return <Navigate to="/kiosk/start" replace />;
}