// src/pages/Kiosk/EHSLayout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";

// Wraps all /ehs/* routes. The global body padding-top (80px, set in
// Header.css) exists only to clear the LND fixed Header — EHS pages
// don't render that Header, so we strip the offset while any EHS
// route is mounted, and restore it automatically on unmount.
export default function EHSLayout() {
  useEffect(() => {
    document.body.classList.add("ehs-no-header-offset");
    return () => document.body.classList.remove("ehs-no-header-offset");
  }, []);

  return <Outlet />;
}