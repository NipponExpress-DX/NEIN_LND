// KioskEntry.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_MAX_HOURS = 12;

const KioskEntry = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if a visitor session exists
    let existingSession = null;

    try {
      existingSession = JSON.parse(
        sessionStorage.getItem("ehsWorkerSession")
      );
    } catch {
      existingSession = null;
    }

    // Check whether the stored session has expired
    const isStale =
      existingSession?.created_at &&
      Date.now() - new Date(existingSession.created_at).getTime() >
        SESSION_MAX_HOURS * 60 * 60 * 1000;

    // Expired session -> clear it
    if (isStale) {
      sessionStorage.removeItem("ehsWorkerSession");
      existingSession = null;
    }

    // Valid session -> go directly to dashboard
    if (existingSession?.visitor_id) {
      navigate(`/ehs/dashboard/${existingSession.visitor_id}`, {
        replace: true,
      });
      return;
    }

    // New visitor -> start kiosk flow
    sessionStorage.removeItem("userDetails");
    sessionStorage.removeItem("kioskCompletionLock");

    sessionStorage.setItem(
      "kioskFlowState",
      JSON.stringify({
        entrySource: "direct",
      })
    );

    navigate("/kiosk/inductiontype", { replace: true });
  }, [navigate]);

  return null;
};

export default KioskEntry;