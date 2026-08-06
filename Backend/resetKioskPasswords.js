// resetKioskPasswords.js
//
// Generates bcrypt hashes for kiosk device passwords and prints
// ready-to-run SQL UPDATE statements for `ehs_kiosk_devices`.
//
// Usage:
//   1. Edit the DEVICES list below with the username + the NEW
//      plaintext password you want for each kiosk.
//   2. Run:  node resetKioskPasswords.js
//   3. Copy the printed SQL into phpMyAdmin (or run via a MySQL client)
//      against hrmdb.ehs_kiosk_devices
//   4. Save the plaintext passwords somewhere safe (password manager /
//      handover doc). This script will NOT save them anywhere for you.

const bcrypt = require("bcryptjs");

// ── Edit this list ──────────────────────────────────────────
const DEVICES = [
  { username: "kiosk_mum1", password: "Kiosktest2026" },
  { username: "kiosk_mum2", password: "Kiosktest2026" },
  { username: "kiosk_pun1", password: "Kiosktest2026" },
  { username: "kiosk_del1", password: "Kiosktest2026" },
];
// ─────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10; // matches bcrypt.compare() default cost used in ehsRoutes.js

async function main() {
  console.log("-- ============================================");
  console.log("-- EHS Kiosk device password reset");
  console.log("-- Generated:", new Date().toISOString());
  console.log("-- Run these against hrmdb.ehs_kiosk_devices");
  console.log("-- ============================================\n");

  const summary = [];

  for (const { username, password } of DEVICES) {
    if (!password || password.startsWith("CHANGE_ME")) {
      console.log(`-- ⚠️  Skipped ${username}: please set a real password in DEVICES[] first\n`);
      continue;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log(
      `UPDATE ehs_kiosk_devices SET password_hash = '${hash}' WHERE username = '${username}';`
    );

    summary.push({ username, password });
  }

  if (summary.length) {
    console.log("\n-- ============================================");
    console.log("-- PLAINTEXT PASSWORDS (save these somewhere safe, then delete this output)");
    console.log("-- ============================================");
    summary.forEach(({ username, password }) => {
      console.log(`-- ${username.padEnd(12)} : ${password}`);
    });
  }
}

main().catch(err => {
  console.error("Error generating password hashes:", err);
  process.exit(1);
}); 