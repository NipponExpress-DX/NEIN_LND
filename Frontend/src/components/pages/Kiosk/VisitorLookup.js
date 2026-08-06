// src/pages/Kiosk/VisitorLookup.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kioskApi from "../../../utils/kioskApi";
import { LOOKUP_AUTH_KEY, LOOKUP_AUTH_TTL_MS } from "./VisitorLookupLogin";

const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";
const RED   = "#c0392b";
const AMBER = "#92570a";

const fmtDT = d => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export default function VisitorLookup() {
  const navigate = useNavigate();
  const [term, setTerm]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [summary, setSummary] = useState(null);
  const [visitors, setVisitors] = useState(null); // null = no search run yet
  const [expanded, setExpanded] = useState({});

   const runSearch = async (searchTerm) => {
    const t = (searchTerm ?? term).trim();
    if (t.length > 0 && t.length < 3) { setError("Enter at least 3 characters, or clear the box to see everyone"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await kioskApi.get("/ehs/kiosk/visitor-lookup", { params: { search: t } });
      setSummary(data.summary);
      setVisitors(data.visitors);
      setExpanded({});
    } catch (err) {
      setError(err.response?.data?.error || "Search failed. Please try again.");
      setVisitors(null);
    } finally {
      setLoading(false);
    }
  };
// ── Auth guard — must have passed lookup-auth recently ─────
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(LOOKUP_AUTH_KEY));
      const fresh  = stored?.ts && (Date.now() - stored.ts) < LOOKUP_AUTH_TTL_MS;
      if (!fresh) {
        sessionStorage.removeItem(LOOKUP_AUTH_KEY);
        navigate("/kiosk/lookup-login", { replace: true });
      }
    } catch {
      navigate("/kiosk/lookup-login", { replace: true });
    }
  }, [navigate]);
  // Load the full pan-India list as soon as the screen opens
  useEffect(() => { runSearch(""); }, []); 

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const statCard = (label, value, color) => (
    <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", flex: 1,
                  border: "1px solid #e0e0e0", borderTop: `4px solid ${color}`, minWidth: 120 }}>
      <div style={{ fontSize: 24, fontWeight: "bold", color }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: GREEN, color: "#fff", padding: "14px 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>🔍 Visitor Lookup — Security</span>
        <button onClick={() => navigate("/kiosk/inductiontype")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                   padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0",
                      padding: "18px 20px", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 4px", color: NAVY, fontSize: 15 }}>Search all registered visitors</h3>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#888" }}>
            Pan-India — searches by name, mobile number, or employee ID, across every warehouse.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="Name, mobile number, or employee ID… (leave blank to see everyone)"
              value={term}
              onChange={e => setTerm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSearch()}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
            />
            {term && (
              <button
                onClick={() => { setTerm(""); runSearch(""); }}
                disabled={loading}
                style={{ padding: "10px 16px", background: "#fff", color: "#888", border: "1px solid #ddd",
                         borderRadius: 8, fontSize: 13, cursor: "pointer" }}
              >
                Clear
              </button>
            )}
            <button onClick={() => runSearch()} disabled={loading}
              style={{ padding: "10px 22px", background: GREEN, color: "#fff", border: "none",
                       borderRadius: 8, fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          {error && <p style={{ color: RED, fontSize: 12, marginTop: 10 }}>{error}</p>}
        </div>
          <button onClick={() => { sessionStorage.removeItem(LOOKUP_AUTH_KEY); navigate("/kiosk/inductiontype"); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                    padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            ← Back
          </button>
        {summary && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {statCard("Total Registered", summary.total_registered, NAVY)}
            {statCard("Verified", summary.verified, GREEN)}
            {statCard("Pending", summary.pending, AMBER)}
            {statCard("Rejected", summary.rejected, RED)}
            {statCard("Trainings Taken", summary.total_trainings_taken, "#185fa5")}
          </div>
        )}

        {visitors && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee" }}>
              <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>
                {term ? "Search Results" : "All Registered Visitors"}
                {" "}({visitors.length}{visitors.length === 100 ? "+ — refine search" : ""})
              </h3>
            </div>

            {visitors.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#888" }}>No visitors matched that search.</div>
            ) : (
              visitors.map(v => (
                <div key={v.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => toggleExpand(v.id)}
                    style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between",
                             alignItems: "center", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14 }}>{v.full_name}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                          {v.visitor_type} · {v.contact_number || "—"}
                          {v.employee_id && ` · ID: ${v.employee_id}`}
                          {" · "}{v.location_code || "—"}
                          {" · Registered "}{fmtDT(v.created_at)}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>
                        {v.completions.length} training{v.completions.length !== 1 ? "s" : ""}
                      </span>
                      <span style={{ fontSize: 12, color: "#888" }}>{expanded[v.id] ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {expanded[v.id] && (
                    <div style={{ padding: "0 20px 16px" }}>
                      {v.completions.length === 0 ? (
                        <p style={{ fontSize: 12, color: "#aaa" }}>No training history yet.</p>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "#f7f8fa" }}>
                             {["Module", "Location", "Result", "Completed", "Status"].map(h => (
                                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#666" }}>{h}</th>
                                ))}
                            
                            </tr>
                          </thead>
                          <tbody>
                            {v.completions.map((c, i) => (
                              <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "8px 10px" }}>{c.training_name || "—"}</td>
                                <td style={{ padding: "8px 10px" }}>{c.location_code || "—"}</td>
                                <td style={{ padding: "8px 10px", color: c.passed ? GREEN : RED }}>
                                  {c.passed ? "✅ Pass" : "❌ Fail"}
                                </td>
                                <td style={{ padding: "8px 10px" }}>{fmtDT(c.completed_at)}</td>
                                <td style={{ padding: "8px 10px" }}>
                                  {c.verification_status === "Verified" ? "✓ Verified"
                                    : c.verification_status === "Rejected" ? "✕ Rejected"
                                    : "📝 Submitted"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}