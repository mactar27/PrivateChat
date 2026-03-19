import { query, withTransaction } from '../db'
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise'

export interface DbConversation {
  id: string
  is_group: boolean
  group_name: string | null
  group_avatar: string | null
  created_at: Date
  updated_at: Date
}

export interface DbConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: Date
  last_read_at: Date | null
  is_admin: boolean
}

export interface ConversationWithParticipants extends DbConversation {
  participants: DbConversationParticipant[]
}

// Create a new conversation
export async function createConversation(
  participantIds: string[],
  isGroup = false,
  groupName?: string,
  groupAvatar?: string
): Promise<DbConversation> {
  return withTransaction(async (connection) => {
    const conversationId = crypto.randomUUID()
    
    await connection.execute(
      `INSERT INTO conversations (id, is_group, group_name, group_avatar) VALUES (?, ?, ?, ?)`,
      [conversationId, isGroup, groupName || null, groupAvatar || null]
    )
    
    // Add participants
    for (let i = 0; i < participantIds.length; i++) {
      const participantId = participantIds[i]
      const isAdmin = i === 0 // First participant is admin
      await connection.execute(
        `INSERT INTO conversation_participants (id, conversation_id, user_id, is_admin) VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), conversationId, participantId, isAdmin]
      )
    }
    
    const [conversations] = await connection.execute<(DbConversation & RowDataPacket)[]>(
      `SELECT * FROM conversations WHERE id = ?`,
      [conversationId]
    )
    
    return conversations[0]
  })
}

// Get conversation by ID
export async function getConversationById(id: string): Promise<DbConversation | null> {
  const conversations = await query<(DbConversation & RowDataPacket)[]>(
    `SELECT * FROM conversations WHERE id = ?`,
    [id]
  )
  return conversations[0] || null
}

// Get conversations for a user
export async function getUserConversations(userId: string): Promise<DbConversation[]> {
  return query<(DbConversation & RowDataPacket)[]>(
    `SELECT c.* FROM conversations c
     INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
     WHERE cp.user_id = ?
     ORDER BY c.updated_at DESC`,
    [userId]
  )
}

// Get conversation participants
export async function getConversationParticipants(conversationId: string): Promise<DbConversationParticipant[]> {
  return query<(DbConversationParticipant & RowDataPacket)[]>(
    `SELECT * FROM conversation_participants WHERE conversation_id = ?`,
    [conversationId]
  )
}

// Check if user is participant of conversation
export async function isUserInConversation(userId: string, conversationId: string): Promise<boolean> {
  const result = await query<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) as count FROM conversation_participants WHERE user_id = ? AND conversation_id = ?`,
    [userId, conversationId]
  )
  return result[0].count > 0
}

// Find existing direct conversation between two users
export async function findDirectConversation(userId1: string, userId2: string): Promise<DbConversation | null> {
  const conversations = await query<(DbConversation & RowDataPacket)[]>(
    `SELECT c.* FROM conversations c
     INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
     INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
     WHERE c.is_group = FALSE
     AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2`,
    [userId1, userId2]
  )
  return conversations[0] || null
}

// Update last read timestamp for a user in a conversation
export async function updateLastRead(userId: string, conversationId: string): Promise<void> {
  await query<ResultSetHeader>(
    `UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP 
     WHERE user_id = ? AND conversation_id = ?`,
    [userId, conversationId]
  )
}

// Add participant to conversation
export async function addParticipant(conversationId: string, userId: string, isAdmin = false): Promise<void> {
  await query<ResultSetHeader>(
    `INSERT INTO conversation_participants (id, conversation_id, user_id, is_admin) VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), conversationId, userId, isAdmin]
  )
  
  await query<ResultSetHeader>(
    `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [conversationId]
  )
}

// Remove participant from conversation
export async function removeParticipant(conversationId: string, userId: string): Promise<void> {
  await query<ResultSetHeader>(
    `DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, userId]
  )
}

// Update conversation (for groups)
export async function updateConversation(
  id: string, 
  updates: { group_name?: string; group_avatar?: string }
): Promise<DbConversation | null> {
  const updateFields: string[] = []
  const values: (string | null)[] = []
  
  if (updates.group_name !== undefined) {
    updateFields.push('group_name = ?')
    values.push(updates.group_name)
  }
  if (updates.group_avatar !== undefined) {
    updateFields.push('group_avatar = ?')
    values.push(updates.group_avatar)
  }
  
  if (updateFields.length === 0) return getConversationById(id)
  
  values.push(id)
  await query<ResultSetHeader>(
    `UPDATE conversations SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  )
  
  return getConversationById(id)
}
