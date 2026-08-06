// src/pages/Kiosk/EHSWarehouseAdmin.jsx
//
// Admin-only screen: create warehouses (+ their HR contact) and
// kiosk device logins, without touching phpMyAdmin.
//
// - "Warehouses & HR" tab: add/edit warehouse + which HR email gets
//   the completion notifications for that warehouse.
// - "Kiosk Devices" tab: create a kiosk login tied to a warehouse.
//   The system generates a one-time temp password (shown once, in
//   a modal — same pattern as the visitor PIN screen). The kiosk is
//   forced to set its own real password the first time it activates.
//
// Route suggestion: /kiosk/admin/warehouses (protected — same admin
// auth as EHSAdminDashboard).

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL;
const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";

function getSession() {
  try { return JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
  catch { return null; }
}
function authHeaders() {
  const s = getSession();
  return { Authorization: `Bearer ${s?.token}` };
}

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #ddd",
  borderRadius: 6, fontSize: 13, boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 5 };
const btnPrimary = {
  padding: "9px 18px", background: GREEN, color: "#fff", border: "none",
  borderRadius: 6, fontSize: 13, fontWeight: "bold", cursor: "pointer",
};
const btnGhost = {
  padding: "9px 18px", background: "#fff", color: "#555", border: "1px solid #ddd",
  borderRadius: 6, fontSize: 13, cursor: "pointer",
};

export default function EHSWarehouseAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("warehouses"); // warehouses | devices

  useEffect(() => {
    const session = getSession();
    if (!session?.token) {
      navigate("/ehs/admin/login", { replace: true });
      return;
    }
    if (session.role !== "super_admin") {
      navigate("/ehs/admin", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: GREEN, color: "#fff", padding: "14px 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>🏭 EHS Admin — Warehouses &amp; Kiosk Logins</span>
      <button onClick={() => navigate(sessionStorage.getItem("ehsWorkerSession") ? "/ehs/workspace" : "/ehs/admin")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                   padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          ← Back to Verifications
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "warehouses", label: "🏢 Warehouses" },
            { key: "devices",    label: "🖥️ Kiosk Devices" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                       border: tab === t.key ? `2px solid ${GREEN}` : "1px solid #ddd",
                       background: tab === t.key ? "#e8f7ee" : "#fff",
                       color: tab === t.key ? GREEN : "#444",
                       fontWeight: tab === t.key ? "bold" : "normal" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "warehouses" ? <WarehousesPanel /> : <DevicesPanel />}
      </div>
    </div>
  );
}

// ============================================================
// Warehouses & HR panel
// ============================================================
function WarehousesPanel() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [form, setForm] = useState({ location_code: "", location_name: "" });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/ehs/admin/locations`, { headers: authHeaders() });
      setLocations(data);
    } catch (err) {
      console.error("[WarehousesPanel] load error:", err);
      setError("Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ location_code: "", location_name: "", hr_name: "", hr_email: "", cc_email: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (loc) => {
      setForm({ location_code: loc.location_code, location_name: loc.location_name });
      setEditingId(loc.id);
      setShowForm(true);
    };

  const handleSubmit = async () => {
    if (!form.location_name.trim()) {
      setError("Warehouse name is required.");
      return;
    }
    if (!editingId && !form.location_code.trim()) {
      setError("Location code is required.");
      return;
    }
    setSaving(true); setError("");
    try {
      if (editingId) {
        await axios.patch(`${API}/ehs/admin/locations/${editingId}`, {
          location_name: form.location_name.trim(),
        }, { headers: authHeaders() });
      } else {
        await axios.post(`${API}/ehs/admin/locations`, {
          location_code: form.location_code.trim(),
          location_name: form.location_name.trim(),
        }, { headers: authHeaders() });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save warehouse.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (loc) => {
    try {
      await axios.patch(`${API}/ehs/admin/locations/${loc.id}`, { active: loc.active ? 0 : 1 },
        { headers: authHeaders() });
      load();
    } catch {
      alert("Failed to update warehouse status.");
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>Warehouses</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            Add each warehouse you're rolling this out to, and which HR contact should get induction-completion emails for it.
          </p>
        </div>
        {!showForm && (
          <button style={btnPrimary} onClick={() => setShowForm(true)}>+ Add Warehouse</button>
        )}
      </div>

      {showForm && (
        <div style={{ padding: "18px 20px", background: "#f9fafc", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Location {editingId && "(fixed)"}</label>
              <input style={{ ...inputStyle, ...(editingId ? { background: "#eee", color: "#888" } : {}) }}
                placeholder="e.g. Mumbai" value={form.location_code} disabled={!!editingId}
                onChange={e => setForm(f => ({ ...f, location_code: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Warehouse Name</label>
              <input style={inputStyle} placeholder="e.g. Mumbai Warehouse 2"
                value={form.location_name}
                onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} />
            </div>
          </div>
          {error && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Warehouse"}
            </button>
            <button style={btnGhost} onClick={resetForm} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading warehouses…</div>
      ) : locations.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
          No warehouses yet. Add one to get started.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            
          </thead>
          <tbody>
            {locations.map((loc, i) => (
              <tr key={loc.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#555" }}>{loc.location_code}</td>
                <td style={{ padding: "10px 14px", fontWeight: "bold", color: NAVY }}>{loc.location_name}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                background: loc.active ? "#edf9f0" : "#fff0f0",
                                color: loc.active ? GREEN : "#912b2b" }}>
                    {loc.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(loc)} style={{ ...btnGhost, padding: "5px 12px" }}>Edit</button>
                  <button onClick={() => toggleActive(loc)}
                    style={{ ...btnGhost, padding: "5px 12px", color: loc.active ? "#c0392b" : GREEN }}>
                    {loc.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// Kiosk Devices panel
// ============================================================
function DevicesPanel() {
  const [devices, setDevices]   = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [form, setForm] = useState({ device_name: "", location_code: "", username: "" });
  const [credModal, setCredModal] = useState(null); // { username, temp_password }

  const load = async () => {
    setLoading(true);
    try {
      const [devRes, locRes] = await Promise.all([
        axios.get(`${API}/ehs/admin/kiosk-devices`, { headers: authHeaders() }),
        axios.get(`${API}/ehs/admin/locations`, { headers: authHeaders() }),
      ]);
      setDevices(devRes.data);
      setLocations(locRes.data.filter(l => l.active));
    } catch (err) {
      console.error("[DevicesPanel] load error:", err);
      setError("Failed to load kiosk devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ location_code: "", location_name: "" });
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.device_name.trim() || !form.location_code || !form.username.trim()) {
      setError("Device name, warehouse and username are all required.");
      return;
    }
    setSaving(true); setError("");
    try {
      const { data } = await axios.post(`${API}/ehs/admin/kiosk-devices`, {
        device_name: form.device_name.trim(),
        location_code: form.location_code,
        username: form.username.trim(),
      }, { headers: authHeaders() });

      setCredModal({ username: data.username, temp_password: data.temp_password });
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create kiosk device.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (device) => {
    if (!window.confirm(`Reset the password for "${device.device_name}"? The kiosk will need to log in again with a new temp password.`))
      return;
    try {
      const { data } = await axios.post(`${API}/ehs/admin/kiosk-devices/${device.id}/reset-password`, {},
        { headers: authHeaders() });
      setCredModal({ username: device.username, temp_password: data.temp_password });
      load();
    } catch {
      alert("Failed to reset password.");
    }
  };

  const toggleActive = async (device) => {
    try {
      await axios.patch(`${API}/ehs/admin/kiosk-devices/${device.id}`, { active: device.active ? 0 : 1 },
        { headers: authHeaders() });
      load();
    } catch {
      alert("Failed to update device status.");
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>Kiosk Devices</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            Create a login for each physical kiosk. A temp password is generated automatically — the kiosk
            must set its own password the first time it's activated.
          </p>
        </div>
        {!showForm && (
          <button style={btnPrimary} onClick={() => setShowForm(true)} disabled={locations.length === 0}>
            + Add Kiosk Device
          </button>
        )}
      </div>

      {locations.length === 0 && !loading && (
        <div style={{ padding: "14px 20px", background: "#fff7e6", color: "#92570a", fontSize: 13 }}>
          ⚠️ Add at least one warehouse in the "Warehouses & HR" tab before creating a kiosk device.
        </div>
      )}

      {showForm && (
        <div style={{ padding: "18px 20px", background: "#f9fafc", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Device Name</label>
              <input style={inputStyle} placeholder="e.g. Mumbai WH Gate 1 Kiosk"
                value={form.device_name}
                onChange={e => setForm(f => ({ ...f, device_name: e.target.value }))} />
            </div>
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
            <div>
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} placeholder="e.g. kiosk_mum_wh2"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
          </div>
          {error && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating…" : "Create Kiosk Device"}
            </button>
            <button style={btnGhost} onClick={resetForm} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading kiosk devices…</div>
      ) : devices.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>No kiosk devices yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: NAVY, color: "#fff" }}>
              {["Device", "Warehouse", "Username", "Password", "Last Login", "Status", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "10px 14px", fontWeight: "bold", color: NAVY }}>{d.device_name}</td>
                <td style={{ padding: "10px 14px" }}>{d.location_name || d.location_code}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>{d.username}</td>
                <td style={{ padding: "10px 14px" }}>
                  {d.must_change_password ? (
                    <span style={{ fontSize: 11, color: "#92570a", fontWeight: "bold" }}>⚠ Awaiting first login</span>
                  ) : (
                    <span style={{ fontSize: 11, color: GREEN }}>✓ Set by kiosk</span>
                  )}
                </td>
                <td style={{ padding: "10px 14px", color: "#555", fontSize: 12 }}>
                  {d.last_login_at ? new Date(d.last_login_at).toLocaleString("en-IN") : "Never"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                 background: d.active ? "#edf9f0" : "#fff0f0",
                                 color: d.active ? GREEN : "#912b2b" }}>
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  <button onClick={() => handleResetPassword(d)} style={{ ...btnGhost, padding: "5px 12px" }}>
                    Reset Password
                  </button>
                  <button onClick={() => toggleActive(d)}
                    style={{ ...btnGhost, padding: "5px 12px", color: d.active ? "#c0392b" : GREEN }}>
                    {d.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── One-time credential reveal modal ── */}
      {credModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "32px 36px", width: 380, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <h2 style={{ margin: "0 0 6px", color: NAVY, fontSize: 18 }}>Kiosk Login Created</h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 18 }}>
              Give these to whoever is setting up this kiosk. They'll be asked to set a new password the first time they log in.
            </p>
            <div style={{ background: "#f4f6fb", borderRadius: 8, padding: "14px 16px", marginBottom: 8, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Username</div>
              <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: "bold", color: NAVY }}>{credModal.username}</div>
            </div>
            <div style={{ background: "#f4f6fb", borderRadius: 8, padding: "14px 16px", marginBottom: 18, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Temporary Password</div>
              <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: "bold", color: GREEN }}>{credModal.temp_password}</div>
            </div>
            <p style={{ fontSize: 11, color: "#c0392b", marginBottom: 18 }}>
              ⚠️ This password will not be shown again. Note it down now.
            </p>
            <button style={{ ...btnPrimary, width: "100%" }} onClick={() => setCredModal(null)}>
              I've noted it down — Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}