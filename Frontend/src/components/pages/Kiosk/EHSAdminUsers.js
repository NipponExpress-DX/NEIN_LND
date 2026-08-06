// src/pages/Kiosk/EHSAdminUsers.jsx
// Super-admin-only: create/edit HR accounts and assign them to a
// warehouse, or create another super admin. Route: /ehs/admin/users
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API   = process.env.REACT_APP_API_BASE_URL;
const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";

function getSession() {
  try { return JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
  catch { return null; }
}

const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 5 };
const btnPrimary = { padding: "9px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: "bold", cursor: "pointer" };
const btnGhost   = { padding: "9px 18px", background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer" };

export default function EHSAdminUsers() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [users, setUsers]     = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [credModal, setCredModal] = useState(null);
  const [form, setForm] = useState({ username: "", full_name: "", email: "", emp_id: "" });


  useEffect(() => {
    const s = getSession();
    if (!s?.token) { navigate("/ehs/admin/login", { replace: true }); return; }
    if (s.role !== "super_admin") { navigate("/ehs/admin", { replace: true }); return; }
    setSession(s);
    load(s.token);
  }, [navigate]);

  const load = async (token) => {
    setLoading(true);
    try {
      const [u, l] = await Promise.all([
        axios.get(`${API}/ehs/admin/users`,     { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/ehs/admin/locations`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUsers(u.data);
      setLocations(l.data);
    } catch (err) {
      console.error("[EHSAdminUsers] load error:", err);
    } finally {
      setLoading(false);
    }
  };

 const resetForm = () => {
  setForm({ username: "", full_name: "", email: "", role: "hr", location_code: "", emp_id: "" });
  setShowForm(false); setError("");
};
const handleEmpIdLookup = async () => {
  if (!form.emp_id.trim()) return;
  try {
    const { data } = await axios.get(
      `${API}/ehs/admin/lookup-employee/${form.emp_id.trim()}`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    setForm(f => ({
      ...f,
      full_name: data.full_name || f.full_name,
      email: data.email || f.email,
    }));
    setError("");
  } catch (err) {
    // Not found isn't necessarily an error — could be a non-corporate
    // admin account being created manually. Let them type it in.
    if (err.response?.status !== 404) {
      console.warn("[EHSAdminUsers] lookup failed:", err);
    }
  }
};

  const handleSubmit = async () => {
  if (!form.emp_id.trim() || !form.full_name.trim() || !form.email.trim()) {
    setError("Emp ID, full name and email are required."); return;
  }
  setSaving(true); setError("");
  try {
    const { data } = await axios.post(`${API}/ehs/admin/users`, {
      username: form.username.trim(),
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      emp_id: form.emp_id.trim() || null,
    }, { headers: { Authorization: `Bearer ${session.token}` } });

    setCredModal({ username: data.username, temp_password: data.temp_password });
    resetForm();
    load(session.token);
  } catch (err) {
    setError(err.response?.data?.error || "Failed to create account.");
  } finally {
    setSaving(false);
  }
};

  const toggleActive = async (u) => {
    try {
      await axios.patch(`${API}/ehs/admin/users/${u.id}`, { active: u.active ? 0 : 1 },
        { headers: { Authorization: `Bearer ${session.token}` } });
      load(session.token);
    } catch { alert("Failed to update account status."); }
  };

  const handleResetPassword = async (u) => {
    if (!window.confirm(`Reset password for ${u.full_name}?`)) return;
    try {
      const { data } = await axios.patch(`${API}/ehs/admin/users/${u.id}`, { reset_password: true },
        { headers: { Authorization: `Bearer ${session.token}` } });
      setCredModal({ username: u.username, temp_password: data.temp_password });
      load(session.token);
    } catch { alert("Failed to reset password."); }
  };

  const reassignLocation = async (u, newCode) => {
    try {
      await axios.patch(`${API}/ehs/admin/users/${u.id}`, { location_code: newCode },
        { headers: { Authorization: `Bearer ${session.token}` } });
      load(session.token);
    } catch { alert("Failed to reassign warehouse."); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: GREEN, color: "#fff", padding: "14px 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
       <span style={{ fontWeight: "bold", fontSize: 16 }}>👥 EHS Admin — Manage Admin Accounts</span>

        <button onClick={() => navigate(sessionStorage.getItem("ehsWorkerSession") ? "/ehs/workspace" : "/ehs/admin")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                   padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          ← Back to Verifications
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee",
                        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>Accounts</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                HR accounts only see and approve completions for their assigned warehouse. Super admins see everything.
              </p>
            </div>
            {!showForm && (
              <button style={btnPrimary} onClick={() => setShowForm(true)}>+ Add Account</button>
            )}
          </div>

          {showForm && (
            <div style={{ padding: "18px 20px", background: "#f9fafc", borderBottom: "1px solid #eee" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                  <label style={labelStyle}>Emp ID</label>
                  <input
                    style={inputStyle}
                    value={form.emp_id}
                    onChange={e => setForm(f => ({ ...f, emp_id: e.target.value }))}
                    onBlur={handleEmpIdLookup}
                  />
                </div>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input style={inputStyle} value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input style={inputStyle} type="email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Role</label>
                    <select style={inputStyle} value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="hr">HR (single warehouse)</option>
                      <option value="super_admin">Super Admin (all warehouses)</option>
                    </select>
                  </div>
                  {form.role === "hr" && (
                    <div>
                      <label style={labelStyle}>Warehouse</label>
                      <select style={inputStyle} value={form.location_code}
                        onChange={e => setForm(f => ({ ...f, location_code: e.target.value }))}>
                        <option value="">Select warehouse…</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.location_code}>{l.location_name} ({l.location_code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              {error && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 10 }}>{error}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
                  {saving ? "Creating…" : "Create Account"}
                </button>
                <button style={btnGhost} onClick={resetForm} disabled={saving}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading accounts…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>No accounts yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: NAVY, color: "#fff" }}>
                  {["Name", "Username", "Role","Warehouses", "Status", "Last Login", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "10px 14px", fontWeight: "bold", color: NAVY }}>{u.full_name}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>{u.username}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                     background: u.role === "super_admin" ? "#e8f3ff" : "#f0f0f0",
                                     color: u.role === "super_admin" ? NAVY : "#555" }}>
                        {u.role === "super_admin" ? "Super Admin" : "HR"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {u.role === "super_admin" ? (
                        <span style={{ color: "#aaa" }}>All warehouses</span>
                      ) : (
                        <select value={u.location_code || ""} onChange={e => reassignLocation(u, e.target.value)}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }}>
                          {locations.map(l => (
                            <option key={l.id} value={l.location_code}>{l.location_name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                     background: u.active ? "#edf9f0" : "#fff0f0",
                                     color: u.active ? GREEN : "#912b2b" }}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                      {!!u.must_change_password && (
                        <div style={{ fontSize: 10, color: "#92570a", marginTop: 3 }}>⚠ Awaiting first login</div>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#555", fontSize: 12 }}>
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString("en-IN") : "Never"}
                    </td>
                    <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                      <button onClick={() => handleResetPassword(u)} style={{ ...btnGhost, padding: "5px 12px" }}>
                        Reset Password
                      </button>
                      <button onClick={() => toggleActive(u)}
                        style={{ ...btnGhost, padding: "5px 12px", color: u.active ? "#c0392b" : GREEN }}>
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {credModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "32px 36px", width: 380, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <h2 style={{ margin: "0 0 6px", color: NAVY, fontSize: 18 }}>Account Credentials</h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 18 }}>
              They can now log in instantly via LND → "EHS Kiosk" using their existing emp_id — no password needed.
              These credentials are only a backup for logging in directly at /ehs/admin/login if needed.
            </p>
            <div style={{ background: "#f4f6fb", borderRadius: 8, padding: "14px 16px", marginBottom: 8, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Username</div>
              <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: "bold", color: NAVY }}>{credModal.username}</div>
            </div>
            <div style={{ background: "#f4f6fb", borderRadius: 8, padding: "14px 16px", marginBottom: 18, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Temporary Password</div>
              <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: "bold", color: GREEN }}>{credModal.temp_password}</div>
            </div>
            <p style={{ fontSize: 11, color: "#c0392b", marginBottom: 18 }}>⚠️ Shown only once.</p>
            <button style={{ ...btnPrimary, width: "100%" }} onClick={() => setCredModal(null)}>
              Noted — Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}