// ============================================================
// VideoTraining.jsx  (updated — language-aware video fetch)
// Reads selectedLanguageId from kioskFlowState.
// Fetches video from /ehs/training/video?training_id=X&language_id=Y
// No skip/fast-forward allowed (custom player with maxReached guard).
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/VideoTraining.css";
import ProfileChip from "./ProfileChip";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";


const VideoTraining = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false);

  const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
  const trainingId = location.state?.trainingId || kioskState?.selectedTrainingId;
  const languageId = kioskState?.selectedLanguageId || 1;

  // ── QA/testing bypass — TEMPORARY, remove before production ──
  const QA_BYPASS_MOBILE = process.env.REACT_APP_QA_BYPASS_MOBILE || "8606652394";
  const kioskUserData = JSON.parse(sessionStorage.getItem("kioskUserData")) || {};
  const canSkipVideo  = kioskUserData?.contact_number === QA_BYPASS_MOBILE;

  const [module,      setModule]      = useState(null);
  const [videoUrl,    setVideoUrl]    = useState(null);   // resolved per language
  const [langName,    setLangName]    = useState(kioskState?.selectedLanguageName || "English");
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState("");
  const [videoWatched,setVideoWatched]= useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  // ── Custom player state ──────────────────────────────────
  const videoRef       = useRef(null);
  const maxReachedRef  = useRef(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [maxReached,   setMaxReached]   = useState(0);
  const [isMuted,      setIsMuted]      = useState(false);
  const [volume,       setVolume]       = useState(1);
  const [skipWarning,  setSkipWarning]  = useState(false);

  // ── Guards ───────────────────────────────────────────────
  useEffect(() => {
    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }
    if (!trainingId) {
      navigate("/kiosk/training-category", { replace: true });
      return;
    }
    // If no language selected, send back to language selection
    if (!kioskState.selectedLanguageId) {
      navigate("/kiosk/language", { replace: true });
    }
  }, [navigate]); // eslint-disable-line

  // ── Fetch module details + language-specific video ───────
  useEffect(() => {
    if (!trainingId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch module metadata
        const { data: moduleData } = await axios.get(
          `${API_BASE_URL}/ehs/training/modules`,
          { params: { training_id: trainingId } }
        );
        const mod = Array.isArray(moduleData) ? moduleData[0] : moduleData;
        if (!mod) { setError("Training module not found"); return; }
        setModule(mod);

        // Fetch language-specific video path
        try {
                const { data: vidData } = await axios.get(
                    `${API_BASE_URL}/ehs/training/video`,
                    { params: { training_id: trainingId, language_id: languageId } }
                );
                setVideoUrl(`${API_BASE_URL}/${vidData.video_path}`);
                // ← REMOVE: setLangName(vidData.language_name || langName);
                // langName is already correctly set from kioskState.selectedLanguageName
                } catch (vidErr) {
                // fallback to default video_path
                if (mod.video_path) {
                    setVideoUrl(`${API_BASE_URL}/${mod.video_path}`);
                }
                }

        setError("");
      } catch (err) {
        console.error("[VideoTraining] fetch error:", err);
        setError("Failed to load training video. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [trainingId, languageId, API_BASE_URL]); // eslint-disable-line

  // ── Custom player: no skip enforcement ───────────────────
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration || 0);
  };

  const handleTimeUpdate = () => {
  const vid = videoRef.current;
  if (!vid) return;
  const t = vid.currentTime;
  setCurrentTime(t);

  if (canSkipVideo) {
    // QA bypass — no skip restriction, just track progress
    if (t > maxReachedRef.current) {
      maxReachedRef.current = t;
      setMaxReached(t);
    }
    return;
  }

  if (t > maxReachedRef.current + 0.5) {
    vid.currentTime = maxReachedRef.current;
    showSkipWarning();
    return;
  }
  if (t > maxReachedRef.current) {
    maxReachedRef.current = t;
    setMaxReached(t);
  }
};

const handleSeek = (e) => {
  const vid = videoRef.current;
  if (!vid || !duration) return;
  const rect   = e.currentTarget.getBoundingClientRect();
  const ratio  = (e.clientX - rect.left) / rect.width;
  const target = ratio * duration;

  if (canSkipVideo) {
    vid.currentTime = target; // free seeking anywhere
    return;
  }

  if (target <= maxReachedRef.current + 0.5) {
    vid.currentTime = Math.min(target, maxReachedRef.current);
  } else {
    showSkipWarning();
  }
};

const handleEnded = () => {
    setVideoWatched(true);
    setIsPlaying(false);
    setShowCompletionPrompt(true);
    // Log video completion in kioskState
    const ks = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    ks.videoCompleted = true;
    sessionStorage.setItem("kioskFlowState", JSON.stringify(ks));
  };

  const handleReplay = () => {
    setShowCompletionPrompt(false);
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play();
    }
    setIsPlaying(true);
    // videoWatched / maxReached stay as-is — they've already earned full
    // credit for this module, replaying is just a free rewatch, not a
    // re-verification. No skip-restriction reset needed either since
    // maxReachedRef already covers the full duration.
  };

  const showSkipWarning = () => {
    setSkipWarning(true);
    setTimeout(() => setSkipWarning(false), 2500);
  };

  // ── Playback controls ─────────────────────────────────────
  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setIsPlaying(true); }
    else            { vid.pause(); setIsPlaying(false); }
  };



  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const progressPct   = duration ? (currentTime / duration) * 100 : 0;
  const maxReachedPct = duration ? (maxReached  / duration) * 100 : 0;

  // ── Proceed to quiz ───────────────────────────────────────
  const handleProceedToQuiz = () => {
    if (!videoWatched) {
      setError("Please watch the entire video before proceeding to the quiz.");
      return;
    }
    navigate("/kiosk/quiz", {
      state: { trainingId, languageId },
    });
  };

  // ── Render ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="vt-wrap">
        <div className="vt-card vt-loading">
          <svg className="vt-spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
          <p>Loading training video…</p>
        </div>
      </div>
    );
  }

  if (error && !module) {
    return (
      <div className="vt-wrap">
        <div className="vt-card vt-error">
          <p className="vt-error-msg">{error}</p>
          <button className="vt-btn" onClick={() => navigate("/kiosk/training-category")}>
            ← Back to categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vt-wrap">
      <div className="vt-card">

        <div className="vt-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 14, width: "auto" }} />
              NIPPON EXPRESS (INDIA) PRIVATE LIMITED
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="vt-lang-pill">🌐 {langName}</span>
              <span className="vt-badge">EHS Training Video</span>
              <ProfileChip />
            </div>
          </div>
        <div className="vt-hero">
          <div className="vt-video-area">
  {videoUrl ? (
    <>
      <video
        ref={videoRef}
        className="vt-player"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        /* NO controls prop */
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {skipWarning && (
        <div className="vt-skip-warning">⛔ Skipping ahead is not allowed</div>
      )}
      {videoWatched && (
        <div className="vt-watched-badge">✓ Video Watched</div>
      )}

      {/* Controls sit BELOW the video, inside same flex column */}
      <div className="vt-controls">
        <div className="vt-progress-track" onClick={handleSeek}>
          <div className="vt-progress-max"  style={{ width: `${maxReachedPct}%` }} />
          <div className="vt-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="vt-ctrl-row">
          <button className="vt-ctrl-btn" onClick={togglePlay}>
            {isPlaying
              ? <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            }
          </button>
          <span className="vt-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="vt-ctrl-spacer" />
          <button className="vt-ctrl-btn" onClick={toggleMute}>
            {isMuted
              ? <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17 19.73L18.73 21 20 19.73 5.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              : <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            }
          </button>
          <input
            type="range" min="0" max="1" step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            className="vt-volume-slider"
          />
          {/* ✅ Fullscreen INSIDE ctrl-row */}
          <button
            className="vt-ctrl-btn"
            onClick={() => videoRef.current?.requestFullscreen?.()}
            title="Fullscreen"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
          {canSkipVideo && (
            <button
              className="vt-ctrl-btn"
              style={{ background: "#c0392b", color: "#fff" }}
              onClick={() => {
                const vid = videoRef.current;
                if (vid) vid.currentTime = vid.duration - 0.1;
              }}
              title="QA: Skip to end"
            >
              ⏭ Skip
            </button>
          )}
        </div>
      </div>
    </>
  ) : (
    <div className="vt-placeholder">
      <div className="vt-play-ring">▶</div>
      <p className="vt-module-name">{module?.training_name || "Safety Training"}</p>
      <p className="vt-hint">Video not available for {langName}</p>
    </div>
  )}
</div>
</div>

        

        {error && <p className="vt-error-msg" style={{ padding: "0 1.5rem" }}>{error}</p>}

        {!videoWatched && videoUrl && (
          <div className="vt-warning">
            ⏱ Please watch the complete video before proceeding.
          </div>
        )}

        <div className="vt-actions">
          <button
            className="vt-btn primary"
            onClick={handleProceedToQuiz}
            disabled={!videoWatched && !!videoUrl}
          >
            Proceed to Quiz →
          </button>
          <button className="vt-btn" onClick={() => navigate("/kiosk/language")}>
            ← Back
          </button>
        </div>

     </div>

      {showCompletionPrompt && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "2.5rem 2rem",
            maxWidth: 380, width: "90%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1A005D", margin: "0 0 8px" }}>
              Video Complete
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#6b7280", marginBottom: "1.75rem" }}>
              You've finished watching. Would you like to watch it again before
              the quiz, or continue straight to the assessment?
            </p>
            <button
              onClick={() => { setShowCompletionPrompt(false); handleProceedToQuiz(); }}
              style={{
                width: "100%", padding: "0.85rem", background: "#1A6B3C", color: "#fff",
                border: "none", borderRadius: 10, fontSize: "1rem", fontWeight: 600,
                cursor: "pointer", marginBottom: 10,
              }}
            >
              Take the Quiz →
            </button>
            <button
              onClick={handleReplay}
              style={{
                width: "100%", padding: "0.75rem", background: "transparent", color: "#1A005D",
                border: "1.5px solid #d8dae8", borderRadius: 10, fontSize: "0.9rem",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              🔁 Replay Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTraining;