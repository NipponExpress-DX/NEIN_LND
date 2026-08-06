// src/pages/Kiosk/InductionTypeSelection.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/InductionTypeSelection.css";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const InductionTypeSelection = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false);
  
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/ehs/induction-types`)
      .then(({ data }) => setTypes(data))
      .catch(() => setError("Failed to load induction types. Please try again."))
      .finally(() => setIsLoading(false));
  }, [API_BASE_URL]);

const handleSelect = (type) => {
    if (type.status !== "Active") return;
    setSelecting(type.id);

    const existing = JSON.parse(sessionStorage.getItem("kioskFlowState")) || {};
    sessionStorage.setItem("kioskFlowState", JSON.stringify({
      ...existing,
      inductionType: type.induction_code,
      entrySource: existing.entrySource || "direct",
    }));

    // Only EHS Digital Induction is wired up currently
    if (type.induction_code === "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/welcome");
    } else {
      setError("This induction type is not yet available.");
      setSelecting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="its-wrap">
        <div className="its-card its-loading">
          <svg className="its-spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
          <p>Loading induction types…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="its-wrap">
      <div className="its-card">

       <div className="its-topbar">
          <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => navigate("/kiosk/lookup-login")}
              style={{
                background: "#f0f4ff", border: "1px solid #c5dff6", color: "#185fa5",
                fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 99,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              🔍 Visitor Lookup
            </button>
          
          </div>
        </div>

        <div className="its-header">
          <div className="its-icon-ring">🛡️</div>
          <h1 className="its-title">Choose Your Induction</h1>
          <p className="its-subtitle">
            Select the type of induction you need to complete.
          </p>
        </div>

        {error && <p className="its-error">{error}</p>}

        {types.length === 0 ? (
          <div className="its-empty">
            <p>No induction types available. Please contact the safety officer.</p>
          </div>
        ) : (
          <div className="its-grid">
            {types.map(type => {
              const isComingSoon = type.status !== "Active";
              return (
                <button
                  key={type.id}
                  className={`its-tile ${type.color_class || ""} ${isComingSoon ? "disabled" : ""}`}
                  onClick={() => handleSelect(type)}
                  disabled={isComingSoon || selecting === type.id}
                >
                  <span className="its-icon">{type.icon_emoji || "📋"}</span>
                  <span className="its-name">{type.name}</span>
                  {type.description && (
                    <span className="its-desc">{type.description}</span>
                  )}
                  {isComingSoon && <span className="its-soon-badge">Coming Soon</span>}
                  {selecting === type.id && (
                    <span className="its-selecting">Loading…</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default InductionTypeSelection;