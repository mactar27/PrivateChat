import { query, withTransaction } from '../db'
import bcrypt from 'bcryptjs'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface DbUser {
  id: string
  username: string
  email: string
  password_hash: string
  avatar: string | null
  status: 'online' | 'offline' | 'away'
  last_seen: Date | null
  created_at: Date
  updated_at: Date
}

export interface CreateUserInput {
  username: string
  email: string
  password: string
  avatar?: string
}

export interface UpdateUserInput {
  username?: string
  email?: string
  avatar?: string
  status?: 'online' | 'offline' | 'away'
}

// Create a new user
export async function createUser(input: CreateUserInput): Promise<DbUser> {
  const passwordHash = await bcrypt.hash(input.password, 12)
  
  const id = crypto.randomUUID()
  await query<ResultSetHeader>(
    `INSERT INTO users (id, username, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)`,
    [id, input.username, input.email, passwordHash, input.avatar || null]
  )
  
  const users = await query<(DbUser & RowDataPacket)[]>(
    `SELECT * FROM users WHERE id = ?`,
    [id]
  )
  
  return users[0]
}

// Get user by ID
export async function getUserById(id: string): Promise<DbUser | null> {
  const users = await query<(DbUser & RowDataPacket)[]>(
    `SELECT * FROM users WHERE id = ?`,
    [id]
  )
  return users[0] || null
}

// Get user by email
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const users = await query<(DbUser & RowDataPacket)[]>(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  )
  return users[0] || null
}

// Get user by username
export async function getUserByUsername(username: string): Promise<DbUser | null> {
  const users = await query<(DbUser & RowDataPacket)[]>(
    `SELECT * FROM users WHERE username = ?`,
    [username]
  )
  return users[0] || null
}

// Verify user password
export async function verifyPassword(user: DbUser, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash)
}

// Update user
export async function updateUser(id: string, input: UpdateUserInput): Promise<DbUser | null> {
  const updates: string[] = []
  const values: (string | null)[] = []
  
  if (input.username !== undefined) {
    updates.push('username = ?')
    values.push(input.username)
  }
  if (input.email !== undefined) {
    updates.push('email = ?')
    values.push(input.email)
  }
  if (input.avatar !== undefined) {
    updates.push('avatar = ?')
    values.push(input.avatar)
  }
  if (input.status !== undefined) {
    updates.push('status = ?')
    values.push(input.status)
  }
  
  if (updates.length === 0) return getUserById(id)
  
  values.push(id)
  await query<ResultSetHeader>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  )
  
  return getUserById(id)
}

// Update user status
export async function updateUserStatus(id: string, status: 'online' | 'offline' | 'away'): Promise<void> {
  await query<ResultSetHeader>(
    `UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, id]
  )
}

// Search users by username
export async function searchUsers(searchTerm: string, limit = 20): Promise<DbUser[]> {
  return query<(DbUser & RowDataPacket)[]>(
    `SELECT * FROM users WHERE username LIKE ? LIMIT ?`,
    [`%${searchTerm}%`, limit]
  )
}

// Get multiple users by IDs
export async function getUsersByIds(ids: string[]): Promise<DbUser[]> {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(', ')
  return query<(DbUser & RowDataPacket)[]>(
    `SELECT * FROM users WHERE id IN (${placeholders})`,
    ids
  )
}
