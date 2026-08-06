// src/pages/Kiosk/EHSWorkspace.jsx
// Single-page tab shell for corporate users. Shows "My Training" always,
// "Admin Verification" only if an ehsAdminSession exists (emp_id matched
// ehs_admin_users at login — see PathSelection.jsx handleKioskPath).
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EHSDashboard from "./EHSDashboard";
import EHSAdminDashboard from "./EHSAdminDashboard";

export default function EHSWorkspace() {
  const navigate = useNavigate();
    const [searchParams] = useSearchParams();

  const hasAdmin = !!sessionStorage.getItem("ehsAdminSession");
 const [tab, setTab] = useState(
    hasAdmin && searchParams.get("tab") === "admin" ? "admin" : "worker"
  );

  const handleLogout = () => {
    sessionStorage.removeItem("ehsWorkerSession");
    sessionStorage.removeItem("ehsAdminSession");
    sessionStorage.removeItem("userDetails");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: "#1A005D", color: "#fff", padding: "0 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setTab("worker")}
            style={{
              padding: "16px 22px", background: "transparent", border: "none",
              borderBottom: tab === "worker" ? "3px solid #1A6B3C" : "3px solid transparent",
              color: "#fff", fontWeight: tab === "worker" ? "bold" : "normal",
              cursor: "pointer", fontSize: 14,
            }}>
            🛡️ My Training
          </button>
          {hasAdmin && (
            <button
              onClick={() => setTab("admin")}
              style={{
                padding: "16px 22px", background: "transparent", border: "none",
                borderBottom: tab === "admin" ? "3px solid #1A6B3C" : "3px solid transparent",
                color: "#fff", fontWeight: tab === "admin" ? "bold" : "normal",
                cursor: "pointer", fontSize: 14,
              }}>
              👥 Admin Verification
            </button>
          )}
        </div>
        <button onClick={handleLogout}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                   padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: tab === "worker" ? "block" : "none" }}>
        <EHSDashboard embedded />
      </div>
      {hasAdmin && (
        <div style={{ display: tab === "admin" ? "block" : "none" }}>
          <EHSAdminDashboard embedded />
        </div>
      )}
    </div>
  );
}