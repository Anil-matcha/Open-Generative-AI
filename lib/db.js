/**
 * lib/db.js
 * SQLite database for the internal admin system.
 * Uses better-sqlite3 — synchronous, zero-config, file-based.
 * DB file lives at ./data/admin.db (auto-created on first run).
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { hashPassword } from './auth.js';
import { initProjectsSchema } from './db-projects.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'admin.db');

let _db = null;

export function getDb() {
  if (_db) return _db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  seedAdmin(_db);

  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user',
      active      INTEGER NOT NULL DEFAULT 1,
      credits     REAL NOT NULL DEFAULT 0,
      credit_limit REAL DEFAULT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      last_login  TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action      TEXT NOT NULL,
      cost        REAL NOT NULL DEFAULT 0,
      endpoint    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_log(created_at);

    -- Add credit_limit column if upgrading from older schema
    ALTER TABLE users ADD COLUMN credit_limit REAL DEFAULT NULL;
  `);
  initProjectsSchema(db);
}

async function seedAdmin(db) {
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existing) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashed = await hashPassword(adminPassword);

  db.prepare(`
    INSERT INTO users (name, email, password, role, active, credits)
    VALUES (?, ?, ?, 'admin', 1, 0)
  `).run('Administrador', adminEmail, hashed);

  const masterKey = process.env.MUAPI_MASTER_KEY || '';
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('muapi_master_key', masterKey);

  console.log(`[Admin] Seeded admin user: ${adminEmail}`);
}

// ─── User queries ────────────────────────────────────────────────────────────

export function getAllUsers() {
  return getDb().prepare(`
    SELECT id, name, email, role, active, credits, credit_limit, created_at, last_login
    FROM users ORDER BY created_at DESC
  `).all();
}

export function getUserById(id) {
  return getDb().prepare(`
    SELECT id, name, email, role, active, credits, credit_limit, created_at, last_login
    FROM users WHERE id = ?
  `).get(id);
}

export function getUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function createUser({ name, email, password, role = 'user', credits = 0, credit_limit = null }) {
  return getDb().prepare(`
    INSERT INTO users (name, email, password, role, credits, credit_limit)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, password, role, credits, credit_limit);
}

export function updateUser(id, fields) {
  const allowed = ['name', 'email', 'active', 'role'];
  const updates = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => `${k} = ?`).join(', ');
  const values = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => fields[k]);

  if (!updates) return;
  getDb().prepare(`UPDATE users SET ${updates} WHERE id = ?`).run(...values, id);
}

export function setUserPassword(id, hashedPassword) {
  getDb().prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);
}

export function adjustCredits(userId, delta) {
  const user = getDb().prepare('SELECT id, credits, credit_limit FROM users WHERE id = ?').get(userId);
  if (!user) return;
  let newCredits = user.credits + delta;
  if (delta > 0 && user.credit_limit != null) {
    newCredits = Math.min(user.credit_limit, newCredits);
  }
  newCredits = Math.max(0, newCredits);
  getDb().prepare('UPDATE users SET credits = ? WHERE id = ?').run(newCredits, userId);
}

export function deductCredits(userId, amount) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.credits < amount) throw new Error('Insufficient credits');
  getDb().prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(amount, userId);
}

export function deleteUser(id) {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ─── Session queries ──────────────────────────────────────────────────────────

export function createSession(id, userId, expiresAt) {
  getDb().prepare(`
    INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)
  `).run(id, userId, expiresAt);
}

export function getSession(id) {
  return getDb().prepare(`
    SELECT s.*, u.id as uid, u.name, u.email, u.role, u.active, u.credits
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(id);
}

export function deleteSession(id) {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function cleanExpiredSessions() {
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

// ─── Usage log ────────────────────────────────────────────────────────────────

export function logUsage(userId, action, cost, endpoint) {
  getDb().prepare(`
    INSERT INTO usage_log (user_id, action, cost, endpoint) VALUES (?, ?, ?, ?)
  `).run(userId, action, cost, endpoint || null);
}

export function getUserUsage(userId, limit = 50) {
  return getDb().prepare(`
    SELECT * FROM usage_log WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(userId, limit);
}

export function getGlobalStats() {
  const db = getDb();
  return {
    totalUsers: db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'user'").get().n,
    activeUsers: db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'user' AND active = 1").get().n,
    totalCredits: db.prepare("SELECT COALESCE(SUM(credits),0) as n FROM users WHERE role = 'user'").get().n,
    totalUsageToday: db.prepare(
      "SELECT COALESCE(SUM(cost),0) as n FROM usage_log WHERE date(created_at) = date('now')"
    ).get().n,
  };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSetting(key) {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row?.value;
}

export function setSetting(key, value) {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}