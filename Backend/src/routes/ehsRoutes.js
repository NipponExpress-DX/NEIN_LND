// ============================================================
    // src/routes/ehsRoutes.js (UPDATED)
    // Mount: app.use("/ehs", require("./src/routes/ehsRoutes"));
    // ============================================================

    const express = require("express");
    const router  = express.Router();
    const multer  = require("multer");
    const path    = require("path");
    const fs      = require("fs");
    const bcrypt = require("bcryptjs");
    const crypto = require("crypto");
    const autoSendMail = require('../controllers/planning/sendmail'); // Ensure this is implemented
    const { hrmdb, leavemanagement } = require("../../configuration/db");
    // ── Multer setup ─────────────────────────────────────────────
    const uploadDir = path.join(__dirname, "../../uploads/ehs");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename:    (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `ehs_${Date.now()}${ext}`);
    },
    });
    const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
    },
    });

    // ── Promisify hrmdb.query ─────────────────────────────────────
    function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        hrmdb.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
        });
    });
    }
function leaveQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    leavemanagement.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
    // ============================================================
    // Helper — generate a random human-typeable temp password
    // (avoids ambiguous chars like 0/O, 1/l/I)
    // ============================================================
   function generateTempPassword() {
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      let pass = "";
      for (let i = 0; i < 10; i++) pass += chars[crypto.randomInt(0, chars.length)];
      return pass;
    }

    // ============================================================
    // Helper — deterministic visitor login PIN
    // First 4 letters of full_name (uppercase, padded with X if
    // shorter) + last 4 digits of contact_number.
    // ============================================================
    function generatePin(full_name, contact_number) {
      const lettersOnly = (full_name || "").toUpperCase().replace(/[^A-Z]/g, "");
      const namePart = (lettersOnly + "XXXX").slice(0, 4);
      const digitsOnly = (contact_number || "").replace(/\D/g, "");
      const numPart = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : digitsOnly.padStart(4, "0");
      return `${namePart}${numPart}`;
    }
    // ============================================================
// Middleware — requireAdminAuth
// Validates the admin/HR session token against ehs_admin_sessions.
// Attaches req.admin = { id, role, location_code, full_name, email }
// ============================================================
async function requireAdminAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Admin authentication required" });

  try {
    const [row] = await query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.location_code, u.active
       FROM ehs_admin_sessions s
       JOIN ehs_admin_users u ON u.id = s.admin_id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );
    if (!row || !row.active) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    req.admin = row;          // { id, username, full_name, email, role, location_code, active }
    req.adminId = row.id;     // kept for existing audit-log calls that reference req.adminId
    next();
  } catch (err) {
    console.error("[EHS] requireAdminAuth error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}

// ============================================================
// Middleware — requireSuperAdmin
// Use on top of requireAdminAuth for locations / kiosk-devices /
// admin-user-management / cross-location reports.
// ============================================================
function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

    // ============================================================
    // POST /ehs/visitor/register
    // Kiosk users only. Photo comes later via /visitor/photo.
    // Body (multipart/form-data): full_name, contact_number,
    //   visitor_type, employee_id (optional)
    // Returns: { visitor_id }
    // ============================================================
    // Replaces requireKioskSession for this one route — tries to resolve
// kiosk device context if present, but never rejects the request.
// Corporate + returning-visitor flows legitimately have no kiosk token.
async function optionalKioskSession(req, res, next) {
  const token = req.headers["x-kiosk-token"];
  if (!token) { req.kioskLocation = null; return next(); }

  try {
    const [row] = await query(
      `SELECT s.device_id, d.location_code
       FROM ehs_kiosk_sessions s
       JOIN ehs_kiosk_devices d ON d.id = s.device_id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );
    req.kioskDeviceId = row?.device_id || null;
    req.kioskLocation = row?.location_code || null;
  } catch (err) {
    console.error("[EHS] optionalKioskSession error:", err);
    req.kioskLocation = null;
  }
  next();
}
// ============================================================
// POST /ehs/visitor/register
// Kiosk users only. Photo comes later via /visitor/photo.
// Body (multipart/form-data): full_name, contact_number,
//   visitor_type, employee_id (optional), date_of_birth
// Returns: { visitor_id, pin }
// ============================================================
router.post("/visitor/register", requireKioskSession, upload.none(), async (req, res) => {
  const { full_name, contact_number, employee_id, visitor_type, consent_id } = req.body;
  const location_code = req.kioskLocation || null;

  if (!full_name || !contact_number || !visitor_type || !consent_id)
    return res.status(400).json({ error: "full_name, contact_number, visitor_type and consent_id are required" });

  const allowed = ["Customer", "Associate", "Driver", "Others"];
  if (!allowed.includes(visitor_type))
    return res.status(400).json({ error: `visitor_type must be one of: ${allowed.join(", ")}` });

  const pin = generatePin(full_name, contact_number);

  try {
    const result = await query(
      `INSERT INTO ehs_kiosk_visitors
       (full_name, contact_number, employee_id, visitor_type, pin, location_code, consent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, contact_number, employee_id || null, visitor_type, pin, location_code, consent_id]
    );

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'kiosk', 'VISITOR_REGISTERED', ?)`,
      [result.insertId, JSON.stringify({ visitor_type })]
    ).catch(e => console.warn("[EHS] audit log failed:", e));

    return res.status(201).json({ visitor_id: result.insertId, pin });
  } catch (err) {
    console.error("[EHS] visitor/register error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

        // ============================================================
// POST /ehs/auth/corporate-session
// Called right after PathSelection → "EHS Kiosk" for a corporate
// (LND-authenticated) employee. Finds their existing ehs_kiosk_visitors
// row by employee_id, or auto-creates a stub one on their very first
// visit — same upsert pattern already used in /ehs/induction/complete.
// Issues an ehs_sessions token exactly like /auth/verify-pin does, so
// EHSDashboard.jsx works unmodified for corporate users.
//
// ⚠️ SECURITY: wrap this with your existing LND auth middleware
// (whatever validates the corporate JWT/session elsewhere in the app)
// before shipping — right now it trusts emp_id from the request body,
// so anyone could pass an arbitrary emp_id and view another employee's
// EHS dashboard.
// ============================================================
router.post("/auth/corporate-session", async (req, res) => {
  const { emp_id, full_name, contact_number, branch_code } = req.body;  // ← branch_code, not location_code
  if (!emp_id) return res.status(400).json({ error: "emp_id is required" });

  try {
    // Resolve EHS location_code from the LND branch_code via the mapping column
    let location_code = null;
    if (branch_code) {
      const [loc] = await query(
        `SELECT location_code FROM ehs_location_hr WHERE lnd_branch_code = ? AND active = 1 LIMIT 1`,
        [branch_code]
      );
      location_code = loc?.location_code || null;
    }

    let [worker] = await query(
      `SELECT id, full_name, visitor_type, photo_path
       FROM ehs_kiosk_visitors WHERE employee_id = ? LIMIT 1`,
      [emp_id]
    );

    if (!worker) {
        const result = await query(
            `INSERT INTO ehs_kiosk_visitors (full_name, employee_id, visitor_type, contact_number, location_code)
            VALUES (?, ?, 'Employee', ?, ?)`,
            [full_name || emp_id, emp_id, contact_number || "", location_code]
        );
        worker = { id: result.insertId, full_name: full_name || emp_id, visitor_type: "Employee", photo_path: null };
        } else {
        // Existing worker — backfill name and/or location if either is missing/stale
        const updates = [];
        const params = [];
        if (full_name && worker.full_name === emp_id) {
            updates.push("full_name = ?"); params.push(full_name);
            worker.full_name = full_name;
        }
        if (location_code) {
            updates.push("location_code = ?"); params.push(location_code);
        }
        if (updates.length) {
            params.push(worker.id);
            await query(`UPDATE ehs_kiosk_visitors SET ${updates.join(", ")} WHERE id = ?`, params);
        }
        }
    const token = Buffer.from(`${worker.id}:${Date.now()}:ehs`).toString("base64");
    await query(
      `INSERT INTO ehs_sessions (visitor_id, token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))
       ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 8 HOUR)`,
      [worker.id, token, token]
    );

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'corporate', 'EHS_CORPORATE_SESSION_ISSUED', ?)`,
      [emp_id, JSON.stringify({ visitor_id: worker.id })]
    ).catch(() => {});

     return res.json({
      ok: true, visitor_id: worker.id, token, full_name: worker.full_name,
      visitor_type: worker.visitor_type, photo_path: worker.photo_path,
      location_code,   // ← now resolved, not just echoed from client input
    });
  } catch (err) {
    console.error("[EHS] auth/corporate-session error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});
// ============================================================
// ADMIN — Warehouse / Location + HR mapping
// Super-admin only — HR accounts must never create/edit warehouses
// or see the full cross-location list.
// ============================================================


// ============================================================
// GET /ehs/admin/lookup-employee/:emp_id
// Auto-fill helper for the "Add Admin Account" form — looks up
// name/email/branch from the LND employee master (leavemanagement.user)
// so HR doesn't have to retype details that already exist there.
// Read-only, super-admin only.
// ============================================================
router.get("/admin/lookup-employee/:emp_id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const rows = await leaveQuery(
      `SELECT u.full_name, u.email, u.emp_id, bm.branch_code
       FROM leavemanagement.user u
       JOIN leavemanagement.branchmaster bm ON u.branch_id = bm.branch_id
       WHERE u.emp_id = ? AND u.employee_status = 'yes'
       LIMIT 1`,
      [req.params.emp_id]
    );
    if (!rows.length) return res.status(404).json({ error: "Employee not found or inactive" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("[EHS] lookup-employee error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


// GET /ehs/admin/locations
router.get("/admin/locations", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, location_code, location_name, hr_name, hr_email, cc_email, active, created_at
       FROM ehs_location_hr
       ORDER BY location_name`
    );
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] admin/locations GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// POST /ehs/admin/locations
router.post("/admin/locations", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { location_code, location_name } = req.body;

  if (!location_code || !location_name)
    return res.status(400).json({ error: "location_code and location_name are required" });

  const code = location_code.trim().toUpperCase().replace(/\s+/g, "_");

  try {
    const existing = await query(`SELECT id FROM ehs_location_hr WHERE location_code = ?`, [code]);
    if (existing.length)
      return res.status(409).json({ error: `Location code "${code}" already exists` });

    const result = await query(
      `INSERT INTO ehs_location_hr (location_code, location_name, active)
       VALUES (?, ?, 1)`,
      [code, location_name.trim()]
    );

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_LOCATION_CREATED', ?)`,
      [req.adminId || null, JSON.stringify({ location_code: code, location_name })]
    ).catch(() => {});

    return res.status(201).json({ id: result.insertId, location_code: code });
  } catch (err) {
    console.error("[EHS] admin/locations POST error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// PATCH /ehs/admin/locations/:id
router.patch("/admin/locations/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { location_name, hr_name, hr_email, cc_email, active } = req.body;
  const fields = [];
  const params = [];

  if (location_name !== undefined) { fields.push("location_name = ?"); params.push(location_name); }
  if (hr_name       !== undefined) { fields.push("hr_name = ?");       params.push(hr_name || null); }
  if (hr_email      !== undefined) { fields.push("hr_email = ?");      params.push(hr_email); }
  if (cc_email      !== undefined) { fields.push("cc_email = ?");      params.push(cc_email || null); }
  if (active        !== undefined) { fields.push("active = ?");        params.push(active ? 1 : 0); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

  try {
    params.push(req.params.id);
    const result = await query(`UPDATE ehs_location_hr SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: "Location not found" });

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_LOCATION_UPDATED', ?)`,
      [req.adminId || null, JSON.stringify({ id: req.params.id, ...req.body })]
    ).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/locations PATCH error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// ADMIN — Kiosk device provisioning
// Super-admin only — HR must never create devices or reset their
// passwords; that's system-administration, not warehouse verification.
// ============================================================

// GET /ehs/admin/kiosk-devices
router.get("/admin/kiosk-devices", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const rows = await query(
      `SELECT d.id, d.device_name, d.location_code, d.username, d.active,
              d.must_change_password, d.last_login_at, d.created_at,
              l.location_name
       FROM ehs_kiosk_devices d
       LEFT JOIN ehs_location_hr l ON l.location_code = d.location_code
       ORDER BY d.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] admin/kiosk-devices GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// POST /ehs/admin/kiosk-devices
router.post("/admin/kiosk-devices", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { device_name, location_code, username } = req.body;

  if (!device_name || !location_code || !username)
    return res.status(400).json({ error: "device_name, location_code and username are required" });

  try {
    const loc = await query(
      `SELECT id FROM ehs_location_hr WHERE location_code = ? AND active = 1`,
      [location_code]
    );
    if (!loc.length)
      return res.status(400).json({ error: "Unknown or inactive warehouse. Create the warehouse first." });

    const usernameTaken = await query(`SELECT id FROM ehs_kiosk_devices WHERE username = ?`, [username.trim()]);
    if (usernameTaken.length)
      return res.status(409).json({ error: "That username is already taken" });

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    const result = await query(
      `INSERT INTO ehs_kiosk_devices
         (device_name, location_code, username, password_hash, must_change_password, active)
       VALUES (?, ?, ?, ?, 1, 1)`,
      [device_name.trim(), location_code, username.trim(), hash]
    );

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_KIOSK_DEVICE_CREATED', ?)`,
      [req.adminId || null, JSON.stringify({ device_name, location_code, username })]
    ).catch(() => {});

    return res.status(201).json({
      id: result.insertId,
      username: username.trim(),
      temp_password: tempPassword,
    });
  } catch (err) {
    console.error("[EHS] admin/kiosk-devices POST error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// POST /ehs/admin/kiosk-devices/:id/reset-password
router.post("/admin/kiosk-devices/:id/reset-password", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    const result = await query(
      `UPDATE ehs_kiosk_devices SET password_hash = ?, must_change_password = 1 WHERE id = ?`,
      [hash, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Device not found" });

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_KIOSK_DEVICE_PASSWORD_RESET', ?)`,
      [req.adminId || null, JSON.stringify({ device_id: req.params.id })]
    ).catch(() => {});

    return res.json({ ok: true, temp_password: tempPassword });
  } catch (err) {
    console.error("[EHS] admin/kiosk-devices reset-password error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// PATCH /ehs/admin/kiosk-devices/:id
router.patch("/admin/kiosk-devices/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { device_name, location_code, active } = req.body;
  const fields = [];
  const params = [];

  if (device_name   !== undefined) { fields.push("device_name = ?");   params.push(device_name); }
  if (location_code !== undefined) { fields.push("location_code = ?"); params.push(location_code); }
  if (active        !== undefined) { fields.push("active = ?");        params.push(active ? 1 : 0); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

  try {
    params.push(req.params.id);
    const result = await query(`UPDATE ehs_kiosk_devices SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: "Device not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/kiosk-devices PATCH error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

        // ============================================================
// POST /ehs/auth/reset-pin
// Self-service PIN reset — verify name + DOB then issue new PIN
// Body: { contact_number, full_name, date_of_birth }
// Returns: { ok, new_pin }
// ============================================================
   // ============================================================
// POST /ehs/auth/reset-pin
// ============================================================
router.post("/auth/reset-pin", async (req, res) => {
  const { contact_number, full_name } = req.body;

  if (!contact_number || !full_name)
    return res.status(400).json({ error: "contact_number and full_name required" });

  try {
    const rows = await query(
      `SELECT id, full_name
       FROM ehs_kiosk_visitors
       WHERE contact_number = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [contact_number]
    );

    if (!rows.length)
      return res.status(401).json({ error: "Details do not match our records. Please try again." });

    const record = rows[0];

    const nameMatch = record.full_name.trim().toLowerCase() === full_name.trim().toLowerCase();
    if (!nameMatch)
      return res.status(401).json({ error: "Details do not match our records. Please try again." });

    const newPin = generatePin(record.full_name, contact_number);

    await query(`UPDATE ehs_kiosk_visitors SET pin = ? WHERE id = ?`, [newPin, record.id]);

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'kiosk', 'PIN_RESET_SELF_SERVICE', ?)`,
      [record.id, JSON.stringify({ contact_number })]
    ).catch(() => {});

    return res.json({ ok: true, new_pin: newPin });

  } catch (err) {
    console.error("[EHS] reset-pin error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});
    // ============================================================
    // POST /ehs/visitor/photo
    // Body (multipart/form-data): visitor_id, photo (file)
    // ============================================================
    router.post("/visitor/photo",    requireKioskSession, upload.single("photo"), async (req, res) => {
    const { visitor_id } = req.body;

    if (!visitor_id || !req.file) {
        return res.status(400).json({ error: "visitor_id and photo file are required" });
    }

    const photo_path = path.join("uploads/ehs", req.file.filename).replace(/\\/g, "/");

    try {
        await query(
        `UPDATE ehs_kiosk_visitors SET photo_path = ? WHERE id = ?`,
        [photo_path, visitor_id]
        );
        return res.json({ ok: true, photo_path });
    } catch (err) {
        console.error("[EHS] visitor/photo error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });

    // ============================================================
    // GET /ehs/training/modules
    // Returns active training modules for the category selection screen.
    // Query params:
    //   - ?applicable_to=Visitor  (optional filter by worker type)
    //   - ?training_id=1          (optional — fetch single module with video_path)
    // ============================================================
    router.get("/training/modules", async (req, res) => {
    const { applicable_to, training_id } = req.query;

    try {
        let sql = `SELECT id, training_name, category, applicable_to,
                        video_path, pass_percentage, num_questions, validity_days
                FROM ehs_training_modules
                WHERE status = 'Active'`;
        const params = [];

        // ← NEW: If training_id is specified, fetch only that module (used by VideoTraining)
        if (training_id) {
        sql += ` AND id = ?`;
        params.push(training_id);
        } else if (applicable_to) {
        // ← Existing: FIND_IN_SET works with MySQL SET columns
        sql += ` AND FIND_IN_SET(?, applicable_to)`;
        params.push(applicable_to);
        }

        const rows = await query(sql, params);
        
        // If training_id was specified, return single object; otherwise array
        if (training_id) {
        return res.json(rows[0] || null);
        }
        return res.json(rows);
    } catch (err) {
        console.error("[EHS] training/modules error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });

    // ============================================================
    // GET /ehs/quiz/questions?training_id=1&language_id=1
    // Returns randomised questions WITHOUT the correct answer.
    // ============================================================
    router.get("/quiz/questions", async (req, res) => {
  const { training_id, language_id } = req.query;

  if (!training_id) {
    return res.status(400).json({ error: "training_id is required" });
  }

  try {
    const [module] = await query(
      `SELECT num_questions, pass_percentage FROM ehs_training_modules WHERE id = ? AND status = 'Active'`,
      [training_id]
    );
    if (!module) return res.status(404).json({ error: "Training module not found" });

    // How many active questions actually exist for this language?
    const [{ available }] = await query(
      `SELECT COUNT(*) AS available
       FROM ehs_questions
       WHERE training_id = ?
         AND (language_id = ? OR language_id IS NULL)
         AND status = 'Active'`,
      [training_id, language_id || null]
    );

    // Never ask MySQL for more rows than exist for this language —
    // and always pass LIMIT a clean integer (mysql2 throws on non-numeric
    // bound values for LIMIT/OFFSET).
    const requested = Math.min(Number(module.num_questions) || 10, Number(available) || 0);

    if (requested === 0) {
      return res.status(404).json({ error: "No active questions found for this training/language" });
    }

    const rows = await query(
      `SELECT id, question, option_a, option_b, option_c, option_d
       FROM ehs_questions
       WHERE training_id = ?
         AND (language_id = ? OR language_id IS NULL)
         AND status = 'Active'
       ORDER BY RAND()
       LIMIT ?`,
      [training_id, language_id || null, requested]
    );

    return res.json({
      questions: rows,
      pass_percentage: module.pass_percentage,
      total: rows.length,
    });
  } catch (err) {
    console.error("[EHS] quiz/questions error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

    // ============================================================
    // POST /ehs/quiz/submit
    // Scores answers server-side so correct_ans never goes to client.
    // Body: { training_id, visitor_id | emp_id, answers: [{ question_id, selected }] }
    // Returns: { score, passed, correct, total }
    // ============================================================
    router.post("/quiz/submit", async (req, res) => {
    const { training_id, language_id, visitor_id, emp_id, answers } = req.body;

    if (!training_id || !Array.isArray(answers) || !answers.length) {
        return res.status(400).json({ error: "training_id and answers[] are required" });
    }

    try {
        // Fetch correct answers for the submitted question IDs
        const questionIds = answers.map(a => a.question_id);
        const placeholders = questionIds.map(() => "?").join(",");
        const questionRows = await query(
        `SELECT id, correct_ans FROM ehs_questions WHERE id IN (${placeholders})`,
        questionIds
        );

        const answerMap = Object.fromEntries(questionRows.map(q => [q.id, q.correct_ans]));
        const correct = answers.filter(a => answerMap[a.question_id] === a.selected).length;
        const total   = answers.length;
        const score   = Math.round((correct / total) * 100);

        // Get pass threshold
        const [module] = await query(
        `SELECT pass_percentage FROM ehs_training_modules WHERE id = ?`,
        [training_id]
        );
        const passed = score >= (module?.pass_percentage ?? 80);

        // Persist quiz result
        await query(
          `INSERT INTO ehs_quiz_results
          (worker_id, training_id, language_id, total_questions, correct_answers, score_pct, result, attempt_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [visitor_id || null, training_id, language_id || null, total, correct, score, passed ? "Pass" : "Fail", 1]
        );

        return res.json({ score, passed, correct, total });
    } catch (err) {
        console.error("[EHS] quiz/submit error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });

    // ============================================================
    // POST /ehs/induction/complete
    // Called from InductionCompletion.jsx after quiz.
    // Handles both corporate (emp_id) and kiosk (visitor_id) users.
    // On pass: creates completion record + HR verification row.
    // Body: { user_type, category, training_id, score, passed, visitor_id | emp_id }
    // ============================================================
    router.post("/induction/complete", optionalKioskSession, async (req, res) => {
        const { user_type, category, training_id, score, passed, visitor_id, emp_id,
        language_id,                                    // ← add
        full_name: providedName, contact_number: providedContact,
        location_code: providedLocation } = req.body;

        let location_code = req.kioskLocation || providedLocation || null;

        if (!user_type || !category) {
          return res.status(400).json({ error: "user_type and category are required" });
        }

        try {
          let workerId = visitor_id ? Number(visitor_id) : null;

          if (user_type === "corporate" && emp_id) {
            const existing = await query(
              `SELECT id, full_name, location_code FROM ehs_kiosk_visitors WHERE employee_id = ? LIMIT 1`,
              [emp_id]
            );
            if (existing.length) {
              workerId = existing[0].id;

              if (providedName && existing[0].full_name === emp_id) {
                await query(
                  `UPDATE ehs_kiosk_visitors SET full_name = ?, contact_number = COALESCE(NULLIF(contact_number, ''), ?) WHERE id = ?`,
                  [providedName, providedContact || "", workerId]
                );
              }

              // ← NEW: no kiosk device / no body location — use the worker's
              // own stored location_code (set during /auth/corporate-session)
              if (!location_code && existing[0].location_code) {
                location_code = existing[0].location_code;
              }
            } else {
              const r = await query(
                `INSERT INTO ehs_kiosk_visitors (full_name, employee_id, visitor_type, contact_number)
                VALUES (?, ?, 'Employee', ?)`,
                [providedName || emp_id, emp_id, providedContact || ""]
              );
              workerId = r.insertId;
            }
          }

          if (!workerId) {
            console.error("[EHS] induction/complete: missing workerId", { user_type, visitor_id, emp_id });
            return res.status(400).json({
              error: "Could not resolve worker identity. Visitor session may have expired — please log in again."
            });
          }

          // ← NEW: kiosk-visitor path (non-corporate) — same fallback, in case
          // a returning visitor completes via mobile PIN login with no kiosk
          // device token attached
          if (!location_code) {
            const [row] = await query(
              `SELECT location_code FROM ehs_kiosk_visitors WHERE id = ?`,
              [workerId]
            );
            if (row?.location_code) location_code = row.location_code;
          }
        // ── 2. Use training_id if provided; otherwise resolve from category ──
        let trainingId = training_id ? Number(training_id) : null;
        
        if (!trainingId) {
        const modules = await query(
            `SELECT id FROM ehs_training_modules
            WHERE LOWER(training_name) LIKE ? AND status = 'Active' LIMIT 1`,
            [`%${category.replace(/_/g, " ")}%`]
        );
        trainingId = modules[0]?.id || null;
        }

        // ── 3. Insert into induction completions (always) ─────────
      const completionResult = await query(
        `INSERT INTO ehs_induction_completions
        (visitor_id, emp_id, user_type, category, training_id, language_id, score, passed, location_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [workerId, emp_id || null, user_type, category, trainingId, language_id || null, score ?? null, passed ? 1 : 0, location_code]
      );
        // ── 4. On pass: create structured completion + HR row ─────
        if (passed) {
            const validTill = new Date();
            validTill.setFullYear(validTill.getFullYear() + 1);

            // No approval step — a pass is final, recorded straight as 'Submitted'.
            await query(
                `INSERT INTO ehs_training_completions
                (worker_id, training_id, induction_completion_id, valid_till, verification_status)
                VALUES (?, ?, ?, ?, 'Submitted')`,
                [workerId, trainingId, completionResult.insertId, validTill.toISOString().split("T")[0]]
            );
        }

            // ── 4b. Issue a session token so the dashboard fetch works ──
            let sessionToken = null;
            if (passed && workerId) {
            sessionToken = Buffer.from(`${workerId}:${Date.now()}:ehs`).toString("base64");
            await query(
                `INSERT INTO ehs_sessions (visitor_id, token, expires_at)
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))
                ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 8 HOUR)`,
                [workerId, sessionToken, sessionToken]
            );
            }

            
        // ── 5. Audit log ──────────────────────────────────────────
        await query(
        `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
        VALUES (?, ?, 'EHS_INDUCTION_COMPLETED', ?)`,
        [
            emp_id || visitor_id,
            user_type,
            JSON.stringify({ category, score, passed }),
        ]
        ).catch(e => console.warn("[EHS] audit log failed:", e));

        return res.status(201).json({
                message: "Completion recorded",
                completion_id: completionResult.insertId,
                passed,
                token: sessionToken,
                worker_id: workerId,   // ← add
                });
    } catch (err) {
        console.error("[EHS] induction/complete error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });

    // ============================================================
    // POST /ehs/audit/log
    // Explicit audit log from frontend (welcome screen, etc.)
    // Logs both corporate and kiosk — for kiosk, emp_id will be null.
    // Body: { emp_id, action, loginType, meta }
    // ============================================================
    router.post("/audit/log", async (req, res) => {
    const { emp_id, action, loginType, meta } = req.body;

    if (!action) {
        return res.status(400).json({ error: "action is required" });
    }

    try {
        await query(
        `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
        VALUES (?, ?, ?, ?)`,
        [emp_id || null, loginType || "kiosk", action, meta ? JSON.stringify(meta) : null]
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error("[EHS] audit/log error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });


    // ============================================================
// POST /ehs/consent/log
// DPDP Act consent, logged before visitor details are collected.
// Body: { consent_id, consent_text_version, accepted }
// ============================================================
router.post("/consent/log", async (req, res) => {
  const { consent_id, consent_text_version, accepted } = req.body;

  if (!consent_id || !accepted) {
    return res.status(400).json({ error: "consent_id and accepted are required" });
  }

  try {
    await query(
      `INSERT INTO ehs_consent_log (consent_id, consent_text_version, accepted)
       VALUES (?, ?, ?)`,
      [consent_id, consent_text_version || null, accepted ? 1 : 0]
    );
    return res.json({ ok: true, consent_id });
  } catch (err) {
    console.error("[EHS] consent/log error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

    // ============================================================
    // GET /ehs/completion/:id
    // Used by certificate / pass screen to fetch full record.
    // ============================================================
    router.get("/completion/:id", async (req, res) => {
    try {
        const rows = await query(
        `SELECT c.*, v.full_name, v.visitor_type, v.employee_id, v.photo_path,
                tc.valid_till, tc.verification_status
        FROM ehs_induction_completions c
        LEFT JOIN ehs_kiosk_visitors v       ON c.visitor_id = v.id
        LEFT JOIN ehs_training_completions tc ON tc.induction_completion_id = c.id
        WHERE c.id = ?`,
        [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: "Not found" });
        return res.json(rows[0]);
    } catch (err) {
        console.error("[EHS] completion fetch error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });
    // ============================================================
    // GET /ehs/induction-types
    // Returns all induction types (Active + Coming Soon)
    // Sorted by display_order
    // Response: [{ id, induction_code, name, description, icon_emoji, color_class, status }]
    // ============================================================
    router.get("/induction-types", async (req, res) => {
    try {
        const rows = await query(
        `SELECT id, induction_code, name, description, icon_emoji, color_class, status
        FROM ehs_induction_types
        ORDER BY display_order ASC`
        );
        return res.json(rows);
    } catch (err) {
        console.error("[EHS] induction-types fetch error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });
    // ============================================================
    // GET /ehs/induction-types/:code
    // Fetch a single induction type by code (e.g., "EHS_DIGITAL_INDUCTION")
    // ============================================================
    router.get("/induction-types/:code", async (req, res) => {
    try {
        const [row] = await query(
        `SELECT * FROM ehs_induction_types WHERE induction_code = ?`,
        [req.params.code]
        );
        if (!row) return res.status(404).json({ error: "Induction type not found" });
        return res.json(row);
    } catch (err) {
        console.error("[EHS] induction-type fetch error:", err);
        return res.status(500).json({ error: "Database error" });
    }
    });

    // ============================================================
// GET /ehs/training/languages?training_id=X
// Returns available languages for a training module.
// Falls back to all active languages if no language-specific
// videos are uploaded yet (ehs_training_videos may not exist).
// ============================================================
router.get("/training/languages", async (req, res) => {
  const { training_id } = req.query;
  if (!training_id) return res.status(400).json({ error: "training_id is required" });

  try {
    // 1. Language-specific videos actually uploaded for this module
    const tableCheck = await query(
      `SELECT COUNT(*) as cnt FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'ehs_training_videos'`
    );

    if (tableCheck[0].cnt > 0) {
      const rows = await query(
        `SELECT l.id, l.language_name
         FROM ehs_training_videos v
         JOIN ehs_languages l ON l.id = v.language_id
         WHERE v.training_id = ? AND l.status = 'Active'
         ORDER BY l.id`,
        [training_id]
      );
      if (rows.length > 0) return res.json(rows);
    }

    // 2. No per-language videos for this module — fall back to its single
    // default video (video_path on ehs_training_modules), which is
    // English-only. Do NOT return every active language here: that would
    // let a visitor pick Hindi/Tamil/Kannada/Telugu for a module that
    // only has an English recording, and they'd silently get served
    // English audio without being told.
    const [mod] = await query(
      `SELECT video_path FROM ehs_training_modules WHERE id = ? AND status = 'Active'`,
      [training_id]
    );

    if (mod?.video_path) {
      const [english] = await query(
        `SELECT id, language_name FROM ehs_languages
         WHERE language_name = 'English' AND status = 'Active' LIMIT 1`
      );
      return res.json(english ? [english] : []);
    }

    // 3. No video at all for this module
    return res.json([]);

  } catch (err) {
    console.error("[EHS] training/languages error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// GET /ehs/training/video?training_id=X&language_id=Y
// Returns language-specific video path, falls back to default.
// ============================================================
router.get("/training/video", async (req, res) => {
  const { training_id, language_id } = req.query;
  try {
    // Try language-specific video first
    const tableCheck = await query(
      `SELECT COUNT(*) as cnt FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'ehs_training_videos'`
    );

    if (tableCheck[0].cnt > 0) {
      const rows = await query(
        `SELECT v.video_path, l.language_name
         FROM ehs_training_videos v
         JOIN ehs_languages l ON l.id = v.language_id
         WHERE v.training_id = ? AND v.language_id = ?`,
        [training_id, language_id]
      );
      if (rows.length > 0) return res.json(rows[0]);
    }

    // Fallback: return module's default video_path
    const [mod] = await query(
      `SELECT video_path, 'English' AS language_name 
       FROM ehs_training_modules WHERE id = ?`,
      [training_id]
    );
    if (!mod || !mod.video_path) {
      return res.status(404).json({ error: "No video available for this module" });
    }
    return res.json(mod);

  } catch (err) {
    console.error("[EHS] training/video error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// POST /ehs/auth/lookup
// Check if mobile exists — returns exists + masked name only
// ============================================================
router.post("/auth/lookup", async (req, res) => {
  const { contact_number } = req.body;
  if (!contact_number) return res.status(400).json({ error: "contact_number required" });

  try {
    const rows = await query(
      `SELECT id, full_name, visitor_type, employee_id, photo_path, 
              pin, created_at
       FROM ehs_kiosk_visitors
       WHERE contact_number = ?
       ORDER BY created_at DESC LIMIT 1`,
      [contact_number]
    );
    if (!rows.length) return res.json({ exists: false });

    const v = rows[0];
    const hasPin = !!v.pin;

    return res.json({
        exists:         true,
        has_pin:        hasPin,
        visitor_id:     v.id,
        full_name:      v.full_name,
        visitor_type:   v.visitor_type,
        photo_path:     v.photo_path,
        contact_number: v.contact_number,   // ← add this too, for consistency
      });
  } catch (err) {
    console.error("[EHS] lookup error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// POST /ehs/auth/verify-pin
// Verify mobile + PIN combination
// Body: { contact_number, pin }
// Returns: { ok, visitor_id, full_name, visitor_type, token }
// ============================================================
router.post("/auth/verify-pin", async (req, res) => {
  const { contact_number, pin } = req.body;
  if (!contact_number || !pin) 
    return res.status(400).json({ error: "contact_number and pin required" });

  try {
    const rows = await query(
      `SELECT id, full_name, visitor_type, employee_id, photo_path, contact_number
      FROM ehs_kiosk_visitors
      WHERE contact_number = ? AND pin = ?
      ORDER BY created_at DESC LIMIT 1`,
      [contact_number, pin]
    );
    if (!rows.length) 
      return res.status(401).json({ error: "Incorrect PIN. Please try again." });

    const v = rows[0];
    const token = Buffer.from(`${v.id}:${Date.now()}:ehs`).toString("base64");

    await query(
      `INSERT INTO ehs_sessions (visitor_id, token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))
       ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 8 HOUR)`,
      [v.id, token, token]
    );

    return res.json({
        ok: true, token,
        visitor_id:     v.id,
        full_name:      v.full_name,
        visitor_type:   v.visitor_type,
        photo_path:     v.photo_path,
        contact_number: v.contact_number,   // ← add this
      });
  } catch (err) {
    console.error("[EHS] verify-pin error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});
// ============================================================
// GET /ehs/dashboard/:visitor_id
// Full worker dashboard data — training history, certs, validity
// Header: x-ehs-token
// ============================================================
router.get("/dashboard/:visitor_id", async (req, res) => {
  const { visitor_id } = req.params;
  const token = req.headers["x-ehs-token"];

  try {
    // Validate session
    const sessions = await query(
      `SELECT * FROM ehs_sessions
       WHERE visitor_id = ? AND token = ? AND expires_at > NOW()`,
      [visitor_id, token]
    );
    if (!sessions.length) return res.status(401).json({ error: "Unauthorized" });

    // Worker profile
    const [worker] = await query(
      `SELECT id, full_name, visitor_type, employee_id, contact_number, photo_path, created_at
       FROM ehs_kiosk_visitors
       WHERE id = ?`,
      [visitor_id]
    );

    // All completions with training details
   const completions = await query(
      `SELECT
        ic.id            AS completion_id,
        ic.score,
        ic.passed,
        ic.completed_at  AS completed_at,
        ic.location_code,
        m.training_name,
        m.category,
        m.pass_percentage,
        lang.language_name,
        tc.valid_till,
        tc.verification_status,
        tc.id            AS cert_id,
        hv.notification_sent,
        hv.verified_by_hr
      FROM ehs_induction_completions ic
      LEFT JOIN ehs_training_modules     m    ON m.id = ic.training_id
      LEFT JOIN ehs_languages            lang ON lang.id = ic.language_id
      LEFT JOIN ehs_training_completions tc   ON tc.induction_completion_id = ic.id
      LEFT JOIN ehs_hr_verifications     hv   ON hv.completion_id = tc.id
      WHERE ic.visitor_id = ?
      ORDER BY ic.completed_at DESC`,
      [visitor_id]
    );

    // Quiz attempts per module
    const attempts = await query(
      `SELECT
         training_id,
         COUNT(*) AS attempts,
         MAX(score_pct) AS best_score,
         SUM(result = 'Pass') AS pass_count
       FROM ehs_quiz_results
       WHERE worker_id = ?
       GROUP BY training_id`,
      [visitor_id]
    );

    // Stats
    const totalAttempts = completions.length;
    const totalPassed = completions.filter(c => c.passed).length;
    const totalFailed = totalAttempts - totalPassed;
    const activeCerts = completions.filter(
      c => c.passed && c.valid_till && new Date(c.valid_till) > new Date()
    ).length;
    const expiringSoon = completions.filter(c => {
      if (!c.valid_till || !c.passed) return false;
      const days = (new Date(c.valid_till) - new Date()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 30;
    }).length;

    return res.json({
      worker,
      stats: { totalAttempts, totalPassed, totalFailed, activeCerts, expiringSoon },
      completions,
      attempts,
    });
  } catch (err) {
    console.error("[EHS] dashboard error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// GET /ehs/admin/dashboard
// HR Admin — all completions, pending verifications, stats
// Query: ?status=pending|all&from=YYYY-MM-DD&to=YYYY-MM-DD&type=Employee|Contractor|Visitor|Driver
// ============================================================
router.get("/admin/dashboard", requireAdminAuth, async (req, res) => {

  const { status, from, to, type, location_code } = req.query;
  const effectiveLocation = location_code;


  try {
    let where = "WHERE 1=1";
    const params = [];
    
      if (effectiveLocation) {
      where += " AND ic.location_code = ?";
      params.push(effectiveLocation);
    }
    if (status === "pending") {
      where += " AND tc.verification_status = 'Pending'";
    }
    if (from) {
      where += " AND DATE(ic.completed_at) >= ?";
      params.push(from);
    }
    if (to) {
      where += " AND DATE(ic.completed_at) <= ?";
      params.push(to);
    }
    if (type) {
      where += " AND v.visitor_type = ?";
      params.push(type);
    }

    const completions = await query(
      `SELECT
         ic.id            AS completion_id,
         ic.score,
         ic.passed,
         ic.user_type,
         ic.completed_at  AS completed_at,
         v.full_name,
         v.visitor_type,
         v.employee_id,
         v.contact_number,
         v.photo_path,
         m.training_name,
         m.category,
         tc.valid_till,
         tc.verification_status,
         tc.id            AS cert_id,
         hv.notification_sent,
         hv.notification_sent_at,
         hv.verified_by_hr
       FROM ehs_induction_completions ic
       LEFT JOIN ehs_kiosk_visitors       v  ON v.id = ic.visitor_id
       LEFT JOIN ehs_training_modules     m  ON m.id = ic.training_id
       LEFT JOIN ehs_training_completions tc ON tc.induction_completion_id = ic.id
       LEFT JOIN ehs_hr_verifications     hv ON hv.completion_id = tc.id
       ${where}
       ORDER BY ic.completed_at DESC
       LIMIT 500`,
      params
    );

    // Summary stats
    const [stats] = await query(
      `SELECT
         COUNT(ic.id)                          AS total,
         SUM(ic.passed = 1)                    AS passed,
         SUM(ic.passed = 0)                    AS failed,
         SUM(tc.verification_status = 'Pending') AS pending_verification,
         SUM(hv.notification_sent = 0)         AS notifications_unsent
       FROM ehs_induction_completions ic
       LEFT JOIN ehs_training_completions tc ON tc.induction_completion_id = ic.id
       LEFT JOIN ehs_hr_verifications     hv ON hv.completion_id = tc.id`
    );

    // By worker type breakdown
    const byType = await query(
      `SELECT
         v.visitor_type,
         COUNT(*) AS total,
         SUM(ic.passed) AS passed
       FROM ehs_induction_completions ic
       LEFT JOIN ehs_kiosk_visitors v ON v.id = ic.visitor_id
       GROUP BY v.visitor_type`
    );

    // By module breakdown
    const byModule = await query(
      `SELECT
         m.training_name,
         COUNT(*) AS total,
         SUM(ic.passed) AS passed,
         ROUND(AVG(ic.score), 1) AS avg_score
       FROM ehs_induction_completions ic
       LEFT JOIN ehs_training_modules m ON m.id = ic.training_id
       GROUP BY m.training_name`
    );

    return res.json({ stats, completions, byType, byModule });
  } catch (err) {
    console.error("[EHS] admin/dashboard error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// POST /ehs/admin/verify
// HR (or super admin) approves / rejects / resets a completion.
// Body: { cert_id, status }  status ∈ Verified | Rejected | Pending
// ============================================================
router.post("/admin/verify", requireAdminAuth, async (req, res) => {
  const { cert_id, status } = req.body;
  const allowed = ["Verified", "Rejected", "Pending"];
  if (!cert_id || !allowed.includes(status)) {
    return res.status(400).json({ error: "cert_id and a valid status (Verified/Rejected/Pending) are required" });
  }

  try {
    // If this admin is location-scoped HR, make sure the completion
    // actually belongs to their warehouse before letting them touch it.
    if (req.admin.role === "hr") {
      const [row] = await query(
        `SELECT ic.location_code
         FROM ehs_training_completions tc
         JOIN ehs_induction_completions ic ON ic.id = tc.induction_completion_id
         WHERE tc.id = ?`,
        [cert_id]
      );
      if (!row || row.location_code !== req.admin.location_code) {
        return res.status(403).json({ error: "You can only verify completions for your own warehouse" });
      }
    }

    await query(
      `UPDATE ehs_training_completions SET verification_status = ? WHERE id = ?`,
      [status, cert_id]
    );

    if (status === "Pending") {
      await query(
        `UPDATE ehs_hr_verifications SET verified_by_hr = NULL, verified_at = NULL WHERE completion_id = ?`,
        [cert_id]
      );
    } else {
      await query(
        `UPDATE ehs_hr_verifications SET verified_by_hr = ?, verified_at = NOW() WHERE completion_id = ?`,
        [req.admin.full_name, cert_id]
      );
    }

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_COMPLETION_VERIFICATION_UPDATED', ?)`,
      [req.admin.id, JSON.stringify({ cert_id, status })]
    ).catch(() => {});

    return res.json({ ok: true, status });
  } catch (err) {
    console.error("[EHS] admin/verify error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


// Middleware — add to ehsRoutes.js
async function requireKioskSession(req, res, next) {
  const token = req.headers["x-kiosk-token"];
  if (!token) return res.status(401).json({ error: "Kiosk not activated" });

  try {
    const [row] = await query(
      `SELECT s.device_id, d.location_code
       FROM ehs_kiosk_sessions s
       JOIN ehs_kiosk_devices d ON d.id = s.device_id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );
    if (!row) return res.status(401).json({ error: "Kiosk session expired. Please reactivate." });

    req.kioskDeviceId = row.device_id;
    req.kioskLocation = row.location_code;
    next();
  } catch (err) {
    console.error("[EHS] requireKioskSession error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}





router.post("/kiosk/activate", async (req, res) => {
  const { username, password, new_password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  try {
    const [device] = await query(
      `SELECT id, password_hash, device_name, location_code, must_change_password
       FROM ehs_kiosk_devices
       WHERE username = ? AND active = 1`,
      [username]
    );

    if (!device || !(await bcrypt.compare(password, device.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    // ── First-login (or admin-reset) forced password change ──
    // The device still has must_change_password = 1. If the caller
    // hasn't sent a new_password yet, tell the frontend to show the
    // "set a new password" screen instead of activating.
    if (device.must_change_password) {
      if (!new_password) {
        return res.json({ ok: true, must_change_password: true });
      }
      if (String(new_password).length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }
      if (new_password === password) {
        return res.status(400).json({ error: "New password must be different from the temporary password" });
      }
      const newHash = await bcrypt.hash(new_password, 10);
      await query(
        `UPDATE ehs_kiosk_devices SET password_hash = ?, must_change_password = 0 WHERE id = ?`,
        [newHash, device.id]
      );
      await query(
        `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
         VALUES (?, 'kiosk_device', 'KIOSK_PASSWORD_CHANGED_FIRST_LOGIN', ?)`,
        [device.id, JSON.stringify({ username })]
      ).catch(() => {});
      // fall through — continue on to normal activation below with the new password now set
    }

    // Token valid until midnight tonight (end of calendar day)
    const expiry = new Date();
    expiry.setHours(23, 59, 59, 999);

    const token = Buffer.from(
      `kiosk:${device.id}:${Date.now()}`
    ).toString("base64");

    await query(
      `INSERT INTO ehs_kiosk_sessions
         (device_id, token, expires_at, activated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         token = ?, expires_at = ?, activated_by = ?`,
      [device.id, token, expiry, username,
       token, expiry, username]
    );

    await query(
      `UPDATE ehs_kiosk_devices SET last_login_at = NOW() WHERE id = ?`,
      [device.id]
    ).catch(() => {});

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'kiosk_device', 'KIOSK_ACTIVATED', ?)`,
      [device.id, JSON.stringify({ device_name: device.device_name, expiry })]
    ).catch(() => {});

    return res.json({
      ok: true,
      token,
      device_name:   device.device_name,
      location_code: device.location_code,
      expires_at:    expiry.toISOString(),
    });
  } catch (err) {
    console.error("[EHS] kiosk/activate error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// POST /ehs/admin/login
// Same pattern as /kiosk/activate: forced password change on
// first login (must_change_password), then issues a session token.
// Body: { username, password, new_password? }
// ============================================================
router.post("/admin/login", async (req, res) => {
  const { username, password, new_password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  try {
    const [admin] = await query(
      `SELECT id, password_hash, full_name, email, role, location_code, must_change_password, active
       FROM ehs_admin_users WHERE username = ?`,
      [username]
    );
    if (!admin || !admin.active || !(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    if (admin.must_change_password) {
      if (!new_password) return res.json({ ok: true, must_change_password: true });
      if (String(new_password).length < 8)
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      if (new_password === password)
        return res.status(400).json({ error: "New password must be different from the temporary password" });

      const newHash = await bcrypt.hash(new_password, 10);
      await query(
        `UPDATE ehs_admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?`,
        [newHash, admin.id]
      );
    }

    const expiry = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12-hour session
    const token = Buffer.from(`admin:${admin.id}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`).toString("base64");

    await query(
      `INSERT INTO ehs_admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)`,
      [admin.id, token, expiry]
    );
    await query(`UPDATE ehs_admin_users SET last_login_at = NOW() WHERE id = ?`, [admin.id]).catch(() => {});
    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_ADMIN_LOGIN', ?)`,
      [admin.id, JSON.stringify({ username, role: admin.role })]
    ).catch(() => {});

    return res.json({
      ok: true,
      token,
      role: admin.role,
      full_name: admin.full_name,
      email: admin.email,
      location_code: admin.location_code,
      expires_at: expiry.toISOString(),
    });
  } catch (err) {
    console.error("[EHS] admin/login error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// POST /ehs/admin/change-password
// Self-service — any logged-in admin/HR changes their own password.
// Body: { current_password, new_password }
// ============================================================
router.post("/admin/change-password", requireAdminAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: "current_password and new_password required" });
  if (new_password.length < 8)
    return res.status(400).json({ error: "New password must be at least 8 characters" });

  try {
    const [row] = await query(`SELECT password_hash FROM ehs_admin_users WHERE id = ?`, [req.admin.id]);
    if (!row || !(await bcrypt.compare(current_password, row.password_hash)))
      return res.status(401).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(new_password, 10);
    await query(`UPDATE ehs_admin_users SET password_hash = ? WHERE id = ?`, [newHash, req.admin.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/change-password error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// ADMIN — manage admin/HR user accounts (super admin only)
// ============================================================
// ============================================================
// POST /ehs/admin/corporate-session
// Called from PathSelection.jsx after L&D login, using the emp_id
// already in the corporate session. If that emp_id is linked to an
// ehs_admin_users row, issues an admin session token — same shape
// as /ehs/admin/login — so EHSAdminDashboard.jsx works unmodified.
// 404 means "this employee isn't an EHS admin" — not an error.
// ============================================================
router.post("/admin/corporate-session", async (req, res) => {
  const { emp_id } = req.body;
  if (!emp_id) return res.status(400).json({ error: "emp_id required" });

  try {
    const [admin] = await query(
      `SELECT id, full_name, email, role, location_code, active
       FROM ehs_admin_users WHERE emp_id = ?`,
      [emp_id]
    );
    if (!admin || !admin.active) {
      return res.status(404).json({ error: "not_admin" });
    }

    const expiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const token = Buffer.from(`admin:${admin.id}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`).toString("base64");

    await query(
      `INSERT INTO ehs_admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)`,
      [admin.id, token, expiry]
    );
    await query(`UPDATE ehs_admin_users SET last_login_at = NOW() WHERE id = ?`, [admin.id]).catch(() => {});
    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_ADMIN_CORPORATE_SESSION_ISSUED', ?)`,
      [admin.id, JSON.stringify({ emp_id, role: admin.role })]
    ).catch(() => {});

    return res.json({
      token,
      role: admin.role,
      full_name: admin.full_name,
      email: admin.email,
      location_code: admin.location_code,
      expires_at: expiry.toISOString(),
    });
  } catch (err) {
    console.error("[EHS] admin/corporate-session error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});
// GET /ehs/admin/users
router.get("/admin/users", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const rows = await query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.location_code,
              l.location_name, u.active, u.must_change_password, u.last_login_at, u.created_at
       FROM ehs_admin_users u
       LEFT JOIN ehs_location_hr l ON l.location_code = u.location_code
       ORDER BY u.role DESC, u.full_name`
    );
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] admin/users GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


// POST /ehs/admin/users
router.post("/admin/users", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { username, full_name, email, emp_id } = req.body;  // ← role, location_code removed
  if (!full_name || !email || !emp_id)
    return res.status(400).json({ error: "emp_id, full_name and email are required" });

  const finalUsername = (username?.trim()) || emp_id.trim();

  try {
    const taken = await query(`SELECT id FROM ehs_admin_users WHERE username = ?`, [finalUsername]);
    if (taken.length) return res.status(409).json({ error: "That username is already taken" });

    const empTaken = await query(`SELECT id FROM ehs_admin_users WHERE emp_id = ?`, [emp_id.trim()]);
    if (empTaken.length) return res.status(409).json({ error: "That emp_id is already linked to another admin account" });

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    const result = await query(
      `INSERT INTO ehs_admin_users
         (username, password_hash, full_name, email, role, location_code, emp_id, must_change_password, active)
       VALUES (?, ?, ?, ?, 'super_admin', NULL, ?, 1, 1)`,
      [finalUsername, hash, full_name.trim(), email.trim(), emp_id.trim()]
    );

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_ADMIN_USER_CREATED', ?)`,
      [req.admin.id, JSON.stringify({ username: finalUsername, emp_id })]
    ).catch(() => {});

    return res.status(201).json({ id: result.insertId, username: finalUsername, temp_password: tempPassword });
  } catch (err) {
    console.error("[EHS] admin/users POST error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// PATCH /ehs/admin/users/:id — edit role/location/active, or reset password
// Body: any subset of { full_name, email, role, location_code, active, reset_password: true }
router.patch("/admin/users/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { full_name, email, role, location_code, active, reset_password } = req.body;
  const fields = [];
  const params = [];

  if (full_name     !== undefined) { fields.push("full_name = ?");     params.push(full_name); }
  if (email         !== undefined) { fields.push("email = ?");         params.push(email); }
  if (role          !== undefined) { fields.push("role = ?");          params.push(role); }
  if (location_code !== undefined) { fields.push("location_code = ?"); params.push(location_code || null); }
  if (active        !== undefined) { fields.push("active = ?");        params.push(active ? 1 : 0); }

  try {
    let tempPassword = null;
    if (reset_password) {
      tempPassword = generateTempPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      fields.push("password_hash = ?", "must_change_password = 1");
      params.push(hash);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

    params.push(req.params.id);
    const result = await query(`UPDATE ehs_admin_users SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: "User not found" });

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_ADMIN_USER_UPDATED', ?)`,
      [req.admin.id, JSON.stringify({ id: req.params.id, ...req.body, reset_password: !!reset_password })]
    ).catch(() => {});

    return res.json({ ok: true, temp_password: tempPassword });
  } catch (err) {
    console.error("[EHS] admin/users PATCH error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// GET /ehs/kiosk/visitor-lookup
// Security / warehouse in-charge lookup tool — accessible directly
// from an activated kiosk device, no separate HR/admin login.
// Deliberately pan-India: NOT scoped to req.kioskLocation.
// Query: ?search=<name, mobile, or employee_id — partial match>
// Returns: { summary: {...}, visitors: [{ ...visitor, completions: [...] }] }
// ============================================================
router.get("/kiosk/visitor-lookup", requireKioskSession, async (req, res) => {
  const { search } = req.query;
  const term = (search || "").trim();

  // Empty search = show everyone (most recent first). A 1-2 character
  // search is still blocked — that's not a real filter, just noise.
  if (term.length > 0 && term.length < 3) {
    return res.status(400).json({ error: "Enter at least 3 characters, or leave blank to see everyone" });
  }

  try {
    const like = `%${term}%`;
    const visitors = term
      ? await query(
          `SELECT id, full_name, contact_number, employee_id, visitor_type, location_code, created_at
           FROM ehs_kiosk_visitors
           WHERE full_name LIKE ? OR contact_number LIKE ? OR employee_id LIKE ?
           ORDER BY created_at DESC
           LIMIT 100`,
          [like, like, like]
        )
      : await query(
          `SELECT id, full_name, contact_number, employee_id, visitor_type, location_code, created_at
           FROM ehs_kiosk_visitors
           ORDER BY created_at DESC
           LIMIT 100`
        );
    // Pan-India summary — always computed across ALL visitors, not just
    // this search's results, so the counters mean something on their own.
    const [summary] = await query(
      `SELECT
         COUNT(DISTINCT v.id)                  AS total_registered,
         SUM(tc.verification_status = 'Verified') AS verified,
         SUM(tc.verification_status = 'Pending')  AS pending,
         SUM(tc.verification_status = 'Rejected') AS rejected,
         COUNT(ic.id)                          AS total_trainings_taken
       FROM ehs_kiosk_visitors v
       LEFT JOIN ehs_induction_completions ic ON ic.visitor_id = v.id
       LEFT JOIN ehs_training_completions tc  ON tc.induction_completion_id = ic.id`
    );

    if (!visitors.length) return res.json({ summary, visitors: [] });

    const ids = visitors.map(v => v.id);
    const placeholders = ids.map(() => "?").join(",");

    const completions = await query(
  `SELECT
     ic.visitor_id, ic.score, ic.passed, ic.completed_at, ic.location_code,
     m.training_name, m.category,
     tc.verification_status, tc.valid_till
   FROM ehs_induction_completions ic
   LEFT JOIN ehs_training_modules     m  ON m.id = ic.training_id
   LEFT JOIN ehs_training_completions tc ON tc.induction_completion_id = ic.id
   WHERE ic.visitor_id IN (${placeholders})
   ORDER BY ic.completed_at DESC`,
  ids
);

    const byVisitor = {};
    for (const c of completions) (byVisitor[c.visitor_id] ||= []).push(c);

    const results = visitors.map(v => ({ ...v, completions: byVisitor[v.id] || [] }));

    return res.json({ summary, visitors: results });
  } catch (err) {
    console.error("[EHS] kiosk/visitor-lookup error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


// ============================================================
// POST /ehs/consent/withdraw
// Self-service — visitor withdraws DPDP consent, which deactivates
// their account and anonymizes PII. Training completion records
// stay (with PII scrubbed) for compliance/audit purposes — this is
// NOT a hard delete.
// Header: x-ehs-token
// Body: { visitor_id }
// ============================================================
router.post("/consent/withdraw", async (req, res) => {
  const { visitor_id } = req.body;
  const token = req.headers["x-ehs-token"];

  if (!visitor_id || !token) {
    return res.status(400).json({ error: "visitor_id and session token are required" });
  }

  try {
    // Validate the session belongs to this visitor
    const sessions = await query(
      `SELECT * FROM ehs_sessions WHERE visitor_id = ? AND token = ? AND expires_at > NOW()`,
      [visitor_id, token]
    );
    if (!sessions.length) return res.status(401).json({ error: "Unauthorized" });

    const [visitor] = await query(
      `SELECT photo_path FROM ehs_kiosk_visitors WHERE id = ?`,
      [visitor_id]
    );
    if (!visitor) return res.status(404).json({ error: "Visitor not found" });

    // Anonymize PII, deactivate account, revoke login (pin cleared)
    await query(
      `UPDATE ehs_kiosk_visitors
       SET full_name = 'Withdrawn User',
           contact_number = NULL,
           employee_id = NULL,
           date_of_birth = NULL,
           photo_path = NULL,
           pin = NULL,
           status = 'Inactive'
       WHERE id = ?`,
      [visitor_id]
    );

    // Delete the photo file from disk if one existed
    if (visitor.photo_path) {
      const filePath = path.join(__dirname, "../..", visitor.photo_path);
      fs.unlink(filePath, (err) => {
        if (err) console.warn("[EHS] consent/withdraw: photo delete failed:", err.message);
      });
    }

    // Kill all active sessions immediately
    await query(`DELETE FROM ehs_sessions WHERE visitor_id = ?`, [visitor_id]);

    // Record the withdrawal for compliance
    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'kiosk', 'EHS_CONSENT_WITHDRAWN', ?)`,
      [visitor_id, JSON.stringify({ visitor_id })]
    ).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] consent/withdraw error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


// ============================================================
// GET /ehs/admin/reports
// Super admin only — full cross-location training register.
// Combines visitor + corporate completions + verification status.
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&location_code=X&type=Employee|Visitor|...
//        &status=Pending|Verified|Rejected&search=<name/mobile/empid>&limit=&offset=
// ============================================================
router.get("/admin/reports", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { from, to, location_code, type, status, search, limit, offset } = req.query;

  try {
    let where = "WHERE 1=1";
    const params = [];

    if (location_code) { where += " AND ic.location_code = ?"; params.push(location_code); }
    if (type)           { where += " AND v.visitor_type = ?";  params.push(type); }
    if (status)         { where += " AND tc.verification_status = ?"; params.push(status); }
    if (from)            { where += " AND DATE(ic.completed_at) >= ?"; params.push(from); }
    if (to)               { where += " AND DATE(ic.completed_at) <= ?"; params.push(to); }
    if (search) {
      where += " AND (v.full_name LIKE ? OR v.contact_number LIKE ? OR v.employee_id LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const lim = Math.min(Number(limit) || 1000, 5000);
    const off = Number(offset) || 0;

    const rows = await query(
          `SELECT
            ic.id AS completion_id, v.full_name, v.visitor_type, v.employee_id, v.contact_number,
            ic.location_code, l.location_name, m.training_name, m.category,
            lang.language_name,
            ic.score, ic.passed, ic.completed_at,
            tc.verification_status, hv.verified_by_hr, hv.verified_at
          FROM ehs_induction_completions ic
          LEFT JOIN ehs_kiosk_visitors       v    ON v.id = ic.visitor_id
          LEFT JOIN ehs_training_modules     m    ON m.id = ic.training_id
          LEFT JOIN ehs_location_hr          l    ON l.location_code = ic.location_code
          LEFT JOIN ehs_languages            lang ON lang.id = ic.language_id
          LEFT JOIN ehs_training_completions tc   ON tc.induction_completion_id = ic.id
          LEFT JOIN ehs_hr_verifications     hv   ON hv.completion_id = tc.id
          ${where}
          ORDER BY ic.completed_at DESC LIMIT ? OFFSET ?`,
          [...params, lim, off]
        );

    const [summary] = await query(
      `SELECT
         COUNT(ic.id)                            AS total,
         SUM(ic.passed = 1)                       AS passed,
         SUM(ic.passed = 0)                       AS failed,
         SUM(tc.verification_status = 'Verified') AS verified,
         SUM(tc.verification_status = 'Pending')  AS pending,
         SUM(tc.verification_status = 'Rejected') AS rejected
       FROM ehs_induction_completions ic
       LEFT JOIN ehs_kiosk_visitors       v  ON v.id = ic.visitor_id
       LEFT JOIN ehs_training_completions tc ON tc.induction_completion_id = ic.id
       ${where}`,
      params
    );

    return res.json({ rows, summary, count: rows.length });
  } catch (err) {
    console.error("[EHS] admin/reports error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// GET /ehs/admin/reports/export
// Same filters as above — streams an .xlsx file, super admin only.
// Requires: npm install exceljs
// ============================================================
router.get("/admin/reports/export", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const ExcelJS = require("exceljs");
  const { from, to, location_code, type, status, search } = req.query;

  try {
    let where = "WHERE 1=1";
    const params = [];
    if (location_code) { where += " AND ic.location_code = ?"; params.push(location_code); }
    if (type)           { where += " AND v.visitor_type = ?";  params.push(type); }
    if (status)         { where += " AND tc.verification_status = ?"; params.push(status); }
    if (from)            { where += " AND DATE(ic.completed_at) >= ?"; params.push(from); }
    if (to)               { where += " AND DATE(ic.completed_at) <= ?"; params.push(to); }
    if (search) {
      where += " AND (v.full_name LIKE ? OR v.contact_number LIKE ? OR v.employee_id LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const rows = await query(
      `SELECT
         ic.id AS completion_id, v.full_name, v.visitor_type, v.employee_id, v.contact_number,
         l.location_name, m.training_name, ic.score, ic.passed, ic.completed_at,
         tc.valid_till, tc.verification_status, hv.verified_by_hr
       FROM ehs_induction_completions ic
       LEFT JOIN ehs_kiosk_visitors       v  ON v.id = ic.visitor_id
       LEFT JOIN ehs_training_modules     m  ON m.id = ic.training_id
       LEFT JOIN ehs_location_hr          l  ON l.location_code = ic.location_code
       LEFT JOIN ehs_training_completions tc ON tc.induction_completion_id = ic.id
       LEFT JOIN ehs_hr_verifications     hv ON hv.completion_id = tc.id
       ${where}
       ORDER BY ic.completed_at DESC
       LIMIT 5000`,
      params
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Training Register");

    ws.mergeCells("A1:M1");
    ws.getCell("A1").value = "EHS Training Register — Nippon Express India";
    ws.getCell("A1").font = { bold: true, size: 14 };

    const headers = ["Training ID", "Name", "Worker Type", "Employee ID", "Contact Number",
      "Location", "Training Module", "Date", "Score (%)", "Result", "Valid Till",
      "Verification Status", "Verified By"];
    ws.getRow(3).values = headers;
    ws.getRow(3).font = { bold: true };
    ws.getRow(3).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A005D" } }; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; });

    rows.forEach((r, i) => {
      ws.getRow(4 + i).values = [
        `TRN${String(r.completion_id).padStart(6, "0")}`,
        r.full_name || "—",
        r.visitor_type || "—",
        r.employee_id || "—",
        r.contact_number || "—",
        r.location_name || r.location_code || "—",
        r.training_name || "—",
        r.completed_at ? new Date(r.completed_at) : null,
        r.score ?? "—",
        r.passed ? "Pass" : "Fail",
        r.valid_till ? new Date(r.valid_till) : "—",
        r.verification_status || "—",
        r.verified_by_hr || "—",
      ];
    });

    ws.columns.forEach(col => { col.width = 18; });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=EHS_Training_Register_${Date.now()}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[EHS] admin/reports/export error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ── Multer setup for training videos ──────────────────────
const videoUploadDir = path.join(__dirname, "../../uploads/videos");
if (!fs.existsSync(videoUploadDir)) fs.mkdirSync(videoUploadDir, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videoUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `training_${Date.now()}${ext}`);
  },
});
const uploadVideo = multer({
  storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only video files are allowed"));
  },
});

// ============================================================
// GET /ehs/languages — active languages, used by admin UI
// ============================================================
router.get("/languages", async (req, res) => {
  try {
    const rows = await query(`SELECT id, language_name FROM ehs_languages WHERE status = 'Active' ORDER BY id`);
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] languages GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// ADMIN — Training Modules (super admin only)
// ============================================================
router.get("/admin/training-modules", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, training_name, category, applicable_to, video_path,
              pass_percentage, num_questions, validity_days, status, created_at
       FROM ehs_training_modules
       ORDER BY training_name`
    );
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] admin/training-modules GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.post("/admin/training-modules", requireAdminAuth, requireSuperAdmin, (req, res, next) => {
  uploadVideo.single("video")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(413).json({ error: "Video file is too large (max 500MB)." });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { training_name, category, applicable_to, pass_percentage, num_questions, validity_days } = req.body;
  if (!training_name || !category || !applicable_to)
    return res.status(400).json({ error: "training_name, category and applicable_to are required" });

  const video_path = req.file ? path.join("uploads/videos", req.file.filename).replace(/\\/g, "/") : null;

  try {
    const result = await query(
      `INSERT INTO ehs_training_modules
       (training_name, category, applicable_to, video_path, pass_percentage, num_questions, validity_days, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [training_name.trim(), category.trim(), applicable_to, video_path,
       Number(pass_percentage) || 80, Number(num_questions) || 10, Number(validity_days) || 365]
    );

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'admin', 'EHS_TRAINING_MODULE_CREATED', ?)`,
      [req.admin.id, JSON.stringify({ training_name })]
    ).catch(() => {});

    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("[EHS] admin/training-modules POST error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.patch("/admin/training-modules/:id", requireAdminAuth, requireSuperAdmin, uploadVideo.single("video"), async (req, res) => {
  const { training_name, category, applicable_to, pass_percentage, num_questions, validity_days, status } = req.body;
  const fields = [];
  const params = [];

  if (training_name   !== undefined) { fields.push("training_name = ?");  params.push(training_name.trim()); }
  if (category        !== undefined) { fields.push("category = ?");       params.push(category.trim()); }
  if (applicable_to   !== undefined) { fields.push("applicable_to = ?");   params.push(applicable_to); }
  if (pass_percentage !== undefined) { fields.push("pass_percentage = ?"); params.push(Number(pass_percentage)); }
  if (num_questions   !== undefined) { fields.push("num_questions = ?");   params.push(Number(num_questions)); }
  if (validity_days   !== undefined) { fields.push("validity_days = ?");   params.push(Number(validity_days)); }
  if (status          !== undefined) { fields.push("status = ?");         params.push(status); }
  if (req.file) {
    fields.push("video_path = ?");
    params.push(path.join("uploads/videos", req.file.filename).replace(/\\/g, "/"));
  }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

  try {
    params.push(req.params.id);
    const result = await query(`UPDATE ehs_training_modules SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: "Training module not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/training-modules PATCH error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// ADMIN — Quiz Questions (super admin only)
// ============================================================
router.get("/admin/questions", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { training_id } = req.query;
  if (!training_id) return res.status(400).json({ error: "training_id is required" });
  try {
    const rows = await query(
      `SELECT q.id, q.training_id, q.language_id, l.language_name, q.question,
              q.option_a, q.option_b, q.option_c, q.option_d, q.correct_ans, q.status
       FROM ehs_questions q
       LEFT JOIN ehs_languages l ON l.id = q.language_id
       WHERE q.training_id = ?
       ORDER BY q.id`,
      [training_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] admin/questions GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.post("/admin/questions", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { training_id, language_id, question, option_a, option_b, option_c, option_d, correct_ans } = req.body;
  if (!training_id || !question || !option_a || !option_b || !option_c || !option_d || !correct_ans)
    return res.status(400).json({ error: "training_id, question, all 4 options and correct_ans are required" });
  if (!["A", "B", "C", "D"].includes(correct_ans))
    return res.status(400).json({ error: "correct_ans must be A, B, C or D" });

  try {
    const result = await query(
      `INSERT INTO ehs_questions
       (training_id, language_id, question, option_a, option_b, option_c, option_d, correct_ans, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [training_id, language_id || null, question.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), correct_ans]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("[EHS] admin/questions POST error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.patch("/admin/questions/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { language_id, question, option_a, option_b, option_c, option_d, correct_ans, status } = req.body;
  const fields = [];
  const params = [];

  if (language_id !== undefined) { fields.push("language_id = ?"); params.push(language_id || null); }
  if (question    !== undefined) { fields.push("question = ?");    params.push(question.trim()); }
  if (option_a    !== undefined) { fields.push("option_a = ?");    params.push(option_a.trim()); }
  if (option_b    !== undefined) { fields.push("option_b = ?");    params.push(option_b.trim()); }
  if (option_c    !== undefined) { fields.push("option_c = ?");    params.push(option_c.trim()); }
  if (option_d    !== undefined) { fields.push("option_d = ?");    params.push(option_d.trim()); }
  if (correct_ans !== undefined) {
    if (!["A", "B", "C", "D"].includes(correct_ans))
      return res.status(400).json({ error: "correct_ans must be A, B, C or D" });
    fields.push("correct_ans = ?"); params.push(correct_ans);
  }
  if (status !== undefined) { fields.push("status = ?"); params.push(status); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

  try {
    params.push(req.params.id);
    const result = await query(`UPDATE ehs_questions SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: "Question not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/questions PATCH error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.delete("/admin/questions/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(`DELETE FROM ehs_questions WHERE id = ?`, [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Question not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/questions DELETE error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// ADMIN — Training Videos, per language (super admin only)
// ============================================================
router.get("/admin/training-videos", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  const { training_id } = req.query;
  if (!training_id) return res.status(400).json({ error: "training_id is required" });
  try {
    const rows = await query(
      `SELECT v.id, v.training_id, v.language_id, l.language_name, v.video_path, v.created_at
       FROM ehs_training_videos v
       JOIN ehs_languages l ON l.id = v.language_id
       WHERE v.training_id = ?
       ORDER BY l.id`,
      [training_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("[EHS] admin/training-videos GET error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.post("/admin/training-videos", requireAdminAuth, requireSuperAdmin, uploadVideo.single("video"), async (req, res) => {
  const { training_id, language_id } = req.body;
  if (!training_id || !language_id || !req.file)
    return res.status(400).json({ error: "training_id, language_id and a video file are required" });

  const video_path = path.join("uploads/videos", req.file.filename).replace(/\\/g, "/");

  try {
    const existing = await query(
      `SELECT id, video_path FROM ehs_training_videos WHERE training_id = ? AND language_id = ?`,
      [training_id, language_id]
    );

    if (existing.length) {
      await query(`UPDATE ehs_training_videos SET video_path = ? WHERE id = ?`, [video_path, existing[0].id]);
      if (existing[0].video_path) {
        fs.unlink(path.join(__dirname, "../..", existing[0].video_path), () => {});
      }
    } else {
      await query(
        `INSERT INTO ehs_training_videos (training_id, language_id, video_path) VALUES (?, ?, ?)`,
        [training_id, language_id, video_path]
      );
    }

    return res.status(201).json({ ok: true, video_path });
  } catch (err) {
    console.error("[EHS] admin/training-videos POST error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.delete("/admin/training-videos/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const [row] = await query(`SELECT video_path FROM ehs_training_videos WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Video not found" });
    await query(`DELETE FROM ehs_training_videos WHERE id = ?`, [req.params.id]);
    if (row.video_path) fs.unlink(path.join(__dirname, "../..", row.video_path), () => {});
    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] admin/training-videos DELETE error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// ============================================================
// POST /ehs/kiosk/lookup-auth
// Second-factor gate for Visitor Lookup — same username/password
// as kiosk device activation (ehs_kiosk_devices table). The device
// must already be activated (x-kiosk-token) for this to even run;
// this is an ADDITIONAL check on top of that, so lookup can't be
// opened just because the device happens to be logged in for the day.
// Body: { username, password }
// ============================================================
router.post("/kiosk/lookup-auth", requireKioskSession, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  try {
    const [device] = await query(
      `SELECT id, password_hash, device_name FROM ehs_kiosk_devices
       WHERE username = ? AND active = 1`,
      [username]
    );
    if (!device || !(await bcrypt.compare(password, device.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    await query(
      `INSERT INTO ehs_audit_log (actor_id, actor_type, action, meta)
       VALUES (?, 'kiosk_device', 'EHS_VISITOR_LOOKUP_AUTH', ?)`,
      [device.id, JSON.stringify({ username })]
    ).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    console.error("[EHS] kiosk/lookup-auth error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


    module.exports = router;