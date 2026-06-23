/**
 * PATCH para lib/db.js
 *
 * Adicione estas 2 linhas no arquivo lib/db.js existente:
 *
 * 1. No topo do arquivo, após os outros imports:
 *    import { initProjectsSchema } from './db-projects.js';
 *
 * 2. Dentro da função initSchema(db), no final, antes do fechamento }:
 *    initProjectsSchema(db);
 *
 * Exemplo de como fica o início de lib/db.js:
 * ─────────────────────────────────────────────
 * import Database from 'better-sqlite3';
 * import path from 'path';
 * import fs from 'fs';
 * import { hashPassword } from './auth.js';
 * import { initProjectsSchema } from './db-projects.js';  ← ADICIONAR
 *
 * ...
 *
 * function initSchema(db) {
 *   db.exec(`...tabelas existentes...`);
 *   initProjectsSchema(db);  ← ADICIONAR NO FINAL
 * }
 * ─────────────────────────────────────────────
 *
 * Isso é tudo. O banco cria as tabelas novas automaticamente na próxima vez que rodar.
 */
