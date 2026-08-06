// src/pages/Kiosk/ProfileChip.jsx
// Small "logged in as" pill. Reads whatever identity data is
// available in sessionStorage (kiosk registrant or corporate SSO
// user) — renders nothing until a name is known.
import React from "react";

export default function ProfileChip() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  let user = { full_name: "", visitor_type: "", photo_path: null };

  try {
    const kioskUserData = JSON.parse(sessionStorage.getItem("kioskUserData")) || {};
    const userDetails    = JSON.parse(sessionStorage.getItem("userDetails")) || {};
    const isCorporate    = userDetails?.loginType === "corporate";

    user = {
      full_name:    isCorporate ? (userDetails?.empname || userDetails?.name || "") : (kioskUserData?.full_name || ""),
      visitor_type: isCorporate ? "Employee" : (kioskUserData?.visitor_type || ""),
      photo_path:   kioskUserData?.photo_path || null,
    };
  } catch {}

  if (!user.full_name) return null;

  const initials = user.full_name
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "#ffffff", border: "1px solid #e0e0e0",
      borderRadius: 99, padding: "4px 12px 4px 4px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    }}>
      {user.photo_path ? (
        <img
          src={`${API_BASE_URL}/${user.photo_path}`}
          alt=""
          style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#1A6B3C", color: "#fff", fontSize: 11, fontWeight: "bold",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {initials}
        </div>
      )}
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#1A005D" }}>{user.full_name}</div>
        {user.visitor_type && (
          <div style={{ fontSize: 10, color: "#888" }}>{user.visitor_type}</div>
        )}
      </div>
    </div>
  );
}