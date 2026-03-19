import { query } from '../db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface DbSession {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

// Session expiry time (7 days)
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Create a new session
export async function createSession(userId: string): Promise<DbSession> {
  const id = crypto.randomUUID()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS)
  
  await query<ResultSetHeader>(
    `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
    [id, userId, token, expiresAt]
  )
  
  const sessions = await query<(DbSession & RowDataPacket)[]>(
    `SELECT * FROM sessions WHERE id = ?`,
    [id]
  )
  
  return sessions[0]
}

// Get session by token
export async function getSessionByToken(token: string): Promise<DbSession | null> {
  const sessions = await query<(DbSession & RowDataPacket)[]>(
    `SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()`,
    [token]
  )
  return sessions[0] || null
}

// Delete session (logout)
export async function deleteSession(token: string): Promise<void> {
  await query<ResultSetHeader>(
    `DELETE FROM sessions WHERE token = ?`,
    [token]
  )
}

// Delete all sessions for a user (logout from all devices)
export async function deleteUserSessions(userId: string): Promise<void> {
  await query<ResultSetHeader>(
    `DELETE FROM sessions WHERE user_id = ?`,
    [userId]
  )
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await query<ResultSetHeader>(
    `DELETE FROM sessions WHERE expires_at < NOW()`
  )
  return result.affectedRows
}

// Refresh session (extend expiry)
export async function refreshSession(token: string): Promise<DbSession | null> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS)
  
  await query<ResultSetHeader>(
    `UPDATE sessions SET expires_at = ? WHERE token = ? AND expires_at > NOW()`,
    [expiresAt, token]
  )
  
  return getSessionByToken(token)
}
