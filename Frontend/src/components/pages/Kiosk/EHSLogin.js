import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/EHSLogin.css";

const EHSLogin = () => {
  const navigate     = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [step,       setStep]       = useState("mobile"); // mobile | pin | notfound
const [resetForm, setResetForm] = useState({ full_name: "" });   
  const [newPin, setNewPin]       = useState("");
  const [mobile,     setMobile]     = useState("");
  const [pin,        setPin]        = useState("");
  const [workerInfo, setWorkerInfo] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  // ── Step 1: lookup mobile ──────────────────────────────────
  const handleMobileLookup = async () => {
    if (mobile.length < 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API_BASE_URL}/ehs/auth/lookup`, { contact_number: mobile });
      if (!data.exists)   { setStep("notfound"); return; }
      if (!data.has_pin)  { 
        setError("No PIN set for this account. Please complete your induction first."); 
        return; 
      }
      setWorkerInfo(data);
      setStep("pin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify PIN ─────────────────────────────────────
 const handlePinVerify = async () => {
    if (pin.length < 8) { setError("Enter your 8-character PIN"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API_BASE_URL}/ehs/auth/verify-pin`, {
        contact_number: mobile,
        pin,
      });
      sessionStorage.setItem("ehsWorkerSession", JSON.stringify({
        visitor_id:   data.visitor_id,
        full_name:    data.full_name,
        visitor_type: data.visitor_type,
        photo_path:   data.photo_path,
        token:        data.token,
        user_type:    "kiosk",   // ← add this line
      }));
      navigate(`/ehs/dashboard/${data.visitor_id}`);

    } catch (err) {
      setError(err.response?.data?.error || "Incorrect PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };
// ── Reset PIN handler ──────────────────────────────────────
  const handleResetPin = async () => {
  if (!resetForm.full_name.trim()) {
    setError("Please enter your full name");
    return;
  }
  setLoading(true); setError("");
  try {
    const { data } = await axios.post(`${API_BASE_URL}/ehs/auth/reset-pin`, {
      contact_number: mobile,                      // ← already known, no need to re-collect
      full_name:      resetForm.full_name.trim(),
    });
    setNewPin(data.new_pin);
    setStep("newpin");
  } catch (err) {
    setError(err.response?.data?.error || "Details did not match. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="ehs-login-wrap">
      <div className="ehs-login-card">

        <div className="ehs-login-header">
          <div className="ehs-login-shield">🛡️</div>
          <h1>EHS Safety Portal</h1>
          <p>Nippon Express — Worker Self-Service</p>
        </div>

        {/* ── Step: Mobile ── */}
        {step === "mobile" && (
          <div className="ehs-login-body">
                <p className="ehs-login-hint">
                  Enter the 8-character PIN you received after your first registration
                  (first 4 letters of your name + last 4 digits of your mobile number).
                </p>
            <div className="ehs-field">
              <label>Mobile Number</label>
              <div className="ehs-mobile-row">
                <span className="ehs-country-code">+91</span>
                <input
                  type="tel" maxLength={10}
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={e => { setMobile(e.target.value.replace(/\D/, "")); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleMobileLookup()}
                  className="ehs-input"
                />
              </div>
            </div>
            {error && <p className="ehs-error">{error}</p>}
            <button
              className="ehs-btn primary"
              onClick={handleMobileLookup}
              disabled={loading || mobile.length < 10}
            >
              {loading ? "Checking…" : "Continue →"}
            </button>
            <div className="ehs-divider">or</div>
            <button className="ehs-btn" onClick={() => navigate("/kiosk/details")}>
              New Visitor? Start Induction
            </button>
          </div>
        )}

        {/* ── Step: PIN ── */}
        {step === "pin" && workerInfo && (
          <div className="ehs-login-body">
            <div className="ehs-worker-preview">
              {workerInfo.photo_path
                ? <img src={`${API_BASE_URL}/${workerInfo.photo_path}`} alt="" className="ehs-worker-thumb" />
                : <div className="ehs-worker-avatar">👷</div>
              }
              <div>
                <p className="ehs-worker-name">{workerInfo.full_name}</p>
                <span className="ehs-worker-badge">{workerInfo.visitor_type}</span>
              </div>
            </div>
            <p className="ehs-login-hint">
              Enter the 6-digit PIN you received after your first registration.
            </p>
            <div className="ehs-field">
              <label>Your PIN</label>
               <input
                  type="password"
                  maxLength={8}
                  placeholder="••••••••"
                  value={pin}
                  onChange={e => { setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handlePinVerify()}
                  className="ehs-input ehs-pin-input"
                />
            </div>
            {error && <p className="ehs-error">{error}</p>}
            <button
              className="ehs-btn primary"
              onClick={handlePinVerify}
              disabled={loading || pin.length < 8}
            >
              {loading ? "Verifying…" : "Login →"}
            </button>
            {/* ← Add this */}
              <button
                className="ehs-btn-link"
                onClick={() => { setStep("forgot"); setError(""); }}
              >
                Forgot PIN?
              </button>
            <button className="ehs-btn" onClick={() => { setStep("mobile"); setPin(""); setError(""); }}>
              ← Change Number
            </button>
          </div>
        )}
{/* ── Step: Forgot PIN ── */}
{step === "forgot" && (
  <div className="ehs-login-body">
    <div className="ehs-forgot-icon">🔑</div>
    <h2 className="ehs-forgot-title">Reset Your PIN</h2>
    <p className="ehs-login-hint">
      Confirm the name you registered with — for {mobile ? `+91 ${mobile}` : "your mobile number"} — to verify your identity.
    </p>

    <div className="ehs-field">
      <label>Full Name</label>
      <input
        type="text"
        placeholder="As entered during registration"
        value={resetForm.full_name}
        onChange={e => { setResetForm(f => ({...f, full_name: e.target.value})); setError(""); }}
        className="ehs-input"
      />
    </div>

    {error && <p className="ehs-error">{error}</p>}

    <button
      className="ehs-btn primary"
      onClick={handleResetPin}
      disabled={loading || !resetForm.full_name}
    >
      {loading ? "Verifying…" : "Reset PIN →"}
    </button>
    <button className="ehs-btn" onClick={() => { setStep("pin"); setError(""); }}>
      ← Back to Login
    </button>
  </div>
)}

    {/* ── Step: New PIN shown ── */}
    {step === "newpin" && (
      <div className="ehs-login-body">
        <div className="ehs-forgot-icon">✅</div>
        <h2 className="ehs-forgot-title">PIN Reset Successful</h2>
        <p className="ehs-login-hint">Your new PIN is shown below. Note it down before continuing.</p>

        <div className="ehs-new-pin-box">{newPin}</div>

        <p className="ehs-pin-warning">⚠️ This PIN will not be shown again.</p>

        <button
          className="ehs-btn primary"
          onClick={() => {
            setPin("");
            setStep("pin");
            setError("");
          }}
        >
          Continue to Login →
        </button>
      </div>
    )}
        {/* ── Step: Not found ── */}
        {step === "notfound" && (
          <div className="ehs-login-body ehs-notfound">
            <div className="ehs-notfound-icon">🔍</div>
            <h2>No Record Found</h2>
            <p>This mobile number is not registered in our system.</p>
            <button className="ehs-btn primary" onClick={() => navigate("/kiosk/inductiontype")}>
              Complete Your Induction First
            </button>
            <button className="ehs-btn" onClick={() => { setStep("mobile"); setMobile(""); setError(""); }}>
              ← Try Another Number
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default EHSLogin;