// ============================================================
// KioskDetails.jsx
// Collects visitor info for direct-link (non-corporate) users
// and POSTs to /ehs/visitor/register.
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/KioskDetails.css";
import kioskApi from "../../../utils/kioskApi";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const VISITOR_TYPES = ["Customer", "Associate", "Driver", "Others"];

const KioskDetails = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false); // always block

  const [form, setForm] = useState({
    full_name:      "",
    contact_number: "",
    employee_id:    "",
    visitor_type:   "",
   
    });
  const [errors, setErrors]   = useState({});
  const [isLoading, setIsLoading] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [generatedPin, setGeneratedPin] = useState("");

  useEffect(() => {
    const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }
    // Corporate users should never reach this page
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    if (userDetails?.loginType === "corporate") {
      navigate("/kiosk/training-category", { replace: true });
      return;
    }
    // Must have accepted DPDP consent first
    if (!kioskState.consent_id) {
      navigate("/kiosk/consent", { replace: true });
    }
  }, [navigate]);

  const validate = () => {
      const e = {};
      if (!form.full_name.trim())      e.full_name      = "Full name is required";
      if (!form.contact_number.trim()) e.contact_number = "Contact number is required";
      else if (!/^\d{10}$/.test(form.contact_number.trim()))
                                        e.contact_number = "Enter a valid 10-digit contact number";
      if (!form.visitor_type)          e.visitor_type   = "Please select a visitor type";
      return e;
    };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

const handleSubmit = async () => {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }

  setIsLoading(true);
  try {
  const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));

      const payload = new FormData();
      payload.append("full_name",      form.full_name.trim());
      payload.append("contact_number", form.contact_number.trim());
      payload.append("visitor_type",   form.visitor_type);
      payload.append("consent_id",    kioskState?.consent_id || "");
      if (form.employee_id.trim()) {
        payload.append("employee_id", form.employee_id.trim());
      }

    const { data } = await kioskApi.post("/ehs/visitor/register", payload, {
        headers: { "Content-Type": "multipart/form-data" }
        });

    // Save to session
   // const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    kioskState.visitor_id = data.visitor_id;
    kioskState.visitorPin = data.pin;         // ← save PIN for completion screen too
    sessionStorage.setItem("kioskFlowState", JSON.stringify(kioskState));
    sessionStorage.setItem("kioskUserData", JSON.stringify({
      ...form,
      visitor_id: data.visitor_id,
    }));

    // Show PIN modal before proceeding
    setGeneratedPin(data.pin);
    setShowPinModal(true);

  } catch (err) {
    console.error("[KioskDetails] register error:", err);
    setErrors({ submit: "Failed to save details. Please try again." });
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="kiosk-details-container">
      <div className="kiosk-details-card">

        <div className="details-topbar">
            <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <span className="details-step-badge">Step 1 of 4 — Your Details</span>
        </div>

        <h1 className="details-title">Visitor Registration</h1>
        <p className="details-subtitle">
          Please fill in your details before proceeding.
        </p>

        {errors.submit && (
          <div className="details-error-banner">{errors.submit}</div>
        )}

        <div className="details-form">
            <div className="details-form-row">
              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
            <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={form.full_name}
                onChange={e => handleChange("full_name", e.target.value)}
                className={errors.full_name ? "input-error" : ""}
            />
            {errors.full_name && <span className="field-error">{errors.full_name}</span>}
            {/* ↑ was showing errors.employee_id here — wrong */}
            </div>


          {/* Contact number */}
          <div className="form-group">
           <label>Contact Number <span className="req">*</span></label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.contact_number}
              onChange={e => handleChange("contact_number", e.target.value)}
              className={errors.contact_number ? "input-error" : ""}
            />
            {errors.contact_number && <span className="field-error">{errors.contact_number}</span>}
            </div>

            
        </div>
          {/* Visitor type */}
          <div className="form-group">
            <label>Visitor Type <span className="req">*</span></label>
            <div className="visitor-type-grid">
              {VISITOR_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-chip ${form.visitor_type === type ? "selected" : ""}`}
                  onClick={() => handleChange("visitor_type", type)}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.visitor_type && <span className="field-error">{errors.visitor_type}</span>}
          </div>

         
        </div>

        <div className="details-actions">
          <button
            className="btn-continue"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="spinner-path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              </svg>
            ) : (
              <>Next — Photo Capture <span className="arrow">→</span></>
            )}
          </button>

          {/* <button
            className="btn-back"
            onClick={() => navigate("/kiosk/welcome")}
            disabled={isLoading}
          >
            ← Back
          </button> */}
        </div>
{/* ── PIN Modal ── */}
{showPinModal && (
  <div className="pin-modal-overlay">
    <div className="pin-modal">
      <div className="pin-modal-icon">🔐</div>
      <h2>Your Login PIN</h2>
      <p className="pin-modal-sub">
            Your PIN is the first 4 letters of your registered name + the last 4 digits of your mobile number.
            
          </p>

      <div className="pin-modal-value">{generatedPin}</div>

      <p className="pin-modal-note">
        You'll need this PIN + your mobile number to view your records on future visits.
        ⚠️ Please note this PIN down now. It will not be shown again.
      </p>

      <button
        className="pin-modal-btn"
        onClick={() => {
          setShowPinModal(false);
          navigate("/kiosk/photo");
        }}
      >
        I've noted my PIN — Continue →
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default KioskDetails;