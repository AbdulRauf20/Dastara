#!/usr/bin/env node
/**
 * DASTARA — Provision an admin user.
 *
 * Creates (or reuses) a Supabase Auth user and an `admin_profiles` row with the
 * chosen role. Use this to create the FIRST Super Admin. It uses the
 * service-role key, so it must only ever be run in a trusted environment
 * (your own machine or a secure CI secret) — never in the browser.
 *
 * Usage:
 *   node scripts/create-admin.mjs --email you@dastara.pk --password 'StrongPass123!' \
 *        --name "Your Name" --role super_admin
 *
 * Roles: super_admin | admin | editor   (default: super_admin)
 *
 * Required env (from .env.local or the shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { WebSocket } from "ws";

// Node.js < 22 has no global WebSocket, which supabase-js needs to construct its
// (otherwise unused) realtime client. Provide one from the "ws" package.
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

// --- tiny .env.local loader (no extra deps) --------------------------------
function loadEnvFile(file) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

// --- arg parsing -----------------------------------------------------------
function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const email = arg("email");
const password = arg("password");
const fullName = arg("name", "");
const role = arg("role", "super_admin");

const VALID_ROLES = ["super_admin", "admin", "editor"];

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!email || !password) {
  die("Both --email and --password are required.\n\n  Example:\n  node scripts/create-admin.mjs --email you@dastara.pk --password 'StrongPass123!' --name \"Your Name\" --role super_admin");
}
if (!VALID_ROLES.includes(role)) {
  die(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(", ")}`);
}
if (password.length < 10) {
  die("Choose a password of at least 10 characters.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  die("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local.");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket },
});

async function findUserByEmail(targetEmail) {
  // Paginate through auth users to find an existing account.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  console.log(`\nDASTARA · provisioning ${role} for ${email} …`);

  let userId;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr) {
    // User may already exist — reuse it and (optionally) reset the password.
    const existing = await findUserByEmail(email);
    if (!existing) die(`Could not create user: ${createErr.message}`);
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, { password });
    console.log("• Auth user already existed — password updated.");
  } else {
    userId = created.user.id;
    console.log("• Auth user created.");
  }

  const { error: profileErr } = await admin
    .from("admin_profiles")
    .upsert(
      { id: userId, email, full_name: fullName || null, role, is_active: true },
      { onConflict: "id" },
    );
  if (profileErr) die(`Could not write admin_profiles row: ${profileErr.message}`);

  console.log(`\n✓ Done. ${email} is now an active ${role}.`);
  console.log("  Sign in at /admin/login\n");
}

main().catch((e) => die(e.message ?? String(e)));
