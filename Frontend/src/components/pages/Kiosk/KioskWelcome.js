// ============================================================
// KioskWelcome.jsx  (updated — EHS audit log, corporate only,
//                    + clickable topic detail modal)
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/KioskWelcome.css";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const KioskWelcome = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false);

  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null); // ← new: which topic modal is open

  useEffect(() => {
    const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }

    const isCorporate = userDetails?.loginType === "corporate";
    setUserType(isCorporate ? "corporate" : "kiosk");
  }, [navigate]);

  const handleContinue = async () => {
    setIsLoading(true);
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    if (userType === "corporate") {
      try {
        await axios.post(`${API_BASE_URL}/ehs/audit/log`, {
          emp_id: userDetails?.emp_id,
          action: "EHS_WELCOME_SCREEN_VIEWED",
          loginType: "corporate",
          meta: { screen: "welcome" },
        });
      } catch (e) { console.warn("Audit log failed (non-critical)", e); }
    }
    const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    kioskState.loginType = userType;
    sessionStorage.setItem("kioskFlowState", JSON.stringify(kioskState));

    if (userType === "corporate" || kioskState.entrySource === "returning_visitor") {
      navigate("/kiosk/training-category");
    } else {
      navigate("/kiosk/consent");
    }
  };

  // ------------------------------------------------------------
  // Topic definitions + detail content shown in the modal
  // ------------------------------------------------------------
  const topics = [
    {
      key: "emergency-protocols",
      icon: "🚨",
      label: "Emergency protocols",
      colorClass: "topic-blue",
      accent: "#3b82f6",
      summary: "What to do the moment an emergency is declared on-site.",
      points: [
        "Stop work immediately and remain calm — do not run.",
        "Follow the nearest illuminated evacuation route (never use lifts).",
        "Proceed directly to your zone's designated assembly point.",
        "Report to your floor warden for a headcount before re-entry.",
        "Wait for the official all-clear before resuming any activity.",
      ],
    },
    {
      key: "hazard-awareness",
      icon: "👁️",
      label: "Hazard awareness",
      colorClass: "topic-green",
      accent: "#22c55e",
      summary: "Recognizing risks before they become incidents.",
      points: [
        "Watch for posted hazard signage — chemical, electrical, and mechanical zones are clearly marked.",
        "Never enter a barricaded or restricted area without authorization.",
        "Report spills, exposed wiring, or damaged equipment immediately — don't wait.",
        "Wear the PPE specified for the zone you're working in at all times.",
        "If unsure whether something is hazardous, treat it as hazardous and ask a supervisor.",
      ],
    },
    {
      key: "safety-rules",
      icon: "📋",
      label: "Safety rules & regulations",
      colorClass: "topic-amber",
      accent: "#f59e0b",
      summary: "The baseline rules that apply to everyone on the premises.",
      points: [
        "Visitor and vehicle speed limits must be followed at all times on-site.",
        "PPE (helmet, vest, safety shoes) is mandatory in all operational areas.",
        "Smoking and open flames are permitted only in designated zones.",
        "Horseplay, running, or bypassing safety barriers is strictly prohibited.",
        "All incidents — however minor — must be reported to EHS within the shift.",
      ],
    },
    {
      key: "emergency-response",
      icon: "🩺",
      label: "Emergency response",
      colorClass: "topic-red",
      accent: "#ef4444",
      summary: "First actions and contacts if someone is hurt or at risk.",
      points: [
        "First-aid stations are located near every floor entrance — know your nearest one.",
        "Fire extinguishers and hose reels are positioned at all marked exit corridors.",
        "For any injury, alert the nearest supervisor and EHS control room immediately.",
        "Do not move a seriously injured person unless there is an immediate danger.",
        "Emergency contact numbers are displayed on every safety noticeboard.",
      ],
    },
  ];

  const steps = [
    { num: 1, label: "Your details" },
    { num: 2, label: "Photo capture" },
    { num: 3, label: "Training video" },
    { num: 4, label: "Assessment" },
  ];

  const activeTopicData = topics.find(t => t.key === activeTopic);

  return (
    <div className="kiosk-welcome-container">
      <div className="kiosk-welcome-card">

        <div className="welcome-topbar">
          <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <span className="welcome-ehs-badge"><span className="badge-dot" /> EHS Induction</span>
        </div>

        <div className="welcome-hero">
          <div className="welcome-icon-ring">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v5c0 5 4 9.3 9 10.3C17 21.3 21 17 21 12V7L12 2z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <h1 className="welcome-title">Safety Induction Program</h1>
          <p className="welcome-subtitle">
            Welcome to Nippon Express. Before entering the facility,
            please complete this mandatory safety briefing.
          </p>
          {userType === "corporate" && (
            <div className="corporate-notice">
              ✓ Verified employee — you can proceed directly to training selection.
            </div>
          )}
        </div>

        <p className="topics-hint">Tap a topic to learn more</p>

        <div className="welcome-topics">
          {topics.map(t => (
            <button
              key={t.key}
              type="button"
              className={`welcome-topic welcome-topic-btn ${t.colorClass}`}
              onClick={() => setActiveTopic(t.key)}
            >
              <span className="topic-icon-wrap">{t.icon}</span>
              <span className="topic-label">{t.label}</span>
              <span className="topic-chevron">›</span>
            </button>
          ))}
        </div>

        {userType === "kiosk" && (
          <>
            <p className="steps-caption">📋 For New Registration — 4 quick steps:</p>
            <div className="welcome-steps">
              {steps.map((step, i) => (
                <React.Fragment key={step.num}>
                  <div className="welcome-step">
                    <div className="step-num">{step.num}</div>
                    <span className="step-label">{step.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className="step-divider" />}
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        <div className="welcome-actions">
          <button className="btn-begin" onClick={handleContinue} disabled={isLoading}>
            {isLoading ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="spinner-path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              </svg>
            ) : (
              <>New Registration
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>

          {userType === "kiosk" &&
            JSON.parse(sessionStorage.getItem("kioskFlowState"))?.entrySource === "direct" && (
              <button
                className="btn-returning"
                onClick={() => navigate("/ehs/login")}
                disabled={isLoading}
              >
                Registered User? View your records →
              </button>
            )}

          {JSON.parse(sessionStorage.getItem("kioskFlowState"))?.entrySource !== "direct" && (
            <button
              className="btn-back"
              onClick={() => navigate("/kiosk/inductiontype")}
              disabled={isLoading}
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* ---------------- Topic Detail Modal ---------------- */}
      {activeTopicData && (
        <div
          className="topic-modal-overlay"
          onClick={() => setActiveTopic(null)}
        >
          <div
            className="topic-modal"
            style={{ "--accent": activeTopicData.accent }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="topic-modal-close"
              onClick={() => setActiveTopic(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="topic-modal-header">
              <span className="topic-modal-icon">{activeTopicData.icon}</span>
              <div>
                <h2 className="topic-modal-title">{activeTopicData.label}</h2>
                <p className="topic-modal-summary">{activeTopicData.summary}</p>
              </div>
            </div>

            <ul className="topic-modal-list">
              {activeTopicData.points.map((point, idx) => (
                <li key={idx}>
                  <span className="topic-modal-bullet" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button
              className="topic-modal-got-it"
              onClick={() => setActiveTopic(null)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskWelcome;