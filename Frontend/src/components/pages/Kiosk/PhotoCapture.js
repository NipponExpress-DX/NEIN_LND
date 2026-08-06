// ============================================================
// PhotoCapture.jsx  (updated — saves photo to server)
// After user selects a photo, POSTs it to /ehs/visitor/photo
// using the visitor_id stored in kioskFlowState.
// ============================================================

import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/PhotoCapture.css";
import "../../../css/Admincss/KioskDetails.css";
import kioskApi from "../../../utils/kioskApi";
import ProfileChip from "./ProfileChip";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const PhotoCapture = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const fileInputRef = useRef(null);
  useBlockBackNavigation(true, () => false); // always block

   const [photos, setPhotos]               = useState([]);
  const [selectedPhotoIndex, setSelected] = useState(null);
  const [cameraActive, setCameraActive]   = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const MAX_PHOTOS = 6;

  useEffect(() => {
    const kioskState  = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }
    if (userDetails?.loginType === "corporate") {
      navigate("/kiosk/training-category", { replace: true });
      return;
    }
    // Must have accepted DPDP consent before photo capture too
    if (!kioskState.consent_id) {
      navigate("/kiosk/consent", { replace: true });
      return;
    }

    const saved = JSON.parse(sessionStorage.getItem("kioskPhotos"));
    if (saved?.length) { setPhotos(saved); }
  }, [navigate]);

  // Auto-advance off the success modal instead of waiting for a click —
// show it briefly as confirmation, then move on by itself.
  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(() => {
      navigate("/kiosk/training-category", { replace: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [showSuccessModal, navigate]);

  // ── Camera helpers ─────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setError("");
    } catch {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (photos.length >= MAX_PHOTOS) { setError(`Maximum ${MAX_PHOTOS} photos reached`); return; }
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl   = canvas.toDataURL("image/jpeg");
    const updated   = [...photos, dataUrl];
    setPhotos(updated);
    setSelected(updated.length - 1);
    setError("");
    sessionStorage.setItem("kioskPhotos", JSON.stringify(updated));
  };

  const deletePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    sessionStorage.setItem("kioskPhotos", JSON.stringify(updated));
    if (selectedPhotoIndex === index)      setSelected(updated.length ? 0 : null);
    else if (selectedPhotoIndex > index)   setSelected(selectedPhotoIndex - 1);
  };

  const handleFileUpload = (e) => {
    Array.from(e.target.files || []).forEach(file => {
      if (photos.length >= MAX_PHOTOS) { setError(`Maximum ${MAX_PHOTOS} photos reached`); return; }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const updated = [...photos, evt.target.result];
        setPhotos(updated);
        setSelected(updated.length - 1);
        sessionStorage.setItem("kioskPhotos", JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleContinue = async () => {
    if (selectedPhotoIndex === null) { setError("Please select a photo to continue"); return; }
    setIsLoading(true);

    try {
      const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
      const visitor_id = kioskState?.visitor_id;

      if (!visitor_id) {
        setError("Visitor registration not found. Please go back and re-enter your details.");
        setIsLoading(false);
        return;
      }

      // Convert base64 dataUrl → Blob → File for multipart upload
      const dataUrl   = photos[selectedPhotoIndex];
      const res       = await fetch(dataUrl);
      const blob      = await res.blob();
      const file      = new File([blob], "photo.jpg", { type: "image/jpeg" });

      const formData  = new FormData();
      formData.append("visitor_id", visitor_id);
      formData.append("photo", file);

const { data } = await kioskApi.post("/ehs/visitor/photo", formData, {
            headers: { "Content-Type": "multipart/form-data" }
            });

      // Persist the server-confirmed photo_path so later screens
      // (InductionCompletion, ProfileChip) can display it.
      const kioskUserData = JSON.parse(sessionStorage.getItem("kioskUserData")) || {};
      kioskUserData.photo_path = data.photo_path;
      sessionStorage.setItem("kioskUserData", JSON.stringify(kioskUserData));

      // Keep a lightweight reference in session (no base64 bulk)
      kioskState.photoSaved = true;
      sessionStorage.setItem("kioskFlowState", JSON.stringify(kioskState));
      sessionStorage.removeItem("kioskPhotos"); // clear heavy base64 blobs

      // Photo is the last step of registration — this is the moment the
      // visitor is fully registered, so confirm it explicitly rather than
      // silently continuing on to training selection.
        stopCamera();
      setShowSuccessModal(true);
    } catch (err) {
      console.error("[PhotoCapture] upload error:", err);
      setError("Failed to save photo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="photo-capture-container">
<div className="photo-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <ProfileChip />
        </div>

        <h2>Photo Capture</h2>
        
        <p style={{ fontSize: 12, color: "#1A6B3C", background: "#eafaf1", border: "1px solid #cdeeda",
                    borderRadius: 8, padding: "8px 12px", marginBottom: 4 }}>
          🔒 Your photograph is collected under the DPDP Act consent you already provided,
          solely for facility access and EHS training records.
        </p>

        {error && <p className="error-message">{error}</p>}

        <div className="capture-section">
          <div className="camera-section">
            <div className="camera-display">
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="video-feed"
                style={{ display: cameraActive ? "block" : "none" }}
              />
              {!cameraActive && (
                <div className="camera-placeholder">
                  <p>📷 Camera Ready</p>
                  <p className="capture-count">Photos captured: {photos.length}/{MAX_PHOTOS}</p>
                </div>
              )}
              {cameraActive && (
                <p className="capture-count">{photos.length}/{MAX_PHOTOS}</p>
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            <div className="camera-controls">
              {!cameraActive ? (
                <button className="control-button primary" onClick={startCamera}>Start Camera</button>
              ) : (
                <>
                  <button className="control-button primary" onClick={capturePhoto} disabled={photos.length >= MAX_PHOTOS}>
                    📸 Capture Photo
                  </button>
                  <button className="control-button secondary" onClick={stopCamera}>Stop Camera</button>
                </>
              )}
              
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
            </div>
          </div>

          <div className="photos-gallery">
            <h3>Captured Photos ({photos.length}/{MAX_PHOTOS})</h3>
            {photos.length > 0 ? (
              <div className="photos-grid">
                {photos.map((photo, index) => (
                  <div key={index} className={`photo-item ${selectedPhotoIndex === index ? "selected" : ""}`}>
                    <img src={photo} alt={`Captured ${index + 1}`} onClick={() => setSelected(index)} />
                    <div className="photo-number">Photo {index + 1}</div>
                    <button className="delete-button" onClick={() => deletePhoto(index)}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-photos">No photos yet. Capture or upload to continue.</p>
            )}
          </div>
        </div>

        {selectedPhotoIndex !== null && (
          <div className="selection-info">
            <p>✓ Photo {selectedPhotoIndex + 1} selected</p>
          </div>
        )}

<div className="form-actions">
          <button className="submit-button" onClick={handleContinue} disabled={isLoading || selectedPhotoIndex === null}>
            {isLoading ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              </svg>
            ) : "Continue →"}
          </button>
          {/* <button className="back-button" onClick={() => navigate("/kiosk/details")} disabled={isLoading || cameraActive}>
            ← Back
          </button> */}
        </div>
      </div>

      {showSuccessModal && (
          <div className="pin-modal-overlay">
            <div className="pin-modal">
              <div className="pin-modal-icon">✅</div>
              <h2>Registration Successful</h2>
              <p className="pin-modal-sub">
                Your details and photo have been saved. You're now registered —
                let's continue to your safety training.
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default PhotoCapture;