/**
 * lib/getSessionKey.js
 * 
 * Usado pelos routes de proxy originais para injetar a master key da sessão
 * em vez de depender do header x-api-key enviado pelo cliente.
 */
import { getSession, getSetting } from './db.js';

export function getApiKeyFromSession(request) {
  const sessionId = request.cookies.get('admin_session')?.value;
  if (!sessionId) return null;

  const session = getSession(sessionId);
  if (!session || !session.active) return null;

  return getSetting('muapi_master_key') || null;
}
