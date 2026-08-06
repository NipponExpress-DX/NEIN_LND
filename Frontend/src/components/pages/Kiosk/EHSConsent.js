// ============================================================
// EHSConsent.jsx
// DPDP Act, 2023 consent screen — shown before visitor details
// are collected (kiosk / walk-in flow only).
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/EHSConsent.css";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const CONSENT_TEXT_VERSION = "v1.0";

const EHSConsent = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useBlockBackNavigation(true, () => false); // trap here too — no escaping to Welcome/Login

  const [agreed, setAgreed]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    const kioskState  = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }
    // Corporate users never register, so they never need consent
    if (userDetails?.loginType === "corporate") {
      navigate("/kiosk/training-category", { replace: true });
    }
  }, [navigate]);

  const handleAgree = async () => {
    if (!agreed || isLoading) return;
    setIsLoading(true);
    setError("");

    const consent_id = crypto.randomUUID();

    try {
      await axios.post(`${API_BASE_URL}/ehs/consent/log`, {
        consent_id,
        consent_text_version: CONSENT_TEXT_VERSION,
        accepted: true,
      });

      const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
      kioskState.consent_id = consent_id;
      kioskState.consent_text_version = CONSENT_TEXT_VERSION;
      sessionStorage.setItem("kioskFlowState", JSON.stringify(kioskState));

      navigate("/kiosk/details", { replace: true });
    } catch (e) {
      console.error("[EHSConsent] consent log failed:", e);
      setError("Could not record consent. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="consent-container">
      <div className="consent-card">

        <div className="consent-topbar">
            <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <span className="consent-step-badge">Consent — DPDP Act, 2023</span>
        </div>

        <h1 className="consent-title">Your Data, Your Consent</h1>
        <p className="consent-subtitle">
          Before we collect your details for the induction,
          please review and accept the following.
        </p>

        <div className="consent-text-box">
          <p>
            In accordance with the Digital Personal Data Protection Act, 2023,
            Nippon Express India ("we") will collect and process your
            personal data — including your name, contact number,  and a
            photograph captured during this induction — solely for facility
            access safety compliance and training record-keeping.
          </p>
          <p>
            Your data will be stored securely and retained only as long as
            required for compliance and audit purposes. It will not be
            shared with third parties except where required by law or
            regulatory authorities.
          </p>
          <p>
            As a data principal, you have the right to access, correct, or
            request erasure of your personal data, and to withdraw consent
            at any time by contacting the facility coordinator, subject
            to applicable legal and regulatory retention requirements.
          </p>
        </div>

        {error && <div className="consent-error-banner">{error}</div>}

        <label className="consent-checkbox-row">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <span>
            I have read and understood the above, and I consent to Nippon
            Express India collecting and processing my personal data for
            this purpose.
          </span>
        </label>

        <div className="consent-actions">
          <button className="btn-agree" onClick={handleAgree} disabled={!agreed || isLoading}>
            {isLoading ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="spinner-path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              </svg>
            ) : (
              <>I Agree — Continue →</>
            )}
          </button>

          <button className="btn-back" onClick={() => navigate("/kiosk/welcome")} disabled={isLoading}>
            ← Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default EHSConsent;