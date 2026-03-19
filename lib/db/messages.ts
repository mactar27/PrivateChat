import { query } from '../db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface DbMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video'
  status: 'sent' | 'delivered' | 'read'
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CreateMessageInput {
  conversation_id: string
  sender_id: string
  content: string
  message_type?: 'text' | 'image' | 'file' | 'audio' | 'video'
}

// Create a new message
export async function createMessage(input: CreateMessageInput): Promise<DbMessage> {
  const id = crypto.randomUUID()
  
  await query<ResultSetHeader>(
    `INSERT INTO messages (id, conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?, ?)`,
    [id, input.conversation_id, input.sender_id, input.content, input.message_type || 'text']
  )
  
  // Update conversation's updated_at timestamp
  await query<ResultSetHeader>(
    `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [input.conversation_id]
  )
  
  const messages = await query<(DbMessage & RowDataPacket)[]>(
    `SELECT * FROM messages WHERE id = ?`,
    [id]
  )
  
  return messages[0]
}

// Get message by ID
export async function getMessageById(id: string): Promise<DbMessage | null> {
  const messages = await query<(DbMessage & RowDataPacket)[]>(
    `SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL`,
    [id]
  )
  return messages[0] || null
}

// Get messages for a conversation (with pagination)
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: Date
): Promise<DbMessage[]> {
  if (before) {
    return query<(DbMessage & RowDataPacket)[]>(
      `SELECT * FROM messages 
       WHERE conversation_id = ? AND deleted_at IS NULL AND created_at < ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [conversationId, before, limit]
    )
  }
  
  return query<(DbMessage & RowDataPacket)[]>(
    `SELECT * FROM messages 
     WHERE conversation_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    [conversationId, limit]
  )
}

// Get the latest message for a conversation
export async function getLatestMessage(conversationId: string): Promise<DbMessage | null> {
  const messages = await query<(DbMessage & RowDataPacket)[]>(
    `SELECT * FROM messages 
     WHERE conversation_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [conversationId]
  )
  return messages[0] || null
}

// Update message status
export async function updateMessageStatus(
  messageId: string,
  status: 'sent' | 'delivered' | 'read'
): Promise<void> {
  await query<ResultSetHeader>(
    `UPDATE messages SET status = ? WHERE id = ?`,
    [status, messageId]
  )
}

// Mark all messages as delivered for a user in a conversation
export async function markMessagesAsDelivered(
  conversationId: string,
  recipientId: string
): Promise<void> {
  await query<ResultSetHeader>(
    `UPDATE messages 
     SET status = 'delivered' 
     WHERE conversation_id = ? AND sender_id != ? AND status = 'sent'`,
    [conversationId, recipientId]
  )
}

// Mark all messages as read for a user in a conversation
export async function markMessagesAsRead(
  conversationId: string,
  readerId: string
): Promise<void> {
  await query<ResultSetHeader>(
    `UPDATE messages 
     SET status = 'read' 
     WHERE conversation_id = ? AND sender_id != ? AND status IN ('sent', 'delivered')`,
    [conversationId, readerId]
  )
}

// Soft delete a message
export async function deleteMessage(messageId: string): Promise<void> {
  await query<ResultSetHeader>(
    `UPDATE messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [messageId]
  )
}

// Get unread message count for a user in a conversation
export async function getUnreadCount(
  conversationId: string,
  userId: string
): Promise<number> {
  const result = await query<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) as count FROM messages 
     WHERE conversation_id = ? AND sender_id != ? AND status != 'read' AND deleted_at IS NULL`,
    [conversationId, userId]
  )
  return result[0].count
}

// Search messages in a conversation
export async function searchMessages(
  conversationId: string,
  searchTerm: string,
  limit = 50
): Promise<DbMessage[]> {
  return query<(DbMessage & RowDataPacket)[]>(
    `SELECT * FROM messages 
     WHERE conversation_id = ? AND content LIKE ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    [conversationId, `%${searchTerm}%`, limit]
  )
}
