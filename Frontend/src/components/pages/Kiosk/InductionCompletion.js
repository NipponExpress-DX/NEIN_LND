import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../css/Admincss/InductionCompletion.css";
import kioskApi from "../../../utils/kioskApi";
import ProfileChip from "./ProfileChip";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const InductionCompletion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    useBlockBackNavigation(true, () => false); 

 const [photoUrl, setPhotoUrl] = useState(null);
  const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState")) || {};
const trainingId = location.state?.trainingId || kioskState.selectedTrainingId;

  const [status, setStatus] = useState("saving");
  const [name, setName] = useState("");
  const [visitorPin, setVisitorPin] = useState(null);
  const [visitorId, setVisitorId] = useState(null);

  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    // Guard against duplicate submissions, scoped to THIS exact navigation.
    // location.key is unique per history entry, so Back/Forward landing on
    // the same entry still reuses the cached result (no duplicate POST),
    // but a genuinely new completion attempt gets its own key and always
    // saves fresh. A single global key previously caused a worse bug: any
    // leftover lock from an earlier attempt in the same tab (e.g. saved
    // before the photo upload had resolved) would get replayed here too —
    // including its stale/missing photo — even though this is a brand new
    // induction.
    const LOCK_KEY = `kioskCompletionLock:${location.key || "default"}`;
    const existingLock = sessionStorage.getItem(LOCK_KEY);
    if (existingLock) {
      try {
        const cached = JSON.parse(existingLock);
        setStatus(cached.passed ? "pass" : "fail");
        setName(cached.name || "");
        setVisitorId(cached.visitor_id || null);
        setVisitorPin(cached.visitorPin || null);
        setPhotoUrl(cached.photoUrl || null);
        return;
      } catch {
        sessionStorage.removeItem(LOCK_KEY); // malformed lock — fall through and save normally
      }
    }

    const save = async () => {
      try {
        const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState")) || {};
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
        const kioskUser = JSON.parse(sessionStorage.getItem("kioskUserData")) || {};
        // Photo: prefer a persisted photo_path (served by the API), fall back
        // to the freshly-captured base64/blob URL from the photo capture step
        const resolvedPhoto = kioskUser?.photo_path
          ? `${API_BASE_URL}/${kioskUser.photo_path}`
          : sessionStorage.getItem("kioskSelectedPhoto") || null;
        setPhotoUrl(resolvedPhoto);
        
        const score = location.state?.score ?? null;
        const passed = location.state?.passed ?? false;
        const category = kioskState?.selectedCategory || "unknown";
        const isCorp = userDetails?.loginType === "corporate";

        const vid = kioskState?.visitor_id || kioskUser?.visitor_id || null;
        const pin = kioskState?.visitorPin || kioskUser?.pin || null;
        const workerName = isCorp
          ? userDetails?.name || "Employee"
          : kioskUser?.full_name || "Visitor";

        setVisitorId(vid);
        setVisitorPin(pin);
        setName(workerName);

        // const response = await kioskApi.post(`${API_BASE_URL}/ehs/induction/complete`, {
        //   user_type: isCorp ? "corporate" : "kiosk",
        //   category,
        //   training_id: kioskState?.selectedTrainingId || null,
        //   score,
        //   passed,
        //   visitor_id: !isCorp ? vid : null,
        //   emp_id: isCorp ? userDetails?.emp_id : null,
        //   full_name: isCorp ? (userDetails?.name || null) : null,
        //   contact_number: isCorp ? (userDetails?.mobile || userDetails?.contact_number || null) : null,
        // });
      const response = await kioskApi.post(`${API_BASE_URL}/ehs/induction/complete`, {
                user_type: isCorp ? "corporate" : "kiosk",
                category,
                training_id: kioskState?.selectedTrainingId || null,
                language_id: kioskState?.selectedLanguageId || null,   // ← add
                score,
                passed,
                visitor_id: !isCorp ? vid : null,
                emp_id: isCorp ? userDetails?.emp_id : null,
                full_name: isCorp ? (userDetails?.name || null) : null,
                contact_number: isCorp ? (userDetails?.mobile || userDetails?.contact_number || null) : null,
              });

        setStatus(passed ? "pass" : "fail");

        const resolvedId = response.data.worker_id || vid;
        setVisitorId(resolvedId);

        sessionStorage.setItem(LOCK_KEY, JSON.stringify({
          passed,
          name: workerName,
          visitor_id: resolvedId,
          visitorPin: pin,
          photoUrl: resolvedPhoto,
        }));

        if (passed && resolvedId) {
          const sessionToken = response.data.token;
          sessionStorage.setItem(
            "ehsWorkerSession",
            JSON.stringify({
              visitor_id: resolvedId,
              token: sessionToken,
              full_name: workerName,
              visitor_type: kioskUser?.visitor_type || "Visitor",
              photo_path: kioskUser?.photo_path || null,
              user_type: isCorp ? "corporate" : "kiosk",
              created_at: new Date().toISOString(),
            })
          );
        }

       if (passed) {
          sessionStorage.removeItem("kioskFlowState");
        }
        sessionStorage.removeItem("kioskPhotos");
        sessionStorage.removeItem("kioskSelectedPhoto");
      } catch (err) {
        console.error("[InductionCompletion] save error:", err);
        setStatus("error");
      }
    };

    save();
  }, [API_BASE_URL, location.state, location.key]);

  

  // Clears every completion lock in this tab (there may be several, one
  // per navigation), so a fresh retake/restart never reuses a stale
  // cached result from an earlier attempt.
  const clearCompletionLocks = () => {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("kioskCompletionLock"))
      .forEach(k => sessionStorage.removeItem(k));
  };

    const handleRetakeTraining = () => {
  console.log("retake clicked, flowState:", sessionStorage.getItem("kioskFlowState"));
  clearCompletionLocks();
  navigate("/kiosk/video");
};

  const handleSignOut = () => {
    sessionStorage.removeItem("ehsWorkerSession");
    sessionStorage.removeItem("userDetails");
    sessionStorage.removeItem("kioskFlowState");
    sessionStorage.removeItem("kioskPhotos");
    sessionStorage.removeItem("kioskSelectedPhoto");
    clearCompletionLocks();
    navigate("/kiosk/welcome");
  };

  const handleRestart = () => {
      sessionStorage.removeItem("kioskFlowState");
      sessionStorage.removeItem("kioskPhotos");
      sessionStorage.removeItem("kioskSelectedPhoto");
      clearCompletionLocks();
      navigate("/kiosk/training-category");   // was "/kiosk/inductiontype"
    };

  if (status === "saving") {
    return (
      <div className="completion-container">
        <div className="completion-card">
          <div className="completion-saving">
            <svg className="spinner-lg" viewBox="0 0 50 50">
              <circle className="spinner-path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
            <p>Saving your results…</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="completion-container">
        <div className="completion-card">
          <div className="completion-icon error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>Your completion could not be saved. Please contact the safety officer.</p>
          <button className="btn-restart" onClick={handleRestart}>
            Start Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="completion-container">
      <div className="completion-card">
        <div className="completion-chip-row">
          <ProfileChip />
        </div>

        <div className={`completion-icon ${status === "pass" ? "pass-icon" : "fail-icon"}`}>
          {status === "pass" ? "✅" : "❌"}
        </div>

        <h2 className={status === "pass" ? "pass-title" : "fail-title"}>
          {status === "pass" ? "Induction Complete! You Passed!!!" : "Assessment Not Passed"}
        </h2>

        <p className="completion-name">
          {status === "pass"
            ? `Well done, ${name}! You have successfully completed the Induction.`
            : `${name}, you did not meet the passing score. Please speak to the safety officer and try again.`}
        </p>

        {status === "pass" && photoUrl && (
            <div className="completion-photo-box">
              <img
                src={photoUrl}
                alt="Captured at check-in"
                className="completion-photo"
              />
            </div>
          )}
                {status === "pass" && (
                  <div className="hr-notify-box">
                    <p className="hr-notify-icon">✅</p>
                    <p className="hr-notify-title">Induction Submitted</p>
                    <p className="hr-notify-text">
                      Your induction record has been saved. You're all set
                    </p>
                  </div>
        )}

        {/* {status === "pass" && visitorPin && (
          <div className="pass-pin-box">
            <p className="pass-pin-label">🔐 Your Login PIN</p>
            <div className="pass-pin-value">{visitorPin}</div>
            <p className="pass-pin-note">
              Save this PIN. Use it with your mobile number to view your records on future visits.
            </p>
          </div>
        )} */}  

        <div className="completion-actions">
          {status === "pass" ? (
              <>
                <button className="btn-restart primary" onClick={handleSignOut}>
                  Sign Out
                </button>
                <button className="btn-restart secondary" onClick={() => navigate(`/ehs/dashboard/${visitorId}`)}>
                  View My Dashboard Instead
                </button>
              </>
           ) : (
                <>
                  <button className="btn-restart primary" onClick={handleRetakeTraining}>
                    Retake Training & Quiz →
                  </button>
                  <button className="btn-restart secondary" onClick={handleRestart}>
                    Choose a Different Category
                  </button>
                </>
              )}
        </div>
      </div>
    </div>
  );
};

export default InductionCompletion;