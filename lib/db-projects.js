/**
 * lib/db-projects.js
 *
 * Adiciona ao banco existente (admin.db) as tabelas de projetos.
 * Chame initProjectsSchema(db) logo após o initSchema existente em lib/db.js.
 *
 * INSTALAÇÃO: importe e chame initProjectsSchema no final de initSchema() em lib/db.js:
 *   import { initProjectsSchema } from './db-projects.js';
 *   // dentro de initSchema(db):
 *   initProjectsSchema(db);
 */

import { getDb } from './db.js';

export function initProjectsSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color       TEXT NOT NULL DEFAULT '#7F77DD',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT NOT NULL DEFAULT 'viewer',
      invited_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS generations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      type         TEXT NOT NULL DEFAULT 'image',
      prompt       TEXT NOT NULL DEFAULT '',
      model        TEXT NOT NULL DEFAULT '',
      output_url   TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      params       TEXT NOT NULL DEFAULT '{}',
      credits_used REAL NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'completed',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner   ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_members_project  ON project_members(project_id);
    CREATE INDEX IF NOT EXISTS idx_members_user     ON project_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_gens_user        ON generations(user_id);
    CREATE INDEX IF NOT EXISTS idx_gens_project     ON generations(project_id);
    CREATE INDEX IF NOT EXISTS idx_gens_date        ON generations(created_at);
  `);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjectsForUser(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM generations g WHERE g.project_id = p.id) as gen_count,
      (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) + 1 as member_count,
      u.name as owner_name,
      CASE WHEN p.owner_id = ? THEN 'owner'
           ELSE (SELECT pm2.role FROM project_members pm2 WHERE pm2.project_id = p.id AND pm2.user_id = ?)
      END as my_role
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.owner_id = ?
       OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?)
    ORDER BY p.updated_at DESC
  `).all(userId, userId, userId, userId);
}

// Returns Map<projectId, { total, byType: { type: n } }> for the given user.
// Includes only projects the user owns or is a member of.
export function getProjectsCostForUser(userId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT g.project_id as projectId, g.type as type, COALESCE(SUM(g.credits_used), 0) as total
    FROM generations g
    WHERE g.project_id IS NOT NULL
      AND (g.user_id = ?
           OR EXISTS (SELECT 1 FROM project_members pm
                      WHERE pm.project_id = g.project_id AND pm.user_id = ?))
    GROUP BY g.project_id, g.type
  `).all(userId, userId);

  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.projectId)) map.set(row.projectId, { total: 0, byType: {} });
    const entry = map.get(row.projectId);
    entry.total += row.total;
    entry.byType[row.type] = (entry.byType[row.type] || 0) + row.total;
  }
  return map;
}

export function getProjectById(id, userId) {
  const db = getDb();
  return db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM generations g WHERE g.project_id = p.id) as gen_count,
      u.name as owner_name,
      CASE WHEN p.owner_id = ? THEN 'owner'
           ELSE (SELECT pm.role FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?)
      END as my_role
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
      AND (p.owner_id = ? OR EXISTS (
        SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?
      ))
  `).get(userId, userId, id, userId, userId);
}

export function createProject({ ownerId, name, description = '', color = '#7F77DD' }) {
  return getDb().prepare(`
    INSERT INTO projects (owner_id, name, description, color)
    VALUES (?, ?, ?, ?)
  `).run(ownerId, name, description, color);
}

export function updateProject(id, ownerId, fields) {
  const allowed = ['name', 'description', 'color'];
  const updates = Object.keys(fields)
    .filter(k => allowed.includes(k) && fields[k] !== undefined)
    .map(k => `${k} = ?`);
  updates.push("updated_at = datetime('now')");
  const values = Object.keys(fields)
    .filter(k => allowed.includes(k) && fields[k] !== undefined)
    .map(k => fields[k]);
  getDb().prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`)
    .run(...values, id, ownerId);
}

export function deleteProject(id, ownerId) {
  return getDb().prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?').run(id, ownerId);
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function getProjectMembers(projectId) {
  return getDb().prepare(`
    SELECT pm.*, u.name, u.email
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.invited_at ASC
  `).all(projectId);
}

export function addProjectMember(projectId, userId, role = 'viewer') {
  return getDb().prepare(`
    INSERT OR REPLACE INTO project_members (project_id, user_id, role)
    VALUES (?, ?, ?)
  `).run(projectId, userId, role);
}

export function removeProjectMember(projectId, userId) {
  return getDb().prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
}

export function updateMemberRole(projectId, userId, role) {
  return getDb().prepare('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?').run(role, projectId, userId);
}

// ─── Generations ──────────────────────────────────────────────────────────────

export function saveGeneration({ userId, projectId, type, prompt, model, outputUrl, thumbnailUrl, params, creditsUsed }) {
  return getDb().prepare(`
    INSERT INTO generations (user_id, project_id, type, prompt, model, output_url, thumbnail_url, params, credits_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    projectId || null,
    type || 'image',
    prompt || '',
    model || '',
    outputUrl || '',
    thumbnailUrl || outputUrl || '',
    JSON.stringify(params || {}),
    creditsUsed || 0
  );
}

export function getGenerations({ userId, projectId, type, limit = 50, offset = 0 }) {
  const db = getDb();
  let where = [];
  let args = [];

  if (projectId === 'none') {
    where.push('g.project_id IS NULL AND g.user_id = ?');
    args.push(userId);
  } else if (projectId) {
    where.push(`g.project_id = ? AND (
      g.user_id = ? OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = g.project_id AND pm.user_id = ?) OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = g.project_id AND p.owner_id = ?)
    )`);
    args.push(projectId, userId, userId, userId);
  } else {
    where.push('g.user_id = ?');
    args.push(userId);
  }

  if (type && type !== 'all') {
    where.push('g.type = ?');
    args.push(type);
  }

  return db.prepare(`
    SELECT g.*, u.name as user_name
    FROM generations g
    JOIN users u ON g.user_id = u.id
    WHERE ${where.join(' AND ')}
    ORDER BY g.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, limit, offset);
}

export function getGenerationById(id, userId) {
  return getDb().prepare(`
    SELECT g.*, u.name as user_name FROM generations g
    JOIN users u ON g.user_id = u.id
    WHERE g.id = ? AND (
      g.user_id = ? OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = g.project_id AND pm.user_id = ?) OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = g.project_id AND p.owner_id = ?)
    )
  `).get(id, userId, userId, userId);
}

export function moveGeneration(genId, userId, projectId) {
  return getDb().prepare(`
    UPDATE generations SET project_id = ? WHERE id = ? AND user_id = ?
  `).run(projectId || null, genId, userId);
}

export function deleteGeneration(genId, userId) {
  return getDb().prepare('DELETE FROM generations WHERE id = ? AND user_id = ?').run(genId, userId);
}

export function getProjectStats(projectId) {
  const db = getDb();
  return {
    total: db.prepare('SELECT COUNT(*) as n FROM generations WHERE project_id = ?').get(projectId)?.n || 0,
    byType: db.prepare(`
      SELECT type, COUNT(*) as n FROM generations WHERE project_id = ? GROUP BY type
    `).all(projectId),
    creditsUsed: db.prepare('SELECT COALESCE(SUM(credits_used),0) as n FROM generations WHERE project_id = ?').get(projectId)?.n || 0,
  };
}
