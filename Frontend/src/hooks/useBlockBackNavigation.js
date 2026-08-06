import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Traps browser/hardware back button on the current screen.
 * Instead of trying to "go forward N" through the history stack
 * (fragile — depends on exact stack shape), it forcibly replaces
 * the router's current route back to where we already are,
 * no matter how many entries the back-press consumed.
 */
export function useBlockBackNavigation(active, onBack) {
  const navigate = useNavigate();
  const location = useLocation();

  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const pathRef = useRef(location.pathname + location.search);
  pathRef.current = location.pathname + location.search;

  useEffect(() => {
    if (!active) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      const allow = onBackRef.current ? onBackRef.current() : false;
      if (!allow) {
        // Re-plant a dummy entry so the NEXT back-press is trapped too
        window.history.pushState(null, "", window.location.href);
        // Force the router itself back to this exact screen —
        // regardless of how far back the browser just jumped.
        navigate(pathRef.current, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [active, navigate]); // intentionally NOT depending on onBack/location
}